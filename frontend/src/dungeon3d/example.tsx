/**
 * example.tsx - Complete Usage Example
 * 
 * Demonstrates how to integrate the dungeon 3D system into a React component.
 */

import React, { useEffect, useState, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';
import { useDungeon3D } from './useDungeon3D';
import { BackendDungeonData } from './types';

/**
 * Example backend dungeon data
 */
const EXAMPLE_DUNGEON: BackendDungeonData = {
  id: 'dungeon-1',
  seed: 12345,
  startRoomId: 'room-entrance',
  rooms: [
    {
      id: 'room-entrance',
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      type: 'entrance',
      exits: { south: true, east: true },
      connectedRooms: ['room-combat-1', 'room-corridor-1'],
    },
    {
      id: 'room-combat-1',
      x: 0,
      y: 10,
      width: 12,
      height: 12,
      type: 'combat',
      exits: { north: true, east: true },
      connectedRooms: ['room-entrance', 'room-treasure'],
    },
    {
      id: 'room-corridor-1',
      x: 10,
      y: 0,
      width: 6,
      height: 8,
      type: 'corridor',
      exits: { west: true, south: true },
      connectedRooms: ['room-entrance', 'room-treasure'],
    },
    {
      id: 'room-treasure',
      x: 10,
      y: 10,
      width: 10,
      height: 10,
      type: 'treasure',
      exits: { north: true, west: true, south: true },
      connectedRooms: ['room-corridor-1', 'room-combat-1', 'room-boss'],
    },
    {
      id: 'room-boss',
      x: 10,
      y: 20,
      width: 15,
      height: 15,
      type: 'boss',
      exits: { north: true },
      connectedRooms: ['room-treasure'],
    },
  ],
};

/**
 * Main dungeon scene component
 */
function DungeonScene() {
  const { scene } = useThree();
  const [dungeonData] = useState<BackendDungeonData>(EXAMPLE_DUNGEON);
  const [playerPosition, setPlayerPosition] = useState(new THREE.Vector3(0, 1, 0));

  const {
    dungeon,
    currentRoom,
    isLoading,
    switchToRoom,
    updatePlayerPosition,
    update,
    fogOfWar,
    lighting,
  } = useDungeon3D(scene, dungeonData, {
    tileSize: 2,
    wallHeight: 4,
    gridSize: 10,
    optimizeMeshes: true,
  });

  // Update every frame
  useFrame((state, delta) => {
    if (dungeon && currentRoom) {
      updatePlayerPosition(playerPosition);
      update(delta);
    }
  });

  // Keyboard controls for player movement
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const speed = 0.5;
      const newPos = playerPosition.clone();

      switch (e.key) {
        case 'w':
        case 'ArrowUp':
          newPos.z -= speed;
          break;
        case 's':
        case 'ArrowDown':
          newPos.z += speed;
          break;
        case 'a':
        case 'ArrowLeft':
          newPos.x -= speed;
          break;
        case 'd':
        case 'ArrowRight':
          newPos.x += speed;
          break;
      }

      setPlayerPosition(newPos);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerPosition]);

  // Player representation
  return (
    <>
      {/* Player mesh */}
      <mesh position={playerPosition}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color="#00ff00" />
      </mesh>

      {/* Loading indicator */}
      {isLoading && (
        <mesh position={[0, 2, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#ffff00" />
        </mesh>
      )}
    </>
  );
}

/**
 * Main app component with UI controls
 */
export default function DungeonExample() {
  const [showControls, setShowControls] = useState(true);
  const [shadowsEnabled, setShadowsEnabled] = useState(true);
  const [fogEnabled, setFogEnabled] = useState(true);

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {/* 3D Canvas */}
      <Canvas
        shadows={shadowsEnabled}
        camera={{ position: [15, 15, 15], fov: 60 }}
        gl={{ antialias: true }}
      >
        {/* Basic scene setup */}
        <color attach="background" args={['#000000']} />
        <fog attach="fog" args={['#000000', 10, 50]} />

        {/* Controls */}
        <OrbitControls makeDefault />

        {/* Dungeon scene */}
        <DungeonScene />
      </Canvas>

      {/* UI Controls */}
      {showControls && (
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '20px',
            borderRadius: '8px',
            fontFamily: 'monospace',
          }}
        >
          <h3 style={{ margin: '0 0 15px 0' }}>Dungeon Controls</h3>
          
          <div style={{ marginBottom: '10px' }}>
            <strong>Movement:</strong>
            <div>WASD or Arrow Keys</div>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <strong>Camera:</strong>
            <div>Mouse to orbit</div>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label>
              <input
                type="checkbox"
                checked={shadowsEnabled}
                onChange={(e) => setShadowsEnabled(e.target.checked)}
              />
              {' '}Shadows
            </label>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label>
              <input
                type="checkbox"
                checked={fogEnabled}
                onChange={(e) => setFogEnabled(e.target.checked)}
              />
              {' '}Fog of War
            </label>
          </div>

          <button
            onClick={() => setShowControls(false)}
            style={{
              marginTop: '10px',
              padding: '5px 10px',
              background: '#333',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Hide Controls
          </button>
        </div>
      )}

      {/* Show controls button when hidden */}
      {!showControls && (
        <button
          onClick={() => setShowControls(true)}
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            padding: '10px 15px',
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: 'monospace',
          }}
        >
          Show Controls
        </button>
      )}
    </div>
  );
}
