import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  PlusCircle,
  Eye,
  Trash2,
  Calendar,
  Layers,
  Film,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Users,
  Download,
} from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { apiFetch } from '../utils/api';
import type { DramaStory } from '../types';

export const MyStoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const [stories, setStories] = useState<DramaStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchStories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/stories');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load your stories.');
      }
      if (data.stories && Array.isArray(data.stories)) {
        setStories(data.stories);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching your drama projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const handleDelete = async (storyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this drama story?')) {
      return;
    }

    setDeletingId(storyId);
    try {
      const res = await apiFetch(`/api/stories/${storyId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete story.');
      }
      setStories((prev) => prev.filter((s) => s.storyId !== storyId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete story.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AppLayout
      activeNav="My Projects"
      pageTitle="My Drama Projects"
      pageSubtitle="Access all your saved African AI drama scripts, concepts, and production scenes."
      actionButton={
        <button
          type="button"
          onClick={() => navigate('/create-story')}
          className="gold-gradient-btn px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-md"
        >
          <PlusCircle className="w-4 h-4 text-stone-950" />
          <span>New Drama</span>
        </button>
      }
    >
      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs sm:text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="drama-card p-6 rounded-2xl border border-purple-900/40 animate-pulse space-y-3"
            >
              <div className="h-4 w-24 bg-purple-900/40 rounded" />
              <div className="h-6 w-3/4 bg-purple-800/30 rounded" />
              <div className="h-4 w-full bg-purple-950 rounded" />
              <div className="h-8 w-28 bg-purple-900/30 rounded-lg pt-4" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State per instructions:
          No stories yet
          Generate your first AI drama story to begin.
      */}
      {!loading && stories.length === 0 && (
        <div className="drama-card p-8 sm:p-14 rounded-2xl border-2 border-dashed border-purple-900/40 bg-[#110d22]/50 text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center mx-auto mb-4 text-amber-400">
            <Film className="w-8 h-8" />
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white mb-2">No stories yet</h3>
          <p className="text-xs sm:text-sm text-purple-200/70 max-w-sm mx-auto mb-6">
            Generate your first AI drama story to begin.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/create-story')}
              className="gold-gradient-btn px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-lg"
            >
              <PlusCircle className="w-4 h-4 text-stone-950" />
              <span>Create New Drama</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/ideas')}
              className="px-4 py-2.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/40 border border-purple-800/40 text-xs font-semibold text-purple-200 transition-colors"
            >
              Generate Story Ideas First
            </button>
          </div>
        </div>
      )}

      {/* Stories Grid */}
      {!loading && stories.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {stories.map((story) => {
            const formattedDate = story.createdAt
              ? new Date(story.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Recent';

            return (
              <div
                key={story.storyId}
                onClick={() => navigate(`/stories/${story.storyId}`)}
                className="drama-card drama-card-hover p-5 sm:p-6 rounded-2xl border border-purple-900/40 bg-[#120d24] flex flex-col justify-between cursor-pointer group relative overflow-hidden"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-500/20">
                      {story.storyType}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 capitalize">
                      {story.status?.replace('_', ' ') || 'story created'}
                    </span>
                  </div>

                  {/* Story Title */}
                  <h3 className="text-base font-black text-white group-hover:text-amber-300 transition-colors line-clamp-1 mb-2">
                    {story.title}
                  </h3>

                  {/* Logline */}
                  <p className="text-xs text-purple-200/70 line-clamp-2 leading-relaxed mb-4">
                    {story.logline || story.storyIdea}
                  </p>

                  {/* Metadata Chips */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-purple-300/80 mb-4">
                    <span className="bg-black/40 px-2 py-0.5 rounded border border-purple-900/40">
                      {story.visualStyle}
                    </span>
                    <span className="bg-black/40 px-2 py-0.5 rounded border border-purple-900/40">
                      {story.aspectRatio}
                    </span>
                    <span className="bg-black/40 px-2 py-0.5 rounded border border-purple-900/40">
                      {story.targetPlatform}
                    </span>
                  </div>
                </div>

                {/* Footer with Created Date & Action Buttons */}
                <div className="pt-4 border-t border-purple-900/30 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] text-purple-300/60">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formattedDate}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/stories/${story.storyId}/characters`);
                      }}
                      className="p-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-800/40 transition-colors"
                      title="Characters & Character Bible"
                    >
                      <Users className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/stories/${story.storyId}/prompts`);
                      }}
                      className="p-1.5 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-500/30 transition-colors"
                      title="Scene Prompts"
                    >
                      <Film className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/stories/${story.storyId}/export`);
                      }}
                      className="p-1.5 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-700/40 transition-colors"
                      title="Production Export Pack"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDelete(story.storyId, e)}
                      disabled={deletingId === story.storyId}
                      className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/40 text-rose-400 border border-rose-800/30 transition-colors"
                      title="Delete Story"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/stories/${story.storyId}`);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-purple-900/50 hover:bg-purple-800/50 text-white text-xs font-bold inline-flex items-center gap-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      <span>View</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
};
