-- Adversary debates table.
-- Applied by `npm run migrate` (see src/migrate.ts). Idempotent.

CREATE TABLE IF NOT EXISTS debates (
  id                UUID PRIMARY KEY,
  pitch             TEXT NOT NULL,
  turns             JSONB NOT NULL DEFAULT '[]',
  active_persona_ids JSONB NOT NULL DEFAULT '[]',
  verdict           JSONB,
  transcript_url    TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Migration from the earlier fixed-round schema (round1/round2/extra_roles)
-- to the unified turns-based schema used by the Orchestrator-driven engine.
ALTER TABLE debates ADD COLUMN IF NOT EXISTS turns JSONB NOT NULL DEFAULT '[]';
ALTER TABLE debates ADD COLUMN IF NOT EXISTS active_persona_ids JSONB NOT NULL DEFAULT '[]';
ALTER TABLE debates DROP COLUMN IF EXISTS round1;
ALTER TABLE debates DROP COLUMN IF EXISTS round2;
ALTER TABLE debates DROP COLUMN IF EXISTS extra_roles;

CREATE INDEX IF NOT EXISTS debates_created_at_idx ON debates (created_at DESC);
