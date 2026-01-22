// src/remotion/index.ts
// Main entry point for Remotion

export { RemotionRoot } from './Root';
export { PromoVideo, calculateTotalDuration } from './compositions';
export { getStyleConfig, STYLES } from './styles';
export type { StyleConfig } from './styles';
export { FPS, secondsToFrames, framesToSeconds, calculateSceneTimings } from './utils/timing';
export { FORMAT_DIMENSIONS, getSafeZone, getTitleSafeZone, getTypographyScale } from './utils/safeZones';
export type { VideoFormat } from './utils/safeZones';
