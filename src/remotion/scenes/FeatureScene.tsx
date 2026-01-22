// src/remotion/scenes/FeatureScene.tsx

import { AbsoluteFill, useCurrentFrame, Img } from 'remotion';
import type { ColorPalette } from '@/types/video-bundle';
import type { StyleConfig } from '../styles';
import type { VideoFormat } from '../utils/safeZones';
import { GradientBackground } from '../components/GradientBackground';
import { AnimatedHeadline, AnimatedText } from '../components/AnimatedText';
import { CenteredContent, SplitLayout, GridLayout } from '../components/SafeZone';
import { getTypographyScale } from '../utils/safeZones';

interface Feature {
  title: string;
  description: string;
  icon?: string;
}

interface FeatureSceneProps {
  title: string;
  features: Feature[];
  colors: ColorPalette;
  style: StyleConfig;
  format: VideoFormat;
  layout?: 'list' | 'grid' | 'single';
}

export function FeatureScene({
  title,
  features,
  colors,
  style,
  format,
  layout = 'list',
}: FeatureSceneProps) {
  const frame = useCurrentFrame();
  const typography = getTypographyScale(format);

  // Calculate stagger delays
  const titleDelay = 0;
  const featureBaseDelay = style.textEnterDuration;
  const featureStagger = style.textEnterDuration * 0.4;

  return (
    <AbsoluteFill>
      <GradientBackground colors={colors} style={style} />

      <CenteredContent format={format} verticalAlign="top">
        {/* Title */}
        <div style={{ marginTop: format === 'portrait' ? 100 : 60, marginBottom: 40 }}>
          <AnimatedHeadline
            style={style}
            delay={titleDelay}
            size={typography.subheadline}
            color={colors.text}
            textAlign="center"
          >
            {title}
          </AnimatedHeadline>
        </div>

        {/* Features */}
        {layout === 'list' && (
          <FeatureList
            features={features}
            colors={colors}
            style={style}
            format={format}
            baseDelay={featureBaseDelay}
            stagger={featureStagger}
          />
        )}

        {layout === 'grid' && (
          <FeatureGrid
            features={features}
            colors={colors}
            style={style}
            format={format}
            baseDelay={featureBaseDelay}
            stagger={featureStagger}
          />
        )}

        {layout === 'single' && features[0] && (
          <SingleFeature
            feature={features[0]}
            colors={colors}
            style={style}
            format={format}
            delay={featureBaseDelay}
          />
        )}
      </CenteredContent>
    </AbsoluteFill>
  );
}

interface FeatureListProps {
  features: Feature[];
  colors: ColorPalette;
  style: StyleConfig;
  format: VideoFormat;
  baseDelay: number;
  stagger: number;
}

function FeatureList({
  features,
  colors,
  style,
  format,
  baseDelay,
  stagger,
}: FeatureListProps) {
  const typography = getTypographyScale(format);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: format === 'portrait' ? 40 : 30,
        width: '100%',
        maxWidth: format === 'portrait' ? 800 : 1000,
        margin: '0 auto',
      }}
    >
      {features.slice(0, 4).map((feature, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 20,
          }}
        >
          {/* Icon */}
          {feature.icon && (
            <div
              style={{
                width: 48,
                height: 48,
                flexShrink: 0,
              }}
            >
              <Img
                src={feature.icon}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            </div>
          )}

          {/* Text */}
          <div style={{ flex: 1 }}>
            <AnimatedText
              style={style}
              delay={baseDelay + index * stagger}
              fontSize={typography.body * 1.2}
              fontWeight={600}
              color={colors.text}
              textAlign="left"
            >
              {feature.title}
            </AnimatedText>
            <div style={{ marginTop: 8 }}>
              <AnimatedText
                style={style}
                delay={baseDelay + index * stagger + 5}
                fontSize={typography.body}
                color={colors.secondary}
                textAlign="left"
              >
                {feature.description}
              </AnimatedText>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface FeatureGridProps {
  features: Feature[];
  colors: ColorPalette;
  style: StyleConfig;
  format: VideoFormat;
  baseDelay: number;
  stagger: number;
}

function FeatureGrid({
  features,
  colors,
  style,
  format,
  baseDelay,
  stagger,
}: FeatureGridProps) {
  const typography = getTypographyScale(format);
  const columns = format === 'portrait' ? 1 : 2;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 40,
        width: '100%',
        maxWidth: format === 'portrait' ? 700 : 1100,
        margin: '0 auto',
      }}
    >
      {features.slice(0, 4).map((feature, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            padding: 20,
          }}
        >
          {/* Icon */}
          {feature.icon && (
            <div
              style={{
                width: 64,
                height: 64,
                marginBottom: 16,
              }}
            >
              <Img
                src={feature.icon}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            </div>
          )}

          <AnimatedText
            style={style}
            delay={baseDelay + index * stagger}
            fontSize={typography.body * 1.1}
            fontWeight={600}
            color={colors.text}
            textAlign="center"
          >
            {feature.title}
          </AnimatedText>

          <div style={{ marginTop: 8 }}>
            <AnimatedText
              style={style}
              delay={baseDelay + index * stagger + 5}
              fontSize={typography.body * 0.9}
              color={colors.secondary}
              textAlign="center"
            >
              {feature.description}
            </AnimatedText>
          </div>
        </div>
      ))}
    </div>
  );
}

interface SingleFeatureProps {
  feature: Feature;
  colors: ColorPalette;
  style: StyleConfig;
  format: VideoFormat;
  delay: number;
}

function SingleFeature({
  feature,
  colors,
  style,
  format,
  delay,
}: SingleFeatureProps) {
  const typography = getTypographyScale(format);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        maxWidth: format === 'portrait' ? 700 : 900,
        margin: '0 auto',
      }}
    >
      {feature.icon && (
        <div
          style={{
            width: 120,
            height: 120,
            marginBottom: 32,
          }}
        >
          <Img
            src={feature.icon}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        </div>
      )}

      <AnimatedHeadline
        style={style}
        delay={delay}
        size={typography.headline * 0.8}
        color={colors.text}
        textAlign="center"
      >
        {feature.title}
      </AnimatedHeadline>

      <div style={{ marginTop: 20 }}>
        <AnimatedText
          style={style}
          delay={delay + 10}
          fontSize={typography.subheadline * 0.9}
          color={colors.secondary}
          textAlign="center"
          maxWidth={800}
        >
          {feature.description}
        </AnimatedText>
      </div>
    </div>
  );
}
