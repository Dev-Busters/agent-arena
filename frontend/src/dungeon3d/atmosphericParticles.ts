/**
 * Atmospheric Particle Effects for Dungeon Rooms
 * Ambient particles that enhance room atmosphere (dust, embers, mist, etc.)
 */

import * as THREE from 'three';

export type AtmosphericParticleType = 'dust' | 'embers' | 'mist' | 'sparkles' | 'snow';

export interface AtmosphericParticleConfig {
  type: AtmosphericParticleType;
  count: number;
  color: number;
  size: number;
  opacity: number;
  speed: number;
  spread: THREE.Vector3;
}

export class AtmosphericParticleSystem {
  private scene: THREE.Scene;
  private particleSystems: Map<string, THREE.Points> = new Map();
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }
  
  /**
   * Create atmospheric particles for a room
   */
  createParticles(
    roomId: string,
    type: AtmosphericParticleType,
    density: number,
    roomBounds: THREE.Box3
  ): void {
    // Remove existing particles for this room
    this.removeParticles(roomId);
    
    const config = this.getParticleConfig(type, density);
    const particles = this.generateParticleSystem(config, roomBounds);
    
    particles.name = `atmospheric-${roomId}`;
    this.scene.add(particles);
    this.particleSystems.set(roomId, particles);
  }
  
  /**
   * Get particle configuration based on type
   */
  private getParticleConfig(
    type: AtmosphericParticleType,
    density: number
  ): AtmosphericParticleConfig {
    const baseCount = Math.floor(200 * density);
    
    switch (type) {
      case 'dust':
        return {
          type,
          count: baseCount,
          color: 0xccaa88,
          size: 0.05,
          opacity: 0.3,
          speed: 0.1,
          spread: new THREE.Vector3(10, 5, 10),
        };
      
      case 'embers':
        return {
          type,
          count: Math.floor(baseCount * 0.6),
          color: 0xff4400,
          size: 0.08,
          opacity: 0.8,
          speed: 0.3,
          spread: new THREE.Vector3(8, 6, 8),
        };
      
      case 'mist':
        return {
          type,
          count: Math.floor(baseCount * 1.5),
          color: 0xaaccdd,
          size: 0.15,
          opacity: 0.2,
          speed: 0.05,
          spread: new THREE.Vector3(12, 4, 12),
        };
      
      case 'sparkles':
        return {
          type,
          count: Math.floor(baseCount * 0.4),
          color: 0xffee88,
          size: 0.06,
          opacity: 0.9,
          speed: 0.15,
          spread: new THREE.Vector3(6, 6, 6),
        };
      
      case 'snow':
        return {
          type,
          count: Math.floor(baseCount * 0.8),
          color: 0xffffff,
          size: 0.04,
          opacity: 0.7,
          speed: 0.2,
          spread: new THREE.Vector3(10, 8, 10),
        };
      
      default:
        return this.getParticleConfig('dust', density);
    }
  }
  
  /**
   * Generate particle system mesh
   */
  private generateParticleSystem(
    config: AtmosphericParticleConfig,
    bounds: THREE.Box3
  ): THREE.Points {
    const { count, color, size, opacity } = config;
    
    // Create geometry
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    const center = new THREE.Vector3();
    bounds.getCenter(center);
    const boxSize = new THREE.Vector3();
    bounds.getSize(boxSize);
    
    // Initialize particle positions and velocities
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Random position within bounds
      positions[i3] = center.x + (Math.random() - 0.5) * boxSize.x;
      positions[i3 + 1] = center.y + (Math.random() - 0.5) * boxSize.y;
      positions[i3 + 2] = center.z + (Math.random() - 0.5) * boxSize.z;
      
      // Random velocity based on particle type
      velocities[i3] = (Math.random() - 0.5) * config.speed;
      velocities[i3 + 1] = this.getVerticalVelocity(config.type, config.speed);
      velocities[i3 + 2] = (Math.random() - 0.5) * config.speed;
      
      // Color with slight variation
      const colorObj = new THREE.Color(color);
      const variation = 0.1;
      colorObj.r += (Math.random() - 0.5) * variation;
      colorObj.g += (Math.random() - 0.5) * variation;
      colorObj.b += (Math.random() - 0.5) * variation;
      
      colors[i3] = colorObj.r;
      colors[i3 + 1] = colorObj.g;
      colors[i3 + 2] = colorObj.b;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // Create material
    const material = new THREE.PointsMaterial({
      size,
      transparent: true,
      opacity,
      vertexColors: true,
      blending: config.type === 'embers' ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    
    const particles = new THREE.Points(geometry, material);
    
    // Store config for animation
    (particles as any).particleConfig = config;
    (particles as any).bounds = bounds;
    
    return particles;
  }
  
  /**
   * Get vertical velocity based on particle type
   */
  private getVerticalVelocity(type: AtmosphericParticleType, baseSpeed: number): number {
    switch (type) {
      case 'dust':
        return (Math.random() - 0.3) * baseSpeed * 0.5; // Mostly horizontal
      case 'embers':
        return Math.random() * baseSpeed * 2; // Rise upward
      case 'mist':
        return (Math.random() - 0.5) * baseSpeed * 0.3; // Slow drift
      case 'sparkles':
        return (Math.random() - 0.5) * baseSpeed * 1.5; // Float around
      case 'snow':
        return -Math.random() * baseSpeed * 1.2; // Fall downward
      default:
        return 0;
    }
  }
  
  /**
   * Update all particle systems (call every frame)
   */
  update(deltaTime: number): void {
    this.particleSystems.forEach((particles) => {
      const config = (particles as any).particleConfig as AtmosphericParticleConfig;
      const bounds = (particles as any).bounds as THREE.Box3;
      
      const positions = particles.geometry.attributes.position.array as Float32Array;
      const velocities = (particles.geometry.attributes as any).velocity.array as Float32Array;
      
      const center = new THREE.Vector3();
      bounds.getCenter(center);
      const boxSize = new THREE.Vector3();
      bounds.getSize(boxSize);
      
      for (let i = 0; i < positions.length; i += 3) {
        // Update position based on velocity
        positions[i] += velocities[i] * deltaTime;
        positions[i + 1] += velocities[i + 1] * deltaTime;
        positions[i + 2] += velocities[i + 2] * deltaTime;
        
        // Wrap particles within bounds
        if (positions[i] < center.x - boxSize.x / 2) {
          positions[i] = center.x + boxSize.x / 2;
        } else if (positions[i] > center.x + boxSize.x / 2) {
          positions[i] = center.x - boxSize.x / 2;
        }
        
        if (positions[i + 1] < center.y - boxSize.y / 2) {
          positions[i + 1] = center.y + boxSize.y / 2;
        } else if (positions[i + 1] > center.y + boxSize.y / 2) {
          positions[i + 1] = center.y - boxSize.y / 2;
        }
        
        if (positions[i + 2] < center.z - boxSize.z / 2) {
          positions[i + 2] = center.z + boxSize.z / 2;
        } else if (positions[i + 2] > center.z + boxSize.z / 2) {
          positions[i + 2] = center.z - boxSize.z / 2;
        }
      }
      
      particles.geometry.attributes.position.needsUpdate = true;
    });
  }
  
  /**
   * Remove particles for a specific room
   */
  removeParticles(roomId: string): void {
    const particles = this.particleSystems.get(roomId);
    if (particles) {
      particles.geometry.dispose();
      if (particles.material instanceof THREE.Material) {
        particles.material.dispose();
      }
      this.scene.remove(particles);
      this.particleSystems.delete(roomId);
    }
  }
  
  /**
   * Clear all particle systems
   */
  clearAll(): void {
    this.particleSystems.forEach((particles, roomId) => {
      this.removeParticles(roomId);
    });
  }
  
  /**
   * Dispose and cleanup
   */
  dispose(): void {
    this.clearAll();
  }
}
