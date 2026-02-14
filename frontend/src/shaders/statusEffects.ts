/**
 * Status effect shaders for Agent Arena
 * Stackable shader-based visual effects for entity status
 */

import * as THREE from 'three';
import { StatusEffect, StatusEffectShaderConfig, ActiveStatusEffects } from './types';

/**
 * Vertex shader for status effects
 */
const statusEffectVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vUv = uv;
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Fragment shader for frozen effect
 */
const frozenFragmentShader = `
  uniform float time;
  uniform float intensity;
  uniform vec3 iceColor;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  // Simple noise function
  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    // Ice crystal pattern
    float pattern = noise(vUv * 20.0 + time * 0.1);
    pattern = pow(pattern, 3.0);

    // Frost at edges
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float fresnel = 1.0 - abs(dot(viewDir, vNormal));
    fresnel = pow(fresnel, 1.5);

    // Combine effects
    float strength = (pattern * 0.3 + fresnel * 0.7) * intensity;
    vec3 color = iceColor * strength;

    gl_FragColor = vec4(color, strength * 0.6);
  }
`;

/**
 * Fragment shader for burning effect
 */
const burningFragmentShader = `
  uniform float time;
  uniform float intensity;
  uniform vec3 fireColor;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  float noise(vec3 p) {
    return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
  }

  void main() {
    // Flickering fire
    vec3 noisePos = vWorldPosition * 2.0 + vec3(0.0, time * 2.0, 0.0);
    float n = noise(noisePos);
    n += noise(noisePos * 2.0) * 0.5;
    n += noise(noisePos * 4.0) * 0.25;
    n /= 1.75;

    // Fire rises upward
    float upwardBias = smoothstep(-0.5, 0.5, vPosition.y);
    n *= upwardBias;

    // Pulsing intensity
    float pulse = 0.8 + 0.2 * sin(time * 5.0);
    float strength = n * intensity * pulse;

    // Color gradient (yellow to orange to red)
    vec3 color = mix(
      vec3(1.0, 0.3, 0.0), // Red
      vec3(1.0, 0.8, 0.0), // Orange-yellow
      n
    );

    gl_FragColor = vec4(color * strength, strength * 0.7);
  }
`;

/**
 * Fragment shader for poisoned effect
 */
const poisonedFragmentShader = `
  uniform float time;
  uniform float intensity;
  uniform vec3 poisonColor;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    // Dripping poison effect
    float drip = sin(vUv.y * 10.0 + time * 3.0) * 0.5 + 0.5;
    float n = noise(vUv * 5.0 + vec2(time * 0.5, 0.0));

    // Pulsing toxic glow
    float pulse = 0.5 + 0.5 * sin(time * 2.0);
    float strength = (drip * n) * intensity * pulse;

    vec3 color = poisonColor * strength;
    gl_FragColor = vec4(color, strength * 0.5);
  }
`;

/**
 * Fragment shader for stunned effect
 */
const stunnedFragmentShader = `
  uniform float time;
  uniform float intensity;
  uniform vec3 sparkColor;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  float noise(vec3 p) {
    return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
  }

  void main() {
    // Electric sparks
    vec3 noisePos = vWorldPosition * 10.0 + vec3(time * 5.0);
    float n = noise(noisePos);
    
    // Sharp sparks
    n = step(0.95, n);

    // Random flash
    float flash = step(0.98, noise(vec3(time * 10.0)));
    n = max(n, flash);

    float strength = n * intensity;
    vec3 color = sparkColor * strength;

    gl_FragColor = vec4(color, strength * 0.8);
  }
`;

/**
 * Fragment shader for blessed effect
 */
const blessedFragmentShader = `
  uniform float time;
  uniform float intensity;
  uniform vec3 holyColor;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  void main() {
    // Soft golden aura
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float fresnel = 1.0 - abs(dot(viewDir, vNormal));
    fresnel = pow(fresnel, 2.0);

    // Gentle pulsing
    float pulse = 0.7 + 0.3 * sin(time * 1.5);

    // Rotating shimmer
    float shimmer = sin(vUv.x * 10.0 + time * 2.0) * 
                    cos(vUv.y * 10.0 + time * 2.0);
    shimmer = shimmer * 0.5 + 0.5;

    float strength = (fresnel * 0.7 + shimmer * 0.3) * intensity * pulse;
    vec3 color = holyColor * strength;

    gl_FragColor = vec4(color, strength * 0.4);
  }
`;

/**
 * Create shader material for a specific status effect
 */
export function createStatusEffectMaterial(
  effect: StatusEffect,
  intensity: number = 1.0
): THREE.ShaderMaterial {
  let fragmentShader: string;
  let color: THREE.Color;
  let speed: number = 1.0;

  switch (effect) {
    case StatusEffect.Frozen:
      fragmentShader = frozenFragmentShader;
      color = new THREE.Color(0x88ccff); // Ice blue
      break;
    case StatusEffect.Burning:
      fragmentShader = burningFragmentShader;
      color = new THREE.Color(0xff4400); // Fire red
      speed = 2.0;
      break;
    case StatusEffect.Poisoned:
      fragmentShader = poisonedFragmentShader;
      color = new THREE.Color(0x00ff44); // Toxic green
      break;
    case StatusEffect.Stunned:
      fragmentShader = stunnedFragmentShader;
      color = new THREE.Color(0xffff00); // Electric yellow
      speed = 3.0;
      break;
    case StatusEffect.Blessed:
      fragmentShader = blessedFragmentShader;
      color = new THREE.Color(0xffd700); // Holy gold
      break;
    default:
      fragmentShader = frozenFragmentShader;
      color = new THREE.Color(0xffffff);
  }

  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0.0 },
      intensity: { value: intensity },
      iceColor: { value: color },
      fireColor: { value: color },
      poisonColor: { value: color },
      sparkColor: { value: color },
      holyColor: { value: color },
    },
    vertexShader: statusEffectVertexShader,
    fragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

/**
 * Status effect manager for entities
 * Handles stacking multiple status effects
 */
export class StatusEffectManager {
  private activeEffects: Map<string, ActiveStatusEffects> = new Map();
  private clock: THREE.Clock = new THREE.Clock();

  /**
   * Add a status effect to an entity
   */
  addEffect(
    entityId: string,
    effect: StatusEffect,
    config?: Partial<StatusEffectShaderConfig>
  ): void {
    if (!this.activeEffects.has(entityId)) {
      this.activeEffects.set(entityId, {
        effects: [],
        configs: new Map(),
      });
    }

    const active = this.activeEffects.get(entityId)!;
    if (!active.effects.includes(effect)) {
      active.effects.push(effect);
      
      const fullConfig: StatusEffectShaderConfig = {
        type: effect,
        color: this.getDefaultColor(effect),
        intensity: 1.0,
        speed: 1.0,
        ...config,
      };
      
      active.configs.set(effect, fullConfig);
    }
  }

  /**
   * Remove a status effect from an entity
   */
  removeEffect(entityId: string, effect: StatusEffect): void {
    const active = this.activeEffects.get(entityId);
    if (active) {
      active.effects = active.effects.filter((e) => e !== effect);
      active.configs.delete(effect);
      
      if (active.effects.length === 0) {
        this.activeEffects.delete(entityId);
      }
    }
  }

  /**
   * Get all active effects for an entity
   */
  getEffects(entityId: string): StatusEffect[] {
    return this.activeEffects.get(entityId)?.effects || [];
  }

  /**
   * Create overlay meshes for all active effects on an entity
   */
  createEffectOverlays(
    entityId: string,
    geometry: THREE.BufferGeometry
  ): THREE.Mesh[] {
    const active = this.activeEffects.get(entityId);
    if (!active) return [];

    return active.effects.map((effect) => {
      const config = active.configs.get(effect)!;
      const material = createStatusEffectMaterial(effect, config.intensity);
      const mesh = new THREE.Mesh(geometry.clone().scale(1.01, 1.01, 1.01), material);
      (mesh as any).statusEffect = effect;
      (mesh as any).effectMaterial = material;
      return mesh;
    });
  }

  /**
   * Update all active status effects
   * Call once per frame
   */
  update(): void {
    const deltaTime = this.clock.getDelta();
    
    this.activeEffects.forEach((active) => {
      active.effects.forEach((effect) => {
        const config = active.configs.get(effect);
        if (config) {
          // Update time uniform if material exists
          // This would be called on the actual mesh materials in practice
        }
      });
    });
  }

  /**
   * Update a specific effect overlay mesh
   */
  updateEffectMesh(mesh: THREE.Mesh, deltaTime: number): void {
    const material = (mesh as any).effectMaterial as THREE.ShaderMaterial;
    if (material && material.uniforms.time) {
      material.uniforms.time.value += deltaTime;
    }
  }

  /**
   * Clear all effects for an entity
   */
  clearEffects(entityId: string): void {
    this.activeEffects.delete(entityId);
  }

  /**
   * Get default color for a status effect
   */
  private getDefaultColor(effect: StatusEffect): THREE.Color | string {
    switch (effect) {
      case StatusEffect.Frozen:
        return new THREE.Color(0x88ccff);
      case StatusEffect.Burning:
        return new THREE.Color(0xff4400);
      case StatusEffect.Poisoned:
        return new THREE.Color(0x00ff44);
      case StatusEffect.Stunned:
        return new THREE.Color(0xffff00);
      case StatusEffect.Blessed:
        return new THREE.Color(0xffd700);
      default:
        return new THREE.Color(0xffffff);
    }
  }

  /**
   * Get statistics
   */
  get stats() {
    let totalEffects = 0;
    this.activeEffects.forEach((active) => {
      totalEffects += active.effects.length;
    });
    
    return {
      entitiesWithEffects: this.activeEffects.size,
      totalActiveEffects: totalEffects,
    };
  }
}

/**
 * Global status effect manager instance
 */
export const statusEffectManager = new StatusEffectManager();
