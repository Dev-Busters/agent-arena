/**
 * RendererSetup — Creates and configures a WebGLRenderer based on QualitySettings.
 * Centralises all renderer configuration so scenes stay consistent.
 */

import * as THREE from 'three';
import { getQualitySettings, type QualitySettings } from './QualityTier';

export interface RendererOptions {
  container: HTMLElement;
  qualityOverride?: QualitySettings;
  /** Use an existing canvas instead of creating one */
  canvas?: HTMLCanvasElement;
}

export function configureRenderer(opts: RendererOptions): {
  renderer: THREE.WebGLRenderer;
  quality: QualitySettings;
} {
  const quality = opts.qualityOverride ?? getQualitySettings();

  const renderer = new THREE.WebGLRenderer({
    canvas: opts.canvas,
    antialias: quality.antialias,
    powerPreference: quality.tier === 'low' ? 'low-power' : 'high-performance',
    alpha: false,
  });

  const width = opts.container.clientWidth;
  const height = opts.container.clientHeight;

  renderer.setSize(width, height);
  renderer.setPixelRatio(quality.pixelRatio);

  if (quality.shadows) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type =
      quality.tier === 'high' ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
  } else {
    renderer.shadowMap.enabled = false;
  }

  // Tone mapping for consistent look
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  return { renderer, quality };
}
