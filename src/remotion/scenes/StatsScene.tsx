// src/remotion/scenes/StatsScene.tsx

import { AbsoluteFill, useCurrentFrame } from 'remotion';
import type { ColorPalette } from '@/types/video-bundle';
import type { StyleConfig } from '../styles';
import type { VideoFormat } from '../utils/safeZones';
import { GradientBackground } from '../components/GradientBackground';
import { AnimatedHeadline, AnimatedText, AnimatedCounter } from '../components/AnimatedText';
import { CenteredContent } from '../components/SafeZone';
import { getTypographyScale } from '../utils/safeZones';

interface Stat {
  value: string;
  label: string;
}

interface StatsSceneProps {
  title?: string;
  stats: Stat[];
  colors: ColorPalette;
  style: StyleConfig;
  format: VideoFormat;
  layout?: 'horizontal' | 'vertical' | 'grid' | 'stacked';
}

export function StatsScene({
  title,
  stats,
  colors,
  style,
  format,
  layout,
}: StatsSceneProps) {
  const frame = useCurrentFrame();
  const typography = getTypographyScale(format);

  // Use style's layout preference or default based on format
  const effectiveLayout = layout || style.stats.layout || (format === 'portrait' ? 'vertical' : 'horizontal');

  // Calculate stagger delays
  const titleDelay = 0;
  const statsBaseDelay = title ? style.textEnterDuration : 0;
  const statsStagger = style.textEnterDuration * 0.3;

  return (
    <AbsoluteFill>
      <GradientBackground colors={colors} style={style} />

      <CenteredContent format={format}>
        {/* Title */}
        {title && (
          <div style={{ marginBottom: 60 }}>
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
        )}

        {/* Stats */}
        <StatsContainer
          stats={stats}
          colors={colors}
          style={style}
          format={format}
          layout={effectiveLayout}
          baseDelay={statsBaseDelay}
          stagger={statsStagger}
        />
      </CenteredContent>
    </AbsoluteFill>
  );
}

interface StatsContainerProps {
  stats: Stat[];
  colors: ColorPalette;
  style: StyleConfig;
  format: VideoFormat;
  layout: 'horizontal' | 'vertical' | 'grid' | 'stacked';
  baseDelay: number;
  stagger: number;
}

function StatsContainer({
  stats,
  colors,
  style,
  format,
  layout,
  baseDelay,
  stagger,
}: StatsContainerProps) {
  const typography = getTypographyScale(format);
  const separator = style.stats.separatorStyle;

  // Limit stats based on layout and format
  const maxStats = format === 'portrait' ? 3 : 4;
  const displayStats = stats.slice(0, maxStats);

  if (layout === 'vertical') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 50,
          alignItems: 'center',
        }}
      >
        {displayStats.map((stat, index) => (
          <StatItem
            key={index}
            stat={stat}
            colors={colors}
            style={style}
            typography={typography}
            delay={baseDelay + index * stagger}
            separator={separator}
            isLast={index === displayStats.length - 1}
            orientation="vertical"
          />
        ))}
      </div>
    );
  }

  if (layout === 'grid') {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 60,
          maxWidth: 800,
        }}
      >
        {displayStats.map((stat, index) => (
          <StatItem
            key={index}
            stat={stat}
            colors={colors}
            style={style}
            typography={typography}
            delay={baseDelay + index * stagger}
            separator="none"
            isLast={true}
            orientation="vertical"
          />
        ))}
      </div>
    );
  }

  if (layout === 'stacked') {
    // Stacked layout - compact vertical with less gap
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 30,
          alignItems: 'center',
        }}
      >
        {displayStats.map((stat, index) => (
          <StatItem
            key={index}
            stat={stat}
            colors={colors}
            style={style}
            typography={typography}
            delay={baseDelay + index * stagger}
            separator={separator}
            isLast={index === displayStats.length - 1}
            orientation="vertical"
          />
        ))}
      </div>
    );
  }

  // Horizontal layout (default)
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: 60,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {displayStats.map((stat, index) => (
        <StatItem
          key={index}
          stat={stat}
          colors={colors}
          style={style}
          typography={typography}
          delay={baseDelay + index * stagger}
          separator={separator}
          isLast={index === displayStats.length - 1}
          orientation="horizontal"
        />
      ))}
    </div>
  );
}

interface StatItemProps {
  stat: Stat;
  colors: ColorPalette;
  style: StyleConfig;
  typography: ReturnType<typeof getTypographyScale>;
  delay: number;
  separator: string;
  isLast: boolean;
  orientation: 'horizontal' | 'vertical';
}

function StatItem({
  stat,
  colors,
  style,
  typography,
  delay,
  separator,
  isLast,
  orientation,
}: StatItemProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: orientation === 'horizontal' ? 'row' : 'column',
        alignItems: 'center',
        gap: orientation === 'horizontal' ? 60 : 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* Animated counter for the value */}
        <AnimatedCounter
          value={stat.value}
          style={style}
          delay={delay}
          fontSize={typography.headline * 1.2}
          color={colors.primary}
        />

        {/* Label */}
        <div style={{ marginTop: 12 }}>
          <AnimatedText
            style={style}
            delay={delay + 15}
            fontSize={typography.body}
            color={colors.secondary}
            textAlign="center"
          >
            {stat.label}
          </AnimatedText>
        </div>
      </div>

      {/* Separator */}
      {!isLast && orientation === 'horizontal' && separator !== 'none' && (
        <Separator type={separator} color={colors.secondary} />
      )}
    </div>
  );
}

interface SeparatorProps {
  type: string;
  color: string;
}

function Separator({ type, color }: SeparatorProps) {
  if (type === 'dot') {
    return (
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: color,
          opacity: 0.5,
        }}
      />
    );
  }

  if (type === 'line') {
    return (
      <div
        style={{
          width: 1,
          height: 60,
          backgroundColor: color,
          opacity: 0.3,
        }}
      />
    );
  }

  if (type === 'slash') {
    return (
      <div
        style={{
          fontSize: 36,
          color,
          opacity: 0.3,
        }}
      >
        /
      </div>
    );
  }

  return null;
}

/**
 * Single stat highlight scene
 */
interface SingleStatProps {
  value: string;
  label: string;
  context?: string;
  colors: ColorPalette;
  style: StyleConfig;
  format: VideoFormat;
}

export function SingleStat({
  value,
  label,
  context,
  colors,
  style,
  format,
}: SingleStatProps) {
  const typography = getTypographyScale(format);

  return (
    <AbsoluteFill>
      <GradientBackground colors={colors} style={style} />

      <CenteredContent format={format}>
        <AnimatedCounter
          value={value}
          style={style}
          delay={0}
          fontSize={typography.headline * 2}
          color={colors.primary}
        />

        <div style={{ marginTop: 20 }}>
          <AnimatedText
            style={style}
            delay={20}
            fontSize={typography.subheadline}
            color={colors.text}
            textAlign="center"
          >
            {label}
          </AnimatedText>
        </div>

        {context && (
          <div style={{ marginTop: 30 }}>
            <AnimatedText
              style={style}
              delay={30}
              fontSize={typography.body}
              color={colors.secondary}
              textAlign="center"
              maxWidth={600}
            >
              {context}
            </AnimatedText>
          </div>
        )}
      </CenteredContent>
    </AbsoluteFill>
  );
}
