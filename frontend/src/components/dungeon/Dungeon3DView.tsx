/**
 * Dungeon3DView.tsx - Full 3D Dungeon Scene Integration
 * Agent Arena 3D Roguelike - Phase 2 Integration
 * 
 * Integrates all Phase 2 modules:
 * - Renderer (Three.js scene)
 * - Dungeon3D (room generation)
 * - Entities (player + enemies)
 * - Camera (follow + minimap)
 * - Input (WASD movement)
 * - Lighting (torches + shadows)
 * - Post-processing (bloom + effects)
 */

'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

// Phase 2 Module Imports
import { SceneManager } from '@/renderer/scene';
import { CameraController } from '@/renderer/camera';
import { PerformanceMonitor } from '@/renderer/performance';
import { DungeonGenerator } from '@/dungeon3d/generator';
import { MaterialLibrary } from '@/dungeon3d/materials';
import { FogOfWar } from '@/dungeon3d/fogOfWar';
import { EntityModelFactory } from '@/entities/models';
import { AnimationController } from '@/entities/animations';
import { ParticleEffectManager } from '@/entities/particles';
import { getInputManager } from '@/input/inputManager';
import { RoomLightingManager } from '@/lighting/roomLighting';
import { TorchLight } from '@/lighting/torches';
import { LightPool } from '@/lighting/lightPool';
import { PostProcessingComposer } from '@/postprocessing/composer';
import { Minimap } from '@/camera/minimap';
import { FollowCamera } from '@/camera/follow';

// Types
import type { BackendDungeonData } from '@/dungeon3d/types';
import type { EntityModel } from '@/entities/types';
import { EntityType, AnimationState } from '@/entities/types';
import type { InputState, PlayerAction } from '@/input/types';

interface Dungeon3DViewProps {
  dungeonId: string;
  rooms: any[];
  currentRoomId: number | null;
  onRoomChange?: (roomId: number) => void;
  playerStats: {
    hp: number;
    maxHp: number;
    level: number;
  };
}

interface Enemy {
  id: string;
  roomId: number;
  type: EntityType;
  position: THREE.Vector3;
  model: EntityModel | null;
  animation: AnimationController | null;
}

export default function Dungeon3DView({
  dungeonId,
  rooms,
  currentRoomId,
  onRoomChange,
  playerStats,
}: Dungeon3DViewProps) {
  // Canvas ref
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Three.js core refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // System refs
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const cameraControllerRef = useRef<CameraController | null>(null);
  const performanceMonitorRef = useRef<PerformanceMonitor | null>(null);
  const dungeonGeneratorRef = useRef<DungeonGenerator | null>(null);
  const fogOfWarRef = useRef<FogOfWar | null>(null);
  const lightingManagerRef = useRef<RoomLightingManager | null>(null);
  const postProcessingRef = useRef<PostProcessingComposer | null>(null);
  const minimapRef = useRef<Minimap | null>(null);
  const followCameraRef = useRef<FollowCamera | null>(null);

  // Entity refs
  const playerModelRef = useRef<EntityModel | null>(null);
  const playerAnimationRef = useRef<AnimationController | null>(null);
  const playerPositionRef = useRef(new THREE.Vector3(0, 0, 0));
  const playerVelocityRef = useRef(new THREE.Vector3());
  const enemiesRef = useRef<Map<string, Enemy>>(new Map());

  // Particle system
  const particleManagerRef = useRef<ParticleEffectManager | null>(null);

  // Input
  const inputManagerRef = useRef(getInputManager());

  // Animation frame
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);

  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [fps, setFps] = useState(60);
  const [renderStats, setRenderStats] = useState({ drawCalls: 0, triangles: 0 });

  /**
   * Initialize Three.js scene and all systems
   */
  const initialize = useCallback(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Create Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.FogExp2(0x0a0a0a, 0.02);
    sceneRef.current = scene;

    // 2. Create Camera
    const camera = new THREE.PerspectiveCamera(
      60, // FOV
      width / height,
      0.1, // near
      1000 // far
    );
    camera.position.set(15, 20, 15);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Create Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;

    // 4. Initialize Systems
    try {
      // Note: We're using manual Three.js setup instead of SceneManager
      // since we need a PerspectiveCamera for 3D dungeon exploration

      // Performance Monitor
      const perfMonitor = new PerformanceMonitor(renderer);
      performanceMonitorRef.current = perfMonitor;

      // Material Library
      const materialLibrary = new MaterialLibrary();

      // Dungeon Generator
      const dungeonGen = new DungeonGenerator(materialLibrary, {
        tileSize: 2,
        wallHeight: 4,
        gridSize: 10,
        optimizeMeshes: true,
      });
      dungeonGeneratorRef.current = dungeonGen;

      // Fog of War
      const fogOfWar = new FogOfWar(scene);
      fogOfWarRef.current = fogOfWar;

      // Light Pool for efficient light management
      const lightPool = new LightPool(scene, {
        maxLights: 32,
        enableShadows: true,
      });

      // Lighting Manager
      const lightingManager = new RoomLightingManager(scene, lightPool);
      lightingManagerRef.current = lightingManager;

      // Post-Processing
      const postProcessing = new PostProcessingComposer(renderer, scene, camera, {
        enabled: true,
        bloom: {
          threshold: 0.7,
          strength: 0.8,
          radius: 0.5,
        },
        filmGrain: {
          intensity: 0.15,
          animated: true,
        },
      });
      postProcessingRef.current = postProcessing;

      // Minimap
      const minimap = new Minimap({
        width: 220,
        height: 220,
        position: { top: 20, right: 20 },
        zoom: 1.5,
        opacity: 0.9,
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
      });
      minimapRef.current = minimap;

      // Follow Camera
      const followCamera = new FollowCamera({
        offset: new THREE.Vector3(15, 20, 15),
        smoothness: 0.15,
        lookAhead: 3,
        speedBasedZoom: false,
        speedThreshold: 5,
        maxSpeedZoom: 1.2,
      });
      followCameraRef.current = followCamera;

      // Particle Manager
      const particleManager = new ParticleEffectManager(scene);
      particleManagerRef.current = particleManager;

      console.log('✅ All Phase 2 systems initialized');
    } catch (error) {
      console.error('❌ System initialization failed:', error);
      return;
    }

    // 5. Load Dungeon from Backend Data
    loadDungeonRooms();

    // 6. Spawn Player
    spawnPlayer();

    // 7. Setup Input
    setupInput();

    // 8. Start Game Loop
    startGameLoop();

    setIsInitialized(true);

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      postProcessingRef.current?.resize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cleanup();
    };
  }, [rooms]);

  /**
   * Load dungeon rooms from backend data
   */
  const loadDungeonRooms = useCallback(() => {
    if (!dungeonGeneratorRef.current || !sceneRef.current) return;
    if (!rooms || rooms.length === 0) return;

    const scene = sceneRef.current;
    const dungeonGen = dungeonGeneratorRef.current;

    // Convert backend rooms to 3D rooms
    const backendData: BackendDungeonData = {
      id: dungeonId,
      seed: 12345,
      startRoomId: rooms[0]?.id?.toString() || 'room-0',
      rooms: rooms.map((room, idx) => ({
        id: `room-${room.id || idx}`,
        x: room.x * 2 || idx * 12,
        y: room.y * 2 || 0,
        width: room.width || 10,
        height: room.height || 10,
        type: room.type || 'combat',
        exits: {
          north: true,
          south: true,
          east: true,
          west: true,
        },
        connectedRooms: [],
      })),
    };

    // Generate all rooms
    backendData.rooms.forEach((roomData) => {
      const room3D: any = {
        id: roomData.id,
        roomType: roomData.type || 'combat',
        position: new THREE.Vector3(roomData.x, 0, roomData.y),
        dimensions: {
          width: roomData.width,
          height: 4, // Wall height
          depth: roomData.height,
        },
        gridSize: 10,
        tiles: [], // Will be generated
        walls: [], // Will be generated
        floor: {
          position: new THREE.Vector3(roomData.x, 0, roomData.y),
          width: roomData.width,
          depth: roomData.height,
          tileSize: 2,
          uvScale: 1,
        },
        ceiling: {
          position: new THREE.Vector3(roomData.x, 4, roomData.y),
          width: roomData.width,
          depth: roomData.height,
          height: 4,
          uvScale: 1,
        },
        doors: [],
        connections: roomData.exits || {},
        explored: false,
      };

      const meshes = dungeonGen.generateRoom(room3D);
      scene.add(meshes.group);

      // Add room to minimap
      if (minimapRef.current) {
        minimapRef.current.addRoom({
          id: roomData.id,
          bounds: {
            minX: roomData.x - roomData.width / 2,
            maxX: roomData.x + roomData.width / 2,
            minZ: roomData.y - roomData.height / 2,
            maxZ: roomData.y + roomData.height / 2,
          },
          explored: false,
        });
      }

      // Setup lighting for room (using createRoomLights method)
      if (lightingManagerRef.current) {
        lightingManagerRef.current.createRoomLights(
          roomData.type as any || 'combat',
          { width: roomData.width, depth: roomData.height }
        );
      }
    });

    // Spawn enemies in rooms (after room 0)
    rooms.forEach((room, idx) => {
      if (idx === 0) return; // Skip entrance room
      const enemyCount = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < enemyCount; i++) {
        spawnEnemy(room.id || idx, `enemy-${room.id}-${i}`, getRandomEnemyType());
      }
    });

    console.log(`✅ Loaded ${rooms.length} dungeon rooms`);
  }, [dungeonId, rooms]);

  /**
   * Spawn player entity
   */
  const spawnPlayer = useCallback(() => {
    if (!sceneRef.current) return;

    const scene = sceneRef.current;

    // Create player model using static method
    const playerModel = EntityModelFactory.createPlayerModel(1);
    scene.add(playerModel.mesh);
    playerModelRef.current = playerModel;

    // Create animation controller
    const animController = new AnimationController(playerModel, {
      blendDuration: 0.2,
      defaultState: AnimationState.IDLE,
      loopStates: [AnimationState.IDLE, AnimationState.WALK, AnimationState.RUN],
      interruptible: [AnimationState.IDLE, AnimationState.WALK, AnimationState.RUN],
    });
    playerAnimationRef.current = animController;
    animController.playAnimation(AnimationState.IDLE);

    // Set follow target (FollowCamera expects Vector3, not Object3D)
    if (followCameraRef.current) {
      followCameraRef.current.setTarget(playerModel.mesh.position);
    }

    // Add player to minimap
    if (minimapRef.current) {
      minimapRef.current.setPlayerPosition(playerModel.mesh.position.x, playerModel.mesh.position.z);
    }

    console.log('✅ Player spawned');
  }, []);

  /**
   * Spawn enemy entity
   */
  const spawnEnemy = useCallback((roomId: number, enemyId: string, type: EntityType) => {
    if (!sceneRef.current) return;

    const scene = sceneRef.current;

    // Random position in room (simplified)
    const x = (Math.random() - 0.5) * 8;
    const z = (Math.random() - 0.5) * 8;

    // Create enemy model using static method
    const model = EntityModelFactory.createModel(type, 1);
    model.mesh.position.set(x, 0, z);
    scene.add(model.mesh);

    // Create animation controller
    const animController = new AnimationController(model, {
      blendDuration: 0.2,
      defaultState: AnimationState.IDLE,
      loopStates: [AnimationState.IDLE, AnimationState.WALK],
      interruptible: [AnimationState.IDLE, AnimationState.WALK],
    });
    animController.playAnimation(AnimationState.IDLE);

    // Store enemy
    enemiesRef.current.set(enemyId, {
      id: enemyId,
      roomId,
      type,
      position: model.mesh.position,
      model,
      animation: animController,
    });

    // Add to minimap
    if (minimapRef.current) {
      minimapRef.current.addEntity({
        id: enemyId,
        position: model.mesh.position,
        type: 'enemy',
      });
    }
  }, []);

  /**
   * Get random enemy type
   */
  const getRandomEnemyType = (): EntityType => {
    const types: EntityType[] = [EntityType.GOBLIN, EntityType.ORC, EntityType.SKELETON];
    return types[Math.floor(Math.random() * types.length)];
  };

  /**
   * Setup input handling
   */
  const setupInput = useCallback(() => {
    const inputManager = inputManagerRef.current;

    // Initialize input manager
    inputManager.initialize();

    console.log('✅ Input configured');
  }, []);

  /**
   * Start game loop
   */
  const startGameLoop = useCallback(() => {
    const animate = (time: number) => {
      animationFrameRef.current = requestAnimationFrame(animate);

      const deltaTime = lastTimeRef.current ? (time - lastTimeRef.current) / 1000 : 0.016;
      lastTimeRef.current = time;

      // Cap delta time to prevent large jumps
      const dt = Math.min(deltaTime, 0.1);

      update(dt);
      render();
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, []);

  /**
   * Update game state
   */
  const update = useCallback((deltaTime: number) => {
    // Update input
    const inputState = inputManagerRef.current.getState();

    // Update player movement
    updatePlayerMovement(inputState, deltaTime);

    // Update player animation
    if (playerAnimationRef.current) {
      playerAnimationRef.current.update(deltaTime);
    }

    // Update enemy animations
    enemiesRef.current.forEach((enemy) => {
      if (enemy.animation) {
        enemy.animation.update(deltaTime);
      }
    });

    // Update camera
    if (followCameraRef.current && cameraRef.current && playerModelRef.current) {
      followCameraRef.current.setTarget(playerModelRef.current.mesh.position);
      const camResult = followCameraRef.current.update(deltaTime);
      cameraRef.current.position.copy(camResult.position);
      cameraRef.current.lookAt(camResult.lookAt);
    }

    // Update particles
    if (particleManagerRef.current) {
      particleManagerRef.current.update(deltaTime);
    }

    // Update minimap
    if (minimapRef.current && playerModelRef.current) {
      const pos = playerModelRef.current.mesh.position;
      minimapRef.current.setPlayerPosition(pos.x, pos.z);
    }

    // Update fog of war
    if (fogOfWarRef.current && playerModelRef.current && currentRoomId !== null) {
      fogOfWarRef.current.updatePlayerPosition(
        playerModelRef.current.mesh.position,
        `room-${currentRoomId}`
      );
    }

    // Update performance monitor
    if (performanceMonitorRef.current) {
      performanceMonitorRef.current.update();
      const stats = performanceMonitorRef.current.getStats();
      setFps(Math.round(stats.fps));
    }
  }, []);

  /**
   * Update player movement based on input
   */
  const updatePlayerMovement = useCallback((inputState: InputState, deltaTime: number) => {
    if (!playerModelRef.current) return;

    const player = playerModelRef.current;
    const velocity = playerVelocityRef.current;
    const moveSpeed = 8; // units per second

    // Reset velocity
    velocity.set(0, 0, 0);

    // WASD movement (check pressedKeys Map)
    if (inputState.pressedKeys.get('w') || inputState.pressedKeys.get('arrowup')) {
      velocity.z -= 1;
    }
    if (inputState.pressedKeys.get('s') || inputState.pressedKeys.get('arrowdown')) {
      velocity.z += 1;
    }
    if (inputState.pressedKeys.get('a') || inputState.pressedKeys.get('arrowleft')) {
      velocity.x -= 1;
    }
    if (inputState.pressedKeys.get('d') || inputState.pressedKeys.get('arrowright')) {
      velocity.x += 1;
    }

    // Normalize and apply speed
    if (velocity.length() > 0) {
      velocity.normalize().multiplyScalar(moveSpeed * deltaTime);
      player.mesh.position.add(velocity);
      playerPositionRef.current.copy(player.mesh.position);

      // Play walk animation
      if (playerAnimationRef.current?.getCurrentState() !== AnimationState.WALK) {
        playerAnimationRef.current?.playAnimation(AnimationState.WALK);
      }

      // Face movement direction
      const angle = Math.atan2(velocity.x, velocity.z);
      player.mesh.rotation.y = angle;
    } else {
      // Play idle animation
      if (playerAnimationRef.current?.getCurrentState() !== AnimationState.IDLE) {
        playerAnimationRef.current?.playAnimation(AnimationState.IDLE);
      }
    }
  }, []);

  /**
   * Render scene
   */
  const render = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;

    // Render with post-processing if available
    if (postProcessingRef.current) {
      postProcessingRef.current.render();
    } else {
      renderer.render(scene, camera);
    }

    // Render minimap
    if (minimapRef.current) {
      minimapRef.current.render();
    }

    // Update render stats
    setRenderStats({
      drawCalls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
    });
  }, []);

  /**
   * Cleanup on unmount
   */
  const cleanup = useCallback(() => {
    // Stop animation loop
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Dispose entities
    if (playerModelRef.current) {
      sceneRef.current?.remove(playerModelRef.current.mesh);
      // EntityModel doesn't have dispose, meshes are auto-disposed
    }

    enemiesRef.current.forEach((enemy) => {
      if (enemy.model) {
        sceneRef.current?.remove(enemy.model.mesh);
      }
    });
    enemiesRef.current.clear();

    // Dispose systems (only those with dispose methods)
    postProcessingRef.current?.dispose();
    minimapRef.current?.dispose();
    particleManagerRef.current?.dispose();

    // Dispose renderer
    rendererRef.current?.dispose();

    console.log('🧹 Cleaned up 3D scene');
  }, []);

  /**
   * Initialize on mount
   */
  useEffect(() => {
    const cleanupFn = initialize();
    return () => {
      if (cleanupFn) cleanupFn();
    };
  }, [initialize]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen bg-black"
    >
      {/* Three.js Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />

      {/* HUD Overlay */}
      {isInitialized && (
        <>
          {/* FPS Counter (Debug) */}
          <div className="absolute top-4 left-4 px-3 py-2 rounded-lg bg-black/60 backdrop-blur-sm border border-green-500/30">
            <div className="text-xs text-green-400 font-mono">
              FPS: <span className="font-bold">{fps}</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Calls: {renderStats.drawCalls} | Tris: {renderStats.triangles}
            </div>
          </div>

          {/* Health/Mana Bar */}
          <div className="absolute bottom-8 left-8 space-y-2">
            {/* HP Bar */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-red-400 font-bold w-8">HP</span>
              <div className="w-48 h-4 bg-black/60 backdrop-blur-sm border border-red-500/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-300"
                  style={{ width: `${(playerStats.hp / playerStats.maxHp) * 100}%` }}
                />
              </div>
              <span className="text-xs text-red-300 font-mono">
                {playerStats.hp}/{playerStats.maxHp}
              </span>
            </div>

            {/* Mana Bar (placeholder) */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-blue-400 font-bold w-8">MP</span>
              <div className="w-48 h-4 bg-black/60 backdrop-blur-sm border border-blue-500/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-400"
                  style={{ width: '100%' }}
                />
              </div>
              <span className="text-xs text-blue-300 font-mono">100/100</span>
            </div>
          </div>

          {/* Controls Help */}
          <div className="absolute bottom-8 right-8 px-4 py-3 rounded-lg bg-black/60 backdrop-blur-sm border border-slate-500/30">
            <div className="text-[10px] text-slate-300 font-mono space-y-1">
              <div><span className="text-green-400">WASD</span> - Move</div>
              <div><span className="text-green-400">SPACE</span> - Attack</div>
              <div><span className="text-green-400">E</span> - Interact</div>
            </div>
          </div>

          {/* Loading Indicator */}
          {!isInitialized && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-white text-xl font-bold animate-pulse">
                Loading 3D Environment...
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
