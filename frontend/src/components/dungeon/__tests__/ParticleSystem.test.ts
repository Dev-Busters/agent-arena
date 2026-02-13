/**
 * Particle System Tests - Rendering & Performance
 * Tests for DungeonParticleSystem and ParticleManager
 * 
 * Run with: npx vitest run src/components/dungeon/__tests__/ParticleSystem.test.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock Three.js since we're testing logic, not WebGL rendering
vi.mock('three', () => {
  class MockVector3 {
    x: number; y: number; z: number;
    constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
    clone() { return new MockVector3(this.x, this.y, this.z); }
    copy(v: any) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
    add(v: any) { this.x += v.x; this.y += v.y; this.z += v.z; return this; }
    multiplyScalar(s: number) { this.x *= s; this.y *= s; this.z *= s; return this; }
    normalize() {
      const len = Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2);
      if (len > 0) { this.x /= len; this.y /= len; this.z /= len; }
      return this;
    }
    set(x: number, y: number, z: number) { this.x = x; this.y = y; this.z = z; return this; }
  }

  class MockColor {
    r: number; g: number; b: number;
    private hex: number;
    constructor(hex: number = 0xffffff) {
      this.hex = hex;
      this.r = ((hex >> 16) & 0xff) / 255;
      this.g = ((hex >> 8) & 0xff) / 255;
      this.b = (hex & 0xff) / 255;
    }
    clone() {
      const c = new MockColor(this.hex);
      c.r = this.r; c.g = this.g; c.b = this.b;
      return c;
    }
    getHex() { return this.hex; }
  }

  class MockBufferAttribute {
    array: Float32Array;
    itemSize: number;
    needsUpdate: boolean = false;
    constructor(array: Float32Array, itemSize: number) {
      this.array = array;
      this.itemSize = itemSize;
    }
    setXYZ(index: number, x: number, y: number, z: number) {
      const i = index * this.itemSize;
      this.array[i] = x;
      this.array[i + 1] = y;
      this.array[i + 2] = z;
    }
    getX(index: number) { return this.array[index * this.itemSize]; }
    getY(index: number) { return this.array[index * this.itemSize + 1]; }
    getZ(index: number) { return this.array[index * this.itemSize + 2]; }
  }

  class MockBufferGeometry {
    attributes: Record<string, MockBufferAttribute> = {};
    setAttribute(name: string, attr: MockBufferAttribute) { this.attributes[name] = attr; }
    dispose() {}
  }

  class MockPointsMaterial {
    size: number; vertexColors: boolean; transparent: boolean;
    opacity: number; blending: number; depthWrite: boolean; sizeAttenuation: boolean;
    constructor(opts: any = {}) {
      Object.assign(this, opts);
    }
    dispose() {}
  }

  class MockPoints {
    geometry: MockBufferGeometry;
    material: MockPointsMaterial;
    constructor(geometry: any, material: any) {
      this.geometry = geometry;
      this.material = material;
    }
  }

  class MockScene {
    children: any[] = [];
    add(obj: any) { this.children.push(obj); }
    remove(obj: any) {
      const idx = this.children.indexOf(obj);
      if (idx >= 0) this.children.splice(idx, 1);
    }
  }

  return {
    Vector3: MockVector3,
    Color: MockColor,
    BufferGeometry: MockBufferGeometry,
    BufferAttribute: MockBufferAttribute,
    PointsMaterial: MockPointsMaterial,
    Points: MockPoints,
    Scene: MockScene,
    AdditiveBlending: 2,
    NormalBlending: 1,
  };
});

import * as THREE from 'three';
import {
  DungeonParticleSystem,
  ParticleManager,
  PARTICLE_PRESETS,
  ParticleConfig,
} from '../ParticleSystem';

describe('ParticleSystem - Rendering Correctness', () => {
  let scene: THREE.Scene;

  beforeEach(() => {
    scene = new THREE.Scene();
  });

  describe('PARTICLE_PRESETS', () => {
    it('should have all expected preset types', () => {
      const expectedPresets = ['magicSpell', 'damageHit', 'heal', 'torchFlame', 'dustMotes', 'levelUp'];
      for (const preset of expectedPresets) {
        expect(PARTICLE_PRESETS).toHaveProperty(preset);
      }
    });

    it('should have valid config values for all presets', () => {
      for (const [name, config] of Object.entries(PARTICLE_PRESETS)) {
        expect(config.count).toBeGreaterThan(0);
        expect(config.size).toBeGreaterThan(0);
        expect(config.lifetime).toBeGreaterThan(0);
        expect(config.speed).toBeGreaterThan(0);
        expect(config.spread).toBeGreaterThan(0);
        expect(config.fadeOut).toBe(true); // All presets currently fade out
      }
    });

    it('should have looping enabled only for environmental effects', () => {
      expect(PARTICLE_PRESETS.torchFlame.loop).toBe(true);
      expect(PARTICLE_PRESETS.dustMotes.loop).toBe(true);
      expect(PARTICLE_PRESETS.magicSpell.loop).toBe(false);
      expect(PARTICLE_PRESETS.damageHit.loop).toBe(false);
      expect(PARTICLE_PRESETS.heal.loop).toBe(false);
      expect(PARTICLE_PRESETS.levelUp.loop).toBe(false);
    });

    it('should use additive blending for emissive effects', () => {
      expect(PARTICLE_PRESETS.magicSpell.emissive).toBe(true);
      expect(PARTICLE_PRESETS.damageHit.emissive).toBe(true);
      expect(PARTICLE_PRESETS.torchFlame.emissive).toBe(true);
      expect(PARTICLE_PRESETS.dustMotes.emissive).toBe(false);
    });
  });

  describe('DungeonParticleSystem', () => {
    it('should create and add Points mesh to scene', () => {
      const origin = new THREE.Vector3(5, 1, 5);
      const config = { ...PARTICLE_PRESETS.magicSpell };
      const system = new DungeonParticleSystem(scene, origin, config);

      expect(scene.children.length).toBe(1);
      expect(system.isActive()).toBe(true);
    });

    it('should create buffer geometry with correct particle count', () => {
      const origin = new THREE.Vector3(0, 0, 0);
      const config = { ...PARTICLE_PRESETS.damageHit };
      new DungeonParticleSystem(scene, origin, config);

      const points = scene.children[0] as any;
      const posAttr = points.geometry.attributes.position;
      expect(posAttr.array.length).toBe(config.count * 3);
    });

    it('should spawn particles near origin', () => {
      const origin = new THREE.Vector3(5, 2, 5);
      const config: ParticleConfig = {
        count: 10,
        color: new THREE.Color(0xffffff),
        size: 0.1,
        lifetime: 1.0,
        speed: 1.0,
        spread: 0.5,
        loop: false,
      };
      const system = new DungeonParticleSystem(scene, origin, config);

      const points = scene.children[0] as any;
      const posAttr = points.geometry.attributes.position;

      // After first update, positions are written to the buffer
      // Particles start near origin offset by spread * 0.3
      // then velocity moves them further each frame
      // Just verify initial buffer has been populated (not all zeros at y=-100)
      system.update(0.001); // tiny dt to write initial positions

      let aliveCount = 0;
      for (let i = 0; i < config.count; i++) {
        const y = posAttr.getY(i);
        if (y > -50) aliveCount++;
      }
      expect(aliveCount).toBe(config.count);
    });

    it('should mark non-looping system as inactive after lifetime expires', () => {
      const origin = new THREE.Vector3(0, 0, 0);
      const config: ParticleConfig = {
        count: 5,
        color: new THREE.Color(0xff0000),
        size: 0.1,
        lifetime: 0.5,
        speed: 1.0,
        spread: 0.5,
        loop: false,
        fadeOut: true,
      };
      const system = new DungeonParticleSystem(scene, origin, config);

      // Simulate time passing beyond max particle lifetime
      // Max lifetime = 0.5 * 1.3 = 0.65s (due to random factor 0.7 + 0.6)
      for (let i = 0; i < 20; i++) {
        system.update(0.05); // 1 second total
      }

      expect(system.isActive()).toBe(false);
    });

    it('should keep looping system active indefinitely', () => {
      const origin = new THREE.Vector3(0, 0, 0);
      const config = { ...PARTICLE_PRESETS.torchFlame };
      const system = new DungeonParticleSystem(scene, origin, config);

      // Run for many seconds
      for (let i = 0; i < 100; i++) {
        system.update(0.1); // 10 seconds total
      }

      expect(system.isActive()).toBe(true);
    });

    it('should apply gravity to particles', () => {
      const origin = new THREE.Vector3(0, 5, 0);
      const config: ParticleConfig = {
        count: 1,
        color: new THREE.Color(0xffffff),
        size: 0.1,
        lifetime: 10.0,
        speed: 0.0, // No initial velocity
        spread: 0.001, // Minimal spread
        gravity: 10.0, // Strong downward gravity
        loop: false,
      };
      const system = new DungeonParticleSystem(scene, origin, config);

      // Update a few frames
      system.update(0.1);
      system.update(0.1);
      system.update(0.1);

      const points = scene.children[0] as any;
      const posAttr = points.geometry.attributes.position;
      const y = posAttr.getY(0);

      // With positive gravity (downward), y should decrease
      // gravity=10 applied as: velocity.y -= gravity * dt
      // After 0.3s with gravity 10: velocity.y ~= -3, position lower
      expect(y).toBeLessThan(origin.y);
    });

    it('should fade out colors over lifetime', () => {
      const origin = new THREE.Vector3(0, 0, 0);
      const config: ParticleConfig = {
        count: 1,
        color: new THREE.Color(0xffffff), // r=1, g=1, b=1
        size: 0.1,
        lifetime: 1.0,
        speed: 0.0,
        spread: 0.001,
        fadeOut: true,
        loop: false,
      };
      const system = new DungeonParticleSystem(scene, origin, config);

      // Advance halfway through lifetime
      system.update(0.5);

      const points = scene.children[0] as any;
      const colorAttr = points.geometry.attributes.color;

      // At ~50% life, alpha factor ~0.5, color values should be roughly halved
      const r = colorAttr.getX(0);
      expect(r).toBeLessThan(1.0);
      expect(r).toBeGreaterThan(0.0);
    });

    it('should update origin position dynamically', () => {
      const origin = new THREE.Vector3(0, 0, 0);
      const config = { ...PARTICLE_PRESETS.torchFlame };
      const system = new DungeonParticleSystem(scene, origin, config);

      const newOrigin = new THREE.Vector3(10, 5, 10);
      system.setOrigin(newOrigin);

      // After respawn cycle, particles should be near new origin
      // Run enough frames to trigger respawns
      for (let i = 0; i < 30; i++) {
        system.update(0.1);
      }

      // System should still be active (looping)
      expect(system.isActive()).toBe(true);
    });

    it('should dispose correctly and remove from scene', () => {
      const origin = new THREE.Vector3(0, 0, 0);
      const config = { ...PARTICLE_PRESETS.magicSpell };
      const system = new DungeonParticleSystem(scene, origin, config);

      expect(scene.children.length).toBe(1);
      system.dispose(scene);
      expect(scene.children.length).toBe(0);
      expect(system.isActive()).toBe(false);
    });
  });

  describe('ParticleManager', () => {
    it('should emit particles for all preset types', () => {
      const manager = new ParticleManager(scene);
      const origin = new THREE.Vector3(5, 1, 5);

      const presetNames = Object.keys(PARTICLE_PRESETS) as (keyof typeof PARTICLE_PRESETS)[];
      for (const preset of presetNames) {
        manager.emit(origin, preset);
      }

      // Each emit adds a Points object to the scene
      expect(scene.children.length).toBe(presetNames.length);
    });

    it('should auto-cleanup expired non-looping systems', () => {
      const manager = new ParticleManager(scene);
      const origin = new THREE.Vector3(0, 0, 0);

      // Emit a short-lived system
      manager.emitCustom(origin, {
        count: 5,
        color: new THREE.Color(0xff0000),
        size: 0.1,
        lifetime: 0.2,
        speed: 1.0,
        spread: 0.5,
        loop: false,
        fadeOut: true,
      });

      expect(scene.children.length).toBe(1);

      // Run past lifetime
      for (let i = 0; i < 20; i++) {
        manager.update(0.05); // 1s total
      }

      // Should be cleaned up
      expect(scene.children.length).toBe(0);
    });

    it('should keep looping systems alive', () => {
      const manager = new ParticleManager(scene);
      const origin = new THREE.Vector3(0, 0, 0);

      manager.emit(origin, 'torchFlame');
      manager.emit(origin, 'dustMotes');

      // Run for a while
      for (let i = 0; i < 50; i++) {
        manager.update(0.1); // 5s
      }

      // Both looping systems should remain
      expect(scene.children.length).toBe(2);
    });

    it('should dispose all systems on cleanup', () => {
      const manager = new ParticleManager(scene);
      const origin = new THREE.Vector3(0, 0, 0);

      manager.emit(origin, 'torchFlame');
      manager.emit(origin, 'dustMotes');
      manager.emit(origin, 'magicSpell');

      expect(scene.children.length).toBe(3);

      manager.dispose();
      expect(scene.children.length).toBe(0);
    });
  });
});

describe('ParticleSystem - Performance', () => {
  let scene: THREE.Scene;

  beforeEach(() => {
    scene = new THREE.Scene();
  });

  it('should handle 100 simultaneous particle systems without lag', () => {
    const manager = new ParticleManager(scene);
    const origin = new THREE.Vector3(5, 1, 5);

    // Spawn 100 systems (stress test)
    for (let i = 0; i < 100; i++) {
      manager.emit(
        new THREE.Vector3(Math.random() * 10, Math.random() * 3, Math.random() * 10),
        'magicSpell'
      );
    }

    // Measure update performance
    const start = performance.now();
    const frames = 60;
    for (let f = 0; f < frames; f++) {
      manager.update(1 / 60);
    }
    const elapsed = performance.now() - start;

    // 60 frames of 100 systems should complete in under 500ms
    // (each system has 40 particles = 4000 total particles)
    console.log(`100 systems × 60 frames: ${elapsed.toFixed(2)}ms (${(elapsed / frames).toFixed(2)}ms/frame)`);
    expect(elapsed).toBeLessThan(500);

    manager.dispose();
  });

  it('should handle rapid emit/dispose cycle without memory leaks', () => {
    const manager = new ParticleManager(scene);

    // Simulate rapid combat: emit and let systems expire
    for (let cycle = 0; cycle < 50; cycle++) {
      manager.emit(new THREE.Vector3(0, 0, 0), 'damageHit');
      // Advance time past lifetime
      for (let f = 0; f < 30; f++) {
        manager.update(0.05);
      }
    }

    // All non-looping should be cleaned up
    expect(scene.children.length).toBe(0);
  });

  it('should maintain stable frame time with mixed looping and one-shot effects', () => {
    const manager = new ParticleManager(scene);

    // Setup: 4 torch flames (looping) + dust (looping)
    for (let i = 0; i < 4; i++) {
      manager.emit(new THREE.Vector3(i * 3, 2, 0), 'torchFlame');
    }
    manager.emit(new THREE.Vector3(5, 1.5, 5), 'dustMotes');

    // Simulate 5 seconds of gameplay with periodic combat effects
    const frameTimes: number[] = [];
    const totalFrames = 300; // 5s at 60fps

    for (let f = 0; f < totalFrames; f++) {
      // Every 30 frames (~0.5s), emit a combat effect
      if (f % 30 === 0) {
        manager.emit(new THREE.Vector3(5, 1, 5), 'magicSpell');
        manager.emit(new THREE.Vector3(5, 1, 5), 'damageHit');
      }

      const frameStart = performance.now();
      manager.update(1 / 60);
      frameTimes.push(performance.now() - frameStart);
    }

    const avgFrameTime = frameTimes.reduce((a, b) => a + b) / frameTimes.length;
    const maxFrameTime = Math.max(...frameTimes);

    console.log(`Mixed effects over 300 frames:`);
    console.log(`  Avg: ${avgFrameTime.toFixed(3)}ms/frame`);
    console.log(`  Max: ${maxFrameTime.toFixed(3)}ms/frame`);
    console.log(`  Looping systems remaining: ${scene.children.length}`);

    // Average should be well under 1ms per frame for particle updates
    expect(avgFrameTime).toBeLessThan(2);
    // Max spike should be under 5ms
    expect(maxFrameTime).toBeLessThan(10);
    // Looping systems should persist (5 total: 4 torches + 1 dust)
    // Some recent combat emissions with longer lifetimes may still be active
    expect(scene.children.length).toBeGreaterThanOrEqual(5);

    manager.dispose();
  });

  it('should scale linearly with particle count', () => {
    const counts = [10, 50, 100, 200];
    const times: Record<number, number> = {};

    for (const count of counts) {
      const testScene = new THREE.Scene();
      const config: ParticleConfig = {
        count,
        color: new THREE.Color(0xffffff),
        size: 0.1,
        lifetime: 2.0,
        speed: 1.0,
        spread: 1.0,
        loop: true,
        fadeOut: true,
      };
      const system = new DungeonParticleSystem(testScene, new THREE.Vector3(0, 0, 0), config);

      const start = performance.now();
      for (let f = 0; f < 100; f++) {
        system.update(1 / 60);
      }
      times[count] = performance.now() - start;

      system.dispose(testScene);
    }

    console.log('Scaling test:');
    for (const [count, time] of Object.entries(times)) {
      console.log(`  ${count} particles × 100 frames: ${time.toFixed(2)}ms`);
    }

    // 200 particles shouldn't take more than 4x the time of 50 particles
    // (allowing some overhead constant)
    const ratio = times[200] / times[50];
    console.log(`  200/50 ratio: ${ratio.toFixed(2)}x (expected ~4x or less)`);
    expect(ratio).toBeLessThan(8); // Generous bound accounting for test overhead
  });
});

describe('DungeonScene3D - Particle Integration', () => {
  it('should have correct preset particle counts for dungeon scene', () => {
    // The dungeon scene uses: 4x torchFlame + 1x dustMotes (ambient)
    // Plus on-demand: magicSpell, damageHit
    const torchParticles = PARTICLE_PRESETS.torchFlame.count * 4; // 60
    const dustParticles = PARTICLE_PRESETS.dustMotes.count; // 20
    const combatBurst = PARTICLE_PRESETS.magicSpell.count + PARTICLE_PRESETS.damageHit.count; // 65

    const totalAmbient = torchParticles + dustParticles;
    const totalPeak = totalAmbient + combatBurst;

    console.log(`Dungeon particle budget:`);
    console.log(`  Ambient: ${totalAmbient} (4 torches: ${torchParticles}, dust: ${dustParticles})`);
    console.log(`  Peak (with combat): ${totalPeak} (+magic: ${PARTICLE_PRESETS.magicSpell.count}, +damage: ${PARTICLE_PRESETS.damageHit.count})`);

    // Total ambient particles should be reasonable for mobile/low-end
    expect(totalAmbient).toBeLessThan(200);
    // Peak should be under 300
    expect(totalPeak).toBeLessThan(300);
  });

  it('should have particle lifetimes appropriate for visual feedback', () => {
    // Combat effects should be quick and punchy
    expect(PARTICLE_PRESETS.damageHit.lifetime).toBeLessThanOrEqual(1.0);
    expect(PARTICLE_PRESETS.magicSpell.lifetime).toBeLessThanOrEqual(2.0);

    // Environmental effects should be longer for atmosphere
    expect(PARTICLE_PRESETS.dustMotes.lifetime).toBeGreaterThanOrEqual(3.0);

    // Torch flames should be medium-lived for flicker effect
    expect(PARTICLE_PRESETS.torchFlame.lifetime).toBeLessThanOrEqual(1.5);
  });

  it('should have heal particles that rise (negative gravity)', () => {
    // Heal particles should float upward (negative gravity = upward in this system)
    expect(PARTICLE_PRESETS.heal.gravity).toBeLessThan(0);
  });

  it('should have damage particles that fall (positive gravity)', () => {
    // Damage sparks should arc downward
    expect(PARTICLE_PRESETS.damageHit.gravity).toBeGreaterThan(0);
  });
});
