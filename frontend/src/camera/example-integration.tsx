/**
 * Example Integration - Camera & View System
 * Agent Arena 3D Roguelike - Phase 2.7
 * 
 * This file demonstrates how to integrate the camera system into your game.
 * Copy and adapt this code to your main game component.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrthographicCamera, Vector3 } from 'three';
import { useCameraSystem, CameraMode } from './index';

/**
 * Game Scene Component
 */
function GameScene() {
  const { camera } = useThree();
  const playerRef = useRef(new Vector3(0, 0, 0));
  const [playerVelocity] = useState(new Vector3());
  
  // Initialize camera system
  const cameraSystem = useCameraSystem(
    camera as OrthographicCamera,
    // Camera config
    {
      position: new Vector3(10, 15, 10),
      target: new Vector3(0, 0, 0),
      zoom: 1,
      minZoom: 0.5,
      maxZoom: 2.5,
      zoomSpeed: 0.1,
      mode: CameraMode.FOLLOW,
      enableDamping: true,
      dampingFactor: 0.12,
      bounds: {
        minX: -50,
        maxX: 50,
        minY: 5,
        maxY: 30,
        minZ: -50,
        maxZ: 50,
      },
    },
    // Follow config
    {
      offset: new Vector3(10, 15, 10),
      smoothness: 0.15,
      lookAhead: 3,
      speedBasedZoom: true,
      speedThreshold: 8,
      maxSpeedZoom: 1.3,
    },
    // Minimap config
    {
      width: 220,
      height: 220,
      position: { top: 20, right: 20 },
      zoom: 1.2,
      opacity: 0.85,
      backgroundColor: '#1a1a1a',
      borderColor: '#00ff41',
      borderWidth: 2,
      showFogOfWar: true,
      showEnemies: true,
      showItems: true,
      playerColor: '#00ff41',
      enemyColor: '#ff0066',
      itemColor: '#ffd700',
      exploredColor: '#2a2a2a',
      unexploredColor: '#0a0a0a',
    }
  );

  // Set follow target
  useEffect(() => {
    cameraSystem.setFollowTarget(playerRef.current);
  }, [cameraSystem]);

  // Setup minimap rooms (example dungeon layout)
  useEffect(() => {
    if (!cameraSystem.minimap) return;

    // Add starting room
    cameraSystem.minimap.addRoom({
      id: 'room_spawn',
      bounds: { minX: -10, maxX: 10, minZ: -10, maxZ: 10 },
      explored: true,
    });

    // Add adjacent rooms
    cameraSystem.minimap.addRoom({
      id: 'room_north',
      bounds: { minX: -8, maxX: 8, minZ: 10, maxZ: 25 },
      explored: false,
    });

    cameraSystem.minimap.addRoom({
      id: 'room_east',
      bounds: { minX: 10, maxX: 25, minZ: -8, maxZ: 8 },
      explored: false,
    });

    // Add some enemies
    cameraSystem.minimap.addEntity({
      id: 'enemy_1',
      position: { x: 15, z: 0 },
      type: 'enemy',
    });

    // Add treasure
    cameraSystem.minimap.addEntity({
      id: 'treasure_1',
      position: { x: 0, z: 20 },
      type: 'item',
    });
  }, [cameraSystem.minimap]);

  // Game loop
  useFrame((state, delta) => {
    // Simple player movement (WASD handled by camera in free mode)
    // In follow mode, move the player and camera follows
    const speed = 5;
    
    // Example: Move player in a circle (replace with real input)
    const time = state.clock.getElapsedTime();
    playerRef.current.x = Math.cos(time * 0.5) * 5;
    playerRef.current.z = Math.sin(time * 0.5) * 5;

    // Update player position on minimap
    if (cameraSystem.minimap) {
      cameraSystem.minimap.setPlayerPosition(
        playerRef.current.x,
        playerRef.current.z
      );
    }

    // Update camera system (IMPORTANT - call every frame!)
    cameraSystem.update(delta);
  });

  // Example: Trigger shake on space bar
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        // Impact shake
        cameraSystem.shake.impact(0.8, 300);
        console.log('💥 Camera shake!');
      }
      
      if (e.key === 'e') {
        // Directional shake
        const direction = new Vector3(1, 0, 0);
        cameraSystem.shake.directional(0.5, direction, 250);
        console.log('👊 Knockback shake!');
      }

      if (e.key === 'c') {
        // Toggle camera mode
        const currentMode = cameraSystem.controller?.getMode();
        const newMode = currentMode === CameraMode.FOLLOW 
          ? CameraMode.FREE 
          : CameraMode.FOLLOW;
        cameraSystem.controller?.setMode(newMode);
        console.log('📷 Camera mode:', newMode);
      }

      if (e.key === 't') {
        // Trigger cinematic transition
        const targetPos = new Vector3(0, 25, 0);
        const targetLookAt = new Vector3(0, 0, 0);
        
        cameraSystem.transition.start({
          targetPosition: targetPos,
          targetLookAt: targetLookAt,
          targetZoom: 0.8,
          duration: 2000,
          easing: 'easeInOutCubic',
          onComplete: () => {
            console.log('🎬 Transition complete!');
            cameraSystem.controller?.setMode(CameraMode.FOLLOW);
          },
        });
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [cameraSystem]);

  return (
    <>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>

      {/* Player representation */}
      <mesh position={playerRef.current}>
        <boxGeometry args={[1, 2, 1]} />
        <meshStandardMaterial color="#00ff41" />
      </mesh>

      {/* Lights */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />

      {/* Example enemies */}
      <mesh position={[15, 1, 0]}>
        <boxGeometry args={[1, 2, 1]} />
        <meshStandardMaterial color="#ff0066" />
      </mesh>

      {/* Example treasure */}
      <mesh position={[0, 0.5, 20]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#ffd700" />
      </mesh>
    </>
  );
}

/**
 * Main App Component
 */
export default function CameraExample() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas>
        <GameScene />
      </Canvas>
      
      {/* Instructions overlay */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        background: 'rgba(0, 0, 0, 0.7)',
        color: '#00ff41',
        padding: '15px',
        borderRadius: '5px',
        fontFamily: 'monospace',
        fontSize: '14px',
        pointerEvents: 'none',
      }}>
        <div><strong>🎮 Camera System Demo</strong></div>
        <div>━━━━━━━━━━━━━━━━━━━━</div>
        <div><kbd>SPACE</kbd> - Impact shake</div>
        <div><kbd>E</kbd> - Directional shake</div>
        <div><kbd>C</kbd> - Toggle camera mode</div>
        <div><kbd>T</kbd> - Cinematic transition</div>
        <div><kbd>SCROLL</kbd> - Zoom in/out</div>
        <div><kbd>WASD</kbd> - Pan (free mode)</div>
        <div><kbd>RIGHT CLICK</kbd> - Pan drag</div>
      </div>
    </div>
  );
}
