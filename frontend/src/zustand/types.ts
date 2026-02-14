/**
 * Type definitions for Agent Arena 3D Roguelike State Management
 * Comprehensive types for Agent, Dungeon, Inventory, and Game state
 */

// ============================================================================
// AGENT STATE TYPES
// ============================================================================

export type AgentClass = 'warrior' | 'mage' | 'rogue' | 'paladin';

export interface AgentStats {
  level: number;
  experience: number;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  attack: number;
  defense: number;
  speed: number;
  critChance: number;
  dodgeChance: number;
}

export interface Agent {
  id: string;
  userId: string;
  name: string;
  class: AgentClass;
  stats: AgentStats;
  skills: SkillTreeState;
  inventory: InventoryState;
  equipment: EquipmentSlots;
  position: Vector3;
  rotation: Vector3;
  health: number;
  mana: number;
  statusEffects: StatusEffect[];
}

// ============================================================================
// DUNGEON STATE TYPES
// ============================================================================

export type DungeonDifficulty = 'easy' | 'normal' | 'hard' | 'nightmare';
export type RoomType = 'normal' | 'treasure' | 'boss' | 'secret' | 'trap';

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Room {
  id: number;
  position: Vector3;
  width: number;
  height: number;
  type: RoomType;
  discovered: boolean;
  visited: boolean;
  enemies: Enemy[];
  loot: LootDrop[];
  features: RoomFeature[];
}

export interface RoomFeature {
  type: 'trap' | 'treasure' | 'altar' | 'hazard';
  position: Vector3;
  active: boolean;
}

export interface Enemy {
  id: string;
  type: string;
  name: string;
  level: number;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  speed: number;
  position: Vector3;
  statusEffects: StatusEffect[];
  isAlive: boolean;
}

export interface Dungeon {
  id: string;
  agentId: string;
  seed: number;
  difficulty: DungeonDifficulty;
  currentFloor: number;
  maxFloor: number;
  rooms: Room[];
  currentRoomId: number;
  elapsedTime: number;
  goldCollected: number;
  xpGained: number;
}

export interface DungeonSession {
  dungeonId: string;
  isActive: boolean;
  startTime: number;
  isPaused: boolean;
  inCombat: boolean;
  currentEnemies: Enemy[];
}

// ============================================================================
// INVENTORY & EQUIPMENT STATE TYPES
// ============================================================================

export type ItemRarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'mythic';

export type ItemType =
  | 'weapon'
  | 'armor'
  | 'helmet'
  | 'gloves'
  | 'boots'
  | 'ring'
  | 'amulet'
  | 'shield'
  | 'material'
  | 'consumable';

export interface ItemAffix {
  name: string;
  type: 'prefix' | 'suffix';
  statModifier: StatModifier;
  value: number;
}

export interface StatModifier {
  attack?: number;
  defense?: number;
  health?: number;
  mana?: number;
  speed?: number;
  critChance?: number;
  dodgeChance?: number;
  [key: string]: number | undefined;
}

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  level: number;
  baseStats: StatModifier;
  affixes: ItemAffix[];
  sockets: number;
  durability: number;
  maxDurability: number;
  price: number;
  description: string;
}

export interface InventoryItem {
  item: Item;
  quantity: number;
  slot?: number;
}

export interface EquipmentSlots {
  weapon: Item | null;
  offhand: Item | null;
  armor: Item | null;
  helmet: Item | null;
  gloves: Item | null;
  boots: Item | null;
  ring1: Item | null;
  ring2: Item | null;
  amulet: Item | null;
}

export interface InventoryState {
  items: InventoryItem[];
  maxSlots: number;
  usedSlots: number;
  gold: number;
  craftingMaterials: Record<string, number>;
}

// ============================================================================
// SKILL TREE STATE TYPES
// ============================================================================

export type SkillNodeType = 'passive' | 'active' | 'keystone';

export interface SkillNode {
  id: string;
  name: string;
  nodeType: SkillNodeType;
  level: number;
  maxLevel: number;
  skillPoints: number;
  description: string;
  effects: SkillEffect[];
  prerequisites: string[];
  unlocked: boolean;
  allocated: boolean;
  icon: string;
}

export interface SkillEffect {
  type: string;
  value: number;
  modifiers: StatModifier;
}

export interface SkillTree {
  id: string;
  name: string;
  nodes: SkillNode[];
  allocatedPoints: number;
  totalPoints: number;
}

export interface SkillTreeState {
  trees: SkillTree[];
  availablePoints: number;
  activeAbilities: string[];
  passiveEffects: SkillEffect[];
}

// ============================================================================
// COMBAT STATE TYPES
// ============================================================================

export type StatusEffectType =
  | 'stun'
  | 'bleed'
  | 'burn'
  | 'poison'
  | 'freeze'
  | 'slow'
  | 'vulnerability'
  | 'invulnerable'
  | 'regeneration';

export interface StatusEffect {
  type: StatusEffectType;
  duration: number;
  potency: number;
  source: 'player' | 'enemy';
}

export interface CombatAction {
  type: 'attack' | 'ability' | 'defend' | 'item' | 'move';
  targetId: string;
  sourceId: string;
  damage?: number;
  effects?: StatusEffect[];
  timestamp: number;
}

export interface CombatLog {
  actions: CombatAction[];
  turn: number;
  startTime: number;
}

// ============================================================================
// LOOT STATE TYPES
// ============================================================================

export interface LootDrop {
  id: string;
  item: Item;
  position: Vector3;
  collected: boolean;
  quantity: number;
}

export interface LootTable {
  baseItemId: string;
  rarity: ItemRarity;
  affixCount: number;
  dropRate: number;
}

// ============================================================================
// GAME STATE TYPES
// ============================================================================

export type GameMode = 'menu' | 'dungeon' | 'inventory' | 'skills' | 'map';
export type GameState =
  | 'idle'
  | 'exploring'
  | 'combat'
  | 'levelUp'
  | 'dead'
  | 'paused';

export interface GameSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  graphicsQuality: 'low' | 'medium' | 'high' | 'ultra';
  fpsTarget: 60 | 120 | 144;
  vsyncEnabled: boolean;
  fullscreen: boolean;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
}

export interface NetworkState {
  isConnected: boolean;
  latency: number;
  lastSyncTime: number;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
}

// ============================================================================
// COMPLETE GAME STORE STATE
// ============================================================================

export interface GameStoreState {
  // Agents & Players
  currentAgent: Agent | null;
  agents: Agent[];

  // Dungeon
  currentDungeon: Dungeon | null;
  dungeonSession: DungeonSession | null;

  // UI & Mode
  currentMode: GameMode;
  gameState: GameState;
  isPaused: boolean;

  // Network
  networkState: NetworkState;

  // Settings
  settings: GameSettings;

  // Timestamps
  lastUpdate: number;
}

// ============================================================================
// ACTION TYPES
// ============================================================================

export interface GameStoreActions {
  // Agent Management
  setCurrentAgent: (agent: Agent) => void;
  updateAgentStats: (agentId: string, stats: Partial<AgentStats>) => void;
  updateAgentPosition: (position: Vector3) => void;
  addStatusEffect: (effect: StatusEffect) => void;
  removeStatusEffect: (effectType: StatusEffectType) => void;

  // Dungeon Management
  startDungeon: (dungeon: Dungeon) => void;
  endDungeon: () => void;
  updateDungeonSession: (session: DungeonSession) => void;
  moveToRoom: (roomId: number) => void;
  discoverRoom: (roomId: number) => void;

  // Inventory
  addItem: (item: Item, quantity: number) => void;
  removeItem: (itemId: string, quantity: number) => void;
  equipItem: (item: Item, slot: keyof EquipmentSlots) => void;
  unequipItem: (slot: keyof EquipmentSlots) => void;
  updateGold: (amount: number) => void;

  // Combat
  startCombat: (enemies: Enemy[]) => void;
  endCombat: () => void;
  addCombatAction: (action: CombatAction) => void;
  updateEnemyHealth: (enemyId: string, health: number) => void;

  // Skills
  allocateSkillPoints: (points: number, nodeIds: string[]) => void;
  unallocateSkillPoints: (points: number, nodeIds: string[]) => void;
  setActiveAbility: (abilityId: string) => void;

  // Game State
  setGameMode: (mode: GameMode) => void;
  setGameState: (state: GameState) => void;
  togglePause: () => void;
  updateNetworkState: (state: NetworkState) => void;
  updateSettings: (settings: Partial<GameSettings>) => void;

  // Utility
  syncState: () => void;
  resetGame: () => void;
}
