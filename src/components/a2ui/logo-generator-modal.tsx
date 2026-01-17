/**
 * Logo Generator Modal - AI-powered logo generation interface
 *
 * Allows users to describe their logo and select from generated variations.
 */

'use client';

import * as React from 'react';
import { Sparkles, Wand2, X, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  LOGO_STYLES,
  type LogoStyle,
  type LogoVariation,
  type GenerateLogoResponse,
  type GenerateLogoErrorResponse,
} from '@/types/logo-generation';

interface LogoGeneratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogoGenerated: (imageId: string) => void;
}

type GenerationState = 'idle' | 'generating' | 'selecting' | 'saving';

export function LogoGeneratorModal({
  open,
  onOpenChange,
  onLogoGenerated,
}: LogoGeneratorModalProps) {
  const [prompt, setPrompt] = React.useState('');
  const [style, setStyle] = React.useState<LogoStyle>('minimalist');
  const [state, setState] = React.useState<GenerationState>('idle');
  const [variations, setVariations] = React.useState<LogoVariation[]>([]);
  const [selectedVariation, setSelectedVariation] = React.useState<LogoVariation | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Reset state when modal closes
  React.useEffect(() => {
    if (!open) {
      setPrompt('');
      setStyle('minimalist');
      setState('idle');
      setVariations([]);
      setSelectedVariation(null);
      setError(null);
    }
  }, [open]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please describe your logo');
      return;
    }

    setError(null);
    setState('generating');

    try {
      const response = await fetch('/api/generate-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), style }),
      });

      const data = await response.json() as GenerateLogoResponse | GenerateLogoErrorResponse;

      if (!data.success) {
        const errorData = data as GenerateLogoErrorResponse;
        setError(errorData.error);
        setState('idle');
        return;
      }

      const successData = data as GenerateLogoResponse;
      setVariations(successData.variations as LogoVariation[]);
      setState('selecting');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
      setState('idle');
    }
  };

  const handleSelectVariation = (variation: LogoVariation) => {
    setSelectedVariation(variation);
  };

  const handleConfirmSelection = async () => {
    if (!selectedVariation) return;

    setState('saving');
    setError(null);

    try {
      const response = await fetch('/api/generate-logo/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variationId: selectedVariation.id,
          temporaryUrl: selectedVariation.temporaryUrl,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error);
        setState('selecting');
        return;
      }

      // Success - notify parent and close
      onLogoGenerated(data.image.id);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save logo');
      setState('selecting');
    }
  };

  const handleTryAgain = () => {
    setVariations([]);
    setSelectedVariation(null);
    setState('idle');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generate Logo with AI
          </DialogTitle>
          <DialogDescription>
            Describe your logo and we&apos;ll create 3 variations using DALL-E 3
          </DialogDescription>
        </DialogHeader>

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto rounded-full p-1 hover:bg-destructive/20"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Prompt Input (idle state) */}
        {state === 'idle' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="logo-prompt">Describe your logo</Label>
              <Input
                id="logo-prompt"
                placeholder="e.g., A modern tech startup logo with a rocket ship"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                className="text-base"
              />
              <p className="text-xs text-muted-foreground">
                Be specific about colors, shapes, and style you want
              </p>
            </div>

            {/* Style Selection */}
            <div className="space-y-2">
              <Label>Style</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(Object.entries(LOGO_STYLES) as [LogoStyle, typeof LOGO_STYLES[LogoStyle]][]).map(
                  ([key, { label, description }]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setStyle(key)}
                      className={cn(
                        'flex flex-col items-start rounded-lg border p-3 text-left transition-colors',
                        style === key
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <span className="text-sm font-medium">{label}</span>
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {description}
                      </span>
                    </button>
                  )
                )}
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!prompt.trim()}
              className="w-full"
              size="lg"
            >
              <Wand2 className="mr-2 h-4 w-4" />
              Generate Logo
            </Button>
          </div>
        )}

        {/* Generating State */}
        {state === 'generating' && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-primary animate-pulse" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-medium">Generating your logos...</p>
              <p className="text-sm text-muted-foreground">
                Creating 3 unique variations with DALL-E 3
              </p>
            </div>
          </div>
        )}

        {/* Variation Selection */}
        {state === 'selecting' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              {variations.map((variation) => (
                <button
                  key={variation.id}
                  type="button"
                  onClick={() => handleSelectVariation(variation)}
                  className={cn(
                    'relative aspect-square rounded-xl border-2 overflow-hidden transition-all',
                    selectedVariation?.id === variation.id
                      ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.02]'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={variation.temporaryUrl}
                    alt={`Logo variation ${variation.index + 1}`}
                    className="h-full w-full object-cover"
                  />
                  {selectedVariation?.id === variation.id && (
                    <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                      <div className="rounded-full bg-primary p-1">
                        <svg
                          className="h-4 w-4 text-primary-foreground"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleTryAgain}
                className="flex-1"
              >
                Try Different Description
              </Button>
              <Button
                onClick={handleConfirmSelection}
                disabled={!selectedVariation}
                className="flex-1"
              >
                Use This Logo
              </Button>
            </div>
          </div>
        )}

        {/* Saving State */}
        {state === 'saving' && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-medium">Saving your logo...</p>
              <p className="text-sm text-muted-foreground">
                Uploading to your workspace
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
