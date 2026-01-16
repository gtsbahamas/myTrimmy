'use client';

/**
 * Edit History Timeline - A2ui Component
 *
 * Visual timeline showing operation icons with current position indicator.
 * Optionally allows clicking to jump to any point in the history.
 */

import * as React from 'react';
import {
  Scissors,
  Crop,
  RotateCw,
  Maximize2,
  Sparkles,
  FileType,
  Eraser,
  Circle,
  ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEditSessionOptional } from '@/contexts/edit-session-context';
import type { EditOperationType, EditOperationRecord } from '@/types/edit-history';

// Map operation types to icons
const OPERATION_ICONS: Record<EditOperationType, React.ComponentType<{ className?: string }>> = {
  trim: Scissors,
  crop: Crop,
  rotate: RotateCw,
  resize: Maximize2,
  optimize: Sparkles,
  convert: FileType,
  removeBackground: Eraser,
};

// Map operation types to display labels
const OPERATION_LABELS: Record<EditOperationType, string> = {
  trim: 'Trim',
  crop: 'Crop',
  rotate: 'Rotate',
  resize: 'Resize',
  optimize: 'Optimize',
  convert: 'Convert',
  removeBackground: 'Remove BG',
};

interface EditHistoryTimelineProps {
  className?: string;
  /** Show operation labels below icons */
  showLabels?: boolean;
  /** Compact mode - smaller icons, no labels */
  compact?: boolean;
}

export function EditHistoryTimeline({
  className,
  showLabels = false,
  compact = false,
}: EditHistoryTimelineProps) {
  const editSession = useEditSessionOptional();

  if (!editSession?.hasSession || editSession.operations.length === 0) {
    return null;
  }

  const { operations, session } = editSession;
  const currentPosition = session?.current_position || 0;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {/* Original state indicator */}
      <TimelineItem
        position={0}
        isActive={currentPosition === 0}
        isFuture={currentPosition < 0}
        compact={compact}
        showLabels={showLabels}
        icon={ImageIcon}
        label="Original"
      />

      {/* Connector line */}
      <div className={cn(
        "h-0.5 flex-shrink-0",
        compact ? "w-2" : "w-4",
        currentPosition > 0 ? "bg-primary" : "bg-border"
      )} />

      {/* Operations */}
      {operations.map((op, index) => {
        const Icon = OPERATION_ICONS[op.operation_type as EditOperationType] || Circle;
        const label = OPERATION_LABELS[op.operation_type as EditOperationType] || op.operation_type;
        const isActive = op.position === currentPosition;
        const isFuture = op.position > currentPosition;

        return (
          <React.Fragment key={op.id}>
            <TimelineItem
              position={op.position}
              isActive={isActive}
              isFuture={isFuture}
              compact={compact}
              showLabels={showLabels}
              icon={Icon}
              label={label}
              operation={op}
            />
            {/* Connector line between items */}
            {index < operations.length - 1 && (
              <div className={cn(
                "h-0.5 flex-shrink-0",
                compact ? "w-2" : "w-4",
                operations[index + 1].position <= currentPosition ? "bg-primary" : "bg-border"
              )} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// Timeline item component
interface TimelineItemProps {
  position: number;
  isActive: boolean;
  isFuture: boolean;
  compact: boolean;
  showLabels: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  operation?: EditOperationRecord;
}

function TimelineItem({
  position,
  isActive,
  isFuture,
  compact,
  showLabels,
  icon: Icon,
  label,
  operation,
}: TimelineItemProps) {
  const editSession = useEditSessionOptional();

  // Format duration
  const formatDuration = (ms: number | null) => {
    if (!ms) return null;
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          "flex items-center justify-center rounded-full border-2 transition-all",
          compact ? "w-6 h-6" : "w-8 h-8",
          isActive
            ? "border-primary bg-primary text-primary-foreground scale-110"
            : isFuture
              ? "border-border bg-background text-muted-foreground/50"
              : "border-primary/50 bg-primary/10 text-primary"
        )}
        title={operation ? `${label} (${formatDuration(operation.duration_ms) || 'N/A'})` : label}
      >
        <Icon className={cn(compact ? "h-3 w-3" : "h-4 w-4")} />
      </div>
      {showLabels && !compact && (
        <span className={cn(
          "mt-1 text-xs whitespace-nowrap",
          isActive ? "text-foreground font-medium" : isFuture ? "text-muted-foreground/50" : "text-muted-foreground"
        )}>
          {label}
        </span>
      )}
    </div>
  );
}

// Compact inline version for displaying in tight spaces
export function EditHistoryBadge({ className }: { className?: string }) {
  const editSession = useEditSessionOptional();

  if (!editSession?.hasSession) {
    return null;
  }

  const { operations, session, canUndo, canRedo } = editSession;
  const currentPosition = session?.current_position || 0;
  const totalOperations = operations.length;

  if (totalOperations === 0) {
    return null;
  }

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-card/50 border border-border/50 text-xs",
      className
    )}>
      <span className={cn(
        "font-medium",
        canUndo || canRedo ? "text-primary" : "text-muted-foreground"
      )}>
        {currentPosition}/{totalOperations}
      </span>
      <span className="text-muted-foreground">edits</span>
    </div>
  );
}
