// src/remotion/utils/safeZones.ts

/**
 * Safe zone calculations for different video formats
 * Ensures text and important elements don't get cut off
 */

export type VideoFormat = 'landscape' | 'portrait' | 'square';

export interface Dimensions {
  width: number;
  height: number;
}

export interface SafeZone {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

/**
 * Video format dimensions
 */
export const FORMAT_DIMENSIONS: Record<VideoFormat, Dimensions> = {
  landscape: { width: 1920, height: 1080 },
  portrait: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
};

/**
 * Safe zone margins (percentage of dimension)
 * Text should stay within these bounds to avoid being cut off
 */
const SAFE_MARGIN_PERCENT = 0.05; // 5% margin

/**
 * Title safe zone (more conservative for important text)
 */
const TITLE_SAFE_MARGIN_PERCENT = 0.1; // 10% margin

/**
 * Calculate safe zone for a format
 */
export function getSafeZone(format: VideoFormat): SafeZone {
  const dims = FORMAT_DIMENSIONS[format];
  const marginX = dims.width * SAFE_MARGIN_PERCENT;
  const marginY = dims.height * SAFE_MARGIN_PERCENT;

  return {
    top: marginY,
    right: dims.width - marginX,
    bottom: dims.height - marginY,
    left: marginX,
    width: dims.width - marginX * 2,
    height: dims.height - marginY * 2,
    centerX: dims.width / 2,
    centerY: dims.height / 2,
  };
}

/**
 * Calculate title safe zone (more conservative)
 */
export function getTitleSafeZone(format: VideoFormat): SafeZone {
  const dims = FORMAT_DIMENSIONS[format];
  const marginX = dims.width * TITLE_SAFE_MARGIN_PERCENT;
  const marginY = dims.height * TITLE_SAFE_MARGIN_PERCENT;

  return {
    top: marginY,
    right: dims.width - marginX,
    bottom: dims.height - marginY,
    left: marginX,
    width: dims.width - marginX * 2,
    height: dims.height - marginY * 2,
    centerX: dims.width / 2,
    centerY: dims.height / 2,
  };
}

/**
 * Typography scale based on format
 * Larger formats get larger base font sizes
 */
export interface TypographyScale {
  headline: number;
  subheadline: number;
  body: number;
  caption: number;
  stat: number;
  cta: number;
}

export function getTypographyScale(format: VideoFormat): TypographyScale {
  switch (format) {
    case 'landscape':
      return {
        headline: 72,
        subheadline: 48,
        body: 32,
        caption: 24,
        stat: 96,
        cta: 40,
      };
    case 'portrait':
      return {
        headline: 64,
        subheadline: 40,
        body: 28,
        caption: 20,
        stat: 80,
        cta: 36,
      };
    case 'square':
      return {
        headline: 56,
        subheadline: 36,
        body: 26,
        caption: 18,
        stat: 72,
        cta: 32,
      };
  }
}

/**
 * Logo size based on format
 */
export interface LogoSize {
  width: number;
  height: number;
}

export function getLogoSize(format: VideoFormat): LogoSize {
  switch (format) {
    case 'landscape':
      return { width: 200, height: 200 };
    case 'portrait':
      return { width: 160, height: 160 };
    case 'square':
      return { width: 140, height: 140 };
  }
}

/**
 * Calculate position for centered text
 */
export function getCenteredPosition(
  format: VideoFormat,
  elementHeight: number
): { x: number; y: number } {
  const dims = FORMAT_DIMENSIONS[format];
  return {
    x: dims.width / 2,
    y: (dims.height - elementHeight) / 2,
  };
}

/**
 * Calculate position for bottom-aligned CTA
 */
export function getCtaPosition(format: VideoFormat): { x: number; y: number } {
  const dims = FORMAT_DIMENSIONS[format];
  const safeZone = getTitleSafeZone(format);

  return {
    x: dims.width / 2,
    y: safeZone.bottom - 100, // 100px from bottom safe zone
  };
}

/**
 * Calculate Ken-Burns effect parameters for screenshot
 */
export interface KenBurnsParams {
  startScale: number;
  endScale: number;
  startX: number;
  endX: number;
  startY: number;
  endY: number;
}

export function getKenBurnsParams(
  format: VideoFormat,
  direction: 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right'
): KenBurnsParams {
  const dims = FORMAT_DIMENSIONS[format];

  switch (direction) {
    case 'zoom-in':
      return {
        startScale: 1,
        endScale: 1.15,
        startX: dims.width / 2,
        endX: dims.width / 2,
        startY: dims.height / 2,
        endY: dims.height / 2,
      };
    case 'zoom-out':
      return {
        startScale: 1.15,
        endScale: 1,
        startX: dims.width / 2,
        endX: dims.width / 2,
        startY: dims.height / 2,
        endY: dims.height / 2,
      };
    case 'pan-left':
      return {
        startScale: 1.1,
        endScale: 1.1,
        startX: dims.width * 0.55,
        endX: dims.width * 0.45,
        startY: dims.height / 2,
        endY: dims.height / 2,
      };
    case 'pan-right':
      return {
        startScale: 1.1,
        endScale: 1.1,
        startX: dims.width * 0.45,
        endX: dims.width * 0.55,
        startY: dims.height / 2,
        endY: dims.height / 2,
      };
  }
}
