/**
 * materials.ts - Material Library for Dungeon
 * 
 * PBR materials for walls, floors, ceilings, doors, and traps.
 * Supports texture loading and procedural materials.
 */

import * as THREE from 'three';
import { MaterialConfig } from './types';

/**
 * Material library for dungeon rendering
 * Manages all materials with PBR properties
 */
export class MaterialLibrary {
  private materials: Map<string, THREE.Material>;
  private textureLoader: THREE.TextureLoader;

  constructor() {
    this.materials = new Map();
    this.textureLoader = new THREE.TextureLoader();
    this.initializeMaterials();
  }

  /**
   * Initialize all default materials
   */
  private initializeMaterials(): void {
    this.createWallMaterial();
    this.createFloorMaterial();
    this.createCeilingMaterial();
    this.createDoorMaterial();
    this.createTrapMaterial();
  }

  /**
   * Create stone wall material with normal mapping
   */
  private createWallMaterial(): void {
    const material = new THREE.MeshStandardMaterial({
      color: 0x8b7355, // Warm stone brown
      roughness: 0.8,
      metalness: 0.1,
      flatShading: false,
    });

    // Add procedural normal variation
    this.addProceduralNormal(material, 'wall');

    material.name = 'wall-stone';
    this.materials.set('wall', material);
  }

  /**
   * Create floor material (cobblestone)
   */
  private createFloorMaterial(): void {
    const material = new THREE.MeshStandardMaterial({
      color: 0x6b5d52, // Darker brown cobblestone
      roughness: 0.85,
      metalness: 0.05,
      flatShading: false,
    });

    // Add procedural variation
    this.addProceduralNormal(material, 'floor');

    material.name = 'floor-cobblestone';
    this.materials.set('floor', material);
  }

  /**
   * Create ceiling material
   */
  private createCeilingMaterial(): void {
    const material = new THREE.MeshStandardMaterial({
      color: 0x5a4a3f, // Medium brown
      roughness: 0.9,
      metalness: 0.0,
      flatShading: false,
    });

    material.name = 'ceiling-stone';
    this.materials.set('ceiling', material);
  }

  /**
   * Create door material (wood)
   */
  private createDoorMaterial(): void {
    const material = new THREE.MeshStandardMaterial({
      color: 0x4d3319,
      roughness: 0.8,
      metalness: 0.0,
      flatShading: false,
    });

    material.name = 'door-wood';
    this.materials.set('door', material);
  }

  /**
   * Create trap material (glowing red)
   */
  private createTrapMaterial(): void {
    const material = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.5,
      roughness: 0.3,
      metalness: 0.7,
      flatShading: false,
    });

    material.name = 'trap-danger';
    this.materials.set('trap', material);
  }

  /**
   * Add procedural normal map variation
   */
  private addProceduralNormal(material: THREE.MeshStandardMaterial, type: string): void {
    // Create procedural normal map using canvas
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Generate noise-based normal map
    const imageData = ctx.createImageData(512, 512);
    
    for (let i = 0; i < imageData.data.length; i += 4) {
      const noise = Math.random();
      const value = type === 'wall' 
        ? 128 + noise * 30  // More variation for walls
        : 128 + noise * 15; // Less variation for floors
      
      imageData.data[i] = value;     // R
      imageData.data[i + 1] = value; // G
      imageData.data[i + 2] = 255;   // B (normal pointing up)
      imageData.data[i + 3] = 255;   // A
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    material.normalMap = texture;
    material.normalScale = new THREE.Vector2(0.3, 0.3);
  }

  /**
   * Load texture from URL
   */
  loadTexture(url: string, onLoad?: (texture: THREE.Texture) => void): THREE.Texture {
    return this.textureLoader.load(url, onLoad);
  }

  /**
   * Create custom material from configuration
   */
  createCustomMaterial(config: MaterialConfig): THREE.MeshStandardMaterial {
    const material = new THREE.MeshStandardMaterial({
      color: typeof config.baseColor === 'string' 
        ? new THREE.Color(config.baseColor) 
        : config.baseColor,
      roughness: config.roughness,
      metalness: config.metalness,
    });

    if (config.emissive) {
      material.emissive = typeof config.emissive === 'string'
        ? new THREE.Color(config.emissive)
        : config.emissive;
      material.emissiveIntensity = config.emissiveIntensity || 0.5;
    }

    if (config.textureUrl) {
      const texture = this.loadTexture(config.textureUrl);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      material.map = texture;
    }

    if (config.normalMapUrl) {
      const normalMap = this.loadTexture(config.normalMapUrl);
      normalMap.wrapS = THREE.RepeatWrapping;
      normalMap.wrapT = THREE.RepeatWrapping;
      material.normalMap = normalMap;
    }

    material.name = config.name;
    this.materials.set(config.name, material);

    return material;
  }

  /**
   * Get wall material
   */
  getWallMaterial(): THREE.Material {
    return this.materials.get('wall') || new THREE.MeshStandardMaterial();
  }

  /**
   * Get floor material
   */
  getFloorMaterial(): THREE.Material {
    return this.materials.get('floor') || new THREE.MeshStandardMaterial();
  }

  /**
   * Get ceiling material
   */
  getCeilingMaterial(): THREE.Material {
    return this.materials.get('ceiling') || new THREE.MeshStandardMaterial();
  }

  /**
   * Get door material
   */
  getDoorMaterial(): THREE.Material {
    return this.materials.get('door') || new THREE.MeshStandardMaterial();
  }

  /**
   * Get trap material
   */
  getTrapMaterial(): THREE.Material {
    return this.materials.get('trap') || new THREE.MeshStandardMaterial();
  }

  /**
   * Get material by name
   */
  getMaterial(name: string): THREE.Material | undefined {
    return this.materials.get(name);
  }

  /**
   * Update material properties
   */
  updateMaterial(
    name: string,
    updates: Partial<{
      color: THREE.Color;
      roughness: number;
      metalness: number;
      emissive: THREE.Color;
      emissiveIntensity: number;
    }>
  ): void {
    const material = this.materials.get(name);
    if (!material || !(material instanceof THREE.MeshStandardMaterial)) return;

    if (updates.color) material.color = updates.color;
    if (updates.roughness !== undefined) material.roughness = updates.roughness;
    if (updates.metalness !== undefined) material.metalness = updates.metalness;
    if (updates.emissive) material.emissive = updates.emissive;
    if (updates.emissiveIntensity !== undefined) {
      material.emissiveIntensity = updates.emissiveIntensity;
    }

    material.needsUpdate = true;
  }

  /**
   * Create material variant
   */
  createVariant(
    baseName: string,
    variantName: string,
    modifications: Partial<MaterialConfig>
  ): THREE.Material | null {
    const baseMaterial = this.materials.get(baseName);
    if (!baseMaterial || !(baseMaterial instanceof THREE.MeshStandardMaterial)) {
      return null;
    }

    const variant = baseMaterial.clone();
    variant.name = variantName;

    if (modifications.baseColor) {
      variant.color = typeof modifications.baseColor === 'string'
        ? new THREE.Color(modifications.baseColor)
        : modifications.baseColor;
    }

    if (modifications.roughness !== undefined) {
      variant.roughness = modifications.roughness;
    }

    if (modifications.metalness !== undefined) {
      variant.metalness = modifications.metalness;
    }

    if (modifications.emissive) {
      variant.emissive = typeof modifications.emissive === 'string'
        ? new THREE.Color(modifications.emissive)
        : modifications.emissive;
    }

    if (modifications.emissiveIntensity !== undefined) {
      variant.emissiveIntensity = modifications.emissiveIntensity;
    }

    this.materials.set(variantName, variant);
    return variant;
  }

  /**
   * Dispose of all materials
   */
  dispose(): void {
    this.materials.forEach(material => {
      if (material instanceof THREE.MeshStandardMaterial) {
        material.map?.dispose();
        material.normalMap?.dispose();
        material.roughnessMap?.dispose();
        material.metalnessMap?.dispose();
        material.dispose();
      }
    });
    this.materials.clear();
  }

  /**
   * Get all material names
   */
  getMaterialNames(): string[] {
    return Array.from(this.materials.keys());
  }

  /**
   * Check if material exists
   */
  hasMaterial(name: string): boolean {
    return this.materials.has(name);
  }
}

/**
 * Singleton instance for global access
 */
let globalMaterialLibrary: MaterialLibrary | null = null;

/**
 * Get or create global material library
 */
export function getMaterialLibrary(): MaterialLibrary {
  if (!globalMaterialLibrary) {
    globalMaterialLibrary = new MaterialLibrary();
  }
  return globalMaterialLibrary;
}

/**
 * Dispose global material library
 */
export function disposeMaterialLibrary(): void {
  if (globalMaterialLibrary) {
    globalMaterialLibrary.dispose();
    globalMaterialLibrary = null;
  }
}
