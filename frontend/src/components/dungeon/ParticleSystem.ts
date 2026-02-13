import * as THREE from 'three';

/**
 * Particle System for Agent Arena Dungeon
 * Supports: magic spells, damage hits, environmental effects (torches, dust, fog)
 */

export interface ParticleConfig {
  count: number;
  color: THREE.Color | THREE.Color[];
  size: number;
  lifetime: number; // seconds
  speed: number;
  spread: number;
  gravity?: number;
  fadeOut?: boolean;
  emissive?: boolean;
  loop?: boolean;
  direction?: THREE.Vector3;
}

export const PARTICLE_PRESETS = {
  magicSpell: {
    count: 40,
    color: [new THREE.Color(0x44aaff), new THREE.Color(0x8844ff), new THREE.Color(0xffffff)],
    size: 0.12,
    lifetime: 1.2,
    speed: 2.5,
    spread: 0.8,
    gravity: -0.5,
    fadeOut: true,
    emissive: true,
    loop: false,
  } as ParticleConfig,

  damageHit: {
    count: 25,
    color: [new THREE.Color(0xff4444), new THREE.Color(0xff8800), new THREE.Color(0xffcc00)],
    size: 0.1,
    lifetime: 0.6,
    speed: 4.0,
    spread: 1.2,
    gravity: 3.0,
    fadeOut: true,
    emissive: true,
    loop: false,
  } as ParticleConfig,

  heal: {
    count: 30,
    color: [new THREE.Color(0x44ff88), new THREE.Color(0x88ffaa), new THREE.Color(0xffffff)],
    size: 0.1,
    lifetime: 1.5,
    speed: 1.0,
    spread: 0.6,
    gravity: -1.5,
    fadeOut: true,
    emissive: true,
    loop: false,
  } as ParticleConfig,

  torchFlame: {
    count: 15,
    color: [new THREE.Color(0xff6600), new THREE.Color(0xff9900), new THREE.Color(0xffcc44)],
    size: 0.08,
    lifetime: 0.8,
    speed: 0.8,
    spread: 0.15,
    gravity: -2.0,
    fadeOut: true,
    emissive: true,
    loop: true,
  } as ParticleConfig,

  dustMotes: {
    count: 20,
    color: [new THREE.Color(0x887766), new THREE.Color(0x665544)],
    size: 0.04,
    lifetime: 4.0,
    speed: 0.15,
    spread: 5.0,
    gravity: -0.05,
    fadeOut: true,
    emissive: false,
    loop: true,
  } as ParticleConfig,

  levelUp: {
    count: 60,
    color: [new THREE.Color(0xffdd00), new THREE.Color(0xffffff), new THREE.Color(0xffaa00)],
    size: 0.15,
    lifetime: 2.0,
    speed: 3.0,
    spread: 1.0,
    gravity: -2.0,
    fadeOut: true,
    emissive: true,
    loop: false,
  } as ParticleConfig,
};

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  age: number;
  lifetime: number;
  color: THREE.Color;
  size: number;
  alive: boolean;
}

export class DungeonParticleSystem {
  private particles: Particle[] = [];
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private points: THREE.Points;
  private config: ParticleConfig;
  private origin: THREE.Vector3;
  private active: boolean = true;
  private elapsed: number = 0;

  constructor(scene: THREE.Scene, origin: THREE.Vector3, config: ParticleConfig) {
    this.config = config;
    this.origin = origin.clone();

    // Create buffer geometry
    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(config.count * 3);
    const colors = new Float32Array(config.count * 3);
    const sizes = new Float32Array(config.count);

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Material
    this.material = new THREE.PointsMaterial({
      size: config.size,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      blending: config.emissive ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    scene.add(this.points);

    // Initialize particles
    this._spawnAll();
  }

  private _spawnAll() {
    this.particles = [];
    const colorArr = Array.isArray(this.config.color) ? this.config.color : [this.config.color];

    for (let i = 0; i < this.config.count; i++) {
      const color = colorArr[Math.floor(Math.random() * colorArr.length)];
      const spread = this.config.spread;

      const velocity = this.config.direction
        ? this.config.direction.clone().multiplyScalar(this.config.speed).add(
            new THREE.Vector3(
              (Math.random() - 0.5) * spread,
              (Math.random() - 0.5) * spread,
              (Math.random() - 0.5) * spread
            )
          )
        : new THREE.Vector3(
            (Math.random() - 0.5) * spread * this.config.speed,
            Math.random() * this.config.speed,
            (Math.random() - 0.5) * spread * this.config.speed
          );

      this.particles.push({
        position: this.origin.clone().add(
          new THREE.Vector3(
            (Math.random() - 0.5) * spread * 0.3,
            (Math.random() - 0.5) * spread * 0.3,
            (Math.random() - 0.5) * spread * 0.3
          )
        ),
        velocity,
        age: this.config.loop ? Math.random() * this.config.lifetime : 0,
        lifetime: this.config.lifetime * (0.7 + Math.random() * 0.6),
        color: color.clone(),
        size: this.config.size * (0.5 + Math.random()),
        alive: true,
      });
    }
  }

  update(deltaTime: number): boolean {
    if (!this.active) return false;
    this.elapsed += deltaTime;

    const positions = this.geometry.attributes.position as THREE.BufferAttribute;
    const colors = this.geometry.attributes.color as THREE.BufferAttribute;
    const gravity = this.config.gravity ?? 0;
    let anyAlive = false;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!p.alive) {
        // Hide dead particles
        positions.setXYZ(i, 0, -100, 0);
        continue;
      }

      p.age += deltaTime;

      if (p.age >= p.lifetime) {
        if (this.config.loop) {
          // Respawn
          p.age = 0;
          p.position.copy(this.origin);
          const spread = this.config.spread;
          p.position.add(new THREE.Vector3(
            (Math.random() - 0.5) * spread * 0.3,
            (Math.random() - 0.5) * spread * 0.3,
            (Math.random() - 0.5) * spread * 0.3
          ));
          p.velocity.set(
            (Math.random() - 0.5) * spread * this.config.speed,
            Math.random() * this.config.speed,
            (Math.random() - 0.5) * spread * this.config.speed
          );
        } else {
          p.alive = false;
          positions.setXYZ(i, 0, -100, 0);
          continue;
        }
      }

      anyAlive = true;

      // Physics
      p.velocity.y -= gravity * deltaTime;
      p.position.add(p.velocity.clone().multiplyScalar(deltaTime));

      // Write position
      positions.setXYZ(i, p.position.x, p.position.y, p.position.z);

      // Fade out
      const lifeRatio = p.age / p.lifetime;
      const alpha = this.config.fadeOut ? Math.max(0, 1 - lifeRatio) : 1;
      colors.setXYZ(i, p.color.r * alpha, p.color.g * alpha, p.color.b * alpha);
    }

    positions.needsUpdate = true;
    colors.needsUpdate = true;

    if (!anyAlive && !this.config.loop) {
      this.active = false;
    }

    return this.active;
  }

  setOrigin(pos: THREE.Vector3) {
    this.origin.copy(pos);
  }

  dispose(scene: THREE.Scene) {
    scene.remove(this.points);
    this.geometry.dispose();
    this.material.dispose();
    this.active = false;
  }

  isActive(): boolean {
    return this.active;
  }
}

/**
 * Manager to handle multiple particle systems in a scene
 */
export class ParticleManager {
  private systems: DungeonParticleSystem[] = [];
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  emit(origin: THREE.Vector3, preset: keyof typeof PARTICLE_PRESETS): DungeonParticleSystem {
    const config = { ...PARTICLE_PRESETS[preset] };
    const system = new DungeonParticleSystem(this.scene, origin, config);
    this.systems.push(system);
    return system;
  }

  emitCustom(origin: THREE.Vector3, config: ParticleConfig): DungeonParticleSystem {
    const system = new DungeonParticleSystem(this.scene, origin, config);
    this.systems.push(system);
    return system;
  }

  update(deltaTime: number) {
    this.systems = this.systems.filter((sys) => {
      const alive = sys.update(deltaTime);
      if (!alive) {
        sys.dispose(this.scene);
      }
      return alive;
    });
  }

  dispose() {
    for (const sys of this.systems) {
      sys.dispose(this.scene);
    }
    this.systems = [];
  }
}
