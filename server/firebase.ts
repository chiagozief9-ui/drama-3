import { getApps, initializeApp, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import dotenv from 'dotenv';

dotenv.config();

let appInstance: App | null = null;
let firestoreInstance: Firestore | null = null;
let authInstance: Auth | null = null;

export function checkFirebaseConfig(): { configured: boolean; missing: string[] } {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  const missing: string[] = [];
  if (!projectId) missing.push('FIREBASE_PROJECT_ID');
  if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
  if (!privateKey) missing.push('FIREBASE_PRIVATE_KEY');

  return {
    configured: missing.length === 0,
    missing,
  };
}

export function initFirebase(): { app: App; db: Firestore; auth: Auth } | null {
  if (appInstance && firestoreInstance && authInstance) {
    return { app: appInstance, db: firestoreInstance, auth: authInstance };
  }

  const { configured, missing } = checkFirebaseConfig();

  if (!configured) {
    console.warn(`[Firebase Admin] Missing backend credentials: ${missing.join(', ')}.`);
    return null;
  }

  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';

    // Handle escaped newlines in private key string
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    if (getApps().length === 0) {
      appInstance = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
    } else {
      appInstance = getApps()[0];
    }

    firestoreInstance = getFirestore(appInstance);
    authInstance = getAuth(appInstance);

    console.log(`[Firebase Admin] Initialized successfully for project: ${projectId}`);
    return {
      app: appInstance,
      db: firestoreInstance,
      auth: authInstance,
    };
  } catch (error) {
    console.error('[Firebase Admin] Initialization error:', error);
    return null;
  }
}

export function getFirebaseAdmin() {
  if (!appInstance || !firestoreInstance || !authInstance) {
    return initFirebase();
  }
  return {
    app: appInstance,
    db: firestoreInstance,
    auth: authInstance,
  };
}

export function isFirebaseConfigured(): boolean {
  return checkFirebaseConfig().configured;
}

export function getMissingFirebaseKeys(): string[] {
  return checkFirebaseConfig().missing;
}

export function getWebApiKey(): string | undefined {
  return process.env.FIREBASE_WEB_API_KEY;
}
