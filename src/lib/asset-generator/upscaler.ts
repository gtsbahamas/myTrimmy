/**
 * Smart Upscaler
 *
 * Intelligently upscales source images when needed for larger output sizes.
 * Uses Sharp's Lanczos3 kernel for high-quality scaling.
 * Returns metadata about whether upscaling was performed and quality impact.
 */

import sharp from 'sharp';

/** Result of smart upscaling operation */
export interface UpscaleResult {
  /** The (potentially upscaled) image buffer */
  readonly buffer: Buffer;
  /** Whether the image was upscaled */
  readonly wasUpscaled: boolean;
  /** Original image width */
  readonly originalWidth: number;
  /** Original image height */
  readonly originalHeight: number;
  /** Target size used for upscaling decision */
  readonly targetSize: number;
  /** Quality assessment */
  readonly quality: 'optimal' | 'acceptable' | 'degraded';
  /** Warning message if quality may be affected */
  readonly warning?: string;
}

/**
 * Quality thresholds for upscaling decisions.
 *
 * - Optimal: Source >= target (no upscaling needed)
 * - Acceptable: Source >= 50% of target (2x upscale)
 * - Degraded: Source < 50% of target (>2x upscale)
 */
const QUALITY_THRESHOLDS = {
  /** Maximum safe upscale ratio for acceptable quality */
  ACCEPTABLE_RATIO: 2.0,
  /** Minimum source size recommendation */
  MIN_RECOMMENDED_SOURCE: 512,
};

/**
 * Determine quality level based on upscale ratio.
 */
function assessQuality(
  sourceSize: number,
  targetSize: number
): { quality: UpscaleResult['quality']; warning?: string } {
  if (sourceSize >= targetSize) {
    return { quality: 'optimal' };
  }

  const ratio = targetSize / sourceSize;

  if (ratio <= QUALITY_THRESHOLDS.ACCEPTABLE_RATIO) {
    return { quality: 'acceptable' };
  }

  return {
    quality: 'degraded',
    warning: `Source image (${sourceSize}px) is being upscaled ${ratio.toFixed(1)}x to ${targetSize}px. Quality may be affected. For best results, use a source image of at least ${QUALITY_THRESHOLDS.MIN_RECOMMENDED_SOURCE}px.`,
  };
}

/**
 * Smart upscale an image to a target size.
 *
 * Uses Sharp's Lanczos3 kernel for high-quality upscaling.
 * Only upscales if the source is smaller than the target.
 * Returns metadata about the operation and quality impact.
 *
 * @param sourceBuffer - Source image buffer
 * @param targetSize - Target width/height (assumes square)
 * @returns Upscale result with buffer and metadata
 */
export async function smartUpscale(
  sourceBuffer: Buffer,
  targetSize: number
): Promise<UpscaleResult> {
  // Get source dimensions
  const metadata = await sharp(sourceBuffer).metadata();
  const originalWidth = metadata.width || 0;
  const originalHeight = metadata.height || 0;

  // Use the smaller dimension for quality assessment (square icons)
  const sourceSize = Math.min(originalWidth, originalHeight);

  // Assess quality before upscaling
  const { quality, warning } = assessQuality(sourceSize, targetSize);

  // If source is already large enough, return as-is
  if (sourceSize >= targetSize) {
    return {
      buffer: sourceBuffer,
      wasUpscaled: false,
      originalWidth,
      originalHeight,
      targetSize,
      quality,
      warning,
    };
  }

  // Upscale using Lanczos3 kernel (best quality for upscaling)
  const upscaledBuffer = await sharp(sourceBuffer)
    .resize(targetSize, targetSize, {
      kernel: sharp.kernel.lanczos3,
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toBuffer();

  return {
    buffer: upscaledBuffer,
    wasUpscaled: true,
    originalWidth,
    originalHeight,
    targetSize,
    quality,
    warning,
  };
}

/**
 * Analyze source image for upscaling requirements.
 *
 * Determines what sizes can be generated without quality loss
 * and provides recommendations.
 *
 * @param sourceBuffer - Source image buffer
 * @returns Analysis with recommendations
 */
export async function analyzeSourceForUpscaling(sourceBuffer: Buffer): Promise<{
  sourceWidth: number;
  sourceHeight: number;
  maxOptimalSize: number;
  maxAcceptableSize: number;
  recommendation: string;
  warnings: string[];
}> {
  const metadata = await sharp(sourceBuffer).metadata();
  const sourceWidth = metadata.width || 0;
  const sourceHeight = metadata.height || 0;
  const sourceSize = Math.min(sourceWidth, sourceHeight);

  const maxOptimalSize = sourceSize;
  const maxAcceptableSize = Math.floor(sourceSize * QUALITY_THRESHOLDS.ACCEPTABLE_RATIO);

  const warnings: string[] = [];

  // App Store icons require 1024x1024
  if (sourceSize < 1024) {
    warnings.push(
      `Source is ${sourceSize}px. App Store icon (1024x1024) will be upscaled.`
    );
  }

  // Minimum recommended is 512px
  if (sourceSize < QUALITY_THRESHOLDS.MIN_RECOMMENDED_SOURCE) {
    warnings.push(
      `Source (${sourceSize}px) is below recommended minimum (${QUALITY_THRESHOLDS.MIN_RECOMMENDED_SOURCE}px). Consider using a larger source image.`
    );
  }

  let recommendation: string;
  if (sourceSize >= 1024) {
    recommendation = 'Source image is ideal for all asset sizes.';
  } else if (sourceSize >= QUALITY_THRESHOLDS.MIN_RECOMMENDED_SOURCE) {
    recommendation = `Source is good for most assets. App Store icon (1024px) will be mildly upscaled.`;
  } else {
    recommendation = `Consider using a larger source image (minimum ${QUALITY_THRESHOLDS.MIN_RECOMMENDED_SOURCE}px recommended) for best quality.`;
  }

  return {
    sourceWidth,
    sourceHeight,
    maxOptimalSize,
    maxAcceptableSize,
    recommendation,
    warnings,
  };
}

/**
 * Calculate the minimum source size needed for a set of target sizes.
 */
export function getMinimumSourceSize(targetSizes: number[]): {
  forOptimal: number;
  forAcceptable: number;
} {
  const maxTarget = Math.max(...targetSizes);

  return {
    forOptimal: maxTarget,
    forAcceptable: Math.ceil(maxTarget / QUALITY_THRESHOLDS.ACCEPTABLE_RATIO),
  };
}
