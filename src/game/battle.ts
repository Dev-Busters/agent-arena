/**
 * Battle Engine
 * Handles turn-based battle logic, damage calculation, effects, win conditions
 */

import { v4 as uuidv4 } from 'uuid';

export type BattleStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type ActionType = 'attack' | 'defend' | 'ability' | 'item';
export type StatusEffect = 'stun' | 'bleed' | 'burn' | 'poison' | 'defend';

export interface AgentStats {
  max_hp: number;
  current_hp: number;
  attack: number;
  defense: number;
  speed: number;
  accuracy: number;
  evasion: number;
}

export interface BattleAgent {
  id: string;
  user_id: string;
  name: string;
  class: string;
  stats: AgentStats;
  effects: StatusEffect[];
  defended: boolean;
}

export interface BattleAction {
  type: ActionType;
  agent_id: string;
  target_id: string;
  damage?: number;
  healed?: number;
  effect?: StatusEffect;
  critical: boolean;
  missed: boolean;
  timestamp: number;
}

export interface BattleTurn {
  turn_number: number;
  actions: BattleAction[];
  timestamp: number;
}

export interface BattleLog {
  id: string;
  agent1: BattleAgent;
  agent2: BattleAgent;
  turns: BattleTurn[];
  winner_id: string | null;
  status: BattleStatus;
  started_at: number;
  ended_at: number | null;
  duration_ms: number;
}

/**
 * Initialize a new battle
 */
export function createBattle(agent1: BattleAgent, agent2: BattleAgent): BattleLog {
  return {
    id: uuidv4(),
    agent1: JSON.parse(JSON.stringify(agent1)), // Deep copy
    agent2: JSON.parse(JSON.stringify(agent2)),
    turns: [],
    winner_id: null,
    status: 'in_progress',
    started_at: Date.now(),
    ended_at: null,
    duration_ms: 0
  };
}

/**
 * Determine action order based on speed
 */
export function getActionOrder(battle: BattleLog): string[] {
  const speed1 = battle.agent1.stats.speed + Math.random() * 5;
  const speed2 = battle.agent2.stats.speed + Math.random() * 5;
  return speed1 >= speed2 ? [battle.agent1.id, battle.agent2.id] : [battle.agent2.id, battle.agent1.id];
}

/**
 * Calculate hit chance
 * accuracy vs evasion
 */
export function calculateHitChance(attacker: BattleAgent, defender: BattleAgent): number {
  const baseChance = 0.85; // 85% base hit rate
  const accuracyBonus = (attacker.stats.accuracy - 50) / 100 * 0.15; // ±15% based on accuracy
  const evasionPenalty = (defender.stats.evasion - 50) / 100 * 0.15; // ±15% based on evasion
  const defendBonus = defender.defended ? -0.15 : 0; // 15% harder to hit when defending

  const finalChance = Math.max(0.2, Math.min(0.95, baseChance + accuracyBonus - evasionPenalty + defendBonus));
  return finalChance;
}

/**
 * Calculate damage from an attack
 * Base: (attacker_attack - defender_defense) + random
 */
export function calculateDamage(attacker: BattleAgent, defender: BattleAgent): { damage: number; critical: boolean } {
  // Check for critical hit (10% base chance)
  const critChance = Math.min(0.25, attacker.stats.accuracy / 500);
  const isCritical = Math.random() < critChance;

  // Base damage
  let damage = attacker.stats.attack - defender.stats.defense;

  // Add variance
  const variance = Math.floor(Math.random() * 21 - 10); // -10 to +10
  damage += variance;

  // Critical multiplier
  if (isCritical) {
    damage = Math.floor(damage * 1.5);
  }

  // Defend multiplier
  if (defender.defended) {
    damage = Math.floor(damage * 0.6);
  }

  // Bleeding effect
  if (defender.effects.includes('bleed')) {
    damage = Math.floor(damage * 0.85); // 15% reduced damage
  }

  // Minimum damage is 1
  damage = Math.max(1, damage);

  return { damage, critical: isCritical };
}

/**
 * Apply status effect
 */
export function applyEffect(agent: BattleAgent, effect: StatusEffect): void {
  if (!agent.effects.includes(effect)) {
    agent.effects.push(effect);
  }
}

/**
 * Process attack action
 */
export function processAttack(
  attacker: BattleAgent,
  defender: BattleAgent,
  battle: BattleLog
): BattleAction {
  const hitChance = calculateHitChance(attacker, defender);
  const missed = Math.random() > hitChance;

  if (missed) {
    return {
      type: 'attack',
      agent_id: attacker.id,
      target_id: defender.id,
      damage: 0,
      critical: false,
      missed: true,
      timestamp: Date.now()
    };
  }

  const { damage, critical } = calculateDamage(attacker, defender);
  defender.stats.current_hp = Math.max(0, defender.stats.current_hp - damage);

  // Apply bleed effect on critical hits (30% chance)
  if (critical && Math.random() < 0.3) {
    applyEffect(defender, 'bleed');
  }

  return {
    type: 'attack',
    agent_id: attacker.id,
    target_id: defender.id,
    damage,
    critical,
    missed: false,
    timestamp: Date.now()
  };
}

/**
 * Process defend action
 */
export function processDefend(agent: BattleAgent): BattleAction {
  agent.defended = true;
  return {
    type: 'defend',
    agent_id: agent.id,
    target_id: agent.id,
    critical: false,
    missed: false,
    timestamp: Date.now()
  };
}

/**
 * Apply end-of-turn effects (bleed, burn, poison)
 */
export function applyEndOfTurnEffects(agent: BattleAgent): number {
  let damageDealt = 0;

  if (agent.effects.includes('bleed')) {
    const bleedDamage = Math.floor(agent.stats.max_hp * 0.05); // 5% of max HP
    agent.stats.current_hp = Math.max(0, agent.stats.current_hp - bleedDamage);
    damageDealt += bleedDamage;
  }

  if (agent.effects.includes('burn')) {
    const burnDamage = Math.floor(agent.stats.max_hp * 0.08); // 8% of max HP
    agent.stats.current_hp = Math.max(0, agent.stats.current_hp - burnDamage);
    damageDealt += burnDamage;
  }

  if (agent.effects.includes('poison')) {
    const poisonDamage = Math.floor(agent.stats.max_hp * 0.03); // 3% of max HP
    agent.stats.current_hp = Math.max(0, agent.stats.current_hp - poisonDamage);
    damageDealt += poisonDamage;
  }

  // Clear defend flag at end of turn
  agent.defended = false;

  return damageDealt;
}

/**
 * Check if battle is won
 */
export function checkWinCondition(battle: BattleLog): string | null {
  if (battle.agent1.stats.current_hp <= 0) {
    return battle.agent2.id;
  }
  if (battle.agent2.stats.current_hp <= 0) {
    return battle.agent1.id;
  }
  return null;
}

/**
 * Process one full turn (both agents act)
 */
export function processTurn(
  battle: BattleLog,
  agent1Action: { type: ActionType; target_id?: string },
  agent2Action: { type: ActionType; target_id?: string }
): BattleTurn {
  const turnNumber = battle.turns.length + 1;
  const actions: BattleAction[] = [];

  // Determine order
  const order = getActionOrder(battle);

  // Process actions in order
  for (const agentId of order) {
    const attacker = agentId === battle.agent1.id ? battle.agent1 : battle.agent2;
    const defender = agentId === battle.agent1.id ? battle.agent2 : battle.agent1;
    const action = agentId === battle.agent1.id ? agent1Action : agent2Action;

    if (action.type === 'attack') {
      const battleAction = processAttack(attacker, defender, battle);
      actions.push(battleAction);
    } else if (action.type === 'defend') {
      const battleAction = processDefend(attacker);
      actions.push(battleAction);
    }

    // Check for win after each action
    const winner = checkWinCondition(battle);
    if (winner) {
      battle.winner_id = winner;
      battle.status = 'completed';
      battle.ended_at = Date.now();
      battle.duration_ms = battle.ended_at - battle.started_at;
      break;
    }
  }

  // Apply end-of-turn effects
  if (battle.status !== 'completed') {
    applyEndOfTurnEffects(battle.agent1);
    applyEndOfTurnEffects(battle.agent2);

    // Check again after effects
    const winner = checkWinCondition(battle);
    if (winner) {
      battle.winner_id = winner;
      battle.status = 'completed';
      battle.ended_at = Date.now();
      battle.duration_ms = battle.ended_at - battle.started_at;
    }
  }

  const turn: BattleTurn = {
    turn_number: turnNumber,
    actions,
    timestamp: Date.now()
  };

  battle.turns.push(turn);
  return turn;
}

/**
 * Calculate rewards
 */
export interface BattleRewards {
  experience: number;
  gold: number;
  rating_change: number;
}

export function calculateRewards(winner: BattleAgent, loser: BattleAgent, winnerRating: number, loserRating: number): BattleRewards {
  // Base experience
  const baseExp = 100;
  const levelDiff = loser.stats.max_hp - winner.stats.max_hp; // Rough proxy for level
  const diffBonus = Math.max(0, levelDiff / 50); // Bonus for beating stronger opponents
  const experience = Math.floor(baseExp * (1 + diffBonus));

  // Gold
  const gold = Math.floor(50 + Math.random() * 50); // 50-100 gold

  // Rating change (ELO-style)
  const expectedWinRate = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
  const ratingChange = Math.round(32 * (1 - expectedWinRate));

  return { experience, gold, rating_change: ratingChange };
}
