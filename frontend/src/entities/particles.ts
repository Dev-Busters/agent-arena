/**
 * Particle Effect System
 * Agent Arena 3D Roguelike
 */

import * as THREE from 'three';
import { ParticleEffectType, ParticleEffectConfig } from './types';

/**
 * Particle pool for performance optimization
 */
class ParticlePool {
  private particles: THREE.Points[] = [];
  private available: THREE.Points[] = [];

  constructor(private scene: THREE.Scene, poolSize: number = 50) {
    this.initialize(poolSize);
  }

  private initialize(size: number): void {
    for (let i = 0; i < size; i++) {
      const geometry = new THREE.BufferGeometry();
      const material = new THREE.PointsMaterial({
        size: 0.1,
        transparent: true,
        opacity: 1,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
      });

      const particle = new THREE.Points(geometry, material);
      particle.visible = false;
      this.particles.push(particle);
      this.available.push(particle);
      this.scene.add(particle);
    }
  }

  acquire(): THREE.Points | null {
    return this.available.pop() || null;
  }

  release(particle: THREE.Points): void {
    particle.visible = false;
    this.available.push(particle);
  }

  dispose(): void {
    this.particles.forEach((particle) => {
      particle.geometry.dispose();
      if (Array.isArray(particle.material)) {
        particle.material.forEach((mat) => mat.dispose());
      } else {
        particle.material.dispose();
      }
      this.scene.remove(particle);
    });
    this.particles = [];
    this.available = [];
  }
}

/**
 * Active particle effect
 */
interface ActiveParticleEffect {
  particles: THREE.Points;
  config: ParticleEffectConfig;
  startTime: number;
  positions: Float32Array;
  velocities: Float32Array;
  colors: Float32Array;
  lifetimes: Float32Array;
}

/**
 * Manages particle effects
 */
export class ParticleEffectManager {
  private scene: THREE.Scene;
  private pool: ParticlePool;
  private activeEffects: Set<ActiveParticleEffect> = new Set();
  private configs: Map<ParticleEffectType, ParticleEffectConfig> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.pool = new ParticlePool(scene, 100);
    this.initializeConfigs();
  }

  /**
   * Initialize default particle effect configurations
   */
  private initializeConfigs(): void {
    this.configs.set(ParticleEffectType.HIT, {
      type: ParticleEffectType.HIT,
      particleCount: 20,
      lifetime: 0.5,
      speed: 3.0,
      spread: 1.0,
      color: new THREE.Color(0xff4444),
      size: 0.15,
      gravity: true,
      fadeOut: true,
    });

    this.configs.set(ParticleEffectType.DEATH, {
      type: ParticleEffectType.DEATH,
      particleCount: 50,
      lifetime: 1.5,
      speed: 4.0,
      spread: 1.5,
      color: new THREE.Color(0x888888),
      size: 0.2,
      gravity: true,
      fadeOut: true,
    });

    this.configs.set(ParticleEffectType.ABILITY_FIRE, {
      type: ParticleEffectType.ABILITY_FIRE,
      particleCount: 30,
      lifetime: 1.0,
      speed: 2.0,
      spread: 0.8,
      color: new THREE.Color(0xff6600),
      size: 0.25,
      gravity: false,
      fadeOut: true,
    });

    this.configs.set(ParticleEffectType.ABILITY_ICE, {
      type: ParticleEffectType.ABILITY_ICE,
      particleCount: 25,
      lifetime: 1.2,
      speed: 1.5,
      spread: 0.6,
      color: new THREE.Color(0x66ccff),
      size: 0.2,
      gravity: false,
      fadeOut: true,
    });

    this.configs.set(ParticleEffectType.ABILITY_LIGHTNING, {
      type: ParticleEffectType.ABILITY_LIGHTNING,
      particleCount: 40,
      lifetime: 0.3,
      speed: 5.0,
      spread: 0.5,
      color: new THREE.Color(0xffff00),
      size: 0.15,
      gravity: false,
      fadeOut: true,
    });

    this.configs.set(ParticleEffectType.ABILITY_POISON, {
      type: ParticleEffectType.ABILITY_POISON,
      particleCount: 35,
      lifetime: 2.0,
      speed: 1.0,
      spread: 1.0,
      color: new THREE.Color(0x44ff44),
      size: 0.18,
      gravity: false,
      fadeOut: true,
    });

    this.configs.set(ParticleEffectType.HEAL, {
      type: ParticleEffectType.HEAL,
      particleCount: 20,
      lifetime: 1.5,
      speed: 1.5,
      spread: 0.5,
      color: new THREE.Color(0x44ff88),
      size: 0.2,
      gravity: false,
      fadeOut: true,
    });

    this.configs.set(ParticleEffectType.BUFF, {
      type: ParticleEffectType.BUFF,
      particleCount: 15,
      lifetime: 1.0,
      speed: 1.0,
      spread: 0.3,
      color: new THREE.Color(0xffaa00),
      size: 0.15,
      gravity: false,
      fadeOut: true,
    });

    this.configs.set(ParticleEffectType.DEBUFF, {
      type: ParticleEffectType.DEBUFF,
      particleCount: 15,
      lifetime: 1.0,
      speed: 1.0,
      spread: 0.3,
      color: new THREE.Color(0x8844ff),
      size: 0.15,
      gravity: false,
      fadeOut: true,
    });

    this.configs.set(ParticleEffectType.LEVEL_UP, {
      type: ParticleEffectType.LEVEL_UP,
      particleCount: 60,
      lifetime: 2.0,
      speed: 2.5,
      spread: 1.2,
      color: new THREE.Color(0xffdd00),
      size: 0.25,
      gravity: false,
      fadeOut: true,
    });
  }

  /**
   * Create a hit effect
   */
  createHitEffect(position: THREE.Vector3): void {
    const config = this.configs.get(ParticleEffectType.HIT)!;
    this.createEffect(config, position);
  }

  /**
   * Create a death effect
   */
  createDeathEffect(position: THREE.Vector3): void {
    const config = this.configs.get(ParticleEffectType.DEATH)!;
    this.createEffect(config, position);
  }

  /**
   * Create an ability effect
   */
  createAbilityEffect(type: ParticleEffectType, position: THREE.Vector3): void {
    const config = this.configs.get(type);
    if (!config) {
      console.warn(`Particle effect type ${type} not found`);
      return;
    }
    this.createEffect(config, position);
  }

  /**
   * Create a custom particle effect
   */
  private createEffect(config: ParticleEffectConfig, position: THREE.Vector3): void {
    const particles = this.pool.acquire();
    if (!particles) {
      console.warn('Particle pool exhausted');
      return;
    }

    // Create particle data
    const count = config.particleCount;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const lifetimes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Initial position (at spawn point)
      positions[i * 3] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;

      // Random velocity
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = config.speed * (0.5 + Math.random() * 0.5);

      velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed * config.spread;
      velocities[i * 3 + 1] = Math.cos(phi) * speed * config.spread;
      velocities[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * speed * config.spread;

      // Color variation
      const colorVariation = 0.2;
      colors[i * 3] = Math.min(1, config.color.r + (Math.random() - 0.5) * colorVariation);
      colors[i * 3 + 1] = Math.min(1, config.color.g + (Math.random() - 0.5) * colorVariation);
      colors[i * 3 + 2] = Math.min(1, config.color.b + (Math.random() - 0.5) * colorVariation);

      // Random lifetime variation
      lifetimes[i] = config.lifetime * (0.8 + Math.random() * 0.4);
    }

    // Update geometry
    particles.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Update material
    if (!Array.isArray(particles.material)) {
      const material = particles.material as THREE.PointsMaterial;
      material.size = config.size;
      material.transparent = true;
      material.opacity = 1;
    }

    particles.visible = true;

    // Add to active effects
    const effect: ActiveParticleEffect = {
      particles,
      config,
      startTime: Date.now() / 1000,
      positions,
      velocities,
      colors,
      lifetimes,
    };

    this.activeEffects.add(effect);
  }

  /**
   * Update all active particle effects
   */
  update(deltaTime: number): void {
    const currentTime = Date.now() / 1000;
    const effectsToRemove: ActiveParticleEffect[] = [];

    this.activeEffects.forEach((effect) => {
      const elapsed = currentTime - effect.startTime;
      const maxLifetime = effect.config.lifetime;

      if (elapsed >= maxLifetime) {
        effectsToRemove.push(effect);
        return;
      }

      // Update particle positions
      const count = effect.config.particleCount;
      for (let i = 0; i < count; i++) {
        // Update position based on velocity
        effect.positions[i * 3] += effect.velocities[i * 3] * deltaTime;
        effect.positions[i * 3 + 1] += effect.velocities[i * 3 + 1] * deltaTime;
        effect.positions[i * 3 + 2] += effect.velocities[i * 3 + 2] * deltaTime;

        // Apply gravity
        if (effect.config.gravity) {
          effect.velocities[i * 3 + 1] -= 9.8 * deltaTime;
        }

        // Fade out
        if (effect.config.fadeOut) {
          const particleAge = elapsed / effect.lifetimes[i];
          const opacity = Math.max(0, 1 - particleAge);
          
          // Update color alpha (approximation)
          const colorScale = opacity;
          effect.colors[i * 3] *= colorScale;
          effect.colors[i * 3 + 1] *= colorScale;
          effect.colors[i * 3 + 2] *= colorScale;
        }
      }

      // Update geometry
      effect.particles.geometry.attributes.position.needsUpdate = true;
      effect.particles.geometry.attributes.color.needsUpdate = true;

      // Update material opacity
      if (!Array.isArray(effect.particles.material)) {
        const progress = elapsed / maxLifetime;
        effect.particles.material.opacity = Math.max(0, 1 - progress);
      }
    });

    // Remove finished effects
    effectsToRemove.forEach((effect) => {
      this.activeEffects.delete(effect);
      this.pool.release(effect.particles);
    });
  }

  /**
   * Get the number of active particle effects
   */
  getActiveEffectCount(): number {
    return this.activeEffects.size;
  }

  /**
   * Clear all active effects
   */
  clearAll(): void {
    this.activeEffects.forEach((effect) => {
      this.pool.release(effect.particles);
    });
    this.activeEffects.clear();
  }

  /**
   * Dispose particle manager and clean up resources
   */
  dispose(): void {
    this.clearAll();
    this.pool.dispose();
    this.configs.clear();
  }
}

/**
 * Create a particle effect manager
 */
export function createParticleEffectManager(scene: THREE.Scene): ParticleEffectManager {
  return new ParticleEffectManager(scene);
}
