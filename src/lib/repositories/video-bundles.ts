// src/lib/repositories/video-bundles.ts

import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database';
import type {
  VideoBundleRow,
  VideoBundleStatus,
  VideoStyle,
  MusicMood,
  SiteAnalysis,
  VideoOutputs,
  ValidationResult,
  GeminiReview,
  VideoScript,
  FalAssets,
} from '@/types/video-bundle';

export interface CreateVideoBundleParams {
  userId: string;
  sourceUrl: string;
  siteAnalysis: SiteAnalysis;
  style: VideoStyle;
  musicMood: MusicMood;
  durationSeconds: number;
}

export interface UpdateVideoBundleParams {
  status?: VideoBundleStatus;
  validationResult?: ValidationResult;
  geminiReview?: GeminiReview;
  outputs?: VideoOutputs;
  completedAt?: string;
  errorMessage?: string;
  errorDetails?: Record<string, unknown>;
  videoScript?: VideoScript;
  falAssets?: FalAssets;
}

export class VideoBundleRepository {
  /**
   * Create a new video bundle
   * Uses service role to bypass RLS - needed for API key auth scenarios
   */
  async create(params: CreateVideoBundleParams): Promise<VideoBundleRow> {
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('video_bundles')
      .insert({
        user_id: params.userId,
        source_url: params.sourceUrl,
        site_analysis: params.siteAnalysis as unknown as Json,
        style: params.style,
        music_mood: params.musicMood,
        duration_seconds: params.durationSeconds,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create video bundle: ${error.message}`);
    }

    return data as unknown as VideoBundleRow;
  }

  /**
   * Get a video bundle by ID
   * Uses service role to bypass RLS - needed for API key auth scenarios
   */
  async getById(id: string): Promise<VideoBundleRow | null> {
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('video_bundles')
      .select()
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to get video bundle: ${error.message}`);
    }

    return data as unknown as VideoBundleRow;
  }

  /**
   * Get all video bundles for a user
   * Uses service role to bypass RLS - needed for API key auth scenarios
   */
  async getByUserId(userId: string, limit = 50): Promise<VideoBundleRow[]> {
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('video_bundles')
      .select()
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get video bundles: ${error.message}`);
    }

    return (data ?? []) as unknown as VideoBundleRow[];
  }

  /**
   * Get a video bundle by ID (service role - bypasses RLS)
   * Use this for background job processing
   */
  async getByIdServiceRole(id: string): Promise<VideoBundleRow | null> {
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('video_bundles')
      .select()
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to get video bundle: ${error.message}`);
    }

    return data as unknown as VideoBundleRow;
  }

  /**
   * Get the user_id for a video bundle (service role)
   * Used for ownership validation in related tables
   */
  async getOwnerUserId(bundleId: string): Promise<string | null> {
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('video_bundles')
      .select('user_id')
      .eq('id', bundleId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to get bundle owner: ${error.message}`);
    }

    return data?.user_id ?? null;
  }

  /**
   * Update a video bundle (user-scoped via RLS)
   */
  async update(id: string, params: UpdateVideoBundleParams): Promise<VideoBundleRow> {
    const supabase = createServiceRoleClient();

    const updateData: Record<string, unknown> = {};

    if (params.status !== undefined) updateData.status = params.status;
    if (params.validationResult !== undefined) updateData.validation_result = params.validationResult;
    if (params.geminiReview !== undefined) updateData.gemini_review = params.geminiReview;
    if (params.outputs !== undefined) updateData.outputs = params.outputs;
    if (params.completedAt !== undefined) updateData.completed_at = params.completedAt;
    if (params.errorMessage !== undefined) updateData.error_message = params.errorMessage;
    if (params.errorDetails !== undefined) updateData.error_details = params.errorDetails;
    if (params.videoScript !== undefined) updateData.video_script = params.videoScript;
    if (params.falAssets !== undefined) updateData.fal_assets = params.falAssets;

    const { data, error } = await supabase
      .from('video_bundles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update video bundle: ${error.message}`);
    }

    return data as unknown as VideoBundleRow;
  }

  /**
   * Update video bundle status (service role - bypasses RLS)
   * Use this for background job updates
   */
  async updateStatusServiceRole(id: string, params: UpdateVideoBundleParams): Promise<void> {
    const supabase = createServiceRoleClient();

    const updateData: Record<string, unknown> = {};

    if (params.status !== undefined) updateData.status = params.status;
    if (params.validationResult !== undefined) updateData.validation_result = params.validationResult;
    if (params.geminiReview !== undefined) updateData.gemini_review = params.geminiReview;
    if (params.outputs !== undefined) updateData.outputs = params.outputs;
    if (params.completedAt !== undefined) updateData.completed_at = params.completedAt;
    if (params.errorMessage !== undefined) updateData.error_message = params.errorMessage;
    if (params.errorDetails !== undefined) updateData.error_details = params.errorDetails;
    if (params.videoScript !== undefined) updateData.video_script = params.videoScript;
    if (params.falAssets !== undefined) updateData.fal_assets = params.falAssets;

    const { error } = await supabase
      .from('video_bundles')
      .update(updateData)
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update video bundle: ${error.message}`);
    }
  }

  /**
   * Increment edit count
   * NOTE: Uses read-modify-write pattern. For high-concurrency scenarios,
   * consider creating an RPC function for atomic increment.
   */
  async incrementEditCount(id: string): Promise<void> {
    const supabase = await createClient();

    // Use RPC for atomic increment (would need to create this function)
    // For now, do a read-modify-write
    const bundle = await this.getById(id);
    if (!bundle) throw new Error('Video bundle not found');

    const { error } = await supabase
      .from('video_bundles')
      .update({
        edit_count: bundle.edit_count + 1,
        last_edited_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to increment edit count: ${error.message}`);
    }
  }
}

// Singleton instance
export const videoBundleRepository = new VideoBundleRepository();
