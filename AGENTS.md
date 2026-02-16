# Agent Arena — Master Development Prompt

> **Purpose**: This is the system-level instruction document for AI agents working on the Agent Arena project. Every coding session MUST begin by reading this document in full. It overrides any previous instructions, planning docs, or session summaries.
>
> **ALSO READ: `docs/PHASE2_DEVELOPMENT.md`** for current development priorities, task breakdowns, and the full roadmap from Phase D through Phase G.
> **ALSO READ: `docs/VISUAL_DESIGN_BIBLE.md`** for all visual design rules, color systems, typography, and component styling. Every UI component must follow this guide.
> **ALSO READ: `docs/GAME_DESIGN_BIBLE.md`** for the complete game design vision, mechanics, and systems. Every feature must align with this document.

---

## 0. CRITICAL RULES — READ BEFORE DOING ANYTHING

### The Golden Rules (violating any of these = failed task)

1. **NEVER self-certify completion.** You do not mark tasks as ✅ complete. Only the human developer confirms completion after visual/functional verification. Your job is to write code and describe what it should look like when working.

2. **ONE system per task.** Each task touches ONE system (e.g., floor rendering, player movement, enemy spawning). Never combine multiple systems in a single task. If a task description mentions 2+ systems, STOP and ask which one to do first.

3. **No planning documents.** Do not create markdown planning docs, implementation summaries, completion checklists, session summaries, or phase reports. Write CODE, not documents about code. The only documentation allowed is inline code comments and a single `ARCHITECTURE.md` file (described below).

4. **Verify before building on top.** Never write code that depends on a system you haven't personally tested in this session. If you need a function from another file, READ that file first and confirm the function exists with the expected signature. Do not assume anything works based on previous planning docs.

5. **Small files, small changes.** No single file should exceed 300 lines. No single task should create more than 500 lines of new code total. If you think you need more, the task is too big — break it down.

6. **Working > Complete.** A simple system that visibly works is infinitely more valuable than a complex system that doesn't render. Always choose the simplest implementation that produces visible results.

---

## 1. PROJECT IDENTITY

**Agent Arena** is an MMORPG-inspired platform where AI agents (bots) battle each other. Users create, customize, and equip AI agents that compete in an arena. The visual presentation is a **top-down 2D arena** with a dark fantasy roguelike aesthetic (think Hades, Vampire Survivors, Enter the Gungeon).

**What the game IS**: A browser-based 2D game with stylized sprites, particle effects, and smooth combat animations, running in React/Next.js.

**What the game is NOT**: A 3D game. We do not use Three.js, Babylon.js, or any 3D rendering engine. Period.

---

## 2. TECH STACK (final, do not change)

```
Frontend:
  Framework:    Next.js 14+ (React) with TypeScript
  Rendering:    PixiJS 7+ (2D WebGL renderer)
  UI Layer:     React components with Tailwind CSS + shadcn/ui
  State:        Zustand
  Real-time:    Socket.io client
  Hosting:      Vercel

Backend:
  Runtime:      Node.js with Express.js (TypeScript)
  Real-time:    Socket.io
  Database:     PostgreSQL (Supabase)
  Auth:         NextAuth.js
  Hosting:      Railway or Render
```

### Technology Bans
The following are **explicitly banned** from this project:
- Three.js, Babylon.js, or any 3D rendering library
- Raw HTML5 Canvas (use PixiJS instead)
- Any CSS-only game rendering approach
- jQuery
- Any ORM other than direct Supabase client

If you find existing code using banned technology, flag it for removal.

---

## 3. CURRENT REPO STATE & CLEANUP REQUIRED

The repository has accumulated technical debt from previous AI sessions. Before any new feature work, the following cleanup must happen:

### 3.1 Immediate Fixes (do these FIRST if not already done)

```
[ ] Remove node_modules/ from git tracking
    → git rm -r --cached node_modules/
    → Add to .gitignore

[ ] Remove .env from git tracking
    → git rm --cached .env
    → Ensure .env.example exists with placeholder values
    → ROTATE ALL API KEYS — assume they are compromised

[ ] Delete all planning/summary markdown files from repo root:
    → CAMERA_SYSTEM_SUMMARY.md
    → CRAFTING_3D_SYSTEM.md
    → DUNGEON_TIERED_SYSTEM.md
    → IMPLEMENTATION_SUMMARY_P2.3.md
    → P1.3_IMPLEMENTATION_SUMMARY.md
    → P2.1_COMPLETION_CHECKLIST.md
    → P2.4_IMPLEMENTATION_SUMMARY.md
    → P2.5_IMPLEMENTATION_SUMMARY.md
    → PHASE_1_COMPLETE.md
    → ROGUELIKE_TRANSFORMATION_PLAN.md
    → SESSION_SUMMARY.md
    (move to docs/archive/ if the human wants to keep them)

[ ] Delete all Three.js related code
    → Remove any imports of 'three', '@react-three/fiber', '@react-three/drei'
    → Remove files: models.ts, ragdoll.ts, and any Three.js scene files
    → Remove three.js from package.json dependencies

[ ] Delete test files from repo root (move to tests/ directory)
    → test-crafting.ts, test-dungeon.ts, test-loot.ts
```

### 3.2 Target File Structure

```
agent-arena/
├── frontend/
│   ├── app/                    # Next.js app router
│   │   ├── page.tsx            # Landing/home
│   │   ├── arena/
│   │   │   └── page.tsx        # Main game view
│   │   ├── dashboard/
│   │   │   └── page.tsx        # Agent management
│   │   ├── inventory/
│   │   │   └── page.tsx        # Equipment
│   │   └── leaderboard/
│   │       └── page.tsx        # Rankings
│   ├── components/
│   │   ├── ui/                 # shadcn components
│   │   ├── game/               # PixiJS game components
│   │   │   ├── ArenaCanvas.tsx # Main PixiJS canvas wrapper
│   │   │   ├── Floor.ts        # Tilemap floor rendering
│   │   │   ├── Entities.ts     # Agent/enemy sprite rendering
│   │   │   ├── Effects.ts      # Particle effects
│   │   │   ├── HUD.tsx         # React overlay (HP bars, skills)
│   │   │   └── Camera.ts       # Camera/viewport logic
│   │   └── layout/             # Nav, sidebar, etc.
│   ├── lib/
│   │   ├── pixi/               # PixiJS setup and utilities
│   │   ├── stores/             # Zustand stores
│   │   └── socket/             # Socket.io client
│   └── public/
│       └── assets/
│           ├── sprites/        # Character spritesheets
│           ├── tiles/          # Floor/wall tilesets
│           └── effects/        # Particle textures
├── src/                        # Backend
│   ├── server.ts
│   ├── routes/
│   ├── game/                   # Game logic (battle calc, AI, loot)
│   ├── db/
│   └── middleware/
├── docs/
│   └── ARCHITECTURE.md         # Single source of truth (see below)
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## 4. ARCHITECTURE.md — THE SINGLE SOURCE OF TRUTH

Maintain exactly ONE architecture document at `docs/ARCHITECTURE.md`. This file describes ONLY what currently exists and works — never aspirational features. Update it after every task.

Template:

```markdown
# Agent Arena Architecture

Last updated: [DATE]

## What Currently Works
- [List only features that are visually verified working]

## File Map
- [List key files and what they do, keep current]

## Known Issues
- [List actual bugs or incomplete integrations]

## Next Priority
- [Single next task to work on]
```

---

## 5. VISUAL STYLE GUIDE

### Art Direction: Dark Fantasy Roguelike

**Color Palette:**
- Background/Floor: Deep charcoal (#1a1a2e), dark slate (#16213e)
- Walls/Obstacles: Dark stone (#2d3436), with subtle edge highlights (#636e72)
- Player Agent: Cool blue/cyan accent (#00d2ff → #0078ff)
- Enemy Agents: Warm hostile colors — orange (#ff6b35), red (#ff3838), purple (#a855f7)
- Loot/Items: Gold (#ffd700), with white glow
- UI Accent: Deep purple (#7c3aed) or teal (#14b8a6)
- Health bars: Red (#ef4444) to green (#22c55e) gradient based on HP%
- Mana/Energy bars: Blue (#3b82f6)

**Visual Effects (PixiJS):**
- Subtle ambient particles (dust motes, floating embers) — very low count, 20-30 max
- Attack effects: Quick flash + small particle burst, 10-15 particles max
- Death effects: Brief dissolve/fade, not ragdoll physics
- Damage numbers: Float up and fade out (CSS-animated React overlays, NOT PixiJS text)

**Camera:**
- Top-down or slight isometric perspective (purely 2D)
- Camera follows player agent smoothly (lerp, not snap)
- Slight zoom-in during combat encounters

**Sprites:**
- Use free roguelike sprite packs (16x16 or 32x32 scaled up with nearest-neighbor filtering)
- If no sprites available yet, use CLEAN colored geometric shapes:
  - Circles for agents (not rectangles)
  - Color-coded by type with a darker outline stroke
  - Small directional indicator (triangle or dot) showing facing
- Geometric placeholders should still look intentional and polished, not like debug output

### What "Looking Good" Means (Verification Criteria)
When evaluating if the visual output is acceptable, check:
1. Is there a visible, textured floor (tiled, not a solid color)?
2. Are walls/boundaries clearly distinguishable from floor?
3. Do entities have visible outlines and are easily distinguishable from each other?
4. Is there a vignette or atmospheric overlay at screen edges?
5. Is the HUD clean, readable, and overlaid in React (not rendered in the game canvas)?
6. Does it look like a GAME, not a debug visualization?

---

## 6. PIXIJS IMPLEMENTATION GUIDE

### Setting Up the PixiJS Canvas in React

```typescript
// frontend/components/game/ArenaCanvas.tsx
// This is a React component that wraps a PixiJS Application

import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';

export function ArenaCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);

  useEffect(() => {
    if (!containerRef.current || appRef.current) return;

    const app = new PIXI.Application({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x1a1a2e,
      antialias: false,              // Keep pixel art sharp
      resolution: window.devicePixelRatio || 1,
    });

    containerRef.current.appendChild(app.view as HTMLCanvasElement);
    appRef.current = app;

    // Set up nearest-neighbor scaling for pixel art
    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

    return () => {
      app.destroy(true);
      appRef.current = null;
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      {/* React HUD overlays go here as siblings */}
    </div>
  );
}
```

### Key PixiJS Patterns

**Tilemap Floor:**
```typescript
// Use a TilingSprite for the floor — efficient for large areas
const floorTexture = PIXI.Texture.from('/assets/tiles/stone_floor.png');
const floor = new PIXI.TilingSprite(floorTexture, mapWidth, mapHeight);
floor.tileScale.set(2); // Scale up pixel art tiles
app.stage.addChild(floor);
```

**Entity Sprites (placeholder circles):**
```typescript
function createEntity(color: number, radius: number = 16): PIXI.Container {
  const container = new PIXI.Container();

  // Body
  const body = new PIXI.Graphics();
  body.lineStyle(2, 0x000000, 0.5);
  body.beginFill(color);
  body.drawCircle(0, 0, radius);
  body.endFill();
  container.addChild(body);

  // Direction indicator
  const dir = new PIXI.Graphics();
  dir.beginFill(0xffffff, 0.8);
  dir.drawPolygon([0, -radius, -4, -radius + 8, 4, -radius + 8]);
  dir.endFill();
  container.addChild(dir);

  return container;
}
```

**Simple Particle Effect:**
```typescript
// Attack hit effect — keep particle count LOW
function createHitEffect(x: number, y: number, container: PIXI.Container) {
  for (let i = 0; i < 8; i++) {
    const particle = new PIXI.Graphics();
    particle.beginFill(0xffd700);
    particle.drawCircle(0, 0, 2);
    particle.endFill();
    particle.x = x;
    particle.y = y;

    const angle = (Math.PI * 2 * i) / 8;
    const speed = 2 + Math.random() * 3;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    let life = 20;

    container.addChild(particle);

    const tick = () => {
      particle.x += vx;
      particle.y += vy;
      particle.alpha = life / 20;
      life--;
      if (life <= 0) {
        container.removeChild(particle);
        PIXI.Ticker.shared.remove(tick);
      }
    };
    PIXI.Ticker.shared.add(tick);
  }
}
```

**Camera Follow:**
```typescript
// In game loop — smooth camera follow
const gameContainer = new PIXI.Container(); // All game objects go in here
app.stage.addChild(gameContainer);

function updateCamera(playerX: number, playerY: number) {
  const targetX = app.screen.width / 2 - playerX;
  const targetY = app.screen.height / 2 - playerY;
  gameContainer.x += (targetX - gameContainer.x) * 0.1; // lerp
  gameContainer.y += (targetY - gameContainer.y) * 0.1;
}
```

### What NOT to Do in PixiJS
- Don't create new Graphics objects every frame (reuse them)
- Don't use PIXI.Text for damage numbers (use React overlays)
- Don't create more than 50 particles at once for any effect
- Don't add sprites to the stage directly — use a container hierarchy:
  `stage → gameContainer → [floorLayer, entityLayer, effectLayer]`
- Don't write a custom physics engine — use simple bounding-box or radius-based collision

---

## 7. DEVELOPMENT WORKFLOW

### Task Execution Protocol

For EVERY task, follow this exact sequence:

```
1. READ the relevant existing files first
   → Use your file reading tools to examine every file you'll modify
   → Check that functions/imports you depend on actually exist

2. WRITE the code
   → Small, focused changes
   → One system at a time
   → Under 300 lines per file, under 500 lines total

3. DESCRIBE the expected visual result
   → "When you run the app, you should see [specific description]"
   → "The player circle should be blue, centered on screen, with a white triangle pointing up"
   → Be precise enough that the human can verify

4. LIST what to verify
   → "Check that: floor tiles repeat across the screen"
   → "Check that: pressing W moves the player up"
   → "Check that: enemy circles are orange and distinct from player"

5. NOTE any dependencies or next steps
   → "This requires the floor system from Task X to be working first"
   → "Next logical task would be: adding wall collisions"
```

### Task Sizing Guide

**Too big** (NEVER do this in one task):
- "Implement the dungeon system with enemies, loot, lighting, and particles"
- "Build the full battle system with animations and effects"
- "Create the arena view with all combat mechanics"

**Right size** (one task = one of these):
- "Render a tiled floor in the arena view"
- "Add player entity that responds to WASD"
- "Draw 3 enemy entities at random positions"
- "Add health bars above entities"
- "Create a hit particle effect when attack lands"
- "Build the HUD with HP/MP bars in React overlay"

### Build Order (suggested sequence for arena visual rebuild)

```
Phase A — Visible Foundation
  A1. PixiJS canvas renders in the /arena route with dark background
  A2. Tiled floor renders across the arena
  A3. Wall boundaries render around the arena edges
  A4. Player entity (blue circle) renders at center
  A5. WASD moves the player; camera follows smoothly

Phase B — Entities & Interaction
  B1. Enemy entities spawn at random positions (orange circles)
  B2. Health bars render above all entities (PixiJS graphics)
  B3. Pressing SPACE triggers attack animation (simple flash)
  B4. Hit detection: attack in range of enemy shows hit effect
  B5. Enemy takes damage, health bar updates, death = fade out

Phase C — Polish & HUD
  C1. React HUD overlay with HP/MP bars, skill buttons
  C2. Damage numbers float up (React, not PixiJS)
  C3. Ambient particles (dust motes, subtle)
  C4. Screen-edge vignette overlay
  C5. Mini-map or arena boundary indicator

Phase D — Game Systems Integration
  D1. Connect battle logic (backend) to visual layer
  D2. Multiple enemy types with different colors/sizes
  D3. Loot drops render as glowing items on ground
  D4. Level-up visual effect
  D5. Ability effects (one at a time)
```

Each item above is ONE task. Do not combine them.

---

## 8. CODE QUALITY STANDARDS

### TypeScript Strictness
```json
// tsconfig.json must include:
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### File Size Limits
- No file over 300 lines. If approaching 300, split into separate modules.
- Components should do ONE thing.
- Use barrel exports (`index.ts`) for clean imports.

### Naming Conventions
```
Files:      PascalCase for components, camelCase for utilities
Components: PascalCase (ArenaCanvas.tsx, HealthBar.tsx)
Functions:  camelCase (createEntity, updateCamera)
Constants:  UPPER_SNAKE_CASE (MAX_PARTICLES, TILE_SIZE)
Types:      PascalCase with descriptive names (EntityState, ArenaConfig)
```

### Error Handling
- Every async function must have try/catch
- PixiJS setup must handle WebGL context loss
- Socket.io must handle disconnection gracefully
- Never silently swallow errors — at minimum console.error

---

## 9. WHAT TO DO WHEN STUCK

If a visual system isn't rendering correctly:

1. **Simplify to the minimum.** Remove all complexity until you get SOMETHING visible. A red square on a black background is progress.

2. **Check the container hierarchy.** Is the sprite actually added to a container that's added to the stage? Is the container visible? Is it positioned in the viewport?

3. **Check z-ordering.** Is something rendering on top of / behind what you expect?

4. **Log coordinates.** console.log the x, y, width, height of what you're trying to render. Are they reasonable numbers?

5. **Never blame the framework.** If PixiJS isn't rendering something, the code is wrong. PixiJS works. Check your setup.

---

## 10. BANNED PRACTICES

These are patterns previous AI sessions fell into. Do NOT repeat them:

| Banned Practice | Why | Do This Instead |
|---|---|---|
| Writing planning docs before code | Wastes tokens, creates false sense of progress | Write code directly |
| Self-certifying ✅ COMPLETE | Leads to broken code marked as done | Describe expected output; human verifies |
| Multi-system tasks | Code loses coherence across many files | One system per task |
| Creating "factory" or "manager" classes with 500+ lines | Too complex to debug when broken | Small functions, simple modules |
| Using Three.js for 2D gameplay | Massive API surface; LLM can't manage it | Use PixiJS |
| Generating types/enums with 10+ variants before any rendering works | Premature abstraction | Start with 2-3 variants, add more when base works |
| Importing from files you haven't read | Leads to integration failures | Always read the file first |
| Writing "zero garbage collection" optimized code before basics work | Premature optimization | Get it working, then optimize |
| Creating separate files for types, constants, config before needing them | Fragmenting code too early | Inline types until a file is reused 3+ times |
| Committing node_modules or .env | Security risk, repo bloat | .gitignore both |

---

## 11. ASSET STRATEGY

### Sprites & Tilesets (Priority: get SOMETHING in quickly)

**Option A — Free Assets (preferred):**
Search itch.io for free roguelike tilesets. Good search terms:
- "dungeon tileset 16x16 free"
- "roguelike sprite pack"
- "fantasy character sprites top-down"

Download and place in `frontend/public/assets/`. Credit the artist in README.

**Option B — Placeholder Geometric Shapes (acceptable for now):**
Use the geometric entity code from Section 6 above. Make them look INTENTIONAL:
- Clean circles with outlines, not bare rectangles
- Consistent sizing relative to the tile grid
- Color-coded clearly (see Style Guide)
- Direction indicators on all entities

**Option C — Procedural Generation (NOT recommended):**
Do not write procedural texture generation code. It's complex, looks worse than simple shapes, and wastes tokens.

---

## 12. SUMMARY: THE ONE-PAGE VERSION

```
┌─────────────────────────────────────────────────────────┐
│                   HOW TO BUILD THIS GAME                 │
│                                                          │
│  1. One task at a time. One system per task.             │
│  2. Get something VISIBLE before adding complexity.      │
│  3. Use PixiJS for game rendering. NOT Three.js.         │
│  4. Use React for HUD/UI overlays on top of the canvas.  │
│  5. Never write planning docs. Write code.               │
│  6. Never self-certify. Describe what it should look     │
│     like. Human verifies.                                │
│  7. Read existing files before modifying or importing.   │
│  8. Keep files under 300 lines. Tasks under 500 lines.   │
│  9. If it doesn't render, simplify until it does.        │
│ 10. Update ARCHITECTURE.md with what ACTUALLY works.     │
│                                                          │
│  Current priority: Get the arena visually rendering      │
│  with PixiJS before touching any backend/game logic.     │
└─────────────────────────────────────────────────────────┘
```

---

*This document is the project constitution. Follow it above all other instructions, planning docs, or previous session context. When in doubt, choose the simpler path that produces visible results.*
