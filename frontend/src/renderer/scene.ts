/**
 * Scene Manager
 * Core Three.js scene initialization and management
 */

import * as THREE from 'three';
import type { SceneConfig, ViewportConfig, LightingConfig } from './types';

/**
 * SceneManager - Singleton class for managing Three.js scene
 * Handles scene, renderer, lighting setup, and lifecycle
 */
export class SceneManager {
  private static instance: SceneManager | null = null;
  
  private _scene: THREE.Scene;
  private _renderer: THREE.WebGLRenderer;
  private _canvas: HTMLCanvasElement | null = null;
  private _viewport: ViewportConfig;
  private _ambientLight: THREE.AmbientLight | null = null;
  private _directionalLight: THREE.DirectionalLight | null = null;
  private _isInitialized = false;

  private constructor() {
    this._scene = new THREE.Scene();
    this._renderer = new THREE.WebGLRenderer();
    this._viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
      aspectRatio: window.innerWidth / window.innerHeight,
      pixelRatio: window.devicePixelRatio || 1,
    };
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): SceneManager {
    if (!SceneManager.instance) {
      SceneManager.instance = new SceneManager();
    }
    return SceneManager.instance;
  }

  /**
   * Initialize scene with configuration
   */
  public initialize(config: SceneConfig): void {
    if (this._isInitialized) {
      console.warn('SceneManager already initialized. Reinitializing...');
      this.dispose();
    }

    try {
      // Setup renderer
      this._setupRenderer(config);

      // Setup scene background
      if (config.backgroundColor !== undefined) {
        this._scene.background = new THREE.Color(config.backgroundColor);
      }

      // Setup lighting
      this._setupLighting({
        ambientColor: 0xffffff,
        ambientIntensity: 0.6,
        directionalColor: 0xffffff,
        directionalIntensity: 0.8,
        directionalPosition: new THREE.Vector3(10, 20, 10),
        castShadows: config.enableShadows ?? true,
      });

      // Setup fog if enabled
      if (config.enableFog && config.fog) {
        this._setupFog(config.fog);
      }

      // Setup shadows
      if (config.enableShadows) {
        this._renderer.shadowMap.enabled = true;
        this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      }

      this._isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize SceneManager:', error);
      throw error;
    }
  }

  /**
   * Setup WebGL renderer
   */
  private _setupRenderer(config: SceneConfig): void {
    const rendererConfig = config.renderer;

    // Create or reuse canvas
    if (config.canvas) {
      this._canvas = config.canvas;
      this._renderer = new THREE.WebGLRenderer({
        canvas: this._canvas,
        antialias: rendererConfig.antialias ?? true,
        alpha: rendererConfig.alpha ?? false,
        powerPreference: rendererConfig.powerPreference ?? 'high-performance',
      });
    } else {
      this._renderer = new THREE.WebGLRenderer({
        antialias: rendererConfig.antialias ?? true,
        alpha: rendererConfig.alpha ?? false,
        powerPreference: rendererConfig.powerPreference ?? 'high-performance',
      });
      this._canvas = this._renderer.domElement;
    }

    // Configure renderer
    this._renderer.setPixelRatio(
      rendererConfig.pixelRatio ?? (window.devicePixelRatio || 1)
    );
    this._renderer.setSize(this._viewport.width, this._viewport.height);
    
    // Output color space (linear workflow)
    this._renderer.outputColorSpace = rendererConfig.outputColorSpace ?? THREE.SRGBColorSpace;
    
    // Tone mapping for better color reproduction
    this._renderer.toneMapping = rendererConfig.toneMapping ?? THREE.ACESFilmicToneMapping;
    this._renderer.toneMappingExposure = rendererConfig.toneMappingExposure ?? 1.0;

    // Note: Physically correct lighting is now the default in Three.js r155+
    // No need to set useLegacyLights (deprecated property)
  }

  /**
   * Setup scene lighting (Hades-style ambient + directional)
   */
  private _setupLighting(config: LightingConfig): void {
    // Ambient light for base illumination
    this._ambientLight = new THREE.AmbientLight(
      config.ambientColor ?? 0xffffff,
      config.ambientIntensity ?? 0.6
    );
    this._scene.add(this._ambientLight);

    // Directional light for main lighting (sun-like)
    this._directionalLight = new THREE.DirectionalLight(
      config.directionalColor ?? 0xffffff,
      config.directionalIntensity ?? 0.8
    );

    const pos = config.directionalPosition ?? new THREE.Vector3(10, 20, 10);
    this._directionalLight.position.set(pos.x, pos.y, pos.z);
    this._directionalLight.castShadow = config.castShadows ?? true;

    // Configure shadow map for better quality
    if (this._directionalLight.castShadow) {
      this._directionalLight.shadow.mapSize.width = 2048;
      this._directionalLight.shadow.mapSize.height = 2048;
      this._directionalLight.shadow.camera.near = 0.5;
      this._directionalLight.shadow.camera.far = 500;
      
      // Shadow camera frustum (adjust based on scene size)
      const d = 50;
      this._directionalLight.shadow.camera.left = -d;
      this._directionalLight.shadow.camera.right = d;
      this._directionalLight.shadow.camera.top = d;
      this._directionalLight.shadow.camera.bottom = -d;
    }

    this._scene.add(this._directionalLight);
  }

  /**
   * Setup fog
   */
  private _setupFog(fogConfig: { type: 'linear' | 'exponential'; color: number; near?: number; far?: number; density?: number }): void {
    if (fogConfig.type === 'linear') {
      this._scene.fog = new THREE.Fog(
        fogConfig.color,
        fogConfig.near ?? 10,
        fogConfig.far ?? 100
      );
    } else {
      this._scene.fog = new THREE.FogExp2(
        fogConfig.color,
        fogConfig.density ?? 0.01
      );
    }
  }

  /**
   * Handle viewport resize
   */
  public resize(width: number, height: number): void {
    this._viewport.width = width;
    this._viewport.height = height;
    this._viewport.aspectRatio = width / height;

    this._renderer.setSize(width, height);
  }

  /**
   * Render the scene with a camera
   */
  public render(camera: THREE.Camera): void {
    this._renderer.render(this._scene, camera);
  }

  /**
   * Get the Three.js scene
   */
  public get scene(): THREE.Scene {
    return this._scene;
  }

  /**
   * Get the WebGL renderer
   */
  public get renderer(): THREE.WebGLRenderer {
    return this._renderer;
  }

  /**
   * Get the canvas element
   */
  public get canvas(): HTMLCanvasElement | null {
    return this._canvas;
  }

  /**
   * Get current viewport configuration
   */
  public get viewport(): ViewportConfig {
    return { ...this._viewport };
  }

  /**
   * Get initialization status
   */
  public get isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * Dispose of all resources
   */
  public dispose(): void {
    // Remove lights
    if (this._ambientLight) {
      this._scene.remove(this._ambientLight);
      this._ambientLight = null;
    }

    if (this._directionalLight) {
      this._scene.remove(this._directionalLight);
      this._directionalLight = null;
    }

    // Dispose renderer
    this._renderer.dispose();

    // Clear scene
    this._scene.clear();

    this._isInitialized = false;
  }

  /**
   * Reset singleton instance (use with caution)
   */
  public static reset(): void {
    if (SceneManager.instance) {
      SceneManager.instance.dispose();
      SceneManager.instance = null;
    }
  }
}
