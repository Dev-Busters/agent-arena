-- Migration: Create runs table for Crucible PvE tracking
-- Phase J: Run submission and leaderboard data

CREATE TABLE IF NOT EXISTS runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doctrine TEXT CHECK (doctrine IN ('iron', 'arc', 'edge')),
  floors_cleared INT NOT NULL DEFAULT 0,
  kills INT NOT NULL DEFAULT 0,
  time_seconds INT NOT NULL DEFAULT 0,
  ash_earned INT NOT NULL DEFAULT 0,
  ember_earned INT NOT NULL DEFAULT 0,
  arena_marks_earned INT NOT NULL DEFAULT 0,
  outcome TEXT NOT NULL DEFAULT 'fallen' CHECK (outcome IN ('fallen', 'escaped')),
  modifiers JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_runs_user_id ON runs(user_id);
CREATE INDEX IF NOT EXISTS idx_runs_floors_cleared ON runs(floors_cleared DESC);
CREATE INDEX IF NOT EXISTS idx_runs_created_at ON runs(created_at DESC);

COMMENT ON TABLE runs IS 'Crucible PvE run records for leaderboard and history';
