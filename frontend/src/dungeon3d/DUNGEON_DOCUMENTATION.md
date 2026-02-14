# Dungeon 3D Environment System

Complete 3D dungeon generation, rendering, and fog of war system for Agent Arena Roguelike.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Converting Backend BSP Dungeon to 3D](#converting-backend-bsp-dungeon-to-3d)
3. [Fog of War System](#fog-of-war-system)
4. [Lighting Setup](#lighting-setup)
5. [Performance Optimization](#performance-optimization)
6. [Code Examples](#code-examples)
7. [API Reference](#api-reference)

---

## Architecture Overview

The dungeon 3D system is composed of several key modules:

### Core Modules

- **types.ts** - TypeScript definitions for all dungeon entities
- **generator.ts** - Procedural geometry generation from backend data
- **materials.ts** - PBR material library for realistic rendering
- **fogOfWar.ts** - Shader-based fog of war with exploration tracking
- **lighting.ts** - Dynamic lighting with torch effects and light pooling
- **useDungeon3D.ts** - React hooks for easy integration

### Data Flow

```
Backend BSP Data → DungeonGenerator.convertBackendRoom() → DungeonRoom3D
                                     ↓
                          DungeonGenerator.generateRoom()
                                     ↓
                    DungeonMeshes (walls, floor, ceiling, doors)
                                     ↓
                              THREE.Scene
```

---

## Converting Backend BSP Dungeon to 3D

The system automatically converts backend BSP (Binary Space Partitioning) dungeon data into 3D meshes.

### Backend Data Structure

```typescript
interface BackendDungeonRoom {
  id: string;
  x: number;          // Grid position X
  y: number;          // Grid position Y
  width: number;      // Room width in tiles
  height: number;     // Room height in tiles
  type?: string;      // Room type (entrance, combat, boss, etc.)
  exits?: {
    north?: boolean;
    south?: boolean;
    east?: boolean;
    west?: boolean;
  };
  connectedRooms?: string[];
}

interface BackendDungeonData {
  id: string;
  seed: number;
  rooms: BackendDungeonRoom[];
  startRoomId: string;
  bossRoomId?: string;
  exitRoomId?: string;
}
```

### Conversion Process

```typescript
import { DungeonGenerator } from './dungeon3d';

// Convert single room
const room3D = DungeonGenerator.convertBackendRoom(backendRoom, {
  tileSize: 2,
  wallHeight: 4,
  gridSize: 10,
  optimizeMeshes: true,
});

// Generate 3D meshes
const generator = new DungeonGenerator(materialLibrary);
const meshes = generator.generateRoom(room3D);
scene.add(meshes.group);
```

### Tile-Based Layout

Each room uses a tile grid (default 10x10) for precise placement:

- **Tile Size**: 2 units (configurable)
- **Wall Height**: 4 units (configurable)
- **Grid Size**: 10x10 tiles (configurable to 8x8)

---

## Fog of War System

The fog of war uses shader-based rendering for performance and visual quality.

### How It Works

1. **Exploration Tracking**: Each room has a 2D grid tracking explored tiles
2. **Shader Rendering**: Custom shader darkens unexplored areas
3. **Dynamic Updates**: Updates in real-time as player moves
4. **Persistent State**: Exploration state persists per room

### Shader Implementation

The fog of war shader combines:
- **Exploration Map**: Texture tracking explored tiles (white = explored, black = unexplored)
- **Player Position**: Current player location for visibility radius
- **Visibility Radius**: Configurable radius around player
- **Fog Color**: Darken color for unexplored areas

### Exploration States

- **Unexplored**: Completely dark (90% opacity fog)
- **Explored**: 40% brightness when not visible
- **Visible**: Full brightness within player's visibility radius

---

## Lighting Setup

Dynamic lighting creates atmosphere and depth in dungeon rooms.

### Lighting Components

1. **Ambient Light**: Global room illumination (varies by room type)
2. **Torch Lights**: Point lights along walls with flickering effect
3. **Ceiling Light**: Central point light for better visibility
4. **Shadows**: Optional shadow casting for realism

### Room Type Lighting

Different room types have unique lighting:

| Room Type | Ambient Color | Intensity | Mood          |
|-----------|---------------|-----------|---------------|
| Entrance  | Gray          | 0.4       | Neutral       |
| Treasure  | Gold          | 0.5       | Inviting      |
| Combat    | Dark Red      | 0.2       | Dangerous     |
| Boss      | Purple        | 0.15      | Ominous       |
| Exit      | Green         | 0.45      | Safe          |

### Torch Configuration

- **Spacing**: Every 4 units along walls
- **Height**: 70% of wall height
- **Color**: Orange (#ffa500)
- **Intensity**: 1.2 (with flickering)
- **Distance**: 8 units
- **Decay**: 2 (realistic falloff)

### Light Pooling

For performance, lights are pooled and reused:

```typescript
const lighting = new DungeonLighting(scene, true);

// Lights are automatically pooled
const lights = lighting.createRoomLighting(room);

// Animate torch flickering
lighting.animateTorches(deltaTime);

// Clean up (returns lights to pool)
lighting.removeRoomLighting(room.id);
```

---

## Performance Optimization

### Mesh Optimization

1. **Geometry Merging**: Walls are merged into single mesh when `optimizeMeshes: true`
2. **Instanced Rendering**: Future enhancement for repeated elements
3. **Frustum Culling**: Automatic with Three.js
4. **LOD (Level of Detail)**: Can be added for distant rooms

### Light Pooling

- Pre-creates 30 lights on initialization
- Reuses lights instead of creating/destroying
- Reduces garbage collection overhead

### Texture Optimization

- Procedural normal maps (no external files)
- Tiling textures with repeat wrapping
- Configurable texture resolution

### Recommended Settings

For 60 FPS with multiple rooms:

```typescript
const options = {
  optimizeMeshes: true,      // Merge wall geometries
  generateColliders: false,  // Skip if not needed
  gridSize: 10,              // Balance detail vs performance
};

// Limit active lights
const lighting = new DungeonLighting(scene, true);
// Light pooling handles this automatically

// Reduce shadow quality if needed
renderer.shadowMap.type = THREE.PCFShadowMap; // or BasicShadowMap
```

---

## Code Examples

### Example 1: Basic Integration

```typescript
import { useDungeon3D } from './dungeon3d';

function DungeonScene() {
  const sceneRef = useRef<THREE.Scene>(null);
  const [dungeonData, setDungeonData] = useState(null);

  const { dungeon, currentRoom, updatePlayerPosition } = useDungeon3D(
    sceneRef.current,
    dungeonData,
    { tileSize: 2, wallHeight: 4, gridSize: 10 }
  );

  // Update player position every frame
  useFrame(() => {
    if (playerPosition) {
      updatePlayerPosition(playerPosition);
    }
  });

  return <primitive object={sceneRef.current} />;
}
```

### Example 2: Single Room Generation

```typescript
import { useRoomMesh } from './dungeon3d';

function RoomPreview({ backendRoom }: { backendRoom: BackendDungeonRoom }) {
  const sceneRef = useRef<THREE.Scene>(null);
  
  // Convert backend room to 3D
  const room3D = DungeonGenerator.convertBackendRoom(backendRoom);
  
  // Generate meshes
  const meshes = useRoomMesh(sceneRef.current, room3D);

  return <primitive object={sceneRef.current} />;
}
```

### Example 3: Custom Fog of War

```typescript
import { useFogOfWar } from './dungeon3d';

function DungeonWithFog() {
  const sceneRef = useRef<THREE.Scene>(null);
  
  const {
    fogOfWar,
    enabled,
    setEnabled,
    updatePlayerPosition,
    getExplorationPercentage,
  } = useFogOfWar(sceneRef.current, 10, 8);

  // Update fog of war
  useFrame(() => {
    updatePlayerPosition(playerPos, currentRoomId);
  });

  // Check exploration
  useEffect(() => {
    const percent = getExplorationPercentage(roomId);
    console.log(`Room ${percent}% explored`);
  }, [roomId]);

  return (
    <div>
      <button onClick={() => setEnabled(!enabled)}>
        Toggle Fog of War
      </button>
      <primitive object={sceneRef.current} />
    </div>
  );
}
```

### Example 4: Dynamic Lighting Control

```typescript
import { useDungeonLighting } from './dungeon3d';

function DungeonWithLighting() {
  const sceneRef = useRef<THREE.Scene>(null);
  
  const {
    lighting,
    shadowsEnabled,
    toggleShadows,
    animateTorches,
  } = useDungeonLighting(sceneRef.current, true);

  // Animate torches every frame
  useFrame((state, delta) => {
    animateTorches(delta);
  });

  return (
    <div>
      <button onClick={toggleShadows}>
        Shadows: {shadowsEnabled ? 'On' : 'Off'}
      </button>
      <primitive object={sceneRef.current} />
    </div>
  );
}
```

### Example 5: Complete Dungeon Setup

```typescript
import * as THREE from 'three';
import { useDungeon3D } from './dungeon3d';
import { Canvas, useFrame } from '@react-three/fiber';

function CompleteDungeon() {
  const [dungeonData, setDungeonData] = useState<BackendDungeonData | null>(null);
  const [playerPosition, setPlayerPosition] = useState(new THREE.Vector3(0, 1, 0));

  // Load dungeon from backend
  useEffect(() => {
    fetch('/api/dungeon/generate')
      .then(res => res.json())
      .then(data => setDungeonData(data));
  }, []);

  return (
    <Canvas shadows camera={{ position: [0, 10, 10] }}>
      <DungeonScene 
        dungeonData={dungeonData} 
        playerPosition={playerPosition}
        onPlayerMove={setPlayerPosition}
      />
    </Canvas>
  );
}

function DungeonScene({ dungeonData, playerPosition, onPlayerMove }) {
  const sceneRef = useRef<THREE.Scene>(null);

  const {
    dungeon,
    currentRoom,
    switchToRoom,
    updatePlayerPosition,
    update,
  } = useDungeon3D(sceneRef.current, dungeonData, {
    tileSize: 2,
    wallHeight: 4,
    gridSize: 10,
    optimizeMeshes: true,
  });

  // Update every frame
  useFrame((state, delta) => {
    updatePlayerPosition(playerPosition);
    update(delta);
  });

  return <primitive object={sceneRef.current} />;
}
```

---

## API Reference

### DungeonGenerator

```typescript
class DungeonGenerator {
  constructor(materials: MaterialLibrary, options?: Partial<GeneratorOptions>);
  generateRoom(room: DungeonRoom3D): DungeonMeshes;
  static convertBackendRoom(
    backendRoom: BackendDungeonRoom,
    options?: Partial<GeneratorOptions>
  ): DungeonRoom3D;
}
```

### FogOfWar

```typescript
class FogOfWar {
  constructor(scene: THREE.Scene, gridSize?: number, visibilityRadius?: number);
  updatePlayerPosition(position: THREE.Vector3, roomId: string): void;
  switchRoom(roomId: string, room: DungeonRoom3D): void;
  revealRoom(roomId: string): void;
  resetRoom(roomId: string): void;
  setVisibilityRadius(radius: number): void;
  setEnabled(enabled: boolean): void;
  getExplorationPercentage(roomId: string): number;
}
```

### DungeonLighting

```typescript
class DungeonLighting {
  constructor(scene: THREE.Scene, enableShadows?: boolean);
  createRoomLighting(room: DungeonRoom3D): THREE.Light[];
  removeRoomLighting(roomId: string): void;
  setShadowsEnabled(enabled: boolean): void;
  animateTorches(deltaTime: number): void;
}
```

### useDungeon3D Hook

```typescript
function useDungeon3D(
  scene: THREE.Scene | null,
  dungeonData: BackendDungeonData | null,
  options?: Partial<GeneratorOptions>
): {
  dungeon: Dungeon3D | null;
  currentRoom: DungeonRoom3D | null;
  isLoading: boolean;
  switchToRoom: (roomId: string) => void;
  updatePlayerPosition: (position: THREE.Vector3) => void;
  update: (deltaTime: number) => void;
  fogOfWar: FogOfWar | null;
  lighting: DungeonLighting | null;
}
```

---

## Best Practices

1. **Memory Management**: Always dispose of meshes when switching rooms
2. **Light Count**: Limit active lights to 20-30 for performance
3. **Shadow Maps**: Use 512x512 or 1024x1024 for balance
4. **Fog of War**: Keep grid size at 10x10 for optimal performance
5. **Material Sharing**: Reuse materials via MaterialLibrary
6. **Mesh Merging**: Enable `optimizeMeshes: true` for production

---

## Troubleshooting

### Low FPS

- Reduce shadow map resolution
- Disable shadows on some lights
- Enable mesh optimization
- Reduce number of active rooms

### Z-Fighting on Floor

- Fog of war mesh is at y=0.1 to prevent this
- Adjust if needed: `fogMesh.position.y = 0.15`

### Textures Not Loading

- Check texture URLs in MaterialLibrary
- Procedural textures are fallback
- Verify CORS settings for external textures

### Lights Too Dark/Bright

- Adjust ambient intensity
- Modify torch spacing/intensity
- Change room type colors in lighting.ts

---

## Future Enhancements

- [ ] Level of Detail (LOD) for distant rooms
- [ ] Texture atlas for better performance
- [ ] Procedural decoration placement
- [ ] Dynamic room modifications (destructible walls)
- [ ] Weather effects (water, fog, fire)
- [ ] Mini-map generation from exploration data
- [ ] Room transitions with animations
- [ ] Particle effects for traps

---

## Credits

Part of **Agent Arena 3D Roguelike** dungeon generation system.
Built with Three.js, React Three Fiber, and TypeScript.
