import type { Request, Response } from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { getFirebaseAdmin, isFirebaseConfigured } from './firebase.js';
import { getSessionFromRequest } from './session.js';
import {
  generateCharactersFromStory,
  isGeminiConfigured,
} from './gemini.js';
import type { DramaStory, CharacterProfile } from '../src/types.js';

export async function handleGenerateCharacters(req: Request, res: Response) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized. Please log in to generate characters.' });
    }

    if (!isGeminiConfigured()) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured in the backend environment.',
        code: 'GEMINI_KEY_MISSING',
      });
    }

    if (!isFirebaseConfigured()) {
      return res.status(503).json({
        error: 'Firebase database is not configured.',
        code: 'FIREBASE_NOT_CONFIGURED',
      });
    }

    const { storyId } = req.params;
    if (!storyId) {
      return res.status(400).json({ error: 'Missing required storyId parameter.' });
    }

    const fb = getFirebaseAdmin();
    if (!fb) {
      return res.status(500).json({ error: 'Firebase Admin not initialized.' });
    }

    // Fetch story from Firestore and verify ownership
    const storyDoc = await fb.db
      .collection('users')
      .doc(session.uid)
      .collection('stories')
      .doc(storyId)
      .get();

    if (!storyDoc.exists) {
      return res.status(404).json({ error: 'Story not found or does not belong to you.' });
    }

    const story = storyDoc.data() as DramaStory;

    const {
      visualStyle,
      consistencyLevel,
      culturalSetting,
      characterDetailLevel,
      mainCharacterCount: rawMainCharCount,
    } = req.body;

    const mainCharacterCount = Number(rawMainCharCount) >= 2
      ? Math.floor(Number(rawMainCharCount))
      : (story.mainCharacterCount && story.mainCharacterCount >= 2 ? story.mainCharacterCount : 5);

    const characters = await generateCharactersFromStory({
      story,
      visualStyle: visualStyle || story.visualStyle,
      consistencyLevel,
      culturalSetting,
      characterDetailLevel,
      mainCharacterCount,
    });

    return res.status(200).json({
      success: true,
      characters,
    });
  } catch (err: any) {
    console.error('[Generate Characters Error]:', err);
    return res.status(500).json({
      error: err.message || 'An error occurred while generating drama characters.',
    });
  }
}

export async function handleSaveCharacters(req: Request, res: Response) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized. Please log in to save characters.' });
    }

    if (!isFirebaseConfigured()) {
      return res.status(503).json({
        error: 'Firebase is not yet configured.',
        code: 'FIREBASE_NOT_CONFIGURED',
      });
    }

    const { storyId } = req.params;
    const { characters } = req.body;

    if (!storyId) {
      return res.status(400).json({ error: 'Missing storyId parameter.' });
    }

    if (!Array.isArray(characters) || characters.length === 0) {
      return res.status(400).json({ error: 'Please provide a non-empty list of characters to save.' });
    }

    const fb = getFirebaseAdmin();
    if (!fb) {
      return res.status(500).json({ error: 'Firebase Admin not initialized.' });
    }

    // Verify story ownership
    const storyRef = fb.db
      .collection('users')
      .doc(session.uid)
      .collection('stories')
      .doc(storyId);

    const storyDoc = await storyRef.get();
    if (!storyDoc.exists) {
      return res.status(404).json({ error: 'Story not found or does not belong to you.' });
    }

    const storyData = storyDoc.data() as DramaStory;
    const now = new Date().toISOString();

    const batch = fb.db.batch();
    const savedCharacters: CharacterProfile[] = [];

    for (let i = 0; i < characters.length; i++) {
      const c = characters[i];
      const charId = c.characterId || `char_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`;

      const charProfile: CharacterProfile = {
        characterId: charId,
        storyId,
        storyTitle: storyData.title || c.storyTitle || 'Untitled Story',
        uid: session.uid,
        name: c.name || `Character ${i + 1}`,
        age: c.age || '30',
        gender: c.gender || 'Unknown',
        roleInStory: c.roleInStory || 'Key Character',
        relationshipToOtherCharacters: c.relationshipToOtherCharacters || '',
        personality: c.personality || '',
        emotionalBehavior: c.emotionalBehavior || '',
        speakingStyle: c.speakingStyle || '',
        voiceStyle: c.voiceStyle || '',
        faceDescription: c.faceDescription || '',
        skinTone: c.skinTone || 'Rich brown skin',
        hairstyle: c.hairstyle || 'Natural hairstyle',
        bodyType: c.bodyType || 'Medium build',
        height: c.height || 'Average',
        clothingStyle: c.clothingStyle || 'African Contemporary',
        mainOutfit: c.mainOutfit || '',
        accessories: c.accessories || '',
        culturalIdentity: c.culturalIdentity || 'Nigerian',
        visualStyle: c.visualStyle || storyData.visualStyle || 'Cinematic Nollywood Style',
        characterWeakness: c.characterWeakness || '',
        characterGoal: c.characterGoal || '',
        secretOrConflict: c.secretOrConflict || '',
        firstSceneEmotion: c.firstSceneEmotion || '',
        characterBible: c.characterBible || '',
        baseImagePrompt: c.baseImagePrompt || '',
        negativePrompt: c.negativePrompt || '',
        consistencyInstruction: c.consistencyInstruction || '',
        status: 'character_created',
        referenceImageURL: c.referenceImageURL || '',
        createdAt: c.createdAt || now,
        updatedAt: now,
      };

      savedCharacters.push(charProfile);

      // Save under users/{uid}/stories/{storyId}/characters/{characterId}
      const storyCharRef = storyRef.collection('characters').doc(charId);
      batch.set(storyCharRef, charProfile);

      // Save summary under users/{uid}/characters/{characterId}
      const userCharRef = fb.db
        .collection('users')
        .doc(session.uid)
        .collection('characters')
        .doc(charId);
      batch.set(userCharRef, charProfile);
    }

    // Update story document status and character count
    batch.update(storyRef, {
      status: 'characters_created',
      charactersCreated: true,
      characterCount: characters.length,
      updatedAt: now,
    });

    await batch.commit();

    // Recalculate total unique characters for user and update user document
    try {
      const allUserCharsSnapshot = await fb.db
        .collection('users')
        .doc(session.uid)
        .collection('characters')
        .get();

      const totalChars = allUserCharsSnapshot.size;
      await fb.db
        .collection('users')
        .doc(session.uid)
        .update({
          charactersCreated: totalChars,
          updatedAt: now,
        });
    } catch (countErr) {
      console.warn('[Character Count Update Warning]:', countErr);
    }

    return res.status(200).json({
      success: true,
      message: 'Characters saved successfully.',
      characterCount: savedCharacters.length,
      characters: savedCharacters,
    });
  } catch (err: any) {
    console.error('[Save Characters Error]:', err);
    return res.status(500).json({
      error: err.message || 'An error occurred while saving characters to Firestore.',
    });
  }
}

export async function handleGetStoryCharacters(req: Request, res: Response) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    if (!isFirebaseConfigured()) {
      return res.status(503).json({
        error: 'Firebase is not yet configured.',
        code: 'FIREBASE_NOT_CONFIGURED',
      });
    }

    const { storyId } = req.params;
    if (!storyId) {
      return res.status(400).json({ error: 'Missing storyId parameter.' });
    }

    const fb = getFirebaseAdmin();
    if (!fb) {
      return res.status(500).json({ error: 'Firebase Admin not initialized.' });
    }

    // Verify story ownership
    const storyDoc = await fb.db
      .collection('users')
      .doc(session.uid)
      .collection('stories')
      .doc(storyId)
      .get();

    if (!storyDoc.exists) {
      return res.status(404).json({ error: 'Story not found or does not belong to you.' });
    }

    const charsSnapshot = await fb.db
      .collection('users')
      .doc(session.uid)
      .collection('stories')
      .doc(storyId)
      .collection('characters')
      .get();

    const characters: CharacterProfile[] = [];
    charsSnapshot.forEach((doc) => {
      characters.push(doc.data() as CharacterProfile);
    });

    return res.status(200).json({
      success: true,
      characters,
    });
  } catch (err: any) {
    console.error('[Get Story Characters Error]:', err);
    return res.status(500).json({
      error: err.message || 'Failed to retrieve story characters.',
    });
  }
}

export async function handleGetAllUserCharacters(req: Request, res: Response) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
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

    const snapshot = await fb.db
      .collection('users')
      .doc(session.uid)
      .collection('characters')
      .get();

    const characters: CharacterProfile[] = [];
    snapshot.forEach((doc) => {
      characters.push(doc.data() as CharacterProfile);
    });

    // Sort by updatedAt descending
    characters.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return res.status(200).json({
      success: true,
      characters,
    });
  } catch (err: any) {
    console.error('[Get All Characters Error]:', err);
    return res.status(500).json({
      error: err.message || 'Failed to retrieve characters.',
    });
  }
}

export async function handleGetCharacterById(req: Request, res: Response) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    if (!isFirebaseConfigured()) {
      return res.status(503).json({
        error: 'Firebase is not yet configured.',
        code: 'FIREBASE_NOT_CONFIGURED',
      });
    }

    const { characterId } = req.params;
    if (!characterId) {
      return res.status(400).json({ error: 'Missing characterId parameter.' });
    }

    const fb = getFirebaseAdmin();
    if (!fb) {
      return res.status(500).json({ error: 'Firebase Admin not initialized.' });
    }

    const doc = await fb.db
      .collection('users')
      .doc(session.uid)
      .collection('characters')
      .doc(characterId)
      .get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Character not found.' });
    }

    return res.status(200).json({
      success: true,
      character: doc.data() as CharacterProfile,
    });
  } catch (err: any) {
    console.error('[Get Character By ID Error]:', err);
    return res.status(500).json({
      error: err.message || 'Failed to retrieve character.',
    });
  }
}

export async function handleUpdateCharacter(req: Request, res: Response) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    if (!isFirebaseConfigured()) {
      return res.status(503).json({
        error: 'Firebase is not yet configured.',
        code: 'FIREBASE_NOT_CONFIGURED',
      });
    }

    const { characterId } = req.params;
    const updates = req.body;

    if (!characterId) {
      return res.status(400).json({ error: 'Missing characterId parameter.' });
    }

    const fb = getFirebaseAdmin();
    if (!fb) {
      return res.status(500).json({ error: 'Firebase Admin not initialized.' });
    }

    const userCharRef = fb.db
      .collection('users')
      .doc(session.uid)
      .collection('characters')
      .doc(characterId);

    const doc = await userCharRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Character not found.' });
    }

    const existing = doc.data() as CharacterProfile;
    const now = new Date().toISOString();

    const merged: CharacterProfile = {
      ...existing,
      ...updates,
      characterId,
      uid: session.uid,
      updatedAt: now,
    };

    const batch = fb.db.batch();
    batch.set(userCharRef, merged, { merge: true });

    // Also update in story characters subcollection if linked
    if (merged.storyId) {
      const storyCharRef = fb.db
        .collection('users')
        .doc(session.uid)
        .collection('stories')
        .doc(merged.storyId)
        .collection('characters')
        .doc(characterId);

      batch.set(storyCharRef, merged, { merge: true });
    }

    await batch.commit();

    return res.status(200).json({
      success: true,
      message: 'Character updated successfully.',
      character: merged,
    });
  } catch (err: any) {
    console.error('[Update Character Error]:', err);
    return res.status(500).json({
      error: err.message || 'Failed to update character.',
    });
  }
}

export async function handleDeleteCharacter(req: Request, res: Response) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    if (!isFirebaseConfigured()) {
      return res.status(503).json({
        error: 'Firebase is not yet configured.',
        code: 'FIREBASE_NOT_CONFIGURED',
      });
    }

    const { characterId } = req.params;
    if (!characterId) {
      return res.status(400).json({ error: 'Missing characterId parameter.' });
    }

    const fb = getFirebaseAdmin();
    if (!fb) {
      return res.status(500).json({ error: 'Firebase Admin not initialized.' });
    }

    const userCharRef = fb.db
      .collection('users')
      .doc(session.uid)
      .collection('characters')
      .doc(characterId);

    const doc = await userCharRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Character not found.' });
    }

    const charData = doc.data() as CharacterProfile;

    const batch = fb.db.batch();
    batch.delete(userCharRef);

    if (charData.storyId) {
      const storyCharRef = fb.db
        .collection('users')
        .doc(session.uid)
        .collection('stories')
        .doc(charData.storyId)
        .collection('characters')
        .doc(characterId);

      batch.delete(storyCharRef);
    }

    await batch.commit();

    // Recalculate characters count for user profile
    try {
      const countSnapshot = await fb.db
        .collection('users')
        .doc(session.uid)
        .collection('characters')
        .get();

      await fb.db
        .collection('users')
        .doc(session.uid)
        .update({
          charactersCreated: countSnapshot.size,
          updatedAt: new Date().toISOString(),
        });
    } catch (countErr) {
      console.warn('[Decrement Character Count Warning]:', countErr);
    }

    return res.status(200).json({
      success: true,
      message: 'Character deleted successfully.',
    });
  } catch (err: any) {
    console.error('[Delete Character Error]:', err);
    return res.status(500).json({
      error: err.message || 'Failed to delete character.',
    });
  }
}
