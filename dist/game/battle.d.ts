/**
 * Battle Engine
 * Handles turn-based battle logic, damage calculation, effects, win conditions
 */
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
export declare function createBattle(agent1: BattleAgent, agent2: BattleAgent): BattleLog;
/**
 * Determine action order based on speed
 */
export declare function getActionOrder(battle: BattleLog): string[];
/**
 * Calculate hit chance
 * accuracy vs evasion
 */
export declare function calculateHitChance(attacker: BattleAgent, defender: BattleAgent): number;
/**
 * Calculate damage from an attack
 * BALANCED: Improved scaling formula for better late-game progression
 * Base: (attacker_attack * 1.1) - (defender_defense * 0.9) + variance
 */
export declare function calculateDamage(attacker: BattleAgent, defender: BattleAgent): {
    damage: number;
    critical: boolean;
};
/**
 * Apply status effect
 */
export declare function applyEffect(agent: BattleAgent, effect: StatusEffect): void;
/**
 * Process attack action
 */
export declare function processAttack(attacker: BattleAgent, defender: BattleAgent, battle: BattleLog): BattleAction;
/**
 * Process defend action
 */
export declare function processDefend(agent: BattleAgent): BattleAction;
/**
 * Apply end-of-turn effects (bleed, burn, poison)
 */
export declare function applyEndOfTurnEffects(agent: BattleAgent): number;
/**
 * Check if battle is won
 */
export declare function checkWinCondition(battle: BattleLog): string | null;
/**
 * Process one full turn (both agents act)
 */
export declare function processTurn(battle: BattleLog, agent1Action: {
    type: ActionType;
    target_id?: string;
}, agent2Action: {
    type: ActionType;
    target_id?: string;
}): BattleTurn;
/**
 * Calculate rewards
 */
export interface BattleRewards {
    experience: number;
    gold: number;
    rating_change: number;
}
export declare function calculateRewards(winner: BattleAgent, loser: BattleAgent, winnerRating: number, loserRating: number): BattleRewards;
//# sourceMappingURL=battle.d.ts.map