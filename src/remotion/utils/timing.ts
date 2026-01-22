// src/remotion/utils/timing.ts

/**
 * Remotion timing utilities
 * All durations are in frames at 30fps
 */

export const FPS = 30;

/**
 * Convert seconds to frames
 */
export function secondsToFrames(seconds: number): number {
  return Math.round(seconds * FPS);
}

/**
 * Convert frames to seconds
 */
export function framesToSeconds(frames: number): number {
  return frames / FPS;
}

/**
 * Calculate progress within a range (0-1)
 */
export function getProgress(
  frame: number,
  startFrame: number,
  durationFrames: number
): number {
  if (frame < startFrame) return 0;
  if (frame >= startFrame + durationFrames) return 1;
  return (frame - startFrame) / durationFrames;
}

/**
 * Calculate delayed progress (starts after delay, 0-1)
 */
export function getDelayedProgress(
  frame: number,
  delayFrames: number,
  durationFrames: number
): number {
  return getProgress(frame, delayFrames, durationFrames);
}

/**
 * Scene timing configuration
 */
export interface SceneTiming {
  startFrame: number;
  durationFrames: number;
  endFrame: number;
}

/**
 * Calculate scene timings from durations
 */
export function calculateSceneTimings(
  durations: number[]
): SceneTiming[] {
  const timings: SceneTiming[] = [];
  let currentFrame = 0;

  for (const duration of durations) {
    timings.push({
      startFrame: currentFrame,
      durationFrames: duration,
      endFrame: currentFrame + duration,
    });
    currentFrame += duration;
  }

  return timings;
}

/**
 * Calculate total duration from scene timings
 */
export function getTotalDuration(timings: SceneTiming[]): number {
  if (timings.length === 0) return 0;
  return timings[timings.length - 1].endFrame;
}

/**
 * Standard transition durations
 */
export const TRANSITIONS = {
  fade: secondsToFrames(0.5),
  slide: secondsToFrames(0.4),
  zoom: secondsToFrames(0.6),
  wipe: secondsToFrames(0.5),
} as const;

/**
 * Standard animation durations
 */
export const ANIMATIONS = {
  textEnter: secondsToFrames(0.4),
  textExit: secondsToFrames(0.3),
  logoReveal: secondsToFrames(0.8),
  counterTick: secondsToFrames(0.05),
  buttonPulse: secondsToFrames(0.3),
} as const;
