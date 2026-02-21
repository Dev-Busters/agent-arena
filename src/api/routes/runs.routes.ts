/**
 * Runs Routes - Crucible PvE run tracking
 */

import { Router, Request, Response } from 'express';
import pool from '../../database/connection.js';

const router = Router();

/**
 * GET /runs - List recent runs
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const userId = (req as any).userId; // From auth middleware

    let query = `
      SELECT 
        id, user_id as "userId", doctrine, 
        floors_cleared as "floorsCleared", kills, time_seconds as "timeSeconds",
        ash_earned as "ashEarned", ember_earned as "emberEarned", 
        arena_marks_earned as "arenaMarksEarned",
        outcome, created_at as "createdAt"
      FROM runs
    `;

    const params: any[] = [];
    
    if (userId) {
      query += ' WHERE user_id = $1';
      params.push(userId);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);
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
    const userId = (req as any).userId; // From auth middleware
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const {
      doctrine,
      floorsCleared,
      kills,
      timeSeconds,
      ashEarned,
      emberEarned,
      arenaMarksEarned,
      outcome
    } = req.body;

    const query = `
      INSERT INTO runs (
        user_id, doctrine, floors_cleared, kills, time_seconds,
        ash_earned, ember_earned, arena_marks_earned, outcome
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING 
        id, user_id as "userId", doctrine,
        floors_cleared as "floorsCleared", kills, time_seconds as "timeSeconds",
        ash_earned as "ashEarned", ember_earned as "emberEarned",
        arena_marks_earned as "arenaMarksEarned",
        outcome, created_at as "createdAt"
    `;

    const result = await pool.query(query, [
      userId,
      doctrine || null,
      floorsCleared || 0,
      kills || 0,
      timeSeconds || 0,
      ashEarned || 0,
      emberEarned || 0,
      arenaMarksEarned || 0,
      outcome || 'fallen'
    ]);

    res.json(result.rows[0]);
  } catch (err: any) {
    console.error('[Runs API] Submit error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
