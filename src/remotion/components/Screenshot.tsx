// src/remotion/components/Screenshot.tsx

import { AbsoluteFill, Img, useCurrentFrame, interpolate as remotionInterpolate, Easing } from 'remotion';
import type { StyleConfig } from '../styles';
import type { VideoFormat } from '../utils/safeZones';
import { getSafeZone, FORMAT_DIMENSIONS } from '../utils/safeZones';

interface ScreenshotProps {
  src: string;
  style: StyleConfig;
  format: VideoFormat;
  caption?: string | null;
  delay?: number;
}

export function Screenshot({
  src,
  style,
  format,
  caption,
  delay = 0,
}: ScreenshotProps) {
  const frame = useCurrentFrame();
  const dims = FORMAT_DIMENSIONS[format];
  const safeZone = getSafeZone(format);

  const { effect, scale, overlayOpacity, borderRadius, shadow } = style.screenshot;
  const enterDuration = style.textEnterDuration;

  // Enter animation (fade + scale)
  const enterProgress = remotionInterpolate(
    frame,
    [delay, delay + enterDuration],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    }
  );

  const opacity = enterProgress;
  const enterScale = remotionInterpolate(enterProgress, [0, 1], [0.95, 1]);

  // Ken-Burns effect progress (continues throughout scene)
  const kenBurnsProgress = remotionInterpolate(
    frame,
    [delay, delay + 300], // 10 seconds at 30fps
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  // Calculate Ken-Burns transform based on effect type
  let kenBurnsScale = 1;
  let translateX = 0;
  const translateY = 0;

  switch (effect) {
    case 'subtle-zoom':
      kenBurnsScale = remotionInterpolate(
        kenBurnsProgress,
        [0, 1],
        [scale.start, scale.end]
      );
      break;
    case 'dynamic-zoom':
      kenBurnsScale = remotionInterpolate(
        kenBurnsProgress,
        [0, 1],
        [scale.start, scale.end]
      );
      break;
    case 'slow-pan':
      kenBurnsScale = remotionInterpolate(
        kenBurnsProgress,
        [0, 1],
        [scale.start, scale.end]
      );
      translateX = remotionInterpolate(kenBurnsProgress, [0, 1], [20, -20]);
      break;
    default:
      break;
  }

  // Calculate container size to fit in safe zone with padding
  const containerWidth = safeZone.width * 0.9;
  const containerHeight = safeZone.height * (caption ? 0.75 : 0.85);

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${safeZone.top}px`,
      }}
    >
      {/* Screenshot container with overflow hidden for Ken-Burns */}
      <div
        style={{
          width: containerWidth,
          height: containerHeight,
          borderRadius,
          boxShadow: shadow,
          overflow: 'hidden',
          opacity,
          transform: `scale(${enterScale})`,
        }}
      >
        {/* Image with Ken-Burns transform */}
        <div
          style={{
            width: '100%',
            height: '100%',
            transform: `scale(${kenBurnsScale}) translate(${translateX}px, ${translateY}px)`,
            transformOrigin: 'center center',
          }}
        >
          <Img
            src={src}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>

        {/* Overlay */}
        {overlayOpacity > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`,
              pointerEvents: 'none',
            }}
          />
        )}
      </div>

      {/* Caption */}
      {caption && (
        <div
          style={{
            marginTop: 24,
            fontSize: 24,
            color: 'rgba(255, 255, 255, 0.8)',
            textAlign: 'center',
            opacity: remotionInterpolate(
              frame,
              [delay + enterDuration, delay + enterDuration + 15],
              [0, 1],
              {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }
            ),
          }}
        >
          {caption}
        </div>
      )}
    </AbsoluteFill>
  );
}

/**
 * Screenshot with device frame mockup
 */
interface DeviceScreenshotProps extends ScreenshotProps {
  device?: 'browser' | 'phone' | 'tablet';
}

export function DeviceScreenshot({
  src,
  style,
  format,
  device = 'browser',
  ...props
}: DeviceScreenshotProps) {
  // For now, render as regular screenshot
  // Device frames would be added as overlays
  return <Screenshot src={src} style={style} format={format} {...props} />;
}
