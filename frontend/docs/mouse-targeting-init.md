# Mouse Targeting Initialization - Debug Guide

## Problem
Mouse targeting system was showing warnings about not being ready when enemies spawn. This caused enemies to not register as targetable, breaking hover/click interactions.

## Root Cause
The initialization order was critical:
1. Camera and canvas must exist
2. MouseTargeting must be initialized
3. THEN enemies can spawn and register

## Solution
**Initialization Sequence in `Dungeon3DView.tsx`:**

```typescript
// 1. Create scene (line ~128)
const scene = new THREE.Scene();

// 2. Create camera (line ~137)
const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
cameraRef.current = camera;

// 3. Create renderer (line ~152)
const renderer = new THREE.WebGLRenderer({ canvas, ... });

// 4. Initialize all systems (line ~163)
// Post-processing, minimap, fog of war, etc.

// 5. Setup Input - CRITICAL TIMING! (line ~256)
setupInput(); // Creates and initializes MouseTargeting

// 6. Load Dungeon (line ~259)
loadDungeonRooms(); // Spawns enemies that register with MouseTargeting
```

## Key Implementation Details

### `setupInput()` Function (line ~496)
```typescript
const setupInput = useCallback(() => {
  const camera = cameraRef.current;
  const canvas = canvasRef.current;
  
  // Guard: Camera and canvas must exist
  if (!canvas || !camera) {
    console.warn('⚠️ Cannot setup input: missing canvas or camera');
    return; // Abort if not ready
  }
  
  // Initialize mouse targeting system
  const mouseTargeting = new MouseTargeting();
  mouseTargeting.initialize(camera, canvas);
  mouseTargetingRef.current = mouseTargeting; // Store in ref for enemy spawn
  
  // ... rest of input setup
}, []);
```

### `spawnEnemy()` Function (line ~445)
```typescript
const spawnEnemy = useCallback((enemyId, roomId, type, x, z) => {
  // ... create enemy model ...
  
  // Register with mouse targeting (if ready)
  if (mouseTargetingRef.current) {
    mouseTargetingRef.current.registerEntity({
      id: enemyId,
      mesh: model.mesh,
      type: 'enemy',
      position: model.mesh.position,
    });
  } else {
    console.warn(`[spawnEnemy] ⚠️ MouseTargeting not ready!`);
  }
}, []);
```

## Debug Logging
Added comprehensive logging to track initialization:

1. **setupInput():** Logs start + hasCanvas/hasCamera status
2. **MouseTargeting.initialize():** Logs when system is ready
3. **MouseTargeting.registerEntity():** Logs entity count at milestones (1, 10, 20...)
4. **spawnEnemy():** Warns if MouseTargeting ref is null

### Expected Console Output (Success)
```
[setupInput] Starting input setup... { hasCanvas: true, hasCamera: true }
[MouseTargeting] ✅ Initialized
✅ All Phase 2 systems initialized
✅ Spawned GOBLIN at (5.0, 8.0)
✅ Spawned ORC at (12.0, 3.0)
[MouseTargeting] Registered 1 entities
...
```

### Error Output (Failure)
```
[setupInput] Starting input setup... { hasCanvas: true, hasCamera: false }
⚠️ Cannot setup input: missing canvas or camera
✅ Spawned GOBLIN at (5.0, 8.0)
⚠️ [spawnEnemy] MouseTargeting not ready! Cannot register enemy-123
```

## Testing Checklist
1. Open http://localhost:3001/dungeon
2. Check console for initialization logs
3. Verify "MouseTargeting ✅ Initialized" appears BEFORE enemy spawns
4. Move mouse over enemies - should see yellow glow (hover)
5. Click enemy - should see red glow (selected) + target UI

## Future Improvements
- Add TypeScript guard to prevent calling `registerEntity()` before initialization
- Consider using a state machine for initialization lifecycle
- Add automated integration test for initialization order
