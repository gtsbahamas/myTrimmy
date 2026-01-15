/**
 * Logo Canvas - A2ui Component
 *
 * Displays the uploaded logo as the centerpiece with quick action pills.
 * Processing options surface on demand when actions are selected.
 */

'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  Scissors,
  Maximize2,
  FileType,
  Download,
  RotateCw,
  Sparkles,
  Package,
  X,
  Check,
  RefreshCw,
  Eraser,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type ProcessingAction = 'trim' | 'resize' | 'convert' | 'rotate' | 'optimize' | 'bundle' | 'removeBackground' | null;

interface LogoCanvasProps {
  imageUrl: string;
  filename: string;
  width?: number | null;
  height?: number | null;
  isProcessing?: boolean;
  processedUrl?: string | null;
  onProcess: (action: ProcessingAction, options?: Record<string, unknown>) => void;
  onDownload: () => void;
  onClear: () => void;
  className?: string;
}

const ACTION_PILLS = [
  { id: 'removeBackground' as const, label: 'Remove BG', icon: Eraser, description: 'Make background transparent' },
  { id: 'trim' as const, label: 'Trim', icon: Scissors, description: 'Remove whitespace' },
  { id: 'resize' as const, label: 'Resize', icon: Maximize2, description: 'Change dimensions' },
  { id: 'convert' as const, label: 'Convert', icon: FileType, description: 'Change format' },
  { id: 'rotate' as const, label: 'Rotate', icon: RotateCw, description: 'Rotate or flip' },
  { id: 'optimize' as const, label: 'Optimize', icon: Sparkles, description: 'Reduce file size' },
  { id: 'bundle' as const, label: 'App Bundle', icon: Package, description: 'Generate all assets' },
];

export function LogoCanvas({
  imageUrl,
  filename,
  width,
  height,
  isProcessing = false,
  processedUrl,
  onProcess,
  onDownload,
  onClear,
  className,
}: LogoCanvasProps) {
  const [selectedAction, setSelectedAction] = React.useState<ProcessingAction>(null);
  const [hoveredAction, setHoveredAction] = React.useState<ProcessingAction>(null);

  const handleActionClick = (action: ProcessingAction) => {
    if (action === selectedAction) {
      setSelectedAction(null);
    } else {
      setSelectedAction(action);
      // For simple actions, process immediately
      if (action === 'trim') {
        onProcess('trim');
        setSelectedAction(null);
      } else if (action === 'removeBackground') {
        onProcess('removeBackground');
        setSelectedAction(null);
      }
    }
  };

  const displayUrl = processedUrl || imageUrl;
  const isProcessed = !!processedUrl;

  return (
    <div className={cn("relative", className)}>
      {/* Main canvas area */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Logo preview */}
        <div className="relative flex-shrink-0">
          {/* Ambient glow behind image */}
          <div className="absolute -inset-4 rounded-3xl bg-primary/5 blur-2xl" />

          <div className={cn(
            "relative rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden",
            "transition-all duration-300",
            isProcessing && "animate-pulse"
          )}>
            {/* Checkered background for transparency */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(45deg, hsl(var(--muted)) 25%, transparent 25%),
                  linear-gradient(-45deg, hsl(var(--muted)) 25%, transparent 25%),
                  linear-gradient(45deg, transparent 75%, hsl(var(--muted)) 75%),
                  linear-gradient(-45deg, transparent 75%, hsl(var(--muted)) 75%)
                `,
                backgroundSize: '16px 16px',
                backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                opacity: 0.3,
              }}
            />

            {/* Image */}
            <div className="relative w-64 h-64 sm:w-80 sm:h-80">
              <Image
                src={displayUrl}
                alt={filename}
                fill
                className="object-contain p-4"
                sizes="320px"
              />
            </div>

            {/* Processing overlay */}
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                  <span className="text-sm font-medium">Processing...</span>
                </div>
              </div>
            )}

            {/* Processed badge */}
            {isProcessed && !isProcessing && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/20 text-green-500 text-xs font-medium">
                <Check className="h-3 w-3" />
                Processed
              </div>
            )}

            {/* Clear button */}
            <button
              onClick={onClear}
              className="absolute top-3 left-3 p-1.5 rounded-lg bg-background/80 text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
              title="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Image info */}
          <div className="mt-3 text-center">
            <p className="text-sm font-medium truncate max-w-64 sm:max-w-80" title={filename}>
              {filename}
            </p>
            {width && height && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {width} × {height}px
              </p>
            )}
          </div>
        </div>

        {/* Action pills + surface */}
        <div className="flex-1 w-full">
          {/* Quick action pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            {ACTION_PILLS.map((action) => {
              const Icon = action.icon;
              const isSelected = selectedAction === action.id;
              const isHovered = hoveredAction === action.id;

              return (
                <button
                  key={action.id}
                  onClick={() => handleActionClick(action.id)}
                  onMouseEnter={() => setHoveredAction(action.id)}
                  onMouseLeave={() => setHoveredAction(null)}
                  disabled={isProcessing}
                  className={cn(
                    "group flex items-center gap-2 px-4 py-2.5 rounded-xl",
                    "border transition-all duration-200",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    isSelected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/50 bg-card/50 hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    (isSelected || isHovered) && "scale-110"
                  )} />
                  <span className="text-sm font-medium">{action.label}</span>
                </button>
              );
            })}
          </div>

          {/* Action description */}
          {hoveredAction && !selectedAction && (
            <p className="text-sm text-muted-foreground mb-4 animate-fade-in">
              {ACTION_PILLS.find(a => a.id === hoveredAction)?.description}
            </p>
          )}

          {/* Processing surface - appears on demand */}
          {selectedAction && selectedAction !== 'trim' && (
            <ProcessingSurface
              action={selectedAction}
              onProcess={(options) => {
                onProcess(selectedAction, options);
                setSelectedAction(null);
              }}
              onCancel={() => setSelectedAction(null)}
              isProcessing={isProcessing}
            />
          )}

          {/* Download button */}
          <div className="mt-6 flex gap-3">
            <Button
              onClick={onDownload}
              variant={isProcessed ? "default" : "outline"}
              className="glow-amber"
            >
              <Download className="h-4 w-4 mr-2" />
              {isProcessed ? 'Download Processed' : 'Download Original'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Processing Surface - Dynamic options panel
interface ProcessingSurfaceProps {
  action: ProcessingAction;
  onProcess: (options?: Record<string, unknown>) => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

function ProcessingSurface({ action, onProcess, onCancel, isProcessing }: ProcessingSurfaceProps) {
  const [options, setOptions] = React.useState<Record<string, unknown>>({});

  const renderContent = () => {
    switch (action) {
      case 'resize':
        return (
          <div className="space-y-4">
            <h3 className="font-medium">Resize Options</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Width (px)</label>
                <input
                  type="number"
                  placeholder="Auto"
                  className="mt-1 w-full h-10 px-3 rounded-lg border border-border/50 bg-card/50 text-sm"
                  onChange={(e) => setOptions(prev => ({ ...prev, width: e.target.value ? Number(e.target.value) : undefined }))}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Height (px)</label>
                <input
                  type="number"
                  placeholder="Auto"
                  className="mt-1 w-full h-10 px-3 rounded-lg border border-border/50 bg-card/50 text-sm"
                  onChange={(e) => setOptions(prev => ({ ...prev, height: e.target.value ? Number(e.target.value) : undefined }))}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Leave empty to maintain aspect ratio</p>
          </div>
        );

      case 'convert':
        return (
          <div className="space-y-4">
            <h3 className="font-medium">Convert Format</h3>
            <div className="flex gap-2">
              {['webp', 'png', 'jpeg'].map((format) => (
                <button
                  key={format}
                  onClick={() => setOptions({ format })}
                  className={cn(
                    "px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                    options.format === format
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/50 hover:border-primary/50"
                  )}
                >
                  {format.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        );

      case 'rotate':
        return (
          <div className="space-y-4">
            <h3 className="font-medium">Rotate & Flip</h3>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: 90, label: '90°' },
                { value: 180, label: '180°' },
                { value: 270, label: '270°' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setOptions(prev => ({ ...prev, angle: opt.value }))}
                  className={cn(
                    "px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                    options.angle === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/50 hover:border-primary/50"
                  )}
                >
                  {opt.label}
                </button>
              ))}
              <button
                onClick={() => setOptions(prev => ({ ...prev, flipHorizontal: !prev.flipHorizontal }))}
                className={cn(
                  "px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                  options.flipHorizontal
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/50 hover:border-primary/50"
                )}
              >
                Flip H
              </button>
              <button
                onClick={() => setOptions(prev => ({ ...prev, flipVertical: !prev.flipVertical }))}
                className={cn(
                  "px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                  options.flipVertical
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/50 hover:border-primary/50"
                )}
              >
                Flip V
              </button>
            </div>
          </div>
        );

      case 'optimize':
        return (
          <div className="space-y-4">
            <h3 className="font-medium">Optimize Quality</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Quality</span>
                <span className="font-medium">{(options.quality as number) || 80}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                defaultValue="80"
                className="w-full"
                onChange={(e) => setOptions({ quality: Number(e.target.value) })}
              />
            </div>
          </div>
        );

      case 'bundle':
        return (
          <div className="space-y-4">
            <h3 className="font-medium">Generate App Bundle</h3>
            <p className="text-sm text-muted-foreground">
              Creates all favicon, app icon, PWA, and social media assets.
            </p>
            <div>
              <label className="text-sm text-muted-foreground">App Name</label>
              <input
                type="text"
                placeholder="My App"
                className="mt-1 w-full h-10 px-3 rounded-lg border border-border/50 bg-card/50 text-sm"
                onChange={(e) => setOptions({ appName: e.target.value })}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-5 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm animate-fade-up">
      {renderContent()}

      <div className="flex gap-3 mt-6 pt-4 border-t border-border/30">
        <Button
          onClick={() => onProcess(options)}
          disabled={isProcessing}
          className="glow-amber"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            'Apply'
          )}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
