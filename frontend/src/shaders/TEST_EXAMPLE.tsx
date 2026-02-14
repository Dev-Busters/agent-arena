/**
 * Test example for Agent Arena shaders
 * Demonstrates all major features: PBR materials, rarity glows, and status effects
 */

import React, { useEffect } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import {
  Rarity,
  MaterialType,
  StatusEffect,
  useItemMaterial,
  usePBRMaterial,
  useStatusEffect,
  Materials,
} from './index';

/**
 * Test Scene Component
 */
export function ShaderTestScene() {
  return (
    <Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <directionalLight position={[-5, 5, 5]} intensity={0.5} />

      {/* Test different rarity items */}
      <LegendarySword position={[-4, 1, 0]} />
      <MythicGem position={[-2, 1, 0]} />
      <DivineCrystal position={[0, 1, 0]} />
      
      {/* Test PBR materials */}
      <StoneFloor />
      <LeatherBoots position={[2, 0.5, 0]} />
      
      {/* Test status effects */}
      <EnemyWithEffects position={[4, 1, 0]} />

      <OrbitControls />
    </Canvas>
  );
}

/**
 * Legendary Sword with glow
 */
function LegendarySword({ position }: { position: [number, number, number] }) {
  const swordGeometry = new THREE.BoxGeometry(0.2, 2, 0.1);
  
  const { baseMaterial, glowMaterial } = useItemMaterial(
    Rarity.Legendary,
    {
      type: MaterialType.Metal,
      color: '#c0c0c0',
      roughness: 0.2,
      metalness: 0.95,
    }
  );

  return (
    <group position={position}>
      <mesh geometry={swordGeometry} material={baseMaterial} />
      <mesh 
        geometry={swordGeometry} 
        material={glowMaterial}
        scale={1.03}
      />
    </group>
  );
}

/**
 * Mythic Gem with intense glow
 */
function MythicGem({ position }: { position: [number, number, number] }) {
  const gemGeometry = new THREE.OctahedronGeometry(0.5);
  
  const { baseMaterial, glowMaterial } = useItemMaterial(
    Rarity.Mythic,
    {
      type: MaterialType.Crystal,
      color: '#ff0080',
      roughness: 0.1,
    },
    {
      intensity: 0.9,
      speed: 2.0,
    }
  );

  return (
    <group position={position}>
      <mesh geometry={gemGeometry} material={baseMaterial} />
      <mesh 
        geometry={gemGeometry} 
        material={glowMaterial}
        scale={1.05}
      />
    </group>
  );
}

/**
 * Divine Crystal with maximum glow
 */
function DivineCrystal({ position }: { position: [number, number, number] }) {
  const crystalGeometry = new THREE.ConeGeometry(0.4, 1.2, 6);
  
  const { baseMaterial, glowMaterial } = useItemMaterial(
    Rarity.Divine,
    {
      type: MaterialType.Crystal,
      color: '#ffd700',
      roughness: 0.05,
      metalness: 0.1,
    },
    {
      intensity: 1.0,
      speed: 2.5,
      pulseRange: [0.8, 1.0],
    }
  );

  return (
    <group position={position}>
      <mesh geometry={crystalGeometry} material={baseMaterial} rotation={[0, 0, Math.PI]} />
      <mesh 
        geometry={crystalGeometry} 
        material={glowMaterial}
        scale={1.06}
        rotation={[0, 0, Math.PI]}
      />
    </group>
  );
}

/**
 * Stone floor with procedural normal map
 */
function StoneFloor() {
  const floorGeometry = new THREE.PlaneGeometry(20, 20);
  
  const material = usePBRMaterial({
    type: MaterialType.Stone,
    color: '#666666',
    proceduralNormal: true,
    normalDetail: 2.5,
  });

  return (
    <mesh 
      geometry={floorGeometry} 
      material={material}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.5, 0]}
    />
  );
}

/**
 * Leather boots
 */
function LeatherBoots({ position }: { position: [number, number, number] }) {
  const bootGeometry = new THREE.BoxGeometry(0.4, 0.6, 0.8);
  const material = Materials.leather('#8b4513');

  return (
    <mesh 
      geometry={bootGeometry} 
      material={material}
      position={position}
    />
  );
}

/**
 * Enemy with multiple status effects
 */
function EnemyWithEffects({ position }: { position: [number, number, number] }) {
  const enemyGeometry = new THREE.SphereGeometry(0.5, 32, 32);
  const enemyMaterial = Materials.cloth('#333333');
  
  const { effectMeshes, addEffect, removeEffect } = useStatusEffect(
    'test-enemy-1',
    enemyGeometry
  );

  useEffect(() => {
    // Apply frozen effect
    addEffect(StatusEffect.Frozen, 0.8);
    
    // Add burning after 1 second
    const timer1 = setTimeout(() => {
      addEffect(StatusEffect.Burning, 0.7);
    }, 1000);

    // Add poisoned after 2 seconds
    const timer2 = setTimeout(() => {
      addEffect(StatusEffect.Poisoned, 0.6);
    }, 2000);

    // Remove frozen after 4 seconds
    const timer3 = setTimeout(() => {
      removeEffect(StatusEffect.Frozen);
    }, 4000);

    // Add blessed after 5 seconds
    const timer4 = setTimeout(() => {
      addEffect(StatusEffect.Blessed, 0.9);
    }, 5000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  return (
    <group position={position}>
      <mesh geometry={enemyGeometry} material={enemyMaterial} />
      {effectMeshes.map((mesh, i) => (
        <primitive key={i} object={mesh} />
      ))}
    </group>
  );
}

/**
 * Performance stats display
 */
function PerformanceStats() {
  const stats = useShaderPerformance();
  
  return (
    <div style={{
      position: 'absolute',
      top: 10,
      left: 10,
      color: 'white',
      fontFamily: 'monospace',
      background: 'rgba(0,0,0,0.7)',
      padding: '10px',
      borderRadius: '4px',
    }}>
      <div>Active Status Effects: {stats.statusEffectCount}</div>
      <div>Glow Materials: {stats.glowMaterialCount}</div>
    </div>
  );
}

// Export for testing
export default ShaderTestScene;
