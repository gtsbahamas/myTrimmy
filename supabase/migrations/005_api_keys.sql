-- API Keys table for programmatic access
-- Enables users to create API keys to access myTrimmy services

CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Key identification
  name TEXT NOT NULL,                    -- User-provided name ("Production", "Dev")
  key_prefix TEXT NOT NULL,              -- First 8 chars for display (mt_live_)
  key_suffix TEXT NOT NULL,              -- Last 4 chars for identification (...x7Kf)
  key_hash TEXT NOT NULL,                -- SHA-256 hash of full key

  -- Permissions (extensible for future)
  permissions JSONB NOT NULL DEFAULT '["*"]'::jsonb,  -- ["*"] = all, or specific scopes

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,                -- Soft delete - null = active

  -- Constraints
  CONSTRAINT unique_key_hash UNIQUE (key_hash)
);

-- Indexes
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash) WHERE revoked_at IS NULL;

-- RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own API keys"
  ON api_keys FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own API keys"
  ON api_keys FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can revoke own API keys"
  ON api_keys FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own API keys"
  ON api_keys FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
