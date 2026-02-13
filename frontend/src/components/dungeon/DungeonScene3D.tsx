'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { ParticleManager, PARTICLE_PRESETS } from './ParticleSystem';
import {
  AssetCache,
  FrustumCuller,
  configureRenderer,
  getQualitySettings,
  vec3Pool,
} from '@/lib/rendering';

interface DungeonScene3DProps {
  playerStats: any;
  enemyData: any;
  onReachEnemy: () => void;
}

export default function DungeonScene3D({
  playerStats,
  enemyData,
  onReachEnemy
}: DungeonScene3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const agentRef = useRef<THREE.Mesh | null>(null);
  const enemyRef = useRef<THREE.Mesh | null>(null);
  const particleManagerRef = useRef<ParticleManager | null>(null);
  const cullerRef = useRef<FrustumCuller | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  const frameIdRef = useRef<number>(0);
  const [agentReachedEnemy, setAgentReachedEnemy] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    
    try {
      const cache = AssetCache.getInstance();
      const quality = getQualitySettings();

      // Scene Setup
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1a1a2e);
      sceneRef.current = scene;

      // Camera (isometric-ish angle)
      const camera = new THREE.PerspectiveCamera(
        75,
        containerRef.current.clientWidth / containerRef.current.clientHeight,
        0.1,
        100 // tighter far plane for better depth precision
      );
      camera.position.set(15, 12, 15);
      camera.lookAt(5, 0, 5);
      cameraRef.current = camera;

      // ── Optimized Renderer ──────────────────────────────────
      const { renderer } = configureRenderer({ container: containerRef.current });
      containerRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // ── Frustum Culler ──────────────────────────────────────
      const culler = new FrustumCuller(camera, 60);
      cullerRef.current = culler;

      // ── Lighting ────────────────────────────────────────────
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(10, 15, 10);
      if (quality.shadows) {
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = quality.shadowMapSize;
        directionalLight.shadow.mapSize.height = quality.shadowMapSize;
        // Tight shadow frustum for better resolution
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 40;
        directionalLight.shadow.camera.left = -12;
        directionalLight.shadow.camera.right = 12;
        directionalLight.shadow.camera.top = 12;
        directionalLight.shadow.camera.bottom = -12;
      }
      scene.add(directionalLight);

      // ── Floor (shared geometry/material via cache) ──────────
      const floorGeo = cache.getGeometry('floor-10x10', () => new THREE.PlaneGeometry(10, 10));
      const floorMat = cache.getMaterial('floor-standard', () =>
        new THREE.MeshStandardMaterial({ color: 0x2a2a4e, roughness: 0.7 })
      );
      const floor = new THREE.Mesh(floorGeo, floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = quality.shadows;
      scene.add(floor);

      // Grid lines
      const gridHelper = new THREE.GridHelper(10, 10, 0x444466, 0x222233);
      gridHelper.position.y = 0.01;
      scene.add(gridHelper);

      // ── Walls (instanced — 4 walls in 1 draw call) ─────────
      const wallGeo = cache.getGeometry('unit-box', () => new THREE.BoxGeometry(1, 1, 1));
      const wallMat = cache.getMaterial('wall-standard', () =>
        new THREE.MeshStandardMaterial({ color: 0x3a3a5e, roughness: 0.8 })
      );
      const wallMesh = new THREE.InstancedMesh(wallGeo, wallMat, 4);
      wallMesh.castShadow = quality.shadows;
      wallMesh.receiveShadow = quality.shadows;

      const wallTransforms = [
        { pos: [5, 1.5, 0], scale: [10, 3, 0.2] },   // North
        { pos: [5, 1.5, 10], scale: [10, 3, 0.2] },  // South
        { pos: [10, 1.5, 5], scale: [0.2, 3, 10] },  // East
        { pos: [0, 1.5, 5], scale: [0.2, 3, 10] },   // West
      ];
      const tmpMat4 = new THREE.Matrix4();
      const tmpPos = new THREE.Vector3();
      const tmpQuat = new THREE.Quaternion();
      const tmpScale = new THREE.Vector3();

      wallTransforms.forEach((wt, i) => {
        tmpPos.set(wt.pos[0], wt.pos[1], wt.pos[2]);
        tmpQuat.identity();
        tmpScale.set(wt.scale[0], wt.scale[1], wt.scale[2]);
        tmpMat4.compose(tmpPos, tmpQuat, tmpScale);
        wallMesh.setMatrixAt(i, tmpMat4);
      });
      wallMesh.instanceMatrix.needsUpdate = true;
      scene.add(wallMesh);

      // ── Particle Manager ────────────────────────────────────
      const particleManager = new ParticleManager(scene);
      particleManagerRef.current = particleManager;

      // Torch lights + flame particles (capped by quality tier)
      const torchPositions = [
        new THREE.Vector3(1, 2.2, 0.5),
        new THREE.Vector3(9, 2.2, 0.5),
        new THREE.Vector3(1, 2.2, 9.5),
        new THREE.Vector3(9, 2.2, 9.5),
      ];
      const maxTorches = Math.min(torchPositions.length, quality.maxPointLights);
      const torchLights: THREE.PointLight[] = [];

      for (let i = 0; i < maxTorches; i++) {
        const pos = torchPositions[i];
        const torchLight = new THREE.PointLight(0xff6600, 0.6, 6);
        torchLight.position.copy(pos);
        scene.add(torchLight);
        torchLights.push(torchLight);
        particleManager.emit(pos, 'torchFlame');
      }

      // Ambient dust (scaled by quality)
      if (quality.particleScale >= 0.5) {
        particleManager.emit(new THREE.Vector3(5, 1.5, 5), 'dustMotes');
      }

      // ── Agent (capsule — cached geometry) ───────────────────
      const capsSegs = quality.capsuleSegments;
      const agentGeo = cache.getGeometry(`capsule-agent-${capsSegs}`, () =>
        new THREE.CapsuleGeometry(0.3, 1.2, capsSegs, capsSegs * 2)
      );
      const agentMat = cache.getMaterial('agent-standard', () =>
        new THREE.MeshStandardMaterial({ color: 0x4488ff, metalness: 0.3, roughness: 0.4 })
      );
      const agent = new THREE.Mesh(agentGeo, agentMat);
      agent.position.set(2, 0.6, 2);
      agent.castShadow = quality.shadows;
      agent.receiveShadow = quality.shadows;
      scene.add(agent);
      agentRef.current = agent;

      // ── Enemy (red capsule — cached geometry) ───────────────
      const enemyGeo = cache.getGeometry(`capsule-enemy-${capsSegs}`, () =>
        new THREE.CapsuleGeometry(0.4, 1.4, capsSegs, capsSegs * 2)
      );
      const enemyMat = cache.getMaterial('enemy-standard', () =>
        new THREE.MeshStandardMaterial({
          color: 0xff4444,
          metalness: 0.5,
          roughness: 0.3,
          emissive: 0x661111,
        })
      );
      const enemy = new THREE.Mesh(enemyGeo, enemyMat);
      enemy.position.set(8, 0.7, 8);
      enemy.castShadow = quality.shadows;
      enemy.receiveShadow = quality.shadows;
      scene.add(enemy);
      enemyRef.current = enemy;

      // Register dynamic objects for culling
      culler.add(agent);
      culler.add(enemy);

      // ── Animation Loop ──────────────────────────────────────
      let isMoving = true;
      let combatEffectEmitted = false;
      let reachedNotified = false;
      const clock = clockRef.current;
      clock.start();

      // Reusable vector for direction calc (avoid allocation per frame)
      const moveDir = new THREE.Vector3();

      const animate = () => {
        frameIdRef.current = requestAnimationFrame(animate);
        const dt = clock.getDelta();

        // Update particles
        particleManager.update(dt);

        // Update frustum culler
        culler.update();

        // Torch flicker (cheap)
        for (const tl of torchLights) {
          tl.intensity = 0.5 + Math.random() * 0.3;
        }

        // Lerp agent toward enemy
        if (isMoving && agent && enemy) {
          const dx = enemy.position.x - agent.position.x;
          const dz = enemy.position.z - agent.position.z;
          const distance = Math.sqrt(dx * dx + dz * dz);

          if (distance > 1.2) {
            const inv = 0.05 / distance;
            agent.position.x += dx * inv;
            agent.position.z += dz * inv;
            moveDir.set(enemy.position.x, agent.position.y, enemy.position.z);
            agent.lookAt(moveDir);
          } else {
            isMoving = false;
            if (!combatEffectEmitted) {
              combatEffectEmitted = true;
              const impactPos = vec3Pool.acquire();
              impactPos.copy(enemy.position);
              impactPos.y += 0.5;
              particleManager.emit(impactPos, 'magicSpell');
              setTimeout(() => {
                particleManager.emit(impactPos, 'damageHit');
                vec3Pool.release(impactPos);
              }, 300);
            }
            if (!reachedNotified) {
              reachedNotified = true;
              setAgentReachedEnemy(true);
              onReachEnemy();
            }
          }
        }

        // Enemy idle bob
        if (enemy) {
          enemy.position.y = 0.7 + Math.sin(Date.now() * 0.001) * 0.1;
        }

        renderer.render(scene, camera);
      };

      animate();

      // ── Resize Handler (debounced) ──────────────────────────
      let resizeTimer: ReturnType<typeof setTimeout>;
      const handleResize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          if (!containerRef.current) return;
          const w = containerRef.current.clientWidth;
          const h = containerRef.current.clientHeight;
          (camera as THREE.PerspectiveCamera).aspect = w / h;
          (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
          renderer.setSize(w, h);
        }, 100);
      };
      window.addEventListener('resize', handleResize);

      // ── Cleanup ─────────────────────────────────────────────
      return () => {
        window.removeEventListener('resize', handleResize);
        clearTimeout(resizeTimer);
        cancelAnimationFrame(frameIdRef.current);
        culler.dispose();
        particleManager.dispose();
        // Release cached assets (refCount--)
        cache.releaseGeometry('floor-10x10');
        cache.releaseMaterial('floor-standard');
        cache.releaseGeometry('unit-box');
        cache.releaseMaterial('wall-standard');
        cache.releaseGeometry(`capsule-agent-${capsSegs}`);
        cache.releaseMaterial('agent-standard');
        cache.releaseGeometry(`capsule-enemy-${capsSegs}`);
        cache.releaseMaterial('enemy-standard');
        renderer.dispose();
        if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
          containerRef.current.removeChild(renderer.domElement);
        }
      };
    } catch (error) {
      console.error('Three.js scene error:', error);
      setHasError(true);
    }
  }, [onReachEnemy]);

  if (hasError) {
    return (
      <div className="w-full h-96 rounded-2xl overflow-hidden border border-slate-700/50 backdrop-blur-xl flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, rgba(26,26,46,0.5), rgba(30,30,60,0.5))' }}
      >
        <div className="text-center text-slate-400">
          <p className="mb-2">Scene loading...</p>
          <p className="text-xs text-slate-500">Combat will begin shortly</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-96 rounded-2xl overflow-hidden border border-slate-700/50 backdrop-blur-xl"
      style={{ background: 'linear-gradient(135deg, rgba(26,26,46,0.5), rgba(30,30,60,0.5))' }}
    />
  );
}
