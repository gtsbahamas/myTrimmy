/**
 * Android Asset Generator
 *
 * Generates Android app icons including:
 * - Standard launcher icons (ic_launcher) for all densities
 * - Adaptive icon foreground layers (ic_launcher_foreground)
 * - Round icons (ic_launcher_round)
 * - Play Store icon (512x512)
 *
 * Adaptive icons use a 108dp base with 66dp safe zone (logo visible area).
 */

import sharp from 'sharp';
import { ANDROID_ASSETS, type AssetSpec } from '@/types/asset-bundle';
import { generateSquareAsset, ensureSquare } from './image-generator';

/** Generated Android asset with buffer and metadata */
export interface AndroidAssetOutput {
  readonly spec: AssetSpec;
  readonly buffer: Buffer;
  readonly filename: string;
}

/** Android generation result */
export interface AndroidGenerationResult {
  readonly success: boolean;
  readonly assets: readonly AndroidAssetOutput[];
  readonly assetCount: number;
  readonly errors: readonly string[];
}

/**
 * Parse hex color to RGB.
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleanHex = hex.replace('#', '');
  const fullHex =
    cleanHex.length === 3
      ? cleanHex.split('').map((c) => c + c).join('')
      : cleanHex;
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  if (!result) return { r: 255, g: 255, b: 255 };
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Generate an adaptive icon foreground layer.
 *
 * Adaptive icons have a 108dp base with a 66dp safe zone.
 * The logo is scaled to fit the safe zone (approximately 61% of total size).
 * The remaining area provides space for the system to apply shape masks.
 */
async function generateAdaptiveForeground(
  sourceBuffer: Buffer,
  spec: AssetSpec,
  backgroundColor: string
): Promise<Buffer> {
  // Safe zone is ~61% of the icon (66dp / 108dp)
  const safeZoneRatio = 66 / 108;
  const safeZoneSize = Math.round(spec.width * safeZoneRatio);

  // Resize logo to fit safe zone
  const logo = await sharp(sourceBuffer)
    .resize(safeZoneSize, safeZoneSize, { fit: 'contain' })
    .png()
    .toBuffer();

  // Parse background color
  const bgColor = hexToRgb(backgroundColor);

  // Create foreground layer with transparent background
  // (background color will be in a separate layer for true adaptive icons)
  return sharp({
    create: {
      width: spec.width,
      height: spec.height,
      channels: 4,
      background: { ...bgColor, alpha: 1 },
    },
  })
    .composite([
      {
        input: logo,
        gravity: 'center',
      },
    ])
    .png()
    .toBuffer();
}

/**
 * Generate a round icon (for circle mask launchers).
 */
async function generateRoundIcon(
  sourceBuffer: Buffer,
  spec: AssetSpec
): Promise<Buffer> {
  // Create circular mask
  const size = spec.width;
  const radius = size / 2;

  const circularMask = Buffer.from(
    `<svg width="${size}" height="${size}">
      <circle cx="${radius}" cy="${radius}" r="${radius}" fill="white"/>
    </svg>`
  );

  // Resize logo
  const resizedLogo = await sharp(sourceBuffer)
    .resize(size, size, { fit: 'cover' })
    .png()
    .toBuffer();

  // Apply circular mask
  return sharp(resizedLogo)
    .composite([
      {
        input: circularMask,
        blend: 'dest-in',
      },
    ])
    .png()
    .toBuffer();
}

/**
 * Generate all Android app icons from a source image.
 */
export async function generateAndroidAssets(
  sourceBuffer: Buffer,
  backgroundColor: string = '#ffffff'
): Promise<AndroidGenerationResult> {
  const assets: AndroidAssetOutput[] = [];
  const errors: string[] = [];

  // Ensure we have a square source
  let squareSource: Buffer;
  try {
    squareSource = await ensureSquare(sourceBuffer);
  } catch (error) {
    return {
      success: false,
      assets: [],
      assetCount: 0,
      errors: [`Failed to process source image: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }

  // Generate each Android asset
  for (const spec of ANDROID_ASSETS) {
    try {
      let buffer: Buffer;

      if (spec.filename.includes('_foreground')) {
        // Adaptive icon foreground (maskable with safe zone)
        buffer = await generateAdaptiveForeground(squareSource, spec, backgroundColor);
      } else if (spec.filename.includes('_round')) {
        // Round icon with circular mask
        buffer = await generateRoundIcon(squareSource, spec);
      } else {
        // Standard square icon
        buffer = await generateSquareAsset(squareSource, spec);
      }

      assets.push({
        spec,
        buffer,
        filename: spec.filename,
      });
    } catch (error) {
      errors.push(
        `Failed to generate ${spec.filename}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  return {
    success: errors.length === 0,
    assets,
    assetCount: assets.length,
    errors,
  };
}

/**
 * Generate ic_launcher.xml for adaptive icons
 */
export function generateAdaptiveIconXml(backgroundColor: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`;
}

/**
 * Generate ic_launcher_round.xml for adaptive round icons
 */
export function generateAdaptiveRoundIconXml(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`;
}

/**
 * Generate colors.xml with launcher background color
 */
export function generateColorsXml(backgroundColor: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">${backgroundColor}</color>
</resources>`;
}

/**
 * Get the folder structure for Android assets
 */
export function getAndroidFolderStructure(): string[] {
  return [
    'android',
    'android/mipmap-mdpi',
    'android/mipmap-hdpi',
    'android/mipmap-xhdpi',
    'android/mipmap-xxhdpi',
    'android/mipmap-xxxhdpi',
    'android/mipmap-anydpi-v26',
    'android/values',
  ];
}
