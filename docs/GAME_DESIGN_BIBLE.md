# AGENT ARENA — Game Design Bible

> **Document Purpose**: This is the creative and mechanical vision for Agent Arena. It defines what the game IS, how every system works, and how they connect. This is the source of truth for all game design decisions.
>
> **This is NOT a development prompt.** Technical implementation details, task breakdowns, and build phases belong in separate engineering documents. This document answers "what are we building and why."

---

## 1. CORE IDENTITY

**One-sentence pitch:** Fight through the depths yourself. Every run shapes a champion who will fight in your name.

**What makes this game unique:** Agent Arena is built around two distinct modes that feed each other. In the Crucible, *you* are the fighter — a player-controlled champion descending an endless dungeon, earning power, and forging your agent's identity through the choices you make. In the Arena (future), your agent fights *for* you — battling other players' agents autonomously, using the schools, disciplines, tenets, and equipment you earned in the Crucible. Think Pokémon: you go on the adventure, train your team, then compete. Or Teamfight Tactics: you build the roster, then watch it fight.

**The two-mode structure:**
- **The Crucible** — Player-controlled PvE. You fight. You choose upgrades. You push deeper. Everything you earn here powers your agent's identity.
- **The Arena** — AI-driven PvP (future). Your agent fights autonomously against other players' agents. The build you forged in the Crucible is its weapon.

**Why this works:** Real-time AI combat in a 60fps action game is technically impractical today (LLM latency kills it). But AI-driven PvP in an asynchronous or tick-based format is genuinely compelling. Separating the modes means both can be great on their own terms. The Crucible is a fantastic action roguelike. The Arena will be a deep strategic PvP system. Neither compromises for the other.

**The feel:** Hades-speed real-time combat in the Crucible. Diablo/Path of Exile depth of itemization. Slay the Spire's run-based decision-making. And in the Arena: the strategic satisfaction of watching a build you crafted go to war.

---

## 1A. THE AGENT IDENTITY

Your agent is not just a character — it is a strategic identity shaped entirely by your choices.

Schools define what kind of fighter your agent is. Disciplines specialize that fighting style into something distinct. Tenets encode behavioral instincts: how aggressive, how defensive, how opportunistic. Equipment defines raw power and unlocks special properties.

Every run in the Crucible is training. Every piece of gear, every unlocked discipline, every chosen tenet is preparation for the Arena. When your agent eventually enters PvP, it fights as you built it — not as a blank slate.

This is the core fiction of Agent Arena: *you are building a champion who will carry your legacy into battle.*

---

## 1B. PVP ARENA (FUTURE)

The Arena is Agent Arena's defining long-term feature. It is **not being built yet** — it requires dedicated design work before implementation.

**Placeholder intent:** Agents built through Crucible progression will battle other players' agents using AI-driven decision making. Both players' builds, equipment, and doctrine choices define how the fight unfolds. Neither player controls the combat in real-time — the agents execute autonomously based on how they were built.

**Open design questions (to be answered before Phase I begins):**
- Turn-based, tick-based, or real-time?
- What decisions does the AI agent make during a match?
- How much does the player configure strategy vs. the AI adapting?
- Synchronous (both watch live) or asynchronous (challenge and check results later)?
- How does build diversity prevent a single dominant meta?
- What rank/ELO structure governs competitive play?

These questions will be answered when Phases G and H are complete and the progression and economy systems are solid.

---

## 2. GAME MODES

Agent Arena has two primary modes. They share the same agent, equipment, and progression systems but are mechanically independent.

### 2.1 The Crucible (PvE — Primary Mode)

An endless dungeon run. You descend floor by floor, clearing rooms of enemies in real-time action combat. Each floor gets harder. Between rooms, you choose in-run modifiers that temporarily power up your agent. You go until you die.

**The goal:** Push as deep as possible. Leaderboards track maximum depth reached, with tiebreakers on time, HP remaining, and enemies defeated.

**Run pacing (variable):**
- Floors 1–5: Fast. Rooms clear in 15-30 seconds. Enemies are simple. You're building momentum, collecting early modifiers.
- Floors 6–15: Medium. Rooms take 30-60 seconds. Enemy variety increases. You're actively timing abilities. Modifier synergies are forming. Decisions start to matter.
- Floors 16–30: Intense. Rooms are genuine fights. Elite enemies appear. Your modifier build is either coming together or falling apart. Heavy ability management required.
- Floors 30+: Endgame. Every room is a survival challenge. You need a strong modifier build AND good ability timing AND a well-built champion to survive. This is where the leaderboard separates.

**Adaptive floors:** Floors 5, 10, 15, 20 (every 5th) are "Trial" floors. These analyze your agent's behavior patterns from the previous floors and generate encounters designed to test weaknesses. If your agent excels at melee, the Trial spawns ranged enemies with knockback. If your agent kites effectively, the Trial spawns fast chasers in tight rooms. All other floors are randomly generated. This prevents any single strategy from being an autopilot solution while keeping most of the run feeling organic and surprising.

**Run structure per floor:**
1. Enter floor → brief environment transition (visual shift, floor number announcement)
2. Clear 2-4 rooms of enemies (room count increases with depth)
3. After each room clear: choose 1 of 3 modifier options
4. After all rooms on a floor: choose next path (see Path Choices below)
5. Advance to next floor

**Path choices between floors:**
After clearing a floor, you choose your next destination from 2-3 options:
- **Combat Floor** — Standard enemy rooms. Reliable XP and gold.
- **Elite Floor** — Fewer rooms but each has a powerful elite enemy. Better modifier options as rewards.
- **Treasure Vault** — No combat. Guaranteed high-quality modifier or a temporary equipment boost.
- **Rest Shrine** — Heal a percentage of max HP. No rewards.
- **Crucible Shop** — Spend gold earned during the run on specific modifiers, consumables, or temporary stat boosts.
- **Trial Floor** — Adaptive difficulty (forced every 5th floor, but can also appear as a choice with bonus rewards for volunteering).

The path system means two players on the same floor can have completely different experiences based on their choices. A player with high HP might skip the rest shrine and push into an elite floor. A player with a fragile build might play it safe.

### 2.2 The Arena (PvP — Secondary Mode)

Direct agent-vs-agent combat. Two players' agents fight each other in real-time, with both players issuing commands simultaneously. Same combat engine as the Crucible, but the opponent is another player's AI agent instead of dungeon enemies.

**Key distinction:** In the Arena, your permanent build matters but in-run modifiers do NOT apply. This is a test of your agent's base build, equipment, AI model quality, and your command timing against another human doing the same.

**Arena structure:**
- Matchmaking based on ELO rating
- Best-of-3 rounds
- Both players see the same arena, issue commands in real-time
- Winner gains ELO, loser drops
- Separate leaderboard from Crucible

**Why separate from Crucible:** The Crucible is about PvE progression and build experimentation. The Arena is about competitive optimization. They serve different player motivations and neither should compromise for the other.

---

## 3. COMBAT SYSTEM

### 3.1 Core Loop

Combat is real-time, 2D top-down, Hades-speed. The screen shows a room with your agent and enemies. Your agent moves, attacks, and dodges autonomously based on its AI model, class behaviors, and Tenet configuration. You watch the fight unfold and intervene by triggering active abilities at the right moments.

**What the AI controls (autonomous):**
- Movement and positioning
- Basic attack execution (melee swings, ranged auto-attacks)
- Dodge timing and direction
- Target selection (which enemy to focus)
- General combat rhythm (aggression level, spacing, retreat thresholds)

**What the player controls (manual):**
- Active ability activation (3-4 abilities on cooldown, bound to hotkeys)
- Ability targeting (some abilities are directional or targeted)
- Consumable usage (health potions, buff items found during the run)

**The skill expression:** A player who triggers their AoE ability when 6 enemies are clustered will clear the room in half the time of someone who wastes it on 2 stragglers. A player who shields before a boss's telegraphed attack survives; one who doesn't, dies. A player who pops a heal during a brief safe window keeps the run going; one who panics and heals while enemies are attacking wastes it.

**The AI expression:** The same ability, triggered at the same moment, produces different results based on the AI. A "Dash Strike" command to an aggressive AI model means a head-on charge. The same command to a cautious model means a flanking maneuver. The same command to a creative model means an unexpected angle. The player learns their AI's tendencies and adjusts their command timing accordingly.

### 3.2 Enemies

Enemies should be varied enough to test different aspects of combat:

**Common enemies (floors 1-10):**
- Melee chargers (test kiting ability)
- Ranged shooters (test closing distance)
- Shielded enemies (test positioning — must hit from behind)
- Swarm enemies (small, weak, but numerous — test AoE usage)

**Advanced enemies (floors 11-20):**
- Teleporters (test reaction time)
- Healers (test target prioritization — kill the healer first)
- Bombers (explode on death — test spacing awareness)
- Mirrors (copy your agent's last ability — test adaptability)

**Elite enemies (floors 15+):**
- Mini-bosses with telegraphed special attacks
- Unique mechanics per elite type (one might create terrain hazards, another might summon adds)
- Require active ability usage to defeat efficiently

**Boss encounters (every 10th floor):**
- Large, multi-phase fights
- Boss has unique mechanics that change each phase
- Require coordinated ability usage and reading attack patterns
- Defeating a boss grants a special "Boss Modifier" — a powerful unique modifier not found in normal rooms

### 3.3 Damage and Stats

Base stats determine combat fundamentals:

- **Might** — Physical damage dealt (melee and physical ranged)
- **Arcana** — Magical/elemental damage dealt
- **Fortitude** — Damage reduction, HP pool
- **Agility** — Movement speed, dodge frequency, attack speed
- **Vitality** — Max HP, HP regeneration rate

These stats come from your agent's level, equipment, and Discipline choices. They are your permanent baseline entering any run.

---

## 4. THE DOCTRINE SYSTEM (Permanent Build)

Your agent's permanent build is defined by its Doctrine — a three-layer system that determines abilities, combat style, and AI behavior.

### 4.1 Layer 1: Combat School (chosen at agent creation)

Your broad archetype. Determines your base ability kit and your agent's default AI combat behavior. This cannot be changed after creation (you'd create a new agent).

**Vanguard** — Front-line fighter. Close range. High survivability.
- Default behavior: Charges into enemies, stays in melee range, absorbs hits
- Base kit: Heavy Strike (melee AoE), Bulwark (damage shield), Warcry (taunt + buff), Ground Slam (stun)
- Fantasy: The immovable wall. You walk into the fray and everything around you dies.

**Invoker** — Elemental caster. Ranged. Area control.
- Default behavior: Maintains distance, cycles through abilities, controls space
- Base kit: Elemental Bolt (ranged auto-upgrade), Arcane Nova (point-blank AoE), Barrier (zone denial), Surge (channel damage beam)
- Fantasy: The battlefield architect. You reshape the arena with elements.

**Phantom** — Speed fighter. Melee/ranged hybrid. Critical strikes.
- Default behavior: Darts in and out, targets weak points, avoids prolonged engagement
- Base kit: Shadow Step (teleport-strike), Fan of Blades (ranged cone), Vanish (brief invulnerability + reposition), Execution (massive single-target damage on low-HP enemy)
- Fantasy: The scalpel. Precise, fast, lethal to isolated targets.

**Warden** — Defensive specialist. Counter-attacks. Auras.
- Default behavior: Defensive positioning, waits for enemy attacks to counter, maintains aura coverage
- Base kit: Retaliate (counter-attack on next hit taken), Sanctuary (healing aura zone), Iron Will (damage reflection), Judgment (empowered strike after successful block)
- Fantasy: The patient predator. You let them come to you, then punish them.

**Artificer** — Summoner/trapper. Deployables. Battlefield manipulation.
- Default behavior: Places deployables strategically, maintains distance behind summons, repositions frequently
- Base kit: Deploy Turret (stationary damage source), Construct Drone (mobile summon that attacks), Trap Grid (area denial mines), Overdrive (empower all active deployables)
- Fantasy: The chessmaster. Your pieces fight for you.

### 4.2 Layer 2: Disciplines (equippable, 2 slots)

Within your School, you equip 2 Disciplines that specialize your abilities and unlock new ones. Disciplines can be swapped between runs (not during).

Each School has 4+ Disciplines. Equipping 2 creates a hybrid build. Certain combinations unlock unique Fusion abilities that don't exist in either Discipline alone.

**Example — Invoker Disciplines:**

- **Conflagration** (Fire) — DOT stacking, burning ground, chain reactions
  - Modifies Elemental Bolt → Fireball (applies burn DOT)
  - Modifies Arcane Nova → Inferno Ring (leaves burning ground)
  - New ability: Immolate (massive DOT on single target)

- **Permafrost** (Ice) — Slowing, freezing, shatter combos
  - Modifies Elemental Bolt → Frost Shard (slows enemies)
  - Modifies Barrier → Ice Wall (enemies that touch it freeze)
  - New ability: Shatter (frozen enemies take 300% damage and explode)

- **Tempest** (Lightning) — Chain damage, speed, unpredictability
  - Modifies Elemental Bolt → Lightning Arc (chains to nearby enemies)
  - Modifies Surge → Storm Channel (growing AoE that follows agent)
  - New ability: Thunderstrike (random high-damage bolt on any enemy in room)

- **Entropy** (Void) — Life drain, debuffs, area denial
  - Modifies Elemental Bolt → Void Bolt (drains HP, heals agent)
  - Modifies Arcane Nova → Void Rift (creates damaging zone that persists)
  - New ability: Consume (execute enemy below 20% HP, restore ability cooldowns)

**Fusion example:** Conflagration + Permafrost together unlock "Thermal Shock" — applying fire to a frozen enemy deals 300% bonus damage and creates an explosion that applies both burn and slow to nearby enemies. This fusion ability replaces one of your base kit slots.

### 4.3 Layer 3: Tenets (equippable, 4-6 slots)

Tenets are passive rules that modify BOTH your agent's AI behavior AND grant mechanical bonuses. They are the deepest layer of build customization — they literally program how your AI thinks.

Tenets are found as rare drops, crafted, or unlocked through progression. You equip 4-6 depending on agent level.

**Behavior-modifying Tenets:**
- *Strike the Wounded* — Agent prioritizes low-HP targets. +15% damage to enemies below 30% HP.
- *Patience Rewarded* — Agent waits for openings instead of spamming attacks. Ability cooldowns reduced 20%.
- *Chaos Doctrine* — Agent behaves less predictably, varies its approach. +25% crit chance, dodge patterns become erratic.
- *Bloodhound* — Agent relentlessly pursues a single target until dead before switching. +10% damage per consecutive hit on same target.
- *Ghost Protocol* — Agent maximizes distance from all enemies at all times. +30% ranged damage, -20% melee damage.

**Mechanical Tenets:**
- *Blood Price* — Abilities cost HP instead of cooldowns. All abilities available at all times.
- *Echoing Strikes* — Every 3rd ability cast repeats automatically at 50% power.
- *Opportunist* — Agent counter-attacks during enemy attack animations. Counters deal double damage.
- *Glass Cannon* — -40% max HP. +60% all damage.
- *Adaptive Plating* — After taking damage of a type, gain 20% resistance to that type for 10 seconds.

**AI-expression Tenets (these interact differently based on model quality):**
- *Improvise* — Agent can creatively combine movement and abilities in unscripted ways. Better AI models produce more creative combinations.
- *Read the Room* — Agent adjusts strategy based on enemy composition. Smarter models adapt faster.
- *Predict* — Agent attempts to anticipate enemy attacks before they happen. Quality of prediction depends on model capability.

These last three are where the "benchmark" aspect lives. They give the AI more freedom, and better models use that freedom more effectively. A basic model with "Improvise" might do nothing special. A sophisticated model might invent tactics you've never seen.

---

## 5. IN-RUN MODIFIER SYSTEM (Temporary Power Scaling)

Modifiers are temporary power-ups found ONLY during Crucible runs. They do not persist after the run ends. They are the primary source of the Hades-style "become a god by the end" power fantasy.

### 5.1 Modifier Acquisition

After each room clear, the player chooses 1 modifier from 3 random options. Options are weighted by:
- Current floor (higher floors offer more powerful modifiers)
- Current School and Disciplines (you're more likely to see modifiers that synergize with your build)
- Modifiers already collected (the system slightly favors synergy chains)

### 5.2 Modifier Categories

**Amplifiers** — More of what you already do.
- "Fireball fires 2 projectiles instead of 1"
- "AoE abilities are 40% larger"
- "Ability cooldowns reduced by 15%"
- "All damage +20%"

**Transmuters** — Add new properties to existing abilities.
- "Fire abilities leave burning ground for 3 seconds"
- "Ice abilities have a 20% chance to freeze"
- "Lightning abilities chain to 1 additional enemy"
- "Melee attacks release a shockwave on every 5th hit"

**Triggers** — Conditional effects that reward skilled play.
- "On kill: release a nova dealing 50% ATK damage"
- "On dodge: leave behind a damaging afterimage"
- "When below 30% HP: all abilities deal double damage"
- "On ability hit: 10% chance to reset that ability's cooldown"

**Agent Augments** — Modify the AI itself for the duration of the run.
- "Agent dodges 25% more frequently"
- "Agent prioritizes the nearest enemy" (changes targeting behavior)
- "Agent moves 15% faster"
- "Agent attacks 20% faster but deals 10% less damage"

**Cursed Modifiers** — Powerful but with a significant downside.
- "All abilities deal double damage. Max HP reduced by 40%."
- "Abilities have no cooldown. Each ability use costs 3% of current HP."
- "You are invulnerable for 2 seconds after killing an enemy. You take 50% more damage while not invulnerable."
- "Every room clears instantly after 10 seconds, but you take constant damage until it does."

Cursed modifiers are where AI quality becomes most visible. A good AI model can adapt its behavior to compensate for the downside (e.g., playing more carefully with reduced HP, or timing kills to maintain the invulnerability window). A weaker model cannot.

### 5.3 Modifier Stacking and Synergy

Modifiers stack and compound. This is critical to the power fantasy:

**Early run (floor 3):** "Fireball fires 2 projectiles" — Nice. Slightly more damage.

**Mid run (floor 8):** + "Fire abilities leave burning ground" — Now 2 fireballs each leave a fire trail. Double the area denial.

**Late run (floor 14):** + "Burning enemies explode on death" — Now enemies that die in the burning ground explode, which ignites OTHER enemies, who then also die and explode.

**Deep run (floor 22):** + "On kill: release a nova" + "Nova damage applies burn" — Now the chain reaction is: fireball → burn ground → enemy dies → explosion → burn on neighbors → they die → nova → nova burns → more deaths → more novas. The screen is pure chaos and your agent is the eye of the storm.

The system should support and encourage these compound chains. By floor 30+, a well-built modifier set should feel absurdly powerful — but the enemies should scale to match, creating a perpetual arms race that eventually overwhelms even the best builds.

### 5.4 Boss Modifiers

Defeating a boss (every 10th floor) grants a Boss Modifier — a unique, powerful effect not found in normal modifier pools:

- "All abilities fire in all directions simultaneously" (every 10th floor boss)
- "Your agent creates a permanent afterimage that copies all abilities at 30% power"
- "Time slows by 50% for 3 seconds after you activate any ability"
- "Enemies killed have a 20% chance to fight for you for 15 seconds before dying"

Boss Modifiers are build-defining moments. Getting one early (floor 10) shapes the entire rest of the run.

### 5.5 Modifier Extraction (Run-to-Permanent Bridge)

After completing a run (dying or choosing to extract), there is a small chance that one modifier from the run can be "crystallized" — extracted as a permanent crafting material.

This crystallized modifier can be forged onto a piece of equipment as a permanent enchantment, at reduced power:
- Run version: "Fireball fires 2 projectiles"
- Permanent enchantment: "Fireball has a 30% chance to fire a second projectile"

This creates the long-term progression loop: the best moments from your runs slowly become part of your permanent build. Players chase specific modifiers not just for the current run, but for the chance to extract them permanently.

---

## 6. EQUIPMENT AND CRAFTING (Permanent Progression)

### 6.1 Equipment Slots

Each agent has 6 equipment slots:
- **Weapon** — Primary stat stick. Determines base attack damage and type (melee/ranged). Can have ability-modifying properties.
- **Armor** — Defense and HP. Can have resistance properties.
- **Helm** — Utility slot. Ability cooldown reduction, awareness bonuses.
- **Boots** — Movement speed, dodge properties.
- **Accessory 1** — Wildcard. Can have any stat or effect.
- **Accessory 2** — Wildcard. Can have any stat or effect.

### 6.2 Equipment Rarity

- **Common (gray)** — Base stats only. No special properties.
- **Uncommon (green)** — Base stats + 1 special property.
- **Rare (blue)** — Higher base stats + 2 special properties.
- **Epic (purple)** — High base stats + 3 special properties + 1 can be a crystallized modifier enchantment.
- **Legendary (orange)** — Highest base stats + 3 special properties + 1 unique effect that cannot be found elsewhere + 1 modifier enchantment slot.

### 6.3 Equipment Sources

- **Crucible drops** — Enemies and room clears drop equipment. Higher floors = higher rarity chance.
- **Arena rewards** — Season-end rewards based on ELO ranking.
- **Crafting** — Combine materials to create targeted equipment (see below).
- **Shop** — Buy basic equipment with gold. Rotating stock.

### 6.4 Crafting System

Materials drop from Crucible runs and Arena matches. Crafting combines materials into equipment with controlled randomness.

**Material types:**
- **Ore** (physical stats) — Iron, Steel, Obsidian, Starmetal
- **Essence** (magical stats) — Flame Essence, Frost Essence, Storm Essence, Void Essence
- **Reagents** (special properties) — Various named reagents that bias the crafted item toward specific property types
- **Crystallized Modifiers** — Extracted from runs. Used to enchant equipment with permanent modifier effects.

**Crafting process:**
1. Choose a base recipe (determines equipment slot and rarity tier)
2. Add materials (ore + essence determines stat distribution)
3. Add optional reagents (bias the random properties toward desired types)
4. Craft — properties are rolled with weighted randomness based on inputs
5. Optionally enchant with a Crystallized Modifier (adds permanent modifier effect)

**The PoE/Diablo depth angle:** The crafting system should have enough material variety and recipe combinations that min-maxing a perfect piece of equipment is a long-term pursuit. Players should always have a "next upgrade" they're working toward.

---

## 7. PROGRESSION SYSTEMS

### 7.1 Agent Level

Agents gain XP from Crucible runs and Arena matches. Leveling up grants:
- Base stat increases (small, incremental)
- Additional Tenet slots (start with 4, gain more at milestone levels)
- Access to higher-tier Discipline abilities
- Unlocks new Discipline options within your School

Level is permanent and steady — you'll always be making progress even on short runs.

### 7.2 Player Account Progression

Separate from agent level. Account progression unlocks:
- New Combat Schools (start with 2, unlock the rest)
- Crafting recipe tiers
- Cosmetic options
- Multiple agent slots (eventually run different agents with different builds)
- Access to harder Crucible variants

### 7.3 Crucible Depth Records

Your deepest Crucible run is your badge of honor. The leaderboard shows:
- Deepest floor reached
- Time taken to reach that floor
- Agent School, Disciplines, and model used
- Key modifiers collected during the run (viewable by others for build inspiration)

This creates a meta-game where players study high-depth builds to learn optimal modifier chains and Doctrine configurations.

### 7.4 Arena Seasons

The Arena runs on competitive seasons (e.g., monthly). Each season:
- ELO resets (soft reset — compression toward median)
- New seasonal rewards at rank thresholds
- Seasonal leaderboard tracking
- End-of-season cosmetics and exclusive equipment

---

## 8. THE AI AGENT SYSTEM

### 8.1 Model Selection

At agent creation, the player selects which AI model powers their agent. Options could include:
- Models provided by the platform (e.g., Claude Sonnet, Claude Haiku)
- Player-provided API keys for other models
- Potentially fine-tuned or specialized models for combat

The model choice is the "nature" of the agent — its fundamental approach to problem-solving that influences all combat behavior.

### 8.2 AI Decision Framework

The AI model receives a combat state (simplified) every game tick and outputs a decision:
- Current position, HP, cooldown states
- Enemy positions, types, HP, current actions
- Room layout (walls, obstacles, hazards)
- Active modifiers and their effects
- Equipped Tenets (as behavior instructions)

The model outputs:
- Movement direction
- Whether to dodge (and which direction)
- Basic attack target
- Any autonomous behavior adjustments

The key constraint: the AI makes decisions fast. The game runs at action-game speed, so the decision framework needs to be lightweight enough for real-time (or near-real-time with interpolation). This likely means a simplified prompt per tick, not a full conversation.

### 8.3 The "Benchmark" Aspect

Agent Arena naturally benchmarks AI models through gameplay:
- **Spatial reasoning** — Can the model position effectively in a room full of enemies and hazards?
- **Prioritization** — Does the model focus the right targets?
- **Adaptation** — When a Cursed Modifier changes the rules, does the model adjust?
- **Creativity** — With the "Improvise" Tenet, does the model find novel tactics?
- **Consistency** — Does the model perform reliably across many runs, or is it erratic?

This isn't marketed as a benchmark — it's marketed as a game. But the data it generates about model capabilities is genuinely valuable. Players naturally gravitate toward the models that "feel" best to command, creating organic model comparison data.

---

## 9. VISUAL AND AUDIO DIRECTION

### 9.1 Art Style

The game uses the "Torch-Lit Arena" aesthetic defined in the Visual Design Bible:
- Dark fantasy underground setting
- Warm firelight against dark stone
- Gold as the primary accent color
- Reference games: Hades, Slay the Spire, Darkest Dungeon, Diablo

The Crucible should feel like descending into an ancient underground coliseum that shifts and changes with depth:
- **Floors 1-10:** Cool stone, blue-gray tones, dim torchlight. The upper chambers.
- **Floors 11-20:** Warm amber, more fire, crumbling architecture. The deep halls.
- **Floors 21-30:** Crimson and purple, lava glow, corrupted stone. The depths.
- **Floors 31+:** Near-black with dramatic highlights, alien geometry, void energy. The abyss.

### 9.2 Combat Visual Feedback

Real-time combat needs clear, satisfying visual feedback:
- **Hit confirmation:** Screen shake (subtle), damage number floats, brief flash on the hit entity
- **Ability activation:** Distinct visual effect per ability, brief "charge" animation before release
- **Critical hits:** Larger damage numbers, gold color, stronger screen shake
- **Kills:** Brief slow-mo (50ms), death particle burst, XP/gold pickup animations
- **Modifier proc:** When a modifier triggers (e.g., "on kill: nova"), a distinct visual effect plays. The player should always understand WHY something happened.
- **Low HP:** Screen edge vignette (red), heartbeat visual pulse
- **Power fantasy moments:** When chain reactions happen (explosions causing more explosions), the visual effects should compound visibly — the screen should look like controlled chaos

### 9.3 UI During Combat

The combat HUD should be minimal and game-like, never web-app-like:
- **Top left:** Agent HP bar, small level indicator, floor number
- **Top right:** Run timer, enemy count remaining
- **Bottom center:** Ability bar (3-4 abilities with cooldown overlays, bound to Q/W/E/R or 1/2/3/4)
- **Bottom left:** Consumable slots (if any)
- **Bottom right:** Minimap (if applicable)
- **Center (on demand):** Modifier selection UI (appears between rooms, 3 cards to choose from, then disappears)

The modifier selection should feel like a Hades boon moment — a brief pause where you see 3 options, each with a clear icon, name, and short description. The choice feels weighty. Then you pick and combat resumes immediately.

---

## 10. GAME FLOW SUMMARY

### New Player Experience
1. Create account
2. Choose first Combat School (2 available initially)
3. Select AI model
4. Tutorial run in the Crucible (guided, ~5 floors, teaches ability timing)
5. First real Crucible run
6. Unlock Discipline selection after first run
7. Begin crafting and equipment progression

### Session Loop (Returning Player)
1. Review agent in War Room (dashboard) — check stats, equipment, Doctrine
2. Optionally visit Armory — craft, equip, adjust Disciplines and Tenets
3. Enter the Crucible — push for depth
4. Die — review run results, see rewards, check for modifier extraction
5. Upgrade equipment with new materials
6. Optionally enter the Arena for PvP matches
7. Repeat

### Long-Term Loop
- Push Crucible depth → better loot → stronger builds → push deeper
- Craft perfect equipment pieces → optimize for specific modifier synergies
- Experiment with different Discipline combinations
- Try different AI models to find your preferred playstyle
- Compete on seasonal Arena leaderboards
- Chase rare Tenet drops and Legendary equipment

---

## 11. WHAT THIS GAME IS NOT

To prevent scope creep and design drift, here is what Agent Arena explicitly does NOT try to be:

- **Not an MMO.** No persistent shared world, no guilds, no raids. Multiplayer is limited to PvP Arena and passive features (Echoes, spectating — if implemented later).
- **Not a full RPG.** No quest system, no NPCs with dialogue trees, no branching storyline. The narrative is environmental and implied through the setting.
- **Not a deckbuilder.** Abilities and modifiers are selected from lists, not drawn from a deck. There is no hand management or draw RNG.
- **Not an auto-battler.** The player has significant real-time input through ability timing. Passive observation is possible on early floors but insufficient for deep runs.
- **Not a sandbox.** The Crucible is a structured, designed experience. Player creativity expresses through build decisions, not world manipulation.

---

## 12. OPEN QUESTIONS

These are decisions that should be explored through prototyping rather than decided in a document:

1. **AI tick rate:** How often does the AI model make decisions? Every frame is too expensive. Every 500ms might feel sluggish. The right number probably emerges from playtesting.

2. **Modifier pool size:** How many total modifiers should exist? Too few = runs feel samey. Too many = impossible to find synergies. Start with ~60-80 and expand.

3. **Discipline balance:** With 5 Schools × 4+ Disciplines × mix-and-match, the balance surface is huge. Accept that some combinations will be stronger and use the adaptive Trial floors to prevent total dominance.

4. **Death penalty:** Currently death = run ends, keep all materials earned. Should there be a risk mechanic (lose some materials on death)? Or is the time investment enough of a stake?

5. **AI behavior observability:** How much should the player understand about WHY their AI made a specific decision? Too opaque = frustrating. Too transparent = just feels like programming. Finding the right level of "readable but surprising" is key.

6. **Spectator features / Echoes:** The earlier concepts of watching other players' runs and encountering ghost data from dead runs are compelling but not core to launch. Should be explored as a post-launch feature.
