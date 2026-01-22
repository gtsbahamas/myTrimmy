// src/lib/services/remotion-lambda.ts

import { renderMediaOnLambda, getRenderProgress } from '@remotion/lambda/client';
import type { VideoScript, VideoFormat, FalAssets, RenderJobRow } from '@/types/video-bundle';
import { renderJobRepository } from '@/lib/repositories/render-jobs';

// Environment variables for Remotion Lambda
const AWS_REGION = process.env.REMOTION_AWS_REGION || 'us-east-1';
const FUNCTION_NAME = process.env.REMOTION_FUNCTION_NAME || '';
const SERVE_URL = process.env.REMOTION_SERVE_URL || '';

// Map video format to Remotion composition ID
const FORMAT_TO_COMPOSITION: Record<VideoFormat, string> = {
  landscape: 'PromoVideo-Landscape',
  portrait: 'PromoVideo-Portrait',
  square: 'PromoVideo-Square',
};

export interface RenderVideoParams {
  videoBundleId: string;
  script: VideoScript;
  format: VideoFormat;
  falAssets?: FalAssets;
}

export interface RenderResult {
  renderId: string;
  bucketName: string;
  format: VideoFormat;
}

export interface RenderProgress {
  progress: number;
  outputUrl: string | null;
  done: boolean;
  fatalErrorEncountered: boolean;
  errorMessage: string | null;
}

/**
 * Validate that required environment variables are set
 */
function validateEnvVars(): void {
  if (!FUNCTION_NAME) {
    throw new Error('REMOTION_FUNCTION_NAME environment variable is required');
  }
  if (!SERVE_URL) {
    throw new Error('REMOTION_SERVE_URL environment variable is required');
  }
}

/**
 * Render a single video format using Remotion Lambda
 */
export async function renderVideo(params: RenderVideoParams): Promise<RenderResult> {
  validateEnvVars();

  const { videoBundleId, script, format, falAssets } = params;
  const compositionId = FORMAT_TO_COMPOSITION[format];

  console.log(`[Remotion Lambda] Starting render for ${format} (composition: ${compositionId})`);

  const { renderId, bucketName } = await renderMediaOnLambda({
    region: AWS_REGION as 'us-east-1',
    functionName: FUNCTION_NAME,
    serveUrl: SERVE_URL,
    composition: compositionId,
    inputProps: {
      script,
      format,
      falAssets: falAssets ?? undefined,
    },
    codec: 'h264',
    privacy: 'public',
    // Optional: configure output file naming
    outName: `${videoBundleId}/${format}.mp4`,
  });

  console.log(`[Remotion Lambda] Render started: ${renderId} in bucket ${bucketName}`);

  // Create render job record in database
  await renderJobRepository.create({
    videoBundleId,
    renderId,
    bucketName,
    format,
  });

  return { renderId, bucketName, format };
}

/**
 * Render all 3 formats in parallel
 */
export async function renderAllFormats(
  videoBundleId: string,
  script: VideoScript,
  falAssets?: FalAssets
): Promise<RenderResult[]> {
  const formats: VideoFormat[] = ['landscape', 'portrait', 'square'];

  console.log(`[Remotion Lambda] Starting parallel renders for bundle ${videoBundleId}`);

  const renderPromises = formats.map((format) =>
    renderVideo({
      videoBundleId,
      script,
      format,
      falAssets: falAssets ?? undefined,
    })
  );

  const results = await Promise.all(renderPromises);

  console.log(`[Remotion Lambda] All 3 renders initiated for bundle ${videoBundleId}`);

  return results;
}

/**
 * Check the progress of a render
 */
export async function checkRenderProgress(
  renderId: string,
  bucketName: string
): Promise<RenderProgress> {
  validateEnvVars();

  const progress = await getRenderProgress({
    renderId,
    bucketName,
    region: AWS_REGION as 'us-east-1',
    functionName: FUNCTION_NAME,
  });

  return {
    progress: progress.overallProgress,
    outputUrl: progress.outputFile ?? null,
    done: progress.done,
    fatalErrorEncountered: progress.fatalErrorEncountered,
    errorMessage: progress.errors?.[0]?.message ?? null,
  };
}

/**
 * Poll a render job's progress and update the database
 */
export async function pollAndUpdateProgress(job: RenderJobRow): Promise<RenderJobRow | null> {
  const progress = await checkRenderProgress(job.render_id, job.bucket_name);

  // Determine new status
  let newStatus: RenderJobRow['status'] = job.status;

  if (progress.fatalErrorEncountered) {
    newStatus = 'failed';
  } else if (progress.done) {
    newStatus = 'completed';
  } else if (progress.progress > 0) {
    newStatus = 'rendering';
  }

  // Update the database
  const updatedJob = await renderJobRepository.update(job.id, {
    status: newStatus,
    progress: progress.progress,
    outputUrl: progress.outputUrl ?? undefined,
    errorMessage: progress.errorMessage ?? undefined,
    completedAt: progress.done ? new Date().toISOString() : undefined,
  });

  console.log(
    `[Remotion Lambda] Job ${job.id} (${job.format}): ${newStatus} at ${Math.round(progress.progress * 100)}%`
  );

  return updatedJob;
}

/**
 * Poll all active render jobs and update their progress
 */
export async function pollAllActiveRenders(): Promise<void> {
  const activeJobs = await renderJobRepository.getRenderingJobs();

  if (activeJobs.length === 0) {
    return;
  }

  console.log(`[Remotion Lambda] Polling ${activeJobs.length} active renders`);

  await Promise.all(activeJobs.map(pollAndUpdateProgress));
}

/**
 * Get thumbnail URL from a completed render
 * Remotion Lambda generates thumbnails automatically at frame 0
 */
export function getThumbnailUrl(outputUrl: string): string {
  // Replace .mp4 with .png for the thumbnail
  return outputUrl.replace(/\.mp4$/, '-thumb.png');
}
