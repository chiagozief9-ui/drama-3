import type { Request, Response } from 'express';
import { getFirebaseAdmin, isFirebaseConfigured } from './firebase.js';
import { getSessionFromRequest } from './session.js';

export async function handleGetDashboardStats(req: Request, res: Response) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized. Please log in to view dashboard data.' });
    }

    if (!isFirebaseConfigured()) {
      return res.status(503).json({
        error: 'Firebase is not yet configured on the server.',
        code: 'FIREBASE_NOT_CONFIGURED',
      });
    }

    const fb = getFirebaseAdmin();
    if (!fb) {
      return res.status(500).json({ error: 'Firebase Admin not initialized.' });
    }

    const userDoc = await fb.db.collection('users').doc(session.uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const userData = userDoc.data() || {};

    return res.status(200).json({
      success: true,
      stats: {
        storiesCreated: userData.storiesCreated ?? 0,
        charactersCreated: userData.charactersCreated ?? 0,
        scenesGenerated: userData.scenesGenerated ?? 0,
        creditsUsed: userData.creditsUsed ?? 0,
        plan: userData.plan || 'free',
        fullName: userData.fullName || '',
        email: userData.email || '',
        createdAt: userData.createdAt || '',
      },
    });
  } catch (err: any) {
    console.error('[Dashboard Stats Error]:', err);
    return res.status(500).json({ error: 'Failed to retrieve dashboard statistics.' });
  }
}
