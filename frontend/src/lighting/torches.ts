/**
 * Torch Light Implementation
 * Agent Arena 3D Roguelike - P2.6
 */

import * as THREE from 'three';
import { TorchConfig } from './types';

/**
 * Torch light with realistic flickering animation
 */
export class TorchLight {
  public light: THREE.PointLight;
  private baseIntensity: number;
  private baseColor: THREE.Color;
  private config: Required<TorchConfig>;
  private time: number = 0;
  private noiseOffsets: number[];

  constructor(config: Partial<TorchConfig> = {}) {
    // Default warm torch color
    const defaultColor = new THREE.Color(0xff8844);
    
    this.config = {
      color: config.color ?? defaultColor,
      intensity: config.intensity ?? 2.0,
      distance: config.distance ?? 10,
      decay: config.decay ?? 2,
      castShadow: config.castShadow ?? true,
      position: config.position ?? new THREE.Vector3(0, 2, 0),
      flickerSpeed: config.flickerSpeed ?? 1.0,
      flickerIntensity: config.flickerIntensity ?? 0.3,
      enableParticles: config.enableParticles ?? false,
      warmth: config.warmth ?? 0.7,
    };

    // Create the point light
    this.light = new THREE.PointLight(
      this.config.color,
      this.config.intensity,
      this.config.distance,
      this.config.decay
    );

    this.light.position.copy(this.config.position);
    this.light.castShadow = this.config.castShadow;

    if (this.config.castShadow) {
      this.configureShadow();
    }

    // Store base values for animation
    this.baseIntensity = this.config.intensity;
    this.baseColor = new THREE.Color(this.config.color);

    // Apply warmth to color
    this.applyWarmth();

    // Initialize noise offsets for realistic flicker
    this.noiseOffsets = [
      Math.random() * 100,
      Math.random() * 100,
      Math.random() * 100,
    ];
  }

  /**
   * Configure shadow settings for torch
   */
  private configureShadow(): void {
    this.light.shadow.mapSize.width = 1024;
    this.light.shadow.mapSize.height = 1024;
    this.light.shadow.camera.near = 0.1;
    this.light.shadow.camera.far = this.config.distance;
    this.light.shadow.bias = -0.0001;
    this.light.shadow.normalBias = 0.02;
    this.light.shadow.radius = 3; // Soft shadows for flame
  }

  /**
   * Apply warmth to light color
   */
  private applyWarmth(): void {
    const warmth = this.config.warmth;
    const r = this.baseColor.r;
    const g = this.baseColor.g * (1 - warmth * 0.3);
    const b = this.baseColor.b * (1 - warmth * 0.5);
    
    this.light.color.setRGB(r, g, b);
  }

  /**
   * Perlin-like noise function for smooth randomness
   */
  private noise(x: number): number {
    const X = Math.floor(x) & 255;
    x -= Math.floor(x);
    const u = this.fade(x);
    
    return this.lerp(u, this.grad(X, x), this.grad(X + 1, x - 1));
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number): number {
    return (hash & 1) === 0 ? x : -x;
  }

  /**
   * Update torch flicker animation
   * @param deltaTime Time since last update in seconds
   */
  public update(deltaTime: number): void {
    this.time += deltaTime * this.config.flickerSpeed;

    // Multi-octave noise for realistic flame flicker
    const flicker1 = this.noise(this.time * 2 + this.noiseOffsets[0]) * 0.5;
    const flicker2 = this.noise(this.time * 4 + this.noiseOffsets[1]) * 0.3;
    const flicker3 = this.noise(this.time * 8 + this.noiseOffsets[2]) * 0.2;
    
    const combinedFlicker = (flicker1 + flicker2 + flicker3);
    const flickerAmount = combinedFlicker * this.config.flickerIntensity;

    // Update intensity with flicker
    const newIntensity = this.baseIntensity * (1 + flickerAmount);
    this.light.intensity = Math.max(0, newIntensity);

    // Subtle color shift for flame effect
    const colorShift = flickerAmount * 0.1;
    const r = this.baseColor.r + colorShift;
    const g = this.baseColor.g * (1 - this.config.warmth * 0.3);
    const b = this.baseColor.b * (1 - this.config.warmth * 0.5) + colorShift * 0.5;
    
    this.light.color.setRGB(
      Math.max(0, Math.min(1, r)),
      Math.max(0, Math.min(1, g)),
      Math.max(0, Math.min(1, b))
    );
  }

  /**
   * Set torch position
   */
  public setPosition(position: THREE.Vector3): void {
    this.light.position.copy(position);
  }

  /**
   * Enable/disable torch
   */
  public setEnabled(enabled: boolean): void {
    this.light.visible = enabled;
  }

  /**
   * Set flicker intensity (0-1)
   */
  public setFlickerIntensity(intensity: number): void {
    this.config.flickerIntensity = Math.max(0, Math.min(1, intensity));
  }

  /**
   * Set flicker speed multiplier
   */
  public setFlickerSpeed(speed: number): void {
    this.config.flickerSpeed = Math.max(0, speed);
  }

  /**
   * Set base intensity
   */
  public setIntensity(intensity: number): void {
    this.baseIntensity = intensity;
  }

  /**
   * Set warmth (0-1, affects color temperature)
   */
  public setWarmth(warmth: number): void {
    this.config.warmth = Math.max(0, Math.min(1, warmth));
    this.applyWarmth();
  }

  /**
   * Dispose of torch and cleanup
   */
  public dispose(): void {
    this.light.dispose();
  }
}

/**
 * Wall torch placement helper
 */
export class WallTorchPlacer {
  /**
   * Create torches along walls of a room
   * @param roomSize Room dimensions
   * @param spacing Spacing between torches
   * @param height Height above floor
   */
  public static placeTorchesAroundRoom(
    roomSize: { width: number; depth: number },
    spacing: number = 4,
    height: number = 2.5
  ): THREE.Vector3[] {
    const positions: THREE.Vector3[] = [];
    const halfWidth = roomSize.width / 2;
    const halfDepth = roomSize.depth / 2;
    const offset = 0.3; // Distance from wall

    // North wall
    for (let x = -halfWidth + spacing; x < halfWidth; x += spacing) {
      positions.push(new THREE.Vector3(x, height, halfDepth - offset));
    }

    // South wall
    for (let x = -halfWidth + spacing; x < halfWidth; x += spacing) {
      positions.push(new THREE.Vector3(x, height, -halfDepth + offset));
    }

    // East wall
    for (let z = -halfDepth + spacing; z < halfDepth; z += spacing) {
      positions.push(new THREE.Vector3(halfWidth - offset, height, z));
    }

    // West wall
    for (let z = -halfDepth + spacing; z < halfDepth; z += spacing) {
      positions.push(new THREE.Vector3(-halfWidth + offset, height, z));
    }

    return positions;
  }
}
