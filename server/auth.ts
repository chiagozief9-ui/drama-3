import type { Request, Response } from 'express';
import {
  getFirebaseAdmin,
  isFirebaseConfigured,
  getMissingFirebaseKeys,
  getWebApiKey,
} from './firebase.js';
import {
  setSessionCookie,
  clearSessionCookie,
  getSessionFromRequest,
} from './session.js';

export async function handleSignup(req: Request, res: Response) {
  try {
    const { fullName, email, password, confirmPassword } = req.body;

    // Validation
    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ error: 'Full name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email address is required.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Password is required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    // Check Firebase configuration
    if (!isFirebaseConfigured()) {
      const missing = getMissingFirebaseKeys();
      return res.status(503).json({
        error: `Firebase Admin credentials are not yet configured on the server. Missing: ${missing.join(', ')}.`,
        code: 'FIREBASE_NOT_CONFIGURED',
        missingKeys: missing,
      });
    }

    const fb = getFirebaseAdmin();
    if (!fb) {
      return res.status(500).json({ error: 'Failed to initialize Firebase Admin SDK.' });
    }

    // Create user in Firebase Auth
    let userRecord;
    try {
      userRecord = await fb.auth.createUser({
        email: email.trim(),
        password,
        displayName: fullName.trim(),
      });
    } catch (authErr: any) {
      console.error('[Firebase Signup Auth Error]:', authErr);
      if (authErr.code === 'auth/configuration-not-found' || authErr.message?.includes('configuration')) {
        return res.status(400).json({
          error: "Firebase Authentication has not been activated yet in your Firebase project. Please open Firebase Console -> Build -> Authentication -> click 'Get Started' and enable the 'Email/Password' sign-in method.",
          code: 'AUTH_NOT_ENABLED_IN_CONSOLE',
        });
      }
      if (authErr.code === 'auth/email-already-exists') {
        return res.status(400).json({ error: 'An account with this email already exists. Please log in.' });
      }
      if (authErr.code === 'auth/invalid-email') {
        return res.status(400).json({ error: 'The email address is invalid.' });
      }
      if (authErr.code === 'auth/weak-password') {
        return res.status(400).json({ error: 'The password is too weak. Please use a stronger password (at least 6 characters).' });
      }
      return res.status(400).json({ error: authErr.message || 'Failed to create user account in Firebase Auth.' });
    }

    // Create Firestore User Document
    const uid = userRecord.uid;
    const now = new Date().toISOString();
    const userProfile = {
      uid,
      fullName: fullName.trim(),
      email: email.trim(),
      photoURL: '',
      plan: 'free' as const,
      creditsUsed: 0,
      storiesCreated: 0,
      charactersCreated: 0,
      scenesGenerated: 0,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await fb.db.collection('users').doc(uid).set(userProfile);
    } catch (dbErr: any) {
      console.error('[Firestore Profile Save Error]:', dbErr);
      // Clean up the created auth user if profile save fails
      try {
        await fb.auth.deleteUser(uid);
      } catch (cleanupErr) {
        console.error('[Firebase Auth Cleanup Error]:', cleanupErr);
      }

      if (dbErr.message?.includes('Cloud Firestore API has not been used') || dbErr.message?.includes('PERMISSION_DENIED')) {
        return res.status(500).json({
          error: "Cloud Firestore Database has not been created yet in your Firebase project. Please open Firebase Console -> Build -> Firestore Database and click 'Create database'.",
          code: 'FIRESTORE_NOT_ENABLED_IN_CONSOLE',
        });
      }

      return res.status(500).json({
        error: 'Failed to create user profile in Firestore database: ' + (dbErr.message || 'Permission denied'),
      });
    }

    // Set secure HTTP-only session cookie
    const token = setSessionCookie(res, { uid, email: email.trim() });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: userProfile,
    });
  } catch (err: any) {
    console.error('[Signup General Error]:', err);
    return res.status(500).json({ error: err.message || 'An unexpected error occurred during signup.' });
  }
}

export async function handleLogin(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email address is required.' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Password is required.' });
    }

    if (!isFirebaseConfigured()) {
      const missing = getMissingFirebaseKeys();
      return res.status(503).json({
        error: `Firebase Admin credentials are not yet configured on the server. Missing: ${missing.join(', ')}.`,
        code: 'FIREBASE_NOT_CONFIGURED',
        missingKeys: missing,
      });
    }

    const fb = getFirebaseAdmin();
    if (!fb) {
      return res.status(500).json({ error: 'Firebase Admin SDK is not ready.' });
    }

    const webApiKey = getWebApiKey();
    let uid: string;

    if (webApiKey) {
      // Authenticate password securely using Google Identity Toolkit REST API
      const verifyUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${webApiKey}`;
      const authResponse = await fetch(verifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          returnSecureToken: true,
        }),
      });

      const authData = await authResponse.json() as any;

      if (!authResponse.ok) {
        const errCode = authData.error?.message;
        if (errCode === 'EMAIL_NOT_FOUND' || errCode === 'INVALID_PASSWORD' || errCode === 'INVALID_LOGIN_CREDENTIALS') {
          return res.status(401).json({ error: 'Invalid email or password. Please try again.' });
        }
        if (errCode === 'USER_DISABLED') {
          return res.status(403).json({ error: 'This account has been disabled. Please contact support.' });
        }
        return res.status(401).json({ error: authData.error?.message || 'Authentication failed.' });
      }

      uid = authData.localId;
    } else {
      // If Web API key is not yet provided, verify if user exists in Firebase Admin
      try {
        const userRecord = await fb.auth.getUserByEmail(email.trim());
        uid = userRecord.uid;
      } catch (err: any) {
        if (err.code === 'auth/user-not-found') {
          return res.status(401).json({ error: 'No account found with this email address.' });
        }
        return res.status(401).json({ error: 'Authentication failed. Please check your credentials.' });
      }
    }

    // Fetch user profile from Firestore
    const userDocRef = fb.db.collection('users').doc(uid);
    const userDoc = await userDocRef.get();

    let userProfile: any;
    if (userDoc.exists) {
      userProfile = userDoc.data();
    } else {
      // Self-heal if Firestore profile was missing
      const authUser = await fb.auth.getUser(uid);
      const now = new Date().toISOString();
      userProfile = {
        uid,
        fullName: authUser.displayName || 'User',
        email: authUser.email || email.trim(),
        photoURL: authUser.photoURL || '',
        plan: 'free',
        creditsUsed: 0,
        storiesCreated: 0,
        charactersCreated: 0,
        scenesGenerated: 0,
        createdAt: now,
        updatedAt: now,
      };
      await userDocRef.set(userProfile);
    }

    // Set secure HTTP-only session cookie
    const token = setSessionCookie(res, { uid, email: email.trim() });

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: userProfile,
    });
  } catch (err: any) {
    console.error('[Login General Error]:', err);
    return res.status(500).json({ error: err.message || 'An unexpected error occurred during login.' });
  }
}

export async function handleLogout(req: Request, res: Response) {
  clearSessionCookie(res);
  return res.status(200).json({ success: true, message: 'Logged out successfully.' });
}

export async function handleGetMe(req: Request, res: Response) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({ error: 'No active session.' });
    }

    if (!isFirebaseConfigured()) {
      return res.status(503).json({
        error: 'Firebase is not yet configured.',
        code: 'FIREBASE_NOT_CONFIGURED',
      });
    }

    const fb = getFirebaseAdmin();
    if (!fb) {
      return res.status(500).json({ error: 'Firebase Admin not initialized.' });
    }

    const userDoc = await fb.db.collection('users').doc(session.uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User profile not found in Firestore.' });
    }

    const token = setSessionCookie(res, { uid: session.uid, email: session.email });

    return res.status(200).json({
      success: true,
      token,
      user: userDoc.data(),
    });
  } catch (err: any) {
    console.error('[GetMe Error]:', err);
    return res.status(500).json({ error: 'Failed to retrieve session user.' });
  }
}

export function handleGetConfigStatus(req: Request, res: Response) {
  const { configured, missing } = checkConfig();
  const webApiKey = getWebApiKey();

  return res.json({
    firebaseConfigured: configured,
    missingKeys: missing,
    hasWebApiKey: Boolean(webApiKey),
    projectId: process.env.FIREBASE_PROJECT_ID || null,
  });
}

function checkConfig() {
  const missing: string[] = [];
  if (!process.env.FIREBASE_PROJECT_ID) missing.push('FIREBASE_PROJECT_ID');
  if (!process.env.FIREBASE_CLIENT_EMAIL) missing.push('FIREBASE_CLIENT_EMAIL');
  if (!process.env.FIREBASE_PRIVATE_KEY) missing.push('FIREBASE_PRIVATE_KEY');
  return {
    configured: missing.length === 0,
    missing,
  };
}
