/**
 * Rarity glow shader for Agent Arena
 * Custom GLSL shaders for animated item rarity effects
 */

import * as THREE from 'three';
import { Rarity, RarityGlowConfig, RARITY_GLOW_DEFAULTS, ShaderUniforms } from './types';

/**
 * Vertex shader for rarity glow effect
 * Passes through position and normal for fragment shader
 */
export const rarityGlowVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Fragment shader for rarity glow effect
 * Creates pulsating edge glow based on view angle (Fresnel effect)
 */
export const rarityGlowFragmentShader = `
  uniform float time;
  uniform vec3 glowColor;
  uniform float glowIntensity;
  uniform float speed;
  uniform float pulseMin;
  uniform float pulseMax;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;

  void main() {
    // Calculate Fresnel effect (glow at edges)
    vec3 viewDirection = normalize(cameraPosition - vPosition);
    float fresnel = 1.0 - abs(dot(viewDirection, vNormal));
    fresnel = pow(fresnel, 2.5); // Sharpen the edge glow

    // Pulsating animation
    float pulse = pulseMin + (pulseMax - pulseMin) * 
                  (0.5 + 0.5 * sin(time * speed));

    // Combine fresnel with pulse
    float glowStrength = fresnel * pulse * glowIntensity;

    // Add subtle noise for organic feel
    float noise = fract(sin(dot(vUv, vec2(12.9898, 78.233)) + time * 0.1) * 43758.5453);
    glowStrength *= (0.9 + 0.1 * noise);

    // Output bloom-friendly color
    vec3 finalColor = glowColor * glowStrength;
    float alpha = glowStrength;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

/**
 * Create rarity glow shader material
 */
export function createRarityGlowMaterial(
  rarity: Rarity,
  customConfig?: Partial<RarityGlowConfig>
): THREE.ShaderMaterial {
  const defaultConfig = RARITY_GLOW_DEFAULTS[rarity];
  const config: RarityGlowConfig = { ...defaultConfig, ...customConfig };

  // Convert color to THREE.Color if string
  const color = typeof config.color === 'string' 
    ? new THREE.Color(config.color) 
    : config.color;

  const pulseRange = config.pulseRange || [0.6, 1.0];

  const uniforms: ShaderUniforms = {
    time: { value: 0.0 },
    glowColor: { value: color },
    glowIntensity: { value: config.intensity },
    speed: { value: config.speed },
    pulseMin: { value: pulseRange[0] },
    pulseMax: { value: pulseRange[1] },
  };

  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader: rarityGlowVertexShader,
    fragmentShader: rarityGlowFragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending, // Bloom-friendly additive blending
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

/**
 * Update rarity glow animation
 * Call this in your render loop
 */
export function updateRarityGlow(material: THREE.ShaderMaterial, deltaTime: number): void {
  if (material.uniforms.time) {
    material.uniforms.time.value += deltaTime;
  }
}

/**
 * Rarity glow manager for efficient batch updates
 */
export class RarityGlowManager {
  private materials: Set<THREE.ShaderMaterial> = new Set();
  private clock: THREE.Clock = new THREE.Clock();

  /**
   * Register a rarity glow material for automatic updates
   */
  register(material: THREE.ShaderMaterial): void {
    this.materials.add(material);
  }

  /**
   * Unregister a material (call when disposing)
   */
  unregister(material: THREE.ShaderMaterial): void {
    this.materials.delete(material);
  }

  /**
   * Update all registered materials
   * Call once per frame in your render loop
   */
  update(): void {
    const deltaTime = this.clock.getDelta();
    this.materials.forEach((material) => {
      updateRarityGlow(material, deltaTime);
    });
  }

  /**
   * Dispose all materials and clear registry
   */
  dispose(): void {
    this.materials.forEach((material) => {
      material.dispose();
    });
    this.materials.clear();
  }

  /**
   * Get count of active glow materials (for performance monitoring)
   */
  get count(): number {
    return this.materials.size;
  }
}

/**
 * Create a dual-layer item with base mesh + glow overlay
 * This is the recommended approach for items with rarity glow
 */
export function createGlowingItem(
  geometry: THREE.BufferGeometry,
  baseMaterial: THREE.Material,
  rarity: Rarity,
  glowConfig?: Partial<RarityGlowConfig>
): THREE.Group {
  const group = new THREE.Group();

  // Base item mesh
  const baseMesh = new THREE.Mesh(geometry, baseMaterial);
  group.add(baseMesh);

  // Glow overlay (slightly larger to avoid z-fighting)
  const glowGeometry = geometry.clone();
  glowGeometry.scale(1.02, 1.02, 1.02);
  const glowMaterial = createRarityGlowMaterial(rarity, glowConfig);
  const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
  group.add(glowMesh);

  // Store reference for updates
  (group as any).glowMaterial = glowMaterial;

  return group;
}

/**
 * Helper to get glow material from a glowing item group
 */
export function getGlowMaterial(itemGroup: THREE.Group): THREE.ShaderMaterial | null {
  return (itemGroup as any).glowMaterial || null;
}
