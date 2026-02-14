/**
 * React Hooks for Three.js Integration
 * Provides hooks for scene management, animation loops, and performance monitoring
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { SceneManager } from './scene';
import { CameraController } from './camera';
import { PerformanceMonitor } from './performance';
import type { SceneConfig, RenderStats, RenderCallback, CleanupFunction } from './types';

/**
 * Hook to initialize and manage Three.js scene
 * Returns scene manager, camera controller, and canvas ref
 */
export function useThreeScene(config: SceneConfig) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const cameraControllerRef = useRef<CameraController | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    try {
      // Initialize scene manager
      const sceneManager = SceneManager.getInstance();
      sceneManager.initialize({
        ...config,
        canvas: canvasRef.current,
      });

      // Initialize camera controller
      const cameraController = new CameraController(
        config.camera,
        sceneManager.viewport
      );

      sceneManagerRef.current = sceneManager;
      cameraControllerRef.current = cameraController;
      setIsReady(true);

      // Handle window resize
      const handleResize = () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        sceneManager.resize(width, height);
        cameraController.updateFrustum({
          width,
          height,
          aspectRatio: width / height,
          pixelRatio: window.devicePixelRatio || 1,
        });
      };

      window.addEventListener('resize', handleResize);

      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize);
        sceneManager.dispose();
        SceneManager.reset();
        setIsReady(false);
      };
    } catch (error) {
      console.error('Failed to initialize Three.js scene:', error);
      setIsReady(false);
    }
  }, []); // Only initialize once

  return {
    canvasRef,
    sceneManager: sceneManagerRef.current,
    cameraController: cameraControllerRef.current,
    isReady,
  };
}

/**
 * Hook for animation loop using requestAnimationFrame
 * Automatically handles cleanup on unmount
 */
export function useAnimationLoop(
  callback: RenderCallback,
  enabled: boolean = true
): void {
  const requestRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number>(0);
  const startTimeRef = useRef<number>(performance.now());

  const animate = useCallback(
    (time: number) => {
      if (!enabled) return;

      const deltaTime = time - previousTimeRef.current;
      const elapsedTime = time - startTimeRef.current;

      previousTimeRef.current = time;

      // Call user callback with delta and elapsed time
      callback(deltaTime / 1000, elapsedTime / 1000); // Convert to seconds

      requestRef.current = requestAnimationFrame(animate);
    },
    [callback, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    startTimeRef.current = performance.now();
    previousTimeRef.current = performance.now();
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [animate, enabled]);
}

/**
 * Hook for performance monitoring
 * Returns performance stats and monitor instance
 */
export function usePerformanceStats(renderer?: THREE.WebGLRenderer) {
  const [stats, setStats] = useState<RenderStats>({
    fps: 0,
    frameTime: 0,
    drawCalls: 0,
    triangles: 0,
    textures: 0,
    geometries: 0,
    timestamp: 0,
  });

  const monitorRef = useRef<PerformanceMonitor | null>(null);

  useEffect(() => {
    // Initialize performance monitor
    const monitor = new PerformanceMonitor(renderer);
    monitorRef.current = monitor;

    // Update stats every second
    const intervalId = setInterval(() => {
      setStats(monitor.getStats());
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [renderer]);

  // Update monitor each frame (call this in animation loop)
  const update = useCallback(() => {
    monitorRef.current?.update();
  }, []);

  return {
    stats,
    monitor: monitorRef.current,
    update,
  };
}

/**
 * Complete Three.js renderer hook with scene, camera, and animation loop
 * One-stop solution for rendering
 */
export function useRenderer(config: SceneConfig, renderCallback?: RenderCallback) {
  const { canvasRef, sceneManager, cameraController, isReady } = useThreeScene(config);
  const { stats, update: updatePerformance } = usePerformanceStats(sceneManager?.renderer);

  // Main render loop
  useAnimationLoop((deltaTime, elapsedTime) => {
    if (!sceneManager || !cameraController) return;

    // Update performance monitor
    updatePerformance();

    // Call user render callback
    renderCallback?.(deltaTime, elapsedTime);

    // Render scene
    sceneManager.render(cameraController.camera);
  }, isReady);

  return {
    canvasRef,
    sceneManager,
    cameraController,
    stats,
    isReady,
  };
}

/**
 * Hook for mesh lifecycle management
 * Automatically adds mesh to scene and handles cleanup
 */
export function useMesh(
  createMesh: () => THREE.Object3D,
  scene: THREE.Scene | null,
  deps: React.DependencyList = []
): THREE.Object3D | null {
  const [mesh, setMesh] = useState<THREE.Object3D | null>(null);

  useEffect(() => {
    if (!scene) return;

    const newMesh = createMesh();
    scene.add(newMesh);
    setMesh(newMesh);

    return () => {
      scene.remove(newMesh);
      
      // Dispose geometry and material
      if (newMesh instanceof THREE.Mesh) {
        newMesh.geometry?.dispose();
        
        if (Array.isArray(newMesh.material)) {
          newMesh.material.forEach((mat) => mat.dispose());
        } else {
          newMesh.material?.dispose();
        }
      }
    };
  }, [scene, ...deps]);

  return mesh;
}

/**
 * Hook for custom render loop with full control
 * Use when you need more control than useAnimationLoop provides
 */
export function useCustomRenderLoop(
  sceneManager: SceneManager | null,
  cameraController: CameraController | null,
  renderCallback: (scene: THREE.Scene, camera: THREE.Camera, deltaTime: number) => void
): void {
  useAnimationLoop((deltaTime) => {
    if (!sceneManager || !cameraController) return;

    renderCallback(sceneManager.scene, cameraController.camera, deltaTime);
    sceneManager.render(cameraController.camera);
  }, !!(sceneManager && cameraController));
}
