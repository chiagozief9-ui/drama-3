import type { Request, Response } from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { getFirebaseAdmin, isFirebaseConfigured } from './firebase.js';
import { getSessionFromRequest } from './session.js';
import {
  generateDramaIdeas,
  generateFullDramaStory,
  isGeminiConfigured,
} from './gemini.js';
import type { DramaStory } from '../src/types.js';
import {
  parseDurationToSeconds,
  parseSceneDurationToSeconds,
  calculateTargetSceneCount,
  getProjectMode,
  calculateEstimatedScenes,
} from './duration.js';

export async function handleGenerateIdeas(req: Request, res: Response) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized. Please log in to generate drama ideas.' });
    }

    if (!isGeminiConfigured()) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured in the backend environment.',
        code: 'GEMINI_KEY_MISSING',
      });
    }

    const {
      niche,
      storyType = 'Modern Family Drama',
      audience = 'African/Nigerian audience',
      videoLength = '60 seconds',
      aspectRatio = '9:16',
      tone = 'Emotional',
      numberOfIdeas = 5,
    } = req.body;

    const ideas = await generateDramaIdeas({
      niche,
      storyType,
      audience,
      videoLength,
      aspectRatio,
      tone,
      numberOfIdeas: Math.min(10, Math.max(1, Number(numberOfIdeas) || 5)),
    });

    return res.status(200).json({
      success: true,
      ideas,
    });
  } catch (err: any) {
    console.error('[Generate Ideas Error]:', err);
    return res.status(500).json({
      error: err.message || 'An error occurred while generating drama ideas with Gemini.',
    });
  }
}

export async function handleCreateDramaStory(req: Request, res: Response) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized. Please log in to create a drama story.' });
    }

    if (!isGeminiConfigured()) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured in the backend environment.',
        code: 'GEMINI_KEY_MISSING',
      });
    }

    const {
      storyIdea,
      storyType = 'Modern Family Drama',
      visualStyle = 'Cinematic Nollywood Style',
      videoLength = '60 seconds',
      aspectRatio = '9:16',
      tone = 'Emotional',
      targetPlatform = 'TikTok',
      mainCharacterCount: rawMainCharCount,
      sceneDurationLabel: rawSceneDurationLabel = '10 seconds',
    } = req.body;

    if (!storyIdea || !storyIdea.trim()) {
      return res.status(400).json({ error: 'A story idea or premise is required.' });
    }

    const mainCharacterCount = Number(rawMainCharCount) >= 2
      ? Math.min(50, Math.floor(Number(rawMainCharCount)))
      : 5;

    const storyData = await generateFullDramaStory({
      storyIdea: storyIdea.trim(),
      storyType,
      visualStyle,
      videoLength,
      aspectRatio,
      tone,
      targetPlatform,
      mainCharacterCount,
    });

    const storyId = `story_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const durationLabel = storyData.estimatedDuration || videoLength || '60 seconds';
    const durationSeconds = parseDurationToSeconds(durationLabel);
    const sceneDurationLabel = rawSceneDurationLabel || '10 seconds';
    const sceneDurationSeconds = parseSceneDurationToSeconds(sceneDurationLabel);
    const targetSceneCount = calculateTargetSceneCount(durationSeconds, sceneDurationSeconds);
    const projectMode = getProjectMode(durationSeconds);
    const totalEstimatedScenes = targetSceneCount;
    const sceneBatchingEnabled = (projectMode === 'long_form' || (projectMode === 'medium_form' && durationSeconds >= 900));

    const fullStory: DramaStory = {
      ...storyData,
      storyId,
      uid: session.uid,
      durationLabel,
      durationSeconds,
      mainCharacterCount,
      sceneDurationLabel,
      sceneDurationSeconds,
      targetSceneCount,
      generatedSceneCount: 0,
      sceneCountStatus: 'not_started',
      projectMode,
      sceneBatchingEnabled,
      totalEstimatedScenes,
      generatedSceneBatches: [],
      status: 'story_created',
      createdAt: now,
      updatedAt: now,
    };

    if (isFirebaseConfigured()) {
      const fb = getFirebaseAdmin();
      if (fb) {
        try {
          await fb.db
            .collection('users')
            .doc(session.uid)
            .collection('stories')
            .doc(storyId)
            .set(fullStory);

          const userDocRef = fb.db.collection('users').doc(session.uid);
          await userDocRef.set(
            {
              storiesCreated: FieldValue.increment(1),
              updatedAt: now,
            },
            { merge: true }
          );
        } catch (dbErr) {
          console.warn('[Auto-save story warning]:', dbErr);
        }
      }
    }

    return res.status(200).json({
      success: true,
      story: fullStory,
      storyId,
    });
  } catch (err: any) {
    console.error('[Create Drama Story Error]:', err);
    return res.status(500).json({
      error: err.message || 'An error occurred while creating the drama story with Gemini.',
    });
  }
}

export async function handleSaveStory(req: Request, res: Response) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized. Please log in to save stories.' });
    }

    if (!isFirebaseConfigured()) {
      return res.status(503).json({
        error: 'Firestore is not configured yet on the backend.',
        code: 'FIREBASE_NOT_CONFIGURED',
      });
    }

    const fb = getFirebaseAdmin();
    if (!fb) {
      return res.status(500).json({ error: 'Firebase Admin not initialized.' });
    }

    const storyInput = req.body;
    if (!storyInput || !storyInput.title) {
      return res.status(400).json({ error: 'Story title and data are required to save.' });
    }

    const storyId = storyInput.storyId || `story_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const durationLabel = storyInput.durationLabel || storyInput.estimatedDuration || '60 seconds';
    const durationSeconds = typeof storyInput.durationSeconds === 'number'
      ? storyInput.durationSeconds
      : parseDurationToSeconds(durationLabel);
    const projectMode = storyInput.projectMode || getProjectMode(durationSeconds);
    const mainCharacterCount = Number(storyInput.mainCharacterCount) >= 2
      ? Math.floor(Number(storyInput.mainCharacterCount))
      : 5;
    const sceneDurationLabel = storyInput.sceneDurationLabel || '10 seconds';
    const sceneDurationSeconds = typeof storyInput.sceneDurationSeconds === 'number'
      ? storyInput.sceneDurationSeconds
      : parseSceneDurationToSeconds(sceneDurationLabel);
    const targetSceneCount = typeof storyInput.targetSceneCount === 'number' && storyInput.targetSceneCount > 0
      ? storyInput.targetSceneCount
      : calculateTargetSceneCount(durationSeconds, sceneDurationSeconds);
    const generatedSceneCount = typeof storyInput.generatedSceneCount === 'number'
      ? storyInput.generatedSceneCount
      : 0;
    const sceneCountStatus = storyInput.sceneCountStatus || (
      generatedSceneCount >= targetSceneCount ? 'complete' : (generatedSceneCount > 0 ? 'partial' : 'not_started')
    );
    const totalEstimatedScenes = targetSceneCount;
    const sceneBatchingEnabled = typeof storyInput.sceneBatchingEnabled === 'boolean'
      ? storyInput.sceneBatchingEnabled
      : (projectMode === 'long_form' || (projectMode === 'medium_form' && durationSeconds >= 900));

    const fullStory: DramaStory = {
      storyId,
      uid: session.uid,
      title: storyInput.title,
      storyIdea: storyInput.storyIdea || '',
      storyType: storyInput.storyType || 'Modern Family Drama',
      visualStyle: storyInput.visualStyle || 'Cinematic Nollywood Style',
      aspectRatio: storyInput.aspectRatio || '9:16',
      targetPlatform: storyInput.targetPlatform || 'TikTok',
      estimatedDuration: durationLabel,
      durationLabel,
      durationSeconds,
      mainCharacterCount,
      sceneDurationLabel,
      sceneDurationSeconds,
      targetSceneCount,
      generatedSceneCount,
      sceneCountStatus,
      projectMode,
      sceneBatchingEnabled,
      totalEstimatedScenes,
      generatedSceneBatches: storyInput.generatedSceneBatches || [],
      actsBreakdown: storyInput.actsBreakdown || undefined,
      tone: storyInput.tone || 'Emotional',
      logline: storyInput.logline || '',
      mainTheme: storyInput.mainTheme || '',
      moralLesson: storyInput.moralLesson || '',
      hookScene: storyInput.hookScene || '',
      fullDramaScript: storyInput.fullDramaScript || '',
      characterList: Array.isArray(storyInput.characterList) ? storyInput.characterList : [],
      sceneList: Array.isArray(storyInput.sceneList) ? storyInput.sceneList : [],
      partTwoCliffhanger: storyInput.partTwoCliffhanger || '',
      contentWarnings: storyInput.contentWarnings || '',
      status: 'story_created',
      createdAt: storyInput.createdAt || now,
      updatedAt: now,
    };

    // Save story inside users/{uid}/stories/{storyId}
    const storyDocRef = fb.db
      .collection('users')
      .doc(session.uid)
      .collection('stories')
      .doc(storyId);

    await storyDocRef.set(fullStory);

    // Increment storiesCreated counter and touch updatedAt on user profile
    const userDocRef = fb.db.collection('users').doc(session.uid);
    try {
      await userDocRef.update({
        storiesCreated: FieldValue.increment(1),
        updatedAt: now,
      });
    } catch {
      // If user profile doc didn't exist or update failed, set with merge
      await userDocRef.set(
        {
          storiesCreated: FieldValue.increment(1),
          updatedAt: now,
        },
        { merge: true }
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Story saved successfully.',
      storyId,
      story: fullStory,
    });
  } catch (err: any) {
    console.error('[Save Story Error]:', err);
    return res.status(500).json({
      error: err.message || 'Failed to save drama story to Firestore.',
    });
  }
}

export async function handleGetStories(req: Request, res: Response) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized. Please log in to view stories.' });
    }

    if (!isFirebaseConfigured()) {
      return res.status(503).json({
        error: 'Firestore is not configured yet on the backend.',
        code: 'FIREBASE_NOT_CONFIGURED',
      });
    }

    const fb = getFirebaseAdmin();
    if (!fb) {
      return res.status(500).json({ error: 'Firebase Admin not initialized.' });
    }

    const snapshot = await fb.db
      .collection('users')
      .doc(session.uid)
      .collection('stories')
      .get();

    const stories: DramaStory[] = [];
    snapshot.forEach((doc) => {
      stories.push(doc.data() as DramaStory);
    });

    // Sort descending by createdAt
    stories.sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    return res.status(200).json({
      success: true,
      stories,
    });
  } catch (err: any) {
    console.error('[Get Stories Error]:', err);
    return res.status(500).json({
      error: err.message || 'Failed to retrieve stories from Firestore.',
    });
  }
}

export async function handleGetStoryById(req: Request, res: Response) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized. Please log in to view this story.' });
    }

    if (!isFirebaseConfigured()) {
      return res.status(503).json({
        error: 'Firestore is not configured.',
        code: 'FIREBASE_NOT_CONFIGURED',
      });
    }

    const fb = getFirebaseAdmin();
    if (!fb) {
      return res.status(500).json({ error: 'Firebase Admin not initialized.' });
    }

    const { storyId } = req.params;
    if (!storyId) {
      return res.status(400).json({ error: 'Story ID is required.' });
    }

    const doc = await fb.db
      .collection('users')
      .doc(session.uid)
      .collection('stories')
      .doc(storyId)
      .get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Story not found.' });
    }

    return res.status(200).json({
      success: true,
      story: doc.data() as DramaStory,
    });
  } catch (err: any) {
    console.error('[Get Story By ID Error]:', err);
    return res.status(500).json({
      error: err.message || 'Failed to retrieve story from Firestore.',
    });
  }
}

export async function handleDeleteStory(req: Request, res: Response) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized. Please log in to delete this story.' });
    }

    if (!isFirebaseConfigured()) {
      return res.status(503).json({
        error: 'Firestore is not configured.',
        code: 'FIREBASE_NOT_CONFIGURED',
      });
    }

    const fb = getFirebaseAdmin();
    if (!fb) {
      return res.status(500).json({ error: 'Firebase Admin not initialized.' });
    }

    const { storyId } = req.params;
    if (!storyId) {
      return res.status(400).json({ error: 'Story ID is required.' });
    }

    const storyRef = fb.db
      .collection('users')
      .doc(session.uid)
      .collection('stories')
      .doc(storyId);

    const doc = await storyRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Story not found or already deleted.' });
    }

    await storyRef.delete();

    // Decrement storiesCreated count if greater than 0
    try {
      const userRef = fb.db.collection('users').doc(session.uid);
      const userDoc = await userRef.get();
      const currentCount = userDoc.data()?.storiesCreated || 0;
      if (currentCount > 0) {
        await userRef.update({
          storiesCreated: FieldValue.increment(-1),
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn('[Decrement storiesCreated warning]:', e);
    }

    return res.status(200).json({
      success: true,
      message: 'Story deleted successfully.',
    });
  } catch (err: any) {
    console.error('[Delete Story Error]:', err);
    return res.status(500).json({
      error: err.message || 'Failed to delete story from Firestore.',
    });
  }
}
