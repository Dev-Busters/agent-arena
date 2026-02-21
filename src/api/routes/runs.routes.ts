/**
 * Runs Routes - Crucible PvE run tracking
 */

import { Router, Request, Response } from 'express';
import pool from '../../database/connection.js';

const router = Router();

/**
 * GET /runs - List all runs
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);

    const result = await pool.query(
      `SELECT 
        id, user_id as "userId", doctrine, 
        floors_cleared as "floorsCleared", kills, time_seconds as "timeSeconds",
        ash_earned as "ashEarned", ember_earned as "emberEarned", 
        arena_marks_earned as "arenaMarksEarned",
        outcome, created_at as "createdAt"
      FROM runs
      ORDER BY created_at DESC
      LIMIT $1`,
      [limit]
    );

    res.json(result.rows);
  } catch (err: any) {
    console.error('[Runs API] List error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /runs - Submit a new run
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      doctrine,
      floorsCleared,
      kills,
      timeSeconds,
      ashEarned,
      emberEarned,
      arenaMarksEarned,
      outcome,
      userId
    } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    const result = await pool.query(
      `INSERT INTO runs (
        user_id, doctrine, floors_cleared, kills, time_seconds,
        ash_earned, ember_earned, arena_marks_earned, outcome
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING 
        id, user_id as "userId", doctrine,
        floors_cleared as "floorsCleared", kills, time_seconds as "timeSeconds",
        ash_earned as "ashEarned", ember_earned as "emberEarned",
        arena_marks_earned as "arenaMarksEarned",
        outcome, created_at as "createdAt"`,
      [
        userId,
        doctrine || 'iron',
        floorsCleared || 0,
        kills || 0,
        timeSeconds || 0,
        ashEarned || 0,
        emberEarned || 0,
        arenaMarksEarned || 0,
        outcome || 'fallen'
      ]
    );

    res.json(result.rows[0]);
  } catch (err: any) {
    console.error('[Runs API] Submit error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
