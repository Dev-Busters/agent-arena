-- Fix dungeon_difficulty enum and constraints
-- This migration ensures the enum exists and the constraints are correct

-- Check if the enum exists, if not create it
DO $$ BEGIN
  CREATE TYPE dungeon_difficulty AS ENUM ('easy', 'normal', 'hard', 'nightmare');
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- Drop the dungeons table if it exists with wrong constraints
DROP TABLE IF EXISTS dungeon_progress CASCADE;
DROP TABLE IF EXISTS encounters CASCADE;
DROP TABLE IF EXISTS loot_drops CASCADE;
DROP TABLE IF EXISTS dungeons CASCADE;

-- Recreate dungeons table with proper constraints
CREATE TABLE IF NOT EXISTS dungeons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  difficulty dungeon_difficulty DEFAULT 'normal',
  seed INT NOT NULL CHECK (seed >= 0),
  depth INT DEFAULT 1 CHECK (depth >= 1 AND depth <= 10),
  max_depth INT DEFAULT 1 CHECK (max_depth >= 1 AND max_depth >= depth),
  gold_collected INT DEFAULT 0 CHECK (gold_collected >= 0),
  experience_earned INT DEFAULT 0 CHECK (experience_earned >= 0),
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  abandoned_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dungeons_user_id ON dungeons(user_id);
CREATE INDEX IF NOT EXISTS idx_dungeons_agent_id ON dungeons(agent_id);
CREATE INDEX IF NOT EXISTS idx_dungeons_difficulty ON dungeons(difficulty);

-- Recreate encounters table
CREATE TABLE IF NOT EXISTS encounters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dungeon_id UUID NOT NULL REFERENCES dungeons(id) ON DELETE CASCADE,
  room_id INT NOT NULL CHECK (room_id >= 0),
  enemy_type VARCHAR(50) NOT NULL,
  enemy_level INT DEFAULT 1 CHECK (enemy_level >= 1),
  enemy_hp INT NOT NULL CHECK (enemy_hp > 0),
  enemy_max_hp INT NOT NULL CHECK (enemy_max_hp > 0),
  enemy_attack INT NOT NULL CHECK (enemy_attack >= 0),
  enemy_defense INT NOT NULL CHECK (enemy_defense >= 0),
  enemy_speed INT NOT NULL CHECK (enemy_speed >= 0),
  enemy_loot_table JSONB DEFAULT '{}',
  encountered_at TIMESTAMP,
  defeated_at TIMESTAMP,
  victory BOOLEAN,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_encounters_dungeon_id ON encounters(dungeon_id);
CREATE INDEX IF NOT EXISTS idx_encounters_room_id ON encounters(room_id);

-- Recreate loot_drops table
CREATE TABLE IF NOT EXISTS loot_drops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dungeon_id UUID NOT NULL REFERENCES dungeons(id) ON DELETE CASCADE,
  encounter_id UUID REFERENCES encounters(id) ON DELETE SET NULL,
  item_id UUID REFERENCES items(id),
  gold INT DEFAULT 0 CHECK (gold >= 0),
  experience INT DEFAULT 0 CHECK (experience >= 0),
  found_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  collected BOOLEAN DEFAULT FALSE,
  collected_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_loot_drops_dungeon_id ON loot_drops(dungeon_id);
CREATE INDEX IF NOT EXISTS idx_loot_drops_encounter_id ON loot_drops(encounter_id);

-- Recreate dungeon_progress table
CREATE TABLE IF NOT EXISTS dungeon_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dungeon_id UUID NOT NULL REFERENCES dungeons(id) ON DELETE CASCADE UNIQUE,
  map_data JSONB NOT NULL DEFAULT '{}',
  current_room_id INT DEFAULT 1 CHECK (current_room_id >= 0),
  visited_rooms INT[] DEFAULT ARRAY[]::INT[],
  discovered_rooms INT[] DEFAULT ARRAY[]::INT[],
  player_x INT DEFAULT 0,
  player_y INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dungeon_progress_dungeon_id ON dungeon_progress(dungeon_id);

-- Recreate triggers
CREATE TRIGGER update_dungeon_progress_updated_at BEFORE UPDATE ON dungeon_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dungeons_updated_at BEFORE UPDATE ON dungeons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
