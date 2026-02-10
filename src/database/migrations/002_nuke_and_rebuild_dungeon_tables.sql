-- Aggressive fix: Drop and rebuild dungeon tables completely
-- This ensures no old bad constraints remain

-- Drop dependent tables first (in reverse order of dependencies)
DROP TABLE IF EXISTS dungeon_progress CASCADE;
DROP TABLE IF EXISTS loot_drops CASCADE;
DROP TABLE IF EXISTS encounters CASCADE;
DROP TABLE IF EXISTS dungeons CASCADE;

-- Recreate enum (idempotent with DO block)
DO $$ BEGIN
  CREATE TYPE dungeon_difficulty AS ENUM ('easy', 'normal', 'hard', 'nightmare');
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- Recreate dungeons table with NO problematic constraints
CREATE TABLE dungeons (
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

CREATE INDEX idx_dungeons_user_id ON dungeons(user_id);
CREATE INDEX idx_dungeons_agent_id ON dungeons(agent_id);
CREATE INDEX idx_dungeons_difficulty ON dungeons(difficulty);

-- Recreate encounters table
CREATE TABLE encounters (
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

CREATE INDEX idx_encounters_dungeon_id ON encounters(dungeon_id);
CREATE INDEX idx_encounters_room_id ON encounters(room_id);

-- Recreate loot_drops table
CREATE TABLE loot_drops (
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

CREATE INDEX idx_loot_drops_dungeon_id ON loot_drops(dungeon_id);
CREATE INDEX idx_loot_drops_encounter_id ON loot_drops(encounter_id);

-- Recreate dungeon_progress table
CREATE TABLE dungeon_progress (
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

CREATE INDEX idx_dungeon_progress_dungeon_id ON dungeon_progress(dungeon_id);

-- Recreate triggers
DROP TRIGGER IF EXISTS update_dungeon_progress_updated_at ON dungeon_progress;
DROP TRIGGER IF EXISTS update_dungeons_updated_at ON dungeons;

CREATE TRIGGER update_dungeon_progress_updated_at BEFORE UPDATE ON dungeon_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dungeons_updated_at BEFORE UPDATE ON dungeons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Log successful migration
DO $$
BEGIN
  RAISE NOTICE 'Dungeon tables rebuilt successfully - all bad constraints removed';
END $$;
