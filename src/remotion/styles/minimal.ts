// src/remotion/styles/minimal.ts

import { easeOutCubic, easeInCubic, easeInOutCubic } from '../utils/easing';
import { secondsToFrames } from '../utils/timing';
import { SCENE_DURATIONS } from '../skill-config';

/**
 * Minimal style configuration
 * Clean fades, subtle motion, meditative feel
 */

export const minimalStyle = {
  name: 'minimal' as const,

  // Timing
  transitionDuration: secondsToFrames(0.6),
  textEnterDuration: secondsToFrames(0.5),
  textExitDuration: secondsToFrames(0.4),

  // Easing
  enterEasing: easeOutCubic,
  exitEasing: easeInCubic,
  moveEasing: easeInOutCubic,

  // Scene defaults (in frames) - from Promo Video Mastery skill config
  sceneDefaults: {
    intro: SCENE_DURATIONS.intro.ideal,
    feature: SCENE_DURATIONS.feature.ideal,
    stats: SCENE_DURATIONS.stats.ideal,
    screenshot: SCENE_DURATIONS.screenshot.ideal,
    cta: SCENE_DURATIONS.cta.ideal,
  },

  // Text animation
  text: {
    enterType: 'fade' as const,
    enterDistance: 20, // px
    letterSpacing: 0.02, // em
    lineHeight: 1.4,
    fontWeight: {
      headline: 600,
      subheadline: 400,
      body: 400,
      cta: 600,
    },
  },

  // Screenshot effects
  screenshot: {
    effect: 'subtle-zoom' as const,
    scale: { start: 1, end: 1.05 },
    overlayOpacity: 0.1,
    borderRadius: 8,
    shadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  },

  // Logo animation
  logo: {
    enterType: 'fade' as const,
    enterDuration: secondsToFrames(0.8),
    glowIntensity: 0,
  },

  // Background
  background: {
    gradientAngle: 135,
    gradientStops: 3,
    animateGradient: true,
    gradientSpeed: 0.5, // cycles per video
    particleCount: 0,
    overlayPattern: null,
  },

  // Transitions between scenes
  transitions: {
    type: 'crossfade' as const,
    duration: secondsToFrames(0.6),
  },

  // CTA button style
  cta: {
    borderRadius: 8,
    paddingX: 48,
    paddingY: 16,
    shadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
    hoverScale: 1, // No hover effect in video
    pulseAnimation: false,
  },

  // Stats counter
  stats: {
    counterDuration: secondsToFrames(1.5),
    counterEasing: easeOutCubic,
    separatorStyle: 'line' as const,
    layout: 'horizontal' as const,
  },
};

export type MinimalStyle = typeof minimalStyle;
