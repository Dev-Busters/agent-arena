/**
 * Dynamic Torch Lighting System
 * Flickering torches with realistic light behavior
 */

import * as THREE from 'three';

export interface TorchConfig {
  position: THREE.Vector3;
  color: number;
  intensity: number;
  distance: number;
  flickerSpeed: number;
  flickerIntensity: number;
}

export class DynamicTorch {
  public light: THREE.PointLight;
  private baseIntensity: number;
  private flickerSpeed: number;
  private flickerIntensity: number;
  private time: number = 0;
  private flameGlow?: THREE.Mesh;
  
  constructor(config: TorchConfig, scene: THREE.Scene) {
    this.baseIntensity = config.intensity;
    this.flickerSpeed = config.flickerSpeed;
    this.flickerIntensity = config.flickerIntensity;
    
    // Create point light
    this.light = new THREE.PointLight(config.color, config.intensity, config.distance);
    this.light.position.copy(config.position);
    this.light.castShadow = true;
    
    // Configure shadow
    this.light.shadow.mapSize.width = 512;
    this.light.shadow.mapSize.height = 512;
    this.light.shadow.camera.near = 0.5;
    this.light.shadow.camera.far = config.distance;
    
    scene.add(this.light);
    
    // Add flame glow mesh
    this.createFlameGlow(config, scene);
  }
  
  /**
   * Create visual flame glow effect
   */
  private createFlameGlow(config: TorchConfig, scene: THREE.Scene): void {
    const geometry = new THREE.SphereGeometry(0.15, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: config.color,
      transparent: true,
      opacity: 0.8,
    });
    
    this.flameGlow = new THREE.Mesh(geometry, material);
    this.flameGlow.position.copy(config.position);
    scene.add(this.flameGlow);
  }
  
  /**
   * Update torch flicker animation
   */
  update(deltaTime: number): void {
    this.time += deltaTime * this.flickerSpeed;
    
    // Multi-layered flicker using sine waves
    const flicker1 = Math.sin(this.time * 3.1) * 0.3;
    const flicker2 = Math.sin(this.time * 5.7) * 0.2;
    const flicker3 = Math.sin(this.time * 8.3) * 0.1;
    
    const totalFlicker = (flicker1 + flicker2 + flicker3) * this.flickerIntensity;
    this.light.intensity = this.baseIntensity * (1 + totalFlicker);
    
    // Update glow scale
    if (this.flameGlow) {
      const glowScale = 1 + totalFlicker * 0.5;
      this.flameGlow.scale.setScalar(glowScale);
    }
  }
  
  /**
   * Dispose and cleanup
   */
  dispose(scene: THREE.Scene): void {
    scene.remove(this.light);
    this.light.dispose();
    
    if (this.flameGlow) {
      scene.remove(this.flameGlow);
      this.flameGlow.geometry.dispose();
      if (this.flameGlow.material instanceof THREE.Material) {
        this.flameGlow.material.dispose();
      }
    }
  }
}

/**
 * Manages multiple dynamic torches in a room
 */
export class TorchManager {
  private torches: Map<string, DynamicTorch> = new Map();
  private scene: THREE.Scene;
  private maxTorches: number;
  
  constructor(scene: THREE.Scene, maxTorches: number = 12) {
    this.scene = scene;
    this.maxTorches = maxTorches;
  }
  
  /**
   * Add a torch to the room (respects maxTorches cap to avoid WebGL light overflow)
   */
  addTorch(id: string, config: TorchConfig): void {
    if (this.torches.size >= this.maxTorches) {
      return; // Cap reached — skip to protect GPU
    }
    // Remove existing torch with same ID
    this.removeTorch(id);
    
    const torch = new DynamicTorch(config, this.scene);
    this.torches.set(id, torch);
  }
  
  /**
   * Add torches along walls automatically
   */
  addWallTorches(
    roomId: string,
    roomBounds: THREE.Box3,
    color: number = 0xff8844,
    spacing: number = 6
  ): void {
    const center = new THREE.Vector3();
    roomBounds.getCenter(center);
    const size = new THREE.Vector3();
    roomBounds.getSize(size);
    
    const wallHeight = 2.5; // Height above floor
    
    // North wall
    const northZ = center.z - size.z / 2 + 0.5;
    for (let x = -size.x / 2 + spacing / 2; x < size.x / 2; x += spacing) {
      this.addTorch(`${roomId}-north-${x}`, {
        position: new THREE.Vector3(center.x + x, center.y + wallHeight, northZ),
        color,
        intensity: 1.5,
        distance: spacing * 1.5,
        flickerSpeed: 2 + Math.random(),
        flickerIntensity: 0.15,
      });
    }
    
    // South wall
    const southZ = center.z + size.z / 2 - 0.5;
    for (let x = -size.x / 2 + spacing / 2; x < size.x / 2; x += spacing) {
      this.addTorch(`${roomId}-south-${x}`, {
        position: new THREE.Vector3(center.x + x, center.y + wallHeight, southZ),
        color,
        intensity: 1.5,
        distance: spacing * 1.5,
        flickerSpeed: 2 + Math.random(),
        flickerIntensity: 0.15,
      });
    }
    
    // East wall
    const eastX = center.x + size.x / 2 - 0.5;
    for (let z = -size.z / 2 + spacing / 2; z < size.z / 2; z += spacing) {
      this.addTorch(`${roomId}-east-${z}`, {
        position: new THREE.Vector3(eastX, center.y + wallHeight, center.z + z),
        color,
        intensity: 1.5,
        distance: spacing * 1.5,
        flickerSpeed: 2 + Math.random(),
        flickerIntensity: 0.15,
      });
    }
    
    // West wall
    const westX = center.x - size.x / 2 + 0.5;
    for (let z = -size.z / 2 + spacing / 2; z < size.z / 2; z += spacing) {
      this.addTorch(`${roomId}-west-${z}`, {
        position: new THREE.Vector3(westX, center.y + wallHeight, center.z + z),
        color,
        intensity: 1.5,
        distance: spacing * 1.5,
        flickerSpeed: 2 + Math.random(),
        flickerIntensity: 0.15,
      });
    }
  }
  
  /**
   * Update all torches
   */
  update(deltaTime: number): void {
    this.torches.forEach((torch) => {
      torch.update(deltaTime);
    });
  }
  
  /**
   * Remove a specific torch
   */
  removeTorch(id: string): void {
    const torch = this.torches.get(id);
    if (torch) {
      torch.dispose(this.scene);
      this.torches.delete(id);
    }
  }
  
  /**
   * Remove all torches for a room
   */
  removeRoomTorches(roomId: string): void {
    const toRemove: string[] = [];
    this.torches.forEach((_, id) => {
      if (id.startsWith(roomId)) {
        toRemove.push(id);
      }
    });
    toRemove.forEach((id) => this.removeTorch(id));
  }
  
  /**
   * Clear all torches
   */
  clearAll(): void {
    this.torches.forEach((torch, id) => {
      this.removeTorch(id);
    });
  }
  
  /**
   * Dispose and cleanup
   */
  dispose(): void {
    this.clearAll();
  }
}
