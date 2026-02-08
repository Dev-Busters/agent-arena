/**
 * Socket.io Dungeon Event Handlers
 * Handles dungeon exploration, encounters, and progression
 */

import { Socket } from "socket.io";
import { query } from "../database/connection.js";
import { v4 as uuidv4 } from "uuid";
import {
  generateDungeon,
  generateEncounter,
  scaleEnemyStats,
  calculateLoot,
  ENEMY_TEMPLATES,
  EnemyType,
  DungeonDifficulty,
  getDifficultyForFloor,
  generateBranchingPaths,
  getSpecialZoneBonus,
  SpecialZoneType,
} from '../game/dungeon.js';
import { decideEnemyAction, AI_PATTERNS } from '../game/enemy-ai.js';
import { generateLoot, calculateLevelUp, xpForNextLevel } from '../game/loot.js';
import SeededRandom from "seedrandom";

interface DungeonSession {
  dungeonId: string;
  userId: string;
  agentId: string;
  depth: number;
  currentRoomId: number;
  playerHp: number;
  playerMaxHp: number;
  inEncounter: boolean;
  currentEnemies: any[];
  specialZone?: SpecialZoneType;
  specialZoneBonus?: { goldMult: number; xpMult: number; rarityMult: number };
}

const activeDungeonSessions = new Map<string, DungeonSession>();

export function setupDungeonSockets(io: any) {
  io.on("connection", (socket: Socket) => {
    /**
     * Start a new dungeon run
     */
    socket.on(
      "start_dungeon",
      async (payload: {
        userId: string;
        agentId: string;
      }) => {
        try {
          console.log('🎮 [DUNGEON] start_dungeon triggered:', { userId: payload.userId, agentId: payload.agentId });
          const { userId, agentId } = payload;

          // Fetch agent stats
          const agentResult = await query(
            "SELECT * FROM agents WHERE id = $1 AND user_id = $2",
            [agentId, userId]
          );
          if (agentResult.rows.length === 0) {
            socket.emit("dungeon_error", { message: "Agent not found" });
            return;
          }

          const agent = agentResult.rows[0];
          const seed = Math.floor(Math.random() * 1000000);
          const floor = 1;
          const difficulty = getDifficultyForFloor(floor);

          // Create dungeon in database
          const dungeonResult = await query(
            `INSERT INTO dungeons (user_id, agent_id, difficulty, seed, depth, max_depth)
             VALUES ($1, $2, $3, $4, 1, 10)
             RETURNING *`,
            [userId, agentId, difficulty, seed]
          );
          const dungeon = dungeonResult.rows[0];

          // Generate dungeon map
          const map = generateDungeon(seed, difficulty, floor, agent.level);

          // Create progress record
          await query(
            `INSERT INTO dungeon_progress (dungeon_id, map_data, current_room_id, discovered_rooms)
             VALUES ($1, $2, $3, $4)`,
            [
              dungeon.id,
              JSON.stringify(map),
              0,
              JSON.stringify([0]), // Starting room
            ]
          );

          // Store session
          const session: DungeonSession = {
            dungeonId: dungeon.id,
            userId,
            agentId,
            depth: floor,
            currentRoomId: 0,
            playerHp: agent.current_hp,
            playerMaxHp: agent.max_hp,
            inEncounter: false,
            currentEnemies: [],
          };
          activeDungeonSessions.set(socket.id, session);

          socket.emit("dungeon_started", {
            dungeonId: dungeon.id,
            floor,
            difficulty,
            map: {
              width: map.width,
              height: map.height,
              rooms: map.rooms,
            },
            playerStats: {
              hp: agent.current_hp,
              maxHp: agent.max_hp,
              level: agent.level,
            },
          });
        } catch (error: any) {
          console.error('❌ [DUNGEON] start_dungeon error:', {
            message: error?.message,
            code: error?.code,
            detail: error?.detail,
            stack: error?.stack?.split('\n').slice(0, 3).join('\n'),
          });
          socket.emit("dungeon_error", {
            message: "Failed to start dungeon: " + error?.message,
          });
        }
      }
    );

    /**
     * Enter a room and check for encounters
     */
    socket.on(
      "enter_room",
      async (payload: { dungeonId: string; roomId: number }) => {
        try {
          const session = activeDungeonSessions.get(socket.id);
          if (!session) {
            socket.emit("dungeon_error", { message: "No active dungeon" });
            return;
          }

          const { roomId } = payload;
          session.currentRoomId = roomId;

          // Check for encounter (30% chance)
          const rng = SeededRandom(
            `${session.dungeonId}-room-${roomId}`.toString()
          );
          const hasEncounter = rng() < 0.4; // 40% encounter rate

          if (hasEncounter && !session.inEncounter) {
            // Generate enemies for this room
            const difficulty = getDifficultyForFloor(session.depth);
            const enemyTypes = generateEncounter(
              roomId,
              difficulty,
              session.depth,
              session.playerHp, // Simplified: use HP instead of full agent data
              rng
            );

            // Create enemies
            const enemies = enemyTypes.map((type: EnemyType) => {
              const template = ENEMY_TEMPLATES[type];
              const stats = scaleEnemyStats(
                template,
                1, // Simplified: assume level 1 player
                difficulty
              );

              return {
                id: uuidv4(),
                type,
                name: template.name,
                hp: stats.hp,
                maxHp: stats.hp,
                attack: stats.attack,
                defense: stats.defense,
                speed: stats.speed,
              };
            });

            session.inEncounter = true;
            session.currentEnemies = enemies;

            socket.emit("encounter_started", {
              enemies: enemies.map((e) => ({
                id: e.id,
                name: e.name,
                hp: e.hp,
                maxHp: e.maxHp,
              })),
            });
          } else {
            socket.emit("room_clear", {
              roomId,
              message: "This room is empty.",
            });
          }
        } catch (error: any) {
          console.error('❌ [DUNGEON] enter_room error:', {
            message: error?.message,
            code: error?.code,
            detail: error?.detail,
            stack: error?.stack?.split('\n').slice(0, 3).join('\n'),
          });
          socket.emit("dungeon_error", { 
            message: "Failed to enter room: " + error?.message,
          });
        }
      }
    );

    /**
     * Player performs an action in combat
     */
    socket.on(
      "dungeon_action",
      async (payload: {
        dungeonId: string;
        action: "attack" | "defend" | "ability" | "flee";
        targetId?: string;
      }) => {
        try {
          const session = activeDungeonSessions.get(socket.id);
          if (!session || !session.inEncounter) {
            socket.emit("dungeon_error", { message: "No active encounter" });
            return;
          }

          const { action, targetId } = payload;

          // Resolve player action
          let damage = 0;
          if (action === "attack" && targetId) {
            const target = session.currentEnemies.find(
              (e) => e.id === targetId
            );
            if (target) {
              // Damage calculation (simplified)
              damage = Math.max(1, 10 + Math.floor(Math.random() * 5) - 2);
              target.hp -= damage;
            }
          }

          // Resolve enemy actions
          const enemyActions = session.currentEnemies
            .filter((e) => e.hp > 0)
            .map((enemy) => {
              const aiPattern = AI_PATTERNS[enemy.type] || AI_PATTERNS.goblin;
              const rng = SeededRandom(enemy.id);

              return {
                enemyId: enemy.id,
                action: decideEnemyAction(aiPattern, {} as any, rng),
              };
            });

          // Remove defeated enemies
          session.currentEnemies = session.currentEnemies.filter(
            (e) => e.hp > 0
          );

          if (session.currentEnemies.length === 0) {
            // Combat won - generate loot and update player
            const rng = SeededRandom(session.dungeonId + Date.now());
            let baseGold = 100 * session.depth;
            let baseXp = 200 * session.depth;

            // Apply special zone bonuses if in special zone
            if (session.specialZoneBonus) {
              baseGold = Math.round(baseGold * session.specialZoneBonus.goldMult);
              baseXp = Math.round(baseXp * session.specialZoneBonus.xpMult);
            }

            const difficulty = getDifficultyForFloor(session.depth);
            const loot = generateLoot(
              baseGold,
              baseXp,
              difficulty,
              session.depth,
              rng
            );

            // Calculate level up
            const levelUpData = calculateLevelUp(1, 0, loot.xp); // Simplified: assume level 1

            session.inEncounter = false;

            // Emit rewards
            socket.emit("encounter_won", {
              gold: loot.gold,
              xp: loot.xp,
              items: loot.items.map((item) => ({
                id: item.id,
                name: item.name,
                type: item.type,
                rarity: item.rarity,
                stats: item.stats,
              })),
              materials: loot.materials,
              levelUp: levelUpData.levelsGained > 0,
              newLevel: levelUpData.newLevel,
              totalXp: levelUpData.newXp,
              zoneBonus: session.specialZoneBonus || null,
            });
          } else {
            // Send turn result
            socket.emit("turn_result", {
              playerAction: action,
              playerDamage: damage,
              enemies: session.currentEnemies.map((e) => ({
                id: e.id,
                hp: e.hp,
                maxHp: e.maxHp,
              })),
              enemyActions,
            });
          }
        } catch (error) {
          socket.emit("dungeon_error", { message: "Action failed" });
          console.error("dungeon_action error:", error);
        }
      }
    );

    /**
     * Flee from encounter
     */
    socket.on("flee_encounter", async () => {
      try {
        const session = activeDungeonSessions.get(socket.id);
        if (!session) return;

        const fleeChance = 0.5; // 50% chance to flee
        const succeeds = Math.random() < fleeChance;

        if (succeeds) {
          session.inEncounter = false;
          socket.emit("fled_successfully", { message: "You escaped!" });
        } else {
          socket.emit("flee_failed", { message: "Unable to escape!" });
        }
      } catch (error) {
        console.error("flee_encounter error:", error);
      }
    });

    /**
     * Move to next floor
     */
    socket.on("next_floor", async (_payload: { dungeonId: string }) => {
      try {
        const session = activeDungeonSessions.get(socket.id);
        if (!session) return;

        if (session.depth >= 10) {
          socket.emit("dungeon_complete", {
            message: "You reached the bottom of the dungeon!",
            reward: { gold: 5000, xp: 10000 },
          });
          activeDungeonSessions.delete(socket.id);
        } else {
          session.depth += 1;
          const difficulty = getDifficultyForFloor(session.depth);
          const seed = Math.floor(Math.random() * 1000000);
          const map = generateDungeon(
            seed,
            difficulty,
            session.depth,
            session.playerHp
          );

          // Check if branching paths should appear
          const branchingPaths = generateBranchingPaths(session.depth, seed);

          socket.emit("floor_changed", {
            floor: session.depth,
            difficulty,
            map: {
              width: map.width,
              height: map.height,
              rooms: map.rooms,
            },
            branchingPaths: branchingPaths.length > 0 ? branchingPaths : null,
          });
        }
      } catch (error) {
        console.error("next_floor error:", error);
      }
    });

    /**
     * Choose a branching path (special zone)
     */
    socket.on(
      "choose_path",
      async (payload: { dungeonId: string; pathId: string; zoneType: SpecialZoneType }) => {
        try {
          const session = activeDungeonSessions.get(socket.id);
          if (!session) {
            socket.emit("dungeon_error", { message: "No active dungeon" });
            return;
          }

          const { zoneType } = payload;
          session.specialZone = zoneType;
          session.specialZoneBonus = getSpecialZoneBonus(zoneType);

          const difficulty = getDifficultyForFloor(session.depth);
          const seed = Math.floor(Math.random() * 1000000);
          const map = generateDungeon(
            seed,
            difficulty,
            session.depth,
            session.playerHp
          );

          socket.emit("path_chosen", {
            zoneType,
            zoneDescription: `Entered the ${zoneType.replace(/_/g, " ")}!`,
            map: {
              width: map.width,
              height: map.height,
              rooms: map.rooms,
            },
            bonuses: session.specialZoneBonus,
          });
        } catch (error) {
          socket.emit("dungeon_error", { message: "Failed to choose path" });
          console.error("choose_path error:", error);
        }
      }
    );

    /**
     * Abandon dungeon
     */
    socket.on("abandon_dungeon", async (_payload: { dungeonId: string }) => {
      try {
        const session = activeDungeonSessions.get(socket.id);
        if (!session) return;

        // Mark dungeon as abandoned
        await query(
          "UPDATE dungeons SET abandoned_at = CURRENT_TIMESTAMP WHERE id = $1",
          [session.dungeonId]
        );

        activeDungeonSessions.delete(socket.id);
        socket.emit("dungeon_abandoned", { message: "Dungeon abandoned" });
      } catch (error) {
        console.error("abandon_dungeon error:", error);
      }
    });

    /**
     * Disconnect cleanup
     */
    socket.on("disconnect", () => {
      activeDungeonSessions.delete(socket.id);
    });
  });
}
