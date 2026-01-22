'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface VideoWatermarkProps {
  show: boolean;
  className?: string;
}

/**
 * Watermark overlay for free tier video previews.
 * Displays a semi-transparent diagonal pattern with branding.
 */
export function VideoWatermark({ show, className }: VideoWatermarkProps) {
  if (!show) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 pointer-events-none overflow-hidden",
        className
      )}
    >
      {/* Diagonal watermark pattern */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="text-white/20 font-bold text-4xl whitespace-nowrap select-none"
          style={{
            transform: 'rotate(-30deg) scale(1.5)',
            textShadow: '0 0 10px rgba(0,0,0,0.3)',
          }}
        >
          <div className="flex flex-col items-center gap-16">
            {Array.from({ length: 5 }).map((_, row) => (
              <div key={row} className="flex gap-24">
                {Array.from({ length: 3 }).map((_, col) => (
                  <span key={col}>ICONYM</span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom banner */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent py-4 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">IC</span>
            </div>
            <span className="text-white/80 text-sm font-medium">
              Made with Iconym
            </span>
          </div>
          <a
            href="/settings"
            className="px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-colors pointer-events-auto"
          >
            Remove Watermark
          </a>
        </div>
      </div>
    </div>
  );
}
