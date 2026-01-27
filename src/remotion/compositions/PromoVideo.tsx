// src/remotion/compositions/PromoVideo.tsx

import { AbsoluteFill, useVideoConfig } from 'remotion';
import { TransitionSeries, springTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import type { VideoScene, ColorPalette, VideoScript } from '@/types/video-bundle';
import type { StyleConfig } from '../styles';
import type { VideoFormat } from '../utils/safeZones';
import { getStyleConfig } from '../styles';

// Import skill configuration - enforced best practices from Promo Video Mastery skill
import {
  SPRING_CONFIGS,
  ANIMATION_TIMING,
  TRANSITION_REST_THRESHOLD,
} from '../skill-config';

// Transition configuration - using Promo Video Mastery skill constants
const TRANSITION_DURATION_FRAMES = ANIMATION_TIMING.transition.default;

// Create spring timing with skill-defined config
const createSpringTransition = () =>
  springTiming({
    config: SPRING_CONFIGS.smooth, // Professional, Stripe/Linear style
    durationInFrames: TRANSITION_DURATION_FRAMES,
    durationRestThreshold: TRANSITION_REST_THRESHOLD, // 0.001 for cleaner cutoffs
  });

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

  // Build TransitionSeries with spring-based transitions between scenes
  // Per Promo Video Mastery skill: use springs for natural motion, vary transitions for interest
  return (
    <AbsoluteFill>
      <TransitionSeries>
        {sceneTimings.map((timing, index) => {
          const isLast = index === sceneTimings.length - 1;
          const nextScene = sceneTimings[index + 1]?.scene;

          return (
            <>
              <TransitionSeries.Sequence
                key={`scene-${index}`}
                durationInFrames={timing.duration}
              >
                <SceneRenderer
                  scene={timing.scene}
                  colors={colors}
                  style={style}
                  format={format}
                  logoUrl={script.logoUrl}
                  falAssets={falAssets}
                  isFirst={index === 0}
                  isLast={isLast}
                />
              </TransitionSeries.Sequence>
              {/* Add spring-based transition between scenes (not after last scene) */}
              {!isLast && (
                <TransitionSeries.Transition
                  key={`transition-${index}`}
                  presentation={getTransitionPresentation(timing.scene.type, nextScene?.type)}
                  timing={createSpringTransition()}
                />
              )}
            </>
          );
        })}
      </TransitionSeries>
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

  // Per Remotion Skills: TransitionSeries transitions overlap scenes
  // Total duration = sum of scene durations - (number of transitions * transition duration)
  const numTransitions = Math.max(0, timings.length - 1);
  const transitionOverlap = numTransitions * TRANSITION_DURATION_FRAMES;
  const totalSceneDuration = timings.reduce((sum, t) => sum + t.duration, 0);
  const effectiveDuration = totalSceneDuration - transitionOverlap;

  // If total exceeds video duration, scale proportionally
  // EDGE-003 FIX: Guard against division by zero
  if (effectiveDuration > 0 && effectiveDuration > totalDuration) {
    // Need to scale down - add back transition time to get target scene durations
    const targetSceneDuration = totalDuration + transitionOverlap;
    const scale = targetSceneDuration / totalSceneDuration;
    let adjustedStart = 0;

    for (const timing of timings) {
      timing.start = Math.floor(adjustedStart);
      timing.duration = Math.max(
        TRANSITION_DURATION_FRAMES + 1, // Each scene must be longer than transition
        Math.floor(timing.duration * scale)
      );
      adjustedStart += timing.duration;
    }
  } else if (totalSceneDuration === 0 && timings.length > 0) {
    // If all scenes have 0 duration, distribute evenly
    // Account for transitions in the distribution
    const availableForScenes = totalDuration + transitionOverlap;
    const perSceneDuration = Math.floor(availableForScenes / timings.length);
    let adjustedStart = 0;

    for (const timing of timings) {
      timing.start = adjustedStart;
      timing.duration = Math.max(TRANSITION_DURATION_FRAMES + 1, perSceneDuration);
      adjustedStart += timing.duration;
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

/**
 * Get transition presentation based on scene types
 * Per Promo Video Mastery skill: vary transitions for visual interest
 * - Fade: Default, works for most transitions
 * - Slide: Good for sequential flow (feature to feature)
 */
function getTransitionPresentation(
  currentType: string,
  nextType: string | undefined
): ReturnType<typeof fade> | ReturnType<typeof slide> {
  // Slide transition for intro → feature (establishes forward motion)
  if (currentType === 'intro' && nextType === 'feature') {
    return slide({ direction: 'from-right' });
  }

  // Slide for stats → cta (drive toward action)
  if (currentType === 'stats' && nextType === 'cta') {
    return slide({ direction: 'from-bottom' });
  }

  // Default: fade (clean, professional)
  return fade();
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
 * Per Remotion Skills: accounts for transition overlaps
 */
export function calculateTotalDuration(scenes: VideoScene[], style: StyleConfig): number {
  const totalSceneDuration = scenes.reduce((total, scene) => {
    return total + (scene.duration || getDefaultDuration(scene.type, style));
  }, 0);

  // Subtract transition overlaps (each transition overlaps two adjacent scenes)
  const numTransitions = Math.max(0, scenes.length - 1);
  const transitionOverlap = numTransitions * TRANSITION_DURATION_FRAMES;

  return Math.max(1, totalSceneDuration - transitionOverlap);
}

/**
 * Export transition duration for external use
 */
export { TRANSITION_DURATION_FRAMES };
