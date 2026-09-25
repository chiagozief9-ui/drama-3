import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Copy,
  Check,
  FileSpreadsheet,
  FileText,
  FileCode,
  Printer,
  Sparkles,
  Film,
  Users,
  Music,
  Share2,
  Video,
  Image as ImageIcon,
  CheckCircle,
  AlertTriangle,
  FolderArchive,
  Clock,
  Layers,
  Info,
  Tv,
} from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { apiFetch } from '../utils/api';
import type { ExportPackData, ProductionKit } from '../types';
import { getVisualStyleHelper } from '../utils/visualStyles';
import {
  createProductionZip,
  downloadBlob,
  downloadText,
  generateShotListCsv,
  generateImagePromptsTxt,
  generateVideoPromptsTxt,
  generateMasterDossierMd,
  generateAudioCueSheetMd,
  generateEditorNotesMd,
  generateFullProductionTxt,
  generateProductionPackPdf,
} from '../utils/exportHelpers';

type TabType =
  | 'screenplay'
  | 'characters'
  | 'shotlist'
  | 'image_prompts'
  | 'video_prompts'
  | 'audio'
  | 'viralkit';

export function ExportPackPage() {
  const { storyId } = useParams<{ storyId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportData, setExportData] = useState<ExportPackData | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('screenplay');

  // Action states
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [generatingKit, setGeneratingKit] = useState(false);
  const [kitSuccess, setKitSuccess] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [markingProduction, setMarkingProduction] = useState(false);
  const [markedSuccess, setMarkedSuccess] = useState(false);

  useEffect(() => {
    if (!storyId) {
      navigate('/stories');
      return;
    }
    loadExportData();
  }, [storyId]);

  const loadExportData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/stories/${storyId}/export`);
      const data = await res.json();
      if (res.ok && data?.data) {
        setExportData(data.data);
      } else {
        setError(data?.error || 'Failed to load export package.');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading export package.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const handleDownloadZip = async () => {
    if (!exportData) return;
    setDownloadingZip(true);
    try {
      const blob = await createProductionZip(exportData);
      const safeTitle = exportData.story.title.replace(/[^a-zA-Z0-9_-]/g, '_');
      downloadBlob(blob, `Nollywood_AI_Export_${safeTitle}.zip`);
      // Automatically track export status
      apiFetch(`/api/stories/${storyId}/export/mark-exported`, { method: 'POST' }).catch(() => {});
    } catch (err: any) {
      alert('Failed to generate ZIP package: ' + (err.message || err));
    } finally {
      setDownloadingZip(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!exportData) return;
    setDownloadingPdf(true);
    setPdfError(null);
    try {
      const blob = await generateProductionPackPdf(exportData);
      downloadBlob(blob, 'ai-drama-creator-production-pack.pdf');
      // Automatically track export status
      apiFetch(`/api/stories/${storyId}/export/mark-exported`, { method: 'POST' }).catch(() => {});
    } catch (err: any) {
      console.error('PDF generation error:', err);
      setPdfError('PDF generation failed. Please try Print / Save as PDF instead.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadTxt = () => {
    if (!exportData) return;
    const txt = generateFullProductionTxt(exportData);
    const safeTitle = exportData.story.title.replace(/[^a-zA-Z0-9_-]/g, '_');
    downloadText(txt, `${safeTitle}_Production_Pack.txt`, 'text/plain');
  };

  const handleDownloadCsv = () => {
    if (!exportData) return;
    const csv = generateShotListCsv(exportData.scenePrompts);
    const safeTitle = exportData.story.title.replace(/[^a-zA-Z0-9_-]/g, '_');
    downloadText(csv, `${safeTitle}_ShotList.csv`, 'text/csv');
  };

  const handleDownloadMarkdown = () => {
    if (!exportData) return;
    const md = generateMasterDossierMd(exportData);
    const safeTitle = exportData.story.title.replace(/[^a-zA-Z0-9_-]/g, '_');
    downloadText(md, `${safeTitle}_Production_Dossier.md`, 'text/markdown');
  };

  const handleDownloadJson = () => {
    if (!exportData) return;
    const safeTitle = exportData.story.title.replace(/[^a-zA-Z0-9_-]/g, '_');
    downloadText(JSON.stringify(exportData, null, 2), `${safeTitle}_ProjectData.json`, 'application/json');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleGenerateAiKit = async () => {
    if (!storyId) return;
    setGeneratingKit(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/stories/${storyId}/export/ai-kit`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data?.data) {
        const kit: ProductionKit = data.data;
        if (exportData) {
          setExportData({
            ...exportData,
            productionKit: kit,
            story: {
              ...exportData.story,
              productionKit: kit,
            },
          });
        }
        setKitSuccess(true);
        setActiveTab('viralkit');
        setTimeout(() => setKitSuccess(false), 3000);
      } else {
        setError(data?.error || 'Failed to generate AI production kit.');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to AI service.');
    } finally {
      setGeneratingKit(false);
    }
  };

  const handleMarkAsInProduction = async () => {
    if (!storyId) return;
    setMarkingProduction(true);
    try {
      const res = await apiFetch(`/api/stories/${storyId}/export/mark-exported`, {
        method: 'POST',
      });
      if (res.ok) {
        setMarkedSuccess(true);
        if (exportData) {
          setExportData({
            ...exportData,
            story: {
              ...exportData.story,
              status: 'completed',
            },
          });
        }
        setTimeout(() => setMarkedSuccess(false), 3000);
      }
    } catch {
      // ignore
    } finally {
      setMarkingProduction(false);
    }
  };

  return (
    <AppLayout
      activeNav="Export"
      pageTitle="Complete Production Export Pack"
      pageSubtitle="Screenplay, Character Bibles, Shot Lists, AI Prompts & Social Kit ready for delivery"
    >
      {/* Top breadcrumb & navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            to={`/stories/${storyId}/prompts`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Scene Prompts</span>
          </Link>
          <span className="text-purple-600">•</span>
          <Link
            to={`/stories/${storyId}`}
            className="text-xs font-semibold text-purple-300 hover:text-white transition-colors"
          >
            <span>Story Detail</span>
          </Link>
          <span className="text-purple-600">•</span>
          <Link
            to={`/stories/${storyId}/characters`}
            className="text-xs font-semibold text-purple-300 hover:text-white transition-colors"
          >
            <span>Story Cast</span>
          </Link>
        </div>

        {exportData && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleMarkAsInProduction}
              disabled={markingProduction || exportData.story.status === 'completed'}
              className="px-3 py-1.5 rounded-xl bg-purple-900/40 hover:bg-purple-800/40 text-purple-300 border border-purple-700/40 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
            >
              {exportData.story.status === 'completed' || markedSuccess ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Marked Ready for Production</span>
                </>
              ) : markingProduction ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-purple-300 border-t-transparent rounded-full animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 text-amber-400" />
                  <span>Mark Ready for Production</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadExportData}
            className="px-3 py-1 rounded-lg bg-rose-800/60 hover:bg-rose-700 text-white font-semibold text-xs shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* PDF ERROR BANNER */}
      {pdfError && (
        <div className="mb-6 p-4 rounded-xl bg-amber-950/70 border border-amber-500/50 text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{pdfError}</span>
          </div>
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Try Print / Save as PDF</span>
          </button>
        </div>
      )}

      {/* SUCCESS BANNER */}
      {kitSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 print:hidden animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>AI Viral Social Kit and Video Editor Notes generated and saved!</span>
        </div>
      )}

      {loading ? (
        <div className="p-20 text-center text-purple-300 text-xs flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <span>Compiling master production export package...</span>
        </div>
      ) : !exportData ? (
        <div className="drama-card p-12 text-center rounded-2xl border border-dashed border-purple-900/60 bg-[#100c22]">
          <h3 className="text-base font-bold text-white mb-2">Production Data Not Found</h3>
          <p className="text-xs text-purple-300/80 mb-6">
            Unable to locate production materials for this story.
          </p>
          <Link
            to="/stories"
            className="px-6 py-2.5 rounded-xl bg-purple-700 text-white text-xs font-semibold inline-flex items-center gap-2"
          >
            Return to My Stories
          </Link>
        </div>
      ) : (
        <div className="space-y-6 print:hidden">
          {/* HEADER HERO CARD */}
          <div className="drama-card p-6 sm:p-8 rounded-3xl border border-purple-800/50 bg-gradient-to-br from-[#1b143a] via-[#120e28] to-[#0a0718] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-3 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-full bg-amber-400/10 border border-amber-500/30 text-amber-300 font-bold tracking-wide">
                    {exportData.story.storyType}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-purple-900/60 border border-purple-700/40 text-purple-200 font-medium">
                    {exportData.story.aspectRatio}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-purple-900/60 border border-purple-700/40 text-purple-200 font-medium">
                    {exportData.story.targetPlatform || 'TikTok'}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-medium flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    <span>Complete Production Pack</span>
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {exportData.story.title}
                </h1>

                <p className="text-xs sm:text-sm text-purple-200/90 leading-relaxed italic">
                  "{exportData.story.logline}"
                </p>

                {/* Key stats row */}
                <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-purple-300/80">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Runtime: <strong>{exportData.story.estimatedDuration}</strong></span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    <span>Cast: <strong>{exportData.characters.length} Characters</strong></span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-amber-400" />
                    <span>Scenes: <strong>{exportData.scenePrompts.length} Prompts</strong></span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1.5" title={getVisualStyleHelper(exportData.story.visualStyle)}>
                    <Tv className="w-3.5 h-3.5 text-amber-400" />
                    <span>Style: <strong>{exportData.story.visualStyle}</strong></span>
                  </div>
                </div>
              </div>

              {/* ACTION DOWNLOAD BUTTONS */}
              <div className="w-full lg:w-80 shrink-0 flex flex-col gap-2.5 print:hidden">
                <div className="text-[11px] font-bold uppercase tracking-wider text-purple-300">
                  Export & Delivery Station
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                  {/* 1. Print / Save as PDF */}
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
                  >
                    <Printer className="w-4 h-4 text-slate-950" />
                    <span>Print / Save as PDF</span>
                  </button>

                  {/* 2. Download PDF */}
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    disabled={downloadingPdf}
                    className="w-full px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs flex items-center justify-center gap-2 border border-purple-500/40 shadow-md active:scale-95 transition-all disabled:opacity-50"
                  >
                    {downloadingPdf ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Generating PDF...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 text-amber-300" />
                        <span>Download PDF</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  {/* 3. Download ZIP */}
                  <button
                    type="button"
                    onClick={handleDownloadZip}
                    disabled={downloadingZip}
                    className="p-2.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-800/50 text-purple-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                    title="Download Complete Production ZIP"
                  >
                    {downloadingZip ? (
                      <div className="w-3 h-3 border-2 border-purple-200 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FolderArchive className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span>Download ZIP</span>
                  </button>

                  {/* 4. Download Markdown */}
                  <button
                    type="button"
                    onClick={handleDownloadMarkdown}
                    className="p-2.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-800/50 text-purple-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    title="Download Formatted Production Dossier Markdown"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>Download Markdown</span>
                  </button>

                  {/* 5. Download TXT */}
                  <button
                    type="button"
                    onClick={handleDownloadTxt}
                    className="p-2.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-800/50 text-purple-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    title="Download Complete Plain Text Production Pack"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Download TXT</span>
                  </button>

                  {/* 6. Download JSON */}
                  <button
                    type="button"
                    onClick={handleDownloadJson}
                    className="p-2.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-800/50 text-purple-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    title="Download Complete Raw Project JSON"
                  >
                    <FileCode className="w-3.5 h-3.5 text-sky-400" />
                    <span>Download JSON</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 1-CLICK BATCH COPY BAR */}
          <div className="drama-card p-4 rounded-2xl border border-purple-900/40 bg-[#120e24] print:hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Copy className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  One-Click Batch Copy Station
                </h3>
              </div>
              <span className="text-[11px] text-purple-300/70">
                Instantly copy clean, formatted batches into your clipboard
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    generateImagePromptsTxt(exportData.story, exportData.scenePrompts),
                    'batch_images'
                  )
                }
                className="px-3 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-800/30 text-purple-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                {copiedKey === 'batch_images' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Copied!</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                    <span>All Image Prompts</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    generateVideoPromptsTxt(exportData.story, exportData.scenePrompts),
                    'batch_videos'
                  )
                }
                className="px-3 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-800/30 text-purple-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                {copiedKey === 'batch_videos' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Copied!</span>
                  </>
                ) : (
                  <>
                    <Video className="w-3.5 h-3.5 text-purple-400" />
                    <span>All Video Prompts</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  handleCopy(exportData.story.fullDramaScript, 'batch_script')
                }
                className="px-3 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-800/30 text-purple-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                {copiedKey === 'batch_script' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Copied!</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5 text-pink-400" />
                    <span>Full Screenplay</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    generateAudioCueSheetMd(
                      exportData.story,
                      exportData.characters,
                      exportData.scenePrompts
                    ),
                    'batch_audio'
                  )
                }
                className="px-3 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-800/30 text-purple-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                {copiedKey === 'batch_audio' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Copied!</span>
                  </>
                ) : (
                  <>
                    <Music className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Audio & Dialogue</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    generateShotListCsv(exportData.scenePrompts),
                    'batch_shotlist'
                  )
                }
                className="px-3 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-800/30 text-purple-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                {copiedKey === 'batch_shotlist' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Copied!</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Shot List CSV</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  const kitText = exportData.productionKit
                    ? `${exportData.productionKit.captionHooks.join('\n\n')}\n\n${exportData.productionKit.hashtags.join(' ')}\n\nPinned Comment: ${exportData.productionKit.pinnedComment}`
                    : `${exportData.story.title}\n\n#Nollywood #AIDrama #AfricanStories`;
                  handleCopy(kitText, 'batch_captions');
                }}
                className="px-3 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-800/30 text-purple-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                {copiedKey === 'batch_captions' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-amber-300" />
                    <span>Viral Captions</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* TABS NAVIGATION */}
          <div className="flex items-center gap-2 border-b border-purple-900/40 pb-2 overflow-x-auto print:hidden">
            <button
              type="button"
              onClick={() => setActiveTab('screenplay')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === 'screenplay'
                  ? 'bg-gradient-to-r from-amber-500 to-purple-600 text-slate-950 shadow-md'
                  : 'bg-purple-950/40 text-purple-300 hover:bg-purple-900/50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>1. Overview & Screenplay</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('characters')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === 'characters'
                  ? 'bg-gradient-to-r from-amber-500 to-purple-600 text-slate-950 shadow-md'
                  : 'bg-purple-950/40 text-purple-300 hover:bg-purple-900/50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>2. Cast & Character Bibles ({exportData.characters.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('shotlist')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === 'shotlist'
                  ? 'bg-gradient-to-r from-amber-500 to-purple-600 text-slate-950 shadow-md'
                  : 'bg-purple-950/40 text-purple-300 hover:bg-purple-900/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>3. Cinematography Shot List ({exportData.scenePrompts.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('image_prompts')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === 'image_prompts'
                  ? 'bg-gradient-to-r from-amber-500 to-purple-600 text-slate-950 shadow-md'
                  : 'bg-purple-950/40 text-purple-300 hover:bg-purple-900/50'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>4. Midjourney / FLUX Prompts</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('video_prompts')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === 'video_prompts'
                  ? 'bg-gradient-to-r from-amber-500 to-purple-600 text-slate-950 shadow-md'
                  : 'bg-purple-950/40 text-purple-300 hover:bg-purple-900/50'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>5. Runway / Kling Video Prompts</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('audio')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === 'audio'
                  ? 'bg-gradient-to-r from-amber-500 to-purple-600 text-slate-950 shadow-md'
                  : 'bg-purple-950/40 text-purple-300 hover:bg-purple-900/50'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>6. Audio & Dialogue Cue Sheet</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('viralkit')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === 'viralkit'
                  ? 'bg-gradient-to-r from-amber-500 to-purple-600 text-slate-950 shadow-md'
                  : 'bg-purple-950/40 text-purple-300 hover:bg-purple-900/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>7. Viral Social Kit & Editor Notes</span>
            </button>
          </div>

          {/* TAB 1: OVERVIEW & SCREENPLAY */}
          {activeTab === 'screenplay' && (
            <div className="space-y-6">
              {/* Story Pillars Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="drama-card p-4 rounded-2xl border border-purple-900/40 bg-[#120e24]">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                    Main Theme
                  </span>
                  <p className="text-xs text-purple-100 font-semibold leading-relaxed">
                    {exportData.story.mainTheme}
                  </p>
                </div>

                <div className="drama-card p-4 rounded-2xl border border-purple-900/40 bg-[#120e24]">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                    Moral Lesson
                  </span>
                  <p className="text-xs text-purple-100 font-semibold leading-relaxed">
                    {exportData.story.moralLesson}
                  </p>
                </div>

                <div className="drama-card p-4 rounded-2xl border border-purple-900/40 bg-[#120e24]">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                    Opening Viral Hook
                  </span>
                  <p className="text-xs text-purple-100 font-semibold leading-relaxed">
                    {exportData.story.hookScene}
                  </p>
                </div>

                <div className="drama-card p-4 rounded-2xl border border-purple-900/40 bg-[#120e24]">
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block mb-1">
                    Dramatic Climax & Ending Hook
                  </span>
                  <p className="text-xs text-purple-100 font-semibold leading-relaxed">
                    {exportData.story.partTwoCliffhanger}
                  </p>
                </div>
              </div>

              {/* Full Screenplay */}
              <div className="drama-card p-6 sm:p-8 rounded-2xl border border-purple-900/40 bg-[#120e24]">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-purple-900/30">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Master Screenplay & Production Dialogue
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(exportData.story.fullDramaScript, 'full_screenplay')}
                    className="text-xs text-purple-300 hover:text-white flex items-center gap-1 font-semibold"
                  >
                    {copiedKey === 'full_screenplay' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300">Copied Screenplay!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Screenplay</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="prose prose-invert max-w-none text-xs sm:text-sm text-purple-100/90 leading-relaxed font-mono whitespace-pre-wrap bg-[#0c0918] p-6 rounded-xl border border-purple-950">
                  {exportData.story.fullDramaScript || 'No screenplay script found.'}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CAST & CHARACTER BIBLES */}
          {activeTab === 'characters' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>Character Bible & Cast Visual Roster ({exportData.characters.length})</span>
                </h3>
                <span className="text-[11px] text-purple-300/70">
                  Essential for facial structure & wardrobe consistency in Midjourney/FLUX
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {exportData.characters.map((char) => (
                  <div
                    key={char.characterId}
                    className="drama-card p-6 rounded-2xl border border-purple-800/40 bg-[#120e24] flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded-md bg-amber-400/10 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                              {char.roleInStory}
                            </span>
                            <span className="text-[11px] text-purple-300/70">
                              Age: {char.age} • {char.culturalIdentity}
                            </span>
                          </div>
                          <h4 className="text-lg font-extrabold text-white">{char.name}</h4>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopy(char.characterBible, `char_bible_${char.characterId}`)}
                          className="text-[11px] text-purple-300 hover:text-white px-2 py-1 rounded-lg bg-purple-950/60 border border-purple-800/40 flex items-center gap-1 font-semibold"
                        >
                          {copiedKey === `char_bible_${char.characterId}` ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-300">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Bible</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Character details grid */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] my-3 p-3 rounded-xl bg-[#0e0a1e] border border-purple-900/30">
                        <div>
                          <span className="text-purple-400 block text-[10px] font-semibold">Skin Tone & Face:</span>
                          <span className="text-purple-200">{char.skinTone}, {char.faceDescription}</span>
                        </div>
                        <div>
                          <span className="text-purple-400 block text-[10px] font-semibold">Hairstyle & Body:</span>
                          <span className="text-purple-200">{char.hairstyle} • {char.bodyType}</span>
                        </div>
                        <div className="col-span-2 pt-1 border-t border-purple-900/30">
                          <span className="text-purple-400 block text-[10px] font-semibold">Signature Wardrobe:</span>
                          <span className="text-purple-200">{char.mainOutfit} ({char.accessories})</span>
                        </div>
                      </div>

                      {/* Consistency Instruction */}
                      <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/30 text-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                          Consistency Lock Directive:
                        </span>
                        <p className="text-[11px] text-purple-200 leading-relaxed font-mono">
                          {char.consistencyInstruction}
                        </p>
                      </div>

                      {/* Negative Prompt */}
                      <div className="mt-2 p-2.5 rounded-lg bg-rose-950/20 border border-rose-900/30 text-[11px] flex items-center justify-between gap-2">
                        <div className="truncate">
                          <span className="text-[10px] font-bold text-rose-400 mr-2">Negative:</span>
                          <span className="text-rose-200/80 font-mono truncate">{char.negativePrompt}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(char.negativePrompt, `char_neg_${char.characterId}`)}
                          className="text-[10px] text-rose-300 hover:text-white shrink-0 font-semibold"
                        >
                          {copiedKey === `char_neg_${char.characterId}` ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: CINEMATOGRAPHY SHOT LIST */}
          {activeTab === 'shotlist' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <span>Director's Cinematography Shot List ({exportData.scenePrompts.length} Shots)</span>
                  </h3>
                  <p className="text-[11px] text-purple-300/70">
                    Comprehensive shot-by-shot sequence for filming and video timeline assembly
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadCsv}
                  className="px-4 py-2 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/70 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Export to Excel / CSV</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-purple-900/40 bg-[#120e24]">
                <table className="w-full text-left text-xs text-purple-200">
                  <thead className="bg-[#181230] text-[10px] font-bold uppercase tracking-wider text-purple-400 border-b border-purple-900/40">
                    <tr>
                      <th className="py-3.5 px-4 w-16">Scene</th>
                      <th className="py-3.5 px-4">Title & Setting</th>
                      <th className="py-3.5 px-4 w-28">Duration</th>
                      <th className="py-3.5 px-4">Characters</th>
                      <th className="py-3.5 px-4">Camera & Lighting</th>
                      <th className="py-3.5 px-4">Spoken Dialogue (Embedded)</th>
                      <th className="py-3.5 px-4 w-24 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-900/30">
                    {exportData.scenePrompts.map((s, idx) => {
                      const chars = Array.isArray(s.charactersInScene)
                        ? s.charactersInScene.join(', ')
                        : s.charactersInScene;

                      return (
                        <tr key={s.sceneId || idx} className="hover:bg-purple-950/30 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-amber-400">
                            #{s.sceneNumber || idx + 1}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-white block">{s.sceneTitle}</span>
                            <span className="text-[11px] text-purple-300/70">{s.location} ({s.timeOfDay})</span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-amber-300">
                            {s.sceneDuration}
                          </td>
                          <td className="py-3.5 px-4 text-purple-200">
                            {chars}
                          </td>
                          <td className="py-3.5 px-4 text-[11px] text-purple-300">
                            <div><strong className="text-white">Cam:</strong> {s.cameraMovement}</div>
                            <div><strong className="text-white">Light:</strong> {s.lighting}</div>
                          </td>
                          <td className="py-3.5 px-4 text-[11px] font-mono text-purple-100 max-w-xs truncate">
                            {s.dialogue || '(Silent tension beat)'}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleCopy(s.videoPrompt, `shot_video_${s.sceneId}`)}
                              className="text-[11px] font-semibold text-purple-300 hover:text-white px-2 py-1 rounded bg-purple-900/40 hover:bg-purple-800/40"
                              title="Copy Video Prompt"
                            >
                              {copiedKey === `shot_video_${s.sceneId}` ? 'Copied' : 'Copy'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: IMAGE PROMPTS (MIDJOURNEY / FLUX) */}
          {activeTab === 'image_prompts' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                    <span>Midjourney & FLUX Image Prompts ({exportData.scenePrompts.length})</span>
                  </h3>
                  <p className="text-[11px] text-purple-300/70">
                    Self-contained scene reference prompts including face architecture, skin tone, attire, and lighting
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      generateImagePromptsTxt(exportData.story, exportData.scenePrompts),
                      'batch_img_tab'
                    )
                  }
                  className="px-4 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-800/60 border border-purple-700/40 text-purple-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {copiedKey === 'batch_img_tab' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">All Prompts Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-amber-400" />
                      <span>Copy All Image Prompts</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-6">
                {exportData.scenePrompts.map((s, idx) => {
                  const arFlag =
                    exportData.story.aspectRatio === '9:16'
                      ? '--ar 9:16'
                      : exportData.story.aspectRatio === '16:9'
                      ? '--ar 16:9'
                      : '--ar 1:1';
                  const mjPrompt = `${s.imagePrompt} ${arFlag} --style raw --v 6.1`;

                  return (
                    <div
                      key={s.sceneId || idx}
                      className="drama-card p-6 rounded-2xl border border-purple-900/40 bg-[#120e24] space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-purple-900/30">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold flex items-center justify-center">
                            {s.sceneNumber || idx + 1}
                          </span>
                          <h4 className="text-sm font-bold text-white">{s.sceneTitle}</h4>
                          <span className="text-[11px] text-purple-300/70">
                            • {s.location} ({s.timeOfDay})
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopy(s.imagePrompt, `img_${s.sceneId}`)}
                            className="px-3 py-1.5 rounded-lg bg-purple-900/50 hover:bg-purple-800/50 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          >
                            {copiedKey === `img_${s.sceneId}` ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-300">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-amber-400" />
                                <span>Copy Prompt</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopy(mjPrompt, `mj_${s.sceneId}`)}
                            className="px-3 py-1.5 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          >
                            {copiedKey === `mj_${s.sceneId}` ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-300">Copied Midjourney!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Midjourney Ready</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Prompt Text */}
                      <div className="p-4 rounded-xl bg-[#0c0918] border border-purple-950 font-mono text-xs text-purple-100 leading-relaxed whitespace-pre-wrap">
                        {s.imagePrompt}
                      </div>

                      {/* Negative Prompt */}
                      <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-900/30 flex items-center justify-between gap-3 text-xs">
                        <div className="truncate">
                          <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mr-2">
                            Negative Prompt:
                          </span>
                          <span className="text-rose-200/80 font-mono text-[11px] truncate">
                            {s.negativePrompt}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(s.negativePrompt, `neg_${s.sceneId}`)}
                          className="text-[11px] text-rose-300 hover:text-white font-semibold shrink-0"
                        >
                          {copiedKey === `neg_${s.sceneId}` ? 'Copied' : 'Copy Negative'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: VIDEO PROMPTS (RUNWAY / KLING / LUMA) */}
          {activeTab === 'video_prompts' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Video className="w-4 h-4 text-purple-400" />
                    <span>Runway Gen-3, Kling AI & Luma Video Prompts ({exportData.scenePrompts.length})</span>
                  </h3>
                  <p className="text-[11px] text-purple-300/70">
                    Characters speak directly with natural lip movement. Spoken lines are embedded directly inside prompt.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      generateVideoPromptsTxt(exportData.story, exportData.scenePrompts),
                      'batch_vid_tab'
                    )
                  }
                  className="px-4 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-800/60 border border-purple-700/40 text-purple-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {copiedKey === `batch_vid_tab` ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">All Video Prompts Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-amber-400" />
                      <span>Copy All Video Prompts</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-6">
                {exportData.scenePrompts.map((s, idx) => (
                  <div
                    key={s.sceneId || idx}
                    className="drama-card p-6 rounded-2xl border border-purple-900/40 bg-[#120e24] space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-purple-900/30">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-purple-600/30 text-purple-300 text-xs font-bold flex items-center justify-center">
                          {s.sceneNumber || idx + 1}
                        </span>
                        <h4 className="text-sm font-bold text-white">{s.sceneTitle}</h4>
                        <span className="text-[11px] text-amber-300/90 font-mono">
                          ({s.sceneDuration})
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopy(s.videoPrompt, `vid_${s.sceneId}`)}
                        className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-purple-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                      >
                        {copiedKey === `vid_${s.sceneId}` ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied Video Prompt!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Video Prompt</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Dialogue Callout */}
                    {s.dialogue && (
                      <div className="p-3 rounded-xl bg-amber-400/5 border border-amber-500/20 text-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                          Direct Spoken Dialogue (Embedded in Video Prompt):
                        </span>
                        <p className="text-[11px] text-amber-100 font-mono leading-relaxed">
                          {s.dialogue}
                        </p>
                      </div>
                    )}

                    {/* Video Prompt Text */}
                    <div className="p-4 rounded-xl bg-[#0c0918] border border-purple-950 font-mono text-xs text-purple-100 leading-relaxed whitespace-pre-wrap">
                      {s.videoPrompt}
                    </div>

                    {/* Cinematography cues */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-purple-300 p-2.5 rounded-xl bg-[#0e0a1e]">
                      <div>
                        <strong className="text-white">Camera:</strong> {s.cameraMovement}
                      </div>
                      <div>
                        <strong className="text-white">Lip-Sync:</strong> {s.lipSyncInstruction}
                      </div>
                      <div>
                        <strong className="text-white">Costume:</strong> {s.costumeContinuity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: AUDIO, DIALOGUE & VOICEOVER */}
          {activeTab === 'audio' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Music className="w-4 h-4 text-cyan-400" />
                    <span>Audio, Dialogue & Voiceover Production Cue Sheet</span>
                  </h3>
                  <p className="text-[11px] text-purple-300/70">
                    Dialogue cues and vocal styling for voice actors or AI voice clones (ElevenLabs / Minimax)
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      generateAudioCueSheetMd(
                        exportData.story,
                        exportData.characters,
                        exportData.scenePrompts
                      ),
                      'audio_sheet_copy'
                    )
                  }
                  className="px-4 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-800/60 border border-purple-700/40 text-purple-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {copiedKey === 'audio_sheet_copy' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Copied Cue Sheet!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-amber-400" />
                      <span>Copy Audio Cue Sheet</span>
                    </>
                  )}
                </button>
              </div>

              {/* Cast Voice Profiles */}
              <div className="drama-card p-6 rounded-2xl border border-purple-900/40 bg-[#120e24]">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
                  Cast Voice Profiles (For ElevenLabs / Minimax / Voice Actors)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {exportData.characters.map((c) => (
                    <div key={c.characterId} className="p-3 rounded-xl bg-[#0c0918] border border-purple-900/30">
                      <span className="font-bold text-white text-xs block mb-0.5">{c.name}</span>
                      <span className="text-[11px] text-cyan-300 font-semibold block mb-1">
                        {c.voiceStyle}
                      </span>
                      <p className="text-[11px] text-purple-200/80 italic">
                        Speaking style: "{c.speakingStyle}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scene-by-Scene Spoken Dialogue */}
              <div className="space-y-4">
                {exportData.scenePrompts.map((s, idx) => (
                  <div
                    key={s.sceneId || idx}
                    className="drama-card p-5 rounded-2xl border border-purple-900/40 bg-[#120e24] space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-purple-900/30">
                      <span className="text-xs font-bold text-white">
                        Scene {s.sceneNumber || idx + 1}: {s.sceneTitle} ({s.sceneDuration})
                      </span>
                      <span className="text-[11px] text-purple-300 font-medium">
                        Tone: {s.emotionalTone}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#0c0918] border border-purple-950 font-mono text-xs text-purple-100 whitespace-pre-wrap leading-relaxed">
                      {s.dialogue || '(No spoken dialogue - silent tension beat)'}
                    </div>

                    <div className="text-[11px] text-purple-300/80">
                      <strong>Lip-Sync Directive:</strong> {s.lipSyncInstruction}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: AI VIRAL SOCIAL KIT & EDITOR NOTES */}
          {activeTab === 'viralkit' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Viral Social Kit & Video Editor Directives</span>
                  </h3>
                  <p className="text-[11px] text-purple-300/70">
                    High-converting TikTok/Reels captions, trending hashtags, pinned debate question, and sound cues
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateAiKit}
                  disabled={generatingKit}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50 transition-all"
                >
                  {generatingKit ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Generating with Gemini...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{exportData.productionKit ? 'Regenerate AI Kit' : 'Generate AI Viral Kit'}</span>
                    </>
                  )}
                </button>
              </div>

              {!exportData.productionKit ? (
                <div className="drama-card p-12 text-center rounded-2xl border border-dashed border-purple-900/60 bg-[#120e24]">
                  <Sparkles className="w-8 h-8 text-amber-400 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-white mb-2">Generate Viral Social Kit with Gemini</h4>
                  <p className="text-xs text-purple-300/80 max-w-md mx-auto mb-6">
                    Produce 3 viral curiosity-gap caption hooks, 20 high-traffic Nollywood hashtags, a pinned debate comment, and CapCut/Premiere editing guidelines tailored to this drama.
                  </p>
                  <button
                    type="button"
                    onClick={handleGenerateAiKit}
                    disabled={generatingKit}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 text-slate-950 text-xs font-bold inline-flex items-center gap-2 shadow-lg active:scale-95"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Viral Kit Now</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Viral Captions */}
                  <div className="drama-card p-6 rounded-2xl border border-purple-900/40 bg-[#120e24] space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                        High-Converting TikTok & Reels Captions
                      </h4>
                      <span className="text-[11px] text-purple-300/70">Engineered for maximum retention</span>
                    </div>

                    <div className="space-y-3">
                      {exportData.productionKit.captionHooks.map((cap, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl bg-[#0c0918] border border-purple-950 flex items-start justify-between gap-4"
                        >
                          <div className="text-xs text-purple-100 leading-relaxed font-sans">
                            <span className="text-amber-400 font-bold mr-2">Option {idx + 1}:</span>
                            {cap}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(cap, `cap_${idx}`)}
                            className="px-2.5 py-1 rounded-lg bg-purple-900/50 hover:bg-purple-800/50 text-purple-200 hover:text-white text-[11px] font-semibold shrink-0"
                          >
                            {copiedKey === `cap_${idx}` ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pinned Discussion Comment & Hashtags */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="drama-card p-6 rounded-2xl border border-purple-900/40 bg-[#120e24] flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                          Pinned Comment (Triggers Comment Algorithm)
                        </h4>
                        <div className="p-4 rounded-xl bg-[#0c0918] border border-purple-950 text-xs text-purple-100 leading-relaxed italic">
                          "{exportData.productionKit.pinnedComment}"
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopy(exportData.productionKit!.pinnedComment, 'pinned_comment')}
                        className="mt-3 px-3 py-1.5 rounded-lg bg-purple-900/50 hover:bg-purple-800/50 text-purple-200 text-xs font-semibold self-start flex items-center gap-1.5"
                      >
                        {copiedKey === 'pinned_comment' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-300">Copied Pinned Comment!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Pinned Comment</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="drama-card p-6 rounded-2xl border border-purple-900/40 bg-[#120e24] flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                          Targeted Viral Hashtags ({exportData.productionKit.hashtags.length})
                        </h4>
                        <div className="p-3 rounded-xl bg-[#0c0918] border border-purple-950 text-xs text-purple-300 leading-relaxed font-mono max-h-32 overflow-y-auto">
                          {exportData.productionKit.hashtags.join(' ')}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopy(exportData.productionKit!.hashtags.join(' '), 'all_hashtags')}
                        className="mt-3 px-3 py-1.5 rounded-lg bg-purple-900/50 hover:bg-purple-800/50 text-purple-200 text-xs font-semibold self-start flex items-center gap-1.5"
                      >
                        {copiedKey === 'all_hashtags' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-300">Copied Hashtags!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy All Hashtags</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Sound Design Cues & Foley */}
                  <div className="drama-card p-6 rounded-2xl border border-purple-900/40 bg-[#120e24] space-y-4">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      Sound Design & Foley Cue Sheet
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {exportData.productionKit.soundEffects.map((sfx, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-[#0c0918] border border-purple-950">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="font-bold text-white">{sfx.cue}</span>
                            <span className="text-amber-400 font-mono">{sfx.time}</span>
                          </div>
                          <p className="text-[11px] text-purple-200/80">{sfx.description}</p>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 text-xs text-purple-300/80">
                      <strong>Soundtrack & Mood Recommendation:</strong> {exportData.productionKit.soundtrackMood}
                    </div>
                  </div>

                  {/* Video Editor Directives & Color LUT */}
                  <div className="drama-card p-6 rounded-2xl border border-purple-900/40 bg-[#120e24] space-y-4">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      Video Editor Directives (CapCut / Premiere Pro / DaVinci Resolve)
                    </h4>

                    <ol className="space-y-2 text-xs text-purple-200 list-decimal list-inside">
                      {exportData.productionKit.editorInstructions.map((inst, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {inst}
                        </li>
                      ))}
                    </ol>

                    <div className="mt-4 p-3 rounded-xl bg-[#0c0918] border border-purple-950 text-xs">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                        Color Grading LUT Specification:
                      </span>
                      <p className="text-purple-200 font-mono text-[11px]">
                        {exportData.productionKit.colorGradingLut}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ==============================================================================
          PRINT-ONLY PRODUCTION PACK LAYOUT (Rendered exclusively during window.print())
          High contrast black-and-white, zero app chrome, cleanly paginated sections
          1. Project overview
          2. Full drama script
          3. Character bible pack
          4. Scene production sheet
          5. Image prompts
          6. Video prompts
          7. Dialogue sheet
          8. Captions and hashtags
          9. Production checklist
          ============================================================================== */}
      {exportData && (
        <div id="printable-production-pack" className="hidden print:block text-slate-900 bg-white font-sans text-xs">
          {/* 1. Project Overview */}
          <div className="pb-6 mb-6 border-b-2 border-slate-900">
            <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-1">
              AI Drama Creator • Master Production Dossier & Production Pack
            </div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">
              {exportData.story.title}
            </h1>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10.5px] font-semibold text-slate-700 mb-4 p-3 bg-slate-100 border border-slate-300 rounded">
              <div><span className="text-slate-500 font-normal">Genre:</span> {exportData.story.storyType}</div>
              <div><span className="text-slate-500 font-normal">Duration:</span> {exportData.story.durationLabel || exportData.story.estimatedDuration}</div>
              <div><span className="text-slate-500 font-normal">Aspect Ratio:</span> {exportData.story.aspectRatio}</div>
              <div><span className="text-slate-500 font-normal">Platform:</span> {exportData.story.targetPlatform}</div>
              <div><span className="text-slate-500 font-normal">Visual Style:</span> {exportData.story.visualStyle}</div>
              <div><span className="text-slate-500 font-normal">Tone:</span> {exportData.story.tone}</div>
              <div><span className="text-slate-500 font-normal">Cast Count:</span> {exportData.characters.length} Characters</div>
              <div><span className="text-slate-500 font-normal">Scene Count:</span> {exportData.scenePrompts.length} Scenes</div>
            </div>
            <div className="space-y-2">
              <div>
                <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider">Logline:</span>
                <p className="text-slate-800 italic text-[11px]">"{exportData.story.logline}"</p>
              </div>
              {exportData.story.hookScene && (
                <div>
                  <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider">Opening Hook (First 3 Seconds):</span>
                  <p className="text-slate-800 text-[11px]">{exportData.story.hookScene}</p>
                </div>
              )}
              {(exportData.story.mainTheme || exportData.story.moralLesson) && (
                <div className="text-[11px] text-slate-700 flex flex-wrap gap-4 pt-1">
                  {exportData.story.mainTheme && <div><strong>Core Theme:</strong> {exportData.story.mainTheme}</div>}
                  {exportData.story.moralLesson && <div><strong>Moral Lesson:</strong> {exportData.story.moralLesson}</div>}
                </div>
              )}
            </div>
          </div>

          {/* 2. Full Drama Script */}
          <div className="print-page-break pt-4 pb-6 mb-6 border-b border-slate-300">
            <h2 className="text-base font-black text-slate-900 uppercase tracking-wider mb-3">
              1. Full Drama Screenplay (Verbatim Dialogue)
            </h2>
            <div className="p-4 bg-slate-50 border border-slate-300 rounded font-mono text-[10px] leading-relaxed whitespace-pre-wrap">
              {exportData.story.fullDramaScript || 'No verbatim screenplay recorded.'}
            </div>
          </div>

          {/* 3. Character Bible Pack */}
          <div className="print-page-break pt-4 pb-6 mb-6 border-b border-slate-300">
            <h2 className="text-base font-black text-slate-900 uppercase tracking-wider mb-3">
              2. Character Bible Pack ({exportData.characters.length} Approved Characters)
            </h2>
            <div className="space-y-4">
              {exportData.characters.map((char, cIdx) => (
                <div key={cIdx} className="print-avoid-break p-3.5 border border-slate-300 rounded bg-slate-50/50">
                  <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-slate-200">
                    <span className="font-bold text-xs text-slate-900">{char.name}</span>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 bg-slate-200 rounded">{char.role || char.roleInStory}</span>
                  </div>
                  <div className="space-y-1 text-[10.5px] text-slate-800">
                    <div><strong>Visual Appearance:</strong> {char.visualAppearance || char.faceDescription || char.description}</div>
                    {(char.wardrobeAttire || char.mainOutfit) && <div><strong>Costume & Wardrobe:</strong> {char.wardrobeAttire || char.mainOutfit}</div>}
                    {(char.actorAnchorPrompt || char.baseImagePrompt || char.consistencyInstruction) && (
                      <div className="font-mono text-[9.5px] text-slate-700 pt-1">
                        <strong>Consistency Prompt:</strong> {char.actorAnchorPrompt || char.baseImagePrompt || char.consistencyInstruction}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Scene Production Sheet */}
          <div className="print-page-break pt-4 pb-6 mb-6 border-b border-slate-300">
            <h2 className="text-base font-black text-slate-900 uppercase tracking-wider mb-3">
              3. Scene Production Sheet ({exportData.scenePrompts.length} Scenes)
            </h2>
            <table className="w-full border-collapse border border-slate-300 text-[10px] mb-4">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold">
                  <th className="border border-slate-300 p-1.5 text-center w-8">#</th>
                  <th className="border border-slate-300 p-1.5 text-left">Scene Title</th>
                  <th className="border border-slate-300 p-1.5 text-center w-14">Duration</th>
                  <th className="border border-slate-300 p-1.5 text-left">Location / Time</th>
                  <th className="border border-slate-300 p-1.5 text-left">Cast in Scene</th>
                  <th className="border border-slate-300 p-1.5 text-left">Camera & Lighting</th>
                </tr>
              </thead>
              <tbody>
                {exportData.scenePrompts.map((sc, sIdx) => (
                  <tr key={sIdx} className="print-avoid-break even:bg-slate-50">
                    <td className="border border-slate-300 p-1.5 text-center font-bold">{sc.sceneNumber || sIdx + 1}</td>
                    <td className="border border-slate-300 p-1.5 font-semibold">{sc.sceneTitle}</td>
                    <td className="border border-slate-300 p-1.5 text-center">{sc.sceneDuration}</td>
                    <td className="border border-slate-300 p-1.5">{sc.location} ({sc.timeOfDay})</td>
                    <td className="border border-slate-300 p-1.5">{Array.isArray(sc.charactersInScene) ? sc.charactersInScene.join(', ') : sc.charactersInScene}</td>
                    <td className="border border-slate-300 p-1.5">{sc.cameraMovement} • {sc.lighting}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 5. Image Prompts */}
          <div className="print-page-break pt-4 pb-6 mb-6 border-b border-slate-300">
            <h2 className="text-base font-black text-slate-900 uppercase tracking-wider mb-3">
              4. Midjourney / FLUX Image Prompts Suite
            </h2>
            <div className="space-y-3">
              {exportData.scenePrompts.map((sc, sIdx) => (
                <div key={sIdx} className="print-avoid-break p-3 border border-slate-300 rounded bg-slate-50/50 text-[10px]">
                  <div className="font-bold text-slate-900 mb-1">
                    Scene {sc.sceneNumber || sIdx + 1}: {sc.sceneTitle} ({sc.aspectRatio || exportData.story.aspectRatio})
                  </div>
                  <div className="font-mono text-[9.5px] text-slate-800 bg-white p-2 border border-slate-200 rounded mb-1.5 whitespace-pre-wrap">
                    {sc.imagePrompt} {sc.aspectRatio === '9:16' ? '--ar 9:16' : sc.aspectRatio === '16:9' ? '--ar 16:9' : '--ar 1:1'} --style raw --v 6.1
                  </div>
                  {sc.negativePrompt && (
                    <div className="text-[9px] text-slate-600">
                      <strong>Negative:</strong> {sc.negativePrompt}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 6. Video Prompts */}
          <div className="print-page-break pt-4 pb-6 mb-6 border-b border-slate-300">
            <h2 className="text-base font-black text-slate-900 uppercase tracking-wider mb-3">
              5. Runway / Kling / Luma Video Prompts Suite
            </h2>
            <div className="space-y-3">
              {exportData.scenePrompts.map((sc, sIdx) => (
                <div key={sIdx} className="print-avoid-break p-3 border border-slate-300 rounded bg-slate-50/50 text-[10px]">
                  <div className="font-bold text-slate-900 mb-1">
                    Scene {sc.sceneNumber || sIdx + 1}: {sc.sceneTitle} • Duration: {sc.sceneDuration} • Camera: {sc.cameraMovement}
                  </div>
                  <div className="font-mono text-[9.5px] text-slate-800 bg-white p-2 border border-slate-200 rounded whitespace-pre-wrap">
                    {sc.videoPrompt}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 7. Dialogue Sheet */}
          <div className="print-page-break pt-4 pb-6 mb-6 border-b border-slate-300">
            <h2 className="text-base font-black text-slate-900 uppercase tracking-wider mb-3">
              6. Verbatim Scene Dialogue Sheet
            </h2>
            <div className="space-y-3">
              {exportData.scenePrompts.map((sc, sIdx) => (
                <div key={sIdx} className="print-avoid-break p-3 border border-slate-300 rounded bg-slate-50/50 text-[10px]">
                  <div className="font-bold text-slate-900 mb-1">
                    Scene {sc.sceneNumber || sIdx + 1}: {sc.sceneTitle} ({Array.isArray(sc.charactersInScene) ? sc.charactersInScene.join(', ') : sc.charactersInScene})
                  </div>
                  <div className="font-mono text-[10px] text-slate-800 bg-white p-2.5 border border-slate-200 rounded whitespace-pre-wrap">
                    {sc.dialogue || '(Silent or action-driven scene)'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 8. Captions and Hashtags */}
          {exportData.productionKit && (
            <div className="print-page-break pt-4 pb-6 mb-6 border-b border-slate-300">
              <h2 className="text-base font-black text-slate-900 uppercase tracking-wider mb-3">
                7. Social Media Captions & Target Hashtags
              </h2>
              <div className="space-y-3 text-[10.5px]">
                <div>
                  <strong className="block text-slate-900 mb-1">High-CTR Captions:</strong>
                  <ul className="list-disc list-inside space-y-1 text-slate-800">
                    {exportData.productionKit.captionHooks.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
                {exportData.productionKit.pinnedComment && (
                  <div>
                    <strong className="block text-slate-900 mb-1">Pinned Engagement Comment:</strong>
                    <p className="p-2 bg-slate-100 border border-slate-300 rounded italic text-slate-800">
                      "{exportData.productionKit.pinnedComment}"
                    </p>
                  </div>
                )}
                {exportData.productionKit.hashtags && (
                  <div>
                    <strong className="block text-slate-900 mb-1">Target Hashtags:</strong>
                    <p className="font-mono text-[10px] text-blue-800">
                      {exportData.productionKit.hashtags.join(' ')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 9. Production Checklist */}
          <div className="print-avoid-break pt-4 pb-4">
            <h2 className="text-base font-black text-slate-900 uppercase tracking-wider mb-3">
              8. Production Execution Checklist
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-slate-800">
              {[
                '1. Generate Character Anchor reference portraits for visual consistency',
                '2. Generate Scene Keyframe images using embedded character prompts',
                '3. Animate scenes via Image-to-Video models (Runway Gen-3, Kling, or Luma)',
                '4. Record/Synthesize verbatim character dialogue (ElevenLabs / Voice Actors)',
                '5. Assemble timeline in editing software (CapCut / Premiere Pro / DaVinci)',
                '6. Apply sound design: Nollywood dramatic stings, suspense drone, footsteps',
                '7. Add bold dynamic subtitles with highlighted keywords',
                '8. Export 9:16 vertical render at 1080x1920 (or chosen aspect ratio)',
                '9. Publish with high-CTR hook caption and pin engagement comment',
              ].map((item, idx) => (
                <div key={idx} className="p-2 border border-slate-300 rounded bg-slate-50 flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border border-slate-400 rounded-sm shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
