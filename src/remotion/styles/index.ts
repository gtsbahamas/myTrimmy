// src/remotion/styles/index.ts

import { minimalStyle } from './minimal';
import { energeticStyle } from './energetic';
import { professionalStyle } from './professional';
import type { VideoStyle } from '@/types/video-bundle';

export { minimalStyle } from './minimal';
export { energeticStyle } from './energetic';
export { professionalStyle } from './professional';

/**
 * Style configuration type (union of all styles)
 */
export type StyleConfig = typeof minimalStyle | typeof energeticStyle | typeof professionalStyle;

/**
 * Get style configuration by name
 */
export function getStyleConfig(style: VideoStyle): StyleConfig {
  switch (style) {
    case 'minimal':
      return minimalStyle;
    case 'energetic':
      return energeticStyle;
    case 'professional':
      return professionalStyle;
    default:
      return minimalStyle;
  }
}

/**
 * All available styles
 */
export const STYLES = {
  minimal: minimalStyle,
  energetic: energeticStyle,
  professional: professionalStyle,
} as const;
