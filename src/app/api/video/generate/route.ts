// src/app/api/video/generate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/supabase/server';
import { videoBundleRepository } from '@/lib/repositories/video-bundles';
import { subscriptionRepository } from '@/lib/repositories/subscriptions';
import { analyzeUrl } from '@/lib/services/url-analyzer';
import type { GenerateVideoRequest, GenerateVideoResponse, SiteAnalysis } from '@/types/video-bundle';
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
      { error: 'Video generation quota exceeded' },
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

  // Validate URL format
  try {
    const parsedUrl = new URL(body.sourceUrl);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Invalid protocol');
    }
  } catch {
    return NextResponse.json({ error: 'Invalid sourceUrl format. Must be http or https.' }, { status: 400 });
  }

  if (!VIDEO_STYLES.includes(body.style as typeof VIDEO_STYLES[number])) {
    return NextResponse.json({ error: 'Invalid style. Must be: minimal, energetic, or professional' }, { status: 400 });
  }

  if (!MUSIC_MOODS.includes(body.musicMood as typeof MUSIC_MOODS[number])) {
    return NextResponse.json({ error: 'Invalid musicMood. Must be: ambient, upbeat, cinematic, or none' }, { status: 400 });
  }

  if (typeof body.durationSeconds !== 'number' || body.durationSeconds < 15 || body.durationSeconds > 90) {
    return NextResponse.json({ error: 'durationSeconds must be a number between 15 and 90' }, { status: 400 });
  }

  // Generate a bundle ID upfront so we can use it for screenshot storage
  const bundleId = crypto.randomUUID();

  try {
    // Run URL analysis with Playwright
    console.log(`[/api/video/generate] Analyzing URL: ${body.sourceUrl}`);
    const siteAnalysis: SiteAnalysis = await analyzeUrl(body.sourceUrl, {
      userId: auth.userId,
      bundleId,
      timeout: 30000,
    });

    // Create video bundle record with real analysis
    const bundle = await videoBundleRepository.create({
      userId: auth.userId,
      sourceUrl: body.sourceUrl,
      siteAnalysis,
      style: body.style as typeof VIDEO_STYLES[number],
      musicMood: body.musicMood as typeof MUSIC_MOODS[number],
      durationSeconds: body.durationSeconds,
    });

    // Increment usage count
    await subscriptionRepository.incrementVideoBundlesUsed(auth.userId);

    // Update status to 'analyzing' (first step of the pipeline)
    await videoBundleRepository.update(bundle.id, {
      status: 'analyzing',
    });

    // Note: Actual video rendering will be triggered in Phase 2
    // The bundle is created and can be polled for status

    const response: GenerateVideoResponse = {
      bundleId: bundle.id,
      status: 'analyzing',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('[/api/video/generate] Generation failed:', error);
    return NextResponse.json(
      { error: 'Failed to start video generation. Please try again.' },
      { status: 500 }
    );
  }
}
