/**
 * fogOfWar.ts - Fog of War System
 * 
 * Shader-based fog of war that darkens unexplored areas.
 * Tracks exploration state per room and updates dynamically.
 */

import * as THREE from 'three';
import { FogOfWarState, DungeonRoom3D } from './types';

/**
 * Fog of War shader material
 */
const FOG_OF_WAR_VERTEX_SHADER = `
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  
  void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const FOG_OF_WAR_FRAGMENT_SHADER = `
  uniform sampler2D explorationMap;
  uniform vec2 playerPosition;
  uniform float visibilityRadius;
  uniform float gridSize;
  uniform vec3 fogColor;
  uniform float fogDensity;
  
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  
  void main() {
    // Sample exploration map
    vec4 exploration = texture2D(explorationMap, vUv);
    float explored = exploration.r;
    
    // Calculate distance from player
    vec2 worldPos2D = vWorldPosition.xz;
    float distanceFromPlayer = length(worldPos2D - playerPosition);
    
    // Visibility falloff (wider, softer gradient)
    float visibility = 1.0 - smoothstep(
      visibilityRadius * 0.5,
      visibilityRadius * 1.2,
      distanceFromPlayer
    );
    
    // Combine exploration and current visibility
    float finalVisibility = max(explored * 0.5, visibility);
    
    // Apply fog (reduced opacity for better room visibility)
    float fogAmount = 1.0 - finalVisibility;
    vec3 finalColor = mix(vec3(1.0), fogColor, fogAmount * fogDensity);
    
    gl_FragColor = vec4(finalColor, fogAmount * 0.6);
  }
`;

/**
 * Fog of War manager
 * Handles exploration tracking and shader updates
 */
export class FogOfWar {
  private scene: THREE.Scene;
  private fogMesh: THREE.Mesh | null = null;
  private explorationTexture: THREE.DataTexture | null = null;
  private explorationData: Uint8Array;
  private gridSize: number;
  private visibilityRadius: number;
  private playerPosition: THREE.Vector2;
  private roomStates: Map<string, FogOfWarState>;
  private material: THREE.ShaderMaterial | null = null;

  constructor(scene: THREE.Scene, gridSize: number = 10, visibilityRadius: number = 15) {
    this.scene = scene;
    this.gridSize = gridSize;
    this.visibilityRadius = visibilityRadius;
    this.playerPosition = new THREE.Vector2(0, 0);
    this.roomStates = new Map();
    this.explorationData = new Uint8Array(gridSize * gridSize * 4);
    this.initializeFogMesh();
  }

  /**
   * Initialize fog of war mesh with shader
   */
  private initializeFogMesh(): void {
    // Create exploration texture
    this.explorationTexture = new THREE.DataTexture(
      this.explorationData,
      this.gridSize,
      this.gridSize,
      THREE.RGBAFormat
    );
    this.explorationTexture.needsUpdate = true;

    // Create shader material
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        explorationMap: { value: this.explorationTexture },
        playerPosition: { value: this.playerPosition },
        visibilityRadius: { value: this.visibilityRadius },
        gridSize: { value: this.gridSize },
        fogColor: { value: new THREE.Color(0x000000) },
        fogDensity: { value: 0.9 },
      },
      vertexShader: FOG_OF_WAR_VERTEX_SHADER,
      fragmentShader: FOG_OF_WAR_FRAGMENT_SHADER,
      transparent: true,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.SrcAlphaFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      depthWrite: false,
    });

    // Create plane mesh covering the room
    const geometry = new THREE.PlaneGeometry(100, 100);
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(0, 0.1, 0); // Slightly above floor to prevent z-fighting

    this.fogMesh = new THREE.Mesh(geometry, this.material);
    this.fogMesh.name = 'fog-of-war';
    this.fogMesh.renderOrder = 1000; // Render after everything else
    this.scene.add(this.fogMesh);
  }

  /**
   * Update player position and reveal nearby tiles
   */
  updatePlayerPosition(position: THREE.Vector3, roomId: string): void {
    this.playerPosition.set(position.x, position.z);
    
    if (this.material) {
      this.material.uniforms.playerPosition.value = this.playerPosition;
    }

    // Reveal tiles around player
    this.revealTilesAroundPlayer(position, roomId);
  }

  /**
   * Reveal tiles within visibility radius
   */
  private revealTilesAroundPlayer(position: THREE.Vector3, roomId: string): void {
    const state = this.getRoomState(roomId);
    const tileSize = 2; // Match generator tile size
    const gridX = Math.floor(position.x / tileSize) + Math.floor(this.gridSize / 2);
    const gridZ = Math.floor(position.z / tileSize) + Math.floor(this.gridSize / 2);
    const radiusTiles = Math.ceil(this.visibilityRadius / tileSize);

    let updated = false;

    for (let dx = -radiusTiles; dx <= radiusTiles; dx++) {
      for (let dz = -radiusTiles; dz <= radiusTiles; dz++) {
        const x = gridX + dx;
        const z = gridZ + dz;

        if (x < 0 || x >= this.gridSize || z < 0 || z >= this.gridSize) continue;

        const distance = Math.sqrt(dx * dx + dz * dz);
        if (distance <= radiusTiles) {
          if (!state.exploredTiles[z][x]) {
            state.exploredTiles[z][x] = true;
            updated = true;
          }
        }
      }
    }

    if (updated) {
      this.updateExplorationTexture(state);
    }
  }

  /**
   * Update exploration texture from state
   */
  private updateExplorationTexture(state: FogOfWarState): void {
    if (!this.explorationTexture) return;

    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        const index = (y * this.gridSize + x) * 4;
        const explored = state.exploredTiles[y][x] ? 255 : 0;
        
        this.explorationData[index] = explored;     // R
        this.explorationData[index + 1] = explored; // G
        this.explorationData[index + 2] = explored; // B
        this.explorationData[index + 3] = 255;      // A
      }
    }

    this.explorationTexture.needsUpdate = true;
  }

  /**
   * Get or create fog of war state for room
   */
  private getRoomState(roomId: string): FogOfWarState {
    let state = this.roomStates.get(roomId);
    
    if (!state) {
      state = {
        roomId,
        exploredTiles: Array(this.gridSize)
          .fill(null)
          .map(() => Array(this.gridSize).fill(false)),
        visibilityRadius: this.visibilityRadius,
        playerPosition: new THREE.Vector2(0, 0),
      };
      this.roomStates.set(roomId, state);
    }

    return state;
  }

  /**
   * Switch to different room
   */
  switchRoom(roomId: string, room: DungeonRoom3D): void {
    const state = this.getRoomState(roomId);
    this.updateExplorationTexture(state);

    // Update fog mesh size to match room
    if (this.fogMesh) {
      const geometry = new THREE.PlaneGeometry(
        room.dimensions.width + 2,
        room.dimensions.depth + 2
      );
      geometry.rotateX(-Math.PI / 2);
      geometry.translate(0, 0.1, 0);
      
      this.fogMesh.geometry.dispose();
      this.fogMesh.geometry = geometry;
      this.fogMesh.position.copy(room.position);
    }
  }

  /**
   * Reveal entire room (for debug or special events)
   */
  revealRoom(roomId: string): void {
    const state = this.getRoomState(roomId);
    
    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        state.exploredTiles[y][x] = true;
      }
    }

    this.updateExplorationTexture(state);
  }

  /**
   * Reset room exploration
   */
  resetRoom(roomId: string): void {
    const state = this.getRoomState(roomId);
    
    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        state.exploredTiles[y][x] = false;
      }
    }

    this.updateExplorationTexture(state);
  }

  /**
   * Set visibility radius
   */
  setVisibilityRadius(radius: number): void {
    this.visibilityRadius = radius;
    if (this.material) {
      this.material.uniforms.visibilityRadius.value = radius;
    }
  }

  /**
   * Set fog color
   */
  setFogColor(color: THREE.Color): void {
    if (this.material) {
      this.material.uniforms.fogColor.value = color;
    }
  }

  /**
   * Set fog density
   */
  setFogDensity(density: number): void {
    if (this.material) {
      this.material.uniforms.fogDensity.value = density;
    }
  }

  /**
   * Enable/disable fog of war
   */
  setEnabled(enabled: boolean): void {
    if (this.fogMesh) {
      this.fogMesh.visible = enabled;
    }
  }

  /**
   * Get exploration percentage for room
   */
  getExplorationPercentage(roomId: string): number {
    const state = this.roomStates.get(roomId);
    if (!state) return 0;

    let exploredCount = 0;
    let totalCount = 0;

    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        if (state.exploredTiles[y][x]) exploredCount++;
        totalCount++;
      }
    }

    return totalCount > 0 ? (exploredCount / totalCount) * 100 : 0;
  }

  /**
   * Check if tile is explored
   */
  isTileExplored(roomId: string, tileX: number, tileY: number): boolean {
    const state = this.roomStates.get(roomId);
    if (!state) return false;

    if (tileX < 0 || tileX >= this.gridSize || tileY < 0 || tileY >= this.gridSize) {
      return false;
    }

    return state.exploredTiles[tileY][tileX];
  }

  /**
   * Dispose of fog of war resources
   */
  dispose(): void {
    if (this.fogMesh) {
      this.fogMesh.geometry.dispose();
      this.scene.remove(this.fogMesh);
    }

    if (this.material) {
      this.material.dispose();
    }

    if (this.explorationTexture) {
      this.explorationTexture.dispose();
    }

    this.roomStates.clear();
  }
}
