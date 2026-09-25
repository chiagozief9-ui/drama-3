import type { Request, Response } from 'express';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { getFirebaseAdmin, isFirebaseConfigured } from './firebase.js';
import { getSessionFromRequest } from './session.js';
import { generateProductionKit, isGeminiConfigured } from './gemini.js';
import type { DramaStory, CharacterProfile, ScenePrompt, ProductionKit, ExportPackData } from '../src/types.js';

/**
 * GET /api/stories/:storyId/export
 * Retrieves complete aggregated production data (story, cast, scene prompts, production kit)
 */
export async function handleGetExportPack(req: Request, res: Response) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized. Please log in to access the export pack.',
      });
    }

    if (!isFirebaseConfigured()) {
      return res.status(500).json({
        success: false,
        error: 'Firebase Admin is not configured on the server.',
      });
    }

    const fb = getFirebaseAdmin();
    if (!fb) {
      return res.status(500).json({ success: false, error: 'Firebase Admin not initialized.' });
    }

    const { storyId } = req.params;
    if (!storyId) {
      return res.status(400).json({ success: false, error: 'storyId parameter is required.' });
    }

    const db = fb.db;
    const storyDocRef = db.collection('users').doc(session.uid).collection('stories').doc(storyId);
    const storyDoc = await storyDocRef.get();

    if (!storyDoc.exists) {
      return res.status(404).json({ success: false, error: 'Story not found or access denied.' });
    }

    const storyData = storyDoc.data() as DramaStory & { productionKit?: ProductionKit };
    if (storyData.uid && storyData.uid !== session.uid) {
      return res.status(403).json({ success: false, error: 'Forbidden. You do not own this story.' });
    }

    // Fetch characters
    const charactersSnap = await storyDocRef.collection('characters').get();
    const characters: CharacterProfile[] = [];
    charactersSnap.forEach((doc: QueryDocumentSnapshot) => {
      characters.push(doc.data() as CharacterProfile);
    });

    // Fetch scene prompts ordered by sceneNumber
    const promptsSnap = await storyDocRef
      .collection('scenePrompts')
      .orderBy('sceneNumber', 'asc')
      .get();
    const scenePrompts: ScenePrompt[] = [];
    promptsSnap.forEach((doc: QueryDocumentSnapshot) => {
      scenePrompts.push(doc.data() as ScenePrompt);
    });

    const exportData: ExportPackData = {
      story: storyData,
      characters,
      scenePrompts,
      productionKit: storyData.productionKit,
      exportedAt: new Date().toISOString(),
    };

    return res.json({
      success: true,
      data: exportData,
    });
  } catch (err: any) {
    console.error('[handleGetExportPack Error]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error while fetching export pack.',
    });
  }
}

/**
 * POST /api/stories/:storyId/export/ai-kit
 * Generates viral social media hooks, sound design cues, and editor notes using Gemini
 */
export async function handleGenerateAiKit(req: Request, res: Response) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized. Please log in.',
      });
    }

    if (!isGeminiConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'GEMINI_API_KEY is not configured in backend environment.',
      });
    }

    if (!isFirebaseConfigured()) {
      return res.status(500).json({
        success: false,
        error: 'Firebase Admin is not configured on the server.',
      });
    }

    const fb = getFirebaseAdmin();
    if (!fb) {
      return res.status(500).json({ success: false, error: 'Firebase Admin not initialized.' });
    }

    const { storyId } = req.params;
    if (!storyId) {
      return res.status(400).json({ success: false, error: 'storyId parameter is required.' });
    }

    const db = fb.db;
    const storyDocRef = db.collection('users').doc(session.uid).collection('stories').doc(storyId);
    const storyDoc = await storyDocRef.get();

    if (!storyDoc.exists) {
      return res.status(404).json({ success: false, error: 'Story not found or access denied.' });
    }

    const storyData = storyDoc.data() as DramaStory;
    if (storyData.uid && storyData.uid !== session.uid) {
      return res.status(403).json({ success: false, error: 'Forbidden. You do not own this story.' });
    }

    // Fetch characters
    const charactersSnap = await storyDocRef.collection('characters').get();
    const characters: CharacterProfile[] = [];
    charactersSnap.forEach((doc: QueryDocumentSnapshot) => {
      characters.push(doc.data() as CharacterProfile);
    });

    // Fetch scene prompts
    const promptsSnap = await storyDocRef
      .collection('scenePrompts')
      .orderBy('sceneNumber', 'asc')
      .get();
    const scenePrompts: ScenePrompt[] = [];
    promptsSnap.forEach((doc: QueryDocumentSnapshot) => {
      scenePrompts.push(doc.data() as ScenePrompt);
    });

    // Generate production kit with Gemini
    const productionKit = await generateProductionKit({
      story: storyData,
      characters,
      scenePrompts,
    });

    // Persist productionKit directly on the story document
    await storyDocRef.update({
      productionKit,
      updatedAt: new Date().toISOString(),
    });

    return res.json({
      success: true,
      data: productionKit,
    });
  } catch (err: any) {
    console.error('[handleGenerateAiKit Error]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error while generating AI production kit.',
    });
  }
}

/**
 * POST /api/stories/:storyId/export/mark-exported
 * Updates story status to 'completed' and tracks user production statistics
 */
export async function handleMarkExported(req: Request, res: Response) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized. Please log in.',
      });
    }

    if (!isFirebaseConfigured()) {
      return res.status(500).json({
        success: false,
        error: 'Firebase Admin is not configured on the server.',
      });
    }

    const fb = getFirebaseAdmin();
    if (!fb) {
      return res.status(500).json({ success: false, error: 'Firebase Admin not initialized.' });
    }

    const { storyId } = req.params;
    if (!storyId) {
      return res.status(400).json({ success: false, error: 'storyId parameter is required.' });
    }

    const db = fb.db;
    const storyDocRef = db.collection('users').doc(session.uid).collection('stories').doc(storyId);
    const storyDoc = await storyDocRef.get();

    if (!storyDoc.exists) {
      return res.status(404).json({ success: false, error: 'Story not found or access denied.' });
    }

    await storyDocRef.update({
      status: 'completed',
      exportedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Update user stats
    const statsDocRef = db.collection('users').doc(session.uid).collection('meta').doc('stats');
    await statsDocRef.set(
      {
        exportsGenerated: FieldValue.increment(1),
        lastExportedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return res.json({
      success: true,
      message: 'Export status recorded successfully.',
    });
  } catch (err: any) {
    console.error('[handleMarkExported Error]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error while marking export status.',
    });
  }
}
