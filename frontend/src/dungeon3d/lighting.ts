/**
 * lighting.ts - Dynamic Dungeon Lighting
 * 
 * Creates atmospheric lighting for dungeon rooms with torches,
 * ambient lights, and shadow configuration. Includes light pooling
 * for performance optimization.
 */

import * as THREE from 'three';
import { DungeonRoom3D, RoomType, TorchLight } from './types';

/**
 * Light pool for performance optimization
 */
class LightPool {
  private availableLights: THREE.PointLight[] = [];
  private activeLights: Set<THREE.PointLight> = new Set();
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene, initialSize: number = 20) {
    this.scene = scene;
    this.prewarmPool(initialSize);
  }

  /**
   * Pre-create lights for reuse
   */
  private prewarmPool(count: number): void {
    for (let i = 0; i < count; i++) {
      const light = new THREE.PointLight(0xffa500, 1, 10, 2);
      light.castShadow = true;
      light.shadow.mapSize.width = 512;
      light.shadow.mapSize.height = 512;
      light.shadow.camera.near = 0.1;
      light.shadow.camera.far = 25;
      light.visible = false;
      this.availableLights.push(light);
    }
  }

  /**
   * Acquire a light from the pool
   */
  acquire(): THREE.PointLight {
    let light = this.availableLights.pop();
    
    if (!light) {
      // Create new light if pool is empty
      light = new THREE.PointLight(0xffa500, 1, 10, 2);
      light.castShadow = true;
      light.shadow.mapSize.width = 512;
      light.shadow.mapSize.height = 512;
      light.shadow.camera.near = 0.1;
      light.shadow.camera.far = 25;
    }

    light.visible = true;
    this.activeLights.add(light);
    this.scene.add(light);
    
    return light;
  }

  /**
   * Release a light back to the pool
   */
  release(light: THREE.PointLight): void {
    if (!this.activeLights.has(light)) return;

    light.visible = false;
    this.activeLights.delete(light);
    this.scene.remove(light);
    this.availableLights.push(light);
  }

  /**
   * Release all active lights
   */
  releaseAll(): void {
    this.activeLights.forEach(light => {
      light.visible = false;
      this.scene.remove(light);
      this.availableLights.push(light);
    });
    this.activeLights.clear();
  }

  /**
   * Dispose all lights in pool
   */
  dispose(): void {
    this.releaseAll();
    this.availableLights.forEach(light => light.dispose());
    this.availableLights = [];
  }
}

/**
 * Dungeon lighting manager
 */
export class DungeonLighting {
  private scene: THREE.Scene;
  private lightPool: LightPool;
  private roomLights: Map<string, THREE.Light[]>;
  private ambientLight: THREE.AmbientLight;
  private shadowsEnabled: boolean;

  constructor(scene: THREE.Scene, enableShadows: boolean = true) {
    this.scene = scene;
    this.lightPool = new LightPool(scene, 30);
    this.roomLights = new Map();
    this.shadowsEnabled = enableShadows;

    // Add ambient light
    this.ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    this.scene.add(this.ambientLight);
  }

  /**
   * Create lighting for a room based on its type
   */
  createRoomLighting(room: DungeonRoom3D): THREE.Light[] {
    const lights: THREE.Light[] = [];

    // Room-specific ambient light
    const roomAmbient = new THREE.AmbientLight(
      this.getAmbientColorForRoom(room.roomType),
      this.getAmbientIntensityForRoom(room.roomType)
    );
    this.scene.add(roomAmbient);
    lights.push(roomAmbient);

    // Add torch lights along walls
    const torches = this.createTorchLights(room);
    torches.forEach(torchLight => {
      const light = this.lightPool.acquire();
      light.position.copy(torchLight.position);
      light.color = torchLight.color;
      light.intensity = torchLight.intensity;
      light.distance = torchLight.distance;
      light.decay = torchLight.decay;
      
      if (this.shadowsEnabled) {
        light.castShadow = true;
      }

      lights.push(light);
    });

    // Add central ceiling light for better visibility
    const ceilingLight = new THREE.PointLight(0xffffcc, 0.5, 20, 2);
    ceilingLight.position.set(
      room.position.x,
      room.dimensions.height * 0.8,
      room.position.z
    );
    this.scene.add(ceilingLight);
    lights.push(ceilingLight);

    // Store lights for this room
    this.roomLights.set(room.id, lights);

    return lights;
  }

  /**
   * Create torch lights along walls
   */
  private createTorchLights(room: DungeonRoom3D): TorchLight[] {
    const torches: TorchLight[] = [];
    const { width, depth, height } = room.dimensions;
    const torchHeight = height * 0.7;
    const torchSpacing = 4;

    // North wall torches
    const northTorchCount = Math.floor(width / torchSpacing);
    for (let i = 0; i < northTorchCount; i++) {
      const x = -width / 2 + (i + 1) * torchSpacing;
      torches.push({
        position: new THREE.Vector3(
          room.position.x + x,
          torchHeight,
          room.position.z - depth / 2 + 0.5
        ),
        intensity: 1.2,
        color: new THREE.Color(0xffa500),
        distance: 8,
        decay: 2,
      });
    }

    // South wall torches
    const southTorchCount = Math.floor(width / torchSpacing);
    for (let i = 0; i < southTorchCount; i++) {
      const x = -width / 2 + (i + 1) * torchSpacing;
      torches.push({
        position: new THREE.Vector3(
          room.position.x + x,
          torchHeight,
          room.position.z + depth / 2 - 0.5
        ),
        intensity: 1.2,
        color: new THREE.Color(0xffa500),
        distance: 8,
        decay: 2,
      });
    }

    // East wall torches
    const eastTorchCount = Math.floor(depth / torchSpacing);
    for (let i = 0; i < eastTorchCount; i++) {
      const z = -depth / 2 + (i + 1) * torchSpacing;
      torches.push({
        position: new THREE.Vector3(
          room.position.x + width / 2 - 0.5,
          torchHeight,
          room.position.z + z
        ),
        intensity: 1.2,
        color: new THREE.Color(0xffa500),
        distance: 8,
        decay: 2,
      });
    }

    // West wall torches
    const westTorchCount = Math.floor(depth / torchSpacing);
    for (let i = 0; i < westTorchCount; i++) {
      const z = -depth / 2 + (i + 1) * torchSpacing;
      torches.push({
        position: new THREE.Vector3(
          room.position.x - width / 2 + 0.5,
          torchHeight,
          room.position.z + z
        ),
        intensity: 1.2,
        color: new THREE.Color(0xffa500),
        distance: 8,
        decay: 2,
      });
    }

    return torches;
  }

  /**
   * Get ambient color based on room type
   */
  private getAmbientColorForRoom(roomType: RoomType): THREE.Color {
    switch (roomType) {
      case RoomType.ENTRANCE:
        return new THREE.Color(0x6a6a6a);
      case RoomType.TREASURE:
        return new THREE.Color(0xffcc00);
      case RoomType.COMBAT:
        return new THREE.Color(0x550000);
      case RoomType.BOSS:
        return new THREE.Color(0x330033);
      case RoomType.EXIT:
        return new THREE.Color(0x00aa00);
      default:
        return new THREE.Color(0x404040);
    }
  }

  /**
   * Get ambient intensity based on room type
   */
  private getAmbientIntensityForRoom(roomType: RoomType): number {
    switch (roomType) {
      case RoomType.ENTRANCE:
        return 0.4;
      case RoomType.TREASURE:
        return 0.5;
      case RoomType.COMBAT:
        return 0.2;
      case RoomType.BOSS:
        return 0.15;
      case RoomType.EXIT:
        return 0.45;
      default:
        return 0.3;
    }
  }

  /**
   * Remove lighting for a room
   */
  removeRoomLighting(roomId: string): void {
    const lights = this.roomLights.get(roomId);
    if (!lights) return;

    lights.forEach(light => {
      if (light instanceof THREE.PointLight) {
        this.lightPool.release(light);
      } else {
        this.scene.remove(light);
        light.dispose();
      }
    });

    this.roomLights.delete(roomId);
  }

  /**
   * Update lighting intensity (for day/night cycles or events)
   */
  updateIntensity(roomId: string, multiplier: number): void {
    const lights = this.roomLights.get(roomId);
    if (!lights) return;

    lights.forEach(light => {
      if (light instanceof THREE.PointLight) {
        light.intensity *= multiplier;
      }
    });
  }

  /**
   * Enable/disable shadows
   */
  setShadowsEnabled(enabled: boolean): void {
    this.shadowsEnabled = enabled;
    
    this.roomLights.forEach(lights => {
      lights.forEach(light => {
        if (light instanceof THREE.PointLight) {
          light.castShadow = enabled;
        }
      });
    });
  }

  /**
   * Set global ambient light intensity
   */
  setAmbientIntensity(intensity: number): void {
    this.ambientLight.intensity = intensity;
  }

  /**
   * Set global ambient light color
   */
  setAmbientColor(color: THREE.Color): void {
    this.ambientLight.color = color;
  }

  /**
   * Animate torch flicker effect
   */
  animateTorches(deltaTime: number): void {
    this.roomLights.forEach(lights => {
      lights.forEach(light => {
        if (light instanceof THREE.PointLight && light.name !== 'ceiling') {
          // Subtle flickering
          const flicker = Math.sin(Date.now() * 0.005 + light.position.x) * 0.1 + 0.9;
          light.intensity = 1.2 * flicker;
        }
      });
    });
  }

  /**
   * Dispose all lighting resources
   */
  dispose(): void {
    this.roomLights.forEach((lights, roomId) => {
      this.removeRoomLighting(roomId);
    });
    
    this.lightPool.dispose();
    this.scene.remove(this.ambientLight);
    this.ambientLight.dispose();
  }
}

/**
 * Create default room lighting configuration
 */
export function createDefaultLighting(
  scene: THREE.Scene,
  enableShadows: boolean = true
): DungeonLighting {
  return new DungeonLighting(scene, enableShadows);
}
