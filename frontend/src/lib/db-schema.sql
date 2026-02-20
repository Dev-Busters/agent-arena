-- Agent Arena — Database Schema (Supabase / PostgreSQL)
-- Managed by Railway backend at: https://backend-production-6816.up.railway.app

-- ── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  level         INT NOT NULL DEFAULT 1,
  account_xp    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Agents ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agents (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL DEFAULT 'Agent',
  doctrine         TEXT CHECK (doctrine IN ('iron','arc','edge')),
  -- Doctrine XP & levels
  doctrine_xp_iron   INT NOT NULL DEFAULT 0,
  doctrine_xp_arc    INT NOT NULL DEFAULT 0,
  doctrine_xp_edge   INT NOT NULL DEFAULT 0,
  doctrine_lvl_iron  INT NOT NULL DEFAULT 0,
  doctrine_lvl_arc   INT NOT NULL DEFAULT 0,
  doctrine_lvl_edge  INT NOT NULL DEFAULT 0,
  -- Currencies
  gold          INT NOT NULL DEFAULT 0,
  ash           INT NOT NULL DEFAULT 0,
  ember         INT NOT NULL DEFAULT 0,
  arena_marks   INT NOT NULL DEFAULT 0,
  frag_iron     INT NOT NULL DEFAULT 0,
  frag_arc      INT NOT NULL DEFAULT 0,
  frag_edge     INT NOT NULL DEFAULT 0,
  -- Lifetime stats
  total_kills   INT NOT NULL DEFAULT 0,
  total_runs    INT NOT NULL DEFAULT 0,
  deepest_floor INT NOT NULL DEFAULT 0,
  -- Serialized JSON blobs (complex state)
  equipped_abilities  JSONB NOT NULL DEFAULT '{"Q":null,"E":null,"R":null,"F":null}',
  doctrine_invested   JSONB NOT NULL DEFAULT '{}',
  shrine_ranks        JSONB NOT NULL DEFAULT '{}',
  ability_ranks       JSONB NOT NULL DEFAULT '{}',
  respec_shards       JSONB NOT NULL DEFAULT '{"iron":0,"arc":0,"edge":0,"prismatic":0}',
  unlocked_abilities  JSONB NOT NULL DEFAULT '[]',
  unlocked_blueprints JSONB NOT NULL DEFAULT '[]',
  material_stacks     JSONB NOT NULL DEFAULT '[]',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX agents_user_id_idx ON agents(user_id);

-- ── Equipment ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS equipment (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id    UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  gear_data   JSONB NOT NULL DEFAULT '{}', -- { weapon, armor, helm, boots, accessory1, accessory2 }
  inventory   JSONB NOT NULL DEFAULT '[]', -- GearItem[]
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX equipment_agent_id_uidx ON equipment(agent_id);

-- ── Runs ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS runs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doctrine          TEXT,
  floors_cleared    INT  NOT NULL DEFAULT 0,
  kills             INT  NOT NULL DEFAULT 0,
  time_seconds      INT  NOT NULL DEFAULT 0,
  ash_earned        INT  NOT NULL DEFAULT 0,
  ember_earned      INT  NOT NULL DEFAULT 0,
  arena_marks_earned INT NOT NULL DEFAULT 0,
  outcome           TEXT NOT NULL DEFAULT 'fallen' CHECK (outcome IN ('fallen','escaped')),
  modifiers         JSONB NOT NULL DEFAULT '[]',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX runs_user_id_idx        ON runs(user_id);
CREATE INDEX runs_floors_cleared_idx ON runs(floors_cleared DESC);

-- ── Leaderboard view ──────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW leaderboard AS
  SELECT
    ROW_NUMBER() OVER (ORDER BY a.deepest_floor DESC, a.total_kills DESC) AS rank,
    u.id         AS user_id,
    u.username,
    a.name       AS agent_name,
    a.doctrine,
    a.deepest_floor,
    a.total_kills,
    a.total_runs,
    jsonb_build_object(
      'iron',  a.doctrine_lvl_iron,
      'arc',   a.doctrine_lvl_arc,
      'edge',  a.doctrine_lvl_edge
    )            AS doctrine_level
  FROM agents a
  JOIN users  u ON a.user_id = u.id
  ORDER BY a.deepest_floor DESC, a.total_kills DESC
  LIMIT 50;
