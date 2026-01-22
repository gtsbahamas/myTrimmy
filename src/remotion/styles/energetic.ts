// src/remotion/styles/energetic.ts

import { easeOutBack, easeInExpo, easeOutExpo } from '../utils/easing';
import { secondsToFrames } from '../utils/timing';

/**
 * Energetic style configuration
 * Punchy cuts, dynamic zoom, bold motion
 */

export const energeticStyle = {
  name: 'energetic' as const,

  // Timing - faster than minimal
  transitionDuration: secondsToFrames(0.3),
  textEnterDuration: secondsToFrames(0.3),
  textExitDuration: secondsToFrames(0.2),

  // Easing - more dramatic
  enterEasing: easeOutBack,
  exitEasing: easeInExpo,
  moveEasing: easeOutExpo,

  // Scene defaults (in frames) - shorter scenes
  sceneDefaults: {
    intro: secondsToFrames(3),
    feature: secondsToFrames(3),
    stats: secondsToFrames(3),
    screenshot: secondsToFrames(4),
    cta: secondsToFrames(3),
  },

  // Text animation
  text: {
    enterType: 'slide-up' as const,
    enterDistance: 40, // px - larger movement
    letterSpacing: 0.04, // em - wider
    lineHeight: 1.3,
    fontWeight: {
      headline: 800,
      subheadline: 600,
      body: 500,
      cta: 700,
    },
  },

  // Screenshot effects
  screenshot: {
    effect: 'dynamic-zoom' as const,
    scale: { start: 1, end: 1.15 },
    overlayOpacity: 0.15,
    borderRadius: 12,
    shadow: '0 30px 80px rgba(0, 0, 0, 0.4)',
  },

  // Logo animation
  logo: {
    enterType: 'scale-bounce' as const,
    enterDuration: secondsToFrames(0.6),
    glowIntensity: 0.3,
  },

  // Background
  background: {
    gradientAngle: 45,
    gradientStops: 4,
    animateGradient: true,
    gradientSpeed: 1.5, // faster cycles
    particleCount: 20,
    overlayPattern: 'geometric' as const,
  },

  // Transitions between scenes
  transitions: {
    type: 'zoom-cut' as const,
    duration: secondsToFrames(0.3),
  },

  // CTA button style
  cta: {
    borderRadius: 50, // Pill shape
    paddingX: 56,
    paddingY: 20,
    shadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
    hoverScale: 1.05,
    pulseAnimation: true,
  },

  // Stats counter
  stats: {
    counterDuration: secondsToFrames(0.8), // Faster counting
    counterEasing: easeOutExpo,
    separatorStyle: 'slash' as const,
    layout: 'stacked' as const,
  },
};

export type EnergeticStyle = typeof energeticStyle;
