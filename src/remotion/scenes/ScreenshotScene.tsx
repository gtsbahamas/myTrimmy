// src/remotion/scenes/ScreenshotScene.tsx

import { AbsoluteFill, useCurrentFrame } from 'remotion';
import type { ColorPalette } from '@/types/video-bundle';
import type { StyleConfig } from '../styles';
import type { VideoFormat } from '../utils/safeZones';
import { GradientBackground, GradientOverlay } from '../components/GradientBackground';
import { Screenshot, DeviceScreenshot } from '../components/Screenshot';
import { AnimatedHeadline, AnimatedText } from '../components/AnimatedText';
import { CenteredContent } from '../components/SafeZone';
import { getTypographyScale } from '../utils/safeZones';

interface ScreenshotSceneProps {
  screenshotUrl: string;
  title?: string;
  caption?: string;
  colors: ColorPalette;
  style: StyleConfig;
  format: VideoFormat;
  device?: 'browser' | 'phone' | 'tablet';
}

export function ScreenshotScene({
  screenshotUrl,
  title,
  caption,
  colors,
  style,
  format,
  device,
}: ScreenshotSceneProps) {
  const frame = useCurrentFrame();
  const typography = getTypographyScale(format);

  // Delays
  const titleDelay = 0;
  const screenshotDelay = title ? style.textEnterDuration * 0.7 : 0;
  const captionDelay = screenshotDelay + style.textEnterDuration;

  return (
    <AbsoluteFill>
      <GradientBackground colors={colors} style={style} />

      {/* Title at top */}
      {title && (
        <CenteredContent format={format} verticalAlign="top">
          <div style={{ marginTop: format === 'portrait' ? 80 : 50 }}>
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
        </CenteredContent>
      )}

      {/* Screenshot */}
      {device ? (
        <DeviceScreenshot
          src={screenshotUrl}
          style={style}
          format={format}
          device={device}
          caption={caption}
          delay={screenshotDelay}
        />
      ) : (
        <Screenshot
          src={screenshotUrl}
          style={style}
          format={format}
          caption={caption}
          delay={screenshotDelay}
        />
      )}

      {/* Gradient overlay for depth */}
      <GradientOverlay
        direction="bottom"
        color={colors.background}
        opacity={0.3}
      />
    </AbsoluteFill>
  );
}

/**
 * Side-by-side screenshot comparison
 */
interface ComparisonSceneProps {
  beforeUrl: string;
  afterUrl: string;
  beforeLabel?: string;
  afterLabel?: string;
  title?: string;
  colors: ColorPalette;
  style: StyleConfig;
  format: VideoFormat;
}

export function ComparisonScene({
  beforeUrl,
  afterUrl,
  beforeLabel = 'Before',
  afterLabel = 'After',
  title,
  colors,
  style,
  format,
}: ComparisonSceneProps) {
  const frame = useCurrentFrame();
  const typography = getTypographyScale(format);

  // Stagger the screenshots
  const titleDelay = 0;
  const beforeDelay = title ? style.textEnterDuration : 0;
  const afterDelay = beforeDelay + style.textEnterDuration * 0.5;

  // Portrait: stack vertically, landscape: side by side
  const isVertical = format === 'portrait';

  return (
    <AbsoluteFill>
      <GradientBackground colors={colors} style={style} />

      {/* Title */}
      {title && (
        <CenteredContent format={format} verticalAlign="top">
          <div style={{ marginTop: format === 'portrait' ? 60 : 40 }}>
            <AnimatedHeadline
              style={style}
              delay={titleDelay}
              size={typography.subheadline * 0.9}
              color={colors.text}
              textAlign="center"
            >
              {title}
            </AnimatedHeadline>
          </div>
        </CenteredContent>
      )}

      {/* Comparison container */}
      <CenteredContent format={format}>
        <div
          style={{
            display: 'flex',
            flexDirection: isVertical ? 'column' : 'row',
            gap: isVertical ? 30 : 40,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: title ? 60 : 0,
          }}
        >
          {/* Before */}
          <ComparisonItem
            url={beforeUrl}
            label={beforeLabel}
            style={style}
            format={format}
            colors={colors}
            delay={beforeDelay}
            isVertical={isVertical}
          />

          {/* Divider */}
          {!isVertical && (
            <div
              style={{
                width: 2,
                height: '60%',
                backgroundColor: colors.secondary,
                opacity: 0.3,
              }}
            />
          )}

          {/* After */}
          <ComparisonItem
            url={afterUrl}
            label={afterLabel}
            style={style}
            format={format}
            colors={colors}
            delay={afterDelay}
            isVertical={isVertical}
          />
        </div>
      </CenteredContent>
    </AbsoluteFill>
  );
}

interface ComparisonItemProps {
  url: string;
  label: string;
  style: StyleConfig;
  format: VideoFormat;
  colors: ColorPalette;
  delay: number;
  isVertical: boolean;
}

function ComparisonItem({
  url,
  label,
  style,
  format,
  colors,
  delay,
  isVertical,
}: ComparisonItemProps) {
  const typography = getTypographyScale(format);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flex: 1,
        maxWidth: isVertical ? '90%' : '45%',
      }}
    >
      <AnimatedText
        style={style}
        delay={delay}
        fontSize={typography.body * 0.9}
        color={colors.secondary}
        textAlign="center"
      >
        {label}
      </AnimatedText>

      <div style={{ marginTop: 15, width: '100%' }}>
        <Screenshot
          src={url}
          style={style}
          format={format}
          delay={delay + 10}
        />
      </div>
    </div>
  );
}

/**
 * Multiple screenshots in a showcase grid
 */
interface ShowcaseSceneProps {
  screenshots: Array<{ url: string; caption?: string }>;
  title?: string;
  colors: ColorPalette;
  style: StyleConfig;
  format: VideoFormat;
}

export function ShowcaseScene({
  screenshots,
  title,
  colors,
  style,
  format,
}: ShowcaseSceneProps) {
  const frame = useCurrentFrame();
  const typography = getTypographyScale(format);

  // Limit based on format
  const maxScreenshots = format === 'portrait' ? 2 : 3;
  const displayScreenshots = screenshots.slice(0, maxScreenshots);

  const titleDelay = 0;
  const screenshotBaseDelay = title ? style.textEnterDuration : 0;
  const screenshotStagger = style.textEnterDuration * 0.4;

  return (
    <AbsoluteFill>
      <GradientBackground colors={colors} style={style} />

      {/* Title */}
      {title && (
        <CenteredContent format={format} verticalAlign="top">
          <div style={{ marginTop: format === 'portrait' ? 60 : 40 }}>
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
        </CenteredContent>
      )}

      {/* Screenshots grid */}
      <CenteredContent format={format}>
        <div
          style={{
            display: 'flex',
            flexDirection: format === 'portrait' ? 'column' : 'row',
            gap: 30,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: title ? 40 : 0,
          }}
        >
          {displayScreenshots.map((screenshot, index) => (
            <div
              key={index}
              style={{
                flex: 1,
                maxWidth: format === 'portrait' ? '85%' : `${85 / displayScreenshots.length}%`,
              }}
            >
              <Screenshot
                src={screenshot.url}
                style={style}
                format={format}
                caption={screenshot.caption}
                delay={screenshotBaseDelay + index * screenshotStagger}
              />
            </div>
          ))}
        </div>
      </CenteredContent>
    </AbsoluteFill>
  );
}
