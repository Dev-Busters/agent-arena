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
import { MouseTargeting } from '@/input/mouseTargeting';
import type { TargetableEntity } from '@/input/mouseTargeting';
import { RoomLightingManager } from '@/lighting/roomLighting';
import { TorchLight } from '@/lighting/torches';
import { LightPool } from '@/lighting/lightPool';
import { PostProcessingComposer } from '@/postprocessing/composer';
import { Minimap } from '@/camera/minimap';
import { FollowCamera } from '@/camera/follow';

// Network Optimization
import { ClientPrediction, EntityInterpolationManager } from '@/network';

// Phase 2 Enhancements
import { AtmosphericParticleSystem } from '@/dungeon3d/atmosphericParticles';
import { TorchManager } from '@/lighting/dynamicTorches';
import {
  createRoomTheme,
  determineRoomType,
  determineBiomeFromDepth,
  applyThemeToMaterials,
  RoomType,
  type RoomTheme,
} from '@/dungeon3d/roomThemes';

// Types
import type { BackendDungeonData } from '@/dungeon3d/types';
import type { EntityModel } from '@/entities/types';
import { EntityType, AnimationState, ParticleEffectType } from '@/entities/types';
import type { InputState } from '@/input/types';
import { PlayerAction } from '@/input/types'; // Import as value (not type) for enum access

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

  // Phase 2 Enhancement systems
  const atmosphericParticlesRef = useRef<AtmosphericParticleSystem | null>(null);
  const torchManagerRef = useRef<TorchManager | null>(null);
  const currentRoomThemeRef = useRef<RoomTheme | null>(null);

  // Input
  const inputManagerRef = useRef(getInputManager());
  const mouseTargetingRef = useRef<MouseTargeting | null>(null);

  // Network optimization
  const clientPredictionRef = useRef(new ClientPrediction());
  const entityInterpolationRef = useRef(new EntityInterpolationManager());

  // Animation frame
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);

  // Mouse targeting state (use refs to avoid stale closures in update loop)
  const hoveredEnemyIdRef = useRef<string | null>(null);
  const selectedEnemyIdRef = useRef<string | null>(null);

  // State (also keep state for UI rendering)
  const [isInitialized, setIsInitialized] = useState(false);
  const [fps, setFps] = useState(60);
  const [renderStats, setRenderStats] = useState({ drawCalls: 0, triangles: 0 });
  const [hoveredEnemyId, setHoveredEnemyId] = useState<string | null>(null);
  const [selectedEnemyId, setSelectedEnemyId] = useState<string | null>(null);

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
    scene.fog = new THREE.FogExp2(0x0a0a0a, 0.008);
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
          intensity: 0.05,
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

      // Phase 2 Enhancement: Atmospheric Particles & Dynamic Torches
      atmosphericParticlesRef.current = new AtmosphericParticleSystem(scene);
      torchManagerRef.current = new TorchManager(scene);

      console.log('✅ All Phase 2 systems initialized');
    } catch (error) {
      console.error('❌ System initialization failed:', error);
      return;
    }

    // 5. Setup Input (CRITICAL: Must run BEFORE spawning enemies!)
    // This initializes MouseTargeting so enemies can register as targetable
    setupInput();

    // 6. Load Dungeon from Backend Data (spawns enemies that register with MouseTargeting)
    loadDungeonRooms();

    // 7. Spawn Player
    spawnPlayer();

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

    // Phase 2: Single scene-level biome lighting (avoids per-room light explosion)
    {
      const depth = parseInt(dungeonId) || 1;
      const biome = determineBiomeFromDepth(depth);
      const theme = createRoomTheme(RoomType.NORMAL, biome);

      // Strong ambient light so rooms are always visible
      const sceneAmbient = new THREE.AmbientLight(0xffffff, 1.2);
      sceneAmbient.name = 'biome-ambient';
      scene.add(sceneAmbient);

      // Hemisphere light for biome color tinting (sky=biome color, ground=floor)
      const sceneHemi = new THREE.HemisphereLight(theme.ambientLight, theme.floorColor, 0.8);
      sceneHemi.name = 'biome-hemisphere';
      scene.add(sceneHemi);

      // Directional "sun" light from above for depth/shadows
      const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
      dirLight.position.set(10, 20, 10);
      dirLight.name = 'biome-directional';
      scene.add(dirLight);
    }

    // Generate all rooms
    backendData.rooms.forEach((roomData) => {
      const w = roomData.width;
      const h = roomData.height;
      const wallHeight = 4;
      const thickness = 0.2;
      
      // Create wall configurations for room perimeter
      const walls = [
        // North wall
        {
          position: new THREE.Vector3(0, wallHeight / 2, -h / 2),
          width: w,
          height: wallHeight,
          depth: thickness,
          rotation: { y: 0 },
          hasDoor: false,
        },
        // South wall
        {
          position: new THREE.Vector3(0, wallHeight / 2, h / 2),
          width: w,
          height: wallHeight,
          depth: thickness,
          rotation: { y: 0 },
          hasDoor: false,
        },
        // East wall
        {
          position: new THREE.Vector3(w / 2, wallHeight / 2, 0),
          width: thickness,
          height: wallHeight,
          depth: h,
          rotation: { y: 0 },
          hasDoor: false,
        },
        // West wall
        {
          position: new THREE.Vector3(-w / 2, wallHeight / 2, 0),
          width: thickness,
          height: wallHeight,
          depth: h,
          rotation: { y: 0 },
          hasDoor: false,
        },
      ];
      
      const room3D: any = {
        id: roomData.id,
        roomType: roomData.type || 'combat',
        position: new THREE.Vector3(roomData.x, 0, roomData.y),
        dimensions: {
          width: roomData.width,
          height: wallHeight,
          depth: roomData.height,
        },
        gridSize: 10,
        tiles: [], // Will be generated
        walls: walls,
        floor: {
          position: new THREE.Vector3(0, 0, 0),
          width: roomData.width,
          depth: roomData.height,
          tileSize: 2,
          uvScale: 1,
        },
        ceiling: {
          position: new THREE.Vector3(0, wallHeight, 0),
          width: roomData.width,
          depth: roomData.height,
          height: wallHeight,
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

      // Phase 2: Skip old RoomLightingManager — replaced by biome-aware lighting below
      // (Old createRoomLights added too many lights per room, causing WebGL texture unit overflow)

      // Phase 2: Apply room theme (biome + room type)
      const depth = parseInt(dungeonId) || 1;
      const biome = determineBiomeFromDepth(depth);
      const roomType = determineRoomType(roomData, depth);
      const theme = createRoomTheme(roomType, biome);
      currentRoomThemeRef.current = theme;

      // Apply theme fog (lighter to show biome atmosphere)
      if (sceneRef.current) {
        sceneRef.current.background = new THREE.Color(theme.fogColor);
        if (sceneRef.current.fog instanceof THREE.FogExp2) {
          sceneRef.current.fog.color.setHex(theme.fogColor);
          sceneRef.current.fog.density = theme.fogDensity;
        }
      }

      // Apply theme colors to room meshes
      meshes.group.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const mat = child.material as THREE.MeshPhongMaterial | THREE.MeshStandardMaterial;
          if ('color' in mat) {
            if (child.name.includes('floor')) {
              mat.color.setHex(theme.floorColor);
            } else if (child.name.includes('wall')) {
              mat.color.setHex(theme.wallColor);
            } else if (child.name.includes('ceiling')) {
              mat.color.setHex(theme.ceilingColor);
            }
          }
        }
      });

      // Phase 2: Room bounds for torches and particles
      const roomBounds = new THREE.Box3(
        new THREE.Vector3(
          roomData.x - roomData.width / 2,
          0,
          roomData.y - roomData.height / 2
        ),
        new THREE.Vector3(
          roomData.x + roomData.width / 2,
          4,
          roomData.y + roomData.height / 2
        )
      );

      // Phase 2: Add dynamic torches along walls
      if (torchManagerRef.current) {
        const torchColors: Record<string, number> = {
          cave: 0xff8844,
          crypt: 0x8888ff,
          lava: 0xff4400,
          ice: 0x88ccff,
          forest: 0x88ff44,
        };
        // Spacing 20 = ~1 torch per wall (keeps total lights low for WebGL)
        torchManagerRef.current.addWallTorches(
          roomData.id,
          roomBounds,
          torchColors[biome] || 0xff8844,
          20
        );
      }

      // Phase 2: Add atmospheric particles
      if (atmosphericParticlesRef.current && theme.particleType) {
        atmosphericParticlesRef.current.createParticles(
          roomData.id,
          theme.particleType,
          theme.particleDensity || 0.3,
          roomBounds
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
    
    // Clone materials so each enemy can have independent visual feedback
    // (Factory caches materials, so we need unique instances for emissive effects)
    model.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        child.material = (child.material as THREE.Material).clone();
      }
    });
    
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

    // Register as targetable for mouse targeting
    if (mouseTargetingRef.current) {
      mouseTargetingRef.current.registerEntity({
        id: enemyId,
        mesh: model.mesh,
        type: 'enemy',
        position: model.mesh.position,
      });
    }

    console.log(`✅ Spawned ${type} at (${x.toFixed(1)}, ${z.toFixed(1)})`);
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
    const canvas = canvasRef.current;
    const camera = cameraRef.current;

    if (!canvas || !camera) {
      console.warn('⚠️ Cannot setup input: missing canvas or camera');
      return;
    }

    // Initialize input manager
    inputManager.initialize();

    // Listen for ability actions and apply cooldowns (demo)
    inputManager.onAction((action) => {
      // Handle TAB to clear target
      if (action === PlayerAction.CLEAR_TARGET) {
        inputManager.setTarget(null);
        selectedEnemyIdRef.current = null;
        setSelectedEnemyId(null);
        return;
      }

      const skillActions = [
        PlayerAction.USE_SKILL_1,
        PlayerAction.USE_SKILL_2,
        PlayerAction.USE_SKILL_3,
        PlayerAction.USE_SKILL_4,
      ];

      if (skillActions.includes(action)) {
        // Check if on cooldown
        if (!inputManager.isAbilityOnCooldown(action)) {
          // Cast ability
          console.log(`[Abilities] Cast ${action}`);
          
          // Apply cooldown (5 seconds for demo)
          inputManager.setAbilityCooldown(action, 5000);

          const skillNames = ['Fireball', 'Ice Shard', 'Lightning Bolt', 'Heal'];
          const skillIndex = skillActions.indexOf(action);
          const skillName = skillNames[skillIndex];
          console.log(`✨ Used ${skillName}!`);

          // Trigger particle effect at targeted enemy or player position
          if (particleManagerRef.current && selectedEnemyIdRef.current) {
            const enemy = enemiesRef.current.get(selectedEnemyIdRef.current);
            if (enemy && enemy.model) {
              const effectTypeMap = [
                ParticleEffectType.ABILITY_FIRE,      // Fireball
                ParticleEffectType.ABILITY_ICE,       // Ice Shard
                ParticleEffectType.ABILITY_LIGHTNING, // Lightning Bolt
                ParticleEffectType.HEAL,              // Heal
              ];
              const effectType = effectTypeMap[skillIndex];
              if (effectType) {
                // Spawn effect at enemy
                particleManagerRef.current.createAbilityEffect(
                  effectType,
                  enemy.model.mesh.position.clone()
                );
                // Also create hit effect
                setTimeout(() => {
                  particleManagerRef.current?.createHitEffect(
                    enemy.model!.mesh.position.clone()
                  );
                }, 200);
              }
            }
          } else if (particleManagerRef.current && skillIndex === 3) {
            // Heal spell - effect at player
            if (playerModelRef.current) {
              particleManagerRef.current.createAbilityEffect(
                ParticleEffectType.HEAL,
                playerModelRef.current.mesh.position.clone()
              );
            }
          }
        } else {
          console.log(`⏳ ${action} is on cooldown`);
        }
      }
    });

    // Initialize mouse targeting
    const mouseTargeting = new MouseTargeting();
    mouseTargeting.initialize(camera, canvas);
    mouseTargetingRef.current = mouseTargeting;

    // Mouse move handler - update targeting hover
    const handleMouseMove = (event: MouseEvent) => {
      mouseTargeting.updateMousePosition(event.clientX, event.clientY);
      const hovered = mouseTargeting.updateHover();
      
      // Update hover state for visual feedback (both ref and state)
      const newHoverId = hovered?.id || null;
      hoveredEnemyIdRef.current = newHoverId;
      setHoveredEnemyId(newHoverId);
    };

    // Mouse click handler - target selection
    const handleMouseClick = (event: MouseEvent) => {
      const clicked = mouseTargeting.handleClick();
      
      if (clicked) {
        // Set target in input manager (update both ref and state)
        inputManager.setTarget(clicked.id);
        selectedEnemyIdRef.current = clicked.id;
        setSelectedEnemyId(clicked.id);
      } else {
        // Clicked empty space - clear target
        inputManager.setTarget(null);
        selectedEnemyIdRef.current = null;
        setSelectedEnemyId(null);
      }
    };

    // Test death animation (press 'D' on selected enemy)
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'd') {
        if (selectedEnemyIdRef.current) {
          const enemy = enemiesRef.current.get(selectedEnemyIdRef.current);
          if (enemy && enemy.model && enemy.animation) {
            console.log(`💀 Testing death on ${enemy.type}...`);
            
            // Play death animation
            enemy.animation.playAnimation(AnimationState.DEATH, false);
            
            // Trigger ragdoll if available (note: need to add ragdoll to Enemy interface)
            // For now, just play death animation
            
            // Create death particle effect
            if (particleManagerRef.current) {
              particleManagerRef.current.createDeathEffect(
                enemy.model.mesh.position.clone()
              );
            }
          }
        }
      }
    };

    // Attach event listeners
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleMouseClick);
    document.addEventListener('keydown', handleKeyDown);

    // Store cleanup function
    (canvas as any).__mouseHandlers = {
      mousemove: handleMouseMove,
      click: handleMouseClick,
    };

    console.log('✅ Input configured (keyboard + mouse targeting)');
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

    // Update enemy animations and visual feedback
    enemiesRef.current.forEach((enemy) => {
      if (enemy.animation) {
        enemy.animation.update(deltaTime);
      }

      // Apply visual feedback for hover/selection (use refs to avoid stale closure)
      const isHovered = enemy.id === hoveredEnemyIdRef.current;
      const isSelected = enemy.id === selectedEnemyIdRef.current;

      // Apply emissive glow to enemy mesh
      if (enemy.model?.mesh) {
        enemy.model.mesh.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            const material = child.material as THREE.MeshPhongMaterial;
            
            if (isSelected) {
              // Selected: red glow
              material.emissive.setHex(0xff0000);
              material.emissiveIntensity = 0.5;
            } else if (isHovered) {
              // Hovered: yellow glow
              material.emissive.setHex(0xffff00);
              material.emissiveIntensity = 0.3;
            } else {
              // Default: no glow
              material.emissive.setHex(0x000000);
              material.emissiveIntensity = 0;
            }
          }
        });
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

    // Update Phase 2 systems
    if (torchManagerRef.current) {
      torchManagerRef.current.update(deltaTime);
    }
    if (atmosphericParticlesRef.current) {
      atmosphericParticlesRef.current.update(deltaTime);
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
   * Camera-relative movement for isometric view with client-side prediction
   */
  const updatePlayerMovement = useCallback((inputState: InputState, deltaTime: number) => {
    if (!playerModelRef.current || !cameraRef.current) return;

    const player = playerModelRef.current;
    const velocity = playerVelocityRef.current;
    const camera = cameraRef.current;
    const moveSpeed = 8; // units per second

    // Get camera direction vectors for screen-relative movement
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    
    // Get camera right vector (cross product order: direction × up = right)
    const cameraRight = new THREE.Vector3();
    const cameraUp = camera.up.clone();
    cameraRight.crossVectors(cameraDirection, cameraUp).normalize();
    
    // Project camera direction and right onto world XZ plane (horizontal)
    cameraDirection.y = 0;
    cameraDirection.normalize();
    cameraRight.y = 0;
    cameraRight.normalize();

    // WASD movement (camera-relative, screen-space)
    let inputDir = new THREE.Vector3(0, 0, 0);
    
    if (inputState.pressedKeys.get('w') || inputState.pressedKeys.get('arrowup')) {
      inputDir.add(cameraDirection);
    }
    if (inputState.pressedKeys.get('s') || inputState.pressedKeys.get('arrowdown')) {
      inputDir.sub(cameraDirection);
    }
    if (inputState.pressedKeys.get('a') || inputState.pressedKeys.get('arrowleft')) {
      inputDir.sub(cameraRight);
    }
    if (inputState.pressedKeys.get('d') || inputState.pressedKeys.get('arrowright')) {
      inputDir.add(cameraRight);
    }

    // Normalize and calculate movement vector
    if (inputDir.length() > 0) {
      inputDir.normalize();
      const moveX = inputDir.x * moveSpeed;
      const moveZ = inputDir.z * moveSpeed;
      
      // Apply client-side prediction
      const prediction = clientPredictionRef.current.applyInput(
        player.mesh.position,
        velocity,
        moveX,
        moveZ,
        deltaTime
      );
      
      // Update player position and velocity from prediction
      player.mesh.position.copy(prediction.position);
      velocity.copy(prediction.velocity);
      playerPositionRef.current.copy(player.mesh.position);
      playerVelocityRef.current.copy(velocity);

      // Play walk animation
      if (playerAnimationRef.current?.getCurrentState() !== AnimationState.WALK) {
        playerAnimationRef.current?.playAnimation(AnimationState.WALK);
      }

      // Face movement direction
      const angle = Math.atan2(inputDir.x, inputDir.z);
      player.mesh.rotation.y = angle;
      
      // TODO: Send input to server with prediction.sequenceNumber
      // This allows server to confirm/correct our prediction later
    } else {
      // Reset velocity when not moving
      velocity.set(0, 0, 0);
      
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
    mouseTargetingRef.current?.destroy();
    atmosphericParticlesRef.current?.dispose();
    torchManagerRef.current?.dispose();

    // Remove mouse event listeners
    const canvas = canvasRef.current;
    if (canvas && (canvas as any).__mouseHandlers) {
      const handlers = (canvas as any).__mouseHandlers;
      canvas.removeEventListener('mousemove', handlers.mousemove);
      canvas.removeEventListener('click', handlers.click);
      delete (canvas as any).__mouseHandlers;
    }

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
          {/* FPS Counter + Biome Indicator */}
          <div className="absolute top-4 left-4 px-3 py-2 rounded-lg bg-black/60 backdrop-blur-sm border border-green-500/30">
            <div className="text-xs text-green-400 font-mono">
              FPS: <span className="font-bold">{fps}</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Calls: {renderStats.drawCalls} | Tris: {renderStats.triangles}
            </div>
            {currentRoomThemeRef.current && (
              <div className="text-[10px] text-purple-400 font-mono mt-1">
                🏔️ {currentRoomThemeRef.current.biome.toUpperCase()} • {currentRoomThemeRef.current.type}
              </div>
            )}
          </div>

          {/* Target Info */}
          {selectedEnemyId && (() => {
            const enemy = enemiesRef.current.get(selectedEnemyId);
            if (!enemy) return null;
            
            const enemyName = enemy.type.charAt(0).toUpperCase() + enemy.type.slice(1);
            
            return (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-red-900/40 backdrop-blur-sm border-2 border-red-500/60">
                <div className="text-sm text-red-300 font-bold text-center">
                  🎯 {enemyName}
                </div>
                <div className="text-xs text-red-400 font-mono text-center mt-1">
                  Click to attack • TAB to clear
                </div>
              </div>
            );
          })()}

          {/* Ability Bar */}
          <div className="absolute bottom-32 left-8 flex gap-2">
            {['Q', 'E', 'R', 'F'].map((key, index) => {
              const action = [
                PlayerAction.USE_SKILL_1,
                PlayerAction.USE_SKILL_2,
                PlayerAction.USE_SKILL_3,
                PlayerAction.USE_SKILL_4,
              ][index];
              
              const onCooldown = inputManagerRef.current?.isAbilityOnCooldown(action) || false;
              const cooldownMs = inputManagerRef.current?.getAbilityCooldown(action) || 0;
              const cooldownPct = cooldownMs > 0 ? Math.min(100, (cooldownMs / 5000) * 100) : 0;

              return (
                <div
                  key={key}
                  className={`relative w-14 h-14 rounded-lg border-2 ${
                    onCooldown
                      ? 'bg-gray-800/80 border-gray-600'
                      : 'bg-purple-900/40 border-purple-500/60 hover:border-purple-400'
                  } backdrop-blur-sm transition-all`}
                >
                  {/* Key Label */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-lg font-bold ${onCooldown ? 'text-gray-500' : 'text-purple-300'}`}>
                      {key}
                    </span>
                  </div>
                  
                  {/* Cooldown Overlay */}
                  {onCooldown && (
                    <>
                      <div
                        className="absolute inset-0 bg-black/60 rounded-lg transition-all"
                        style={{ height: `${cooldownPct}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs text-white font-bold">
                          {(cooldownMs / 1000).toFixed(1)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
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
              <div><span className="text-purple-400">Q/E/R/F</span> - Skills</div>
              <div><span className="text-blue-400">CLICK</span> - Target</div>
              <div><span className="text-yellow-400">T</span> - Interact</div>
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
