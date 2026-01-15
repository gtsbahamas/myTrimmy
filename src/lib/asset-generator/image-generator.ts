/**
 * Image Generator
 *
 * Uses Sharp to generate resized icons and social media images from a source logo.
 */

import sharp from 'sharp';
import type { AssetSpec } from '@/types/asset-bundle';

/**
 * Parse hex color string to RGB values.
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  // Remove # if present
  const cleanHex = hex.replace('#', '');

  // Handle 3-char shorthand
  const fullHex =
    cleanHex.length === 3
      ? cleanHex
          .split('')
          .map((c) => c + c)
          .join('')
      : cleanHex;

  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  if (!result) {
    return { r: 255, g: 255, b: 255 }; // Default to white
  }

  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Ensure source image is square by cropping to center square.
 * Returns the original buffer if already square.
 */
export async function ensureSquare(sourceBuffer: Buffer): Promise<Buffer> {
  const metadata = await sharp(sourceBuffer).metadata();
  const { width, height } = metadata;

  if (!width || !height) {
    throw new Error('Unable to read image dimensions');
  }

  // Already square
  if (width === height) {
    return sourceBuffer;
  }

  // Crop to center square
  const size = Math.min(width, height);
  const left = Math.floor((width - size) / 2);
  const top = Math.floor((height - size) / 2);

  return sharp(sourceBuffer)
    .extract({ left, top, width: size, height: size })
    .toBuffer();
}

/**
 * Generate a standard (non-maskable) square icon asset.
 */
export async function generateSquareAsset(
  sourceBuffer: Buffer,
  spec: AssetSpec
): Promise<Buffer> {
  // Ensure square source
  const squareSource = await ensureSquare(sourceBuffer);

  return sharp(squareSource)
    .resize(spec.width, spec.height, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 }, // Transparent background
    })
    .png({ quality: spec.quality || 100 })
    .toBuffer();
}

/**
 * Generate a maskable icon with safe zone padding.
 * The logo is scaled to fit within the 80% safe zone (10% padding on each side).
 */
export async function generateMaskableAsset(
  sourceBuffer: Buffer,
  spec: AssetSpec,
  backgroundColor: string
): Promise<Buffer> {
  // Ensure square source
  const squareSource = await ensureSquare(sourceBuffer);

  // Safe zone is 80% of icon size, so logo should be 80% of dimensions
  const safeZoneSize = Math.round(spec.width * 0.8);

  // Resize logo to fit safe zone
  const logo = await sharp(squareSource)
    .resize(safeZoneSize, safeZoneSize, { fit: 'contain' })
    .png()
    .toBuffer();

  // Parse background color
  const bgColor = hexToRgb(backgroundColor);

  // Create canvas with solid background and composite logo centered
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
 * Generate a social media image (non-square).
 * Centers the logo on a white/colored background.
 */
export async function generateSocialAsset(
  sourceBuffer: Buffer,
  spec: AssetSpec,
  backgroundColor: string = '#ffffff'
): Promise<Buffer> {
  // Ensure square source
  const squareSource = await ensureSquare(sourceBuffer);

  // Logo should be 60% of the height, centered
  const logoSize = Math.round(spec.height * 0.6);

  // Resize logo
  const logo = await sharp(squareSource)
    .resize(logoSize, logoSize, { fit: 'contain' })
    .png()
    .toBuffer();

  // Parse background color
  const bgColor = hexToRgb(backgroundColor);

  // Create canvas and composite logo centered
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
 * Generate an asset based on its specification.
 * Routes to the appropriate generator based on asset properties.
 */
export async function generateAsset(
  sourceBuffer: Buffer,
  spec: AssetSpec,
  backgroundColor: string = '#ffffff'
): Promise<Buffer> {
  // Social media images (non-square)
  if (spec.category === 'social') {
    return generateSocialAsset(sourceBuffer, spec, backgroundColor);
  }

  // Maskable icons
  if (spec.maskable) {
    return generateMaskableAsset(sourceBuffer, spec, backgroundColor);
  }

  // Standard square icons
  return generateSquareAsset(sourceBuffer, spec);
}
