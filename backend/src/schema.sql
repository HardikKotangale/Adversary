-- Adversary debates table.
-- Applied by `npm run migrate` (see src/migrate.ts). Idempotent.

CREATE TABLE IF NOT EXISTS debates (
  id             UUID PRIMARY KEY,
  pitch          TEXT NOT NULL,
  extra_roles    JSONB NOT NULL DEFAULT '[]',
  round1         JSONB NOT NULL DEFAULT '[]',
  round2         JSONB NOT NULL DEFAULT '[]',
  verdict        JSONB,
  transcript_url TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS debates_created_at_idx ON debates (created_at DESC);
