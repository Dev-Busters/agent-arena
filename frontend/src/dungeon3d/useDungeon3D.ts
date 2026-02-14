/**
 * useDungeon3D.ts - React Hooks for Dungeon Integration
 * 
 * Provides React hooks for managing 3D dungeon rendering,
 * fog of war, and automatic resource cleanup.
 */

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import {
  Dungeon3D,
  DungeonRoom3D,
  DungeonMeshes,
  BackendDungeonData,
  BackendDungeonRoom,
  GeneratorOptions,
  FogOfWarState,
} from './types';
import { DungeonGenerator } from './generator';
import { MaterialLibrary, getMaterialLibrary } from './materials';
import { FogOfWar } from './fogOfWar';
import { DungeonLighting } from './lighting';

/**
 * Hook for managing complete dungeon 3D state
 */
export function useDungeon3D(
  scene: THREE.Scene | null,
  dungeonData: BackendDungeonData | null,
  options?: Partial<GeneratorOptions>
) {
  const [dungeon, setDungeon] = useState<Dungeon3D | null>(null);
  const [currentRoom, setCurrentRoom] = useState<DungeonRoom3D | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const generatorRef = useRef<DungeonGenerator | null>(null);
  const materialsRef = useRef<MaterialLibrary | null>(null);
  const fogOfWarRef = useRef<FogOfWar | null>(null);
  const lightingRef = useRef<DungeonLighting | null>(null);

  // Initialize generator and materials
  useEffect(() => {
    if (!scene) return;

    materialsRef.current = getMaterialLibrary();
    generatorRef.current = new DungeonGenerator(materialsRef.current, options);
    fogOfWarRef.current = new FogOfWar(scene, options?.gridSize || 10);
    lightingRef.current = new DungeonLighting(scene, true);

    return () => {
      fogOfWarRef.current?.dispose();
      lightingRef.current?.dispose();
    };
  }, [scene, options]);

  // Convert backend dungeon to 3D dungeon
  useEffect(() => {
    if (!dungeonData || !generatorRef.current || !scene) {
      setDungeon(null);
      return;
    }

    setIsLoading(true);

    try {
      // Convert backend rooms to 3D rooms
      const rooms = new Map<string, DungeonRoom3D>();
      const meshCache = new Map<string, DungeonMeshes>();
      const fogOfWar = new Map<string, FogOfWarState>();

      dungeonData.rooms.forEach(backendRoom => {
        const room3D = DungeonGenerator.convertBackendRoom(backendRoom, options);
        rooms.set(room3D.id, room3D);

        // Generate meshes
        if (generatorRef.current) {
          const meshes = generatorRef.current.generateRoom(room3D);
          meshCache.set(room3D.id, meshes);
          scene.add(meshes.group);

          // Create lighting
          if (lightingRef.current) {
            lightingRef.current.createRoomLighting(room3D);
          }
        }
      });

      const dungeon3D: Dungeon3D = {
        id: dungeonData.id,
        rooms,
        currentRoomId: dungeonData.startRoomId,
        meshCache,
        fogOfWar,
      };

      setDungeon(dungeon3D);
      
      // Set initial room
      const startRoom = rooms.get(dungeonData.startRoomId);
      if (startRoom) {
        setCurrentRoom(startRoom);
        if (fogOfWarRef.current) {
          fogOfWarRef.current.switchRoom(startRoom.id, startRoom);
        }
      }
    } catch (error) {
      console.error('Failed to create 3D dungeon:', error);
    } finally {
      setIsLoading(false);
    }

    // Cleanup on unmount
    return () => {
      if (dungeon && scene) {
        dungeon.meshCache.forEach(meshes => {
          scene.remove(meshes.group);
          meshes.walls.forEach(wall => wall.geometry.dispose());
          meshes.floor.geometry.dispose();
          meshes.ceiling.geometry.dispose();
          meshes.doors.forEach(door => door.geometry.dispose());
          meshes.traps?.forEach(trap => trap.geometry.dispose());
        });
      }
    };
  }, [dungeonData, scene, options]);

  // Switch to different room
  const switchToRoom = useCallback((roomId: string) => {
    if (!dungeon || !fogOfWarRef.current) return;

    const room = dungeon.rooms.get(roomId);
    if (!room) return;

    setCurrentRoom(room);
    fogOfWarRef.current.switchRoom(roomId, room);
    dungeon.currentRoomId = roomId;
  }, [dungeon]);

  // Update player position for fog of war
  const updatePlayerPosition = useCallback((position: THREE.Vector3) => {
    if (!fogOfWarRef.current || !currentRoom) return;
    fogOfWarRef.current.updatePlayerPosition(position, currentRoom.id);
  }, [currentRoom]);

  // Animate torch lights
  const update = useCallback((deltaTime: number) => {
    if (lightingRef.current) {
      lightingRef.current.animateTorches(deltaTime);
    }
  }, []);

  return {
    dungeon,
    currentRoom,
    isLoading,
    switchToRoom,
    updatePlayerPosition,
    update,
    fogOfWar: fogOfWarRef.current,
    lighting: lightingRef.current,
  };
}

/**
 * Hook for generating mesh for a specific room
 */
export function useRoomMesh(
  scene: THREE.Scene | null,
  room: DungeonRoom3D | null,
  options?: Partial<GeneratorOptions>
) {
  const [meshes, setMeshes] = useState<DungeonMeshes | null>(null);
  const generatorRef = useRef<DungeonGenerator | null>(null);

  useEffect(() => {
    if (!scene) return;

    const materials = getMaterialLibrary();
    generatorRef.current = new DungeonGenerator(materials, options);
  }, [scene, options]);

  useEffect(() => {
    if (!room || !generatorRef.current || !scene) {
      setMeshes(null);
      return;
    }

    const roomMeshes = generatorRef.current.generateRoom(room);
    scene.add(roomMeshes.group);
    setMeshes(roomMeshes);

    return () => {
      scene.remove(roomMeshes.group);
      roomMeshes.walls.forEach(wall => wall.geometry.dispose());
      roomMeshes.floor.geometry.dispose();
      roomMeshes.ceiling.geometry.dispose();
      roomMeshes.doors.forEach(door => door.geometry.dispose());
      roomMeshes.traps?.forEach(trap => trap.geometry.dispose());
    };
  }, [room, scene]);

  return meshes;
}

/**
 * Hook for managing fog of war
 */
export function useFogOfWar(
  scene: THREE.Scene | null,
  gridSize: number = 10,
  visibilityRadius: number = 8
) {
  const fogOfWarRef = useRef<FogOfWar | null>(null);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (!scene) return;

    fogOfWarRef.current = new FogOfWar(scene, gridSize, visibilityRadius);

    return () => {
      fogOfWarRef.current?.dispose();
    };
  }, [scene, gridSize, visibilityRadius]);

  const updatePlayerPosition = useCallback((position: THREE.Vector3, roomId: string) => {
    if (fogOfWarRef.current) {
      fogOfWarRef.current.updatePlayerPosition(position, roomId);
    }
  }, []);

  const switchRoom = useCallback((roomId: string, room: DungeonRoom3D) => {
    if (fogOfWarRef.current) {
      fogOfWarRef.current.switchRoom(roomId, room);
    }
  }, []);

  const revealRoom = useCallback((roomId: string) => {
    if (fogOfWarRef.current) {
      fogOfWarRef.current.revealRoom(roomId);
    }
  }, []);

  const resetRoom = useCallback((roomId: string) => {
    if (fogOfWarRef.current) {
      fogOfWarRef.current.resetRoom(roomId);
    }
  }, []);

  const setFogEnabled = useCallback((isEnabled: boolean) => {
    setEnabled(isEnabled);
    if (fogOfWarRef.current) {
      fogOfWarRef.current.setEnabled(isEnabled);
    }
  }, []);

  const getExplorationPercentage = useCallback((roomId: string): number => {
    if (!fogOfWarRef.current) return 0;
    return fogOfWarRef.current.getExplorationPercentage(roomId);
  }, []);

  return {
    fogOfWar: fogOfWarRef.current,
    enabled,
    setEnabled: setFogEnabled,
    updatePlayerPosition,
    switchRoom,
    revealRoom,
    resetRoom,
    getExplorationPercentage,
  };
}

/**
 * Hook for converting backend room to 3D room
 */
export function useBackendRoomConverter(
  backendRoom: BackendDungeonRoom | null,
  options?: Partial<GeneratorOptions>
) {
  return useMemo(() => {
    if (!backendRoom) return null;
    return DungeonGenerator.convertBackendRoom(backendRoom, options);
  }, [backendRoom, options]);
}

/**
 * Hook for dungeon lighting management
 */
export function useDungeonLighting(
  scene: THREE.Scene | null,
  enableShadows: boolean = true
) {
  const lightingRef = useRef<DungeonLighting | null>(null);
  const [shadowsEnabled, setShadowsEnabled] = useState(enableShadows);

  useEffect(() => {
    if (!scene) return;

    lightingRef.current = new DungeonLighting(scene, enableShadows);

    return () => {
      lightingRef.current?.dispose();
    };
  }, [scene, enableShadows]);

  const createRoomLighting = useCallback((room: DungeonRoom3D) => {
    if (!lightingRef.current) return [];
    return lightingRef.current.createRoomLighting(room);
  }, []);

  const removeRoomLighting = useCallback((roomId: string) => {
    if (lightingRef.current) {
      lightingRef.current.removeRoomLighting(roomId);
    }
  }, []);

  const toggleShadows = useCallback(() => {
    const newValue = !shadowsEnabled;
    setShadowsEnabled(newValue);
    if (lightingRef.current) {
      lightingRef.current.setShadowsEnabled(newValue);
    }
  }, [shadowsEnabled]);

  const animateTorches = useCallback((deltaTime: number) => {
    if (lightingRef.current) {
      lightingRef.current.animateTorches(deltaTime);
    }
  }, []);

  return {
    lighting: lightingRef.current,
    shadowsEnabled,
    toggleShadows,
    createRoomLighting,
    removeRoomLighting,
    animateTorches,
  };
}
