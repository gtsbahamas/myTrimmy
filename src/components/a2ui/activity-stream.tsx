/**
 * Activity Stream - A2ui Component
 *
 * Real-time feed of processing activities and status updates.
 * Shows what's happening with uploads and processing.
 */

'use client';

import * as React from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Upload,
  Scissors,
  Maximize2,
  FileType,
  Download,
  Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export interface Activity {
  id: string;
  type: 'upload' | 'process' | 'download' | 'error';
  action?: 'trim' | 'resize' | 'convert' | 'rotate' | 'optimize' | 'bundle';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message: string;
  timestamp: Date;
  duration?: number; // in ms
  filename?: string;
}

interface ActivityStreamProps {
  activities: Activity[];
  className?: string;
}

const ACTION_ICONS = {
  upload: Upload,
  trim: Scissors,
  resize: Maximize2,
  convert: FileType,
  rotate: RefreshCw,
  optimize: RefreshCw,
  bundle: Package,
  download: Download,
};

const STATUS_STYLES: Record<Activity['status'], {
  icon: typeof Clock;
  color: string;
  bg: string;
  animate?: boolean;
}> = {
  pending: {
    icon: Clock,
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
  },
  processing: {
    icon: RefreshCw,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    animate: true,
  },
  completed: {
    icon: CheckCircle,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
  failed: {
    icon: XCircle,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
  },
};

export function ActivityStream({ activities, className }: ActivityStreamProps) {
  if (activities.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Recent Activity</h3>
      <div className="space-y-1">
        {activities.slice(0, 5).map((activity, index) => (
          <ActivityItem
            key={activity.id}
            activity={activity}
            isLatest={index === 0}
          />
        ))}
      </div>
    </div>
  );
}

interface ActivityItemProps {
  activity: Activity;
  isLatest?: boolean;
}

function ActivityItem({ activity, isLatest }: ActivityItemProps) {
  const status = STATUS_STYLES[activity.status];
  const StatusIcon = status.icon;
  const ActionIcon = activity.action
    ? ACTION_ICONS[activity.action]
    : activity.type === 'upload'
    ? Upload
    : activity.type === 'download'
    ? Download
    : Clock;

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300",
        isLatest && activity.status === 'processing' && "bg-primary/5 border border-primary/20",
        !isLatest && "opacity-70 hover:opacity-100"
      )}
    >
      {/* Status icon */}
      <div className={cn(
        "flex h-7 w-7 items-center justify-center rounded-lg",
        status.bg
      )}>
        <StatusIcon
          className={cn(
            "h-4 w-4",
            status.color,
            status.animate && "animate-spin"
          )}
        />
      </div>

      {/* Action icon + message */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <ActionIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-sm truncate">{activity.message}</span>
        </div>
        {activity.filename && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {activity.filename}
          </p>
        )}
      </div>

      {/* Timestamp + duration */}
      <div className="flex-shrink-0 text-right">
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
        </span>
        {activity.duration && activity.status === 'completed' && (
          <p className="text-xs text-green-500">
            {(activity.duration / 1000).toFixed(1)}s
          </p>
        )}
      </div>
    </div>
  );
}

// Hook for managing activity state
export function useActivityStream() {
  const [activities, setActivities] = React.useState<Activity[]>([]);

  const addActivity = React.useCallback((
    type: Activity['type'],
    message: string,
    options?: Partial<Activity>
  ) => {
    const activity: Activity = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      type,
      status: 'pending',
      message,
      timestamp: new Date(),
      ...options,
    };
    setActivities(prev => [activity, ...prev].slice(0, 20));
    return activity.id;
  }, []);

  const updateActivity = React.useCallback((
    id: string,
    updates: Partial<Activity>
  ) => {
    setActivities(prev =>
      prev.map(a => a.id === id ? { ...a, ...updates } : a)
    );
  }, []);

  const clearActivities = React.useCallback(() => {
    setActivities([]);
  }, []);

  return {
    activities,
    addActivity,
    updateActivity,
    clearActivities,
  };
}
