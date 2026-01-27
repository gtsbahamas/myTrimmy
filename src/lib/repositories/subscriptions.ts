// src/lib/repositories/subscriptions.ts

import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import type {
  SubscriptionRow,
  SubscriptionPlan,
  SubscriptionStatus,
} from '@/types/video-bundle';

export interface CreateSubscriptionParams {
  userId: string;
  plan: SubscriptionPlan;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  videoBundlesLimit?: number | null;
}

export interface UpdateSubscriptionParams {
  plan?: SubscriptionPlan;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  videoBundlesUsed?: number;
  videoBundlesLimit?: number | null;
  status?: SubscriptionStatus;
}

export class SubscriptionRepository {
  /**
   * Get subscription for a user (uses service role to bypass RLS for API key auth)
   */
  async getByUserId(userId: string): Promise<SubscriptionRow | null> {
    // Use service role client to bypass RLS - needed for API key auth scenarios
    // where there's no session-based auth context
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('subscriptions')
      .select()
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to get subscription: ${error.message}`);
    }

    return data as unknown as SubscriptionRow;
  }

  /**
   * Get or create subscription for a user (defaults to free tier)
   */
  async getOrCreate(userId: string): Promise<SubscriptionRow> {
    const existing = await this.getByUserId(userId);
    if (existing) return existing;

    return this.createServiceRole({
      userId,
      plan: 'free',
      videoBundlesLimit: 0,
    });
  }

  /**
   * Create subscription (service role - bypasses RLS)
   */
  async createServiceRole(params: CreateSubscriptionParams): Promise<SubscriptionRow> {
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: params.userId,
        plan: params.plan,
        stripe_customer_id: params.stripeCustomerId ?? null,
        stripe_subscription_id: params.stripeSubscriptionId ?? null,
        video_bundles_limit: params.videoBundlesLimit ?? null,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create subscription: ${error.message}`);
    }

    return data as unknown as SubscriptionRow;
  }

  /**
   * Update subscription (service role - for Stripe webhooks)
   */
  async updateServiceRole(userId: string, params: UpdateSubscriptionParams): Promise<SubscriptionRow> {
    const supabase = createServiceRoleClient();

    const updateData: Record<string, unknown> = {};

    if (params.plan !== undefined) updateData.plan = params.plan;
    if (params.stripeCustomerId !== undefined) updateData.stripe_customer_id = params.stripeCustomerId;
    if (params.stripeSubscriptionId !== undefined) updateData.stripe_subscription_id = params.stripeSubscriptionId;
    if (params.currentPeriodStart !== undefined) updateData.current_period_start = params.currentPeriodStart;
    if (params.currentPeriodEnd !== undefined) updateData.current_period_end = params.currentPeriodEnd;
    if (params.videoBundlesUsed !== undefined) updateData.video_bundles_used = params.videoBundlesUsed;
    if (params.videoBundlesLimit !== undefined) updateData.video_bundles_limit = params.videoBundlesLimit;
    if (params.status !== undefined) updateData.status = params.status;

    const { data, error } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update subscription: ${error.message}`);
    }

    return data as unknown as SubscriptionRow;
  }

  /**
   * Increment video bundles used count
   */
  async incrementVideoBundlesUsed(userId: string): Promise<void> {
    const supabase = createServiceRoleClient();

    const sub = await this.getByUserId(userId);
    if (!sub) throw new Error('Subscription not found');

    const { error } = await supabase
      .from('subscriptions')
      .update({
        video_bundles_used: sub.video_bundles_used + 1,
      })
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to increment video bundles used: ${error.message}`);
    }
  }

  /**
   * Reset video bundles used count (for billing cycle reset)
   */
  async resetVideoBundlesUsed(userId: string): Promise<void> {
    const supabase = createServiceRoleClient();

    const { error } = await supabase
      .from('subscriptions')
      .update({
        video_bundles_used: 0,
      })
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to reset video bundles used: ${error.message}`);
    }
  }

  /**
   * Check if user can generate a video
   */
  async canUserGenerateVideo(userId: string): Promise<{
    canGenerate: boolean;
    plan: SubscriptionPlan;
    used: number;
    limit: number | null;
    remaining: number | null;
  }> {
    const sub = await this.getOrCreate(userId);
    const plan = sub.plan as SubscriptionPlan;
    const used = sub.video_bundles_used;
    const limit = sub.video_bundles_limit;

    // Import helpers from types
    const { canGenerateVideo, getVideoQuotaRemaining, SUBSCRIPTION_LIMITS } = await import('@/types/video-bundle');

    return {
      canGenerate: canGenerateVideo(plan, used),
      plan,
      used,
      limit: SUBSCRIPTION_LIMITS[plan].videoBundles,
      remaining: getVideoQuotaRemaining(plan, used),
    };
  }
}

// Singleton instance
export const subscriptionRepository = new SubscriptionRepository();
