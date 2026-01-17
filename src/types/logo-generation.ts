/**
 * Logo Generation Types - AI-powered logo generation using DALL-E 3
 */

// ============================================================
// LOGO STYLES (MOOD - Basic Mode)
// ============================================================

export type LogoStyle =
  | 'minimalist'
  | 'modern'
  | 'vintage'
  | 'playful'
  | 'corporate'
  | 'tech'
  | 'elegant'
  | 'bold';

export const LOGO_STYLES: Record<LogoStyle, { label: string; description: string; promptModifier: string }> = {
  minimalist: {
    label: 'Minimalist',
    description: 'Clean, simple, essential elements only',
    promptModifier: 'minimalist, clean lines, simple, flat design, limited colors',
  },
  modern: {
    label: 'Modern',
    description: 'Contemporary and sleek',
    promptModifier: 'modern, sleek, contemporary, geometric shapes, trendy',
  },
  vintage: {
    label: 'Vintage',
    description: 'Retro and timeless feel',
    promptModifier: 'vintage, retro, classic, hand-drawn feel, nostalgic',
  },
  playful: {
    label: 'Playful',
    description: 'Fun and approachable',
    promptModifier: 'playful, fun, friendly, colorful, approachable',
  },
  corporate: {
    label: 'Corporate',
    description: 'Professional and trustworthy',
    promptModifier: 'corporate, professional, trustworthy, business-like, sophisticated',
  },
  tech: {
    label: 'Tech',
    description: 'Digital and innovative',
    promptModifier: 'tech, digital, futuristic, innovative, cutting-edge',
  },
  elegant: {
    label: 'Elegant',
    description: 'Sophisticated and refined',
    promptModifier: 'elegant, sophisticated, refined, luxurious, premium',
  },
  bold: {
    label: 'Bold',
    description: 'Strong and impactful',
    promptModifier: 'bold, strong, impactful, striking, dynamic',
  },
};

// ============================================================
// ADVANCED MODE TYPES
// ============================================================

export type PaletteType = 'monochrome' | 'complementary' | 'analogous' | 'triadic' | 'vibrant' | 'pastel' | 'custom';
export type CompositionType = 'icon_only' | 'wordmark_only' | 'icon_and_text' | 'emblem' | 'lettermark';
export type ShapeType = 'freeform' | 'circular' | 'square' | 'geometric' | 'organic';
export type BackgroundType = 'white' | 'transparent' | 'colored' | 'gradient';
export type IconStyle = 'abstract' | 'literal' | 'mascot' | 'lettermark' | 'geometric';
export type TypographyStyle = 'sans_serif' | 'serif' | 'script' | 'display' | 'monospace';
export type DetailLevel = 1 | 2 | 3 | 4 | 5;
export type GeneratorMode = 'basic' | 'advanced';

// ============================================================
// ARTIST INFLUENCE - Creative Direction (Primary Advanced Control)
// ============================================================

export type ArtistInfluence =
  | 'paul_rand'
  | 'saul_bass'
  | 'massimo_vignelli'
  | 'japanese_minimal'
  | 'swiss_modernist'
  | 'contemporary_tech'
  | 'paula_scher'
  | 'milton_glaser'
  | 'none';

export interface ArtistInfluenceMetadata {
  readonly label: string;
  readonly subtitle: string;
  readonly description: string;
  readonly philosophy: string;
  readonly promptModifier: string;
  readonly examples?: readonly string[];
}

/**
 * Artist influences with opinionated creative direction.
 * These are PHILOSOPHIES, not attribute lists.
 */
export const ARTIST_INFLUENCES: Record<ArtistInfluence, ArtistInfluenceMetadata> = {
  paul_rand: {
    label: 'Paul Rand',
    subtitle: 'Clever simplicity',
    description: 'IBM, ABC, NeXT. One witty idea, geometric playfulness.',
    philosophy: 'Reduce to a single clever concept. If you can\'t explain it to a child, simplify more.',
    promptModifier: 'Paul Rand style. ONE clever visual concept only. Bold geometric shapes. Must be drawable in 5 seconds. Nothing decorative. Nothing trendy. Maximum restraint. If in doubt remove it',
    examples: ['IBM', 'ABC', 'UPS', 'NeXT'],
  },
  saul_bass: {
    label: 'Saul Bass',
    subtitle: 'Bold symbolism',
    description: 'AT&T, United Airlines. Dramatic negative space, essential gesture.',
    philosophy: 'Find the one symbolic gesture that tells the whole story. Silence is powerful.',
    promptModifier: 'Saul Bass style. ONE symbolic gesture only. Extreme negative space. Must work as pure silhouette. Black and white thinking. Cinematic boldness. Nothing extra. Strip to essence',
    examples: ['AT&T', 'United Airlines', 'Minolta'],
  },
  massimo_vignelli: {
    label: 'Massimo Vignelli',
    subtitle: 'Timeless structure',
    description: 'NYC Subway, American Airlines. Grid precision, architectural elegance.',
    philosophy: 'Design is not style. It is structure. Remove until only the essential remains.',
    promptModifier: 'Massimo Vignelli style. Grid-based structure only. Mathematical precision. Helvetica clarity. Zero decoration. Zero ornamentation. Timeless not fashionable. Structure is the design',
    examples: ['NYC Subway', 'American Airlines', 'Knoll'],
  },
  japanese_minimal: {
    label: 'Japanese Minimal',
    subtitle: 'Ma (negative space)',
    description: 'Muji, Kenya Hara. Emptiness as meaning, quiet confidence.',
    philosophy: 'What you remove is more important than what you add. Emptiness creates meaning.',
    promptModifier: 'Kenya Hara and Muji aesthetic. Extreme emptiness. Whitespace is the design. Less than minimum. Quiet. Subtle. Nothing that demands attention. Meditative restraint. Remove more',
    examples: ['Muji', 'Uniqlo'],
  },
  swiss_modernist: {
    label: 'Swiss Modernist',
    subtitle: 'Rational clarity',
    description: 'International Style. Mathematical grids, objective design.',
    philosophy: 'Design should be universal, clear, and objective. The grid is truth.',
    promptModifier: 'Swiss International Style. Mathematical grid. Objective not expressive. Clean sans-serif only. High contrast. Zero ornamentation. Systematic. Rational. Universal',
    examples: ['Swiss Railways', 'Lufthansa'],
  },
  contemporary_tech: {
    label: 'Contemporary Tech',
    subtitle: 'Premium minimal',
    description: 'Stripe, Linear, Vercel. Refined geometry, sophisticated restraint.',
    philosophy: 'Modern premium aesthetics. Subtle, refined, quietly confident.',
    promptModifier: 'Stripe Linear Vercel aesthetic. Refined geometry. Premium restraint. Not flashy. Quietly confident. Clean lines. Purposeful negative space. Modern professional. Dark mode compatible',
    examples: ['Stripe', 'Linear', 'Vercel', 'Notion'],
  },
  paula_scher: {
    label: 'Paula Scher',
    subtitle: 'Expressive typography',
    description: 'Citibank, Public Theater. Bold type as art, controlled energy.',
    philosophy: 'Type can be expressive and architectural. Break rules purposefully.',
    promptModifier: 'Paula Scher style. Typography as architecture. Bold letterforms. Confident scale. Type is the entire design. Controlled energy. One typeface maximum. No illustration needed',
    examples: ['Citibank', 'Public Theater', 'Microsoft Windows 8'],
  },
  milton_glaser: {
    label: 'Milton Glaser',
    subtitle: 'Iconic concepts',
    description: 'I ❤ NY. Unexpected simplicity, warmth and humanity.',
    philosophy: 'Find the unexpected combination that becomes instantly iconic.',
    promptModifier: 'Milton Glaser style. ONE unexpected visual combination. Instant recognition. Warmth not coldness. Could become cultural icon. Simple enough for a t-shirt. Memorable in one glance',
    examples: ['I ❤ NY', 'Brooklyn Brewery'],
  },
  none: {
    label: 'No Influence',
    subtitle: 'Use other controls',
    description: 'Skip artist direction, use granular controls instead.',
    philosophy: '',
    promptModifier: '',
  },
};

export interface AdvancedColorSettings {
  readonly paletteType: PaletteType;
  readonly primaryColor: string | null;
  readonly secondaryColor: string | null;
}

export interface AdvancedLogoSettings {
  readonly artistInfluence: ArtistInfluence;
  readonly colors: AdvancedColorSettings;
  readonly composition: CompositionType;
  readonly shape: ShapeType;
  readonly background: BackgroundType;
  readonly detailLevel: DetailLevel;
  readonly iconStyle: IconStyle;
  readonly typography: TypographyStyle;
  readonly mood: LogoStyle;
}

// ============================================================
// ADVANCED MODE METADATA
// ============================================================

export const PALETTE_TYPES: Record<PaletteType, { label: string; description: string; promptModifier: string }> = {
  monochrome: {
    label: 'Monochrome',
    description: 'Single color with shades',
    promptModifier: 'monochromatic color scheme, single hue with tints and shades',
  },
  complementary: {
    label: 'Complementary',
    description: 'Two opposite colors',
    promptModifier: 'complementary colors, high contrast color pairing',
  },
  analogous: {
    label: 'Analogous',
    description: 'Adjacent colors on wheel',
    promptModifier: 'analogous colors, harmonious adjacent hues',
  },
  triadic: {
    label: 'Triadic',
    description: 'Three evenly spaced colors',
    promptModifier: 'triadic color scheme, three balanced colors',
  },
  vibrant: {
    label: 'Vibrant',
    description: 'Bold, saturated colors',
    promptModifier: 'vibrant saturated colors, bold bright hues',
  },
  pastel: {
    label: 'Pastel',
    description: 'Soft, muted tones',
    promptModifier: 'pastel colors, soft muted tones, gentle hues',
  },
  custom: {
    label: 'Custom',
    description: 'Specify exact colors',
    promptModifier: '', // Colors will be added dynamically
  },
};

export const COMPOSITION_TYPES: Record<CompositionType, { label: string; description: string; promptModifier: string }> = {
  icon_only: {
    label: 'Icon Only',
    description: 'Symbol without text',
    promptModifier: 'icon only, symbol mark, no text, standalone graphic',
  },
  wordmark_only: {
    label: 'Wordmark',
    description: 'Text-based logo',
    promptModifier: 'wordmark logo, text-based, typographic logo, company name as logo',
  },
  icon_and_text: {
    label: 'Icon + Text',
    description: 'Symbol with company name',
    promptModifier: 'combination mark, icon with text, symbol and wordmark together',
  },
  emblem: {
    label: 'Emblem',
    description: 'Text inside symbol',
    promptModifier: 'emblem logo, badge style, text enclosed in symbol, crest design',
  },
  lettermark: {
    label: 'Lettermark',
    description: 'Initials or monogram',
    promptModifier: 'lettermark logo, monogram, initials-based design',
  },
};

export const SHAPE_TYPES: Record<ShapeType, { label: string; description: string; promptModifier: string }> = {
  freeform: {
    label: 'Freeform',
    description: 'No shape constraint',
    promptModifier: '',
  },
  circular: {
    label: 'Circular',
    description: 'Round or oval shape',
    promptModifier: 'circular design, round shape, contained in circle',
  },
  square: {
    label: 'Square',
    description: 'Square or rectangular',
    promptModifier: 'square design, rectangular shape, boxy proportions',
  },
  geometric: {
    label: 'Geometric',
    description: 'Angular, polygon-based',
    promptModifier: 'geometric shapes, angular design, polygon-based',
  },
  organic: {
    label: 'Organic',
    description: 'Natural, flowing curves',
    promptModifier: 'organic shapes, natural curves, fluid flowing lines',
  },
};

export const BACKGROUND_TYPES: Record<BackgroundType, { label: string; description: string; promptModifier: string }> = {
  white: {
    label: 'White',
    description: 'Clean white background',
    promptModifier: 'pure white background, clean backdrop',
  },
  transparent: {
    label: 'Transparent',
    description: 'No background',
    promptModifier: 'transparent background, isolated on white, no background elements',
  },
  colored: {
    label: 'Colored',
    description: 'Solid color background',
    promptModifier: 'solid colored background',
  },
  gradient: {
    label: 'Gradient',
    description: 'Gradient background',
    promptModifier: 'subtle gradient background',
  },
};

export const ICON_STYLES: Record<IconStyle, { label: string; description: string; promptModifier: string }> = {
  abstract: {
    label: 'Abstract',
    description: 'Non-representational shapes',
    promptModifier: 'abstract icon, non-representational shapes, conceptual design',
  },
  literal: {
    label: 'Literal',
    description: 'Recognizable imagery',
    promptModifier: 'literal representation, recognizable imagery, clear symbolism',
  },
  mascot: {
    label: 'Mascot',
    description: 'Character-based',
    promptModifier: 'mascot character, illustrated character, friendly persona',
  },
  lettermark: {
    label: 'Lettermark',
    description: 'Letter-based icon',
    promptModifier: 'lettermark icon, stylized letter, typographic icon',
  },
  geometric: {
    label: 'Geometric',
    description: 'Simple shapes',
    promptModifier: 'geometric icon, simple shapes, mathematical precision',
  },
};

export const TYPOGRAPHY_STYLES: Record<TypographyStyle, { label: string; description: string; promptModifier: string }> = {
  sans_serif: {
    label: 'Sans Serif',
    description: 'Clean, modern fonts',
    promptModifier: 'sans-serif typography, clean modern font, no serifs',
  },
  serif: {
    label: 'Serif',
    description: 'Classic, traditional fonts',
    promptModifier: 'serif typography, classic traditional font, elegant serifs',
  },
  script: {
    label: 'Script',
    description: 'Handwritten, cursive',
    promptModifier: 'script typography, handwritten style, cursive lettering',
  },
  display: {
    label: 'Display',
    description: 'Decorative, unique fonts',
    promptModifier: 'display typography, decorative unique font, attention-grabbing',
  },
  monospace: {
    label: 'Monospace',
    description: 'Fixed-width, tech feel',
    promptModifier: 'monospace typography, fixed-width font, technical aesthetic',
  },
};

export const DETAIL_LEVELS: Record<DetailLevel, { label: string; description: string; promptModifier: string }> = {
  1: {
    label: '1',
    description: 'Ultra simple',
    promptModifier: 'ultra simple, minimal elements, extremely clean',
  },
  2: {
    label: '2',
    description: 'Simple',
    promptModifier: 'simple design, few elements, clean look',
  },
  3: {
    label: '3',
    description: 'Balanced',
    promptModifier: 'balanced detail, moderate complexity',
  },
  4: {
    label: '4',
    description: 'Detailed',
    promptModifier: 'detailed design, multiple elements, rich complexity',
  },
  5: {
    label: '5',
    description: 'Intricate',
    promptModifier: 'intricate details, highly detailed, complex design',
  },
};

// ============================================================
// DEFAULT ADVANCED SETTINGS
// ============================================================

export const DEFAULT_ADVANCED_SETTINGS: AdvancedLogoSettings = {
  artistInfluence: 'paul_rand',
  colors: {
    paletteType: 'monochrome',
    primaryColor: null,
    secondaryColor: null,
  },
  composition: 'icon_only',
  shape: 'freeform',
  background: 'white',
  detailLevel: 2,
  iconStyle: 'geometric',
  typography: 'sans_serif',
  mood: 'minimalist',
};

// ============================================================
// GENERATION REQUEST/RESPONSE
// ============================================================

export interface GenerateLogoRequest {
  readonly prompt: string;
  readonly style?: LogoStyle;
  readonly mode?: GeneratorMode;
  readonly advancedSettings?: AdvancedLogoSettings;
}

export interface LogoVariation {
  readonly id: string;
  readonly temporaryUrl: string;
  readonly index: number;
}

export interface GenerateLogoResponse {
  readonly success: true;
  readonly variations: readonly LogoVariation[];
  readonly meta: {
    readonly model: string;
    readonly promptUsed: string;
    readonly durationMs: number;
  };
}

export interface GenerateLogoErrorResponse {
  readonly success: false;
  readonly error: string;
  readonly code?: 'no_api_key' | 'rate_limit' | 'content_policy' | 'api_error' | 'invalid_request';
}

// ============================================================
// SAVE REQUEST/RESPONSE
// ============================================================

export interface SaveLogoRequest {
  readonly variationId: string;
  readonly temporaryUrl: string;
}

export interface SaveLogoResponse {
  readonly success: true;
  readonly image: {
    readonly id: string;
    readonly original_url: string;
    readonly filename: string;
    readonly status: string;
  };
}

export interface SaveLogoErrorResponse {
  readonly success: false;
  readonly error: string;
}

// ============================================================
// UI STATE
// ============================================================

export type GenerationStatus = 'idle' | 'generating' | 'selecting' | 'saving' | 'error';

export interface LogoGenerationState {
  status: GenerationStatus;
  prompt: string;
  style: LogoStyle;
  mode: GeneratorMode;
  advancedSettings: AdvancedLogoSettings;
  variations: LogoVariation[];
  selectedVariation: LogoVariation | null;
  error: string | null;
}

// ============================================================
// PROMPT ENGINEERING - Constraints-First Approach
// ============================================================

/**
 * NEGATIVE CONSTRAINTS - What DALL-E must NOT include.
 * These are critical for restraint and professional output.
 */
const NEGATIVE_CONSTRAINTS = [
  'absolutely no gradients',
  'no 3D effects',
  'no shadows or drop shadows',
  'no bevels or embossing',
  'no photorealistic elements',
  'no busy backgrounds',
  'no multiple concepts competing',
  'no decorative flourishes',
  'no unnecessary details',
  'no clipart aesthetic',
  'nothing that cannot be drawn in 10 seconds',
] as const;

/**
 * STRUCTURE CONSTRAINTS - Layout and composition rules.
 */
const STRUCTURE_CONSTRAINTS = [
  'single focal point only',
  'mathematically centered',
  'works at 16x16 pixels',
  'works in pure black on white',
  'scalable to any size',
] as const;

/**
 * Enhances a user's prompt with logo-specific context for better DALL-E results
 * Supports both basic mode (style only) and advanced mode (granular controls)
 */
export function enhancePrompt(
  userPrompt: string,
  style?: LogoStyle,
  advancedSettings?: AdvancedLogoSettings
): string {
  // If advanced settings provided, use advanced prompt building
  if (advancedSettings) {
    return buildAdvancedPrompt(userPrompt, advancedSettings);
  }

  // Basic mode: use constraints-first approach
  const constraints = [
    'CONSTRAINTS:',
    ...NEGATIVE_CONSTRAINTS.slice(0, 5),
    ...STRUCTURE_CONSTRAINTS.slice(0, 3),
  ].join(' ');

  const styleModifier = style ? LOGO_STYLES[style].promptModifier : 'clean and professional';

  return `${constraints}. Professional logo, ${styleModifier}, pure white background, flat vector style: ${userPrompt}. Single mark, centered.`;
}

/**
 * Builds an advanced prompt from granular settings.
 * Artist influence is PRIMARY - it drives the aesthetic philosophy.
 * Other settings are secondary modifiers.
 */
function buildAdvancedPrompt(userPrompt: string, settings: AdvancedLogoSettings): string {
  const artistInfluence = ARTIST_INFLUENCES[settings.artistInfluence];

  // If artist influence is selected, it drives the prompt
  if (settings.artistInfluence !== 'none' && artistInfluence.promptModifier) {
    return buildArtistDrivenPrompt(userPrompt, settings, artistInfluence);
  }

  // No artist influence - use granular controls (original behavior)
  return buildGranularPrompt(userPrompt, settings);
}

/**
 * Builds a prompt driven by artist influence.
 *
 * PROMPT STRUCTURE (order matters):
 * 1. Hard constraints (what NOT to do) - FIRST
 * 2. Structure requirements (composition rules)
 * 3. Artist philosophy (creative direction)
 * 4. User's concept
 * 5. Technical specs
 */
function buildArtistDrivenPrompt(
  userPrompt: string,
  settings: AdvancedLogoSettings,
  artistInfluence: ArtistInfluenceMetadata
): string {
  const promptParts: string[] = [];

  // 1. HARD CONSTRAINTS - What must NOT be included (FIRST)
  promptParts.push('STRICT REQUIREMENTS:');
  promptParts.push(NEGATIVE_CONSTRAINTS.join(', '));

  // 2. STRUCTURE CONSTRAINTS - Composition rules
  promptParts.push('STRUCTURE:');
  promptParts.push(STRUCTURE_CONSTRAINTS.join(', '));

  // 3. ARTIST PHILOSOPHY - Creative direction (primary driver)
  promptParts.push('STYLE DIRECTION:');
  promptParts.push(artistInfluence.promptModifier);

  // 4. USER CONCEPT - What they actually want
  promptParts.push('CONCEPT:');
  promptParts.push(userPrompt);

  // 5. COMPOSITION TYPE - Only if not default icon_only
  if (settings.composition !== 'icon_only') {
    const compMod = COMPOSITION_TYPES[settings.composition].promptModifier;
    if (compMod) {
      promptParts.push(`LAYOUT: ${compMod}`);
    }
  }

  // 6. COLOR ENFORCEMENT - Only for custom colors with hex codes
  if (settings.colors.paletteType === 'custom') {
    const colorMod = buildColorModifier(settings.colors);
    if (colorMod) {
      promptParts.push(`COLORS: ${colorMod}, no other colors allowed`);
    }
  }

  // 7. TECHNICAL SPECS - Final requirements
  promptParts.push('OUTPUT: flat vector logo, pure white background, single centered mark, no texture, no noise');

  return promptParts.join('. ');
}

/**
 * Builds a prompt from granular controls (when no artist is selected).
 * Uses same constraints-first structure for consistency.
 */
function buildGranularPrompt(userPrompt: string, settings: AdvancedLogoSettings): string {
  const promptParts: string[] = [];

  // 1. HARD CONSTRAINTS - What must NOT be included (FIRST)
  promptParts.push('STRICT REQUIREMENTS:');
  promptParts.push(NEGATIVE_CONSTRAINTS.join(', '));

  // 2. STRUCTURE CONSTRAINTS
  promptParts.push('STRUCTURE:');
  promptParts.push(STRUCTURE_CONSTRAINTS.join(', '));

  // 3. STYLE ATTRIBUTES - Granular controls
  const styleAttrs: string[] = [];

  // Composition
  styleAttrs.push(COMPOSITION_TYPES[settings.composition].promptModifier);

  // Mood/style
  styleAttrs.push(LOGO_STYLES[settings.mood].promptModifier);

  // Shape if not freeform
  const shapeMod = SHAPE_TYPES[settings.shape].promptModifier;
  if (shapeMod) {
    styleAttrs.push(shapeMod);
  }

  // Icon style (only if composition includes an icon)
  if (settings.composition !== 'wordmark_only') {
    styleAttrs.push(ICON_STYLES[settings.iconStyle].promptModifier);
  }

  // Typography (only if composition includes text)
  if (settings.composition !== 'icon_only') {
    styleAttrs.push(TYPOGRAPHY_STYLES[settings.typography].promptModifier);
  }

  // Detail level
  styleAttrs.push(DETAIL_LEVELS[settings.detailLevel].promptModifier);

  promptParts.push('STYLE: ' + styleAttrs.filter(Boolean).join(', '));

  // 4. USER CONCEPT
  promptParts.push('CONCEPT: ' + userPrompt);

  // 5. COLOR ENFORCEMENT
  const colorModifier = buildColorModifier(settings.colors);
  if (colorModifier) {
    promptParts.push(`COLORS: ${colorModifier}`);
  }

  // 6. BACKGROUND
  const backgroundMod = BACKGROUND_TYPES[settings.background].promptModifier;
  if (backgroundMod) {
    promptParts.push('BACKGROUND: ' + backgroundMod);
  } else {
    promptParts.push('BACKGROUND: pure white');
  }

  // 7. TECHNICAL SPECS
  promptParts.push('OUTPUT: flat vector logo, single centered mark, no texture');

  return promptParts.join('. ');
}

/**
 * Builds color-specific prompt modifier
 */
function buildColorModifier(colors: AdvancedColorSettings): string {
  const { paletteType, primaryColor, secondaryColor } = colors;

  // For custom palette, include specific colors
  if (paletteType === 'custom') {
    const colorParts: string[] = [];
    if (primaryColor) {
      colorParts.push(`primary color ${primaryColor}`);
    }
    if (secondaryColor) {
      colorParts.push(`secondary color ${secondaryColor}`);
    }
    if (colorParts.length > 0) {
      return `using ${colorParts.join(' and ')}`;
    }
    return '';
  }

  // For predefined palettes, use the modifier
  return PALETTE_TYPES[paletteType].promptModifier;
}

/**
 * Preview the enhanced prompt (for UI display)
 */
export function previewEnhancedPrompt(
  userPrompt: string,
  mode: GeneratorMode,
  style: LogoStyle,
  advancedSettings: AdvancedLogoSettings
): string {
  if (mode === 'advanced') {
    return buildAdvancedPrompt(userPrompt || '[your description]', advancedSettings);
  }
  return enhancePrompt(userPrompt || '[your description]', style);
}
