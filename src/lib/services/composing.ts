// src/lib/services/composing.ts

import type { FalAssets, VideoOutputs, RenderJobRow } from '@/types/video-bundle';
import { videoBundleRepository } from '@/lib/repositories/video-bundles';
import { falJobRepository } from '@/lib/repositories/fal-jobs';
import { renderJobRepository } from '@/lib/repositories/render-jobs';
import { generateVideoScript } from '@/lib/services/script-generator';
import { renderAllFormats, getThumbnailUrl } from '@/lib/services/remotion-lambda';

export interface ComposeResult {
  success: boolean;
  scenesGenerated: number;
  renderIds: string[];
  error?: string;
}

export interface FinalizeResult {
  success: boolean;
  outputs?: VideoOutputs;
  error?: string;
}

/**
 * Compose a video bundle: generate script and trigger rendering
 *
 * 1. Get bundle with site_analysis
 * 2. Collect Fal asset URLs from fal_jobs table
 * 3. Call generateVideoScript() to create the script
 * 4. Store script in video_bundles.video_script
 * 5. Transition status to 'rendering'
 * 6. Call renderAllFormats() to trigger Lambda
 * 7. Return render IDs
 */
export async function composeVideoBundle(bundleId: string): Promise<ComposeResult> {
  console.log(`[composing] Starting composition for bundle ${bundleId}`);

  try {
    // 1. Get the video bundle
    const bundle = await videoBundleRepository.getByIdServiceRole(bundleId);
    if (!bundle) {
      throw new Error(`Video bundle not found: ${bundleId}`);
    }

    if (bundle.status !== 'composing') {
      console.log(`[composing] Bundle ${bundleId} status is ${bundle.status}, expected 'composing'`);
      // Allow processing anyway if status is pending or analyzing
      if (!['pending', 'analyzing', 'composing'].includes(bundle.status)) {
        throw new Error(`Bundle status is ${bundle.status}, cannot compose`);
      }
    }

    // 2. Collect Fal asset URLs from fal_jobs table
    const falJobs = await falJobRepository.getByBundleId(bundleId);
    const falAssets: FalAssets = {
      intro: null,
      background: null,
      outro: null,
    };

    for (const job of falJobs) {
      if (job.status === 'completed' && job.output_url) {
        if (job.job_type === 'intro') {
          falAssets.intro = job.output_url;
        } else if (job.job_type === 'background') {
          falAssets.background = job.output_url;
        } else if (job.job_type === 'outro') {
          falAssets.outro = job.output_url;
        }
      }
    }

    console.log(`[composing] Collected Fal assets:`, falAssets);

    // 3. Generate the video script using Claude
    console.log(`[composing] Generating video script...`);
    const { script } = await generateVideoScript({
      siteAnalysis: bundle.site_analysis,
      style: bundle.style,
      musicMood: bundle.music_mood,
      durationSeconds: bundle.duration_seconds,
    });

    console.log(`[composing] Script generated with ${script.scenes.length} scenes`);

    // 4. Store script and fal_assets in the bundle
    await videoBundleRepository.updateStatusServiceRole(bundleId, {
      videoScript: script,
      falAssets,
    });

    // 5. Transition status to 'rendering'
    await videoBundleRepository.updateStatusServiceRole(bundleId, {
      status: 'rendering',
    });

    console.log(`[composing] Bundle status updated to 'rendering'`);

    // 6. Trigger rendering for all 3 formats
    const renderResults = await renderAllFormats(bundleId, script, falAssets);

    console.log(`[composing] Renders initiated:`, renderResults.map(r => `${r.format}: ${r.renderId}`));

    return {
      success: true,
      scenesGenerated: script.scenes.length,
      renderIds: renderResults.map(r => r.renderId),
    };
  } catch (error) {
    console.error(`[composing] Failed to compose bundle ${bundleId}:`, error);

    // Update bundle with error
    await videoBundleRepository.updateStatusServiceRole(bundleId, {
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Unknown error during composition',
    });

    return {
      success: false,
      scenesGenerated: 0,
      renderIds: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Finalize a video bundle after all renders complete
 *
 * 1. Check all renders are complete
 * 2. Build outputs object with video URLs
 * 3. Transition to 'completed' status
 */
export async function finalizeBundle(bundleId: string): Promise<FinalizeResult> {
  console.log(`[composing] Finalizing bundle ${bundleId}`);

  try {
    // 1. Check if all renders are complete
    const { allCompleted, anyFailed, jobs } = await renderJobRepository.areAllRendersComplete(bundleId);

    if (!allCompleted) {
      return {
        success: false,
        error: 'Not all renders have completed',
      };
    }

    if (anyFailed) {
      const failedJobs = jobs.filter(j => j.status === 'failed');
      const errors = failedJobs.map(j => `${j.format}: ${j.error_message}`).join(', ');

      await videoBundleRepository.updateStatusServiceRole(bundleId, {
        status: 'failed',
        errorMessage: `Render failures: ${errors}`,
      });

      return {
        success: false,
        error: `Render failures: ${errors}`,
      };
    }

    // 2. Build outputs object
    const bundle = await videoBundleRepository.getByIdServiceRole(bundleId);
    if (!bundle) {
      throw new Error(`Bundle not found: ${bundleId}`);
    }

    const outputs = buildOutputsFromJobs(jobs, bundle.video_script?.totalDuration ?? 0);

    // 3. Transition to 'completed' status
    await videoBundleRepository.updateStatusServiceRole(bundleId, {
      status: 'completed',
      outputs,
      completedAt: new Date().toISOString(),
    });

    console.log(`[composing] Bundle ${bundleId} completed successfully`);

    return {
      success: true,
      outputs,
    };
  } catch (error) {
    console.error(`[composing] Failed to finalize bundle ${bundleId}:`, error);

    await videoBundleRepository.updateStatusServiceRole(bundleId, {
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Unknown error during finalization',
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Build VideoOutputs from completed render jobs
 */
function buildOutputsFromJobs(jobs: RenderJobRow[], totalDurationFrames: number): VideoOutputs {
  const FPS = 30;
  const landscapeJob = jobs.find(j => j.format === 'landscape');
  const portraitJob = jobs.find(j => j.format === 'portrait');
  const squareJob = jobs.find(j => j.format === 'square');

  return {
    landscape: {
      videoUrl: landscapeJob?.output_url ?? '',
      thumbnailUrl: landscapeJob?.thumbnail_url ?? (landscapeJob?.output_url ? getThumbnailUrl(landscapeJob.output_url) : ''),
    },
    portrait: {
      videoUrl: portraitJob?.output_url ?? '',
      thumbnailUrl: portraitJob?.thumbnail_url ?? (portraitJob?.output_url ? getThumbnailUrl(portraitJob.output_url) : ''),
    },
    square: {
      videoUrl: squareJob?.output_url ?? '',
      thumbnailUrl: squareJob?.thumbnail_url ?? (squareJob?.output_url ? getThumbnailUrl(squareJob.output_url) : ''),
    },
    metadata: {
      duration: totalDurationFrames / FPS,
      colors: [], // Will be populated from bundle.video_script.colors if needed
      musicTrack: null,
    },
  };
}

/**
 * Check if a bundle is ready to be finalized
 * Returns true if all renders are in a terminal state
 */
export async function checkBundleReadyForFinalization(bundleId: string): Promise<boolean> {
  const { allCompleted } = await renderJobRepository.areAllRendersComplete(bundleId);
  return allCompleted;
}
