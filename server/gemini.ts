import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import type { StoryIdea, DramaStory, CharacterProfile, ScenePrompt, ProductionKit, ActsBreakdown } from '../src/types.js';
import {
  parseDurationToSeconds,
  parseSceneDurationToSeconds,
  calculateTargetSceneCount,
  getProjectMode,
  calculateEstimatedScenes,
} from './duration.js';
import {
  getVisualStyleDefinition,
  getVisualStyleStoryDirectives,
  getVisualStyleCharacterDirectives,
  getVisualStyleScenePromptDirectives,
} from './visualStyles.js';

dotenv.config();

export function getGeminiApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY;
}

export function isGeminiConfigured(): boolean {
  const key = getGeminiApiKey();
  return Boolean(key && key.trim().length > 0);
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the backend environment.');
  }
  return new GoogleGenAI({ apiKey });
}

async function callWithRetry(params: {
  contents: string;
  temperature?: number;
}): Promise<string> {
  const ai = getGeminiClient();
  const models = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];

  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: {
            responseMimeType: 'application/json',
            temperature: params.temperature ?? 0.8,
          },
        });
        if (response.text) {
          return response.text;
        }
      } catch (err: any) {
        console.warn(`[Gemini] ${model} attempt ${attempt} warning:`, err.message || err.status);
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }
  }

  throw new Error('Gemini generation service is temporarily busy. Please retry in a few moments.');
}

export async function generateDramaIdeas(params: {
  niche?: string;
  storyType: string;
  audience: string;
  videoLength: string;
  aspectRatio: string;
  tone: string;
  numberOfIdeas: number;
}): Promise<StoryIdea[]> {
  const durationSec = parseDurationToSeconds(params.videoLength || '60 seconds');
  const mode = getProjectMode(durationSec);

  let modeInstruction = '';
  if (mode === 'long_form') {
    modeInstruction = `LONG-FORM PROJECT MODE (${params.videoLength}):
- Generate ideas structured for a feature drama, multi-part special, or 30m-2h African cinematic film.
- The narrative scope must include multi-layered family/community conflicts, subplots, evolving betrayal, and turning points rather than a single simple confrontation.`;
  } else if (mode === 'medium_form') {
    modeInstruction = `MEDIUM-FORM PROJECT MODE (${params.videoLength}):
- Generate ideas structured for a continuous 7-20 minute dramatic story with 3 distinct narrative acts (Inciting incident, Midpoint reversal, and Climax confrontation).`;
  } else {
    modeInstruction = `SHORT-FORM VIRAL MODE (${params.videoLength}):
- Generate fast-paced, high-voltage drama ideas with an instant 3-second hook tailored for TikTok / Reels.`;
  }

  const prompt = `You are a master African & Nollywood drama screenwriter and video director.
Generate ${params.numberOfIdeas} completely original, high-stakes African/Nigerian drama video ideas.

Requirements:
- Story Type: ${params.storyType}
- Target Audience: ${params.audience || 'African/Nigerian audience'}
- Video Length: ${params.videoLength || '60 seconds'}
- Aspect Ratio: ${params.aspectRatio || '9:16 vertical'}
- Emotional Tone: ${params.tone || 'Emotional'}
- Niche: ${params.niche || 'African Family & Relationship Drama'}

${modeInstruction}

CRITICAL DRAMA QUALITY RULES:
1. Ground every idea in authentic African/Nigerian cultural and relational dynamics (family pressure, in-law tensions, university sponsorship sacrifice, village vs city secrets, sudden wealth test, betrayal, spiritual/folktale consequences).
2. NO NARRATOR or voiceovers. These concepts must be designed for characters talking directly to each other face-to-face.
3. Every idea must have a shocking or high-emotion 3-second opening hook that immediately grabs attention.
4. Include a genuine plot twist and an undeniable dramatic climax or ending hook.
5. Provide realistic, natural character names (e.g., Amaka, Chinedu, Ngozi, Tunde, Mama Chinedu, Papa Ejike, Bisi, Uncle Femi).
6. Continuous Story: Every idea is ONE single continuous story, not split into episodes or parts.

You MUST respond ONLY with a valid JSON array of objects. No markdown formatting, no code fences, no extra text.
Each object must match this exact schema:
[
  {
    "id": "idea-1",
    "title": "Story Title",
    "shortHook": "The shocking opening dialogue or action in first 3 seconds",
    "oneLineSummary": "Concise summary of the storyline",
    "mainConflict": "The core dramatic dispute between characters",
    "twist": "The unexpected revelation or betrayal",
    "moralLesson": "The cultural or ethical lesson learned",
    "partTwoCliffhanger": "The shocking dramatic climax line or powerful ending hook",
    "suggestedCharacters": ["Character Name (Role, Age, Trait)", "Character Name (Role, Age, Trait)"],
    "suggestedSetting": "Atmospheric African setting (e.g., An affluent Lekki living room and a rustic village compound)",
    "whyItCanWork": "Why this drama will hook viewers and drive emotional comments"
  }
]`;

  const text = await callWithRetry({ contents: prompt, temperature: 0.85 });

  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (err: any) {
    console.error('[Gemini Ideas Parse Error]:', text, err);
    throw new Error('Failed to parse Gemini generated drama ideas. Please retry.');
  }
}

export async function generateFullDramaStory(params: {
  storyIdea: string;
  storyType: string;
  visualStyle: string;
  videoLength: string;
  aspectRatio: string;
  tone: string;
  targetPlatform: string;
  mainCharacterCount?: number;
}): Promise<Omit<DramaStory, 'storyId' | 'uid' | 'createdAt' | 'updatedAt' | 'status'>> {
  const durationSeconds = parseDurationToSeconds(params.videoLength || '60 seconds');
  const projectMode = getProjectMode(durationSeconds);
  const mainCharacterCount = params.mainCharacterCount && params.mainCharacterCount >= 2 ? params.mainCharacterCount : 5;
  const targetSceneCount = calculateTargetSceneCount(durationSeconds, 10);
  const sceneBatchingEnabled = projectMode === 'long_form' || (projectMode === 'medium_form' && durationSeconds >= 900);

  let structureDirectives = '';
  if (projectMode === 'long_form') {
    structureDirectives = `LONG-FORM CONTINUOUS DRAMA DIRECTIVES (${params.videoLength}, ~${targetSceneCount} total scenes):
1. Structure this project as ONE COMPLETE CONTINUOUS DRAMA STORY, not split into episodes or parts.
2. Outline the narrative across a comprehensive cinematic arc:
   - Act 1: The Status Quo, Rising Strains, Inciting Betrayal.
   - Act 2A: Escalating Complications, Family / Community Divided.
   - Midpoint Turning Point: Irreversible confrontation, hidden secret uncovered.
   - Act 2B: Rock Bottom, Spiraling Reckoning.
   - Act 3: Explosive Climax, The Public Confrontation, Sacred / Legal Judgment.
   - Climax / Ending Hook: Haunting lingering question or shocking dramatic conclusion.
3. Provide:
   - "actsBreakdown": {
       "act1": { "title": "Act 1 Title", "summary": "Setup & Inciting Betrayal", "sequences": ["Seq 1", "Seq 2"] },
       "act2": { "title": "Act 2 Title", "summary": "Rising Crisis & Midpoint", "sequences": ["Seq 3", "Seq 4", "Seq 5"] },
       "act3": { "title": "Act 3 Title", "summary": "Climax & Reckoning", "sequences": ["Seq 6", "Seq 7"] },
       "characterArcs": [{ "name": "Character", "arc": "From naive provider to resolute seeker of justice" }],
       "productionPlan": "Locations, atmospheric tone, lighting palette, and cultural wardrobe guidelines",
       "suggestedBatches": [
         { "batchNumber": 1, "sceneRange": "Scenes 1-20", "focus": "Act 1 Setup & Inciting Betrayal" },
         { "batchNumber": 2, "sceneRange": "Scenes 21-40", "focus": "Act 2 Confrontation & Midpoint" }
       ]
     }
4. In "fullDramaScript", provide the comprehensive continuous screenplay outline with dialogue samples for at least 5 key dramatic scenes.
5. In "sceneList", provide key sequential scenes numbered Scene 1, Scene 2, etc. that establish the continuous master narrative backbone.`;
  } else if (projectMode === 'medium_form') {
    structureDirectives = `MEDIUM-FORM CONTINUOUS DRAMA DIRECTIVES (${params.videoLength}, ~${targetSceneCount} total scenes):
1. Structure this project as ONE COMPLETE CONTINUOUS DRAMA STORY across 3 narrative acts:
   - Act 1: The Mask & Inciting Conflict (Opening Scenes)
   - Act 2: The Pressure Cooker & Midpoint Revelation (Middle Scenes)
   - Act 3: The Climax Reckoning & Dramatic Conclusion (Climax Scenes)
2. Provide:
   - "actsBreakdown": {
       "act1": { "title": "Act 1: The Façade Cracks", "summary": "Opening confrontation & hidden motives", "sequences": ["Family dinner tension", "Private ultimatum"] },
       "act2": { "title": "Act 2: The Exposure", "summary": "The secret breaks out in the open", "sequences": ["Confrontation in front of in-laws", "Desperate denial"] },
       "act3": { "title": "Act 3: The Reckoning", "summary": "The unavoidable truth and consequences", "sequences": ["Final confrontation", "Dramatic resolution"] },
       "characterArcs": [{ "name": "Character", "arc": "Emotional trajectory" }]
     }
3. Provide full dramatic screenplay dialogue for the entire story in "fullDramaScript".
4. In "sceneList", provide sequential scenes numbered Scene 1, Scene 2, etc.`;
  } else {
    structureDirectives = `SHORT-FORM CONTINUOUS DRAMA DIRECTIVES (${params.videoLength}, ~${targetSceneCount} scenes):
1. Pacing must be intense, fast-paced, and immediate.
2. Hook within the first 3 seconds with high emotional stakes.
3. Provide the full verbatim continuous script in "fullDramaScript" character by character.
4. In "sceneList", provide numbered scenes (Scene 1, Scene 2...).`;
  }

  const prompt = `You are an elite Nollywood screenplay writer and AI drama director.
Write a full, cinematic African drama production script based on this story idea:
"${params.storyIdea}"

Production Parameters:
- Story Type: ${params.storyType}
- Visual Style: ${params.visualStyle}
- Target Platform: ${params.targetPlatform}
- Estimated Duration: ${params.videoLength}
- Aspect Ratio: ${params.aspectRatio}
- Tone: ${params.tone}
- Project Mode: ${projectMode}
- Main Speaking Character Count: ${mainCharacterCount}

${structureDirectives}

${getVisualStyleStoryDirectives(params.visualStyle)}

CRITICAL MAIN SPEAKING CHARACTER COUNT RULE:
The user requested exactly ${mainCharacterCount} main speaking characters. Create exactly ${mainCharacterCount} main speaking characters. Do not create extra speaking characters. Background crowds, party guests, church members, office staff, market people, or extras can appear in scenes, but they must not be counted as main characters unless they speak.

NO EPISODE / NO PARTS RULE:
Do not divide the story into Part 1, Part 2, Part 3, Episode 1, Episode 2, or Episode 3.
The story must be one single continuous project based on the selected duration (${params.videoLength}).
Scene numbering must be continuous: Scene 1, Scene 2, Scene 3, Scene 4... continuously.

ABSOLUTE SCRIPT DIRECTIVES:
1. NO NARRATOR. ZERO NARRATOR VOICEOVER.
   - Do NOT write "Narrator:" or "Voiceover:".
   - Do NOT write voiceover summaries.
   - Every single line of dialogue MUST be spoken by an actual visible character to another character.
2. Dialogue format:
   Write dialogue directly as string lines:
   CharacterName: "Spoken line."
   Example:
   Amaka: "Chinedu, I sold food under the rain to pay your school fees."
   Chinedu: "Please, don't embarrass me here."
   Mama Chinedu: "So this is the woman who suffered for you?"
3. Natural spoken Nigerian/African English with authentic cultural expressions.
4. End on an electrifying dramatic climax hook or powerful dramatic conclusion.

You MUST respond ONLY with a valid JSON object matching this exact structure:
{
  "title": "Compelling African Drama Title",
  "logline": "1-2 sentence dramatic hook and conflict",
  "storyType": "${params.storyType}",
  "visualStyle": "${params.visualStyle}",
  "aspectRatio": "${params.aspectRatio}",
  "estimatedDuration": "${params.videoLength}",
  "targetPlatform": "${params.targetPlatform}",
  "tone": "${params.tone}",
  "mainTheme": "Core theme (e.g., Ingratitude, Family Loyalty, Sacred Oaths)",
  "moralLesson": "The moral or cultural lesson conveyed",
  "hookScene": "Exact opening 3-second tension moment and first spoken line",
  "fullDramaScript": "The verbatim script formatted character by character. Example: Amaka: \\"Chinedu!\\"\\n\\nChinedu: \\"Please!\\"",
  "actsBreakdown": {
    "act1": { "title": "Act 1 Title", "summary": "Summary", "sequences": ["Seq 1", "Seq 2"] },
    "act2": { "title": "Act 2 Title", "summary": "Summary", "sequences": ["Seq 3", "Seq 4"] },
    "act3": { "title": "Act 3 Title", "summary": "Summary", "sequences": ["Seq 5", "Seq 6"] },
    "characterArcs": [
      { "name": "Character Name", "arc": "Emotional trajectory" }
    ],
    "productionPlan": "Cinematography and locations notes",
    "suggestedBatches": [
      { "batchNumber": 1, "sceneRange": "Scenes 1-20", "focus": "Act 1 Setup" }
    ]
  },
  "characterList": [
    {
      "name": "Character Name",
      "role": "Role in drama (e.g., Main Character / Betrayed Wife)",
      "description": "Age, background, personality, and emotional stakes",
      "attire": "Specific clothing style (e.g., Red Ankara wrap dress with silver bead necklace)"
    }
  ],
  "sceneList": [
    {
      "sceneNumber": 1,
      "title": "Scene Title",
      "location": "Specific setting description",
      "action": "What the characters are physically doing",
      "dialogue": "Spoken dialogue in this scene",
      "cameraDirection": "Camera movement and angle (e.g., Close-up, medium shot, slow zoom)"
    }
  ],
  "partTwoCliffhanger": "The shocking final freeze-frame line or dramatic ending hook",
  "contentWarnings": "None or specific drama triggers"
}`;

  const text = await callWithRetry({ contents: prompt, temperature: 0.8 });

  try {
    const parsed = JSON.parse(text);

    let scriptString = '';
    if (Array.isArray(parsed.fullDramaScript)) {
      scriptString = parsed.fullDramaScript.join('\n\n');
    } else if (typeof parsed.fullDramaScript === 'string') {
      scriptString = parsed.fullDramaScript;
    }

    return {
      storyIdea: params.storyIdea,
      title: parsed.title || 'Untitled African Drama',
      logline: parsed.logline || '',
      storyType: parsed.storyType || params.storyType,
      visualStyle: parsed.visualStyle || params.visualStyle,
      aspectRatio: parsed.aspectRatio || params.aspectRatio,
      estimatedDuration: parsed.estimatedDuration || params.videoLength,
      durationLabel: params.videoLength,
      durationSeconds,
      mainCharacterCount,
      sceneDurationLabel: '10 seconds',
      sceneDurationSeconds: 10,
      targetSceneCount,
      generatedSceneCount: 0,
      sceneCountStatus: 'not_started',
      projectMode,
      sceneBatchingEnabled,
      totalEstimatedScenes: targetSceneCount,
      generatedSceneBatches: [],
      actsBreakdown: parsed.actsBreakdown || undefined,
      targetPlatform: parsed.targetPlatform || params.targetPlatform,
      tone: parsed.tone || params.tone,
      mainTheme: parsed.mainTheme || '',
      moralLesson: parsed.moralLesson || '',
      hookScene: parsed.hookScene || '',
      fullDramaScript: scriptString || 'Amaka: "Look at me!"\n\nChinedu: "Leave my house!"',
      characterList: Array.isArray(parsed.characterList) ? parsed.characterList : [],
      sceneList: Array.isArray(parsed.sceneList) ? parsed.sceneList : [],
      partTwoCliffhanger: parsed.partTwoCliffhanger || '',
      contentWarnings: parsed.contentWarnings || '',
    };
  } catch (err: any) {
    console.error('[Gemini Story Parse Error]:', text, err);
    throw new Error('Failed to parse Gemini generated drama script. Please retry.');
  }
}

export async function generateCharactersFromStory(params: {
  story: DramaStory;
  visualStyle?: string;
  consistencyLevel?: string;
  culturalSetting?: string;
  characterDetailLevel?: string;
  mainCharacterCount?: number;
}): Promise<Omit<CharacterProfile, 'createdAt' | 'updatedAt'>[]> {
  const { story } = params;
  const visualStyle = params.visualStyle || story.visualStyle || 'Cinematic Nollywood Style';
  const consistencyLevel = params.consistencyLevel || 'Ultra Consistent';
  const culturalSetting = params.culturalSetting || 'Modern Nigerian';
  const characterDetailLevel = params.characterDetailLevel || 'Production Ready';
  const targetCount = params.mainCharacterCount && params.mainCharacterCount >= 2
    ? params.mainCharacterCount
    : (story.mainCharacterCount && story.mainCharacterCount >= 2 ? story.mainCharacterCount : 5);

  const prompt = `You are a master African & Nollywood character designer, casting director, and AI image prompt specialist.
Generate a comprehensive, consistent cast of characters for the following African drama story.

STORY DETAILS:
- Title: ${story.title}
- Logline: ${story.logline}
- Story Type: ${story.storyType}
- Visual Style: ${visualStyle}
- Target Platform: ${story.targetPlatform}
- Aspect Ratio: ${story.aspectRatio || '9:16'}
- Main Theme: ${story.mainTheme}
- Moral Lesson: ${story.moralLesson}
- Requested Main Speaking Character Count: ${targetCount}

SCRIPT SUMMARY & SCRIPT EXCERPT:
${story.fullDramaScript}

CAST FROM SCRIPT:
${JSON.stringify(story.characterList || [])}

CONFIGURATION:
- Visual Style: ${visualStyle}
- Consistency Level: ${consistencyLevel} (Keep facial identity, skin tone, hair texture, body structure identical across all video scenes)
- Cultural Setting: ${culturalSetting}
- Character Detail Level: ${characterDetailLevel}

${getVisualStyleCharacterDirectives(visualStyle)}

CRITICAL MAIN SPEAKING CHARACTER COUNT RULE:
The user specified exactly ${targetCount} main speaking characters.
You MUST generate EXACTLY ${targetCount} main speaking character profiles in the JSON array. Do not generate more than ${targetCount}. Do not generate fewer than ${targetCount}.
Main speaking characters are ONLY the important people who talk in the story.
Background people are NOT counted.
Examples of background people that should NOT count as main characters:
- Club crowd
- Party guests
- Wedding guests
- Church members
- Market crowd
- Office workers
- School students
- Neighbors standing around
- Security guards who do not speak
- People dancing in the background
- Customers in a shop
- Crowd at an event

If mainCharacterCount is ${targetCount}, generate exactly ${targetCount} character objects in the array.

CRITICAL CHARACTER GENERATION RULES:
1. Ground every character in authentic African/Nigerian reality (cultural identity: Igbo, Yoruba, Hausa, Edo, Delta, Calabar, Ghanaian, etc. appropriate to setting).
2. NO NARRATOR. Only generate characters who physically appear and speak in the drama script.
3. Specific Physical Descriptions: DO NOT use vague labels like "beautiful woman" or "handsome man". Give precise facial architecture (high cheekbones, square jaw, soft oval face, broad nose bridge, full cupid's bow lips, almond-shaped warm brown eyes).
4. Specific African Attire: Detail fabrics, cuts, and accessories (e.g. Ankara print wax dress, navy blue senator suit with gold chest embroidery, George wrapper with beaded blouse, coral bead necklace, fila cap).
5. Comprehensive CHARACTER BIBLE for each character:
   Must provide a complete consistency specification including:
   - Fixed face structure
   - Skin tone (e.g. deep ebony, rich warm mahogany, warm bronze, golden caramel)
   - Eye shape & color
   - Nose shape
   - Mouth/lip description
   - Hairstyle & texture (e.g., knotless box braids to waist, low fade haircut with neat razor line, natural afro puffs, styled gele headwrap)
   - Body type & height
   - Age appearance
   - Clothing identity & jewelry
   - Expressions when angry, sad, happy, shocked, or guilty
   - Explicit declaration of WHAT MUST NEVER CHANGE across all generated scenes.
6. CONSISTENCY INSTRUCTION:
   A reusable master command for image/video generators (e.g. "Use [Name]'s approved character reference and keep their exact same face, skin tone, hairstyle, body structure, and identity across all scenes. Do not change facial features or age. Do not make them look like a different person.").
7. BASE IMAGE PROMPT:
   A complete, high-definition portrait prompt ready for FLUX / Midjourney. Must include:
   - Name, age, gender, Nigerian/African identity
   - Exact facial structure, skin tone, eye shape, hairstyle
   - Clothing & jewelry
   - Dramatic facial expression matching their role
   - Visual style: ${visualStyle}
   - Cinematic volumetric lighting (warm rim light, filmic Nollywood color grade)
   - 85mm portrait lens, shallow depth of field, sharp focus, 8k resolution
   - Aspect ratio: --ar 9:16
8. NEGATIVE PROMPT:
   Explicit anti-drift negative prompt (e.g., "Do not change face, do not alter skin tone, do not change hairstyle, do not add extra limbs or distorted fingers, no blur, no westernized facial distortion, no plastic skin, no unrealistic anatomy, no low quality").

OUTPUT FORMAT:
Respond ONLY with a valid JSON array of character objects containing exactly ${targetCount} characters. No markdown, no conversational text.
Schema:
[
  {
    "characterId": "char_1",
    "name": "Full Name",
    "age": "28",
    "gender": "Female",
    "roleInStory": "Lead / Betrayed Wife",
    "relationshipToOtherCharacters": "Wife of Chinedu, daughter-in-law of Mama Chinedu",
    "personality": "Determined, sacrificial, fiercely loyal until pushed past her limit",
    "emotionalBehavior": "Masks pain with dignity; speaks with restrained fury when betrayed",
    "speakingStyle": "Articulate Nigerian English with sharp, emotionally charged cadence",
    "voiceStyle": "Resonant, warm alto with emotional depth",
    "faceDescription": "Soft oval face, high sculpted cheekbones, deep-set expressive almond eyes, full lips",
    "skinTone": "Rich warm mahogany brown skin with golden undertones",
    "hairstyle": "Neat center-parted shoulder-length cornrow braids with clean edges",
    "bodyType": "Slim athletic build",
    "height": "5ft 7in",
    "clothingStyle": "Modern Nigerian professional mixed with elegant Ankara touches",
    "mainOutfit": "Emerald green and gold Ankara peplum top with matching slim pencil skirt",
    "accessories": "Delicate gold drop earrings and a modest gold wedding band",
    "culturalIdentity": "Igbo Nigerian woman living in Lagos",
    "visualStyle": "${visualStyle}",
    "characterWeakness": "Forgives too easily and sacrifices her own dreams for her family",
    "characterGoal": "Protect her children's future and build legitimate generational stability",
    "secretOrConflict": "Discovered her husband used her land sale money to buy a luxury apartment for another woman",
    "firstSceneEmotion": "Shock turning into cold, heartbroken confrontation",
    "characterBible": "Complete character bible description as detailed in instructions...",
    "baseImagePrompt": "Full AI portrait prompt...",
    "negativePrompt": "Full negative prompt...",
    "consistencyInstruction": "Full consistency instruction..."
  }
]`;

  const text = await callWithRetry({ contents: prompt, temperature: 0.7 });

  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) {
      throw new Error('Gemini response was not an array of characters.');
    }

    // Strictly enforce exact target character count
    let finalChars = parsed;
    if (finalChars.length > targetCount) {
      finalChars = finalChars.slice(0, targetCount);
    }

    return finalChars.map((c: any, index: number) => {
      const charId = `char_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`;
      return {
        characterId: c.characterId || charId,
        storyId: story.storyId,
        storyTitle: story.title,
        name: c.name || `Character ${index + 1}`,
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
        hairstyle: c.hairstyle || 'Natural African hairstyle',
        bodyType: c.bodyType || 'Medium build',
        height: c.height || 'Average',
        clothingStyle: c.clothingStyle || 'Traditional & Contemporary African',
        mainOutfit: c.mainOutfit || '',
        accessories: c.accessories || '',
        culturalIdentity: c.culturalIdentity || culturalSetting,
        visualStyle: c.visualStyle || visualStyle,
        characterWeakness: c.characterWeakness || '',
        characterGoal: c.characterGoal || '',
        secretOrConflict: c.secretOrConflict || '',
        firstSceneEmotion: c.firstSceneEmotion || '',
        characterBible: c.characterBible || '',
        baseImagePrompt: c.baseImagePrompt || '',
        negativePrompt: c.negativePrompt || 'Do not change face, do not change skin tone, do not change hairstyle, no blur, no distorted features, no extra fingers.',
        consistencyInstruction: c.consistencyInstruction || `Use ${c.name || 'this character'}'s approved reference and keep facial structure, skin tone, and hairstyle identical across all scenes.`,
        status: 'character_created' as const,
      };
    });
  } catch (err: any) {
    console.error('[Gemini Character Parse Error]:', text, err);
    throw new Error('Failed to parse Gemini generated characters. Please retry.');
  }
}

/**
 * Generate Scene Image Prompts and Video Prompts from a Story and its Characters (Prompt 4)
 */
export async function generateScenePromptsFromStoryAndCharacters(options: {
  story: DramaStory;
  characters: CharacterProfile[];
  aspectRatio?: string;
  visualStyle?: string;
  videoDuration?: string;
  sceneDuration?: string;
  promptDetailLevel?: string;
  cameraStyle?: string;
  platform?: string;
  dialogueMode?: string;
  consistencyMode?: string;
  startSceneNumber?: number;
  endSceneNumber?: number;
  batchSize?: number;
  isBatchMode?: boolean;
  targetSceneCount?: number;
}): Promise<Omit<ScenePrompt, 'uid' | 'createdAt' | 'updatedAt'>[]> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('Gemini API key is not configured on the server.');
  }

  const {
    story,
    characters,
    aspectRatio = story.aspectRatio || '9:16',
    visualStyle = story.visualStyle || 'Cinematic Nollywood Style',
    videoDuration = story.durationLabel || story.estimatedDuration || '60 seconds',
    sceneDuration = story.sceneDurationLabel || '10 seconds',
    promptDetailLevel = 'Production Ready',
    cameraStyle = 'Mixed cinematic camera',
    platform = story.targetPlatform || 'TikTok',
    dialogueMode = 'Short emotional dialogue',
    consistencyMode = 'Ultra Consistent',
    startSceneNumber,
    endSceneNumber,
    batchSize,
    isBatchMode,
  } = options;

  // Calculate duration & exact scene count
  const durationSec = parseDurationToSeconds(videoDuration);
  const sceneDurationSec = parseSceneDurationToSeconds(sceneDuration);
  const targetSceneCount = options.targetSceneCount && options.targetSceneCount > 0
    ? options.targetSceneCount
    : calculateTargetSceneCount(durationSec, sceneDurationSec);
  const projectMode = getProjectMode(durationSec);

  // Determine scene range
  let startNum = startSceneNumber && startSceneNumber > 0 ? startSceneNumber : 1;
  let endNum = endSceneNumber;

  if (isBatchMode || batchSize) {
    const size = batchSize && batchSize > 0 ? batchSize : 10;
    if (!endNum || endNum < startNum) {
      endNum = Math.min(targetSceneCount, startNum + size - 1);
    }
  } else if (!endNum) {
    endNum = targetSceneCount;
  }

  if (endNum < startNum) {
    endNum = startNum;
  }

  // Build character profiles context string
  const characterContexts = characters.map((c, idx) => {
    return `CHARACTER ${idx + 1}:
- Name: ${c.name}
- Age: ${c.age} | Gender: ${c.gender} | Role: ${c.roleInStory}
- Cultural Identity: ${c.culturalIdentity}
- Face Structure: ${c.faceDescription}
- Skin Tone: ${c.skinTone}
- Hairstyle: ${c.hairstyle}
- Body Type & Height: ${c.bodyType}, ${c.height}
- Main Outfit: ${c.mainOutfit}
- Accessories: ${c.accessories}
- Voice & Speaking Style: ${c.voiceStyle}, ${c.speakingStyle}
- Character Bible: ${c.characterBible}
- Consistency Instruction: ${c.consistencyInstruction}`;
  }).join('\n\n');

  const storyContext = `DRAMA STORY DETAILS:
- Title: ${story.title}
- Logline: ${story.logline || story.storyIdea}
- Story Type: ${story.storyType}
- Target Platform: ${platform}
- Visual Style: ${visualStyle}
- Aspect Ratio: ${aspectRatio}
- Video Duration: ${videoDuration} (Exact Required Total Scenes: ${targetSceneCount}, per-scene length: ${sceneDuration})
- Tone: ${story.tone || 'Emotional Family Conflict'}
- Story Script Outline:
${story.sceneList ? story.sceneList.map(s => `Scene ${s.sceneNumber}: [${s.location}] ${s.title} | Action: ${s.action} | Dialogue: ${s.dialogue}`).join('\n') : story.storyIdea}`;

  const ai = new GoogleGenAI({ apiKey });
  const candidateModels = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.1-flash-lite'];

  // Helper to generate a single sub-batch (up to 15 scenes)
  async function generateSceneChunk(
    chunkStart: number,
    chunkEnd: number
  ): Promise<Omit<ScenePrompt, 'uid' | 'createdAt' | 'updatedAt'>[]> {
    const chunkCount = chunkEnd - chunkStart + 1;

    const systemInstruction = `You are a world-class AI Cinematographer and Nollywood Drama Director specializing in Midjourney / FLUX AI Image Prompt Engineering and Runway / Luma / Kling / Sora AI Video Prompt Engineering.
You generate production-ready, COPY-READY prompt suites for African and Nigerian cinematic drama videos.

CRITICAL DURATION & SCENE COUNT DIRECTIVES:
The selected total duration is ${videoDuration}. The selected scene duration is ${sceneDuration}. The required scene count is exactly ${targetSceneCount}. Generate exactly the requested scene range. Do not generate fewer scenes. Do not split into Part 1, Part 2, or episodes. Use continuous scene numbering only.
Generate scenes ${chunkStart} to ${chunkEnd} only. Continue the same story naturally. Do not restart the story. Do not call this Part 2 or Episode 2.

CRITICAL ARCHITECTURE RULES:
1. COMPLETE, SELF-CONTAINED PROMPTS:
   - The user must be able to click "Copy Image Prompt" and paste it directly into an image generator without needing to add anything else.
   - The user must be able to click "Copy Video Prompt" and paste it directly into a video generator without needing to add anything else.
   - Do NOT write placeholder shortcuts like "Use Amaka's character bible" or "Refer to Character 1".
   - The full physical identity, facial architecture, skin tone, hairstyle, attire, positioning, and consistency instructions MUST be explicitly spelled out directly inside both the imagePrompt and the videoPrompt!

2. IMAGE PROMPT COMPLETE RULE (imagePrompt):
   - Every single imagePrompt must be ONE complete paragraph that contains:
     * Scene number & Aspect ratio (e.g. "Scene ${chunkStart}, ${aspectRatio} vertical aspect ratio, ${visualStyle}")
     * Visual Style Wording: Strictly include the following style wording for "${visualStyle}": "${getVisualStyleDefinition(visualStyle).imagePromptGuidance}". Style directions: ${getVisualStyleDefinition(visualStyle).promptDirection.join(', ')}. Avoid: ${getVisualStyleDefinition(visualStyle).avoidDirectives.join(', ')}.
     * Setting location and time of day (e.g. "inside an upscale modern Lagos living room at golden hour")
     * ALL visible characters and background people (e.g. colleagues, friends, family members, market vendors)
     * For EVERY character visible: their full name, age, cultural identity, facial architecture, skin tone, hairstyle, body type, exact attire, jewelry/accessories, facial expression, body posture, and precise position in the frame (left, right, center, foreground, background)
     * Character consistency instruction for each character (e.g. "Keep Amaka's exact same face, skin tone, hairstyle, body type, and gold earrings consistent from her approved character bible.")
     * Outfit continuity or outfit change (e.g. "Amaka keeps her approved face and braided hair, but in this scene has changed into a formal blue silk blouse")
     * Lighting, atmosphere, shadows, depth of field, camera shot type (e.g. "dramatic low-key lighting, rim light on hair, cinematic medium shot, 35mm lens, sharp focus on eyes")
     * Negative prompt details included at the end (e.g. "Negative prompt: wrong face, changed identity, wrong skin tone, wrong hairstyle, extra fingers, distorted hands, deformed face, blurry image, wrong age, wrong gender, duplicate characters, extra unwanted people, watermark, logo, text.")

3. VIDEO PROMPT COMPLETE RULE (videoPrompt):
   - Every single videoPrompt must be ONE complete paragraph that contains:
     * Scene duration, style, and aspect ratio (e.g. "${sceneDuration} cinematic Nollywood drama video, ${aspectRatio} aspect ratio. Scene ${chunkStart}...")
     * Exact setting and time of day
     * All visible characters with full identity descriptions and consistency instructions
     * Character movements, gestures, eye contact, and emotional body language
     * THE EXACT DIALOGUE SPOKEN BY THE CHARACTERS MUST BE EMBEDDED INSIDE THE VIDEO PROMPT ITSELF!
       Example format inside videoPrompt:
       "Amaka looks directly at Chinedu and says, 'Chinedu, I sold food under the rain to pay your school fees.' Her lips move naturally with the exact dialogue. Chinedu looks down in shame and replies, 'Please, don't embarrass me here.' His lips move naturally with the exact dialogue."
     * Natural lip movement instructions (e.g. "Characters speak directly with natural lip movement and authentic Nigerian English/Pidgin cadence.")
     * Visual Style Animation Movement: For "${visualStyle}", strictly animate characters according to: "${getVisualStyleDefinition(visualStyle).videoPromptGuidance}".
     * Camera movement (e.g. "Slow cinematic push-in tracking shot toward Amaka's tearful face.")
     * Lighting and environmental movement (e.g. "Curtains fluttering softly in the background, warm interior chandelier lighting.")
     * NO NARRATOR. NO VOICEOVER. Characters speak directly.
     * Negative prompt details included at the end (e.g. "Negative prompt: poor lip sync, wrong face, changed identity, wrong skin tone, wrong hairstyle, extra fingers, distorted hands, deformed face, blurry image, wrong age, wrong gender, duplicate characters, extra unwanted people, watermark, logo, text, ${getVisualStyleDefinition(visualStyle).negativePromptAdditions.join(', ')}.")

4. DIALOGUE FIELD:
   - Provide 1 to 3 short, punchy, dramatic lines per scene.
   - Format:
     Amaka: "Chinedu, I sold food under the rain for you."
     Chinedu: "Please, don't embarrass me here."
   - ZERO narrator lines. ZERO voiceover lines.
   - The exact same dialogue lines MUST be embedded inside the videoPrompt.

5. TOTAL SCENES FOR THIS CHUNK:
   - Generate EXACTLY ${chunkCount} consecutive scenes, starting numbered from Scene ${chunkStart} up to Scene ${chunkEnd}.
   - Maintain continuous narrative escalation without splitting into parts or episodes.

6. OUTPUT FORMAT:
   - Return STRICT JSON ONLY. No markdown backticks, no prose outside JSON.
   - Format:
   {
     "scenes": [
       {
         "sceneId": "scene_${chunkStart}",
         "sceneNumber": ${chunkStart},
         "sceneTitle": "Scene ${chunkStart}: ...",
         "sceneDuration": "${sceneDuration}",
         "aspectRatio": "${aspectRatio}",
         "visualStyle": "${visualStyle}",
         "location": "...",
         "timeOfDay": "...",
         "charactersInScene": ["Character Name 1", "Character Name 2"],
         "allVisiblePeople": "Description of all main and background people visible",
         "characterPositioning": "Where each person is placed in the frame",
         "mainAction": "Core action and dramatic movement",
         "emotionalTone": "Emotional intensity and mood",
         "dialogue": "Character 1: \\"Dialogue line\\"\\nCharacter 2: \\"Dialogue line\\"",
         "imagePrompt": "Full self-contained copy-ready image prompt with ALL details, character descriptions, and negative prompt",
         "videoPrompt": "Full self-contained copy-ready video prompt with embedded dialogue, lip sync, camera movement, and negative prompt",
         "cameraMovement": "Camera motion description",
         "lighting": "Lighting setup and color temperature",
         "backgroundDetails": "Set pieces, props, cultural background elements",
         "costumeContinuity": "Notes on clothing continuity or scene-specific costume change",
         "facialExpressionInstructions": "Micro-expressions and eye movements for AI video",
         "lipSyncInstruction": "Natural lip sync and speech cadence instruction",
         "consistencyInstruction": "Facial architecture and identity lock statement",
         "negativePrompt": "Full negative prompt string",
         "productionNotes": "Director's notes on pacing and tension"
       }
     ]
   }`;

    const prompt = `GENERATE PRODUCTION-READY CONTINUOUS SCENE PROMPTS:

${storyContext}

APPROVED CAST & CHARACTER BIBLES:
${characterContexts}

CONFIGURATIONS:
- Aspect Ratio: ${aspectRatio}
- Visual Style: ${visualStyle}
- Target Video Duration: ${videoDuration} (Project Mode: ${projectMode})
- Per-Scene Duration: ${sceneDuration}
- Target Chunk: Scene ${chunkStart} to Scene ${chunkEnd} (Generate exactly ${chunkCount} scenes)
- Total Project Scene Requirement: ${targetSceneCount}
- Prompt Detail Level: ${promptDetailLevel}
- Camera Style: ${cameraStyle}
- Dialogue Mode: ${dialogueMode}
- Consistency Mode: ${consistencyMode}

${getVisualStyleScenePromptDirectives(visualStyle)}

The selected total duration is ${videoDuration}. The selected scene duration is ${sceneDuration}. The required scene count is exactly ${targetSceneCount}. Generate exactly the requested scene range (${chunkStart} to ${chunkEnd}). Do not generate fewer scenes. Do not split into Part 1, Part 2, or episodes. Use continuous scene numbering only.
Generate scenes ${chunkStart} to ${chunkEnd} only. Continue the same story naturally. Do not restart the story. Do not call this Part 2 or Episode 2.`;

    let response: any;
    let lastErr: any;

    for (const model of candidateModels) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          response = await ai.models.generateContent({
            model,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
              systemInstruction: { parts: [{ text: systemInstruction }] },
              temperature: 0.7,
              responseMimeType: 'application/json',
            },
          });
          if (response && response.text) break;
        } catch (err: any) {
          lastErr = err;
          console.warn(`[Gemini ${model} chunk ${chunkStart}-${chunkEnd} attempt ${attempt} error]:`, err.message);
          await new Promise((r) => setTimeout(r, 1500));
        }
      }
      if (response && response.text) break;
    }

    if (!response || !response.text) {
      throw lastErr || new Error(`Failed to generate scenes ${chunkStart}-${chunkEnd}.`);
    }

    let cleanJson = (response.text || '').trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```/, '').replace(/```$/, '').trim();
    }

    const parsed = JSON.parse(cleanJson);
    const scenesArray = Array.isArray(parsed) ? parsed : (parsed.scenes || parsed.scenePrompts || []);

    if (!Array.isArray(scenesArray) || scenesArray.length === 0) {
      throw new Error(`No scenes returned for range ${chunkStart}-${chunkEnd}.`);
    }

    return scenesArray.map((s: any, idx: number) => {
      const assignedNum = chunkStart + idx;
      const charsInScene = Array.isArray(s.charactersInScene)
        ? s.charactersInScene
        : typeof s.charactersInScene === 'string'
        ? s.charactersInScene.split(',').map((c: string) => c.trim())
        : characters.map((c) => c.name);

      return {
        sceneId: s.sceneId || `scene_${Date.now()}_${assignedNum}_${Math.random().toString(36).substring(2, 6)}`,
        storyId: story.storyId,
        storyTitle: story.title,
        sceneNumber: assignedNum,
        sceneTitle: s.sceneTitle || `Scene ${assignedNum}: Dramatic Confrontation`,
        sceneDuration: s.sceneDuration || sceneDuration,
        aspectRatio: s.aspectRatio || aspectRatio,
        visualStyle: s.visualStyle || visualStyle,
        location: s.location || 'Modern Nigerian Setting',
        timeOfDay: s.timeOfDay || 'Day',
        charactersInScene: charsInScene,
        allVisiblePeople: s.allVisiblePeople || charsInScene.join(', '),
        characterPositioning: s.characterPositioning || 'Characters positioned in conversational tension',
        mainAction: s.mainAction || 'Dramatic confrontation',
        emotionalTone: s.emotionalTone || 'Tense, emotional',
        dialogue: s.dialogue || '',
        imagePrompt: s.imagePrompt || '',
        videoPrompt: s.videoPrompt || '',
        cameraMovement: s.cameraMovement || cameraStyle,
        lighting: s.lighting || 'Dramatic cinematic Nollywood lighting',
        backgroundDetails: s.backgroundDetails || 'Authentic Nigerian environment',
        costumeContinuity: s.costumeContinuity || 'Approved character attire maintained',
        facialExpressionInstructions: s.facialExpressionInstructions || 'Tense, emotional expression',
        lipSyncInstruction: s.lipSyncInstruction || 'Natural lip movement matching exact dialogue',
        consistencyInstruction: s.consistencyInstruction || 'Maintain character facial structure and identity from character bible',
        negativePrompt: s.negativePrompt || 'wrong face, changed identity, wrong skin tone, wrong hairstyle, extra fingers, distorted hands, deformed face, blurry image, wrong age, wrong gender, duplicate characters, extra unwanted people, watermark, logo, text.',
        productionNotes: s.productionNotes || '',
        status: 'prompts_created' as const,
      };
    });
  }

  // Create technical sub-chunks of up to 15 scenes each so Gemini's JSON response is never truncated
  const chunks: { start: number; end: number }[] = [];
  let curr = startNum;
  while (curr <= endNum) {
    const nextEnd = Math.min(endNum, curr + 14);
    chunks.push({ start: curr, end: nextEnd });
    curr = nextEnd + 1;
  }

  const allPrompts: Omit<ScenePrompt, 'uid' | 'createdAt' | 'updatedAt'>[] = [];
  for (const ch of chunks) {
    const chunkPrompts = await generateSceneChunk(ch.start, ch.end);
    allPrompts.push(...chunkPrompts);
  }

  // Validate sequential numbering and continuity
  return allPrompts.map((s, index) => {
    const seqNum = startNum + index;
    return {
      ...s,
      sceneNumber: seqNum,
      sceneTitle: s.sceneTitle && s.sceneTitle.includes('Scene ') ? s.sceneTitle : `Scene ${seqNum}: ${s.sceneTitle || 'Dramatic Confrontation'}`,
    };
  });
}

/**
 * Generate AI Social Viral Kit, Sound Design Cues, and Video Editor Notes
 */
export async function generateProductionKit(params: {
  story: DramaStory;
  characters: CharacterProfile[];
  scenePrompts: ScenePrompt[];
}): Promise<ProductionKit> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  const { story, characters, scenePrompts } = params;

  const charactersSummary = characters
    .map(c => `- ${c.name} (${c.roleInStory}): ${c.speakingStyle}, emotional state: ${c.firstSceneEmotion}`)
    .join('\n');

  const scenesSummary = scenePrompts
    .map(s => `Scene ${s.sceneNumber}: [${s.sceneDuration}] ${s.sceneTitle} (${s.location}) - Action: ${s.mainAction}. Dialogue: ${s.dialogue}`)
    .join('\n');

  const systemInstruction = `You are a veteran Nollywood creative director, viral social media strategist (TikTok / Instagram Reels / YouTube Shorts), and senior film editor.
Your task is to take a complete African AI drama production and generate:
1. Three (3) viral caption options with curiosity gap hooks, emojis, and cliffhangers tailored for high retention and comment velocity.
2. Twenty (20) high-traffic, hyper-targeted hashtags covering African drama, Nollywood cinema, AI filmmaking, and emotional storytelling.
3. One (1) pinned comment question designed to spark furious debate in the comment section (e.g., "Was Amaka right to sell the shop or should she have told their mother? Drop your thoughts 👇").
4. A chronological list of sound effects and Foley cues (soundEffects: [{ time, cue, description }]) that elevate the drama, tension, shock hits, and cultural ambiance.
5. Soundtrack & Music Mood recommendation detailing traditional African instruments, tension pads, tempo shifts, and emotional Nollywood cinema motifs.
6. Five (5) practical video editor instructions for CapCut / Premiere Pro / DaVinci Resolve covering pacing, whip cuts, zoom punch-ins on dramatic beats, subtitle animation, and hook retention in the first 2 seconds.
7. Color Grading LUT specification (e.g., Warm Golden Lagos Glow with rich deep shadows and vibrant Ankara textile saturation).

You MUST output ONLY valid JSON matching this exact schema:
{
  "captionHooks": ["string", "string", "string"],
  "hashtags": ["#tag1", "#tag2", ...],
  "pinnedComment": "string",
  "soundEffects": [
    { "time": "00:00 - 00:03", "cue": "name of sound", "description": "detailed audio texture" }
  ],
  "soundtrackMood": "string",
  "editorInstructions": ["string", "string", "string", "string", "string"],
  "colorGradingLut": "string"
}`;

  const prompt = `STORY TITLE: ${story.title}
STORY TYPE: ${story.storyType}
LOGLINE: ${story.logline}
MAIN THEME: ${story.mainTheme}
MORAL LESSON: ${story.moralLesson}
HOOK SCENE: ${story.hookScene}
DRAMATIC CLIMAX & ENDING HOOK: ${story.partTwoCliffhanger}
TARGET PLATFORM: ${story.targetPlatform || 'TikTok'}
ESTIMATED DURATION: ${story.estimatedDuration}

CAST OVERVIEW:
${charactersSummary}

SCENES OVERVIEW:
${scenesSummary}

Generate the complete production kit JSON now.`;

  const ai = new GoogleGenAI({ apiKey });
  const candidateModels = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.1-flash-lite'];
  let response: any;
  let lastErr: any;

  for (const model of candidateModels) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            systemInstruction: { parts: [{ text: systemInstruction }] },
            temperature: 0.7,
            responseMimeType: 'application/json',
          },
        });
        if (response && response.text) break;
      } catch (err: any) {
        lastErr = err;
        console.warn(`[Gemini Production Kit ${model} attempt ${attempt} error]:`, err.message);
        await new Promise((r) => setTimeout(r, 1200));
      }
    }
    if (response && response.text) break;
  }

  if (!response || !response.text) {
    throw lastErr || new Error('All Gemini models failed to generate production kit.');
  }

  try {
    let cleanJson = response.text.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.slice(7);
    }
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.slice(3);
    }
    if (cleanJson.endsWith('```')) {
      cleanJson = cleanJson.slice(0, -3);
    }
    const parsed = JSON.parse(cleanJson.trim());

    return {
      captionHooks: Array.isArray(parsed.captionHooks) && parsed.captionHooks.length > 0
        ? parsed.captionHooks
        : [
            `She thought her brother went to university... but what she found in his room destroyed the entire family 💔😭 Watch till the end! #NollywoodDrama`,
            `The moment she dropped the market basin, her whole world shattered 😱 Is family loyalty worth dying for? Watch the full continuous drama! 👇`,
            `Blood is thicker than water until money enters the room 💀 What would you do if your own brother did this to you? Tell us in the comments! 👇`,
          ],
      hashtags: Array.isArray(parsed.hashtags) && parsed.hashtags.length > 0
        ? parsed.hashtags
        : [
            '#Nollywood', '#NollywoodDrama', '#AfricanStories', '#AIDrama', '#TikTokShortFilm',
            '#FamilyBetrayal', '#AfricanMovies', '#CinemaNollywood', '#ViralStory', '#DramaSeries',
            '#LagosDrama', '#Storytime', '#ShortFilm', '#AfricanCinema', '#TrendingDrama',
            '#MoralStory', '#PlotTwist', '#NigerianStories', '#EmotionalStory', '#MovieClip'
          ],
      pinnedComment: parsed.pinnedComment || 'Was she right to react like this or did she go too far? Drop your honest opinion below! 👇🍿',
      soundEffects: Array.isArray(parsed.soundEffects) && parsed.soundEffects.length > 0
        ? parsed.soundEffects
        : [
            { time: '00:00 - 00:03', cue: 'Atmospheric Lagos Ambience', description: 'Distant generator hum, street chatter, birds, fading out quickly.' },
            { time: '00:05 - 00:08', cue: 'Dramatic Shock Stinger', description: 'Low sub-bass drop followed by an authentic African talking drum strike.' },
            { time: '00:15 - 00:20', cue: 'Object Crash / Basin Fall', description: 'Sharp metallic clatter on hard concrete floor echoing with tension.' },
            { time: '00:45 - 00:60', cue: 'Tension Climax Crescendo', description: 'Rising ominous cello strings and urgent heartbeat pulse leading into sudden cliffhanger silence.' },
          ],
      soundtrackMood: parsed.soundtrackMood || 'Traditional African strings (Kora/Oja flute) blended with cinematic modern suspense pads and heavy heartbeat percussion.',
      editorInstructions: Array.isArray(parsed.editorInstructions) && parsed.editorInstructions.length > 0
        ? parsed.editorInstructions
        : [
            'Hook in 0-2 seconds: Start directly with the character gasping or screaming, cut before dialogue reveals context.',
            'Use rapid 1.2x micro-zoom punches on character facial expressions at moments of high confrontation.',
            'Keep on-screen captions centered in yellow (#FACC15) with black borders, bold font (Montserrat/Cabinet), 2-3 words per burst.',
            'Cut video generator watermark/artefacts at frame edges, crop precisely to 9:16 vertical viewport.',
            'End abruptly on the final cliffhanger line: Cut audio completely on the final word for maximum comment demand.',
          ],
      colorGradingLut: parsed.colorGradingLut || 'Cinematic West African Warmth: Rich golden highlights, deep cocoa skin tone enhancement, high contrast, warm amber ambient tint.',
      generatedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    console.error('[Gemini Production Kit Parse Error]:', response.text, err);
    throw new Error('Failed to parse AI production kit.');
  }
}

