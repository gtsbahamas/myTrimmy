/**
 * Hero Drop Zone - A2ui Component
 *
 * Central, prominent upload area that serves as the primary interaction point.
 * Designed to be the hero of the interface - everything else materializes around it.
 */

'use client';

import * as React from 'react';
import { Upload, Image as ImageIcon, Sparkles, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeroDropZoneProps {
  onFilesSelected: (files: File[]) => void;
  onGenerateAI?: () => void;
  isUploading?: boolean;
  hasImage?: boolean;
  className?: string;
}

export function HeroDropZone({
  onFilesSelected,
  onGenerateAI,
  isUploading = false,
  hasImage = false,
  className,
}: HeroDropZoneProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(file =>
      file.type.startsWith('image/')
    );
    if (files.length > 0) {
      onFilesSelected(files);
    }
  }, [onFilesSelected]);

  const handleClick = React.useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFileChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesSelected(files);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  }, [onFilesSelected]);

  // Collapsed state when image is present
  if (hasImage) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <button
          type="button"
          onClick={handleClick}
          className={cn(
            "group relative flex items-center gap-3 px-5 py-3",
            "rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm",
            "hover:border-primary/50 hover:bg-primary/5",
            "transition-all duration-300"
          )}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
            <Upload className="h-5 w-5" />
          </div>
          <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
            Upload new logo
          </span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="sr-only"
          />
        </button>
        {onGenerateAI && (
          <button
            type="button"
            onClick={onGenerateAI}
            className={cn(
              "group relative flex items-center gap-3 px-5 py-3",
              "rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm",
              "hover:border-primary/50 hover:bg-primary/5",
              "transition-all duration-300"
            )}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
              <Wand2 className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              Generate with AI
            </span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "group relative flex flex-col items-center justify-center",
        "min-h-[400px] w-full max-w-2xl mx-auto",
        "rounded-3xl border-2 border-dashed",
        "transition-all duration-500 ease-out cursor-pointer",
        isDragging
          ? "border-primary bg-primary/10 scale-[1.02]"
          : "border-border/50 bg-card/30 hover:border-primary/50 hover:bg-card/50",
        isUploading && "pointer-events-none opacity-70",
        className
      )}
    >
      {/* Ambient glow */}
      <div className={cn(
        "absolute inset-0 rounded-3xl transition-opacity duration-500",
        "bg-gradient-radial from-primary/10 via-transparent to-transparent",
        isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-50"
      )} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        {/* Icon */}
        <div className={cn(
          "flex h-20 w-20 items-center justify-center rounded-2xl",
          "bg-primary/10 text-primary mb-6",
          "transition-all duration-300",
          isDragging && "scale-110 bg-primary/20"
        )}>
          {isUploading ? (
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          ) : isDragging ? (
            <Sparkles className="h-10 w-10" />
          ) : (
            <ImageIcon className="h-10 w-10" />
          )}
        </div>

        {/* Text */}
        <h2 className="font-display text-2xl font-medium tracking-tight mb-2">
          {isDragging ? 'Drop it like it\'s hot' : 'Drop your logo here'}
        </h2>
        <p className="text-muted-foreground max-w-sm">
          {isUploading
            ? 'Uploading your masterpiece...'
            : 'Drag and drop your logo, or click to browse. PNG, JPG, WebP up to 10MB.'}
        </p>

        {/* Action buttons */}
        {!isDragging && !isUploading && (
          <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Upload className="h-4 w-4" />
              Click to upload
            </div>
            {onGenerateAI && (
              <>
                <span className="text-muted-foreground text-sm">or</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onGenerateAI();
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-600 dark:text-purple-400 text-sm font-medium hover:from-purple-500/30 hover:to-pink-500/30 transition-all"
                >
                  <Wand2 className="h-4 w-4" />
                  Generate with AI
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="sr-only"
      />
    </div>
  );
}
