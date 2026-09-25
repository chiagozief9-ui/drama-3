import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lightbulb,
  Sparkles,
  ArrowRight,
  Flame,
  AlertTriangle,
  Compass,
  CheckCircle,
  Copy,
  Layers,
  Film,
  Zap,
} from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { apiFetch } from '../utils/api';
import type { StoryIdea } from '../types';
import { DURATION_OPTIONS, parseDurationToSeconds, getProjectMode, getProjectModeBadge } from '../utils/durationHelpers';

export const GenerateIdeasPage: React.FC = () => {
  const navigate = useNavigate();

  // Form states with required defaults
  const [storyType, setStoryType] = useState('Modern Family Drama');
  const [audience, setAudience] = useState('African/Nigerian audience');
  const [videoLength, setVideoLength] = useState('60 seconds');
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [tone, setTone] = useState('Emotional');
  const [numberOfIdeas, setNumberOfIdeas] = useState(5);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<StoryIdea[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const storyTypes = [
    'Modern Family Drama',
    'Marriage Betrayal',
    'Mother-in-law Drama',
    'Poor Girl / Rich Family Story',
    'Village Folktale',
    'Mystery / Supernatural Village Story',
    'Children’s Moral Story',
  ];

  const audiences = [
    'African/Nigerian audience',
    'Global African Diaspora',
    'Young Adult / Gen Z',
    'Family & Church Audience',
  ];

  const videoLengths = DURATION_OPTIONS;
  const aspectRatios = [
    { label: '9:16 (TikTok / Reels / Shorts)', value: '9:16' },
    { label: '16:9 (YouTube Widescreen)', value: '16:9' },
    { label: '1:1 (Square Feed)', value: '1:1' },
  ];

  const tones = [
    'Emotional',
    'Suspenseful',
    'Inspirational',
    'Sad',
    'Dramatic',
    'Funny',
    'Moral lesson',
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch('/api/ideas/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyType,
          audience,
          videoLength,
          aspectRatio,
          tone,
          numberOfIdeas: Number(numberOfIdeas),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate ideas. Please try again.');
      }

      if (data.ideas && Array.isArray(data.ideas)) {
        setIdeas(data.ideas);
      } else {
        throw new Error('Invalid response received from AI server.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while generating ideas.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseIdea = (idea: StoryIdea) => {
    navigate('/create-story', {
      state: {
        selectedIdea: `${idea.title} - ${idea.oneLineSummary}. Conflict: ${idea.mainConflict}. Twist: ${idea.twist}. Cliffhanger: ${idea.partTwoCliffhanger}`,
        storyType,
        aspectRatio,
        videoLength,
        tone,
      },
    });
  };

  const handleCopyHook = (idea: StoryIdea) => {
    navigator.clipboard.writeText(`${idea.title}\nHook: ${idea.shortHook}\nConflict: ${idea.mainConflict}`);
    setCopiedId(idea.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <AppLayout
      activeNav="Generate Ideas"
      pageTitle="African AI Drama Story Generator"
      pageSubtitle="Generate high-hook Nollywood and African drama concepts optimized for TikTok, Reels, and Shorts."
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* LEFT COLUMN: PARAMETER CONFIGURATION FORM */}
        <div className="lg:col-span-4 drama-card p-5 sm:p-6 rounded-2xl border border-purple-900/40 bg-[#110d22]/90 sticky top-24">
          <div className="flex items-center gap-2 mb-4 text-amber-400">
            <Lightbulb className="w-5 h-5" />
            <h2 className="text-base font-bold text-white">Story Parameters</h2>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            {/* Story Type */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Story Type
              </label>
              <select
                value={storyType}
                onChange={(e) => setStoryType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-purple-950/40 border border-purple-900/50 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                {storyTypes.map((type) => (
                  <option key={type} value={type} className="bg-[#110d22]">
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Audience */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Target Audience
              </label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-purple-950/40 border border-purple-900/50 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                {audiences.map((aud) => (
                  <option key={aud} value={aud} className="bg-[#110d22]">
                    {aud}
                  </option>
                ))}
              </select>
            </div>

            {/* Video Length & Aspect Ratio */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Length
                </label>
                <select
                  value={videoLength}
                  onChange={(e) => setVideoLength(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-purple-950/40 border border-purple-900/50 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  {videoLengths.map((len) => (
                    <option key={len} value={len} className="bg-[#110d22]">
                      {len}
                    </option>
                  ))}
                </select>
                <div className="mt-1">
                  <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getProjectModeBadge(getProjectMode(parseDurationToSeconds(videoLength))).color}`}>
                    {getProjectModeBadge(getProjectMode(parseDurationToSeconds(videoLength))).label}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Aspect Ratio
                </label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-purple-950/40 border border-purple-900/50 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  {aspectRatios.map((ar) => (
                    <option key={ar.value} value={ar.value} className="bg-[#110d22]">
                      {ar.value}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tone & Number of Ideas */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Tone
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-purple-950/40 border border-purple-900/50 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  {tones.map((t) => (
                    <option key={t} value={t} className="bg-[#110d22]">
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Quantity
                </label>
                <select
                  value={numberOfIdeas}
                  onChange={(e) => setNumberOfIdeas(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl bg-purple-950/40 border border-purple-900/50 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value={3} className="bg-[#110d22]">3 Ideas</option>
                  <option value={5} className="bg-[#110d22]">5 Ideas</option>
                  <option value={8} className="bg-[#110d22]">8 Ideas</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 gold-gradient-btn py-3.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg disabled:opacity-60"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                  <span>Generating African Dramas...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-stone-950" />
                  <span>Generate Ideas</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: GENERATED IDEAS DISPLAY */}
        <div className="lg:col-span-8 space-y-4">
          {/* Error notice */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs sm:text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-0.5">Generation Failed</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Loading state skeleton */}
          {loading && (
            <div className="space-y-4">
              <div className="drama-card p-6 rounded-2xl border border-purple-900/40 animate-pulse">
                <div className="h-5 w-48 bg-purple-900/40 rounded mb-4" />
                <div className="h-4 w-full bg-purple-900/20 rounded mb-2" />
                <div className="h-4 w-3/4 bg-purple-900/20 rounded mb-4" />
                <div className="h-10 w-32 bg-purple-800/40 rounded-xl" />
              </div>
              <div className="drama-card p-6 rounded-2xl border border-purple-900/40 animate-pulse">
                <div className="h-5 w-56 bg-purple-900/40 rounded mb-4" />
                <div className="h-4 w-full bg-purple-900/20 rounded mb-2" />
                <div className="h-4 w-2/3 bg-purple-900/20 rounded mb-4" />
                <div className="h-10 w-32 bg-purple-800/40 rounded-xl" />
              </div>
            </div>
          )}

          {/* Empty state before generation */}
          {!loading && ideas.length === 0 && !error && (
            <div className="drama-card p-8 sm:p-12 rounded-2xl border border-purple-900/40 text-center">
              <div className="w-14 h-14 rounded-2xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center mx-auto mb-4 text-amber-400">
                <Flame className="w-7 h-7" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mb-2">
                Ready to Brainstorm Viral African Drama?
              </h3>
              <p className="text-xs sm:text-sm text-purple-200/70 max-w-md mx-auto mb-6">
                Choose your story type and tone on the left, then click <strong>Generate Ideas</strong> to produce high-conflict storylines designed for character lip-sync and viral drama.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-950/60 border border-purple-800/50 text-xs text-purple-300">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Powered by Gemini 3.8 Flash • No Narrator Format</span>
              </div>
            </div>
          )}

          {/* Generated Ideas Cards Grid */}
          {!loading && ideas.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <p className="text-xs font-bold uppercase tracking-wider text-purple-300">
                  {ideas.length} Viral Story Concepts Generated
                </p>
                <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Select one to turn into a full script
                </span>
              </div>

              {ideas.map((idea, index) => (
                <div
                  key={idea.id || index}
                  className="drama-card drama-card-hover p-6 rounded-2xl border border-purple-900/40 bg-[#120d24] relative overflow-hidden group"
                >
                  {/* Top Badge & Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-amber-400 text-stone-950 font-black text-xs flex items-center justify-center">
                        #{index + 1}
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-900/50 text-purple-200 border border-purple-700/40">
                        {storyType}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyHook(idea)}
                      className="inline-flex items-center gap-1 text-[11px] text-purple-300 hover:text-white px-2 py-1 rounded bg-black/30 transition-colors"
                      title="Copy hook summary"
                    >
                      {copiedId === idea.id ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Hook</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-black text-white mb-2 group-hover:text-amber-300 transition-colors">
                    {idea.title}
                  </h3>

                  {/* 3-second Hook Box */}
                  <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 mb-3 text-xs text-amber-200">
                    <span className="font-bold text-amber-400 block mb-0.5 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" />
                      Opening 3-Second Hook:
                    </span>
                    &ldquo;{idea.shortHook}&rdquo;
                  </div>

                  {/* One Line Summary */}
                  <p className="text-xs sm:text-sm text-purple-100/90 leading-relaxed mb-4">
                    {idea.oneLineSummary}
                  </p>

                  {/* Story Breakdown Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs bg-black/30 p-3.5 rounded-xl border border-purple-900/40 mb-4">
                    <div>
                      <span className="text-purple-400 font-bold block">Main Conflict:</span>
                      <p className="text-purple-200/80 mt-0.5">{idea.mainConflict}</p>
                    </div>
                    <div>
                      <span className="text-amber-400 font-bold block">The Twist:</span>
                      <p className="text-purple-200/80 mt-0.5">{idea.twist}</p>
                    </div>
                    <div>
                      <span className="text-emerald-400 font-bold block">Moral Lesson:</span>
                      <p className="text-purple-200/80 mt-0.5">{idea.moralLesson}</p>
                    </div>
                    <div>
                      <span className="text-rose-400 font-bold block">Dramatic Ending Hook / Climax:</span>
                      <p className="text-purple-200/80 mt-0.5">{idea.partTwoCliffhanger}</p>
                    </div>
                  </div>

                  {/* Suggested Characters & Setting */}
                  {idea.suggestedCharacters && idea.suggestedCharacters.length > 0 && (
                    <div className="mb-4">
                      <span className="text-[11px] font-bold text-purple-300/80 block mb-1">
                        Cast & Characters:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {idea.suggestedCharacters.map((char, cIdx) => (
                          <span
                            key={cIdx}
                            className="text-[11px] px-2 py-0.5 rounded-lg bg-purple-950/80 border border-purple-800/40 text-purple-200"
                          >
                            {char}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Main Action: Use This Idea */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleUseIdea(idea)}
                      className="gold-gradient-btn px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 group-hover:scale-102 transition-transform shadow-md"
                    >
                      <span>Use This Idea</span>
                      <ArrowRight className="w-4 h-4 text-stone-950" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};
