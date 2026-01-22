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
