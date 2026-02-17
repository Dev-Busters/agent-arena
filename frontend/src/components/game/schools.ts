/**
 * Combat Schools — The three core agent archetypes
 * Each school changes stats, sprite color, AI behavior, and ability flavor
 */

export type SchoolId = 'vanguard' | 'invoker' | 'phantom';

export interface SchoolAbilityInfo {
  name: string;
  description: string;
  key: string;
}

export interface SchoolConfig {
  id: SchoolId;
  name: string;
  tagline: string;
  description: string;
  /** PixiJS hex color for agent sprite */
  spriteColor: number;
  /** Tailwind color for UI accents */
  uiColor: string;
  /** Tailwind border color */
  borderColor: string;
  /** Tailwind gradient for card */
  gradient: string;
  /** Icon emoji */
  icon: string;
  stats: {
    hpBonus: number;          // Added to base 100
    damageMultiplier: number; // Multiplies all attack damage
    speedMultiplier: number;  // Multiplies movement speed
    critBonus: number;        // Added to base 10% crit chance
    blastRadiusBonus: number; // % increase to blast radius
  };
  ai: {
    preferredDistance: number;   // Target distance from enemies
    aggressionLevel: number;     // 0-1, affects retreat threshold
    attackCooldownMult: number;  // Multiplier on attack cooldown
    dashCooldownMult: number;    // Multiplier on dash cooldown
  };
  abilities: {
    Q: SchoolAbilityInfo;
    E: SchoolAbilityInfo;
    R: SchoolAbilityInfo;
    F: SchoolAbilityInfo;
  };
}

export const SCHOOLS: Record<SchoolId, SchoolConfig> = {
  vanguard: {
    id: 'vanguard',
    name: 'Vanguard',
    tagline: 'The Iron Wall',
    description: 'A relentless frontline combatant. Wades into melee, absorbs punishment, and crushes everything in reach. Highest HP, but keeps close range.',
    spriteColor: 0x4488ff,
    uiColor: 'text-blue-400',
    borderColor: 'border-blue-500',
    gradient: 'from-blue-900/60 to-slate-900',
    icon: '🛡️',
    stats: {
      hpBonus: 30,           // 130 HP total
      damageMultiplier: 1.1,
      speedMultiplier: 0.9,
      critBonus: 0,
      blastRadiusBonus: 0,
    },
    ai: {
      preferredDistance: 50,   // Wants to be in melee
      aggressionLevel: 0.9,    // Very aggressive
      attackCooldownMult: 0.8, // Attacks faster
      dashCooldownMult: 1.2,   // Slower dash (heavier)
    },
    abilities: {
      Q: { key: 'Q', name: 'Shield Bash', description: 'Dash forward, dealing damage to enemies on impact' },
      E: { key: 'E', name: 'War Cry', description: 'AoE burst — stuns nearby enemies momentarily' },
      R: { key: 'R', name: 'Spear Throw', description: 'Piercing projectile that passes through multiple foes' },
      F: { key: 'F', name: 'Iron Will', description: 'Restore 35% max HP instantly' },
    },
  },

  invoker: {
    id: 'invoker',
    name: 'Invoker',
    tagline: 'The Arcane Mind',
    description: 'A calculating caster who controls the battlefield from a distance. Devastating AoE but fragile up close — keep your distance.',
    spriteColor: 0xcc44ff,
    uiColor: 'text-purple-400',
    borderColor: 'border-purple-500',
    gradient: 'from-purple-900/60 to-slate-900',
    icon: '🔮',
    stats: {
      hpBonus: -20,           // 80 HP total — fragile
      damageMultiplier: 1.3,  // High damage
      speedMultiplier: 1.0,
      critBonus: 5,           // 15% crit
      blastRadiusBonus: 50,   // Much bigger AoE
    },
    ai: {
      preferredDistance: 180,  // Wants distance
      aggressionLevel: 0.5,    // Retreats aggressively
      attackCooldownMult: 1.1, // Slightly slower melee
      dashCooldownMult: 0.7,   // Fast blink
    },
    abilities: {
      Q: { key: 'Q', name: 'Blink', description: 'Instant teleport dash — no travel time' },
      E: { key: 'E', name: 'Arcane Nova', description: 'Massive AoE blast (+50% radius)' },
      R: { key: 'R', name: 'Chain Bolt', description: 'Projectile that chains to nearby enemies' },
      F: { key: 'F', name: 'Mana Ward', description: 'Restore 25% max HP' },
    },
  },

  phantom: {
    id: 'phantom',
    name: 'Phantom',
    tagline: 'The Shadow Strike',
    description: 'A high-speed predator built for hit-and-run. Highest crit chance, fastest dash — dart in, deal massive damage, vanish before retaliation.',
    spriteColor: 0x44ff88,
    uiColor: 'text-emerald-400',
    borderColor: 'border-emerald-500',
    gradient: 'from-emerald-900/60 to-slate-900',
    icon: '⚡',
    stats: {
      hpBonus: 0,             // 100 HP
      damageMultiplier: 1.0,
      speedMultiplier: 1.25,  // Very fast
      critBonus: 15,          // 25% crit chance
      blastRadiusBonus: 0,
    },
    ai: {
      preferredDistance: 90,   // Medium range
      aggressionLevel: 0.7,
      attackCooldownMult: 1.0,
      dashCooldownMult: 0.5,   // Very fast dash
    },
    abilities: {
      Q: { key: 'Q', name: 'Shadow Step', description: 'Rapid dash — very short cooldown' },
      E: { key: 'E', name: 'Smoke Screen', description: 'AoE burst — slows enemies briefly' },
      R: { key: 'R', name: 'Shuriken', description: 'Fast multi-hit projectile' },
      F: { key: 'F', name: 'Evasion', description: 'Restore 20% max HP instantly' },
    },
  },
};

export const DEFAULT_SCHOOL = SCHOOLS.vanguard;
