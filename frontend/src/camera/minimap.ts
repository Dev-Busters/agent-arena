/**
 * Minimap Rendering System
 * Agent Arena 3D Roguelike - Phase 2.7
 */

import { MinimapConfig, MinimapEntity, MinimapRoom } from './types';

/**
 * Minimap class for rendering top-down dungeon view
 * Canvas-based implementation for performance
 */
export class Minimap {
  private config: MinimapConfig;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private rooms: MinimapRoom[];
  private entities: MinimapEntity[];
  private playerPosition: { x: number; z: number };
  private container: HTMLElement | null;

  constructor(config: MinimapConfig, containerElement?: HTMLElement) {
    this.config = config;
    this.rooms = [];
    this.entities = [];
    this.playerPosition = { x: 0, z: 0 };
    this.container = containerElement || null;

    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = config.width;
    this.canvas.height = config.height;
    this.canvas.style.position = 'absolute';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.opacity = config.opacity.toString();
    this.canvas.style.border = `${config.borderWidth}px solid ${config.borderColor}`;
    this.canvas.style.backgroundColor = config.backgroundColor;
    this.canvas.style.zIndex = '1000';

    // Set position
    this.applyPosition();

    // Get context
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D rendering context for minimap');
    }
    this.ctx = ctx;

    // Append to container or body
    if (this.container) {
      this.container.appendChild(this.canvas);
    }
  }

  /**
   * Apply minimap position from config
   */
  private applyPosition(): void {
    const pos = this.config.position;
    if (pos.top !== undefined) {
      this.canvas.style.top = `${pos.top}px`;
    }
    if (pos.right !== undefined) {
      this.canvas.style.right = `${pos.right}px`;
    }
    if (pos.bottom !== undefined) {
      this.canvas.style.bottom = `${pos.bottom}px`;
    }
    if (pos.left !== undefined) {
      this.canvas.style.left = `${pos.left}px`;
    }

    // Default to top-right if no position specified
    if (
      pos.top === undefined &&
      pos.right === undefined &&
      pos.bottom === undefined &&
      pos.left === undefined
    ) {
      this.canvas.style.top = '20px';
      this.canvas.style.right = '20px';
    }
  }

  /**
   * Set player position
   */
  public setPlayerPosition(x: number, z: number): void {
    this.playerPosition = { x, z };
  }

  /**
   * Add or update room
   */
  public addRoom(room: MinimapRoom): void {
    const existingIndex = this.rooms.findIndex((r) => r.id === room.id);
    if (existingIndex >= 0) {
      this.rooms[existingIndex] = room;
    } else {
      this.rooms.push(room);
    }
  }

  /**
   * Remove room
   */
  public removeRoom(roomId: string): void {
    this.rooms = this.rooms.filter((r) => r.id !== roomId);
  }

  /**
   * Set explored status for room
   */
  public setRoomExplored(roomId: string, explored: boolean): void {
    const room = this.rooms.find((r) => r.id === roomId);
    if (room) {
      room.explored = explored;
    }
  }

  /**
   * Add or update entity
   */
  public addEntity(entity: MinimapEntity): void {
    const existingIndex = this.entities.findIndex((e) => e.id === entity.id);
    if (existingIndex >= 0) {
      this.entities[existingIndex] = entity;
    } else {
      this.entities.push(entity);
    }
  }

  /**
   * Remove entity
   */
  public removeEntity(entityId: string): void {
    this.entities = this.entities.filter((e) => e.id !== entityId);
  }

  /**
   * Clear all entities
   */
  public clearEntities(): void {
    this.entities = [];
  }

  /**
   * Render minimap (call every frame or when needed)
   */
  public render(): void {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Calculate world bounds from rooms
    const bounds = this.calculateWorldBounds();
    if (!bounds) return;

    // Calculate scale and offset for centering
    const scale = this.calculateScale(bounds);
    const offset = this.calculateOffset(bounds, scale);

    // Render rooms
    this.renderRooms(scale, offset);

    // Render entities
    if (this.config.showEnemies || this.config.showItems) {
      this.renderEntities(scale, offset);
    }

    // Render player (always on top)
    this.renderPlayer(scale, offset);
  }

  /**
   * Calculate world bounds from rooms
   */
  private calculateWorldBounds(): {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  } | null {
    if (this.rooms.length === 0) return null;

    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;

    for (const room of this.rooms) {
      minX = Math.min(minX, room.bounds.minX);
      maxX = Math.max(maxX, room.bounds.maxX);
      minZ = Math.min(minZ, room.bounds.minZ);
      maxZ = Math.max(maxZ, room.bounds.maxZ);
    }

    return { minX, maxX, minZ, maxZ };
  }

  /**
   * Calculate scale factor
   */
  private calculateScale(bounds: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  }): number {
    const worldWidth = bounds.maxX - bounds.minX;
    const worldHeight = bounds.maxZ - bounds.minZ;
    const scaleX = (this.canvas.width * 0.9) / worldWidth;
    const scaleZ = (this.canvas.height * 0.9) / worldHeight;
    return Math.min(scaleX, scaleZ) * this.config.zoom;
  }

  /**
   * Calculate offset for centering
   */
  private calculateOffset(
    bounds: { minX: number; maxX: number; minZ: number; maxZ: number },
    scale: number
  ): { x: number; z: number } {
    const worldCenterX = (bounds.minX + bounds.maxX) / 2;
    const worldCenterZ = (bounds.minZ + bounds.maxZ) / 2;
    
    return {
      x: this.canvas.width / 2 - worldCenterX * scale,
      z: this.canvas.height / 2 - worldCenterZ * scale,
    };
  }

  /**
   * Render rooms
   */
  private renderRooms(scale: number, offset: { x: number; z: number }): void {
    for (const room of this.rooms) {
      const x = room.bounds.minX * scale + offset.x;
      const z = room.bounds.minZ * scale + offset.z;
      const width = (room.bounds.maxX - room.bounds.minX) * scale;
      const height = (room.bounds.maxZ - room.bounds.minZ) * scale;

      // Determine room color
      const color = room.explored
        ? this.config.exploredColor
        : this.config.unexploredColor;

      // Draw room rectangle
      this.ctx.fillStyle = color;
      this.ctx.fillRect(x, z, width, height);

      // Draw room border
      this.ctx.strokeStyle = this.config.borderColor;
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(x, z, width, height);

      // Apply fog of war for unexplored rooms
      if (!room.explored && this.config.showFogOfWar) {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(x, z, width, height);
      }
    }
  }

  /**
   * Render entities
   */
  private renderEntities(scale: number, offset: { x: number; z: number }): void {
    for (const entity of this.entities) {
      // Skip player (rendered separately)
      if (entity.type === 'player') continue;

      // Skip enemies if disabled
      if (entity.type === 'enemy' && !this.config.showEnemies) continue;

      // Skip items if disabled
      if (entity.type === 'item' && !this.config.showItems) continue;

      const x = entity.position.x * scale + offset.x;
      const z = entity.position.z * scale + offset.z;

      // Determine entity color
      let color: string;
      switch (entity.type) {
        case 'enemy':
          color = entity.color || this.config.enemyColor;
          break;
        case 'item':
          color = entity.color || this.config.itemColor;
          break;
        default:
          color = '#ffffff';
      }

      // Draw entity marker
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(x, z, 3, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  /**
   * Render player marker
   */
  private renderPlayer(scale: number, offset: { x: number; z: number }): void {
    const x = this.playerPosition.x * scale + offset.x;
    const z = this.playerPosition.z * scale + offset.z;

    // Draw player marker (larger and distinct)
    this.ctx.fillStyle = this.config.playerColor;
    this.ctx.beginPath();
    this.ctx.arc(x, z, 5, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw player outline
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(x, z, 5, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  /**
   * Show minimap
   */
  public show(): void {
    this.canvas.style.display = 'block';
  }

  /**
   * Hide minimap
   */
  public hide(): void {
    this.canvas.style.display = 'none';
  }

  /**
   * Set minimap opacity
   */
  public setOpacity(opacity: number): void {
    this.config.opacity = Math.max(0, Math.min(1, opacity));
    this.canvas.style.opacity = this.config.opacity.toString();
  }

  /**
   * Set minimap zoom
   */
  public setZoom(zoom: number): void {
    this.config.zoom = Math.max(0.1, zoom);
  }

  /**
   * Get canvas element
   */
  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<MinimapConfig>): void {
    Object.assign(this.config, config);
    this.applyPosition();
    this.canvas.style.opacity = this.config.opacity.toString();
  }

  /**
   * Cleanup and remove from DOM
   */
  public dispose(): void {
    if (this.canvas.parentElement) {
      this.canvas.parentElement.removeChild(this.canvas);
    }
    this.rooms = [];
    this.entities = [];
  }
}
