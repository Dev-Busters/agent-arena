# Agent Arena — Development Roadmap

> **Source of Truth**: This roadmap implements the vision defined in `GAME_DESIGN_BIBLE.md`. Read that document first to understand WHAT we're building. This document defines HOW to build it, in what order, and why.
>
> **Golden Rules** (these made Phases A-C succeed):
> - One system per commit
> - No planning documents in repo
> - No self-certifying completion — describe expected result, human verifies
> - Read files before modifying them
> - Files under 300 lines, tasks under 500 lines total
> - Working > Complete

---

## CURRENT STATE (After Phases A-C)

✅ **What exists and works:**
- PixiJS canvas rendering at `/arena`
- Tiled floor, wall boundaries
- Player entity with WASD movement + camera follow
- Enemy entities with chase AI
- Attack system (SPACE to attack)
- Health bars above entities
- React HUD overlay (HP/MP bars, skill buttons)
- Particle effects (hit, death)
- Sound effects (synthesized Web Audio)

**Before continuing:** Verify all of the above actually works. Run `npm run dev` in frontend, open `/arena`, play for 30 seconds. If anything is broken, fix it first.

---

## THE BUILD STRATEGY

The Game Design Bible describes a complex game with many interconnected systems. We can't build it all at once. The strategy:

### Phase D: **The Core Loop** (Crucible foundation)
Build the minimal viable Crucible: rooms → enemies → room clear → next room. No modifiers yet, no path choices, just the combat loop that works.

### Phase E: **The Crucible Identity** (what makes it unique)
Add the Hades-style modifier system, path choices between floors, and adaptive Trial floors. This is where the game starts feeling like ITSELF.

### Phase F: **The Doctrine System** (permanent build depth)
Implement Combat Schools, Disciplines, and Tenets. This gives players long-term progression goals and build variety.

### Phase G: **Equipment & Crafting** (permanent power)
Full equipment system with rarity tiers, stats, special properties, and the crafting system.

### Phase H: **Product Infrastructure** (make it real)
UI pages (War Room, Armory, Hall of Champions), backend integration, auth, persistence.

### Phase I: **The Arena** (PvP mode)
Direct agent-vs-agent combat with ELO matchmaking.

### Phase J: **Polish & Launch Prep**
Visual polish, boss encounters, deeper balancing, marketing assets.

---

## PHASE D — THE CORE LOOP

**Goal**: Build the fundamental Crucible experience — clear rooms, advance through floors, die when HP reaches 0.

### D1: Room-Based Structure

**What to build:**
- Replace the single continuous arena with a room-based system
- Room = bounded area (like current arena)
- Room clear condition: all enemies dead
- After clear: brief pause, show "ROOM CLEAR" overlay
- Spawn next room (can reuse same canvas, just reset entity positions)

**Implementation:**
```typescript
// Game state in Zustand
interface CrucibleState {
  floor: number;
  roomsCompleted: number;
  roomsThisFloor: number;
  currentRoom: Room;
  runActive: boolean;
}

// Room definition
interface Room {
  id: string;
  enemyWaves: EnemySpawn[];
  cleared: boolean;
}

// After all enemies dead:
// 1. Show "ROOM CLEAR" (React overlay, 2s)
// 2. Spawn next room OR show floor complete
```

**Expected result:**
- Kill all enemies → "ROOM CLEAR" appears
- 2 seconds later → new enemies spawn in the same space
- After 3 rooms → "FLOOR 1 COMPLETE" message
- Floor counter in HUD shows current floor

**Files to modify:**
- `ArenaCanvas.tsx` (room management logic)
- `gameStore.ts` (add Crucible state)
- New: `Room.ts` (room generation, enemy spawn definitions)

**Constraints:**
- One commit
- Under 400 lines total changes
- Test: complete 3 rooms, verify progression

---

### D2: Floor Advancement

**What to build:**
- After completing all rooms on a floor, player advances to next floor
- Floor number increments
- Brief transition screen: "DESCENDING TO FLOOR 2" (1-2s)
- Enemy difficulty scales with floor number (HP +10% per floor, damage +5%)
- Rooms per floor increases: floors 1-5 = 3 rooms, 6-10 = 4 rooms, 11+ = 5 rooms

**Implementation:**
```typescript
function generateFloor(floorNum: number): Floor {
  return {
    number: floorNum,
    rooms: generateRooms(getRoomCount(floorNum)),
    enemyScaling: {
      hpMultiplier: 1 + (floorNum * 0.1),
      damageMultiplier: 1 + (floorNum * 0.05)
    }
  };
}
```

**Expected result:**
- Complete 3 rooms → "DESCENDING TO FLOOR 2" transition
- Floor 2 starts with fresh rooms
- Enemies noticeably tankier on floor 2
- Floor number in HUD updates

**Files to modify:**
- `Room.ts` (floor generation)
- `Enemy.ts` (apply scaling multipliers)
- `GameHUD.tsx` (floor transition overlay)

**Constraints:**
- One commit
- Under 300 lines
- Test: reach floor 3, verify scaling

---

### D3: Death and Run End

**What to build:**
- When player HP reaches 0, the run ends
- Show "FALLEN" screen (React overlay, full screen)
- Display run stats: floors reached, rooms completed, enemies killed, time
- "Return to War Room" button
- Run stats logged to console (will persist to DB in Phase H)

**Implementation:**
```typescript
// In game loop, when player dies:
useGameStore.setState({
  runActive: false,
  runEndReason: 'death',
  runStats: {
    floorsReached: floor,
    roomsCompleted: totalRooms,
    enemiesKilled: killCount,
    timeSeconds: runTime
  }
});

// React overlay shows these stats
```

**Expected result:**
- HP reaches 0 → game loop pauses
- "FALLEN" overlay appears with stats
- Click "Return to War Room" → navigate to `/dashboard` (even if it's just a placeholder page)

**Files to modify:**
- `ArenaCanvas.tsx` (death detection)
- `gameStore.ts` (run stats)
- New: `RunEndScreen.tsx` (death overlay)

**Constraints:**
- One commit
- Under 250 lines
- Test: die on floor 2, verify stats shown

---

### D4: Enemy Variety (Combat Schools Preview)

**What to build:**
- 3 distinct enemy archetypes (preview of future Combat Schools):
  - **Charger** (Vanguard-like): Red, chases aggressively, melee attacks, high HP
  - **Ranger** (Invoker-like): Purple, maintains distance, ranged attacks, medium HP
  - **Dasher** (Phantom-like): Green, fast movement, teleports short distances, low HP
- Spawn mixed groups (not all the same type)
- Each type has unique movement AI and attack pattern

**Implementation:**
```typescript
type EnemyArchetype = 'charger' | 'ranger' | 'dasher';

const ARCHETYPES: Record<EnemyArchetype, EnemyConfig> = {
  charger: {
    color: 0xff4444,
    radius: 16,
    speed: 80,
    hp: 100,
    damage: 15,
    attackRange: 50,
    aiType: 'chase'
  },
  ranger: {
    color: 0xa855f7,
    radius: 12,
    speed: 60,
    hp: 60,
    damage: 10,
    attackRange: 200,
    aiType: 'kite'
  },
  dasher: {
    color: 0x22c55e,
    radius: 10,
    speed: 120,
    hp: 40,
    damage: 12,
    attackRange: 60,
    aiType: 'teleport'
  }
};
```

**Expected result:**
- Rooms spawn mix of 3 enemy types
- Red enemies chase you aggressively
- Purple enemies keep distance and shoot projectiles
- Green enemies teleport around you
- Visual distinction is clear

**Files to modify:**
- `Enemy.ts` (archetype system, kiting AI, teleport AI)
- `Room.ts` (mixed spawn composition)

**Constraints:**
- One commit
- Under 400 lines
- Test: fight mixed groups, verify each type behaves differently

---

### D5: Player Active Abilities (4 hotkeys)

**What to build:**
- 4 active abilities mapped to Q/E/R/F (or 1/2/3/4)
- Each ability has a cooldown timer
- Abilities are **manual triggers** — player presses key, ability fires immediately
- Start with 4 basic abilities (these will be replaced by Discipline abilities in Phase F):
  - **Q: Dash** — Quick movement burst in facing direction (3s CD)
  - **E: Area Blast** — Damage all enemies in 100px radius (6s CD)
  - **R: Projectile** — Fire a skillshot projectile (5s CD)
  - **F: Heal** — Restore 30% max HP (12s CD)

**Implementation:**
```typescript
// Player class
class Player {
  abilities = {
    dash: { cooldown: 3000, lastUsed: 0, key: 'q' },
    blast: { cooldown: 6000, lastUsed: 0, key: 'e' },
    projectile: { cooldown: 5000, lastUsed: 0, key: 'r' },
    heal: { cooldown: 12000, lastUsed: 0, key: 'f' }
  };

  useAbility(abilityName: string) {
    const ability = this.abilities[abilityName];
    const now = Date.now();
    if (now - ability.lastUsed < ability.cooldown) return; // on cooldown
    
    ability.lastUsed = now;
    this.executeAbility(abilityName);
  }
}

// In game loop, listen for Q/E/R/F keypresses
```

**Expected result:**
- Press Q → player dashes forward quickly
- Press E → yellow explosion appears, damages nearby enemies
- Press R → orange projectile fires toward mouse cursor
- Press F → green heal effect, HP bar refills
- Abilities show cooldown overlays on HUD buttons (gray fill that shrinks)

**Files to modify:**
- `Player.ts` (ability system)
- `ArenaCanvas.tsx` (keypress handling)
- `GameHUD.tsx` (ability button cooldown overlays)
- `Particles.ts` (ability visual effects)

**Constraints:**
- One commit
- Under 500 lines
- Test: use each ability, verify cooldowns work

---

**✅ Phase D Complete When:**
- [ ] You can play a Crucible run for 5+ minutes
- [ ] Rooms clear → advance → new room spawns
- [ ] Floors increment with difficulty scaling
- [ ] 3 enemy types with distinct behaviors
- [ ] 4 active abilities work with cooldowns
- [ ] Death ends the run and shows stats
- [ ] The core loop feels fun and responsive

---

## PHASE E — THE CRUCIBLE IDENTITY

**Goal**: Add the systems that make this feel like the Crucible from the Bible — modifier selection, path choices, and adaptive difficulty.

### E1: Modifier Selection (Hades-style power-ups)

**What to build:**
- After each room clear, show a choice of 3 modifiers
- Modifiers are temporary buffs that last for the run
- Start with 12 simple modifiers (expand later):
  - **Amplifiers**: "Abilities deal +20% damage", "Cooldowns reduced 15%", "Movement speed +15%"
  - **Triggers**: "On kill: heal 5% max HP", "On ability use: 10% chance to reset cooldown", "On dodge: leave damaging afterimage"
  - **Transmuters**: "Abilities leave burning ground", "Projectiles pierce 1 enemy", "Dash has 2 charges"
- Chosen modifier is added to a list, effects stack
- Modifier selection UI: 3 cards side-by-side, click to choose, brief card flip animation

**Implementation:**
```typescript
interface Modifier {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic';
  effect: ModifierEffect;
}

// After room clear:
const options = getRandomModifiers(3, currentFloor);
showModifierChoice(options);
// Player clicks one
addModifier(chosenModifier);
// Effects apply immediately
```

**Expected result:**
- Clear room → pause → 3 modifier cards appear
- Each card shows icon, name, description
- Click one → card flips, effect activates
- Tooltip in HUD shows active modifiers
- Effects are noticeable (e.g., reduced cooldowns actually work)

**Files to modify:**
- `gameStore.ts` (active modifiers list)
- New: `Modifier.ts` (modifier definitions, effect application)
- New: `ModifierChoice.tsx` (React UI for selection)
- `Player.ts` (apply modifier effects)

**Constraints:**
- One commit
- Under 500 lines
- Test: collect 5 modifiers in a run, verify they stack

---

### E2: Path Choices Between Floors

**What to build:**
- After completing a floor, player chooses next floor type from 2-3 options:
  - **Combat Floor** — Standard rooms (3-5 rooms)
  - **Elite Floor** — 2 rooms with tougher enemies, better modifier options
  - **Treasure Floor** — 1 room, no enemies, guaranteed Epic modifier
  - **Rest Floor** — Heal 40% max HP, no rewards
  - **Shop Floor** — Spend gold on specific modifiers or consumables (gold drops from enemies)
- Path choice UI: 2-3 cards showing floor type, rewards preview, risk level
- Some paths are only available at certain floors (e.g., Treasure unlocks at floor 5+)

**Implementation:**
```typescript
function getAvailablePaths(floorNum: number): FloorPath[] {
  const paths = [
    { type: 'combat', label: 'Combat Chambers', rooms: 4 },
    { type: 'elite', label: 'Elite Trial', rooms: 2, enemyMultiplier: 1.5 }
  ];
  
  if (floorNum >= 5) paths.push({ type: 'treasure', label: 'Vault', rooms: 1 });
  if (floorNum >= 3) paths.push({ type: 'rest', label: 'Sanctuary', rooms: 0 });
  
  return shuffle(paths).slice(0, 3); // show 3 random options
}
```

**Expected result:**
- Complete floor → "Choose Your Path" screen
- 3 cards show different floor types
- Click one → brief transition → that floor type starts
- Elite floors have noticeably harder enemies
- Treasure floor shows Epic modifier choice
- Rest floor heals you (no combat)

**Files to modify:**
- `Room.ts` (floor type generation)
- New: `PathChoice.tsx` (path selection UI)
- `gameStore.ts` (floor path state)

**Constraints:**
- One commit
- Under 400 lines
- Test: reach floor 3, choose different paths, verify they work

---

### E3: Gold Currency and Crucible Shop

**What to build:**
- Enemies drop gold on death (small gold coin sprites)
- Gold auto-collects when player walks over it
- Gold total shown in HUD
- Shop floor allows spending gold on:
  - Specific modifiers (more expensive than random choices)
  - Health potion (restore 50% HP for 30 gold)
  - Reroll next modifier choice (20 gold)
- Gold does NOT persist after run ends (run-specific currency)

**Implementation:**
```typescript
// On enemy death:
dropGold(enemy.position, enemy.goldValue);

// Shop UI:
const shopItems = [
  { type: 'modifier', id: 'cooldown_20', cost: 50 },
  { type: 'modifier', id: 'damage_25', cost: 60 },
  { type: 'consumable', id: 'health_potion', cost: 30 },
  { type: 'service', id: 'reroll', cost: 20 }
];
```

**Expected result:**
- Kill enemy → gold coin drops
- Walk over coin → "+5 gold" floats up, gold counter increases
- Enter shop floor → grid of items with costs
- Click item → if enough gold, purchase and apply
- Gold total decreases

**Files to modify:**
- `Enemy.ts` (gold drop on death)
- `gameStore.ts` (gold currency)
- New: `ShopFloor.tsx` (shop UI)
- `GameHUD.tsx` (gold counter)

**Constraints:**
- One commit
- Under 350 lines
- Test: collect gold, buy items in shop

---

### E4: Trial Floors (Adaptive Difficulty)

**What to build:**
- Every 5th floor (5, 10, 15, 20...) is a Trial floor
- Trial analyzes player's behavior from previous floors:
  - Track: average distance from enemies, ability usage frequency, damage taken per room
  - Generate counter-composition: if player kites, spawn fast chasers; if player facetanks, spawn ranged enemies; if player spams abilities, spawn high-HP enemies
- Trial floor is harder than normal but gives better rewards (Epic modifier choice)
- "TRIAL FLOOR V" announcement before it starts

**Implementation:**
```typescript
// Track player behavior
interface BehaviorProfile {
  avgDistanceFromEnemies: number;
  abilityUsageRate: number;
  damagePerRoom: number;
}

function generateTrialFloor(profile: BehaviorProfile): Room {
  if (profile.avgDistanceFromEnemies > 150) {
    // Player kites → spawn dashers and chargers
    return createRoom({ dashers: 6, chargers: 3 });
  } else if (profile.abilityUsageRate > 0.5) {
    // Player spams abilities → spawn high-HP rangers
    return createRoom({ rangers: 8, hpMultiplier: 2 });
  }
  // etc.
}
```

**Expected result:**
- Reach floor 5 → "TRIAL FLOOR V" announcement (dramatic font, 2s)
- Enemy composition counters your playstyle
- Trial feels noticeably harder
- After clear → Epic modifier choice (purple rarity border)

**Files to modify:**
- `gameStore.ts` (behavior tracking)
- `Room.ts` (Trial generation logic)
- New: `TrialFloor.ts` (adaptive composition)

**Constraints:**
- One commit
- Under 400 lines
- Test: play through floor 5 Trial, verify it adapts

---

### E5: Boss Encounters (Every 10th Floor)

**What to build:**
- Floors 10, 20, 30... spawn a boss instead of normal rooms
- Boss = single large enemy with 10x normal HP, unique appearance, telegraphed attacks
- Start with 1 boss type: "The Warden" (large red circle, 3 attack patterns):
  - **Charge**: Locks onto player, charges in a straight line (dodge to the side)
  - **Slam**: Pounds ground, AoE damage in 150px radius (run away)
  - **Summon**: Spawns 3 small adds (kill adds first)
- Boss health bar appears at top of screen
- Defeating boss grants a **Boss Modifier** (unique, powerful, only found here)

**Implementation:**
```typescript
class Boss extends Enemy {
  attackPattern = 0;
  attackTimer = 0;

  update(delta: number) {
    this.attackTimer += delta;
    if (this.attackTimer > 5000) {
      this.useAttack(this.attackPattern);
      this.attackPattern = (this.attackPattern + 1) % 3;
      this.attackTimer = 0;
    }
  }

  useAttack(pattern: number) {
    if (pattern === 0) this.charge();
    else if (pattern === 1) this.slam();
    else this.summon();
  }
}
```

**Expected result:**
- Reach floor 10 → "BOSS: THE WARDEN" announcement
- Giant red enemy appears, boss health bar at top
- Boss cycles through 3 attacks every 5 seconds
- Telegraphs (visual warnings) appear before attacks
- After defeating boss → unique Boss Modifier choice

**Files to modify:**
- New: `Boss.ts` (boss class with attack patterns)
- `Room.ts` (boss floor generation)
- `GameHUD.tsx` (boss health bar)

**Constraints:**
- One commit
- Under 500 lines (boss is a big feature)
- Test: reach floor 10, fight and defeat boss

---

**✅ Phase E Complete When:**
- [ ] Modifier system works (choose 3 cards, effects stack)
- [ ] Path choices work (Combat/Elite/Treasure/Rest/Shop)
- [ ] Gold currency works (drop, collect, spend)
- [ ] Trial floors adapt to your playstyle
- [ ] Boss fight on floor 10 is epic and rewarding
- [ ] Runs feel varied (different paths = different experiences)

---

## PHASE F — THE DOCTRINE SYSTEM

**Goal**: Implement the permanent build depth — Combat Schools, Disciplines, and Tenets.

### F1: Combat School Selection (Agent Creation)

**What to build:**
- Before entering the Crucible, player chooses a Combat School:
  - **Vanguard** (melee tank)
  - **Invoker** (ranged caster)
  - **Phantom** (agile striker)
- For MVP, implement these 3 (Warden and Artificer in Phase J)
- School determines:
  - Base ability kit (replaces the 4 generic abilities from Phase D)
  - Agent sprite appearance (color-coded)
  - Default AI behavior bias (how aggressive/cautious the AI acts)
- School choice is permanent per agent (create new agent for different School)

**Implementation:**
```typescript
interface CombatSchool {
  id: 'vanguard' | 'invoker' | 'phantom';
  name: string;
  description: string;
  baseAbilities: Ability[];
  spriteTint: number;
  aiProfile: AIBehavior;
}

const SCHOOLS: Record<string, CombatSchool> = {
  vanguard: {
    id: 'vanguard',
    name: 'Vanguard',
    description: 'Front-line fighter. Close range. High survivability.',
    baseAbilities: [
      { id: 'heavy_strike', name: 'Heavy Strike', cooldown: 4000, ... },
      { id: 'bulwark', name: 'Bulwark', cooldown: 8000, ... },
      // etc.
    ],
    spriteTint: 0xff4444, // red
    aiProfile: { aggression: 0.8, preferredRange: 60 }
  },
  // invoker, phantom...
};
```

**Expected result:**
- At agent creation (or before first run), show School selection screen
- 3 cards: Vanguard, Invoker, Phantom
- Click one → agent's abilities change to that School's kit
- Agent sprite color changes
- Enter Crucible → abilities on hotbar match chosen School

**Files to modify:**
- New: `SchoolSelection.tsx` (School picker UI)
- `Player.ts` (load School-specific abilities)
- `gameStore.ts` (selected School state)

**Constraints:**
- One commit
- Under 350 lines
- Test: select Vanguard, verify abilities changed

---

### F2: Discipline System (2 Equipable Specializations)

**What to build:**
- Each School has 3-4 Disciplines (specialized ability trees)
- Player equips 2 Disciplines (chosen before entering Crucible)
- Disciplines modify base abilities and unlock new ones
- For MVP, implement 2 Disciplines per School (expand in Phase J)

**Example — Vanguard Disciplines:**
- **Juggernaut** (sustain tank): Heavy Strike heals for 5% max HP, Bulwark lasts 2s longer
- **Berserker** (damage): Heavy Strike deals 30% more damage, new ability "Rage" (damage buff at low HP)

**Implementation:**
```typescript
interface Discipline {
  id: string;
  schoolId: string;
  name: string;
  abilityModifications: AbilityMod[];
  newAbilities: Ability[];
}

// Player equips 2 Disciplines
// On run start, apply all modifications
function applyDisciplines(school: CombatSchool, disciplines: Discipline[]) {
  let abilities = [...school.baseAbilities];
  disciplines.forEach(disc => {
    abilities = applyMods(abilities, disc.abilityModifications);
    abilities.push(...disc.newAbilities);
  });
  return abilities;
}
```

**Expected result:**
- Before Crucible, show Discipline selection screen (choose 2)
- Enter Crucible → abilities reflect Discipline modifications
- Example: Vanguard with Juggernaut → Heavy Strike now heals on hit

**Files to modify:**
- New: `Discipline.ts` (Discipline definitions)
- New: `DisciplineSelection.tsx` (UI)
- `Player.ts` (apply Disciplines to abilities)

**Constraints:**
- One commit
- Under 400 lines
- Test: equip 2 Disciplines, verify abilities changed

---

### F3: Tenet System (Passive AI Behavior Modifiers)

**What to build:**
- Tenets are passive effects that modify AI behavior AND grant bonuses
- Player equips 4 Tenets (unlocked via progression)
- Start with 8 Tenets (expand later):
  - **Strike the Wounded**: AI targets low-HP enemies, +15% damage to <30% HP enemies
  - **Chaos Doctrine**: AI movement more erratic, +25% crit chance
  - **Ghost Protocol**: AI keeps distance, +30% ranged damage, -20% melee damage
  - **Blood Price**: Abilities cost HP instead of cooldowns
  - **Echoing Strikes**: Every 3rd ability repeats at 50% power
  - **Glass Cannon**: -40% max HP, +60% all damage
  - **Adaptive Plating**: After taking damage type, gain 20% resistance for 10s
  - **Improvise**: AI can combine abilities creatively (flag for future AI integration)

**Implementation:**
```typescript
interface Tenet {
  id: string;
  name: string;
  description: string;
  aiModifications: AIBehaviorMod[];
  passiveEffects: PassiveEffect[];
}

// Tenets modify:
// 1. AI targeting logic (e.g., "Strike the Wounded" changes target priority)
// 2. Stats (e.g., "Glass Cannon" modifies HP and damage multipliers)
// 3. Ability mechanics (e.g., "Echoing Strikes" adds repeat logic)
```

**Expected result:**
- Before Crucible, show Tenet selection (choose 4 from unlocked pool)
- Enter Crucible → Tenet effects active
- Example: "Glass Cannon" → max HP bar shows lower total, damage numbers are larger
- Example: "Strike the Wounded" → AI visibly targets hurt enemies first

**Files to modify:**
- New: `Tenet.ts` (Tenet definitions)
- New: `TenetSelection.tsx` (UI)
- `Player.ts` (apply Tenet effects)
- `Enemy.ts` (AI targeting modifications)

**Constraints:**
- One commit
- Under 450 lines
- Test: equip "Glass Cannon", verify HP drops and damage increases

---

**✅ Phase F Complete When:**
- [ ] 3 Combat Schools implemented with unique ability kits
- [ ] Discipline selection works (2 slots, modifies abilities)
- [ ] Tenet selection works (4 slots, affects stats and AI)
- [ ] Different build combinations feel distinct
- [ ] The permanent build depth is obvious and exciting

---

## PHASE G — EQUIPMENT & CRAFTING

**Goal**: Full equipment system with rarity, stats, and crafting.

### G1: Equipment Slots and Base Stats

**What to build:**
- 6 equipment slots: Weapon, Armor, Helm, Boots, Accessory 1, Accessory 2
- Equipment grants base stats: Might, Arcana, Fortitude, Agility, Vitality
- Equipment has rarity: Common (gray), Uncommon (green), Rare (blue), Epic (purple), Legendary (orange)
- Higher rarity = more total stat points + special properties (Phase G2)
- Equipment screen shows agent paper doll with 6 slots

**Implementation:**
```typescript
interface Equipment {
  id: string;
  name: string;
  slot: 'weapon' | 'armor' | 'helm' | 'boots' | 'accessory';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  stats: {
    might?: number;
    arcana?: number;
    fortitude?: number;
    agility?: number;
    vitality?: number;
  };
  specialProperties?: Property[];
}

// Total stats = base agent stats + equipped gear stats
```

**Expected result:**
- Armory page shows 6 equipment slots
- Click slot → shows equipped item (if any) with stats
- Total stats displayed (base + equipment bonuses)
- Rarity shown via colored border

**Files to modify:**
- New: `Equipment.ts` (equipment definitions)
- New: `Armory.tsx` (equipment UI)
- `gameStore.ts` (equipped items state)
- `Player.ts` (calculate total stats from equipment)

**Constraints:**
- One commit
- Under 400 lines
- Test: equip items, verify stats update

---

### G2: Equipment Drops and Inventory

**What to build:**
- Enemies drop equipment (chance based on floor depth)
- Floor 1-5: 10% chance, Common/Uncommon only
- Floor 6-15: 20% chance, up to Rare
- Floor 16+: 30% chance, up to Epic
- Bosses: guaranteed Epic or Legendary
- Dropped equipment appears as glowing item on ground
- Walk over to auto-collect into inventory
- Inventory screen shows all owned equipment in a grid

**Implementation:**
```typescript
function rollEquipmentDrop(floor: number): Equipment | null {
  const dropChance = Math.min(0.1 + (floor * 0.02), 0.3);
  if (Math.random() > dropChance) return null;

  const rarityWeights = getRarityWeights(floor);
  const rarity = weightedRandom(rarityWeights);
  
  return generateEquipment(rarity, floor);
}
```

**Expected result:**
- Kill enemy → sometimes a glowing item drops
- Walk over item → "Epic Blade of Frost" pickup message
- Open inventory → item appears in grid
- Click item → equip or view stats

**Files to modify:**
- `Enemy.ts` (equipment drop on death)
- New: `Inventory.tsx` (inventory UI)
- `gameStore.ts` (inventory state)

**Constraints:**
- One commit
- Under 350 lines
- Test: collect drops, view in inventory, equip

---

### G3: Crafting System (Materials → Equipment)

**What to build:**
- Materials drop from enemies (separate from equipment drops)
- Material types: Iron Ore, Flame Essence, Frost Essence, Storm Essence
- Crafting UI: select recipe (e.g., "Craft Rare Weapon"), add materials, craft
- Crafted item has randomized stats within recipe's range
- Recipes unlock via progression

**Implementation:**
```typescript
interface Recipe {
  id: string;
  name: string;
  slot: EquipmentSlot;
  rarity: Rarity;
  requiredMaterials: { material: Material, amount: number }[];
  statRanges: { might: [min, max], arcana: [min, max], ... };
}

function craft(recipe: Recipe, materials: Material[]): Equipment {
  if (!hasRequiredMaterials(materials, recipe.requiredMaterials)) return null;
  
  const stats = {};
  for (const [stat, range] of Object.entries(recipe.statRanges)) {
    stats[stat] = randomInt(range[0], range[1]);
  }
  
  return createEquipment(recipe.slot, recipe.rarity, stats);
}
```

**Expected result:**
- Collect materials from enemy drops
- Open Armory → Crafting tab
- Select recipe → shows required materials
- Craft → random stats generated, item added to inventory

**Files to modify:**
- New: `Crafting.tsx` (crafting UI)
- New: `Material.ts` (material definitions)
- `Enemy.ts` (material drops)

**Constraints:**
- One commit
- Under 400 lines
- Test: collect materials, craft item

---

### G4: Modifier Extraction (Run → Permanent)

**What to build:**
- After a run ends (death or extraction), small chance (5-10%) to extract 1 modifier
- Extracted modifier becomes a **Crystallized Modifier** (crafting material)
- Can be used to enchant equipment with permanent modifier effect (at reduced power)
- Example: "Cooldown -20%" (run modifier) → "Cooldown -10%" (permanent enchantment)
- Enchanting costs gold (persistent currency, not run-specific)

**Implementation:**
```typescript
// On run end:
function rollModifierExtraction(collectedModifiers: Modifier[]): Modifier | null {
  if (Math.random() > 0.08) return null; // 8% chance
  return randomChoice(collectedModifiers);
}

// In Armory:
function enchantEquipment(item: Equipment, crystalMod: Modifier) {
  item.enchantment = {
    modifierId: crystalMod.id,
    effect: crystalMod.effect,
    power: 0.5 // 50% of original power
  };
}
```

**Expected result:**
- After run → "Modifier Extracted!" message
- View inventory → Crystallized Modifiers section
- Select equipment → "Enchant" option
- Apply crystal → equipment gains permanent modifier effect

**Files to modify:**
- `RunEndScreen.tsx` (extraction roll)
- `Armory.tsx` (enchanting UI)
- `Equipment.ts` (enchantment slot)

**Constraints:**
- One commit
- Under 300 lines
- Test: extract modifier, enchant equipment

---

**✅ Phase G Complete When:**
- [ ] Equipment system works (6 slots, stats, rarity)
- [ ] Equipment drops from enemies
- [ ] Inventory management works
- [ ] Crafting works (materials → equipment)
- [ ] Modifier extraction works (rare run modifiers → permanent enchants)
- [ ] Players have long-term gear progression goals

---

## PHASE H — PRODUCT INFRASTRUCTURE

**Goal**: Make it a real web app with persistence, auth, and proper UI.

### H1: Navigation and Page Structure

**What to build:**
- Persistent sidebar nav (War Room, Armory, Hall of Champions, The Crucible)
- Dark theme consistent with Visual Design Bible
- Active route highlighted (gold accent)
- Routes:
  - `/` → War Room (dashboard, agent overview)
  - `/armory` → Equipment, crafting, Doctrine selection
  - `/leaderboard` → Hall of Champions (Crucible depth rankings)
  - `/crucible` → The game (current `/arena`)

**Files to modify:**
- New: `Layout.tsx` (nav wrapper)
- New: `Sidebar.tsx` (nav component)
- Rename `/arena` → `/crucible`

**Constraints:**
- One commit
- Under 250 lines
- Test: nav between pages, verify styling

---

### H2: War Room (Dashboard Page)

**What to build:**
- Agent overview card: name, level, Combat School icon, stats (Might, Arcana, etc.)
- Recent runs: list of last 5 Crucible attempts (floor reached, time, modifiers collected)
- Quick actions: "Enter the Crucible", "Visit the Armory"
- All data from Zustand (mock for now, real in H5)

**Files to modify:**
- New: `WarRoom.tsx` (dashboard page)

**Constraints:**
- One commit
- Under 300 lines
- Test: view dashboard, stats displayed

---

### H3: Authentication (NextAuth + GitHub OAuth)

**What to build:**
- NextAuth.js setup with GitHub provider
- Login/Logout in sidebar
- Protected routes (require login to access)
- Session management

**Files to modify:**
- New: `/api/auth/[...nextauth].ts`
- `Layout.tsx` (SessionProvider wrapper)
- Sidebar (login/logout buttons)

**Constraints:**
- One commit
- Under 200 lines
- Test: OAuth flow, session persists

---

### H4: Database Schema (Supabase)

**What to build:**
- Supabase tables:
  - `users` (id, email, username, created_at)
  - `agents` (id, user_id, name, school, level, xp, disciplines[], tenets[], created_at)
  - `equipment` (id, agent_id, slot, rarity, stats, enchantment, created_at)
  - `materials` (id, user_id, material_type, quantity)
  - `runs` (id, agent_id, floor_reached, modifiers[], stats, created_at)

**Constraints:**
- One commit
- SQL schema only
- Test: tables created in Supabase

---

### H5: Backend Integration (API Routes)

**What to build:**
- API routes for CRUD operations:
  - `GET /api/agents` → fetch user's agents
  - `POST /api/agents` → create new agent
  - `PATCH /api/agents/:id` → update agent (level, xp, Doctrine)
  - `GET /api/equipment` → fetch agent's equipment
  - `POST /api/equipment/equip` → equip item
  - `POST /api/runs/complete` → save run results
  - `GET /api/runs/history` → fetch recent runs
  - `GET /api/leaderboard` → top Crucible depths

**Constraints:**
- Multiple commits (one per API group)
- Under 400 lines per commit
- Test: create agent via API, fetch data

---

### H6: Leaderboard (Hall of Champions)

**What to build:**
- Top 50 Crucible depths, sorted by floor reached
- Podium for top 3 (center layout, #1 larger and elevated)
- Each entry shows: rank, agent name, school icon, floor reached, modifiers used
- Visual design per Visual Design Bible (gold accents, torch-lit aesthetic)

**Files to modify:**
- New: `Leaderboard.tsx`
- API: `GET /api/leaderboard`

**Constraints:**
- One commit
- Under 350 lines
- Test: view leaderboard, verify styling

---

**✅ Phase H Complete When:**
- [ ] All pages navigable with sidebar
- [ ] Auth works (GitHub OAuth)
- [ ] Database persists all data
- [ ] API routes work
- [ ] Leaderboard shows real data
- [ ] War Room shows agent stats
- [ ] The product feels like a real web app

---

## PHASE I — THE ARENA (PVP MODE)

**Goal**: Direct agent-vs-agent combat with ELO matchmaking.

### I1: Arena Combat (1v1 Real-Time)

**What to build:**
- Same combat engine as Crucible, but opponent is another player's agent (AI-controlled)
- Both players issue commands simultaneously
- Best-of-3 rounds
- No in-run modifiers (permanent build only)
- Winner determined by HP remaining

**Constraints:**
- One commit
- Under 500 lines
- Test: fight against a mock opponent AI

---

### I2: Matchmaking and ELO

**What to build:**
- Matchmaking queue (find opponent based on ELO rating)
- ELO calculation (winner gains, loser drops)
- Match history tracking
- Separate leaderboard for Arena ELO

**Constraints:**
- One commit
- Under 400 lines
- Test: queue, match, gain/lose ELO

---

**✅ Phase I Complete When:**
- [ ] Arena 1v1 works
- [ ] Matchmaking finds opponents
- [ ] ELO system works
- [ ] Arena leaderboard separate from Crucible

---

## PHASE J — POLISH & LAUNCH PREP

**Goal**: Make it feel premium and ready to ship.

### J1: Visual Polish Pass

**What to build:**
- Apply all 10 fixes from `VISUAL_POLISH_PASS.md`
- Atmospheric background gradients
- Card styling (warm glows, no wireframe borders)
- Typography hierarchy (display font for titles, monospace for numbers)
- Agent class icons (bold filled shapes)
- Stat boxes with themed tints
- Warm color accents (gold, not blue)

**Constraints:**
- Follow Visual Polish Pass doc exactly
- 10 commits (one per fix)
- Test: compare before/after screenshots

---

### J2: Sound and Music

**What to build:**
- Background music (looping ambient track)
- Enhanced sound effects (ability casts, critical hits, boss attacks)
- Volume controls in settings

**Constraints:**
- One commit
- Under 200 lines
- Test: volume controls work

---

### J3: Remaining Combat Schools

**What to build:**
- Warden (counter-attack specialist)
- Artificer (summoner/trapper)
- Additional Disciplines for all Schools (expand to 4 per School)

**Constraints:**
- Multiple commits
- Test: each School feels distinct

---

### J4: Additional Bosses

**What to build:**
- 3 total boss types (currently have 1)
- Each with unique mechanics
- Boss rotation every 10 floors

**Constraints:**
- Multiple commits
- Test: each boss feels epic

---

### J5: Landing Page

**What to build:**
- Dramatic hero section
- Feature showcase
- CTA button ("Enter the Crucible")
- Apply Visual Design Bible styling

**Constraints:**
- One commit
- Under 300 lines
- Test: first impression is impressive

---

**✅ Phase J Complete When:**
- [ ] Visual quality matches design bible
- [ ] Sound/music enhances experience
- [ ] All 5 Combat Schools implemented
- [ ] Multiple boss types
- [ ] Landing page sells the game
- [ ] Ready to show publicly

---

## SUCCESS CRITERIA

### After Phase D:
The core loop works. You can play the Crucible, clear rooms, advance floors, and die.

### After Phase E:
It feels like the Crucible. Modifiers create build variety, path choices matter, Trials and Bosses are epic moments.

### After Phase F:
Permanent build depth exists. Different Schools/Disciplines/Tenets create genuinely different playstyles.

### After Phase G:
Long-term progression hooks work. Equipment and crafting give players goals beyond "reach floor 30."

### After Phase H:
It's a real product. Auth, persistence, leaderboards, and polished UI.

### After Phase I:
PvP works. The Arena adds competitive depth.

### After Phase J:
It looks and feels premium. Ready to launch.

---

## DEVELOPMENT PRINCIPLES

1. **Build for the vision** — Every task implements something from the Game Design Bible
2. **Playtest constantly** — After every commit, play the game for 5 minutes
3. **One system at a time** — No "build everything and integrate later"
4. **Working > Perfect** — Ship incremental improvements
5. **Read before writing** — Always check existing code first
6. **Describe expectations** — Say what you expect to see, not "task complete"

---

*This roadmap builds Agent Arena as described in the Game Design Bible. Follow it sequentially. Each phase unlocks the next. The game will feel incomplete until Phase E, then it will feel unique.*
