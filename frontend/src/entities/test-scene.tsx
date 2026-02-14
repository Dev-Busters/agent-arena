/**
 * Entity System Test Scene
 * Verifies all animations, particle effects, and entity features
 */

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import {
  EntityType,
  AnimationState,
  ParticleEffectType,
  EntityModelFactory,
  AnimationController,
  ParticleEffectManager,
  RagdollController,
  createDeathImpulse,
} from './index';

export function EntityTestScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const entitiesRef = useRef<
    Array<{
      model: any;
      animation: AnimationController;
      ragdoll: RagdollController;
      type: EntityType;
      position: THREE.Vector3;
    }>
  >([]);
  const particleManagerRef = useRef<ParticleEffectManager | null>(null);
  const [testStatus, setTestStatus] = useState<string>('Initializing...');
  const [fps, setFps] = useState<number>(0);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 8, 15);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(50, 50);
    const groundMaterial = new THREE.MeshPhongMaterial({
      color: 0x2d2d44,
      side: THREE.DoubleSide,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid helper
    const gridHelper = new THREE.GridHelper(50, 50, 0x444444, 0x222222);
    scene.add(gridHelper);

    // Initialize particle manager
    particleManagerRef.current = new ParticleEffectManager(scene);

    // Create test entities
    setTestStatus('Creating entities...');

    // Player
    const player = EntityModelFactory.createModel(EntityType.PLAYER, 1.0);
    player.mesh.position.set(0, 0, 0);
    scene.add(player.mesh);
    const playerAnim = new AnimationController(player);
    const playerRagdoll = new RagdollController(player);
    entitiesRef.current.push({
      model: player,
      animation: playerAnim,
      ragdoll: playerRagdoll,
      type: EntityType.PLAYER,
      position: new THREE.Vector3(0, 0, 0),
    });

    // Goblin
    const goblin = EntityModelFactory.createModel(EntityType.GOBLIN, 1.0);
    goblin.mesh.position.set(-4, 0, 2);
    scene.add(goblin.mesh);
    const goblinAnim = new AnimationController(goblin);
    const goblinRagdoll = new RagdollController(goblin);
    entitiesRef.current.push({
      model: goblin,
      animation: goblinAnim,
      ragdoll: goblinRagdoll,
      type: EntityType.GOBLIN,
      position: new THREE.Vector3(-4, 0, 2),
    });

    // Orc
    const orc = EntityModelFactory.createModel(EntityType.ORC, 1.0);
    orc.mesh.position.set(4, 0, 2);
    scene.add(orc.mesh);
    const orcAnim = new AnimationController(orc);
    const orcRagdoll = new RagdollController(orc);
    entitiesRef.current.push({
      model: orc,
      animation: orcAnim,
      ragdoll: orcRagdoll,
      type: EntityType.ORC,
      position: new THREE.Vector3(4, 0, 2),
    });

    // Skeleton
    const skeleton = EntityModelFactory.createModel(EntityType.SKELETON, 1.0);
    skeleton.mesh.position.set(0, 0, 5);
    scene.add(skeleton.mesh);
    const skeletonAnim = new AnimationController(skeleton);
    const skeletonRagdoll = new RagdollController(skeleton);
    entitiesRef.current.push({
      model: skeleton,
      animation: skeletonAnim,
      ragdoll: skeletonRagdoll,
      type: EntityType.SKELETON,
      position: new THREE.Vector3(0, 0, 5),
    });

    setTestStatus('Running tests...');

    // Start test sequence
    runTestSequence();

    // Animation loop
    let lastTime = Date.now();
    let frameCount = 0;
    let fpsTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const deltaTime = (now - lastTime) / 1000;
      lastTime = now;

      // Update FPS counter
      frameCount++;
      if (now - fpsTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        fpsTime = now;
      }

      // Update animations
      entitiesRef.current.forEach((entity) => {
        entity.animation.update(deltaTime);
        entity.ragdoll.update(deltaTime);
      });

      // Update particles
      if (particleManagerRef.current) {
        particleManagerRef.current.update(deltaTime);
      }

      // Render
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      entitiesRef.current.forEach((entity) => {
        scene.remove(entity.model.mesh);
        entity.animation.dispose();
        entity.ragdoll.dispose();
      });
      particleManagerRef.current?.dispose();
      renderer.dispose();
    };
  }, []);

  const runTestSequence = async () => {
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    setTestStatus('Test 1/5: Idle animation');
    entitiesRef.current.forEach((entity) => {
      entity.animation.playAnimation(AnimationState.IDLE);
    });
    await delay(2000);

    setTestStatus('Test 2/5: Walk animation');
    entitiesRef.current.forEach((entity) => {
      entity.animation.playAnimation(AnimationState.WALK);
    });
    await delay(2000);

    setTestStatus('Test 3/5: Attack animation');
    entitiesRef.current.forEach((entity) => {
      entity.animation.playAnimation(AnimationState.ATTACK, false);
    });
    // Spawn hit particles
    if (particleManagerRef.current) {
      entitiesRef.current.forEach((entity) => {
        setTimeout(() => {
          particleManagerRef.current!.createHitEffect(
            entity.model.mesh.position.clone()
          );
        }, 300);
      });
    }
    await delay(2000);

    setTestStatus('Test 4/5: Particle effects');
    if (particleManagerRef.current) {
      particleManagerRef.current.createAbilityEffect(
        ParticleEffectType.ABILITY_FIRE,
        new THREE.Vector3(-4, 1, 2)
      );
      particleManagerRef.current.createAbilityEffect(
        ParticleEffectType.ABILITY_ICE,
        new THREE.Vector3(4, 1, 2)
      );
      particleManagerRef.current.createAbilityEffect(
        ParticleEffectType.ABILITY_LIGHTNING,
        new THREE.Vector3(0, 1, 5)
      );
    }
    await delay(3000);

    setTestStatus('Test 5/5: Death animation with ragdoll');
    // Kill enemies (not player)
    entitiesRef.current.slice(1).forEach((entity, index) => {
      entity.animation.playAnimation(AnimationState.DEATH, false);
      const direction = new THREE.Vector3(
        Math.random() - 0.5,
        0,
        Math.random() - 0.5
      ).normalize();
      const impulse = createDeathImpulse(direction, 4.0);
      entity.ragdoll.activate(impulse);

      // Death particles
      setTimeout(() => {
        if (particleManagerRef.current) {
          particleManagerRef.current.createDeathEffect(
            entity.model.mesh.position.clone()
          );
        }
      }, 500);
    });

    await delay(3000);
    setTestStatus('✅ All tests complete! Player remains standing.');
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <canvas ref={canvasRef} />
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
          fontSize: '14px',
        }}
      >
        <h2 style={{ margin: '0 0 10px 0' }}>Entity System Test Scene</h2>
        <div>Status: {testStatus}</div>
        <div>FPS: {fps}</div>
        <div>Entities: {entitiesRef.current.length}</div>
        <div>
          Active Particles: {particleManagerRef.current?.getActiveEffectCount() || 0}
        </div>
        <div style={{ marginTop: '10px', fontSize: '12px', opacity: 0.7 }}>
          Watch the automated test sequence...
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '12px',
        }}
      >
        <div>🔵 Player (Center)</div>
        <div>🟢 Goblin (Left)</div>
        <div>🔴 Orc (Right)</div>
        <div>⚪ Skeleton (Back)</div>
      </div>
    </div>
  );
}

export default EntityTestScene;
