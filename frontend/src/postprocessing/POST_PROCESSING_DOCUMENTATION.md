# Post-Processing & Effects Documentation
## Agent Arena 3D Roguelike - P2.5

---

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Effect Chain](#effect-chain)
4. [Individual Effects](#individual-effects)
5. [Effect Presets](#effect-presets)
6. [React Integration](#react-integration)
7. [Performance Optimization](#performance-optimization)
8. [Code Examples](#code-examples)

---

## Overview

The post-processing system provides cinematic visual effects for Agent Arena, including bloom, depth of field, motion blur, film grain, and chromatic aberration. Built on THREE.js EffectComposer, it's optimized for 60 FPS gameplay with automatic performance scaling.

### Features
- ✨ **Bloom** - HDR glow for magical items and abilities
- 🎥 **Depth of Field** - Cinematic focus effects
- 💨 **Motion Blur** - Velocity-based blur during fast movement
- 🎞️ **Film Grain** - Atmospheric retro feel
- 🌈 **Chromatic Aberration** - Hit feedback and impact effects
- ⚡ **Performance Mode** - Automatic quality scaling
- 🎮 **Effect Presets** - Cinematic, combat, exploration modes

---

## Architecture

### Core Components

```
PostProcessingComposer (composer.ts)
├── BloomEffect (bloom.ts)
├── DepthOfFieldEffect (depthOfField.ts)
├── MotionBlurEffect (motionBlur.ts)
├── FilmGrainEffect (filmGrain.ts)
└── ChromaticAberrationEffect (chromaticAberration.ts)
```

### Effect Pipeline

```
Scene Render → Bloom → DOF → Motion Blur → Film Grain → CA → FXAA → Output
```

Each effect is a separate pass in the THREE.js EffectComposer pipeline, processed sequentially.

---

## Effect Chain

### Order of Operations

1. **RenderPass** - Renders the base scene
2. **UnrealBloomPass** - Applies HDR bloom to bright areas
3. **BokehPass** - Applies depth of field with bokeh blur
4. **MotionBlurPass** - Adds velocity-based motion blur
5. **FilmGrainPass** - Adds animated noise and optional vignette
6. **ChromaticAberrationPass** - RGB channel separation
7. **FXAAPass** - Anti-aliasing (always last)

### Why This Order?

- **Bloom first**: Captures HDR highlights before other effects
- **DOF second**: Focuses attention before blur/grain
- **Motion blur third**: Adds movement without interfering with focus
- **Grain fourth**: Overlay effect that enhances atmosphere
- **CA fifth**: Final distortion for impact effects
- **FXAA last**: Smooths final output

---

## Individual Effects

### 1. Bloom Effect

Highlights bright areas with HDR glow, perfect for magical items and abilities.

**Configuration:**
```typescript
interface BloomConfig {
  strength: number;      // 0-3, default: 1.5
  threshold: number;     // 0-1, default: 0.85
  radius: number;        // 0-1, default: 0.4
  hdr?: boolean;         // Enable HDR tone mapping
  resolution?: number;   // 0.5-1.0, adaptive quality
}
```

**Use Cases:**
- Legendary item glow
- Spell cast effects
- Magical auras
- Environmental lights

---

### 2. Depth of Field

Simulates camera focus with background blur for cinematic look.

**Configuration:**
```typescript
interface DepthOfFieldConfig {
  focusDistance: number;   // World units from camera
  aperture: number;        // f-stop (1-22, lower = more blur)
  maxBlur?: number;        // 0-1, maximum blur amount
  autoFocus?: boolean;     // Auto-focus on center/target
  focusTarget?: Object3D;  // Target object for focus
}
```

**Use Cases:**
- Cinematic cutscenes
- Focus on important objects
- Menu blur background
- Dramatic moments

---

### 3. Motion Blur

Velocity-based blur during fast camera or object movement.

**Configuration:**
```typescript
interface MotionBlurConfig {
  intensity: number;           // 0-1, blur strength
  samples: number;             // 2-32, quality vs performance
  velocityThreshold?: number;  // Min speed to trigger blur
  velocityBased?: boolean;     // Scale with velocity
}
```

**Use Cases:**
- Fast camera panning
- Dash/sprint abilities
- Combat strikes
- Cinematic camera moves

---

### 4. Film Grain

Animated noise texture for atmospheric/retro feel.

**Configuration:**
```typescript
interface FilmGrainConfig {
  intensity: number;          // 0-1, grain strength
  animated: boolean;          // Animate grain each frame
  vignette?: boolean;         // Enable edge darkening
  vignetteIntensity?: number; // 0-1, vignette strength
  scale?: number;             // Grain size multiplier
}
```

**Use Cases:**
- Atmospheric ambiance
- Retro aesthetic
- Dark dungeon mood
- Horror elements

---

### 5. Chromatic Aberration

RGB channel offset for hit feedback and impact.

**Configuration:**
```typescript
interface ChromaticAberrationConfig {
  offset: number;          // 0-0.1, channel separation
  radial?: boolean;        // Radial distortion from center
  radialStrength?: number; // Multiplier for radial effect
  maxOffset?: number;      // Max offset at screen edges
}
```

**Use Cases:**
- Damage feedback
- Impact effects
- Screen shake enhancement
- Status effects (poison, stun)

---

## Effect Presets

### Available Presets

#### 1. Cinematic
High-quality effects for cutscenes and dramatic moments.
- Strong bloom (2.0)
- Shallow DOF (f/2.8)
- Moderate motion blur
- Subtle grain with vignette
- Minimal chromatic aberration

#### 2. Combat
Optimized for fast-paced action with feedback.
- Medium bloom (1.8)
- Velocity-based motion blur
- Light grain
- Strong chromatic aberration for hits
- No DOF (too distracting)

#### 3. Exploration
Balanced effects for dungeon exploration.
- Subtle bloom (1.2)
- Deep DOF (f/8)
- Medium grain with vignette
- Atmospheric feel

#### 4. Minimal
Performance-focused preset.
- Weak bloom (0.8)
- Light grain (non-animated)
- Reduced resolution (0.75)
- Most effects disabled

#### 5. Quality
Maximum quality for high-end systems.
- Very strong bloom (2.5)
- Shallow DOF (f/1.8)
- High sample motion blur (16)
- Heavy grain
- All effects enabled

---

## React Integration

### Basic Setup

```typescript
import { usePostProcessing, useEffectPreset } from './postprocessing';

function Game() {
  const { render, resize, getEffects } = usePostProcessing(
    renderer,
    scene,
    camera,
    {
      enabled: true,
      bloom: { strength: 1.5, threshold: 0.85, radius: 0.4 },
      filmGrain: { intensity: 0.3, animated: true },
    }
  );

  // Render loop
  useEffect(() => {
    const animate = () => {
      render(deltaTime);
      requestAnimationFrame(animate);
    };
    animate();
  }, [render]);

  return <canvas ref={canvasRef} />;
}
```

### Using Presets

```typescript
const { applyPreset, currentPreset } = useEffectPreset(composer, 'exploration');

// Switch preset
applyPreset('combat'); // During combat
applyPreset('cinematic'); // For cutscenes
```

### Damage Feedback

```typescript
const { triggerDamage, triggerImpact } = useDamageEffect(composer);

// On player hit
triggerDamage('heavy'); // Strong chromatic aberration

// On critical hit
triggerImpact(); // CA + motion blur pulse
```

---

## Performance Optimization

### Automatic Performance Mode

The system monitors FPS and automatically reduces quality:

- **< 70% target FPS**: Reduces bloom resolution
- **< 50% target FPS**: Enables performance mode (disables DOF, motion blur)
- **> 95% target FPS**: Gradually increases quality

### Manual Performance Control

```typescript
const { performanceMode, togglePerformanceMode, fps } = usePerformanceMode(
  composer,
  true, // Auto-enable
  45    // FPS threshold
);

// Manual toggle
togglePerformanceMode();
```

### Performance Tips

1. **Reduce bloom resolution** - Set `resolution: 0.75` for 30% perf boost
2. **Disable DOF in combat** - Most expensive effect, 15-20% cost
3. **Use static grain** - Set `animated: false` for 5% savings
4. **Lower motion blur samples** - Use 4-8 samples instead of 16
5. **Disable CA when not needed** - Only enable for hit feedback

### Target Performance

- **60 FPS**: Cinematic preset on mid-range GPU
- **45-60 FPS**: Quality preset on high-end GPU
- **60+ FPS**: Minimal preset on low-end GPU

---

## Code Examples

### Example 1: Basic Post-Processing Setup

```typescript
import { PostProcessingComposer } from './postprocessing';

const composer = new PostProcessingComposer(renderer, scene, camera, {
  enabled: true,
  bloom: {
    strength: 1.5,
    threshold: 0.85,
    radius: 0.4,
    hdr: true,
  },
  filmGrain: {
    intensity: 0.3,
    animated: true,
    vignette: true,
  },
  targetFPS: 60,
});

// Render loop
function animate() {
  composer.render();
  requestAnimationFrame(animate);
}
```

---

### Example 2: React Component with Effects

```typescript
import { usePostProcessing, useEffectPreset, useDamageEffect } from './postprocessing';

function GameScene() {
  const { render, composer } = usePostProcessing(renderer, scene, camera, {
    enabled: true,
    performanceMode: false,
  });

  const { applyPreset } = useEffectPreset(composer, 'exploration');
  const { triggerDamage } = useDamageEffect(composer);

  const handlePlayerHit = (damage: number) => {
    const severity = damage > 50 ? 'heavy' : damage > 20 ? 'medium' : 'light';
    triggerDamage(severity);
  };

  const enterCombat = () => {
    applyPreset('combat');
  };

  return (
    <div>
      <canvas ref={canvasRef} />
      <button onClick={enterCombat}>Enter Combat</button>
    </div>
  );
}
```

---

### Example 3: Dynamic Bloom for Rarity

```typescript
import { createRarityBloom } from './postprocessing/bloom';

function updateItemGlow(item: Item) {
  const bloomConfig = createRarityBloom(item.rarity);
  composer.updateConfig({ bloom: bloomConfig });

  // Pulse on pickup
  const effects = composer.getEffects();
  effects.bloom?.pulse(500, bloomConfig.strength * 2);
}

// Usage
updateItemGlow({ name: 'Legendary Sword', rarity: 'legendary' });
// → Strong bloom (2.5), threshold 0.8, HDR enabled
```

---

### Example 4: Cinematic Cutscene

```typescript
import { createCinematicDOF } from './postprocessing/depthOfField';

async function playCutscene(target: THREE.Object3D) {
  // Switch to cinematic preset
  composer.applyPreset('cinematic');

  // Focus on target with shallow DOF
  const dofConfig = createCinematicDOF('shallow');
  composer.updateConfig({ depthOfField: dofConfig });

  const effects = composer.getEffects();
  effects.depthOfField?.setFocusTarget(target);

  // Smooth focus transition
  await effects.depthOfField?.focusTransition(10, 2000);

  // ... play cutscene ...

  // Return to exploration
  composer.applyPreset('exploration');
}
```

---

### Example 5: Performance Monitoring

```typescript
import { usePerformanceMode } from './postprocessing';

function PerformanceMonitor() {
  const { performanceMode, fps, togglePerformanceMode } = usePerformanceMode(
    composer,
    true, // Auto-enable at low FPS
    45    // Threshold
  );

  return (
    <div className="performance-hud">
      <p>FPS: {fps.toFixed(1)}</p>
      <p>Performance Mode: {performanceMode ? 'ON' : 'OFF'}</p>
      <button onClick={togglePerformanceMode}>
        Toggle Performance Mode
      </button>
    </div>
  );
}
```

---

## Best Practices

### DO:
- ✅ Use presets as starting points
- ✅ Enable performance mode on low-end systems
- ✅ Disable expensive effects in combat
- ✅ Use bloom for important visual feedback
- ✅ Apply chromatic aberration for hit feedback
- ✅ Monitor FPS and adapt quality

### DON'T:
- ❌ Enable all effects at max quality on all systems
- ❌ Use DOF during fast gameplay
- ❌ Forget to dispose composer on cleanup
- ❌ Apply effects without testing performance
- ❌ Use high motion blur samples in combat
- ❌ Ignore FPS drops

---

## Troubleshooting

### Low FPS?
1. Enable performance mode
2. Reduce bloom resolution to 0.5-0.75
3. Disable DOF and motion blur
4. Use static film grain
5. Switch to 'minimal' preset

### Effects not visible?
1. Check `enabled: true` in config
2. Verify composer is rendering (not direct renderer)
3. Ensure bloom threshold isn't too high (>0.95)
4. Check effect-specific enabled flags

### Bloom too strong?
1. Increase threshold (0.85 → 0.95)
2. Reduce strength (1.5 → 0.8)
3. Decrease radius (0.4 → 0.3)

### Motion blur artifacts?
1. Reduce sample count (16 → 8)
2. Increase velocity threshold
3. Disable during fast camera movement

---

## Future Enhancements

- [ ] SSAO (Screen Space Ambient Occlusion)
- [ ] God rays / volumetric lighting
- [ ] Color grading LUTs
- [ ] Custom shader effects
- [ ] Temporal anti-aliasing (TAA)
- [ ] Screen space reflections (SSR)

---

**Built for Agent Arena 3D Roguelike**  
*Optimized for 60 FPS gameplay with cinematic quality*
