# Agent Arena - Design Document

## 1. Overview

Agent Arena is an MMORPG-inspired platform where AI agents (bots) compete against each other. Users create, customize, and level up their agents to climb the leaderboards.

## 2. Core Concepts

### 2.1 Agents
- Each user can create one or more AI agents
- Agents have base stats: HP, Attack, Defense, Speed, Intelligence
- Agents gain XP from battles and level up
- Higher levels unlock new ability slots and stat points

### 2.2 Equipment System
```
Slots:
- Weapon (affects Attack)
- Armor (affects Defense)
- Accessory (special effects)
- Module (AI behavior modifiers)
```

Equipment can be:
- Found (random drops after victories)
- Crafted (using resources)
- Traded (marketplace - future feature)

### 2.3 Battle System

**Turn-based combat:**
1. Speed determines turn order
2. Each turn: Attack, Defend, Use Ability, or Flee
3. AI decides actions based on:
   - Base AI type (aggressive, defensive, balanced)
   - Equipped Module modifiers
   - Current HP/situation

**Battle Outcomes:**
- Winner gains XP + possible loot
- Loser gains reduced XP (participation)
- Ties possible in async battles

### 2.4 Progression

| Level | XP Required | Unlocks |
|-------|-------------|---------|
| 1 | 0 | Basic equipment |
| 5 | 500 | Ability slot 1 |
| 10 | 2000 | Module slot |
| 15 | 5000 | Ability slot 2 |
| 20 | 10000 | Prestige option |

## 3. Technical Architecture

### 3.1 Frontend (React/Next.js)
```
/app
  /dashboard      - Agent overview
  /arena          - Battle interface
  /inventory      - Equipment management
  /leaderboard    - Rankings
  /profile        - User settings
```

### 3.2 Backend API (Node.js)
```
/api
  /agents         - CRUD for agents
  /battles        - Start/resolve battles
  /equipment      - Inventory management
  /users          - Auth & profiles
  /leaderboard    - Rankings
```

### 3.3 Database Schema (PostgreSQL)
```sql
-- Users
users (id, email, username, created_at)

-- Agents
agents (id, user_id, name, level, xp, hp, attack, defense, speed, intel)

-- Equipment
equipment (id, name, slot, rarity, stats_json, description)

-- Agent Equipment (equipped items)
agent_equipment (agent_id, equipment_id, slot)

-- Battles
battles (id, agent1_id, agent2_id, winner_id, battle_log, created_at)

-- Leaderboard (materialized view or computed)
```

## 4. MVP Scope

**Must Have (v0.1):**
- [ ] User registration/login (email or OAuth)
- [ ] Create one agent per user
- [ ] Basic stats (HP, Attack, Defense)
- [ ] Simple 1v1 battles (async)
- [ ] XP gain and leveling (max level 10)
- [ ] Basic leaderboard (by level + wins)

**Nice to Have (v0.2):**
- [ ] Equipment system (weapons only)
- [ ] Real-time battles
- [ ] Battle history/replays
- [ ] Mobile-responsive UI

**Future (v1.0+):**
- [ ] Full equipment system
- [ ] Abilities
- [ ] Guilds
- [ ] Tournaments
- [ ] Agent AI customization

## 5. Cost Analysis (Free Tier Strategy)

| Service | Free Tier | Limits |
|---------|-----------|--------|
| Vercel | Yes | 100GB bandwidth |
| Supabase | Yes | 500MB DB, 2GB storage |
| Railway | Yes | $5 credit/month |
| GitHub | Yes | Unlimited public repos |

**Estimated monthly cost: $0** (within free tiers)

## 6. Development Phases

### Phase 1: Foundation (Week 1-2)
- Set up project structure
- Database schema
- Basic API endpoints
- Auth system

### Phase 2: Core Loop (Week 3-4)
- Agent creation
- Battle system
- XP/Leveling
- Basic UI

### Phase 3: Polish (Week 5-6)
- Leaderboards
- Mobile responsive
- Bug fixes
- Launch prep

---

*Last updated: 2026-02-05*
*Authors: Buster 🔧 & HarroweD*
