# Renderer Documentation

## Architecture Overview

The Agent Arena 3D renderer is built on Three.js with a modular architecture designed for performance, maintainability, and ease of use. It provides a clean abstraction layer for rendering isometric 3D scenes with Hades-style camera perspective.

```
┌─────────────────────────────────────────────────────────┐
│                    React Components                      │
│  (Pages, UI Components using useRenderer hooks)         │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│                  useRenderer.ts                          │
│  React Hooks: useThreeScene, useAnimationLoop,          │
│               usePerformanceStats, useRenderer           │
└───────────────────┬─────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
┌─────────────┐ ┌─────────┐ ┌───────────────┐
│  scene.ts   │ │camera.ts│ │performance.ts │
│SceneManager │ │Camera   │ │Performance    │
│(Singleton)  │ │Controller│ │Monitor        │
└─────────────┘ └─────────┘ └───────────────┘
        │           │           │
        └───────────┴───────────┘
                    │
                    ▼
            ┌───────────────┐
            │   Three.js    │
            │  WebGLRenderer│
            └───────────────┘
```

## Core Modules

### 1. **types.ts** - Type Definitions
Comprehensive TypeScript types for configuration, stats, and rendering.

### 2. **scene.ts** - Scene Manager (Singleton)
- Initializes WebGL renderer with antialiasing
- Manages scene lifecycle
- Configures lighting (ambient + directional)
- Handles viewport resizing
- Provides cleanup methods

### 3. **camera.ts** - Camera Controller
- Orthographic camera for isometric perspective
- Hades-style camera angles (45° horizontal, ~35° vertical)
- Zoom, pan, rotate controls
- Viewport-responsive frustum calculation

### 4. **performance.ts** - Performance Monitor
- Real-time FPS tracking
- Frame time measurement
- Draw call and triangle counting
- Memory usage monitoring
- Performance warnings (< 30 FPS alerts)

### 5. **useRenderer.ts** - React Hooks
- `useThreeScene()` - Initialize scene and camera
- `useAnimationLoop()` - RAF-based render loop
- `usePerformanceStats()` - Access performance metrics
- `useRenderer()` - Complete all-in-one solution

## Integration with Existing Dungeon Page

### Basic Integration

```tsx
import { useRenderer } from '@/renderer';
import { getHadesCameraConfig } from '@/renderer/camera';

function DungeonPage() {
  const { canvasRef, sceneManager, cameraController, stats, isReady } = useRenderer({
    camera: getHadesCameraConfig(20),
    renderer: {
      antialias: true,
      powerPreference: 'high-performance',
    },
    backgroundColor: 0x1a1a2e,
    enableShadows: true,
  }, (deltaTime, elapsedTime) => {
    // Your render logic here
    // Update game objects, animations, etc.
  });

  return (
    <div className="relative w-full h-screen">
      <canvas ref={canvasRef} className="w-full h-full" />
      
      {/* FPS Counter */}
      <div className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded">
        FPS: {stats.fps} | Frame: {stats.frameTime.toFixed(2)}ms
      </div>
    </div>
  );
}
```

### Advanced Integration with Custom Render Loop

```tsx
import { useThreeScene, useAnimationLoop, usePerformanceStats } from '@/renderer';
import { getHadesCameraConfig } from '@/renderer/camera';
import * as THREE from 'three';

function DungeonPage() {
  const { canvasRef, sceneManager, cameraController, isReady } = useThreeScene({
    camera: getHadesCameraConfig(20),
    renderer: { antialias: true },
    backgroundColor: 0x1a1a2e,
  });

  const { stats, update: updatePerformance } = usePerformanceStats(
    sceneManager?.renderer
  );

  // Custom render loop
  useAnimationLoop((deltaTime, elapsedTime) => {
    if (!sceneManager || !cameraController) return;

    // Update performance
    updatePerformance();

    // Your game logic
    // - Update player position
    // - Update enemies
    // - Handle collisions
    // - Animate objects

    // Render scene
    sceneManager.render(cameraController.camera);
  }, isReady);

  return (
    <div className="relative w-full h-screen">
      <canvas ref={canvasRef} />
      <FPSDisplay stats={stats} />
    </div>
  );
}
```

### Adding Objects to Scene

```tsx
import { useMesh } from '@/renderer';
import * as THREE from 'three';

function DungeonPage() {
  const { canvasRef, sceneManager, cameraController, isReady } = useRenderer(config);

  // Add a test cube (automatically cleaned up on unmount)
  const cube = useMesh(() => {
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    return new THREE.Mesh(geometry, material);
  }, sceneManager?.scene);

  // Animate cube in render loop
  useAnimationLoop((deltaTime) => {
    if (cube) {
      cube.rotation.y += deltaTime;
    }
  }, isReady);

  return <canvas ref={canvasRef} />;
}
```

## Performance Optimization Tips

### 1. **Use Object Pooling**
```tsx
// Instead of creating/destroying objects each frame
const objectPool = useMemo(() => createObjectPool(100), []);
```

### 2. **Limit Draw Calls**
- Merge static geometries
- Use instanced meshes for repeated objects
- Batch materials

### 3. **Monitor Performance**
```tsx
const { stats, monitor } = usePerformanceStats(renderer);

useEffect(() => {
  monitor?.onPerformanceWarning((warning) => {
    console.warn(`Performance warning: ${warning.message}`);
    // Reduce quality, disable effects, etc.
  });
}, [monitor]);
```

### 4. **Optimize Shadows**
```tsx
// Use lower resolution shadow maps for distant objects
directionalLight.shadow.mapSize.width = 1024; // Instead of 2048
```

### 5. **Frustum Culling**
Three.js handles this automatically, but ensure objects outside view are not updated.

## Troubleshooting

### Issue: Low FPS (< 30)

**Causes:**
- Too many draw calls
- Complex shaders
- High triangle count
- Inefficient render loop

**Solutions:**
1. Check `stats.drawCalls` and `stats.triangles`
2. Use simpler materials for distant objects
3. Implement LOD (Level of Detail)
4. Use performance monitor to identify bottlenecks

### Issue: Canvas not rendering

**Causes:**
- Canvas ref not attached
- Scene not initialized
- Camera position incorrect

**Solutions:**
```tsx
// Ensure isReady is true before rendering
if (!isReady) return <div>Loading...</div>;

// Check camera position
console.log(cameraController?.getPosition());

// Verify scene has objects
console.log(sceneManager?.scene.children.length);
```

### Issue: Memory leaks

**Causes:**
- Not disposing geometries/materials
- Not cleaning up on unmount

**Solutions:**
```tsx
// Use useMesh hook for automatic cleanup
useMesh(() => createMyMesh(), scene);

// Or manually dispose
useEffect(() => {
  const mesh = createMyMesh();
  scene.add(mesh);
  
  return () => {
    scene.remove(mesh);
    mesh.geometry.dispose();
    mesh.material.dispose();
  };
}, []);
```

### Issue: Aspect ratio distortion

**Causes:**
- Camera frustum not updated on resize
- Incorrect aspect ratio calculation

**Solutions:**
```tsx
// The renderer handles this automatically, but if using custom setup:
window.addEventListener('resize', () => {
  cameraController.updateFrustum({
    width: window.innerWidth,
    height: window.innerHeight,
    aspectRatio: window.innerWidth / window.innerHeight,
    pixelRatio: window.devicePixelRatio,
  });
});
```

## Code Examples

### Example 1: Simple Rotating Cube

```tsx
import { useRenderer, useMesh } from '@/renderer';
import { getHadesCameraConfig } from '@/renderer/camera';
import * as THREE from 'three';

export function SimpleScene() {
  const { canvasRef, sceneManager, stats, isReady } = useRenderer({
    camera: getHadesCameraConfig(15),
    renderer: { antialias: true },
    backgroundColor: 0x0a0a0a,
  });

  const cube = useMesh(() => {
    const geometry = new THREE.BoxGeometry(3, 3, 3);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xff6b35,
      metalness: 0.3,
      roughness: 0.4,
    });
    return new THREE.Mesh(geometry, material);
  }, sceneManager?.scene);

  useAnimationLoop((deltaTime) => {
    if (cube) {
      cube.rotation.x += deltaTime * 0.5;
      cube.rotation.y += deltaTime * 0.7;
    }
  }, isReady);

  return (
    <div className="relative w-full h-screen bg-gray-900">
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute top-4 right-4 bg-black/70 text-green-400 p-3 rounded font-mono">
        FPS: {stats.fps}
      </div>
    </div>
  );
}
```

### Example 2: Interactive Camera Controls

```tsx
import { useThreeScene, useAnimationLoop } from '@/renderer';
import { getHadesCameraConfig } from '@/renderer/camera';

export function InteractiveScene() {
  const { canvasRef, cameraController, isReady } = useThreeScene({
    camera: getHadesCameraConfig(20),
    renderer: { antialias: true },
  });

  const handleZoomIn = () => cameraController?.zoomIn(0.2);
  const handleZoomOut = () => cameraController?.zoomOut(0.2);

  return (
    <div className="relative w-full h-screen">
      <canvas ref={canvasRef} />
      <div className="absolute bottom-4 left-4 space-x-2">
        <button onClick={handleZoomIn} className="btn">Zoom In</button>
        <button onClick={handleZoomOut} className="btn">Zoom Out</button>
      </div>
    </div>
  );
}
```

### Example 3: Performance-Aware Rendering

```tsx
import { useRenderer, usePerformanceStats } from '@/renderer';
import { PerformanceLevel } from '@/renderer/types';

export function PerformanceAwareScene() {
  const { canvasRef, sceneManager, stats } = useRenderer(config);
  const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('high');

  useEffect(() => {
    // Adjust quality based on performance
    if (stats.fps < 30) {
      setQuality('low');
    } else if (stats.fps < 45) {
      setQuality('medium');
    } else {
      setQuality('high');
    }
  }, [stats.fps]);

  return (
    <div className="relative w-full h-screen">
      <canvas ref={canvasRef} />
      <div className="absolute top-4 left-4 text-white">
        Quality: {quality} | FPS: {stats.fps}
      </div>
    </div>
  );
}
```

## Next Steps

1. **Integrate with existing dungeon system** - Connect renderer to dungeon generation
2. **Add post-processing effects** - Bloom, SSAO, color grading
3. **Implement entity rendering** - Players, enemies, items
4. **Add particle systems** - Effects, magic, impacts
5. **Optimize for mobile** - Touch controls, lower quality settings

## API Reference

See individual module files for complete API documentation:
- `types.ts` - All type definitions
- `scene.ts` - SceneManager API
- `camera.ts` - CameraController API
- `performance.ts` - PerformanceMonitor API
- `useRenderer.ts` - React hooks API
