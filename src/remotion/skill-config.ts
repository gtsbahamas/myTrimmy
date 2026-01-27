// src/remotion/skill-config.ts
// Promo Video Mastery Skill - Codified as enforced configuration
// Source: .agents/skills/promo-video-mastery/skill.md

import { secondsToFrames } from './utils/timing';

/**
 * Video Duration Guidelines
 * Per skill: 60-90 seconds ideal for SaaS explainers
 */
export const DURATION_GUIDELINES = {
  heroLoop: { min: secondsToFrames(3), max: secondsToFrames(10) },
  productTeaser: { min: secondsToFrames(15), max: secondsToFrames(45) },
  saasExplainer: { min: secondsToFrames(60), max: secondsToFrames(120) },
  featureDemo: { min: secondsToFrames(120), max: secondsToFrames(300) },
} as const;

/**
 * Critical timing: First 15 seconds are make-or-break
 */
export const HOOK_WINDOW_FRAMES = secondsToFrames(15);

/**
 * Scene Duration Standards (in frames at 30fps)
 * Per skill: optimized for 60-90 second explainers
 */
export const SCENE_DURATIONS = {
  intro: { min: secondsToFrames(3), ideal: secondsToFrames(4), max: secondsToFrames(5) },
  problem: { min: secondsToFrames(5), ideal: secondsToFrames(7), max: secondsToFrames(10) },
  feature: { min: secondsToFrames(4), ideal: secondsToFrames(5), max: secondsToFrames(6) },
  stats: { min: secondsToFrames(4), ideal: secondsToFrames(4.5), max: secondsToFrames(5) },
  screenshot: { min: secondsToFrames(5), ideal: secondsToFrames(6), max: secondsToFrames(7) },
  cta: { min: secondsToFrames(4), ideal: secondsToFrames(5), max: secondsToFrames(6) },
} as const;

/**
 * Animation Timing Standards
 * Per skill: micro-interactions, element animations, transitions
 */
export const ANIMATION_TIMING = {
  // Micro-interactions (UI polish)
  micro: {
    buttonHover: { min: 3, max: 5 },      // 100-150ms
    iconChange: { min: 5, max: 6 },        // 150-200ms
    tooltipAppear: { min: 6, max: 8 },     // 200-250ms
    loadingSpinner: { min: 9, max: 12 },   // 300-400ms
  },
  // Element animations
  element: {
    textFadeIn: { min: 12, max: 15 },      // 400-500ms
    textSlideUp: { min: 12, max: 18 },     // 400-600ms
    logoReveal: { min: 18, max: 24 },      // 600-800ms
    screenshotZoom: { min: 15, max: 21 },  // 500-700ms
    counterTick: { min: 1, max: 2 },       // 50ms per digit
    counterTotal: { min: 30, max: 45 },    // 1-1.5 seconds
  },
  // Scene transitions
  transition: {
    fade: { min: 12, max: 18 },            // 400-600ms
    slide: { min: 9, max: 15 },            // 300-500ms
    wipe: { min: 12, max: 18 },            // 400-600ms
    zoom: { min: 15, max: 21 },            // 500-700ms
    default: 15,                            // 500ms recommended
  },
} as const;

/**
 * Spring Animation Configs
 * Per skill: match spring config to brand personality
 */
export const SPRING_CONFIGS = {
  // Smooth, professional (Stripe/Linear style)
  smooth: { damping: 200 },

  // Snappy, responsive (Vercel style)
  snappy: { damping: 20, stiffness: 200 },

  // Bouncy, playful (consumer apps)
  bouncy: { damping: 8 },

  // Subtle overshoot (premium feel)
  elegant: { damping: 15, stiffness: 120 },
} as const;

/**
 * Spring config selection by use case
 */
export const SPRING_USE_CASES = {
  textReveal: SPRING_CONFIGS.smooth,
  fade: SPRING_CONFIGS.smooth,
  subtleMotion: SPRING_CONFIGS.smooth,
  uiInteraction: SPRING_CONFIGS.snappy,
  quickReveal: SPRING_CONFIGS.snappy,
  headline: SPRING_CONFIGS.bouncy,
  cta: SPRING_CONFIGS.bouncy,
  attentionGrabber: SPRING_CONFIGS.bouncy,
  logoReveal: SPRING_CONFIGS.elegant,
  premiumMoment: SPRING_CONFIGS.elegant,
} as const;

/**
 * Transition rest threshold for cleaner cutoffs
 * Per skill: 0.001 recommended for smooth transitions
 */
export const TRANSITION_REST_THRESHOLD = 0.001;

/**
 * Typography scale by format
 * Per skill: Portrait needs 1.3x larger fonts
 */
export const TYPOGRAPHY_SCALE = {
  landscape: {
    headline: { min: 64, max: 96 },
    subheadline: { min: 36, max: 48 },
    body: { min: 24, max: 32 },
    caption: { min: 18, max: 24 },
  },
  portrait: {
    headline: { min: 48, max: 72 },
    subheadline: { min: 28, max: 36 },
    body: { min: 18, max: 24 },
    caption: { min: 14, max: 18 },
  },
  square: {
    headline: { min: 56, max: 84 },
    subheadline: { min: 32, max: 42 },
    body: { min: 21, max: 28 },
    caption: { min: 16, max: 21 },
  },
} as const;

/**
 * Stagger delay between elements (in frames)
 * Per skill: 100-150ms apart for lists
 */
export const STAGGER_DELAYS = {
  listItems: 4,        // ~133ms at 30fps
  textLines: 8,        // ~267ms at 30fps
  statsLabels: 3,      // ~100ms at 30fps
} as const;

/**
 * Maximum features to show
 * Per skill: Focus on 3-5 key features
 */
export const MAX_FEATURES = 5;

/**
 * Video structure validation
 */
export const STRUCTURE_RULES = {
  // One idea per scene
  maxIdeasPerScene: 1,
  // Max features to highlight
  maxFeatures: 5,
  // Must have CTA
  requiresCta: true,
  // Hook must be in first N seconds
  hookWindowSeconds: 15,
} as const;

export type SpringConfigName = keyof typeof SPRING_CONFIGS;
export type SpringUseCase = keyof typeof SPRING_USE_CASES;
