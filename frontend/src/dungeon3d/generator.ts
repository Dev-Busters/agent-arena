/**
 * generator.ts - Procedural Room Geometry Generation
 * 
 * Generates optimized 3D geometry for dungeon rooms from backend BSP data.
 * Handles walls, floors, ceilings, doors, and mesh optimization.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  DungeonRoom3D,
  DungeonMeshes,
  BackendDungeonRoom,
  GeneratorOptions,
  TileType,
  Direction,
  WallConfig,
  DoorConfig,
} from './types';
import { MaterialLibrary } from './materials';

/**
 * Default generator options
 */
const DEFAULT_OPTIONS: GeneratorOptions = {
  tileSize: 2,
  wallHeight: 4,
  doorWidth: 2,
  doorHeight: 3,
  gridSize: 10,
  optimizeMeshes: true,
  generateColliders: false,
};

/**
 * Dungeon geometry generator
 * Converts backend room data to optimized 3D meshes
 */
export class DungeonGenerator {
  private options: GeneratorOptions;
  private materials: MaterialLibrary;

  constructor(materials: MaterialLibrary, options: Partial<GeneratorOptions> = {}) {
    this.materials = materials;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Generate complete room meshes from dungeon room data
   */
  generateRoom(room: DungeonRoom3D): DungeonMeshes {
    const group = new THREE.Group();
    group.name = `room-${room.id}`;
    group.position.copy(room.position);

    // Generate individual components
    const walls = this.createWalls(room);
    const floor = this.createFloor(room);
    const ceiling = this.createCeiling(room);
    const doors = this.createDoors(room);
    const traps = room.traps ? this.createTraps(room) : [];

    // Add all meshes to group
    walls.forEach(wall => group.add(wall));
    group.add(floor);
    group.add(ceiling);
    doors.forEach(door => group.add(door));
    traps.forEach(trap => group.add(trap));

    return {
      walls,
      floor,
      ceiling,
      doors,
      traps: traps.length > 0 ? traps : undefined,
      group,
    };
  }

  /**
   * Create wall meshes with proper UVs and door cutouts
   */
  createWalls(room: DungeonRoom3D): THREE.Mesh[] {
    const walls: THREE.Mesh[] = [];
    const { tileSize, wallHeight } = this.options;
    const { width, depth } = room.dimensions;

    const wallGeometries: THREE.BufferGeometry[] = [];

    // Generate walls based on room configuration
    room.walls.forEach(wallConfig => {
      const hasDoor = wallConfig.hasDoor;
      
      if (hasDoor && wallConfig.doorPosition && wallConfig.doorWidth && wallConfig.doorHeight) {
        // Create wall segments around door
        const segments = this.createWallWithDoorCutout(wallConfig);
        segments.forEach(geom => wallGeometries.push(geom));
      } else {
        // Create solid wall
        const geometry = new THREE.BoxGeometry(
          wallConfig.width,
          wallConfig.height,
          0.2
        );
        
        // Set UV coordinates for proper texture mapping
        this.setWallUVs(geometry, wallConfig.width, wallConfig.height);
        
        geometry.translate(
          wallConfig.position.x,
          wallConfig.position.y,
          wallConfig.position.z
        );
        
        if (wallConfig.rotation) {
          geometry.rotateY(wallConfig.rotation.y);
        }
        
        wallGeometries.push(geometry);
      }
    });

    // Optimize: merge all wall geometries if enabled
    if (this.options.optimizeMeshes && wallGeometries.length > 1) {
      const mergedGeometry = mergeGeometries(wallGeometries, false);
      if (mergedGeometry) {
        const wallMesh = new THREE.Mesh(
          mergedGeometry,
          this.materials.getWallMaterial()
        );
        wallMesh.name = 'walls-merged';
        wallMesh.castShadow = true;
        wallMesh.receiveShadow = true;
        walls.push(wallMesh);
      }
    } else {
      // Create individual wall meshes
      wallGeometries.forEach((geom, index) => {
        const wallMesh = new THREE.Mesh(
          geom,
          this.materials.getWallMaterial()
        );
        wallMesh.name = `wall-${index}`;
        wallMesh.castShadow = true;
        wallMesh.receiveShadow = true;
        walls.push(wallMesh);
      });
    }

    return walls;
  }

  /**
   * Create wall segments with door cutout
   */
  private createWallWithDoorCutout(wallConfig: WallConfig): THREE.BufferGeometry[] {
    const segments: THREE.BufferGeometry[] = [];
    const doorWidth = wallConfig.doorWidth || this.options.doorWidth;
    const doorHeight = wallConfig.doorHeight || this.options.doorHeight;
    const doorPosX = wallConfig.doorPosition?.x || 0;

    // Left segment
    const leftWidth = (wallConfig.width / 2) - (doorWidth / 2) + doorPosX;
    if (leftWidth > 0.1) {
      const leftGeom = new THREE.BoxGeometry(leftWidth, wallConfig.height, 0.2);
      leftGeom.translate(
        wallConfig.position.x - (wallConfig.width / 2) + (leftWidth / 2),
        wallConfig.position.y,
        wallConfig.position.z
      );
      segments.push(leftGeom);
    }

    // Right segment
    const rightWidth = (wallConfig.width / 2) + (doorWidth / 2) - doorPosX;
    if (rightWidth > 0.1) {
      const rightGeom = new THREE.BoxGeometry(rightWidth, wallConfig.height, 0.2);
      rightGeom.translate(
        wallConfig.position.x + (wallConfig.width / 2) - (rightWidth / 2),
        wallConfig.position.y,
        wallConfig.position.z
      );
      segments.push(rightGeom);
    }

    // Top segment above door
    const topHeight = wallConfig.height - doorHeight;
    if (topHeight > 0.1) {
      const topGeom = new THREE.BoxGeometry(doorWidth, topHeight, 0.2);
      topGeom.translate(
        wallConfig.position.x + doorPosX,
        wallConfig.position.y + (wallConfig.height / 2) - (topHeight / 2),
        wallConfig.position.z
      );
      segments.push(topGeom);
    }

    return segments;
  }

  /**
   * Create floor mesh with texture coordinates
   */
  createFloor(room: DungeonRoom3D): THREE.Mesh {
    const { width, depth } = room.dimensions;
    const { tileSize } = this.options;

    const geometry = new THREE.PlaneGeometry(width, depth, room.gridSize, room.gridSize);
    
    // Set proper UVs for tiling
    this.setFloorUVs(geometry, width, depth, tileSize);
    
    // Rotate to horizontal
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(0, 0, 0);

    const floor = new THREE.Mesh(
      geometry,
      this.materials.getFloorMaterial()
    );
    floor.name = 'floor';
    floor.receiveShadow = true;
    
    return floor;
  }

  /**
   * Create ceiling mesh
   */
  createCeiling(room: DungeonRoom3D): THREE.Mesh {
    const { width, depth, height } = room.dimensions;

    const geometry = new THREE.PlaneGeometry(width, depth);
    
    // Set UVs for ceiling texture
    this.setFloorUVs(geometry, width, depth, this.options.tileSize);
    
    // Rotate to horizontal facing down
    geometry.rotateX(Math.PI / 2);
    geometry.translate(0, height, 0);

    const ceiling = new THREE.Mesh(
      geometry,
      this.materials.getCeilingMaterial()
    );
    ceiling.name = 'ceiling';
    ceiling.receiveShadow = true;
    
    return ceiling;
  }

  /**
   * Create door meshes for room exits
   */
  createDoors(room: DungeonRoom3D): THREE.Mesh[] {
    const doors: THREE.Mesh[] = [];
    const { doorWidth, doorHeight } = this.options;

    room.doors.forEach(doorConfig => {
      const geometry = new THREE.BoxGeometry(
        doorConfig.width,
        doorConfig.height,
        0.15
      );
      
      geometry.translate(
        doorConfig.position.x,
        doorConfig.position.y,
        doorConfig.position.z
      );

      const door = new THREE.Mesh(
        geometry,
        this.materials.getDoorMaterial()
      );
      door.name = `door-${doorConfig.id}`;
      door.userData.doorConfig = doorConfig;
      door.castShadow = true;
      
      doors.push(door);
    });

    return doors;
  }

  /**
   * Create trap meshes
   */
  private createTraps(room: DungeonRoom3D): THREE.Mesh[] {
    const traps: THREE.Mesh[] = [];
    
    if (!room.traps) return traps;

    room.traps.forEach(trapConfig => {
      const geometry = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 16);
      geometry.translate(
        trapConfig.position.x,
        trapConfig.position.y,
        trapConfig.position.z
      );

      const trap = new THREE.Mesh(
        geometry,
        this.materials.getTrapMaterial()
      );
      trap.name = `trap-${trapConfig.id}`;
      trap.userData.trapConfig = trapConfig;
      
      traps.push(trap);
    });

    return traps;
  }

  /**
   * Set proper UV coordinates for walls
   */
  private setWallUVs(geometry: THREE.BufferGeometry, width: number, height: number): void {
    const uvAttribute = geometry.attributes.uv;
    const uvScale = 2; // Scale factor for texture tiling

    for (let i = 0; i < uvAttribute.count; i++) {
      const u = uvAttribute.getX(i) * (width / uvScale);
      const v = uvAttribute.getY(i) * (height / uvScale);
      uvAttribute.setXY(i, u, v);
    }

    uvAttribute.needsUpdate = true;
  }

  /**
   * Set proper UV coordinates for floor/ceiling
   */
  private setFloorUVs(
    geometry: THREE.BufferGeometry,
    width: number,
    depth: number,
    tileSize: number
  ): void {
    const uvAttribute = geometry.attributes.uv;
    const uScale = width / tileSize;
    const vScale = depth / tileSize;

    for (let i = 0; i < uvAttribute.count; i++) {
      const u = uvAttribute.getX(i) * uScale;
      const v = uvAttribute.getY(i) * vScale;
      uvAttribute.setXY(i, u, v);
    }

    uvAttribute.needsUpdate = true;
  }

  /**
   * Convert backend BSP room to 3D room data
   */
  static convertBackendRoom(
    backendRoom: BackendDungeonRoom,
    options: Partial<GeneratorOptions> = {}
  ): DungeonRoom3D {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const { tileSize, wallHeight, gridSize } = opts;

    const width = backendRoom.width * tileSize;
    const depth = backendRoom.height * tileSize;
    const height = wallHeight;

    // Create tile grid
    const tiles: TileType[][] = Array(gridSize)
      .fill(null)
      .map(() => Array(gridSize).fill(TileType.FLOOR));

    // Create wall configurations
    const walls: WallConfig[] = [];
    const doors: DoorConfig[] = [];

    // North wall
    walls.push({
      position: new THREE.Vector3(0, height / 2, -depth / 2),
      rotation: new THREE.Euler(0, 0, 0),
      width,
      height,
      hasDoor: backendRoom.exits?.north,
      doorPosition: backendRoom.exits?.north ? new THREE.Vector3(0, 0, 0) : undefined,
      doorWidth: opts.doorWidth,
      doorHeight: opts.doorHeight,
    });

    // South wall
    walls.push({
      position: new THREE.Vector3(0, height / 2, depth / 2),
      rotation: new THREE.Euler(0, Math.PI, 0),
      width,
      height,
      hasDoor: backendRoom.exits?.south,
      doorPosition: backendRoom.exits?.south ? new THREE.Vector3(0, 0, 0) : undefined,
      doorWidth: opts.doorWidth,
      doorHeight: opts.doorHeight,
    });

    // East wall
    walls.push({
      position: new THREE.Vector3(width / 2, height / 2, 0),
      rotation: new THREE.Euler(0, Math.PI / 2, 0),
      width: depth,
      height,
      hasDoor: backendRoom.exits?.east,
      doorPosition: backendRoom.exits?.east ? new THREE.Vector3(0, 0, 0) : undefined,
      doorWidth: opts.doorWidth,
      doorHeight: opts.doorHeight,
    });

    // West wall
    walls.push({
      position: new THREE.Vector3(-width / 2, height / 2, 0),
      rotation: new THREE.Euler(0, -Math.PI / 2, 0),
      width: depth,
      height,
      hasDoor: backendRoom.exits?.west,
      doorPosition: backendRoom.exits?.west ? new THREE.Vector3(0, 0, 0) : undefined,
      doorWidth: opts.doorWidth,
      doorHeight: opts.doorHeight,
    });

    // Create door configurations
    if (backendRoom.exits?.north) {
      doors.push({
        id: `${backendRoom.id}-north`,
        position: new THREE.Vector3(0, opts.doorHeight / 2, -depth / 2),
        direction: Direction.NORTH,
        width: opts.doorWidth,
        height: opts.doorHeight,
        isOpen: false,
      });
    }

    if (backendRoom.exits?.south) {
      doors.push({
        id: `${backendRoom.id}-south`,
        position: new THREE.Vector3(0, opts.doorHeight / 2, depth / 2),
        direction: Direction.SOUTH,
        width: opts.doorWidth,
        height: opts.doorHeight,
        isOpen: false,
      });
    }

    if (backendRoom.exits?.east) {
      doors.push({
        id: `${backendRoom.id}-east`,
        position: new THREE.Vector3(width / 2, opts.doorHeight / 2, 0),
        direction: Direction.EAST,
        width: opts.doorWidth,
        height: opts.doorHeight,
        isOpen: false,
      });
    }

    if (backendRoom.exits?.west) {
      doors.push({
        id: `${backendRoom.id}-west`,
        position: new THREE.Vector3(-width / 2, opts.doorHeight / 2, 0),
        direction: Direction.WEST,
        width: opts.doorWidth,
        height: opts.doorHeight,
        isOpen: false,
      });
    }

    return {
      id: backendRoom.id,
      roomType: backendRoom.type as any || 'combat',
      position: new THREE.Vector3(backendRoom.x * tileSize, 0, backendRoom.y * tileSize),
      dimensions: { width, height, depth },
      gridSize,
      tiles,
      walls,
      floor: {
        position: new THREE.Vector3(0, 0, 0),
        width,
        depth,
        tileSize,
        uvScale: 1,
      },
      ceiling: {
        position: new THREE.Vector3(0, height, 0),
        width,
        depth,
        height,
        uvScale: 1,
      },
      doors,
      connections: {
        north: backendRoom.exits?.north ? 'unknown' : undefined,
        south: backendRoom.exits?.south ? 'unknown' : undefined,
        east: backendRoom.exits?.east ? 'unknown' : undefined,
        west: backendRoom.exits?.west ? 'unknown' : undefined,
      },
      explored: false,
    };
  }
}
