-- Migration: Add leaderboard tracking columns
-- Adds max_depth and total_gold to agents table for leaderboard categories

-- Add max_depth column to track deepest dungeon floor reached
ALTER TABLE agents ADD COLUMN IF NOT EXISTS max_depth INT DEFAULT 1;

-- Add total_gold column to track lifetime gold earned
ALTER TABLE agents ADD COLUMN IF NOT EXISTS total_gold BIGINT DEFAULT 0;

-- Create indexes for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_agents_max_depth ON agents(max_depth DESC);
CREATE INDEX IF NOT EXISTS idx_agents_total_gold ON agents(total_gold DESC);

-- Update leaderboard table to ensure proper structure
ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS wins INT DEFAULT 0;
ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS losses INT DEFAULT 0;

-- Create index on wins for leaderboard sorting
CREATE INDEX IF NOT EXISTS idx_leaderboard_wins ON leaderboard(wins DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rating ON leaderboard(rating DESC);

-- Add username to leaderboard for faster queries (denormalized)
ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS username VARCHAR(50);

-- Update existing leaderboard entries with usernames
UPDATE leaderboard l
SET username = u.username
FROM users u
WHERE l.user_id = u.id AND l.username IS NULL;

COMMENT ON COLUMN agents.max_depth IS 'Deepest dungeon floor reached by this agent';
COMMENT ON COLUMN agents.total_gold IS 'Total gold earned by this agent (lifetime)';
