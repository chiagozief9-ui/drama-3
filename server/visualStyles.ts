import {
  VISUAL_STYLE_DEFINITIONS,
  getVisualStyleDefinition,
  getNormalizedStyleKey,
  VISUAL_STYLE_OPTIONS,
  type VisualStyleDefinition,
} from '../src/utils/visualStyles.js';

export {
  VISUAL_STYLE_DEFINITIONS,
  getVisualStyleDefinition,
  getNormalizedStyleKey,
  VISUAL_STYLE_OPTIONS,
  type VisualStyleDefinition,
};

/**
 * Returns prompt directives to be injected into Story Generation prompt
 */
export function getVisualStyleStoryDirectives(visualStyle?: string): string {
  const def = getVisualStyleDefinition(visualStyle);
  const styleName = def.name;

  if (styleName === 'Animal Character Animation') {
    return `CRITICAL STYLE DIRECTIVE FOR ANIMAL CHARACTER ANIMATION:
- Characters in this story are anthropomorphic animals acting like people (e.g. talking lion king, goat teacher, rabbit student, dog father, cat mother, monkey friend).
- The animals wear clothes, stand upright on two legs, walk, talk, argue, laugh, and cry just like humans.
- They experience real human drama, family conflict, school/work challenges, and emotional tension.
- Do NOT treat them as wild quadrupeds or ordinary zoo animals. They are drama characters.`;
  }

  if (styleName === 'Fruit / Object Character Animation') {
    return `CRITICAL STYLE DIRECTIVE FOR FRUIT / OBJECT CHARACTER ANIMATION:
- Characters in this story are anthropomorphic fruits, vegetables, or everyday objects designed as living characters (e.g. banana character, cucumber character, mango character, talking chair, walking pencil, crying school bag).
- They must have expressive eyes, mouths, arms, legs, and genuine human emotions.
- Funny yet deeply emotional storytelling with relatable character motivations and clear dialogue.`;
  }

  if (styleName === '3D African Animation') {
    return `CRITICAL STYLE DIRECTIVE FOR 3D AFRICAN ANIMATION:
- Visual tone is a Pixar-inspired 3D African animated drama.
- Characters are stylized with smooth rounded faces, expressive large eyes, and warm brown skin tones.
- Ground the story in colorful African settings (village compounds, bustling modern cities, vibrant markets, schools) with rich cultural attire (Ankara, beads, headwraps).`;
  }

  if (styleName === '3D Storybook Animation') {
    return `CRITICAL STYLE DIRECTIVE FOR 3D STORYBOOK ANIMATION:
- Visual tone is a colorful 3D storybook animation (Pixar-inspired children's animation).
- Ideal for children's moral stories, school tales, teacher/student relations, and warm family fables.
- Big expressive eyes, soft rounded faces, bright cheerful colors, and heartfelt emotional lessons.`;
  }

  if (styleName === '3D American Animation') {
    return `CRITICAL STYLE DIRECTIVE FOR 3D AMERICAN ANIMATION:
- Visual tone is a 3D American animated style (Pixar-inspired American family animation).
- Setting may include suburban neighborhoods, schools, offices, cafés, farms, or city streets.
- Casual American clothing, expressive animated faces, polished family animation look.`;
  }

  if (styleName === 'Kids Toy Animation') {
    return `CRITICAL STYLE DIRECTIVE FOR KIDS TOY ANIMATION:
- Characters have a toy-like 3D animated feel (soft plastic, plush texture, rounded playful shapes).
- Children-friendly emotional storytelling with cute expressive faces in a playful toy or school environment.`;
  }

  if (styleName === 'Fantasy African Folktale') {
    return `CRITICAL STYLE DIRECTIVE FOR FANTASY AFRICAN FOLKTALE:
- Visual tone is mythical and magical African folktale.
- Glowing sacred forests, majestic royal kingdoms, traditional rulers, enchanted objects, spirits, legends, and moonlit village squares.
- Characters speak with intense dramatic gravitas, royal majesty, and cultural depth.`;
  }

  if (styleName === 'Drawn African Storybook Style') {
    return `CRITICAL STYLE DIRECTIVE FOR DRAWN AFRICAN STORYBOOK STYLE:
- Visual tone is 2D hand-drawn illustrated African storybook art.
- Warm painted textures, expressive 2D characters, colorful hand-painted village backgrounds, and soft moral storybook sunlight.`;
  }

  if (styleName === 'Anime-inspired African Style') {
    return `CRITICAL STYLE DIRECTIVE FOR ANIME-INSPIRED AFRICAN STYLE:
- Visual tone is anime-inspired African drama.
- Expressive large anime eyes, dramatic hair, African fashion and patterns, dynamic cinematic framing, emotional close-ups, and clean line art.`;
  }

  return `VISUAL STYLE DIRECTIVE:
- Style: ${def.name}
- Tone and aesthetic: ${def.shortDescription}`;
}

/**
 * Returns character design prompt directives for Gemini character generation
 */
export function getVisualStyleCharacterDirectives(visualStyle?: string): string {
  const def = getVisualStyleDefinition(visualStyle);
  const styleName = def.name;

  return `CRITICAL VISUAL STYLE CHARACTER RULES (${styleName}):
- Core Guidance: ${def.characterGuidance}
- Prompt Direction:
  ${def.promptDirection.map((d) => `* ${d}`).join('\n  ')}
- Avoid Directives (DO NOT include):
  ${def.avoidDirectives.map((a) => `* ${a}`).join('\n  ')}
- Base Image Prompt Template Phrasing:
  "${def.imagePromptGuidance}"
- Negative Prompt Requirements:
  ${def.negativePromptAdditions.join(', ')}`;
}

/**
 * Returns scene prompt directives for Gemini scene generation
 */
export function getVisualStyleScenePromptDirectives(visualStyle?: string): string {
  const def = getVisualStyleDefinition(visualStyle);

  return `STYLE-SPECIFIC DIRECTIVES FOR "${def.name}":
1. IMAGE PROMPT REQUIREMENT:
   Every single imagePrompt MUST incorporate the following style direction:
   "${def.imagePromptGuidance}"
   Directions: ${def.promptDirection.join(', ')}
   Avoid: ${def.avoidDirectives.join(', ')}

2. VIDEO PROMPT REQUIREMENT (ANIMATION MOVEMENT):
   Every single videoPrompt MUST incorporate this style-specific animation movement:
   "${def.videoPromptGuidance}"
   Characters speak directly with natural mouth movement matching spoken dialogue lines. No narrator. No voiceover.

3. NEGATIVE PROMPT ADDITIONS:
   Every scene's negativePrompt MUST include:
   ${def.negativePromptAdditions.join(', ')}`;
}
