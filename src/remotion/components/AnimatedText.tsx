// src/remotion/components/AnimatedText.tsx
// Uses Remotion Skills best practices: spring animations for natural motion

import { useCurrentFrame, useVideoConfig, interpolate as remotionInterpolate, spring, Easing } from 'remotion';
import type { StyleConfig } from '../styles';

// Remotion Skills recommended spring configs
const SPRING_CONFIGS = {
  smooth: { damping: 200 }, // Smooth, no bounce (subtle reveals)
  snappy: { damping: 20, stiffness: 200 }, // Snappy, minimal bounce (UI elements)
  bouncy: { damping: 8 }, // Bouncy entrance (playful animations)
};

interface AnimatedTextProps {
  children: string;
  style: StyleConfig;
  delay?: number;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  maxWidth?: number;
  className?: string;
}

export function AnimatedText({
  children,
  style,
  delay = 0,
  fontSize = 48,
  fontWeight,
  color = '#ffffff',
  textAlign = 'center',
  maxWidth,
  className,
}: AnimatedTextProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const { enterType, enterDistance, letterSpacing, lineHeight } = style.text;
  const enterDuration = style.textEnterDuration;

  // Calculate enter animation progress using interpolate for opacity
  const progress = remotionInterpolate(
    frame,
    [delay, delay + enterDuration],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    }
  );

  // Per Remotion Skills: Use spring for position/scale animations - more natural motion
  const springProgress = spring({
    frame: frame - delay,
    fps,
    config: SPRING_CONFIGS.smooth,
    durationInFrames: enterDuration,
  });

  // Calculate opacity
  const opacity = progress;

  // Calculate transform based on enter type
  let transform = '';
  const enterTypeValue = enterType as string;
  switch (enterTypeValue) {
    case 'fade':
      // Just fade, no movement
      break;
    case 'slide-up': {
      // Per Remotion Skills: Use spring for position animations
      const translateY = remotionInterpolate(springProgress, [0, 1], [enterDistance, 0]);
      transform = `translateY(${translateY}px)`;
      break;
    }
    case 'fade-slide': {
      // Per Remotion Skills: Use spring for smoother slide
      const slideY = remotionInterpolate(springProgress, [0, 1], [enterDistance * 0.5, 0]);
      transform = `translateY(${slideY}px)`;
      break;
    }
    case 'scale-bounce': {
      // Per Remotion Skills: Use bouncy spring for playful scale animations
      const bouncySpring = spring({
        frame: frame - delay,
        fps,
        config: SPRING_CONFIGS.bouncy,
        durationInFrames: enterDuration,
      });
      const scaleVal = remotionInterpolate(bouncySpring, [0, 1], [0.8, 1]);
      transform = `scale(${scaleVal})`;
      break;
    }
    default:
      break;
  }

  return (
    <div
      className={className}
      style={{
        opacity,
        transform,
        fontSize,
        fontWeight: fontWeight || style.text.fontWeight.body,
        color,
        textAlign,
        letterSpacing: `${letterSpacing}em`,
        lineHeight,
        maxWidth: maxWidth ? `${maxWidth}px` : undefined,
        margin: maxWidth ? '0 auto' : undefined,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Animated headline with larger font and different weight
 */
interface AnimatedHeadlineProps extends Omit<AnimatedTextProps, 'fontSize' | 'fontWeight'> {
  size?: number;
}

export function AnimatedHeadline({
  children,
  style,
  size,
  ...props
}: AnimatedHeadlineProps) {
  return (
    <AnimatedText
      {...props}
      style={style}
      fontSize={size || 72}
      fontWeight={style.text.fontWeight.headline}
    >
      {children}
    </AnimatedText>
  );
}

/**
 * Animated subheadline
 */
export function AnimatedSubheadline({
  children,
  style,
  size,
  ...props
}: AnimatedHeadlineProps) {
  return (
    <AnimatedText
      {...props}
      style={style}
      fontSize={size || 36}
      fontWeight={style.text.fontWeight.subheadline}
    >
      {children}
    </AnimatedText>
  );
}

/**
 * Counter animation for stats
 */
interface AnimatedCounterProps {
  value: string;
  style: StyleConfig;
  delay?: number;
  fontSize?: number;
  color?: string;
}

export function AnimatedCounter({
  value,
  style,
  delay = 0,
  fontSize = 72,
  color = '#ffffff',
}: AnimatedCounterProps) {
  const frame = useCurrentFrame();

  // EDGE-001 FIX: Validate and extract numeric part safely
  const match = value.match(/^([\d,.]+)(.*)$/);

  // If not a numeric value, just display as static text with fade-in
  if (!match) {
    const opacity = remotionInterpolate(
      frame,
      [delay, delay + style.textEnterDuration],
      [0, 1],
      {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }
    );

    return (
      <div
        style={{
          opacity,
          fontSize,
          fontWeight: 700,
          color,
        }}
      >
        {value}
      </div>
    );
  }

  const numericPart = match[1];
  const suffix = match[2];

  // Parse the number
  const cleanedNumeric = numericPart.replace(/,/g, '');
  const targetNumber = parseFloat(cleanedNumeric);

  // Handle NaN edge case (shouldn't happen after regex, but be safe)
  if (Number.isNaN(targetNumber)) {
    const opacity = remotionInterpolate(
      frame,
      [delay, delay + style.textEnterDuration],
      [0, 1],
      {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }
    );

    return (
      <div
        style={{
          opacity,
          fontSize,
          fontWeight: 700,
          color,
        }}
      >
        {value}
      </div>
    );
  }

  const hasDecimals = numericPart.includes('.');
  const decimalPlaces = hasDecimals ? (numericPart.split('.')[1]?.length || 0) : 0;

  const { counterDuration, counterEasing } = style.stats;

  // Calculate counter progress
  const progress = remotionInterpolate(
    frame,
    [delay, delay + counterDuration],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  // Apply easing
  const easedProgress = counterEasing(progress);

  // Calculate current display value
  const currentNumber = targetNumber * easedProgress;
  const displayNumber = hasDecimals
    ? currentNumber.toFixed(decimalPlaces)
    : Math.round(currentNumber).toLocaleString();

  // Opacity animation
  const opacity = remotionInterpolate(
    frame,
    [delay, delay + style.textEnterDuration],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  return (
    <div
      style={{
        opacity,
        fontSize,
        fontWeight: 700,
        color,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {displayNumber}
      {suffix}
    </div>
  );
}
