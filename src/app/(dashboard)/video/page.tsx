'use client';

import * as React from 'react';
import { Video, Sparkles } from 'lucide-react';
import { UrlInput, CustomizationPanel, GenerationProgress, VideoPreview } from '@/components/video';
import type {
  AnalyzeUrlResponse,
  GenerateVideoResponse,
  VideoBundleStatusResponse,
  VideoStyle,
  MusicMood,
} from '@/types/video-bundle';

type Step = 'input' | 'customize' | 'generating' | 'complete';

export default function VideoPage() {
  const [step, setStep] = React.useState<Step>('input');
  const [sourceUrl, setSourceUrl] = React.useState('');
  const [analysisData, setAnalysisData] = React.useState<AnalyzeUrlResponse | null>(null);
  const [bundleId, setBundleId] = React.useState<string | null>(null);
  const [statusData, setStatusData] = React.useState<VideoBundleStatusResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  // Analyze URL
  const handleAnalyze = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setSourceUrl(url);

    try {
      const res = await fetch('/api/video/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to analyze URL');
      }

      const data: AnalyzeUrlResponse = await res.json();
      setAnalysisData(data);
      setStep('customize');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze URL');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate videos
  const handleGenerate = async (options: {
    style: VideoStyle;
    musicMood: MusicMood;
    durationSeconds: number;
  }) => {
    setIsLoading(true);
    setError(null);
    setStep('generating');

    try {
      const res = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceUrl,
          ...options,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to start generation');
      }

      const data: GenerateVideoResponse = await res.json();
      setBundleId(data.bundleId);

      // Start polling for status
      pollStatus(data.bundleId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate videos');
      setStep('customize');
    } finally {
      setIsLoading(false);
    }
  };

  // Poll for generation status
  const pollStatus = React.useCallback(async (id: string) => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/video/${id}`);
        if (!res.ok) return;

        const data: VideoBundleStatusResponse = await res.json();
        setStatusData(data);

        if (data.status === 'completed') {
          setStep('complete');
          return;
        }

        if (data.status === 'failed') {
          setError(data.error || 'Generation failed');
          return;
        }

        // Continue polling
        setTimeout(poll, 2000);
      } catch {
        // Retry on network error
        setTimeout(poll, 5000);
      }
    };

    poll();
  }, []);

  // Regenerate
  const handleRegenerate = () => {
    if (analysisData) {
      setStep('customize');
      setBundleId(null);
      setStatusData(null);
    }
  };

  // Reset to start
  const handleReset = () => {
    setStep('input');
    setSourceUrl('');
    setAnalysisData(null);
    setBundleId(null);
    setStatusData(null);
    setError(null);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/30">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Video className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Video Bundles</h1>
                <p className="text-sm text-muted-foreground">
                  One URL in, promo videos out
                </p>
              </div>
            </div>
            {step !== 'input' && (
              <button
                type="button"
                onClick={handleReset}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Start Over
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        {step === 'input' && (
          <div className="space-y-12">
            {/* Hero */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                AI-Powered Video Generation
              </div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                Create Stunning Promo Videos
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Paste any URL and we&apos;ll generate professional promo videos for
                landscape, portrait, and square formats.
              </p>
            </div>

            {/* URL Input */}
            <UrlInput
              onSubmit={handleAnalyze}
              isLoading={isLoading}
              error={error}
            />

            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto pt-8">
              {[
                {
                  title: 'AI Analysis',
                  description: 'We analyze your site to extract colors, content, and screenshots.',
                },
                {
                  title: '3 Formats',
                  description: 'Get landscape, portrait, and square videos for every platform.',
                },
                {
                  title: 'Quality Validated',
                  description: 'Every video passes automated quality checks before delivery.',
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="p-6 rounded-xl border border-border/50 bg-card/30"
                >
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 'customize' && analysisData && (
          <CustomizationPanel
            analysis={analysisData.analysis}
            suggestedStyle={analysisData.suggestedStyle}
            suggestedMusicMood={analysisData.suggestedMusicMood}
            suggestedDuration={analysisData.suggestedDuration}
            onGenerate={handleGenerate}
            isGenerating={isLoading}
          />
        )}

        {step === 'generating' && statusData && (
          <GenerationProgress
            status={statusData.status}
            progress={statusData.progress}
            currentStep={statusData.currentStep}
            error={statusData.error}
          />
        )}

        {step === 'generating' && !statusData && (
          <GenerationProgress
            status="pending"
            progress={0}
            currentStep="Starting generation..."
          />
        )}

        {step === 'complete' && statusData?.outputs && (
          <VideoPreview
            outputs={statusData.outputs}
            onRegenerate={handleRegenerate}
          />
        )}
      </div>
    </div>
  );
}
