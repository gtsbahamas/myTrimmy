// src/lib/repositories/fal-jobs.ts

import { createServiceRoleClient } from '@/lib/supabase/server';
import type { FalJobRow, FalJobType, FalJobStatus } from '@/types/video-bundle';

export interface CreateFalJobParams {
  videoBundleId: string;
  falRequestId: string;
  jobType: FalJobType;
}

export interface UpdateFalJobParams {
  status?: FalJobStatus;
  outputUrl?: string;
  errorMessage?: string;
  completedAt?: string;
}

export class FalJobRepository {
  /**
   * Create a new Fal job record (service role - for background processing)
   */
  async create(params: CreateFalJobParams): Promise<FalJobRow> {
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('fal_jobs')
      .insert({
        video_bundle_id: params.videoBundleId,
        fal_request_id: params.falRequestId,
        job_type: params.jobType,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create Fal job: ${error.message}`);
    }

    return data as unknown as FalJobRow;
  }

  /**
   * Get a Fal job by request ID
   */
  async getByRequestId(requestId: string): Promise<FalJobRow | null> {
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('fal_jobs')
      .select()
      .eq('fal_request_id', requestId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to get Fal job: ${error.message}`);
    }

    return data as unknown as FalJobRow;
  }

  /**
   * Get a Fal job by request ID with ownership validation
   * Use this for user-facing operations
   */
  async getByRequestIdForUser(requestId: string, userId: string): Promise<FalJobRow | null> {
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('fal_jobs')
      .select(`
        *,
        video_bundles!inner(user_id)
      `)
      .eq('fal_request_id', requestId)
      .eq('video_bundles.user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found or unauthorized
      throw new Error(`Failed to get Fal job: ${error.message}`);
    }

    return data as unknown as FalJobRow;
  }

  /**
   * Get all Fal jobs for a video bundle
   */
  async getByBundleId(videoBundleId: string): Promise<FalJobRow[]> {
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('fal_jobs')
      .select()
      .eq('video_bundle_id', videoBundleId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get Fal jobs: ${error.message}`);
    }

    return (data ?? []) as unknown as FalJobRow[];
  }

  /**
   * Get all Fal jobs for a video bundle with ownership validation
   */
  async getByBundleIdForUser(videoBundleId: string, userId: string): Promise<FalJobRow[]> {
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('fal_jobs')
      .select(`
        *,
        video_bundles!inner(user_id)
      `)
      .eq('video_bundle_id', videoBundleId)
      .eq('video_bundles.user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get Fal jobs: ${error.message}`);
    }

    return (data ?? []) as unknown as FalJobRow[];
  }

  /**
   * Update a Fal job
   */
  async update(id: string, params: UpdateFalJobParams): Promise<FalJobRow> {
    const supabase = createServiceRoleClient();

    const updateData: Record<string, unknown> = {};

    if (params.status !== undefined) updateData.status = params.status;
    if (params.outputUrl !== undefined) updateData.output_url = params.outputUrl;
    if (params.errorMessage !== undefined) updateData.error_message = params.errorMessage;
    if (params.completedAt !== undefined) updateData.completed_at = params.completedAt;

    const { data, error } = await supabase
      .from('fal_jobs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update Fal job: ${error.message}`);
    }

    return data as unknown as FalJobRow;
  }

  /**
   * Update a Fal job by request ID (for webhook handling)
   */
  async updateByRequestId(requestId: string, params: UpdateFalJobParams): Promise<FalJobRow | null> {
    const supabase = createServiceRoleClient();

    const updateData: Record<string, unknown> = {};

    if (params.status !== undefined) updateData.status = params.status;
    if (params.outputUrl !== undefined) updateData.output_url = params.outputUrl;
    if (params.errorMessage !== undefined) updateData.error_message = params.errorMessage;
    if (params.completedAt !== undefined) updateData.completed_at = params.completedAt;

    const { data, error } = await supabase
      .from('fal_jobs')
      .update(updateData)
      .eq('fal_request_id', requestId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to update Fal job: ${error.message}`);
    }

    return data as unknown as FalJobRow;
  }

  /**
   * Check if all jobs for a bundle are completed
   */
  async areAllJobsCompleted(videoBundleId: string): Promise<{
    allCompleted: boolean;
    anyFailed: boolean;
    jobs: FalJobRow[];
  }> {
    const jobs = await this.getByBundleId(videoBundleId);

    const allCompleted = jobs.every(job => job.status === 'completed' || job.status === 'failed');
    const anyFailed = jobs.some(job => job.status === 'failed');

    return { allCompleted, anyFailed, jobs };
  }

  /**
   * Get pending jobs that need status checks (for polling fallback)
   */
  async getPendingJobs(limit = 100): Promise<FalJobRow[]> {
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('fal_jobs')
      .select()
      .in('status', ['pending', 'processing'])
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get pending Fal jobs: ${error.message}`);
    }

    return (data ?? []) as unknown as FalJobRow[];
  }
}

// Singleton instance
export const falJobRepository = new FalJobRepository();
