// src/remotion/components/LogoReveal.tsx

import { AbsoluteFill, Img, useCurrentFrame, interpolate as remotionInterpolate, Easing } from 'remotion';
import type { StyleConfig } from '../styles';
import type { VideoFormat } from '../utils/safeZones';
import { getLogoSize } from '../utils/safeZones';

interface LogoRevealProps {
  src: string;
  style: StyleConfig;
  format: VideoFormat;
  delay?: number;
}

export function LogoReveal({
  src,
  style,
  format,
  delay = 0,
}: LogoRevealProps) {
  const frame = useCurrentFrame();
  const logoSize = getLogoSize(format);

  const { enterType, enterDuration, glowIntensity } = style.logo;

  // Calculate animation progress
  const progress = remotionInterpolate(
    frame,
    [delay, delay + enterDuration],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    }
  );

  // Calculate animation values based on enter type
  let opacity = 1;
  let scale = 1;
  let blur = 0;
  let glowOpacity = 0;

  const enterTypeValue = enterType as string;
  switch (enterTypeValue) {
    case 'fade':
      opacity = progress;
      break;

    case 'fade-scale':
      opacity = progress;
      scale = remotionInterpolate(progress, [0, 1], [0.8, 1]);
      break;

    case 'scale-bounce': {
      opacity = progress;
      // Bounce easing for scale
      const bounceProgress = Easing.out(Easing.back(1.5))(progress);
      scale = remotionInterpolate(bounceProgress, [0, 1], [0.3, 1]);
      break;
    }

    case 'elegant-reveal':
      // Fade in with slight scale and glow
      opacity = remotionInterpolate(progress, [0, 0.5, 1], [0, 0.8, 1]);
      scale = remotionInterpolate(progress, [0, 1], [0.95, 1]);
      blur = remotionInterpolate(progress, [0, 0.3, 1], [10, 2, 0]);
      glowOpacity = remotionInterpolate(progress, [0, 0.5, 1], [0, glowIntensity, 0]);
      break;

    default:
      opacity = progress;
  }

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Glow effect layer */}
      {glowOpacity > 0 && (
        <div
          style={{
            position: 'absolute',
            width: logoSize.width,
            height: logoSize.height,
            filter: `blur(30px)`,
            opacity: glowOpacity,
            background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%)',
          }}
        />
      )}

      {/* Logo container */}
      <div
        style={{
          width: logoSize.width,
          height: logoSize.height,
          opacity,
          transform: `scale(${scale})`,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
        }}
      >
        <Img
          src={src}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      </div>
    </AbsoluteFill>
  );
}

/**
 * Animated logo with continuous subtle animation
 */
interface AnimatedLogoProps extends LogoRevealProps {
  animationType?: 'pulse' | 'float' | 'rotate' | 'none';
}

export function AnimatedLogo({
  src,
  style,
  format,
  delay = 0,
  animationType = 'none',
}: AnimatedLogoProps) {
  const frame = useCurrentFrame();
  const logoSize = getLogoSize(format);

  const { enterDuration } = style.logo;

  // Enter animation
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

  // Continuous animation after enter
  const continuousFrame = Math.max(0, frame - delay - enterDuration);
  let transform = `scale(${remotionInterpolate(enterProgress, [0, 1], [0.9, 1])})`;

  switch (animationType) {
    case 'pulse':
      const pulseScale = 1 + Math.sin(continuousFrame * 0.05) * 0.02;
      transform = `scale(${pulseScale * remotionInterpolate(enterProgress, [0, 1], [0.9, 1])})`;
      break;

    case 'float':
      const floatY = Math.sin(continuousFrame * 0.03) * 5;
      transform = `translateY(${floatY}px) scale(${remotionInterpolate(enterProgress, [0, 1], [0.9, 1])})`;
      break;

    case 'rotate':
      const rotation = continuousFrame * 0.5;
      transform = `rotate(${rotation}deg) scale(${remotionInterpolate(enterProgress, [0, 1], [0.9, 1])})`;
      break;
  }

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: logoSize.width,
          height: logoSize.height,
          opacity: enterProgress,
          transform,
        }}
      >
        <Img
          src={src}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      </div>
    </AbsoluteFill>
  );
}
