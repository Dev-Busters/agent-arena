/**
 * QualityTier — Adaptive quality detection and configuration.
 * Detects device capability once and provides render settings for all scenes.
 */

export type Tier = 'low' | 'medium' | 'high';

export interface QualitySettings {
  tier: Tier;
  /** Device pixel ratio cap */
  pixelRatio: number;
  /** Shadow map resolution (width = height) */
  shadowMapSize: number;
  /** Enable shadow maps at all */
  shadows: boolean;
  /** Max particle count multiplier (0..1) */
  particleScale: number;
  /** Enable antialiasing */
  antialias: boolean;
  /** Max point lights */
  maxPointLights: number;
  /** Use instanced meshes when count > threshold */
  instanceThreshold: number;
  /** Capsule geometry segments */
  capsuleSegments: number;
  /** Sphere geometry segments */
  sphereSegments: number;
}

const SETTINGS: Record<Tier, QualitySettings> = {
  low: {
    tier: 'low',
    pixelRatio: 1,
    shadowMapSize: 512,
    shadows: false,
    particleScale: 0.4,
    antialias: false,
    maxPointLights: 2,
    instanceThreshold: 2,
    capsuleSegments: 3,
    sphereSegments: 6,
  },
  medium: {
    tier: 'medium',
    pixelRatio: Math.min(window?.devicePixelRatio ?? 1, 1.5),
    shadowMapSize: 1024,
    shadows: true,
    particleScale: 0.7,
    antialias: true,
    maxPointLights: 4,
    instanceThreshold: 3,
    capsuleSegments: 4,
    sphereSegments: 8,
  },
  high: {
    tier: 'high',
    pixelRatio: Math.min(window?.devicePixelRatio ?? 1, 2),
    shadowMapSize: 2048,
    shadows: true,
    particleScale: 1.0,
    antialias: true,
    maxPointLights: 8,
    instanceThreshold: 4,
    capsuleSegments: 6,
    sphereSegments: 12,
  },
};

let cachedTier: Tier | null = null;

/**
 * Detect the appropriate quality tier based on hardware signals.
 * Called once; result is cached.
 */
export function detectTier(): Tier {
  if (cachedTier) return cachedTier;

  // Server-side fallback
  if (typeof window === 'undefined') {
    cachedTier = 'medium';
    return cachedTier;
  }

  let score = 0;

  // 1. Hardware concurrency (logical cores)
  const cores = navigator.hardwareConcurrency ?? 2;
  if (cores >= 8) score += 2;
  else if (cores >= 4) score += 1;

  // 2. Device pixel ratio
  const dpr = window.devicePixelRatio ?? 1;
  if (dpr >= 2) score += 1;

  // 3. Device memory (Chrome-only API)
  const mem = (navigator as any).deviceMemory as number | undefined;
  if (mem !== undefined) {
    if (mem >= 8) score += 2;
    else if (mem >= 4) score += 1;
  } else {
    score += 1; // assume medium if unknown
  }

  // 4. GPU detection via WebGL renderer string
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string;
        const lc = renderer.toLowerCase();
        // High-end GPUs
        if (/nvidia|radeon|apple m[2-9]|apple gpu/i.test(lc)) score += 2;
        else if (/intel.*iris|apple m1/i.test(lc)) score += 1;
        // Integrated / low-end stays 0
      }
    }
  } catch {
    // ignore
  }

  // 5. Mobile penalty
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  if (isMobile) score -= 2;

  // Map score → tier
  if (score >= 5) cachedTier = 'high';
  else if (score >= 2) cachedTier = 'medium';
  else cachedTier = 'low';

  return cachedTier;
}

export function getQualitySettings(tierOverride?: Tier): QualitySettings {
  const tier = tierOverride ?? detectTier();
  return { ...SETTINGS[tier] };
}

/** Force a specific tier (for settings UI) */
export function overrideTier(tier: Tier) {
  cachedTier = tier;
}
