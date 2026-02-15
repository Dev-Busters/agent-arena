# Agent Arena - Architecture

**Last updated:** 2026-02-15 (after Phases A-C)

## What Currently Works

Agent Arena is a **2D top-down roguelike arena game** where players control an agent fighting waves of enemies. The game runs in the browser using PixiJS for rendering and React for UI overlays.

### ✅ Working Features (Phases A-C Complete)

**Phase A - Foundation:**
- PixiJS 7.4.3 canvas renders at `/arena` route
- 64x64 tiled floor across arena (4 color variations)
- 16px wall boundaries with highlight/shadow effects
- Blue player sprite (circle) at center with direction indicator
- WASD + Arrow key movement with diagonal normalization
- Camera smoothly follows player (lerp)
- Wall collision detection

**Phase B - Enemies & Combat:**
- 3 enemy types spawn (goblin/skeleton/demon - green/gray/red diamonds)
- Enemies chase player with AI (move toward player position)
- SPACE bar attack system (60px range, 10 damage, 300ms cooldown)
- Yellow circle attack effect
- Health bars above enemies (green → yellow → red based on HP%)
- Enemies die when HP reaches 0 (removed from stage)
- Scale flash effect on hit

**Phase C - Polish:**
- React HUD overlay with glassmorphism styling
  - Player health bar with color transitions
  - Wave counter
  - Kill counter
  - Enemies remaining counter
  - Pause/resume button
  - Controls hint (bottom-left)
- Particle system (PixiJS Graphics)
  - Yellow hit sparks (6 particles)
  - Color-coded death bursts (12 particles)
  - Particles fade out and shrink over time
- Synthesized sound effects (Web Audio API)
  - Attack sound (sawtooth wave)
  - Hit sound (square wave)
  - Death sound (3-tone sequence)
  - No audio files required

**Controls:**
- WASD / Arrow Keys: Move player
- SPACE: Attack
- Pause button in HUD: Pause/resume game

---

## Tech Stack (Current)

```
Frontend:
  Framework:   Next.js 14 (React, TypeScript)
  Rendering:   PixiJS 7.4.3 (2D WebGL)
  UI:          React components, Tailwind CSS, framer-motion
  Routing:     Next.js app router (/arena route)
  Dev Server:  Port 3002
  Hosting:     Vercel (planned)

Backend:
  Runtime:     Node.js (Express, TypeScript)
  Status:      Exists but not connected to arena yet
  Hosting:     Railway (planned)

Database:
  Type:        PostgreSQL (Supabase)
  Status:      Not connected yet
```

**Note:** Phases A-C focused on visual rendering and game loop. Backend integration starts in Phase D.

---

## File Structure (Current)

```
agent-arena/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── arena/
│   │   │   │   └── page.tsx           # Main game page (220 lines)
│   │   │   └── ...                    # Other pages (not in arena)
│   │   └── components/
│   │       └── game/                  # PixiJS game components
│   │           ├── ArenaCanvas.tsx    # Main canvas + game loop (220 lines)
│   │           ├── Player.ts          # Player class (165 lines)
│   │           ├── Enemy.ts           # Enemy class (195 lines)
│   │           ├── Particles.ts       # Particle system (115 lines)
│   │           ├── Sound.ts           # Sound manager (115 lines)
│   │           ├── GameHUD.tsx        # React HUD overlay (110 lines)
│   │           └── index.ts           # Exports
│   └── package.json                   # pixi.js@7.4.3, framer-motion
├── src/                               # Backend (Express API)
│   └── ...                            # Not integrated with arena yet
├── docs/
│   ├── ARCHITECTURE.md                # This file
│   └── PHASE2_DEVELOPMENT.md          # Roadmap for Phases D-G
├── AGENTS.md                          # Master development rules
└── README.md
```

---

## How It Works

### Game Loop Architecture

```
┌─────────────────────────────────────────────┐
│  React Component: /arena/page.tsx          │
│  - Manages game state via React hooks      │
│  - Renders HUD overlay                     │
│  - Handles pause/resume                    │
└──────────────┬──────────────────────────────┘
               │
               │ passes callbacks + state
               ▼
┌─────────────────────────────────────────────┐
│  ArenaCanvas.tsx (PixiJS wrapper)          │
│  - Creates PixiJS Application              │
│  - Sets up game loop (60fps ticker)        │
│  - Manages Player, Enemy, Particle objects │
└──────────────┬──────────────────────────────┘
               │
               │ contains & updates
               ▼
┌──────────────────────────────────────────────┐
│  Game Objects (PixiJS entities)             │
│  ┌─────────┐  ┌─────────┐  ┌────────────┐  │
│  │ Player  │  │ Enemy[] │  │ Particles  │  │
│  │ .update │  │ .update │  │ .update    │  │
│  └─────────┘  └─────────┘  └────────────┘  │
└──────────────────────────────────────────────┘
```

### Rendering Pipeline

1. **PixiJS Application** renders to a `<canvas>` element
2. **Game Container** holds all sprites (floor, walls, entities, particles)
3. **React HUD** overlays on top of canvas (absolute positioned divs)
4. **60fps game loop** updates all entity positions, collision, particles
5. **Camera** follows player by offsetting the game container

### Game State Flow

```
User Input (WASD, SPACE)
  → Player.ts updates velocity/attacks
  → ArenaCanvas.tsx game loop calls player.update()
  → Enemy.ts updates position toward player
  → Collision detection (attack range, wall bounds)
  → On hit: particles.hit(), sound.playHit(), enemy HP decreases
  → On death: particles.burst(), sound.playDeath(), remove enemy
  → Game stats update (kills, enemies remaining)
  → React HUD re-renders with new stats
```

---

## Visual Style (Implemented)

**Color Palette:**
- Background: `0x0a0a12` (very dark blue)
- Floor tiles: 4 shades of dark stone (`0x1a1a24`, `0x181820`, `0x1c1c28`, `0x161622`)
- Walls: Dark gray (`0x2a2a3a`) with lighter highlight (`0x3a3a4a`)
- Player: Blue (`0x4a90d9`) with outline (`0x2a5a9a`)
- Enemies: Green goblin (`0x4a9a4a`), gray skeleton (`0xd4d4d4`), red demon (`0xc44a4a`)
- Health bars: Green > 50%, yellow > 25%, red < 25%
- Particles: Yellow hit sparks (`0xffff00`), enemy-colored death bursts

**Sprite Style:**
- Simple geometric shapes (circles for player, diamonds for enemies)
- 2px outlines for clear visibility
- Direction indicators (white triangles)
- Intentionally stylized, not debug-quality

---

## Known Issues & Limitations

1. **No game over state** - Enemies can't hurt player yet (player HP is tracked but not damaged)
2. **Single wave only** - All 3 enemies spawn at once; no wave progression yet
3. **No XP/leveling** - Kill counter works but doesn't affect stats
4. **No loot** - Enemies don't drop items
5. **No backend connection** - All state is client-side only
6. **Mock game stats** - HUD shows hardcoded player HP (100/100)

These are intentional - Phases A-C focused on rendering. Phase D adds game systems.

---

## Next Priority

**Phase D-1: Multiple Enemy Types**
- Add 4th enemy type (Brute - large, slow, high HP)
- Create enemy type config system
- Random spawn with type variety

See `docs/PHASE2_DEVELOPMENT.md` for full roadmap.

---

## Performance Metrics (Measured)

- **FPS**: Solid 60fps with 1 player + 3 enemies + particles
- **Bundle size**: `/arena` route = 125KB (includes PixiJS)
- **Particle count**: Max 50 active particles (intentionally capped)
- **Memory**: No leaks detected over 5min gameplay

---

*This document reflects ONLY what currently exists and works. For future plans, see PHASE2_DEVELOPMENT.md.*
