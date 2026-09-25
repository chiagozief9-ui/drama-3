export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  photoURL?: string;
  plan: 'free' | 'pro' | 'ultra';
  creditsUsed: number;
  storiesCreated: number;
  charactersCreated: number;
  scenesGenerated: number;
  createdAt?: string | number;
  updatedAt?: string | number;
}

export interface AuthResponse {
  success: boolean;
  user?: UserProfile;
  error?: string;
  message?: string;
}

export interface DashboardStats {
  storiesCreated: number;
  charactersCreated: number;
  scenesGenerated: number;
  creditsUsed: number;
  plan: string;
  fullName?: string;
  email?: string;
  createdAt?: string;
}

export interface ConfigStatusResponse {
  firebaseConfigured: boolean;
  missingKeys: string[];
  hasWebApiKey?: boolean;
  hasGeminiKey?: boolean;
  projectId?: string;
}

export interface StoryIdea {
  id: string;
  title: string;
  shortHook: string;
  oneLineSummary: string;
  mainConflict: string;
  twist: string;
  moralLesson: string;
  partTwoCliffhanger: string;
  suggestedCharacters: string[];
  suggestedSetting: string;
  whyItCanWork: string;
}

export interface DramaCharacter {
  name: string;
  role: string;
  description: string;
  attire: string;
}

export interface DramaScene {
  sceneNumber: number;
  title: string;
  location: string;
  action: string;
  dialogue: string;
  cameraDirection: string;
}

export type ProjectMode = 'short_form' | 'medium_form' | 'long_form';

export interface SceneBatchInfo {
  batchNumber: number;
  startScene: number;
  endScene: number;
  generatedAt: string;
  sceneCount: number;
}

export interface ActsBreakdown {
  act1?: { title?: string; summary?: string; sequences?: string[] };
  act2?: { title?: string; summary?: string; sequences?: string[] };
  act3?: { title?: string; summary?: string; sequences?: string[] };
  characterArcs?: { name: string; arc: string }[];
  productionPlan?: string;
  suggestedBatches?: { batchNumber: number; sceneRange: string; focus: string }[];
}

export interface DramaStory {
  storyId: string;
  uid?: string;
  title: string;
  storyIdea: string;
  storyType: string;
  visualStyle: string;
  aspectRatio: string;
  targetPlatform: string;
  estimatedDuration: string;
  durationLabel?: string;
  durationSeconds?: number;
  mainCharacterCount?: number;
  sceneDurationLabel?: string;
  sceneDurationSeconds?: number;
  targetSceneCount?: number;
  generatedSceneCount?: number;
  sceneCountStatus?: 'not_started' | 'partial' | 'complete';
  projectMode?: ProjectMode;
  sceneBatchingEnabled?: boolean;
  totalEstimatedScenes?: number;
  generatedSceneBatches?: SceneBatchInfo[];
  actsBreakdown?: ActsBreakdown;
  tone?: string;
  logline: string;
  mainTheme: string;
  moralLesson: string;
  hookScene: string;
  fullDramaScript: string;
  characterList: DramaCharacter[];
  sceneList: DramaScene[];
  partTwoCliffhanger: string;
  contentWarnings?: string;
  status: 'story_created' | 'characters_created' | 'prompts_created' | 'in_production' | 'completed';
  charactersCreated?: boolean;
  characterCount?: number;
  promptsCreated?: boolean;
  scenePromptCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ScenePrompt {
  sceneId: string;
  storyId: string;
  storyTitle?: string;
  uid?: string;
  sceneNumber: number;
  sceneTitle: string;
  sceneDuration: string;
  aspectRatio: string;
  visualStyle: string;
  location: string;
  timeOfDay: string;
  charactersInScene: string[] | string;
  allVisiblePeople: string;
  characterPositioning: string;
  mainAction: string;
  emotionalTone: string;
  dialogue: string;
  imagePrompt: string;
  videoPrompt: string;
  cameraMovement: string;
  lighting: string;
  backgroundDetails: string;
  costumeContinuity: string;
  facialExpressionInstructions: string;
  lipSyncInstruction: string;
  consistencyInstruction: string;
  negativePrompt: string;
  productionNotes: string;
  status: 'prompts_created';
  createdAt: string;
  updatedAt: string;
}

export interface GenerateScenePromptsRequest {
  aspectRatio: string;
  visualStyle: string;
  videoDuration: string;
  sceneDuration: string;
  promptDetailLevel: string;
  cameraStyle: string;
  platform: string;
  dialogueMode: string;
  consistencyMode: string;
  startSceneNumber?: number;
  endSceneNumber?: number;
  batchSize?: number;
  isBatchMode?: boolean;
  targetSceneCount?: number;
}

export interface CharacterProfile {
  characterId: string;
  storyId: string;
  storyTitle?: string;
  uid?: string;
  name: string;
  age: string | number;
  gender: string;
  roleInStory: string;
  role?: string;
  visualAppearance?: string;
  description?: string;
  wardrobeAttire?: string;
  actorAnchorPrompt?: string;
  relationshipToOtherCharacters: string;
  personality: string;
  emotionalBehavior: string;
  speakingStyle: string;
  voiceStyle: string;
  faceDescription: string;
  skinTone: string;
  hairstyle: string;
  bodyType: string;
  height: string;
  clothingStyle: string;
  mainOutfit: string;
  accessories: string;
  culturalIdentity: string;
  visualStyle: string;
  characterWeakness: string;
  characterGoal: string;
  secretOrConflict: string;
  firstSceneEmotion: string;
  characterBible: string;
  baseImagePrompt: string;
  negativePrompt: string;
  consistencyInstruction: string;
  status: 'character_created';
  referenceImageURL?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateCharactersRequest {
  visualStyle: string;
  consistencyLevel: string;
  culturalSetting: string;
  characterDetailLevel: string;
  mainCharacterCount?: number;
}

export interface GenerateIdeasRequest {
  niche?: string;
  storyType: string;
  audience: string;
  videoLength: string;
  aspectRatio: string;
  tone: string;
  numberOfIdeas: number;
}

export interface CreateStoryRequest {
  storyIdea: string;
  storyType: string;
  visualStyle: string;
  videoLength: string;
  aspectRatio: string;
  tone: string;
  targetPlatform: string;
  mainCharacterCount?: number;
}

export interface SoundEffectCue {
  time: string;
  cue: string;
  description: string;
}

export interface ProductionKit {
  captionHooks: string[];
  hashtags: string[];
  pinnedComment: string;
  soundEffects: SoundEffectCue[];
  soundtrackMood: string;
  editorInstructions: string[];
  colorGradingLut: string;
  generatedAt: string;
}

export interface ExportPackData {
  story: DramaStory & { productionKit?: ProductionKit };
  characters: CharacterProfile[];
  scenePrompts: ScenePrompt[];
  productionKit?: ProductionKit;
  exportedAt: string;
}
