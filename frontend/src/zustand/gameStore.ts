/**
 * Agent Arena 3D Roguelike - Main Zustand Store
 * Real-time state management for the entire game
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  GameStoreState,
  GameStoreActions,
  Agent,
  Dungeon,
  DungeonSession,
  GameMode,
  GameState,
  Item,
  Enemy,
  StatusEffect,
  StatusEffectType,
  CombatAction,
  NetworkState,
  GameSettings,
} from './types';

type GameStore = GameStoreState & GameStoreActions;

const DEFAULT_SETTINGS: GameSettings = {
  masterVolume: 0.8,
  musicVolume: 0.6,
  sfxVolume: 0.8,
  graphicsQuality: 'high',
  fpsTarget: 60,
  vsyncEnabled: true,
  fullscreen: false,
  colorBlindMode: 'none',
};

const DEFAULT_NETWORK_STATE: NetworkState = {
  isConnected: false,
  latency: 0,
  lastSyncTime: Date.now(),
  connectionStatus: 'disconnected',
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // ========================================================================
      // INITIAL STATE
      // ========================================================================
      currentAgent: null,
      agents: [],
      currentDungeon: null,
      dungeonSession: null,
      currentMode: 'menu',
      gameState: 'idle',
      isPaused: false,
      networkState: DEFAULT_NETWORK_STATE,
      settings: DEFAULT_SETTINGS,
      lastUpdate: Date.now(),

      // ========================================================================
      // AGENT MANAGEMENT ACTIONS
      // ========================================================================

      setCurrentAgent: (agent: Agent) =>
        set((state) => ({
          currentAgent: agent,
          lastUpdate: Date.now(),
        })),

      updateAgentStats: (agentId: string, statsUpdate) =>
        set((state) => {
          if (!state.currentAgent || state.currentAgent.id !== agentId) {
            return state;
          }

          return {
            currentAgent: {
              ...state.currentAgent,
              stats: {
                ...state.currentAgent.stats,
                ...statsUpdate,
              },
            },
            lastUpdate: Date.now(),
          };
        }),

      updateAgentPosition: (position) =>
        set((state) => {
          if (!state.currentAgent) return state;

          return {
            currentAgent: {
              ...state.currentAgent,
              position,
            },
            lastUpdate: Date.now(),
          };
        }),

      addStatusEffect: (effect: StatusEffect) =>
        set((state) => {
          if (!state.currentAgent) return state;

          return {
            currentAgent: {
              ...state.currentAgent,
              statusEffects: [
                ...state.currentAgent.statusEffects,
                effect,
              ],
            },
            lastUpdate: Date.now(),
          };
        }),

      removeStatusEffect: (effectType: StatusEffectType) =>
        set((state) => {
          if (!state.currentAgent) return state;

          return {
            currentAgent: {
              ...state.currentAgent,
              statusEffects: state.currentAgent.statusEffects.filter(
                (e) => e.type !== effectType
              ),
            },
            lastUpdate: Date.now(),
          };
        }),

      // ========================================================================
      // DUNGEON MANAGEMENT ACTIONS
      // ========================================================================

      startDungeon: (dungeon: Dungeon) =>
        set((state) => ({
          currentDungeon: dungeon,
          dungeonSession: {
            dungeonId: dungeon.id,
            isActive: true,
            startTime: Date.now(),
            isPaused: false,
            inCombat: false,
            currentEnemies: [],
          },
          currentMode: 'dungeon',
          gameState: 'exploring',
          lastUpdate: Date.now(),
        })),

      endDungeon: () =>
        set((state) => ({
          currentDungeon: null,
          dungeonSession: null,
          currentMode: 'menu',
          gameState: 'idle',
          lastUpdate: Date.now(),
        })),

      updateDungeonSession: (session: DungeonSession) =>
        set((state) => ({
          dungeonSession: session,
          lastUpdate: Date.now(),
        })),

      moveToRoom: (roomId: number) =>
        set((state) => {
          if (!state.currentDungeon) return state;

          return {
            currentDungeon: {
              ...state.currentDungeon,
              currentRoomId: roomId,
            },
            lastUpdate: Date.now(),
          };
        }),

      discoverRoom: (roomId: number) =>
        set((state) => {
          if (!state.currentDungeon) return state;

          return {
            currentDungeon: {
              ...state.currentDungeon,
              rooms: state.currentDungeon.rooms.map((room) =>
                room.id === roomId ? { ...room, discovered: true } : room
              ),
            },
            lastUpdate: Date.now(),
          };
        }),

      // ========================================================================
      // INVENTORY ACTIONS
      // ========================================================================

      addItem: (item: Item, quantity: number) =>
        set((state) => {
          if (!state.currentAgent) return state;

          const inventory = state.currentAgent.inventory;
          const existingItem = inventory.items.find(
            (invItem) => invItem.item.id === item.id
          );

          let updatedItems;
          if (existingItem) {
            updatedItems = inventory.items.map((invItem) =>
              invItem.item.id === item.id
                ? { ...invItem, quantity: invItem.quantity + quantity }
                : invItem
            );
          } else {
            updatedItems = [
              ...inventory.items,
              { item, quantity, slot: undefined },
            ];
          }

          return {
            currentAgent: {
              ...state.currentAgent,
              inventory: {
                ...inventory,
                items: updatedItems,
                usedSlots: updatedItems.filter((i) => i.slot !== undefined)
                  .length,
              },
            },
            lastUpdate: Date.now(),
          };
        }),

      removeItem: (itemId: string, quantity: number) =>
        set((state) => {
          if (!state.currentAgent) return state;

          const inventory = state.currentAgent.inventory;
          const updatedItems = inventory.items
            .map((invItem) =>
              invItem.item.id === itemId
                ? {
                    ...invItem,
                    quantity: Math.max(0, invItem.quantity - quantity),
                  }
                : invItem
            )
            .filter((invItem) => invItem.quantity > 0);

          return {
            currentAgent: {
              ...state.currentAgent,
              inventory: {
                ...inventory,
                items: updatedItems,
                usedSlots: updatedItems.filter((i) => i.slot !== undefined)
                  .length,
              },
            },
            lastUpdate: Date.now(),
          };
        }),

      equipItem: (item: Item, slot) =>
        set((state) => {
          if (!state.currentAgent) return state;

          return {
            currentAgent: {
              ...state.currentAgent,
              equipment: {
                ...state.currentAgent.equipment,
                [slot]: item,
              },
            },
            lastUpdate: Date.now(),
          };
        }),

      unequipItem: (slot) =>
        set((state) => {
          if (!state.currentAgent) return state;

          return {
            currentAgent: {
              ...state.currentAgent,
              equipment: {
                ...state.currentAgent.equipment,
                [slot]: null,
              },
            },
            lastUpdate: Date.now(),
          };
        }),

      updateGold: (amount: number) =>
        set((state) => {
          if (!state.currentAgent) return state;

          return {
            currentAgent: {
              ...state.currentAgent,
              inventory: {
                ...state.currentAgent.inventory,
                gold: Math.max(
                  0,
                  state.currentAgent.inventory.gold + amount
                ),
              },
            },
            lastUpdate: Date.now(),
          };
        }),

      // ========================================================================
      // COMBAT ACTIONS
      // ========================================================================

      startCombat: (enemies: Enemy[]) =>
        set((state) => ({
          gameState: 'combat',
          dungeonSession: state.dungeonSession
            ? {
                ...state.dungeonSession,
                inCombat: true,
                currentEnemies: enemies,
              }
            : null,
          lastUpdate: Date.now(),
        })),

      endCombat: () =>
        set((state) => ({
          gameState: 'exploring',
          dungeonSession: state.dungeonSession
            ? {
                ...state.dungeonSession,
                inCombat: false,
                currentEnemies: [],
              }
            : null,
          lastUpdate: Date.now(),
        })),

      addCombatAction: (action: CombatAction) =>
        set((state) => {
          // Combat log can be extended as needed
          // For now, we update enemy health if applicable
          return {
            lastUpdate: Date.now(),
          };
        }),

      updateEnemyHealth: (enemyId: string, health: number) =>
        set((state) => {
          if (!state.dungeonSession) return state;

          return {
            dungeonSession: {
              ...state.dungeonSession,
              currentEnemies: state.dungeonSession.currentEnemies.map(
                (enemy) =>
                  enemy.id === enemyId
                    ? {
                        ...enemy,
                        health,
                        isAlive: health > 0,
                      }
                    : enemy
              ),
            },
            lastUpdate: Date.now(),
          };
        }),

      // ========================================================================
      // SKILL TREE ACTIONS
      // ========================================================================

      allocateSkillPoints: (points: number, nodeIds: string[]) =>
        set((state) => {
          if (!state.currentAgent) return state;

          const newAvailablePoints = state.currentAgent.skills.availablePoints - points;
          if (newAvailablePoints < 0) return state;

          return {
            currentAgent: {
              ...state.currentAgent,
              skills: {
                ...state.currentAgent.skills,
                trees: state.currentAgent.skills.trees.map((tree) => ({
                  ...tree,
                  nodes: tree.nodes.map((node) =>
                    nodeIds.includes(node.id)
                      ? { ...node, allocated: true }
                      : node
                  ),
                })),
                availablePoints: newAvailablePoints,
              },
            },
            lastUpdate: Date.now(),
          };
        }),

      unallocateSkillPoints: (points: number, nodeIds: string[]) =>
        set((state) => {
          if (!state.currentAgent) return state;

          return {
            currentAgent: {
              ...state.currentAgent,
              skills: {
                ...state.currentAgent.skills,
                trees: state.currentAgent.skills.trees.map((tree) => ({
                  ...tree,
                  nodes: tree.nodes.map((node) =>
                    nodeIds.includes(node.id)
                      ? { ...node, allocated: false }
                      : node
                  ),
                })),
                availablePoints: state.currentAgent.skills.availablePoints + points,
              },
            },
            lastUpdate: Date.now(),
          };
        }),

      setActiveAbility: (abilityId: string) =>
        set((state) => {
          if (!state.currentAgent) return state;

          return {
            currentAgent: {
              ...state.currentAgent,
              skills: {
                ...state.currentAgent.skills,
                activeAbilities: [
                  ...state.currentAgent.skills.activeAbilities,
                  abilityId,
                ].slice(-4), // Max 4 active abilities
              },
            },
            lastUpdate: Date.now(),
          };
        }),

      // ========================================================================
      // GAME STATE ACTIONS
      // ========================================================================

      setGameMode: (mode: GameMode) =>
        set((state) => ({
          currentMode: mode,
          lastUpdate: Date.now(),
        })),

      setGameState: (gameState: GameState) =>
        set((state) => ({
          gameState,
          lastUpdate: Date.now(),
        })),

      togglePause: () =>
        set((state) => ({
          isPaused: !state.isPaused,
          lastUpdate: Date.now(),
        })),

      updateNetworkState: (networkState: NetworkState) =>
        set((state) => ({
          networkState,
          lastUpdate: Date.now(),
        })),

      updateSettings: (settingsUpdate: Partial<GameSettings>) =>
        set((state) => ({
          settings: {
            ...state.settings,
            ...settingsUpdate,
          },
          lastUpdate: Date.now(),
        })),

      // ========================================================================
      // UTILITY ACTIONS
      // ========================================================================

      syncState: () =>
        set((state) => ({
          lastUpdate: Date.now(),
        })),

      resetGame: () =>
        set((state) => ({
          currentAgent: null,
          agents: [],
          currentDungeon: null,
          dungeonSession: null,
          currentMode: 'menu',
          gameState: 'idle',
          isPaused: false,
          lastUpdate: Date.now(),
        })),
    }),
    {
      name: 'agent-arena-game-store',
      version: 1,
      storage: {
        getItem: (name) => {
          const item = localStorage.getItem(name);
          return item ? JSON.parse(item) : null;
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      },
    }
  )
);

// ============================================================================
// SELECTORS (for efficient re-renders)
// ============================================================================

export const selectCurrentAgent = (state: GameStore) => state.currentAgent;
export const selectCurrentDungeon = (state: GameStore) => state.currentDungeon;
export const selectGameMode = (state: GameStore) => state.currentMode;
export const selectGameState = (state: GameStore) => state.gameState;
export const selectNetworkState = (state: GameStore) => state.networkState;
export const selectIsPaused = (state: GameStore) => state.isPaused;
export const selectInCombat = (state: GameStore) =>
  state.dungeonSession?.inCombat ?? false;
export const selectCurrentEnemies = (state: GameStore) =>
  state.dungeonSession?.currentEnemies ?? [];
