/**
 * Three.js Utilities for Battle Visualization
 * Models, effects, and scene management
 */

import * as THREE from 'three';

export const VISUAL_EFFECTS = {
  fire: { color: 0xff6b1a, emissive: 0xff4500 },
  ice: { color: 0x4dd0e1, emissive: 0x0097a7 },
  lightning: { color: 0xffeb3b, emissive: 0xffc107 },
  shadow: { color: 0x1a0033, emissive: 0x4a148c },
  arcane: { color: 0x9c27b0, emissive: 0x6a1b9a }
};

/**
 * Create a weapon model (sword, staff, bow, etc.)
 */
export function createWeaponModel(type: string = 'sword', effect?: string): THREE.Group {
  const group = new THREE.Group();

  const effectColor = effect ? VISUAL_EFFECTS[effect as keyof typeof VISUAL_EFFECTS] : { color: 0xc0c0c0, emissive: 0x404040 };

  // Blade/shaft geometry
  const bladeGeometry = new THREE.BoxGeometry(0.3, 2, 0.1);
  const bladeMaterial = new THREE.MeshStandardMaterial({
    color: effectColor.color,
    emissive: effectColor.emissive,
    metalness: 0.8,
    roughness: 0.2
  });
  const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
  blade.position.y = 0.5;
  group.add(blade);

  // Handle
  const handleGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.8);
  const handleMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b4513,
    metalness: 0.3,
    roughness: 0.4
  });
  const handle = new THREE.Mesh(handleGeometry, handleMaterial);
  handle.position.y = -0.4;
  group.add(handle);

  // Pommel
  const pommelGeometry = new THREE.SphereGeometry(0.2, 8, 8);
  const pommelMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    metalness: 0.9,
    roughness: 0.1
  });
  const pommel = new THREE.Mesh(pommelGeometry, pommelMaterial);
  pommel.position.y = -0.8;
  group.add(pommel);

  // Add glow for special effects
  if (effect) {
    const glowGeometry = new THREE.BoxGeometry(0.5, 2.5, 0.3);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: effectColor.color,
      transparent: true,
      opacity: 0.3
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.y = 0.5;
    group.add(glow);
  }

  return group;
}

/**
 * Create armor/character model
 */
export function createArmorModel(effect?: string): THREE.Group {
  const group = new THREE.Group();

  const effectColor = effect ? VISUAL_EFFECTS[effect as keyof typeof VISUAL_EFFECTS] : { color: 0xcccccc, emissive: 0x666666 };

  // Torso
  const torsoGeometry = new THREE.BoxGeometry(0.6, 1, 0.3);
  const torsoMaterial = new THREE.MeshStandardMaterial({
    color: effectColor.color,
    emissive: effectColor.emissive,
    metalness: 0.7,
    roughness: 0.3
  });
  const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
  torso.position.y = 0;
  group.add(torso);

  // Helmet
  const helmetGeometry = new THREE.SphereGeometry(0.35, 8, 8);
  const helmet = new THREE.Mesh(helmetGeometry, torsoMaterial);
  helmet.position.y = 0.75;
  group.add(helmet);

  // Legs
  const legGeometry = new THREE.BoxGeometry(0.4, 0.8, 0.3);
  const legMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    metalness: 0.5,
    roughness: 0.4
  });
  const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
  leftLeg.position.set(-0.15, -0.7, 0);
  const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
  rightLeg.position.set(0.15, -0.7, 0);
  group.add(leftLeg);
  group.add(rightLeg);

  return group;
}

/**
 * Create particle emitter for effects
 */
export function createParticleEmitter(effect: string, count: number = 50): THREE.Points {
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);

  const effectColor = VISUAL_EFFECTS[effect as keyof typeof VISUAL_EFFECTS] || { color: 0xffffff, emissive: 0xffffff };

  for (let i = 0; i < count; i++) {
    // Random position in sphere
    const r = Math.random() * 2;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    // Random velocity
    velocities[i * 3] = (Math.random() - 0.5) * 4;
    velocities[i * 3 + 1] = (Math.random() - 0.5) * 4;
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 4;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

  const material = new THREE.PointsMaterial({
    color: effectColor.color,
    size: 0.1,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true
  });

  const particles = new THREE.Points(geometry, material);
  (particles as any).velocities = velocities;

  return particles;
}

/**
 * Setup Three.js scene for battle
 */
export function setupBattleScene(canvas: HTMLCanvasElement): {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  cleanup: () => void;
} {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0e27);
  scene.fog = new THREE.Fog(0x0a0e27, 20, 50);

  const camera = new THREE.PerspectiveCamera(
    75,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    1000
  );
  camera.position.set(0, 1.5, 5);
  camera.lookAt(0, 1, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 10, 7);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  scene.add(directionalLight);

  // Ground
  const groundGeometry = new THREE.PlaneGeometry(20, 20);
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1f3a,
    metalness: 0.1,
    roughness: 0.8
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Handle window resize
  const handleResize = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  };

  window.addEventListener('resize', handleResize);

  const cleanup = () => {
    window.removeEventListener('resize', handleResize);
    renderer.dispose();
  };

  return { scene, camera, renderer, cleanup };
}

/**
 * Animate combat action
 */
export function animateCombatAction(
  model: THREE.Group,
  action: 'attack' | 'defend' | 'ability',
  duration: number = 500
): Promise<void> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const startPos = model.position.clone();
    const startRot = model.rotation.clone();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      if (action === 'attack') {
        // Forward thrust
        model.position.x = startPos.x + Math.sin(progress * Math.PI) * 1.5;
        model.rotation.z = Math.sin(progress * Math.PI) * 0.5;
      } else if (action === 'defend') {
        // Slight back and rotate shield
        model.position.x = startPos.x - Math.sin(progress * Math.PI) * 0.5;
        model.rotation.z = -Math.sin(progress * Math.PI) * 0.3;
      } else if (action === 'ability') {
        // Up and spin
        model.position.y = startPos.y + Math.sin(progress * Math.PI) * 1;
        model.rotation.y += progress * Math.PI * 2;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        model.position.copy(startPos);
        model.rotation.copy(startRot);
        resolve();
      }
    };

    animate();
  });
}

/**
 * Create floating damage number
 */
export function createDamageNumber(damage: number, color: number = 0xff4444): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
  ctx.font = 'bold 120px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(damage.toString(), 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(2, 2, 1);

  return sprite;
}
