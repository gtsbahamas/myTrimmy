'use client';

import * as React from 'react';
import { Video, Sparkles } from 'lucide-react';
import { UrlInput, CustomizationPanel, GenerationProgress, VideoPreview, UsageQuota } from '@/components/video';
import { useTrack, useFlowTracker } from '@/lib/analytics';
import type {
  AnalyzeUrlResponse,
  GenerateVideoResponse,
  VideoBundleStatusResponse,
  VideoStyle,
  MusicMood,
} from '@/types/video-bundle';

type Step = 'input' | 'customize' | 'generating' | 'complete';

interface UserQuota {
  used: number;
  limit: number | null;
  plan: string;
  canGenerate: boolean;
}

export default function VideoPage() {
  const [step, setStep] = React.useState<Step>('input');
  const [sourceUrl, setSourceUrl] = React.useState('');
  const [analysisData, setAnalysisData] = React.useState<AnalyzeUrlResponse | null>(null);
  const [bundleId, setBundleId] = React.useState<string | null>(null);
  const [statusData, setStatusData] = React.useState<VideoBundleStatusResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [quota, setQuota] = React.useState<UserQuota | null>(null);

  // Analytics tracking
  const { trackFeature, trackError, trackFlowCompleted } = useTrack();
  const generationFlow = useFlowTracker('video_generation', 'Video Bundle Generation', 'core');

  // Fetch user quota on mount
  React.useEffect(() => {
    generationFlow.defineSteps(['analyze', 'customize', 'generate', 'complete']);

    fetch('/api/video/quota')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setQuota(data);
        }
      })
      .catch(() => {
        // Silently fail - quota display is non-critical
      });
  }, [generationFlow]);

  // Analyze URL
  const handleAnalyze = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setSourceUrl(url);

    // Track feature usage
    trackFeature('video_bundle_analyze', 'URL Analysis', { url_domain: new URL(url).hostname });

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
      generationFlow.stepCompleted('analyze');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to analyze URL';
      setError(errorMsg);
      trackError('video_analyze_failed', errorMsg, 'VideoPage');
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

    // Track customization step
    generationFlow.stepCompleted('customize');
    trackFeature('video_bundle_generate', 'Video Generation', {
      style: options.style,
      music_mood: options.musicMood,
      duration: options.durationSeconds,
    });

    try {
      const res = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceUrl,
          ...options,
          // Pass pre-analyzed data to avoid re-analyzing
          siteAnalysis: analysisData?.analysis,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to start generation');
      }

      const data: GenerateVideoResponse = await res.json();
      setBundleId(data.bundleId);
      generationFlow.stepCompleted('generate');

      // Start polling for status
      pollStatus(data.bundleId);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate videos';
      setError(errorMsg);
      setStep('customize');
      trackError('video_generate_failed', errorMsg, 'VideoPage');
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
          generationFlow.stepCompleted('complete');
          generationFlow.complete(true);
          trackFeature('video_bundle_completed', 'Video Bundle Completed', {
            bundle_id: id,
          });
          // Refresh quota after successful generation
          fetch('/api/video/quota')
            .then(res => res.ok ? res.json() : null)
            .then(quotaData => quotaData && setQuota(quotaData))
            .catch(() => {});
          return;
        }

        if (data.status === 'failed') {
          setError(data.error || 'Generation failed');
          generationFlow.complete(false);
          trackError('video_generation_failed', data.error || 'Unknown error', 'VideoPage');
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
  }, [generationFlow, trackFeature, trackError]);

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
            <div className="flex items-center gap-4">
              {quota && (
                <UsageQuota
                  used={quota.used}
                  limit={quota.limit}
                  plan={quota.plan}
                />
              )}
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
            onRetry={statusData.status === 'failed' ? () => {
              // Re-trigger generation with same parameters
              if (analysisData) {
                setStep('customize');
                setStatusData(null);
                setBundleId(null);
              }
            } : undefined}
            onStartOver={statusData.status === 'failed' ? handleReset : undefined}
          />
        )}

        {step === 'generating' && !statusData && (
          <GenerationProgress
            status="pending"
            progress={0}
            currentStep="Starting generation..."
            onStartOver={handleReset}
          />
        )}

        {step === 'complete' && statusData?.outputs && (
          <VideoPreview
            outputs={statusData.outputs}
            onRegenerate={handleRegenerate}
            showWatermark={quota?.plan === 'free'}
          />
        )}
      </div>
    </div>
  );
}
