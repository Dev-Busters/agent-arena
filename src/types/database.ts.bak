/**
 * Database Types
 * Generated from schema - auto-updated by type-gen skill
 */

export interface User {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  level: number;
  experience: number;
  wins: number;
  losses: number;
  gold: number;
  created_at: Date;
  updated_at: Date;
  last_login: Date | null;
}

export interface Agent {
  id: string;
  user_id: string;
  name: string;
  class: 'warrior' | 'mage' | 'rogue' | 'paladin';
  level: number;
  experience: number;
  max_hp: number;
  current_hp: number;
  attack: number;
  defense: number;
  speed: number;
  accuracy: number;
  evasion: number;
  created_at: Date;
  updated_at: Date;
}

export interface Equipment {
  id: string;
  agent_id: string;
  slot: 'weapon' | 'armor' | 'accessory';
  item_id: string;
  equipped_at: Date;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  type: 'weapon' | 'armor' | 'accessory' | 'consumable';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  stats: {
    attack?: number;
    defense?: number;
    hp?: number;
    speed?: number;
    accuracy?: number;
    evasion?: number;
  };
  price: number;
  created_at: Date;
}

export interface Battle {
  id: string;
  agent1_id: string;
  agent2_id: string;
  winner_id: string | null;
  battle_log: string;
  duration_ms: number;
  experience_awarded: number;
  gold_awarded: number;
  created_at: Date;
  completed_at: Date | null;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface Leaderboard {
  user_id: string;
  username: string;
  rating: number;
  wins: number;
  losses: number;
  win_rate: number;
  rank: number;
  updated_at: Date;
}

export interface GameSession {
  id: string;
  user_id: string;
  socket_id: string;
  status: 'active' | 'in_battle' | 'idle';
  connected_at: Date;
  last_activity: Date;
}
