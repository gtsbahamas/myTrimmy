// src/remotion/components/SafeZone.tsx

import { AbsoluteFill } from 'remotion';
import type { VideoFormat } from '../utils/safeZones';
import { getSafeZone, getTitleSafeZone, FORMAT_DIMENSIONS } from '../utils/safeZones';

interface SafeZoneProps {
  format: VideoFormat;
  children: React.ReactNode;
  type?: 'action' | 'title';
  debug?: boolean;
}

/**
 * Container that constrains content to safe zones
 * - Action safe: 5% inset, safe for all displays
 * - Title safe: 10% inset, safe for text/important content
 */
export function SafeZone({
  format,
  children,
  type = 'action',
  debug = false,
}: SafeZoneProps) {
  const safeZone = type === 'title' ? getTitleSafeZone(format) : getSafeZone(format);

  return (
    <AbsoluteFill>
      {debug && <SafeZoneOverlay format={format} />}
      <div
        style={{
          position: 'absolute',
          top: safeZone.top,
          left: safeZone.left,
          width: safeZone.width,
          height: safeZone.height,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
}

/**
 * Debug overlay showing safe zone boundaries
 */
interface SafeZoneOverlayProps {
  format: VideoFormat;
}

export function SafeZoneOverlay({ format }: SafeZoneOverlayProps) {
  const actionSafe = getSafeZone(format);
  const titleSafe = getTitleSafeZone(format);

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {/* Action safe zone */}
      <div
        style={{
          position: 'absolute',
          top: actionSafe.top,
          left: actionSafe.left,
          width: actionSafe.width,
          height: actionSafe.height,
          border: '2px dashed rgba(255, 0, 0, 0.5)',
          boxSizing: 'border-box',
        }}
      />

      {/* Title safe zone */}
      <div
        style={{
          position: 'absolute',
          top: titleSafe.top,
          left: titleSafe.left,
          width: titleSafe.width,
          height: titleSafe.height,
          border: '2px dashed rgba(0, 255, 0, 0.5)',
          boxSizing: 'border-box',
        }}
      />

      {/* Labels */}
      <div
        style={{
          position: 'absolute',
          top: actionSafe.top + 5,
          left: actionSafe.left + 5,
          fontSize: 12,
          color: 'rgba(255, 0, 0, 0.8)',
          fontFamily: 'monospace',
        }}
      >
        Action Safe
      </div>
      <div
        style={{
          position: 'absolute',
          top: titleSafe.top + 5,
          left: titleSafe.left + 5,
          fontSize: 12,
          color: 'rgba(0, 255, 0, 0.8)',
          fontFamily: 'monospace',
        }}
      >
        Title Safe
      </div>
    </AbsoluteFill>
  );
}

/**
 * Centered content container within safe zone
 */
interface CenteredContentProps {
  format: VideoFormat;
  children: React.ReactNode;
  verticalAlign?: 'top' | 'center' | 'bottom';
  horizontalAlign?: 'left' | 'center' | 'right';
}

export function CenteredContent({
  format,
  children,
  verticalAlign = 'center',
  horizontalAlign = 'center',
}: CenteredContentProps) {
  const safeZone = getTitleSafeZone(format);

  const justifyContent = {
    top: 'flex-start',
    center: 'center',
    bottom: 'flex-end',
  }[verticalAlign];

  const alignItems = {
    left: 'flex-start',
    center: 'center',
    right: 'flex-end',
  }[horizontalAlign];

  return (
    <div
      style={{
        position: 'absolute',
        top: safeZone.top,
        left: safeZone.left,
        width: safeZone.width,
        height: safeZone.height,
        display: 'flex',
        flexDirection: 'column',
        justifyContent,
        alignItems,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Split layout for side-by-side content
 */
interface SplitLayoutProps {
  format: VideoFormat;
  left: React.ReactNode;
  right: React.ReactNode;
  ratio?: number; // 0-1, portion for left side
  gap?: number;
}

export function SplitLayout({
  format,
  left,
  right,
  ratio = 0.5,
  gap = 40,
}: SplitLayoutProps) {
  const safeZone = getTitleSafeZone(format);
  const leftWidth = (safeZone.width - gap) * ratio;
  const rightWidth = (safeZone.width - gap) * (1 - ratio);

  return (
    <div
      style={{
        position: 'absolute',
        top: safeZone.top,
        left: safeZone.left,
        width: safeZone.width,
        height: safeZone.height,
        display: 'flex',
        flexDirection: 'row',
        gap,
      }}
    >
      <div
        style={{
          width: leftWidth,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        {left}
      </div>
      <div
        style={{
          width: rightWidth,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        {right}
      </div>
    </div>
  );
}

/**
 * Grid layout for multiple items
 */
interface GridLayoutProps {
  format: VideoFormat;
  children: React.ReactNode[];
  columns: number;
  gap?: number;
}

export function GridLayout({
  format,
  children,
  columns,
  gap = 20,
}: GridLayoutProps) {
  const safeZone = getTitleSafeZone(format);

  return (
    <div
      style={{
        position: 'absolute',
        top: safeZone.top,
        left: safeZone.left,
        width: safeZone.width,
        height: safeZone.height,
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap,
        alignContent: 'center',
      }}
    >
      {children}
    </div>
  );
}

/**
 * Lower third container for text overlays
 */
interface LowerThirdProps {
  format: VideoFormat;
  children: React.ReactNode;
}

export function LowerThird({ format, children }: LowerThirdProps) {
  const dims = FORMAT_DIMENSIONS[format];
  const safeZone = getSafeZone(format);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: safeZone.top + 20,
        left: safeZone.left,
        width: safeZone.width,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
      }}
    >
      {children}
    </div>
  );
}
