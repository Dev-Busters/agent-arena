# 🎮 AGENT ARENA: 3D ROGUELIKE TRANSFORMATION PLAN

**Objective**: Transform Agent Arena dungeon mode from text-based to a high-fidelity, real-time 3D roguelike inspired by Hades, Diablo, Path of Exile, and Borderlands.

**Timeline**: 8-12 weeks (phased delivery)  
**Budget**: ~$12-15 (Sonnet heavy, Opus for balancing)  
**Target**: Production-ready 3D roguelike with deep loot/progression systems

---

## 📊 STRATEGIC ARCHITECTURE

```
┌─────────────────────────────────────────────────────┐
│  CLIENT (React + Three.js)                          │
│  ├─ Zustand State (Real-time sync)                  │
│  ├─ 3D Scene (Three.js + Shaders)                   │
│  ├─ UI Layer (HUD, Inventory, Skills)               │
│  └─ Input Handler (Keyboard/Mouse)                  │
├─────────────────────────────────────────────────────┤
│  BACKEND (Node.js + Socket.io)                      │
│  ├─ Real-time State Sync                            │
│  ├─ Loot Generation Engine                          │
│  ├─ Enemy AI & Scaling                              │
│  ├─ Skill Tree Logic                                │
│  └─ Progression Tracking                            │
├─────────────────────────────────────────────────────┤
│  DATABASE (PostgreSQL)                              │
│  ├─ Loot Templates & Rarities                       │
│  ├─ Skill Trees & Builds                            │
│  ├─ Dungeon Runs & Progress                         │
│  └─ Agent Stats & Progression                       │
└─────────────────────────────────────────────────────┘
```

---

## 📋 PHASE-BY-PHASE BREAKDOWN

### **PHASE 1: STATE ARCHITECTURE & REAL-TIME SYSTEMS** (Week 1-2)
High-performance real-time state management using Zustand

**P1.1** - Zustand Store Architecture
- Create main game state store (Zustand)
- Implement agent state (HP, mana, status effects)
- Implement dungeon state (current room, enemies, loot)
- Implement inventory state (items, equipment, crafting materials)
- Real-time state synchronization with backend
- **Tokens**: 8000 | **Cost**: $0.20 | **Priority**: CRITICAL

**P1.2** - Socket.io Real-time Sync
- Refactor backend for optimized event emission
- Implement server-side state snapshots
- Client-side interpolation for smooth animations
- Conflict resolution for simultaneous actions
- Connection recovery & state resync
- **Tokens**: 6000 | **Cost**: $0.15 | **Priority**: CRITICAL

**P1.3** - Player Input Handler
- Keyboard input system (WASD movement, abilities)
- Mouse input for targeting/UI interaction
- Ability keybinding system
- Input buffering for fast actions
- **Tokens**: 4000 | **Cost**: $0.10 | **Priority**: HIGH

**P1.4** - Network Optimization
- State delta compression (only send changed values)
- Event batching to reduce packet count
- Client prediction for immediate feedback
- Latency compensation
- **Tokens**: 5000 | **Cost**: $0.12 | **Priority**: HIGH

---

### **PHASE 2: 3D RENDERING ENGINE** (Week 3-4)
Three.js scene with advanced graphics

**P2.1** - Three.js Scene Setup
- Initialize Three.js renderer with WebGL
- Scene/camera/lighting foundation
- Orthographic camera for dungeon isometric view
- Viewport resizing & responsive scaling
- Performance profiling setup
- **Tokens**: 4000 | **Cost**: $0.10 | **Priority**: CRITICAL

**P2.2** - Dungeon Environment Generation
- Procedurally generated room geometry
- Wall/floor/ceiling mesh generation
- Tile-based room layout in 3D
- Dynamic lighting per room
- Fog of war system
- **Tokens**: 8000 | **Cost**: $0.20 | **Priority**: CRITICAL

**P2.3** - Character Models & Animation
- Player agent 3D model (or glyph-style representation)
- Enemy models for each type (goblin, orc, skeleton, etc.)
- Walk/run/attack/death animations
- Ragdoll physics for defeats
- Particle systems for ability effects
- **Tokens**: 10000 | **Cost**: $0.25 | **Priority**: HIGH

**P2.4** - Advanced Shaders & Materials
- Custom shader for item rarity (glow effects)
- Normal mapping for detailed surfaces
- Specular maps for shininess variation
- PBR (Physically-Based Rendering) materials
- Shader-based status effect visualization
- **Tokens**: 7000 | **Cost**: $0.18 | **Priority**: HIGH

**P2.5** - Post-Processing & Effects
- Bloom effect for magical items/abilities
- Depth of field for cinematic feel
- Motion blur during fast actions
- Film grain for atmospheric tone
- Chromatic aberration for "hit" feedback
- **Tokens**: 6000 | **Cost**: $0.15 | **Priority**: MEDIUM

**P2.6** - Lighting System
- Dynamic lighting from torches/magic
- Shadow casting & soft shadows
- Light attenuation with distance
- Baked lightmaps for performance
- Light color variation by room type
- **Tokens**: 5000 | **Cost**: $0.12 | **Priority**: HIGH

**P2.7** - Camera & View System
- Smooth camera following agent
- Zoom controls (mouse wheel)
- Orthographic isometric perspective (Hades-style)
- Camera shake on impacts/abilities
- Mini-map rendering
- **Tokens**: 4000 | **Cost**: $0.10 | **Priority**: HIGH

---

### **PHASE 3: DEEP LOOT SYSTEM** (Week 5-6)
Procedural item generation with thousands of permutations

**P3.1** - Loot Archetype System
- Define base item archetypes (swords, armor, rings, etc.)
- Item type classification & categorization
- Stat templates per archetype
- Base stat ranges & variance
- **Tokens**: 5000 | **Cost**: $0.12 | **Priority**: CRITICAL

**P3.2** - Rarity & Tiering System
- Implement 8+ rarity tiers (Common → Legendary → Mythic)
- Stat roll ranges per rarity
- Affix pool (prefix + suffix modifiers)
- Rarity color coding & visual feedback
- Loot table definitions per dungeon floor
- **Tokens**: 6000 | **Cost**: $0.15 | **Priority**: CRITICAL

**P3.3** - Procedural Affix Generation
- Procedural prefix library (30+ prefixes)
- Procedural suffix library (40+ suffixes)
- Affix interaction rules (prevent contradictions)
- Weighted affix selection by rarity
- Affix value ranges & scaling
- **Tokens**: 7000 | **Cost**: $0.18 | **Priority**: CRITICAL

**P3.4** - Unique Item Database
- Design 50+ unique items with special mechanics
- Unique item drop rules (rarity, floor restrictions)
- Set items (3-5 item sets with bonuses)
- Legendary affixes (exclusive to rares/uniques)
- **Tokens**: 5000 | **Cost**: $0.12 | **Priority**: HIGH

**P3.5** - Loot Generation Engine
- Seeded RNG for consistent loot
- Item generation on enemy defeat
- Chest/room treasure generation
- Loot scaling by enemy level/floor
- Rarity distribution curves
- **Tokens**: 6000 | **Cost**: $0.15 | **Priority**: CRITICAL

**P3.6** - Item Display & Comparison
- Detailed item tooltip system
- Stat comparison when hovering (equipped vs. pickup)
- Item color/glow based on rarity
- Item icon generation or asset system
- **Tokens**: 4000 | **Cost**: $0.10 | **Priority**: HIGH

**P3.7** - Crafting System Architecture
- Crafting recipe database
- Item combination rules
- Enhancement/upgrade mechanics
- Material component tracking
- Crafting result calculation
- **Tokens**: 6000 | **Cost**: $0.15 | **Priority**: HIGH

**P3.8** - Inventory Management
- Inventory UI (grid-based like Diablo)
- Item sorting & filtering
- Quick equip/unequip
- Item stashing system
- Weight/encumbrance mechanics
- **Tokens**: 4000 | **Cost**: $0.10 | **Priority**: MEDIUM

---

### **PHASE 4: PROGRESSION & BUILD SYSTEMS** (Week 7-8)
Deep skill trees and character progression

**P4.1** - Skill Tree Architecture
- Design 3+ distinct skill trees (per class or universal)
- Skill node types (passive, active, keystones)
- Skill point allocation system
- Respec mechanics & costs
- Skill unlock conditions (level gates)
- **Tokens**: 8000 | **Cost**: $0.20 | **Priority**: CRITICAL

**P4.2** - Passive Skill System
- Passive stat bonuses (% increases)
- Multiplicative & additive stat scaling
- Passive interaction rules
- Scaling calculations engine
- **Tokens**: 5000 | **Cost**: $0.12 | **Priority**: HIGH

**P4.3** - Active Ability System
- Ability templates (damage, heal, utility)
- Cooldown & mana management
- Ability scaling by character stats
- Ability upgrade paths
- Combo system (chained abilities)
- **Tokens**: 7000 | **Cost**: $0.18 | **Priority**: CRITICAL

**P4.4** - Build Synergy Engine
- Calculate build multipliers & bonuses
- Synergy detection (e.g., fire damage + fire skills)
- Build recommendation system
- Stat conversion mechanics
- **Tokens**: 6000 | **Cost**: $0.15 | **Priority**: HIGH

**P4.5** - Experience & Leveling
- XP gain formulas (enemy level scaling)
- Level-up progression curve
- Attribute point allocation per level
- Skill point rewards
- Level gating for dungeons
- **Tokens**: 4000 | **Cost**: $0.10 | **Priority**: HIGH

**P4.6** - Dungeon-to-Crafting Loop
- Better loot on deeper floors
- Crafting recipes unlock with progression
- Gear requirements for further dungeons
- Upgrade chains (craft → use → farm better loot → craft stronger)
- **Tokens**: 5000 | **Cost**: $0.12 | **Priority**: CRITICAL

**P4.7** - Ascension/Prestige System
- New Game+ mode with scaling
- Prestige points from runs
- Permanent unlocks & bonuses
- Season leaderboards
- **Tokens**: 4000 | **Cost**: $0.10 | **Priority**: MEDIUM

---

### **PHASE 5: REAL-TIME COMBAT LOOP** (Week 9-10)
Fluid, addictive Hades-style combat

**P5.1** - Action Combat System
- Real-time movement & collision detection
- Attack animations with hit feedback
- Knockback & knockdown mechanics
- Invulnerability frames after damage
- Attack speed scaling from stats
- **Tokens**: 8000 | **Cost**: $0.20 | **Priority**: CRITICAL

**P5.2** - Enemy AI Overhaul
- Behavior tree system for enemy decisions
- Difficulty-scaled AI patterns
- Boss-specific attack patterns
- Enemy communication (group tactics)
- Weakness/vulnerability systems
- **Tokens**: 7000 | **Cost**: $0.18 | **Priority**: CRITICAL

**P5.3** - Damage & Hit Calculation
- Critical strike system (chance & multiplier)
- Dodge & evasion mechanics
- Armor & mitigation formula
- Elemental damage & resistances
- Damage type interactions
- **Tokens**: 5000 | **Cost**: $0.12 | **Priority**: CRITICAL

**P5.4** - Status Effects Expansion
- Expand effect types (20+ effects)
- Visual indicators for each effect
- Effect duration & potency scaling
- Immunity/resistance mechanics
- Effect interactions (stacking rules)
- **Tokens**: 6000 | **Cost**: $0.15 | **Priority**: HIGH

**P5.5** - Ability Effects & Visuals
- Particle effects for each ability
- Sound design integration
- Screen shake & juice
- Health bar animations
- Damage number popups (floating text)
- **Tokens**: 6000 | **Cost**: $0.15 | **Priority**: HIGH

**P5.6** - HUD & Real-time Feedback
- Health/mana bars with smooth animation
- Ability cooldown display
- Status effect icons with duration
- Combat log (recent actions)
- DPS/healing meters
- **Tokens**: 4000 | **Cost**: $0.10 | **Priority**: HIGH

**P5.7** - Sound & Music System
- Background music per room type
- Combat encounter music
- Ability sound effects
- Enemy sound effects
- UI sound feedback
- **Tokens**: 3000 | **Cost**: $0.08 | **Priority**: MEDIUM

---

### **PHASE 6: PROCEDURAL GENERATION & REPLAYABILITY** (Week 11)
Long-term depth & variation

**P6.1** - Advanced Dungeon Generation
- Biome-based room themes (cave, lava, ice, etc.)
- Room feature enrichment (traps, hazards, chests)
- Enemy distribution per biome
- Boss encounter design
- Secret rooms & hidden areas
- **Tokens**: 7000 | **Cost**: $0.18 | **Priority**: CRITICAL

**P6.2** - Dynamic Enemy Scaling
- Per-floor difficulty curves
- Player stat-aware scaling
- Rare enemy spawns with bonuses
- Champion enemies (super-powered variants)
- Scaling verification & balance
- **Tokens**: 5000 | **Cost**: $0.12 | **Priority**: CRITICAL

**P6.3** - Seeded Run System
- Run seed generation & recording
- Leaderboard submission with seed
- Community seed sharing
- Speedrun tracking
- **Tokens**: 3000 | **Cost**: $0.08 | **Priority**: MEDIUM

**P6.4** - Procedural Depth
- Thousands of unique item permutations
- Enemy spawn variety
- Room layout variation
- Special event generation (random encounters)
- **Tokens**: 4000 | **Cost**: $0.10 | **Priority**: HIGH

---

### **PHASE 7: POLISH & OPTIMIZATION** (Week 12)
Performance, balance, and production readiness

**P7.1** - Performance Optimization
- Three.js rendering optimization
- Mesh/geometry batching
- Level-of-detail (LOD) system
- Asset loading & streaming
- Memory profiling & cleanup
- **Tokens**: 6000 | **Cost**: $0.15 | **Priority**: HIGH

**P7.2** - Game Balance (Opus)
- Balance pass on loot drops
- Enemy difficulty tuning
- Skill/ability balance
- Progression curve review
- Win rate analysis
- **Tokens**: 10000 | **Cost**: $0.25 | **Priority**: CRITICAL

**P7.3** - Bug Fixes & Polish
- Critical bug fixes
- Edge case handling
- Input responsiveness
- Network stability improvements
- UI polish & refinement
- **Tokens**: 5000 | **Cost**: $0.12 | **Priority**: HIGH

**P7.4** - Accessibility & Localization
- Color blind modes
- Difficulty presets
- Key remapping options
- Subtitle support
- **Tokens**: 3000 | **Cost**: $0.08 | **Priority**: MEDIUM

---

## 📊 TASK SUMMARY

| Phase | Focus | Tasks | Est. Tokens | Est. Cost |
|-------|-------|-------|-------------|-----------|
| P1 | State & Real-time | 4 | 23,000 | $0.58 |
| P2 | 3D Rendering | 7 | 44,000 | $1.10 |
| P3 | Deep Loot | 8 | 43,000 | $1.08 |
| P4 | Progression | 7 | 39,000 | $0.98 |
| P5 | Combat | 7 | 39,000 | $0.98 |
| P6 | Replayability | 4 | 19,000 | $0.48 |
| P7 | Polish | 4 | 24,000 | $0.60 |
| **TOTAL** | | **41 Tasks** | **231,000** | **$5.80** |

---

## 🎯 SUCCESS CRITERIA

✅ **3D Environment**: Fully rendered procedural dungeons with dynamic lighting  
✅ **Loot System**: 10,000+ unique item permutations generated correctly  
✅ **Progression**: Deep skill trees with synergistic build options  
✅ **Combat**: Real-time, 60 FPS, responsive player actions  
✅ **Replayability**: 100+ hour+ sessions with meaningful variation  
✅ **Polish**: Production-ready visuals, sound, and UI  
✅ **Performance**: 60 FPS on mid-range devices  

---

## 📅 DELIVERY MILESTONES

- **Week 2**: State management + Socket.io working, real-time sync
- **Week 4**: 3D dungeon rendering with player + basic enemies
- **Week 6**: Loot generation working, inventory UI functional
- **Week 8**: Skill trees + progression loop playable
- **Week 10**: Full combat loop with all systems integrated
- **Week 11**: Procedural generation + replayability features
- **Week 12**: Polish, balance, production deployment

---

## 🚀 IMPLEMENTATION NOTES

- **Web Dev Master Skill**: Apply architecture patterns for state management & React components
- **Game Dev Master Skill**: Use for 3D rendering, real-time systems, loot design
- **Three.js Focus**: Orthographic isometric view (inspired by Hades & Diablo)
- **Loot Inspiration**: Borderlands (8+ rarities), PoE (affixes), Diablo (unique items)
- **Combat Inspiration**: Hades (real-time, fluid), Diablo (tactical), PoE (build depth)
- **Progression Loop**: Lower floors → better loot → craft → deeper dungeons → stronger gear

---
