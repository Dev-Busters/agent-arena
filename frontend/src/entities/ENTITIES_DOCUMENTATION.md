# Entity System Documentation
## Agent Arena 3D Roguelike

### Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Entity Types](#entity-types)
3. [Animation System](#animation-system)
4. [Particle Effects](#particle-effects)
5. [Ragdoll Physics](#ragdoll-physics)
6. [React Integration](#react-integration)
7. [Performance Tips](#performance-tips)
8. [Code Examples](#code-examples)

---

## Architecture Overview

The entity system is built with a modular architecture consisting of:

- **Types** (`types.ts`) - Core type definitions and enums
- **Models** (`models.ts`) - Procedural 3D model generation
- **Animations** (`animations.ts`) - Animation controller with blending
- **Particles** (`particles.ts`) - Particle effect system with pooling
- **Ragdoll** (`ragdoll.ts`) - Simplified death physics
- **Hooks** (`useEntity.ts`) - React hooks for easy integration

### Key Design Principles

1. **Performance First**: Object pooling, material caching, optimized geometry
2. **Type Safety**: Full TypeScript typing throughout
3. **React Integration**: Hooks for seamless React component integration
4. **Modularity**: Each system is independent and reusable
5. **Extensibility**: Easy to add new entity types and animations

---

## Entity Types

### Available Entity Types

```typescript
enum EntityType {
  // Player
  PLAYER = 'player',
  
  // Common Enemies
  GOBLIN = 'goblin',
  ORC = 'orc',
  SKELETON = 'skeleton',
  ZOMBIE = 'zombie',
  SPIDER = 'spider',
  
  // Elite Enemies
  ORC_WARRIOR = 'orc_warrior',
  SKELETON_KNIGHT = 'skeleton_knight',
  DARK_MAGE = 'dark_mage',
  
  // Bosses
  BOSS_GOBLIN_KING = 'boss_goblin_king',
  BOSS_LICH = 'boss_lich',
  BOSS_DRAGON = 'boss_dragon',
  
  // Special
  NPC = 'npc',
}
```

### Entity Colors

Entities are color-coded for easy identification:
- **Player**: Blue (`0x4488ff`)
- **Goblin**: Green (`0x44ff44`)
- **Orc**: Red (`0xff4444`)
- **Skeleton**: Gray (`0xcccccc`)
- **Zombie**: Moss green (`0x668844`)
- **Spider**: Dark purple (`0x442288`)
- **Bosses**: Brighter, more saturated versions of base colors

### Creating Entity Models

```typescript
import { EntityModelFactory } from './entities';

// Create a player model
const playerModel = EntityModelFactory.createModel(EntityType.PLAYER, 1.0);
scene.add(playerModel.mesh);

// Create an enemy
const goblin = EntityModelFactory.createModel(EntityType.GOBLIN, 1.2);
scene.add(goblin.mesh);
```

---

## Animation System

### Animation States

```typescript
enum AnimationState {
  IDLE = 'idle',
  WALK = 'walk',
  RUN = 'run',
  ATTACK = 'attack',
  CAST = 'cast',
  HIT = 'hit',
  DEATH = 'death',
  VICTORY = 'victory',
  BLOCK = 'block',
}
```

### Animation Controller

The `AnimationController` handles smooth transitions between animation states:

```typescript
import { AnimationController } from './entities';

const controller = new AnimationController(entityModel);

// Play animation
controller.playAnimation(AnimationState.WALK);

// Update in game loop
function gameLoop(deltaTime: number) {
  controller.update(deltaTime);
}

// Check animation state
const currentState = controller.getCurrentState();
const isComplete = controller.isAnimationComplete();
```

### Animation Blending

Animations automatically blend smoothly over a configurable duration (default 0.2s):

```typescript
// Configure animation blending
const config: AnimationConfig = {
  blendDuration: 0.3, // 300ms blend
  defaultState: AnimationState.IDLE,
  loopStates: [AnimationState.IDLE, AnimationState.WALK],
  interruptible: [AnimationState.IDLE, AnimationState.WALK],
};

const controller = new AnimationController(entityModel, config);
```

### Animation Descriptions

- **IDLE**: Gentle bobbing and swaying
- **WALK**: Moderate bobbing with forward tilt
- **RUN**: Fast bobbing with aggressive lean
- **ATTACK**: Lunge forward with rotation
- **HIT**: Knockback with shake effect
- **DEATH**: Fall, rotate, and fade out

---

## Particle Effects

### Particle Effect Types

```typescript
enum ParticleEffectType {
  HIT = 'hit',
  DEATH = 'death',
  ABILITY_FIRE = 'ability_fire',
  ABILITY_ICE = 'ability_ice',
  ABILITY_LIGHTNING = 'ability_lightning',
  ABILITY_POISON = 'ability_poison',
  HEAL = 'heal',
  BUFF = 'buff',
  DEBUFF = 'debuff',
  LEVEL_UP = 'level_up',
}
```

### Particle Manager

```typescript
import { ParticleEffectManager } from './entities';

const particleManager = new ParticleEffectManager(scene);

// Create effects
particleManager.createHitEffect(new THREE.Vector3(0, 1, 0));
particleManager.createDeathEffect(enemyPosition);
particleManager.createAbilityEffect(
  ParticleEffectType.ABILITY_FIRE,
  castPosition
);

// Update in game loop
function gameLoop(deltaTime: number) {
  particleManager.update(deltaTime);
}
```

### Particle Pooling

The particle system uses object pooling for optimal performance:
- Default pool size: 100 particle systems
- Automatic recycling when effects complete
- No garbage collection pressure during gameplay

---

## Ragdoll Physics

### Ragdoll Controller

Simplified physics for dramatic death animations:

```typescript
import { RagdollController, createDeathImpulse } from './entities';

const ragdoll = new RagdollController(entityModel);

// Activate on death
const deathDirection = new THREE.Vector3(1, 0, 0);
const impulse = createDeathImpulse(deathDirection, 5.0);
ragdoll.activate(impulse);

// Update in game loop
function gameLoop(deltaTime: number) {
  ragdoll.update(deltaTime);
}

// Check state
if (ragdoll.isComplete()) {
  // Remove entity
}
```

### Ragdoll Features

- Realistic tumbling with angular velocity
- Ground collision and bouncing
- Automatic fade-out after 2 seconds
- Velocity damping and friction
- No physics engine required

---

## React Integration

### useEntity Hook

Complete entity lifecycle management:

```typescript
import { useEntity } from './entities';

function GameComponent() {
  const sceneRef = useRef<THREE.Scene>(null);
  
  const {
    entity,
    animationController,
    playAnimation,
    activateRagdoll,
    setPosition,
    remove,
  } = useEntity(
    sceneRef.current,
    EntityType.PLAYER,
    new THREE.Vector3(0, 0, 0)
  );

  // Control animation
  const handleMove = () => {
    playAnimation(AnimationState.WALK);
  };

  // Kill entity
  const handleDeath = () => {
    playAnimation(AnimationState.DEATH);
    activateRagdoll();
  };

  return <div>...</div>;
}
```

### useEntityAnimation Hook

Fine-grained animation control:

```typescript
const {
  currentState,
  playAnimation,
  isComplete,
} = useEntityAnimation(animationController, AnimationState.IDLE);

useEffect(() => {
  if (isComplete && currentState === AnimationState.ATTACK) {
    // Attack animation finished
    playAnimation(AnimationState.IDLE);
  }
}, [isComplete, currentState]);
```

### useParticleEffect Hook

Particle effect management:

```typescript
const {
  createHitEffect,
  createDeathEffect,
  createAbilityEffect,
  activeEffectCount,
} = useParticleEffect(particleManager);

// Spawn effect
const handleDamage = (position: THREE.Vector3) => {
  createHitEffect(position);
};
```

### useEntityManager Hook

Manage multiple entities:

```typescript
const {
  entities,
  spawnEntity,
  removeEntity,
  clearAll,
} = useEntityManager(scene, [
  {
    type: EntityType.GOBLIN,
    position: new THREE.Vector3(5, 0, 0),
    rotation: Math.PI / 2,
  },
  {
    type: EntityType.ORC,
    position: new THREE.Vector3(-5, 0, 0),
  },
]);

// Spawn new entity
spawnEntity('enemy_1', {
  type: EntityType.SKELETON,
  position: new THREE.Vector3(0, 0, 5),
});

// Remove entity
removeEntity('enemy_1');
```

---

## Performance Tips

### Optimization Best Practices

1. **Material Caching**: Materials are automatically cached and reused
2. **Particle Pooling**: Use the built-in particle pool, don't create new instances
3. **Animation Updates**: Only update visible entities
4. **Geometry Reuse**: Models reuse geometries through the factory pattern
5. **Batch Spawning**: Spawn entities in batches, not one per frame

### Performance Monitoring

```typescript
// Check active particles
const particleCount = particleManager.getActiveEffectCount();
console.log(`Active particles: ${particleCount}`);

// Monitor entity count
console.log(`Total entities: ${entities.size}`);
```

### Recommended Limits

- **Entities**: 50-100 active entities for 60 FPS
- **Particles**: 20-30 active particle systems
- **Animations**: All entities can animate simultaneously

### Optimization Example

```typescript
// Good: Update only nearby entities
entities.forEach((entity, id) => {
  const distance = entity.mesh.position.distanceTo(playerPosition);
  if (distance < 20) {
    animationControllers.get(id)?.update(deltaTime);
  }
});

// Bad: Update all entities always
entities.forEach((entity, id) => {
  animationControllers.get(id)?.update(deltaTime);
});
```

---

## Code Examples

### Example 1: Simple Player Setup

```typescript
import { useEntity, AnimationState, EntityType } from './entities';
import * as THREE from 'three';

function Player() {
  const sceneRef = useRef<THREE.Scene>(null);
  const position = new THREE.Vector3(0, 0, 0);

  const { playAnimation, setPosition } = useEntity(
    sceneRef.current,
    EntityType.PLAYER,
    position
  );

  useEffect(() => {
    // Start with idle animation
    playAnimation(AnimationState.IDLE);
  }, []);

  const handleKeyPress = (key: string) => {
    if (key === 'w') {
      playAnimation(AnimationState.WALK);
      setPosition(new THREE.Vector3(0, 0, 1));
    }
  };

  return <div onKeyDown={e => handleKeyPress(e.key)} />;
}
```

### Example 2: Enemy with AI

```typescript
import { useEntity, AnimationState, EntityType } from './entities';

function Enemy({ enemyType, spawnPosition }: Props) {
  const sceneRef = useRef<THREE.Scene>(null);
  const [isDead, setIsDead] = useState(false);

  const {
    entity,
    playAnimation,
    activateRagdoll,
    remove,
  } = useEntity(sceneRef.current, enemyType, spawnPosition);

  const handleDamage = (damage: number) => {
    if (isDead) return;
    
    playAnimation(AnimationState.HIT, false);
    
    // Check if dead
    if (currentHealth <= 0) {
      handleDeath();
    }
  };

  const handleDeath = () => {
    setIsDead(true);
    playAnimation(AnimationState.DEATH, false);
    activateRagdoll(new THREE.Vector3(1, 2, 0));
    
    // Remove after 2 seconds
    setTimeout(() => remove(), 2000);
  };

  return null;
}
```

### Example 3: Combat System with Particles

```typescript
import {
  useEntity,
  useParticleEffect,
  ParticleEffectType,
  AnimationState,
} from './entities';

function CombatSystem() {
  const sceneRef = useRef<THREE.Scene>(null);
  const particleManagerRef = useRef<ParticleEffectManager>(null);

  const { playAnimation: playPlayerAnim } = useEntity(
    sceneRef.current,
    EntityType.PLAYER,
    playerPosition
  );

  const { createHitEffect, createAbilityEffect } = useParticleEffect(
    particleManagerRef.current
  );

  const performAttack = (target: THREE.Vector3) => {
    // Play attack animation
    playPlayerAnim(AnimationState.ATTACK, false);
    
    // Spawn particle effect
    setTimeout(() => {
      createHitEffect(target);
    }, 250); // Sync with animation
  };

  const castFireball = (target: THREE.Vector3) => {
    playPlayerAnim(AnimationState.CAST, false);
    
    setTimeout(() => {
      createAbilityEffect(ParticleEffectType.ABILITY_FIRE, target);
    }, 300);
  };

  return <div>...</div>;
}
```

### Example 4: Full Game Scene

```typescript
import {
  useEntityManager,
  useParticleEffect,
  EntityType,
  AnimationState,
  ParticleEffectType,
} from './entities';

function GameScene() {
  const sceneRef = useRef<THREE.Scene>(null);
  const particleManagerRef = useRef(
    new ParticleEffectManager(sceneRef.current!)
  );

  const {
    entities,
    spawnEntity,
    removeEntity,
  } = useEntityManager(sceneRef.current, [
    // Spawn initial player
    {
      type: EntityType.PLAYER,
      position: new THREE.Vector3(0, 0, 0),
      animationState: AnimationState.IDLE,
    },
    // Spawn enemies
    {
      type: EntityType.GOBLIN,
      position: new THREE.Vector3(5, 0, 5),
      animationState: AnimationState.WALK,
    },
    {
      type: EntityType.ORC,
      position: new THREE.Vector3(-5, 0, 5),
      animationState: AnimationState.IDLE,
    },
    {
      type: EntityType.SKELETON,
      position: new THREE.Vector3(0, 0, 10),
      animationState: AnimationState.WALK,
    },
  ]);

  const { createDeathEffect } = useParticleEffect(
    particleManagerRef.current
  );

  const handleEnemyDeath = (entityId: string, position: THREE.Vector3) => {
    createDeathEffect(position);
    setTimeout(() => removeEntity(entityId), 2000);
  };

  return (
    <Canvas>
      <primitive object={sceneRef.current} />
    </Canvas>
  );
}
```

---

## Advanced Usage

### Custom Animation Configurations

```typescript
const bossAnimConfig: AnimationConfig = {
  blendDuration: 0.5, // Slower, more dramatic blends
  defaultState: AnimationState.IDLE,
  loopStates: [AnimationState.IDLE],
  interruptible: [], // Boss animations can't be interrupted
};

const controller = new AnimationController(bossEntity, bossAnimConfig);
```

### Custom Particle Effects

```typescript
const customConfig: ParticleEffectConfig = {
  type: ParticleEffectType.ABILITY_FIRE,
  particleCount: 100,
  lifetime: 2.0,
  speed: 5.0,
  spread: 2.0,
  color: new THREE.Color(0xff00ff),
  size: 0.3,
  gravity: false,
  fadeOut: true,
};

// Use via manager's internal API (not exposed via hooks)
```

---

## Troubleshooting

### Common Issues

1. **Entities not visible**: Ensure scene is properly initialized before creating entities
2. **Animations not playing**: Call `controller.update(deltaTime)` in game loop
3. **Particles not appearing**: Verify ParticleEffectManager is created with valid scene
4. **Performance issues**: Reduce entity count or particle count

### Debug Tips

```typescript
// Log animation state
console.log('Current animation:', controller.getCurrentState());

// Check particle count
console.log('Active particles:', particleManager.getActiveEffectCount());

// Verify entity position
console.log('Entity position:', entity.mesh.position);
```

---

## Future Enhancements

Planned improvements:
- Skeletal animation support
- GLTF model loading
- Custom animation keyframes
- Advanced particle behaviors
- Physics-based ragdoll (optional)

---

**Version**: 1.0.0  
**Last Updated**: February 2026  
**Maintainer**: Agent Arena Development Team
