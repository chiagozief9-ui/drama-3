import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { initFirebase, checkFirebaseConfig } from './server/firebase.js';
import {
  handleSignup,
  handleLogin,
  handleLogout,
  handleGetMe,
  handleGetConfigStatus,
} from './server/auth.js';
import { handleGetDashboardStats } from './server/dashboard.js';
import {
  handleGenerateIdeas,
  handleCreateDramaStory,
  handleSaveStory,
  handleGetStories,
  handleGetStoryById,
  handleDeleteStory,
} from './server/stories.js';
import {
  handleGenerateCharacters,
  handleSaveCharacters,
  handleGetStoryCharacters,
  handleGetAllUserCharacters,
  handleGetCharacterById,
  handleUpdateCharacter,
  handleDeleteCharacter,
} from './server/characters.js';
import {
  handleGenerateScenePrompts,
  handleSaveScenePrompts,
  handleGetStoryScenePrompts,
  handleGetScenePromptById,
  handleUpdateScenePrompt,
  handleDeleteScenePrompt,
} from './server/prompts.js';
import {
  handleGetExportPack,
  handleGenerateAiKit,
  handleMarkExported,
} from './server/export.js';
import { isGeminiConfigured } from './server/gemini.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Core Express middlewares
app.use(express.json());
app.use(cookieParser());

// Attempt Firebase initialization
const firebaseStatus = checkFirebaseConfig();
if (firebaseStatus.configured) {
  initFirebase();
} else {
  console.log(`[AI Drama Creator Server] Firebase credentials not yet set in environment. Missing: ${firebaseStatus.missing.join(', ')}`);
}

// Authentication & Dashboard API Routes
app.post('/api/auth/signup', handleSignup);
app.post('/api/auth/login', handleLogin);
app.post('/api/auth/logout', handleLogout);
app.get('/api/auth/me', handleGetMe);
app.get('/api/auth/config-status', handleGetConfigStatus);
app.get('/api/dashboard/stats', handleGetDashboardStats);

// Story Ideas & Drama Generation API Routes
app.post('/api/ideas/generate', handleGenerateIdeas);
app.post('/api/stories/create', handleCreateDramaStory);
app.post('/api/stories/save', handleSaveStory);
app.get('/api/stories', handleGetStories);
app.get('/api/stories/:storyId', handleGetStoryById);
app.delete('/api/stories/:storyId', handleDeleteStory);

// Character Generator & Character Bible API Routes (Prompt 3)
app.post('/api/stories/:storyId/characters/generate', handleGenerateCharacters);
app.post('/api/stories/:storyId/characters/save', handleSaveCharacters);
app.get('/api/stories/:storyId/characters', handleGetStoryCharacters);
app.get('/api/characters', handleGetAllUserCharacters);
app.get('/api/characters/:characterId', handleGetCharacterById);
app.put('/api/characters/:characterId', handleUpdateCharacter);
app.delete('/api/characters/:characterId', handleDeleteCharacter);

// Scene Prompts Generator API Routes (Prompt 4)
app.post('/api/stories/:storyId/prompts/generate', handleGenerateScenePrompts);
app.post('/api/stories/:storyId/prompts/save', handleSaveScenePrompts);
app.get('/api/stories/:storyId/prompts', handleGetStoryScenePrompts);
app.get('/api/stories/:storyId/prompts/:sceneId', handleGetScenePromptById);
app.put('/api/stories/:storyId/prompts/:sceneId', handleUpdateScenePrompt);
app.delete('/api/stories/:storyId/prompts/:sceneId', handleDeleteScenePrompt);

// Production Export Pack API Routes (Prompt 5)
app.get('/api/stories/:storyId/export', handleGetExportPack);
app.post('/api/stories/:storyId/export/ai-kit', handleGenerateAiKit);
app.post('/api/stories/:storyId/export/mark-exported', handleMarkExported);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    appName: 'AI Drama Creator',
    firebaseConfigured: firebaseStatus.configured,
    geminiConfigured: isGeminiConfigured(),
  });
});

async function startServer() {
  if (!isProduction) {
    // Development mode: Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve built static files
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎬 AI Drama Creator server running on http://0.0.0.0:${PORT}`);
    console.log(`🔒 Authentication backend initialized.`);
    if (!firebaseStatus.configured) {
      console.log(`⚠️  Waiting for Firebase backend credentials: ${firebaseStatus.missing.join(', ')}`);
    }
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
