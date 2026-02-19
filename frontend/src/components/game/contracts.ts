import type { DoctrineColor } from './codex';

export type ContractTier = 'bronze' | 'silver' | 'gold';

export interface ContractReward {
  doctrineXP?: { doctrine: 'iron' | 'arc' | 'edge'; amount: number };
  ember?: number;
  arenaMarks?: number;
  techniqueFragment?: 'iron' | 'arc' | 'edge';
  title?: string;
  codexProgress?: string; // codex entry id to advance
}

export interface Contract {
  id: string;
  title: string;
  constraint: string;
  description: string;
  doctrine: DoctrineColor;
  tier: ContractTier;
  rewards: ContractReward;
  rewardDisplay: string; // human-readable rewards summary
}

export const ALL_CONTRACTS: Contract[] = [
  // ── BRONZE ────────────────────────────────────────────────────────────────
  {
    id: 'scorched_earth',
    title: 'Scorched Earth',
    constraint: 'Kill 30 enemies using abilities only',
    description: 'Melee kills do not count toward the goal. Prove your Arc mastery.',
    doctrine: 'arc',
    tier: 'bronze',
    rewards: { doctrineXP: { doctrine: 'arc', amount: 80 }, ember: 2 },
    rewardDisplay: '80 Arc XP · 2 Ember',
  },
  {
    id: 'stand_your_ground',
    title: 'Stand Your Ground',
    constraint: 'Complete 3 combat rooms without using Dash',
    description: 'No dashing allowed. Face every enemy head-on. Iron Doctrine rewarded.',
    doctrine: 'iron',
    tier: 'bronze',
    rewards: { doctrineXP: { doctrine: 'iron', amount: 80 }, ember: 2 },
    rewardDisplay: '80 Iron XP · 2 Ember',
  },
  {
    id: 'quick_hands',
    title: 'Quick Hands',
    constraint: 'Kill 10 enemies within 15 seconds',
    description: 'Speed is everything. Strike fast, strike often. Edge rewards the swift.',
    doctrine: 'edge',
    tier: 'bronze',
    rewards: { doctrineXP: { doctrine: 'edge', amount: 80 }, ember: 2 },
    rewardDisplay: '80 Edge XP · 2 Ember',
  },
  {
    id: 'frugal_fighter',
    title: 'Frugal Fighter',
    constraint: 'Complete a run spending 0 Valor',
    description: 'Resist every temptation. Leave the shop untouched.',
    doctrine: 'gold',
    tier: 'bronze',
    rewards: { ember: 3, doctrineXP: { doctrine: 'iron', amount: 40 } },
    rewardDisplay: '3 Ember · 40 Iron XP',
  },

  // ── SILVER ────────────────────────────────────────────────────────────────
  {
    id: 'ironclad',
    title: 'Ironclad',
    constraint: 'Complete an entire run without healing',
    description: 'No heals, no rest nodes, no potions. Pure Iron endurance.',
    doctrine: 'iron',
    tier: 'silver',
    rewards: { doctrineXP: { doctrine: 'iron', amount: 200 }, ember: 4, arenaMarks: 1 },
    rewardDisplay: '200 Iron XP · 4 Ember · 1 Arena Mark',
  },
  {
    id: 'glass_cannon',
    title: 'Glass Cannon',
    constraint: 'Start with 30% max HP, deal 2× damage',
    description: 'High risk, high reward. Edge doctrine for those who dare.',
    doctrine: 'edge',
    tier: 'silver',
    rewards: { doctrineXP: { doctrine: 'edge', amount: 200 }, techniqueFragment: 'edge' },
    rewardDisplay: '200 Edge XP · 1 Green Technique Fragment',
  },
  {
    id: 'overloaded',
    title: 'Overloaded',
    constraint: 'Ability cooldowns halved, but each use costs 5% HP',
    description: 'Power at a price. Arc mastery tested against your own body.',
    doctrine: 'arc',
    tier: 'silver',
    rewards: { doctrineXP: { doctrine: 'arc', amount: 200 }, ember: 4, arenaMarks: 1 },
    rewardDisplay: '200 Arc XP · 4 Ember · 1 Arena Mark',
  },
  {
    id: 'pacifist',
    title: 'Pacifist Run',
    constraint: 'Reach Floor 5 using only abilities (no basic attacks)',
    description: 'Abilities only. Your melee arm stays sheathed. Arc and Edge reward creativity.',
    doctrine: 'gold',
    tier: 'silver',
    rewards: { ember: 5, arenaMarks: 1, doctrineXP: { doctrine: 'arc', amount: 100 } },
    rewardDisplay: '5 Ember · 1 Arena Mark · 100 Arc XP',
  },
];

export const TIER_COLORS: Record<ContractTier, string> = {
  bronze: '#cd7f32',
  silver: '#a8a9ad',
  gold:   '#d4a843',
};

export const TIER_LABELS: Record<ContractTier, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold:   'Gold',
};

// Active contracts = first 4 (simulating rotation; in production this would be time-based)
export function getActiveContracts(): Contract[] {
  return ALL_CONTRACTS.slice(0, 4);
}
