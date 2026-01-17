/**
 * Logo Generator Modal - AI-powered logo generation interface
 *
 * Allows users to describe their logo and select from generated variations.
 */

'use client';

import * as React from 'react';
import { Sparkles, Wand2, X, AlertCircle, Loader2, ChevronDown, ChevronUp, Eye } from 'lucide-react';
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
  PALETTE_TYPES,
  COMPOSITION_TYPES,
  SHAPE_TYPES,
  BACKGROUND_TYPES,
  ICON_STYLES,
  TYPOGRAPHY_STYLES,
  DETAIL_LEVELS,
  ARTIST_INFLUENCES,
  DEFAULT_ADVANCED_SETTINGS,
  previewEnhancedPrompt,
  type LogoStyle,
  type LogoVariation,
  type GenerateLogoResponse,
  type GenerateLogoErrorResponse,
  type GeneratorMode,
  type AdvancedLogoSettings,
  type PaletteType,
  type CompositionType,
  type ShapeType,
  type BackgroundType,
  type IconStyle,
  type TypographyStyle,
  type DetailLevel,
  type ArtistInfluence,
} from '@/types/logo-generation';

interface LogoGeneratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogoGenerated: (imageId: string) => void;
}

// Collapsible section component for advanced controls
function CollapsibleSection({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-3 py-2.5 hover:bg-muted/50 transition-colors"
      >
        <span className="text-sm font-medium">{title}</span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {expanded && (
        <div className="px-3 pb-3 pt-1">
          {children}
        </div>
      )}
    </div>
  );
}

type GenerationState = 'idle' | 'generating' | 'selecting' | 'saving';

export function LogoGeneratorModal({
  open,
  onOpenChange,
  onLogoGenerated,
}: LogoGeneratorModalProps) {
  const [prompt, setPrompt] = React.useState('');
  const [style, setStyle] = React.useState<LogoStyle>('minimalist');
  const [mode, setMode] = React.useState<GeneratorMode>('basic');
  const [advancedSettings, setAdvancedSettings] = React.useState<AdvancedLogoSettings>(DEFAULT_ADVANCED_SETTINGS);
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(new Set());
  const [showPromptPreview, setShowPromptPreview] = React.useState(false);
  const [state, setState] = React.useState<GenerationState>('idle');
  const [variations, setVariations] = React.useState<LogoVariation[]>([]);
  const [selectedVariation, setSelectedVariation] = React.useState<LogoVariation | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Reset state when modal closes
  React.useEffect(() => {
    if (!open) {
      setPrompt('');
      setStyle('minimalist');
      setMode('basic');
      setAdvancedSettings(DEFAULT_ADVANCED_SETTINGS);
      setExpandedSections(new Set());
      setShowPromptPreview(false);
      setState('idle');
      setVariations([]);
      setSelectedVariation(null);
      setError(null);
    }
  }, [open]);

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  // Update advanced settings helper
  const updateAdvancedSetting = <K extends keyof AdvancedLogoSettings>(
    key: K,
    value: AdvancedLogoSettings[K]
  ) => {
    setAdvancedSettings(prev => ({ ...prev, [key]: value }));
  };

  // Update color settings helper
  const updateColorSetting = <K extends keyof AdvancedLogoSettings['colors']>(
    key: K,
    value: AdvancedLogoSettings['colors'][K]
  ) => {
    setAdvancedSettings(prev => ({
      ...prev,
      colors: { ...prev.colors, [key]: value },
    }));
  };

  // Sync mood when switching from basic to advanced
  const handleModeChange = (newMode: GeneratorMode) => {
    if (newMode === 'advanced' && mode === 'basic') {
      // Sync the basic style to advanced mood
      setAdvancedSettings(prev => ({ ...prev, mood: style }));
    } else if (newMode === 'basic' && mode === 'advanced') {
      // Sync the advanced mood to basic style
      setStyle(advancedSettings.mood);
    }
    setMode(newMode);
  };

  // Check if typography controls should be enabled
  const isTypographyEnabled = advancedSettings.composition !== 'icon_only';
  // Check if icon style controls should be enabled
  const isIconStyleEnabled = advancedSettings.composition !== 'wordmark_only';

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please describe your logo');
      return;
    }

    setError(null);
    setState('generating');

    try {
      const requestBody = mode === 'advanced'
        ? { prompt: prompt.trim(), mode, advancedSettings }
        : { prompt: prompt.trim(), style, mode };

      const response = await fetch('/api/generate-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
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
            {/* Mode Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-1 bg-muted/30">
              <button
                type="button"
                onClick={() => handleModeChange('basic')}
                className={cn(
                  'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors',
                  mode === 'basic'
                    ? 'bg-background shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Basic
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('advanced')}
                className={cn(
                  'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors',
                  mode === 'advanced'
                    ? 'bg-background shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Advanced
              </button>
            </div>

            {/* Prompt Input */}
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
                {mode === 'basic'
                  ? 'Be specific about colors, shapes, and style you want'
                  : 'Describe the concept - use controls below for style details'}
              </p>
            </div>

            {/* Basic Mode: Style Selection */}
            {mode === 'basic' && (
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
            )}

            {/* Advanced Mode: Collapsible Sections */}
            {mode === 'advanced' && (
              <div className="space-y-4">
                {/* Artist Influence - PRIMARY CONTROL */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Creative Direction</Label>
                    <span className="text-[10px] text-muted-foreground">Choose an artistic influence</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(Object.entries(ARTIST_INFLUENCES) as [ArtistInfluence, typeof ARTIST_INFLUENCES[ArtistInfluence]][])
                      .filter(([key]) => key !== 'none')
                      .map(([key, { label, subtitle, description }]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => updateAdvancedSetting('artistInfluence', key)}
                          className={cn(
                            'flex flex-col items-start rounded-lg border p-3 text-left transition-all',
                            advancedSettings.artistInfluence === key
                              ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                              : 'border-border hover:border-primary/50 hover:bg-muted/30'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{label}</span>
                            <span className="text-[10px] text-muted-foreground">· {subtitle}</span>
                          </div>
                          <span className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                            {description}
                          </span>
                        </button>
                      ))}
                  </div>
                  {/* Show philosophy for selected artist */}
                  {advancedSettings.artistInfluence !== 'none' && (
                    <div className="rounded-lg bg-muted/30 px-3 py-2 text-xs text-muted-foreground italic">
                      &ldquo;{ARTIST_INFLUENCES[advancedSettings.artistInfluence].philosophy}&rdquo;
                    </div>
                  )}
                </div>

                {/* Fine-Tuning Section Header */}
                <div className="flex items-center gap-2 pt-2">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Fine-tune (optional)</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Composition Section */}
                <CollapsibleSection
                  title="Composition"
                  expanded={expandedSections.has('composition')}
                  onToggle={() => toggleSection('composition')}
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Layout</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {(Object.entries(COMPOSITION_TYPES) as [CompositionType, typeof COMPOSITION_TYPES[CompositionType]][]).map(
                          ([key, { label, description }]) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => updateAdvancedSetting('composition', key)}
                              className={cn(
                                'flex flex-col items-start rounded-lg border p-2 text-left transition-colors',
                                advancedSettings.composition === key
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:border-primary/50'
                              )}
                            >
                              <span className="text-xs font-medium">{label}</span>
                              <span className="text-[10px] text-muted-foreground line-clamp-1">
                                {description}
                              </span>
                            </button>
                          )
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Shape</Label>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {(Object.entries(SHAPE_TYPES) as [ShapeType, typeof SHAPE_TYPES[ShapeType]][]).map(
                          ([key, { label }]) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => updateAdvancedSetting('shape', key)}
                              className={cn(
                                'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                                advancedSettings.shape === key
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:border-primary/50'
                              )}
                            >
                              {label}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>

                {/* Colors Section */}
                <CollapsibleSection
                  title="Colors"
                  expanded={expandedSections.has('colors')}
                  onToggle={() => toggleSection('colors')}
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Palette Type</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {(Object.entries(PALETTE_TYPES) as [PaletteType, typeof PALETTE_TYPES[PaletteType]][]).map(
                          ([key, { label }]) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => updateColorSetting('paletteType', key)}
                              className={cn(
                                'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                                advancedSettings.colors.paletteType === key
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:border-primary/50'
                              )}
                            >
                              {label}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                    {/* Custom Color Pickers */}
                    {advancedSettings.colors.paletteType === 'custom' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Primary Color</Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={advancedSettings.colors.primaryColor || '#3B82F6'}
                              onChange={(e) => updateColorSetting('primaryColor', e.target.value)}
                              className="h-8 w-12 rounded border cursor-pointer"
                            />
                            <Input
                              value={advancedSettings.colors.primaryColor || ''}
                              onChange={(e) => updateColorSetting('primaryColor', e.target.value || null)}
                              placeholder="#3B82F6"
                              className="h-8 text-xs font-mono"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Secondary Color</Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={advancedSettings.colors.secondaryColor || '#10B981'}
                              onChange={(e) => updateColorSetting('secondaryColor', e.target.value)}
                              className="h-8 w-12 rounded border cursor-pointer"
                            />
                            <Input
                              value={advancedSettings.colors.secondaryColor || ''}
                              onChange={(e) => updateColorSetting('secondaryColor', e.target.value || null)}
                              placeholder="#10B981"
                              className="h-8 text-xs font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CollapsibleSection>

                {/* Style Section */}
                <CollapsibleSection
                  title="Style"
                  expanded={expandedSections.has('style')}
                  onToggle={() => toggleSection('style')}
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Icon Style</Label>
                      <div className={cn(
                        'grid grid-cols-3 sm:grid-cols-5 gap-2',
                        !isIconStyleEnabled && 'opacity-50 pointer-events-none'
                      )}>
                        {(Object.entries(ICON_STYLES) as [IconStyle, typeof ICON_STYLES[IconStyle]][]).map(
                          ([key, { label }]) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => updateAdvancedSetting('iconStyle', key)}
                              disabled={!isIconStyleEnabled}
                              className={cn(
                                'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                                advancedSettings.iconStyle === key
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:border-primary/50'
                              )}
                            >
                              {label}
                            </button>
                          )
                        )}
                      </div>
                      {!isIconStyleEnabled && (
                        <p className="text-[10px] text-muted-foreground">
                          Icon style disabled for wordmark-only composition
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Typography</Label>
                      <div className={cn(
                        'grid grid-cols-3 sm:grid-cols-5 gap-2',
                        !isTypographyEnabled && 'opacity-50 pointer-events-none'
                      )}>
                        {(Object.entries(TYPOGRAPHY_STYLES) as [TypographyStyle, typeof TYPOGRAPHY_STYLES[TypographyStyle]][]).map(
                          ([key, { label }]) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => updateAdvancedSetting('typography', key)}
                              disabled={!isTypographyEnabled}
                              className={cn(
                                'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                                advancedSettings.typography === key
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:border-primary/50'
                              )}
                            >
                              {label}
                            </button>
                          )
                        )}
                      </div>
                      {!isTypographyEnabled && (
                        <p className="text-[10px] text-muted-foreground">
                          Typography disabled for icon-only composition
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Detail Level</Label>
                      <div className="flex gap-1">
                        {([1, 2, 3, 4, 5] as DetailLevel[]).map((level) => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => updateAdvancedSetting('detailLevel', level)}
                            className={cn(
                              'flex-1 rounded-lg border py-2 text-sm font-medium transition-colors',
                              advancedSettings.detailLevel === level
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            )}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                        <span>Simple</span>
                        <span>Intricate</span>
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>

                {/* Background Section */}
                <CollapsibleSection
                  title="Background"
                  expanded={expandedSections.has('background')}
                  onToggle={() => toggleSection('background')}
                >
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(Object.entries(BACKGROUND_TYPES) as [BackgroundType, typeof BACKGROUND_TYPES[BackgroundType]][]).map(
                      ([key, { label, description }]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => updateAdvancedSetting('background', key)}
                          className={cn(
                            'flex flex-col items-start rounded-lg border p-2 text-left transition-colors',
                            advancedSettings.background === key
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          )}
                        >
                          <span className="text-xs font-medium">{label}</span>
                          <span className="text-[10px] text-muted-foreground line-clamp-1">
                            {description}
                          </span>
                        </button>
                      )
                    )}
                  </div>
                </CollapsibleSection>

                {/* Mood Section */}
                <CollapsibleSection
                  title="Mood"
                  expanded={expandedSections.has('mood')}
                  onToggle={() => toggleSection('mood')}
                >
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(Object.entries(LOGO_STYLES) as [LogoStyle, typeof LOGO_STYLES[LogoStyle]][]).map(
                      ([key, { label, description }]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => updateAdvancedSetting('mood', key)}
                          className={cn(
                            'flex flex-col items-start rounded-lg border p-2 text-left transition-colors',
                            advancedSettings.mood === key
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          )}
                        >
                          <span className="text-xs font-medium">{label}</span>
                          <span className="text-[10px] text-muted-foreground line-clamp-1">
                            {description}
                          </span>
                        </button>
                      )
                    )}
                  </div>
                </CollapsibleSection>

                {/* Prompt Preview */}
                <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowPromptPreview(!showPromptPreview)}
                    className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    {showPromptPreview ? 'Hide' : 'Show'} Prompt Preview
                  </button>
                  {showPromptPreview && (
                    <p className="text-xs text-muted-foreground font-mono leading-relaxed">
                      {previewEnhancedPrompt(prompt, mode, style, advancedSettings)}
                    </p>
                  )}
                </div>
              </div>
            )}

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
