/**
 * Game Socket.io Handlers
 * Real-time multiplayer game events
 */

import { Socket, Server as SocketIOServer } from 'socket.io';
import { matchmakingQueue } from '../game/matchmaking';
import { createBattle, processTurn, checkWinCondition, calculateRewards, BattleLog } from '../game/battle';
import pool from '../database/connection';

// In-memory battle rooms
const activeBattles = new Map<string, BattleLog>();

export interface GameSocket extends Socket {
  user?: { id: string; email: string; username: string };
  battleId?: string;
}

export function setupGameSockets(io: SocketIOServer): void {
  io.on('connection', (socket: GameSocket) => {
    console.log(`🎮 Player connected: ${socket.id}`);

    /**
     * Join matchmaking queue
     */
    socket.on('join_queue', async (data: { agent_id: string; rating: number }, callback) => {
      try {
        const userId = socket.user?.id;
        if (!userId) {
          return callback({ error: 'Not authenticated' });
        }

        // Get agent
        const agentResult = await pool.query(
          'SELECT * FROM agents WHERE id = $1 AND user_id = $2',
          [data.agent_id, userId]
        );

        if (agentResult.rows.length === 0) {
          return callback({ error: 'Agent not found' });
        }

        const agent = agentResult.rows[0];

        // Add to queue
        await matchmakingQueue.addToQueue(userId, data.agent_id, data.rating);

        socket.join('matchmaking');
        callback({ ok: true, message: 'Joined queue' });

        // Broadcast queue status
        const queueSize = matchmakingQueue.getQueueSize();
        const avgWait = matchmakingQueue.getAverageWaitTime();
        io.to('matchmaking').emit('queue_status', {
          size: queueSize,
          average_wait_ms: avgWait
        });
      } catch (err: any) {
        console.error('Join queue error:', err);
        callback({ error: err.message });
      }
    });

    /**
     * Leave matchmaking queue
     */
    socket.on('leave_queue', async (callback) => {
      try {
        const userId = socket.user?.id;
        if (!userId) return;

        await matchmakingQueue.removeFromQueue(userId);
        socket.leave('matchmaking');

        const queueSize = matchmakingQueue.getQueueSize();
        io.to('matchmaking').emit('queue_status', { size: queueSize });

        callback({ ok: true });
      } catch (err: any) {
        console.error('Leave queue error:', err);
        callback({ error: err.message });
      }
    });

    /**
     * Join a battle room (for spectating or participating)
     */
    socket.on('join_battle', async (data: { battle_id: string }, callback) => {
      try {
        const battle = activeBattles.get(data.battle_id);
        if (!battle) {
          return callback({ error: 'Battle not found' });
        }

        socket.join(data.battle_id);
        socket.battleId = data.battle_id;

        // Emit current battle state to joining player
        callback({
          ok: true,
          battle: {
            id: battle.id,
            agent1: battle.agent1,
            agent2: battle.agent2,
            status: battle.status,
          },
        });

        // Notify others that someone joined
        socket.to(data.battle_id).emit('player_joined', {
          message: 'Another player joined the battle',
        });
      } catch (err: any) {
        console.error('Join battle error:', err);
        callback({ error: err.message });
      }
    });

    /**
     * Start battle (called after matchmaking finds a match)
     * This would be called by a server-side matchmaking loop
     */
    socket.on('start_battle', async (data: { agent1_id: string; agent2_id: string }, callback) => {
      try {
        // Get both agents
        const agents = await pool.query(
          'SELECT * FROM agents WHERE id = ANY($1)',
          [[data.agent1_id, data.agent2_id]]
        );

        if (agents.rows.length !== 2) {
          return callback({ error: 'Invalid agents' });
        }

        // Create battle
        const agent1Data = agents.rows[0];
        const agent2Data = agents.rows[1];

        const battleAgent1 = {
          id: agent1Data.id,
          user_id: agent1Data.user_id,
          name: agent1Data.name,
          class: agent1Data.class,
          stats: {
            max_hp: agent1Data.max_hp,
            current_hp: agent1Data.current_hp,
            attack: agent1Data.attack,
            defense: agent1Data.defense,
            speed: agent1Data.speed,
            accuracy: agent1Data.accuracy,
            evasion: agent1Data.evasion
          },
          effects: [],
          defended: false
        };

        const battleAgent2 = {
          id: agent2Data.id,
          user_id: agent2Data.user_id,
          name: agent2Data.name,
          class: agent2Data.class,
          stats: {
            max_hp: agent2Data.max_hp,
            current_hp: agent2Data.current_hp,
            attack: agent2Data.attack,
            defense: agent2Data.defense,
            speed: agent2Data.speed,
            accuracy: agent2Data.accuracy,
            evasion: agent2Data.evasion
          },
          effects: [],
          defended: false
        };

        const battle = createBattle(battleAgent1, battleAgent2);
        activeBattles.set(battle.id, battle);

        // Store socket mapping
        socket.battleId = battle.id;

        // Emit to both players
        io.to(battle.id).emit('battle_start', {
          battle_id: battle.id,
          agent1: battleAgent1,
          agent2: battleAgent2
        });

        callback({ ok: true, battle_id: battle.id });
      } catch (err: any) {
        console.error('Start battle error:', err);
        callback({ error: err.message });
      }
    });

    /**
     * Send game action (attack, defend, ability)
     */
    socket.on('action', async (data: { battle_id: string; action: string; target_id?: string }, callback) => {
      try {
        const battle = activeBattles.get(data.battle_id);
        if (!battle) {
          return callback({ error: 'Battle not found' });
        }

        const userId = socket.user?.id;
        const isAgent1 = battle.agent1.user_id === userId;
        const actor = isAgent1 ? battle.agent1 : battle.agent2;
        const target = isAgent1 ? battle.agent2 : battle.agent1;

        // Validate action
        if (!['attack', 'defend', 'ability'].includes(data.action)) {
          return callback({ error: 'Invalid action' });
        }

        // Execute action based on type
        let actionResult = {
          type: data.action as 'attack' | 'defend' | 'ability',
          actor_id: actor.id,
          actor_name: actor.name,
          target_id: target.id,
          target_name: target.name,
          damage: 0,
          message: '',
          critical: false,
          missed: false,
          targetHP: target.stats.current_hp,
          targetEffects: target.effects,
          timestamp: Date.now(),
        };

        switch (data.action) {
          case 'attack': {
            // Damage calculation: base attack + random variance
            const baseDamage = actor.stats.attack * (0.8 + Math.random() * 0.4);
            const isCritical = Math.random() < 0.15; // 15% crit chance
            const damage = Math.floor(
              isCritical ? baseDamage * 1.5 : baseDamage
            );
            const isMissed = Math.random() > (actor.stats.accuracy / 100);

            if (isMissed) {
              actionResult.damage = 0;
              actionResult.missed = true;
              actionResult.message = `${actor.name}'s attack missed!`;
            } else {
              const actualDamage = Math.max(1, damage - target.stats.defense / 2);
              target.stats.current_hp = Math.max(0, target.stats.current_hp - actualDamage);
              actionResult.damage = Math.floor(actualDamage);
              actionResult.critical = isCritical;
              actionResult.targetHP = target.stats.current_hp;
              actionResult.message = isCritical
                ? `⚡ ${actor.name} CRITICAL HIT ${actor.name}! ${Math.floor(actualDamage)} damage!`
                : `${actor.name} attacks ${target.name} for ${Math.floor(actualDamage)} damage!`;
            }
            break;
          }

          case 'defend': {
            actor.defended = true;
            actionResult.message = `${actor.name} takes a defensive stance!`;
            break;
          }

          case 'ability': {
            // Simple ability: cost HP to deal more damage
            const abilityCost = Math.floor(actor.stats.max_hp * 0.1);
            actor.stats.current_hp = Math.max(1, actor.stats.current_hp - abilityCost);

            const baseDamage = actor.stats.attack * 1.8;
            const damage = Math.floor(baseDamage);
            const actualDamage = Math.max(5, damage - target.stats.defense / 4);
            target.stats.current_hp = Math.max(0, target.stats.current_hp - actualDamage);

            actionResult.damage = Math.floor(actualDamage);
            actionResult.targetHP = target.stats.current_hp;
            actionResult.message = `✨ ${actor.name} uses Special Ability! ${Math.floor(actualDamage)} damage!`;
            break;
          }
        }

        actionResult.targetEffects = target.effects;

        // Check if battle is over
        if (target.stats.current_hp <= 0) {
          battle.winner_id = actor.id;
          battle.status = 'completed';
          battle.ended_at = Date.now();
          battle.duration_ms = battle.ended_at - battle.started_at;

          io.to(data.battle_id).emit('battle_end', {
            battle_id: data.battle_id,
            winner_id: actor.id,
            winner_name: actor.name,
            loser_name: target.name,
            message: `${actor.name} wins!`,
            battle_log: battle
          });

          activeBattles.delete(data.battle_id);
        } else {
          // Continue battle - next turn for opponent
          io.to(data.battle_id).emit('action_result', actionResult);

          // Next turn
          setTimeout(() => {
            const nextPlayer = isAgent1 ? battle.agent2.user_id : battle.agent1.user_id;
            const nextSocket = io.sockets.sockets.get(socket.id);
            
            io.to(data.battle_id).emit('turn_start', {
              current_actor_id: isAgent1 ? battle.agent2.id : battle.agent1.id,
              agent1_hp: battle.agent1.stats.current_hp,
              agent2_hp: battle.agent2.stats.current_hp,
            });
          }, 1000);
        }

        callback({ ok: true });
      } catch (err: any) {
        console.error('Action error:', err);
        callback({ error: err.message });
      }
    });

    /**
     * Surrender from battle
     */
    socket.on('surrender', async (data: { battle_id: string }, callback) => {
      try {
        const battle = activeBattles.get(data.battle_id);
        if (!battle) {
          return callback({ error: 'Battle not found' });
        }

        // Determine winner (the other player)
        const userId = socket.user?.id;
        const winner = battle.agent1.user_id === userId ? battle.agent2.user_id : battle.agent1.user_id;

        battle.winner_id = battle.agent1.user_id === winner ? battle.agent1.id : battle.agent2.id;
        battle.status = 'completed';
        battle.ended_at = Date.now();
        battle.duration_ms = battle.ended_at - battle.started_at;

        // Emit battle end
        io.to(data.battle_id).emit('battle_end', {
          winner_id: battle.winner_id,
          battle_log: battle
        });

        // Clean up
        activeBattles.delete(data.battle_id);
        callback({ ok: true });
      } catch (err: any) {
        console.error('Surrender error:', err);
        callback({ error: err.message });
      }
    });

    /**
     * Disconnect cleanup
     */
    socket.on('disconnect', async () => {
      try {
        const userId = socket.user?.id;
        if (userId) {
          await matchmakingQueue.removeFromQueue(userId);
          console.log(`👤 Player disconnected: ${socket.id}`);
        }
      } catch (err) {
        console.error('Disconnect cleanup error:', err);
      }
    });
  });
}
