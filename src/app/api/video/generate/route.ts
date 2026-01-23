// src/app/api/video/generate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/supabase/server';
import { videoBundleRepository } from '@/lib/repositories/video-bundles';
import { subscriptionRepository } from '@/lib/repositories/subscriptions';
import { analyzeUrl } from '@/lib/services/url-analyzer';
import { generateFalAssets } from '@/lib/services/fal-video';
import type { GenerateVideoRequest, GenerateVideoResponse, SiteAnalysis } from '@/types/video-bundle';
import { VIDEO_STYLES, MUSIC_MOODS } from '@/types/video-bundle';

// Get the base URL for webhooks
function getWebhookBaseUrl(): string {
  // Use stable custom domain for webhooks (not VERCEL_URL which changes per deployment)
  // This ensures webhooks can reach the endpoint even after new deployments
  if (process.env.WEBHOOK_BASE_URL) {
    return process.env.WEBHOOK_BASE_URL;
  }
  // Production: use custom domain
  if (process.env.VERCEL_ENV === 'production') {
    return 'https://iconym.com';
  }
  // Preview deployments: use VERCEL_URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // Fallback for local development
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

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
    // Use pre-analyzed data if provided, otherwise run analysis
    let siteAnalysis: SiteAnalysis;

    if (body.siteAnalysis) {
      // Use the pre-analyzed data from the /analyze endpoint
      console.log(`[/api/video/generate] Using pre-analyzed data for: ${body.sourceUrl}`);
      siteAnalysis = body.siteAnalysis;
    } else {
      // Fallback: Run URL analysis with Playwright (slower path)
      console.log(`[/api/video/generate] No pre-analyzed data, analyzing URL: ${body.sourceUrl}`);
      siteAnalysis = await analyzeUrl(body.sourceUrl, {
        userId: auth.userId,
        bundleId,
        timeout: 30000,
      });
    }

    // Determine initial status - skip 'analyzing' if we have pre-analyzed data
    const initialStatus = body.siteAnalysis ? 'composing' : 'analyzing';

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

    // Update status based on whether we skipped analysis
    await videoBundleRepository.update(bundle.id, {
      status: initialStatus,
    });

    // Trigger Fal.ai video generation (async with webhooks)
    const webhookUrl = `${getWebhookBaseUrl()}/api/webhooks/fal`;
    console.log(`[/api/video/generate] Triggering Fal.ai generation with webhook: ${webhookUrl}`);

    try {
      await generateFalAssets({
        videoBundleId: bundle.id,
        style: body.style as typeof VIDEO_STYLES[number],
        colors: siteAnalysis.colors,
        brandName: siteAnalysis.content.headline || 'Brand',
        webhookUrl,
      });
      console.log(`[/api/video/generate] Fal.ai jobs submitted for bundle ${bundle.id}`);
    } catch (falError) {
      // Log but don't fail the request - fallback rendering is possible
      console.error('[/api/video/generate] Fal.ai submission failed:', falError);
      // Continue with the flow - Remotion can render without AI assets
    }

    const response: GenerateVideoResponse = {
      bundleId: bundle.id,
      status: initialStatus,
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
