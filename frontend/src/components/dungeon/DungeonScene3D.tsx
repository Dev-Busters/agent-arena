'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

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
  const [agentReachedEnemy, setAgentReachedEnemy] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    
    try {

    // Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    sceneRef.current = scene;

    // Camera (isometric-ish angle)
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(15, 12, 15);
    camera.lookAt(5, 0, 5);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 15, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Floor (10x10 grid)
    const floorGeometry = new THREE.PlaneGeometry(10, 10);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a4e,
      roughness: 0.7,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Grid lines visualization
    const gridHelper = new THREE.GridHelper(10, 10, 0x444466, 0x222233);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // Walls
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a3a5e,
      roughness: 0.8,
    });

    // North wall
    const northWall = new THREE.Mesh(new THREE.BoxGeometry(10, 3, 0.2), wallMaterial);
    northWall.position.set(5, 1.5, 0);
    northWall.castShadow = true;
    scene.add(northWall);

    // South wall
    const southWall = new THREE.Mesh(new THREE.BoxGeometry(10, 3, 0.2), wallMaterial);
    southWall.position.set(5, 1.5, 10);
    southWall.castShadow = true;
    scene.add(southWall);

    // East wall
    const eastWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3, 10), wallMaterial);
    eastWall.position.set(10, 1.5, 5);
    eastWall.castShadow = true;
    scene.add(eastWall);

    // West wall
    const westWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3, 10), wallMaterial);
    westWall.position.set(0, 1.5, 5);
    westWall.castShadow = true;
    scene.add(westWall);

    // Agent (capsule)
    const agentGeometry = new THREE.CapsuleGeometry(0.3, 1.2, 4, 8);
    const agentMaterial = new THREE.MeshStandardMaterial({
      color: 0x4488ff,
      metalness: 0.3,
      roughness: 0.4,
    });
    const agent = new THREE.Mesh(agentGeometry, agentMaterial);
    agent.position.set(2, 0.6, 2); // Room entrance
    agent.castShadow = true;
    agent.receiveShadow = true;
    scene.add(agent);
    agentRef.current = agent;

    // Enemy (red capsule)
    const enemyGeometry = new THREE.CapsuleGeometry(0.4, 1.4, 4, 8);
    const enemyMaterial = new THREE.MeshStandardMaterial({
      color: 0xff4444,
      metalness: 0.5,
      roughness: 0.3,
      emissive: 0x661111,
    });
    const enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);
    enemy.position.set(8, 0.7, 8); // Room far end
    enemy.castShadow = true;
    enemy.receiveShadow = true;
    scene.add(enemy);
    enemyRef.current = enemy;

    // Animation loop
    let agentTargetX = 8;
    let agentTargetZ = 8;
    let isMoving = true;

    const animate = () => {
      requestAnimationFrame(animate);

      // Lerp agent toward enemy
      if (isMoving && agent && enemy) {
        const distance = Math.hypot(
          agent.position.x - enemy.position.x,
          agent.position.z - enemy.position.z
        );

        if (distance > 1.2) {
          // Move toward enemy
          const direction = new THREE.Vector3(
            enemy.position.x - agent.position.x,
            0,
            enemy.position.z - agent.position.z
          ).normalize();

          agent.position.x += direction.x * 0.05;
          agent.position.z += direction.z * 0.05;

          // Rotate to face enemy
          agent.lookAt(enemy.position);
        } else {
          // Reached enemy
          isMoving = false;
          if (!agentReachedEnemy) {
            setAgentReachedEnemy(true);
            onReachEnemy();
          }
        }
      }

      // Enemy idle animation (slight bob)
      if (enemy) {
        enemy.position.y = 0.7 + Math.sin(Date.now() * 0.001) * 0.1;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;

      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      (camera as THREE.PerspectiveCamera).aspect = width / height;
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
    } catch (error) {
      console.error('Three.js scene error:', error);
      setHasError(true);
    }
  }, [onReachEnemy, agentReachedEnemy]);

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
