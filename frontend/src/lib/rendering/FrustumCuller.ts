/**
 * FrustumCuller — Manual frustum + distance culling for particle systems
 * and other dynamic objects that Three.js auto-culling may miss
 * (e.g. Points with large bounding spheres, off-screen emitters).
 */

import * as THREE from 'three';

const _frustum = new THREE.Frustum();
const _projScreenMatrix = new THREE.Matrix4();
const _sphere = new THREE.Sphere();

export class FrustumCuller {
  private camera: THREE.Camera;
  private maxDistance: number;
  private cullTargets: Set<THREE.Object3D> = new Set();

  /**
   * @param camera Active camera
   * @param maxDistance Objects farther than this from the camera are hidden
   */
  constructor(camera: THREE.Camera, maxDistance: number = 50) {
    this.camera = camera;
    this.maxDistance = maxDistance;
  }

  /** Register an object for manual culling */
  add(obj: THREE.Object3D) {
    this.cullTargets.add(obj);
  }

  /** Unregister an object */
  remove(obj: THREE.Object3D) {
    this.cullTargets.delete(obj);
  }

  /** Call once per frame before render */
  update() {
    _projScreenMatrix.multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse
    );
    _frustum.setFromProjectionMatrix(_projScreenMatrix);

    const camPos = this.camera.position;

    for (const obj of this.cullTargets) {
      // Distance cull
      const dist = camPos.distanceTo(obj.position);
      if (dist > this.maxDistance) {
        obj.visible = false;
        continue;
      }

      // Frustum cull using bounding sphere
      if ((obj as any).geometry) {
        const geo = (obj as any).geometry as THREE.BufferGeometry;
        if (!geo.boundingSphere) geo.computeBoundingSphere();
        _sphere.copy(geo.boundingSphere!);
        _sphere.applyMatrix4(obj.matrixWorld);
        obj.visible = _frustum.intersectsSphere(_sphere);
      } else {
        // For Groups / non-geometry objects, test point in frustum
        obj.visible = _frustum.containsPoint(obj.position);
      }
    }
  }

  setMaxDistance(d: number) {
    this.maxDistance = d;
  }

  dispose() {
    this.cullTargets.clear();
  }
}
