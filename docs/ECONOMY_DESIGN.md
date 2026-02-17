# Agent Arena — Economy Design

> **Purpose**: This document defines how gold, materials, and equipment flow through Agent Arena.
> It is the implementation blueprint for Phases G and H.
>
> **Status**: Design complete. Systems not yet built (stubbed in agentLoadout store).

---

## 1. DESIGN PHILOSOPHY

The economy has one core tension: **spend now to survive, or save for permanence**.

- Gold earned inside a Crucible run is risky — you might die and lose the run
- Equipment and permanent upgrades bought between runs survive forever
- Every gold decision is meaningful because you can always use it right now OR defer it

The loop: Fight deeper → earn more → buy better → fight even deeper.

---

## 2. GOLD FLOW

### Earning Gold (In-Run)

| Source                         | Amount            | Notes                                    |
|-------------------------------|-------------------|------------------------------------------|
| Enemy kill                     | 5–15 gold         | Random roll; higher floors = higher roll |
| Room clear bonus               | 25–50 gold        | All enemies defeated                     |
| Elite room clear bonus         | 75–125 gold       | Elite rooms give premium clear reward    |
| Floor completion bonus         | 100 × floor#      | Floor 3 = 300 gold bonus                 |
| Boss kill bonus                | 500 gold          | Every 10th floor boss                    |
| Treasure room node             | 150–300 gold      | Fixed reward from floor map              |

### Spending Gold (In-Run — Dungeon Shop Nodes)

| Item                            | Cost              | Effect                                         |
|---------------------------------|-------------------|------------------------------------------------|
| Common modifier                 | 50 gold           | Choose 1 of 3 (same as room-clear selection)   |
| Rare modifier                   | 125 gold          | One guaranteed rare                            |
| Small health potion             | 25 gold           | Restore 25% max HP                             |
| Large health potion             | 60 gold           | Restore 60% max HP                             |
| Damage flask                    | 40 gold           | +25% damage for 3 rooms                        |
| Modifier re-roll                | 25 gold (first), +25 each | Re-roll the 3 modifier choices          |
| Modifier removal                | 100 gold          | Remove one active (bad) modifier               |

### Spending Gold (Between Runs — War Room)

| Item                            | Cost              | Effect                                         |
|---------------------------------|-------------------|------------------------------------------------|
| Rotating equipment stock        | 200–2,000 gold    | 3 items refresh daily                          |
| Crafting materials (basic)      | 50–200 gold       | Iron Ore, Leather Strips, etc.                 |
| Crafting materials (rare)       | 300–800 gold      | Flame Essence, Shadow Cloth, etc.              |
| Forge recipe unlock             | 150–500 gold      | Permanent recipe discovery                     |

### Gold Persistence

- Gold earned **during a run** is added to persistent gold on run end (win or die)
- There is no "run gold" vs "permanent gold" — all gold is the same pool
- This means a run where you die at Floor 1 still earns persistent gold from kills

---

## 3. MATERIAL FLOW

### Earning Materials

| Source                          | Drop Type                              | Notes                                  |
|---------------------------------|----------------------------------------|----------------------------------------|
| Enemy kills                     | 5–15% chance per kill                  | Common materials (Iron Ore, etc.)      |
| Elite room clear                | Guaranteed 1–2 materials               | Better quality than standard kills     |
| Boss kill                       | Guaranteed 2–4 materials               | Rare/exotic materials                  |
| Treasure room nodes             | 1–3 materials (player choice)          | Pick from 3 options                    |
| Modifier crystallization        | 5–10% chance to crystallize a modifier | Run ends → modifier → Crystallized form|
| War Room shop                   | Buy with gold (see above)              | Guaranteed material, known type        |

### Material Catalog (Initial Set)

| Material           | Tier     | Source                    | Used For                          |
|--------------------|----------|---------------------------|-----------------------------------|
| Iron Ore           | Common   | Any enemy                 | Basic weapons and armor           |
| Leather Strips     | Common   | Any enemy                 | Basic armor and boots             |
| Bone Shard         | Common   | Skeletons/undead          | Accessories, secondary stats      |
| Flame Essence      | Uncommon | Demon-type enemies        | Fire-damage weapons, offense gear |
| Shadow Cloth       | Uncommon | Elite rooms, bosses       | Phantom-class equipment           |
| Runestone Fragment | Uncommon | Elite rooms, treasure     | Magic-stat gear, Invoker equipment|
| Warden's Steel     | Rare     | Warden boss kill only     | Legendary weapon recipes          |
| Crystallized Mod   | Varies   | Run modifier extraction   | Enchanting equipment permanently  |

### Material Persistence

- All materials persist between runs in the `agentLoadout.materials` array
- Materials survive deaths — they are always yours once collected

---

## 4. EQUIPMENT FLOW

### Earning Equipment

| Source                          | Rarity Range      | Notes                                         |
|---------------------------------|-------------------|-----------------------------------------------|
| Post-elite room drop            | Common–Rare       | 30% drop chance per elite clear               |
| Post-boss drop                  | Rare–Epic         | Guaranteed 1 drop per boss kill               |
| Craft at the Forge              | Common–Legendary  | Deterministic recipe + random stat rolls      |
| War Room rotating shop          | Common–Epic       | Buy directly with gold, 3 daily slots         |

### Equipment Slots (6 total)

```
Weapon      — MIGHT bonus, attack speed, crit multiplier
Armor       — FORTITUDE bonus, damage reduction
Helm        — VITALITY bonus, max HP
Boots       — AGILITY bonus, movement speed
Accessory 1 — Flexible: any stat bonus OR special passive
Accessory 2 — Flexible: any stat bonus OR special passive
```

### Stat Mapping

| Equipment Stat | In-Game Stat       | Effect                                          |
|----------------|--------------------|-------------------------------------------------|
| Might          | Damage multiplier  | Scales agent attack damage                      |
| Fortitude      | Damage reduction   | % of incoming damage blocked                    |
| Vitality       | Max HP             | Added to base HP from school + disciplines      |
| Agility        | Speed multiplier   | Scales agent movement and attack speed          |
| Arcana         | Blast radius/CDR   | Larger area abilities, shorter cooldowns        |

### Rarity System

Per Visual Design Bible (consistent colors everywhere):

| Rarity    | Color    | Drop Source         | Stat Range               |
|-----------|----------|---------------------|--------------------------|
| Common    | Gray     | Enemy drops, shop   | +5–10% stats             |
| Uncommon  | Green    | Elite rooms, shop   | +10–20% stats            |
| Rare      | Blue     | Boss drops, forge   | +20–35% stats            |
| Epic      | Purple   | Boss drops, forge   | +35–55% stats + 1 passive|
| Legendary | Orange   | Forge only (rare)   | +55–80% stats + 2 passives|

### Crafting at the Forge

Recipes require specific materials + gold cost. Stats on crafted gear are partially randomized:

```
RECIPE: Iron Sword (Weapon, Common)
  Requires: 3× Iron Ore + 50 gold
  Output:   Weapon with Might +8–12% (random in range)

RECIPE: Flame Blade (Weapon, Rare)
  Requires: 2× Iron Ore + 1× Flame Essence + 200 gold
  Output:   Weapon with Might +25–35% + Flame passive (fire damage on crit)

RECIPE: Shadow Garb (Armor, Uncommon)
  Requires: 2× Leather Strips + 1× Shadow Cloth + 100 gold
  Output:   Armor with Fortitude +15–25% + Agility +8–12%
```

### Equipment Upgrade

Raise rarity tier of existing equipment:

```
Common → Uncommon:  2× same material tier + 75 gold
Uncommon → Rare:    3× same material tier + 150 gold
Rare → Epic:        4× rare material + 400 gold
Epic → Legendary:   5× rare material + 1× exotic material + 1,000 gold
```

### Modifier Enchantment

Crystallized Modifiers from runs can permanently enchant equipment:

```
Crystallized "Crushing Blow" (Amplifier):
  Effect: +20% damage on first hit in each room (50% of run version's power)
  Apply to: Weapon slot only
  Cost: 200 gold
```

One enchantment slot per piece of equipment. Enchantments are permanent.

---

## 5. HOW SYSTEMS SYNERGIZE

```
Play Crucible runs
  → Earn gold + materials + XP during the run
  → Run ends (win or die) → gold + materials + XP saved to persistent store

Persistent gold accumulates
  → Spend in War Room shop on equipment or materials
  → Spend at the Forge to craft equipment

Materials accumulate
  → Craft specific equipment recipes at the Forge
  → Higher materials = higher rarity craftable items

Equipment improves agent stats
  → Higher VITALITY = survive deeper floors
  → Higher MIGHT = clear rooms faster = more gold per run
  → Higher AGILITY = more reactive to trial floor compositions

Stronger agent reaches deeper floors
  → Floor 5: Invoker school unlocks (new playstyle)
  → Floor 10: Phantom school unlocks + better loot tables
  → Floor 10: Boss drop is always Rare+ equipment
  → Deeper floors = more gold per clear = faster economy acceleration

New schools unlock new build possibilities
  → Different school = different discipline trees
  → Different disciplines change modifier synergies
  → Different modifier knowledge refines future run strategies

Run modifiers stack and interact
  → Deep knowledge of interactions = intentional build selection
  → Crystallized modifiers from lucky runs become permanent enchantments

Permanent enchantments compound everything
  → An epic weapon with Crushing Blow enchant + Executioner tenet + high-MIGHT school
  → Is a coherent damage build that plays differently from a survivability build

The loop deepens every cycle:
more equipment options → more viable builds → more interesting run decisions
→ deeper floors → better drops → stronger equipment → repeat
```

---

## 6. ECONOMY BALANCE TARGETS

These are tuning targets for Phase G implementation, not final values:

| Metric                            | Target                                |
|-----------------------------------|---------------------------------------|
| Gold per Floor 1 clear            | ~150–250 gold total                   |
| Cost of first useful shop item    | ~200 gold (reachable in 1–2 runs)     |
| Time to first crafted item        | 3–5 runs (material accumulation)      |
| Time to first Rare item           | 8–12 runs                             |
| Gold per Floor 10 run (survived)  | ~2,000–4,000 gold                     |
| Max reasonable gold per run       | ~8,000–10,000 (Floor 15+ clear)       |

The goal: a new player should see their first shop purchase within 2–3 runs, and craft their first item within a week of casual play.

---

## 7. IMPLEMENTATION ORDER (Phase G)

```
G1: Equipment slots + base stat display (War Room Armory)
G2: Enemy drops + inventory grid (collect equipment from runs)
G3: Crafting system (materials + recipes + stat rolls)
G4: Modifier extraction + enchantment system

H4/H5: Supabase schema for equipment + materials (Phase H)
H5: Gold/material sync to backend
```

---

*This document is the source of truth for all economy decisions in Phases G–H.*
*When in doubt about a drop rate, cost, or stat range: refer here first, then adjust with data.*
