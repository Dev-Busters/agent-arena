/**
 * Socket.io Dungeon Event Handlers
 * Handles dungeon exploration, encounters, and progression
 */

import { Socket } from "socket.io";
import { query } from "../database/connection.js";
import { v4 as uuidv4 } from "uuid";
import {
  generateDungeon,
  generateBSPDungeonMap,
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
  BSPDungeonMap,
  BSPRoom,
  RoomType,
} from '../game/dungeon.js';
import { decideEnemyAction, AI_PATTERNS } from '../game/enemy-ai.js';
import { generateLoot, calculateLevelUp, xpForNextLevel } from '../game/loot.js';
import {
  StatusEffect,
  StatusEffectType,
  ENEMY_EFFECT_ABILITIES,
  PLAYER_EFFECT_ABILITIES,
  rollAttackEffects,
  processStatusEffects,
  isStunned,
  getAttackModifier,
  getSpeedModifier,
  serializeEffects,
  removeEffect,
  EffectApplicationResult,
} from '../game/status-effects.js';
import SeededRandom from "seedrandom";

interface DungeonSession {
  dungeonId: string;
  userId: string;
  agentId: string;
  agentClass: string;
  depth: number;
  currentRoomId: number;
  playerHp: number;
  playerMaxHp: number;
  playerAttack: number;
  playerDefense: number;
  playerEffects: StatusEffect[];
  turnCount: number;
  inEncounter: boolean;
  currentEnemies: DungeonEnemy[];
  specialZone?: SpecialZoneType;
  specialZoneBonus?: { goldMult: number; xpMult: number; rarityMult: number };
  bspMap?: BSPDungeonMap; // Full BSP map for rich room data
}

interface DungeonEnemy {
  id: string;
  type: string;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  effects: StatusEffect[];
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
          let dungeon;
          try {
            console.log('🔄 [DUNGEON] Inserting dungeon with:', { userId, agentId, difficulty, seed });
            const dungeonResult = await query(
              `INSERT INTO dungeons (user_id, agent_id, difficulty, seed, depth, max_depth)
               VALUES ($1, $2, $3::dungeon_difficulty, $4, 1, 10)
               RETURNING *`,
              [userId, agentId, difficulty, seed]
            );
            dungeon = dungeonResult.rows[0];
            console.log('✅ [DUNGEON] Dungeon created:', dungeon.id);
          } catch (err: any) {
            console.error('❌ [DUNGEON] Failed to insert dungeon:', { 
              code: err?.code, 
              message: err?.message,
              params: [userId, agentId, difficulty, seed]
            });
            throw err;
          }

          // Generate dungeon map
          const map = generateDungeon(seed, difficulty, floor, agent.level);

          // Create progress record
          try {
            console.log('🔄 [DUNGEON] Inserting dungeon_progress with map and discovered_rooms');
            await query(
              `INSERT INTO dungeon_progress (dungeon_id, map_data, current_room_id, discovered_rooms)
               VALUES ($1, $2, $3, $4::INT[])`,
              [
                dungeon.id,
                JSON.stringify(map),
                0,
                [0], // Starting room
              ]
            );
            console.log('✅ [DUNGEON] Dungeon progress created');
          } catch (err: any) {
            console.error('❌ [DUNGEON] Failed to insert dungeon_progress:', { 
              code: err?.code, 
              message: err?.message
            });
            throw err;
          }

          // Store session
          const session: DungeonSession = {
            dungeonId: dungeon.id,
            userId,
            agentId,
            agentClass: agent.class || 'warrior',
            depth: floor,
            currentRoomId: 0,
            playerHp: agent.current_hp,
            playerMaxHp: agent.max_hp,
            playerAttack: agent.attack || 15,
            playerDefense: agent.defense || 8,
            playerEffects: [],
            turnCount: 0,
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
          console.error('❌ [DUNGEON] start_dungeon error detailed:', {
            message: error?.message,
            code: error?.code,
            detail: error?.detail,
            hint: error?.hint,
            stack: error?.stack,
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

            // Create enemies with effects tracking
            const enemies: DungeonEnemy[] = enemyTypes.map((type: EnemyType) => {
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
                effects: [],
              };
            });

            session.inEncounter = true;
            session.currentEnemies = enemies;
            session.turnCount = 0;
            // Clear player effects from previous encounters
            session.playerEffects = [];

            socket.emit("encounter_started", {
              enemies: enemies.map((e) => ({
                id: e.id,
                name: e.name,
                type: e.type,
                hp: e.hp,
                maxHp: e.maxHp,
                effects: [],
              })),
              playerEffects: [],
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
     * Now includes full status effects system
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
          session.turnCount++;
          const turnMessages: string[] = [];
          const effectEvents: Array<{ type: string; target: string; message: string }> = [];

          // ─── Check if player is stunned ─────────────────────────
          const playerStunned = isStunned(session.playerEffects);
          let playerDamage = 0;
          let playerCritical = false;
          let playerEffectsApplied: EffectApplicationResult[] = [];

          if (playerStunned) {
            turnMessages.push('💫 You are stunned and cannot act!');
            effectEvents.push({ type: 'stun', target: 'player', message: 'Stunned! Turn skipped.' });
          } else if (action === "attack" && targetId) {
            // ─── Player Attack with Status Effects ────────────────
            const target = session.currentEnemies.find(e => e.id === targetId);
            if (target) {
              // Apply attack modifier from weakness debuff
              const atkMod = getAttackModifier(session.playerEffects);
              const baseAtk = Math.floor(session.playerAttack * atkMod);

              // Damage calculation
              const variance = Math.floor(Math.random() * 7) - 3;
              playerCritical = Math.random() < 0.12;
              playerDamage = Math.max(1, baseAtk - Math.floor(target.defense * 0.5) + variance);
              if (playerCritical) {
                playerDamage = Math.floor(playerDamage * 1.5);
                turnMessages.push('💥 Critical hit!');
              }

              target.hp = Math.max(0, target.hp - playerDamage);

              // Roll for player's status effects on the target
              const playerAbilities = PLAYER_EFFECT_ABILITIES[session.agentClass] || PLAYER_EFFECT_ABILITIES.warrior;
              playerEffectsApplied = rollAttackEffects(
                playerAbilities,
                target.effects,
                'player',
                session.turnCount,
                target.defense,
                playerCritical,
                Math.random,
              );

              for (const eResult of playerEffectsApplied) {
                turnMessages.push(eResult.message);
                effectEvents.push({
                  type: eResult.effect?.type || 'unknown',
                  target: target.id,
                  message: eResult.message,
                });
              }
            }
          } else if (action === "defend") {
            // Add defend effect to player
            session.playerEffects = session.playerEffects.filter(e => e.type !== 'defend');
            session.playerEffects.push({
              type: 'defend',
              duration: 1,
              stacks: 1,
              sourceId: 'player',
              appliedOnTurn: session.turnCount,
            });
            turnMessages.push('🛡️ You brace for incoming attacks! (40% damage reduction)');
          }

          // ─── Enemy Actions with Status Effects ──────────────────
          const enemyActionResults: Array<{
            enemyId: string;
            enemyName: string;
            action: string;
            damage: number;
            effectsApplied: EffectApplicationResult[];
            stunned: boolean;
          }> = [];

          for (const enemy of session.currentEnemies.filter(e => e.hp > 0)) {
            const enemyStunned = isStunned(enemy.effects);

            if (enemyStunned) {
              enemyActionResults.push({
                enemyId: enemy.id,
                enemyName: enemy.name,
                action: 'stunned',
                damage: 0,
                effectsApplied: [],
                stunned: true,
              });
              turnMessages.push(`💫 ${enemy.name} is stunned!`);
              effectEvents.push({ type: 'stun', target: enemy.id, message: `${enemy.name} stunned` });
              continue;
            }

            const aiPattern = AI_PATTERNS[enemy.type] || AI_PATTERNS.goblin;
            const rng = SeededRandom(enemy.id + session.turnCount);
            const enemyDecision = decideEnemyAction(aiPattern, {
              playerHp: session.playerHp,
              playerMaxHp: session.playerMaxHp,
              playerAttack: session.playerAttack,
              playerDefense: session.playerDefense,
              enemyHp: enemy.hp,
              enemyMaxHp: enemy.maxHp,
              enemyAttack: enemy.attack,
              enemyDefense: enemy.defense,
              playerDefended: session.playerEffects.some(e => e.type === 'defend'),
              enemyDefended: false,
              turnsElapsed: session.turnCount,
            }, rng);

            if (enemyDecision === 'attack' || enemyDecision === 'ability') {
              // Enemy attacks player
              const atkMod = getAttackModifier(enemy.effects);
              const baseAtk = Math.floor(enemy.attack * atkMod);
              const variance = Math.floor(Math.random() * 7) - 3;
              const enemyCrit = Math.random() < 0.08;
              let enemyDmg = Math.max(1, baseAtk - Math.floor(session.playerDefense * 0.5) + variance);

              if (enemyCrit) enemyDmg = Math.floor(enemyDmg * 1.5);

              // Player defend reduction
              const isDefending = session.playerEffects.some(e => e.type === 'defend');
              if (isDefending) {
                enemyDmg = Math.floor(enemyDmg * 0.6);
              }

              session.playerHp = Math.max(0, session.playerHp - enemyDmg);

              // Roll for enemy's status effects on the player
              const enemyAbilities = ENEMY_EFFECT_ABILITIES[enemy.type] || [];
              const enemyEffectsApplied = rollAttackEffects(
                enemyAbilities,
                session.playerEffects,
                enemy.id,
                session.turnCount,
                session.playerDefense,
                enemyCrit,
                Math.random,
              );

              for (const eResult of enemyEffectsApplied) {
                turnMessages.push(`${enemy.name}: ${eResult.message}`);
                effectEvents.push({
                  type: eResult.effect?.type || 'unknown',
                  target: 'player',
                  message: eResult.message,
                });
              }

              enemyActionResults.push({
                enemyId: enemy.id,
                enemyName: enemy.name,
                action: enemyDecision,
                damage: enemyDmg,
                effectsApplied: enemyEffectsApplied,
                stunned: false,
              });

              if (enemyCrit) {
                turnMessages.push(`💥 ${enemy.name} lands a critical hit for ${enemyDmg} damage!`);
              } else {
                turnMessages.push(`${enemy.name} attacks for ${enemyDmg} damage!`);
              }
            } else if (enemyDecision === 'defend') {
              enemy.effects.push({
                type: 'defend',
                duration: 1,
                stacks: 1,
                sourceId: enemy.id,
                appliedOnTurn: session.turnCount,
              });
              enemyActionResults.push({
                enemyId: enemy.id,
                enemyName: enemy.name,
                action: 'defend',
                damage: 0,
                effectsApplied: [],
                stunned: false,
              });
              turnMessages.push(`🛡️ ${enemy.name} takes a defensive stance!`);
            } else {
              enemyActionResults.push({
                enemyId: enemy.id,
                enemyName: enemy.name,
                action: enemyDecision,
                damage: 0,
                effectsApplied: [],
                stunned: false,
              });
            }
          }

          // ─── End-of-Turn: Process DoT effects ───────────────────
          // Player DoTs
          const playerDotResult = processStatusEffects(
            session.playerEffects,
            session.playerMaxHp,
            session.playerHp,
          );
          session.playerHp = playerDotResult.newHp;
          for (const r of playerDotResult.results) {
            turnMessages.push(`[You] ${r.message}`);
            if (r.damage > 0) {
              effectEvents.push({ type: r.type, target: 'player', message: r.message });
            }
          }

          // Enemy DoTs
          const enemyDotResults: Record<string, { damage: number; messages: string[] }> = {};
          for (const enemy of session.currentEnemies.filter(e => e.hp > 0)) {
            const dotResult = processStatusEffects(
              enemy.effects,
              enemy.maxHp,
              enemy.hp,
            );
            enemy.hp = dotResult.newHp;
            enemyDotResults[enemy.id] = {
              damage: dotResult.totalDamage,
              messages: dotResult.results.map(r => r.message),
            };
            for (const r of dotResult.results) {
              turnMessages.push(`[${enemy.name}] ${r.message}`);
              if (r.damage > 0) {
                effectEvents.push({ type: r.type, target: enemy.id, message: r.message });
              }
            }
          }

          // ─── Remove defeated enemies ────────────────────────────
          session.currentEnemies = session.currentEnemies.filter(e => e.hp > 0);

          // ─── Check player death ─────────────────────────────────
          if (session.playerHp <= 0) {
            session.inEncounter = false;
            socket.emit("encounter_lost", {
              message: "You have been defeated!",
              turnMessages,
              effectEvents,
              playerEffects: serializeEffects(session.playerEffects),
            });
            return;
          }

          // ─── Check victory ──────────────────────────────────────
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

            // Emit rewards with combat summary
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
              turnMessages,
              effectEvents,
              combatStats: {
                turnsElapsed: session.turnCount,
              },
            });
          } else {
            // ─── Send turn result with full effect data ───────────
            socket.emit("turn_result", {
              playerAction: playerStunned ? 'stunned' : action,
              playerDamage,
              playerCritical,
              playerHp: session.playerHp,
              playerMaxHp: session.playerMaxHp,
              playerEffects: serializeEffects(session.playerEffects),
              enemies: session.currentEnemies.map((e) => ({
                id: e.id,
                name: e.name,
                type: e.type,
                hp: e.hp,
                maxHp: e.maxHp,
                effects: serializeEffects(e.effects),
              })),
              enemyActions: enemyActionResults,
              enemyDotResults,
              turnMessages,
              effectEvents,
              turnNumber: session.turnCount,
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
