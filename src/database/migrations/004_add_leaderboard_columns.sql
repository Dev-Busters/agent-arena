-- Migration: Add leaderboard tracking columns
-- Note: deepest_floor already exists in agents table (from schema)
-- This migration adds indexes for performance

-- Create indexes for leaderboard queries on existing columns
CREATE INDEX IF NOT EXISTS idx_agents_deepest_floor ON agents(deepest_floor DESC);
CREATE INDEX IF NOT EXISTS idx_agents_total_kills ON agents(total_kills DESC);

COMMENT ON COLUMN agents.deepest_floor IS 'Deepest dungeon floor reached by this agent';
COMMENT ON COLUMN agents.total_kills IS 'Total enemies killed by this agent';
