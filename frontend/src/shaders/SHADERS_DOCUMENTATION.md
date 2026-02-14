# Agent Arena Shaders & Materials Documentation

## Overview

This shader system provides production-ready PBR materials, rarity glow effects, and stackable status effect shaders for the Agent Arena 3D roguelike. All shaders are optimized for 60 FPS performance.

## Architecture

```
shaders/
├── types.ts              # TypeScript type definitions
├── rarityGlow.ts         # Custom rarity glow shaders (GLSL)
├── normalMaps.ts         # Procedural normal map generation
├── pbr.ts                # PBR material factory
├── statusEffects.ts      # Status effect shaders (stackable)
├── useMaterial.ts        # React hooks for integration
└── index.ts              # Main exports
```

## Core Concepts

### 1. **PBR Materials**
Physically-based rendering materials for realistic lighting:
- Metal (swords, armor)
- Stone (walls, floors)
- Leather (belts, boots)
- Cloth (robes)
- Wood (bows, shields)
- Crystal (gems, magic items)

### 2. **Rarity Glow**
Animated edge glow effects for items based on rarity tier:
- 8 rarity tiers: Common → Uncommon → Rare → Epic → Legendary → Mythic → Ancient → Divine
- Color-coded glow (white → green → blue → purple → orange → pink → yellow → gold)
- Pulsating animation with bloom-friendly output

### 3. **Status Effects**
Shader-based visual effects for entity status:
- Frozen (ice blue overlay)
- Burning (fire particles + red glow)
- Poisoned (green pulsing)
- Stunned (yellow sparks)
- Blessed (golden aura)
- **Multiple effects can stack**

### 4. **Normal Maps**
Procedural normal map generation for surface detail without additional textures.

---

## Quick Start Examples

### Example 1: Create a Legendary Sword with PBR + Rarity Glow

```typescript
import { useItemMaterial } from './shaders/useMaterial';
import { Rarity, MaterialType } from './shaders/types';

function LegendarySword() {
  const { baseMaterial, glowMaterial } = useItemMaterial(
    Rarity.Legendary,
    {
      type: MaterialType.Metal,
      color: '#silver',
      roughness: 0.2,
    }
  );

  return (
    <group>
      {/* Base sword mesh */}
      <mesh geometry={swordGeometry} material={baseMaterial} />
      
      {/* Glow overlay (slightly larger to avoid z-fighting) */}
      <mesh 
        geometry={swordGeometry} 
        material={glowMaterial}
        scale={[1.02, 1.02, 1.02]}
      />
    </group>
  );
}
```

### Example 2: Apply Status Effects to an Enemy

```typescript
import { useStatusEffect } from './shaders/useMaterial';
import { StatusEffect } from './shaders/types';

function Enemy({ id }: { id: string }) {
  const { effectMeshes, addEffect, removeEffect } = useStatusEffect(
    id,
    enemyGeometry
  );

  useEffect(() => {
    // Apply frozen and poisoned effects simultaneously
    addEffect(StatusEffect.Frozen, 0.8);
    addEffect(StatusEffect.Poisoned, 0.6);

    // Remove frozen after 3 seconds
    setTimeout(() => removeEffect(StatusEffect.Frozen), 3000);
  }, []);

  return (
    <group>
      {/* Base enemy mesh */}
      <mesh geometry={enemyGeometry} material={enemyMaterial} />
      
      {/* Status effect overlays (auto-managed) */}
      {effectMeshes.map((mesh, i) => (
        <primitive key={i} object={mesh} />
      ))}
    </group>
  );
}
```

### Example 3: Create Stone Dungeon Walls with Procedural Normal Maps

```typescript
import { Materials } from './shaders/pbr';
import { usePBRMaterial } from './shaders/useMaterial';
import { MaterialType } from './shaders/types';

function DungeonWall() {
  const material = usePBRMaterial({
    type: MaterialType.Stone,
    color: '#666666',
    proceduralNormal: true,
    normalDetail: 2.5,
  });

  return <mesh geometry={wallGeometry} material={material} />;
}

// Or use the quick helper:
function DungeonWallSimple() {
  const material = Materials.stone('#666666');
  
  return <mesh geometry={wallGeometry} material={material} />;
}
```

### Example 4: Leather Armor with Custom Settings

```typescript
import { usePBRMaterial } from './shaders/useMaterial';
import { MaterialType } from './shaders/types';

function LeatherArmor() {
  const material = usePBRMaterial({
    type: MaterialType.Leather,
    color: new THREE.Color(0x8b4513), // Brown
    roughness: 0.7,
    normalScale: 1.2,
    proceduralNormal: true,
  });

  return <mesh geometry={armorGeometry} material={material} />;
}
```

### Example 5: Divine Crystal with Extreme Glow

```typescript
import { useRarityGlow, usePBRMaterial } from './shaders/useMaterial';
import { Rarity, MaterialType } from './shaders/types';

function DivineCrystal() {
  const baseMaterial = usePBRMaterial({
    type: MaterialType.Crystal,
    color: '#ffd700',
    metalness: 0.1,
    roughness: 0.05,
  });

  const { glowMaterial } = useRarityGlow(Rarity.Divine, {
    intensity: 1.0,
    speed: 2.5,
    pulseRange: [0.7, 1.0],
  });

  return (
    <group>
      <mesh geometry={crystalGeometry} material={baseMaterial} />
      <mesh 
        geometry={crystalGeometry} 
        material={glowMaterial}
        scale={1.05}
      />
    </group>
  );
}
```

---

## Performance Considerations

### Optimizations Built-In
1. **Material Caching**: PBR materials are cached by configuration to avoid duplicates
2. **Normal Map Caching**: Procedural normal maps are cached and reused
3. **Additive Blending**: Glow and status effects use additive blending for bloom
4. **Automatic Disposal**: React hooks handle material cleanup automatically

### Performance Tips
1. **Limit Status Effects**: Each status effect adds one shader overlay. Keep active effects under 3 per entity for best performance.
2. **Use Material Presets**: Leverage `Materials.metal()`, `Materials.stone()`, etc. for common cases
3. **Batch Similar Items**: Items with the same rarity can share glow materials
4. **Monitor Performance**: Use `useShaderPerformance()` hook to track active shader count

### Target Performance
- **60 FPS** with 50+ glowing items on screen
- **Multiple status effects** can stack without significant performance impact
- **Procedural normal maps** are generated once and cached

---

## API Reference

### Type Definitions (`types.ts`)

```typescript
enum Rarity {
  Common, Uncommon, Rare, Epic, Legendary, Mythic, Ancient, Divine
}

enum StatusEffect {
  Frozen, Burning, Poisoned, Stunned, Blessed
}

enum MaterialType {
  Metal, Stone, Leather, Cloth, Wood, Crystal
}
```

### React Hooks (`useMaterial.ts`)

#### `usePBRMaterial(config: MaterialConfig)`
Creates and manages a PBR material with automatic disposal.

#### `useRarityGlow(rarity: Rarity, config?: RarityGlowConfig)`
Creates a rarity glow shader material with auto-updating animation.

#### `useStatusEffect(entityId: string, geometry: BufferGeometry)`
Manages stackable status effects for an entity.

#### `useItemMaterial(rarity, materialConfig, glowConfig?)`
Convenience hook that creates both PBR material and rarity glow.

### Material Factory (`pbr.ts`)

```typescript
const material = pbrFactory.create(config);
const metal = pbrFactory.createMetal('#silver', 0.3);
const stone = pbrFactory.createStone();
const leather = pbrFactory.createLeather('#8b4513');
```

### Rarity Glow (`rarityGlow.ts`)

```typescript
const glowMaterial = createRarityGlowMaterial(Rarity.Legendary);
updateRarityGlow(glowMaterial, deltaTime);
```

### Status Effects (`statusEffects.ts`)

```typescript
statusEffectManager.addEffect(entityId, StatusEffect.Frozen);
statusEffectManager.removeEffect(entityId, StatusEffect.Frozen);
const meshes = statusEffectManager.createEffectOverlays(entityId, geometry);
```

---

## Advanced Usage

### Custom Shader Uniforms

You can extend shader materials with custom uniforms:

```typescript
const glowMaterial = createRarityGlowMaterial(Rarity.Mythic);
glowMaterial.uniforms.customParam = { value: 1.5 };
```

### Environment Mapping

Set a global environment map for all PBR materials:

```typescript
import { pbrFactory } from './shaders/pbr';

const envMap = new THREE.TextureLoader().load('/envmap.hdr');
envMap.mapping = THREE.EquirectangularReflectionMapping;
pbrFactory.setEnvironmentMap(envMap);
```

### Combining Multiple Effects

Status effects automatically stack:

```typescript
const { addEffect } = useStatusEffect(entityId, geometry);

// Apply multiple effects
addEffect(StatusEffect.Burning, 0.8);
addEffect(StatusEffect.Poisoned, 0.6);
addEffect(StatusEffect.Stunned, 1.0);
// All three effects render simultaneously
```

---

## Troubleshooting

### Glow not visible?
- Ensure you're using `scale` slightly larger than base mesh (1.02+)
- Check that `transparent: true` is set
- Verify additive blending is enabled

### Status effects not updating?
- Make sure you're calling the hook inside a React component
- Verify `useFrame` is available (requires `@react-three/fiber`)

### Performance issues?
- Check active shader count with `useShaderPerformance()`
- Reduce status effects per entity to 2-3 max
- Use material caching (built-in with PBRMaterialFactory)

---

## Integration Checklist

- [ ] Import types from `./shaders/types`
- [ ] Use hooks from `./shaders/useMaterial` for React components
- [ ] Set environment map via `pbrFactory.setEnvironmentMap()`
- [ ] Test with multiple rarities (Common → Divine)
- [ ] Verify status effects stack correctly
- [ ] Check performance with 50+ items
- [ ] Confirm automatic material disposal on unmount

---

## Future Enhancements

Potential additions for future versions:
- Custom status effect shaders (user-defined)
- Animation curves for pulse patterns
- Shader variants for different art styles
- GPU instancing for massive item counts
- Post-processing bloom integration
- Shader-based damage number rendering

---

**Version:** 1.0.0  
**Last Updated:** February 2026  
**Maintainer:** Agent Arena Development Team
