// src/remotion/components/GradientBackground.tsx

import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import type { ColorPalette } from '@/types/video-bundle';
import type { StyleConfig } from '../styles';
import { interpolate } from '../utils/easing';

interface GradientBackgroundProps {
  colors: ColorPalette;
  style: StyleConfig;
}

export function GradientBackground({ colors, style }: GradientBackgroundProps) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const { gradientAngle, gradientStops, animateGradient, gradientSpeed } =
    style.background;

  // Calculate animated angle if enabled
  const angle = animateGradient
    ? gradientAngle + (frame / durationInFrames) * 360 * gradientSpeed
    : gradientAngle;

  // Build gradient stops based on style
  const stops = buildGradientStops(colors, gradientStops);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${angle}deg, ${stops})`,
      }}
    />
  );
}

function buildGradientStops(colors: ColorPalette, stopCount: number): string {
  const colorList = [
    colors.background,
    colors.primary,
    colors.secondary,
    colors.accent,
  ];

  switch (stopCount) {
    case 2:
      return `${colors.background} 0%, ${adjustBrightness(colors.background, -10)} 100%`;
    case 3:
      return `${colors.background} 0%, ${adjustBrightness(colors.primary, -30)} 50%, ${adjustBrightness(colors.background, -15)} 100%`;
    case 4:
      return `${colors.background} 0%, ${adjustBrightness(colors.primary, -40)} 30%, ${adjustBrightness(colors.secondary, -30)} 70%, ${adjustBrightness(colors.background, -10)} 100%`;
    default:
      return `${colors.background} 0%, ${adjustBrightness(colors.background, -10)} 100%`;
  }
}

function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

/**
 * Gradient overlay for layering on top of content
 */
interface GradientOverlayProps {
  direction?: 'top' | 'bottom' | 'left' | 'right';
  color?: string;
  opacity?: number;
}

export function GradientOverlay({
  direction = 'bottom',
  color = '#000000',
  opacity = 0.5,
}: GradientOverlayProps) {
  const gradientDirection = {
    top: 'to bottom',
    bottom: 'to top',
    left: 'to right',
    right: 'to left',
  }[direction];

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${gradientDirection}, ${color}00 0%, ${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')} 100%)`,
        pointerEvents: 'none',
      }}
    />
  );
}
