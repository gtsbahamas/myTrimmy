/**
 * Logo Canvas - A2ui Component
 *
 * Displays the uploaded logo as the centerpiece with quick action pills.
 * Processing options surface on demand when actions are selected.
 * Supports undo/redo for non-destructive editing.
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
  Undo2,
  Redo2,
  Save,
  Trash2,
  ChevronDown,
  Sun,
  Moon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEditSessionOptional } from '@/contexts/edit-session-context';

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
  /** Image ID for edit session tracking */
  imageId?: string;
  /** Callback when edit session is saved */
  onEditSave?: (processedUrl: string) => void;
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
  imageId,
  onEditSave,
}: LogoCanvasProps) {
  const [selectedAction, setSelectedAction] = React.useState<ProcessingAction>(null);
  const [hoveredAction, setHoveredAction] = React.useState<ProcessingAction>(null);

  // Edit session context (optional - doesn't throw if not in provider)
  const editSession = useEditSessionOptional();

  // Auto-start edit session when imageId is provided
  React.useEffect(() => {
    if (imageId && editSession && !editSession.hasSession && !editSession.isProcessing) {
      editSession.actions.startSession(imageId);
    }
  }, [imageId, editSession]);

  // Keyboard shortcuts for undo/redo
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if we have an active session and are not in an input
      if (!editSession?.hasSession) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Ctrl/Cmd + Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (editSession.canUndo && !editSession.isProcessing) {
          editSession.actions.undo();
        }
      }

      // Ctrl/Cmd + Shift + Z for redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        if (editSession.canRedo && !editSession.isProcessing) {
          editSession.actions.redo();
        }
      }

      // Ctrl/Cmd + Y for redo (alternative)
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        if (editSession.canRedo && !editSession.isProcessing) {
          editSession.actions.redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editSession]);

  const handleActionClick = async (action: ProcessingAction) => {
    if (action === selectedAction) {
      setSelectedAction(null);
    } else {
      setSelectedAction(action);
      // For simple actions, process immediately
      if (action === 'trim') {
        // Use edit session API if available, otherwise fall back to direct processing
        if (editSession?.hasSession) {
          await editSession.actions.applyOperation({
            type: 'trim',
            params: { threshold: 10, lineArt: false },
          });
        } else {
          onProcess('trim');
        }
        setSelectedAction(null);
      } else if (action === 'removeBackground') {
        // Background removal currently uses dedicated endpoint
        onProcess('removeBackground');
        setSelectedAction(null);
      }
    }
  };

  // Handle save edit session
  const handleSaveSession = async () => {
    if (!editSession?.hasSession) return;
    try {
      const newUrl = await editSession.actions.save();
      onEditSave?.(newUrl);
    } catch (err) {
      console.error('Failed to save edit session:', err);
    }
  };

  // Handle discard edit session
  const handleDiscardSession = async () => {
    if (!editSession?.hasSession) return;
    await editSession.actions.discard();
  };

  // Use edit session display URL if available, otherwise fall back to processedUrl
  const displayUrl = editSession?.hasSession && editSession.currentDisplayUrl
    ? editSession.currentDisplayUrl
    : (processedUrl || imageUrl);
  const isProcessed = !!processedUrl || (editSession?.hasSession && editSession.session?.current_position > 0);
  const isEditProcessing = editSession?.isProcessing || false;

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

          {/* Edit session controls - Undo/Redo */}
          {editSession?.hasSession && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className="flex items-center gap-1 p-1 rounded-lg bg-card/50 border border-border/50">
                <button
                  onClick={() => editSession.actions.undo()}
                  disabled={!editSession.canUndo || isProcessing || isEditProcessing}
                  className={cn(
                    "p-2 rounded-md transition-colors",
                    editSession.canUndo && !isProcessing && !isEditProcessing
                      ? "hover:bg-primary/10 text-foreground"
                      : "text-muted-foreground/50 cursor-not-allowed"
                  )}
                  title="Undo (Ctrl+Z)"
                >
                  <Undo2 className="h-4 w-4" />
                </button>
                <div className="px-2 py-1 min-w-[3rem] text-center">
                  <span className="text-xs font-medium">
                    {editSession.session?.current_position || 0}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    /{editSession.operations.length}
                  </span>
                </div>
                <button
                  onClick={() => editSession.actions.redo()}
                  disabled={!editSession.canRedo || isProcessing || isEditProcessing}
                  className={cn(
                    "p-2 rounded-md transition-colors",
                    editSession.canRedo && !isProcessing && !isEditProcessing
                      ? "hover:bg-primary/10 text-foreground"
                      : "text-muted-foreground/50 cursor-not-allowed"
                  )}
                  title="Redo (Ctrl+Shift+Z)"
                >
                  <Redo2 className="h-4 w-4" />
                </button>
              </div>

              {/* Save/Discard buttons */}
              <button
                onClick={handleSaveSession}
                disabled={isProcessing || isEditProcessing}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  !isProcessing && !isEditProcessing
                    ? "hover:bg-green-500/10 text-green-500"
                    : "text-muted-foreground/50 cursor-not-allowed"
                )}
                title="Save changes"
              >
                <Save className="h-4 w-4" />
              </button>
              <button
                onClick={handleDiscardSession}
                disabled={isProcessing || isEditProcessing}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  !isProcessing && !isEditProcessing
                    ? "hover:bg-red-500/10 text-red-500"
                    : "text-muted-foreground/50 cursor-not-allowed"
                )}
                title="Discard changes"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
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
          {selectedAction && selectedAction !== 'trim' && selectedAction !== 'removeBackground' && (
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

          {/* Download button with transparent options */}
          <div className="mt-6 flex gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={isProcessed ? "default" : "outline"}
                  className="glow-amber"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={onDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  {isProcessed ? 'Download Processed' : 'Download Original'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Transparent Versions
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => {
                    if (!imageId) return;
                    const a = document.createElement('a');
                    a.href = `/api/images/${imageId}/transparent?mode=light`;
                    a.download = `${filename.replace(/\.[^/.]+$/, '')}-transparent-light.png`;
                    a.click();
                  }}
                  disabled={!imageId}
                >
                  <Sun className="h-4 w-4 mr-2" />
                  Light Mode
                  <span className="ml-auto text-xs text-muted-foreground">for light bg</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (!imageId) return;
                    const a = document.createElement('a');
                    a.href = `/api/images/${imageId}/transparent?mode=dark`;
                    a.download = `${filename.replace(/\.[^/.]+$/, '')}-transparent-dark.png`;
                    a.click();
                  }}
                  disabled={!imageId}
                >
                  <Moon className="h-4 w-4 mr-2" />
                  Dark Mode
                  <span className="ml-auto text-xs text-muted-foreground">for dark bg</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
