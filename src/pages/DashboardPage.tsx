import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lightbulb,
  PlusCircle,
  Users,
  Film,
  FolderKanban,
  Download,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Crown,
  ChevronRight,
  Calendar,
  Eye,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/AppLayout';
import { apiFetch } from '../utils/api';
import type { DashboardStats, DramaStory } from '../types';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentStories, setRecentStories] = useState<DramaStory[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(true);

  // Fetch real statistics from backend
  useEffect(() => {
    if (user) {
      apiFetch('/api/dashboard/stats')
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('Failed to fetch stats');
        })
        .then((data) => {
          if (data.success && data.stats) {
            setStats(data.stats);
          }
        })
        .catch(() => {
          if (user) {
            setStats({
              storiesCreated: user.storiesCreated ?? 0,
              charactersCreated: user.charactersCreated ?? 0,
              scenesGenerated: user.scenesGenerated ?? 0,
              creditsUsed: user.creditsUsed ?? 0,
              plan: user.plan || 'free',
            });
          }
        });

      // Also fetch real stories to display in Recent Projects
      apiFetch('/api/stories')
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data) => {
          if (data.stories && Array.isArray(data.stories)) {
            setRecentStories(data.stories.slice(0, 3));
          }
        })
        .catch(() => setRecentStories([]))
        .finally(() => setStoriesLoading(false));
    }
  }, [user]);

  const actionCards = [
    {
      title: 'Generate Story Ideas',
      desc: 'African family drama, folktales, or supernatural storylines',
      icon: Lightbulb,
      color: 'from-amber-500/20 to-purple-900/30',
      border: 'border-amber-500/30',
      iconColor: 'text-amber-400',
      action: () => navigate('/ideas'),
    },
    {
      title: 'Create New Drama',
      desc: 'Full script breakdown with authentic dialogues & cliffhangers',
      icon: Sparkles,
      color: 'from-purple-600/20 to-purple-950/40',
      border: 'border-purple-500/30',
      iconColor: 'text-purple-400',
      action: () => navigate('/create-story'),
    },
    {
      title: 'My Characters',
      desc: 'Consistent African drama face lock, attire, and expressions',
      icon: Users,
      color: 'from-blue-600/20 to-purple-900/30',
      border: 'border-blue-500/30',
      iconColor: 'text-blue-400',
      action: () => navigate('/characters'),
    },
    {
      title: 'My Projects',
      desc: 'Access saved video scripts, scenes, and draft productions',
      icon: FolderKanban,
      color: 'from-emerald-600/20 to-purple-900/30',
      border: 'border-emerald-500/30',
      iconColor: 'text-emerald-400',
      action: () => navigate('/stories'),
    },
    {
      title: 'Scenes & Prompts',
      desc: 'Ready-to-copy image & video prompt packs (FLUX, Midjourney)',
      icon: Film,
      color: 'from-rose-600/20 to-purple-900/30',
      border: 'border-rose-500/30',
      iconColor: 'text-rose-400',
      badge: 'Copy Ready',
      action: () => navigate('/stories'),
    },
    {
      title: 'Export Pack',
      desc: 'Complete ZIP bundle, screenplay, shot list CSV, and AI viral kit',
      icon: Download,
      color: 'from-emerald-600/20 to-purple-900/30',
      border: 'border-emerald-500/30',
      iconColor: 'text-emerald-400',
      badge: 'ZIP & CSV Ready',
      action: () => navigate('/stories'),
    },
  ];

  const userPlan = (stats?.plan || user?.plan || 'free').toUpperCase();

  return (
    <AppLayout activeNav="Dashboard">
      {/* WELCOME SECTION */}
      <div className="drama-card p-6 sm:p-8 rounded-2xl border border-purple-900/40 bg-gradient-to-r from-purple-950/60 via-[#151027] to-amber-950/30 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Nollywood AI Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
            Welcome to AI Drama Creator
          </h1>
          <p className="text-xs sm:text-sm text-purple-200/80 leading-relaxed mb-6">
            Start building cinematic African AI drama videos with consistent characters and perfect prompts.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('/create-story')}
              className="gold-gradient-btn px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4 text-stone-950" />
              <span>Create New Drama</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/ideas')}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs sm:text-sm font-semibold text-purple-200 transition-colors"
            >
              Get Story Ideas
            </button>
          </div>
        </div>
      </div>

      {/* REAL STATS CARDS (Direct from Firestore User Document) */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-purple-200 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span>Production Statistics</span>
          </h2>
          <span className="text-xs text-purple-300/60">Live Firestore Data</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Stories Created */}
          <div className="drama-card p-4 sm:p-5 rounded-2xl border border-purple-900/40">
            <p className="text-xs text-purple-300/70 font-semibold mb-1">Stories Created</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white">
                {stats?.storiesCreated ?? user?.storiesCreated ?? 0}
              </span>
              <span className="text-[10px] text-emerald-400 font-bold">Realtime</span>
            </div>
          </div>

          {/* Characters Created */}
          <div className="drama-card p-4 sm:p-5 rounded-2xl border border-purple-900/40">
            <p className="text-xs text-purple-300/70 font-semibold mb-1">Characters Created</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white">
                {stats?.charactersCreated ?? user?.charactersCreated ?? 0}
              </span>
              <span className="text-[10px] text-amber-400 font-bold">Cast</span>
            </div>
          </div>

          {/* Scenes Generated */}
          <div className="drama-card p-4 sm:p-5 rounded-2xl border border-purple-900/40">
            <p className="text-xs text-purple-300/70 font-semibold mb-1">Scenes Generated</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white">
                {stats?.scenesGenerated ?? user?.scenesGenerated ?? 0}
              </span>
              <span className="text-[10px] text-purple-400 font-bold">Prompts</span>
            </div>
          </div>

          {/* Credits Used */}
          <div className="drama-card p-4 sm:p-5 rounded-2xl border border-purple-900/40">
            <p className="text-xs text-purple-300/70 font-semibold mb-1">Credits Used</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white">
                {stats?.creditsUsed ?? user?.creditsUsed ?? 0}
              </span>
              <span className="text-[10px] text-slate-400">/ 1000</span>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN ACTION CARDS GRID */}
      <section>
        <h2 className="text-sm font-bold text-purple-200 uppercase tracking-wider mb-4">
          Quick Studio Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {actionCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                onClick={card.action}
                className={`drama-card drama-card-hover p-5 rounded-2xl border ${card.border} flex items-start gap-4 cursor-pointer group bg-gradient-to-br ${card.color}`}
              >
                <div
                  className={`p-3 rounded-xl bg-black/40 border border-white/10 ${card.iconColor} shrink-0 group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                      {card.title}
                    </h3>
                    <div className="flex items-center gap-1.5 shrink-0 ml-1">
                      {card.badge && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-900/60 text-purple-300 border border-purple-800/40">
                          {card.badge}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                  <p className="text-xs text-purple-200/70 leading-relaxed">{card.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* RECENT PROJECTS SECTION & SUBSCRIPTION CARD */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Recent Projects */}
        <div className="lg:col-span-8 drama-card p-6 sm:p-8 rounded-2xl border border-purple-900/40">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-white">Recent Projects</h3>
            <button
              type="button"
              onClick={() => navigate('/stories')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
            >
              View All Stories →
            </button>
          </div>

          {/* Show recent stories if available */}
          {recentStories.length > 0 ? (
            <div className="space-y-3">
              {recentStories.map((story) => (
                <div
                  key={story.storyId}
                  onClick={() => navigate(`/stories/${story.storyId}`)}
                  className="p-4 rounded-xl bg-black/40 hover:bg-black/60 border border-purple-900/40 flex items-center justify-between gap-4 cursor-pointer transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-white truncate">{story.title}</h4>
                    <p className="text-xs text-purple-300/70 truncate">{story.logline}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-amber-300 border border-purple-800/40">
                      {story.storyType}
                    </span>
                    <Eye className="w-4 h-4 text-purple-400" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty state required by prompt:
               No projects yet
               Create your first drama to begin.
            */
            <div className="py-12 sm:py-16 text-center border-2 border-dashed border-purple-900/40 rounded-xl bg-purple-950/20">
              <div className="w-12 h-12 rounded-full bg-purple-900/50 border border-purple-500/30 text-purple-300 flex items-center justify-center mx-auto mb-4">
                <Film className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">No projects yet</h4>
              <p className="text-xs sm:text-sm text-purple-200/70 max-w-sm mx-auto mb-6">
                Create your first drama to begin.
              </p>
              <button
                type="button"
                onClick={() => navigate('/create-story')}
                className="gold-gradient-btn px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Start New Drama</span>
              </button>
            </div>
          )}
        </div>

        {/* Subscription Card */}
        <div className="lg:col-span-4 drama-card p-6 rounded-2xl border border-amber-500/30 bg-gradient-to-b from-purple-950/50 to-[#120d22]">
          <div className="flex items-center gap-2 text-amber-400 mb-2">
            <Crown className="w-5 h-5" />
            <h3 className="text-base font-bold text-white">Subscription Plan</h3>
          </div>

          <div className="my-4 p-4 rounded-xl bg-black/40 border border-purple-900/50">
            <p className="text-xs text-purple-300/80">Current Plan:</p>
            <p className="text-xl font-extrabold text-amber-300 capitalize">{userPlan}</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Access to unlimited story ideas and standard drama script generation.
            </p>
          </div>

          <button
            type="button"
            className="w-full gold-gradient-btn py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
          >
            <span>Upgrade to Pro</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </AppLayout>
  );
};
