# Agent Arena — Phase 2 Master Development Prompt

> **Purpose**: This is the continuation development guide for Agent Arena. Phases A–C (PixiJS foundation, entities, HUD/polish) are complete. This document covers everything from game systems integration through to a shippable product.
>
> **This document supplements the original Master Development Prompt.** All Golden Rules from that document still apply. If there is a conflict, the Golden Rules win.

---

## 0. QUICK REFRESHER — THE RULES THAT WORKED

Phases A–C succeeded because these rules were followed. Continue following them:

- **One system per commit.** No multi-system mega-commits.
- **No planning documents.** Code only. Update ARCHITECTURE.md with what actually works.
- **No self-certifying completion.** Describe expected visual/functional result. Human verifies.
- **Read before writing.** Always read files you depend on before modifying or importing from them.
- **Files under 300 lines.** Tasks under 500 lines of new code.
- **Working > Complete.** Simple and visible beats complex and broken.

---

## 1. CURRENT STATE (after Phases A–C)

What should exist and be working:
```
✅ PixiJS canvas rendering in /arena route
✅ Tiled floor across the arena
✅ Wall boundaries around arena edges
✅ Player entity (blue) with WASD movement
✅ Camera following player smoothly
✅ Enemy entities (orange) with chase AI
✅ Attack system (SPACE to attack)
✅ Health bars above entities
✅ React HUD overlay (HP/MP bars, skill buttons)
✅ Particle effects (hit, death)
✅ Sound effects
```

**Before starting Phase D, verify all of the above actually works.** Run the game locally. If anything from this list is broken, fix it first. Do not build on broken foundations.

---

## 2. PHASE D — GAME SYSTEMS INTEGRATION

These tasks connect the backend game logic to the visual layer. Each is ONE commit.

### D1: Multiple Enemy Types
**What to do:** Create 3-4 visually distinct enemy types with different stats.
```
- Grunt:    Red circle, small, fast, low HP (50), low damage (5)
- Brute:    Dark red circle, large radius, slow, high HP (150), high damage (15)  
- Caster:   Purple circle, medium, ranged attack pattern, medium HP (80)
- Swarmer:  Orange circle, tiny, very fast, very low HP (25), spawns in groups of 3
```
**Implementation:** Add an `EnemyType` union type. Each type gets a config object with color, radius, speed, hp, damage. The spawn function picks a type and reads from the config.
**Expected result:** Arena spawns a mix of enemy types. You can visually tell them apart by color and size.

### D2: Enemy Spawn Waves
**What to do:** Instead of all enemies spawning at once, spawn them in timed waves that increase in difficulty.
```
- Wave 1: 3 Grunts
- Wave 2: 2 Grunts + 1 Brute
- Wave 3: 4 Swarmers + 1 Caster
- Wave N: Scales up enemy count and mixes in harder types
```
**Implementation:** A simple wave manager — an array of wave definitions. Timer between waves (10 seconds or until all enemies dead). Display "Wave N" text briefly on screen (React overlay, not PixiJS).
**Expected result:** After killing all enemies, a brief pause, then "Wave 2" appears and new enemies spawn. Gets progressively harder.

### D3: XP and Level-Up System
**What to do:** Enemies drop XP on death. Player gains XP, levels up with a visual effect.
```
- XP floats toward player on enemy death (small glowing orbs)
- XP bar in the HUD (below HP/MP)
- Level-up: flash effect, brief screen glow, stat increase
- Each level: +10 max HP, +2 attack, +1 defense
```
**Implementation:** Add `xp`, `level`, `xpToNextLevel` to player state. XP orbs are small PixiJS circles that lerp toward the player. Level-up triggers a white screen-flash (PixiJS overlay with alpha tween) and updates the HUD.
**Expected result:** Killing enemies produces XP orbs. Orbs drift to player. XP bar fills. When full, brief flash, "Level Up!" text, stats increase.

### D4: Loot Drops
**What to do:** Enemies have a chance to drop items on death that the player can pick up.
```
- Drop chance: 20% per enemy kill
- Loot appears as a glowing sprite on the ground
- Walking over loot picks it up automatically
- Types: Health Potion (red, heals 30 HP), Damage Boost (orange, +5 ATK for 30s), Shield (blue, +10 DEF for 30s)
```
**Implementation:** On enemy death, roll random. If drop, create a loot entity at that position with a gentle bob animation (PixiJS y-offset sine wave). Collision detection with player triggers pickup. Show brief "+30 HP" floating text on pickup.
**Expected result:** Occasional glowing items appear where enemies die. Walking over them gives a buff and shows floating text.

### D5: Player Abilities (Q/E/R/F skills)
**What to do:** Implement 4 active abilities mapped to Q, E, R, F keys with cooldowns.
```
- Q: Dash — quick movement burst in facing direction (3s cooldown)
- E: Whirlwind — AOE damage around player (5s cooldown)  
- R: Fireball — projectile in facing direction (4s cooldown)
- F: Heal — restore 25% HP (10s cooldown)
```
**IMPORTANT:** Implement ONE ability at a time as separate sub-commits if needed. Start with Dash (simplest), then add the others one by one.

**Implementation per ability:**
- Add cooldown timer to player state
- Show cooldown overlay on the HUD skill buttons (gray fill that shrinks)
- Each ability has a distinct particle color (Dash=white, Whirlwind=yellow, Fireball=orange, Heal=green)

**Expected result:** Pressing Q dashes the player forward. Skill button shows cooldown. Pressing again during cooldown does nothing. Each ability has a visible effect.

### D6: Damage Numbers
**What to do:** When entities take damage, show floating damage numbers.
```
- White numbers for normal damage
- Yellow numbers for critical hits (10% chance, 2x damage)
- Green numbers for healing
- Numbers float up and fade out over 1 second
```
**Implementation:** React overlay positioned using world-to-screen coordinate conversion. Absolutely positioned divs with CSS animation (translateY + opacity). Remove from DOM after animation completes.
**Expected result:** Hitting an enemy shows "-12" floating up. Getting healed shows "+30" in green. Occasional crits show larger yellow numbers.

---

## 3. PHASE E — UI PAGES & NAVIGATION

The game needs more than the arena. Each page is a separate task.

### E1: Navigation Layout
**What to do:** Create a persistent sidebar/header navigation that works across all pages.
```
Routes:
  /           → Landing page (not logged in) OR Dashboard (logged in)
  /arena      → The game (already exists)
  /dashboard  → Agent overview & stats
  /inventory  → Equipment management
  /leaderboard → Rankings
  /profile    → User settings
```
**Style:** Dark theme consistent with the game. Use shadcn/ui components. Sidebar navigation with icons. Active route highlighted.
**Expected result:** Clicking between nav items loads different pages. Arena page still works with the PixiJS canvas.

### E2: Dashboard Page
**What to do:** Show the player's agent overview — stats, recent battles, current level.
```
- Agent card: name, level, class/type, stat bars (HP, ATK, DEF, SPD, INT)
- Recent battles: list of last 5 battles with outcome (W/L), XP gained, enemy faced
- Quick actions: "Enter Arena" button, "Manage Equipment" button
```
**Implementation:** Use mock data for now (hardcoded JSON). Build the UI components. Backend integration comes later.
**Expected result:** A clean dashboard showing agent info. All data is mock but the layout and components are real.

### E3: Inventory Page
**What to do:** Equipment management screen with drag-and-drop or click-to-equip.
```
Layout:
  Left: Agent paper doll with 4 equipment slots (Weapon, Armor, Accessory, Module)
  Right: Inventory grid (backpack) showing owned items
  
Items show: name, rarity color border, stat bonuses
Rarity: Common (gray), Uncommon (green), Rare (blue), Epic (purple), Legendary (orange)
```
**Implementation:** Zustand store for inventory state. Click item in backpack → equips to matching slot. Click equipped item → unequips to backpack. Use mock items for now.
**Expected result:** Grid of items with colored borders. Clicking an item equips it and updates the paper doll slots. Stats update to reflect equipment.

### E4: Leaderboard Page
**What to do:** Rankings table showing top agents.
```
- Columns: Rank, Agent Name, Owner, Level, Win Rate, Total Battles
- Sortable by column
- Highlight current user's agent
- Top 3 get special styling (gold/silver/bronze)
```
**Implementation:** Mock data array of 20 agents. shadcn/ui Table component. Client-side sorting.
**Expected result:** Clean leaderboard table. Clicking column headers re-sorts. Top 3 have distinct styling.

### E5: Landing Page
**What to do:** The first thing visitors see. Should sell the game.
```
- Hero section: game title, tagline ("Command AI Agents. Conquer the Arena."), CTA button
- Brief feature showcase (3-4 cards: Battle, Equip, Compete, Level Up)
- Footer with links
```
**Style:** Dark, dramatic. Consider a subtle animated background (CSS particles or a dimmed, slow-motion PixiJS scene). The landing page should make people want to play.
**Expected result:** Visually impressive landing page that communicates what the game is in 5 seconds.

---

## 4. PHASE F — BACKEND INTEGRATION

Now connect the frontend to real data. Each task is one API endpoint + frontend integration.

### Backend Architecture Reminder
```
Backend: Express.js + TypeScript
Database: Supabase (PostgreSQL)
Auth: NextAuth.js
Real-time: Socket.io
```

### F1: Authentication (NextAuth.js)
**What to do:** User login/signup. Start with GitHub OAuth (simplest to set up with NextAuth).
```
- NextAuth configuration with GitHub provider
- Login/Logout buttons in navigation
- Protected routes: /arena, /dashboard, /inventory, /profile require login
- /leaderboard is public
```
**Expected result:** Clicking "Sign In" redirects to GitHub OAuth. After auth, user is logged in and can access protected routes. Logging out redirects to landing page.

### F2: Agent CRUD API
**What to do:** Create, read, update agents in Supabase.
```
Endpoints:
  POST   /api/agents          → Create new agent
  GET    /api/agents/:id      → Get agent details
  GET    /api/agents/mine     → Get current user's agents
  PATCH  /api/agents/:id      → Update agent (rename, reallocate stats)
  DELETE /api/agents/:id      → Delete agent

Agent schema:
  id, owner_id, name, level, xp
  hp, attack, defense, speed, intelligence
  created_at, updated_at
```
**Expected result:** Dashboard shows real agent data from database. Creating a new agent persists to Supabase and appears on dashboard.

### F3: Equipment API
**What to do:** Equipment CRUD + equip/unequip actions.
```
Endpoints:
  GET    /api/equipment/mine          → User's inventory
  POST   /api/equipment/equip         → Equip item to agent slot
  POST   /api/equipment/unequip       → Unequip item from agent
  
Equipment schema:
  id, owner_id, name, type (weapon/armor/accessory/module)
  rarity, stat_bonuses (JSON), equipped_by (agent_id or null)
```
**Expected result:** Inventory page shows real equipment from database. Equipping/unequipping persists.

### F4: Battle Results API
**What to do:** Record battle outcomes and update agent XP/stats.
```
Endpoints:
  POST   /api/battles/complete    → Record battle result (called when arena run ends)
  GET    /api/battles/history     → Recent battles for an agent

Battle schema:
  id, agent_id, waves_completed, enemies_killed, xp_earned
  loot_gained (JSON), duration_seconds, created_at
```
**Expected result:** After dying or completing a run in the arena, results are saved. Dashboard shows battle history with real data.

### F5: Leaderboard API
**What to do:** Real rankings from the database.
```
Endpoints:
  GET /api/leaderboard?sort=level&limit=50
  GET /api/leaderboard?sort=winrate&limit=50

Query: Join agents table, compute win rate from battles, sort, return top N.
```
**Expected result:** Leaderboard page shows real agent rankings from the database.

### F6: Real-Time Socket Integration
**What to do:** Live updates for the leaderboard and presence.
```
- Socket.io server running alongside Express
- Events:
  - player:online / player:offline → show online status on leaderboard
  - leaderboard:update → push new rankings when battles complete
  - arena:state → (future) multiplayer arena sync
```
**Expected result:** Leaderboard shows which players are currently online. Rankings update in real-time when someone completes a battle.

---

## 5. PHASE G — GAME DEPTH & POLISH

These are the features that make the game feel complete and replayable.

### G1: Agent AI Behavior System
**What to do:** Make agents controlled by AI modules that affect their behavior.
```
AI Types:
  - Aggressive: prioritizes attacking, chases enemies, ignores defense
  - Defensive: kites enemies, uses abilities defensively, retreats when low HP
  - Balanced: mixes attack and defense based on situation
  
Module items can modify AI behavior:
  - "Berserk Chip": Agent goes aggressive below 30% HP
  - "Tactician Core": Agent prioritizes AOE when 3+ enemies nearby
  - "Survivor Matrix": Agent always retreats to heal below 20% HP
```
**Expected result:** Different agents with different modules play the arena differently. Watching an aggressive agent vs a defensive agent should look noticeably different.

### G2: Arena Variations
**What to do:** Multiple arena layouts to keep the game fresh.
```
- Arena 1: "The Pit" — Open rectangular arena (current default)
- Arena 2: "The Maze" — Corridors and rooms generated with simple BSP algorithm
- Arena 3: "The Gauntlet" — Long narrow path with enemy waves
- Random selection or player choice before entering
```
**Implementation:** Each arena is a 2D tile array. Create a simple generator function for each type. The PixiJS renderer already supports tiles and walls — just feed it different map data.
**Expected result:** Player can choose or randomly get different arena layouts. Each feels distinct.

### G3: Boss Encounters
**What to do:** Every 5th wave, spawn a boss instead of regular enemies.
```
- Boss: Significantly larger sprite, unique color (dark red with glow)
- High HP (500+), increased damage
- Special attack patterns:
  - Charge: rushes toward player quickly
  - Slam: AOE damage in radius after brief wind-up
  - Summon: spawns 2 Swarmers
- Health bar displayed at top of screen (React overlay, boss-style)
```
**Expected result:** Wave 5 announces "BOSS INCOMING", a large enemy appears with a top-screen health bar. Boss uses varied attacks. Defeating it gives bonus XP and guaranteed loot drop.

### G4: Equipment Crafting
**What to do:** Combine materials dropped from enemies to craft equipment.
```
- Enemies drop crafting materials alongside regular loot
- Materials: Common Shard, Rare Crystal, Boss Essence
- Crafting UI: select recipe → see required materials → craft button
- Recipes yield equipment with random stat rolls within a range
```
**Implementation:** Add a crafting tab to the inventory page. Simple recipe list. Check if player has required materials. On craft, generate item with randomized stats using the recipe's min/max ranges.
**Expected result:** Player collects materials from arena runs, goes to inventory, crafts new equipment. Items have some randomness to encourage repeated crafting.

### G5: Screen Shake & Juice
**What to do:** Make combat feel impactful with screen effects.
```
- Screen shake on: player taking damage, boss slam, explosions
- Hit freeze: 50ms pause on heavy hits (stop all movement briefly)
- Kill streak text: "Double Kill!", "Triple Kill!", etc.
- Combo counter: hits within 2 seconds stack a combo number
```
**Implementation:** Screen shake = offset the gameContainer.x/y by random small amounts for N frames, then return to normal. Hit freeze = temporarily set game speed to 0 for a few frames. Kill streak/combo = React overlay text with CSS scale-up animation.
**Expected result:** Game feels crunchy and responsive. Heavy hits feel impactful. Kill streaks are satisfying.

### G6: Visual & Audio Polish Pass
**What to do:** Final polish to elevate the look.
```
- Ambient particles: subtle floating dust/embers in the arena
- Vignette overlay: dark edges around the screen
- Entity shadows: small dark ellipse under each entity
- Footstep particles: tiny dust puffs when moving
- Better death effect: enemy "dissolves" (scale down + fade + particle burst)
- Background music: looping ambient track (find free game music on itch.io or opengameart.org)
- Volume controls in settings/profile page
```
**Expected result:** The arena feels atmospheric and polished. There's a clear difference between "functional game" and "polished game" — this task bridges that gap.

---

## 6. DEVELOPMENT PRIORITY ORDER

```
PRIORITY 1 — Make the core loop fun (Phase D)
  D1 → D2 → D3 → D6 → D4 → D5
  (Multiple enemies → Waves → XP/Level → Damage numbers → Loot → Abilities)

PRIORITY 2 — Make it a real product (Phases E + F)
  E1 → E5 → F1 → E2 → F2 → E3 → F3 → E4 → F5 → F4 → F6
  (Nav → Landing → Auth → Dashboard+API → Inventory+API → Leaderboard+API → Battles → Socket)

PRIORITY 3 — Make it deep and polished (Phase G)
  G5 → G3 → G2 → G1 → G6 → G4
  (Juice → Bosses → Arena types → AI behavior → Polish → Crafting)
```

**Do not skip to Priority 2 or 3 before Priority 1 is solid.** The game loop must be fun first. UI pages and backend can use mock data while the gameplay is being refined.

---

## 7. INTEGRATION PATTERNS

### How PixiJS and React Talk to Each Other

The game has two rendering layers that need to communicate:

```
┌────────────────────────────────┐
│  React Layer (HUD, UI, menus)  │  ← Zustand store
├────────────────────────────────┤
│  PixiJS Layer (game canvas)    │  ← Reads from & writes to same Zustand store
└────────────────────────────────┘
```

**Pattern: Zustand as the bridge**
```typescript
// lib/stores/gameStore.ts
import { create } from 'zustand';

interface GameState {
  playerHP: number;
  playerMaxHP: number;
  playerMP: number;
  playerMaxMP: number;
  playerLevel: number;
  playerXP: number;
  xpToNextLevel: number;
  wave: number;
  killCount: number;
  isPlayerDead: boolean;
  
  // Actions (called from PixiJS game loop)
  takeDamage: (amount: number) => void;
  heal: (amount: number) => void;
  gainXP: (amount: number) => void;
  setWave: (wave: number) => void;
  incrementKills: () => void;
}

// PixiJS reads: const hp = useGameStore.getState().playerHP;
// PixiJS writes: useGameStore.getState().takeDamage(10);
// React reads: const hp = useGameStore(state => state.playerHP); // auto-rerenders
```

This way the PixiJS game loop can update state, and React components automatically re-render to reflect it. No manual syncing needed.

### How Arena Results Get to the Backend

```
Arena run ends (player dies or completes all waves)
  → PixiJS stops game loop
  → Write final stats to Zustand (waves completed, kills, XP, loot)
  → React "Game Over" overlay appears (reads from Zustand)
  → "Save Results" button calls POST /api/battles/complete
  → On success, show summary screen with XP gained, loot found
  → "Return to Dashboard" button navigates away
```

### How Equipment Affects Gameplay

```
Player equips item in Inventory page (React)
  → Supabase updated via API
  → Agent stats recalculated on backend
  → When entering arena, game fetches agent's current stats via API
  → PixiJS initializes player entity with those stats
  → Equipment bonuses are already baked into the stat values
```

---

## 8. VISUAL REFERENCE — WHAT EACH PHASE SHOULD LOOK LIKE

### After Phase D (game systems):
The arena should feel like an actual game. Multiple distinct enemy types in waves. XP orbs flying toward the player. Damage numbers popping up. Loot drops glowing on the ground. Abilities firing with particle effects and cooldown indicators. A wave counter in the HUD. This should be something you could show someone and they'd say "oh cool, a game."

### After Phase E (UI pages):
Navigating between pages feels smooth and polished. The landing page looks professional. The dashboard shows agent stats clearly. The inventory has a satisfying equip/unequip interaction. The leaderboard is clean and readable. Dark theme throughout, consistent styling.

### After Phase F (backend):
Everything persists. Creating an agent, equipping items, completing arena runs — all saved to the database. Logging out and back in shows your stuff. The leaderboard shows real rankings from real players. The game is no longer a demo; it's a product.

### After Phase G (polish):
The game has "juice" — screen shake on hits, satisfying kill effects, boss encounters that feel epic, variety in arena layouts, atmospheric ambient effects. This is when people would want to share it or play it again.

---

## 9. THINGS THAT WILL GO WRONG (AND HOW TO FIX THEM)

### "The PixiJS canvas stops rendering when navigating away and back"
Next.js will unmount and remount the component. Make sure the PixiJS Application is properly destroyed in the useEffect cleanup and re-created on mount. Store game state in Zustand (which persists across mounts), not in PixiJS objects.

### "Zustand state updates don't reflect in PixiJS"
PixiJS doesn't use React's render cycle. Don't use `useGameStore()` hooks inside PixiJS code. Instead, use `useGameStore.getState()` to read and `.setState()` to write from within the game loop. Subscribe to changes only if needed: `useGameStore.subscribe(state => { ... })`.

### "Performance drops with many entities"
- Keep particle count low (max 50 active at any time)
- Use object pooling for particles (reuse instead of create/destroy)
- Don't create new Graphics objects every frame
- Batch entity updates — don't update PixiJS positions unless they've changed
- 60 FPS with 50 entities and 50 particles should be easy for PixiJS

### "NextAuth session doesn't persist / weird redirects"
- Make sure NEXTAUTH_SECRET is set in environment variables
- Make sure NEXTAUTH_URL matches your deployment URL
- Wrap the app in SessionProvider at the layout level
- Use `getServerSession()` for server-side checks, `useSession()` for client

### "Supabase queries are slow"
- Add indexes on frequently queried columns (owner_id, agent_id)
- Use `.select()` to limit returned columns
- Don't fetch the entire agents table for leaderboard — use `.limit()` and `.order()`

---

## 10. ASSET RESOURCES

Free assets that would immediately elevate the look:

### Sprite Packs (itch.io)
Search for these on itch.io — all have free tiers:
- "0x72 Dungeon Tileset" — excellent 16x16 roguelike tiles
- "Ninja Adventure" — complete asset pack with characters, tiles, effects
- "Pixel Crawler" — dungeon enemies and characters
- "Kenney RPG Assets" — clean, consistent game art

### Sound Effects
- freesound.org — search "sword hit", "level up", "coin pickup"
- opengameart.org — search "RPG sound effects pack"
- kenney.nl — free sound packs

### Music
- opengameart.org — search "dungeon music loop"
- freemusicarchive.org — search for game-appropriate ambient tracks
- Kevin MacLeod (incompetech.com) — royalty-free music

When using any assets: check the license, credit the artist in README.

---

## 11. SUCCESS CRITERIA — HOW TO KNOW EACH PHASE IS DONE

### Phase D is done when:
- [ ] You can play the arena for 5+ minutes and it feels fun
- [ ] There are at least 3 distinct enemy types that behave differently
- [ ] Waves progress and get harder
- [ ] XP, leveling, and loot all work visibly
- [ ] At least 2 abilities work with cooldowns
- [ ] You want to play "just one more run"

### Phase E is done when:
- [ ] All 5 pages exist and are navigable
- [ ] Landing page makes someone curious about the game
- [ ] Dashboard clearly shows agent status
- [ ] Inventory equip/unequip works smoothly
- [ ] Leaderboard is sortable and readable
- [ ] Dark theme is consistent across all pages

### Phase F is done when:
- [ ] Users can sign in with GitHub
- [ ] Agent data persists across sessions
- [ ] Equipment persists across sessions
- [ ] Battle results are saved and shown in history
- [ ] Leaderboard shows real data from real users
- [ ] Logging out and back in preserves everything

### Phase G is done when:
- [ ] Someone who hasn't seen the game before says "this looks cool"
- [ ] Combat feels satisfying (screen shake, damage numbers, effects)
- [ ] Boss fights feel like an event
- [ ] Multiple arena layouts prevent repetition
- [ ] Audio enhances the experience
- [ ] The game has an identity — it doesn't look generic

---

*Keep building one commit at a time. Keep verifying visually. Keep it simple until it works, then make it great.*
