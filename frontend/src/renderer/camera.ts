/**
 * Camera Controller
 * Orthographic camera setup and utilities for isometric view
 */

import * as THREE from 'three';
import type { CameraConfig, ViewportConfig } from './types';

/**
 * Isometric camera angles (radians)
 */
const ISOMETRIC_ANGLES = {
  hades: {
    // Hades-style: 45° horizontal, ~35° vertical
    theta: Math.PI / 4, // 45° rotation around Y-axis
    phi: Math.atan(1 / Math.sqrt(2)), // ~35.26° from horizontal
    distance: 30,
  },
  classic: {
    // Classic isometric: 45° horizontal, 30° vertical
    theta: Math.PI / 4,
    phi: Math.PI / 6, // 30°
    distance: 30,
  },
  custom: {
    theta: 0,
    phi: 0,
    distance: 30,
  },
};

/**
 * Camera Controller
 * Manages orthographic camera for clean isometric perspective
 */
export class CameraController {
  private _camera: THREE.OrthographicCamera;
  private _frustumSize: number;
  private _zoom: number;
  private _target: THREE.Vector3;

  constructor(config: CameraConfig, viewport: ViewportConfig) {
    this._frustumSize = config.frustumSize;
    this._zoom = config.zoom ?? 1;
    this._target = config.target ?? new THREE.Vector3(0, 0, 0);

    // Create orthographic camera with proper frustum
    const aspect = viewport.aspectRatio;
    const frustum = this._frustumSize / 2;

    this._camera = new THREE.OrthographicCamera(
      -frustum * aspect, // left
      frustum * aspect,  // right
      frustum,           // top
      -frustum,          // bottom
      config.near ?? 0.1,
      config.far ?? 1000
    );

    // Set initial zoom
    this._camera.zoom = this._zoom;

    // Position camera based on isometric angle
    if (config.position) {
      this._camera.position.copy(config.position);
    } else {
      this.setIsometricView(config.isometricAngle ?? 'hades');
    }

    // Look at target
    this._camera.lookAt(this._target);
    this._camera.updateProjectionMatrix();
  }

  /**
   * Set camera to isometric view
   */
  public setIsometricView(angle: 'hades' | 'classic' | 'custom' = 'hades'): void {
    const { theta, phi, distance } = ISOMETRIC_ANGLES[angle];

    // Convert spherical coordinates to Cartesian
    const x = distance * Math.cos(phi) * Math.cos(theta);
    const y = distance * Math.sin(phi);
    const z = distance * Math.cos(phi) * Math.sin(theta);

    this._camera.position.set(x, y, z);
    this._camera.lookAt(this._target);
    this._camera.updateProjectionMatrix();
  }

  /**
   * Update camera frustum for viewport changes
   */
  public updateFrustum(viewport: ViewportConfig): void {
    const aspect = viewport.aspectRatio;
    const frustum = this._frustumSize / 2;

    this._camera.left = -frustum * aspect;
    this._camera.right = frustum * aspect;
    this._camera.top = frustum;
    this._camera.bottom = -frustum;

    this._camera.updateProjectionMatrix();
  }

  /**
   * Set zoom level
   */
  public setZoom(zoom: number): void {
    this._zoom = Math.max(0.1, Math.min(10, zoom)); // Clamp between 0.1 and 10
    this._camera.zoom = this._zoom;
    this._camera.updateProjectionMatrix();
  }

  /**
   * Get current zoom level
   */
  public getZoom(): number {
    return this._zoom;
  }

  /**
   * Zoom in
   */
  public zoomIn(delta: number = 0.1): void {
    this.setZoom(this._zoom + delta);
  }

  /**
   * Zoom out
   */
  public zoomOut(delta: number = 0.1): void {
    this.setZoom(this._zoom - delta);
  }

  /**
   * Set camera target (look-at point)
   */
  public setTarget(target: THREE.Vector3): void {
    this._target.copy(target);
    this._camera.lookAt(this._target);
  }

  /**
   * Get camera target
   */
  public getTarget(): THREE.Vector3 {
    return this._target.clone();
  }

  /**
   * Set camera position while maintaining look-at
   */
  public setPosition(position: THREE.Vector3): void {
    this._camera.position.copy(position);
    this._camera.lookAt(this._target);
    this._camera.updateProjectionMatrix();
  }

  /**
   * Get camera position
   */
  public getPosition(): THREE.Vector3 {
    return this._camera.position.clone();
  }

  /**
   * Pan camera (move target and position together)
   */
  public pan(deltaX: number, deltaY: number): void {
    // Calculate right and up vectors
    const right = new THREE.Vector3();
    const up = new THREE.Vector3();
    
    right.setFromMatrixColumn(this._camera.matrix, 0);
    up.setFromMatrixColumn(this._camera.matrix, 1);

    // Move target and camera
    const offset = right.multiplyScalar(deltaX).add(up.multiplyScalar(deltaY));
    
    this._target.add(offset);
    this._camera.position.add(offset);
  }

  /**
   * Rotate camera around target
   */
  public rotate(deltaTheta: number, deltaPhi: number): void {
    const offset = this._camera.position.clone().sub(this._target);
    
    // Convert to spherical coordinates
    const spherical = new THREE.Spherical();
    spherical.setFromVector3(offset);
    
    // Apply rotation
    spherical.theta += deltaTheta;
    spherical.phi = Math.max(0.01, Math.min(Math.PI - 0.01, spherical.phi + deltaPhi));
    
    // Convert back to Cartesian
    offset.setFromSpherical(spherical);
    this._camera.position.copy(this._target).add(offset);
    this._camera.lookAt(this._target);
    this._camera.updateProjectionMatrix();
  }

  /**
   * Get the Three.js camera instance
   */
  public get camera(): THREE.OrthographicCamera {
    return this._camera;
  }

  /**
   * Get frustum size
   */
  public get frustumSize(): number {
    return this._frustumSize;
  }

  /**
   * Set frustum size
   */
  public setFrustumSize(size: number): void {
    this._frustumSize = size;
    // Recalculate frustum with current aspect ratio
    const aspect = (this._camera.right - this._camera.left) / (this._camera.top - this._camera.bottom);
    const frustum = this._frustumSize / 2;
    
    this._camera.left = -frustum * aspect;
    this._camera.right = frustum * aspect;
    this._camera.top = frustum;
    this._camera.bottom = -frustum;
    
    this._camera.updateProjectionMatrix();
  }

  /**
   * Reset camera to initial position
   */
  public reset(config?: Partial<CameraConfig>): void {
    if (config?.zoom !== undefined) {
      this.setZoom(config.zoom);
    }

    if (config?.target) {
      this.setTarget(config.target);
    }

    if (config?.position) {
      this.setPosition(config.position);
    } else {
      this.setIsometricView(config?.isometricAngle ?? 'hades');
    }
  }
}

/**
 * Utility: Create orthographic camera for isometric view
 */
export function createIsometricCamera(
  config: CameraConfig,
  viewport: ViewportConfig
): CameraController {
  return new CameraController(config, viewport);
}

/**
 * Utility: Calculate camera position from spherical coordinates
 */
export function calculateIsometricPosition(
  distance: number,
  theta: number,
  phi: number
): THREE.Vector3 {
  const x = distance * Math.cos(phi) * Math.cos(theta);
  const y = distance * Math.sin(phi);
  const z = distance * Math.cos(phi) * Math.sin(theta);
  
  return new THREE.Vector3(x, y, z);
}

/**
 * Utility: Get default Hades-style camera config
 */
export function getHadesCameraConfig(frustumSize: number = 20): CameraConfig {
  return {
    type: 'orthographic',
    frustumSize,
    zoom: 1,
    position: calculateIsometricPosition(30, Math.PI / 4, Math.atan(1 / Math.sqrt(2))),
    target: new THREE.Vector3(0, 0, 0),
    near: 0.1,
    far: 1000,
    isometricAngle: 'hades',
  };
}
