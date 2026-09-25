import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Film,
  Sparkles,
  ArrowLeft,
  Copy,
  Check,
  Edit3,
  Save,
  RotateCw,
  AlertCircle,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Layers,
  Palette,
  Eye,
  Camera,
  CheckCircle,
  Video,
  Clock,
  MapPin,
  MessageSquare,
  Users,
  Compass,
  Maximize2,
  RefreshCw,
  Download,
} from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { apiFetch } from '../utils/api';
import type { DramaStory, CharacterProfile, ScenePrompt } from '../types';
import {
  DURATION_OPTIONS,
  parseDurationToSeconds,
  parseSceneDurationToSeconds,
  calculateTargetSceneCount,
  getProjectMode,
  calculateEstimatedScenes,
  getProjectModeBadge,
} from '../utils/durationHelpers';
import { VISUAL_STYLE_OPTIONS, getVisualStyleHelper } from '../utils/visualStyles';

export const ScenePromptsPage: React.FC = () => {
  const { storyId } = useParams<{ storyId: string }>();
  const navigate = useNavigate();

  const [story, setStory] = useState<DramaStory | null>(null);
  const [characters, setCharacters] = useState<CharacterProfile[]>([]);
  const [scenePrompts, setScenePrompts] = useState<ScenePrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  // Generation Controls
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [visualStyle, setVisualStyle] = useState('Cinematic Nollywood Style');
  const [videoDuration, setVideoDuration] = useState('60 seconds');
  const [sceneDuration, setSceneDuration] = useState('10 seconds');
  const [promptDetailLevel, setPromptDetailLevel] = useState('Production Ready');
  const [cameraStyle, setCameraStyle] = useState('Mixed cinematic camera');
  const [platform, setPlatform] = useState('TikTok');
  const [dialogueMode, setDialogueMode] = useState('Short emotional dialogue');
  const [consistencyMode, setConsistencyMode] = useState('Ultra Consistent');

  // Exact calculations based on formula Math.ceil(totalDurationSeconds / sceneDurationSeconds)
  const durationSeconds = parseDurationToSeconds(videoDuration);
  const sceneDurationSeconds = parseSceneDurationToSeconds(sceneDuration);
  const targetSceneCount = story?.targetSceneCount && story.targetSceneCount > 0
    ? story.targetSceneCount
    : calculateTargetSceneCount(durationSeconds, sceneDurationSeconds);
  const generatedSceneCount = scenePrompts.length;
  const remainingSceneCount = Math.max(0, targetSceneCount - generatedSceneCount);

  // Copy Feedback State: key = `${sceneId}_${type}`
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Edit Modal State
  const [editingScene, setEditingScene] = useState<ScenePrompt | null>(null);

  // Batching Controls for Long-Form Projects
  const [batchSize, setBatchSize] = useState<number>(5);
  const [startSceneNumber, setStartSceneNumber] = useState<number>(1);
  const [endSceneNumber, setEndSceneNumber] = useState<number>(5);
  const [isBatchMode, setIsBatchMode] = useState<boolean>(false);

  const aspectRatioOptions = ['9:16', '16:9', '1:1'];
  const visualStyleOptions = VISUAL_STYLE_OPTIONS;
  const videoDurationOptions = DURATION_OPTIONS;
  const sceneDurationOptions = ['6 seconds', '8 seconds', '10 seconds', '15 seconds'];
  const detailLevelOptions = ['Simple', 'Detailed', 'Production Ready', 'Ultra Detailed'];
  const cameraStyleOptions = [
    'Cinematic close-up',
    'Handheld Nollywood drama',
    'Smooth slow push-in',
    'Static dialogue scene',
    'Emotional face close-up',
    'Mixed cinematic camera',
  ];
  const platformOptions = [
    'TikTok',
    'YouTube Shorts',
    'Instagram Reels',
    'Facebook Reels',
    'YouTube Long Form',
  ];
  const dialogueModeOptions = [
    'Short emotional dialogue',
    'Natural conversation',
    'Intense confrontation',
    'Soft family conversation',
    'Public argument',
  ];
  const consistencyOptions = ['Ultra Consistent', 'High', 'Standard'];

  // Handle batch size change
  const handleBatchSizeChange = (newSize: number) => {
    setBatchSize(newSize);
    setEndSceneNumber(startSceneNumber + newSize - 1);
  };

  const handleStartSceneChange = (newStart: number) => {
    const validStart = Math.max(1, newStart);
    setStartSceneNumber(validStart);
    setEndSceneNumber(validStart + batchSize - 1);
  };

  useEffect(() => {
    if (!storyId) return;

    setLoading(true);
    setError(null);

    Promise.all([
      apiFetch(`/api/stories/${storyId}`).then((res) =>
        res.ok ? res.json() : Promise.reject('Failed to load drama story.')
      ),
      apiFetch(`/api/stories/${storyId}/characters`).then((res) =>
        res.ok ? res.json() : { characters: [] }
      ),
      apiFetch(`/api/stories/${storyId}/prompts`).then((res) =>
        res.ok ? res.json() : { scenePrompts: [] }
      ),
    ])
      .then(([storyData, charsData, promptsData]) => {
        if (storyData.story) {
          setStory(storyData.story);
          if (storyData.story.aspectRatio) setAspectRatio(storyData.story.aspectRatio);
          if (storyData.story.visualStyle) setVisualStyle(storyData.story.visualStyle);
          const durLabel = storyData.story.durationLabel || storyData.story.estimatedDuration;
          if (durLabel) setVideoDuration(durLabel);
          if (storyData.story.targetPlatform) setPlatform(storyData.story.targetPlatform);

          const durSec = parseDurationToSeconds(durLabel || '60 seconds');
          const mode = storyData.story.projectMode || getProjectMode(durSec);
          const needsBatch = mode === 'long_form' || storyData.story.sceneBatchingEnabled || durSec >= 900;
          setIsBatchMode(Boolean(needsBatch));
        }

        if (charsData.characters && Array.isArray(charsData.characters)) {
          setCharacters(charsData.characters);
        }

        if (promptsData.scenePrompts && Array.isArray(promptsData.scenePrompts) && promptsData.scenePrompts.length > 0) {
          setScenePrompts(promptsData.scenePrompts);
          setSavedSuccess(true);
          const highest = Math.max(...promptsData.scenePrompts.map((s: ScenePrompt) => s.sceneNumber || 1));
          setStartSceneNumber(highest + 1);
          setEndSceneNumber(highest + 5);
        }
      })
      .catch((err: any) => {
        setError(typeof err === 'string' ? err : err.message || 'Error loading story details.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [storyId]);

  const handleGeneratePrompts = async (batchOverride?: { start: number; end: number; size: number }) => {
    if (!storyId) return;

    setGenerating(true);
    setError(null);
    setWarning(null);
    setSavedSuccess(false);

    try {
      const isBatch = isBatchMode || Boolean(batchOverride);
      const start = batchOverride?.start ?? (isBatch ? startSceneNumber : 1);
      const end = batchOverride?.end ?? (isBatch ? endSceneNumber : targetSceneCount);
      const size = batchOverride?.size ?? (isBatch ? batchSize : targetSceneCount);
      const expectedCount = end - start + 1;

      const res = await apiFetch(`/api/stories/${storyId}/prompts/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aspectRatio,
          visualStyle,
          videoDuration,
          sceneDuration,
          promptDetailLevel,
          cameraStyle,
          platform,
          dialogueMode,
          consistencyMode,
          isBatchMode: isBatch,
          startSceneNumber: start,
          endSceneNumber: end,
          batchSize: size,
          targetSceneCount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate scene prompts.');
      }

      if (data.scenePrompts && Array.isArray(data.scenePrompts)) {
        if (data.scenePrompts.length < expectedCount) {
          setWarning(
            `The AI returned fewer scenes than required (${data.scenePrompts.length} of ${expectedCount} requested). Generate the remaining scenes to complete the duration.`
          );
        }

        if (isBatch && scenePrompts.length > 0) {
          const map = new Map<number, ScenePrompt>();
          scenePrompts.forEach((s) => map.set(s.sceneNumber, s));
          data.scenePrompts.forEach((s: ScenePrompt) => map.set(s.sceneNumber, s));
          const merged = Array.from(map.values()).sort((a, b) => a.sceneNumber - b.sceneNumber);
          setScenePrompts(merged);

          const nextStart = Math.max(...merged.map((s) => s.sceneNumber)) + 1;
          setStartSceneNumber(nextStart);
          setEndSceneNumber(Math.min(targetSceneCount, nextStart + size - 1));
        } else {
          setScenePrompts(data.scenePrompts);
          if (isBatch) {
            const nextStart = Math.max(...data.scenePrompts.map((s: ScenePrompt) => s.sceneNumber)) + 1;
            setStartSceneNumber(nextStart);
            setEndSceneNumber(Math.min(targetSceneCount, nextStart + size - 1));
          }
        }
      } else {
        throw new Error('Invalid scene prompts format returned from server.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate scene prompts.');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateRemainingScenes = () => {
    if (remainingSceneCount <= 0) return;
    const start = generatedSceneCount + 1;
    const end = targetSceneCount;
    const size = end - start + 1;
    handleGeneratePrompts({ start, end, size });
  };

  const handleSavePrompts = async () => {
    if (!storyId || scenePrompts.length === 0) return;

    // Validation: Check duplicate scene numbers
    const numbers = scenePrompts.map((s) => s.sceneNumber);
    const duplicate = numbers.find((num, idx) => numbers.indexOf(num) !== idx);
    if (duplicate !== undefined) {
      setError(`Duplicate scene number Scene ${duplicate} detected. Please ensure all scene numbers are unique and sequential.`);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await apiFetch(`/api/stories/${storyId}/prompts/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenePrompts }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save scene prompts.');
      }

      setSavedSuccess(true);
      if (data.scenePrompts) {
        setScenePrompts(data.scenePrompts);
      }
      if (scenePrompts.length < targetSceneCount) {
        setWarning('Scene prompts incomplete. Generate remaining scenes.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save scene prompts.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleOpenEdit = (scene: ScenePrompt) => {
    setEditingScene({ ...scene });
  };

  const handleSaveEdit = () => {
    if (!editingScene) return;
    setScenePrompts((prev) =>
      prev.map((s) => (s.sceneId === editingScene.sceneId ? editingScene : s))
    );
    setEditingScene(null);
    setSavedSuccess(false);
  };

  // Helper: Sync dialogue into video prompt
  const handleSyncDialogueIntoVideoPrompt = () => {
    if (!editingScene) return;
    const lines = editingScene.dialogue
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    let dialogueInstruction = lines
      .map((line) => {
        const parts = line.split(':');
        if (parts.length >= 2) {
          const char = parts[0].trim();
          const speech = parts.slice(1).join(':').trim();
          return `${char} speaks with natural lip movement: ${speech}`;
        }
        return line;
      })
      .join(' ');

    const updatedVideo = `${editingScene.videoPrompt} Dialogue spoken directly by characters with natural lip movement: ${dialogueInstruction}.`;
    setEditingScene({
      ...editingScene,
      videoPrompt: updatedVideo,
    });
  };

  return (
    <AppLayout
      activeNav="Scenes & Prompts"
      pageTitle="Scene Image & Video Prompt Generator"
      pageSubtitle="Generate complete, copy-ready AI prompts for every scene with embedded dialogue"
    >
      {/* Back navigation */}
      <div className="flex items-center gap-3 mb-4">
        <Link
          to={`/stories/${storyId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Story</span>
        </Link>
        <span className="text-purple-600">•</span>
        <Link
          to={`/stories/${storyId}/characters`}
          className="text-xs font-semibold text-purple-300 hover:text-white transition-colors"
        >
          <span>View Story Cast ({characters.length})</span>
        </Link>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/70 border border-red-500/50 flex items-start gap-3 text-red-200 text-xs">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold mb-1">Prompt Generation Notice</p>
            <p className="text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* WARNING BANNER */}
      {warning && (
        <div className="mb-6 p-4 rounded-xl bg-amber-950/70 border border-amber-500/50 flex items-start gap-3 text-amber-200 text-xs shadow-md">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold mb-0.5">Duration Completion Notice</p>
            <p className="text-amber-300">{warning}</p>
          </div>
        </div>
      )}

      {/* STORY CONTEXT BANNER */}
      {story && (
        <div className="drama-card p-5 sm:p-6 rounded-2xl border border-purple-900/40 bg-gradient-to-r from-purple-950/40 via-[#15102a] to-amber-950/20 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                  {story.storyType}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-900/40 border border-purple-700/40 text-purple-300 text-[10px] font-medium">
                  {story.visualStyle}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-900/40 border border-indigo-700/40 text-indigo-300 text-[10px] font-medium">
                  {story.targetPlatform} ({story.aspectRatio})
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[10px] font-semibold">
                  {characters.length} Approved Characters
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {story.title}
              </h1>
              <p className="text-xs text-purple-200/80 mt-1 line-clamp-2 max-w-3xl">
                {story.logline || story.storyIdea}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {savedSuccess && scenePrompts.length > 0 && (
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>{scenePrompts.length} Saved</span>
                </div>
              )}
              {scenePrompts.length > 0 && (
                <Link
                  to={`/stories/${storyId}/export`}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Continue to Export Pack</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CHARACTERS REQUIRED GATE (RULE) */}
      {!loading && characters.length === 0 ? (
        <div className="drama-card p-10 text-center rounded-2xl border border-dashed border-amber-500/40 bg-[#120e24] my-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-400">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white mb-2">Characters required first</h3>
          <p className="text-xs text-purple-300/80 max-w-md mx-auto mb-6">
            Generate and save characters before creating scene prompts. Scene prompts embed character bibles and consistency instructions directly.
          </p>
          <Link
            to={`/stories/${storyId}/characters`}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-purple-600 hover:from-amber-400 text-slate-950 text-xs font-bold inline-flex items-center gap-2 shadow-lg active:scale-95"
          >
            <Users className="w-4 h-4" />
            <span>Go to Characters</span>
          </Link>
        </div>
      ) : (
        <>
          {/* EXACT DURATION & SCENE PROMPT PROGRESS CARD */}
          <div className="drama-card p-5 sm:p-6 rounded-2xl border border-purple-900/50 bg-[#140f2b] mb-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-purple-900/40">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Continuous Project Duration & Scene Prompt Count
                  </h3>
                </div>
                <p className="text-xs text-purple-300">
                  Target Scene Count Formula: <code className="text-amber-300 font-mono">Math.ceil({durationSeconds}s / {sceneDurationSeconds}s) = {targetSceneCount} prompts</code> (One continuous story • No episodes)
                </p>
              </div>

              {/* Status Indicator */}
              <div>
                {generatedSceneCount === 0 ? (
                  <span className="px-3.5 py-1.5 rounded-xl bg-purple-900/50 border border-purple-700/50 text-purple-300 text-xs font-bold inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    <span>Not Started (Ready to generate {targetSceneCount} scenes)</span>
                  </span>
                ) : generatedSceneCount >= targetSceneCount ? (
                  <span className="px-3.5 py-1.5 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Scene prompts complete.</span>
                  </span>
                ) : (
                  <span className="px-3.5 py-1.5 rounded-xl bg-amber-950/90 border border-amber-500/60 text-amber-300 text-xs font-bold inline-flex items-center gap-1.5 animate-pulse">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span>Scene prompts incomplete. Generate remaining scenes.</span>
                  </span>
                )}
              </div>
            </div>

            {/* Metrics Display Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-4">
              <div className="p-3.5 rounded-xl bg-[#0e0a1f] border border-purple-900/40">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block mb-1">
                  Total duration
                </span>
                <span className="text-sm sm:text-base font-black text-white">
                  {videoDuration}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0e0a1f] border border-purple-900/40">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block mb-1">
                  Scene duration
                </span>
                <span className="text-sm sm:text-base font-black text-white">
                  {sceneDuration}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0e0a1f] border border-amber-500/30">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                  Required prompts
                </span>
                <span className="text-sm sm:text-base font-black text-amber-300">
                  {targetSceneCount}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0e0a1f] border border-emerald-500/30">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                  Generated prompts
                </span>
                <span className="text-sm sm:text-base font-black text-emerald-300">
                  {generatedSceneCount}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0e0a1f] border border-purple-700/40 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 block mb-1">
                  Remaining prompts
                </span>
                <span className={`text-sm sm:text-base font-black ${remainingSceneCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {remainingSceneCount}
                </span>
              </div>
            </div>

            {/* Generate Remaining Scenes action if incomplete */}
            {remainingSceneCount > 0 && generatedSceneCount > 0 && (
              <div className="mt-4 pt-3.5 border-t border-purple-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-950/30 p-3.5 rounded-xl border border-amber-500/40">
                <div className="text-xs text-amber-200">
                  <strong className="text-white block sm:inline mb-1 sm:mb-0">Scene prompts incomplete: </strong>
                  Missing {remainingSceneCount} scenes (Scenes {generatedSceneCount + 1}–{targetSceneCount}) to fulfill {videoDuration} project duration.
                </div>
                <button
                  type="button"
                  onClick={handleGenerateRemainingScenes}
                  disabled={generating}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer"
                >
                  {generating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Generating Remaining Scenes...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                      <span>Generate Remaining Scenes</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* GENERATION CONTROLS BAR */}
          <div className="drama-card p-5 sm:p-6 rounded-2xl border border-purple-900/40 bg-[#120e24] mb-8">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Film className="w-4 h-4 text-amber-400" />
              <span>Cinematic Prompt Engineering Parameters</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-5">
              {/* Aspect Ratio */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-purple-300 mb-1.5">
                  Aspect Ratio
                </label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="w-full bg-[#1b1535] border border-purple-800/40 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400/80"
                >
                  {aspectRatioOptions.map((opt) => (
                    <option key={opt} value={opt} className="bg-[#120e24] text-white">
                      {opt} {opt === '9:16' ? '(Vertical Shorts/TikTok)' : opt === '16:9' ? '(Widescreen YouTube)' : '(Square)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Visual Style */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-purple-300 mb-1.5">
                  Visual Style
                </label>
                <select
                  value={visualStyle}
                  onChange={(e) => setVisualStyle(e.target.value)}
                  className="w-full bg-[#1b1535] border border-purple-800/40 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400/80"
                >
                  {visualStyleOptions.map((opt) => (
                    <option key={opt} value={opt} className="bg-[#120e24] text-white">
                      {opt}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-purple-300/80 mt-1.5 leading-snug">
                  {getVisualStyleHelper(visualStyle)}
                </p>
              </div>

              {/* Video Duration */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-purple-300 mb-1.5">
                  Total Video Duration
                </label>
                <select
                  value={videoDuration}
                  onChange={(e) => setVideoDuration(e.target.value)}
                  className="w-full bg-[#1b1535] border border-purple-800/40 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400/80"
                >
                  {videoDurationOptions.map((opt) => (
                    <option key={opt} value={opt} className="bg-[#120e24] text-white">
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Scene Duration */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-purple-300 mb-1.5">
                  Per-Scene Duration
                </label>
                <select
                  value={sceneDuration}
                  onChange={(e) => setSceneDuration(e.target.value)}
                  className="w-full bg-[#1b1535] border border-purple-800/40 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400/80"
                >
                  {sceneDurationOptions.map((opt) => (
                    <option key={opt} value={opt} className="bg-[#120e24] text-white">
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Camera Style */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-purple-300 mb-1.5">
                  Camera Direction
                </label>
                <select
                  value={cameraStyle}
                  onChange={(e) => setCameraStyle(e.target.value)}
                  className="w-full bg-[#1b1535] border border-purple-800/40 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400/80"
                >
                  {cameraStyleOptions.map((opt) => (
                    <option key={opt} value={opt} className="bg-[#120e24] text-white">
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Platform */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-purple-300 mb-1.5">
                  Target Platform
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full bg-[#1b1535] border border-purple-800/40 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400/80"
                >
                  {platformOptions.map((opt) => (
                    <option key={opt} value={opt} className="bg-[#120e24] text-white">
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dialogue Mode */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-purple-300 mb-1.5">
                  Dialogue Dynamic
                </label>
                <select
                  value={dialogueMode}
                  onChange={(e) => setDialogueMode(e.target.value)}
                  className="w-full bg-[#1b1535] border border-purple-800/40 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400/80"
                >
                  {dialogueModeOptions.map((opt) => (
                    <option key={opt} value={opt} className="bg-[#120e24] text-white">
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Consistency Mode */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-purple-300 mb-1.5">
                  Identity Lock
                </label>
                <select
                  value={consistencyMode}
                  onChange={(e) => setConsistencyMode(e.target.value)}
                  className="w-full bg-[#1b1535] border border-purple-800/40 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400/80"
                >
                  {consistencyOptions.map((opt) => (
                    <option key={opt} value={opt} className="bg-[#120e24] text-white">
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Long-form Project Batching Section */}
            {isBatchMode && (
              <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-950/80 to-[#1e153b] border border-amber-500/40 shadow-inner">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3 pb-3 border-b border-purple-800/40">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-white">
                        Generate Prompts by Batch
                      </h3>
                      <p className="text-[11px] text-amber-300 font-medium">
                        This is a long-form project. Generate scene prompts in batches for better quality.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsBatchMode(!isBatchMode)}
                    className="text-[10px] text-purple-300 hover:text-white underline self-start md:self-auto"
                  >
                    Switch to single-shot mode
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  {/* Batch Size selector */}
                  <div className="sm:col-span-4">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-purple-300 mb-1.5">
                      Batch Size
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[5, 10, 15].map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => handleBatchSizeChange(size)}
                          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all border ${
                            batchSize === size
                              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                              : 'bg-purple-900/40 text-purple-200 border-purple-800/40 hover:bg-purple-800/50'
                          }`}
                        >
                          {size} scenes
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Start Scene Number */}
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-purple-300 mb-1.5">
                      Start Scene
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={startSceneNumber}
                      onChange={(e) => handleStartSceneChange(parseInt(e.target.value) || 1)}
                      className="w-full bg-[#120e24] border border-purple-800/50 rounded-xl px-3 py-1.5 text-xs text-white text-center font-bold focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* End Scene Number */}
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-purple-300 mb-1.5">
                      End Scene
                    </label>
                    <input
                      type="number"
                      min={startSceneNumber}
                      value={endSceneNumber}
                      onChange={(e) => setEndSceneNumber(Math.max(startSceneNumber, parseInt(e.target.value) || startSceneNumber))}
                      className="w-full bg-[#120e24] border border-purple-800/50 rounded-xl px-3 py-1.5 text-xs text-white text-center font-bold focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Generate Batch Prompts Button */}
                  <div className="sm:col-span-4">
                    <button
                      type="button"
                      onClick={() => handleGeneratePrompts({ start: startSceneNumber, end: endSceneNumber, size: batchSize })}
                      disabled={generating}
                      className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-purple-600 hover:from-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
                    >
                      {generating ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                          <span>Generating Batch...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                          <span>Generate Batch Prompts ({startSceneNumber}–{endSceneNumber})</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Batch history if any */}
                {story?.generatedSceneBatches && story.generatedSceneBatches.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-purple-900/40 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] text-purple-400 font-semibold">Generated Batches:</span>
                    {story.generatedSceneBatches.map((b, bIdx) => (
                      <span
                        key={bIdx}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-purple-900/40 text-purple-300 border border-purple-700/40 font-mono"
                      >
                        Batch {b.batchNumber}: Scenes {b.startScene}–{b.endScene} ({b.sceneCount})
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!isBatchMode && (
              <div className="mb-4 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setIsBatchMode(true)}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1.5 font-medium"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Enable Batch Generation Mode (for long projects)</span>
                </button>
              </div>
            )}

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-purple-900/30">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleGeneratePrompts()}
                  disabled={generating}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Generating Scene Prompt Suite...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>{scenePrompts.length > 0 ? 'Regenerate Prompts' : 'Generate Scene Prompts'}</span>
                    </>
                  )}
                </button>

                {scenePrompts.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSavePrompts}
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl bg-purple-700/80 hover:bg-purple-600 text-white font-semibold text-xs flex items-center gap-2 transition-colors border border-purple-500/40 active:scale-95 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving to Firestore...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save All Scene Prompts</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="text-[11px] text-purple-400 font-medium">
                1-Click Copy-Ready • Embedded Dialogue • No Narrator
              </div>
            </div>
          </div>

          {/* SCENE PROMPTS LIST */}
          {loading ? (
            <div className="p-16 text-center text-purple-300 text-xs flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <span>Loading scene prompts...</span>
            </div>
          ) : scenePrompts.length === 0 ? (
            <div className="drama-card p-12 text-center rounded-2xl border border-dashed border-purple-900/60 bg-[#100c22]">
              <div className="w-14 h-14 rounded-2xl bg-purple-950/70 border border-purple-800/40 flex items-center justify-center mx-auto mb-4 text-amber-400">
                <Film className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">No Scene Prompts Generated Yet</h3>
              <p className="text-xs text-purple-300/80 max-w-md mx-auto mb-6">
                Click <strong>Generate Scene Prompts</strong> above to create production-ready Midjourney/FLUX image prompts and Runway/Luma video prompts with characters and dialogue fully embedded.
              </p>
              <button
                type="button"
                onClick={() => handleGeneratePrompts()}
                disabled={generating}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 text-slate-950 text-xs font-bold inline-flex items-center gap-2 shadow-lg active:scale-95 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Scene Prompts Now</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Film className="w-4 h-4 text-amber-400" />
                  <span>Production Scenes ({scenePrompts.length} Complete Prompts)</span>
                </h3>
                <span className="text-[11px] text-purple-300/70">
                  Each prompt is self-contained and copy-ready
                </span>
              </div>

              <div className="space-y-6">
                {scenePrompts.map((scene, index) => {
                  const sNumber = scene.sceneNumber || index + 1;
                  const chars = Array.isArray(scene.charactersInScene)
                    ? scene.charactersInScene.join(', ')
                    : scene.charactersInScene;

                  return (
                    <div
                      key={scene.sceneId || index}
                      className="drama-card p-6 rounded-2xl border border-purple-900/40 bg-[#120e24] shadow-md hover:border-purple-800/60 transition-all"
                    >
                      {/* SCENE HEADER */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-purple-900/30">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black">
                              Scene {sNumber}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-purple-900/40 border border-purple-700/40 text-purple-300 text-[10px] font-semibold flex items-center gap-1">
                              <Clock className="w-3 h-3 text-purple-400" />
                              <span>{scene.sceneDuration}</span>
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-indigo-900/40 border border-indigo-700/40 text-indigo-300 text-[10px] font-semibold flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-indigo-400" />
                              <span>{scene.location} ({scene.timeOfDay})</span>
                            </span>
                          </div>

                          <h4 className="text-base font-bold text-white tracking-tight">
                            {scene.sceneTitle}
                          </h4>
                          <p className="text-xs text-purple-200/90 font-medium mt-1">
                            Cast: <strong className="text-amber-300">{chars}</strong>
                            {scene.allVisiblePeople && scene.allVisiblePeople !== chars && (
                              <span className="text-purple-400 ml-1">({scene.allVisiblePeople})</span>
                            )}
                          </p>
                        </div>

                        {/* Top Actions: Edit, View Detail */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(scene)}
                            className="px-3 py-1.5 rounded-lg bg-purple-950/70 hover:bg-purple-900/50 border border-purple-800/40 text-purple-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-purple-300" />
                            <span>Edit Scene</span>
                          </button>

                          <Link
                            to={`/stories/${storyId}/prompts/${scene.sceneId}`}
                            className="px-3 py-1.5 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                            <span>Full Scene</span>
                          </Link>
                        </div>
                      </div>

                      {/* DRAMATIC ACTION & DIALOGUE PREVIEW */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-4">
                        <div className="p-3.5 rounded-xl bg-[#17122e] border border-purple-900/30">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block mb-1">
                            Dramatic Action & Movement
                          </span>
                          <p className="text-xs text-slate-200 leading-relaxed">
                            {scene.mainAction}
                          </p>
                          <div className="mt-2 text-[11px] text-purple-300/80">
                            Tone: <em>{scene.emotionalTone}</em>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[#17122e] border border-purple-900/30">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1 flex items-center gap-1.5">
                            <MessageSquare className="w-3 h-3 text-amber-400" />
                            <span>Dialogue (Spoken Directly • No Narrator)</span>
                          </span>
                          <div className="text-xs text-purple-100 font-mono whitespace-pre-wrap leading-relaxed">
                            {scene.dialogue || '(Non-verbal confrontation / High tension silent reaction)'}
                          </div>
                        </div>
                      </div>

                      {/* SIDE-BY-SIDE COPY-READY PROMPTS (DESKTOP) / STACKED (MOBILE) */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                        {/* 1. COMPLETE IMAGE PROMPT */}
                        <div className="p-4 rounded-xl bg-[#0c0918] border border-amber-500/30 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-500/20">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                                <Camera className="w-3.5 h-3.5 text-amber-400" />
                                <span>Complete Image Prompt (Midjourney / FLUX)</span>
                              </span>

                              <button
                                type="button"
                                onClick={() => handleCopy(scene.imagePrompt, `${scene.sceneId}_img`)}
                                className="px-3 py-1.5 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm active:scale-95"
                              >
                                {copiedKey === `${scene.sceneId}_img` ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    <span className="text-emerald-300">Prompt Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copy Image Prompt</span>
                                  </>
                                )}
                              </button>
                            </div>

                            <p className="text-xs text-slate-200 font-mono leading-relaxed whitespace-pre-wrap max-h-52 overflow-y-auto pr-1">
                              {scene.imagePrompt}
                            </p>
                          </div>

                          <div className="mt-3 pt-2 border-t border-purple-900/30 flex items-center justify-between text-[10px] text-purple-400">
                            <span>Self-contained: Includes character bibles & styling</span>
                            <span>{scene.aspectRatio}</span>
                          </div>
                        </div>

                        {/* 2. COMPLETE VIDEO PROMPT */}
                        <div className="p-4 rounded-xl bg-[#0c0918] border border-purple-700/40 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between pb-2 mb-2 border-b border-purple-700/30">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                                <Video className="w-3.5 h-3.5 text-purple-400" />
                                <span>Complete Video Prompt (Runway / Kling / Luma)</span>
                              </span>

                              <button
                                type="button"
                                onClick={() => handleCopy(scene.videoPrompt, `${scene.sceneId}_vid`)}
                                className="px-3 py-1.5 rounded-lg bg-purple-700/40 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm active:scale-95"
                              >
                                {copiedKey === `${scene.sceneId}_vid` ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    <span className="text-emerald-300">Prompt Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copy Video Prompt</span>
                                  </>
                                )}
                              </button>
                            </div>

                            <p className="text-xs text-purple-100 font-mono leading-relaxed whitespace-pre-wrap max-h-52 overflow-y-auto pr-1">
                              {scene.videoPrompt}
                            </p>
                          </div>

                          <div className="mt-3 pt-2 border-t border-purple-900/30 flex items-center justify-between text-[10px] text-purple-400">
                            <span>Includes dialogue inside prompt • Natural lip movement</span>
                            <span>{scene.sceneDuration}</span>
                          </div>
                        </div>
                      </div>

                      {/* NEGATIVE PROMPT STRIP */}
                      <div className="mt-3 p-2.5 rounded-lg bg-[#0c0918] border border-red-900/30 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 shrink-0">
                            Negative Prompt:
                          </span>
                          <span className="text-[11px] text-red-200/80 font-mono truncate">
                            {scene.negativePrompt}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(scene.negativePrompt, `${scene.sceneId}_neg`)}
                          className="text-[11px] text-red-300 hover:text-white shrink-0 font-semibold px-2 py-0.5"
                        >
                          {copiedKey === `${scene.sceneId}_neg` ? 'Copied!' : 'Copy Negative'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* BOTTOM SAVE CALLOUT */}
              <div className="drama-card p-6 rounded-2xl border border-purple-900/40 bg-gradient-to-r from-purple-950/60 via-[#15102a] to-amber-950/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">
                    Save this complete scene prompt suite?
                  </h4>
                  <p className="text-xs text-purple-200/80">
                    Saving records these prompts to Firestore, updates your story production status, and updates your user statistics.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleSavePrompts}
                    disabled={saving}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-purple-700/80 hover:bg-purple-600 text-white font-bold text-xs flex items-center justify-center gap-2 border border-purple-500/40 active:scale-95 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving Scene Prompts...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Scene Prompts</span>
                      </>
                    )}
                  </button>

                  <Link
                    to={`/stories/${storyId}/export`}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Continue to Export Pack</span>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* EDIT SCENE MODAL */}
      {editingScene && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="drama-card w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl border border-purple-800/60 bg-[#120e24] shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-purple-900/40">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <span>Edit Scene {editingScene.sceneNumber}: {editingScene.sceneTitle}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingScene(null)}
                className="text-purple-300 hover:text-white text-xs font-semibold"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-purple-300 mb-1">
                    Scene Title
                  </label>
                  <input
                    type="text"
                    value={editingScene.sceneTitle}
                    onChange={(e) => setEditingScene({ ...editingScene, sceneTitle: e.target.value })}
                    className="w-full bg-[#1b1535] border border-purple-800/40 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-purple-300 mb-1">
                    Duration & Setting
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={editingScene.sceneDuration}
                      onChange={(e) => setEditingScene({ ...editingScene, sceneDuration: e.target.value })}
                      placeholder="Duration"
                      className="bg-[#1b1535] border border-purple-800/40 rounded-xl px-3 py-2 text-xs text-white"
                    />
                    <input
                      type="text"
                      value={editingScene.location}
                      onChange={(e) => setEditingScene({ ...editingScene, location: e.target.value })}
                      placeholder="Location"
                      className="bg-[#1b1535] border border-purple-800/40 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-purple-300 mb-1">
                  Main Action & Dramatic Movement
                </label>
                <textarea
                  rows={2}
                  value={editingScene.mainAction}
                  onChange={(e) => setEditingScene({ ...editingScene, mainAction: e.target.value })}
                  className="w-full bg-[#1b1535] border border-purple-800/40 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              {/* Dialogue with Sync Helper */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-amber-400">
                    Dialogue (1 to 3 direct lines)
                  </label>
                  <button
                    type="button"
                    onClick={handleSyncDialogueIntoVideoPrompt}
                    className="text-[10px] font-bold text-amber-300 hover:text-white bg-amber-500/20 hover:bg-amber-500/30 px-2 py-0.5 rounded transition-colors flex items-center gap-1"
                    title="Insert these dialogue lines into the complete video prompt"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Sync Dialogue Into Video Prompt</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={editingScene.dialogue}
                  onChange={(e) => setEditingScene({ ...editingScene, dialogue: e.target.value })}
                  className="w-full bg-[#1b1535] border border-purple-800/40 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  placeholder='Amaka: "Chinedu, I sold food under the rain for you."&#10;Chinedu: "Please, don’t embarrass me here."'
                />
                <p className="text-[10px] text-purple-400/80 mt-1">
                  Reminder: If you modify the dialogue, click <strong>Sync Dialogue Into Video Prompt</strong> or update it inside the video prompt.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-amber-400 mb-1">
                  Complete Image Prompt (Self-contained)
                </label>
                <textarea
                  rows={4}
                  value={editingScene.imagePrompt}
                  onChange={(e) => setEditingScene({ ...editingScene, imagePrompt: e.target.value })}
                  className="w-full bg-[#1b1535] border border-purple-800/40 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-purple-300 mb-1">
                  Complete Video Prompt (Includes Dialogue)
                </label>
                <textarea
                  rows={4}
                  value={editingScene.videoPrompt}
                  onChange={(e) => setEditingScene({ ...editingScene, videoPrompt: e.target.value })}
                  className="w-full bg-[#1b1535] border border-purple-800/40 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-red-400 mb-1">
                  Negative Prompt
                </label>
                <textarea
                  rows={2}
                  value={editingScene.negativePrompt}
                  onChange={(e) => setEditingScene({ ...editingScene, negativePrompt: e.target.value })}
                  className="w-full bg-[#1b1535] border border-purple-800/40 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-5 mt-5 border-t border-purple-900/40">
              <button
                type="button"
                onClick={() => setEditingScene(null)}
                className="px-4 py-2 rounded-xl bg-purple-950/60 text-purple-300 text-xs font-semibold hover:bg-purple-900/40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};
