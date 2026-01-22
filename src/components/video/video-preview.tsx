'use client';

import * as React from 'react';
import Image from 'next/image';
import { Download, Play, Pause, Monitor, Smartphone, Square, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { VideoWatermark } from './video-watermark';
import type { VideoOutputs, VideoFormat } from '@/types/video-bundle';

interface VideoPreviewProps {
  outputs: VideoOutputs;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  showWatermark?: boolean;
}

const FORMAT_CONFIG: {
  id: VideoFormat;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  dimensions: string;
}[] = [
  { id: 'landscape', label: 'Landscape', icon: Monitor, dimensions: '1920×1080' },
  { id: 'portrait', label: 'Portrait', icon: Smartphone, dimensions: '1080×1920' },
  { id: 'square', label: 'Square', icon: Square, dimensions: '1080×1080' },
];

export function VideoPreview({
  outputs,
  onRegenerate,
  isRegenerating = false,
  showWatermark = false,
}: VideoPreviewProps) {
  const [selectedFormat, setSelectedFormat] = React.useState<VideoFormat>('landscape');
  const [isPlaying, setIsPlaying] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const currentOutput = outputs[selectedFormat];
  const config = FORMAT_CONFIG.find((f) => f.id === selectedFormat)!;

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleDownloadAll = () => {
    // Download all formats as a bundle
    for (const format of FORMAT_CONFIG) {
      const output = outputs[format.id];
      if (output?.videoUrl) {
        const link = document.createElement('a');
        link.href = output.videoUrl;
        link.download = `promo-${format.id}.mp4`;
        link.click();
      }
    }
  };

  const handleDownloadCurrent = () => {
    if (currentOutput?.videoUrl) {
      const link = document.createElement('a');
      link.href = currentOutput.videoUrl;
      link.download = `promo-${selectedFormat}.mp4`;
      link.click();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Your Video Bundle</h2>
        <div className="flex gap-2">
          {onRegenerate && (
            <Button
              variant="outline"
              onClick={onRegenerate}
              disabled={isRegenerating}
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", isRegenerating && "animate-spin")} />
              Regenerate
            </Button>
          )}
          <Button onClick={handleDownloadAll}>
            <Download className="w-4 h-4 mr-2" />
            Download All
          </Button>
        </div>
      </div>

      {/* Main Preview */}
      <div
        className={cn(
          "relative rounded-2xl overflow-hidden bg-black",
          selectedFormat === 'landscape' && "aspect-video",
          selectedFormat === 'portrait' && "aspect-[9/16] max-h-[600px] mx-auto",
          selectedFormat === 'square' && "aspect-square max-h-[500px] mx-auto"
        )}
      >
        {currentOutput?.videoUrl ? (
          <>
            <video
              ref={videoRef}
              src={currentOutput.videoUrl}
              poster={currentOutput.thumbnailUrl}
              className="w-full h-full object-contain"
              onEnded={() => setIsPlaying(false)}
            />
            <button
              type="button"
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
            >
              <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-black" />
                ) : (
                  <Play className="w-6 h-6 text-black ml-1" />
                )}
              </div>
            </button>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-muted-foreground">Video not available</p>
          </div>
        )}

        {/* Format badge */}
        <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/60 text-white text-sm font-medium">
          {config.label} • {config.dimensions}
        </div>

        {/* Watermark for free tier */}
        <VideoWatermark show={showWatermark} />
      </div>

      {/* Format Thumbnails */}
      <div className="grid grid-cols-3 gap-4">
        {FORMAT_CONFIG.map((format) => {
          const output = outputs[format.id];
          const Icon = format.icon;
          const isSelected = selectedFormat === format.id;

          return (
            <button
              key={format.id}
              type="button"
              onClick={() => setSelectedFormat(format.id)}
              className={cn(
                "relative rounded-xl overflow-hidden border-2 transition-all duration-200",
                isSelected
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border/50 hover:border-primary/30"
              )}
            >
              <div
                className={cn(
                  "aspect-video bg-muted",
                  format.id === 'portrait' && "aspect-[9/16]",
                  format.id === 'square' && "aspect-square"
                )}
              >
                {output?.thumbnailUrl ? (
                  <Image
                    src={output.thumbnailUrl}
                    alt={format.label}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Icon className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="p-2 text-center">
                <div className="font-medium text-sm">{format.label}</div>
                <div className="text-xs text-muted-foreground">{format.dimensions}</div>
              </div>
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Download Current Format */}
      <div className="flex justify-center">
        <Button variant="outline" onClick={handleDownloadCurrent}>
          <Download className="w-4 h-4 mr-2" />
          Download {config.label}
        </Button>
      </div>

      {/* Metadata */}
      {outputs.metadata && (
        <div className="p-4 rounded-xl bg-card/50 border border-border/50">
          <h3 className="font-medium mb-2">Video Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Duration:</span>{' '}
              <span className="font-medium">{outputs.metadata.duration}s</span>
            </div>
            {outputs.metadata.musicTrack && (
              <div>
                <span className="text-muted-foreground">Music:</span>{' '}
                <span className="font-medium">{outputs.metadata.musicTrack}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Colors:</span>
              {outputs.metadata.colors.map((color, i) => (
                <div
                  key={i}
                  className="w-4 h-4 rounded-full border border-border/50"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
