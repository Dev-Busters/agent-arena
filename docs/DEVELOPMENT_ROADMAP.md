# Agent Arena — Development Roadmap

> **Source of Truth**: This roadmap implements the vision defined in `GAME_DESIGN_BIBLE.md`. Read that document first to understand WHAT we're building. This document defines HOW to build it, in what order, and why.

> ⚠️ **DIRECTION UPDATE (2026-02-18):** The Crucible is player-controlled PvE. The player directly controls their champion through all dungeon gameplay. AI agent autonomy is reserved exclusively for the PvP Arena (Phase I). All dungeon gameplay is direct player control. This changes no code — only the framing and intent. See GAME_DESIGN_BIBLE.md §1 for full context.

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
PvP Arena — AI-driven agent vs agent battles. **Design phase required before implementation.** Depends on completed Phases G (Equipment) and H (Persistence). Agents built through Crucible progression will battle autonomously using AI-driven decision making. Match format, AI behavior model, and competitive structure are TBD. Do not begin implementation until a dedicated design pass is complete.

### Phase J: **Polish & Launch Prep**
Visual polish, boss encounters, deeper balancing, marketing assets.

---

## PHASE D — THE CORE LOOP

**Goal**: Build the fundamental Crucible experience — clear rooms, advance through floors, die when HP reaches 0.

### D0: Agent Autonomy — The Core Identity

**What to build:**
- Convert player control from direct WASD to autonomous AI movement
- The agent moves on its own: navigates toward enemies, attacks automatically, dodges attacks
- Player CANNOT use WASD to move the agent directly
- Player CAN trigger active abilities (Q/E/R/F) — this is their only direct input during combat
- Start with a simple behavior: agent moves toward nearest enemy, attacks when in range, retreats briefly after taking damage
- The AI behavior should be driven by a simple state machine for now (idle → approach → attack → retreat)
- The LLM integration comes later (Phase F) but the autonomous foundation must exist from the start

**Implementation:**
```typescript
// Agent AI state machine
enum AgentState {
  IDLE,
  APPROACH,
  ATTACK,
  RETREAT
}

class Agent {
  aiState: AgentState = AgentState.IDLE;
  target: Enemy | null = null;
  
  updateAI(delta: number) {
    // Find nearest enemy
    if (!this.target || this.target.dead) {
      this.target = findNearestEnemy(this.position);
    }
    
    switch (this.aiState) {
      case AgentState.IDLE:
        if (this.target) this.aiState = AgentState.APPROACH;
        break;
        
      case AgentState.APPROACH:
        // Move toward target
        this.moveToward(this.target.position);
        if (distanceTo(this.target) < this.attackRange) {
          this.aiState = AgentState.ATTACK;
        }
        break;
        
      case AgentState.ATTACK:
        // Attack target
        if (this.canAttack()) this.performAttack();
        // Retreat if hurt
        if (this.hp < this.lastHp - 20) {
          this.aiState = AgentState.RETREAT;
          this.retreatTimer = 1000; // ms
        }
        break;
        
      case AgentState.RETREAT:
        // Move away from enemies
        this.moveAwayFrom(this.target.position);
        this.retreatTimer -= delta;
        if (this.retreatTimer <= 0) {
          this.aiState = AgentState.APPROACH;
        }
        break;
    }
  }
}

// WASD keypresses are IGNORED in combat
// Only Q/E/R/F trigger abilities
```

**Why this must be first:**
If the agent controls itself from day one, every subsequent system (room clearing, modifiers, Disciplines, Tenets) is built around that dynamic. If you build 5 phases of direct player control and THEN try to make it autonomous, you'll need to rewrite everything.

**Expected result:**
- Enter the Crucible → agent starts moving on its own
- Agent approaches nearest enemy, attacks them automatically
- Agent retreats briefly after taking significant damage
- Player presses Q/E/R/F to trigger abilities — this is the only player input during combat
- The game feels like watching and commanding a fighter, not playing as one
- Camera can still follow the agent, but player has no direct movement control

**Files to modify:**
- `Player.ts` → rename to `Agent.ts` (conceptual shift)
- `Agent.ts` (add AI state machine, remove WASD movement)
- `ArenaCanvas.tsx` (disable WASD movement input, only listen for Q/E/R/F)
- `Enemy.ts` (may need shared AI utilities)

**Constraints:**
- One commit
- Under 400 lines total changes
- Test: enter arena, agent moves autonomously toward enemies and attacks
- No self-certification - describe what the agent does

---

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
- Agent kills all enemies → "ROOM CLEAR" appears
- 2 seconds later → new enemies spawn in the same space
- After 3 rooms → "FLOOR 1 COMPLETE" message
- Floor counter in HUD shows current floor
- Agent continues to move autonomously between rooms

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
- When agent HP reaches 0, the run ends
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
- Red enemies chase the agent aggressively
- Purple enemies keep distance and shoot projectiles at the agent
- Green enemies teleport around the agent
- Visual distinction is clear
- Agent's autonomous AI adapts to different enemy types

**Files to modify:**
- `Enemy.ts` (archetype system, kiting AI, teleport AI)
- `Room.ts` (mixed spawn composition)

**Constraints:**
- One commit
- Under 400 lines
- Test: fight mixed groups, verify each type behaves differently

---

### D5: Commander Abilities (4 hotkeys)

**What to build:**
- 4 active abilities mapped to Q/E/R/F (or 1/2/3/4)
- Each ability has a cooldown timer
- Abilities are **manual triggers** — commander (player) presses key, agent executes ability immediately
- The agent attacks enemies on its own (basic attacks are autonomous from D0)
- Start with 4 basic abilities (these will be replaced by Discipline abilities in Phase F):
  - **Q: Dash** — Agent dashes in its current movement direction (3s CD)
  - **E: Area Blast** — Damage all enemies in 100px radius around agent (6s CD)
  - **R: Projectile** — Agent fires a skillshot projectile toward its current target (5s CD)
  - **F: Heal** — Restore 30% max HP to agent (12s CD)

**Implementation:**
```typescript
// Agent class (not Player - reinforcing the mental model)
class Agent {
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
  
  // Basic attacks happen autonomously (from D0 state machine)
  performAttack() {
    // Called automatically by AI state machine
    // NOT triggered by SPACE key
  }
}

// In game loop, ONLY listen for Q/E/R/F keypresses
// WASD and SPACE are ignored
```

**Expected result:**
- Press Q → agent dashes forward in its current movement direction
- Press E → yellow explosion appears around agent, damages nearby enemies
- Press R → orange projectile fires from agent toward its current target
- Press F → green heal effect, agent's HP bar refills
- Abilities show cooldown overlays on HUD buttons (gray fill that shrinks)
- Agent continues attacking enemies automatically between ability uses
- The commander (player) feels like they're issuing tactical commands, not directly controlling movement

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
- [ ] Agent moves and fights autonomously (no WASD control)
- [ ] You can watch and command the agent through a Crucible run for 5+ minutes
- [ ] Rooms clear → advance → new room spawns
- [ ] Floors increment with difficulty scaling
- [ ] 3 enemy types with distinct behaviors
- [ ] 4 commander abilities work with cooldowns (Q/E/R/F only input)
- [ ] Death ends the run and shows stats
- [ ] The core loop feels like commanding a fighter, not playing as one

---

## PHASE E — THE CRUCIBLE IDENTITY

**Goal**: Add the systems that make this feel like the Crucible from the Bible — modifier selection, path choices, and adaptive difficulty.

### E1: Modifier Selection (Hades-style power-ups)

**What to build:**
- After each room clear, show a choice of 3 modifiers
- Modifiers are temporary buffs that last for the run
- Start with 12 simple modifiers (expand later):
  - **Amplifiers**: "Abilities deal +20% damage", "Cooldowns reduced 15%", "Agent moves 15% faster"
  - **Triggers**: "On kill: heal 5% max HP", "On ability use: 10% chance to reset cooldown", "On dodge: leave damaging afterimage"
  - **Transmuters**: "Abilities leave burning ground", "Projectiles pierce 1 enemy", "Dash has 2 charges"
  - **Agent Augments**: "Agent dodges 25% more frequently", "Agent prioritizes wounded enemies", "Agent attacks 20% faster"
- Chosen modifier is added to a list, effects stack
- Modifier selection UI: 3 cards side-by-side, click to choose, brief card flip animation
- Agent Augments make sense now because the agent IS autonomous (since D0)

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
- Trial analyzes the agent's behavior from previous floors:
  - Track: average distance from enemies, ability usage frequency (commander inputs), damage taken per room
  - Generate counter-composition: if agent kites, spawn fast chasers; if agent facetanks, spawn ranged enemies; if commander spams abilities, spawn high-HP enemies
- Trial floor is harder than normal but gives better rewards (Epic modifier choice)
- "TRIAL FLOOR V" announcement before it starts

**Implementation:**
```typescript
// Track agent behavior
interface BehaviorProfile {
  avgDistanceFromEnemies: number;  // Agent's positioning pattern
  abilityUsageRate: number;        // Commander's ability frequency
  damagePerRoom: number;           // Agent's survivability
}

function generateTrialFloor(profile: BehaviorProfile): Room {
  if (profile.avgDistanceFromEnemies > 150) {
    // Agent kites → spawn dashers and chargers
    return createRoom({ dashers: 6, chargers: 3 });
  } else if (profile.abilityUsageRate > 0.5) {
    // Commander spams abilities → spawn high-HP rangers
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

### F0: AI Decision Framework

**What to build:**
- Define the combat state that gets sent to the AI model each decision tick
- Decision tick rate: every 300-500ms (not every frame — too expensive)
- Between ticks, the behavior state machine from D0 handles frame-by-frame movement
- Each tick, the AI model receives:
  - Agent position, HP, cooldown states
  - Enemy positions, types, HP, current actions
  - Room layout (walls, obstacles, hazards)
  - Active modifiers and their effects
  - Equipped Tenets (as behavior instructions)
- The AI model outputs:
  - Movement preference (direction bias, aggression level)
  - Target priority (which enemy to focus)
  - Dodge urgency (0-1 scale, affects retreat frequency)
- Start with a **mock AI** that makes random-but-reasonable decisions (weighted by distance, HP, etc.)
- The mock AI is the baseline. Later, real LLM models replace it — but the interface is defined NOW.

**Implementation:**
```typescript
// Combat state sent to AI model
interface CombatState {
  agent: {
    position: Vector2;
    hp: number;
    maxHp: number;
    cooldowns: Record<string, number>;
  };
  enemies: Array<{
    id: string;
    position: Vector2;
    type: EnemyArchetype;
    hp: number;
    maxHp: number;
    currentAction: string;
  }>;
  room: {
    walls: Rect[];
    hazards: Hazard[];
  };
  modifiers: Modifier[];
  tenets: Tenet[];
}

// AI model output
interface AIDecision {
  movementBias: Vector2;      // Preferred direction (-1 to 1 for x/y)
  aggressionLevel: number;    // 0 = retreat, 1 = charge
  targetPriority: string;     // Enemy ID to focus
  dodgeUrgency: number;       // 0-1, affects retreat threshold
}

// Mock AI (will be replaced with LLM later)
function mockAIDecision(state: CombatState): AIDecision {
  // Simple heuristic-based decisions
  const nearestEnemy = findNearest(state.enemies, state.agent.position);
  const hpPercent = state.agent.hp / state.agent.maxHp;
  
  return {
    movementBias: vectorToward(nearestEnemy.position),
    aggressionLevel: hpPercent > 0.5 ? 0.8 : 0.3,
    targetPriority: nearestEnemy.id,
    dodgeUrgency: hpPercent < 0.3 ? 0.9 : 0.2
  };
}

// Decision tick loop
let decisionTimer = 0;
const DECISION_INTERVAL = 400; // ms

function update(delta: number) {
  decisionTimer += delta;
  
  if (decisionTimer >= DECISION_INTERVAL) {
    const state = gatherCombatState();
    const decision = mockAIDecision(state); // Later: realLLMDecision(state)
    applyAIDecision(decision);
    decisionTimer = 0;
  }
  
  // State machine from D0 handles frame-by-frame execution
  agent.updateAI(delta);
}
```

**Why this must come before F1:**
The Tenet system (F3) modifies AI behavior. If the AI decision framework doesn't exist, Tenets like "Strike the Wounded" and "Ghost Protocol" have nothing to modify. The framework must exist before Tenets are built.

**Expected result:**
- Agent behavior is now driven by the decision framework (not just the simple state machine from D0)
- Mock AI makes reasonable decisions: targets wounded enemies, retreats when low HP, varies approach
- Debug overlay (toggle with backtick key) shows: current AI decision, target, movement preference, aggression level
- The interface is clean enough that swapping in a real LLM later requires changing ONE function (mockAIDecision → realLLMDecision)
- Decision tick rate is configurable (300-500ms)

**Files to modify:**
- New: `AIDecisionFramework.ts` (decision interface, mock AI, tick loop)
- `Agent.ts` (integrate decision framework with state machine from D0)
- New: `DebugOverlay.tsx` (show AI decisions, toggle with backtick)

**Constraints:**
- One commit
- Under 400 lines
- Test: watch agent for 1 minute, verify decisions update every 400ms, debug overlay shows decision data
- No self-certification - describe what the AI decides to do

---

### F1: Combat School Selection (Agent Creation)

**What to build:**
- Before entering the Crucible, commander (player) chooses a Combat School for their agent:
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

### H3: Authentication (Existing OAuth + Session Management)

**What to build:**
- Use the existing Discord and Google OAuth already implemented in the codebase
- Session management and protected routes
- Connect auth to the new Supabase schema (link OAuth users to Supabase users table)
- Login/Logout in sidebar
- Protected routes (require login to access /crucible, /armory, /dashboard)

**Files that already exist:**
- `frontend/src/app/auth/discord/callback/page.tsx`
- `frontend/src/app/auth/google/callback/page.tsx`
- `frontend/src/app/auth/login/page.tsx`

**What to modify:**
- `Layout.tsx` (session context, protected route logic)
- Sidebar (login/logout buttons)
- Auth callback pages (connect to Supabase user creation)
- New: `/api/auth/session.ts` (session management API)

**Constraints:**
- One commit
- Under 250 lines
- Test: Discord OAuth flow works, Google OAuth flow works, sessions persist, protected routes redirect to login

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
- [ ] Auth works (Discord and Google OAuth)
- [ ] Database persists all data
- [ ] API routes work
- [ ] Leaderboard shows real data
- [ ] War Room shows agent stats
- [ ] The product feels like a real web app

---

## PHASE I — THE ARENA (PVP MODE)

> ⚠️ **DO NOT IMPLEMENT YET.** Phase I requires a dedicated design pass before any code is written. The questions of match format (real-time vs. tick-based vs. async), AI decision model, and competitive structure must be answered first. Begin only after Phases G and H are solid and a Phase I design document exists.

**Goal**: AI-driven agent vs agent PvP battles with ELO matchmaking. Agents built through Crucible play fight autonomously — no real-time player input during combat.

### I1: Arena Combat (1v1)

**What to build (design TBD — these are starting assumptions only):**
- Agent vs agent combat — both champions fight autonomously using AI decision making
- Player's build (school, disciplines, tenets, equipment) defines how the agent behaves
- Match format, timing, and player interaction during combat are TBD
- No in-run modifiers — permanent build only
- Camera shows full arena (both agents visible at all times)
- Best-of-3 rounds
- Round timer: 60 seconds max per round, agent with most HP remaining wins if timer expires
- No in-run modifiers (permanent build only — Schools, Disciplines, Tenets, Equipment)
- Winner determined by HP remaining after all rounds

**Implementation:**
```typescript
interface ArenaMatch {
  player1: { agentId: string, commander: string };
  player2: { agentId: string, commander: string };
  rounds: Round[];
  currentRound: number;
  matchState: 'waiting' | 'active' | 'complete';
}

interface Round {
  timeLimit: number; // 60 seconds
  winner: string | null;
  player1HP: number;
  player2HP: number;
}

// Both agents fight autonomously
// Both players can trigger abilities via socket events
```

**Constraints:**
- One commit
- Under 500 lines
- Test: fight against a mock opponent AI, verify both agents move autonomously, verify timer works

---

### I2: Replay System

**What to build:**
- After a match, save the replay (sequence of AI decisions + ability commands from both players)
- Replay data stored in database (match_replays table)
- Players can watch replays from the Arena results screen
- Replay viewer: play/pause, speed controls (0.5x, 1x, 2x), scrub timeline
- This is critical for learning opponent strategies and for spectator features mentioned in the Bible

**Implementation:**
```typescript
interface ReplayData {
  matchId: string;
  duration: number;
  ticks: ReplayTick[];
}

interface ReplayTick {
  timestamp: number;
  agent1: { position: Vector2, hp: number, action: string };
  agent2: { position: Vector2, hp: number, action: string };
  events: ReplayEvent[]; // abilities used, deaths, round transitions
}

// Replay viewer shows both agents moving through the match
// Commander ability inputs highlighted when used
```

**Expected result:**
- After match → "Watch Replay" button
- Click replay → match plays back with both agents
- Can pause, rewind, speed up
- Ability uses shown with visual indicators
- Useful for learning and improvement

**Files to modify:**
- New: `ReplaySystem.ts` (record and playback logic)
- New: `ReplayViewer.tsx` (UI for watching replays)
- `ArenaCanvas.tsx` (replay playback mode)
- API: `POST /api/arena/replays` (save), `GET /api/arena/replays/:matchId` (fetch)

**Constraints:**
- One commit
- Under 450 lines
- Test: save replay, watch it back, verify playback controls work

---

### I3: Matchmaking and ELO

**What to build:**
- Matchmaking queue (find opponent based on ELO rating)
- ELO calculation (winner gains, loser drops, using standard ELO formula)
- Match history tracking (last 20 matches per player)
- Separate leaderboard for Arena ELO (not Crucible depth)
- Matchmaking prioritizes similar ELO (±100 initially, expands after 30s wait)

**Implementation:**
```typescript
// ELO calculation
function calculateELOChange(winnerELO: number, loserELO: number, kFactor = 32): { winnerNew: number, loserNew: number } {
  const expectedWinner = 1 / (1 + Math.pow(10, (loserELO - winnerELO) / 400));
  const expectedLoser = 1 - expectedWinner;
  
  return {
    winnerNew: winnerELO + kFactor * (1 - expectedWinner),
    loserNew: loserELO + kFactor * (0 - expectedLoser)
  };
}

// Matchmaking queue
interface QueueEntry {
  playerId: string;
  agentId: string;
  elo: number;
  queuedAt: number;
}

// Find match within ±100 ELO, expand range over time
```

**Expected result:**
- Click "Queue for Arena" → wait for opponent
- Matched with similar ELO player
- After match → ELO updates shown ("+15 ELO", "-12 ELO")
- Match history shows past opponents and results

**Files to modify:**
- New: `Matchmaking.ts` (queue system, ELO calculation)
- New: `ArenaQueue.tsx` (queue UI, waiting screen)
- API: `POST /api/arena/queue`, `GET /api/arena/match-history`

**Constraints:**
- One commit
- Under 400 lines
- Test: queue, match, gain/lose ELO, verify match history

---

### I4: Arena Leaderboard and Seasons

**What to build:**
- Arena-specific leaderboard page (separate from Crucible depth leaderboard)
- Shows top 100 by ELO, sorted descending
- Each entry: rank, agent name, Combat School icon, ELO rating, win/loss record
- Seasonal system: Arena runs on 1-month seasons
- Seasonal ELO soft reset at season end (compress toward median: newELO = 1200 + (oldELO - 1200) * 0.5)
- Season rewards at rank thresholds (top 10, top 50, top 100 get cosmetics or exclusive equipment)
- Visual: gold/silver/bronze badges for top 3, season number displayed

**Implementation:**
```typescript
interface Season {
  id: number;
  startDate: Date;
  endDate: Date;
  leaderboard: LeaderboardEntry[];
  rewards: SeasonReward[];
}

interface SeasonReward {
  rankThreshold: number; // e.g., 10 = top 10
  rewardType: 'cosmetic' | 'equipment' | 'title';
  rewardId: string;
}

// At season end, calculate rewards, reset ELO, start new season
function endSeason(seasonId: number) {
  const leaderboard = getSeasonLeaderboard(seasonId);
  distributeRewards(leaderboard);
  softResetAllELO();
  startNewSeason();
}
```

**Expected result:**
- Arena leaderboard page shows top 100 by ELO
- Top 3 have gold/silver/bronze styling
- Season number shown (e.g., "Season 1")
- Season end date countdown displayed
- After season ends → rewards distributed, ELO reset

**Files to modify:**
- New: `ArenaLeaderboard.tsx` (Arena-specific leaderboard UI)
- New: `SeasonSystem.ts` (season management, soft reset logic)
- API: `GET /api/arena/leaderboard`, `GET /api/arena/season/current`

**Constraints:**
- One commit
- Under 350 lines
- Test: view leaderboard, verify styling, check season info displayed

---

**✅ Phase I Complete When:**
- [ ] Arena 1v1 works (both agents AI-controlled, commanders issue abilities)
- [ ] Replay system works (save and watch replays)
- [ ] Matchmaking finds opponents based on ELO
- [ ] ELO system works (gains/losses calculated correctly)
- [ ] Arena leaderboard separate from Crucible (different data)
- [ ] Seasonal system works (soft reset, rewards at season end)

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
