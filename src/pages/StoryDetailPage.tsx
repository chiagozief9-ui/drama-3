import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Copy,
  CheckCircle,
  Users,
  Clapperboard,
  Camera,
  Flame,
  Crown,
  AlertTriangle,
  Trash2,
  Share2,
  Film,
  Download,
} from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { apiFetch } from '../utils/api';
import type { DramaStory } from '../types';

export const StoryDetailPage: React.FC = () => {
  const { storyId } = useParams<{ storyId: string }>();
  const navigate = useNavigate();

  const [story, setStory] = useState<DramaStory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!storyId) return;

    setLoading(true);
    apiFetch(`/api/stories/${storyId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load this drama story.');
        return res.json();
      })
      .then((data) => {
        if (data.story) {
          setStory(data.story);
        } else {
          throw new Error('Story not found.');
        }
      })
      .catch((err: any) => {
        setError(err.message || 'Story could not be loaded.');
      })
      .finally(() => setLoading(false));
  }, [storyId]);

  const handleCopyScript = () => {
    if (!story) return;
    const fullText = `${story.title}\n\nLogline: ${story.logline}\n\nTHEME: ${story.mainTheme}\nMORAL: ${story.moralLesson}\n\nSCRIPT:\n${story.fullDramaScript}\n\nDRAMATIC CLIMAX & ENDING HOOK:\n${story.partTwoCliffhanger}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDelete = async () => {
    if (!storyId) return;
    if (!window.confirm('Are you sure you want to delete this story?')) return;

    setDeleting(true);
    try {
      const res = await apiFetch(`/api/stories/${storyId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete story.');
      navigate('/stories');
    } catch (err: any) {
      alert(err.message || 'Failed to delete story.');
      setDeleting(false);
    }
  };

  return (
    <AppLayout activeNav="My Projects">
      {/* Top back navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-purple-900/30">
        <Link
          to="/stories"
          className="inline-flex items-center gap-2 text-xs font-semibold text-purple-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Stories</span>
        </Link>

        {story && (
          <div className="flex items-center gap-2">
            <Link
              to={`/stories/${story.storyId}/characters?auto=true`}
              className="px-3.5 py-1.5 rounded-xl gold-gradient-btn text-xs font-black uppercase tracking-wider text-slate-950 inline-flex items-center gap-1.5 shadow-md hover:shadow-amber-500/30 active:scale-95 transition-all border border-amber-400/60"
            >
              <Users className="w-3.5 h-3.5 text-slate-950" />
              <span>Next: Generate Characters</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
            </Link>

            <button
              type="button"
              onClick={handleCopyScript}
              className="px-3.5 py-1.5 rounded-xl bg-purple-900/40 hover:bg-purple-800/40 border border-purple-700/40 text-xs font-bold text-white inline-flex items-center gap-1.5 transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Copy Script</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/40 border border-rose-800/30 text-xs font-bold text-rose-300 inline-flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="drama-card p-12 rounded-2xl border border-purple-900/40 text-center space-y-3">
          <div className="w-10 h-10 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-purple-300 font-semibold uppercase tracking-wider">
            Loading drama project...
          </p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-center space-y-4">
          <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
          <h3 className="text-base font-bold text-white">Story Not Found</h3>
          <p className="text-xs text-rose-300">{error}</p>
          <Link
            to="/stories"
            className="inline-block px-4 py-2 rounded-xl gold-gradient-btn text-xs font-bold"
          >
            Return to My Stories
          </Link>
        </div>
      )}

      {/* Story Content */}
      {story && !loading && (
        <div className="space-y-6">
          {/* Main Title & Metadata Card */}
          <div className="drama-card p-6 sm:p-8 rounded-2xl border border-purple-900/40 bg-gradient-to-r from-purple-950/60 via-[#151027] to-amber-950/30">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-500/30">
                {story.storyType}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-900/50 text-purple-200 border border-purple-700/40">
                {story.visualStyle}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800/40">
                {story.aspectRatio} • {story.estimatedDuration}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800/40">
                Target: {story.targetPlatform}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
              {story.title}
            </h1>
            <p className="text-xs sm:text-sm text-purple-200/90 leading-relaxed mb-6">
              {story.logline}
            </p>

            {/* Theme & Moral Lesson */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-black/40 p-4 rounded-xl border border-purple-900/40">
              <div>
                <span className="font-bold text-purple-300 block mb-1">Core Dramatic Theme:</span>
                <p className="text-purple-100">{story.mainTheme}</p>
              </div>
              <div>
                <span className="font-bold text-emerald-400 block mb-1">Moral Lesson:</span>
                <p className="text-purple-100">{story.moralLesson}</p>
              </div>
            </div>
          </div>

          {/* 3-Second Hook */}
          <div className="drama-card p-5 rounded-2xl border border-amber-500/30 bg-amber-950/20">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1.5">
              <Flame className="w-4 h-4" />
              <span>3-Second Opening Hook</span>
            </div>
            <p className="text-xs sm:text-sm text-amber-100 font-medium leading-relaxed italic">
              &ldquo;{story.hookScene}&rdquo;
            </p>
          </div>

          {/* Cast & Characters */}
          {story.characterList && story.characterList.length > 0 && (
            <div className="drama-card p-6 rounded-2xl border border-purple-900/40">
              <div className="flex items-center gap-2 mb-4 text-purple-300">
                <Users className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Cast & Characters ({story.characterList.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {story.characterList.map((char, cIdx) => (
                  <div
                    key={cIdx}
                    className="p-3.5 rounded-xl bg-black/40 border border-purple-900/40 text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white text-sm">{char.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-purple-900/40 text-purple-300 border border-purple-800/40 font-semibold">
                        {char.role}
                      </span>
                    </div>
                    <p className="text-purple-200/80 mb-2">{char.description}</p>
                    <div className="text-[11px] text-amber-300/80">
                      <strong className="text-purple-400">Attire:</strong> {char.attire}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full Drama Script (NO NARRATOR) */}
          <div className="drama-card p-6 rounded-2xl border border-purple-900/40 bg-[#0e0a1b]">
            <div className="flex items-center justify-between mb-4 border-b border-purple-900/30 pb-3">
              <div className="flex items-center gap-2">
                <Clapperboard className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Full Drama Script (No Narrator)
                </h3>
              </div>
              <span className="text-[11px] text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                Character Dialogues
              </span>
            </div>

            <div className="space-y-4 font-mono text-xs sm:text-sm bg-black/50 p-5 sm:p-7 rounded-xl border border-purple-900/30 leading-relaxed text-slate-200 whitespace-pre-wrap">
              {story.fullDramaScript}
            </div>
          </div>

          {/* Scene Breakdown */}
          {story.sceneList && story.sceneList.length > 0 && (
            <div className="drama-card p-6 rounded-2xl border border-purple-900/40">
              <div className="flex items-center gap-2 mb-4 text-purple-300">
                <Camera className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Scene-By-Scene Production Breakdown ({story.sceneList.length})
                </h3>
              </div>

              <div className="space-y-3">
                {story.sceneList.map((sc) => (
                  <div
                    key={sc.sceneNumber}
                    className="p-4 rounded-xl bg-black/40 border border-purple-900/40 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300">
                        Scene {sc.sceneNumber}: {sc.title}
                      </span>
                      <span className="text-[10px] text-purple-300/80 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800/40">
                        {sc.location}
                      </span>
                    </div>
                    <p className="text-purple-200">
                      <strong className="text-purple-400">Action:</strong> {sc.action}
                    </p>
                    <p className="text-amber-100 bg-purple-950/30 p-2 rounded-lg italic">
                      <strong className="text-amber-400 not-italic">Dialogue:</strong> &ldquo;{sc.dialogue}&rdquo;
                    </p>
                    <p className="text-purple-300/80 text-[11px]">
                      <strong className="text-purple-400">Camera Angle:</strong> {sc.cameraDirection}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dramatic Climax & Ending Hook */}
          <div className="drama-card p-5 rounded-2xl border border-rose-500/30 bg-rose-950/20">
            <div className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">
              Dramatic Climax & Ending Hook
            </div>
            <p className="text-xs sm:text-sm text-rose-100 font-medium leading-relaxed">
              {story.partTwoCliffhanger}
            </p>
          </div>

          {/* Required Action Buttons */}
          <div className="drama-card p-6 rounded-2xl border border-purple-900/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link
              to="/stories"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/50 border border-purple-800/40 text-xs font-semibold text-purple-200 text-center transition-colors"
            >
              Back to My Stories
            </Link>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {/* PROMINENT VISIBLE YELLOW NEXT BUTTON */}
              <Link
                to={`/stories/${story.storyId}/characters?auto=true`}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl gold-gradient-btn text-slate-950 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:shadow-amber-500/30 active:scale-95 transition-all border border-amber-400/60"
              >
                <Users className="w-4 h-4 text-slate-950" />
                <span>Next: Generate Characters</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </Link>

              <Link
                to={`/stories/${story.storyId}/prompts`}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-purple-900/50 hover:bg-purple-800/60 border border-purple-700/40 text-purple-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <Film className="w-4 h-4 text-purple-400" />
                <span>Scene Prompts</span>
              </Link>

              <Link
                to={`/stories/${story.storyId}/export`}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Export Pack</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};
