/**
 * Enemy AI Behavior Patterns
 * Implements behavior trees for enemy decision-making
 */
export type AIBehavior = "aggressive" | "defensive" | "ranged" | "support" | "boss";
export type AIAction = "attack" | "defend" | "ability" | "flee";
export interface EnemyAI {
    behavior: AIBehavior;
    aggressiveness: number;
    defensiveness: number;
    rangedPreference: number;
    fleeThreshold: number;
}
export declare const AI_PATTERNS: Record<string, EnemyAI>;
export interface BattleState {
    playerHp: number;
    playerMaxHp: number;
    playerAttack: number;
    playerDefense: number;
    enemyHp: number;
    enemyMaxHp: number;
    enemyAttack: number;
    enemyDefense: number;
    playerDefended: boolean;
    enemyDefended: boolean;
    turnsElapsed: number;
}
/**
 * Decide enemy action based on behavior pattern and battle state
 */
export declare function decideEnemyAction(aiPattern: EnemyAI, state: BattleState, rng: () => number): AIAction;
/**
 * Calculate expected damage output for an enemy
 */
export declare function calculateEnemyDamage(enemyAttack: number, playerDefense: number, _playerDefended: boolean, critical?: boolean): number;
/**
 * Get AI personality description
 */
export declare function getAIPersonality(behavior: AIBehavior): string;
//# sourceMappingURL=enemy-ai.d.ts.map