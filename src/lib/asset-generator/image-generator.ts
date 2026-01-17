/**
 * Image Generator
 *
 * Uses Sharp to generate resized icons and social media images from a source logo.
 * Includes utilities for background removal and dark mode variant generation.
 */

import sharp from 'sharp';
import type { AssetSpec } from '@/types/asset-bundle';

// =============================================================================
// COLOR UTILITIES
// =============================================================================

interface RGB {
  r: number;
  g: number;
  b: number;
}

/** Color similarity threshold for solid background detection */
const COLOR_SIMILARITY_THRESHOLD = 30;
/** Tolerance for background color removal */
const REMOVAL_TOLERANCE = 40;

/**
 * Calculate Euclidean distance between two RGB colors.
 */
function colorDistance(c1: RGB, c2: RGB): number {
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) +
    Math.pow(c1.g - c2.g, 2) +
    Math.pow(c1.b - c2.b, 2)
  );
}

/**
 * Check if all colors in an array are similar.
 */
function areColorsSimilar(colors: RGB[], threshold: number): boolean {
  if (colors.length < 2) return true;
  const reference = colors[0];
  return colors.every(color => colorDistance(color, reference) < threshold);
}

/**
 * Parse hex color string to RGB values.
 */
function hexToRgb(hex: string): RGB {
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

// =============================================================================
// BACKGROUND REMOVAL (for transparent variants)
// =============================================================================

/**
 * Detect if an image has a solid color background by sampling corners.
 * Returns the background color if solid, null if complex.
 */
export async function detectSolidBackground(imageBuffer: Buffer): Promise<RGB | null> {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    return null;
  }

  const width = metadata.width;
  const height = metadata.height;
  const sampleSize = 5;
  const cornerSamples: RGB[] = [];

  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;

  const getPixel = (x: number, y: number): RGB => {
    const idx = (y * width + x) * channels;
    return {
      r: data[idx],
      g: data[idx + 1],
      b: data[idx + 2],
    };
  };

  const corners = [
    { startX: 0, startY: 0 },
    { startX: width - sampleSize, startY: 0 },
    { startX: 0, startY: height - sampleSize },
    { startX: width - sampleSize, startY: height - sampleSize },
  ];

  for (const corner of corners) {
    for (let dy = 0; dy < sampleSize; dy++) {
      for (let dx = 0; dx < sampleSize; dx++) {
        const x = Math.max(0, Math.min(width - 1, corner.startX + dx));
        const y = Math.max(0, Math.min(height - 1, corner.startY + dy));
        cornerSamples.push(getPixel(x, y));
      }
    }
  }

  if (areColorsSimilar(cornerSamples, COLOR_SIMILARITY_THRESHOLD)) {
    return {
      r: Math.round(cornerSamples.reduce((sum, c) => sum + c.r, 0) / cornerSamples.length),
      g: Math.round(cornerSamples.reduce((sum, c) => sum + c.g, 0) / cornerSamples.length),
      b: Math.round(cornerSamples.reduce((sum, c) => sum + c.b, 0) / cornerSamples.length),
    };
  }

  return null;
}

/**
 * Remove solid color background, making it transparent.
 */
export async function removeColorBackground(
  imageBuffer: Buffer,
  bgColor: RGB,
  tolerance: number = REMOVAL_TOLERANCE
): Promise<Buffer> {
  const image = sharp(imageBuffer);
  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;
  const outputData = Buffer.from(data);

  for (let i = 0; i < data.length; i += channels) {
    const pixelColor: RGB = {
      r: data[i],
      g: data[i + 1],
      b: data[i + 2],
    };

    const distance = colorDistance(pixelColor, bgColor);

    if (distance < tolerance) {
      outputData[i + 3] = 0;
    } else if (distance < tolerance * 1.5) {
      const alpha = Math.min(255, Math.round(((distance - tolerance) / (tolerance * 0.5)) * 255));
      outputData[i + 3] = Math.min(outputData[i + 3], alpha);
    }
  }

  return sharp(outputData, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

/**
 * Create a transparent version of a logo.
 * Detects and removes solid background color.
 */
export async function createTransparentLogo(imageBuffer: Buffer): Promise<Buffer> {
  const bgColor = await detectSolidBackground(imageBuffer);

  if (bgColor) {
    return removeColorBackground(imageBuffer, bgColor);
  }

  // If no solid background detected, just ensure alpha channel exists
  return sharp(imageBuffer).ensureAlpha().png().toBuffer();
}

// =============================================================================
// DARK MODE VARIANT (smart color inversion)
// =============================================================================

/**
 * Convert RGB to HSL color space.
 */
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h, s, l };
}

/**
 * Convert HSL to RGB color space.
 */
function hslToRgb(h: number, s: number, l: number): RGB {
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Invert a color for dark mode.
 * - Dark colors become light
 * - Light colors become dark
 * - Preserves saturation and hue
 */
function invertColorForDarkMode(r: number, g: number, b: number): RGB {
  const { h, s, l } = rgbToHsl(r, g, b);

  // Invert lightness
  const newL = 1 - l;

  return hslToRgb(h, s, newL);
}

/**
 * Create a dark mode variant by inverting colors.
 * Dark colors (like black text) become light (white).
 * Preserves transparency.
 */
export async function createDarkModeVariant(imageBuffer: Buffer): Promise<Buffer> {
  const image = sharp(imageBuffer);
  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;
  const outputData = Buffer.from(data);

  for (let i = 0; i < data.length; i += channels) {
    const alpha = data[i + 3];

    // Only process non-transparent pixels
    if (alpha > 0) {
      const inverted = invertColorForDarkMode(data[i], data[i + 1], data[i + 2]);
      outputData[i] = inverted.r;
      outputData[i + 1] = inverted.g;
      outputData[i + 2] = inverted.b;
      // Preserve alpha
    }
  }

  return sharp(outputData, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

/**
 * Create both light and dark mode transparent variants.
 */
export async function createLightDarkVariants(
  imageBuffer: Buffer
): Promise<{ light: Buffer; dark: Buffer }> {
  // First create the transparent (light mode) version
  const lightVariant = await createTransparentLogo(imageBuffer);

  // Then create dark mode variant from the transparent version
  const darkVariant = await createDarkModeVariant(lightVariant);

  return { light: lightVariant, dark: darkVariant };
}
