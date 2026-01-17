/**
 * Logo Generation Types - AI-powered logo generation using DALL-E 3
 */

// ============================================================
// LOGO STYLES
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
// GENERATION REQUEST/RESPONSE
// ============================================================

export interface GenerateLogoRequest {
  readonly prompt: string;
  readonly style?: LogoStyle;
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
  variations: LogoVariation[];
  selectedVariation: LogoVariation | null;
  error: string | null;
}

// ============================================================
// PROMPT ENHANCEMENT
// ============================================================

/**
 * Enhances a user's prompt with logo-specific context for better DALL-E results
 */
export function enhancePrompt(userPrompt: string, style?: LogoStyle): string {
  const basePrefix = 'Professional logo design on a pure white background, single icon or wordmark,';
  const baseSuffix = 'vector-style, high contrast, no text unless specified, centered composition, suitable for app icon';

  const styleModifier = style ? LOGO_STYLES[style].promptModifier : 'clean and professional';

  return `${basePrefix} ${styleModifier}: ${userPrompt}. ${baseSuffix}`;
}
