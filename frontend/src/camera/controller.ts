/**
 * Main Camera Controller
 * Agent Arena 3D Roguelike - Phase 2.7
 */

import { Camera, OrthographicCamera, Vector3 } from 'three';
import {
  CameraConfig,
  CameraMode,
  ViewBounds,
  PanState,
  RotationState,
} from './types';

/**
 * Main camera controller for Agent Arena
 * Handles camera modes, zoom, pan, rotation, and bounds clamping
 */
export class CameraController {
  private camera: OrthographicCamera;
  private config: CameraConfig;
  private mode: CameraMode;
  private currentPosition: Vector3;
  private currentTarget: Vector3;
  private targetPosition: Vector3;
  private targetLookAt: Vector3;
  private currentZoom: number;
  private targetZoom: number;
  private panState: PanState;
  private rotationState: RotationState;
  private keysPressed: Set<string>;

  constructor(camera: OrthographicCamera, config: CameraConfig) {
    this.camera = camera;
    this.config = config;
    this.mode = config.mode;
    this.currentPosition = config.position.clone();
    this.currentTarget = config.target.clone();
    this.targetPosition = config.position.clone();
    this.targetLookAt = config.target.clone();
    this.currentZoom = config.zoom;
    this.targetZoom = config.zoom;
    this.keysPressed = new Set();

    // Initialize pan state
    this.panState = {
      enabled: false,
      isDragging: false,
      lastPointerPosition: { x: 0, y: 0 },
      sensitivity: 1.0,
    };

    // Initialize rotation state
    this.rotationState = {
      enabled: false,
      angle: 0,
      minAngle: -Math.PI / 4,
      maxAngle: Math.PI / 4,
      speed: 0.01,
    };

    // Apply initial camera setup
    this.updateCameraTransform();
  }

  /**
   * Update camera (call every frame)
   */
  public update(deltaTime: number): void {
    // Handle keyboard input for free camera mode
    if (this.mode === CameraMode.FREE) {
      this.handleKeyboardInput(deltaTime);
    }

    // Smooth interpolation for position
    if (this.config.enableDamping) {
      const lerpFactor = 1 - Math.pow(this.config.dampingFactor, deltaTime * 60);
      this.currentPosition.lerp(this.targetPosition, lerpFactor);
      this.currentTarget.lerp(this.targetLookAt, lerpFactor);
      this.currentZoom += (this.targetZoom - this.currentZoom) * lerpFactor;
    } else {
      this.currentPosition.copy(this.targetPosition);
      this.currentTarget.copy(this.targetLookAt);
      this.currentZoom = this.targetZoom;
    }

    // Apply bounds clamping
    if (this.config.bounds) {
      this.clampToBounds(this.currentPosition, this.config.bounds);
      this.clampToBounds(this.currentTarget, this.config.bounds);
    }

    // Update camera transform
    this.updateCameraTransform();
  }

  /**
   * Set camera mode
   */
  public setMode(mode: CameraMode): void {
    this.mode = mode;
    
    // Enable/disable controls based on mode
    this.panState.enabled = mode === CameraMode.FREE;
  }

  /**
   * Get current camera mode
   */
  public getMode(): CameraMode {
    return this.mode;
  }

  /**
   * Set target position (for follow mode or manual control)
   */
  public setTargetPosition(position: Vector3): void {
    this.targetPosition.copy(position);
  }

  /**
   * Set target look-at point
   */
  public setTargetLookAt(target: Vector3): void {
    this.targetLookAt.copy(target);
  }

  /**
   * Set zoom level
   */
  public setZoom(zoom: number): void {
    this.targetZoom = Math.max(
      this.config.minZoom,
      Math.min(this.config.maxZoom, zoom)
    );
  }

  /**
   * Zoom in/out by delta
   */
  public zoom(delta: number): void {
    this.setZoom(this.targetZoom + delta * this.config.zoomSpeed);
  }

  /**
   * Handle mouse wheel for zoom
   */
  public handleWheel(event: WheelEvent): void {
    event.preventDefault();
    const delta = -Math.sign(event.deltaY);
    this.zoom(delta);
  }

  /**
   * Handle mouse down for pan
   */
  public handlePointerDown(event: PointerEvent): void {
    // Right-click or middle-click for pan
    if ((event.button === 2 || event.button === 1) && this.panState.enabled) {
      this.panState.isDragging = true;
      this.panState.lastPointerPosition = { x: event.clientX, y: event.clientY };
      event.preventDefault();
    }
  }

  /**
   * Handle mouse move for pan
   */
  public handlePointerMove(event: PointerEvent): void {
    if (this.panState.isDragging && this.mode === CameraMode.FREE) {
      const deltaX = event.clientX - this.panState.lastPointerPosition.x;
      const deltaY = event.clientY - this.panState.lastPointerPosition.y;

      // Pan camera (adjust for orthographic zoom)
      const panSpeed = this.panState.sensitivity * this.currentZoom * 0.01;
      this.targetPosition.x -= deltaX * panSpeed;
      this.targetPosition.z += deltaY * panSpeed;
      this.targetLookAt.x -= deltaX * panSpeed;
      this.targetLookAt.z += deltaY * panSpeed;

      this.panState.lastPointerPosition = { x: event.clientX, y: event.clientY };
      event.preventDefault();
    }
  }

  /**
   * Handle mouse up for pan
   */
  public handlePointerUp(event: PointerEvent): void {
    if (event.button === 2 || event.button === 1) {
      this.panState.isDragging = false;
    }
  }

  /**
   * Handle keyboard down
   */
  public handleKeyDown(event: KeyboardEvent): void {
    this.keysPressed.add(event.key.toLowerCase());
  }

  /**
   * Handle keyboard up
   */
  public handleKeyUp(event: KeyboardEvent): void {
    this.keysPressed.delete(event.key.toLowerCase());
  }

  /**
   * Handle keyboard input for WASD movement
   */
  private handleKeyboardInput(deltaTime: number): void {
    if (this.mode !== CameraMode.FREE) return;

    const moveSpeed = 10 * this.currentZoom * deltaTime;

    if (this.keysPressed.has('w')) {
      this.targetPosition.z -= moveSpeed;
      this.targetLookAt.z -= moveSpeed;
    }
    if (this.keysPressed.has('s')) {
      this.targetPosition.z += moveSpeed;
      this.targetLookAt.z += moveSpeed;
    }
    if (this.keysPressed.has('a')) {
      this.targetPosition.x -= moveSpeed;
      this.targetLookAt.x -= moveSpeed;
    }
    if (this.keysPressed.has('d')) {
      this.targetPosition.x += moveSpeed;
      this.targetLookAt.x += moveSpeed;
    }
  }

  /**
   * Clamp position to view bounds
   */
  private clampToBounds(position: Vector3, bounds: ViewBounds): void {
    position.x = Math.max(bounds.minX, Math.min(bounds.maxX, position.x));
    position.y = Math.max(bounds.minY, Math.min(bounds.maxY, position.y));
    position.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, position.z));
  }

  /**
   * Update camera transform
   */
  private updateCameraTransform(): void {
    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.currentTarget);
    this.camera.zoom = this.currentZoom;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Get current camera position
   */
  public getPosition(): Vector3 {
    return this.currentPosition.clone();
  }

  /**
   * Get current look-at target
   */
  public getTarget(): Vector3 {
    return this.currentTarget.clone();
  }

  /**
   * Get current zoom level
   */
  public getZoom(): number {
    return this.currentZoom;
  }

  /**
   * Set view bounds
   */
  public setBounds(bounds: ViewBounds | undefined): void {
    this.config.bounds = bounds;
  }

  /**
   * Enable/disable pan controls
   */
  public setPanEnabled(enabled: boolean): void {
    this.panState.enabled = enabled;
  }

  /**
   * Set pan sensitivity
   */
  public setPanSensitivity(sensitivity: number): void {
    this.panState.sensitivity = sensitivity;
  }

  /**
   * Enable/disable rotation controls
   */
  public setRotationEnabled(enabled: boolean): void {
    this.rotationState.enabled = enabled;
  }

  /**
   * Rotate camera by angle (radians)
   */
  public rotate(angle: number): void {
    if (!this.rotationState.enabled) return;

    this.rotationState.angle = Math.max(
      this.rotationState.minAngle,
      Math.min(this.rotationState.maxAngle, this.rotationState.angle + angle)
    );

    // Apply rotation around target
    const offset = this.targetPosition.clone().sub(this.targetLookAt);
    const distance = offset.length();
    const currentAngle = Math.atan2(offset.z, offset.x);
    const newAngle = currentAngle + this.rotationState.angle;

    this.targetPosition.x = this.targetLookAt.x + Math.cos(newAngle) * distance;
    this.targetPosition.z = this.targetLookAt.z + Math.sin(newAngle) * distance;
  }

  /**
   * Reset camera to initial configuration
   */
  public reset(): void {
    this.targetPosition.copy(this.config.position);
    this.targetLookAt.copy(this.config.target);
    this.targetZoom = this.config.zoom;
    this.rotationState.angle = 0;
  }

  /**
   * Cleanup and remove event listeners
   */
  public dispose(): void {
    this.keysPressed.clear();
    this.panState.isDragging = false;
  }
}
