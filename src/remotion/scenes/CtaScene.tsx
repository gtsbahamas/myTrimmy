// src/remotion/scenes/CtaScene.tsx

import { AbsoluteFill, useCurrentFrame, interpolate as remotionInterpolate, Easing } from 'remotion';
import type { ColorPalette } from '@/types/video-bundle';
import type { StyleConfig } from '../styles';
import type { VideoFormat } from '../utils/safeZones';
import { GradientBackground } from '../components/GradientBackground';
import { AnimatedHeadline, AnimatedText } from '../components/AnimatedText';
import { LogoReveal } from '../components/LogoReveal';
import { CenteredContent } from '../components/SafeZone';
import { FalOverlay } from '../components/FalOverlay';
import { getTypographyScale } from '../utils/safeZones';

interface CtaSceneProps {
  headline: string;
  buttonText: string;
  subtext?: string;
  logoUrl?: string;
  colors: ColorPalette;
  style: StyleConfig;
  format: VideoFormat;
  falVideoUrl?: string; // Optional AI-generated outro
}

export function CtaScene({
  headline,
  buttonText,
  subtext,
  logoUrl,
  colors,
  style,
  format,
  falVideoUrl,
}: CtaSceneProps) {
  const frame = useCurrentFrame();
  const typography = getTypographyScale(format);

  // Delays
  const headlineDelay = 0;
  const buttonDelay = style.textEnterDuration;
  const subtextDelay = buttonDelay + style.textEnterDuration * 0.5;
  const logoDelay = subtextDelay + style.textEnterDuration * 0.3;

  return (
    <AbsoluteFill>
      {/* Background */}
      <GradientBackground colors={colors} style={style} />

      {/* Optional Fal.ai outro video overlay */}
      {falVideoUrl && (
        <FalOverlay
          src={falVideoUrl}
          style={style}
          format={format}
          delay={0}
          durationInFrames={style.sceneDefaults.cta}
          blendMode="overlay"
          opacity={0.3}
        />
      )}

      {/* Content */}
      <CenteredContent format={format}>
        {/* Headline */}
        <AnimatedHeadline
          style={style}
          delay={headlineDelay}
          size={typography.headline}
          color={colors.text}
          textAlign="center"
          maxWidth={format === 'portrait' ? 800 : 1000}
        >
          {headline}
        </AnimatedHeadline>

        {/* CTA Button */}
        <div style={{ marginTop: 40 }}>
          <CtaButton
            text={buttonText}
            colors={colors}
            style={style}
            delay={buttonDelay}
            format={format}
          />
        </div>

        {/* Subtext */}
        {subtext && (
          <div style={{ marginTop: 24 }}>
            <AnimatedText
              style={style}
              delay={subtextDelay}
              fontSize={typography.body}
              color={colors.secondary}
              textAlign="center"
            >
              {subtext}
            </AnimatedText>
          </div>
        )}

        {/* Logo */}
        {logoUrl && (
          <div style={{ marginTop: 50 }}>
            <LogoReveal
              src={logoUrl}
              style={style}
              format={format}
              delay={logoDelay}
            />
          </div>
        )}
      </CenteredContent>
    </AbsoluteFill>
  );
}

interface CtaButtonProps {
  text: string;
  colors: ColorPalette;
  style: StyleConfig;
  delay: number;
  format: VideoFormat;
}

function CtaButton({
  text,
  colors,
  style,
  delay,
  format,
}: CtaButtonProps) {
  const frame = useCurrentFrame();
  const typography = getTypographyScale(format);

  const { borderRadius, paddingX, paddingY, shadow, hoverScale, pulseAnimation } = style.cta;

  // Enter animation
  const enterProgress = remotionInterpolate(
    frame,
    [delay, delay + style.textEnterDuration],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.back(1.2)),
    }
  );

  const opacity = enterProgress;
  let scale = remotionInterpolate(enterProgress, [0, 1], [0.8, 1]);

  // Pulse animation (if enabled by style)
  if (pulseAnimation && enterProgress >= 1) {
    const pulseFrame = frame - delay - style.textEnterDuration;
    const pulse = Math.sin(pulseFrame * 0.1) * 0.02;
    scale = 1 + pulse;
  }

  // Glow animation
  const glowOpacity = remotionInterpolate(
    frame,
    [delay + style.textEnterDuration, delay + style.textEnterDuration + 30],
    [0, 0.4],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-block',
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      {/* Glow effect */}
      <div
        style={{
          position: 'absolute',
          inset: -10,
          borderRadius: borderRadius + 10,
          background: colors.accent,
          filter: 'blur(20px)',
          opacity: glowOpacity,
        }}
      />

      {/* Button */}
      <div
        style={{
          position: 'relative',
          backgroundColor: colors.accent,
          color: colors.text,
          fontSize: typography.body * 1.1,
          fontWeight: style.text.fontWeight.cta,
          paddingLeft: paddingX,
          paddingRight: paddingX,
          paddingTop: paddingY,
          paddingBottom: paddingY,
          borderRadius,
          boxShadow: shadow,
          textAlign: 'center',
          letterSpacing: '0.02em',
        }}
      >
        {text}
      </div>
    </div>
  );
}

/**
 * Simple CTA with just text and URL
 */
interface SimpleCtaProps {
  headline: string;
  url: string;
  colors: ColorPalette;
  style: StyleConfig;
  format: VideoFormat;
}

export function SimpleCta({
  headline,
  url,
  colors,
  style,
  format,
}: SimpleCtaProps) {
  const typography = getTypographyScale(format);

  return (
    <AbsoluteFill>
      <GradientBackground colors={colors} style={style} />

      <CenteredContent format={format}>
        <AnimatedHeadline
          style={style}
          delay={0}
          size={typography.headline * 0.9}
          color={colors.text}
          textAlign="center"
        >
          {headline}
        </AnimatedHeadline>

        <div style={{ marginTop: 30 }}>
          <AnimatedText
            style={style}
            delay={style.textEnterDuration}
            fontSize={typography.subheadline}
            color={colors.accent}
            textAlign="center"
          >
            {url}
          </AnimatedText>
        </div>
      </CenteredContent>
    </AbsoluteFill>
  );
}

/**
 * Social CTA with handles/links
 */
interface SocialCtaProps {
  headline: string;
  socials: Array<{ platform: string; handle: string }>;
  colors: ColorPalette;
  style: StyleConfig;
  format: VideoFormat;
}

export function SocialCta({
  headline,
  socials,
  colors,
  style,
  format,
}: SocialCtaProps) {
  const typography = getTypographyScale(format);

  return (
    <AbsoluteFill>
      <GradientBackground colors={colors} style={style} />

      <CenteredContent format={format}>
        <AnimatedHeadline
          style={style}
          delay={0}
          size={typography.subheadline}
          color={colors.text}
          textAlign="center"
        >
          {headline}
        </AnimatedHeadline>

        <div
          style={{
            marginTop: 40,
            display: 'flex',
            flexDirection: format === 'portrait' ? 'column' : 'row',
            gap: 30,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {socials.slice(0, 3).map((social, index) => (
            <AnimatedText
              key={index}
              style={style}
              delay={style.textEnterDuration + index * 10}
              fontSize={typography.body}
              color={colors.secondary}
              textAlign="center"
            >
              {`${social.platform}: ${social.handle}`}
            </AnimatedText>
          ))}
        </div>
      </CenteredContent>
    </AbsoluteFill>
  );
}
