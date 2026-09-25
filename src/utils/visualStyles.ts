export interface VisualStyleDefinition {
  id: string;
  name: string;
  category: 'Cinematic' | '3D Animation' | 'Character Animation' | 'Illustrated & Folktale';
  shortDescription: string;
  promptDirection: string[];
  avoidDirectives: string[];
  characterGuidance: string;
  imagePromptGuidance: string;
  videoPromptGuidance: string;
  negativePromptAdditions: string[];
}

export const VISUAL_STYLE_DEFINITIONS: Record<string, VisualStyleDefinition> = {
  // Existing Styles
  'Cinematic Nollywood Style': {
    id: 'cinematic_nollywood',
    name: 'Cinematic Nollywood Style',
    category: 'Cinematic',
    shortDescription: 'Cinematic Nollywood realistic live-action drama with authentic African lighting and rich colors',
    promptDirection: [
      'Cinematic Nollywood realistic film style',
      'rich African skin tones',
      'authentic Nigerian and African fabrics and textures',
      'filmic dramatic lighting with golden rim lights',
      'shallow depth of field, 35mm/85mm portrait lenses',
      'sharp focus on expressive eyes',
    ],
    avoidDirectives: ['flat 2D cartoon', 'cheap video look', 'plastic skin', 'eerie doll face'],
    characterGuidance: 'Authentic African actors with realistic skin tones, natural hair textures, and genuine Nigerian/African attire.',
    imagePromptGuidance: 'Cinematic Nollywood realistic drama style, authentic African skin tones, dramatic volumetric lighting, 85mm portrait lens, sharp focus, 8k resolution',
    videoPromptGuidance: 'Realistic actors deliver dialogue with natural facial emotion and subtle micro-expressions, authentic lip sync, smooth camera tracking, no narrator, no voiceover.',
    negativePromptAdditions: ['cartoon', '3D render', 'plastic skin', 'unrealistic anatomy', 'low quality'],
  },

  'Realistic AI': {
    id: 'realistic_ai',
    name: 'Realistic AI',
    category: 'Cinematic',
    shortDescription: 'Photorealistic cinematic drama with lifelike human skin, natural lighting, and textures',
    promptDirection: [
      'Photorealistic cinematic film still',
      'lifelike human skin pores and micro-textures',
      'natural dramatic lighting and cinema color grading',
      'authentic human eye reflections and emotional gaze',
      '8k resolution, documentary/film quality',
    ],
    avoidDirectives: ['stylized cartoon', '3D CGI doll look', 'plastic airbrushed skin', 'painterly textures'],
    characterGuidance: 'Ultra-realistic human people with lifelike facial features, realistic age lines, and authentic clothing fabrics.',
    imagePromptGuidance: 'Photorealistic cinematic still, ultra-realistic human features, natural ambient lighting, 8k resolution, documentary film quality',
    videoPromptGuidance: 'Realistic human actors speaking directly with subtle lip movement, lifelike breathing and body movement, authentic emotional timing, no narrator, no voiceover.',
    negativePromptAdditions: ['cartoon', 'drawing', 'CGI render', 'airbrushed face', 'plastic skin'],
  },

  '3D Animation': {
    id: '3d_animation',
    name: '3D Animation',
    category: '3D Animation',
    shortDescription: 'High-end 3D CGI animated drama with stylized characters and lighting',
    promptDirection: [
      'Polished 3D CGI animation',
      'stylized character proportions',
      'smooth cinematic shaders',
      'vibrant atmospheric lighting',
    ],
    avoidDirectives: ['flat 2D cartoon', 'low-poly graphics', 'uncanny realism'],
    characterGuidance: 'Stylized 3D animated character models with expressive features, smooth skin shaders, and cinematic clothing.',
    imagePromptGuidance: 'High-end 3D animated style, smooth stylized character models, cinematic volumetric lighting, clean 3D render',
    videoPromptGuidance: 'Expressive 3D character motion, natural mouth movement and lip sync synchronized with dialogue, dynamic body acting, no narrator, no voiceover.',
    negativePromptAdditions: ['flat 2D', 'low poly', 'pixelated', 'blurry render'],
  },

  'Cartoon': {
    id: 'cartoon',
    name: 'Cartoon',
    category: 'Illustrated & Folktale',
    shortDescription: 'Vibrant animated cartoon style with expressive lines and bold colors',
    promptDirection: [
      'Vibrant animated cartoon aesthetic',
      'bold expressive character outlines',
      'lively facial expressions and animated shapes',
      'colorful stylized environments',
    ],
    avoidDirectives: ['realistic photography', 'eerie CGI doll faces'],
    characterGuidance: 'Expressive 2D animated cartoon characters with bold silhouettes, distinct hairstyles, and animated expressions.',
    imagePromptGuidance: 'Vibrant animated cartoon style, expressive characters, bold clean lines, rich color palette',
    videoPromptGuidance: 'Lively animated cartoon movement, expressive facial reactions, clear stylized mouth movement delivering dialogue, no narrator, no voiceover.',
    negativePromptAdditions: ['photorealistic', '3D render', 'grainy noise', 'drab colors'],
  },

  'Drawn African Style': {
    id: 'drawn_african',
    name: 'Drawn African Style',
    category: 'Illustrated & Folktale',
    shortDescription: 'Artistic African hand-drawn illustration with cultural patterns and textures',
    promptDirection: [
      'Artistic African illustrated style',
      'hand-drawn textures and cultural patterns',
      'warm earth tones and traditional African motifs',
      'expressive illustrated character faces',
    ],
    avoidDirectives: ['generic Western 3D render', 'hyper-realistic photography'],
    characterGuidance: 'Illustrated African characters drawn with rich cultural African attire, distinctive hairstyles, and emotive artistic eyes.',
    imagePromptGuidance: 'Hand-drawn African artistic style, expressive cultural illustration, rich earthy textures, vibrant African patterns',
    videoPromptGuidance: 'Illustrated animated motion, expressive hand-drawn gestures and lip movement, warm atmospheric lighting, no narrator, no voiceover.',
    negativePromptAdditions: ['3D CGI', 'photorealism', 'cold colors', 'generic Western comic'],
  },

  // NEW STYLES
  '3D African Animation': {
    id: '3d_african_animation',
    name: '3D African Animation',
    category: '3D Animation',
    shortDescription: 'Pixar-inspired 3D African animated drama with smooth rounded faces, large eyes, and Ankara fabrics',
    promptDirection: [
      '3D African animated style',
      'Pixar-inspired cinematic 3D animation',
      'stylized African characters',
      'smooth rounded faces',
      'expressive large eyes',
      'warm brown skin tones',
      'cultural African clothing when suitable',
      'beads, Ankara, wrappers, headwraps when needed',
      'African homes, village compounds, markets, schools, churches, forests',
      'warm golden sunlight',
      'soft shadows',
      'rich colorful fabrics',
      'clean high-quality 3D render',
    ],
    avoidDirectives: [
      'flat 2D cartoon',
      'low-quality 3D',
      'creepy doll faces',
      'hyper-realistic human photography',
    ],
    characterGuidance:
      'Stylized 3D African animated characters, Pixar-inspired cinematic 3D animation, smooth rounded faces, expressive large eyes, warm brown skin tones, cultural African clothing (beads, Ankara, wrappers, headwraps), clean high-quality 3D render.',
    imagePromptGuidance:
      '3D African animated style, Pixar-inspired cinematic 3D animation, smooth rounded faces, expressive large eyes, warm golden sunlight, rich colorful African fabrics, clean high-quality 3D render',
    videoPromptGuidance:
      'Characters speak directly with natural mouth movement, expressive animated facial reactions, smooth 3D body motion, emotional timing, no narrator, no voiceover.',
    negativePromptAdditions: [
      'flat 2D cartoon',
      'low-quality 3D',
      'creepy doll faces',
      'hyper-realistic human photography',
      'pixelated',
      'distorted hands',
    ],
  },

  '3D Storybook Animation': {
    id: '3d_storybook_animation',
    name: '3D Storybook Animation',
    category: '3D Animation',
    shortDescription: 'Colorful Pixar-inspired children’s 3D animation for moral, school, and family stories',
    promptDirection: [
      'colorful 3D storybook animation',
      'Pixar-inspired children’s animation',
      'big expressive eyes',
      'soft rounded faces',
      'playful body proportions',
      'bright cheerful colors',
      'school settings, classrooms, homes, streets, parks, village paths',
      'family-friendly emotional storytelling',
      'clean high-quality 3D render',
    ],
    avoidDirectives: [
      'dark horror lighting',
      'serious realistic adult drama mood',
      'flat 2D cartoon drawing',
    ],
    characterGuidance:
      'Colorful 3D storybook animated characters with big expressive eyes, soft rounded faces, playful friendly proportions, bright cheerful colors, family-friendly demeanor, clean high-quality 3D render.',
    imagePromptGuidance:
      'colorful 3D storybook animation, Pixar-inspired children’s animation, big expressive eyes, soft rounded faces, bright cheerful colors, clean high-quality 3D render',
    videoPromptGuidance:
      'Characters speak directly with natural mouth movement, expressive animated facial reactions, smooth 3D body motion, emotional timing, family-friendly pacing, no narrator, no voiceover.',
    negativePromptAdditions: [
      'dark horror lighting',
      'serious realistic adult drama mood',
      'flat 2D cartoon drawing',
      'grotesque features',
      'distorted limbs',
    ],
  },

  '3D American Animation': {
    id: '3d_american_animation',
    name: '3D American Animation',
    category: '3D Animation',
    shortDescription: 'Pixar-inspired 3D American animated style with suburban homes, city streets, and casual wear',
    promptDirection: [
      '3D American animated style',
      'Pixar-inspired American family animation',
      'white American or diverse American characters depending on user story',
      'suburban homes, schools, offices, cafés, farms, city streets, American neighborhoods',
      'casual American clothing',
      'expressive large eyes',
      'smooth stylized faces',
      'polished family animation look',
      'soft realistic lighting',
    ],
    avoidDirectives: [
      'African cultural clothing unless requested',
      'Nigerian village background unless requested',
      'flat 2D cartoon style',
    ],
    characterGuidance:
      '3D American animated style, Pixar-inspired American family animation, expressive large eyes, smooth stylized faces, casual American clothing, polished family animation look, soft realistic lighting.',
    imagePromptGuidance:
      '3D American animated style, Pixar-inspired American family animation, expressive large eyes, smooth stylized faces, polished family animation look, soft realistic lighting',
    videoPromptGuidance:
      'Characters speak directly with natural mouth movement, expressive animated facial reactions, smooth 3D body motion, emotional timing, polished American family animation acting, no narrator, no voiceover.',
    negativePromptAdditions: [
      'African cultural clothing unless requested',
      'Nigerian village background unless requested',
      'flat 2D cartoon style',
      'low quality 3D',
    ],
  },

  'Animal Character Animation': {
    id: 'animal_character_animation',
    name: 'Animal Character Animation',
    category: 'Character Animation',
    shortDescription: 'Anthropomorphic talking animals wearing clothes, standing upright, acting out human drama',
    promptDirection: [
      'anthropomorphic animal characters',
      'animals with human-like emotions',
      'animals wearing clothes',
      'animals standing upright, walking, talking, arguing, crying, laughing',
      'expressive eyes',
      'clear mouth movement for dialogue',
      'family-friendly 3D animated style',
      'forest, school, village, home, market, office, or fantasy setting depending on story',
    ],
    avoidDirectives: [
      'ordinary animal without clothes',
      'animal walking on all fours when meant to stand upright',
      'missing facial expression',
      'no mouth',
      'no human-like acting',
      'scary monster animal',
    ],
    characterGuidance:
      'Anthropomorphic animal characters (e.g. talking lion king, goat teacher, rabbit student, dog father, cat mother, monkey friend) who behave like drama characters, not normal animals. They must wear full human clothing, stand upright on two legs, have expressive human-like eyes, and have clear mouth movement for dialogue.',
    imagePromptGuidance:
      'anthropomorphic animal character wearing human clothing, standing upright on two feet with expressive human-like eyes and emotional face, clear mouth, family-friendly 3D animated style',
    videoPromptGuidance:
      'Anthropomorphic animal characters walk upright and gesture like humans, speaking directly with clear natural mouth movement synchronized to spoken dialogue lines, expressive animal eyes and ears reacting to drama, smooth animated body motion, no narrator, no voiceover.',
    negativePromptAdditions: [
      'ordinary animal without clothes',
      'animal walking on all fours when meant to stand upright',
      'missing facial expression',
      'no mouth',
      'no human-like acting',
      'scary monster animal',
      'distorted animal anatomy',
    ],
  },

  'Fruit / Object Character Animation': {
    id: 'fruit_object_character_animation',
    name: 'Fruit / Object Character Animation',
    category: 'Character Animation',
    shortDescription: 'Anthropomorphic fruits, vegetables, or objects with faces, arms, legs, and emotions',
    promptDirection: [
      'anthropomorphic fruit/object characters',
      'fruits, vegetables, or objects with expressive eyes, mouth, arms, legs, and emotions',
      'banana character, cucumber character, mango character, orange character, talking chair, walking pencil, crying school bag',
      'colorful family-friendly 3D animation',
      'funny but emotional storytelling',
      'clear facial expressions',
      'natural mouth movement when speaking',
      'playful world',
    ],
    avoidDirectives: [
      'ordinary fruit without face',
      'no eyes',
      'no mouth',
      'no arms',
      'no legs',
      'lifeless object',
      'scary object character',
      'distorted object body',
    ],
    characterGuidance:
      'Anthropomorphic fruit, vegetable, or everyday object designed as a real living character with face, eyes, mouth, arms, legs, emotional expressions, and human-like acting ability (e.g. banana character, cucumber character, mango character, talking chair, walking pencil).',
    imagePromptGuidance:
      'anthropomorphic fruit/object character with expressive eyes, mouth, arms, legs, emotional face, colorful family-friendly 3D animation',
    videoPromptGuidance:
      'Characters speak directly with natural mouth movement, expressive animated facial reactions, smooth 3D body motion, lively fruit/object gestures using arms and legs, emotional timing, no narrator, no voiceover.',
    negativePromptAdditions: [
      'ordinary fruit without face',
      'no eyes',
      'no mouth',
      'no arms',
      'no legs',
      'lifeless object',
      'scary object character',
      'distorted object body',
    ],
  },

  'Kids Toy Animation': {
    id: 'kids_toy_animation',
    name: 'Kids Toy Animation',
    category: 'Character Animation',
    shortDescription: 'Toy-like 3D characters with soft plastic or plush textures for playful moral stories',
    promptDirection: [
      'toy-like 3D animated characters',
      'soft plastic or plush texture',
      'bright colors',
      'rounded shapes',
      'playful emotional storytelling',
      'children’s room, school, playground, toy village, colorful fantasy world',
      'cute facial expressions',
      'family-friendly look',
    ],
    avoidDirectives: [
      'scary toy horror',
      'realistic human drama',
      'dark lighting',
    ],
    characterGuidance:
      'Toy-like 3D animated characters with soft plastic or plush textures, bright cheerful colors, rounded friendly shapes, cute facial expressions, and family-friendly appeal.',
    imagePromptGuidance:
      'toy-like 3D animated characters, soft plastic or plush texture, rounded shapes, bright cheerful colors, cute facial expressions, clean family-friendly 3D render',
    videoPromptGuidance:
      'Toy characters speak directly with natural mouth movement, expressive toy-like facial reactions, smooth playful body motion, emotional timing, no narrator, no voiceover.',
    negativePromptAdditions: [
      'scary toy horror',
      'creepy doll',
      'realistic human drama',
      'dark lighting',
      'distorted toy limbs',
    ],
  },

  'Fantasy African Folktale': {
    id: 'fantasy_african_folktale',
    name: 'Fantasy African Folktale',
    category: 'Illustrated & Folktale',
    shortDescription: 'Magical African folklore with glowing forests, royal kingdoms, spirits, and mystical legends',
    promptDirection: [
      'fantasy African folktale style',
      'magical village atmosphere',
      'glowing forests',
      'royal African kingdoms',
      'traditional rulers',
      'enchanted objects',
      'moonlight, firelight, mist, glowing symbols',
      'cinematic fantasy lighting',
      'traditional African costumes and settings when suitable',
    ],
    avoidDirectives: [
      'modern office background unless story requires it',
      'comedy cartoon mood unless requested',
    ],
    characterGuidance:
      'Fantasy African folktale characters (traditional African kings, queens, priestesses, spirits, villagers, enchanted elders) adorned in majestic royal beadwork, traditional woven regalia, sacred markings, or mystical glowing amulets.',
    imagePromptGuidance:
      'fantasy African folktale style, magical village atmosphere, glowing mystical lighting, royal African traditional costumes, enchanted ambiance, cinematic fantasy render',
    videoPromptGuidance:
      'Characters speak directly with royal dramatic gravitas and natural mouth movement, mystical lighting shifting with emotional moments, glowing magical elements, intense dramatic timing, no narrator, no voiceover.',
    negativePromptAdditions: [
      'modern office background',
      'comedy cartoon mood',
      'Western medieval fantasy armor',
      'distorted hands',
    ],
  },

  'Drawn African Storybook Style': {
    id: 'drawn_african_storybook',
    name: 'Drawn African Storybook Style',
    category: 'Illustrated & Folktale',
    shortDescription: '2D hand-drawn illustrated African folktale art with warm painted textures and sunlight',
    promptDirection: [
      'hand-drawn African storybook illustration',
      'warm painted textures',
      'expressive 2D characters',
      'African village settings',
      'traditional clothing',
      'colorful hand-painted backgrounds',
      'moral story feeling',
      'soft illustrated sunlight',
    ],
    avoidDirectives: [
      '3D render',
      'realistic photography',
      'anime style',
    ],
    characterGuidance:
      'Hand-drawn African storybook illustrated characters with warm painted textures, expressive 2D faces, traditional African fabrics and beads, and a warm moral storybook feeling.',
    imagePromptGuidance:
      'hand-drawn African storybook illustration, warm painted textures, expressive 2D characters, colorful hand-painted background, soft illustrated sunlight',
    videoPromptGuidance:
      '2D hand-drawn illustrated animation, characters speak directly with natural drawn mouth movement, expressive painted facial reactions, gentle animated motion, moral story pacing, no narrator, no voiceover.',
    negativePromptAdditions: [
      '3D render',
      'realistic photography',
      'anime style',
      'computer CGI',
      'plastic textures',
    ],
  },

  'Anime-inspired African Style': {
    id: 'anime_inspired_african',
    name: 'Anime-inspired African Style',
    category: 'Illustrated & Folktale',
    shortDescription: 'Anime-style African drama with expressive eyes, dramatic hair, African fashion, and action framing',
    promptDirection: [
      'anime-inspired African characters',
      'expressive anime eyes',
      'African fashion and backgrounds',
      'dramatic hair and facial expressions',
      'cinematic anime lighting',
      'emotional close-ups',
      'clean line art with rich shading',
      'action-style framing when needed',
    ],
    avoidDirectives: [
      'realistic photography',
      'low-detail cartoon',
      'Western comic book style unless requested',
    ],
    characterGuidance:
      'Anime-inspired African characters with expressive large anime eyes, styled dramatic African hair (locs, afro, braided patterns), vibrant modern or traditional African clothing, and clean anime line art with rich cell shading.',
    imagePromptGuidance:
      'anime-inspired African style, expressive anime eyes, dramatic hair, African fashion and patterns, cinematic anime lighting, clean line art with rich shading',
    videoPromptGuidance:
      'Anime-style characters speak directly with natural stylized mouth movement, dramatic anime emotional eye and facial reactions, sharp cinematic camera cuts, emotional timing, no narrator, no voiceover.',
    negativePromptAdditions: [
      'realistic photography',
      'low-detail cartoon',
      'Western comic book style',
      'blurry outlines',
    ],
  },
};

/**
 * Ordered list of all visual style options to appear in dropdowns:
 * Starts with existing styles, followed by the 9 new visual styles.
 */
export const VISUAL_STYLE_OPTIONS: string[] = [
  // Existing Styles
  'Cinematic Nollywood Style',
  'Realistic AI',
  '3D Animation',
  'Cartoon',
  'Drawn African Style',
  // New Styles
  '3D African Animation',
  '3D Storybook Animation',
  '3D American Animation',
  'Animal Character Animation',
  'Fruit / Object Character Animation',
  'Kids Toy Animation',
  'Fantasy African Folktale',
  'Drawn African Storybook Style',
  'Anime-inspired African Style',
];

/**
 * Normalizes visual style strings to find match even if case or suffix varies
 */
export function getNormalizedStyleKey(styleName?: string): string {
  if (!styleName) return 'Cinematic Nollywood Style';
  const trimmed = styleName.trim();

  if (VISUAL_STYLE_DEFINITIONS[trimmed]) {
    return trimmed;
  }

  const lower = trimmed.toLowerCase();
  if (lower.includes('nollywood') || lower.includes('cinematic nollywood realistic')) {
    return 'Cinematic Nollywood Style';
  }
  if (lower.includes('3d african')) return '3D African Animation';
  if (lower.includes('3d storybook') || lower.includes('storybook')) return '3D Storybook Animation';
  if (lower.includes('3d american') || lower.includes('american animation')) return '3D American Animation';
  if (lower.includes('animal character') || lower.includes('animal animation')) return 'Animal Character Animation';
  if (lower.includes('fruit') || lower.includes('object character')) return 'Fruit / Object Character Animation';
  if (lower.includes('kids toy') || lower.includes('toy animation')) return 'Kids Toy Animation';
  if (lower.includes('fantasy') || lower.includes('folktale')) return 'Fantasy African Folktale';
  if (lower.includes('drawn african storybook') || lower.includes('african storybook')) return 'Drawn African Storybook Style';
  if (lower.includes('anime')) return 'Anime-inspired African Style';
  if (lower.includes('drawn african')) return 'Drawn African Style';
  if (lower.includes('realistic')) return 'Realistic AI';
  if (lower.includes('3d animation')) return '3D Animation';
  if (lower.includes('cartoon')) return 'Cartoon';

  return 'Cinematic Nollywood Style';
}

/**
 * Returns the VisualStyleDefinition for any given style string
 */
export function getVisualStyleDefinition(styleName?: string): VisualStyleDefinition {
  const key = getNormalizedStyleKey(styleName);
  return VISUAL_STYLE_DEFINITIONS[key] || VISUAL_STYLE_DEFINITIONS['Cinematic Nollywood Style'];
}

/**
 * Returns short UI helper description for dropdown display
 */
export function getVisualStyleHelper(styleName?: string): string {
  const def = getVisualStyleDefinition(styleName);
  return def.shortDescription;
}
