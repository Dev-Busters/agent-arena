/**
 * Renderer Type Definitions
 * Core types for Three.js scene management and rendering
 */

import * as THREE from 'three';

/**
 * Scene configuration options
 */
export interface SceneConfig {
  /** Target canvas element or ref */
  canvas?: HTMLCanvasElement;
  /** Camera configuration */
  camera: CameraConfig;
  /** Renderer options */
  renderer: RendererConfig;
  /** Background color (hex) */
  backgroundColor?: number;
  /** Enable shadows */
  enableShadows?: boolean;
  /** Enable fog */
  enableFog?: boolean;
  /** Fog configuration */
  fog?: FogConfig;
}

/**
 * Camera configuration for orthographic/isometric view
 */
export interface CameraConfig {
  /** Camera type (always orthographic for isometric) */
  type: 'orthographic';
  /** Frustum size (world units visible vertically) */
  frustumSize: number;
  /** Initial zoom level (1 = default) */
  zoom?: number;
  /** Camera position */
  position?: THREE.Vector3;
  /** Look-at target */
  target?: THREE.Vector3;
  /** Near clipping plane */
  near?: number;
  /** Far clipping plane */
  far?: number;
  /** Isometric angle preset */
  isometricAngle?: 'hades' | 'classic' | 'custom';
}

/**
 * WebGL Renderer configuration
 */
export interface RendererConfig {
  /** Enable antialiasing */
  antialias?: boolean;
  /** Pixel ratio (default: window.devicePixelRatio) */
  pixelRatio?: number;
  /** Enable alpha channel */
  alpha?: boolean;
  /** Power preference */
  powerPreference?: 'high-performance' | 'low-power' | 'default';
  /** Enable physically correct lighting */
  physicallyCorrectLights?: boolean;
  /** Tone mapping */
  toneMapping?: THREE.ToneMapping;
  /** Tone mapping exposure */
  toneMappingExposure?: number;
  /** Output color space */
  outputColorSpace?: THREE.ColorSpace;
}

/**
 * Viewport configuration
 */
export interface ViewportConfig {
  /** Viewport width in pixels */
  width: number;
  /** Viewport height in pixels */
  height: number;
  /** Aspect ratio (width / height) */
  aspectRatio: number;
  /** Device pixel ratio */
  pixelRatio: number;
}

/**
 * Real-time rendering statistics
 */
export interface RenderStats {
  /** Frames per second */
  fps: number;
  /** Frame time in milliseconds */
  frameTime: number;
  /** Draw calls per frame */
  drawCalls: number;
  /** Triangle count */
  triangles: number;
  /** Texture count */
  textures: number;
  /** Geometry count */
  geometries: number;
  /** Memory usage (if available) */
  memory?: MemoryStats;
  /** Timestamp of stats */
  timestamp: number;
}

/**
 * Memory usage statistics
 */
export interface MemoryStats {
  /** Total allocated memory in MB */
  total?: number;
  /** Used memory in MB */
  used?: number;
  /** Memory limit in MB */
  limit?: number;
}

/**
 * Fog configuration
 */
export interface FogConfig {
  /** Fog type */
  type: 'linear' | 'exponential';
  /** Fog color */
  color: number;
  /** Near distance (linear fog) */
  near?: number;
  /** Far distance (linear fog) */
  far?: number;
  /** Density (exponential fog) */
  density?: number;
}

/**
 * Lighting configuration
 */
export interface LightingConfig {
  /** Ambient light color */
  ambientColor?: number;
  /** Ambient light intensity */
  ambientIntensity?: number;
  /** Directional light color */
  directionalColor?: number;
  /** Directional light intensity */
  directionalIntensity?: number;
  /** Directional light position */
  directionalPosition?: THREE.Vector3;
  /** Cast shadows from directional light */
  castShadows?: boolean;
}

/**
 * Performance warning levels
 */
export enum PerformanceLevel {
  EXCELLENT = 'excellent', // >= 55 FPS
  GOOD = 'good',           // >= 45 FPS
  ACCEPTABLE = 'acceptable', // >= 30 FPS
  POOR = 'poor',           // < 30 FPS
}

/**
 * Performance warning event
 */
export interface PerformanceWarning {
  level: PerformanceLevel;
  fps: number;
  message: string;
  timestamp: number;
}

/**
 * Render loop callback
 */
export type RenderCallback = (deltaTime: number, elapsedTime: number) => void;

/**
 * Cleanup function
 */
export type CleanupFunction = () => void;
