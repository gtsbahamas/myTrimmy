/**
 * Asset Bundle Types
 *
 * Domain types for the App Asset Bundle Generator feature.
 * Generates favicon, app icon, PWA, and social media assets from a source logo.
 */

/** Supported asset categories */
export type AssetCategory =
  | 'favicon'
  | 'apple'
  | 'android'
  | 'social'
  | 'microsoft';

/** Output format for generated assets */
export type AssetFormat = 'png' | 'ico' | 'jpg';

/** Individual asset specification */
export interface AssetSpec {
  readonly filename: string;
  readonly width: number;
  readonly height: number;
  readonly format: AssetFormat;
  readonly category: AssetCategory;
  /** Whether this is a maskable icon (needs safe zone padding) */
  readonly maskable?: boolean;
  /** Quality for lossy formats (1-100) */
  readonly quality?: number;
}

/**
 * Complete specification of all assets to generate.
 * 15 image files covering all major platforms.
 */
export const ASSET_BUNDLE_SPEC: readonly AssetSpec[] = [
  // Favicons (browser tabs, bookmarks)
  { filename: 'favicon.ico', width: 48, height: 48, format: 'ico', category: 'favicon' },
  { filename: 'favicon-16x16.png', width: 16, height: 16, format: 'png', category: 'favicon' },
  { filename: 'favicon-32x32.png', width: 32, height: 32, format: 'png', category: 'favicon' },
  { filename: 'favicon-48x48.png', width: 48, height: 48, format: 'png', category: 'favicon' },

  // Apple Touch Icons (iOS home screen)
  { filename: 'apple-touch-icon.png', width: 180, height: 180, format: 'png', category: 'apple' },
  { filename: 'apple-touch-icon-152x152.png', width: 152, height: 152, format: 'png', category: 'apple' },
  { filename: 'apple-touch-icon-120x120.png', width: 120, height: 120, format: 'png', category: 'apple' },

  // Android/PWA Icons
  { filename: 'icon-192x192.png', width: 192, height: 192, format: 'png', category: 'android' },
  { filename: 'icon-512x512.png', width: 512, height: 512, format: 'png', category: 'android' },
  { filename: 'maskable-icon-192x192.png', width: 192, height: 192, format: 'png', category: 'android', maskable: true },
  { filename: 'maskable-icon-512x512.png', width: 512, height: 512, format: 'png', category: 'android', maskable: true },

  // Social Media (Open Graph, Twitter)
  { filename: 'og-image.png', width: 1200, height: 630, format: 'png', category: 'social' },
  { filename: 'twitter-card.png', width: 1200, height: 600, format: 'png', category: 'social' },

  // Microsoft (Windows tiles)
  { filename: 'mstile-150x150.png', width: 150, height: 150, format: 'png', category: 'microsoft' },
] as const;

/** User input for asset bundle generation */
export interface AssetBundleInput {
  /** App name for manifest.json and README (required) */
  readonly appName: string;
  /** Optional short name for PWA (max 12 chars) */
  readonly shortName?: string;
  /** Theme color for PWA (hex color, default #000000) */
  readonly themeColor?: string;
  /** Background color for PWA/maskable icons (hex color, default #ffffff) */
  readonly backgroundColor?: string;
  /** Optional description for manifest.json */
  readonly description?: string;
  /** Start URL for PWA manifest (default "/") */
  readonly startUrl?: string;
}

/** Result of source image validation */
export interface SourceImageValidation {
  readonly valid: boolean;
  readonly width: number;
  readonly height: number;
  readonly format: string;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

/** Result of bundle generation */
export interface AssetBundleResult {
  readonly success: boolean;
  readonly filename: string;
  readonly sizeBytes: number;
  readonly assetCount: number;
  readonly generatedAt: string;
}

/** Minimum source image dimensions */
export const MIN_SOURCE_SIZE = 512;

/** Maximum source file size in bytes (10MB) */
export const MAX_SOURCE_SIZE = 10 * 1024 * 1024;

/** Allowed source image MIME types */
export const ALLOWED_SOURCE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
] as const;
