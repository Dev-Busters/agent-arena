/**
 * Battle Routes
 * GET /battles/:id - Get battle details/log
 * GET /battles/user/:user_id - Get user's battle history
 * POST /battles/simulate - Simulate a battle (for testing)
 */

import { Router, Request, Response } from 'express';
import pool from '../../database/connection.js';
import { authMiddleware } from '../auth.js';
import { createBattle, processTurn } from '../../game/battle.js';

const router = Router();
router.use(authMiddleware);

/**
 * Get battle details
 * GET /battles/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT
        b.id, b.agent1_id, b.agent2_id, b.winner_id,
        a1.name as agent1_name, a1.class as agent1_class, u1.username as agent1_user,
        a2.name as agent2_name, a2.class as agent2_class, u2.username as agent2_user,
        b.battle_log, b.duration_ms, b.experience_awarded, b.gold_awarded,
        b.rating_change, b.created_at, b.completed_at, b.status
      FROM battles b
      LEFT JOIN agents a1 ON b.agent1_id = a1.id
      LEFT JOIN agents a2 ON b.agent2_id = a2.id
      LEFT JOIN users u1 ON a1.user_id = u1.id
      LEFT JOIN users u2 ON a2.user_id = u2.id
      WHERE b.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Battle not found' });
    }

    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * Get user's battle history
 * GET /battles/user/history
 */
router.get('/user/history', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await pool.query(
      `SELECT
        b.id, b.winner_id,
        CASE WHEN b.agent1_id IN (
          SELECT id FROM agents WHERE user_id = $1
        ) THEN a1.name ELSE a2.name END as my_agent,
        CASE WHEN b.agent1_id IN (
          SELECT id FROM agents WHERE user_id = $1
        ) THEN a2.name ELSE a1.name END as opponent_agent,
        CASE WHEN (b.agent1_id IN (
          SELECT id FROM agents WHERE user_id = $1
        ) AND b.winner_id = b.agent1_id) OR
        (b.agent2_id IN (
          SELECT id FROM agents WHERE user_id = $1
        ) AND b.winner_id = b.agent2_id)
        THEN 'win' ELSE 'loss' END as result,
        b.duration_ms, b.experience_awarded, b.gold_awarded,
        b.created_at
      FROM battles b
      LEFT JOIN agents a1 ON b.agent1_id = a1.id
      LEFT JOIN agents a2 ON b.agent2_id = a2.id
      WHERE (a1.user_id = $1 OR a2.user_id = $1) AND b.status = 'completed'
      ORDER BY b.created_at DESC
      LIMIT $2 OFFSET $3`,
      [user.id, limit, offset]
    );

    res.json(result.rows);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * Simulate a battle (for testing/demo)
 * POST /battles/simulate
 */
router.post('/simulate', async (req: Request, res: Response) => {
  try {
    const { agent1_id, agent2_id } = req.body;

    // Get agents
    const agents = await pool.query(
      'SELECT * FROM agents WHERE id = ANY($1)',
      [[agent1_id, agent2_id]]
    );

    if (agents.rows.length !== 2) {
      return res.status(400).json({ error: 'Invalid agents' });
    }

    const agent1Data = agents.rows[0];
    const agent2Data = agents.rows[1];

    // Create agents for battle
    const agent1 = {
      id: agent1Data.id,
      user_id: agent1Data.user_id,
      name: agent1Data.name,
      class: agent1Data.class,
      stats: {
        max_hp: agent1Data.max_hp,
        current_hp: agent1Data.max_hp,
        attack: agent1Data.attack,
        defense: agent1Data.defense,
        speed: agent1Data.speed,
        accuracy: agent1Data.accuracy,
        evasion: agent1Data.evasion
      },
      effects: [],
      defended: false
    };

    const agent2 = {
      id: agent2Data.id,
      user_id: agent2Data.user_id,
      name: agent2Data.name,
      class: agent2Data.class,
      stats: {
        max_hp: agent2Data.max_hp,
        current_hp: agent2Data.max_hp,
        attack: agent2Data.attack,
        defense: agent2Data.defense,
        speed: agent2Data.speed,
        accuracy: agent2Data.accuracy,
        evasion: agent2Data.evasion
      },
      effects: [],
      defended: false
    };

    // Create and simulate battle
    const battle = createBattle(agent1, agent2);

    // Simulate turns until winner
    let maxTurns = 50;
    while (battle.status === 'in_progress' && maxTurns > 0) {
      // Random actions for simulation
      const action1 = Math.random() > 0.8 ? 'defend' : 'attack';
      const action2 = Math.random() > 0.8 ? 'defend' : 'attack';

      processTurn(battle, { type: action1 as any }, { type: action2 as any });
      maxTurns--;
    }

    res.json(battle);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
