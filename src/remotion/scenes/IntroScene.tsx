// src/remotion/scenes/IntroScene.tsx

import { AbsoluteFill, useCurrentFrame } from 'remotion';
import type { ColorPalette } from '@/types/video-bundle';
import type { StyleConfig } from '../styles';
import type { VideoFormat } from '../utils/safeZones';
import { GradientBackground } from '../components/GradientBackground';
import { LogoReveal } from '../components/LogoReveal';
import { AnimatedHeadline, AnimatedSubheadline } from '../components/AnimatedText';
import { CenteredContent } from '../components/SafeZone';
import { FalBackground } from '../components/FalOverlay';
import { getTypographyScale } from '../utils/safeZones';

interface IntroSceneProps {
  headline: string;
  tagline?: string;
  logoUrl?: string;
  colors: ColorPalette;
  style: StyleConfig;
  format: VideoFormat;
  falVideoUrl?: string; // Optional AI-generated background
}

export function IntroScene({
  headline,
  tagline,
  logoUrl,
  colors,
  style,
  format,
  falVideoUrl,
}: IntroSceneProps) {
  const frame = useCurrentFrame();
  const typography = getTypographyScale(format);

  // Stagger delays for elements
  const logoDelay = 0;
  const headlineDelay = style.logo.enterDuration * 0.7;
  const taglineDelay = headlineDelay + style.textEnterDuration * 0.5;

  return (
    <AbsoluteFill>
      {/* Background - either Fal.ai video or gradient */}
      {falVideoUrl ? (
        <FalBackground
          src={falVideoUrl}
          format={format}
          opacity={0.4}
          blur={5}
        />
      ) : (
        <GradientBackground colors={colors} style={style} />
      )}

      {/* Gradient overlay for text readability */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, transparent 0%, ${colors.background}90 100%)`,
        }}
      />

      {/* Content */}
      <CenteredContent format={format}>
        {/* Logo */}
        {logoUrl && (
          <div style={{ marginBottom: 40 }}>
            <LogoReveal
              src={logoUrl}
              style={style}
              format={format}
              delay={logoDelay}
            />
          </div>
        )}

        {/* Headline */}
        <AnimatedHeadline
          style={style}
          delay={headlineDelay}
          size={typography.headline}
          color={colors.text}
          textAlign="center"
          maxWidth={format === 'portrait' ? 800 : 1200}
        >
          {headline}
        </AnimatedHeadline>

        {/* Tagline */}
        {tagline && (
          <div style={{ marginTop: 24 }}>
            <AnimatedSubheadline
              style={style}
              delay={taglineDelay}
              size={typography.subheadline}
              color={colors.secondary}
              textAlign="center"
              maxWidth={format === 'portrait' ? 700 : 1000}
            >
              {tagline}
            </AnimatedSubheadline>
          </div>
        )}
      </CenteredContent>
    </AbsoluteFill>
  );
}

/**
 * Minimal intro - just logo reveal
 */
interface MinimalIntroProps {
  logoUrl: string;
  colors: ColorPalette;
  style: StyleConfig;
  format: VideoFormat;
}

export function MinimalIntro({
  logoUrl,
  colors,
  style,
  format,
}: MinimalIntroProps) {
  return (
    <AbsoluteFill>
      <GradientBackground colors={colors} style={style} />
      <LogoReveal
        src={logoUrl}
        style={style}
        format={format}
        delay={15}
      />
    </AbsoluteFill>
  );
}

/**
 * Bold intro with full-screen text
 */
interface BoldIntroProps {
  headline: string;
  colors: ColorPalette;
  style: StyleConfig;
  format: VideoFormat;
}

export function BoldIntro({
  headline,
  colors,
  style,
  format,
}: BoldIntroProps) {
  const typography = getTypographyScale(format);

  return (
    <AbsoluteFill>
      <GradientBackground colors={colors} style={style} />

      <CenteredContent format={format}>
        <AnimatedHeadline
          style={style}
          delay={0}
          size={typography.headline * 1.5}
          color={colors.text}
          textAlign="center"
        >
          {headline}
        </AnimatedHeadline>
      </CenteredContent>
    </AbsoluteFill>
  );
}
