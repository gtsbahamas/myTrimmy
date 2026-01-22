// src/app/api/video/analyze/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/supabase/server';
import { subscriptionRepository } from '@/lib/repositories/subscriptions';
import type { AnalyzeUrlRequest, AnalyzeUrlResponse } from '@/types/video-bundle';

export async function POST(request: NextRequest) {
  // Authenticate
  const auth = await getAuthFromRequest(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  // Check subscription
  const quota = await subscriptionRepository.canUserGenerateVideo(auth.userId);
  if (!quota.canGenerate && quota.plan !== 'free') {
    return NextResponse.json(
      { error: 'Video generation quota exceeded', quota },
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
  try {
    new URL(body.url);
  } catch {
    return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
  }

  // TODO: Implement URL analysis with Playwright
  // For now, return a placeholder response
  const response: AnalyzeUrlResponse = {
    analysis: {
      screenshots: {
        full: '', // TODO: Generate screenshot
        sections: [],
      },
      colors: {
        primary: '#f59e0b',
        secondary: '#1f2937',
        accent: '#f59e0b',
        background: '#111827',
        text: '#f9fafb',
      },
      content: {
        headline: 'Your Website',
        subheadline: null,
        features: [],
        stats: [],
        cta: 'Learn More',
      },
      logoUrl: null,
      siteType: 'other',
    },
    suggestedStyle: 'minimal',
    suggestedMusicMood: 'ambient',
    suggestedDuration: 45,
  };

  return NextResponse.json(response);
}
