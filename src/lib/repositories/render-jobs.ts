// src/lib/repositories/render-jobs.ts

import { createServiceRoleClient } from '@/lib/supabase/server';
import type { RenderJobRow, RenderJobStatus, VideoFormat } from '@/types/video-bundle';

export interface CreateRenderJobParams {
  videoBundleId: string;
  renderId: string;
  bucketName: string;
  format: VideoFormat;
}

export interface UpdateRenderJobParams {
  status?: RenderJobStatus;
  progress?: number;
  outputUrl?: string;
  thumbnailUrl?: string;
  errorMessage?: string;
  completedAt?: string;
}

export class RenderJobRepository {
  /**
   * Create a new render job record (service role - for background processing)
   */
  async create(params: CreateRenderJobParams): Promise<RenderJobRow> {
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('render_jobs')
      .insert({
        video_bundle_id: params.videoBundleId,
        render_id: params.renderId,
        bucket_name: params.bucketName,
        format: params.format,
        status: 'pending',
        progress: 0,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create render job: ${error.message}`);
    }

    return data as unknown as RenderJobRow;
  }

  /**
   * Get a render job by ID
   */
  async getById(id: string): Promise<RenderJobRow | null> {
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('render_jobs')
      .select()
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to get render job: ${error.message}`);
    }

    return data as unknown as RenderJobRow;
  }

  /**
   * Get all render jobs for a video bundle
   */
  async getByBundleId(videoBundleId: string): Promise<RenderJobRow[]> {
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('render_jobs')
      .select()
      .eq('video_bundle_id', videoBundleId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get render jobs: ${error.message}`);
    }

    return (data ?? []) as unknown as RenderJobRow[];
  }

  /**
   * Get render jobs for a bundle with ownership validation
   */
  async getByBundleIdForUser(videoBundleId: string, userId: string): Promise<RenderJobRow[]> {
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('render_jobs')
      .select(`
        *,
        video_bundles!inner(user_id)
      `)
      .eq('video_bundle_id', videoBundleId)
      .eq('video_bundles.user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get render jobs: ${error.message}`);
    }

    return (data ?? []) as unknown as RenderJobRow[];
  }

  /**
   * Update a render job
   */
  async update(id: string, params: UpdateRenderJobParams): Promise<RenderJobRow> {
    const supabase = createServiceRoleClient();

    const updateData: Record<string, unknown> = {};

    if (params.status !== undefined) updateData.status = params.status;
    if (params.progress !== undefined) updateData.progress = params.progress;
    if (params.outputUrl !== undefined) updateData.output_url = params.outputUrl;
    if (params.thumbnailUrl !== undefined) updateData.thumbnail_url = params.thumbnailUrl;
    if (params.errorMessage !== undefined) updateData.error_message = params.errorMessage;
    if (params.completedAt !== undefined) updateData.completed_at = params.completedAt;

    const { data, error } = await supabase
      .from('render_jobs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update render job: ${error.message}`);
    }

    return data as unknown as RenderJobRow;
  }

  /**
   * Update a render job by render_id (Remotion Lambda render ID)
   */
  async updateByRenderId(renderId: string, params: UpdateRenderJobParams): Promise<RenderJobRow | null> {
    const supabase = createServiceRoleClient();

    const updateData: Record<string, unknown> = {};

    if (params.status !== undefined) updateData.status = params.status;
    if (params.progress !== undefined) updateData.progress = params.progress;
    if (params.outputUrl !== undefined) updateData.output_url = params.outputUrl;
    if (params.thumbnailUrl !== undefined) updateData.thumbnail_url = params.thumbnailUrl;
    if (params.errorMessage !== undefined) updateData.error_message = params.errorMessage;
    if (params.completedAt !== undefined) updateData.completed_at = params.completedAt;

    const { data, error } = await supabase
      .from('render_jobs')
      .update(updateData)
      .eq('render_id', renderId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to update render job: ${error.message}`);
    }

    return data as unknown as RenderJobRow;
  }

  /**
   * Check if all renders for a bundle are completed
   */
  async areAllRendersComplete(videoBundleId: string): Promise<{
    allCompleted: boolean;
    anyFailed: boolean;
    jobs: RenderJobRow[];
  }> {
    const jobs = await this.getByBundleId(videoBundleId);

    // All 3 formats should exist and be in terminal state
    const allCompleted = jobs.length === 3 && jobs.every(
      job => job.status === 'completed' || job.status === 'failed'
    );
    const anyFailed = jobs.some(job => job.status === 'failed');

    return { allCompleted, anyFailed, jobs };
  }

  /**
   * Get jobs that are currently rendering (for progress polling)
   */
  async getRenderingJobs(limit = 100): Promise<RenderJobRow[]> {
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('render_jobs')
      .select()
      .in('status', ['pending', 'rendering'])
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get rendering jobs: ${error.message}`);
    }

    return (data ?? []) as unknown as RenderJobRow[];
  }
}

// Singleton instance
export const renderJobRepository = new RenderJobRepository();
