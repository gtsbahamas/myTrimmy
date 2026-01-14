-- ============================================================
-- DATABASE SCHEMA - myTrimmy-prep
-- Generated: 2026-01-14
-- ============================================================
--
-- SUPABASE MIGRATION
-- Run with: supabase db push (dev) or supabase db push --linked (prod)
--
-- TYPE-FIRST: This schema must match the TypeScript types exactly.
-- If schema changes, update types/domain.ts FIRST.
--
-- ============================================================
-- POSTGRESQL BEST PRACTICES (from wshobson/agents)
-- ============================================================
--
-- DATA TYPES:
--   - Use BIGINT GENERATED ALWAYS AS IDENTITY for IDs (not SERIAL)
--   - Use UUID only when global uniqueness/opacity needed
--   - Use TEXT for strings (not VARCHAR) + CHECK for length limits
--   - Use TIMESTAMPTZ (not TIMESTAMP) for all timestamps
--   - Use NUMERIC for money (never FLOAT)
--   - Use JSONB (not JSON) for semi-structured data
--
-- CONSTRAINTS:
--   - Add NOT NULL everywhere semantically required
--   - FK columns need MANUAL indexes (PostgreSQL doesn't auto-create)
--   - UNIQUE allows multiple NULLs (use NULLS NOT DISTINCT in PG15+)
--
-- PERFORMANCE:
--   - Index FK columns, frequent filters, and join keys
--   - Use partial indexes for hot subsets (WHERE status = 'active')
--   - Use GIN for JSONB, arrays, full-text search
--   - Use BRIN for large time-series tables
--
-- GOTCHAS:
--   - Identifiers are lowercased (use snake_case)
--   - No silent coercions (overflows error, not truncate)
--   - Updates leave dead tuples (VACUUM handles them)
--
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- HELPER FUNCTIONS (must be created before tables that use them)
-- ============================================================

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Soft delete helper (if using soft deletes)
CREATE OR REPLACE FUNCTION soft_delete()
RETURNS TRIGGER AS $$
BEGIN
    NEW.deleted_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- CORE TABLES
-- ============================================================


-- ============================================================
-- RELATIONSHIPS (Foreign Keys)
-- ============================================================
-- Source requirements:
-- - User has many Images (one-to-many)
- User has many Presets (one-to-many)
- User has many BatchJobs (one-to-many)
- BatchJob has many BatchImages (one-to-many)
- BatchJob belongs to Preset (optional, many-to-one)
- BatchImage belongs to Image (many-to-one)
- BatchImage belongs to BatchJob (many-to-one)
--
-- IMPORTANT: PostgreSQL does NOT auto-index FK columns!
-- FK indexes are created below for:
--   - Faster JOINs on the FK column
--   - Preventing full table locks on parent DELETE/UPDATE

ALTER TABLE imags
    ADD CONSTRAINT fk_imags_users
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE;

-- FK index (required for performance)
CREATE INDEX IF NOT EXISTS idx_imags_user_id
    ON imags (user_id);

ALTER TABLE presets
    ADD CONSTRAINT fk_presets_users
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE;

-- FK index (required for performance)
CREATE INDEX IF NOT EXISTS idx_presets_user_id
    ON presets (user_id);

ALTER TABLE batch_jobs
    ADD CONSTRAINT fk_batch_jobs_users
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE;

-- FK index (required for performance)
CREATE INDEX IF NOT EXISTS idx_batch_jobs_user_id
    ON batch_jobs (user_id);

ALTER TABLE batch_imags
    ADD CONSTRAINT fk_batch_imags_batch_jobs
    FOREIGN KEY (batch_job_id)
    REFERENCES batch_jobs(id)
    ON DELETE CASCADE;

-- FK index (required for performance)
CREATE INDEX IF NOT EXISTS idx_batch_imags_batch_job_id
    ON batch_imags (batch_job_id);

ALTER TABLE batch_jobs
    ADD CONSTRAINT fk_batch_jobs_presets
    FOREIGN KEY (preset_id)
    REFERENCES presets(id)
    ON DELETE CASCADE;

-- FK index (required for performance)
CREATE INDEX IF NOT EXISTS idx_batch_jobs_preset_id
    ON batch_jobs (preset_id);

ALTER TABLE batch_images
    ADD CONSTRAINT fk_batch_images_images
    FOREIGN KEY (image_id)
    REFERENCES images(id)
    ON DELETE CASCADE;

-- FK index (required for performance)
CREATE INDEX IF NOT EXISTS idx_batch_images_image_id
    ON batch_images (image_id);

ALTER TABLE batch_images
    ADD CONSTRAINT fk_batch_images_batch_jobs
    FOREIGN KEY (batch_job_id)
    REFERENCES batch_jobs(id)
    ON DELETE CASCADE;

-- FK index (required for performance)
CREATE INDEX IF NOT EXISTS idx_batch_images_batch_job_id
    ON batch_images (batch_job_id);


-- ============================================================
-- INDEXES
-- ============================================================


-- ============================================================
-- CONSTRAINTS
-- ============================================================


-- ============================================================
-- ROW LEVEL SECURITY (RLS) HELPER FUNCTIONS
-- ============================================================
-- CRITICAL: These security definer functions BYPASS RLS when checking
-- membership/ownership. This prevents infinite recursion when policies
-- reference tables that themselves have RLS enabled.
--
-- ANTI-PATTERN TO AVOID:
--   CREATE POLICY "Members can view" ON team_members FOR SELECT
--   USING (EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid()));
--   ^^^ This causes INFINITE RECURSION because the policy queries itself!
--
-- CORRECT PATTERN:
--   Use a SECURITY DEFINER function that bypasses RLS:
--   CREATE POLICY "Members can view" ON team_members FOR SELECT
--   USING (is_team_member(team_id, auth.uid()));

-- Check if user is a member of a team (bypasses RLS)
CREATE OR REPLACE FUNCTION is_team_member(p_team_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM team_members
        WHERE team_id = p_team_id AND user_id = p_user_id
    );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if user owns a team (bypasses RLS)
CREATE OR REPLACE FUNCTION is_team_owner(p_team_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM teams
        WHERE id = p_team_id AND owner_id = p_user_id
    );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if user has access to a resource via ownership or team membership
CREATE OR REPLACE FUNCTION has_resource_access(p_user_id UUID, p_owner_id UUID, p_team_id UUID)
RETURNS BOOLEAN AS $$
    SELECT p_user_id = p_owner_id
        OR (p_team_id IS NOT NULL AND is_team_member(p_team_id, p_user_id));
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
-- IMPORTANT: Enable RLS on all tables with user data


-- ============================================================
-- SENSITIVE DATA HANDLING
-- ============================================================

-- ============================================================
-- GENERATED BY MENTAL MODELS SDLC
-- ============================================================
