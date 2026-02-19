// Stub: Status Effects (TODO: implement in Phase H)

export interface StatusEffect {
  id: string;
  name: string;
  type: StatusEffectType;
}

export enum StatusEffectType {
  Poison = 'poison',
  Stun = 'stun',
  Burn = 'burn',
  Freeze = 'freeze',
}

export interface EffectApplicationResult {
  applied: boolean;
  message: string;
}

export function applyStatusEffect() { return {}; }
export function removeStatusEffect() { return {}; }
export function rollAttackEffects() { return []; }
export function processStatusEffects() { return {}; }
export function isStunned() { return false; }
export function getAttackModifier() { return 1.0; }
export function getSpeedModifier() { return 1.0; }
export function serializeEffects() { return []; }
export function removeEffect() { return null; }

export const STATUS_EFFECTS: Record<string, StatusEffect> = {
  poison: { id: 'poison', name: 'Poison', type: StatusEffectType.Poison },
  stun: { id: 'stun', name: 'Stun', type: StatusEffectType.Stun },
};

export const ENEMY_EFFECT_ABILITIES = {};
export const PLAYER_EFFECT_ABILITIES = {};
