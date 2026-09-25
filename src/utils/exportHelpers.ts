import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import type { ExportPackData, ScenePrompt, CharacterProfile, DramaStory, ProductionKit } from '../types';
import { getVisualStyleDefinition } from './visualStyles';

/**
 * Escapes a cell for CSV formatting
 */
function escapeCsv(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Generates CSV shot list spreadsheet
 */
export function generateShotListCsv(scenePrompts: ScenePrompt[]): string {
  const headers = [
    'Scene #',
    'Scene Title',
    'Duration',
    'Location',
    'Time of Day',
    'Characters in Scene',
    'Camera Movement',
    'Lighting',
    'Main Action',
    'Character Dialogue (Embedded)',
    'Image Generation Prompt (Midjourney / FLUX)',
    'Video Generation Prompt (Runway / Kling / Luma)',
    'Negative Prompt',
  ];

  const rows = scenePrompts.map((s, idx) => {
    const chars = Array.isArray(s.charactersInScene)
      ? s.charactersInScene.join(', ')
      : s.charactersInScene;

    return [
      escapeCsv(s.sceneNumber || idx + 1),
      escapeCsv(s.sceneTitle),
      escapeCsv(s.sceneDuration),
      escapeCsv(s.location),
      escapeCsv(s.timeOfDay),
      escapeCsv(chars),
      escapeCsv(s.cameraMovement),
      escapeCsv(s.lighting),
      escapeCsv(s.mainAction),
      escapeCsv(s.dialogue),
      escapeCsv(s.imagePrompt),
      escapeCsv(s.videoPrompt),
      escapeCsv(s.negativePrompt),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Generates standalone Midjourney / FLUX prompts text file
 */
export function generateImagePromptsTxt(story: DramaStory, scenePrompts: ScenePrompt[]): string {
  const lines: string[] = [
    `# ==============================================================================`,
    `# AI IMAGE GENERATION PROMPTS (MIDJOURNEY / FLUX / SDXL)`,
    `# Story: ${story.title}`,
    `# Aspect Ratio: ${story.aspectRatio} | Visual Style: ${story.visualStyle}`,
    `# Generated for African AI Drama Production Pipeline`,
    `# ==============================================================================`,
    ``,
  ];

  scenePrompts.forEach((s, idx) => {
    const num = s.sceneNumber || idx + 1;
    lines.push(`--------------------------------------------------------------------------------`);
    lines.push(`SCENE ${num}: ${s.sceneTitle.toUpperCase()}`);
    lines.push(`Location: ${s.location} (${s.timeOfDay}) | Duration: ${s.sceneDuration}`);
    lines.push(`--------------------------------------------------------------------------------`);
    lines.push(`PROMPT:`);
    lines.push(s.imagePrompt);
    lines.push(``);
    lines.push(`NEGATIVE PROMPT:`);
    lines.push(s.negativePrompt);
    lines.push(``);
    lines.push(`MIDJOURNEY READY CLIP:`);
    const arFlag = s.aspectRatio === '9:16' ? '--ar 9:16' : s.aspectRatio === '16:9' ? '--ar 16:9' : '--ar 1:1';
    lines.push(`${s.imagePrompt} ${arFlag} --style raw --v 6.1`);
    lines.push(``);
    lines.push(``);
  });

  return lines.join('\n');
}

/**
 * Generates standalone Runway / Kling / Luma video prompts text file
 */
export function generateVideoPromptsTxt(story: DramaStory, scenePrompts: ScenePrompt[]): string {
  const lines: string[] = [
    `# ==============================================================================`,
    `# AI VIDEO GENERATION PROMPTS (RUNWAY GEN-3 / KLING AI / LUMA DREAM MACHINE)`,
    `# Story: ${story.title}`,
    `# Target Platform: ${story.targetPlatform || 'TikTok'} | Total Duration: ${story.estimatedDuration}`,
    `# RULE: Characters speak directly with natural lip sync. No external narrator.`,
    `# ==============================================================================`,
    ``,
  ];

  scenePrompts.forEach((s, idx) => {
    const num = s.sceneNumber || idx + 1;
    lines.push(`--------------------------------------------------------------------------------`);
    lines.push(`SCENE ${num}: ${s.sceneTitle.toUpperCase()}`);
    lines.push(`Duration: ${s.sceneDuration} | Camera: ${s.cameraMovement}`);
    lines.push(`--------------------------------------------------------------------------------`);
    lines.push(`VIDEO PROMPT (PASTE INTO AI VIDEO GENERATOR):`);
    lines.push(s.videoPrompt);
    lines.push(``);
    if (s.dialogue) {
      lines.push(`EXACT SPOKEN DIALOGUE REFERENCE:`);
      lines.push(s.dialogue);
      lines.push(``);
    }
    lines.push(`DIRECTOR TIMING NOTES:`);
    lines.push(`- Camera Movement: ${s.cameraMovement}`);
    lines.push(`- Lighting & Color: ${s.lighting}`);
    lines.push(`- Character Positioning: ${s.characterPositioning}`);
    lines.push(`- Continuity Lock: ${s.costumeContinuity}`);
    lines.push(``);
    lines.push(``);
  });

  return lines.join('\n');
}

/**
 * Generates Character Bibles and Consistency Guide
 */
export function generateCharacterBiblesMd(story: DramaStory, characters: CharacterProfile[]): string {
  const lines: string[] = [
    `# CHARACTER BIBLE & VISUAL CONSISTENCY GUIDE`,
    `**Production:** ${story.title}`,
    `**Visual Style:** ${story.visualStyle}`,
    `**Total Cast:** ${characters.length} Principal Characters`,
    ``,
    `> **CRITICAL DIRECTIVE FOR AI GENERATION:** To maintain character facial consistency across all scenes, always reference the character bible parameters, skin tone descriptors, and facial architecture specifications listed below.`,
    ``,
    `---`,
    ``,
  ];

  characters.forEach((c, idx) => {
    lines.push(`## ${idx + 1}. ${c.name} (${c.roleInStory})`);
    lines.push(`- **Age / Gender:** ${c.age} | ${c.gender}`);
    lines.push(`- **Cultural Identity:** ${c.culturalIdentity}`);
    lines.push(`- **Skin Tone:** ${c.skinTone}`);
    lines.push(`- **Facial Architecture:** ${c.faceDescription}`);
    lines.push(`- **Hairstyle:** ${c.hairstyle}`);
    lines.push(`- **Body Type & Height:** ${c.bodyType} | ${c.height}`);
    lines.push(`- **Signature Wardrobe:** ${c.mainOutfit}`);
    lines.push(`- **Accessories & Details:** ${c.accessories}`);
    lines.push(`- **Speaking & Voice Cadence:** ${c.speakingStyle} | ${c.voiceStyle}`);
    lines.push(`- **Core Goal & Weakness:** ${c.characterGoal} / ${c.characterWeakness}`);
    lines.push(`- **Internal Conflict / Secret:** ${c.secretOrConflict}`);
    lines.push(``);
    lines.push(`### Consistency Directive:`);
    lines.push(`\`\`\``);
    lines.push(c.consistencyInstruction);
    lines.push(`\`\`\``);
    lines.push(``);
    lines.push(`### Full Character Bible Entry:`);
    lines.push(c.characterBible);
    lines.push(``);
    lines.push(`### Standard Negative Prompt:`);
    lines.push(`\`\`\``);
    lines.push(c.negativePrompt);
    lines.push(`\`\`\``);
    lines.push(``);
    lines.push(`---`);
    lines.push(``);
  });

  return lines.join('\n');
}

/**
 * Generates Audio, Dialogue & Voiceover Cue Sheet
 */
export function generateAudioCueSheetMd(story: DramaStory, characters: CharacterProfile[], scenePrompts: ScenePrompt[]): string {
  const lines: string[] = [
    `# AUDIO & DIALOGUE PRODUCTION CUE SHEET`,
    `**Story Title:** ${story.title}`,
    `**Tone:** ${story.tone || 'Emotional Nollywood Drama'}`,
    `**Target Duration:** ${story.estimatedDuration}`,
    ``,
    `## Cast Voice Profiles (For ElevenLabs / Minimax / Voice Actors):`,
    ``,
  ];

  characters.forEach(c => {
    lines.push(`- **${c.name}**: ${c.voiceStyle} — *${c.speakingStyle}*`);
  });

  lines.push(``);
  lines.push(`---`);
  lines.push(``);
  lines.push(`## Scene-by-Scene Spoken Dialogue & Emotion Notes:`);
  lines.push(``);

  scenePrompts.forEach((s, idx) => {
    const num = s.sceneNumber || idx + 1;
    lines.push(`### SCENE ${num}: ${s.sceneTitle} (${s.sceneDuration})`);
    lines.push(`**Emotional Tone:** ${s.emotionalTone}`);
    lines.push(`**Location / Ambiance:** ${s.location} (${s.timeOfDay})`);
    lines.push(``);
    lines.push(`**Spoken Lines:**`);
    if (s.dialogue && s.dialogue.trim().length > 0) {
      lines.push(`\`\`\``);
      lines.push(s.dialogue);
      lines.push(`\`\`\``);
    } else {
      lines.push(`*(Silent emotional tension beat / action transition)*`);
    }
    lines.push(``);
    lines.push(`**Lip-Sync & Delivery Directive:** ${s.lipSyncInstruction}`);
    lines.push(``);
    lines.push(`---`);
    lines.push(``);
  });

  return lines.join('\n');
}

/**
 * Generates Social Viral Kit & Video Editor Delivery Notes
 */
export function generateEditorNotesMd(story: DramaStory, kit?: ProductionKit): string {
  const lines: string[] = [
    `# SOCIAL VIRAL KIT & VIDEO EDITOR DELIVERY NOTES`,
    `**Project:** ${story.title}`,
    `**Target Platform:** ${story.targetPlatform || 'TikTok / Instagram Reels'}`,
    `**Duration:** ${story.estimatedDuration}`,
    ``,
    `---`,
    ``,
    `## 1. High-Converting Social Media Captions:`,
    ``,
  ];

  if (kit && kit.captionHooks && kit.captionHooks.length > 0) {
    kit.captionHooks.forEach((cap, idx) => {
      lines.push(`### Option ${idx + 1}:`);
      lines.push(cap);
      lines.push(``);
    });
  } else {
    lines.push(`- She thought her brother went to school... but the truth tore their family in two 💔😭 Watch till the end! #Nollywood`);
    lines.push(`- The moment she dropped the basin, everything changed 😱 Watch the full continuous drama!`);
    lines.push(``);
  }

  lines.push(`## 2. Pinned Discussion Comment (Drive Comment Algorithm):`);
  lines.push(`> "${kit?.pinnedComment || 'Was she right to react like this or did she go too far? Drop your honest opinion below! 👇'}"`);
  lines.push(``);

  lines.push(`## 3. Targeted Viral Hashtags:`);
  if (kit && kit.hashtags) {
    lines.push(kit.hashtags.join(' '));
  } else {
    lines.push(`#Nollywood #NollywoodDrama #AfricanStories #AIDrama #TikTokShortFilm #ViralStory`);
  }
  lines.push(``);

  lines.push(`---`);
  lines.push(``);
  lines.push(`## 4. Soundtrack & Music Mood:`);
  lines.push(kit?.soundtrackMood || 'Traditional African percussion (Ogene, Talking drum) blended with cinematic modern tension pads and heartbeat rhythms.');
  lines.push(``);

  lines.push(`## 5. Sound Effects & Foley Cues:`);
  if (kit && kit.soundEffects && kit.soundEffects.length > 0) {
    kit.soundEffects.forEach(sfx => {
      lines.push(`- **[${sfx.time}] ${sfx.cue}**: ${sfx.description}`);
    });
  } else {
    lines.push(`- **[00:00 - 00:03] Background Ambiance**: Subtle Lagos neighborhood chatter.`);
    lines.push(`- **[00:15 - 00:20] Dramatic Clatter**: Sudden metallic shock hit.`);
    lines.push(`- **[00:50 - 01:00] Cliffhanger Cut**: Instant audio dropout on final syllable.`);
  }
  lines.push(``);

  lines.push(`---`);
  lines.push(``);
  lines.push(`## 6. Color Grading LUT Recommendation:`);
  lines.push(kit?.colorGradingLut || 'Cinematic West African Warmth: Rich golden hour highlights, deep cocoa skin tone enhancement, punchy contrast, saturated African prints.');
  lines.push(``);

  lines.push(`## 7. Video Editor Directives (CapCut / Premiere Pro / DaVinci):`);
  if (kit && kit.editorInstructions && kit.editorInstructions.length > 0) {
    kit.editorInstructions.forEach((inst, idx) => {
      lines.push(`${idx + 1}. ${inst}`);
    });
  } else {
    lines.push(`1. Hook in the first 1.5 seconds with maximum character emotion.`);
    lines.push(`2. Use 1.15x rapid micro-zooms on character reaction faces.`);
    lines.push(`3. Center subtitle captions with yellow font and black outline.`);
    lines.push(`4. Cut exactly on the cliffhanger question to drive comments.`);
  }

  return lines.join('\n');
}

/**
 * Generates the full master production screenplay & markdown dossier
 */
export function generateMasterDossierMd(data: ExportPackData): string {
  const { story, characters, scenePrompts, productionKit } = data;

  const lines: string[] = [
    `# ==============================================================================`,
    `# MASTER PRODUCTION DOSSIER & SCREENPLAY`,
    `# "${story.title}"`,
    `# AI-Generated Nollywood Drama Production Package`,
    `# ==============================================================================`,
    ``,
    `## STORY METADATA:`,
    `- **Story ID:** \`${story.storyId}\``,
    `- **Genre / Type:** ${story.storyType}`,
    `- **Tone:** ${story.tone || 'High Drama / Emotional Confrontation'}`,
    `- **Visual Style:** ${story.visualStyle} — ${getVisualStyleDefinition(story.visualStyle).shortDescription}`,
    `- **Style Prompt Direction:** ${getVisualStyleDefinition(story.visualStyle).imagePromptGuidance}`,
    `- **Aspect Ratio:** ${story.aspectRatio}`,
    `- **Target Platform:** ${story.targetPlatform || 'TikTok / Reels'}`,
    `- **Estimated Runtime:** ${story.estimatedDuration}`,
    `- **Total Scenes:** ${scenePrompts.length}`,
    `- **Total Cast:** ${characters.length} Characters`,
    `- **Export Date:** ${data.exportedAt || new Date().toISOString()}`,
    ``,
    `---`,
    ``,
    `## 1. STORY ESSENCE:`,
    `### Logline:`,
    `> ${story.logline}`,
    ``,
    `### Main Theme:`,
    `${story.mainTheme}`,
    ``,
    `### Moral Lesson:`,
    `${story.moralLesson}`,
    ``,
    `### Viral Hook Scene:`,
    `${story.hookScene}`,
    ``,
    `### Dramatic Climax & Ending Hook:`,
    `${story.partTwoCliffhanger}`,
    ``,
    `---`,
    ``,
    `## 2. COMPLETE DRAMA SCRIPT / SCREENPLAY:`,
    story.fullDramaScript || '*(See scene-by-scene script breakdown below)*',
    ``,
    `---`,
    ``,
    `## 3. CAST ROSTER & CHARACTER BIBLES:`,
    ``,
  ];

  characters.forEach((c, idx) => {
    lines.push(`### ${idx + 1}. ${c.name} — ${c.roleInStory}`);
    lines.push(`- **Age / Cultural Identity:** ${c.age} years old | ${c.culturalIdentity}`);
    lines.push(`- **Visual Appearance:** ${c.faceDescription}, ${c.skinTone} skin tone, ${c.hairstyle}`);
    lines.push(`- **Wardrobe:** ${c.mainOutfit}`);
    lines.push(`- **Voice / Delivery:** ${c.voiceStyle} (${c.speakingStyle})`);
    lines.push(`- **Character Bible:** ${c.characterBible}`);
    lines.push(`- **Consistency Lock:** \`${c.consistencyInstruction}\``);
    lines.push(``);
  });

  lines.push(`---`);
  lines.push(``);
  lines.push(`## 4. SHOT-BY-SHOT PRODUCTION PROMPTS:`);
  lines.push(``);

  scenePrompts.forEach((s, idx) => {
    const num = s.sceneNumber || idx + 1;
    lines.push(`### SCENE ${num}: ${s.sceneTitle}`);
    lines.push(`- **Duration / Time:** ${s.sceneDuration} | ${s.timeOfDay}`);
    lines.push(`- **Location:** ${s.location}`);
    lines.push(`- **Camera Movement:** ${s.cameraMovement}`);
    lines.push(`- **Lighting:** ${s.lighting}`);
    lines.push(`- **Cast in Scene:** ${Array.isArray(s.charactersInScene) ? s.charactersInScene.join(', ') : s.charactersInScene}`);
    lines.push(`- **Main Action:** ${s.mainAction}`);
    lines.push(`- **Embedded Dialogue:**`);
    lines.push(`  \`\`\``);
    lines.push(`  ${s.dialogue || '(Silent tension)'}`);
    lines.push(`  \`\`\``);
    lines.push(``);
    lines.push(`#### Image Generation Prompt (Midjourney / FLUX):`);
    lines.push(`\`\`\``);
    lines.push(s.imagePrompt);
    lines.push(`\`\`\``);
    lines.push(``);
    lines.push(`#### Video Generation Prompt (Runway / Kling / Luma):`);
    lines.push(`\`\`\``);
    lines.push(s.videoPrompt);
    lines.push(`\`\`\``);
    lines.push(``);
    lines.push(`#### Negative Prompt:`);
    lines.push(`\`\`\``);
    lines.push(s.negativePrompt);
    lines.push(`\`\`\``);
    lines.push(``);
    lines.push(`---`);
    lines.push(``);
  });

  if (productionKit) {
    lines.push(`## 5. SOCIAL MEDIA VIRAL KIT:`);
    lines.push(`### Captions:`);
    productionKit.captionHooks.forEach((c, i) => lines.push(`${i + 1}. ${c}`));
    lines.push(``);
    lines.push(`### Pinned Comment:`);
    lines.push(`> ${productionKit.pinnedComment}`);
    lines.push(``);
    lines.push(`### Hashtags:`);
    lines.push(productionKit.hashtags.join(' '));
    lines.push(``);
  }

  return lines.join('\n');
}

/**
 * Builds a ZIP file with all production assets
 */
export async function createProductionZip(data: ExportPackData): Promise<Blob> {
  const zip = new JSZip();
  const folderName = `Nollywood_AI_${data.story.title.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  const root = zip.folder(folderName) || zip;

  // 1. Master Screenplay & Overview
  root.file('01_Story_Overview_and_Screenplay.md', generateMasterDossierMd(data));

  // 2. Character Bibles & Cast Roster
  root.file('02_Character_Bibles_and_Consistency.md', generateCharacterBiblesMd(data.story, data.characters));

  // 3. Cinematography Shot List CSV
  root.file('03_Cinematography_Shot_List.csv', generateShotListCsv(data.scenePrompts));

  // 4. Midjourney / FLUX Prompts Text
  root.file('04_Midjourney_Flux_Image_Prompts.txt', generateImagePromptsTxt(data.story, data.scenePrompts));

  // 5. Runway / Kling Video Prompts Text
  root.file('05_Runway_Kling_Video_Prompts.txt', generateVideoPromptsTxt(data.story, data.scenePrompts));

  // 6. Audio, Dialogue & Voiceover Cue Sheet
  root.file('06_Audio_Dialogue_and_Voice_Direction.md', generateAudioCueSheetMd(data.story, data.characters, data.scenePrompts));

  // 7. Viral Social Kit & Video Editor Directives
  root.file('07_Viral_Captions_and_Editor_Notes.md', generateEditorNotesMd(data.story, data.productionKit));

  // 8. Raw JSON Project Data
  root.file('Complete_Project_Data.json', JSON.stringify(data, null, 2));

  // Generate ZIP blob
  return await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}

/**
 * Browser file download helpers
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadText(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  downloadBlob(blob, filename);
}

/**
 * Generates plain text export of the complete production pack
 */
export function generateFullProductionTxt(data: ExportPackData): string {
  const lines: string[] = [
    `================================================================================`,
    `AI DRAMA CREATOR - FULL PRODUCTION PACK`,
    `PROJECT: ${data.story.title.toUpperCase()}`,
    `================================================================================`,
    `Story Type: ${data.story.storyType}`,
    `Estimated Duration: ${data.story.durationLabel || data.story.estimatedDuration}`,
    `Aspect Ratio: ${data.story.aspectRatio} | Target Platform: ${data.story.targetPlatform}`,
    `Visual Style: ${data.story.visualStyle} | Tone: ${data.story.tone}`,
    ``,
    `LOGLINE:`,
    data.story.logline || 'N/A',
    ``,
    `3-SECOND OPENING HOOK:`,
    data.story.hookScene || 'N/A',
    ``,
    `CORE THEME: ${data.story.mainTheme || 'N/A'}`,
    `MORAL LESSON: ${data.story.moralLesson || 'N/A'}`,
    ``,
    `================================================================================`,
    `1. CHARACTER BIBLES (${data.characters?.length || 0} CHARACTERS)`,
    `================================================================================`,
  ];

  (data.characters || []).forEach((c, idx) => {
    lines.push(`\n[CHARACTER ${idx + 1}] ${c.name.toUpperCase()} (${c.role || c.roleInStory})`);
    lines.push(`Visual Appearance: ${c.visualAppearance || c.faceDescription || c.description || 'N/A'}`);
    lines.push(`Attire: ${c.wardrobeAttire || c.mainOutfit || 'N/A'}`);
    lines.push(`Consistency Anchor Prompt: ${c.actorAnchorPrompt || c.baseImagePrompt || c.consistencyInstruction || 'N/A'}`);
  });

  lines.push(
    `\n================================================================================`,
    `2. FULL SCREENPLAY (VERBATIM DIALOGUE)`,
    `================================================================================`,
    data.story.fullDramaScript || '',
    `\n================================================================================`,
    `3. SCENE PRODUCTION SHEET & AI PROMPTS (${data.scenePrompts?.length || 0} SCENES)`,
    `================================================================================`
  );

  (data.scenePrompts || []).forEach((s) => {
    lines.push(`\n--- SCENE ${s.sceneNumber}: ${s.sceneTitle.toUpperCase()} (${s.sceneDuration}) ---`);
    lines.push(`Location: ${s.location} (${s.timeOfDay})`);
    lines.push(`Characters: ${Array.isArray(s.charactersInScene) ? s.charactersInScene.join(', ') : s.charactersInScene}`);
    if (s.dialogue) lines.push(`Dialogue:\n${s.dialogue}`);
    lines.push(`Image Prompt (Midjourney / FLUX):\n${s.imagePrompt}`);
    lines.push(`Video Prompt (Runway / Kling / Luma):\n${s.videoPrompt}`);
    if (s.negativePrompt) lines.push(`Negative Prompt:\n${s.negativePrompt}`);
  });

  if (data.productionKit) {
    lines.push(
      `\n================================================================================`,
      `4. SOCIAL MEDIA VIRAL KIT`,
      `================================================================================`,
      `Captions:`
    );
    data.productionKit.captionHooks.forEach((c, i) => lines.push(`${i + 1}. ${c}`));
    lines.push(`\nPinned Comment: ${data.productionKit.pinnedComment}`);
    lines.push(`\nHashtags: ${data.productionKit.hashtags.join(' ')}`);
  }

  lines.push(
    `\n================================================================================`,
    `5. PRODUCTION CHECKLIST`,
    `================================================================================`,
    `[ ] 1. Generate Character Anchor reference portraits for visual consistency`,
    `[ ] 2. Generate Scene Keyframe images using embedded character prompts`,
    `[ ] 3. Animate scenes via Image-to-Video models (Runway Gen-3, Kling, or Luma)`,
    `[ ] 4. Record/Synthesize verbatim character dialogue (ElevenLabs / Voice Actors)`,
    `[ ] 5. Assemble timeline in editing software (CapCut / Premiere Pro / DaVinci)`,
    `[ ] 6. Apply sound design: Nollywood dramatic stings, suspense drone, footsteps`,
    `[ ] 7. Add bold dynamic subtitles with highlighted keywords`,
    `[ ] 8. Export 9:16 vertical render at 1080x1920 (or chosen aspect ratio)`,
    `[ ] 9. Publish with high-CTR hook caption and pin engagement comment`
  );

  return lines.join('\n');
}

/**
 * Generates a clean, professional multi-page PDF using jsPDF
 */
export async function generateProductionPackPdf(data: ExportPackData): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  const addHeader = (title: string, subtitle?: string) => {
    checkPageBreak(22);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(30, 20, 60);
    doc.text(title, margin, y);
    y += 6;
    if (subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 110);
      doc.text(subtitle, margin, y);
      y += 5;
    }
    doc.setDrawColor(200, 180, 230);
    doc.setLineWidth(0.4);
    doc.line(margin, y, pageWidth - margin, y);
    y += 7;
  };

  // 1. Cover / Title Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(20, 15, 45);
  const titleLines = doc.splitTextToSize(data.story.title.toUpperCase(), contentWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 8.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(110, 90, 140);
  doc.text('AI Drama Creator • Master Production Pack', margin, y);
  y += 6;

  doc.setDrawColor(180, 130, 240);
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Metadata Grid
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 60);
  doc.text(
    `Genre: ${data.story.storyType}  |  Duration: ${data.story.durationLabel || data.story.estimatedDuration}  |  Ratio: ${data.story.aspectRatio}  |  Platform: ${data.story.targetPlatform}`,
    margin,
    y
  );
  y += 5.5;
  doc.text(`Visual Style: ${data.story.visualStyle}  |  Tone: ${data.story.tone}`, margin, y);
  y += 9;

  // Overview / Logline
  if (data.story.logline) {
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 20, 60);
    doc.text('Logline', margin, y);
    y += 5;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9.5);
    doc.setTextColor(40, 40, 40);
    const loglineLines = doc.splitTextToSize(`"${data.story.logline}"`, contentWidth);
    doc.text(loglineLines, margin, y);
    y += loglineLines.length * 5 + 6;
  }

  // Hook Scene
  if (data.story.hookScene) {
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(180, 80, 20);
    doc.text('Opening Hook Scene (First 3 Seconds)', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(40, 40, 40);
    const hookLines = doc.splitTextToSize(data.story.hookScene, contentWidth);
    doc.text(hookLines, margin, y);
    y += hookLines.length * 5 + 8;
  }

  // Themes and moral
  if (data.story.mainTheme || data.story.moralLesson) {
    checkPageBreak(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(60, 60, 70);
    if (data.story.mainTheme) {
      doc.text(`Core Theme: ${data.story.mainTheme}`, margin, y);
      y += 5;
    }
    if (data.story.moralLesson) {
      doc.text(`Moral Lesson: ${data.story.moralLesson}`, margin, y);
      y += 8;
    }
  }

  // 2. Character Bible Pack
  if (data.characters && data.characters.length > 0) {
    addHeader('Character Bible & Visual Consistency Pack', `${data.characters.length} Approved Characters`);
    for (const char of data.characters) {
      checkPageBreak(35);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(40, 20, 80);
      doc.text(`${char.name} (${char.role || char.roleInStory || 'Character'})`, margin, y);
      y += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);
      const descText = char.visualAppearance || char.faceDescription || char.description || '';
      const descLines = doc.splitTextToSize(`Visual Appearance: ${descText}`, contentWidth);
      doc.text(descLines, margin, y);
      y += descLines.length * 4.5 + 2;

      const attireText = char.wardrobeAttire || char.mainOutfit || '';
      if (attireText) {
        const attireLines = doc.splitTextToSize(`Costume & Wardrobe: ${attireText}`, contentWidth);
        doc.text(attireLines, margin, y);
        y += attireLines.length * 4.5 + 2;
      }
      const anchorText = char.actorAnchorPrompt || char.baseImagePrompt || char.consistencyInstruction || '';
      if (anchorText) {
        const anchorLines = doc.splitTextToSize(`Consistency Prompt: ${anchorText}`, contentWidth);
        doc.setFont('helvetica', 'italic');
        doc.text(anchorLines, margin, y);
        doc.setFont('helvetica', 'normal');
        y += anchorLines.length * 4.5 + 2;
      }
      y += 4;
    }
  }

  // 3. Full Drama Script
  if (data.story.fullDramaScript) {
    doc.addPage();
    y = margin;
    addHeader('Full Drama Screenplay (Verbatim Dialogue)', 'Complete script without narrator interference');
    doc.setFont('courier', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 30, 30);
    const scriptLines = doc.splitTextToSize(data.story.fullDramaScript, contentWidth);
    for (const line of scriptLines) {
      checkPageBreak(5);
      doc.text(line, margin, y);
      y += 4.5;
    }
    y += 8;
  }

  // 4. Scene Production Sheet & Prompts
  if (data.scenePrompts && data.scenePrompts.length > 0) {
    doc.addPage();
    y = margin;
    addHeader('Scene Production Sheet & AI Prompts Suite', `${data.scenePrompts.length} Scenes`);

    for (const sc of data.scenePrompts) {
      checkPageBreak(45);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(20, 20, 50);
      doc.text(`Scene ${sc.sceneNumber}: ${sc.sceneTitle} (${sc.sceneDuration || '10s'})`, margin, y);
      y += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(70, 70, 70);
      doc.text(
        `Location: ${sc.location} (${sc.timeOfDay})  |  Characters: ${
          Array.isArray(sc.charactersInScene) ? sc.charactersInScene.join(', ') : sc.charactersInScene
        }`,
        margin,
        y
      );
      y += 4.5;

      if (sc.dialogue) {
        checkPageBreak(15);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(140, 50, 20);
        doc.text('Dialogue:', margin, y);
        y += 4;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 30, 30);
        const dialLines = doc.splitTextToSize(sc.dialogue, contentWidth);
        doc.text(dialLines, margin, y);
        y += dialLines.length * 4 + 2;
      }

      if (sc.imagePrompt) {
        checkPageBreak(25);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(60, 30, 110);
        doc.text('Image Prompt (Midjourney / FLUX):', margin, y);
        y += 4;
        doc.setFont('courier', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(30, 30, 30);
        const imgLines = doc.splitTextToSize(sc.imagePrompt, contentWidth);
        doc.text(imgLines, margin, y);
        y += imgLines.length * 3.8 + 2;
      }

      if (sc.videoPrompt) {
        checkPageBreak(25);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(20, 80, 60);
        doc.text('Video Prompt (Runway / Kling / Luma):', margin, y);
        y += 4;
        doc.setFont('courier', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(30, 30, 30);
        const vidLines = doc.splitTextToSize(sc.videoPrompt, contentWidth);
        doc.text(vidLines, margin, y);
        y += vidLines.length * 3.8 + 2;
      }

      y += 5;
      doc.setDrawColor(220, 220, 230);
      doc.setLineWidth(0.2);
      doc.line(margin, y, pageWidth - margin, y);
      y += 5;
    }
  }

  // 5. Viral Social Kit & Hashtags
  if (data.productionKit) {
    checkPageBreak(40);
    addHeader('Social Media Viral Kit & Distribution');
    if (data.productionKit.captionHooks && data.productionKit.captionHooks.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(30, 30, 40);
      doc.text('High-CTR Captions:', margin, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      data.productionKit.captionHooks.forEach((hook, i) => {
        const hLines = doc.splitTextToSize(`${i + 1}. ${hook}`, contentWidth);
        doc.text(hLines, margin, y);
        y += hLines.length * 4 + 1.5;
      });
      y += 3;
    }

    if (data.productionKit.pinnedComment) {
      checkPageBreak(20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Pinned Engagement Comment:', margin, y);
      y += 5;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      const cLines = doc.splitTextToSize(`"${data.productionKit.pinnedComment}"`, contentWidth);
      doc.text(cLines, margin, y);
      y += cLines.length * 4 + 4;
    }

    if (data.productionKit.hashtags && data.productionKit.hashtags.length > 0) {
      checkPageBreak(15);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Target Hashtags:', margin, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(50, 50, 150);
      const tagLines = doc.splitTextToSize(data.productionKit.hashtags.join(' '), contentWidth);
      doc.text(tagLines, margin, y);
      y += tagLines.length * 4 + 6;
    }
  }

  // 6. Production Checklist
  checkPageBreak(35);
  addHeader('Production Execution Checklist');
  const checklist = [
    '[ ] 1. Generate Character Anchor reference portraits for visual consistency',
    '[ ] 2. Generate Scene Keyframe images using embedded character prompts',
    '[ ] 3. Animate scenes via Image-to-Video models (Runway Gen-3, Kling, or Luma)',
    '[ ] 4. Record/Synthesize verbatim character dialogue (ElevenLabs / Voice Actors)',
    '[ ] 5. Assemble timeline in editing software (CapCut / Premiere Pro / DaVinci)',
    '[ ] 6. Apply sound design: Nollywood dramatic stings, suspense drone, footsteps',
    '[ ] 7. Add bold dynamic subtitles with highlighted keywords',
    '[ ] 8. Export 9:16 vertical render at 1080x1920 (or chosen aspect ratio)',
    '[ ] 9. Publish with high-CTR hook caption and pin engagement comment',
  ];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(40, 40, 40);
  checklist.forEach((item) => {
    checkPageBreak(6);
    doc.text(item, margin, y);
    y += 5;
  });

  return doc.output('blob');
}
