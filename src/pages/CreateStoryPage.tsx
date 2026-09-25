import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Clapperboard,
  Save,
  Copy,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Film,
  Users,
  Eye,
  Camera,
  Layers,
  ChevronRight,
  ArrowRight,
  Flame,
  Clock,
  BookOpen,
} from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { apiFetch } from '../utils/api';
import type { DramaStory, DramaCharacter, DramaScene } from '../types';
import { DURATION_OPTIONS, parseDurationToSeconds, getProjectMode, getProjectModeBadge } from '../utils/durationHelpers';
import { VISUAL_STYLE_OPTIONS, getVisualStyleHelper } from '../utils/visualStyles';

export const CreateStoryPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Pre-fill state if redirected from Generate Ideas page
  const prefill = location.state as {
    selectedIdea?: string;
    storyType?: string;
    aspectRatio?: string;
    videoLength?: string;
    tone?: string;
  } | null;

  const [storyIdea, setStoryIdea] = useState(
    prefill?.selectedIdea ||
      'Amaka discovers that her husband Chinedu secretly brought his ex-girlfriend into their family home claiming she is his stranded cousin, until the woman is caught wearing Amaka’s traditional wedding gold necklace.'
  );
  const [storyType, setStoryType] = useState(prefill?.storyType || 'Modern Family Drama');
  const [visualStyle, setVisualStyle] = useState('Cinematic Nollywood Style');
  const [videoLength, setVideoLength] = useState(prefill?.videoLength || '60 seconds');
  const [aspectRatio, setAspectRatio] = useState(prefill?.aspectRatio || '9:16');
  const [tone, setTone] = useState(prefill?.tone || 'Emotional');
  const [targetPlatform, setTargetPlatform] = useState('TikTok');
  const [mainCharacterCount, setMainCharacterCount] = useState<number>(5);
  const [isCustomCharCount, setIsCustomCharCount] = useState<boolean>(false);

  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedStoryId, setSavedStoryId] = useState<string | null>(null);
  const [navigatingToCharacters, setNavigatingToCharacters] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // The generated story output
  const [generatedStory, setGeneratedStory] = useState<DramaStory | null>(null);

  const storyTypes = [
    'Modern Family Drama',
    'Marriage Betrayal',
    'Mother-in-law Drama',
    'Poor Girl / Rich Family Story',
    'Village Folktale',
    'Mystery / Supernatural Village Story',
    'Children’s Moral Story',
  ];

  const visualStyles = VISUAL_STYLE_OPTIONS;

  const videoLengths = DURATION_OPTIONS;

  const aspectRatios = [
    { label: '9:16 (Vertical TikTok / Reels)', value: '9:16' },
    { label: '16:9 (Horizontal YouTube)', value: '16:9' },
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

  const targetPlatforms = [
    'TikTok',
    'YouTube Shorts',
    'Instagram Reels',
    'Facebook Reels',
    'YouTube Long Form',
  ];

  const handleGenerateStory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!storyIdea.trim()) {
      setError('Please provide a story idea or premise.');
      return;
    }

    setGenerating(true);
    setError(null);
    setSaved(false);

    try {
      const res = await apiFetch('/api/stories/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyIdea: storyIdea.trim(),
          storyType,
          visualStyle,
          videoLength,
          aspectRatio,
          tone,
          targetPlatform,
          mainCharacterCount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate drama story.');
      }

      if (data.story) {
        setGeneratedStory(data.story as DramaStory);
        const resolvedId = data.storyId || (data.story as DramaStory).storyId;
        if (resolvedId) {
          setSavedStoryId(resolvedId);
          setSaved(true);
        }
      } else {
        throw new Error('Invalid drama story format received from server.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating your drama script.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveStory = async () => {
    if (!generatedStory) return;
    setSaving(true);
    setError(null);

    try {
      const res = await apiFetch('/api/stories/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...generatedStory,
          mainCharacterCount: generatedStory.mainCharacterCount || mainCharacterCount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save story to database.');
      }

      setSaved(true);
      const storyId = data.storyId || data.story?.storyId || generatedStory.storyId;
      if (storyId) {
        setSavedStoryId(storyId);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save story.');
    } finally {
      setSaving(false);
    }
  };

  const handleProceedToCharacters = async () => {
    if (!generatedStory) return;
    setNavigatingToCharacters(true);
    setError(null);

    try {
      let targetId = savedStoryId || generatedStory.storyId;

      // If not yet saved or missing ID, save to persist before proceeding
      if (!targetId) {
        const res = await apiFetch('/api/stories/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(generatedStory),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to save story before generating characters.');
        }

        targetId = data.storyId || data.story?.storyId;
        if (targetId) {
          setSavedStoryId(targetId);
          setSaved(true);
        }
      }

      if (targetId) {
        navigate(`/stories/${targetId}/characters?auto=true`);
      } else {
        throw new Error('Could not obtain story ID for character generation.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to move to character generation.');
    } finally {
      setNavigatingToCharacters(false);
    }
  };

  const handleCopyScript = () => {
    if (!generatedStory) return;
    const textToCopy = `${generatedStory.title}\n\nLogline: ${generatedStory.logline}\n\nSCRIPT:\n${generatedStory.fullDramaScript}\n\nCLIFFHANGER:\n${generatedStory.partTwoCliffhanger}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <AppLayout
      activeNav="Create Story"
      pageTitle="Full African Drama Script Generator"
      pageSubtitle="Turn any idea into a cinematic dialogue-only drama script formatted with no narrator."
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* LEFT COLUMN: STORY CONFIGURATION FORM */}
        <div className="lg:col-span-5 drama-card p-5 sm:p-6 rounded-2xl border border-purple-900/40 bg-[#110d22]/90 sticky top-24">
          <div className="flex items-center gap-2 mb-4 text-amber-400">
            <Clapperboard className="w-5 h-5" />
            <h2 className="text-base font-bold text-white">Production Setup</h2>
          </div>

          <form onSubmit={handleGenerateStory} className="space-y-4">
            {/* Story Idea Text Area */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Story Idea / Premise
                </label>
                <button
                  type="button"
                  onClick={() => navigate('/ideas')}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Pick from Idea Generator</span>
                </button>
              </div>
              <textarea
                rows={4}
                value={storyIdea}
                onChange={(e) => setStoryIdea(e.target.value)}
                placeholder="Describe your African drama idea, characters, and the central conflict..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-purple-950/40 border border-purple-900/50 text-xs text-white placeholder:text-purple-300/40 focus:outline-none focus:border-amber-400 leading-relaxed resize-none"
              />
            </div>

            {/* Story Type & Visual Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Story Type
                </label>
                <select
                  value={storyType}
                  onChange={(e) => setStoryType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-purple-950/40 border border-purple-900/50 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  {storyTypes.map((t) => (
                    <option key={t} value={t} className="bg-[#110d22]">
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Visual Style
                </label>
                <select
                  value={visualStyle}
                  onChange={(e) => setVisualStyle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-purple-950/40 border border-purple-900/50 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  {visualStyles.map((vs) => (
                    <option key={vs} value={vs} className="bg-[#110d22]">
                      {vs}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-purple-300/80 mt-1.5 leading-snug">
                  {getVisualStyleHelper(visualStyle)}
                </p>
              </div>
            </div>

            {/* Length & Aspect Ratio */}
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

              {/* Mode Helper Text */}
              {getProjectMode(parseDurationToSeconds(videoLength)) === 'long_form' && (
                <div className="col-span-2 p-3 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-200 text-xs flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold text-white block">Long-form mode enabled.</span>
                    <span>This project will be structured in acts and generated in batches for better quality.</span>
                  </div>
                </div>
              )}
              {getProjectMode(parseDurationToSeconds(videoLength)) === 'medium_form' && (
                <div className="col-span-2 p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
                  <Film className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold text-white block">Medium-form 3-Act mode enabled.</span>
                    <span>This project will be structured into 3 dramatic acts with key sequences.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Tone & Target Platform */}
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
                  Platform
                </label>
                <select
                  value={targetPlatform}
                  onChange={(e) => setTargetPlatform(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-purple-950/40 border border-purple-900/50 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  {targetPlatforms.map((tp) => (
                    <option key={tp} value={tp} className="bg-[#110d22]">
                      {tp}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Main Speaking Character Count */}
            <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-900/50 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  <span>Main Speaking Characters</span>
                </label>
                <span className="text-[11px] font-bold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-500/30">
                  {mainCharacterCount} Speaking {mainCharacterCount === 1 ? 'Character' : 'Characters'}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-1.5">
                {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setMainCharacterCount(num);
                      setIsCustomCharCount(false);
                    }}
                    className={`py-1.5 px-1 rounded-lg text-xs font-bold transition-all border ${
                      !isCustomCharCount && mainCharacterCount === num
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                        : 'bg-purple-950/60 text-purple-200 border-purple-800/40 hover:bg-purple-800/50 hover:text-white'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCustomCharCount(!isCustomCharCount)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                    isCustomCharCount
                      ? 'bg-purple-800 text-white border-purple-500'
                      : 'bg-purple-900/40 text-purple-300 border-purple-800/40 hover:text-white'
                  }`}
                >
                  Custom number
                </button>
                {isCustomCharCount && (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={2}
                      max={50}
                      value={mainCharacterCount}
                      onChange={(e) => setMainCharacterCount(Math.max(2, parseInt(e.target.value) || 2))}
                      className="w-16 px-2.5 py-1 rounded-lg bg-[#0e0a1f] border border-amber-400/80 text-xs text-white font-bold text-center focus:outline-none"
                    />
                    <span className="text-[11px] text-purple-300">characters</span>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-purple-300/80 leading-normal">
                <strong>This means only the people who will talk in the story.</strong> Background crowds, party guests, church members, market people, and office workers are not counted unless they speak.
              </p>
            </div>

            {/* Action Button */}
            <button
              type="submit"
              disabled={generating}
              className="w-full mt-2 gold-gradient-btn py-3.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg disabled:opacity-60"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                  <span>Writing Dialogue & Scenes...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-stone-950" />
                  <span>Generate Drama Story</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: SCRIPT DISPLAY & DETAILS */}
        <div className="lg:col-span-7 space-y-4">
          {/* Error display */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs sm:text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-0.5">Error</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {generating && (
            <div className="drama-card p-8 rounded-2xl border border-purple-900/40 text-center animate-pulse space-y-4">
              <div className="w-12 h-12 rounded-full border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <h3 className="text-base font-bold text-white">
                Generating Cinematic African Drama Script...
              </h3>
              <p className="text-xs text-purple-200/70 max-w-sm mx-auto">
                Directing emotional character conflicts, authentic Nollywood dialogue, and formatting strict NO NARRATOR scenes.
              </p>
            </div>
          )}

          {/* Empty state before generating */}
          {!generating && !generatedStory && (
            <div className="drama-card p-8 sm:p-12 rounded-2xl border border-purple-900/40 text-center">
              <div className="w-14 h-14 rounded-2xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center mx-auto mb-4 text-amber-400">
                <Film className="w-7 h-7" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mb-2">
                No Drama Script Generated Yet
              </h3>
              <p className="text-xs sm:text-sm text-purple-200/70 max-w-md mx-auto mb-6">
                Enter your story concept on the left or select an idea from the Ideas Generator to generate a complete African drama script.
              </p>
              <div className="text-xs text-amber-300 font-semibold">
                Guaranteed: No narrator voiceover. Characters speak directly for themselves.
              </div>
            </div>
          )}

          {/* Rendered Generated Story */}
          {!generating && generatedStory && (
            <div className="space-y-6">
              {/* Header card with Title and Action Toolbar */}
              <div className="drama-card p-6 rounded-2xl border border-purple-900/40 bg-[#120d24]">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-500/30">
                      {generatedStory.storyType}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-900/50 text-purple-200 border border-purple-700/40">
                      {generatedStory.visualStyle}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800/40">
                      {generatedStory.aspectRatio} • {generatedStory.estimatedDuration}
                    </span>
                  </div>

                  {/* Script Action buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyScript}
                      className="px-3 py-1.5 rounded-lg bg-purple-900/40 hover:bg-purple-800/40 border border-purple-700/40 text-xs font-semibold text-purple-200 inline-flex items-center gap-1.5 transition-colors"
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Script</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleGenerateStory()}
                      disabled={generating}
                      className="px-3 py-1.5 rounded-lg bg-purple-900/40 hover:bg-purple-800/40 border border-purple-700/40 text-xs font-semibold text-purple-200 inline-flex items-center gap-1.5 transition-colors"
                      title="Regenerate story"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Regenerate</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveStory}
                      disabled={saving || saved}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-md ${
                        saved
                          ? 'bg-emerald-600 text-white'
                          : 'bg-purple-900/40 hover:bg-purple-800/40 border border-purple-700/40 text-purple-200'
                      }`}
                    >
                      {saving ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : saved ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Saved!</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5 text-amber-400" />
                          <span>Save Story</span>
                        </>
                      )}
                    </button>

                    {/* VISIBLE YELLOW NEXT BUTTON TO GENERATE CHARACTERS */}
                    <button
                      type="button"
                      onClick={handleProceedToCharacters}
                      disabled={navigatingToCharacters}
                      className="px-4 py-1.5 rounded-lg gold-gradient-btn text-xs font-black uppercase tracking-wider text-slate-950 inline-flex items-center gap-1.5 shadow-md hover:shadow-amber-500/30 active:scale-95 transition-all border border-amber-400/60 cursor-pointer"
                      title="Move to character generation for this story"
                    >
                      {navigatingToCharacters ? (
                        <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Users className="w-3.5 h-3.5 text-slate-950" />
                      )}
                      <span>Next: Generate Characters</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
                    </button>
                  </div>
                </div>

                <h1 className="text-xl sm:text-2xl font-black text-white mb-2">
                  {generatedStory.title}
                </h1>
                <p className="text-xs sm:text-sm text-purple-200/90 leading-relaxed mb-4">
                  {generatedStory.logline}
                </p>

                {/* Theme & Moral summary row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-black/40 p-3.5 rounded-xl border border-purple-900/40">
                  <div>
                    <span className="font-bold text-purple-300 block">Core Theme:</span>
                    <span className="text-purple-100">{generatedStory.mainTheme}</span>
                  </div>
                  <div>
                    <span className="font-bold text-emerald-400 block">Moral Lesson:</span>
                    <span className="text-purple-100">{generatedStory.moralLesson}</span>
                  </div>
                </div>
              </div>

              {/* 3-Second Hook Scene */}
              <div className="drama-card p-5 rounded-2xl border border-amber-500/30 bg-amber-950/20">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-2">
                  <Flame className="w-4 h-4" />
                  <span>3-Second Opening Hook</span>
                </div>
                <p className="text-xs sm:text-sm text-amber-100 font-medium leading-relaxed italic">
                  &ldquo;{generatedStory.hookScene}&rdquo;
                </p>
              </div>

              {/* Character List */}
              {generatedStory.characterList && generatedStory.characterList.length > 0 && (
                <div className="drama-card p-5 sm:p-6 rounded-2xl border border-purple-900/40">
                  <div className="flex items-center gap-2 mb-4 text-purple-300">
                    <Users className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                      Cast & Characters ({generatedStory.characterList.length})
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {generatedStory.characterList.map((char, cIdx) => (
                      <div
                        key={cIdx}
                        className="p-3.5 rounded-xl bg-black/40 border border-purple-900/40 text-xs"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-white text-sm">{char.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-900/40 text-purple-300 font-semibold border border-purple-800/40">
                            {char.role}
                          </span>
                        </div>
                        <p className="text-purple-200/80 mb-2">{char.description}</p>
                        <div className="text-[11px] text-amber-300/80">
                          <span className="font-bold text-purple-400">Attire:</span> {char.attire}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Acts Breakdown & Narrative Sequences (For Medium & Long Form) */}
              {generatedStory.actsBreakdown && (
                <div className="drama-card p-5 sm:p-6 rounded-2xl border border-purple-800/40 bg-purple-950/20">
                  <div className="flex items-center justify-between mb-4 border-b border-purple-900/40 pb-3">
                    <div className="flex items-center gap-2 text-amber-400">
                      <BookOpen className="w-4 h-4" />
                      <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                        Dramatic Acts & Narrative Sequences
                      </h3>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-purple-900/60 text-purple-200 border border-purple-700/50">
                      {generatedStory.projectMode === 'long_form' ? 'Feature Structure' : '3-Act Structure'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    {/* Act 1 */}
                    {generatedStory.actsBreakdown.act1 && (
                      <div className="p-3.5 rounded-xl bg-black/50 border border-purple-900/50 text-xs space-y-2">
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                          Act 1
                        </span>
                        <h4 className="font-bold text-white text-sm">{generatedStory.actsBreakdown.act1.title}</h4>
                        <p className="text-purple-200/80">{generatedStory.actsBreakdown.act1.summary}</p>
                        {generatedStory.actsBreakdown.act1.sequences && (
                          <div className="pt-1">
                            <span className="text-[10px] text-purple-400 font-semibold block mb-1">Key Sequences:</span>
                            <ul className="list-disc list-inside space-y-0.5 text-purple-200/70 text-[11px]">
                              {generatedStory.actsBreakdown.act1.sequences.map((seq, sIdx) => (
                                <li key={sIdx}>{seq}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Act 2 */}
                    {generatedStory.actsBreakdown.act2 && (
                      <div className="p-3.5 rounded-xl bg-black/50 border border-purple-900/50 text-xs space-y-2">
                        <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">
                          Act 2
                        </span>
                        <h4 className="font-bold text-white text-sm">{generatedStory.actsBreakdown.act2.title}</h4>
                        <p className="text-purple-200/80">{generatedStory.actsBreakdown.act2.summary}</p>
                        {generatedStory.actsBreakdown.act2.sequences && (
                          <div className="pt-1">
                            <span className="text-[10px] text-purple-400 font-semibold block mb-1">Key Sequences:</span>
                            <ul className="list-disc list-inside space-y-0.5 text-purple-200/70 text-[11px]">
                              {generatedStory.actsBreakdown.act2.sequences.map((seq, sIdx) => (
                                <li key={sIdx}>{seq}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Act 3 */}
                    {generatedStory.actsBreakdown.act3 && (
                      <div className="p-3.5 rounded-xl bg-black/50 border border-purple-900/50 text-xs space-y-2">
                        <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">
                          Act 3
                        </span>
                        <h4 className="font-bold text-white text-sm">{generatedStory.actsBreakdown.act3.title}</h4>
                        <p className="text-purple-200/80">{generatedStory.actsBreakdown.act3.summary}</p>
                        {generatedStory.actsBreakdown.act3.sequences && (
                          <div className="pt-1">
                            <span className="text-[10px] text-purple-400 font-semibold block mb-1">Key Sequences:</span>
                            <ul className="list-disc list-inside space-y-0.5 text-purple-200/70 text-[11px]">
                              {generatedStory.actsBreakdown.act3.sequences.map((seq, sIdx) => (
                                <li key={sIdx}>{seq}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Suggested batches for long form */}
                  {generatedStory.actsBreakdown.suggestedBatches && generatedStory.actsBreakdown.suggestedBatches.length > 0 && (
                    <div className="p-3 rounded-xl bg-black/40 border border-purple-900/40 text-xs">
                      <span className="text-[11px] font-bold text-amber-300 block mb-2">
                        Recommended Scene Generation Batches:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {generatedStory.actsBreakdown.suggestedBatches.map((b, bIdx) => (
                          <div key={bIdx} className="px-3 py-1.5 rounded-lg bg-purple-900/30 border border-purple-800/40">
                            <span className="font-bold text-white">{b.sceneRange}:</span>{' '}
                            <span className="text-purple-200/80">{b.focus}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Full Drama Script (Verbatim character dialogue) */}
              <div className="drama-card p-5 sm:p-6 rounded-2xl border border-purple-900/40 bg-[#0e0a1b]">
                <div className="flex items-center justify-between mb-4 border-b border-purple-900/30 pb-3">
                  <div className="flex items-center gap-2">
                    <Clapperboard className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                      Full Drama Script (No Narrator)
                    </h3>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                    Direct Character Speech
                  </span>
                </div>

                <div className="space-y-4 font-mono text-xs sm:text-sm bg-black/50 p-4 sm:p-6 rounded-xl border border-purple-900/30 leading-relaxed text-slate-200 whitespace-pre-wrap">
                  {generatedStory.fullDramaScript}
                </div>
              </div>

              {/* Scene Breakdown */}
              {generatedStory.sceneList && generatedStory.sceneList.length > 0 && (
                <div className="drama-card p-5 sm:p-6 rounded-2xl border border-purple-900/40">
                  <div className="flex items-center gap-2 mb-4 text-purple-300">
                    <Camera className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                      Scene-By-Scene Production Breakdown ({generatedStory.sceneList.length})
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {generatedStory.sceneList.map((sc) => (
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
                  {generatedStory.partTwoCliffhanger}
                </p>
              </div>

              {/* Bottom Action Footer */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-purple-900/40">
                <button
                  type="button"
                  onClick={handleSaveStory}
                  disabled={saving || saved}
                  className={`px-5 py-3 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-2 transition-all shadow-md ${
                    saved
                      ? 'bg-emerald-600/30 border border-emerald-500/50 text-emerald-300'
                      : 'bg-purple-900/50 hover:bg-purple-800/60 border border-purple-700/50 text-purple-200'
                  }`}
                >
                  <Save className="w-4 h-4 text-amber-400" />
                  <span>{saved ? '✓ Story Saved to My Projects' : 'Save Story to My Projects'}</span>
                </button>

                {/* PROMINENT VISIBLE YELLOW NEXT BUTTON */}
                <button
                  type="button"
                  onClick={handleProceedToCharacters}
                  disabled={navigatingToCharacters}
                  className="gold-gradient-btn px-8 py-3.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider text-slate-950 inline-flex items-center justify-center gap-2.5 shadow-xl hover:shadow-amber-500/35 active:scale-95 transition-all border border-amber-400/60 cursor-pointer"
                >
                  {navigatingToCharacters ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Opening Character Suite...</span>
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4 text-slate-950" />
                      <span>Next: Generate Characters</span>
                      <ArrowRight className="w-4 h-4 text-slate-950" />
                    </>
                  )}
                </button>
              </div>

              {/* Sticky bottom bar ensuring the Next button is ALWAYS visible */}
              <div className="sticky bottom-4 z-20 drama-card p-3 sm:p-4 rounded-2xl border border-amber-500/50 bg-[#120e26]/95 backdrop-blur-xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-purple-200 font-medium">
                    Story complete! Ready for character bibles:{' '}
                    <strong className="text-white">{generatedStory.title}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleProceedToCharacters}
                  disabled={navigatingToCharacters}
                  className="w-full sm:w-auto gold-gradient-btn px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider text-slate-950 inline-flex items-center justify-center gap-2 shadow-lg hover:shadow-amber-500/30 active:scale-95 transition-all border border-amber-400/60 cursor-pointer"
                >
                  {navigatingToCharacters ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Moving to Characters...</span>
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4 text-slate-950" />
                      <span>Next: Generate Characters</span>
                      <ArrowRight className="w-4 h-4 text-slate-950" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};
