/**
 * __tests__/dungeon3d.test.ts - Dungeon 3D System Tests
 * 
 * Tests for dungeon generation, fog of war, and lighting.
 */

import * as THREE from 'three';
import { DungeonGenerator } from '../generator';
import { MaterialLibrary } from '../materials';
import { FogOfWar } from '../fogOfWar';
import { DungeonLighting } from '../lighting';
import { BackendDungeonRoom, RoomType } from '../types';

describe('Dungeon 3D System', () => {
  let scene: THREE.Scene;
  let materialLibrary: MaterialLibrary;
  let generator: DungeonGenerator;

  beforeEach(() => {
    scene = new THREE.Scene();
    materialLibrary = new MaterialLibrary();
    generator = new DungeonGenerator(materialLibrary);
  });

  afterEach(() => {
    scene.clear();
    materialLibrary.dispose();
  });

  describe('DungeonGenerator', () => {
    it('should convert backend room to 3D room', () => {
      const backendRoom: BackendDungeonRoom = {
        id: 'room-1',
        x: 0,
        y: 0,
        width: 10,
        height: 10,
        type: 'combat',
        exits: {
          north: true,
          south: false,
          east: true,
          west: false,
        },
      };

      const room3D = DungeonGenerator.convertBackendRoom(backendRoom);

      expect(room3D.id).toBe('room-1');
      expect(room3D.dimensions.width).toBe(20); // 10 tiles * 2 units
      expect(room3D.dimensions.depth).toBe(20);
      expect(room3D.walls.length).toBe(4);
      expect(room3D.doors.length).toBe(2); // North and East exits
    });

    it('should generate room meshes correctly', () => {
      const backendRoom: BackendDungeonRoom = {
        id: 'room-2',
        x: 5,
        y: 5,
        width: 8,
        height: 8,
        exits: { north: true },
      };

      const room3D = DungeonGenerator.convertBackendRoom(backendRoom);
      const meshes = generator.generateRoom(room3D);

      expect(meshes.walls.length).toBeGreaterThan(0);
      expect(meshes.floor).toBeDefined();
      expect(meshes.ceiling).toBeDefined();
      expect(meshes.doors.length).toBe(1);
      expect(meshes.group).toBeInstanceOf(THREE.Group);
    });

    it('should create walls with door cutouts', () => {
      const backendRoom: BackendDungeonRoom = {
        id: 'room-3',
        x: 0,
        y: 0,
        width: 10,
        height: 10,
        exits: { north: true, south: true, east: true, west: true },
      };

      const room3D = DungeonGenerator.convertBackendRoom(backendRoom);
      const meshes = generator.generateRoom(room3D);

      // Should have walls (possibly merged)
      expect(meshes.walls.length).toBeGreaterThan(0);
      
      // Should have 4 doors
      expect(meshes.doors.length).toBe(4);
    });

    it('should optimize meshes when enabled', () => {
      const generatorOptimized = new DungeonGenerator(materialLibrary, {
        optimizeMeshes: true,
      });

      const backendRoom: BackendDungeonRoom = {
        id: 'room-4',
        x: 0,
        y: 0,
        width: 10,
        height: 10,
      };

      const room3D = DungeonGenerator.convertBackendRoom(backendRoom);
      const meshes = generatorOptimized.generateRoom(room3D);

      // With optimization, walls should be merged into fewer meshes
      // Without doors, should be 1 merged mesh
      expect(meshes.walls.length).toBeLessThanOrEqual(4);
    });
  });

  describe('MaterialLibrary', () => {
    it('should provide all required materials', () => {
      expect(materialLibrary.getWallMaterial()).toBeDefined();
      expect(materialLibrary.getFloorMaterial()).toBeDefined();
      expect(materialLibrary.getCeilingMaterial()).toBeDefined();
      expect(materialLibrary.getDoorMaterial()).toBeDefined();
      expect(materialLibrary.getTrapMaterial()).toBeDefined();
    });

    it('should create custom materials', () => {
      const customMat = materialLibrary.createCustomMaterial({
        name: 'custom-wall',
        type: 'wall',
        baseColor: '#ff0000',
        roughness: 0.5,
        metalness: 0.2,
      });

      expect(customMat).toBeDefined();
      expect(customMat.name).toBe('custom-wall');
      expect(materialLibrary.hasMaterial('custom-wall')).toBe(true);
    });

    it('should create material variants', () => {
      const variant = materialLibrary.createVariant('wall', 'wall-red', {
        baseColor: '#ff0000',
        roughness: 0.7,
      });

      expect(variant).toBeDefined();
      expect(materialLibrary.hasMaterial('wall-red')).toBe(true);
    });
  });

  describe('FogOfWar', () => {
    let fogOfWar: FogOfWar;

    beforeEach(() => {
      fogOfWar = new FogOfWar(scene, 10, 8);
    });

    afterEach(() => {
      fogOfWar.dispose();
    });

    it('should initialize with default values', () => {
      expect(fogOfWar).toBeDefined();
      // Fog mesh should be added to scene
      const fogMesh = scene.children.find(child => child.name === 'fog-of-war');
      expect(fogMesh).toBeDefined();
    });

    it('should update player position and reveal tiles', () => {
      const position = new THREE.Vector3(0, 0, 0);
      const roomId = 'room-1';

      fogOfWar.updatePlayerPosition(position, roomId);

      // Center tile should be explored
      expect(fogOfWar.isTileExplored(roomId, 5, 5)).toBe(true);
    });

    it('should reveal entire room', () => {
      const roomId = 'room-2';
      fogOfWar.revealRoom(roomId);

      const explorationPercent = fogOfWar.getExplorationPercentage(roomId);
      expect(explorationPercent).toBe(100);
    });

    it('should reset room exploration', () => {
      const roomId = 'room-3';
      
      // First reveal the room
      fogOfWar.revealRoom(roomId);
      expect(fogOfWar.getExplorationPercentage(roomId)).toBe(100);

      // Then reset it
      fogOfWar.resetRoom(roomId);
      expect(fogOfWar.getExplorationPercentage(roomId)).toBe(0);
    });

    it('should switch between rooms', () => {
      const backendRoom: BackendDungeonRoom = {
        id: 'room-switch',
        x: 0,
        y: 0,
        width: 10,
        height: 10,
      };

      const room3D = DungeonGenerator.convertBackendRoom(backendRoom);
      fogOfWar.switchRoom('room-switch', room3D);

      // Should create new state for the room
      expect(fogOfWar.getExplorationPercentage('room-switch')).toBe(0);
    });
  });

  describe('DungeonLighting', () => {
    let lighting: DungeonLighting;

    beforeEach(() => {
      lighting = new DungeonLighting(scene, true);
    });

    afterEach(() => {
      lighting.dispose();
    });

    it('should create room lighting', () => {
      const backendRoom: BackendDungeonRoom = {
        id: 'room-light',
        x: 0,
        y: 0,
        width: 10,
        height: 10,
      };

      const room3D = DungeonGenerator.convertBackendRoom(backendRoom);
      const lights = lighting.createRoomLighting(room3D);

      // Should have ambient + torches + ceiling light
      expect(lights.length).toBeGreaterThan(1);
    });

    it('should remove room lighting', () => {
      const backendRoom: BackendDungeonRoom = {
        id: 'room-remove',
        x: 0,
        y: 0,
        width: 10,
        height: 10,
      };

      const room3D = DungeonGenerator.convertBackendRoom(backendRoom);
      lighting.createRoomLighting(room3D);

      const lightsBeforeRemove = scene.children.filter(
        child => child instanceof THREE.Light
      ).length;

      lighting.removeRoomLighting('room-remove');

      const lightsAfterRemove = scene.children.filter(
        child => child instanceof THREE.Light
      ).length;

      expect(lightsAfterRemove).toBeLessThan(lightsBeforeRemove);
    });

    it('should toggle shadows', () => {
      const backendRoom: BackendDungeonRoom = {
        id: 'room-shadow',
        x: 0,
        y: 0,
        width: 10,
        height: 10,
      };

      const room3D = DungeonGenerator.convertBackendRoom(backendRoom);
      lighting.createRoomLighting(room3D);

      lighting.setShadowsEnabled(false);
      
      // All point lights should have shadows disabled
      scene.children.forEach(child => {
        if (child instanceof THREE.PointLight) {
          expect(child.castShadow).toBe(false);
        }
      });
    });
  });

  describe('Integration Tests', () => {
    it('should create complete room with all components', () => {
      const backendRoom: BackendDungeonRoom = {
        id: 'complete-room',
        x: 0,
        y: 0,
        width: 10,
        height: 10,
        type: 'combat',
        exits: { north: true, south: true },
      };

      // Convert to 3D
      const room3D = DungeonGenerator.convertBackendRoom(backendRoom);
      
      // Generate meshes
      const meshes = generator.generateRoom(room3D);
      scene.add(meshes.group);

      // Add lighting
      const lighting = new DungeonLighting(scene, true);
      const lights = lighting.createRoomLighting(room3D);

      // Add fog of war
      const fogOfWar = new FogOfWar(scene, 10, 8);
      fogOfWar.switchRoom(room3D.id, room3D);

      // Verify everything is in the scene
      expect(scene.children.length).toBeGreaterThan(0);
      expect(meshes.walls.length).toBeGreaterThan(0);
      expect(lights.length).toBeGreaterThan(0);

      // Cleanup
      scene.remove(meshes.group);
      lighting.dispose();
      fogOfWar.dispose();
    });

    it('should handle multiple rooms efficiently', () => {
      const rooms: BackendDungeonRoom[] = [
        { id: 'r1', x: 0, y: 0, width: 10, height: 10 },
        { id: 'r2', x: 10, y: 0, width: 10, height: 10 },
        { id: 'r3', x: 0, y: 10, width: 10, height: 10 },
      ];

      const lighting = new DungeonLighting(scene, true);
      const meshGroups: THREE.Group[] = [];

      rooms.forEach(backendRoom => {
        const room3D = DungeonGenerator.convertBackendRoom(backendRoom);
        const meshes = generator.generateRoom(room3D);
        scene.add(meshes.group);
        meshGroups.push(meshes.group);
        lighting.createRoomLighting(room3D);
      });

      // Should have all room meshes in scene
      expect(scene.children.length).toBeGreaterThan(rooms.length);

      // Cleanup
      meshGroups.forEach(group => scene.remove(group));
      lighting.dispose();
    });
  });

  describe('Performance Tests', () => {
    it('should generate room in reasonable time', () => {
      const backendRoom: BackendDungeonRoom = {
        id: 'perf-test',
        x: 0,
        y: 0,
        width: 10,
        height: 10,
        exits: { north: true, south: true, east: true, west: true },
      };

      const room3D = DungeonGenerator.convertBackendRoom(backendRoom);

      const startTime = performance.now();
      const meshes = generator.generateRoom(room3D);
      const endTime = performance.now();

      const generationTime = endTime - startTime;

      // Should generate in less than 100ms
      expect(generationTime).toBeLessThan(100);

      // Cleanup
      meshes.walls.forEach(wall => wall.geometry.dispose());
      meshes.floor.geometry.dispose();
      meshes.ceiling.geometry.dispose();
      meshes.doors.forEach(door => door.geometry.dispose());
    });
  });
});
