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
import type { FalJobType } from '@/types/video-bundle';

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
    // Return 200 anyway to prevent Fal from retrying
    return NextResponse.json({ received: true, error: 'Job not found' });
  }

  console.log(`[webhook/fal] Found job ${job.id} for bundle ${job.video_bundle_id}`);

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
        await proceedToComposing(job.video_bundle_id, jobs);
      }
    } else {
      // All succeeded - proceed to composing phase
      await proceedToComposing(job.video_bundle_id, jobs);
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
  const falAssets: Record<string, string | null> = {
    intro: null,
    background: null,
    outro: null,
  };

  for (const job of jobs) {
    if (job.status === 'completed' && job.output_url) {
      falAssets[job.job_type] = job.output_url;
    }
  }

  console.log(`[webhook/fal] Fal assets:`, falAssets);

  // Update bundle status to composing
  // Note: The actual composition/rendering will be triggered by a separate process
  // that polls for bundles in 'composing' status
  await videoBundleRepository.updateStatusServiceRole(videoBundleId, {
    status: 'composing',
  });

  // Store Fal assets in the bundle for later use
  // We'll add this to the site_analysis or a separate field
  // For now, the jobs are tracked in the fal_jobs table and can be queried
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
