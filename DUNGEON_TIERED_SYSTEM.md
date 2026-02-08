# Tiered Dungeon System - Architecture & Design

## Overview
The dungeon has been refactored from a **difficulty-selection model** to a **tiered progression system** where players start at Floor 1 and progressively push deeper, with auto-scaling difficulty and dynamic branching paths leading to special zones.

---

## Core Mechanics

### Auto-Scaling Difficulty
Difficulty is **automatically determined by floor**, eliminating upfront selection:
- **Floors 1-3:** Easy (0.7x multiplier)
- **Floors 4-6:** Normal (1.0x multiplier)
- **Floors 7-9:** Hard (1.3x multiplier)
- **Floors 10+:** Nightmare (1.6x multiplier)

### Progression Model
1. **Start at Floor 1** → Auto-easy difficulty
2. **Clear rooms** → Standard dungeon exploration
3. **Defeat floor boss** → Progress to next floor
4. **Floor 5+ Branching** → Paths diverge at floor 5+
5. **Choose a special zone** → Alternative high-difficulty/high-reward challenges
6. **Floor 10+** → Ultimate depths (nightmare tier)

---

## Branching Paths System

### When Do Paths Appear?
- **Floor 5+:** After clearing all rooms on a floor, players see **2-3 branching paths**
- Each path leads to a **special zone** with unique enemies, loot, and rarity boosts

### Special Zone Types (6 types)

| Zone Type | Gold Mult | XP Mult | Rarity Mult | Description |
|-----------|-----------|---------|-------------|-------------|
| **Boss Chamber** | 1.8x | 2.0x | 1.5x | Powerful boss with epic rewards |
| **Treasure Vault** | 2.5x | 1.5x | 2.0x | Legendary materials and equipment |
| **Cursed Hall** | 1.6x | 1.8x | 1.4x | Cursed enemies with unique drops |
| **Dragon Lair** | 2.0x | 2.2x | 1.8x | Dragon-type enemies, legendary gear |
| **Arcane Sanctum** | 1.5x | 1.9x | 1.7x | Magical essences and artifacts |
| **Shadow Den** | 1.7x | 1.7x | 1.6x | Shadows hide secrets and rare resources |

### Path Selection UI
When a floor is cleared at Floor 5+:
- Player sees 2-3 path options with zone names, descriptions, and bonuses
- Each path has a **rarity boost** (e.g., +30%, +60%, +100%)
- Zone difficulty is slightly higher than the floor's base difficulty
- Player chooses which path to take (or rejects and continues to next floor normally)

---

## Loot & Rewards

### Standard Floor Loot
```
baseGold = 100 * floor
baseXp = 200 * floor
```

### Special Zone Bonuses Applied
When in a special zone:
```
finalGold = baseGold * zone.goldMult
finalXp = baseXp * zone.xpMult
finalRarity = zone.rarityMult  // Affects crafting gear generation
```

Example: **Floor 5, Treasure Vault**
- Base: 500 gold, 1000 XP
- After vault bonus: 1250 gold, 1500 XP
- +100% rarity boost for crafting

---

## Backend Architecture

### Key Changes to `dungeon.ts`

**New Types:**
```typescript
export type SpecialZoneType = 
  | "boss_chamber" 
  | "treasure_vault" 
  | "cursed_hall" 
  | "dragon_lair" 
  | "arcane_sanctum" 
  | "shadow_den";

export interface BranchingPath {
  pathId: string;
  floor: number;
  description: string;
  zoneType: SpecialZoneType;
  difficulty: DungeonDifficulty;
  rarityBoost: number;  // 1.2x - 2.0x
}
```

**New Functions:**
```typescript
// Get difficulty tier for a floor
getDifficultyForFloor(floor: number): DungeonDifficulty

// Generate 2-3 branching paths for deeper floors
generateBranchingPaths(floor: number, seed: number): BranchingPath[]

// Get zone reward multipliers
getSpecialZoneBonus(zoneType: SpecialZoneType): 
  { goldMult, xpMult, rarityMult }
```

### Socket.io Events

#### Removed
- ❌ `start_dungeon` payload no longer requires `difficulty`

#### Modified
- `start_dungeon` → Emits `dungeon_started` with auto-calculated floor 1 difficulty
- `next_floor` → Emits `floor_changed` with optional `branchingPaths` array

#### New
- `choose_path` → Payload: `{ dungeonId, pathId, zoneType }`
  - Emits `path_chosen` with zone bonuses and map
- Encounter win events now include `zoneBonus` data

### DungeonSession Interface
```typescript
interface DungeonSession {
  dungeonId: string;
  userId: string;
  agentId: string;
  depth: number;  // Current floor
  currentRoomId: number;
  playerHp: number;
  playerMaxHp: number;
  inEncounter: boolean;
  currentEnemies: any[];
  specialZone?: SpecialZoneType;  // Active zone
  specialZoneBonus?: {
    goldMult: number;
    xpMult: number;
    rarityMult: number;
  };
}
```

---

## Frontend Changes

### DungeonStart.tsx
- **Removed:** Difficulty selector UI
- **Added:** Explanation of auto-scaling and branching paths
- **Simplified:** Single "Descend into Depths" button

### DungeonExploration.tsx
- **New State:** `branchingPaths`, `currentFloor`
- **New Handlers:** `handleChoosePath()` emits `choose_path` event
- **New Socket Listeners:**
  - `floor_changed` → Updates map and shows branching paths
  - `path_chosen` → Enters special zone
- **New UI:** Branching paths selection modal with zone details

### Flow
```
Start → Floor 1 (Easy) → Clear Rooms → 
  ↓
  Floors 2-4: Standard progression
  ↓
  Floor 5+: Branching paths appear
    ├─ Choose Path A (Treasure Vault) → High rarity bonus
    ├─ Choose Path B (Boss Chamber) → High XP/Gold bonus
    └─ Continue to next floor normally
  ↓
  Floor 10: Dungeon complete 🏆
```

---

## Design Philosophy

### Why This Change?
1. **Better Progression Feel:** Players feel a continuous journey downward
2. **Replayability:** Same dungeon, different paths each run
3. **Choice Matters:** Players strategically choose zones for specific rewards
4. **Emergent Difficulty:** Difficulty scaling creates natural challenge curves
5. **Cosmetics Ready:** Special zones can reward exclusive cosmetics

### Balancing Considerations
- **Zone difficulties** are slightly higher to justify the +X% rarity/reward
- **No dead runs:** Even if you skip zones, you always progress
- **Meaningful choices:** Each zone offers different reward types
  - Treasure Vault = Gear/Materials
  - Boss Chamber = XP/Gold
  - Dragon Lair = Legendary drops

---

## Future Enhancements

- [ ] **Seasonal mutations:** Special events modify zone properties
- [ ] **Seed sharing:** Players share dungeon seeds with friends
- [ ] **Leaderboards:** Track deepest floor + fastest clear times
- [ ] **Boss patterns:** Each zone has unique boss mechanics
- [ ] **Environmental hazards:** Zones have traps/debuffs
- [ ] **Cosmetic rewards:** Zone-specific cosmetics for each special zone

---

## Testing Checklist

- ✅ Backend builds with new types and socket handlers
- ✅ Frontend builds with new UI components
- ✅ `getDifficultyForFloor()` correctly maps floors → difficulties
- ✅ `generateBranchingPaths()` creates valid path options
- ✅ Socket events emit correct data structure
- ✅ Branching paths appear at floor 5+
- ✅ Zone bonuses apply to loot calculations
- ✅ Difficulty scaling affects enemy stats correctly

---

**Status:** ✅ Fully implemented and building  
**Architecture:** Backend 100% ready, Frontend UI complete  
**Next Steps:** Run game balance simulations with Opus to tune zone reward curves
