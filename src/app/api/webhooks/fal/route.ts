// src/app/api/webhooks/fal/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { falJobRepository } from '@/lib/repositories/fal-jobs';
import { videoBundleRepository } from '@/lib/repositories/video-bundles';
import {
  parseFalWebhookPayload,
  getJobResult,
  getModelForJobType,
} from '@/lib/services/fal-video';
import { validateFalWebhookSecret } from '@/lib/services/webhook-security';
import type { FalJobType, FalAssets } from '@/types/video-bundle';

// Get the base URL for internal API calls
function getWebhookBaseUrl(): string {
  // Use stable custom domain for webhooks (not VERCEL_URL which changes per deployment)
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

/**
 * Fal.ai webhook handler
 * Receives callbacks when video generation jobs complete
 *
 * Expected URL format: /api/webhooks/fal?type=intro|background|outro&secret=XXX
 */
export async function POST(request: NextRequest) {
  const jobType = request.nextUrl.searchParams.get('type') as FalJobType | null;
  const secret = request.nextUrl.searchParams.get('secret');

  console.log(`[webhook/fal] Received webhook callback, type=${jobType}`);

  // Validate webhook secret (SEC-001 fix)
  const validation = validateFalWebhookSecret(secret);
  if (!validation.valid) {
    console.error(`[webhook/fal] Secret validation failed: ${validation.error}`);
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Parse webhook payload
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    console.error('[webhook/fal] Invalid JSON body');
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const payload = parseFalWebhookPayload(body);
  if (!payload) {
    console.error('[webhook/fal] Invalid webhook payload format');
    return NextResponse.json({ error: 'Invalid payload format' }, { status: 400 });
  }

  console.log(`[webhook/fal] Processing request_id=${payload.request_id}, status=${payload.status}`);

  // Find the job in our database
  const job = await falJobRepository.getByRequestId(payload.request_id);
  if (!job) {
    console.error(`[webhook/fal] Job not found: ${payload.request_id}`);
    // Return 404 so Fal knows the job doesn't exist (won't retry)
    return NextResponse.json(
      { received: false, error: 'Job not found' },
      { status: 404 }
    );
  }

  console.log(`[webhook/fal] Found job ${job.id} for bundle ${job.video_bundle_id}`);

  // Idempotency check: skip if job already processed
  if (job.status === 'completed' || job.status === 'failed') {
    console.log(`[webhook/fal] Job ${job.id} already in terminal state: ${job.status}, skipping`);
    return NextResponse.json({ received: true, already_processed: true });
  }

  // Handle success
  if (payload.status === 'OK') {
    try {
      // Get the video URL from the result
      const model = getModelForJobType(job.job_type as FalJobType);
      const result = await getJobResult(model, payload.request_id);

      // Update job with success
      await falJobRepository.update(job.id, {
        status: 'completed',
        outputUrl: result.videoUrl,
        completedAt: new Date().toISOString(),
      });

      console.log(`[webhook/fal] Job ${job.id} completed with URL: ${result.videoUrl}`);
    } catch (error) {
      console.error(`[webhook/fal] Failed to get result for job ${job.id}:`, error);

      // Mark as failed if we can't get the result
      await falJobRepository.update(job.id, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Failed to retrieve result',
        completedAt: new Date().toISOString(),
      });

      // ERR-001 FIX: Return error status so Fal can retry
      return NextResponse.json(
        {
          received: true,
          error: 'Failed to process job result',
          job_id: job.id,
        },
        { status: 500 }
      );
    }
  }

  // Handle error
  if (payload.status === 'ERROR') {
    console.error(`[webhook/fal] Job ${job.id} failed: ${payload.error}`);

    await falJobRepository.update(job.id, {
      status: 'failed',
      errorMessage: payload.error ?? 'Unknown error',
      completedAt: new Date().toISOString(),
    });
  }

  // Check if all jobs for this bundle are complete
  const { allCompleted, anyFailed, jobs } = await falJobRepository.areAllJobsCompleted(
    job.video_bundle_id
  );

  if (allCompleted) {
    console.log(`[webhook/fal] All jobs completed for bundle ${job.video_bundle_id}`);

    if (anyFailed) {
      // Some jobs failed - check if we have at least one successful asset
      const successfulJobs = jobs.filter(j => j.status === 'completed');

      if (successfulJobs.length === 0) {
        // All failed - mark bundle as failed
        console.error(`[webhook/fal] All Fal jobs failed for bundle ${job.video_bundle_id}`);
        await videoBundleRepository.updateStatusServiceRole(job.video_bundle_id, {
          status: 'failed',
          errorMessage: 'All AI video generation jobs failed. Using fallback rendering.',
        });
      } else {
        // Some succeeded - proceed with partial assets (graceful degradation)
        console.log(`[webhook/fal] ${successfulJobs.length}/3 jobs succeeded, proceeding with partial assets`);
        try {
          await proceedToComposing(job.video_bundle_id, jobs);
        } catch (error) {
          console.error(`[webhook/fal] Failed to transition to composing:`, error);
          // Don't return 500 - the webhook job is done, composition is a separate concern
        }
      }
    } else {
      // All succeeded - proceed to composing phase
      try {
        await proceedToComposing(job.video_bundle_id, jobs);
      } catch (error) {
        console.error(`[webhook/fal] Failed to transition to composing:`, error);
        // Don't return 500 - the webhook job is done, composition is a separate concern
      }
    }
  }

  return NextResponse.json({ received: true, job_id: job.id });
}

/**
 * Transition bundle to composing phase
 * This triggers the next step: Claude script generation + Remotion rendering
 */
async function proceedToComposing(
  videoBundleId: string,
  jobs: Array<{ job_type: string; output_url: string | null; status: string }>
) {
  console.log(`[webhook/fal] Transitioning bundle ${videoBundleId} to composing phase`);

  // Collect Fal asset URLs
  const falAssets: FalAssets = {
    intro: null,
    background: null,
    outro: null,
  };

  for (const job of jobs) {
    if (job.status === 'completed' && job.output_url) {
      const jobType = job.job_type as keyof FalAssets;
      falAssets[jobType] = job.output_url;
    }
  }

  console.log(`[webhook/fal] Fal assets:`, falAssets);

  // Update bundle status to composing and save fal assets
  await videoBundleRepository.updateStatusServiceRole(videoBundleId, {
    status: 'composing',
    falAssets,
  });

  // Call the compose API to trigger script generation and Lambda rendering
  const composeUrl = `${getWebhookBaseUrl()}/api/video/compose`;
  console.log(`[webhook/fal] Calling compose API: ${composeUrl}`);

  try {
    const response = await fetch(composeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bundleId: videoBundleId,
        secret: process.env.FAL_WEBHOOK_SECRET,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[webhook/fal] Compose API failed: ${response.status} - ${errorText}`);
      // Don't throw - the status is already set to 'composing', composition can be retried
    } else {
      const result = await response.json();
      console.log(`[webhook/fal] Compose API succeeded:`, result);
    }
  } catch (error) {
    console.error(`[webhook/fal] Failed to call compose API:`, error);
    // Don't throw - the status is already set to 'composing', composition can be retried
  }
}

/**
 * Health check endpoint for the webhook
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'fal-webhook',
    timestamp: new Date().toISOString(),
  });
}
