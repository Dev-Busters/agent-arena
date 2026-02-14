/**
 * Light Animations - Dynamic light effects
 * Agent Arena 3D Roguelike - P2.6
 */

import * as THREE from 'three';
import { AnimationType, LightAnimationConfig, AnimatedLight } from './types';

/**
 * Light animator for creating dynamic light effects
 */
export class LightAnimator {
  private animatedLights: Map<string, AnimatedLight> = new Map();
  private time: number = 0;

  /**
   * Add a light with animation
   */
  public addLight(
    light: THREE.Light,
    animation: LightAnimationConfig,
    id?: string
  ): string {
    const lightId = id ?? light.uuid;
    
    const animatedLight: AnimatedLight = {
      light,
      animation,
      baseIntensity: light.intensity,
      baseColor: light.color.clone(),
      time: 0,
    };

    this.animatedLights.set(lightId, animatedLight);
    return lightId;
  }

  /**
   * Remove animated light
   */
  public removeLight(id: string): void {
    this.animatedLights.delete(id);
  }

  /**
   * Update all animated lights
   */
  public update(deltaTime: number): void {
    this.time += deltaTime;

    this.animatedLights.forEach(animatedLight => {
      if (!animatedLight.animation || !animatedLight.animation.enabled) {
        return;
      }

      animatedLight.time += deltaTime;

      switch (animatedLight.animation.type) {
        case AnimationType.FLICKER:
          this.updateFlicker(animatedLight, deltaTime);
          break;
        case AnimationType.PULSE:
          this.updatePulse(animatedLight, deltaTime);
          break;
        case AnimationType.STROBE:
          this.updateStrobe(animatedLight, deltaTime);
          break;
        case AnimationType.RAINBOW:
          this.updateRainbow(animatedLight, deltaTime);
          break;
      }
    });
  }

  /**
   * Flicker animation - Torch/flame effect
   */
  private updateFlicker(animatedLight: AnimatedLight, deltaTime: number): void {
    const config = animatedLight.animation!;
    const speed = config.speed ?? 1.0;
    const intensity = config.intensity ?? 0.3;

    // Multi-frequency noise for realistic flicker
    const flicker1 = Math.sin(animatedLight.time * speed * 3) * 0.5;
    const flicker2 = Math.sin(animatedLight.time * speed * 7) * 0.3;
    const flicker3 = Math.sin(animatedLight.time * speed * 13) * 0.2;
    const noise = Math.random() * 0.1;

    const combinedFlicker = (flicker1 + flicker2 + flicker3 + noise) * intensity;
    
    animatedLight.light.intensity = 
      animatedLight.baseIntensity * (1 + combinedFlicker);
  }

  /**
   * Pulse animation - Magical aura effect
   */
  private updatePulse(animatedLight: AnimatedLight, deltaTime: number): void {
    const config = animatedLight.animation!;
    const speed = config.speed ?? 1.0;
    const minIntensity = config.minIntensity ?? 0.5;
    const maxIntensity = config.maxIntensity ?? 1.5;

    // Smooth sine wave pulse
    const pulse = Math.sin(animatedLight.time * speed * Math.PI);
    const normalizedPulse = (pulse + 1) / 2; // 0 to 1

    animatedLight.light.intensity = 
      animatedLight.baseIntensity * 
      (minIntensity + normalizedPulse * (maxIntensity - minIntensity));
  }

  /**
   * Strobe animation - Alarm/danger effect
   */
  private updateStrobe(animatedLight: AnimatedLight, deltaTime: number): void {
    const config = animatedLight.animation!;
    const speed = config.speed ?? 2.0;
    const cycleTime = 1 / speed;
    const phase = (animatedLight.time % cycleTime) / cycleTime;

    // Sharp on/off
    if (phase < 0.5) {
      animatedLight.light.intensity = animatedLight.baseIntensity;
    } else {
      animatedLight.light.intensity = 0;
    }
  }

  /**
   * Rainbow animation - Treasure/magical effect
   */
  private updateRainbow(animatedLight: AnimatedLight, deltaTime: number): void {
    const config = animatedLight.animation!;
    const speed = config.speed ?? 1.0;

    if (config.colorRange && config.colorRange.length > 0) {
      // Cycle through provided colors
      const colorCount = config.colorRange.length;
      const cycleTime = 2 / speed;
      const phase = (animatedLight.time % cycleTime) / cycleTime;
      const colorIndex = Math.floor(phase * colorCount);
      const nextColorIndex = (colorIndex + 1) % colorCount;
      const localPhase = (phase * colorCount) % 1;

      const color1 = config.colorRange[colorIndex];
      const color2 = config.colorRange[nextColorIndex];

      animatedLight.light.color.lerpColors(color1, color2, localPhase);
    } else {
      // Default HSL rainbow
      const hue = (animatedLight.time * speed * 0.2) % 1;
      animatedLight.light.color.setHSL(hue, 1.0, 0.5);
    }
  }

  /**
   * Set animation for existing light
   */
  public setAnimation(id: string, animation: LightAnimationConfig): void {
    const animatedLight = this.animatedLights.get(id);
    if (!animatedLight) {
      console.warn(`LightAnimator: Light ${id} not found`);
      return;
    }

    animatedLight.animation = animation;
    animatedLight.time = 0;
  }

  /**
   * Enable/disable animation
   */
  public setEnabled(id: string, enabled: boolean): void {
    const animatedLight = this.animatedLights.get(id);
    if (!animatedLight || !animatedLight.animation) {
      return;
    }

    animatedLight.animation.enabled = enabled;

    if (!enabled) {
      // Reset to base values
      animatedLight.light.intensity = animatedLight.baseIntensity;
      animatedLight.light.color.copy(animatedLight.baseColor);
    }
  }

  /**
   * Get all animated lights
   */
  public getAnimatedLights(): Map<string, AnimatedLight> {
    return this.animatedLights;
  }

  /**
   * Clear all animations
   */
  public clear(): void {
    this.animatedLights.forEach(animatedLight => {
      animatedLight.light.intensity = animatedLight.baseIntensity;
      animatedLight.light.color.copy(animatedLight.baseColor);
    });
    this.animatedLights.clear();
  }

  /**
   * Dispose and cleanup
   */
  public dispose(): void {
    this.clear();
  }
}

/**
 * Preset animation configurations
 */
export const AnimationPresets = {
  torch: {
    type: AnimationType.FLICKER,
    speed: 1.0,
    intensity: 0.3,
    enabled: true,
  } as LightAnimationConfig,

  candle: {
    type: AnimationType.FLICKER,
    speed: 0.5,
    intensity: 0.4,
    enabled: true,
  } as LightAnimationConfig,

  magicAura: {
    type: AnimationType.PULSE,
    speed: 0.8,
    minIntensity: 0.6,
    maxIntensity: 1.4,
    enabled: true,
  } as LightAnimationConfig,

  alarm: {
    type: AnimationType.STROBE,
    speed: 3.0,
    enabled: true,
  } as LightAnimationConfig,

  treasure: {
    type: AnimationType.RAINBOW,
    speed: 0.5,
    colorRange: [
      new THREE.Color(0xffdd44),
      new THREE.Color(0xffaa44),
      new THREE.Color(0xff8844),
      new THREE.Color(0xffaa44),
    ],
    enabled: true,
  } as LightAnimationConfig,

  ethereal: {
    type: AnimationType.PULSE,
    speed: 0.4,
    minIntensity: 0.7,
    maxIntensity: 1.3,
    enabled: true,
  } as LightAnimationConfig,

  danger: {
    type: AnimationType.PULSE,
    speed: 2.0,
    minIntensity: 0.5,
    maxIntensity: 1.5,
    enabled: true,
  } as LightAnimationConfig,
};
