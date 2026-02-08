-- Emergency fix for missing leaderboard columns
ALTER TABLE agents ADD COLUMN IF NOT EXISTS max_depth INT DEFAULT 1;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS total_gold BIGINT DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_agents_max_depth ON agents(max_depth DESC);
CREATE INDEX IF NOT EXISTS idx_agents_total_gold ON agents(total_gold DESC);
