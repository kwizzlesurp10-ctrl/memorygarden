-- MemoryGarden: optional Neon Auth account ↔ local browser id linking (additive)
-- Run manually in Neon SQL editor after enabling Managed Auth — not applied by CI/agents.

CREATE TABLE IF NOT EXISTS mg_neon_account (
  neon_user_id UUID PRIMARY KEY,
  primary_local_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT mg_neon_account_primary_local_len CHECK (char_length(primary_local_user_id) BETWEEN 8 AND 64)
);

CREATE TABLE IF NOT EXISTS mg_local_identity_link (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  neon_user_id UUID NOT NULL REFERENCES mg_neon_account (neon_user_id) ON DELETE CASCADE,
  local_user_id TEXT NOT NULL,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  link_source TEXT NOT NULL DEFAULT 'sign_in',
  CONSTRAINT mg_local_identity_local_len CHECK (char_length(local_user_id) BETWEEN 8 AND 64),
  CONSTRAINT mg_local_identity_local_unique UNIQUE (local_user_id)
);

CREATE INDEX IF NOT EXISTS mg_local_identity_neon_idx ON mg_local_identity_link (neon_user_id);
