/**
 * Zustand Store Exports
 * Central export file for all game state management
 */

// Store
export { useGameStore } from './gameStore';

// Types
export type {
  GameStoreState,
  GameStoreActions,
  Agent,
  AgentStats,
  AgentClass,
  Dungeon,
  DungeonSession,
  DungeonDifficulty,
  Room,
  RoomType,
  RoomFeature,
  Enemy,
  Item,
  ItemAffix,
  ItemRarity,
  ItemType,
  StatModifier,
  InventoryItem,
  InventoryState,
  EquipmentSlots,
  SkillNode,
  SkillTree,
  SkillTreeState,
  SkillEffect,
  SkillNodeType,
  StatusEffect,
  StatusEffectType,
  CombatAction,
  CombatLog,
  LootDrop,
  LootTable,
  GameMode,
  GameState,
  GameSettings,
  NetworkState,
  Vector3,
} from './types';

// Custom Hooks
export {
  useCurrentAgent,
  useCurrentDungeon,
  useGameMode,
  useGameState,
  useNetworkState,
  useIsPaused,
  useInCombat,
  useCurrentEnemies,
  useInventory,
  useEquippedItems,
  useStatusEffects,
  useGameActions,
  useAgentStats,
  useSkillTrees,
  useGameSettings,
  useUpdateSettings,
  useDungeonRooms,
  useCurrentRoom,
  useDungeonProgress,
} from './useGameState';
