/**
 * Camera & View System - Public API
 * Agent Arena 3D Roguelike - Phase 2.7
 */

// Core classes
export { CameraController } from './controller';
export { FollowCamera } from './follow';
export { CameraShake } from './shake';
export { Minimap } from './minimap';
export { CameraTransition } from './transitions';

// React hooks
export {
  useCameraController,
  useCameraFollow,
  useCameraShake,
  useMinimap,
  useCameraTransition,
  useCameraSystem,
} from './useCamera';

// Types
export type {
  CameraConfig,
  FollowConfig,
  ViewBounds,
  CameraShakeConfig,
  ShakeInstance,
  MinimapConfig,
  MinimapPosition,
  MinimapEntity,
  MinimapRoom,
  TransitionConfig,
  TransitionInstance,
  EasingFunction,
  PanState,
  RotationState,
} from './types';

export { CameraMode } from './types';
