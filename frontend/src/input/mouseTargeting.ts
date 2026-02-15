/**
 * Mouse Targeting System - 3D Raycasting for Enemy Targeting
 * Handles mouse-to-world raycasting, enemy hover detection, and click targeting
 */

import * as THREE from 'three';

export interface TargetableEntity {
  id: string;
  mesh: THREE.Mesh | THREE.Group;
  type: 'enemy' | 'item' | 'npc';
  position: THREE.Vector3;
}

export interface MouseTargetResult {
  /** Entity that was hit (null if nothing) */
  entity: TargetableEntity | null;
  /** World position of intersection */
  position: THREE.Vector3 | null;
  /** Distance from camera */
  distance: number;
  /** Was this a valid target? */
  isValidTarget: boolean;
}

export class MouseTargeting {
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private camera: THREE.Camera | null = null;
  private targetableEntities: Map<string, TargetableEntity> = new Map();
  private hoveredEntity: TargetableEntity | null = null;
  private selectedEntity: TargetableEntity | null = null;
  private canvasElement: HTMLCanvasElement | null = null;

  constructor() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    // Increase raycaster precision for small targets
    this.raycaster.params.Line = { threshold: 0.1 };
    this.raycaster.params.Points = { threshold: 0.1 };
  }

  /**
   * Initialize with camera and canvas element
   */
  initialize(camera: THREE.Camera, canvas: HTMLCanvasElement): void {
    this.camera = camera;
    this.canvasElement = canvas;
  }

  /**
   * Register an entity as targetable
   */
  registerEntity(entity: TargetableEntity): void {
    this.targetableEntities.set(entity.id, entity);
  }

  /**
   * Unregister a targetable entity
   */
  unregisterEntity(entityId: string): void {
    this.targetableEntities.delete(entityId);
    
    // Clear hover/selection if this was the entity
    if (this.hoveredEntity?.id === entityId) {
      this.hoveredEntity = null;
    }
    if (this.selectedEntity?.id === entityId) {
      this.selectedEntity = null;
    }
  }

  /**
   * Clear all registered entities
   */
  clearEntities(): void {
    this.targetableEntities.clear();
    this.hoveredEntity = null;
    this.selectedEntity = null;
  }

  /**
   * Update mouse position from screen coordinates
   * @param clientX - Mouse X in screen pixels
   * @param clientY - Mouse Y in screen pixels
   */
  updateMousePosition(clientX: number, clientY: number): void {
    if (!this.canvasElement) return;

    const rect = this.canvasElement.getBoundingClientRect();
    
    // Convert to normalized device coordinates (-1 to +1)
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  }

  /**
   * Perform raycast and find what's under the mouse
   * @returns Target result with hit entity and position
   */
  raycast(): MouseTargetResult {
    if (!this.camera) {
      return {
        entity: null,
        position: null,
        distance: Infinity,
        isValidTarget: false,
      };
    }

    // Update raycaster
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Collect all meshes from targetable entities
    const meshes: THREE.Object3D[] = [];
    const entityMap = new Map<THREE.Object3D, TargetableEntity>();

    this.targetableEntities.forEach((entity) => {
      if (entity.mesh instanceof THREE.Group) {
        // If group, raycast against all children
        entity.mesh.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            meshes.push(child);
            entityMap.set(child, entity);
          }
        });
      } else {
        meshes.push(entity.mesh);
        entityMap.set(entity.mesh, entity);
      }
    });

    // Perform raycast
    const intersections = this.raycaster.intersectObjects(meshes, false);

    if (intersections.length > 0) {
      const hit = intersections[0];
      const entity = entityMap.get(hit.object);

      if (entity) {
        return {
          entity,
          position: hit.point,
          distance: hit.distance,
          isValidTarget: entity.type === 'enemy',
        };
      }
    }

    return {
      entity: null,
      position: null,
      distance: Infinity,
      isValidTarget: false,
    };
  }

  /**
   * Update hover state (call on mouse move)
   * @returns Currently hovered entity (null if none)
   */
  updateHover(): TargetableEntity | null {
    const result = this.raycast();
    
    // Update hovered entity
    const previousHover = this.hoveredEntity;
    this.hoveredEntity = result.isValidTarget ? result.entity : null;

    // Fire hover events if changed
    if (previousHover !== this.hoveredEntity) {
      if (previousHover) {
        this.onHoverExit(previousHover);
      }
      if (this.hoveredEntity) {
        this.onHoverEnter(this.hoveredEntity);
      }
    }

    return this.hoveredEntity;
  }

  /**
   * Handle click targeting
   * @returns Selected entity (null if nothing clicked)
   */
  handleClick(): TargetableEntity | null {
    const result = this.raycast();
    
    if (result.isValidTarget && result.entity) {
      this.selectedEntity = result.entity;
      this.onTargetSelected(result.entity);
      return result.entity;
    }

    // Clicked empty space - clear target
    if (this.selectedEntity) {
      this.onTargetCleared();
    }
    this.selectedEntity = null;
    
    return null;
  }

  /**
   * Get currently hovered entity
   */
  getHoveredEntity(): TargetableEntity | null {
    return this.hoveredEntity;
  }

  /**
   * Get currently selected entity
   */
  getSelectedEntity(): TargetableEntity | null {
    return this.selectedEntity;
  }

  /**
   * Manually set selected entity
   */
  setSelectedEntity(entityId: string | null): void {
    if (entityId === null) {
      this.selectedEntity = null;
      this.onTargetCleared();
      return;
    }

    const entity = this.targetableEntities.get(entityId);
    if (entity) {
      this.selectedEntity = entity;
      this.onTargetSelected(entity);
    }
  }

  /**
   * Clear current selection
   */
  clearSelection(): void {
    if (this.selectedEntity) {
      this.onTargetCleared();
    }
    this.selectedEntity = null;
  }

  /**
   * Hover enter callback (override to add visual effects)
   */
  protected onHoverEnter(entity: TargetableEntity): void {
    // Can be overridden to add hover highlight
    // Default: change cursor
    if (this.canvasElement) {
      this.canvasElement.style.cursor = 'pointer';
    }
  }

  /**
   * Hover exit callback
   */
  protected onHoverExit(entity: TargetableEntity): void {
    // Default: reset cursor
    if (this.canvasElement) {
      this.canvasElement.style.cursor = 'default';
    }
  }

  /**
   * Target selected callback
   */
  protected onTargetSelected(entity: TargetableEntity): void {
    // Can be overridden to add selection visual
    console.log('[MouseTargeting] Target selected:', entity.id);
  }

  /**
   * Target cleared callback
   */
  protected onTargetCleared(): void {
    // Can be overridden to remove selection visual
    console.log('[MouseTargeting] Target cleared');
  }

  /**
   * Get raycast origin and direction (for debugging)
   */
  getRaycastDebugInfo(): { origin: THREE.Vector3; direction: THREE.Vector3 } | null {
    if (!this.camera) return null;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    return {
      origin: this.raycaster.ray.origin.clone(),
      direction: this.raycaster.ray.direction.clone(),
    };
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.targetableEntities.clear();
    this.hoveredEntity = null;
    this.selectedEntity = null;
    this.camera = null;
    this.canvasElement = null;
  }
}

export default MouseTargeting;
