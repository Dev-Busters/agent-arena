# Lighting System Documentation
**Agent Arena 3D Roguelike - P2.6**

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Light Pooling](#light-pooling)
3. [Shadow Optimization](#shadow-optimization)
4. [Room Lighting](#room-lighting)
5. [Light Animations](#light-animations)
6. [React Integration](#react-integration)
7. [Code Examples](#code-examples)
8. [Performance Tips](#performance-tips)

---

## Architecture Overview

The lighting system is designed for high-performance 3D rendering with the following components:

```
lighting/
├── types.ts              - TypeScript type definitions
├── lightPool.ts          - Light pooling for performance
├── torches.ts            - Torch implementation with flickering
├── shadows.ts            - Shadow management and optimization
├── roomLighting.ts       - Room-specific lighting presets
├── baking.ts             - Lightmap baking (optional)
├── animations.ts         - Light animation system
├── useLighting.ts        - React hooks for integration
└── index.ts              - Module exports
```

### Key Features
- **Light Pooling**: Pre-allocated lights (30-50) to avoid GC pressure
- **Shadow Casting**: Configurable quality (low, medium, high, ultra)
- **Soft Shadows**: PCF filtering for realistic shadows
- **Room Presets**: 6 room types with unique lighting
- **Animations**: Flicker, pulse, strobe, rainbow effects
- **Performance**: Targets 60 FPS with 20+ active lights

---

## Light Pooling

Light pooling eliminates the performance cost of creating and destroying lights during gameplay.

### How It Works
1. Pre-allocate a pool of lights at initialization
2. Mark lights as "active" or "inactive"
3. Reuse inactive lights instead of creating new ones
4. Return lights to the pool when no longer needed

### Benefits
- **No GC pressure** - Lights are reused, not recreated
- **Predictable performance** - Fixed memory allocation
- **Fast acquisition** - O(1) light retrieval from pool

### Usage
```typescript
import { LightPool } from './lighting';

const lightPool = new LightPool(scene, {
  pointLightCount: 30,
  spotLightCount: 20,
  enableShadows: true,
  shadowQuality: ShadowQuality.MEDIUM,
});

// Acquire a light
const light = lightPool.acquirePointLight();
if (light) {
  light.position.set(x, y, z);
  light.intensity = 2.0;
  light.color.set(0xff8844);
}

// Release when done
lightPool.release(light);

// Check pool stats
const stats = lightPool.getStats();
console.log(`Active: ${stats.activeLights}/${stats.totalLights}`);
```

---

## Shadow Optimization

Shadows are expensive. The `ShadowManager` provides quality presets and optimization tools.

### Shadow Quality Levels

| Quality | Map Size | Performance | Use Case |
|---------|----------|-------------|----------|
| LOW     | 512×512  | Best        | Distant lights, mobile |
| MEDIUM  | 1024×1024| Good        | Most lights |
| HIGH    | 2048×2048| Moderate    | Key lights, close-ups |
| ULTRA   | 4096×4096| Poor        | Hero assets only |

### Shadow Configuration
```typescript
import { ShadowManager, ShadowQuality } from './lighting';

const shadowManager = new ShadowManager(renderer, ShadowQuality.MEDIUM);

// Configure light shadow
shadowManager.configureLightShadow(light, {
  quality: ShadowQuality.HIGH,
  bias: -0.0001,
  normalBias: 0.02,
  radius: 2, // Soft shadow blur
});

// Optimize based on distance
shadowManager.optimizeLightShadow(light, distanceFromCamera);

// Enable selective shadows
shadowManager.enableSelectiveShadows(
  [floorMesh, wallMesh],
  true,  // castShadow
  true   // receiveShadow
);
```

### Performance Tips
- Use **MEDIUM** for most lights
- Use **LOW** for lights beyond 20 units from camera
- Disable shadows on small/distant objects
- Use `shadowManager.optimizeLightShadow()` to auto-adjust

---

## Room Lighting

The `RoomLightingManager` provides presets for different room types.

### Room Types

#### 1. Entrance (Bright, Neutral, Welcoming)
- Ambient: Light blue-white
- Torches: Warm orange, moderate flicker
- Purpose: Safe starting area

#### 2. Treasure (Golden, Warm, Mysterious)
- Ambient: Golden yellow
- Torches: Deep orange, slow flicker
- Accent: Spotlight on treasure
- Purpose: Highlight loot, create anticipation

#### 3. Combat (Red, Intense, Dangerous)
- Ambient: Dark red
- Torches: Red-orange, fast flicker
- Purpose: Increase tension, warn of danger

#### 4. Boss (Dramatic, Shadowy, Ominous)
- Ambient: Very dark purple
- Torches: Purple, slow flicker, sparse
- Ceiling: Dramatic spotlight
- Purpose: Epic encounter atmosphere

#### 5. Exit (Blue, Ethereal, Calm)
- Ambient: Bright blue
- Torches: Blue-white, minimal flicker
- Purpose: Signal completion, relaxation

#### 6. Corridor (Dim, Sparse)
- Ambient: Dark gray
- Torches: Few, spread out
- Purpose: Create tension between rooms

### Usage
```typescript
import { RoomLightingManager, RoomType } from './lighting';

const roomManager = new RoomLightingManager(scene, lightPool);

// Create room lighting
roomManager.createRoomLights(RoomType.TREASURE, {
  width: 15,
  depth: 15,
});

// Update in game loop
function gameLoop(deltaTime) {
  roomManager.update(deltaTime);
}

// Switch rooms
roomManager.clearLights();
roomManager.createRoomLights(RoomType.COMBAT);
```

---

## Light Animations

The `LightAnimator` provides dynamic light effects.

### Animation Types

#### Flicker (Torch/Flame Effect)
```typescript
const animator = new LightAnimator();
animator.addLight(torchLight, {
  type: AnimationType.FLICKER,
  speed: 1.0,
  intensity: 0.3,
  enabled: true,
});
```

#### Pulse (Magical Aura)
```typescript
animator.addLight(magicLight, {
  type: AnimationType.PULSE,
  speed: 0.8,
  minIntensity: 0.6,
  maxIntensity: 1.4,
  enabled: true,
});
```

#### Strobe (Alarm/Danger)
```typescript
animator.addLight(alarmLight, {
  type: AnimationType.STROBE,
  speed: 3.0,
  enabled: true,
});
```

#### Rainbow (Treasure Effect)
```typescript
animator.addLight(treasureLight, {
  type: AnimationType.RAINBOW,
  speed: 0.5,
  colorRange: [
    new THREE.Color(0xffdd44),
    new THREE.Color(0xff8844),
    new THREE.Color(0xffaa44),
  ],
  enabled: true,
});
```

### Presets
```typescript
import { AnimationPresets } from './lighting/animations';

animator.addLight(light, AnimationPresets.torch);
animator.addLight(light, AnimationPresets.magicAura);
animator.addLight(light, AnimationPresets.alarm);
```

---

## React Integration

React hooks make lighting integration seamless.

### useLightPool
```typescript
function GameScene() {
  const sceneRef = useRef<THREE.Scene>(null);
  const lightPool = useLightPool(sceneRef.current, {
    pointLightCount: 40,
    shadowQuality: ShadowQuality.MEDIUM,
  });

  return <Canvas ref={sceneRef}>...</Canvas>;
}
```

### useTorchLight
```typescript
function Torch({ position }: { position: THREE.Vector3 }) {
  const sceneRef = useRef<THREE.Scene>(null);
  const torch = useTorchLight(sceneRef.current, position, {
    intensity: 2.0,
    flickerSpeed: 1.0,
    warmth: 0.7,
  });

  return null;
}
```

### useRoomLighting
```typescript
function Room({ roomType }: { roomType: RoomType }) {
  const sceneRef = useRef<THREE.Scene>(null);
  const lightPool = useLightPool(sceneRef.current);
  
  const roomManager = useRoomLighting(
    sceneRef.current,
    lightPool,
    roomType,
    { width: 12, depth: 12 }
  );

  return <Canvas ref={sceneRef}>...</Canvas>;
}
```

---

## Code Examples

### Example 1: Basic Torch Setup
```typescript
import * as THREE from 'three';
import { TorchLight } from './lighting';

const scene = new THREE.Scene();

// Create torch at position
const torch = new TorchLight({
  position: new THREE.Vector3(5, 2, 0),
  intensity: 2.0,
  flickerSpeed: 1.0,
  flickerIntensity: 0.3,
  warmth: 0.7,
  castShadow: true,
});

scene.add(torch.light);

// Update in game loop
function animate(deltaTime: number) {
  torch.update(deltaTime);
}
```

### Example 2: Room Lighting with Pooling
```typescript
import { LightPool, RoomLightingManager, RoomType } from './lighting';

const scene = new THREE.Scene();
const lightPool = new LightPool(scene, {
  pointLightCount: 30,
  shadowQuality: ShadowQuality.MEDIUM,
});

const roomManager = new RoomLightingManager(scene, lightPool);
roomManager.createRoomLights(RoomType.COMBAT, {
  width: 15,
  depth: 15,
});

// Update in game loop
function gameLoop(deltaTime: number) {
  roomManager.update(deltaTime);
}
```

### Example 3: Animated Magic Light
```typescript
import { LightAnimator, AnimationType } from './lighting/animations';
import * as THREE from 'three';

const scene = new THREE.Scene();
const magicLight = new THREE.PointLight(0x8844ff, 2.0, 12);
magicLight.position.set(0, 3, 0);
scene.add(magicLight);

const animator = new LightAnimator();
animator.addLight(magicLight, {
  type: AnimationType.PULSE,
  speed: 0.8,
  minIntensity: 0.6,
  maxIntensity: 1.4,
  enabled: true,
});

// Update in game loop
function animate(deltaTime: number) {
  animator.update(deltaTime);
}
```

### Example 4: React Component with Complete Lighting
```typescript
import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { useLightPool, useRoomLighting, RoomType, ShadowQuality } from './lighting';

function DungeonRoom() {
  const sceneRef = useRef<THREE.Scene>(null);
  
  const lightPool = useLightPool(sceneRef.current, {
    pointLightCount: 40,
    spotLightCount: 10,
    shadowQuality: ShadowQuality.HIGH,
  });

  const roomManager = useRoomLighting(
    sceneRef.current,
    lightPool,
    RoomType.TREASURE,
    { width: 20, depth: 20 }
  );

  return (
    <Canvas shadows ref={sceneRef}>
      <ambientLight intensity={0.2} />
      {/* Your 3D content */}
    </Canvas>
  );
}
```

---

## Performance Tips

### 1. Use Light Pooling
Always use the `LightPool` for dynamic lights. Pre-allocate enough lights for your maximum expected count.

### 2. Optimize Shadow Quality
- Most lights: **MEDIUM** (1024×1024)
- Distant lights: **LOW** (512×512)
- Hero lights only: **HIGH** (2048×2048)
- Avoid **ULTRA** unless necessary

### 3. Limit Active Lights
- Target: 15-20 active lights per scene
- Use `lightPool.getStats()` to monitor
- Release lights when off-screen

### 4. Selective Shadow Casting
Not every object needs to cast shadows:
```typescript
// Only important objects cast shadows
player.castShadow = true;
enemy.castShadow = true;

// Small objects don't need shadows
coin.castShadow = false;
particle.castShadow = false;
```

### 5. Use Lightmap Baking for Static Geometry
For rooms that don't change:
```typescript
import { LightmapBaker } from './lighting/baking';

const baker = new LightmapBaker(scene, renderer);
await baker.bakeLightmap(staticMeshes, lights);
```

### 6. Distance-Based Light Culling
Disable lights far from the camera:
```typescript
lights.forEach(light => {
  const distance = camera.position.distanceTo(light.position);
  light.visible = distance < 30;
});
```

### 7. Monitor Performance
```typescript
const stats = lightPool.getStats();
console.log(`Lights: ${stats.activeLights}/${stats.totalLights}`);
console.log(`Available: ${stats.availableLights}`);
```

---

## Integration Checklist

- [ ] Initialize `LightPool` with adequate capacity
- [ ] Configure `ShadowManager` with target quality
- [ ] Set up `RoomLightingManager` for room types
- [ ] Add torch lights to walls
- [ ] Configure shadow casting on meshes
- [ ] Set up light animations
- [ ] Test with 20+ lights for performance
- [ ] Verify flickering looks realistic
- [ ] Check shadow quality at different distances
- [ ] Optimize for 60 FPS target

---

**Version:** 1.0  
**Last Updated:** 2026-02-13  
**Target:** Agent Arena 3D Roguelike - P2.6
