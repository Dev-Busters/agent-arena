/**
 * Camera & View System Type Definitions
 * Agent Arena 3D Roguelike - Phase 2.7
 */

import { Vector3 } from 'three';

/**
 * Camera operating modes
 */
export enum CameraMode {
  /** Follow player with smooth interpolation */
  FOLLOW = 'follow',
  /** Free camera controlled by user input */
  FREE = 'free',
  /** Cinematic camera for cutscenes/transitions */
  CINEMATIC = 'cinematic',
  /** Fixed camera position (for specific rooms/events) */
  FIXED = 'fixed',
}

/**
 * View bounds to keep camera within playable area
 */
export interface ViewBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

/**
 * Camera configuration
 */
export interface CameraConfig {
  /** Initial camera position */
  position: Vector3;
  /** Initial camera target/look-at point */
  target: Vector3;
  /** Initial zoom level (orthographic size) */
  zoom: number;
  /** Minimum zoom level */
  minZoom: number;
  /** Maximum zoom level */
  maxZoom: number;
  /** Zoom speed (mouse wheel sensitivity) */
  zoomSpeed: number;
  /** View bounds (optional) */
  bounds?: ViewBounds;
  /** Initial camera mode */
  mode: CameraMode;
  /** Enable smooth damping */
  enableDamping: boolean;
  /** Damping factor (0-1, higher = slower) */
  dampingFactor: number;
}

/**
 * Follow camera configuration
 */
export interface FollowConfig {
  /** Offset from target (relative position) */
  offset: Vector3;
  /** Follow smoothness (0-1, higher = smoother/slower) */
  smoothness: number;
  /** Look-ahead distance (camera leads in movement direction) */
  lookAhead: number;
  /** Enable speed-based zoom */
  speedBasedZoom: boolean;
  /** Speed threshold for zoom out */
  speedThreshold: number;
  /** Maximum zoom out multiplier */
  maxSpeedZoom: number;
}

/**
 * Camera shake configuration
 */
export interface CameraShakeConfig {
  /** Shake intensity (magnitude) */
  intensity: number;
  /** Shake duration in milliseconds */
  duration: number;
  /** Shake frequency (oscillations per second) */
  frequency: number;
  /** Decay rate (0-1, higher = faster decay) */
  decay: number;
  /** Shake direction (for directional shakes) */
  direction?: Vector3;
}

/**
 * Active shake instance
 */
export interface ShakeInstance {
  id: string;
  config: CameraShakeConfig;
  startTime: number;
  currentIntensity: number;
  phase: number;
}

/**
 * Minimap configuration
 */
export interface MinimapConfig {
  /** Minimap width in pixels */
  width: number;
  /** Minimap height in pixels */
  height: number;
  /** Position on screen */
  position: MinimapPosition;
  /** Zoom level (scale factor) */
  zoom: number;
  /** Opacity (0-1) */
  opacity: number;
  /** Background color */
  backgroundColor: string;
  /** Border color */
  borderColor: string;
  /** Border width in pixels */
  borderWidth: number;
  /** Show fog of war */
  showFogOfWar: boolean;
  /** Show enemies */
  showEnemies: boolean;
  /** Show items */
  showItems: boolean;
  /** Player marker color */
  playerColor: string;
  /** Enemy marker color */
  enemyColor: string;
  /** Item marker color */
  itemColor: string;
  /** Explored area color */
  exploredColor: string;
  /** Unexplored area color */
  unexploredColor: string;
}

/**
 * Minimap position on screen
 */
export interface MinimapPosition {
  /** Top offset (undefined = auto) */
  top?: number;
  /** Right offset (undefined = auto) */
  right?: number;
  /** Bottom offset (undefined = auto) */
  bottom?: number;
  /** Left offset (undefined = auto) */
  left?: number;
}

/**
 * Minimap entity (player, enemy, item)
 */
export interface MinimapEntity {
  id: string;
  position: { x: number; z: number };
  type: 'player' | 'enemy' | 'item';
  color?: string;
}

/**
 * Minimap room data
 */
export interface MinimapRoom {
  id: string;
  bounds: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
  explored: boolean;
}

/**
 * Camera transition configuration
 */
export interface TransitionConfig {
  /** Target camera position */
  targetPosition: Vector3;
  /** Target look-at point */
  targetLookAt: Vector3;
  /** Target zoom level */
  targetZoom?: number;
  /** Transition duration in milliseconds */
  duration: number;
  /** Easing function */
  easing: EasingFunction;
  /** Callback when transition completes */
  onComplete?: () => void;
}

/**
 * Easing function type
 */
export type EasingFunction =
  | 'linear'
  | 'easeInQuad'
  | 'easeOutQuad'
  | 'easeInOutQuad'
  | 'easeInCubic'
  | 'easeOutCubic'
  | 'easeInOutCubic'
  | 'easeInQuart'
  | 'easeOutQuart'
  | 'easeInOutQuart';

/**
 * Active transition instance
 */
export interface TransitionInstance {
  config: TransitionConfig;
  startPosition: Vector3;
  startLookAt: Vector3;
  startZoom: number;
  startTime: number;
  progress: number;
}

/**
 * Pan control state
 */
export interface PanState {
  enabled: boolean;
  isDragging: boolean;
  lastPointerPosition: { x: number; y: number };
  sensitivity: number;
}

/**
 * Rotation control state
 */
export interface RotationState {
  enabled: boolean;
  angle: number;
  minAngle: number;
  maxAngle: number;
  speed: number;
}
