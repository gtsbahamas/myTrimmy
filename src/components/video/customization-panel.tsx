'use client';

import * as React from 'react';
import Image from 'next/image';
import { Sparkles, Music, Clock, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import type { SiteAnalysis, VideoStyle, MusicMood } from '@/types/video-bundle';

interface CustomizationPanelProps {
  analysis: SiteAnalysis;
  suggestedStyle: VideoStyle;
  suggestedMusicMood: MusicMood;
  suggestedDuration: number;
  onGenerate: (options: {
    style: VideoStyle;
    musicMood: MusicMood;
    durationSeconds: number;
  }) => void;
  isGenerating?: boolean;
}

const STYLES: { id: VideoStyle; label: string; description: string }[] = [
  { id: 'minimal', label: 'Minimal', description: 'Clean fades, subtle motion' },
  { id: 'energetic', label: 'Energetic', description: 'Punchy cuts, dynamic zoom' },
  { id: 'professional', label: 'Professional', description: 'Smooth glides, elegant pans' },
];

const MUSIC_OPTIONS: { id: MusicMood; label: string }[] = [
  { id: 'ambient', label: 'Ambient & Techy' },
  { id: 'upbeat', label: 'Upbeat & Confident' },
  { id: 'cinematic', label: 'Cinematic' },
  { id: 'none', label: 'No Music' },
];

export function CustomizationPanel({
  analysis,
  suggestedStyle,
  suggestedMusicMood,
  suggestedDuration,
  onGenerate,
  isGenerating = false,
}: CustomizationPanelProps) {
  const [style, setStyle] = React.useState<VideoStyle>(suggestedStyle);
  const [musicMood, setMusicMood] = React.useState<MusicMood>(suggestedMusicMood);
  const [duration, setDuration] = React.useState(suggestedDuration);

  const handleGenerate = () => {
    onGenerate({
      style,
      musicMood,
      durationSeconds: duration,
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Site Preview */}
      <div className="flex flex-col md:flex-row gap-6 p-6 rounded-2xl border border-border/50 bg-card/30">
        {analysis.screenshots.full && (
          <div className="relative w-full md:w-48 h-32 rounded-lg overflow-hidden border border-border/50 flex-shrink-0">
            <Image
              src={analysis.screenshots.full}
              alt="Site preview"
              fill
              className="object-cover object-top"
            />
          </div>
        )}
        <div className="flex-1 space-y-2">
          <h3 className="font-semibold text-lg">{analysis.content.headline}</h3>
          {analysis.content.subheadline && (
            <p className="text-muted-foreground">{analysis.content.subheadline}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-3">
            {analysis.content.features.slice(0, 3).map((feature, i) => (
              <span
                key={i}
                className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary"
              >
                {feature.length > 30 ? feature.slice(0, 30) + '...' : feature}
              </span>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            {Object.entries(analysis.colors).slice(0, 4).map(([name, color]) => (
              <div
                key={name}
                className="w-6 h-6 rounded-full border border-border/50"
                style={{ backgroundColor: color }}
                title={name}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Style Selection */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Choose Your Style</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STYLES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStyle(s.id)}
              className={cn(
                "p-4 rounded-xl border-2 text-left transition-all duration-200",
                style === s.id
                  ? "border-primary bg-primary/10"
                  : "border-border/50 hover:border-primary/30 hover:bg-card/50"
              )}
            >
              <div className="font-medium">{s.label}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.description}</div>
              {s.id === suggestedStyle && (
                <span className="inline-block mt-2 text-xs text-primary">Recommended</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Music Mood */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Music className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Music Mood</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          {MUSIC_OPTIONS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMusicMood(m.id)}
              className={cn(
                "px-4 py-2 rounded-full border-2 text-sm font-medium transition-all duration-200",
                musicMood === m.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/50 hover:border-primary/30"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Duration</h3>
          </div>
          <span className="text-lg font-mono">{duration}s</span>
        </div>
        <Slider
          value={[duration]}
          onValueChange={([value]: number[]) => setDuration(value)}
          min={15}
          max={90}
          step={5}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>15s</span>
          <span>Quick</span>
          <span>Standard</span>
          <span>Extended</span>
          <span>90s</span>
        </div>
      </div>

      {/* Generate Button */}
      <div className="pt-4">
        <Button
          size="lg"
          className="w-full md:w-auto"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Generating...
            </>
          ) : (
            <>
              Generate Videos
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
