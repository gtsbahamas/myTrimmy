// src/app/api/video/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/supabase/server';
import { videoBundleRepository } from '@/lib/repositories/video-bundles';
import { renderJobRepository } from '@/lib/repositories/render-jobs';
import { pollAndUpdateProgress } from '@/lib/services/remotion-lambda';
import { finalizeBundle, checkBundleReadyForFinalization } from '@/lib/services/composing';
import type { VideoBundleStatusResponse } from '@/types/video-bundle';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  // Authenticate
  const auth = await getAuthFromRequest(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  // Get bundle (RLS ensures user can only see their own)
  let bundle = await videoBundleRepository.getById(id);
  if (!bundle) {
    return NextResponse.json({ error: 'Video bundle not found' }, { status: 404 });
  }

  // If bundle is rendering, poll Lambda progress and update
  let renderProgress = 0;
  if (bundle.status === 'rendering') {
    try {
      const jobs = await renderJobRepository.getByBundleId(id);
      const activeJobs = jobs.filter(
        job => job.status === 'pending' || job.status === 'rendering'
      );

      // Poll each active job
      for (const job of activeJobs) {
        try {
          await pollAndUpdateProgress(job);
        } catch (pollError) {
          console.error(`[status] Failed to poll job ${job.id}:`, pollError);
        }
      }

      // Re-fetch jobs after polling
      const updatedJobs = await renderJobRepository.getByBundleId(id);

      // Calculate actual render progress
      if (updatedJobs.length > 0) {
        const totalProgress = updatedJobs.reduce((sum, job) => {
          if (job.status === 'completed' || job.status === 'failed') {
            return sum + 1;
          }
          return sum + job.progress;
        }, 0);
        renderProgress = totalProgress / updatedJobs.length;
      }

      // Check if ready to finalize
      const readyToFinalize = await checkBundleReadyForFinalization(id);
      if (readyToFinalize) {
        console.log(`[status] All renders complete, finalizing bundle ${id}`);
        await finalizeBundle(id);
        // Re-fetch bundle to get final status
        bundle = await videoBundleRepository.getById(id);
        if (!bundle) {
          return NextResponse.json({ error: 'Video bundle not found' }, { status: 404 });
        }
      }
    } catch (error) {
      console.error(`[status] Error polling render progress:`, error);
    }
  }

  // Calculate progress based on status
  const progressMap: Record<string, number> = {
    pending: 0,
    analyzing: 10,
    composing: 30,
    rendering: 50, // Base progress, will be enhanced with actual render progress
    validating: 80,
    reviewing: 90,
    completed: 100,
    failed: 0,
  };

  const stepMap: Record<string, string> = {
    pending: 'Queued',
    analyzing: 'Analyzing URL...',
    composing: 'Composing scenes...',
    rendering: 'Rendering videos...',
    validating: 'Validating quality...',
    reviewing: 'Final review...',
    completed: 'Complete',
    failed: 'Failed',
  };

  // Ensure bundle is still valid (could have been refetched)
  if (!bundle) {
    return NextResponse.json({ error: 'Video bundle not found' }, { status: 404 });
  }

  // For rendering status, interpolate between 50% and 80% based on actual render progress
  let progress = progressMap[bundle.status] ?? 0;
  if (bundle.status === 'rendering' && renderProgress > 0) {
    // Map render progress (0-1) to overall progress (50-80)
    progress = 50 + (renderProgress * 30);
  }

  const response: VideoBundleStatusResponse = {
    id: bundle.id,
    status: bundle.status,
    progress: Math.round(progress),
    currentStep: stepMap[bundle.status] ?? 'Unknown',
    outputs: bundle.outputs,
    error: bundle.error_message,
  };

  return NextResponse.json(response);
}
