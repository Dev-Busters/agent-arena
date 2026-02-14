/**
 * Post-Processing Composer Manager
 * Agent Arena 3D Roguelike - P2.5
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader';
import { BloomEffect } from './bloom';
import { DepthOfFieldEffect } from './depthOfField';
import { MotionBlurEffect } from './motionBlur';
import { FilmGrainEffect } from './filmGrain';
import { ChromaticAberrationEffect } from './chromaticAberration';
import type { PostProcessingConfig, EffectPreset } from './types';
import { EFFECT_PRESETS } from './types';

/**
 * Main post-processing composer that manages all effects
 */
export class PostProcessingComposer {
  private composer: EffectComposer;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private renderPass: RenderPass;
  private fxaaPass: ShaderPass;

  // Effects
  private bloomEffect?: BloomEffect;
  private depthOfFieldEffect?: DepthOfFieldEffect;
  private motionBlurEffect?: MotionBlurEffect;
  private filmGrainEffect?: FilmGrainEffect;
  private chromaticAberrationEffect?: ChromaticAberrationEffect;

  // State
  private config: PostProcessingConfig;
  private performanceMode: boolean = false;
  private fpsCounter: number[] = [];
  private lastFrameTime: number = Date.now();

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    config: PostProcessingConfig
  ) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.config = config;

    // Create effect composer
    this.composer = new EffectComposer(renderer);

    // Add render pass (always first)
    this.renderPass = new RenderPass(scene, camera);
    this.composer.addPass(this.renderPass);

    // Initialize effects based on config
    this.initializeEffects(config);

    // Add FXAA anti-aliasing (always last)
    this.fxaaPass = new ShaderPass(FXAAShader);
    const pixelRatio = renderer.getPixelRatio();
    const size = renderer.getSize(new THREE.Vector2());
    this.fxaaPass.material.uniforms['resolution'].value.set(
      1 / (size.width * pixelRatio),
      1 / (size.height * pixelRatio)
    );
    this.composer.addPass(this.fxaaPass);
  }

  /**
   * Initialize effects based on configuration
   */
  private initializeEffects(config: PostProcessingConfig): void {
    const size = this.renderer.getSize(new THREE.Vector2());

    // Bloom
    if (config.bloom) {
      this.bloomEffect = new BloomEffect(this.renderer, config.bloom);
      this.composer.addPass(this.bloomEffect.getPass());
    }

    // Depth of Field
    if (config.depthOfField) {
      this.depthOfFieldEffect = new DepthOfFieldEffect(
        this.scene,
        this.camera,
        config.depthOfField
      );
      this.composer.addPass(this.depthOfFieldEffect.getPass());
    }

    // Motion Blur
    if (config.motionBlur) {
      this.motionBlurEffect = new MotionBlurEffect(
        this.renderer,
        size.width,
        size.height,
        config.motionBlur
      );
      this.composer.addPass(this.motionBlurEffect.getPass());
    }

    // Film Grain
    if (config.filmGrain) {
      this.filmGrainEffect = new FilmGrainEffect(config.filmGrain);
      this.composer.addPass(this.filmGrainEffect.getPass());
    }

    // Chromatic Aberration
    if (config.chromaticAberration) {
      this.chromaticAberrationEffect = new ChromaticAberrationEffect(config.chromaticAberration);
      this.composer.addPass(this.chromaticAberrationEffect.getPass());
    }

    // Apply performance mode if set
    if (config.performanceMode) {
      this.setPerformanceMode(true);
    }
  }

  /**
   * Render the scene with post-processing
   */
  render(deltaTime?: number): void {
    if (!this.config.enabled) {
      // Render without post-processing
      this.renderer.render(this.scene, this.camera);
      return;
    }

    // Update effects that need per-frame updates
    if (this.depthOfFieldEffect) {
      this.depthOfFieldEffect.update();
    }

    if (this.motionBlurEffect && this.camera) {
      this.motionBlurEffect.updateVelocity(this.camera);
    }

    if (this.filmGrainEffect) {
      this.filmGrainEffect.update(deltaTime);
    }

    // Render with composer
    this.composer.render(deltaTime);

    // Track FPS for adaptive performance
    if (this.config.targetFPS) {
      this.trackFPS();
    }
  }

  /**
   * Track FPS and apply adaptive performance
   */
  private trackFPS(): void {
    const now = Date.now();
    const deltaTime = now - this.lastFrameTime;
    this.lastFrameTime = now;

    const fps = 1000 / deltaTime;
    this.fpsCounter.push(fps);

    // Keep last 60 frames
    if (this.fpsCounter.length > 60) {
      this.fpsCounter.shift();
    }

    // Calculate average FPS every 60 frames
    if (this.fpsCounter.length === 60) {
      const avgFPS = this.fpsCounter.reduce((a, b) => a + b, 0) / 60;
      const targetFPS = this.config.targetFPS || 60;

      // Adaptive bloom resolution
      if (this.bloomEffect) {
        this.bloomEffect.adaptiveResolution(avgFPS, targetFPS);
      }

      // Auto-enable performance mode if FPS is too low
      if (avgFPS < targetFPS * 0.7 && !this.performanceMode) {
        console.warn(`Low FPS detected (${avgFPS.toFixed(1)}), enabling performance mode`);
        this.setPerformanceMode(true);
      }
    }
  }

  /**
   * Apply effect preset
   */
  applyPreset(preset: EffectPreset): void {
    const presetConfig = EFFECT_PRESETS[preset];
    this.updateConfig(presetConfig);
  }

  /**
   * Update post-processing configuration
   */
  updateConfig(config: Partial<PostProcessingConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.bloom && this.bloomEffect) {
      this.bloomEffect.updateConfig(config.bloom);
    }

    if (config.depthOfField && this.depthOfFieldEffect) {
      this.depthOfFieldEffect.updateConfig(config.depthOfField);
    }

    if (config.motionBlur && this.motionBlurEffect) {
      this.motionBlurEffect.updateConfig(config.motionBlur);
    }

    if (config.filmGrain && this.filmGrainEffect) {
      this.filmGrainEffect.updateConfig(config.filmGrain);
    }

    if (config.chromaticAberration && this.chromaticAberrationEffect) {
      this.chromaticAberrationEffect.updateConfig(config.chromaticAberration);
    }

    if (config.enabled !== undefined) {
      this.config.enabled = config.enabled;
    }

    if (config.performanceMode !== undefined) {
      this.setPerformanceMode(config.performanceMode);
    }
  }

  /**
   * Enable/disable performance mode
   */
  setPerformanceMode(enabled: boolean): void {
    this.performanceMode = enabled;

    if (enabled) {
      // Disable expensive effects
      if (this.depthOfFieldEffect) {
        this.depthOfFieldEffect.setEnabled(false);
      }
      if (this.motionBlurEffect) {
        this.motionBlurEffect.setEnabled(false);
      }
      // Reduce bloom quality
      if (this.bloomEffect) {
        this.bloomEffect.updateConfig({ resolution: 0.5 });
      }
    } else {
      // Re-enable effects based on config
      if (this.depthOfFieldEffect && this.config.depthOfField) {
        this.depthOfFieldEffect.setEnabled(true);
      }
      if (this.motionBlurEffect && this.config.motionBlur) {
        this.motionBlurEffect.setEnabled(true);
      }
      if (this.bloomEffect && this.config.bloom) {
        this.bloomEffect.updateConfig({ resolution: this.config.bloom.resolution ?? 1.0 });
      }
    }
  }

  /**
   * Enable/disable specific effect
   */
  setEffectEnabled(effect: 'bloom' | 'dof' | 'motionBlur' | 'filmGrain' | 'ca', enabled: boolean): void {
    switch (effect) {
      case 'bloom':
        this.bloomEffect?.setEnabled(enabled);
        break;
      case 'dof':
        this.depthOfFieldEffect?.setEnabled(enabled);
        break;
      case 'motionBlur':
        this.motionBlurEffect?.setEnabled(enabled);
        break;
      case 'filmGrain':
        this.filmGrainEffect?.setEnabled(enabled);
        break;
      case 'ca':
        this.chromaticAberrationEffect?.setEnabled(enabled);
        break;
    }
  }

  /**
   * Get effect instances for direct control
   */
  getEffects() {
    return {
      bloom: this.bloomEffect,
      depthOfField: this.depthOfFieldEffect,
      motionBlur: this.motionBlurEffect,
      filmGrain: this.filmGrainEffect,
      chromaticAberration: this.chromaticAberrationEffect,
    };
  }

  /**
   * Resize handler
   */
  resize(width: number, height: number): void {
    this.composer.setSize(width, height);

    if (this.bloomEffect) {
      this.bloomEffect.resize(width, height);
    }

    if (this.motionBlurEffect) {
      this.motionBlurEffect.resize(width, height);
    }

    // Update FXAA resolution
    const pixelRatio = this.renderer.getPixelRatio();
    this.fxaaPass.material.uniforms['resolution'].value.set(
      1 / (width * pixelRatio),
      1 / (height * pixelRatio)
    );
  }

  /**
   * Get current configuration
   */
  getConfig(): PostProcessingConfig {
    return { ...this.config };
  }

  /**
   * Get average FPS
   */
  getAverageFPS(): number {
    if (this.fpsCounter.length === 0) return 60;
    return this.fpsCounter.reduce((a, b) => a + b, 0) / this.fpsCounter.length;
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.bloomEffect?.dispose();
    this.depthOfFieldEffect?.dispose();
    this.motionBlurEffect?.dispose();
    this.filmGrainEffect?.dispose();
    this.chromaticAberrationEffect?.dispose();
    this.composer.dispose();
  }
}
