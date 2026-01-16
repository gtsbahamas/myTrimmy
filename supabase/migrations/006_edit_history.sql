-- ============================================================
-- EDIT HISTORY - Non-Destructive Editing with Undo/Redo
-- Migration: 006_edit_history.sql
-- Created: 2026-01-16
-- ============================================================
--
-- Implements a hybrid operation log + cached snapshots approach:
-- - Operation log is source of truth
-- - Cache current processed image for fast display
-- - For expensive ops (background removal), cache pre-snapshot for fast undo
-- - Regenerate from log when needed

-- ============================================================
-- EDIT SESSIONS TABLE
-- ============================================================
-- Tracks an editing session for an image. Each image can have
-- one active session at a time.

CREATE TABLE IF NOT EXISTS edit_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_id UUID NOT NULL REFERENCES images(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Current position in the operation history (0 = original image)
    current_position INTEGER NOT NULL DEFAULT 0,

    -- Cached URL of the current state (for fast display)
    current_snapshot_url TEXT,

    -- Session status
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'saved', 'abandoned')),

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    saved_at TIMESTAMPTZ,

    -- Optimistic locking version
    version INTEGER NOT NULL DEFAULT 1
);

-- Ensure only one active session per image using partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_session_per_image
    ON edit_sessions (image_id)
    WHERE status = 'active';

-- FK index for user lookups
CREATE INDEX IF NOT EXISTS idx_edit_sessions_user_id
    ON edit_sessions (user_id);

-- Index for finding sessions by image
CREATE INDEX IF NOT EXISTS idx_edit_sessions_image_id
    ON edit_sessions (image_id);

-- Index for finding active sessions
CREATE INDEX IF NOT EXISTS idx_edit_sessions_active
    ON edit_sessions (status, updated_at)
    WHERE status = 'active';

-- Updated at trigger
CREATE OR REPLACE TRIGGER edit_sessions_updated_at
    BEFORE UPDATE ON edit_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- EDIT OPERATIONS TABLE
-- ============================================================
-- Records each operation in the editing pipeline.
-- Operations are ordered by position within a session.

CREATE TABLE IF NOT EXISTS edit_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES edit_sessions(id) ON DELETE CASCADE,

    -- Position in operation sequence (1-indexed, 0 is original)
    position INTEGER NOT NULL CHECK (position > 0),

    -- Operation details
    operation_type TEXT NOT NULL CHECK (operation_type IN (
        'trim', 'crop', 'rotate', 'resize', 'optimize', 'convert', 'removeBackground'
    )),
    params JSONB NOT NULL DEFAULT '{}',

    -- Cached snapshots
    -- pre_snapshot_url: State BEFORE this operation (for expensive ops, enables fast undo)
    pre_snapshot_url TEXT,
    -- post_snapshot_url: Result of this operation (always cached for redo)
    post_snapshot_url TEXT,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration_ms INTEGER,

    -- Unique position within session
    CONSTRAINT unique_position_per_session UNIQUE (session_id, position)
);

-- FK index for session lookups
CREATE INDEX IF NOT EXISTS idx_edit_operations_session_id
    ON edit_operations (session_id);

-- Index for position-based queries
CREATE INDEX IF NOT EXISTS idx_edit_operations_session_position
    ON edit_operations (session_id, position);

-- ============================================================
-- IMAGES TABLE UPDATE
-- ============================================================
-- Add reference to active edit session

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'images' AND column_name = 'active_edit_session_id'
    ) THEN
        ALTER TABLE images
        ADD COLUMN active_edit_session_id UUID REFERENCES edit_sessions(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Index for active session lookup
CREATE INDEX IF NOT EXISTS idx_images_active_edit_session
    ON images (active_edit_session_id)
    WHERE active_edit_session_id IS NOT NULL;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on edit_sessions
ALTER TABLE edit_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own sessions
CREATE POLICY "Users can view own edit sessions"
    ON edit_sessions FOR SELECT
    USING (user_id = auth.uid());

-- Users can only create sessions for their own images
CREATE POLICY "Users can create own edit sessions"
    ON edit_sessions FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Users can only update their own sessions
CREATE POLICY "Users can update own edit sessions"
    ON edit_sessions FOR UPDATE
    USING (user_id = auth.uid());

-- Users can only delete their own sessions
CREATE POLICY "Users can delete own edit sessions"
    ON edit_sessions FOR DELETE
    USING (user_id = auth.uid());

-- Enable RLS on edit_operations
ALTER TABLE edit_operations ENABLE ROW LEVEL SECURITY;

-- Users can only view operations in their own sessions
CREATE POLICY "Users can view own edit operations"
    ON edit_operations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM edit_sessions
            WHERE edit_sessions.id = edit_operations.session_id
            AND edit_sessions.user_id = auth.uid()
        )
    );

-- Users can only create operations in their own sessions
CREATE POLICY "Users can create own edit operations"
    ON edit_operations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM edit_sessions
            WHERE edit_sessions.id = edit_operations.session_id
            AND edit_sessions.user_id = auth.uid()
        )
    );

-- Users can only update operations in their own sessions
CREATE POLICY "Users can update own edit operations"
    ON edit_operations FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM edit_sessions
            WHERE edit_sessions.id = edit_operations.session_id
            AND edit_sessions.user_id = auth.uid()
        )
    );

-- Users can only delete operations in their own sessions
CREATE POLICY "Users can delete own edit operations"
    ON edit_operations FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM edit_sessions
            WHERE edit_sessions.id = edit_operations.session_id
            AND edit_sessions.user_id = auth.uid()
        )
    );

-- ============================================================
-- CLEANUP FUNCTION
-- ============================================================
-- Function to abandon stale sessions (>24h old active sessions)

CREATE OR REPLACE FUNCTION cleanup_stale_edit_sessions()
RETURNS INTEGER AS $$
DECLARE
    abandoned_count INTEGER;
BEGIN
    UPDATE edit_sessions
    SET status = 'abandoned', updated_at = NOW()
    WHERE status = 'active'
    AND updated_at < NOW() - INTERVAL '24 hours';

    GET DIAGNOSTICS abandoned_count = ROW_COUNT;
    RETURN abandoned_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- END MIGRATION
-- ============================================================
