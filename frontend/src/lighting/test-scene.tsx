/**
 * Lighting System Test Scene
 * Agent Arena 3D Roguelike - P2.6
 * 
 * This test scene demonstrates:
 * 1. Torch lights with realistic flickering
 * 2. Shadow casting with multiple lights
 * 3. Room lighting presets
 * 4. Light animations
 * 5. Performance with 20+ lights using pooling
 */

import React, { useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import {
  useLightPool,
  useRoomLighting,
  useTorches,
  useLightAnimation,
  useShadowQuality,
  RoomType,
  ShadowQuality,
  AnimationType,
  WallTorchPlacer,
} from './index';

/**
 * Test scene floor
 */
function Floor() {
  return (
    <mesh receiveShadow position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[30, 30]} />
      <meshStandardMaterial color="#444444" />
    </mesh>
  );
}

/**
 * Test boxes that cast shadows
 */
function TestBoxes() {
  return (
    <>
      <mesh castShadow receiveShadow position={[-3, 1, 0]}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#ff6666" />
      </mesh>
      
      <mesh castShadow receiveShadow position={[3, 1, 0]}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#6666ff" />
      </mesh>
      
      <mesh castShadow receiveShadow position={[0, 1, 3]}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#66ff66" />
      </mesh>
    </>
  );
}

/**
 * Room with lighting
 */
function LitRoom({ roomType }: { roomType: RoomType }) {
  const sceneRef = useRef<THREE.Scene | null>(null);

  // Initialize light pool
  const lightPool = useLightPool(sceneRef.current, {
    pointLightCount: 40,
    spotLightCount: 10,
    shadowQuality: ShadowQuality.MEDIUM,
  });

  // Set up room lighting
  const roomManager = useRoomLighting(
    sceneRef.current,
    lightPool,
    roomType,
    { width: 20, depth: 20 }
  );

  // Get pool stats for monitoring
  useEffect(() => {
    if (lightPool) {
      const stats = lightPool.getStats();
      console.log('Light Pool Stats:', stats);
      console.log(`Active: ${stats.activeLights}/${stats.totalLights}`);
    }
  }, [lightPool]);

  return null;
}

/**
 * Test torches in a circle
 */
function TorchCircle() {
  const sceneRef = useRef<THREE.Scene | null>(null);
  
  // Create torch positions in a circle
  const torchPositions = React.useMemo(() => {
    const positions: THREE.Vector3[] = [];
    const radius = 8;
    const count = 12;
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      positions.push(new THREE.Vector3(x, 2.5, z));
    }
    
    return positions;
  }, []);

  useTorches(sceneRef.current, torchPositions, {
    intensity: 2.0,
    flickerSpeed: 1.0,
    flickerIntensity: 0.3,
    warmth: 0.7,
    castShadow: true,
  });

  return null;
}

/**
 * Animated magic light
 */
function MagicLight() {
  const sceneRef = useRef<THREE.Scene | null>(null);
  const lightRef = useRef<THREE.PointLight | null>(null);

  useEffect(() => {
    if (sceneRef.current) {
      const light = new THREE.PointLight(0x8844ff, 2.0, 12);
      light.position.set(0, 3, 0);
      light.castShadow = true;
      sceneRef.current.add(light);
      lightRef.current = light;

      return () => {
        sceneRef.current?.remove(light);
      };
    }
  }, []);

  useLightAnimation(lightRef.current, AnimationType.PULSE, {
    speed: 0.8,
    minIntensity: 0.6,
    maxIntensity: 1.4,
  });

  return null;
}

/**
 * Main test scene component
 */
export function LightingTestScene() {
  const [roomType, setRoomType] = useState<RoomType>(RoomType.ENTRANCE);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Configure shadow quality
  useShadowQuality(rendererRef.current, ShadowQuality.MEDIUM);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      {/* Room type selector */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 1000,
        background: 'rgba(0,0,0,0.7)',
        padding: '20px',
        borderRadius: '8px',
        color: 'white',
      }}>
        <h3>Lighting Test Scene</h3>
        <div>
          <label>Room Type: </label>
          <select
            value={roomType}
            onChange={(e) => setRoomType(e.target.value as RoomType)}
            style={{ marginLeft: '10px', padding: '5px' }}
          >
            <option value={RoomType.ENTRANCE}>Entrance</option>
            <option value={RoomType.TREASURE}>Treasure</option>
            <option value={RoomType.COMBAT}>Combat</option>
            <option value={RoomType.BOSS}>Boss</option>
            <option value={RoomType.EXIT}>Exit</option>
            <option value={RoomType.CORRIDOR}>Corridor</option>
          </select>
        </div>
        <div style={{ marginTop: '10px', fontSize: '12px' }}>
          <p>Features:</p>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li>✓ Torch flickering animation</li>
            <li>✓ Shadow casting (PCF soft)</li>
            <li>✓ Light pooling (40 point, 10 spot)</li>
            <li>✓ Room lighting presets</li>
            <li>✓ Animated magic light</li>
          </ul>
        </div>
      </div>

      <Canvas
        shadows
        camera={{ position: [10, 10, 10], fov: 60 }}
        onCreated={({ gl }) => {
          rendererRef.current = gl;
        }}
      >
        {/* Lighting systems */}
        <LitRoom roomType={roomType} />
        <TorchCircle />
        <MagicLight />

        {/* Scene content */}
        <Floor />
        <TestBoxes />

        {/* Camera controls */}
        <OrbitControls />
      </Canvas>
    </div>
  );
}

export default LightingTestScene;
