// src/remotion/compositions/PromoVideo.tsx

import { AbsoluteFill, Sequence, useVideoConfig } from 'remotion';
import type { VideoScene, ColorPalette, VideoScript } from '@/types/video-bundle';
import type { StyleConfig } from '../styles';
import type { VideoFormat } from '../utils/safeZones';
import { getStyleConfig } from '../styles';

// Scene components
import { IntroScene } from '../scenes/IntroScene';
import { FeatureScene } from '../scenes/FeatureScene';
import { StatsScene } from '../scenes/StatsScene';
import { ScreenshotScene } from '../scenes/ScreenshotScene';
import { CtaScene } from '../scenes/CtaScene';

export interface PromoVideoProps {
  script?: VideoScript;
  format?: VideoFormat;
  falAssets?: {
    intro?: string;
    background?: string;
    outro?: string;
  };
}

// Default colors for empty state
const DEFAULT_COLORS: ColorPalette = {
  primary: '#6366f1',
  secondary: '#a5b4fc',
  accent: '#818cf8',
  background: '#0f0f23',
  text: '#ffffff',
};

export function PromoVideo({ script, format = 'landscape', falAssets }: PromoVideoProps) {
  const { durationInFrames } = useVideoConfig();

  if (!script?.scenes?.length) {
    return <EmptyState colors={script?.colors ?? DEFAULT_COLORS} />;
  }

  const style = getStyleConfig(script.style);
  const colors = script.colors;

  // Calculate scene timings
  const sceneTimings = calculateSceneTimings(script.scenes, style, durationInFrames);

  return (
    <AbsoluteFill>
      {sceneTimings.map((timing, index) => (
        <Sequence
          key={index}
          from={timing.start}
          durationInFrames={timing.duration}
          name={`Scene ${index + 1}: ${timing.scene.type}`}
        >
          <SceneRenderer
            scene={timing.scene}
            colors={colors}
            style={style}
            format={format}
            logoUrl={script.logoUrl}
            falAssets={falAssets}
            isFirst={index === 0}
            isLast={index === sceneTimings.length - 1}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}

interface SceneTiming {
  scene: VideoScene;
  start: number;
  duration: number;
}

function calculateSceneTimings(
  scenes: VideoScene[],
  style: StyleConfig,
  totalDuration: number
): SceneTiming[] {
  const timings: SceneTiming[] = [];
  let currentFrame = 0;

  for (const scene of scenes) {
    // Use scene's specified duration or fall back to style defaults
    const duration = scene.duration || getDefaultDuration(scene.type, style);

    timings.push({
      scene,
      start: currentFrame,
      duration,
    });

    currentFrame += duration;
  }

  // If total exceeds video duration, scale proportionally
  // EDGE-003 FIX: Guard against division by zero
  const totalSceneDuration = timings.reduce((sum, t) => sum + t.duration, 0);

  if (totalSceneDuration > 0 && totalSceneDuration > totalDuration) {
    const scale = totalDuration / totalSceneDuration;
    let adjustedStart = 0;

    for (const timing of timings) {
      timing.start = Math.floor(adjustedStart);
      timing.duration = Math.max(1, Math.floor(timing.duration * scale)); // Ensure at least 1 frame
      adjustedStart += timing.duration;
    }
  } else if (totalSceneDuration === 0 && timings.length > 0) {
    // If all scenes have 0 duration, distribute evenly
    const perSceneDuration = Math.floor(totalDuration / timings.length);
    let adjustedStart = 0;

    for (const timing of timings) {
      timing.start = adjustedStart;
      timing.duration = perSceneDuration;
      adjustedStart += perSceneDuration;
    }
  }

  return timings;
}

function getDefaultDuration(sceneType: string, style: StyleConfig): number {
  const defaults = style.sceneDefaults;

  switch (sceneType) {
    case 'intro':
      return defaults.intro;
    case 'feature':
      return defaults.feature;
    case 'stats':
      return defaults.stats;
    case 'screenshot':
      return defaults.screenshot;
    case 'cta':
      return defaults.cta;
    default:
      return defaults.feature;
  }
}

interface SceneRendererProps {
  scene: VideoScene;
  colors: ColorPalette;
  style: StyleConfig;
  format: VideoFormat;
  logoUrl: string | null;
  falAssets?: {
    intro?: string;
    background?: string;
    outro?: string;
  };
  isFirst: boolean;
  isLast: boolean;
}

function SceneRenderer({
  scene,
  colors,
  style,
  format,
  logoUrl,
  falAssets,
  isFirst,
  isLast,
}: SceneRendererProps) {
  switch (scene.type) {
    case 'intro':
      return (
        <IntroScene
          headline={scene.headline}
          logoUrl={scene.logoUrl || logoUrl || undefined}
          colors={colors}
          style={style}
          format={format}
          falVideoUrl={isFirst ? falAssets?.intro : undefined}
        />
      );

    case 'feature':
      return (
        <FeatureScene
          title={scene.title}
          features={[{ title: scene.title, description: scene.description }]}
          colors={colors}
          style={style}
          format={format}
          layout="single"
        />
      );

    case 'stats':
      return (
        <StatsScene
          stats={scene.items.map(item => ({ value: item.value, label: item.label }))}
          colors={colors}
          style={style}
          format={format}
        />
      );

    case 'screenshot':
      return (
        <ScreenshotScene
          screenshotUrl={scene.imageUrl}
          caption={scene.caption || undefined}
          colors={colors}
          style={style}
          format={format}
        />
      );

    case 'cta':
      return (
        <CtaScene
          headline={scene.headline}
          buttonText={scene.buttonText}
          subtext={scene.url}
          logoUrl={logoUrl || undefined}
          colors={colors}
          style={style}
          format={format}
          falVideoUrl={isLast ? falAssets?.outro : undefined}
        />
      );

    default:
      return <EmptyState colors={colors} />;
  }
}

function EmptyState({ colors }: { colors: ColorPalette }) {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          color: colors.text,
          fontSize: 32,
          opacity: 0.5,
        }}
      >
        No scenes to render
      </div>
    </AbsoluteFill>
  );
}

/**
 * Calculate total video duration from scenes
 */
export function calculateTotalDuration(scenes: VideoScene[], style: StyleConfig): number {
  return scenes.reduce((total, scene) => {
    return total + (scene.duration || getDefaultDuration(scene.type, style));
  }, 0);
}
