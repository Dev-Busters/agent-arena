-- Agent Arena Database Schema
-- PostgreSQL

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  level INT DEFAULT 1 CHECK (level >= 1),
  experience INT DEFAULT 0 CHECK (experience >= 0),
  wins INT DEFAULT 0 CHECK (wins >= 0),
  losses INT DEFAULT 0 CHECK (losses >= 0),
  gold INT DEFAULT 1000 CHECK (gold >= 0),
  rating INT DEFAULT 1000,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Create index on email and username for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_rating ON users(rating DESC);

-- OAuth accounts (Google, Discord, etc.)
CREATE TABLE IF NOT EXISTS user_oauth_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'google', 'discord'
  provider_id VARCHAR(255) NOT NULL, -- External user ID
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider, provider_id)
);

CREATE INDEX IF NOT EXISTS idx_oauth_user_id ON user_oauth_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_provider ON user_oauth_accounts(provider, provider_id);

-- Agent classes enum
CREATE TYPE agent_class AS ENUM ('warrior', 'mage', 'rogue', 'paladin');

-- Agents table
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  class agent_class NOT NULL,
  level INT DEFAULT 1 CHECK (level >= 1),
  experience INT DEFAULT 0 CHECK (experience >= 0),
  max_hp INT NOT NULL,
  current_hp INT NOT NULL,
  attack INT NOT NULL,
  defense INT NOT NULL,
  speed INT NOT NULL,
  accuracy INT NOT NULL,
  evasion INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  UNIQUE(user_id) -- One active agent per user at a time (can expand later)
);

CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_class ON agents(class);

-- Item rarity enum
CREATE TYPE item_rarity AS ENUM ('common', 'uncommon', 'rare', 'epic', 'legendary');
CREATE TYPE item_type AS ENUM ('weapon', 'armor', 'accessory', 'consumable');
CREATE TYPE equipment_slot AS ENUM ('weapon', 'armor', 'accessory');

-- Items table
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  type item_type NOT NULL,
  rarity item_rarity DEFAULT 'common',
  stats JSONB DEFAULT '{}'::jsonb, -- { attack: 10, defense: 5, ... }
  price INT DEFAULT 0 CHECK (price >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_stats CHECK (
    (type = 'weapon' AND stats->'attack' IS NOT NULL) OR
    (type = 'armor' AND stats->'defense' IS NOT NULL) OR
    (type = 'accessory') OR
    (type = 'consumable')
  )
);

CREATE INDEX IF NOT EXISTS idx_items_type ON items(type);
CREATE INDEX IF NOT EXISTS idx_items_rarity ON items(rarity);

-- Equipment table (what agents have equipped)
CREATE TABLE IF NOT EXISTS equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  slot equipment_slot NOT NULL,
  item_id UUID NOT NULL REFERENCES items(id),
  equipped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(agent_id, slot) -- One item per slot per agent
);

CREATE INDEX IF NOT EXISTS idx_equipment_agent_id ON equipment(agent_id);

-- Battle status enum
CREATE TYPE battle_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- Battles table
CREATE TABLE IF NOT EXISTS battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent1_id UUID NOT NULL REFERENCES agents(id),
  agent2_id UUID NOT NULL REFERENCES agents(id),
  winner_id UUID REFERENCES agents(id),
  loser_id UUID REFERENCES agents(id),
  battle_log JSONB DEFAULT '[]'::jsonb, -- Array of turn events
  duration_ms INT CHECK (duration_ms >= 0),
  experience_awarded INT DEFAULT 0,
  gold_awarded INT DEFAULT 0,
  rating_change INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  status battle_status DEFAULT 'pending',
  CHECK (agent1_id != agent2_id)
);

CREATE INDEX IF NOT EXISTS idx_battles_agent1_id ON battles(agent1_id);
CREATE INDEX IF NOT EXISTS idx_battles_agent2_id ON battles(agent2_id);
CREATE INDEX IF NOT EXISTS idx_battles_created_at ON battles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_battles_status ON battles(status);

-- Leaderboard materialized view (refreshed periodically)
CREATE TABLE IF NOT EXISTS leaderboard (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  username VARCHAR(50) NOT NULL,
  rating INT NOT NULL,
  wins INT NOT NULL,
  losses INT NOT NULL,
  win_rate DECIMAL(5, 2),
  rank INT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON leaderboard(rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rating ON leaderboard(rating DESC);

-- Game sessions (active player connections)
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  socket_id VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'in_battle', 'idle'
  connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  disconnected_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_socket_id ON game_sessions(socket_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_connected_at ON game_sessions(connected_at DESC);

-- Queue table (matchmaking)
CREATE TABLE IF NOT EXISTS matchmaking_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id),
  rating INT NOT NULL,
  queued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  matched_at TIMESTAMP,
  UNIQUE(user_id) -- Only one queue entry per user
);

CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_rating ON matchmaking_queue(rating);
CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_queued_at ON matchmaking_queue(queued_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust as needed for your Supabase setup)
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ===== ROGUELIKE DUNGEON SYSTEM =====

-- Dungeon difficulty enum
CREATE TYPE dungeon_difficulty AS ENUM ('easy', 'normal', 'hard', 'nightmare');

-- Dungeons table (persistent dungeon instances)
CREATE TABLE IF NOT EXISTS dungeons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  difficulty dungeon_difficulty DEFAULT 'normal',
  seed INT NOT NULL,
  depth INT DEFAULT 1,
  max_depth INT DEFAULT 1,
  gold_collected INT DEFAULT 0,
  experience_earned INT DEFAULT 0,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  abandoned_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dungeons_user_id ON dungeons(user_id);
CREATE INDEX IF NOT EXISTS idx_dungeons_agent_id ON dungeons(agent_id);
CREATE INDEX IF NOT EXISTS idx_dungeons_difficulty ON dungeons(difficulty);

-- Dungeon encounters (enemies in a specific room)
CREATE TABLE IF NOT EXISTS encounters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dungeon_id UUID NOT NULL REFERENCES dungeons(id) ON DELETE CASCADE,
  room_id INT NOT NULL,
  enemy_type VARCHAR(50) NOT NULL,
  enemy_level INT DEFAULT 1,
  enemy_hp INT NOT NULL,
  enemy_max_hp INT NOT NULL,
  enemy_attack INT NOT NULL,
  enemy_defense INT NOT NULL,
  enemy_speed INT NOT NULL,
  enemy_loot_table JSONB DEFAULT '{}',
  encountered_at TIMESTAMP,
  defeated_at TIMESTAMP,
  victory BOOLEAN,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_encounters_dungeon_id ON encounters(dungeon_id);
CREATE INDEX IF NOT EXISTS idx_encounters_room_id ON encounters(room_id);

-- Loot drops (items found in dungeons)
CREATE TABLE IF NOT EXISTS loot_drops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dungeon_id UUID NOT NULL REFERENCES dungeons(id) ON DELETE CASCADE,
  encounter_id UUID REFERENCES encounters(id) ON DELETE SET NULL,
  item_id UUID REFERENCES items(id),
  gold INT DEFAULT 0,
  experience INT DEFAULT 0,
  found_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  collected BOOLEAN DEFAULT FALSE,
  collected_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_loot_drops_dungeon_id ON loot_drops(dungeon_id);
CREATE INDEX IF NOT EXISTS idx_loot_drops_encounter_id ON loot_drops(encounter_id);

-- Dungeon progress (map data, visited rooms, etc.)
CREATE TABLE IF NOT EXISTS dungeon_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dungeon_id UUID NOT NULL REFERENCES dungeons(id) ON DELETE CASCADE UNIQUE,
  map_data JSONB NOT NULL DEFAULT '{}',
  current_room_id INT DEFAULT 1,
  visited_rooms INT[] DEFAULT ARRAY[]::INT[],
  discovered_rooms INT[] DEFAULT ARRAY[]::INT[],
  player_x INT DEFAULT 0,
  player_y INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dungeon_progress_dungeon_id ON dungeon_progress(dungeon_id);

-- Trigger for dungeon_progress updated_at
CREATE TRIGGER update_dungeon_progress_updated_at BEFORE UPDATE ON dungeon_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for dungeons updated_at
CREATE TRIGGER update_dungeons_updated_at BEFORE UPDATE ON dungeons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== CRAFTING SYSTEM =====

-- Material inventory
CREATE TABLE IF NOT EXISTS material_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  material_id VARCHAR(100) NOT NULL,
  quantity INT DEFAULT 1 CHECK (quantity >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(agent_id, material_id)
);

CREATE INDEX IF NOT EXISTS idx_material_inventory_agent_id ON material_inventory(agent_id);

-- Crafted gear inventory
CREATE TABLE IF NOT EXISTS crafted_gear (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slot VARCHAR(50) NOT NULL, -- 'weapon', 'armor', 'accessory'
  base_rarity VARCHAR(50) NOT NULL,
  affixes JSONB DEFAULT '[]'::jsonb, -- Array of affix objects
  total_stats JSONB DEFAULT '{}'::jsonb, -- { attack: 10, defense: 5, ... }
  visual_effect VARCHAR(100),
  equipped BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_crafted_gear_agent_id ON crafted_gear(agent_id);
CREATE INDEX IF NOT EXISTS idx_crafted_gear_slot ON crafted_gear(slot);
CREATE INDEX IF NOT EXISTS idx_crafted_gear_equipped ON crafted_gear(equipped);

-- Crafting recipes discovered
CREATE TABLE IF NOT EXISTS crafting_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_name VARCHAR(255) NOT NULL,
  gear_slot VARCHAR(50) NOT NULL,
  target_rarity VARCHAR(50) NOT NULL,
  materials JSONB NOT NULL, -- [{ materialId: string, quantity: int }, ...]
  discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, recipe_name)
);

CREATE INDEX IF NOT EXISTS idx_crafting_recipes_user_id ON crafting_recipes(user_id);

-- Trigger for material_inventory updated_at
CREATE TRIGGER update_material_inventory_updated_at BEFORE UPDATE ON material_inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== CRUCIBLE RUNS SYSTEM =====

-- Runs table (Crucible PvE run tracking)
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

-- Agent Crucible stats table
ALTER TABLE agents 
  ADD COLUMN IF NOT EXISTS doctrine TEXT CHECK (doctrine IN ('iron', 'arc', 'edge')),
  ADD COLUMN IF NOT EXISTS doctrine_xp_iron INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS doctrine_xp_arc INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS doctrine_xp_edge INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS doctrine_lvl_iron INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS doctrine_lvl_arc INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS doctrine_lvl_edge INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gold INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ash INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ember INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS arena_marks INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS frag_iron INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS frag_arc INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS frag_edge INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_kills INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_runs INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deepest_floor INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS equipped_abilities JSONB NOT NULL DEFAULT '{"Q":null,"E":null,"R":null,"F":null}',
  ADD COLUMN IF NOT EXISTS doctrine_invested JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS shrine_ranks JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ability_ranks JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS respec_shards JSONB NOT NULL DEFAULT '{"iron":0,"arc":0,"edge":0,"prismatic":0}',
  ADD COLUMN IF NOT EXISTS unlocked_abilities JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS unlocked_blueprints JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS material_stacks JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS max_depth INT NOT NULL DEFAULT 1;

-- Indexes for Crucible queries
CREATE INDEX IF NOT EXISTS idx_agents_doctrine ON agents(doctrine);
CREATE INDEX IF NOT EXISTS idx_agents_deepest_floor ON agents(deepest_floor DESC);
CREATE INDEX IF NOT EXISTS idx_agents_total_kills ON agents(total_kills DESC);

-- Trigger for agents updated_at
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
