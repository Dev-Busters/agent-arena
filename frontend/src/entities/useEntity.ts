/**
 * React Hooks for Entity Management
 * Agent Arena 3D Roguelike
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  EntityType,
  EntityModel,
  AnimationState,
  ParticleEffectType,
  EntitySpawnConfig,
} from './types';
import { EntityModelFactory } from './models';
import { AnimationController } from './animations';
import { RagdollController } from './ragdoll';
import { ParticleEffectManager } from './particles';

/**
 * Hook to create and manage an entity
 */
export function useEntity(
  scene: THREE.Scene | null,
  type: EntityType,
  position: THREE.Vector3,
  scale: number = 1.0
): {
  entity: EntityModel | null;
  animationController: AnimationController | null;
  ragdollController: RagdollController | null;
  playAnimation: (state: AnimationState, loop?: boolean) => void;
  activateRagdoll: (impulse?: THREE.Vector3) => void;
  setPosition: (position: THREE.Vector3) => void;
  setRotation: (rotation: number) => void;
  remove: () => void;
} {
  const [entity, setEntity] = useState<EntityModel | null>(null);
  const animationControllerRef = useRef<AnimationController | null>(null);
  const ragdollControllerRef = useRef<RagdollController | null>(null);

  // Initialize entity
  useEffect(() => {
    if (!scene) return;

    // Create entity model
    const newEntity = EntityModelFactory.createModel(type, scale);
    newEntity.mesh.position.copy(position);
    scene.add(newEntity.mesh);

    // Create controllers
    const animController = new AnimationController(newEntity);
    const ragdollController = new RagdollController(newEntity);

    animationControllerRef.current = animController;
    ragdollControllerRef.current = ragdollController;
    setEntity(newEntity);

    // Cleanup
    return () => {
      scene.remove(newEntity.mesh);
      animController.dispose();
      ragdollController.dispose();
    };
  }, [scene, type, scale]); // Position removed from deps to avoid recreation

  // Update position when changed externally
  useEffect(() => {
    if (entity) {
      entity.mesh.position.copy(position);
    }
  }, [entity, position]);

  const playAnimation = useCallback(
    (state: AnimationState, loop: boolean = true) => {
      if (animationControllerRef.current) {
        animationControllerRef.current.playAnimation(state, loop);
      }
    },
    []
  );

  const activateRagdoll = useCallback((impulse?: THREE.Vector3) => {
    if (ragdollControllerRef.current) {
      ragdollControllerRef.current.activate(impulse);
    }
  }, []);

  const setPosition = useCallback(
    (newPosition: THREE.Vector3) => {
      if (entity) {
        entity.mesh.position.copy(newPosition);
      }
    },
    [entity]
  );

  const setRotation = useCallback(
    (rotation: number) => {
      if (entity) {
        entity.mesh.rotation.y = rotation;
      }
    },
    [entity]
  );

  const remove = useCallback(() => {
    if (scene && entity) {
      scene.remove(entity.mesh);
      animationControllerRef.current?.dispose();
      ragdollControllerRef.current?.dispose();
      setEntity(null);
    }
  }, [scene, entity]);

  return {
    entity,
    animationController: animationControllerRef.current,
    ragdollController: ragdollControllerRef.current,
    playAnimation,
    activateRagdoll,
    setPosition,
    setRotation,
    remove,
  };
}

/**
 * Hook to control entity animation
 */
export function useEntityAnimation(
  animationController: AnimationController | null,
  initialState: AnimationState = AnimationState.IDLE
): {
  currentState: AnimationState;
  playAnimation: (state: AnimationState, loop?: boolean) => void;
  isComplete: boolean;
} {
  const [currentState, setCurrentState] = useState<AnimationState>(initialState);
  const [isComplete, setIsComplete] = useState(false);
  const frameRef = useRef<number>();
  const lastTimeRef = useRef<number>(Date.now());

  // Animation loop
  useEffect(() => {
    if (!animationController) return;

    const animate = () => {
      const now = Date.now();
      const deltaTime = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      animationController.update(deltaTime);
      setCurrentState(animationController.getCurrentState());
      setIsComplete(animationController.isAnimationComplete());

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [animationController]);

  const playAnimation = useCallback(
    (state: AnimationState, loop: boolean = true) => {
      if (animationController) {
        animationController.playAnimation(state, loop);
      }
    },
    [animationController]
  );

  return {
    currentState,
    playAnimation,
    isComplete,
  };
}

/**
 * Hook to spawn particle effects
 */
export function useParticleEffect(
  particleManager: ParticleEffectManager | null
): {
  createHitEffect: (position: THREE.Vector3) => void;
  createDeathEffect: (position: THREE.Vector3) => void;
  createAbilityEffect: (type: ParticleEffectType, position: THREE.Vector3) => void;
  activeEffectCount: number;
} {
  const [activeEffectCount, setActiveEffectCount] = useState(0);
  const frameRef = useRef<number>();
  const lastTimeRef = useRef<number>(Date.now());

  // Particle update loop
  useEffect(() => {
    if (!particleManager) return;

    const animate = () => {
      const now = Date.now();
      const deltaTime = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      particleManager.update(deltaTime);
      setActiveEffectCount(particleManager.getActiveEffectCount());

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [particleManager]);

  const createHitEffect = useCallback(
    (position: THREE.Vector3) => {
      if (particleManager) {
        particleManager.createHitEffect(position);
      }
    },
    [particleManager]
  );

  const createDeathEffect = useCallback(
    (position: THREE.Vector3) => {
      if (particleManager) {
        particleManager.createDeathEffect(position);
      }
    },
    [particleManager]
  );

  const createAbilityEffect = useCallback(
    (type: ParticleEffectType, position: THREE.Vector3) => {
      if (particleManager) {
        particleManager.createAbilityEffect(type, position);
      }
    },
    [particleManager]
  );

  return {
    createHitEffect,
    createDeathEffect,
    createAbilityEffect,
    activeEffectCount,
  };
}

/**
 * Hook to manage multiple entities
 */
export function useEntityManager(
  scene: THREE.Scene | null,
  initialEntities: EntitySpawnConfig[] = []
): {
  entities: Map<string, EntityModel>;
  spawnEntity: (id: string, config: EntitySpawnConfig) => void;
  removeEntity: (id: string) => void;
  getEntity: (id: string) => EntityModel | undefined;
  clearAll: () => void;
} {
  const [entities] = useState<Map<string, EntityModel>>(new Map());
  const controllersRef = useRef<
    Map<
      string,
      {
        animation: AnimationController;
        ragdoll: RagdollController;
      }
    >
  >(new Map());

  // Spawn initial entities
  useEffect(() => {
    if (!scene) return;

    initialEntities.forEach((config, index) => {
      const id = `entity_${index}`;
      spawnEntity(id, config);
    });
  }, [scene]); // Only run once

  const spawnEntity = useCallback(
    (id: string, config: EntitySpawnConfig) => {
      if (!scene || entities.has(id)) return;

      const entity = EntityModelFactory.createModel(config.type, config.scale || 1.0);
      entity.mesh.position.copy(config.position);
      if (config.rotation !== undefined) {
        entity.mesh.rotation.y = config.rotation;
      }

      scene.add(entity.mesh);

      const animController = new AnimationController(entity);
      const ragdollController = new RagdollController(entity);

      if (config.animationState) {
        animController.playAnimation(config.animationState);
      }

      entities.set(id, entity);
      controllersRef.current.set(id, {
        animation: animController,
        ragdoll: ragdollController,
      });
    },
    [scene, entities]
  );

  const removeEntity = useCallback(
    (id: string) => {
      if (!scene) return;

      const entity = entities.get(id);
      if (entity) {
        scene.remove(entity.mesh);
        entities.delete(id);

        const controllers = controllersRef.current.get(id);
        if (controllers) {
          controllers.animation.dispose();
          controllers.ragdoll.dispose();
          controllersRef.current.delete(id);
        }
      }
    },
    [scene, entities]
  );

  const getEntity = useCallback(
    (id: string) => {
      return entities.get(id);
    },
    [entities]
  );

  const clearAll = useCallback(() => {
    if (!scene) return;

    entities.forEach((entity, id) => {
      scene.remove(entity.mesh);
      const controllers = controllersRef.current.get(id);
      if (controllers) {
        controllers.animation.dispose();
        controllers.ragdoll.dispose();
      }
    });

    entities.clear();
    controllersRef.current.clear();
  }, [scene, entities]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAll();
    };
  }, [clearAll]);

  return {
    entities,
    spawnEntity,
    removeEntity,
    getEntity,
    clearAll,
  };
}

/**
 * Hook to update ragdoll physics
 */
export function useRagdollUpdate(ragdollController: RagdollController | null): void {
  const frameRef = useRef<number>();
  const lastTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!ragdollController) return;

    const animate = () => {
      const now = Date.now();
      const deltaTime = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      ragdollController.update(deltaTime);

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [ragdollController]);
}
