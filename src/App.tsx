import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { SignupPage } from './pages/SignupPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { GenerateIdeasPage } from './pages/GenerateIdeasPage';
import { CreateStoryPage } from './pages/CreateStoryPage';
import { MyStoriesPage } from './pages/MyStoriesPage';
import { StoryDetailPage } from './pages/StoryDetailPage';
import { StoryCharactersPage } from './pages/StoryCharactersPage';
import { MyCharactersPage } from './pages/MyCharactersPage';
import { CharacterDetailPage } from './pages/CharacterDetailPage';
import { ScenePromptsPage } from './pages/ScenePromptsPage';
import { ScenePromptDetailPage } from './pages/ScenePromptDetailPage';
import { ExportPackPage } from './pages/ExportPackPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/ideas" element={<GenerateIdeasPage />} />
          <Route path="/create-story" element={<CreateStoryPage />} />
          <Route path="/stories" element={<MyStoriesPage />} />
          <Route path="/stories/:storyId" element={<StoryDetailPage />} />
          <Route path="/stories/:storyId/characters" element={<StoryCharactersPage />} />
          <Route path="/stories/:storyId/prompts" element={<ScenePromptsPage />} />
          <Route path="/stories/:storyId/prompts/:sceneId" element={<ScenePromptDetailPage />} />
          <Route path="/stories/:storyId/export" element={<ExportPackPage />} />
          <Route path="/characters" element={<MyCharactersPage />} />
          <Route path="/characters/:characterId" element={<CharacterDetailPage />} />
          {/* Fallback unknown paths to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
