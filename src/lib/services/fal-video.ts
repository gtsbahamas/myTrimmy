// src/lib/services/fal-video.ts

import { fal } from '@fal-ai/client';
import { falJobRepository } from '@/lib/repositories/fal-jobs';
import type {
  FalJobType,
  VideoStyle,
  ColorPalette
} from '@/types/video-bundle';

// Configure Fal client with API key from environment
fal.config({
  credentials: process.env.FAL_KEY,
});

// ============================================
// Types
// ============================================

export interface GenerateFalAssetsParams {
  videoBundleId: string;
  style: VideoStyle;
  colors: ColorPalette;
  brandName: string;
  webhookUrl: string;
}

export interface FalAssetResult {
  intro: { requestId: string; jobId: string };
  background: { requestId: string; jobId: string };
  outro: { requestId: string; jobId: string };
}

export interface FalVideoOutput {
  url: string;
  type: FalJobType;
}

// ============================================
// Model Configuration
// ============================================

// Models per job type (based on design doc recommendations)
const FAL_MODELS = {
  // Intro: Kling for eye-catching openings (3-5 sec)
  intro: 'fal-ai/kling-video/v2.5-turbo/pro/text-to-video',
  // Background: Use LTX for looping ambient motion (5-10 sec)
  background: 'fal-ai/ltx-video-13b-distilled/image-to-video',
  // Outro: Veo 3 for dramatic closing (3-5 sec)
  outro: 'fal-ai/veo3',
} as const;

// Fallback models if primary fails
const FAL_FALLBACK_MODELS = {
  intro: 'fal-ai/kling-video/v2.1/pro/text-to-video',
  background: 'fal-ai/ltxv-13b-098-distilled/image-to-video',
  outro: 'fal-ai/kling-video/v2.5-turbo/pro/text-to-video',
} as const;

// ============================================
// Prompt Templates by Style
// ============================================

interface StylePrompts {
  intro: string;
  background: string;
  outro: string;
}

function getStylePrompts(
  style: VideoStyle,
  colors: ColorPalette,
  brandName: string
): StylePrompts {
  const colorDescription = `using colors ${colors.primary} (primary), ${colors.secondary} (secondary), and ${colors.accent} (accent)`;

  switch (style) {
    case 'minimal':
      return {
        intro: `Subtle, elegant gradient animation with soft light particles floating gently. Meditative and calm atmosphere. Abstract geometric shapes emerging softly. Clean, modern aesthetic ${colorDescription}. No text, no faces, just pure abstract motion. 3 seconds, loopable.`,
        background: `Minimalist abstract background with soft gradient shifts and gentle particle movement. Very subtle motion, almost like slow breathing. Clean and professional ${colorDescription}. Perfect for behind text overlays. 5 seconds, seamlessly loopable.`,
        outro: `Elegant fade with converging light particles creating a subtle focal point. Calm and refined closing motion. Professional and sophisticated ${colorDescription}. No text, pure abstract. 3 seconds.`,
      };

    case 'energetic':
      return {
        intro: `Bold, dynamic geometric shapes exploding outward with energy. Fast cuts, tech startup vibe. Vibrant and exciting motion ${colorDescription}. Abstract digital art, no text, no people. Modern and punchy. 4 seconds.`,
        background: `Energetic abstract background with fast-moving geometric patterns and light trails. Dynamic but not distracting. Perfect for motion graphics ${colorDescription}. 5 seconds, seamlessly loopable.`,
        outro: `Explosive converging energy lines creating a dramatic focal point. Bold and confident closing ${colorDescription}. Abstract geometric celebration. No text. 4 seconds.`,
      };

    case 'professional':
      return {
        intro: `Sophisticated 3D surface with cinematic lighting, slowly revealing elegant abstract forms. Premium and refined atmosphere ${colorDescription}. Corporate elegance, no text, no people. 5 seconds.`,
        background: `Luxurious abstract background with subtle 3D depth and sophisticated lighting. Slow, confident movement. Premium feel ${colorDescription}. Perfect for business presentations. 5 seconds, seamlessly loopable.`,
        outro: `Cinematic closing with elegant light rays converging into sophisticated abstract form. Premium and memorable ${colorDescription}. Professional closure. No text. 4 seconds.`,
      };

    default:
      return getStylePrompts('minimal', colors, brandName);
  }
}

// ============================================
// Video Generation Functions
// ============================================

/**
 * Generate all Fal.ai video assets for a video bundle
 * Uses queue API with webhooks for async processing
 */
export async function generateFalAssets(
  params: GenerateFalAssetsParams
): Promise<FalAssetResult> {
  const { videoBundleId, style, colors, brandName, webhookUrl } = params;
  const prompts = getStylePrompts(style, colors, brandName);

  console.log(`[fal-video] Starting Fal asset generation for bundle ${videoBundleId}`);
  console.log(`[fal-video] Style: ${style}, Webhook: ${webhookUrl}`);

  // Submit all three jobs in parallel
  const [introResult, backgroundResult, outroResult] = await Promise.all([
    submitIntroJob(videoBundleId, prompts.intro, webhookUrl),
    submitBackgroundJob(videoBundleId, prompts.background, colors, webhookUrl),
    submitOutroJob(videoBundleId, prompts.outro, webhookUrl),
  ]);

  return {
    intro: introResult,
    background: backgroundResult,
    outro: outroResult,
  };
}

/**
 * Submit intro video generation job
 */
async function submitIntroJob(
  videoBundleId: string,
  prompt: string,
  webhookUrl: string
): Promise<{ requestId: string; jobId: string }> {
  console.log(`[fal-video] Submitting intro job for bundle ${videoBundleId}`);

  const { request_id } = await fal.queue.submit(FAL_MODELS.intro, {
    input: {
      prompt,
      duration: '5',
      aspect_ratio: '16:9',
      negative_prompt: 'text, words, letters, faces, people, blurry, distorted, low quality',
      cfg_scale: 0.6,
    },
    webhookUrl: `${webhookUrl}?type=intro`,
  });

  // Create tracking record in database
  const job = await falJobRepository.create({
    videoBundleId,
    falRequestId: request_id,
    jobType: 'intro',
  });

  console.log(`[fal-video] Intro job submitted: ${request_id}`);
  return { requestId: request_id, jobId: job.id };
}

/**
 * Submit background video generation job
 * Uses a generated gradient image as the base for image-to-video
 */
async function submitBackgroundJob(
  videoBundleId: string,
  prompt: string,
  colors: ColorPalette,
  webhookUrl: string
): Promise<{ requestId: string; jobId: string }> {
  console.log(`[fal-video] Submitting background job for bundle ${videoBundleId}`);

  // For background, we use text-to-video instead of image-to-video for simplicity
  // The prompt describes an abstract looping background
  const { request_id } = await fal.queue.submit(FAL_MODELS.intro, { // Using same model for consistency
    input: {
      prompt,
      duration: '5',
      aspect_ratio: '16:9',
      negative_prompt: 'text, words, letters, faces, people, blurry, distorted, low quality, sudden movements',
      cfg_scale: 0.5,
    },
    webhookUrl: `${webhookUrl}?type=background`,
  });

  // Create tracking record in database
  const job = await falJobRepository.create({
    videoBundleId,
    falRequestId: request_id,
    jobType: 'background',
  });

  console.log(`[fal-video] Background job submitted: ${request_id}`);
  return { requestId: request_id, jobId: job.id };
}

/**
 * Submit outro video generation job
 */
async function submitOutroJob(
  videoBundleId: string,
  prompt: string,
  webhookUrl: string
): Promise<{ requestId: string; jobId: string }> {
  console.log(`[fal-video] Submitting outro job for bundle ${videoBundleId}`);

  const { request_id } = await fal.queue.submit(FAL_MODELS.outro, {
    input: {
      prompt,
      aspect_ratio: '16:9',
    },
    webhookUrl: `${webhookUrl}?type=outro`,
  });

  // Create tracking record in database
  const job = await falJobRepository.create({
    videoBundleId,
    falRequestId: request_id,
    jobType: 'outro',
  });

  console.log(`[fal-video] Outro job submitted: ${request_id}`);
  return { requestId: request_id, jobId: job.id };
}

// ============================================
// Status and Result Handling
// ============================================

/**
 * Check the status of a Fal job
 */
export async function checkJobStatus(
  model: string,
  requestId: string
): Promise<{
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  position?: number;
  logs?: Array<{ message: string; timestamp: string }>;
}> {
  const status = await fal.queue.status(model, {
    requestId,
    logs: true,
  });

  // Handle different status types - logs only exist on some status types
  const statusObj = status as unknown as Record<string, unknown>;

  return {
    status: status.status as 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED',
    position: 'position' in status ? (status as { position?: number }).position : undefined,
    logs: Array.isArray(statusObj.logs) ? statusObj.logs as Array<{ message: string; timestamp: string }> : undefined,
  };
}

/**
 * Get the result of a completed Fal job
 */
export async function getJobResult(
  model: string,
  requestId: string
): Promise<{ videoUrl: string }> {
  const result = await fal.queue.result(model, {
    requestId,
  });

  // Different models return video URL in different formats
  const videoUrl = extractVideoUrl(result);

  if (!videoUrl) {
    throw new Error('No video URL found in Fal result');
  }

  return { videoUrl };
}

/**
 * Extract video URL from various Fal response formats
 */
function extractVideoUrl(result: unknown): string | null {
  const data = result as Record<string, unknown>;

  // Veo 3 format: { video: { url: string } }
  if (data.video && typeof data.video === 'object') {
    const video = data.video as Record<string, unknown>;
    if (typeof video.url === 'string') return video.url;
  }

  // Kling format: { video: { url: string } }
  if (data.video && typeof data.video === 'object') {
    const video = data.video as Record<string, unknown>;
    if (typeof video.url === 'string') return video.url;
  }

  // Direct URL format
  if (typeof data.video_url === 'string') return data.video_url;
  if (typeof data.url === 'string') return data.url;

  // Output format
  if (data.output && typeof data.output === 'object') {
    const output = data.output as Record<string, unknown>;
    if (typeof output.url === 'string') return output.url;
    if (typeof output.video_url === 'string') return output.video_url;
  }

  return null;
}

// ============================================
// Fallback Generation (if AI fails)
// ============================================

/**
 * Generate fallback assets when Fal.ai fails
 * Returns null URLs which will be handled by Remotion with gradient fallbacks
 */
export function generateFallbackAssets(): {
  intro: null;
  background: null;
  outro: null;
} {
  console.log('[fal-video] Using fallback assets (no AI generation)');
  return {
    intro: null,
    background: null,
    outro: null,
  };
}

// ============================================
// Webhook Payload Types
// ============================================

export interface FalWebhookPayload {
  request_id: string;
  status: 'OK' | 'ERROR';
  error?: string;
  payload?: unknown;
}

/**
 * Parse and validate a Fal webhook payload
 */
export function parseFalWebhookPayload(body: unknown): FalWebhookPayload | null {
  if (!body || typeof body !== 'object') return null;

  const data = body as Record<string, unknown>;

  if (typeof data.request_id !== 'string') return null;
  if (typeof data.status !== 'string') return null;

  return {
    request_id: data.request_id,
    status: data.status as 'OK' | 'ERROR',
    error: typeof data.error === 'string' ? data.error : undefined,
    payload: data.payload,
  };
}

/**
 * Get the model string for a job type (used when checking status/getting results)
 */
export function getModelForJobType(jobType: FalJobType): string {
  switch (jobType) {
    case 'intro':
      return FAL_MODELS.intro;
    case 'background':
      return FAL_MODELS.intro; // Using same model for consistency
    case 'outro':
      return FAL_MODELS.outro;
    default:
      return FAL_MODELS.intro;
  }
}
