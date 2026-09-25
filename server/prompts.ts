import type { Request, Response } from 'express';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { getFirebaseAdmin, isFirebaseConfigured } from './firebase.js';
import { getSessionFromRequest } from './session.js';
import {
  generateScenePromptsFromStoryAndCharacters,
  isGeminiConfigured,
} from './gemini.js';
import type { DramaStory, CharacterProfile, ScenePrompt } from '../src/types.js';
import {
  parseDurationToSeconds,
  parseSceneDurationToSeconds,
  calculateTargetSceneCount,
} from './duration.js';

/**
 * POST /api/stories/:storyId/prompts/generate
 * Generate production-ready image and video prompts for each scene
 */
export async function handleGenerateScenePrompts(req: Request, res: Response) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized. Please log in to generate scene prompts.',
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

    // Fetch saved characters for this story
    const charactersSnap = await storyDocRef.collection('characters').get();
    if (charactersSnap.empty) {
      return res.status(400).json({
        success: false,
        error: 'Characters required first. Please generate and save characters before creating scene prompts.',
        requiresCharacters: true,
      });
    }

    const characters: CharacterProfile[] = [];
    charactersSnap.forEach((doc: QueryDocumentSnapshot) => {
      characters.push(doc.data() as CharacterProfile);
    });

    const {
      aspectRatio,
      visualStyle,
      videoDuration,
      sceneDuration,
      promptDetailLevel,
      cameraStyle,
      platform,
      dialogueMode,
      consistencyMode,
      startSceneNumber,
      endSceneNumber,
      batchSize,
      isBatchMode,
    } = req.body;

    const durationLabel = videoDuration || storyData.durationLabel || storyData.estimatedDuration || '60 seconds';
    const sceneDurationLabel = sceneDuration || storyData.sceneDurationLabel || '10 seconds';
    const durationSeconds = parseDurationToSeconds(durationLabel);
    const sceneDurationSeconds = parseSceneDurationToSeconds(sceneDurationLabel);
    const targetSceneCount = storyData.targetSceneCount && storyData.targetSceneCount > 0
      ? storyData.targetSceneCount
      : calculateTargetSceneCount(durationSeconds, sceneDurationSeconds);

    const scenePrompts = await generateScenePromptsFromStoryAndCharacters({
      story: storyData,
      characters,
      aspectRatio,
      visualStyle,
      videoDuration: durationLabel,
      sceneDuration: sceneDurationLabel,
      promptDetailLevel,
      cameraStyle,
      platform,
      dialogueMode,
      consistencyMode,
      startSceneNumber,
      endSceneNumber,
      batchSize,
      isBatchMode,
      targetSceneCount,
    });

    return res.json({
      success: true,
      storyId,
      sceneCount: scenePrompts.length,
      targetSceneCount,
      scenePrompts,
      batchInfo: isBatchMode
        ? {
            startScene: startSceneNumber || 1,
            endScene: endSceneNumber || (startSceneNumber || 1) + scenePrompts.length - 1,
            count: scenePrompts.length,
          }
        : undefined,
    });
  } catch (err: any) {
    console.error('[Generate Scene Prompts Error]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to generate scene prompts.',
    });
  }
}

/**
 * POST /api/stories/:storyId/prompts/save
 * Save all generated or edited scene prompts to Firestore
 */
export async function handleSaveScenePrompts(req: Request, res: Response) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized. Please log in to save scene prompts.',
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
    const { scenePrompts } = req.body;

    if (!storyId) {
      return res.status(400).json({ success: false, error: 'storyId is required.' });
    }

    if (!scenePrompts || !Array.isArray(scenePrompts) || scenePrompts.length === 0) {
      return res.status(400).json({ success: false, error: 'scenePrompts array is required.' });
    }

    // Validation: Check for duplicate scene numbers
    const seenSceneNumbers = new Set<number>();
    for (const p of scenePrompts) {
      const num = Number(p.sceneNumber);
      if (seenSceneNumbers.has(num)) {
        return res.status(400).json({
          success: false,
          error: `Duplicate scene number Scene ${num} found. Each scene must have a unique sequential number.`,
        });
      }
      seenSceneNumbers.add(num);
    }

    const db = fb.db;
    const storyDocRef = db.collection('users').doc(session.uid).collection('stories').doc(storyId);
    const storyDoc = await storyDocRef.get();

    if (!storyDoc.exists) {
      return res.status(404).json({ success: false, error: 'Story not found or access denied.' });
    }

    const storyData = storyDoc.data() as DramaStory;
    const now = new Date().toISOString();
    const batch = db.batch();

    const preparedPrompts: ScenePrompt[] = [];

    scenePrompts.forEach((p: Partial<ScenePrompt>, index: number) => {
      const sNumber = Number(p.sceneNumber) || (index + 1);
      // Use deterministic ID for scene document by scene number if not given
      const sceneId = p.sceneId || `scene_${storyId}_${sNumber}`;
      const sceneDocRef = storyDocRef.collection('scenePrompts').doc(sceneId);

      const promptData: ScenePrompt = {
        sceneId,
        storyId,
        storyTitle: p.storyTitle || storyData.title || '',
        uid: session.uid,
        sceneNumber: sNumber,
        sceneTitle: p.sceneTitle || `Scene ${sNumber}`,
        sceneDuration: p.sceneDuration || storyData.sceneDurationLabel || '10 seconds',
        aspectRatio: p.aspectRatio || storyData.aspectRatio || '9:16',
        visualStyle: p.visualStyle || storyData.visualStyle || 'Cinematic Nollywood Style',
        location: p.location || 'Location',
        timeOfDay: p.timeOfDay || 'Day',
        charactersInScene: p.charactersInScene || [],
        allVisiblePeople: p.allVisiblePeople || '',
        characterPositioning: p.characterPositioning || '',
        mainAction: p.mainAction || '',
        emotionalTone: p.emotionalTone || '',
        dialogue: p.dialogue || '',
        imagePrompt: p.imagePrompt || '',
        videoPrompt: p.videoPrompt || '',
        cameraMovement: p.cameraMovement || '',
        lighting: p.lighting || '',
        backgroundDetails: p.backgroundDetails || '',
        costumeContinuity: p.costumeContinuity || '',
        facialExpressionInstructions: p.facialExpressionInstructions || '',
        lipSyncInstruction: p.lipSyncInstruction || '',
        consistencyInstruction: p.consistencyInstruction || '',
        negativePrompt: p.negativePrompt || '',
        productionNotes: p.productionNotes || '',
        status: 'prompts_created',
        createdAt: p.createdAt || now,
        updatedAt: now,
      };

      preparedPrompts.push(promptData);
      batch.set(sceneDocRef, promptData, { merge: true });
    });

    // Calculate batch range for long projects
    const existingBatches = storyData.generatedSceneBatches || [];
    const minScene = Math.min(...preparedPrompts.map(p => p.sceneNumber || 1));
    const maxScene = Math.max(...preparedPrompts.map(p => p.sceneNumber || 1));
    const newBatchInfo = {
      batchNumber: existingBatches.length + 1,
      startScene: minScene,
      endScene: maxScene,
      generatedAt: now,
      sceneCount: preparedPrompts.length,
    };
    const updatedBatches = [...existingBatches, newBatchInfo];

    // Total target scene count calculation
    const durationLabel = storyData.durationLabel || storyData.estimatedDuration || '60 seconds';
    const durationSeconds = typeof storyData.durationSeconds === 'number'
      ? storyData.durationSeconds
      : parseDurationToSeconds(durationLabel);
    const sceneDurationLabel = storyData.sceneDurationLabel || '10 seconds';
    const sceneDurationSeconds = typeof storyData.sceneDurationSeconds === 'number'
      ? storyData.sceneDurationSeconds
      : parseSceneDurationToSeconds(sceneDurationLabel);

    const targetSceneCount = storyData.targetSceneCount && storyData.targetSceneCount > 0
      ? storyData.targetSceneCount
      : calculateTargetSceneCount(durationSeconds, sceneDurationSeconds);

    // Read existing scenes in subcollection to compute accurate total count
    const existingPromptsSnap = await storyDocRef.collection('scenePrompts').get();
    const existingSceneNumbers = new Set<number>();
    existingPromptsSnap.forEach((doc) => {
      const data = doc.data() as ScenePrompt;
      if (data.sceneNumber) existingSceneNumbers.add(data.sceneNumber);
    });
    preparedPrompts.forEach(p => existingSceneNumbers.add(p.sceneNumber));

    const totalGeneratedSceneCount = existingSceneNumbers.size;
    const sceneCountStatus: 'not_started' | 'partial' | 'complete' =
      totalGeneratedSceneCount >= targetSceneCount ? 'complete' : (totalGeneratedSceneCount > 0 ? 'partial' : 'not_started');

    // Update story with all required Firestore fields
    batch.update(storyDocRef, {
      status: 'prompts_created',
      promptsCreated: true,
      durationLabel,
      durationSeconds,
      sceneDurationLabel,
      sceneDurationSeconds,
      targetSceneCount,
      generatedSceneCount: totalGeneratedSceneCount,
      sceneCountStatus,
      scenePromptCount: totalGeneratedSceneCount,
      mainCharacterCount: storyData.mainCharacterCount || 5,
      generatedSceneBatches: updatedBatches,
      updatedAt: now,
    });

    await batch.commit();

    // Recalculate total scenes generated across all stories for user profile stats
    try {
      const storiesSnap = await db.collection('users').doc(session.uid).collection('stories').get();
      let totalScenes = 0;
      for (const sDoc of storiesSnap.docs) {
        const sPromptsSnap = await sDoc.ref.collection('scenePrompts').get();
        totalScenes += sPromptsSnap.size;
      }

      await db.collection('users').doc(session.uid).set(
        {
          scenesGenerated: totalScenes,
          updatedAt: now,
        },
        { merge: true }
      );
    } catch (statErr) {
      console.warn('[Stats update warning]:', statErr);
    }

    return res.json({
      success: true,
      message: 'All scene prompts saved to Firestore successfully.',
      scenePromptCount: preparedPrompts.length,
      scenePrompts: preparedPrompts,
    });
  } catch (err: any) {
    console.error('[Save Scene Prompts Error]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to save scene prompts.',
    });
  }
}

/**
 * GET /api/stories/:storyId/prompts
 * Return all scene prompts for a story
 */
export async function handleGetStoryScenePrompts(req: Request, res: Response) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized. Please log in to view scene prompts.',
      });
    }

    const { storyId } = req.params;
    const fb = getFirebaseAdmin();
    if (!fb) {
      return res.status(500).json({ success: false, error: 'Firebase Admin not initialized.' });
    }

    const db = fb.db;
    const storyDocRef = db.collection('users').doc(session.uid).collection('stories').doc(storyId);
    const storyDoc = await storyDocRef.get();

    if (!storyDoc.exists) {
      return res.status(404).json({ success: false, error: 'Story not found or access denied.' });
    }

    const promptsSnap = await storyDocRef
      .collection('scenePrompts')
      .orderBy('sceneNumber', 'asc')
      .get();

    const scenePrompts: ScenePrompt[] = [];
    promptsSnap.forEach((doc: QueryDocumentSnapshot) => {
      scenePrompts.push(doc.data() as ScenePrompt);
    });

    return res.json({
      success: true,
      storyId,
      scenePrompts,
    });
  } catch (err: any) {
    console.error('[Get Story Scene Prompts Error]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to retrieve scene prompts.',
    });
  }
}

/**
 * GET /api/stories/:storyId/prompts/:sceneId
 * Return one scene prompt
 */
export async function handleGetScenePromptById(req: Request, res: Response) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized. Please log in.',
      });
    }

    const { storyId, sceneId } = req.params;
    const fb = getFirebaseAdmin();
    if (!fb) {
      return res.status(500).json({ success: false, error: 'Firebase Admin not initialized.' });
    }

    const db = fb.db;
    const promptDocRef = db
      .collection('users')
      .doc(session.uid)
      .collection('stories')
      .doc(storyId)
      .collection('scenePrompts')
      .doc(sceneId);

    const doc = await promptDocRef.get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Scene prompt not found.' });
    }

    return res.json({
      success: true,
      scenePrompt: doc.data() as ScenePrompt,
    });
  } catch (err: any) {
    console.error('[Get Scene Prompt By ID Error]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to retrieve scene prompt.',
    });
  }
}

/**
 * PUT /api/stories/:storyId/prompts/:sceneId
 * Update one scene prompt
 */
export async function handleUpdateScenePrompt(req: Request, res: Response) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized. Please log in.',
      });
    }

    const { storyId, sceneId } = req.params;
    const updateData = req.body;
    const fb = getFirebaseAdmin();
    if (!fb) {
      return res.status(500).json({ success: false, error: 'Firebase Admin not initialized.' });
    }

    const db = fb.db;
    const promptDocRef = db
      .collection('users')
      .doc(session.uid)
      .collection('stories')
      .doc(storyId)
      .collection('scenePrompts')
      .doc(sceneId);

    const doc = await promptDocRef.get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Scene prompt not found.' });
    }

    const now = new Date().toISOString();
    const updated = {
      ...updateData,
      sceneId,
      storyId,
      uid: session.uid,
      updatedAt: now,
    };

    await promptDocRef.update(updated);

    return res.json({
      success: true,
      message: 'Scene prompt updated successfully.',
      scenePrompt: {
        ...doc.data(),
        ...updated,
      },
    });
  } catch (err: any) {
    console.error('[Update Scene Prompt Error]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to update scene prompt.',
    });
  }
}

/**
 * DELETE /api/stories/:storyId/prompts/:sceneId
 * Delete one scene prompt
 */
export async function handleDeleteScenePrompt(req: Request, res: Response) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized. Please log in.',
      });
    }

    const { storyId, sceneId } = req.params;
    const fb = getFirebaseAdmin();
    if (!fb) {
      return res.status(500).json({ success: false, error: 'Firebase Admin not initialized.' });
    }

    const db = fb.db;
    const storyDocRef = db.collection('users').doc(session.uid).collection('stories').doc(storyId);
    const promptDocRef = storyDocRef.collection('scenePrompts').doc(sceneId);

    const doc = await promptDocRef.get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Scene prompt not found.' });
    }

    await promptDocRef.delete();

    // Recalculate remaining scene prompts for this story
    const remainingSnap = await storyDocRef.collection('scenePrompts').get();
    await storyDocRef.update({
      scenePromptCount: remainingSnap.size,
      status: remainingSnap.size > 0 ? 'prompts_created' : 'characters_created',
      promptsCreated: remainingSnap.size > 0,
      updatedAt: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: 'Scene prompt deleted successfully.',
    });
  } catch (err: any) {
    console.error('[Delete Scene Prompt Error]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to delete scene prompt.',
    });
  }
}
