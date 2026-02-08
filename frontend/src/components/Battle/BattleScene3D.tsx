'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  setupBattleScene,
  createWeaponModel,
  createArmorModel,
  createParticleEmitter,
  animateCombatAction,
  createDamageNumber,
  VISUAL_EFFECTS
} from '@/lib/three-utils';

interface Enemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
}

interface BattleScene3DProps {
  enemies: Enemy[];
  playerGear?: {
    weapon?: { visualEffect?: string };
    armor?: { visualEffect?: string };
  };
  onAction?: (action: string) => void;
}

export default function BattleScene3D({ enemies, playerGear }: BattleScene3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<any>(null);
  const modelsRef = useRef<Map<string, THREE.Group>>(new Map());
  const particlesRef = useRef<THREE.Points[]>([]);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Setup scene
    const { scene, camera, renderer, cleanup } = setupBattleScene(canvasRef.current);
    sceneRef.current = { scene, camera, renderer };

    // Create player character
    const playerEffect = playerGear?.weapon?.visualEffect || playerGear?.armor?.visualEffect;
    const player = createArmorModel(playerEffect);
    player.position.set(-3, 0, 0);
    player.castShadow = true;
    scene.add(player);
    modelsRef.current.set('player', player);

    // Add player weapon
    const weapon = createWeaponModel('sword', playerEffect);
    weapon.position.set(0.5, 0.3, 0);
    player.add(weapon);

    // Create enemy models
    enemies.forEach((enemy, idx) => {
      const enemyModel = createArmorModel();
      enemyModel.position.set(3 + idx * 2, 0, 0);
      enemyModel.scale.set(0.8, 0.8, 0.8);
      enemyModel.castShadow = true;
      scene.add(enemyModel);
      modelsRef.current.set(enemy.id, enemyModel);

      // Add enemy weapon
      const enemyWeapon = createWeaponModel('sword');
      enemyWeapon.position.set(0.4, 0.2, 0);
      enemyModel.add(enemyWeapon);
    });

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Update particles
      particlesRef.current.forEach((particles) => {
        const positions = particles.geometry.attributes.position.array as Float32Array;
        const velocities = (particles as any).velocities as Float32Array;

        for (let i = 0; i < positions.length; i += 3) {
          positions[i] += velocities[i] * 0.02;
          positions[i + 1] += velocities[i + 1] * 0.02;
          positions[i + 2] += velocities[i + 2] * 0.02;

          // Fade out
          velocities[i] *= 0.98;
          velocities[i + 1] *= 0.98;
          velocities[i + 2] *= 0.98;
        }

        particles.geometry.attributes.position.needsUpdate = true;
        (particles.material as any).opacity *= 0.98;
      });

      // Remove dead particles
      particlesRef.current = particlesRef.current.filter(
        p => (p.material as any).opacity > 0.01
      );

      // Subtle camera bobbing
      const time = Date.now() * 0.0005;
      camera.position.y = 1.5 + Math.sin(time) * 0.1;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      cleanup();
    };
  }, [enemies, playerGear]);

  // Play effect on enemy
  const playEffect = (enemyId: string, effect: string) => {
    if (!sceneRef.current) return;

    const enemyModel = modelsRef.current.get(enemyId);
    if (!enemyModel) return;

    const particles = createParticleEmitter(effect, 100);
    particles.position.copy(enemyModel.position);
    sceneRef.current.scene.add(particles);
    particlesRef.current.push(particles);

    // Animate enemy recoil
    animateCombatAction(enemyModel, 'attack', 300);
  };

  // Expose effect triggers
  useEffect(() => {
    (window as any).battleScene3D = { playEffect };
  }, []);

  return (
    <div className="relative w-full h-96 rounded-lg overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950 border border-purple-500/30">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        onContextMenu={(e) => e.preventDefault()}
      />
      
      {/* HUD Overlay */}
      <div className="absolute top-4 left-4 text-sm text-purple-300 font-mono">
        <p>⚔️ Battle Arena</p>
        <p className="text-xs text-slate-400">{enemies.length} enemy(ies)</p>
      </div>

      {/* Enemy HP Bars */}
      <div className="absolute top-4 right-4 space-y-2">
        {enemies.map((enemy) => (
          <div key={enemy.id} className="text-right">
            <p className="text-xs text-slate-300 mb-1">{enemy.name}</p>
            <div className="w-32 h-2 bg-slate-800 rounded border border-red-500/50">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-orange-600 rounded transition-all"
                style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
              />
            </div>
            <p className="text-xs text-red-400 mt-1">{enemy.hp}/{enemy.maxHp}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
