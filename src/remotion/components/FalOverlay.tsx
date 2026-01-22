// src/remotion/components/FalOverlay.tsx

import { AbsoluteFill, Video, useCurrentFrame, interpolate as remotionInterpolate, Easing } from 'remotion';
import type { StyleConfig } from '../styles';
import type { VideoFormat } from '../utils/safeZones';
import { FORMAT_DIMENSIONS } from '../utils/safeZones';

interface FalOverlayProps {
  src: string;
  style: StyleConfig;
  format: VideoFormat;
  delay?: number;
  durationInFrames?: number;
  blendMode?: 'normal' | 'overlay' | 'screen' | 'multiply' | 'soft-light';
  opacity?: number;
}

/**
 * Overlay component for Fal.ai generated video clips
 * Used for AI-generated flourishes, transitions, and backgrounds
 */
export function FalOverlay({
  src,
  style,
  format,
  delay = 0,
  durationInFrames = 90,
  blendMode = 'normal',
  opacity = 1,
}: FalOverlayProps) {
  const frame = useCurrentFrame();
  const dims = FORMAT_DIMENSIONS[format];

  const enterDuration = style.transitionDuration;
  const exitDuration = style.transitionDuration;

  // Fade in
  const fadeIn = remotionInterpolate(
    frame,
    [delay, delay + enterDuration],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    }
  );

  // Fade out
  const fadeOut = remotionInterpolate(
    frame,
    [delay + durationInFrames - exitDuration, delay + durationInFrames],
    [1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.in(Easing.cubic),
    }
  );

  // Combined opacity
  const computedOpacity = Math.min(fadeIn, fadeOut) * opacity;

  // Don't render if not visible
  if (frame < delay || frame > delay + durationInFrames) {
    return null;
  }

  return (
    <AbsoluteFill
      style={{
        opacity: computedOpacity,
        mixBlendMode: blendMode,
      }}
    >
      <Video
        src={src}
        style={{
          width: dims.width,
          height: dims.height,
          objectFit: 'cover',
        }}
        startFrom={0}
      />
    </AbsoluteFill>
  );
}

/**
 * Full-screen Fal.ai video background
 */
interface FalBackgroundProps {
  src: string;
  format: VideoFormat;
  opacity?: number;
  blur?: number;
}

export function FalBackground({
  src,
  format,
  opacity = 0.3,
  blur = 0,
}: FalBackgroundProps) {
  const dims = FORMAT_DIMENSIONS[format];

  return (
    <AbsoluteFill
      style={{
        opacity,
        filter: blur > 0 ? `blur(${blur}px)` : undefined,
      }}
    >
      <Video
        src={src}
        style={{
          width: dims.width,
          height: dims.height,
          objectFit: 'cover',
        }}
        loop
      />
    </AbsoluteFill>
  );
}

/**
 * Fal.ai video as a masked transition element
 */
interface FalTransitionProps {
  src: string;
  style: StyleConfig;
  format: VideoFormat;
  startFrame: number;
  direction?: 'left' | 'right' | 'up' | 'down';
}

export function FalTransition({
  src,
  style,
  format,
  startFrame,
  direction = 'right',
}: FalTransitionProps) {
  const frame = useCurrentFrame();
  const dims = FORMAT_DIMENSIONS[format];

  const transitionDuration = style.transitions.duration;

  const progress = remotionInterpolate(
    frame,
    [startFrame, startFrame + transitionDuration],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: style.moveEasing,
    }
  );

  // Calculate clip path based on direction
  let clipPath = '';
  switch (direction) {
    case 'left':
      clipPath = `inset(0 ${(1 - progress) * 100}% 0 0)`;
      break;
    case 'right':
      clipPath = `inset(0 0 0 ${(1 - progress) * 100}%)`;
      break;
    case 'up':
      clipPath = `inset(${(1 - progress) * 100}% 0 0 0)`;
      break;
    case 'down':
      clipPath = `inset(0 0 ${(1 - progress) * 100}% 0)`;
      break;
  }

  if (frame < startFrame || progress >= 1) {
    return null;
  }

  return (
    <AbsoluteFill
      style={{
        clipPath,
      }}
    >
      <Video
        src={src}
        style={{
          width: dims.width,
          height: dims.height,
          objectFit: 'cover',
        }}
      />
    </AbsoluteFill>
  );
}

/**
 * Particle/effect overlay from Fal.ai
 * Typically used for sparkles, confetti, etc.
 */
interface FalEffectProps {
  src: string;
  style: StyleConfig;
  format: VideoFormat;
  delay?: number;
  scale?: number;
  position?: { x: number; y: number };
}

export function FalEffect({
  src,
  style,
  format,
  delay = 0,
  scale = 1,
  position = { x: 0.5, y: 0.5 },
}: FalEffectProps) {
  const frame = useCurrentFrame();
  const dims = FORMAT_DIMENSIONS[format];

  const fadeIn = remotionInterpolate(
    frame,
    [delay, delay + 15],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  if (frame < delay) {
    return null;
  }

  return (
    <AbsoluteFill
      style={{
        opacity: fadeIn,
        mixBlendMode: 'screen',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: `${position.x * 100}%`,
          top: `${position.y * 100}%`,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        <Video
          src={src}
          style={{
            width: dims.width * 0.5,
            height: dims.height * 0.5,
            objectFit: 'contain',
          }}
        />
      </div>
    </AbsoluteFill>
  );
}
