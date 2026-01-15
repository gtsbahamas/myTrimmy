/**
 * Gallery Rail - A2ui Component
 *
 * Horizontal scrolling gallery of recent/processed images.
 * Minimal chrome, focuses on the images themselves.
 */

'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  CheckCircle,
  Clock,
  XCircle,
  Download,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Tables } from '@/types/database';

type ImageRecord = Tables<'images'>;

interface GalleryRailProps {
  images: ImageRecord[];
  onImageClick: (image: ImageRecord) => void;
  onDownload: (image: ImageRecord) => void;
  onDelete: (image: ImageRecord) => void;
  selectedId?: string;
  isLoading?: boolean;
  className?: string;
}

const STATUS_BADGES: Record<string, {
  icon: typeof CheckCircle;
  color: string;
  bg: string;
  animate?: boolean;
}> = {
  completed: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/20' },
  processing: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/20', animate: true },
  pending: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/20' },
  failed: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/20' },
};

export function GalleryRail({
  images,
  onImageClick,
  onDownload,
  onDelete,
  selectedId,
  isLoading,
  className,
}: GalleryRailProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const checkScroll = React.useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  }, []);

  React.useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [checkScroll, images]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 280; // Roughly one card width
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (images.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div className={cn("relative", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Your Images
          <span className="ml-2 text-xs text-muted-foreground/70">
            {images.length} total
          </span>
        </h3>
      </div>

      {/* Scroll container */}
      <div className="relative group">
        {/* Left scroll button */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 flex items-center justify-center rounded-full bg-background/90 border border-border/50 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        {/* Right scroll button */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 flex items-center justify-center rounded-full bg-background/90 border border-border/50 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}

        {/* Gallery */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto scrollbar-none pb-2 -mx-2 px-2"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-56 h-40 rounded-xl bg-muted animate-pulse"
              />
            ))
          ) : (
            images.map((image) => (
              <GalleryItem
                key={image.id}
                image={image}
                isSelected={image.id === selectedId}
                onSelect={() => onImageClick(image)}
                onDownload={() => onDownload(image)}
                onDelete={() => onDelete(image)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

interface GalleryItemProps {
  image: ImageRecord;
  isSelected: boolean;
  onSelect: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

function GalleryItem({
  image,
  isSelected,
  onSelect,
  onDownload,
  onDelete,
}: GalleryItemProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const status = STATUS_BADGES[image.status as keyof typeof STATUS_BADGES] || STATUS_BADGES.pending;
  const StatusIcon = status.icon;
  const displayUrl = image.processed_url || image.original_url;

  return (
    <div
      className={cn(
        "group/item relative flex-shrink-0 w-56 rounded-xl overflow-hidden",
        "border transition-all duration-200 cursor-pointer",
        "scroll-snap-align-start",
        isSelected
          ? "border-primary ring-2 ring-primary/20"
          : "border-border/50 hover:border-primary/50"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
    >
      {/* Image */}
      <div className="relative h-32 bg-muted">
        {/* Checkered background */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(45deg, hsl(var(--muted-foreground) / 0.1) 25%, transparent 25%),
              linear-gradient(-45deg, hsl(var(--muted-foreground) / 0.1) 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, hsl(var(--muted-foreground) / 0.1) 75%),
              linear-gradient(-45deg, transparent 75%, hsl(var(--muted-foreground) / 0.1) 75%)
            `,
            backgroundSize: '12px 12px',
            backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0px',
          }}
        />

        <Image
          src={displayUrl}
          alt={image.filename}
          fill
          className="object-contain p-2"
          sizes="224px"
        />

        {/* Status badge */}
        <div className={cn(
          "absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs",
          status.bg
        )}>
          <StatusIcon className={cn(
            "h-3 w-3",
            status.color,
            status.animate && "animate-spin"
          )} />
        </div>

        {/* Hover overlay with actions */}
        <div className={cn(
          "absolute inset-0 flex items-center justify-center gap-2 bg-background/80 backdrop-blur-sm transition-opacity",
          isHovered ? "opacity-100" : "opacity-0"
        )}>
          <button
            onClick={(e) => { e.stopPropagation(); onDownload(); }}
            className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            title="Download"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="px-3 py-2 bg-card/50">
        <p className="text-xs font-medium truncate" title={image.filename}>
          {image.filename}
        </p>
        {image.width && image.height && (
          <p className="text-xs text-muted-foreground">
            {image.width} × {image.height}
          </p>
        )}
      </div>
    </div>
  );
}
