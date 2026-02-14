/**
 * 3D Model Generation for Entities
 * Agent Arena 3D Roguelike
 */

import * as THREE from 'three';
import {
  EntityType,
  EntityModel,
  AnimationState,
  ENTITY_COLORS,
  DEFAULT_HITBOXES,
  AnimationClip,
} from './types';

/**
 * Factory for creating entity 3D models
 */
export class EntityModelFactory {
  private static materialCache = new Map<number, THREE.MeshPhongMaterial>();

  /**
   * Get or create a material for a given color
   */
  private static getMaterial(color: number, emissive: number = 0x000000): THREE.MeshPhongMaterial {
    const key = color * 1000 + emissive;
    if (!this.materialCache.has(key)) {
      this.materialCache.set(
        key,
        new THREE.MeshPhongMaterial({
          color,
          emissive,
          emissiveIntensity: emissive > 0 ? 0.3 : 0,
          flatShading: true,
        })
      );
    }
    return this.materialCache.get(key)!;
  }

  /**
   * Create a model for any entity type
   */
  static createModel(type: EntityType, scale: number = 1): EntityModel {
    switch (type) {
      case EntityType.PLAYER:
        return this.createPlayerModel(scale);
      case EntityType.GOBLIN:
      case EntityType.ORC:
      case EntityType.SKELETON:
      case EntityType.ZOMBIE:
      case EntityType.SPIDER:
      case EntityType.ORC_WARRIOR:
      case EntityType.SKELETON_KNIGHT:
      case EntityType.DARK_MAGE:
      case EntityType.BOSS_GOBLIN_KING:
      case EntityType.BOSS_LICH:
      case EntityType.BOSS_DRAGON:
        return this.createEnemyModel(type, scale);
      case EntityType.NPC:
        return this.createNPCModel(scale);
      default:
        return this.createPlayerModel(scale);
    }
  }

  /**
   * Create player model - blue geometric character
   */
  static createPlayerModel(scale: number = 1): EntityModel {
    const group = new THREE.Group();
    const color = ENTITY_COLORS[EntityType.PLAYER];
    const material = this.getMaterial(color, 0x2244aa);

    // Body (cylinder)
    const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.35, 1.0, 8);
    const body = new THREE.Mesh(bodyGeometry, material);
    body.position.y = 0.5;
    body.castShadow = true;
    group.add(body);

    // Head (sphere)
    const headGeometry = new THREE.SphereGeometry(0.25, 8, 6);
    const head = new THREE.Mesh(headGeometry, material);
    head.position.y = 1.25;
    head.castShadow = true;
    group.add(head);

    // Eyes (white spheres)
    const eyeMaterial = this.getMaterial(0xffffff);
    const eyeGeometry = new THREE.SphereGeometry(0.05, 4, 4);
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.1, 1.3, 0.2);
    group.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.1, 1.3, 0.2);
    group.add(rightEye);

    // Arms
    const armGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 6);
    const leftArm = new THREE.Mesh(armGeometry, material);
    leftArm.position.set(-0.4, 0.7, 0);
    leftArm.rotation.z = 0.3;
    leftArm.castShadow = true;
    group.add(leftArm);
    const rightArm = new THREE.Mesh(armGeometry, material);
    rightArm.position.set(0.4, 0.7, 0);
    rightArm.rotation.z = -0.3;
    rightArm.castShadow = true;
    group.add(rightArm);

    // Legs
    const legGeometry = new THREE.CylinderGeometry(0.1, 0.08, 0.5, 6);
    const leftLeg = new THREE.Mesh(legGeometry, material);
    leftLeg.position.set(-0.15, 0, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);
    const rightLeg = new THREE.Mesh(legGeometry, material);
    rightLeg.position.set(0.15, 0, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);

    group.scale.setScalar(scale);
    group.name = 'player_model';

    return {
      mesh: group,
      animations: this.createBasicAnimations(),
      hitbox: DEFAULT_HITBOXES[EntityType.PLAYER],
      type: EntityType.PLAYER,
      scale,
    };
  }

  /**
   * Create enemy model based on type
   */
  static createEnemyModel(type: EntityType, scale: number = 1): EntityModel {
    const group = new THREE.Group();
    const color = ENTITY_COLORS[type];
    const isBoss = type.startsWith('boss_');
    const bossScale = isBoss ? 1.5 : 1.0;

    switch (type) {
      case EntityType.GOBLIN:
      case EntityType.BOSS_GOBLIN_KING:
        this.createGoblinMesh(group, color, bossScale);
        break;
      case EntityType.ORC:
      case EntityType.ORC_WARRIOR:
        this.createOrcMesh(group, color, type === EntityType.ORC_WARRIOR ? 1.2 : 1.0);
        break;
      case EntityType.SKELETON:
      case EntityType.SKELETON_KNIGHT:
        this.createSkeletonMesh(group, color, type === EntityType.SKELETON_KNIGHT ? 1.1 : 1.0);
        break;
      case EntityType.ZOMBIE:
        this.createZombieMesh(group, color);
        break;
      case EntityType.SPIDER:
        this.createSpiderMesh(group, color);
        break;
      case EntityType.DARK_MAGE:
        this.createMageMesh(group, color);
        break;
      case EntityType.BOSS_LICH:
        this.createLichMesh(group, color);
        break;
      case EntityType.BOSS_DRAGON:
        this.createDragonMesh(group, color);
        break;
      default:
        this.createGoblinMesh(group, color, 1.0);
    }

    group.scale.setScalar(scale);
    group.name = `${type}_model`;

    return {
      mesh: group,
      animations: this.createBasicAnimations(),
      hitbox: DEFAULT_HITBOXES[type],
      type,
      scale,
    };
  }

  /**
   * Create NPC model
   */
  static createNPCModel(scale: number = 1): EntityModel {
    const group = new THREE.Group();
    const color = ENTITY_COLORS[EntityType.NPC];
    const material = this.getMaterial(color, 0xaaaa44);

    // Simple humanoid shape with different proportions
    const bodyGeometry = new THREE.CylinderGeometry(0.25, 0.3, 0.9, 8);
    const body = new THREE.Mesh(bodyGeometry, material);
    body.position.y = 0.45;
    body.castShadow = true;
    group.add(body);

    const headGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const head = new THREE.Mesh(headGeometry, material);
    head.position.y = 1.1;
    head.castShadow = true;
    group.add(head);

    group.scale.setScalar(scale);
    group.name = 'npc_model';

    return {
      mesh: group,
      animations: this.createBasicAnimations(),
      hitbox: DEFAULT_HITBOXES[EntityType.NPC],
      type: EntityType.NPC,
      scale,
    };
  }

  // Enemy mesh creators

  private static createGoblinMesh(group: THREE.Group, color: number, scale: number) {
    const material = this.getMaterial(color);
    
    // Small, hunched body
    const bodyGeometry = new THREE.SphereGeometry(0.35 * scale, 8, 6);
    const body = new THREE.Mesh(bodyGeometry, material);
    body.position.y = 0.4 * scale;
    body.scale.y = 0.8;
    body.castShadow = true;
    group.add(body);

    // Large head
    const headGeometry = new THREE.SphereGeometry(0.3 * scale, 8, 6);
    const head = new THREE.Mesh(headGeometry, material);
    head.position.y = 0.8 * scale;
    head.castShadow = true;
    group.add(head);

    // Pointed ears
    const earGeometry = new THREE.ConeGeometry(0.08 * scale, 0.2 * scale, 4);
    const leftEar = new THREE.Mesh(earGeometry, material);
    leftEar.position.set(-0.25 * scale, 0.9 * scale, 0);
    leftEar.rotation.z = -Math.PI / 4;
    group.add(leftEar);
    const rightEar = leftEar.clone();
    rightEar.position.x = 0.25 * scale;
    rightEar.rotation.z = Math.PI / 4;
    group.add(rightEar);
  }

  private static createOrcMesh(group: THREE.Group, color: number, scale: number) {
    const material = this.getMaterial(color);
    
    // Muscular body
    const bodyGeometry = new THREE.CylinderGeometry(0.4 * scale, 0.5 * scale, 1.2 * scale, 8);
    const body = new THREE.Mesh(bodyGeometry, material);
    body.position.y = 0.6 * scale;
    body.castShadow = true;
    group.add(body);

    // Large square head
    const headGeometry = new THREE.BoxGeometry(0.4 * scale, 0.35 * scale, 0.35 * scale);
    const head = new THREE.Mesh(headGeometry, material);
    head.position.y = 1.4 * scale;
    head.castShadow = true;
    group.add(head);

    // Tusks
    const tuskMaterial = this.getMaterial(0xffffff);
    const tuskGeometry = new THREE.CylinderGeometry(0.03 * scale, 0.04 * scale, 0.15 * scale, 4);
    const leftTusk = new THREE.Mesh(tuskGeometry, tuskMaterial);
    leftTusk.position.set(-0.12 * scale, 1.3 * scale, 0.15 * scale);
    leftTusk.rotation.x = Math.PI / 6;
    group.add(leftTusk);
    const rightTusk = leftTusk.clone();
    rightTusk.position.x = 0.12 * scale;
    group.add(rightTusk);

    // Broad shoulders
    const shoulderGeometry = new THREE.BoxGeometry(0.9 * scale, 0.3 * scale, 0.4 * scale);
    const shoulders = new THREE.Mesh(shoulderGeometry, material);
    shoulders.position.y = 1.1 * scale;
    shoulders.castShadow = true;
    group.add(shoulders);
  }

  private static createSkeletonMesh(group: THREE.Group, color: number, scale: number) {
    const material = this.getMaterial(color);
    
    // Thin body (ribcage)
    const bodyGeometry = new THREE.CylinderGeometry(0.25 * scale, 0.2 * scale, 0.8 * scale, 8);
    const body = new THREE.Mesh(bodyGeometry, material);
    body.position.y = 0.5 * scale;
    body.castShadow = true;
    group.add(body);

    // Skull
    const headGeometry = new THREE.SphereGeometry(0.22 * scale, 8, 6);
    const head = new THREE.Mesh(headGeometry, material);
    head.position.y = 1.1 * scale;
    head.scale.y = 1.1;
    head.castShadow = true;
    group.add(head);

    // Eye sockets (dark)
    const eyeMaterial = this.getMaterial(0x000000);
    const eyeGeometry = new THREE.SphereGeometry(0.05 * scale, 4, 4);
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.08 * scale, 1.12 * scale, 0.18 * scale);
    group.add(leftEye);
    const rightEye = leftEye.clone();
    rightEye.position.x = 0.08 * scale;
    group.add(rightEye);

    // Spine
    const spineGeometry = new THREE.CylinderGeometry(0.04 * scale, 0.04 * scale, 0.6 * scale, 6);
    const spine = new THREE.Mesh(spineGeometry, material);
    spine.position.y = 0.3 * scale;
    group.add(spine);
  }

  private static createZombieMesh(group: THREE.Group, color: number) {
    const material = this.getMaterial(color);
    
    // Slouched body
    const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.35, 1.0, 8);
    const body = new THREE.Mesh(bodyGeometry, material);
    body.position.y = 0.5;
    body.rotation.x = 0.1; // Slight lean
    body.castShadow = true;
    group.add(body);

    // Drooping head
    const headGeometry = new THREE.SphereGeometry(0.23, 8, 6);
    const head = new THREE.Mesh(headGeometry, material);
    head.position.set(0, 1.15, 0.1);
    head.rotation.x = -0.2;
    head.castShadow = true;
    group.add(head);
  }

  private static createSpiderMesh(group: THREE.Group, color: number) {
    const material = this.getMaterial(color);
    
    // Body (two segments)
    const abdomenGeometry = new THREE.SphereGeometry(0.4, 8, 6);
    const abdomen = new THREE.Mesh(abdomenGeometry, material);
    abdomen.position.set(0, 0.3, -0.2);
    abdomen.scale.z = 1.3;
    abdomen.castShadow = true;
    group.add(abdomen);

    const thoraxGeometry = new THREE.SphereGeometry(0.25, 8, 6);
    const thorax = new THREE.Mesh(thoraxGeometry, material);
    thorax.position.set(0, 0.25, 0.3);
    thorax.castShadow = true;
    group.add(thorax);

    // 8 legs
    const legGeometry = new THREE.CylinderGeometry(0.04, 0.03, 0.5, 4);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const leg = new THREE.Mesh(legGeometry, material);
      leg.position.set(Math.cos(angle) * 0.3, 0.15, Math.sin(angle) * 0.3);
      leg.rotation.z = Math.cos(angle) * 0.8;
      leg.rotation.x = Math.sin(angle) * 0.8;
      group.add(leg);
    }

    // Eyes (glowing red)
    const eyeMaterial = this.getMaterial(0xff0000, 0xff0000);
    const eyeGeometry = new THREE.SphereGeometry(0.04, 4, 4);
    for (let i = 0; i < 4; i++) {
      const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      eye.position.set((i - 1.5) * 0.08, 0.3, 0.45);
      group.add(eye);
    }
  }

  private static createMageMesh(group: THREE.Group, color: number) {
    const material = this.getMaterial(color, 0x4422aa);
    
    // Robed body (cone)
    const bodyGeometry = new THREE.ConeGeometry(0.4, 1.2, 8);
    const body = new THREE.Mesh(bodyGeometry, material);
    body.position.y = 0.6;
    body.castShadow = true;
    group.add(body);

    // Hooded head
    const headGeometry = new THREE.SphereGeometry(0.2, 8, 6);
    const head = new THREE.Mesh(headGeometry, material);
    head.position.y = 1.35;
    head.castShadow = true;
    group.add(head);

    // Glowing orb
    const orbMaterial = this.getMaterial(0xaa44ff, 0xaa44ff);
    const orbGeometry = new THREE.SphereGeometry(0.12, 8, 8);
    const orb = new THREE.Mesh(orbGeometry, orbMaterial);
    orb.position.set(0.3, 1.0, 0.3);
    group.add(orb);
  }

  private static createLichMesh(group: THREE.Group, color: number) {
    const material = this.getMaterial(color, 0x8800aa);
    
    // Floating robed body
    const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.5, 1.5, 8);
    const body = new THREE.Mesh(bodyGeometry, material);
    body.position.y = 1.0;
    body.castShadow = true;
    group.add(body);

    // Skull head with crown
    const headMaterial = this.getMaterial(0xcccccc);
    const headGeometry = new THREE.SphereGeometry(0.3, 8, 6);
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.9;
    head.castShadow = true;
    group.add(head);

    // Crown
    const crownMaterial = this.getMaterial(0xffdd00);
    const crownGeometry = new THREE.CylinderGeometry(0.32, 0.28, 0.2, 8);
    const crown = new THREE.Mesh(crownGeometry, crownMaterial);
    crown.position.y = 2.1;
    group.add(crown);

    // Glowing eyes
    const eyeMaterial = this.getMaterial(0x00ff00, 0x00ff00);
    const eyeGeometry = new THREE.SphereGeometry(0.06, 4, 4);
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.1, 1.95, 0.25);
    group.add(leftEye);
    const rightEye = leftEye.clone();
    rightEye.position.x = 0.1;
    group.add(rightEye);
  }

  private static createDragonMesh(group: THREE.Group, color: number) {
    const material = this.getMaterial(color, 0xaa4400);
    
    // Large body
    const bodyGeometry = new THREE.BoxGeometry(1.5, 1.2, 2.5);
    const body = new THREE.Mesh(bodyGeometry, material);
    body.position.y = 1.0;
    body.castShadow = true;
    group.add(body);

    // Long neck
    const neckGeometry = new THREE.CylinderGeometry(0.4, 0.6, 1.5, 8);
    const neck = new THREE.Mesh(neckGeometry, material);
    neck.position.set(0, 1.8, 1.0);
    neck.rotation.x = -0.5;
    neck.castShadow = true;
    group.add(neck);

    // Head
    const headGeometry = new THREE.BoxGeometry(0.7, 0.6, 1.0);
    const head = new THREE.Mesh(headGeometry, material);
    head.position.set(0, 2.3, 1.8);
    head.castShadow = true;
    group.add(head);

    // Horns
    const hornMaterial = this.getMaterial(0x333333);
    const hornGeometry = new THREE.ConeGeometry(0.1, 0.4, 4);
    const leftHorn = new THREE.Mesh(hornGeometry, hornMaterial);
    leftHorn.position.set(-0.25, 2.65, 1.7);
    leftHorn.rotation.z = -0.3;
    group.add(leftHorn);
    const rightHorn = leftHorn.clone();
    rightHorn.position.x = 0.25;
    rightHorn.rotation.z = 0.3;
    group.add(rightHorn);

    // Wings
    const wingGeometry = new THREE.BoxGeometry(1.5, 0.1, 1.0);
    const leftWing = new THREE.Mesh(wingGeometry, material);
    leftWing.position.set(-1.2, 1.2, 0);
    leftWing.rotation.y = -0.3;
    leftWing.castShadow = true;
    group.add(leftWing);
    const rightWing = leftWing.clone();
    rightWing.position.x = 1.2;
    rightWing.rotation.y = 0.3;
    group.add(rightWing);

    // Tail
    const tailGeometry = new THREE.ConeGeometry(0.4, 2.0, 8);
    const tail = new THREE.Mesh(tailGeometry, material);
    tail.position.set(0, 0.8, -2.0);
    tail.rotation.x = -Math.PI / 3;
    tail.castShadow = true;
    group.add(tail);
  }

  /**
   * Create basic animation clips
   */
  private static createBasicAnimations(): Map<AnimationState, AnimationClip> {
    const animations = new Map<AnimationState, AnimationClip>();

    animations.set(AnimationState.IDLE, {
      state: AnimationState.IDLE,
      duration: 2.0,
      loop: true,
    });

    animations.set(AnimationState.WALK, {
      state: AnimationState.WALK,
      duration: 1.0,
      loop: true,
    });

    animations.set(AnimationState.RUN, {
      state: AnimationState.RUN,
      duration: 0.6,
      loop: true,
    });

    animations.set(AnimationState.ATTACK, {
      state: AnimationState.ATTACK,
      duration: 0.5,
      loop: false,
    });

    animations.set(AnimationState.HIT, {
      state: AnimationState.HIT,
      duration: 0.3,
      loop: false,
    });

    animations.set(AnimationState.DEATH, {
      state: AnimationState.DEATH,
      duration: 1.5,
      loop: false,
    });

    return animations;
  }

  /**
   * Clean up cached materials
   */
  static dispose() {
    this.materialCache.forEach((material) => material.dispose());
    this.materialCache.clear();
  }
}
