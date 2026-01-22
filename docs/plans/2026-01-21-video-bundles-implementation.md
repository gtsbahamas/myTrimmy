# Video Bundles Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add URL-to-promo-video generation that creates landscape, portrait, and square video formats from any website URL.

**Architecture:** Hybrid Remotion (structured content) + Fal.ai (AI flourishes) with two-layer quality validation (programmatic + Gemini). Introduces subscription tiers (Studio/Agency) for recurring revenue.

**Tech Stack:** Next.js 15, Remotion 4.x, Fal.ai SDK, Gemini API, Playwright (URL analysis), Supabase (database + storage), Stripe (subscriptions)

**Design Reference:** `docs/plans/2026-01-21-video-bundles-design.md`

---

## Phase 1: Foundation

### Task 1.1: Create Video Bundle Domain Types

**Files:**
- Create: `src/types/video-bundle.ts`

**Step 1: Create the type definitions file**

```typescript
// src/types/video-bundle.ts

// ============================================
// Enums as const objects (for runtime + type safety)
// ============================================

export const VIDEO_STYLES = ['minimal', 'energetic', 'professional'] as const;
export type VideoStyle = typeof VIDEO_STYLES[number];

export const MUSIC_MOODS = ['ambient', 'upbeat', 'cinematic', 'none'] as const;
export type MusicMood = typeof MUSIC_MOODS[number];

export const VIDEO_BUNDLE_STATUSES = [
  'pending',
  'analyzing',
  'composing',
  'rendering',
  'validating',
  'reviewing',
  'completed',
  'failed',
] as const;
export type VideoBundleStatus = typeof VIDEO_BUNDLE_STATUSES[number];

export const SUBSCRIPTION_PLANS = ['free', 'pro', 'studio', 'studio_annual', 'agency'] as const;
export type SubscriptionPlan = typeof SUBSCRIPTION_PLANS[number];

export const SUBSCRIPTION_STATUSES = ['active', 'canceled', 'past_due', 'paused'] as const;
export type SubscriptionStatus = typeof SUBSCRIPTION_STATUSES[number];

export const EDIT_TYPES = ['text_change', 'duration_change', 'style_change', 'single_format'] as const;
export type EditType = typeof EDIT_TYPES[number];

export const FAL_JOB_TYPES = ['intro', 'outro', 'background'] as const;
export type FalJobType = typeof FAL_JOB_TYPES[number];

export const FAL_JOB_STATUSES = ['pending', 'processing', 'completed', 'failed'] as const;
export type FalJobStatus = typeof FAL_JOB_STATUSES[number];

export const VIDEO_FORMATS = ['landscape', 'portrait', 'square'] as const;
export type VideoFormat = typeof VIDEO_FORMATS[number];

// ============================================
// Site Analysis Types
// ============================================

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface SiteScreenshots {
  full: string;
  sections: string[];
}

export interface SiteContent {
  headline: string;
  subheadline: string | null;
  features: string[];
  stats: string[];
  cta: string;
}

export interface SiteAnalysis {
  screenshots: SiteScreenshots;
  colors: ColorPalette;
  content: SiteContent;
  logoUrl: string | null;
  siteType: 'tech' | 'ecommerce' | 'enterprise' | 'other';
}

// ============================================
// Video Output Types
// ============================================

export interface VideoFormatOutput {
  videoUrl: string;
  thumbnailUrl: string;
}

export interface VideoOutputs {
  landscape: VideoFormatOutput;
  portrait: VideoFormatOutput;
  square: VideoFormatOutput;
  metadata: {
    duration: number;
    colors: string[];
    musicTrack: string | null;
  };
}

// ============================================
// Quality Pipeline Types
// ============================================

export interface ValidationCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  value: string | number;
  threshold: string | number;
  autoFixApplied?: boolean;
}

export interface ValidationResult {
  passed: boolean;
  checks: ValidationCheck[];
}

export interface GeminiReview {
  overallScore: number;
  pacing: { score: number; feedback: string };
  transitions: { score: number; feedback: string };
  coherence: { score: number; feedback: string };
  improvements: Array<{
    priority: 'high' | 'medium' | 'low';
    suggestion: string;
    autoApplicable: boolean;
  }>;
}

// ============================================
// Video Script Types (for Remotion)
// ============================================

export interface SceneBase {
  duration: number; // in frames (30fps)
}

export interface IntroScene extends SceneBase {
  type: 'intro';
  headline: string;
  logoUrl: string | null;
}

export interface FeatureScene extends SceneBase {
  type: 'feature';
  title: string;
  description: string;
  screenshot: string | null;
}

export interface StatsScene extends SceneBase {
  type: 'stats';
  items: Array<{ label: string; value: string }>;
}

export interface ScreenshotScene extends SceneBase {
  type: 'screenshot';
  imageUrl: string;
  caption: string | null;
}

export interface CtaScene extends SceneBase {
  type: 'cta';
  headline: string;
  buttonText: string;
  url: string;
}

export type VideoScene = IntroScene | FeatureScene | StatsScene | ScreenshotScene | CtaScene;

export interface VideoScript {
  scenes: VideoScene[];
  style: VideoStyle;
  musicMood: MusicMood;
  totalDuration: number;
  colors: ColorPalette;
  logoUrl: string | null;
}

// ============================================
// Database Row Types (matches Supabase schema)
// ============================================

export interface VideoBundleRow {
  id: string;
  user_id: string;
  source_url: string;
  site_analysis: SiteAnalysis;
  style: VideoStyle;
  music_mood: MusicMood;
  duration_seconds: number;
  status: VideoBundleStatus;
  validation_result: ValidationResult | null;
  gemini_review: GeminiReview | null;
  outputs: VideoOutputs | null;
  edit_count: number;
  last_edited_at: string | null;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
  error_details: Record<string, unknown> | null;
}

export interface SubscriptionRow {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  video_bundles_used: number;
  video_bundles_limit: number | null;
  status: SubscriptionStatus;
  created_at: string;
  updated_at: string;
}

export interface VideoEditRow {
  id: string;
  video_bundle_id: string;
  edit_type: EditType;
  changes: Record<string, unknown>;
  applied_at: string;
  applied_by: string;
}

export interface FalJobRow {
  id: string;
  video_bundle_id: string;
  fal_request_id: string;
  job_type: FalJobType;
  status: FalJobStatus;
  output_url: string | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

// ============================================
// API Request/Response Types
// ============================================

export interface AnalyzeUrlRequest {
  url: string;
}

export interface AnalyzeUrlResponse {
  analysis: SiteAnalysis;
  suggestedStyle: VideoStyle;
  suggestedMusicMood: MusicMood;
  suggestedDuration: number;
}

export interface GenerateVideoRequest {
  sourceUrl: string;
  style: VideoStyle;
  musicMood: MusicMood;
  durationSeconds: number;
}

export interface GenerateVideoResponse {
  bundleId: string;
  status: VideoBundleStatus;
}

export interface VideoBundleStatusResponse {
  id: string;
  status: VideoBundleStatus;
  progress: number;
  currentStep: string;
  outputs: VideoOutputs | null;
  error: string | null;
}

// ============================================
// Subscription Limits
// ============================================

export const SUBSCRIPTION_LIMITS: Record<SubscriptionPlan, { videoBundles: number | null }> = {
  free: { videoBundles: 0 }, // Preview only (watermarked)
  pro: { videoBundles: 0 },  // No video access
  studio: { videoBundles: 5 },
  studio_annual: { videoBundles: 5 },
  agency: { videoBundles: null }, // Unlimited
};

export function canGenerateVideo(plan: SubscriptionPlan, used: number): boolean {
  const limit = SUBSCRIPTION_LIMITS[plan].videoBundles;
  if (limit === null) return true;
  return used < limit;
}

export function getVideoQuotaRemaining(plan: SubscriptionPlan, used: number): number | null {
  const limit = SUBSCRIPTION_LIMITS[plan].videoBundles;
  if (limit === null) return null;
  return Math.max(0, limit - used);
}
```

**Step 2: Verify file compiles**

Run: `cd /Users/tywells/Downloads/projects/myTrimmy/.worktrees/video-bundles && npx tsc --noEmit src/types/video-bundle.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add src/types/video-bundle.ts
git commit -m "feat(video): add video bundle domain types

- Video bundle status, style, mood enums
- Site analysis types for URL extraction
- Video output and quality pipeline types
- Subscription plan limits and helpers

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 1.2: Create Database Migration for Video Tables

**Files:**
- Create: `supabase/migrations/20260121000000_video_bundles.sql`

**Step 1: Create migration file**

```sql
-- supabase/migrations/20260121000000_video_bundles.sql

-- Video generation requests and their outputs
CREATE TABLE video_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Input
  source_url TEXT NOT NULL,

  -- Analysis results (cached for re-generation)
  site_analysis JSONB NOT NULL,

  -- User selections
  style TEXT NOT NULL CHECK (style IN ('minimal', 'energetic', 'professional')),
  music_mood TEXT NOT NULL CHECK (music_mood IN ('ambient', 'upbeat', 'cinematic', 'none')),
  duration_seconds INTEGER NOT NULL CHECK (duration_seconds BETWEEN 15 AND 90),

  -- Generation state
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'analyzing', 'composing', 'rendering',
    'validating', 'reviewing', 'completed', 'failed'
  )),

  -- Quality results
  validation_result JSONB,
  gemini_review JSONB,

  -- Outputs
  outputs JSONB,

  -- Edit history
  edit_count INTEGER NOT NULL DEFAULT 0,
  last_edited_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,

  -- Error tracking
  error_message TEXT,
  error_details JSONB
);

-- Indexes for video_bundles
CREATE INDEX idx_video_bundles_user_id ON video_bundles(user_id);
CREATE INDEX idx_video_bundles_status ON video_bundles(status);
CREATE INDEX idx_video_bundles_created_at ON video_bundles(created_at DESC);

-- RLS for video_bundles
ALTER TABLE video_bundles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own video bundles"
  ON video_bundles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own video bundles"
  ON video_bundles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own video bundles"
  ON video_bundles FOR UPDATE
  USING (auth.uid() = user_id);

-- Subscription management
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  plan TEXT NOT NULL CHECK (plan IN ('free', 'pro', 'studio', 'studio_annual', 'agency')),

  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,

  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,

  video_bundles_used INTEGER NOT NULL DEFAULT 0,
  video_bundles_limit INTEGER,

  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'paused')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id)
);

-- Indexes for subscriptions
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);

-- RLS for subscriptions (read-only for users, writes via service role)
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Video edits tracking
CREATE TABLE video_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_bundle_id UUID NOT NULL REFERENCES video_bundles(id) ON DELETE CASCADE,

  edit_type TEXT NOT NULL CHECK (edit_type IN (
    'text_change', 'duration_change', 'style_change', 'single_format'
  )),

  changes JSONB NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  applied_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Indexes for video_edits
CREATE INDEX idx_video_edits_bundle ON video_edits(video_bundle_id);

-- RLS for video_edits
ALTER TABLE video_edits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view edits on own bundles"
  ON video_edits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM video_bundles
      WHERE id = video_edits.video_bundle_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert edits on own bundles"
  ON video_edits FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM video_bundles
      WHERE id = video_edits.video_bundle_id
      AND user_id = auth.uid()
    )
  );

-- Fal.ai job tracking
CREATE TABLE fal_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_bundle_id UUID NOT NULL REFERENCES video_bundles(id) ON DELETE CASCADE,

  fal_request_id TEXT NOT NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('intro', 'outro', 'background')),

  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),

  output_url TEXT,
  error_message TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Indexes for fal_jobs
CREATE INDEX idx_fal_jobs_bundle ON fal_jobs(video_bundle_id);
CREATE INDEX idx_fal_jobs_request ON fal_jobs(fal_request_id);

-- RLS for fal_jobs (service role only for writes)
ALTER TABLE fal_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view fal jobs on own bundles"
  ON fal_jobs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM video_bundles
      WHERE id = fal_jobs.video_bundle_id
      AND user_id = auth.uid()
    )
  );

-- Function to update subscription updated_at
CREATE OR REPLACE FUNCTION update_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_updated_at();

-- Create default subscription for existing users (free tier)
-- This should be run as a data migration or handled in app logic
```

**Step 2: Verify migration syntax**

Run: `cd /Users/tywells/Downloads/projects/myTrimmy/.worktrees/video-bundles && cat supabase/migrations/20260121000000_video_bundles.sql | head -20`
Expected: First 20 lines of the migration file

**Step 3: Commit**

```bash
git add supabase/migrations/20260121000000_video_bundles.sql
git commit -m "feat(video): add database migration for video tables

- video_bundles: main generation tracking
- subscriptions: plan and usage tracking
- video_edits: edit history
- fal_jobs: async AI job tracking
- RLS policies for all tables

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 1.3: Update Database Types for Video Tables

**Files:**
- Modify: `src/types/database.ts`

**Step 1: Add video tables to Database type**

Add the following tables inside the `Tables` object in `src/types/database.ts`, after the `edit_operations` table:

```typescript
      video_bundles: {
        Row: {
          id: string
          user_id: string
          source_url: string
          site_analysis: Json
          style: string
          music_mood: string
          duration_seconds: number
          status: string
          validation_result: Json | null
          gemini_review: Json | null
          outputs: Json | null
          edit_count: number
          last_edited_at: string | null
          created_at: string
          completed_at: string | null
          error_message: string | null
          error_details: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          source_url: string
          site_analysis: Json
          style: string
          music_mood: string
          duration_seconds: number
          status?: string
          validation_result?: Json | null
          gemini_review?: Json | null
          outputs?: Json | null
          edit_count?: number
          last_edited_at?: string | null
          created_at?: string
          completed_at?: string | null
          error_message?: string | null
          error_details?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          source_url?: string
          site_analysis?: Json
          style?: string
          music_mood?: string
          duration_seconds?: number
          status?: string
          validation_result?: Json | null
          gemini_review?: Json | null
          outputs?: Json | null
          edit_count?: number
          last_edited_at?: string | null
          created_at?: string
          completed_at?: string | null
          error_message?: string | null
          error_details?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "video_bundles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          current_period_start: string | null
          current_period_end: string | null
          video_bundles_used: number
          video_bundles_limit: number | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          video_bundles_used?: number
          video_bundles_limit?: number | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          video_bundles_used?: number
          video_bundles_limit?: number | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      video_edits: {
        Row: {
          id: string
          video_bundle_id: string
          edit_type: string
          changes: Json
          applied_at: string
          applied_by: string
        }
        Insert: {
          id?: string
          video_bundle_id: string
          edit_type: string
          changes: Json
          applied_at?: string
          applied_by: string
        }
        Update: {
          id?: string
          video_bundle_id?: string
          edit_type?: string
          changes?: Json
          applied_at?: string
          applied_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_edits_video_bundle_id_fkey"
            columns: ["video_bundle_id"]
            isOneToOne: false
            referencedRelation: "video_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_edits_applied_by_fkey"
            columns: ["applied_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fal_jobs: {
        Row: {
          id: string
          video_bundle_id: string
          fal_request_id: string
          job_type: string
          status: string
          output_url: string | null
          error_message: string | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          video_bundle_id: string
          fal_request_id: string
          job_type: string
          status?: string
          output_url?: string | null
          error_message?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          video_bundle_id?: string
          fal_request_id?: string
          job_type?: string
          status?: string
          output_url?: string | null
          error_message?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fal_jobs_video_bundle_id_fkey"
            columns: ["video_bundle_id"]
            isOneToOne: false
            referencedRelation: "video_bundles"
            referencedColumns: ["id"]
          },
        ]
      }
```

**Step 2: Verify typecheck passes**

Run: `npm run typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add src/types/database.ts
git commit -m "feat(video): add video tables to database types

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 1.4: Create Video Bundle Repository

**Files:**
- Create: `src/lib/repositories/video-bundles.ts`

**Step 1: Create repository file**

```typescript
// src/lib/repositories/video-bundles.ts

import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import type {
  VideoBundleRow,
  VideoBundleStatus,
  VideoStyle,
  MusicMood,
  SiteAnalysis,
  VideoOutputs,
  ValidationResult,
  GeminiReview,
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
}

export class VideoBundleRepository {
  /**
   * Create a new video bundle
   */
  async create(params: CreateVideoBundleParams): Promise<VideoBundleRow> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('video_bundles')
      .insert({
        user_id: params.userId,
        source_url: params.sourceUrl,
        site_analysis: params.siteAnalysis as unknown as Record<string, unknown>,
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
   * Get a video bundle by ID (user-scoped via RLS)
   */
  async getById(id: string): Promise<VideoBundleRow | null> {
    const supabase = await createClient();

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
   */
  async getByUserId(userId: string, limit = 50): Promise<VideoBundleRow[]> {
    const supabase = await createClient();

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
   * Update a video bundle (user-scoped via RLS)
   */
  async update(id: string, params: UpdateVideoBundleParams): Promise<VideoBundleRow> {
    const supabase = await createClient();

    const updateData: Record<string, unknown> = {};

    if (params.status !== undefined) updateData.status = params.status;
    if (params.validationResult !== undefined) updateData.validation_result = params.validationResult;
    if (params.geminiReview !== undefined) updateData.gemini_review = params.geminiReview;
    if (params.outputs !== undefined) updateData.outputs = params.outputs;
    if (params.completedAt !== undefined) updateData.completed_at = params.completedAt;
    if (params.errorMessage !== undefined) updateData.error_message = params.errorMessage;
    if (params.errorDetails !== undefined) updateData.error_details = params.errorDetails;

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
```

**Step 2: Verify typecheck passes**

Run: `npm run typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/repositories/video-bundles.ts
git commit -m "feat(video): add video bundle repository

- CRUD operations for video_bundles table
- Service role method for background job updates
- User-scoped queries via RLS

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 1.5: Create Subscription Repository

**Files:**
- Create: `src/lib/repositories/subscriptions.ts`

**Step 1: Create repository file**

```typescript
// src/lib/repositories/subscriptions.ts

import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import type {
  SubscriptionRow,
  SubscriptionPlan,
  SubscriptionStatus,
  SUBSCRIPTION_LIMITS,
  canGenerateVideo,
  getVideoQuotaRemaining,
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
   * Get subscription for a user
   */
  async getByUserId(userId: string): Promise<SubscriptionRow | null> {
    const supabase = await createClient();

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
```

**Step 2: Verify typecheck passes**

Run: `npm run typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/repositories/subscriptions.ts
git commit -m "feat(video): add subscription repository

- Subscription CRUD with service role for webhooks
- Usage tracking (increment, reset)
- Quota checking helper

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 1.6: Create Basic Video API Routes

**Files:**
- Create: `src/app/api/video/analyze/route.ts`
- Create: `src/app/api/video/generate/route.ts`
- Create: `src/app/api/video/[id]/route.ts`

**Step 1: Create analyze route (stub)**

```typescript
// src/app/api/video/analyze/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/supabase/server';
import { subscriptionRepository } from '@/lib/repositories/subscriptions';
import type { AnalyzeUrlRequest, AnalyzeUrlResponse } from '@/types/video-bundle';

export async function POST(request: NextRequest) {
  // Authenticate
  const auth = await getAuthFromRequest(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  // Check subscription
  const quota = await subscriptionRepository.canUserGenerateVideo(auth.userId);
  if (!quota.canGenerate && quota.plan !== 'free') {
    return NextResponse.json(
      { error: 'Video generation quota exceeded', quota },
      { status: 403 }
    );
  }

  // Parse request
  let body: AnalyzeUrlRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.url || typeof body.url !== 'string') {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  // Validate URL format
  try {
    new URL(body.url);
  } catch {
    return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
  }

  // TODO: Implement URL analysis with Playwright
  // For now, return a placeholder response
  const response: AnalyzeUrlResponse = {
    analysis: {
      screenshots: {
        full: '', // TODO: Generate screenshot
        sections: [],
      },
      colors: {
        primary: '#f59e0b',
        secondary: '#1f2937',
        accent: '#f59e0b',
        background: '#111827',
        text: '#f9fafb',
      },
      content: {
        headline: 'Your Website',
        subheadline: null,
        features: [],
        stats: [],
        cta: 'Learn More',
      },
      logoUrl: null,
      siteType: 'other',
    },
    suggestedStyle: 'minimal',
    suggestedMusicMood: 'ambient',
    suggestedDuration: 45,
  };

  return NextResponse.json(response);
}
```

**Step 2: Create generate route (stub)**

```typescript
// src/app/api/video/generate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/supabase/server';
import { videoBundleRepository } from '@/lib/repositories/video-bundles';
import { subscriptionRepository } from '@/lib/repositories/subscriptions';
import type { GenerateVideoRequest, GenerateVideoResponse, VIDEO_STYLES, MUSIC_MOODS } from '@/types/video-bundle';

export async function POST(request: NextRequest) {
  // Authenticate
  const auth = await getAuthFromRequest(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  // Check subscription
  const quota = await subscriptionRepository.canUserGenerateVideo(auth.userId);
  if (!quota.canGenerate) {
    return NextResponse.json(
      { error: 'Video generation quota exceeded', quota },
      { status: 403 }
    );
  }

  // Parse request
  let body: GenerateVideoRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Validate required fields
  if (!body.sourceUrl || typeof body.sourceUrl !== 'string') {
    return NextResponse.json({ error: 'sourceUrl is required' }, { status: 400 });
  }

  // Import constants for validation
  const { VIDEO_STYLES, MUSIC_MOODS } = await import('@/types/video-bundle');

  if (!VIDEO_STYLES.includes(body.style as typeof VIDEO_STYLES[number])) {
    return NextResponse.json({ error: 'Invalid style' }, { status: 400 });
  }

  if (!MUSIC_MOODS.includes(body.musicMood as typeof MUSIC_MOODS[number])) {
    return NextResponse.json({ error: 'Invalid musicMood' }, { status: 400 });
  }

  if (typeof body.durationSeconds !== 'number' || body.durationSeconds < 15 || body.durationSeconds > 90) {
    return NextResponse.json({ error: 'durationSeconds must be between 15 and 90' }, { status: 400 });
  }

  // TODO: Run URL analysis if not already cached
  // For now, use placeholder analysis
  const siteAnalysis = {
    screenshots: { full: '', sections: [] },
    colors: {
      primary: '#f59e0b',
      secondary: '#1f2937',
      accent: '#f59e0b',
      background: '#111827',
      text: '#f9fafb',
    },
    content: {
      headline: 'Your Website',
      subheadline: null,
      features: [],
      stats: [],
      cta: 'Learn More',
    },
    logoUrl: null,
    siteType: 'other' as const,
  };

  // Create video bundle record
  const bundle = await videoBundleRepository.create({
    userId: auth.userId,
    sourceUrl: body.sourceUrl,
    siteAnalysis,
    style: body.style as typeof VIDEO_STYLES[number],
    musicMood: body.musicMood as typeof MUSIC_MOODS[number],
    durationSeconds: body.durationSeconds,
  });

  // Increment usage
  await subscriptionRepository.incrementVideoBundlesUsed(auth.userId);

  // TODO: Trigger async generation pipeline
  // For now, just return the bundle ID

  const response: GenerateVideoResponse = {
    bundleId: bundle.id,
    status: bundle.status,
  };

  return NextResponse.json(response, { status: 201 });
}
```

**Step 3: Create status route**

```typescript
// src/app/api/video/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/supabase/server';
import { videoBundleRepository } from '@/lib/repositories/video-bundles';
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
  const bundle = await videoBundleRepository.getById(id);
  if (!bundle) {
    return NextResponse.json({ error: 'Video bundle not found' }, { status: 404 });
  }

  // Calculate progress based on status
  const progressMap: Record<string, number> = {
    pending: 0,
    analyzing: 10,
    composing: 30,
    rendering: 50,
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

  const response: VideoBundleStatusResponse = {
    id: bundle.id,
    status: bundle.status,
    progress: progressMap[bundle.status] ?? 0,
    currentStep: stepMap[bundle.status] ?? 'Unknown',
    outputs: bundle.outputs,
    error: bundle.error_message,
  };

  return NextResponse.json(response);
}
```

**Step 4: Verify typecheck passes**

Run: `npm run typecheck`
Expected: No errors

**Step 5: Commit**

```bash
git add src/app/api/video/
git commit -m "feat(video): add basic video API routes

- POST /api/video/analyze - URL analysis (stub)
- POST /api/video/generate - Start video generation
- GET /api/video/[id] - Get bundle status

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 1.7: Verify Phase 1 Build

**Step 1: Run full typecheck**

Run: `npm run typecheck`
Expected: No errors

**Step 2: Run build**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit phase completion**

```bash
git add -A
git commit -m "chore(video): complete Phase 1 foundation

Phase 1 delivers:
- Video bundle domain types
- Database migration for 4 new tables
- Updated database types
- Video bundle repository
- Subscription repository
- Basic API routes (stubs)

Ready for Phase 2: AI Integration

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Phase 2: AI Integration

> **Note:** Phase 2 tasks will be detailed in a follow-up plan after Phase 1 is verified complete.

**Phase 2 will cover:**
- Task 2.1: URL Analyzer with Playwright
- Task 2.2: Claude Script Generator
- Task 2.3: Fal.ai Integration
- Task 2.4: Fal.ai Webhook Handler
- Task 2.5: Gemini Review Integration
- Task 2.6: Prompt Templates per Style

---

## Phase 3-6 Overview

**Phase 3: Remotion Core**
- Remotion project setup
- Style configurations
- Scene components
- Single-format render

**Phase 4: Multi-Format & Quality**
- All three compositions
- Parallel render orchestration
- Structured validation
- Auto-fix implementations

**Phase 5: UI & User Flow**
- URL input page
- Customization UI
- Progress indicator
- Preview & download
- Quick edit interface

**Phase 6: Polish & Production**
- Error handling UI
- Watermarking
- Usage tracking
- Email notifications
- Analytics
- Load testing

---

## Quick Reference

**Worktree:** `/Users/tywells/Downloads/projects/myTrimmy/.worktrees/video-bundles`

**Branch:** `feature/video-bundles`

**Design Doc:** `docs/plans/2026-01-21-video-bundles-design.md`

**Key Files Created:**
- `src/types/video-bundle.ts` - Domain types
- `supabase/migrations/20260121000000_video_bundles.sql` - Database migration
- `src/lib/repositories/video-bundles.ts` - Video bundle repository
- `src/lib/repositories/subscriptions.ts` - Subscription repository
- `src/app/api/video/analyze/route.ts` - URL analysis endpoint
- `src/app/api/video/generate/route.ts` - Generation endpoint
- `src/app/api/video/[id]/route.ts` - Status endpoint
