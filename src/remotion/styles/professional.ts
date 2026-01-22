// src/remotion/styles/professional.ts

import { easeOutQuart, easeInOutQuart } from '../utils/easing';
import { secondsToFrames } from '../utils/timing';

/**
 * Professional style configuration
 * Smooth glides, elegant pans, sophisticated feel
 */

export const professionalStyle = {
  name: 'professional' as const,

  // Timing - more deliberate
  transitionDuration: secondsToFrames(0.8),
  textEnterDuration: secondsToFrames(0.6),
  textExitDuration: secondsToFrames(0.5),

  // Easing - smooth and refined
  enterEasing: easeOutQuart,
  exitEasing: easeInOutQuart,
  moveEasing: easeInOutQuart,

  // Scene defaults (in frames) - longer scenes
  sceneDefaults: {
    intro: secondsToFrames(5),
    feature: secondsToFrames(5),
    stats: secondsToFrames(5),
    screenshot: secondsToFrames(6),
    cta: secondsToFrames(5),
  },

  // Text animation
  text: {
    enterType: 'fade-slide' as const,
    enterDistance: 15, // px - subtle movement
    letterSpacing: 0.03, // em
    lineHeight: 1.5,
    fontWeight: {
      headline: 500,
      subheadline: 400,
      body: 400,
      cta: 500,
    },
  },

  // Screenshot effects
  screenshot: {
    effect: 'slow-pan' as const,
    scale: { start: 1.08, end: 1.02 },
    overlayOpacity: 0.05,
    borderRadius: 4,
    shadow: '0 25px 70px rgba(0, 0, 0, 0.25)',
  },

  // Logo animation
  logo: {
    enterType: 'elegant-reveal' as const,
    enterDuration: secondsToFrames(1),
    glowIntensity: 0.1,
  },

  // Background
  background: {
    gradientAngle: 180,
    gradientStops: 2, // Simpler, more elegant
    animateGradient: true,
    gradientSpeed: 0.3, // Very slow
    particleCount: 0,
    overlayPattern: 'subtle-noise' as const,
  },

  // Transitions between scenes
  transitions: {
    type: 'smooth-fade' as const,
    duration: secondsToFrames(0.8),
  },

  // CTA button style
  cta: {
    borderRadius: 4, // Subtle rounding
    paddingX: 52,
    paddingY: 18,
    shadow: '0 6px 25px rgba(0, 0, 0, 0.15)',
    hoverScale: 1,
    pulseAnimation: false,
  },

  // Stats counter
  stats: {
    counterDuration: secondsToFrames(2), // Slow, deliberate counting
    counterEasing: easeInOutQuart,
    separatorStyle: 'dot' as const,
    layout: 'horizontal' as const,
  },
};

export type ProfessionalStyle = typeof professionalStyle;
