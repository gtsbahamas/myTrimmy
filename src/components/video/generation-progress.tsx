'use client';

import * as React from 'react';
import { Check, Loader2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VideoBundleStatus } from '@/types/video-bundle';

interface GenerationProgressProps {
  status: VideoBundleStatus;
  progress: number;
  currentStep: string;
  error?: string | null;
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

export function GenerationProgress({
  status,
  progress,
  currentStep,
  error,
}: GenerationProgressProps) {
  const currentIndex = STATUS_ORDER.indexOf(status);

  if (status === 'failed') {
    return (
      <div className="w-full max-w-xl mx-auto p-8 rounded-2xl border border-destructive/50 bg-destructive/5">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10">
            <span className="text-3xl">😔</span>
          </div>
          <h3 className="text-xl font-semibold">Generation Failed</h3>
          <p className="text-muted-foreground">
            {error || 'Something went wrong. Please try again.'}
          </p>
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
