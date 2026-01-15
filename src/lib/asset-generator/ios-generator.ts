/**
 * iOS Asset Generator
 *
 * Generates all 18 iOS app icon sizes required for iPhone, iPad, Apple Watch, and App Store.
 * Based on Apple Human Interface Guidelines.
 */

import { IOS_ASSETS, type AssetSpec } from '@/types/asset-bundle';
import { generateSquareAsset, ensureSquare } from './image-generator';

/** Generated iOS asset with buffer and metadata */
export interface IOSAssetOutput {
  readonly spec: AssetSpec;
  readonly buffer: Buffer;
  readonly filename: string;
}

/** iOS generation result */
export interface IOSGenerationResult {
  readonly success: boolean;
  readonly assets: readonly IOSAssetOutput[];
  readonly assetCount: number;
  readonly errors: readonly string[];
}

/**
 * Generate all iOS app icons from a source image.
 *
 * Produces 18 icons covering:
 * - iPhone: notification (20pt), settings (29pt), spotlight (40pt), app (60pt)
 * - iPad: notification (20pt), settings (29pt), spotlight (40pt), app (76pt, 83.5pt)
 * - Apple Watch: 40, 44, 50 @2x
 * - App Store: 1024x1024
 *
 * All icons at appropriate @1x, @2x, @3x scales.
 */
export async function generateIOSAssets(
  sourceBuffer: Buffer
): Promise<IOSGenerationResult> {
  const assets: IOSAssetOutput[] = [];
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

  // Generate each iOS asset
  for (const spec of IOS_ASSETS) {
    try {
      const buffer = await generateSquareAsset(squareSource, spec);
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
 * Generate iOS Contents.json for AppIcon.appiconset
 * This is the metadata file Xcode needs to recognize the icons.
 */
export function generateIOSContentsJson(): string {
  const images = [
    // iPhone Notification 20pt
    { idiom: 'iphone', scale: '2x', size: '20x20', filename: 'Icon-20@2x.png' },
    { idiom: 'iphone', scale: '3x', size: '20x20', filename: 'Icon-20@3x.png' },

    // iPhone Settings 29pt
    { idiom: 'iphone', scale: '2x', size: '29x29', filename: 'Icon-29@2x.png' },
    { idiom: 'iphone', scale: '3x', size: '29x29', filename: 'Icon-29@3x.png' },

    // iPhone Spotlight 40pt
    { idiom: 'iphone', scale: '2x', size: '40x40', filename: 'Icon-40@2x.png' },
    { idiom: 'iphone', scale: '3x', size: '40x40', filename: 'Icon-40@3x.png' },

    // iPhone App 60pt
    { idiom: 'iphone', scale: '2x', size: '60x60', filename: 'Icon-60@2x.png' },
    { idiom: 'iphone', scale: '3x', size: '60x60', filename: 'Icon-60@3x.png' },

    // iPad Notification 20pt
    { idiom: 'ipad', scale: '1x', size: '20x20', filename: 'Icon-20.png' },
    { idiom: 'ipad', scale: '2x', size: '20x20', filename: 'Icon-20@2x.png' },

    // iPad Settings 29pt
    { idiom: 'ipad', scale: '1x', size: '29x29', filename: 'Icon-29.png' },
    { idiom: 'ipad', scale: '2x', size: '29x29', filename: 'Icon-29@2x.png' },

    // iPad Spotlight 40pt
    { idiom: 'ipad', scale: '1x', size: '40x40', filename: 'Icon-40.png' },
    { idiom: 'ipad', scale: '2x', size: '40x40', filename: 'Icon-40@2x.png' },

    // iPad App 76pt
    { idiom: 'ipad', scale: '1x', size: '76x76', filename: 'Icon-76.png' },
    { idiom: 'ipad', scale: '2x', size: '76x76', filename: 'Icon-76@2x.png' },

    // iPad Pro App 83.5pt
    { idiom: 'ipad', scale: '2x', size: '83.5x83.5', filename: 'Icon-83.5@2x.png' },

    // App Store
    { idiom: 'ios-marketing', scale: '1x', size: '1024x1024', filename: 'Icon-1024.png' },
  ];

  return JSON.stringify(
    {
      images: images.map((img) => ({
        idiom: img.idiom,
        scale: img.scale,
        size: img.size,
        filename: img.filename,
      })),
      info: {
        author: 'Iconym',
        version: 1,
      },
    },
    null,
    2
  );
}

/**
 * Get the folder structure for iOS assets
 */
export function getIOSFolderStructure(): string[] {
  return ['ios', 'ios/AppIcon.appiconset'];
}
