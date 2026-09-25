import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Users,
  ArrowLeft,
  Copy,
  Check,
  Edit3,
  Save,
  Trash2,
  AlertCircle,
  Camera,
  ShieldCheck,
  Clapperboard,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Film,
  Lock,
} from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { apiFetch } from '../utils/api';
import type { CharacterProfile } from '../types';

export const CharacterDetailPage: React.FC = () => {
  const { characterId } = useParams<{ characterId: string }>();
  const navigate = useNavigate();

  const [character, setCharacter] = useState<CharacterProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Copy feedback tracking
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<CharacterProfile>>({});

  useEffect(() => {
    if (!characterId) return;

    setLoading(true);
    apiFetch(`/api/characters/${characterId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Character not found or access denied.');
        return res.json();
      })
      .then((data) => {
        if (data.character) {
          setCharacter(data.character);
          setFormData(data.character);
        } else {
          throw new Error('Character data could not be parsed.');
        }
      })
      .catch((err: any) => {
        setError(err.message || 'Error loading character profile.');
      })
      .finally(() => setLoading(false));
  }, [characterId]);

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const handleSaveChanges = async () => {
    if (!characterId) return;

    setSaving(true);
    setError(null);
    setSaveMessage(null);

    try {
      const res = await apiFetch(`/api/characters/${characterId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update character.');
      }

      if (data.character) {
        setCharacter(data.character);
        setFormData(data.character);
      }
      setIsEditing(false);
      setSaveMessage('Character profile updated successfully.');
      setTimeout(() => setSaveMessage(null), 3500);
    } catch (err: any) {
      setError(err.message || 'Error updating character.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!characterId || !character) return;
    if (!window.confirm(`Are you sure you want to delete "${character.name}"?`)) return;

    try {
      const res = await apiFetch(`/api/characters/${characterId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete character.');
      navigate('/characters');
    } catch (err: any) {
      alert(err.message || 'Could not delete character.');
    }
  };

  return (
    <AppLayout
      activeNav="Characters"
      pageTitle={character ? `${character.name} — Character Dossier` : 'Character Detail'}
      pageSubtitle="Comprehensive Nollywood AI character specification and consistency bible"
    >
      {/* NAVIGATION BAR */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link
            to="/characters"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Characters</span>
          </Link>

          {character?.storyId && (
            <>
              <span className="text-purple-600">•</span>
              <Link
                to={`/stories/${character.storyId}/characters`}
                className="text-xs font-semibold text-amber-400 hover:underline"
              >
                Back to Story Cast
              </Link>
            </>
          )}
        </div>

        {character && !isEditing && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-3.5 py-1.5 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 border border-purple-700/40 text-purple-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              <span>Edit Profile</span>
            </button>

            <button
              type="button"
              onClick={handleDelete}
              className="p-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 text-xs transition-colors"
              title="Delete Character"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* FEEDBACK MESSAGES */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/70 border border-red-500/50 flex items-start gap-3 text-red-200 text-xs">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {saveMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-950/70 border border-emerald-500/50 flex items-center gap-3 text-emerald-200 text-xs">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <p>{saveMessage}</p>
        </div>
      )}

      {loading ? (
        <div className="p-16 text-center text-purple-300 text-xs flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <span>Loading character dossier...</span>
        </div>
      ) : !character ? (
        <div className="p-12 text-center text-purple-300 text-xs">
          Character profile not found.
        </div>
      ) : (
        <div className="space-y-6">
          {/* HEADER DOSSIER CARD */}
          <div className="drama-card p-6 rounded-2xl border border-purple-900/40 bg-gradient-to-r from-purple-950/50 via-[#15102a] to-amber-950/20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-5">
                {/* Large Avatar */}
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-500/30 via-purple-600/40 to-indigo-900/50 border border-purple-600/50 flex items-center justify-center text-amber-300 font-black text-2xl shrink-0 shadow-lg">
                  {character.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-3 py-1 rounded-full bg-amber-400/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
                      {character.roleInStory}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-900/40 border border-purple-700/40 text-purple-300 text-xs">
                      {character.age} years old • {character.gender}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-900/40 border border-indigo-700/40 text-indigo-300 text-xs">
                      {character.culturalIdentity}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {character.name}
                  </h1>

                  {character.storyTitle && (
                    <p className="text-xs text-purple-200/80 mt-1 flex items-center gap-1.5">
                      <Clapperboard className="w-3.5 h-3.5 text-amber-400" />
                      <span>Featured in Drama: <strong>{character.storyTitle}</strong></span>
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopy(character.characterBible, 'bible')}
                  className="px-4 py-2.5 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 border border-purple-700/40 text-xs font-semibold text-purple-200 flex items-center gap-1.5 transition-colors"
                >
                  {copiedSection === 'bible' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Bible Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Character Bible</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleCopy(character.baseImagePrompt, 'prompt')}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md"
                >
                  {copiedSection === 'prompt' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-slate-950" />
                      <span>Prompt Copied!</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-3.5 h-3.5" />
                      <span>Copy Image Prompt</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* EDIT FORM (When editing mode is active) */}
          {isEditing && (
            <div className="drama-card p-6 rounded-2xl border border-amber-500/50 bg-[#140f28]">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-purple-900/40">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  <span>Editing Character Information</span>
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData(character);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-purple-950/60 text-purple-300 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveChanges}
                    disabled={saving}
                    className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-purple-300 font-semibold mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#1b1535] border border-purple-800/40 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-purple-300 font-semibold mb-1">Age</label>
                  <input
                    type="text"
                    value={formData.age || ''}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full bg-[#1b1535] border border-purple-800/40 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-purple-300 font-semibold mb-1">Role in Story</label>
                  <input
                    type="text"
                    value={formData.roleInStory || ''}
                    onChange={(e) => setFormData({ ...formData, roleInStory: e.target.value })}
                    className="w-full bg-[#1b1535] border border-purple-800/40 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-purple-300 font-semibold mb-1">Skin Tone</label>
                  <input
                    type="text"
                    value={formData.skinTone || ''}
                    onChange={(e) => setFormData({ ...formData, skinTone: e.target.value })}
                    className="w-full bg-[#1b1535] border border-purple-800/40 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-purple-300 font-semibold mb-1">Hairstyle</label>
                  <input
                    type="text"
                    value={formData.hairstyle || ''}
                    onChange={(e) => setFormData({ ...formData, hairstyle: e.target.value })}
                    className="w-full bg-[#1b1535] border border-purple-800/40 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-purple-300 font-semibold mb-1">Body Type & Height</label>
                  <input
                    type="text"
                    value={`${formData.bodyType || ''} • ${formData.height || ''}`}
                    onChange={(e) => {
                      const [b, h] = e.target.value.split('•');
                      setFormData({
                        ...formData,
                        bodyType: b ? b.trim() : formData.bodyType,
                        height: h ? h.trim() : formData.height,
                      });
                    }}
                    className="w-full bg-[#1b1535] border border-purple-800/40 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-purple-300 font-semibold mb-1">Face Description</label>
                  <textarea
                    rows={2}
                    value={formData.faceDescription || ''}
                    onChange={(e) => setFormData({ ...formData, faceDescription: e.target.value })}
                    className="w-full bg-[#1b1535] border border-purple-800/40 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-purple-300 font-semibold mb-1">Main Outfit & Accessories</label>
                  <textarea
                    rows={2}
                    value={`${formData.mainOutfit || ''} ${formData.accessories ? `(${formData.accessories})` : ''}`}
                    onChange={(e) => setFormData({ ...formData, mainOutfit: e.target.value })}
                    className="w-full bg-[#1b1535] border border-purple-800/40 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-purple-300 font-semibold mb-1">Character Bible</label>
                  <textarea
                    rows={4}
                    value={formData.characterBible || ''}
                    onChange={(e) => setFormData({ ...formData, characterBible: e.target.value })}
                    className="w-full bg-[#1b1535] border border-purple-800/40 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-purple-300 font-semibold mb-1">Base Image Prompt</label>
                  <textarea
                    rows={3}
                    value={formData.baseImagePrompt || ''}
                    onChange={(e) => setFormData({ ...formData, baseImagePrompt: e.target.value })}
                    className="w-full bg-[#1b1535] border border-purple-800/40 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TWO-COLUMN LAYOUT: PHYSICAL & PSYCHOLOGICAL SPECS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Character Bible & Core Identity */}
            <div className="lg:col-span-2 space-y-6">
              {/* CHARACTER BIBLE SECTION */}
              <div className="drama-card p-6 rounded-2xl border border-purple-900/40 bg-[#120e24]">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-purple-900/40">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Non-Negotiable Character Bible</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleCopy(character.characterBible, 'bible-block')}
                    className="text-xs text-purple-300 hover:text-white flex items-center gap-1 font-semibold"
                  >
                    {copiedSection === 'bible-block' ? 'Copied!' : 'Copy Bible'}
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-[#0c0918] border border-purple-800/40 text-xs font-mono text-purple-100 leading-relaxed whitespace-pre-wrap">
                  {character.characterBible}
                </div>

                {/* CONSISTENCY INSTRUCTION */}
                <div className="mt-4 p-4 rounded-xl bg-[#0c0918] border border-blue-900/40">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                      Reusable Consistency Instruction
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(character.consistencyInstruction, 'instruction')}
                      className="text-[11px] text-blue-300 hover:text-white"
                    >
                      {copiedSection === 'instruction' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-xs text-blue-200/90 font-mono leading-relaxed">
                    {character.consistencyInstruction}
                  </p>
                </div>
              </div>

              {/* BASE IMAGE PROMPT & NEGATIVE PROMPT */}
              <div className="drama-card p-6 rounded-2xl border border-purple-900/40 bg-[#120e24]">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-purple-900/40">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Camera className="w-4 h-4 text-amber-400" />
                    <span>AI Generation Prompts (FLUX / Midjourney)</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleCopy(character.baseImagePrompt, 'prompt-block')}
                    className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
                  >
                    {copiedSection === 'prompt-block' ? 'Copied!' : 'Copy Prompt'}
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Positive Prompt */}
                  <div className="p-4 rounded-xl bg-[#0c0918] border border-amber-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                        Base Reference Portrait Prompt (Aspect: 9:16)
                      </span>
                    </div>
                    <p className="text-xs text-slate-100 font-mono leading-relaxed whitespace-pre-wrap">
                      {character.baseImagePrompt}
                    </p>
                  </div>

                  {/* Negative Prompt */}
                  <div className="p-3.5 rounded-xl bg-[#0c0918] border border-red-900/40">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">
                        Negative Prompt (Anti-Drift / Anti-Distortion)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(character.negativePrompt, 'neg-block')}
                        className="text-[10px] text-red-300 hover:text-white"
                      >
                        {copiedSection === 'neg-block' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-xs text-red-200/90 font-mono leading-relaxed">
                      {character.negativePrompt}
                    </p>
                  </div>
                </div>
              </div>

              {/* PSYCHOLOGY & CONFLICT CARD */}
              <div className="drama-card p-6 rounded-2xl border border-purple-900/40 bg-[#120e24]">
                <h3 className="text-sm font-bold text-white mb-4 pb-3 border-b border-purple-900/40">
                  Psychological & Dramatic Profile
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-xl bg-[#17122e] border border-purple-900/30">
                    <span className="text-[10px] uppercase font-semibold text-purple-400 block mb-1">
                      Personality
                    </span>
                    <p className="text-slate-200">{character.personality}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#17122e] border border-purple-900/30">
                    <span className="text-[10px] uppercase font-semibold text-purple-400 block mb-1">
                      Emotional Behavior
                    </span>
                    <p className="text-slate-200">{character.emotionalBehavior}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#17122e] border border-purple-900/30">
                    <span className="text-[10px] uppercase font-semibold text-purple-400 block mb-1">
                      Character Goal
                    </span>
                    <p className="text-slate-200">{character.characterGoal}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#17122e] border border-purple-900/30">
                    <span className="text-[10px] uppercase font-semibold text-purple-400 block mb-1">
                      Character Weakness
                    </span>
                    <p className="text-slate-200">{character.characterWeakness}</p>
                  </div>

                  <div className="sm:col-span-2 p-3 rounded-xl bg-[#17122e] border border-purple-900/30">
                    <span className="text-[10px] uppercase font-semibold text-rose-400 block mb-1">
                      Secret or Central Conflict
                    </span>
                    <p className="text-rose-100">{character.secretOrConflict}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 1 Col: Reference Image Preparation & Physical Specs */}
            <div className="space-y-6">
              {/* REFERENCE IMAGE PREPARATION (As requested by user prompt) */}
              <div className="drama-card p-6 rounded-2xl border border-purple-900/40 bg-[#120e24]">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-amber-400" />
                  <span>Reference Image</span>
                </h3>

                <div className="aspect-[9/16] max-h-72 w-full rounded-xl border border-dashed border-purple-800/50 bg-[#0c0918] flex flex-col items-center justify-center p-6 text-center text-purple-300">
                  <div className="w-12 h-12 rounded-xl bg-purple-950/60 border border-purple-800/40 flex items-center justify-center mb-3 text-purple-400">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-semibold text-purple-200 mb-1">
                    No reference image uploaded yet
                  </p>
                  <p className="text-[11px] text-purple-400/80">
                    Upload reference image will be added later
                  </p>
                </div>
              </div>

              {/* PHYSICAL SPECIFICATIONS */}
              <div className="drama-card p-6 rounded-2xl border border-purple-900/40 bg-[#120e24]">
                <h3 className="text-sm font-bold text-white mb-4 pb-3 border-b border-purple-900/40">
                  Physical Specifications
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] font-semibold uppercase text-purple-400 block mb-0.5">
                      Face Structure
                    </span>
                    <p className="text-slate-200">{character.faceDescription}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold uppercase text-purple-400 block mb-0.5">
                      Skin Tone
                    </span>
                    <p className="text-slate-200">{character.skinTone}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold uppercase text-purple-400 block mb-0.5">
                      Hairstyle
                    </span>
                    <p className="text-slate-200">{character.hairstyle}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold uppercase text-purple-400 block mb-0.5">
                      Body & Height
                    </span>
                    <p className="text-slate-200">
                      {character.bodyType} • {character.height}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold uppercase text-purple-400 block mb-0.5">
                      Signature Attire
                    </span>
                    <p className="text-slate-200">{character.mainOutfit}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold uppercase text-purple-400 block mb-0.5">
                      Accessories
                    </span>
                    <p className="text-slate-200">{character.accessories || 'None'}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold uppercase text-purple-400 block mb-0.5">
                      Speaking & Voice Style
                    </span>
                    <p className="text-slate-200">
                      {character.speakingStyle} ({character.voiceStyle})
                    </p>
                  </div>
                </div>
              </div>

              {/* NEXT STEP CALLOUT: CONTINUE TO IMAGE PROMPTS (PROMPT 4) */}
              <div className="drama-card p-5 rounded-2xl border border-purple-800/40 bg-gradient-to-br from-purple-950/60 to-[#120e24]">
                <div className="flex items-center gap-2 mb-2">
                  <Film className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-white">Next Production Step</span>
                </div>
                <p className="text-[11px] text-purple-300/80 mb-4 leading-relaxed">
                  Now that your character's identity is locked, generate scene-by-scene camera angles, lighting, and production prompts.
                </p>

                <button
                  type="button"
                  disabled
                  className="w-full py-2.5 px-4 rounded-xl bg-purple-900/30 border border-purple-700/40 text-purple-400/50 text-xs font-bold flex items-center justify-center gap-2 cursor-not-allowed mb-2"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Continue to Image Prompts</span>
                </button>
                <p className="text-[10px] text-amber-400/90 font-medium text-center">
                  Image prompt generation will be added in Prompt 4.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};
