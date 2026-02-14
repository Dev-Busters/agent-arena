/**
 * Renderer Module Exports
 * Three.js scene management and rendering utilities
 */

// Type exports
export type {
  SceneConfig,
  CameraConfig,
  RendererConfig,
  ViewportConfig,
  RenderStats,
  MemoryStats,
  FogConfig,
  LightingConfig,
  PerformanceWarning,
  RenderCallback,
  CleanupFunction,
} from './types';

export { PerformanceLevel } from './types';

// Scene manager
export { SceneManager } from './scene';

// Camera controller
export {
  CameraController,
  createIsometricCamera,
  calculateIsometricPosition,
  getHadesCameraConfig,
} from './camera';

// Performance monitoring
export { PerformanceMonitor, FPSCounter, createPerformanceMonitor } from './performance';

// React hooks
export {
  useThreeScene,
  useAnimationLoop,
  usePerformanceStats,
  useRenderer,
  useMesh,
  useCustomRenderLoop,
} from './useRenderer';
