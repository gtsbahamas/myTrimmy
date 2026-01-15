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
  | 'ios'
  | 'android'
  | 'social'
  | 'microsoft';

/** Target platforms for asset generation */
export type Platform = 'ios' | 'android' | 'web' | 'social';

/** Platform selection for bundle generation */
export interface PlatformSelection {
  readonly ios: boolean;
  readonly android: boolean;
  readonly web: boolean;
  readonly social: boolean;
}

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

// =============================================================================
// PLATFORM-SPECIFIC ASSET SPECIFICATIONS
// =============================================================================

/**
 * iOS App Icons (18 sizes)
 * Covers all required sizes for iPhone, iPad, Apple Watch, and App Store
 * Based on Apple Human Interface Guidelines
 */
export const IOS_ASSETS: readonly AssetSpec[] = [
  // iPhone Notification (20pt)
  { filename: 'ios/Icon-20@2x.png', width: 40, height: 40, format: 'png', category: 'ios' },
  { filename: 'ios/Icon-20@3x.png', width: 60, height: 60, format: 'png', category: 'ios' },

  // iPhone Settings (29pt)
  { filename: 'ios/Icon-29@2x.png', width: 58, height: 58, format: 'png', category: 'ios' },
  { filename: 'ios/Icon-29@3x.png', width: 87, height: 87, format: 'png', category: 'ios' },

  // iPhone Spotlight (40pt)
  { filename: 'ios/Icon-40@2x.png', width: 80, height: 80, format: 'png', category: 'ios' },
  { filename: 'ios/Icon-40@3x.png', width: 120, height: 120, format: 'png', category: 'ios' },

  // iPhone App (60pt)
  { filename: 'ios/Icon-60@2x.png', width: 120, height: 120, format: 'png', category: 'ios' },
  { filename: 'ios/Icon-60@3x.png', width: 180, height: 180, format: 'png', category: 'ios' },

  // iPad Notification (20pt)
  { filename: 'ios/Icon-20.png', width: 20, height: 20, format: 'png', category: 'ios' },

  // iPad Settings (29pt)
  { filename: 'ios/Icon-29.png', width: 29, height: 29, format: 'png', category: 'ios' },

  // iPad Spotlight (40pt)
  { filename: 'ios/Icon-40.png', width: 40, height: 40, format: 'png', category: 'ios' },

  // iPad App (76pt)
  { filename: 'ios/Icon-76.png', width: 76, height: 76, format: 'png', category: 'ios' },
  { filename: 'ios/Icon-76@2x.png', width: 152, height: 152, format: 'png', category: 'ios' },

  // iPad Pro App (83.5pt)
  { filename: 'ios/Icon-83.5@2x.png', width: 167, height: 167, format: 'png', category: 'ios' },

  // App Store (1024pt)
  { filename: 'ios/Icon-1024.png', width: 1024, height: 1024, format: 'png', category: 'ios' },

  // Apple Watch (placeholder sizes - common ones)
  { filename: 'ios/Icon-Watch-40@2x.png', width: 80, height: 80, format: 'png', category: 'ios' },
  { filename: 'ios/Icon-Watch-44@2x.png', width: 88, height: 88, format: 'png', category: 'ios' },
  { filename: 'ios/Icon-Watch-50@2x.png', width: 100, height: 100, format: 'png', category: 'ios' },
] as const;

/**
 * Android Adaptive Icons
 * Foreground layers at 108dp base with various densities
 * Uses safe zone (66dp visible area within 108dp)
 */
export const ANDROID_ASSETS: readonly AssetSpec[] = [
  // Standard Icons (for older Android / fallback)
  { filename: 'android/mipmap-mdpi/ic_launcher.png', width: 48, height: 48, format: 'png', category: 'android' },
  { filename: 'android/mipmap-hdpi/ic_launcher.png', width: 72, height: 72, format: 'png', category: 'android' },
  { filename: 'android/mipmap-xhdpi/ic_launcher.png', width: 96, height: 96, format: 'png', category: 'android' },
  { filename: 'android/mipmap-xxhdpi/ic_launcher.png', width: 144, height: 144, format: 'png', category: 'android' },
  { filename: 'android/mipmap-xxxhdpi/ic_launcher.png', width: 192, height: 192, format: 'png', category: 'android' },

  // Adaptive Icon Foregrounds (108dp base, logo centered in safe zone)
  { filename: 'android/mipmap-mdpi/ic_launcher_foreground.png', width: 108, height: 108, format: 'png', category: 'android', maskable: true },
  { filename: 'android/mipmap-hdpi/ic_launcher_foreground.png', width: 162, height: 162, format: 'png', category: 'android', maskable: true },
  { filename: 'android/mipmap-xhdpi/ic_launcher_foreground.png', width: 216, height: 216, format: 'png', category: 'android', maskable: true },
  { filename: 'android/mipmap-xxhdpi/ic_launcher_foreground.png', width: 324, height: 324, format: 'png', category: 'android', maskable: true },
  { filename: 'android/mipmap-xxxhdpi/ic_launcher_foreground.png', width: 432, height: 432, format: 'png', category: 'android', maskable: true },

  // Round Icons (for launchers that use circles)
  { filename: 'android/mipmap-mdpi/ic_launcher_round.png', width: 48, height: 48, format: 'png', category: 'android' },
  { filename: 'android/mipmap-hdpi/ic_launcher_round.png', width: 72, height: 72, format: 'png', category: 'android' },
  { filename: 'android/mipmap-xhdpi/ic_launcher_round.png', width: 96, height: 96, format: 'png', category: 'android' },
  { filename: 'android/mipmap-xxhdpi/ic_launcher_round.png', width: 144, height: 144, format: 'png', category: 'android' },
  { filename: 'android/mipmap-xxxhdpi/ic_launcher_round.png', width: 192, height: 192, format: 'png', category: 'android' },

  // Play Store Icon
  { filename: 'android/playstore-icon.png', width: 512, height: 512, format: 'png', category: 'android' },
] as const;

/**
 * Web Assets (Favicons, PWA, Microsoft)
 * Covers browser tabs, bookmarks, PWA install, Windows tiles
 */
export const WEB_ASSETS: readonly AssetSpec[] = [
  // Favicons (browser tabs, bookmarks)
  { filename: 'web/favicon.ico', width: 48, height: 48, format: 'ico', category: 'favicon' },
  { filename: 'web/favicon-16x16.png', width: 16, height: 16, format: 'png', category: 'favicon' },
  { filename: 'web/favicon-32x32.png', width: 32, height: 32, format: 'png', category: 'favicon' },
  { filename: 'web/favicon-48x48.png', width: 48, height: 48, format: 'png', category: 'favicon' },
  { filename: 'web/favicon-96x96.png', width: 96, height: 96, format: 'png', category: 'favicon' },

  // Apple Touch Icons (for iOS Safari "Add to Home Screen")
  { filename: 'web/apple-touch-icon.png', width: 180, height: 180, format: 'png', category: 'apple' },
  { filename: 'web/apple-touch-icon-152x152.png', width: 152, height: 152, format: 'png', category: 'apple' },
  { filename: 'web/apple-touch-icon-120x120.png', width: 120, height: 120, format: 'png', category: 'apple' },

  // PWA Icons
  { filename: 'web/icon-192x192.png', width: 192, height: 192, format: 'png', category: 'android' },
  { filename: 'web/icon-512x512.png', width: 512, height: 512, format: 'png', category: 'android' },
  { filename: 'web/maskable-icon-192x192.png', width: 192, height: 192, format: 'png', category: 'android', maskable: true },
  { filename: 'web/maskable-icon-512x512.png', width: 512, height: 512, format: 'png', category: 'android', maskable: true },

  // Microsoft (Windows tiles, Edge)
  { filename: 'web/mstile-70x70.png', width: 70, height: 70, format: 'png', category: 'microsoft' },
  { filename: 'web/mstile-150x150.png', width: 150, height: 150, format: 'png', category: 'microsoft' },
  { filename: 'web/mstile-310x150.png', width: 310, height: 150, format: 'png', category: 'microsoft' },
  { filename: 'web/mstile-310x310.png', width: 310, height: 310, format: 'png', category: 'microsoft' },
] as const;

/**
 * Social Media Assets
 * Open Graph, Twitter, LinkedIn sharing images
 */
export const SOCIAL_ASSETS: readonly AssetSpec[] = [
  { filename: 'social/og-image.png', width: 1200, height: 630, format: 'png', category: 'social' },
  { filename: 'social/twitter-card.png', width: 1200, height: 600, format: 'png', category: 'social' },
  { filename: 'social/linkedin-share.png', width: 1200, height: 627, format: 'png', category: 'social' },
] as const;

/**
 * Get assets for selected platforms
 */
export function getAssetsForPlatforms(platforms: PlatformSelection): readonly AssetSpec[] {
  const assets: AssetSpec[] = [];

  if (platforms.ios) {
    assets.push(...IOS_ASSETS);
  }
  if (platforms.android) {
    assets.push(...ANDROID_ASSETS);
  }
  if (platforms.web) {
    assets.push(...WEB_ASSETS);
  }
  if (platforms.social) {
    assets.push(...SOCIAL_ASSETS);
  }

  return assets;
}

/**
 * Default: all platforms selected
 */
export const DEFAULT_PLATFORM_SELECTION: PlatformSelection = {
  ios: true,
  android: true,
  web: true,
  social: true,
};

/**
 * Complete specification of all assets (legacy - all platforms)
 * Total: 54 assets across iOS (18), Android (16), Web (16), Social (3)
 */
export const ASSET_BUNDLE_SPEC: readonly AssetSpec[] = [
  ...IOS_ASSETS,
  ...ANDROID_ASSETS,
  ...WEB_ASSETS,
  ...SOCIAL_ASSETS,
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
  /** Platforms to generate assets for (default: all) */
  readonly platforms?: PlatformSelection;
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

/** Asset counts by platform */
export interface PlatformAssetCounts {
  readonly ios: number;
  readonly android: number;
  readonly web: number;
  readonly social: number;
  readonly total: number;
}

/** Result of bundle generation */
export interface AssetBundleResult {
  readonly success: boolean;
  readonly filename: string;
  readonly sizeBytes: number;
  readonly assetCount: number;
  /** Asset counts broken down by platform */
  readonly platformCounts?: PlatformAssetCounts;
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
