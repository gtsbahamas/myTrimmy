// src/app/api/video/[id]/progress/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { renderJobRepository } from '@/lib/repositories/render-jobs';
import { videoBundleRepository } from '@/lib/repositories/video-bundles';
import { pollAndUpdateProgress } from '@/lib/services/remotion-lambda';
import { finalizeBundle, checkBundleReadyForFinalization } from '@/lib/services/composing';
import type { RenderJobRow, VideoFormat } from '@/types/video-bundle';

interface FormatProgress {
  format: VideoFormat;
  status: RenderJobRow['status'];
  progress: number;
  outputUrl: string | null;
  thumbnailUrl: string | null;
  error: string | null;
}

interface ProgressResponse {
  bundleId: string;
  status: string;
  overallProgress: number;
  formats: FormatProgress[];
  outputs: {
    landscape: string | null;
    portrait: string | null;
    square: string | null;
  } | null;
  error: string | null;
}

/**
 * GET /api/video/[id]/progress
 *
 * Get render progress for a video bundle.
 * User must own the bundle.
 *
 * 1. Get render jobs for bundle
 * 2. Poll progress for any rendering jobs
 * 3. Update DB with progress
 * 4. If all complete, call finalizeBundle()
 * 5. Return progress for each format
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bundleId } = await params;

    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user owns the bundle
    const bundle = await videoBundleRepository.getById(bundleId);
    if (!bundle) {
      return NextResponse.json(
        { error: 'Video bundle not found' },
        { status: 404 }
      );
    }

    if (bundle.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get render jobs
    const jobs = await renderJobRepository.getByBundleId(bundleId);

    // If no render jobs exist, return bundle status
    if (jobs.length === 0) {
      return NextResponse.json({
        bundleId,
        status: bundle.status,
        overallProgress: 0,
        formats: [],
        outputs: null,
        error: bundle.error_message,
      } satisfies ProgressResponse);
    }

    // Poll progress for active jobs (pending or rendering)
    const activeJobs = jobs.filter(
      job => job.status === 'pending' || job.status === 'rendering'
    );

    // Poll each active job and update DB
    for (const job of activeJobs) {
      try {
        await pollAndUpdateProgress(job);
      } catch (pollError) {
        console.error(`[progress] Failed to poll job ${job.id}:`, pollError);
        // Continue with other jobs even if one fails
      }
    }

    // Re-fetch jobs after polling to get updated progress
    const updatedJobs = await renderJobRepository.getByBundleId(bundleId);

    // Check if ready to finalize
    const readyToFinalize = await checkBundleReadyForFinalization(bundleId);

    if (readyToFinalize && bundle.status === 'rendering') {
      console.log(`[progress] All renders complete, finalizing bundle ${bundleId}`);
      await finalizeBundle(bundleId);

      // Re-fetch bundle to get final status
      const finalBundle = await videoBundleRepository.getById(bundleId);
      if (finalBundle) {
        return NextResponse.json({
          bundleId,
          status: finalBundle.status,
          overallProgress: 1,
          formats: updatedJobs.map(formatJobToProgress),
          outputs: finalBundle.outputs ? {
            landscape: finalBundle.outputs.landscape.videoUrl || null,
            portrait: finalBundle.outputs.portrait.videoUrl || null,
            square: finalBundle.outputs.square.videoUrl || null,
          } : null,
          error: finalBundle.error_message,
        } satisfies ProgressResponse);
      }
    }

    // Calculate overall progress
    const overallProgress = calculateOverallProgress(updatedJobs);

    return NextResponse.json({
      bundleId,
      status: bundle.status,
      overallProgress,
      formats: updatedJobs.map(formatJobToProgress),
      outputs: bundle.outputs ? {
        landscape: bundle.outputs.landscape.videoUrl || null,
        portrait: bundle.outputs.portrait.videoUrl || null,
        square: bundle.outputs.square.videoUrl || null,
      } : null,
      error: bundle.error_message,
    } satisfies ProgressResponse);
  } catch (error) {
    console.error('[progress] Error getting progress:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

function formatJobToProgress(job: RenderJobRow): FormatProgress {
  return {
    format: job.format,
    status: job.status,
    progress: job.progress,
    outputUrl: job.output_url,
    thumbnailUrl: job.thumbnail_url,
    error: job.error_message,
  };
}

function calculateOverallProgress(jobs: RenderJobRow[]): number {
  if (jobs.length === 0) return 0;

  const totalProgress = jobs.reduce((sum, job) => {
    // Completed or failed jobs count as 100% for progress calculation
    if (job.status === 'completed' || job.status === 'failed') {
      return sum + 1;
    }
    return sum + job.progress;
  }, 0);

  return totalProgress / jobs.length;
}
