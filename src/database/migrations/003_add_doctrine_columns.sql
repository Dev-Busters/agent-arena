-- Migration: Add Doctrine system columns to agents table
-- Phase F-J: Doctrine XP, levels, currencies, abilities, gear, shrines

-- Add doctrine selection column
ALTER TABLE agents ADD COLUMN IF NOT EXISTS doctrine TEXT CHECK (doctrine IN ('iron','arc','edge'));

-- Add Doctrine XP & levels
ALTER TABLE agents ADD COLUMN IF NOT EXISTS doctrine_xp_iron INT NOT NULL DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS doctrine_xp_arc INT NOT NULL DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS doctrine_xp_edge INT NOT NULL DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS doctrine_lvl_iron INT NOT NULL DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS doctrine_lvl_arc INT NOT NULL DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS doctrine_lvl_edge INT NOT NULL DEFAULT 0;

-- Add Currencies
ALTER TABLE agents ADD COLUMN IF NOT EXISTS gold INT NOT NULL DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS ash INT NOT NULL DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS ember INT NOT NULL DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS arena_marks INT NOT NULL DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS frag_iron INT NOT NULL DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS frag_arc INT NOT NULL DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS frag_edge INT NOT NULL DEFAULT 0;

-- Add Lifetime stats
ALTER TABLE agents ADD COLUMN IF NOT EXISTS total_kills INT NOT NULL DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS total_runs INT NOT NULL DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS deepest_floor INT NOT NULL DEFAULT 0;

-- Add Serialized JSON blobs
ALTER TABLE agents ADD COLUMN IF NOT EXISTS equipped_abilities JSONB NOT NULL DEFAULT '{"Q":null,"E":null,"R":null,"F":null}';
ALTER TABLE agents ADD COLUMN IF NOT EXISTS doctrine_invested JSONB NOT NULL DEFAULT '{}';
ALTER TABLE agents ADD COLUMN IF NOT EXISTS shrine_ranks JSONB NOT NULL DEFAULT '{}';
ALTER TABLE agents ADD COLUMN IF NOT EXISTS ability_ranks JSONB NOT NULL DEFAULT '{}';
ALTER TABLE agents ADD COLUMN IF NOT EXISTS respec_shards JSONB NOT NULL DEFAULT '{"iron":0,"arc":0,"edge":0,"prismatic":0}';
ALTER TABLE agents ADD COLUMN IF NOT EXISTS unlocked_abilities JSONB NOT NULL DEFAULT '[]';
ALTER TABLE agents ADD COLUMN IF NOT EXISTS unlocked_blueprints JSONB NOT NULL DEFAULT '[]';
ALTER TABLE agents ADD COLUMN IF NOT EXISTS material_stacks JSONB NOT NULL DEFAULT '[]';

-- Add indexes for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_agents_deepest_floor ON agents(deepest_floor DESC);
CREATE INDEX IF NOT EXISTS idx_agents_total_kills ON agents(total_kills DESC);
CREATE INDEX IF NOT EXISTS idx_agents_doctrine ON agents(doctrine);

COMMENT ON COLUMN agents.doctrine IS 'Primary combat doctrine: iron (melee), arc (ranged), edge (speed)';
COMMENT ON COLUMN agents.deepest_floor IS 'Deepest dungeon floor reached in Crucible mode';
