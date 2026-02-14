# Camera & View System Documentation
**Agent Arena 3D Roguelike - Phase 2.7**

## Overview

The Camera & View System provides a complete solution for camera control, following behavior, shake effects, minimap rendering, and smooth transitions. Built for orthographic isometric perspective (Hades-style) with 60 FPS performance target.

### Features
- 🎮 **Multiple Camera Modes**: Follow, Free, Cinematic, Fixed
- 🎯 **Smooth Following**: Lerp-based interpolation with look-ahead
- 🔍 **Zoom Controls**: Mouse wheel with configurable bounds
- 💥 **Camera Shake**: Impact, continuous, and directional effects
- 🗺️ **Minimap**: Top-down dungeon view with fog of war
- 🎬 **Transitions**: Smooth camera movements with easing
- ⚛️ **React Integration**: Easy-to-use hooks
- ⚡ **Performance**: Optimized for 60 FPS

---

## Architecture

### Core Components

1. **CameraController** - Main camera controller
   - Handles camera modes, zoom, pan, rotation
   - View bounds clamping
   - Input handling (mouse, keyboard)

2. **FollowCamera** - Follow behavior
   - Target tracking with smooth interpolation
   - Look-ahead system
   - Speed-based zoom

3. **CameraShake** - Shake effects
   - Multiple simultaneous shakes
   - Impact, continuous, directional types
   - Automatic decay

4. **Minimap** - Top-down view
   - Canvas-based rendering
   - Room visibility tracking
   - Entity markers (player, enemies, items)

5. **CameraTransition** - Smooth transitions
   - Multiple easing functions
   - Cinematic camera movements
   - Position, rotation, and zoom interpolation

---

## Camera Modes

### Follow Mode
Camera follows the player smoothly with optional look-ahead.

```typescript
controller.setMode(CameraMode.FOLLOW);
```

**Use cases**: Normal gameplay, player exploration

### Free Mode
User controls camera with mouse (pan) and keyboard (WASD).

```typescript
controller.setMode(CameraMode.FREE);
```

**Use cases**: Map overview, debugging, spectator mode

### Cinematic Mode
Camera follows predefined transitions, ignoring user input.

```typescript
controller.setMode(CameraMode.CINEMATIC);
```

**Use cases**: Cutscenes, boss introductions, story moments

### Fixed Mode
Camera locked at a specific position.

```typescript
controller.setMode(CameraMode.FIXED);
```

**Use cases**: Specific rooms, puzzle sections, arena battles

---

## Quick Start

### Basic Setup with Hooks

```typescript
import { useCameraSystem } from './camera';
import { CameraMode } from './camera/types';
import { OrthographicCamera, Vector3 } from 'three';

function Game() {
  const camera = new OrthographicCamera(-10, 10, 10, -10, 0.1, 1000);
  
  const cameraSystem = useCameraSystem(
    camera,
    {
      position: new Vector3(10, 15, 10),
      target: new Vector3(0, 0, 0),
      zoom: 1,
      minZoom: 0.5,
      maxZoom: 2,
      zoomSpeed: 0.1,
      mode: CameraMode.FOLLOW,
      enableDamping: true,
      dampingFactor: 0.1,
    },
    {
      offset: new Vector3(10, 15, 10),
      smoothness: 0.15,
      lookAhead: 3,
      speedBasedZoom: true,
      speedThreshold: 8,
      maxSpeedZoom: 1.3,
    },
    {
      width: 200,
      height: 200,
      position: { top: 20, right: 20 },
      zoom: 1,
      opacity: 0.8,
      // ... other minimap config
    }
  );

  // In game loop
  useEffect(() => {
    const animate = (time: number) => {
      const deltaTime = (time - lastTime) / 1000;
      
      // Update camera system
      cameraSystem.update(deltaTime);
      
      requestAnimationFrame(animate);
    };
    
    requestAnimationFrame(animate);
  }, []);

  return <Canvas camera={camera}>{/* game content */}</Canvas>;
}
```

### Manual Setup (No Hooks)

```typescript
import { OrthographicCamera, Vector3 } from 'three';
import { CameraController, FollowCamera, CameraShake } from './camera';

const camera = new OrthographicCamera(-10, 10, 10, -10, 0.1, 1000);

const controller = new CameraController(camera, {
  position: new Vector3(10, 15, 10),
  target: new Vector3(0, 0, 0),
  zoom: 1,
  minZoom: 0.5,
  maxZoom: 2,
  zoomSpeed: 0.1,
  mode: CameraMode.FOLLOW,
  enableDamping: true,
  dampingFactor: 0.1,
});

const followCamera = new FollowCamera({
  offset: new Vector3(10, 15, 10),
  smoothness: 0.15,
  lookAhead: 3,
  speedBasedZoom: true,
  speedThreshold: 8,
  maxSpeedZoom: 1.3,
});

const shake = new CameraShake();

// Set follow target
followCamera.setTarget(playerPosition);

// Game loop
function update(deltaTime: number) {
  // Update follow camera
  const followResult = followCamera.update(deltaTime);
  controller.setTargetPosition(followResult.position);
  controller.setTargetLookAt(followResult.lookAt);
  
  // Apply shake
  const shakeOffset = shake.update(deltaTime);
  const finalPosition = followResult.position.clone().add(shakeOffset);
  controller.setTargetPosition(finalPosition);
  
  // Update controller
  controller.update(deltaTime);
}
```

---

## Camera Shake Effects

### Impact Shake (Hit/Explosion)

```typescript
const { shake } = useCameraSystem(...);

// Trigger on hit
function onPlayerHit(damage: number) {
  const intensity = damage * 0.05; // Scale with damage
  shake.impact(intensity, 200);
}

// Trigger on explosion
function onExplosion(position: Vector3) {
  const distance = playerPosition.distanceTo(position);
  const intensity = Math.max(0, 2 - distance * 0.1);
  shake.impact(intensity, 400);
}
```

### Continuous Shake (Earthquake/Rumble)

```typescript
// Environmental shake
function onEarthquake() {
  shake.continuous(0.3, 5000, 8); // 5 seconds, 8 Hz
}

// Boss stomp
function onBossStomp() {
  shake.continuous(0.5, 1000, 12);
}
```

### Directional Shake (Knockback)

```typescript
function onKnockback(direction: Vector3, force: number) {
  const intensity = force * 0.1;
  shake.directional(intensity, direction, 300);
}
```

---

## Minimap Usage

### Setup

```typescript
const { minimap } = useCameraSystem(...);

// Add rooms as player explores
minimap?.addRoom({
  id: 'room_1',
  bounds: { minX: -10, maxX: 10, minZ: -10, maxZ: 10 },
  explored: true,
});

// Mark room as explored
minimap?.setRoomExplored('room_2', true);

// Update player position
minimap?.setPlayerPosition(player.x, player.z);

// Add enemy marker
minimap?.addEntity({
  id: 'enemy_1',
  position: { x: enemy.x, z: enemy.z },
  type: 'enemy',
});

// Add item marker
minimap?.addEntity({
  id: 'treasure_1',
  position: { x: item.x, z: item.z },
  type: 'item',
  color: '#FFD700', // Gold color for treasure
});

// Remove entity when defeated/collected
minimap?.removeEntity('enemy_1');
```

---

## Camera Transitions

### Cinematic Transition

```typescript
const { transition } = useCameraSystem(...);

// Boss introduction
function introduceBoss(bossPosition: Vector3) {
  const cameraPos = bossPosition.clone().add(new Vector3(5, 10, 5));
  const lookAt = bossPosition;
  
  transition.start(
    CameraTransition.createCinematic(
      cameraPos,
      lookAt,
      2000, // 2 seconds
      () => {
        console.log('Boss intro complete!');
        // Return to follow mode
        controller?.setMode(CameraMode.FOLLOW);
      }
    )
  );
}
```

### Quick Snap

```typescript
// Quick transition to room center
function focusOnRoom(roomCenter: Vector3) {
  const cameraPos = roomCenter.clone().add(new Vector3(0, 20, 0));
  
  transition.start(
    CameraTransition.createSnap(cameraPos, roomCenter, 300)
  );
}
```

---

## Performance Tips

### 1. **Use Damping Wisely**
```typescript
// Good for smooth following
enableDamping: true,
dampingFactor: 0.1, // Lower = faster response

// Disable for instant camera response
enableDamping: false,
```

### 2. **Optimize Minimap Rendering**
```typescript
// Only render minimap when needed
const shouldRenderMinimap = playerInDungeon && !isPaused;

if (shouldRenderMinimap) {
  minimap?.render();
}
```

### 3. **Limit Shake Stacking**
```typescript
// Clear weak shakes before adding strong ones
if (shake.getActiveCount() > 3) {
  shake.clearAll();
}
shake.impact(2.0, 500);
```

### 4. **Use View Bounds**
```typescript
// Prevent camera from leaving playable area
bounds: {
  minX: -50, maxX: 50,
  minY: 5, maxY: 30,
  minZ: -50, maxZ: 50,
}
```

### 5. **Optimize Follow Camera**
```typescript
// Higher smoothness = slower but smoother
smoothness: 0.15, // 0-1

// Disable speed-based zoom if not needed
speedBasedZoom: false,
```

---

## Advanced Examples

### Dynamic Camera Based on Combat

```typescript
function updateCameraForCombat(inCombat: boolean) {
  if (inCombat) {
    // Zoom out and increase follow speed during combat
    controller?.setZoom(0.8);
    followCamera?.setSmoothness(0.05); // Faster response
    followCamera?.setLookAhead(5); // More look-ahead
  } else {
    // Normal exploration settings
    controller?.setZoom(1.0);
    followCamera?.setSmoothness(0.15);
    followCamera?.setLookAhead(3);
  }
}
```

### Room-Based Camera Constraints

```typescript
function enterRoom(room: Room) {
  // Set bounds to current room
  controller?.setBounds({
    minX: room.minX,
    maxX: room.maxX,
    minY: 5,
    maxY: 20,
    minZ: room.minZ,
    maxZ: room.maxZ,
  });
  
  // Mark room as explored on minimap
  minimap?.setRoomExplored(room.id, true);
}
```

### Cutscene System

```typescript
async function playCutscene(scenes: CutsceneFrame[]) {
  controller?.setMode(CameraMode.CINEMATIC);
  
  for (const scene of scenes) {
    await new Promise<void>((resolve) => {
      transition.start({
        targetPosition: scene.cameraPosition,
        targetLookAt: scene.lookAt,
        targetZoom: scene.zoom,
        duration: scene.duration,
        easing: scene.easing,
        onComplete: resolve,
      });
    });
    
    // Wait for dialog or action
    await scene.action?.();
  }
  
  controller?.setMode(CameraMode.FOLLOW);
}
```

---

## Troubleshooting

### Camera Jitter
- **Cause**: Conflicting updates or too high damping factor
- **Fix**: Ensure single update per frame, reduce `dampingFactor` to 0.05-0.15

### Minimap Not Rendering
- **Cause**: Missing render call or hidden canvas
- **Fix**: Call `minimap.render()` in game loop, check `minimap.show()`

### Shake Too Weak/Strong
- **Cause**: Intensity miscalibrated
- **Fix**: Adjust intensity multiplier (0.1-2.0 range typical)

### Follow Camera Lag
- **Cause**: High smoothness value
- **Fix**: Reduce `smoothness` to 0.05-0.2

---

## API Reference

See individual class files for detailed API documentation:
- `controller.ts` - CameraController
- `follow.ts` - FollowCamera
- `shake.ts` - CameraShake
- `minimap.ts` - Minimap
- `transitions.ts` - CameraTransition
- `useCamera.ts` - React Hooks

---

**Phase 2.7 Complete** ✅
