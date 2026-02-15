/**
 * Status Effects System
 * Handles poison, stun, bleed, and other combat status effects
 * for dungeon encounters and PvP battles.
 */
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
export declare const EFFECT_CONFIG: Record<StatusEffectType, {
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
}>;
export interface EnemyEffectAbility {
    effectType: StatusEffectType;
    bonusChance: number;
    bonusStacks: number;
    bonusDuration: number;
}
/**
 * Which effects each enemy type can apply via their attacks/abilities
 */
export declare const ENEMY_EFFECT_ABILITIES: Record<string, EnemyEffectAbility[]>;
/**
 * Player effect abilities by class
 */
export declare const PLAYER_EFFECT_ABILITIES: Record<string, EnemyEffectAbility[]>;
/**
 * Try to apply a status effect to a target.
 * Handles stacking, duration extension, and resistance.
 */
export declare function tryApplyEffect(targetEffects: StatusEffect[], effectType: StatusEffectType, sourceId: string, currentTurn: number, targetDefense?: number, bonusChance?: number, bonusStacks?: number, bonusDuration?: number, rng?: () => number): EffectApplicationResult;
/**
 * Process all active status effects at end of turn.
 * Returns total damage dealt and per-effect details.
 */
export declare function processStatusEffects(effects: StatusEffect[], maxHp: number, currentHp: number): {
    newHp: number;
    totalDamage: number;
    results: StatusEffectResult[];
    expiredEffects: StatusEffectType[];
};
/**
 * Check if target is stunned (cannot act this turn).
 */
export declare function isStunned(effects: StatusEffect[]): boolean;
/**
 * Get attack modifier from debuffs (weakness reduces damage output).
 */
export declare function getAttackModifier(effects: StatusEffect[]): number;
/**
 * Get speed modifier from debuffs (slow reduces speed).
 */
export declare function getSpeedModifier(effects: StatusEffect[]): number;
/**
 * Check if bleed reduces healing.
 */
export declare function getHealingModifier(effects: StatusEffect[]): number;
/**
 * Roll for effect application from an attack.
 * Given the attacker's abilities, try to apply each possible effect.
 */
export declare function rollAttackEffects(attackerAbilities: EnemyEffectAbility[], targetEffects: StatusEffect[], sourceId: string, currentTurn: number, targetDefense: number, isCritical: boolean, rng?: () => number): EffectApplicationResult[];
/**
 * Remove a specific effect (for cleanse abilities).
 */
export declare function removeEffect(effects: StatusEffect[], type: StatusEffectType): boolean;
/**
 * Remove all effects (full cleanse).
 */
export declare function clearAllEffects(effects: StatusEffect[]): StatusEffectType[];
/**
 * Get serializable summary of active effects for socket emission.
 */
export declare function serializeEffects(effects: StatusEffect[]): Array<{
    type: StatusEffectType;
    duration: number;
    stacks: number;
    icon: string;
    color: string;
    description: string;
    preventsAction: boolean;
}>;
//# sourceMappingURL=status-effects.d.ts.map