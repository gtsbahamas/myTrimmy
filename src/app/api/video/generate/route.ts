// src/app/api/video/generate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/supabase/server';
import { videoBundleRepository } from '@/lib/repositories/video-bundles';
import { subscriptionRepository } from '@/lib/repositories/subscriptions';
import type { GenerateVideoRequest, GenerateVideoResponse } from '@/types/video-bundle';
import { VIDEO_STYLES, MUSIC_MOODS } from '@/types/video-bundle';

export async function POST(request: NextRequest) {
  // Authenticate
  const auth = await getAuthFromRequest(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  // Check subscription
  const quota = await subscriptionRepository.canUserGenerateVideo(auth.userId);
  if (!quota.canGenerate) {
    return NextResponse.json(
      { error: 'Video generation quota exceeded', quota },
      { status: 403 }
    );
  }

  // Parse request
  let body: GenerateVideoRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Validate required fields
  if (!body.sourceUrl || typeof body.sourceUrl !== 'string') {
    return NextResponse.json({ error: 'sourceUrl is required' }, { status: 400 });
  }

  if (!VIDEO_STYLES.includes(body.style as typeof VIDEO_STYLES[number])) {
    return NextResponse.json({ error: 'Invalid style' }, { status: 400 });
  }

  if (!MUSIC_MOODS.includes(body.musicMood as typeof MUSIC_MOODS[number])) {
    return NextResponse.json({ error: 'Invalid musicMood' }, { status: 400 });
  }

  if (typeof body.durationSeconds !== 'number' || body.durationSeconds < 15 || body.durationSeconds > 90) {
    return NextResponse.json({ error: 'durationSeconds must be between 15 and 90' }, { status: 400 });
  }

  // TODO: Run URL analysis if not already cached
  // For now, use placeholder analysis
  const siteAnalysis = {
    screenshots: { full: '', sections: [] },
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
    siteType: 'other' as const,
  };

  // Create video bundle record
  const bundle = await videoBundleRepository.create({
    userId: auth.userId,
    sourceUrl: body.sourceUrl,
    siteAnalysis,
    style: body.style as typeof VIDEO_STYLES[number],
    musicMood: body.musicMood as typeof MUSIC_MOODS[number],
    durationSeconds: body.durationSeconds,
  });

  // Increment usage
  await subscriptionRepository.incrementVideoBundlesUsed(auth.userId);

  // TODO: Trigger async generation pipeline
  // For now, just return the bundle ID

  const response: GenerateVideoResponse = {
    bundleId: bundle.id,
    status: bundle.status,
  };

  return NextResponse.json(response, { status: 201 });
}
