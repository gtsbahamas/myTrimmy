// src/app/api/video/analyze/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/supabase/server';
import { subscriptionRepository } from '@/lib/repositories/subscriptions';
import { analyzeUrl } from '@/lib/services/url-analyzer';
import type { AnalyzeUrlRequest, AnalyzeUrlResponse, VideoStyle, MusicMood } from '@/types/video-bundle';

export async function POST(request: NextRequest) {
  // Authenticate
  const auth = await getAuthFromRequest(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  // Check subscription - free users can preview/analyze (watermarked output)
  const quota = await subscriptionRepository.canUserGenerateVideo(auth.userId);
  if (!quota.canGenerate && quota.plan !== 'free') {
    return NextResponse.json(
      { error: 'Video generation quota exceeded' },
      { status: 403 }
    );
  }

  // Parse request
  let body: AnalyzeUrlRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.url || typeof body.url !== 'string') {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  // Validate URL format
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(body.url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Invalid protocol');
    }
  } catch {
    return NextResponse.json({ error: 'Invalid URL format. Must be http or https.' }, { status: 400 });
  }

  try {
    // Run real URL analysis with Playwright
    const analysis = await analyzeUrl(body.url, {
      userId: auth.userId,
      timeout: 30000,
    });

    // Suggest style based on site type
    const suggestedStyle: VideoStyle = suggestStyle(analysis.siteType);

    // Suggest music mood based on content
    const suggestedMusicMood: MusicMood = suggestMusicMood(analysis.siteType, analysis.content.features.length);

    // Suggest duration based on content amount
    const suggestedDuration = suggestDuration(analysis.content);

    const response: AnalyzeUrlResponse = {
      analysis,
      suggestedStyle,
      suggestedMusicMood,
      suggestedDuration,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[/api/video/analyze] Analysis failed:', error);
    return NextResponse.json(
      { error: 'Failed to analyze URL. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * Suggest video style based on site type
 */
function suggestStyle(siteType: string): VideoStyle {
  switch (siteType) {
    case 'tech':
      return 'minimal';
    case 'ecommerce':
      return 'energetic';
    case 'enterprise':
      return 'professional';
    default:
      return 'minimal';
  }
}

/**
 * Suggest music mood based on site characteristics
 */
function suggestMusicMood(siteType: string, featureCount: number): MusicMood {
  if (siteType === 'enterprise') return 'cinematic';
  if (siteType === 'ecommerce') return 'upbeat';
  if (featureCount >= 4) return 'upbeat';
  return 'ambient';
}

/**
 * Suggest video duration based on content amount
 */
function suggestDuration(content: { features: string[]; stats: string[] }): number {
  const contentItems = content.features.length + content.stats.length;

  // Base: 30 seconds
  // Add 5 seconds per feature/stat, up to 90 max
  const duration = Math.min(90, Math.max(30, 30 + contentItems * 5));

  return duration;
}
