/**
 * InstancedDungeon — Batches repeated dungeon geometry into instanced draw calls.
 *
 * Instead of N separate Mesh objects for walls (4+ draw calls per room),
 * we use InstancedMesh to render all walls in 1 call, all floors in 1 call, etc.
 * This drastically reduces draw call count for multi-room dungeons.
 */

import * as THREE from 'three';
import { AssetCache } from './AssetCache';
import { getQualitySettings } from './QualityTier';

export interface DungeonLayout {
  rooms: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

interface InstancedGroup {
  walls: THREE.InstancedMesh;
  floors: THREE.InstancedMesh;
  torchLights: THREE.PointLight[];
}

const _mat4 = new THREE.Matrix4();
const _pos = new THREE.Vector3();
const _scale = new THREE.Vector3();
const _quat = new THREE.Quaternion();

/**
 * Build an optimized instanced representation of a dungeon layout.
 * Returns a THREE.Group you can add to a scene.
 */
export function buildInstancedDungeon(
  layout: DungeonLayout,
  scene: THREE.Scene
): THREE.Group {
  const cache = AssetCache.getInstance();
  const quality = getQualitySettings();
  const group = new THREE.Group();
  group.name = 'instanced-dungeon';

  // ── Collect wall transforms ────────────────────────────────
  // Each room has 4 walls; we batch them into a single InstancedMesh.
  const wallTransforms: THREE.Matrix4[] = [];
  const floorTransforms: THREE.Matrix4[] = [];
  const torchPositions: THREE.Vector3[] = [];

  for (const room of layout.rooms) {
    const cx = room.x + room.width / 2;
    const cy = room.y + room.height / 2;

    // Floor
    _mat4.identity();
    _pos.set(cx, 0, cy);
    _scale.set(room.width, 1, room.height);
    _quat.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
    _mat4.compose(_pos, _quat, _scale);
    floorTransforms.push(_mat4.clone());

    // North wall
    _mat4.identity();
    _pos.set(cx, 1.5, room.y);
    _scale.set(room.width, 3, 0.2);
    _quat.identity();
    _mat4.compose(_pos, _quat, _scale);
    wallTransforms.push(_mat4.clone());

    // South wall
    _pos.set(cx, 1.5, room.y + room.height);
    _mat4.compose(_pos, _quat, _scale);
    wallTransforms.push(_mat4.clone());

    // East wall
    _pos.set(room.x + room.width, 1.5, cy);
    _scale.set(0.2, 3, room.height);
    _mat4.compose(_pos, _quat, _scale);
    wallTransforms.push(_mat4.clone());

    // West wall
    _pos.set(room.x, 1.5, cy);
    _mat4.compose(_pos, _quat, _scale);
    wallTransforms.push(_mat4.clone());

    // Torch positions (corners — limited by quality)
    const corners = [
      new THREE.Vector3(room.x + 0.5, 2.2, room.y + 0.5),
      new THREE.Vector3(room.x + room.width - 0.5, 2.2, room.y + 0.5),
      new THREE.Vector3(room.x + 0.5, 2.2, room.y + room.height - 0.5),
      new THREE.Vector3(room.x + room.width - 0.5, 2.2, room.y + room.height - 0.5),
    ];
    const maxTorches = Math.min(corners.length, quality.maxPointLights);
    for (let i = 0; i < maxTorches; i++) {
      torchPositions.push(corners[i]);
    }
  }

  // ── Instanced Walls ───────────────────────────────────────
  const wallGeo = cache.getGeometry('unit-box', () => new THREE.BoxGeometry(1, 1, 1));
  const wallMat = cache.getMaterial('dungeon-wall', () =>
    new THREE.MeshStandardMaterial({ color: 0x3a3a5e, roughness: 0.8 })
  );
  const wallMesh = new THREE.InstancedMesh(wallGeo, wallMat, wallTransforms.length);
  wallMesh.castShadow = quality.shadows;
  wallMesh.receiveShadow = quality.shadows;
  for (let i = 0; i < wallTransforms.length; i++) {
    wallMesh.setMatrixAt(i, wallTransforms[i]);
  }
  wallMesh.instanceMatrix.needsUpdate = true;
  group.add(wallMesh);

  // ── Instanced Floors ──────────────────────────────────────
  const floorGeo = cache.getGeometry('unit-plane', () => new THREE.PlaneGeometry(1, 1));
  const floorMat = cache.getMaterial('dungeon-floor', () =>
    new THREE.MeshStandardMaterial({ color: 0x2a2a4e, roughness: 0.7 })
  );
  const floorMesh = new THREE.InstancedMesh(floorGeo, floorMat, floorTransforms.length);
  floorMesh.receiveShadow = quality.shadows;
  for (let i = 0; i < floorTransforms.length; i++) {
    floorMesh.setMatrixAt(i, floorTransforms[i]);
  }
  floorMesh.instanceMatrix.needsUpdate = true;
  group.add(floorMesh);

  // ── Torch Point Lights (capped by quality) ────────────────
  for (const pos of torchPositions) {
    const light = new THREE.PointLight(0xff6600, 0.6, 6);
    light.position.copy(pos);
    group.add(light);
  }

  return group;
}

/**
 * Efficiently update torch flicker for an instanced dungeon group.
 * Call once per frame.
 */
export function flickerTorches(dungeonGroup: THREE.Group) {
  dungeonGroup.traverse((child) => {
    if (child instanceof THREE.PointLight && child.color.getHex() === 0xff6600) {
      child.intensity = 0.5 + Math.random() * 0.3;
    }
  });
}
