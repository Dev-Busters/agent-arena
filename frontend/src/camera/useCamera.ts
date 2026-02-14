/**
 * React Hooks for Camera System
 * Agent Arena 3D Roguelike - Phase 2.7
 */

import { useEffect, useRef, useCallback } from 'react';
import { OrthographicCamera, Vector3 } from 'three';
import { CameraController } from './controller';
import { FollowCamera } from './follow';
import { CameraShake } from './shake';
import { Minimap } from './minimap';
import { CameraTransition } from './transitions';
import {
  CameraConfig,
  FollowConfig,
  MinimapConfig,
  TransitionConfig,
  CameraMode,
} from './types';

/**
 * Hook to setup and manage camera controller
 */
export function useCameraController(
  camera: OrthographicCamera | null,
  config: CameraConfig
) {
  const controllerRef = useRef<CameraController | null>(null);
  const shakeRef = useRef<CameraShake>(new CameraShake());
  const transitionRef = useRef<CameraTransition>(new CameraTransition());

  // Initialize controller
  useEffect(() => {
    if (!camera) return;

    const controller = new CameraController(camera, config);
    controllerRef.current = controller;

    // Setup event listeners
    const handleWheel = (e: WheelEvent) => controller.handleWheel(e);
    const handlePointerDown = (e: PointerEvent) => controller.handlePointerDown(e);
    const handlePointerMove = (e: PointerEvent) => controller.handlePointerMove(e);
    const handlePointerUp = (e: PointerEvent) => controller.handlePointerUp(e);
    const handleKeyDown = (e: KeyboardEvent) => controller.handleKeyDown(e);
    const handleKeyUp = (e: KeyboardEvent) => controller.handleKeyUp(e);

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Cleanup
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      controller.dispose();
    };
  }, [camera, config]);

  // Update loop
  const update = useCallback((deltaTime: number) => {
    if (!controllerRef.current) return;

    const controller = controllerRef.current;

    // Get current position before transition/shake
    let position = controller.getPosition();
    let lookAt = controller.getTarget();
    let zoom = controller.getZoom();

    // Apply transition if active
    const transition = transitionRef.current.update();
    if (transition) {
      transitionRef.current.setStartValues(position, lookAt, zoom);
      position = transition.position;
      lookAt = transition.lookAt;
      zoom = transition.zoom;
    }

    // Apply camera shake
    const shakeOffset = shakeRef.current.update(deltaTime);
    if (shakeOffset.length() > 0) {
      position.add(shakeOffset);
    }

    // Update controller
    controller.setTargetPosition(position);
    controller.setTargetLookAt(lookAt);
    controller.setZoom(zoom);
    controller.update(deltaTime);
  }, []);

  return {
    controller: controllerRef.current,
    shake: shakeRef.current,
    transition: transitionRef.current,
    update,
  };
}

/**
 * Hook to setup follow camera behavior
 */
export function useCameraFollow(
  controller: CameraController | null,
  target: Vector3 | null,
  config: FollowConfig
) {
  const followCameraRef = useRef<FollowCamera>(new FollowCamera(config));

  // Update target
  useEffect(() => {
    followCameraRef.current.setTarget(target);
  }, [target]);

  // Update loop
  const update = useCallback(
    (deltaTime: number) => {
      if (!controller) return;

      const result = followCameraRef.current.update(deltaTime);
      controller.setTargetPosition(result.position);
      controller.setTargetLookAt(result.lookAt);
      
      // Apply speed-based zoom
      if (config.speedBasedZoom) {
        const currentZoom = controller.getZoom();
        controller.setZoom(currentZoom * result.zoomMultiplier);
      }
    },
    [controller, config.speedBasedZoom]
  );

  return {
    followCamera: followCameraRef.current,
    update,
  };
}

/**
 * Hook to trigger camera shake effects
 */
export function useCameraShake(shake: CameraShake | null) {
  const triggerImpact = useCallback(
    (intensity: number, duration?: number) => {
      if (!shake) return;
      return shake.impact(intensity, duration);
    },
    [shake]
  );

  const triggerContinuous = useCallback(
    (intensity: number, duration: number, frequency?: number) => {
      if (!shake) return;
      return shake.continuous(intensity, duration, frequency);
    },
    [shake]
  );

  const triggerDirectional = useCallback(
    (intensity: number, direction: Vector3, duration?: number) => {
      if (!shake) return;
      return shake.directional(intensity, direction, duration);
    },
    [shake]
  );

  const clearAll = useCallback(() => {
    if (!shake) return;
    shake.clearAll();
  }, [shake]);

  return {
    impact: triggerImpact,
    continuous: triggerContinuous,
    directional: triggerDirectional,
    clearAll,
  };
}

/**
 * Hook to setup minimap
 */
export function useMinimap(
  config: MinimapConfig,
  containerElement?: HTMLElement
) {
  const minimapRef = useRef<Minimap | null>(null);

  useEffect(() => {
    const minimap = new Minimap(config, containerElement);
    minimapRef.current = minimap;

    // Show minimap
    minimap.show();

    // Cleanup
    return () => {
      minimap.dispose();
    };
  }, [config, containerElement]);

  // Render loop
  const render = useCallback(() => {
    if (!minimapRef.current) return;
    minimapRef.current.render();
  }, []);

  return {
    minimap: minimapRef.current,
    render,
  };
}

/**
 * Hook to trigger camera transitions
 */
export function useCameraTransition(
  controller: CameraController | null,
  transition: CameraTransition | null
) {
  const startTransition = useCallback(
    (config: TransitionConfig) => {
      if (!controller || !transition) return;

      // Set starting values
      const position = controller.getPosition();
      const lookAt = controller.getTarget();
      const zoom = controller.getZoom();

      transition.start(config);
      transition.setStartValues(position, lookAt, zoom);
    },
    [controller, transition]
  );

  const cancelTransition = useCallback(() => {
    if (!transition) return;
    transition.cancel();
  }, [transition]);

  const isActive = useCallback(() => {
    if (!transition) return false;
    return transition.isActive();
  }, [transition]);

  return {
    start: startTransition,
    cancel: cancelTransition,
    isActive,
  };
}

/**
 * Hook to setup complete camera system
 */
export function useCameraSystem(
  camera: OrthographicCamera | null,
  cameraConfig: CameraConfig,
  followConfig?: FollowConfig,
  minimapConfig?: MinimapConfig
) {
  // Setup camera controller
  const { controller, shake, transition, update: updateController } =
    useCameraController(camera, cameraConfig);

  // Setup follow camera (if config provided)
  const followTarget = useRef<Vector3 | null>(null);
  const { followCamera, update: updateFollow } = useCameraFollow(
    controller,
    followTarget.current,
    followConfig || {
      offset: new Vector3(10, 15, 10),
      smoothness: 0.1,
      lookAhead: 2,
      speedBasedZoom: false,
      speedThreshold: 5,
      maxSpeedZoom: 1.5,
    }
  );

  // Setup minimap (if config provided)
  const { minimap, render: renderMinimap } = useMinimap(
    minimapConfig || {
      width: 200,
      height: 200,
      position: { top: 20, right: 20 },
      zoom: 1,
      opacity: 0.8,
      backgroundColor: '#1a1a1a',
      borderColor: '#ffffff',
      borderWidth: 2,
      showFogOfWar: true,
      showEnemies: true,
      showItems: true,
      playerColor: '#00ff00',
      enemyColor: '#ff0000',
      itemColor: '#ffff00',
      exploredColor: '#333333',
      unexploredColor: '#111111',
    }
  );

  // Setup shake
  const shakeControls = useCameraShake(shake);

  // Setup transition
  const transitionControls = useCameraTransition(controller, transition);

  // Combined update function
  const update = useCallback(
    (deltaTime: number) => {
      // Update follow camera if in follow mode
      if (controller?.getMode() === CameraMode.FOLLOW && followConfig) {
        updateFollow(deltaTime);
      }

      // Update controller
      updateController(deltaTime);

      // Render minimap
      if (minimap) {
        renderMinimap();
      }
    },
    [controller, followConfig, updateFollow, updateController, minimap, renderMinimap]
  );

  return {
    controller,
    followCamera,
    minimap,
    shake: shakeControls,
    transition: transitionControls,
    update,
    setFollowTarget: (target: Vector3 | null) => {
      followTarget.current = target;
      followCamera.setTarget(target);
    },
  };
}
