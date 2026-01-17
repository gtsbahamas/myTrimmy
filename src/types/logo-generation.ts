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

export interface AdvancedColorSettings {
  readonly paletteType: PaletteType;
  readonly primaryColor: string | null;
  readonly secondaryColor: string | null;
}

export interface AdvancedLogoSettings {
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
  colors: {
    paletteType: 'monochrome',
    primaryColor: null,
    secondaryColor: null,
  },
  composition: 'icon_only',
  shape: 'freeform',
  background: 'white',
  detailLevel: 3,
  iconStyle: 'abstract',
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
// PROMPT ENHANCEMENT
// ============================================================

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

  // Basic mode: use simple style-based enhancement
  const basePrefix = 'Professional logo design on a pure white background, single icon or wordmark,';
  const baseSuffix = 'vector-style, high contrast, no text unless specified, centered composition, suitable for app icon';

  const styleModifier = style ? LOGO_STYLES[style].promptModifier : 'clean and professional';

  return `${basePrefix} ${styleModifier}: ${userPrompt}. ${baseSuffix}`;
}

/**
 * Builds an advanced prompt from granular settings
 */
function buildAdvancedPrompt(userPrompt: string, settings: AdvancedLogoSettings): string {
  const parts: string[] = [];

  // Start with composition type
  parts.push(COMPOSITION_TYPES[settings.composition].promptModifier);

  // Add background context
  const backgroundMod = BACKGROUND_TYPES[settings.background].promptModifier;
  if (backgroundMod) {
    parts.push(backgroundMod);
  }

  // Add mood/style
  parts.push(LOGO_STYLES[settings.mood].promptModifier);

  // Add shape if not freeform
  const shapeMod = SHAPE_TYPES[settings.shape].promptModifier;
  if (shapeMod) {
    parts.push(shapeMod);
  }

  // Add icon style (only if composition includes an icon)
  if (settings.composition !== 'wordmark_only') {
    parts.push(ICON_STYLES[settings.iconStyle].promptModifier);
  }

  // Add typography (only if composition includes text)
  if (settings.composition !== 'icon_only') {
    parts.push(TYPOGRAPHY_STYLES[settings.typography].promptModifier);
  }

  // Add detail level
  parts.push(DETAIL_LEVELS[settings.detailLevel].promptModifier);

  // Add color settings
  const colorModifier = buildColorModifier(settings.colors);
  if (colorModifier) {
    parts.push(colorModifier);
  }

  // Combine all modifiers
  const modifiers = parts.filter(Boolean).join(', ');

  // Build final prompt
  const prefix = 'Professional logo design,';
  const suffix = 'vector-style, high contrast, centered composition, suitable for app icon';

  return `${prefix} ${modifiers}: ${userPrompt}. ${suffix}`;
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
