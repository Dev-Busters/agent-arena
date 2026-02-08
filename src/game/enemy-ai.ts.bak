/**
 * Enemy AI Behavior Patterns
 * Implements behavior trees for enemy decision-making
 */

export type AIBehavior = "aggressive" | "defensive" | "ranged" | "support" | "boss";
export type AIAction = "attack" | "defend" | "ability" | "flee";

export interface EnemyAI {
  behavior: AIBehavior;
  aggressiveness: number; // 0-1
  defensiveness: number; // 0-1
  rangedPreference: number; // 0-1 (prefer ranged attacks)
  fleeThreshold: number; // HP % at which enemy flees (0-1)
}

export const AI_PATTERNS: Record<string, EnemyAI> = {
  goblin: {
    behavior: "aggressive",
    aggressiveness: 0.7,
    defensiveness: 0.2,
    rangedPreference: 0.3,
    fleeThreshold: 0.2, // Flees at 20% HP
  },
  skeleton: {
    behavior: "aggressive",
    aggressiveness: 0.8,
    defensiveness: 0.3,
    rangedPreference: 0.2,
    fleeThreshold: 0, // Undead don't flee
  },
  orc: {
    behavior: "aggressive",
    aggressiveness: 0.9,
    defensiveness: 0.2,
    rangedPreference: 0.1,
    fleeThreshold: 0, // Orcs fight to death
  },
  wraith: {
    behavior: "ranged",
    aggressiveness: 0.6,
    defensiveness: 0.5,
    rangedPreference: 0.9,
    fleeThreshold: 0.3,
  },
  boss_skeleton: {
    behavior: "boss",
    aggressiveness: 1.0,
    defensiveness: 0.7,
    rangedPreference: 0.4,
    fleeThreshold: 0, // Bosses never flee
  },
  boss_dragon: {
    behavior: "boss",
    aggressiveness: 1.0,
    defensiveness: 0.6,
    rangedPreference: 0.8,
    fleeThreshold: 0,
  },
  boss_lich: {
    behavior: "boss",
    aggressiveness: 0.8,
    defensiveness: 0.9,
    rangedPreference: 1.0,
    fleeThreshold: 0,
  },
};

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
export function decideEnemyAction(
  aiPattern: EnemyAI,
  state: BattleState,
  rng: () => number
): AIAction {
  // Check if should flee
  const currentHpPercent = state.enemyHp / state.enemyMaxHp;
  if (
    currentHpPercent < aiPattern.fleeThreshold &&
    aiPattern.fleeThreshold > 0
  ) {
    return "flee";
  }

  // Check if should defend (low HP or high incoming damage prediction)
  const defenseThreshold = 0.5;
  const predictedDamage =
    state.playerAttack -
    state.enemyDefense +
    Math.random() * 10 -
    5;
  if (
    currentHpPercent < defenseThreshold &&
    predictedDamage > state.enemyHp * 0.2
  ) {
    // Take defensive action if we'd take significant damage
    if (aiPattern.defensiveness > rng() && !state.enemyDefended) {
      return "defend";
    }
  }

  // Boss-specific logic: More complex patterns
  if (aiPattern.behavior === "boss") {
    return decideBossAction(aiPattern, state, rng);
  }

  // Regular behavior logic
  const roll = rng();

  // Ranged enemies prefer ranged attacks
  if (aiPattern.rangedPreference > rng()) {
    return "ability"; // Use ranged ability
  }

  // Check if we should defend
  if (aiPattern.defensiveness > roll) {
    return "defend";
  }

  // Default: attack based on aggressiveness
  if (aiPattern.aggressiveness > roll) {
    return "attack";
  }

  return "attack"; // Default to attack
}

/**
 * Boss-specific AI decision making
 * Bosses have phases and more strategic behavior
 */
function decideBossAction(
  aiPattern: EnemyAI,
  state: BattleState,
  rng: () => number
): AIAction {
  const currentHpPercent = state.enemyHp / state.enemyMaxHp;

  // Phase 1: > 75% HP - Aggressive
  if (currentHpPercent > 0.75) {
    return rng() < 0.7 ? "attack" : "ability";
  }

  // Phase 2: 50-75% HP - Mixed aggressive/defensive
  if (currentHpPercent > 0.5) {
    const roll = rng();
    if (roll < 0.3) return "defend";
    if (roll < 0.6) return "ability";
    return "attack";
  }

  // Phase 3: 25-50% HP - Defensive/Ranged focus
  if (currentHpPercent > 0.25) {
    const roll = rng();
    if (roll < 0.4) return "defend";
    if (roll < 0.7) return "ability";
    return "attack";
  }

  // Phase 4: < 25% HP - Desperate (all-in attacks)
  return rng() < 0.6 ? "ability" : "attack";
}

/**
 * Calculate expected damage output for an enemy
 */
export function calculateEnemyDamage(
  enemyAttack: number,
  playerDefense: number,
  _playerDefended: boolean,
  critical: boolean = false
): number {
  let baseDamage = Math.max(1, enemyAttack - playerDefense);

  // Critical hit does 1.5x damage (15% chance)
  if (critical) {
    baseDamage = Math.floor(baseDamage * 1.5);
  }

  // Variance: ±20%
  baseDamage += Math.floor((Math.random() - 0.5) * baseDamage * 0.4);

  return Math.max(1, baseDamage);
}

/**
 * Get AI personality description
 */
export function getAIPersonality(behavior: AIBehavior): string {
  const personalities: Record<AIBehavior, string> = {
    aggressive:
      "Charges forward with fury, attacking relentlessly with raw power.",
    defensive: "Stands its ground, protecting itself while counterattacking.",
    ranged: "Strikes from afar, avoiding close combat with magical ranged attacks.",
    support:
      "Coordinates with allies, using defensive and healing abilities.",
    boss: "Adapts strategically, changing tactics as its health depletes.",
  };
  return personalities[behavior];
}
