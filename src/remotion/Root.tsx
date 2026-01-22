// src/remotion/Root.tsx

import { Composition } from 'remotion';
import { PromoVideo, PromoVideoProps } from './compositions/PromoVideo';
import { FORMAT_DIMENSIONS } from './utils/safeZones';
import { FPS } from './utils/timing';
import type { VideoScript } from '@/types/video-bundle';

// Default script for development preview
const defaultScript: VideoScript = {
  scenes: [
    {
      type: 'intro',
      headline: 'Welcome to Your Product',
      logoUrl: null,
      duration: 120,
    },
    {
      type: 'feature',
      title: 'Key Feature',
      description: 'Lightning quick performance with enterprise-grade security',
      screenshot: null,
      duration: 150,
    },
    {
      type: 'stats',
      items: [
        { value: '10K+', label: 'Active Users' },
        { value: '99.9%', label: 'Uptime' },
        { value: '4.9', label: 'Rating' },
      ],
      duration: 120,
    },
    {
      type: 'cta',
      headline: 'Ready to get started?',
      buttonText: 'Try Free',
      url: 'example.com',
      duration: 120,
    },
  ],
  style: 'minimal',
  musicMood: 'ambient',
  totalDuration: 510,
  colors: {
    primary: '#6366f1',
    secondary: '#a5b4fc',
    accent: '#818cf8',
    background: '#0f0f23',
    text: '#ffffff',
  },
  logoUrl: null,
};

// Default duration in seconds
const DEFAULT_DURATION_SECONDS = 30;
const DEFAULT_DURATION_FRAMES = DEFAULT_DURATION_SECONDS * FPS;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Landscape 16:9 */}
      <Composition
        id="PromoVideo-Landscape"
        component={PromoVideo}
        durationInFrames={DEFAULT_DURATION_FRAMES}
        fps={FPS}
        width={FORMAT_DIMENSIONS.landscape.width}
        height={FORMAT_DIMENSIONS.landscape.height}
        defaultProps={{
          script: defaultScript,
          format: 'landscape' as const,
        }}
      />

      {/* Portrait 9:16 */}
      <Composition
        id="PromoVideo-Portrait"
        component={PromoVideo}
        durationInFrames={DEFAULT_DURATION_FRAMES}
        fps={FPS}
        width={FORMAT_DIMENSIONS.portrait.width}
        height={FORMAT_DIMENSIONS.portrait.height}
        defaultProps={{
          script: defaultScript,
          format: 'portrait' as const,
        }}
      />

      {/* Square 1:1 */}
      <Composition
        id="PromoVideo-Square"
        component={PromoVideo}
        durationInFrames={DEFAULT_DURATION_FRAMES}
        fps={FPS}
        width={FORMAT_DIMENSIONS.square.width}
        height={FORMAT_DIMENSIONS.square.height}
        defaultProps={{
          script: defaultScript,
          format: 'square' as const,
        }}
      />
    </>
  );
};
