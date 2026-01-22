'use client';

import * as React from 'react';
import { Check, Loader2, Circle, RefreshCw, AlertCircle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { VideoBundleStatus } from '@/types/video-bundle';

interface GenerationProgressProps {
  status: VideoBundleStatus;
  progress: number;
  currentStep: string;
  error?: string | null;
  onRetry?: () => void;
  onStartOver?: () => void;
}

const STEPS: { status: VideoBundleStatus; label: string }[] = [
  { status: 'analyzing', label: 'Analyzing URL' },
  { status: 'composing', label: 'Composing scenes' },
  { status: 'rendering', label: 'Rendering videos' },
  { status: 'validating', label: 'Quality validation' },
  { status: 'reviewing', label: 'Final review' },
  { status: 'completed', label: 'Complete' },
];

const STATUS_ORDER: VideoBundleStatus[] = [
  'pending',
  'analyzing',
  'composing',
  'rendering',
  'validating',
  'reviewing',
  'completed',
];

// Error classification for user-friendly messaging
type ErrorType = 'transient' | 'user_fixable' | 'recoverable' | 'fatal';

function classifyError(errorMessage?: string | null): { type: ErrorType; title: string; description: string; canRetry: boolean } {
  if (!errorMessage) {
    return {
      type: 'transient',
      title: 'Something went wrong',
      description: 'An unexpected error occurred. Please try again.',
      canRetry: true,
    };
  }

  const lowerError = errorMessage.toLowerCase();

  // User-fixable errors
  if (lowerError.includes('invalid url') || lowerError.includes('url format')) {
    return {
      type: 'user_fixable',
      title: 'Invalid URL',
      description: 'Please check the URL and make sure it\'s a valid, publicly accessible website.',
      canRetry: false,
    };
  }

  if (lowerError.includes('no content') || lowerError.includes('empty page')) {
    return {
      type: 'user_fixable',
      title: 'Not Enough Content',
      description: 'The page doesn\'t have enough content to analyze. Try a page with more text and images.',
      canRetry: false,
    };
  }

  if (lowerError.includes('access denied') || lowerError.includes('403') || lowerError.includes('blocked')) {
    return {
      type: 'user_fixable',
      title: 'Page Not Accessible',
      description: 'We couldn\'t access this page. Make sure it\'s publicly accessible (not behind a login).',
      canRetry: false,
    };
  }

  // Transient errors (can retry)
  if (lowerError.includes('timeout') || lowerError.includes('timed out')) {
    return {
      type: 'transient',
      title: 'Request Timed Out',
      description: 'The page took too long to load. We\'ve saved your progress - try again to resume.',
      canRetry: true,
    };
  }

  if (lowerError.includes('rate limit') || lowerError.includes('too many requests')) {
    return {
      type: 'transient',
      title: 'Too Many Requests',
      description: 'Please wait a moment and try again.',
      canRetry: true,
    };
  }

  if (lowerError.includes('network') || lowerError.includes('connection')) {
    return {
      type: 'transient',
      title: 'Network Error',
      description: 'There was a connection issue. Please check your internet and try again.',
      canRetry: true,
    };
  }

  // Recoverable errors (partial success possible)
  if (lowerError.includes('partial') || lowerError.includes('some formats')) {
    return {
      type: 'recoverable',
      title: 'Partial Success',
      description: 'Some video formats were generated. You can download what\'s available or retry the failed ones.',
      canRetry: true,
    };
  }

  // Fatal errors
  if (lowerError.includes('quota') || lowerError.includes('limit exceeded')) {
    return {
      type: 'fatal',
      title: 'Generation Limit Reached',
      description: 'You\'ve used all your video generations this month. Upgrade your plan for more.',
      canRetry: false,
    };
  }

  // Default to transient
  return {
    type: 'transient',
    title: 'Generation Failed',
    description: errorMessage,
    canRetry: true,
  };
}

export function GenerationProgress({
  status,
  progress,
  currentStep,
  error,
  onRetry,
  onStartOver,
}: GenerationProgressProps) {
  const currentIndex = STATUS_ORDER.indexOf(status);

  if (status === 'failed') {
    const errorInfo = classifyError(error);

    return (
      <div className="w-full max-w-xl mx-auto p-8 rounded-2xl border border-destructive/50 bg-destructive/5">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="text-xl font-semibold">{errorInfo.title}</h3>
          <p className="text-muted-foreground">
            {errorInfo.description}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            {errorInfo.canRetry && onRetry && (
              <Button onClick={onRetry} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
            )}
            {onStartOver && (
              <Button variant="outline" onClick={onStartOver}>
                Start Over
              </Button>
            )}
          </div>

          {errorInfo.type === 'fatal' && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <a
                href="/settings"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <HelpCircle className="w-4 h-4" />
                View your plan and usage
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto space-y-8">
      {/* Progress Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{currentStep}</span>
          <span className="text-muted-foreground">{progress}%</span>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step List */}
      <div className="space-y-3">
        {STEPS.map((step, index) => {
          const stepIndex = STATUS_ORDER.indexOf(step.status);
          const isCompleted = currentIndex > stepIndex;
          const isCurrent = status === step.status;
          const isPending = currentIndex < stepIndex;

          return (
            <div
              key={step.status}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-all duration-300",
                isCurrent && "bg-primary/10",
                isCompleted && "opacity-60"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300",
                  isCompleted && "bg-green-500/20 text-green-500",
                  isCurrent && "bg-primary/20 text-primary",
                  isPending && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Circle className="w-4 h-4" />
                )}
              </div>
              <span
                className={cn(
                  "font-medium",
                  isPending && "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Estimated Time */}
      {status !== 'completed' && (
        <p className="text-center text-sm text-muted-foreground">
          Estimated: ~2 minutes remaining
        </p>
      )}
    </div>
  );
}
