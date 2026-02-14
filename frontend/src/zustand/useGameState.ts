/**
 * Custom hooks for accessing game state with optimized selectors
 * Prevents unnecessary re-renders by using memoized selectors
 */

import { useMemo } from 'react';
import { useGameStore, selectCurrentAgent, selectCurrentDungeon, selectGameMode, selectGameState, selectNetworkState, selectIsPaused, selectInCombat, selectCurrentEnemies } from './gameStore';
import type { Agent, Dungeon, InventoryItem, Item, Enemy, StatusEffect } from './types';

/**
 * Hook to get current agent
 */
export const useCurrentAgent = (): Agent | null => {
  return useGameStore(selectCurrentAgent);
};

/**
 * Hook to get current dungeon
 */
export const useCurrentDungeon = (): Dungeon | null => {
  return useGameStore(selectCurrentDungeon);
};

/**
 * Hook to get game mode
 */
export const useGameMode = () => {
  return useGameStore(selectGameMode);
};

/**
 * Hook to get game state
 */
export const useGameState = () => {
  return useGameStore(selectGameState);
};

/**
 * Hook to get network state
 */
export const useNetworkState = () => {
  return useGameStore(selectNetworkState);
};

/**
 * Hook to get pause state
 */
export const useIsPaused = () => {
  return useGameStore(selectIsPaused);
};

/**
 * Hook to get if in combat
 */
export const useInCombat = () => {
  return useGameStore(selectInCombat);
};

/**
 * Hook to get current enemies
 */
export const useCurrentEnemies = (): Enemy[] => {
  return useGameStore(selectCurrentEnemies);
};

/**
 * Hook to get agent inventory
 */
export const useInventory = (): InventoryItem[] => {
  const agent = useCurrentAgent();
  return useMemo(() => agent?.inventory.items ?? [], [agent]);
};

/**
 * Hook to get equipped items
 */
export const useEquippedItems = () => {
  const agent = useCurrentAgent();
  return useMemo(() => agent?.equipment ?? null, [agent]);
};

/**
 * Hook to get agent status effects
 */
export const useStatusEffects = (): StatusEffect[] => {
  const agent = useCurrentAgent();
  return useMemo(() => agent?.statusEffects ?? [], [agent]);
};

/**
 * Hook to get all game actions
 */
export const useGameActions = () => {
  return useGameStore((state) => ({
    setCurrentAgent: state.setCurrentAgent,
    updateAgentStats: state.updateAgentStats,
    updateAgentPosition: state.updateAgentPosition,
    addStatusEffect: state.addStatusEffect,
    removeStatusEffect: state.removeStatusEffect,
    startDungeon: state.startDungeon,
    endDungeon: state.endDungeon,
    updateDungeonSession: state.updateDungeonSession,
    moveToRoom: state.moveToRoom,
    discoverRoom: state.discoverRoom,
    addItem: state.addItem,
    removeItem: state.removeItem,
    equipItem: state.equipItem,
    unequipItem: state.unequipItem,
    updateGold: state.updateGold,
    startCombat: state.startCombat,
    endCombat: state.endCombat,
    addCombatAction: state.addCombatAction,
    updateEnemyHealth: state.updateEnemyHealth,
    allocateSkillPoints: state.allocateSkillPoints,
    unallocateSkillPoints: state.unallocateSkillPoints,
    setActiveAbility: state.setActiveAbility,
    setGameMode: state.setGameMode,
    setGameState: state.setGameState,
    togglePause: state.togglePause,
    updateNetworkState: state.updateNetworkState,
    updateSettings: state.updateSettings,
    syncState: state.syncState,
    resetGame: state.resetGame,
  }));
};

/**
 * Hook to get agent stats
 */
export const useAgentStats = () => {
  const agent = useCurrentAgent();
  return useMemo(() => agent?.stats ?? null, [agent]);
};

/**
 * Hook to get agent skills
 */
export const useSkillTrees = () => {
  const agent = useCurrentAgent();
  return useMemo(() => agent?.skills ?? null, [agent]);
};

/**
 * Hook to get game settings
 */
export const useGameSettings = () => {
  return useGameStore((state) => state.settings);
};

/**
 * Hook to get game settings actions
 */
export const useUpdateSettings = () => {
  return useGameStore((state) => state.updateSettings);
};

/**
 * Hook to get all room information
 */
export const useDungeonRooms = () => {
  const dungeon = useCurrentDungeon();
  return useMemo(() => dungeon?.rooms ?? [], [dungeon]);
};

/**
 * Hook to get current room
 */
export const useCurrentRoom = () => {
  const dungeon = useCurrentDungeon();
  const rooms = useDungeonRooms();
  
  return useMemo(
    () => rooms.find((room) => room.id === dungeon?.currentRoomId) ?? null,
    [dungeon, rooms]
  );
};

/**
 * Hook to get dungeon progression
 */
export const useDungeonProgress = () => {
  const dungeon = useCurrentDungeon();
  
  return useMemo(
    () => ({
      currentFloor: dungeon?.currentFloor ?? 0,
      maxFloor: dungeon?.maxFloor ?? 10,
      elapsedTime: dungeon?.elapsedTime ?? 0,
      goldCollected: dungeon?.goldCollected ?? 0,
      xpGained: dungeon?.xpGained ?? 0,
    }),
    [dungeon]
  );
};
