/**
 * Status Effects System
 * Handles poison, stun, bleed, and other combat status effects
 * for dungeon encounters and PvP battles.
 */

// ─── Types ───────────────────────────────────────────────────────────

export type StatusEffectType = 'poison' | 'stun' | 'bleed' | 'burn' | 'defend' | 'weakness' | 'slow';

export interface StatusEffect {
  type: StatusEffectType;
  /** Remaining turns */
  duration: number;
  /** Stack count (poison stacks, bleed stacks) */
  stacks: number;
  /** Who applied it (enemy id or 'player') */
  sourceId: string;
  /** Turn it was applied */
  appliedOnTurn: number;
}

export interface StatusEffectResult {
  type: StatusEffectType;
  damage: number;
  message: string;
  expired: boolean;
}

export interface EffectApplicationResult {
  applied: boolean;
  resisted: boolean;
  message: string;
  effect?: StatusEffect;
}

// ─── Configuration ───────────────────────────────────────────────────

export const EFFECT_CONFIG: Record<StatusEffectType, {
  maxStacks: number;
  baseDuration: number;
  maxDuration: number;
  /** % of max HP dealt per tick per stack */
  damagePerStack: number;
  /** Whether this effect prevents acting */
  preventsAction: boolean;
  /** Base chance to apply (0-1) */
  baseApplyChance: number;
  /** Description shown in UI */
  description: string;
  /** Emoji icon for the UI */
  icon: string;
  /** Color class for frontend */
  color: string;
}> = {
  poison: {
    maxStacks: 5,
    baseDuration: 4,
    maxDuration: 6,
    damagePerStack: 0.02,    // 2% max HP per stack per turn
    preventsAction: false,
    baseApplyChance: 0.35,
    description: 'Deals damage over time. Stacks increase damage.',
    icon: '☠️',
    color: 'green',
  },
  stun: {
    maxStacks: 1,
    baseDuration: 1,
    maxDuration: 2,
    damagePerStack: 0,
    preventsAction: true,
    baseApplyChance: 0.20,
    description: 'Target cannot act for the duration.',
    icon: '💫',
    color: 'yellow',
  },
  bleed: {
    maxStacks: 3,
    baseDuration: 3,
    maxDuration: 5,
    damagePerStack: 0.03,    // 3% max HP per stack per turn
    preventsAction: false,
    baseApplyChance: 0.30,
    description: 'Deals damage over time. Reduces healing by 50%.',
    icon: '🩸',
    color: 'red',
  },
  burn: {
    maxStacks: 3,
    baseDuration: 3,
    maxDuration: 4,
    damagePerStack: 0.04,    // 4% max HP per stack per turn (highest DoT)
    preventsAction: false,
    baseApplyChance: 0.25,
    description: 'Deals high fire damage over time.',
    icon: '🔥',
    color: 'orange',
  },
  defend: {
    maxStacks: 1,
    baseDuration: 1,
    maxDuration: 1,
    damagePerStack: 0,
    preventsAction: false,
    baseApplyChance: 1.0,
    description: 'Reduces incoming damage by 40%.',
    icon: '🛡️',
    color: 'blue',
  },
  weakness: {
    maxStacks: 3,
    baseDuration: 2,
    maxDuration: 4,
    damagePerStack: 0,
    preventsAction: false,
    baseApplyChance: 0.25,
    description: 'Reduces attack power by 10% per stack.',
    icon: '💀',
    color: 'purple',
  },
  slow: {
    maxStacks: 2,
    baseDuration: 2,
    maxDuration: 3,
    damagePerStack: 0,
    preventsAction: false,
    baseApplyChance: 0.30,
    description: 'Reduces speed by 15% per stack.',
    icon: '🐌',
    color: 'cyan',
  },
};

// ─── Enemy Effect Abilities ──────────────────────────────────────────

export interface EnemyEffectAbility {
  effectType: StatusEffectType;
  bonusChance: number;       // Added to base apply chance
  bonusStacks: number;       // Extra stacks on application
  bonusDuration: number;     // Extra turns
}

/**
 * Which effects each enemy type can apply via their attacks/abilities
 */
export const ENEMY_EFFECT_ABILITIES: Record<string, EnemyEffectAbility[]> = {
  goblin: [
    { effectType: 'poison', bonusChance: 0.10, bonusStacks: 0, bonusDuration: 0 },
  ],
  skeleton: [
    { effectType: 'bleed', bonusChance: 0.05, bonusStacks: 0, bonusDuration: 0 },
    { effectType: 'weakness', bonusChance: 0.10, bonusStacks: 0, bonusDuration: 0 },
  ],
  orc: [
    { effectType: 'stun', bonusChance: 0.10, bonusStacks: 0, bonusDuration: 0 },
    { effectType: 'bleed', bonusChance: 0.15, bonusStacks: 1, bonusDuration: 0 },
  ],
  wraith: [
    { effectType: 'poison', bonusChance: 0.20, bonusStacks: 1, bonusDuration: 1 },
    { effectType: 'slow', bonusChance: 0.15, bonusStacks: 0, bonusDuration: 0 },
  ],
  boss_skeleton: [
    { effectType: 'bleed', bonusChance: 0.25, bonusStacks: 2, bonusDuration: 1 },
    { effectType: 'stun', bonusChance: 0.15, bonusStacks: 0, bonusDuration: 1 },
    { effectType: 'weakness', bonusChance: 0.20, bonusStacks: 1, bonusDuration: 1 },
  ],
  boss_dragon: [
    { effectType: 'burn', bonusChance: 0.40, bonusStacks: 2, bonusDuration: 1 },
    { effectType: 'stun', bonusChance: 0.10, bonusStacks: 0, bonusDuration: 0 },
  ],
  boss_lich: [
    { effectType: 'poison', bonusChance: 0.35, bonusStacks: 3, bonusDuration: 2 },
    { effectType: 'weakness', bonusChance: 0.30, bonusStacks: 2, bonusDuration: 1 },
    { effectType: 'slow', bonusChance: 0.25, bonusStacks: 1, bonusDuration: 1 },
  ],
};

/**
 * Player effect abilities by class
 */
export const PLAYER_EFFECT_ABILITIES: Record<string, EnemyEffectAbility[]> = {
  warrior: [
    { effectType: 'bleed', bonusChance: 0.15, bonusStacks: 0, bonusDuration: 0 },
    { effectType: 'stun', bonusChance: 0.05, bonusStacks: 0, bonusDuration: 0 },
  ],
  mage: [
    { effectType: 'burn', bonusChance: 0.20, bonusStacks: 1, bonusDuration: 0 },
    { effectType: 'slow', bonusChance: 0.10, bonusStacks: 0, bonusDuration: 0 },
  ],
  rogue: [
    { effectType: 'poison', bonusChance: 0.25, bonusStacks: 1, bonusDuration: 1 },
    { effectType: 'bleed', bonusChance: 0.15, bonusStacks: 0, bonusDuration: 0 },
  ],
  paladin: [
    { effectType: 'stun', bonusChance: 0.20, bonusStacks: 0, bonusDuration: 0 },
    { effectType: 'burn', bonusChance: 0.10, bonusStacks: 0, bonusDuration: 0 },
  ],
};

// ─── Core Functions ──────────────────────────────────────────────────

/**
 * Try to apply a status effect to a target.
 * Handles stacking, duration extension, and resistance.
 */
export function tryApplyEffect(
  targetEffects: StatusEffect[],
  effectType: StatusEffectType,
  sourceId: string,
  currentTurn: number,
  targetDefense: number = 0,
  bonusChance: number = 0,
  bonusStacks: number = 0,
  bonusDuration: number = 0,
  rng: () => number = Math.random,
): EffectApplicationResult {
  const config = EFFECT_CONFIG[effectType];

  // Calculate apply chance with defense-based resistance
  // Higher defense = more resistance to effects (up to 30% reduction)
  const defenseResist = Math.min(0.30, targetDefense * 0.003);
  const finalChance = Math.max(0.05, config.baseApplyChance + bonusChance - defenseResist);

  const roll = rng();
  if (roll > finalChance) {
    return {
      applied: false,
      resisted: true,
      message: `Resisted ${effectType}!`,
    };
  }

  // Check for existing effect of same type
  const existing = targetEffects.find(e => e.type === effectType);

  if (existing) {
    // Stack up to max
    const newStacks = Math.min(config.maxStacks, existing.stacks + 1 + bonusStacks);
    existing.stacks = newStacks;
    // Refresh/extend duration (don't exceed max)
    existing.duration = Math.min(
      config.maxDuration,
      Math.max(existing.duration, config.baseDuration + bonusDuration)
    );

    return {
      applied: true,
      resisted: false,
      message: `${config.icon} ${effectType} stacked to ${newStacks}!`,
      effect: existing,
    };
  }

  // Apply new effect
  const newEffect: StatusEffect = {
    type: effectType,
    duration: Math.min(config.maxDuration, config.baseDuration + bonusDuration),
    stacks: Math.min(config.maxStacks, 1 + bonusStacks),
    sourceId,
    appliedOnTurn: currentTurn,
  };
  targetEffects.push(newEffect);

  return {
    applied: true,
    resisted: false,
    message: `${config.icon} ${effectType} applied! (${newEffect.stacks} stack${newEffect.stacks > 1 ? 's' : ''}, ${newEffect.duration} turns)`,
    effect: newEffect,
  };
}

/**
 * Process all active status effects at end of turn.
 * Returns total damage dealt and per-effect details.
 */
export function processStatusEffects(
  effects: StatusEffect[],
  maxHp: number,
  currentHp: number,
): { newHp: number; totalDamage: number; results: StatusEffectResult[]; expiredEffects: StatusEffectType[] } {
  const results: StatusEffectResult[] = [];
  const expiredEffects: StatusEffectType[] = [];
  let totalDamage = 0;
  let hp = currentHp;

  for (const effect of effects) {
    const config = EFFECT_CONFIG[effect.type];
    let damage = 0;

    // Calculate DoT damage
    if (config.damagePerStack > 0) {
      damage = Math.max(1, Math.floor(maxHp * config.damagePerStack * effect.stacks));
      hp = Math.max(0, hp - damage);
      totalDamage += damage;
    }

    // Decrement duration
    effect.duration -= 1;
    const expired = effect.duration <= 0;

    if (expired) {
      expiredEffects.push(effect.type);
    }

    results.push({
      type: effect.type,
      damage,
      message: damage > 0
        ? `${config.icon} ${effect.type} deals ${damage} damage (${effect.stacks} stack${effect.stacks > 1 ? 's' : ''})${expired ? ' - expired' : ''}`
        : expired
          ? `${config.icon} ${effect.type} expired`
          : `${config.icon} ${effect.type} active (${effect.duration} turns left)`,
      expired,
    });
  }

  // Remove expired effects
  const remaining = effects.filter(e => e.duration > 0);
  effects.length = 0;
  effects.push(...remaining);

  return { newHp: hp, totalDamage, results, expiredEffects };
}

/**
 * Check if target is stunned (cannot act this turn).
 */
export function isStunned(effects: StatusEffect[]): boolean {
  return effects.some(e => e.type === 'stun' && e.duration > 0);
}

/**
 * Get attack modifier from debuffs (weakness reduces damage output).
 */
export function getAttackModifier(effects: StatusEffect[]): number {
  const weakness = effects.find(e => e.type === 'weakness');
  if (!weakness) return 1.0;
  // 10% reduction per stack
  return Math.max(0.5, 1.0 - weakness.stacks * 0.10);
}

/**
 * Get speed modifier from debuffs (slow reduces speed).
 */
export function getSpeedModifier(effects: StatusEffect[]): number {
  const slow = effects.find(e => e.type === 'slow');
  if (!slow) return 1.0;
  // 15% reduction per stack
  return Math.max(0.4, 1.0 - slow.stacks * 0.15);
}

/**
 * Check if bleed reduces healing.
 */
export function getHealingModifier(effects: StatusEffect[]): number {
  const bleed = effects.find(e => e.type === 'bleed');
  return bleed ? 0.5 : 1.0; // 50% healing reduction while bleeding
}

/**
 * Roll for effect application from an attack.
 * Given the attacker's abilities, try to apply each possible effect.
 */
export function rollAttackEffects(
  attackerAbilities: EnemyEffectAbility[],
  targetEffects: StatusEffect[],
  sourceId: string,
  currentTurn: number,
  targetDefense: number,
  isCritical: boolean,
  rng: () => number = Math.random,
): EffectApplicationResult[] {
  const results: EffectApplicationResult[] = [];

  for (const ability of attackerAbilities) {
    // Crits get +15% bonus chance to apply effects
    const critBonus = isCritical ? 0.15 : 0;

    const result = tryApplyEffect(
      targetEffects,
      ability.effectType,
      sourceId,
      currentTurn,
      targetDefense,
      ability.bonusChance + critBonus,
      ability.bonusStacks,
      ability.bonusDuration,
      rng,
    );

    if (result.applied || result.resisted) {
      results.push(result);
    }
  }

  return results;
}

/**
 * Remove a specific effect (for cleanse abilities).
 */
export function removeEffect(effects: StatusEffect[], type: StatusEffectType): boolean {
  const idx = effects.findIndex(e => e.type === type);
  if (idx >= 0) {
    effects.splice(idx, 1);
    return true;
  }
  return false;
}

/**
 * Remove all effects (full cleanse).
 */
export function clearAllEffects(effects: StatusEffect[]): StatusEffectType[] {
  const removed = effects.map(e => e.type);
  effects.length = 0;
  return removed;
}

/**
 * Get serializable summary of active effects for socket emission.
 */
export function serializeEffects(effects: StatusEffect[]): Array<{
  type: StatusEffectType;
  duration: number;
  stacks: number;
  icon: string;
  color: string;
  description: string;
  preventsAction: boolean;
}> {
  return effects.map(e => {
    const config = EFFECT_CONFIG[e.type];
    return {
      type: e.type,
      duration: e.duration,
      stacks: e.stacks,
      icon: config.icon,
      color: config.color,
      description: config.description,
      preventsAction: config.preventsAction,
    };
  });
}
