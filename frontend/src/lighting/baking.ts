/**
 * Lightmap Baking - Pre-calculate static lighting
 * Agent Arena 3D Roguelike - P2.6
 * Simplified implementation for performance optimization
 */

import * as THREE from 'three';
import { LightmapConfig } from './types';

/**
 * Lightmap baker for static lighting optimization
 * Pre-calculates lighting and stores as textures
 */
export class LightmapBaker {
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private config: Required<LightmapConfig>;
  private lightmaps: Map<string, THREE.Texture> = new Map();

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer, config: Partial<LightmapConfig> = {}) {
    this.scene = scene;
    this.renderer = renderer;
    
    this.config = {
      resolution: config.resolution ?? 1024,
      samples: config.samples ?? 16,
      blur: config.blur ?? 1,
      indirect: config.indirect ?? false,
      bounces: config.bounces ?? 1,
    };
  }

  /**
   * Bake lightmap for static meshes
   * @param meshes Array of meshes to bake lighting for
   * @param lights Lights to include in baking
   */
  public async bakeLightmap(
    meshes: THREE.Mesh[],
    lights: THREE.Light[]
  ): Promise<Map<string, THREE.Texture>> {
    console.log('LightmapBaker: Starting lightmap baking...');

    // Create temporary render target
    const renderTarget = new THREE.WebGLRenderTarget(
      this.config.resolution,
      this.config.resolution,
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
      }
    );

    // Process each mesh
    for (const mesh of meshes) {
      if (!mesh.geometry.attributes.uv) {
        console.warn('LightmapBaker: Mesh missing UV coordinates, skipping');
        continue;
      }

      const lightmap = await this.bakeMeshLightmap(mesh, lights, renderTarget);
      const meshId = mesh.uuid;
      this.lightmaps.set(meshId, lightmap);

      // Apply lightmap to mesh
      if (mesh.material instanceof THREE.MeshStandardMaterial) {
        mesh.material.lightMap = lightmap;
        mesh.material.lightMapIntensity = 1.0;
        mesh.material.needsUpdate = true;
      }
    }

    renderTarget.dispose();
    console.log(`LightmapBaker: Baked ${this.lightmaps.size} lightmaps`);

    return this.lightmaps;
  }

  /**
   * Bake lightmap for a single mesh
   */
  private async bakeMeshLightmap(
    mesh: THREE.Mesh,
    lights: THREE.Light[],
    renderTarget: THREE.WebGLRenderTarget
  ): Promise<THREE.Texture> {
    // Create a simplified scene with just the mesh and lights
    const bakeScene = new THREE.Scene();
    
    // Clone mesh for baking
    const bakeMesh = mesh.clone();
    bakeScene.add(bakeMesh);

    // Add lights to bake scene
    lights.forEach(light => {
      const lightClone = light.clone();
      bakeScene.add(lightClone);
    });

    // Create orthographic camera for UV mapping
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Render to target
    this.renderer.setRenderTarget(renderTarget);
    this.renderer.render(bakeScene, camera);
    this.renderer.setRenderTarget(null);

    // Create texture from render target
    const texture = renderTarget.texture.clone();
    texture.needsUpdate = true;

    // Cleanup
    bakeScene.clear();

    return texture;
  }

  /**
   * Apply baked lightmap to mesh
   */
  public applyLightmap(mesh: THREE.Mesh, lightmap: THREE.Texture): void {
    if (!(mesh.material instanceof THREE.MeshStandardMaterial)) {
      console.warn('LightmapBaker: Material does not support lightmaps');
      return;
    }

    mesh.material.lightMap = lightmap;
    mesh.material.lightMapIntensity = 1.0;
    mesh.material.needsUpdate = true;
  }

  /**
   * Get baked lightmap for mesh
   */
  public getLightmap(meshId: string): THREE.Texture | undefined {
    return this.lightmaps.get(meshId);
  }

  /**
   * Clear all baked lightmaps
   */
  public clear(): void {
    this.lightmaps.forEach(texture => texture.dispose());
    this.lightmaps.clear();
  }

  /**
   * Export lightmaps as data URLs for caching
   */
  public exportLightmaps(): Map<string, string> {
    const exported = new Map<string, string>();

    this.lightmaps.forEach((texture, meshId) => {
      // Convert texture to canvas
      const canvas = document.createElement('canvas');
      canvas.width = this.config.resolution;
      canvas.height = this.config.resolution;
      const ctx = canvas.getContext('2d');

      if (ctx && texture.image) {
        ctx.drawImage(texture.image, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        exported.set(meshId, dataUrl);
      }
    });

    return exported;
  }

  /**
   * Import lightmaps from data URLs
   */
  public async importLightmaps(lightmapData: Map<string, string>): Promise<void> {
    const loader = new THREE.TextureLoader();

    for (const [meshId, dataUrl] of lightmapData.entries()) {
      const texture = await loader.loadAsync(dataUrl);
      this.lightmaps.set(meshId, texture);
    }

    console.log(`LightmapBaker: Imported ${this.lightmaps.size} lightmaps`);
  }

  /**
   * Dispose of all resources
   */
  public dispose(): void {
    this.clear();
  }
}

/**
 * Simple ambient occlusion baker
 */
export class AmbientOcclusionBaker {
  /**
   * Bake ambient occlusion for a mesh
   * @param mesh Mesh to bake AO for
   * @param samples Number of samples
   * @param distance Ray distance
   */
  public static bakeAO(
    mesh: THREE.Mesh,
    samples: number = 16,
    distance: number = 0.5
  ): Float32Array | null {
    const geometry = mesh.geometry;
    const positionAttribute = geometry.attributes.position;
    const normalAttribute = geometry.attributes.normal;

    if (!positionAttribute || !normalAttribute) {
      console.warn('AmbientOcclusionBaker: Mesh missing required attributes');
      return null;
    }

    const vertexCount = positionAttribute.count;
    const aoValues = new Float32Array(vertexCount);

    const raycaster = new THREE.Raycaster();
    raycaster.far = distance;

    const position = new THREE.Vector3();
    const normal = new THREE.Vector3();

    // Calculate AO for each vertex
    for (let i = 0; i < vertexCount; i++) {
      position.fromBufferAttribute(positionAttribute, i);
      normal.fromBufferAttribute(normalAttribute, i);

      // Transform to world space
      position.applyMatrix4(mesh.matrixWorld);
      normal.transformDirection(mesh.matrixWorld);

      let occlusion = 0;

      // Sample hemisphere around normal
      for (let s = 0; s < samples; s++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random());

        const direction = new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta),
          Math.sin(phi) * Math.sin(theta),
          Math.cos(phi)
        );

        // Orient to normal
        direction.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 0, 1),
          normal
        ));

        raycaster.set(position, direction);
        const intersects = raycaster.intersectObject(mesh);

        if (intersects.length > 0) {
          occlusion += 1 - (intersects[0].distance / distance);
        }
      }

      aoValues[i] = 1 - (occlusion / samples);
    }

    return aoValues;
  }
}
