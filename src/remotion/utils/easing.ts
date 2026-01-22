// src/remotion/utils/easing.ts

/**
 * Custom easing functions for Remotion animations
 * All functions take a progress value (0-1) and return eased value (0-1)
 */

/**
 * Ease out cubic - fast start, slow end (smooth deceleration)
 */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Ease in cubic - slow start, fast end
 */
export function easeInCubic(t: number): number {
  return t * t * t;
}

/**
 * Ease in-out cubic - slow start and end
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Ease out expo - very fast start, very slow end (dramatic deceleration)
 */
export function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/**
 * Ease in expo - very slow start, very fast end
 */
export function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10);
}

/**
 * Ease out back - overshoots then settles (bouncy feel)
 */
export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

/**
 * Ease out elastic - spring-like overshoot
 */
export function easeOutElastic(t: number): number {
  const c4 = (2 * Math.PI) / 3;
  return t === 0
    ? 0
    : t === 1
    ? 1
    : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

/**
 * Ease out bounce - bouncing ball effect
 */
export function easeOutBounce(t: number): number {
  const n1 = 7.5625;
  const d1 = 2.75;

  if (t < 1 / d1) {
    return n1 * t * t;
  } else if (t < 2 / d1) {
    return n1 * (t -= 1.5 / d1) * t + 0.75;
  } else if (t < 2.5 / d1) {
    return n1 * (t -= 2.25 / d1) * t + 0.9375;
  } else {
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
}

/**
 * Linear - no easing
 */
export function linear(t: number): number {
  return t;
}

/**
 * Ease out quart - smoother than cubic
 */
export function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

/**
 * Ease in-out quart
 */
export function easeInOutQuart(t: number): number {
  return t < 0.5
    ? 8 * t * t * t * t
    : 1 - Math.pow(-2 * t + 2, 4) / 2;
}

/**
 * Style-specific easing presets
 */
export const STYLE_EASINGS = {
  minimal: {
    enter: easeOutCubic,
    exit: easeInCubic,
    move: easeInOutCubic,
  },
  energetic: {
    enter: easeOutBack,
    exit: easeInExpo,
    move: easeOutExpo,
  },
  professional: {
    enter: easeOutQuart,
    exit: easeInOutQuart,
    move: easeInOutQuart,
  },
} as const;

/**
 * Interpolate between two values with easing
 */
export function interpolate(
  progress: number,
  from: number,
  to: number,
  easingFn: (t: number) => number = easeOutCubic
): number {
  const easedProgress = easingFn(Math.max(0, Math.min(1, progress)));
  return from + (to - from) * easedProgress;
}

/**
 * Interpolate a color (hex) between two colors
 */
export function interpolateColor(
  progress: number,
  fromHex: string,
  toHex: string,
  easingFn: (t: number) => number = easeOutCubic
): string {
  const easedProgress = easingFn(Math.max(0, Math.min(1, progress)));

  const from = hexToRgb(fromHex);
  const to = hexToRgb(toHex);

  const r = Math.round(from.r + (to.r - from.r) * easedProgress);
  const g = Math.round(from.g + (to.g - from.g) * easedProgress);
  const b = Math.round(from.b + (to.b - from.b) * easedProgress);

  return rgbToHex(r, g, b);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}
