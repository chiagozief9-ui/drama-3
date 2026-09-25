import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Film,
  ArrowLeft,
  Copy,
  Check,
  Edit3,
  Save,
  Trash2,
  AlertCircle,
  Camera,
  Video,
  Clock,
  MapPin,
  MessageSquare,
  Users,
  Lock,
  Layers,
  Sparkles,
  RefreshCw,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { apiFetch } from '../utils/api';
import type { ScenePrompt } from '../types';

export const ScenePromptDetailPage: React.FC = () => {
  const { storyId, sceneId } = useParams<{ storyId: string; sceneId: string }>();
  const navigate = useNavigate();

  const [scenePrompt, setScenePrompt] = useState<ScenePrompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Copy tracking
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<ScenePrompt>>({});

  useEffect(() => {
    if (!storyId || !sceneId) return;

    setLoading(true);
    apiFetch(`/api/stories/${storyId}/prompts/${sceneId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Scene prompt not found or access denied.');
        return res.json();
      })
      .then((data) => {
        if (data.scenePrompt) {
          setScenePrompt(data.scenePrompt);
          setFormData(data.scenePrompt);
        } else {
          throw new Error('Scene prompt could not be parsed.');
        }
      })
      .catch((err: any) => {
        setError(err.message || 'Error loading scene prompt details.');
      })
      .finally(() => setLoading(false));
  }, [storyId, sceneId]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleCopyAll = () => {
    if (!scenePrompt) return;
    const combined = `=== SCENE ${scenePrompt.sceneNumber}: ${scenePrompt.sceneTitle} ===
DURATION: ${scenePrompt.sceneDuration} | ASPECT RATIO: ${scenePrompt.aspectRatio}
LOCATION: ${scenePrompt.location} (${scenePrompt.timeOfDay})
CAST: ${Array.isArray(scenePrompt.charactersInScene) ? scenePrompt.charactersInScene.join(', ') : scenePrompt.charactersInScene}

[COMPLETE IMAGE PROMPT]
${scenePrompt.imagePrompt}

[COMPLETE VIDEO PROMPT]
${scenePrompt.videoPrompt}

[DIALOGUE]
${scenePrompt.dialogue}

[NEGATIVE PROMPT]
${scenePrompt.negativePrompt}`;

    navigator.clipboard.writeText(combined);
    setCopiedKey('all');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSaveChanges = async () => {
    if (!storyId || !sceneId) return;

    setSaving(true);
    setError(null);
    setSaveMessage(null);

    try {
      const res = await apiFetch(`/api/stories/${storyId}/prompts/${sceneId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update scene prompt.');
      }

      if (data.scenePrompt) {
        setScenePrompt(data.scenePrompt);
        setFormData(data.scenePrompt);
      }
      setIsEditing(false);
      setSaveMessage('Scene prompt updated successfully.');
      setTimeout(() => setSaveMessage(null), 3500);
    } catch (err: any) {
      setError(err.message || 'Error updating scene prompt.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!storyId || !sceneId || !scenePrompt) return;
    if (!window.confirm(`Delete Scene ${scenePrompt.sceneNumber}: "${scenePrompt.sceneTitle}"?`)) return;

    try {
      const res = await apiFetch(`/api/stories/${storyId}/prompts/${sceneId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete scene prompt.');
      navigate(`/stories/${storyId}/prompts`);
    } catch (err: any) {
      alert(err.message || 'Could not delete scene prompt.');
    }
  };

  // Helper: Sync dialogue into video prompt
  const handleSyncDialogue = () => {
    if (!formData.dialogue || !formData.videoPrompt) return;
    const lines = formData.dialogue
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const speechParts = lines
      .map((line) => {
        const parts = line.split(':');
        if (parts.length >= 2) {
          return `${parts[0].trim()} says: ${parts.slice(1).join(':').trim()}`;
        }
        return line;
      })
      .join('. ');

    const updated = `${formData.videoPrompt} The characters speak directly with natural lip movement: ${speechParts}.`;
    setFormData({ ...formData, videoPrompt: updated });
  };

  return (
    <AppLayout
      activeNav="Scenes & Prompts"
      pageTitle={
        scenePrompt
          ? `Scene ${scenePrompt.sceneNumber}: ${scenePrompt.sceneTitle}`
          : 'Scene Prompt Detail'
      }
      pageSubtitle="Complete copy-ready image and video prompts for cinematic AI generation"
    >
      {/* NAVIGATION BAR */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link
            to={`/stories/${storyId}/prompts`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Scene Prompts</span>
          </Link>
          <span className="text-purple-600">•</span>
          <Link
            to={`/stories/${storyId}`}
            className="text-xs font-semibold text-purple-300 hover:text-white transition-colors"
          >
            <span>Drama Script</span>
          </Link>
        </div>

        {scenePrompt && !isEditing && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-3.5 py-1.5 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 border border-purple-700/40 text-purple-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              <span>Edit Scene</span>
            </button>

            <button
              type="button"
              onClick={handleDelete}
              className="p-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 text-xs transition-colors"
              title="Delete Scene Prompt"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* FEEDBACK NOTICES */}
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
          <span>Loading scene prompt dossier...</span>
        </div>
      ) : !scenePrompt ? (
        <div className="p-12 text-center text-purple-300 text-xs">
          Scene prompt not found.
        </div>
      ) : (
        <div className="space-y-6">
          {/* HEADER SUMMARY CARD */}
          <div className="drama-card p-6 rounded-2xl border border-purple-900/40 bg-gradient-to-r from-purple-950/50 via-[#15102a] to-amber-950/20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black">
                    Scene {scenePrompt.sceneNumber}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-900/40 border border-purple-700/40 text-purple-300 text-xs">
                    {scenePrompt.sceneDuration}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-900/40 border border-indigo-700/40 text-indigo-300 text-xs">
                    {scenePrompt.aspectRatio} Aspect Ratio
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs">
                    {scenePrompt.visualStyle}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {scenePrompt.sceneTitle}
                </h1>

                <p className="text-xs text-purple-200/90 mt-1 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>{scenePrompt.location} ({scenePrompt.timeOfDay})</span>
                  <span>•</span>
                  <span>Cast: <strong className="text-amber-300">{Array.isArray(scenePrompt.charactersInScene) ? scenePrompt.charactersInScene.join(', ') : scenePrompt.charactersInScene}</strong></span>
                </p>
              </div>

              {/* QUICK COPY BUTTONS */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopy(scenePrompt.imagePrompt, 'img-top')}
                  className="px-4 py-2.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors active:scale-95"
                >
                  {copiedKey === 'img-top' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-3.5 h-3.5" />
                      <span>Copy Image Prompt</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleCopy(scenePrompt.videoPrompt, 'vid-top')}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md active:scale-95"
                >
                  {copiedKey === 'vid-top' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-slate-950" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Video className="w-3.5 h-3.5" />
                      <span>Copy Video Prompt</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCopyAll}
                  className="px-3 py-2.5 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 border border-purple-700/40 text-purple-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                  title="Copy formatted prompt packet"
                >
                  {copiedKey === 'all' ? 'Packet Copied!' : 'Copy All'}
                </button>
              </div>
            </div>
          </div>

          {/* EDIT FORM (when isEditing is true) */}
          {isEditing && (
            <div className="drama-card p-6 rounded-2xl border border-amber-500/50 bg-[#140f28]">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-purple-900/40">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  <span>Editing Scene {scenePrompt.sceneNumber}</span>
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData(scenePrompt);
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

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-purple-300 font-semibold mb-1">Title</label>
                    <input
                      type="text"
                      value={formData.sceneTitle || ''}
                      onChange={(e) => setFormData({ ...formData, sceneTitle: e.target.value })}
                      className="w-full bg-[#1b1535] border border-purple-800/40 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-purple-300 font-semibold mb-1">Duration</label>
                    <input
                      type="text"
                      value={formData.sceneDuration || ''}
                      onChange={(e) => setFormData({ ...formData, sceneDuration: e.target.value })}
                      className="w-full bg-[#1b1535] border border-purple-800/40 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-purple-300 font-semibold mb-1">Location</label>
                    <input
                      type="text"
                      value={formData.location || ''}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full bg-[#1b1535] border border-purple-800/40 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-amber-400">Dialogue</label>
                    <button
                      type="button"
                      onClick={handleSyncDialogue}
                      className="text-[10px] text-amber-300 hover:text-white bg-amber-500/20 px-2 py-0.5 rounded flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Sync Dialogue Into Video Prompt</span>
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={formData.dialogue || ''}
                    onChange={(e) => setFormData({ ...formData, dialogue: e.target.value })}
                    className="w-full bg-[#1b1535] border border-purple-800/40 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-amber-400 mb-1">
                    Complete Image Prompt (Self-Contained)
                  </label>
                  <textarea
                    rows={4}
                    value={formData.imagePrompt || ''}
                    onChange={(e) => setFormData({ ...formData, imagePrompt: e.target.value })}
                    className="w-full bg-[#1b1535] border border-purple-800/40 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-purple-300 mb-1">
                    Complete Video Prompt (Includes Dialogue)
                  </label>
                  <textarea
                    rows={4}
                    value={formData.videoPrompt || ''}
                    onChange={(e) => setFormData({ ...formData, videoPrompt: e.target.value })}
                    className="w-full bg-[#1b1535] border border-purple-800/40 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-red-400 mb-1">
                    Negative Prompt
                  </label>
                  <textarea
                    rows={2}
                    value={formData.negativePrompt || ''}
                    onChange={(e) => setFormData({ ...formData, negativePrompt: e.target.value })}
                    className="w-full bg-[#1b1535] border border-purple-800/40 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* MAIN PROMPTS DISPLAY (TWO COLUMN ON LARGE SCREEN) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. COMPLETE IMAGE PROMPT CARD */}
            <div className="drama-card p-6 rounded-2xl border border-amber-500/40 bg-[#120e24] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-purple-900/40">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Camera className="w-4 h-4 text-amber-400" />
                    <span>Complete Self-Contained Image Prompt</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleCopy(scenePrompt.imagePrompt, 'img')}
                    className="px-3 py-1.5 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    {copiedKey === 'img' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Image Prompt</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-[#0c0918] border border-amber-500/20 text-xs font-mono text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {scenePrompt.imagePrompt}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-purple-900/30 text-[11px] text-purple-400 flex items-center justify-between">
                <span>Directly paste into Midjourney or FLUX</span>
                <span>Aspect: {scenePrompt.aspectRatio}</span>
              </div>
            </div>

            {/* 2. COMPLETE VIDEO PROMPT CARD */}
            <div className="drama-card p-6 rounded-2xl border border-purple-700/50 bg-[#120e24] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-purple-900/40">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Video className="w-4 h-4 text-purple-400" />
                    <span>Complete Self-Contained Video Prompt</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleCopy(scenePrompt.videoPrompt, 'vid')}
                    className="px-3 py-1.5 rounded-lg bg-purple-700/40 hover:bg-purple-600/50 text-purple-200 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    {copiedKey === 'vid' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Video Prompt</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-[#0c0918] border border-purple-700/30 text-xs font-mono text-purple-100 leading-relaxed whitespace-pre-wrap">
                  {scenePrompt.videoPrompt}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-purple-900/30 text-[11px] text-purple-400 flex items-center justify-between">
                <span>Directly paste into Runway, Kling, or Luma</span>
                <span>Duration: {scenePrompt.sceneDuration}</span>
              </div>
            </div>
          </div>

          {/* SECONDARY DOSSIER SECTIONS: DIALOGUE, NEGATIVE PROMPT, PRODUCTION NOTES */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Dialogue & Technical Specs */}
            <div className="lg:col-span-2 space-y-6">
              {/* DIALOGUE BOX */}
              <div className="drama-card p-6 rounded-2xl border border-purple-900/40 bg-[#120e24]">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-amber-400" />
                  <span>Scene Dialogue (Embedded Inside Video Prompt)</span>
                </h3>

                <div className="p-4 rounded-xl bg-[#0c0918] border border-purple-900/40 text-xs font-mono text-purple-100 leading-relaxed whitespace-pre-wrap">
                  {scenePrompt.dialogue || '(Silent or non-verbal confrontation)'}
                </div>
                <p className="text-[11px] text-purple-400 mt-2">
                  Note: Zero narrator lines. Characters speak directly with natural lip movement.
                </p>
              </div>

              {/* CINEMATOGRAPHY & LIGHTING */}
              <div className="drama-card p-6 rounded-2xl border border-purple-900/40 bg-[#120e24]">
                <h3 className="text-sm font-bold text-white mb-4 pb-3 border-b border-purple-900/40">
                  Cinematography & Staging
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-xl bg-[#17122e] border border-purple-900/30">
                    <span className="text-[10px] uppercase font-semibold text-purple-400 block mb-1">
                      Camera Movement
                    </span>
                    <p className="text-slate-200">{scenePrompt.cameraMovement}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#17122e] border border-purple-900/30">
                    <span className="text-[10px] uppercase font-semibold text-purple-400 block mb-1">
                      Lighting & Atmosphere
                    </span>
                    <p className="text-slate-200">{scenePrompt.lighting}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#17122e] border border-purple-900/30">
                    <span className="text-[10px] uppercase font-semibold text-purple-400 block mb-1">
                      Character Positioning
                    </span>
                    <p className="text-slate-200">{scenePrompt.characterPositioning}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#17122e] border border-purple-900/30">
                    <span className="text-[10px] uppercase font-semibold text-purple-400 block mb-1">
                      Background Environment
                    </span>
                    <p className="text-slate-200">{scenePrompt.backgroundDetails}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 1 Col: Negative Prompt & Next Step */}
            <div className="space-y-6">
              {/* NEGATIVE PROMPT CARD */}
              <div className="drama-card p-6 rounded-2xl border border-purple-900/40 bg-[#120e24]">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-purple-900/40">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-red-400" />
                    <span>Negative Prompt</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleCopy(scenePrompt.negativePrompt, 'neg')}
                    className="text-xs text-red-300 hover:text-white font-semibold"
                  >
                    {copiedKey === 'neg' ? 'Copied!' : 'Copy'}
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-[#0c0918] border border-red-900/30 text-xs font-mono text-red-200/90 leading-relaxed">
                  {scenePrompt.negativePrompt}
                </div>
              </div>

              {/* CONTINUITY & PRODUCTION NOTES */}
              <div className="drama-card p-6 rounded-2xl border border-purple-900/40 bg-[#120e24]">
                <h3 className="text-sm font-bold text-white mb-3">Continuity Notes</h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] font-semibold uppercase text-purple-400 block mb-0.5">
                      Costume Continuity
                    </span>
                    <p className="text-slate-200">{scenePrompt.costumeContinuity}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold uppercase text-purple-400 block mb-0.5">
                      Facial Expression / Lip Sync
                    </span>
                    <p className="text-slate-200">
                      {scenePrompt.facialExpressionInstructions} • {scenePrompt.lipSyncInstruction}
                    </p>
                  </div>
                </div>
              </div>

              {/* NEXT STEP CALLOUT: CONTINUE TO EXPORT PACK */}
              <div className="drama-card p-5 rounded-2xl border border-purple-800/40 bg-gradient-to-br from-purple-950/60 to-[#120e24]">
                <div className="flex items-center gap-2 mb-2">
                  <Film className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white">Next Production Step</span>
                </div>
                <p className="text-[11px] text-purple-300/80 mb-4 leading-relaxed">
                  Export complete shot lists, Midjourney sheets, audio scripts, and scene prompt ZIP packs for your video editor.
                </p>

                <Link
                  to={`/stories/${storyId}/export`}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all mb-2"
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>Continue to Export Pack</span>
                </Link>
                <p className="text-[10px] text-emerald-400 font-medium text-center">
                  Ready for full ZIP, CSV, and Markdown export.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};
