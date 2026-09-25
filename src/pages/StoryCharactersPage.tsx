import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  Users,
  Sparkles,
  ArrowLeft,
  Copy,
  Check,
  Edit3,
  Save,
  RotateCw,
  AlertCircle,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Layers,
  Palette,
  Eye,
  Camera,
  CheckCircle,
  Film,
  Compass,
} from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { apiFetch } from '../utils/api';
import type { DramaStory, CharacterProfile } from '../types';
import { VISUAL_STYLE_OPTIONS, getVisualStyleHelper } from '../utils/visualStyles';

export const StoryCharactersPage: React.FC = () => {
  const { storyId } = useParams<{ storyId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const autoParam = searchParams.get('auto') === 'true';
  const autoTriggeredRef = useRef(false);

  const [story, setStory] = useState<DramaStory | null>(null);
  const [characters, setCharacters] = useState<CharacterProfile[]>([]);
  const [loadingStory, setLoadingStory] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generation Controls
  const [visualStyle, setVisualStyle] = useState('Cinematic Nollywood Style');
  const [consistencyLevel, setConsistencyLevel] = useState('Ultra Consistent');
  const [culturalSetting, setCulturalSetting] = useState('Modern Nigerian');
  const [characterDetailLevel, setCharacterDetailLevel] = useState('Production Ready');
  const [mainCharCount, setMainCharCount] = useState<number>(5);

  // Copy Feedback State: key = `${characterId}_${type}`
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Edit Modal State
  const [editingCharacter, setEditingCharacter] = useState<CharacterProfile | null>(null);
  const [expandedBibleId, setExpandedBibleId] = useState<string | null>(null);

  const visualStyleOptions = VISUAL_STYLE_OPTIONS;

  const consistencyOptions = [
    'Ultra Consistent',
    'High',
    'Standard',
  ];

  const culturalSettingOptions = [
    'Modern Nigerian',
    'Lagos Urban',
    'Eastern Nigeria',
    'Yoruba Family',
    'Igbo Family',
    'Hausa/Northern Nigeria',
    'Village Traditional',
    'African Luxury',
    'Mixed African',
  ];

  const detailLevelOptions = [
    'Production Ready',
    'Detailed',
    'Simple',
  ];

  // Load Story and existing characters
  useEffect(() => {
    if (!storyId) return;

    setLoadingStory(true);
    setError(null);

    Promise.all([
      apiFetch(`/api/stories/${storyId}`).then((res) => (res.ok ? res.json() : Promise.reject('Failed to load story'))),
      apiFetch(`/api/stories/${storyId}/characters`).then((res) => (res.ok ? res.json() : { characters: [] })),
    ])
      .then(([storyData, charsData]) => {
        if (storyData.story) {
          setStory(storyData.story);
          if (storyData.story.visualStyle) {
            setVisualStyle(storyData.story.visualStyle);
          }
          if (storyData.story.mainCharacterCount) {
            setMainCharCount(storyData.story.mainCharacterCount);
          }
        }
        if (charsData.characters && Array.isArray(charsData.characters) && charsData.characters.length > 0) {
          setCharacters(charsData.characters);
          setSavedSuccess(true);
        } else if (autoParam && !autoTriggeredRef.current && storyData.story) {
          autoTriggeredRef.current = true;
          setSearchParams({}, { replace: true });
          setTimeout(() => {
            handleGenerateCharacters(storyData.story.visualStyle);
          }, 350);
        }
      })
      .catch((err: any) => {
        setError(typeof err === 'string' ? err : err.message || 'Error loading story.');
      })
      .finally(() => {
        setLoadingStory(false);
      });
  }, [storyId]);

  const handleGenerateCharacters = async (overrideStyle?: string) => {
    if (!storyId) return;

    setGenerating(true);
    setError(null);
    setSavedSuccess(false);

    try {
      const res = await apiFetch(`/api/stories/${storyId}/characters/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visualStyle: overrideStyle || visualStyle,
          consistencyLevel,
          culturalSetting,
          characterDetailLevel,
          mainCharacterCount: mainCharCount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate characters.');
      }

      if (data.characters && Array.isArray(data.characters)) {
        setCharacters(data.characters);
        // Expand the first character's bible by default
        if (data.characters.length > 0) {
          setExpandedBibleId(data.characters[0].characterId);
        }
      } else {
        throw new Error('Invalid characters format returned from server.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate characters.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveCharacters = async () => {
    if (!storyId || characters.length === 0) return;

    setSaving(true);
    setError(null);

    try {
      const res = await apiFetch(`/api/stories/${storyId}/characters/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characters }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save characters.');
      }

      setSavedSuccess(true);
      if (data.characters) {
        setCharacters(data.characters);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save characters.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleOpenEdit = (character: CharacterProfile) => {
    setEditingCharacter({ ...character });
  };

  const handleSaveEdit = () => {
    if (!editingCharacter) return;
    setCharacters((prev) =>
      prev.map((c) => (c.characterId === editingCharacter.characterId ? editingCharacter : c))
    );
    setEditingCharacter(null);
    setSavedSuccess(false); // Mark as unsaved changes
  };

  return (
    <AppLayout
      activeNav="Characters"
      pageTitle="Story Cast & Character Bible"
      pageSubtitle="Generate consistent African drama characters with non-negotiable face bibles"
    >
      {/* Back button */}
      <div className="mb-4">
        <Link
          to={`/stories/${storyId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Drama Script</span>
        </Link>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/70 border border-red-500/50 flex items-start gap-3 text-red-200 text-xs">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold mb-1">Character Generation Notice</p>
            <p className="text-red-300">{error}</p>
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
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {story.title}
              </h1>
              <p className="text-xs text-purple-200/80 mt-1 line-clamp-2 max-w-3xl">
                {story.logline || story.storyIdea}
              </p>
            </div>

            {/* Actions / Saved indicator */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {savedSuccess && characters.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>{characters.length} Saved</span>
                </div>
              )}
              {characters.length > 0 && (
                <Link
                  to={`/stories/${storyId}/prompts`}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>Continue to Scene Prompts</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONTROLS BAR */}
      <div className="drama-card p-5 sm:p-6 rounded-2xl border border-purple-900/40 bg-[#120e24] mb-8">
        <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <span>Casting & Consistency Configuration</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          {/* Visual Style */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-purple-300 mb-1.5">
              Visual Style
            </label>
            <div className="relative">
              <select
                value={visualStyle}
                onChange={(e) => setVisualStyle(e.target.value)}
                className="w-full bg-[#1b1535] border border-purple-800/40 rounded-xl px-3.5 py-2.5 text-xs text-white appearance-none focus:outline-none focus:border-amber-400/80 transition-colors pr-9"
              >
                {visualStyleOptions.map((opt) => (
                  <option key={opt} value={opt} className="bg-[#120e24] text-white">
                    {opt}
                  </option>
                ))}
              </select>
              <Palette className="w-4 h-4 text-purple-400 absolute right-3 top-3 pointer-events-none" />
            </div>
            <p className="text-[11px] text-purple-300/80 mt-1.5 leading-snug">
              {getVisualStyleHelper(visualStyle)}
            </p>
          </div>

          {/* Consistency Level */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-purple-300 mb-1.5">
              Consistency Level
            </label>
            <div className="relative">
              <select
                value={consistencyLevel}
                onChange={(e) => setConsistencyLevel(e.target.value)}
                className="w-full bg-[#1b1535] border border-purple-800/40 rounded-xl px-3.5 py-2.5 text-xs text-white appearance-none focus:outline-none focus:border-amber-400/80 transition-colors pr-9"
              >
                {consistencyOptions.map((opt) => (
                  <option key={opt} value={opt} className="bg-[#120e24] text-white">
                    {opt}
                  </option>
                ))}
              </select>
              <ShieldAlert className="w-4 h-4 text-purple-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Cultural Setting */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-purple-300 mb-1.5">
              Cultural Setting
            </label>
            <div className="relative">
              <select
                value={culturalSetting}
                onChange={(e) => setCulturalSetting(e.target.value)}
                className="w-full bg-[#1b1535] border border-purple-800/40 rounded-xl px-3.5 py-2.5 text-xs text-white appearance-none focus:outline-none focus:border-amber-400/80 transition-colors pr-9"
              >
                {culturalSettingOptions.map((opt) => (
                  <option key={opt} value={opt} className="bg-[#120e24] text-white">
                    {opt}
                  </option>
                ))}
              </select>
              <Compass className="w-4 h-4 text-purple-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Character Detail Level */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-purple-300 mb-1.5">
              Detail Level
            </label>
            <div className="relative">
              <select
                value={characterDetailLevel}
                onChange={(e) => setCharacterDetailLevel(e.target.value)}
                className="w-full bg-[#1b1535] border border-purple-800/40 rounded-xl px-3.5 py-2.5 text-xs text-white appearance-none focus:outline-none focus:border-amber-400/80 transition-colors pr-9"
              >
                {detailLevelOptions.map((opt) => (
                  <option key={opt} value={opt} className="bg-[#120e24] text-white">
                    {opt}
                  </option>
                ))}
              </select>
              <Eye className="w-4 h-4 text-purple-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Main Speaking Characters Selector & Rule */}
        <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-900/50 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Main Speaking Characters: <strong className="text-amber-300">{mainCharCount}</strong>
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setMainCharCount(num)}
                  className={`py-1 px-2.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                    mainCharCount === num
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                      : 'bg-purple-950/60 text-purple-200 border-purple-800/40 hover:bg-purple-800/50 hover:text-white'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-purple-300/80 leading-normal">
            <strong>This means only the people who will talk in the story.</strong> Background crowds, party guests, church members, market people, and office workers are not counted unless they speak.
          </p>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-purple-900/30">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleGenerateCharacters()}
              disabled={generating}
              className="gold-gradient-btn px-6 py-2.5 rounded-xl text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg hover:shadow-amber-500/30 active:scale-95 transition-all border border-amber-400/60 disabled:opacity-50 cursor-pointer"
            >
              {generating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Generating AI Character Bibles...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>{characters.length > 0 ? 'Regenerate Characters' : 'Generate Characters'}</span>
                </>
              )}
            </button>

            {characters.length > 0 && (
              <button
                type="button"
                onClick={handleSaveCharacters}
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
                    <span>Save All Characters</span>
                  </>
                )}
              </button>
            )}
          </div>

          {characters.length > 0 && (
            <Link
              to="/characters"
              className="text-xs text-purple-300 hover:text-white font-semibold flex items-center gap-1 transition-colors"
            >
              <span>View Character Library</span>
              <span>→</span>
            </Link>
          )}
        </div>
      </div>

      {/* CHARACTERS LIST */}
      {loadingStory ? (
        <div className="p-12 text-center text-purple-300 text-xs flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <span>Loading drama story and character records...</span>
        </div>
      ) : characters.length === 0 ? (
        <div className="drama-card p-12 text-center rounded-2xl border border-dashed border-purple-900/60 bg-[#100c22]">
          <div className="w-14 h-14 rounded-2xl bg-purple-950/70 border border-purple-800/40 flex items-center justify-center mx-auto mb-4 text-amber-400">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white mb-2">No Characters Generated Yet</h3>
          <p className="text-xs text-purple-300/80 max-w-md mx-auto mb-6">
            Click <strong>Generate Characters</strong> above to extract all speaking roles from this drama, build strict character bibles, and create reference prompts for FLUX and Midjourney.
          </p>
          <button
            type="button"
            onClick={() => handleGenerateCharacters()}
            disabled={generating}
            className="gold-gradient-btn px-8 py-3.5 rounded-xl text-slate-950 text-xs sm:text-sm font-black uppercase tracking-wider inline-flex items-center gap-2 shadow-xl hover:shadow-amber-500/35 active:scale-95 transition-all border border-amber-400/60 disabled:opacity-50 cursor-pointer"
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Generating AI Character Bibles...</span>
              </>
            ) : (
              <>
                <Users className="w-4 h-4 text-slate-950" />
                <span>Generate Characters Now</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              <span>Drama Cast ({characters.length} Characters)</span>
            </h3>
            <span className="text-[11px] text-purple-300/70">
              Face & Attire Consistency Enforced
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {characters.map((char, index) => {
              const isBibleExpanded = expandedBibleId === char.characterId;
              const initials = char.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

              return (
                <div
                  key={char.characterId || index}
                  className="drama-card p-6 rounded-2xl border border-purple-900/40 bg-[#120e24] hover:border-purple-800/60 transition-all shadow-md"
                >
                  {/* CHARACTER HEADER */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-purple-900/30">
                    <div className="flex items-start gap-4">
                      {/* Avatar Placeholder */}
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 via-purple-600/30 to-indigo-900/40 border border-purple-700/40 flex items-center justify-center shrink-0 text-amber-300 font-black text-lg shadow-inner">
                        {initials}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="text-lg font-black text-white tracking-tight">
                            {char.name}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full bg-purple-900/50 border border-purple-700/40 text-purple-200 text-[10px] font-semibold">
                            {char.age} yrs • {char.gender}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                            {char.roleInStory}
                          </span>
                        </div>

                        <p className="text-xs text-purple-200/90 font-medium">
                          {char.culturalIdentity} • {char.relationshipToOtherCharacters || 'Core Cast Member'}
                        </p>
                      </div>
                    </div>

                    {/* Actions: Edit, Link to Detail */}
                    <div className="flex items-center gap-2 self-start">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(char)}
                        className="px-3 py-1.5 rounded-lg bg-purple-950/70 hover:bg-purple-900/50 border border-purple-800/40 text-purple-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-purple-300" />
                        <span>Edit</span>
                      </button>

                      <Link
                        to={`/characters/${char.characterId}`}
                        className="px-3 py-1.5 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Full Dossier</span>
                      </Link>
                    </div>
                  </div>

                  {/* CHARACTER SPECS GRID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 my-4">
                    <div className="p-3 rounded-xl bg-[#17122e] border border-purple-900/30">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-400 block mb-1">
                        Face Architecture
                      </span>
                      <p className="text-xs text-slate-200 line-clamp-2">
                        {char.faceDescription || 'High cheekbones, expressive eyes'}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#17122e] border border-purple-900/30">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-400 block mb-1">
                        Skin Tone & Hair
                      </span>
                      <p className="text-xs text-slate-200 line-clamp-2">
                        {char.skinTone} • {char.hairstyle}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#17122e] border border-purple-900/30">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-400 block mb-1">
                        Attire & Accessories
                      </span>
                      <p className="text-xs text-slate-200 line-clamp-2">
                        {char.mainOutfit} {char.accessories ? `(${char.accessories})` : ''}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#17122e] border border-purple-900/30">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-400 block mb-1">
                        Voice & Cadence
                      </span>
                      <p className="text-xs text-slate-200 line-clamp-2">
                        {char.voiceStyle} • {char.speakingStyle}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#17122e] border border-purple-900/30">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-400 block mb-1">
                        Personality & Conflict
                      </span>
                      <p className="text-xs text-slate-200 line-clamp-2">
                        {char.personality} ({char.secretOrConflict})
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#17122e] border border-purple-900/30">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-400 block mb-1">
                        First Scene Emotion
                      </span>
                      <p className="text-xs text-amber-300/90 font-medium line-clamp-2">
                        {char.firstSceneEmotion || 'Charged emotional confrontation'}
                      </p>
                    </div>
                  </div>

                  {/* EXPANDABLE CHARACTER BIBLE & PROMPTS */}
                  <div className="mt-4 pt-3 border-t border-purple-900/30">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedBibleId(isBibleExpanded ? null : char.characterId)
                      }
                      className="w-full flex items-center justify-between text-xs font-bold text-amber-300/90 hover:text-amber-200 py-1.5 transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-amber-400" />
                        <span>Character Bible & AI Reference Prompts</span>
                      </span>
                      {isBibleExpanded ? (
                        <ChevronUp className="w-4 h-4 text-amber-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-amber-400" />
                      )}
                    </button>

                    {isBibleExpanded && (
                      <div className="mt-3 space-y-4 pt-2">
                        {/* CHARACTER BIBLE TEXT */}
                        <div className="p-4 rounded-xl bg-[#0c0918] border border-purple-800/40">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300">
                              Character Bible (Face & Identity Lock)
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopyText(char.characterBible, `${char.characterId}_bible`)
                              }
                              className="px-2 py-1 rounded bg-purple-900/40 hover:bg-purple-800/50 text-[11px] text-purple-200 flex items-center gap-1 transition-colors"
                            >
                              {copiedKey === `${char.characterId}_bible` ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-300">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy Bible</span>
                                </>
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-purple-100 leading-relaxed font-mono whitespace-pre-wrap">
                            {char.characterBible}
                          </p>
                        </div>

                        {/* BASE IMAGE PROMPT */}
                        <div className="p-4 rounded-xl bg-[#0c0918] border border-amber-500/30">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                              <Camera className="w-3.5 h-3.5 text-amber-400" />
                              <span>Base Image Prompt (Midjourney / FLUX)</span>
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopyText(char.baseImagePrompt, `${char.characterId}_base`)
                              }
                              className="px-2 py-1 rounded bg-amber-400/20 hover:bg-amber-400/30 text-[11px] text-amber-300 font-semibold flex items-center gap-1 transition-colors"
                            >
                              {copiedKey === `${char.characterId}_base` ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-300">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy Image Prompt</span>
                                </>
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-wrap">
                            {char.baseImagePrompt}
                          </p>
                        </div>

                        {/* NEGATIVE PROMPT & CONSISTENCY INSTRUCTION */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="p-3.5 rounded-xl bg-[#0c0918] border border-red-900/40">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">
                                Negative Prompt (Anti-Drift)
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopyText(char.negativePrompt, `${char.characterId}_neg`)
                                }
                                className="text-[10px] text-red-300 hover:text-white flex items-center gap-1"
                              >
                                {copiedKey === `${char.characterId}_neg` ? 'Copied!' : 'Copy'}
                              </button>
                            </div>
                            <p className="text-[11px] text-red-200/90 leading-relaxed font-mono">
                              {char.negativePrompt}
                            </p>
                          </div>

                          <div className="p-3.5 rounded-xl bg-[#0c0918] border border-blue-900/40">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                                Consistency Instruction
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopyText(
                                    char.consistencyInstruction,
                                    `${char.characterId}_inst`
                                  )
                                }
                                className="text-[10px] text-blue-300 hover:text-white flex items-center gap-1"
                              >
                                {copiedKey === `${char.characterId}_inst` ? 'Copied!' : 'Copy'}
                              </button>
                            </div>
                            <p className="text-[11px] text-blue-200/90 leading-relaxed font-mono">
                              {char.consistencyInstruction}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* BOTTOM SAVE CALLOUT */}
          <div className="drama-card p-6 rounded-2xl border border-purple-900/40 bg-gradient-to-r from-purple-950/60 via-[#15102a] to-amber-950/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-white mb-1">
                Ready to freeze this character cast?
              </h4>
              <p className="text-xs text-purple-200/80">
                Saving will register all characters into your Master Character Library for scene image prompts in Prompt 4.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSaveCharacters}
                disabled={saving}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-purple-700/80 hover:bg-purple-600 text-white font-bold text-xs flex items-center justify-center gap-2 border border-purple-500/40 active:scale-95 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving Characters...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save All Characters ({characters.length})</span>
                  </>
                )}
              </button>

              <Link
                to={`/stories/${storyId}/prompts`}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
              >
                <Film className="w-4 h-4" />
                <span>Continue to Scene Prompts</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* EDIT CHARACTER MODAL */}
      {editingCharacter && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="drama-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl border border-purple-800/60 bg-[#120e24] shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-purple-900/40">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <span>Edit Character: {editingCharacter.name}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingCharacter(null)}
                className="text-purple-300 hover:text-white text-xs font-semibold"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-purple-300 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={editingCharacter.name}
                    onChange={(e) =>
                      setEditingCharacter({ ...editingCharacter, name: e.target.value })
                    }
                    className="w-full bg-[#1b1535] border border-purple-800/40 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-purple-300 mb-1">
                    Role in Story
                  </label>
                  <input
                    type="text"
                    value={editingCharacter.roleInStory}
                    onChange={(e) =>
                      setEditingCharacter({ ...editingCharacter, roleInStory: e.target.value })
                    }
                    className="w-full bg-[#1b1535] border border-purple-800/40 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-purple-300 mb-1">
                    Age
                  </label>
                  <input
                    type="text"
                    value={editingCharacter.age}
                    onChange={(e) =>
                      setEditingCharacter({ ...editingCharacter, age: e.target.value })
                    }
                    className="w-full bg-[#1b1535] border border-purple-800/40 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-purple-300 mb-1">
                    Gender
                  </label>
                  <input
                    type="text"
                    value={editingCharacter.gender}
                    onChange={(e) =>
                      setEditingCharacter({ ...editingCharacter, gender: e.target.value })
                    }
                    className="w-full bg-[#1b1535] border border-purple-800/40 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-purple-300 mb-1">
                    Cultural Identity
                  </label>
                  <input
                    type="text"
                    value={editingCharacter.culturalIdentity}
                    onChange={(e) =>
                      setEditingCharacter({ ...editingCharacter, culturalIdentity: e.target.value })
                    }
                    className="w-full bg-[#1b1535] border border-purple-800/40 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-purple-300 mb-1">
                    Face Description
                  </label>
                  <textarea
                    rows={2}
                    value={editingCharacter.faceDescription}
                    onChange={(e) =>
                      setEditingCharacter({
                        ...editingCharacter,
                        faceDescription: e.target.value,
                      })
                    }
                    className="w-full bg-[#1b1535] border border-purple-800/40 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-purple-300 mb-1">
                    Skin Tone & Hair
                  </label>
                  <textarea
                    rows={2}
                    value={`${editingCharacter.skinTone} | ${editingCharacter.hairstyle}`}
                    onChange={(e) => {
                      const [s, h] = e.target.value.split('|');
                      setEditingCharacter({
                        ...editingCharacter,
                        skinTone: s ? s.trim() : editingCharacter.skinTone,
                        hairstyle: h ? h.trim() : editingCharacter.hairstyle,
                      });
                    }}
                    className="w-full bg-[#1b1535] border border-purple-800/40 rounded-xl px-3 py-2 text-xs text-white"
                    placeholder="Skin Tone | Hairstyle"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-purple-300 mb-1">
                  Main Outfit & Accessories
                </label>
                <input
                  type="text"
                  value={editingCharacter.mainOutfit}
                  onChange={(e) =>
                    setEditingCharacter({ ...editingCharacter, mainOutfit: e.target.value })
                  }
                  className="w-full bg-[#1b1535] border border-purple-800/40 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-purple-300 mb-1">
                  Character Bible
                </label>
                <textarea
                  rows={4}
                  value={editingCharacter.characterBible}
                  onChange={(e) =>
                    setEditingCharacter({ ...editingCharacter, characterBible: e.target.value })
                  }
                  className="w-full bg-[#1b1535] border border-purple-800/40 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-purple-300 mb-1">
                  Base Image Prompt
                </label>
                <textarea
                  rows={3}
                  value={editingCharacter.baseImagePrompt}
                  onChange={(e) =>
                    setEditingCharacter({
                      ...editingCharacter,
                      baseImagePrompt: e.target.value,
                    })
                  }
                  className="w-full bg-[#1b1535] border border-purple-800/40 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-purple-300 mb-1">
                  Negative Prompt
                </label>
                <textarea
                  rows={2}
                  value={editingCharacter.negativePrompt}
                  onChange={(e) =>
                    setEditingCharacter({ ...editingCharacter, negativePrompt: e.target.value })
                  }
                  className="w-full bg-[#1b1535] border border-purple-800/40 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-5 mt-5 border-t border-purple-900/40">
              <button
                type="button"
                onClick={() => setEditingCharacter(null)}
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
