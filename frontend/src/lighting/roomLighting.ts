/**
 * Room Lighting Manager - Room-specific lighting configurations
 * Agent Arena 3D Roguelike - P2.6
 */

import * as THREE from 'three';
import { RoomType, RoomLightingConfig, LightConfig, TorchConfig, ShadowQuality } from './types';
import { TorchLight, WallTorchPlacer } from './torches';
import { LightPool } from './lightPool';

/**
 * Room lighting manager with presets for different room types
 */
export class RoomLightingManager {
  private scene: THREE.Scene;
  private lightPool: LightPool;
  private activeLights: THREE.Light[] = [];
  private activeTorches: TorchLight[] = [];
  private ambientLight: THREE.AmbientLight | null = null;
  private hemisphereLight: THREE.HemisphereLight | null = null;

  constructor(scene: THREE.Scene, lightPool: LightPool) {
    this.scene = scene;
    this.lightPool = lightPool;
  }

  /**
   * Create lights for a specific room type
   */
  public createRoomLights(
    roomType: RoomType,
    roomSize: { width: number; depth: number } = { width: 10, depth: 10 }
  ): void {
    // Clear existing lights
    this.clearLights();

    const config = this.getRoomLightingConfig(roomType, roomSize);

    // Add ambient light
    this.ambientLight = new THREE.AmbientLight(
      config.ambientLight.color,
      config.ambientLight.intensity
    );
    this.scene.add(this.ambientLight);

    // Add torches
    config.torches.forEach(torchConfig => {
      const torch = new TorchLight(torchConfig);
      this.activeTorches.push(torch);
      this.scene.add(torch.light);
    });

    // Add accent lights
    config.accentLights.forEach(lightConfig => {
      const light = this.createLight(lightConfig);
      if (light) {
        this.activeLights.push(light);
        this.scene.add(light);
      }
    });

    // Add ceiling lights if specified
    if (config.ceilingLights) {
      config.ceilingLights.forEach(lightConfig => {
        const light = this.createLight(lightConfig);
        if (light) {
          this.activeLights.push(light);
          this.scene.add(light);
        }
      });
    }

    console.log(`RoomLightingManager: Created ${roomType} room lighting`);
  }

  /**
   * Get lighting configuration for room type
   */
  private getRoomLightingConfig(
    roomType: RoomType,
    roomSize: { width: number; depth: number }
  ): RoomLightingConfig {
    switch (roomType) {
      case RoomType.ENTRANCE:
        return this.getEntranceConfig(roomSize);
      case RoomType.TREASURE:
        return this.getTreasureConfig(roomSize);
      case RoomType.COMBAT:
        return this.getCombatConfig(roomSize);
      case RoomType.BOSS:
        return this.getBossConfig(roomSize);
      case RoomType.EXIT:
        return this.getExitConfig(roomSize);
      case RoomType.CORRIDOR:
        return this.getCorridorConfig(roomSize);
      default:
        return this.getEntranceConfig(roomSize);
    }
  }

  /**
   * Entrance room: Bright, neutral, welcoming
   */
  private getEntranceConfig(roomSize: { width: number; depth: number }): RoomLightingConfig {
    const torchPositions = WallTorchPlacer.placeTorchesAroundRoom(roomSize, 5, 2.5);

    return {
      roomType: RoomType.ENTRANCE,
      ambientLight: {
        color: new THREE.Color(0xccccff),
        intensity: 0.4,
      },
      torches: torchPositions.map(pos => ({
        color: new THREE.Color(0xffcc88),
        intensity: 1.8,
        distance: 8,
        decay: 2,
        position: pos,
        flickerSpeed: 0.8,
        flickerIntensity: 0.2,
        warmth: 0.6,
        castShadow: true,
      })),
      accentLights: [
        {
          type: 'point' as any,
          color: new THREE.Color(0xffffff),
          intensity: 1.0,
          distance: 15,
          decay: 2,
          position: new THREE.Vector3(0, 4, 0),
          castShadow: false,
        },
      ],
      shadows: {
        quality: ShadowQuality.MEDIUM,
        enabled: true,
      },
    };
  }

  /**
   * Treasure room: Golden, warm, mysterious
   */
  private getTreasureConfig(roomSize: { width: number; depth: number }): RoomLightingConfig {
    const torchPositions = WallTorchPlacer.placeTorchesAroundRoom(roomSize, 4, 2.2);

    return {
      roomType: RoomType.TREASURE,
      ambientLight: {
        color: new THREE.Color(0xffdd88),
        intensity: 0.3,
      },
      torches: torchPositions.map(pos => ({
        color: new THREE.Color(0xffaa33),
        intensity: 2.2,
        distance: 10,
        decay: 2,
        position: pos,
        flickerSpeed: 0.6,
        flickerIntensity: 0.25,
        warmth: 0.8,
        castShadow: true,
      })),
      accentLights: [
        {
          type: 'point' as any,
          color: new THREE.Color(0xffdd44),
          intensity: 2.0,
          distance: 12,
          decay: 1.8,
          position: new THREE.Vector3(0, 1, 0),
          castShadow: true,
        },
      ],
      shadows: {
        quality: ShadowQuality.HIGH,
        enabled: true,
      },
    };
  }

  /**
   * Combat room: Red, intense, dangerous
   */
  private getCombatConfig(roomSize: { width: number; depth: number }): RoomLightingConfig {
    const torchPositions = WallTorchPlacer.placeTorchesAroundRoom(roomSize, 6, 2.5);

    return {
      roomType: RoomType.COMBAT,
      ambientLight: {
        color: new THREE.Color(0xff4444),
        intensity: 0.25,
      },
      torches: torchPositions.map(pos => ({
        color: new THREE.Color(0xff5533),
        intensity: 2.0,
        distance: 9,
        decay: 2,
        position: pos,
        flickerSpeed: 1.2,
        flickerIntensity: 0.35,
        warmth: 0.9,
        castShadow: true,
      })),
      accentLights: [
        {
          type: 'point' as any,
          color: new THREE.Color(0xff3333),
          intensity: 1.5,
          distance: 14,
          decay: 2,
          position: new THREE.Vector3(0, 3.5, 0),
          castShadow: false,
        },
      ],
      shadows: {
        quality: ShadowQuality.MEDIUM,
        enabled: true,
      },
    };
  }

  /**
   * Boss room: Dramatic, shadowy, ominous
   */
  private getBossConfig(roomSize: { width: number; depth: number }): RoomLightingConfig {
    // Fewer torches for dramatic effect
    const torchPositions = WallTorchPlacer.placeTorchesAroundRoom(roomSize, 8, 3);

    return {
      roomType: RoomType.BOSS,
      ambientLight: {
        color: new THREE.Color(0x330033),
        intensity: 0.15,
      },
      torches: torchPositions.map(pos => ({
        color: new THREE.Color(0xaa44ff),
        intensity: 1.5,
        distance: 12,
        decay: 2.5,
        position: pos,
        flickerSpeed: 0.5,
        flickerIntensity: 0.4,
        warmth: 0.3,
        castShadow: true,
      })),
      accentLights: [],
      ceilingLights: [
        {
          type: 'spot' as any,
          color: new THREE.Color(0xff88ff),
          intensity: 3.0,
          distance: 20,
          decay: 2,
          position: new THREE.Vector3(0, 8, 0),
          target: new THREE.Vector3(0, 0, 0),
          angle: Math.PI / 6,
          penumbra: 0.3,
          castShadow: true,
        },
      ],
      shadows: {
        quality: ShadowQuality.HIGH,
        enabled: true,
      },
    };
  }

  /**
   * Exit room: Blue, ethereal, calm
   */
  private getExitConfig(roomSize: { width: number; depth: number }): RoomLightingConfig {
    const torchPositions = WallTorchPlacer.placeTorchesAroundRoom(roomSize, 5, 2.5);

    return {
      roomType: RoomType.EXIT,
      ambientLight: {
        color: new THREE.Color(0x4488ff),
        intensity: 0.35,
      },
      torches: torchPositions.map(pos => ({
        color: new THREE.Color(0x6699ff),
        intensity: 1.6,
        distance: 10,
        decay: 2,
        position: pos,
        flickerSpeed: 0.4,
        flickerIntensity: 0.15,
        warmth: 0.2,
        castShadow: true,
      })),
      accentLights: [
        {
          type: 'point' as any,
          color: new THREE.Color(0x88ccff),
          intensity: 2.5,
          distance: 15,
          decay: 1.5,
          position: new THREE.Vector3(0, 3, 0),
          castShadow: false,
        },
      ],
      shadows: {
        quality: ShadowQuality.MEDIUM,
        enabled: true,
      },
    };
  }

  /**
   * Corridor: Dim, sparse lighting
   */
  private getCorridorConfig(roomSize: { width: number; depth: number }): RoomLightingConfig {
    const torchPositions = WallTorchPlacer.placeTorchesAroundRoom(roomSize, 6, 2.5);

    return {
      roomType: RoomType.CORRIDOR,
      ambientLight: {
        color: new THREE.Color(0x666666),
        intensity: 0.2,
      },
      torches: torchPositions.slice(0, Math.floor(torchPositions.length / 2)).map(pos => ({
        color: new THREE.Color(0xff8844),
        intensity: 1.4,
        distance: 7,
        decay: 2,
        position: pos,
        flickerSpeed: 1.0,
        flickerIntensity: 0.3,
        warmth: 0.7,
        castShadow: true,
      })),
      accentLights: [],
      shadows: {
        quality: ShadowQuality.LOW,
        enabled: true,
      },
    };
  }

  /**
   * Create a light from configuration
   */
  private createLight(config: LightConfig): THREE.Light | null {
    let light: THREE.Light | null = null;

    const color = typeof config.color === 'number' || typeof config.color === 'string'
      ? new THREE.Color(config.color)
      : config.color;

    if (config.type === 'point') {
      light = new THREE.PointLight(
        color,
        config.intensity,
        config.distance ?? 10,
        config.decay ?? 2
      );
    } else if (config.type === 'spot') {
      light = new THREE.SpotLight(
        color,
        config.intensity,
        config.distance ?? 10,
        config.angle ?? Math.PI / 4,
        config.penumbra ?? 0.5,
        config.decay ?? 2
      );
    }

    if (light && config.position) {
      light.position.copy(config.position);
    }

    if (light) {
      light.castShadow = config.castShadow ?? false;
    }

    return light;
  }

  /**
   * Update torch animations
   */
  public update(deltaTime: number): void {
    this.activeTorches.forEach(torch => torch.update(deltaTime));
  }

  /**
   * Clear all room lights
   */
  public clearLights(): void {
    // Remove ambient light
    if (this.ambientLight) {
      this.scene.remove(this.ambientLight);
      this.ambientLight = null;
    }

    // Remove hemisphere light
    if (this.hemisphereLight) {
      this.scene.remove(this.hemisphereLight);
      this.hemisphereLight = null;
    }

    // Remove and dispose torches
    this.activeTorches.forEach(torch => {
      this.scene.remove(torch.light);
      torch.dispose();
    });
    this.activeTorches = [];

    // Remove other lights
    this.activeLights.forEach(light => {
      this.scene.remove(light);
      if ('dispose' in light) {
        (light as any).dispose();
      }
    });
    this.activeLights = [];
  }

  /**
   * Dispose of all lights and cleanup
   */
  public dispose(): void {
    this.clearLights();
  }
}
