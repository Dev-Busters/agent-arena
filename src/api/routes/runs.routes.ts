/**
 * Runs Routes - Crucible PvE run tracking
 */

import { Router, Request, Response } from 'express';
import pool from '../../database/connection.js';

const router = Router();

/**
 * GET /runs - List recent runs (no auth required for testing)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);

    // Get ALL runs (no auth required for testing)
    const query = `
      SELECT 
        id, user_id as "userId", doctrine, 
        floors_cleared as "floorsCleared", kills, time_seconds as "timeSeconds",
        ash_earned as "ashEarned", ember_earned as "emberEarned", 
        arena_marks_earned as "arenaMarksEarned",
        outcome, created_at as "createdAt"
      FROM runs
      ORDER BY created_at DESC
      LIMIT $1
    `;

    const params = [limit];
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
 * POST /runs - Submit a new run (no auth for testing)
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    // Get userId from request body or use test user
    let userId = (req as any).userId;
    if (!userId) {
      // Try to get user from auth header
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const jwt = require('jsonwebtoken');
          const token = authHeader.substring(7);
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key');
          userId = decoded.userId || decoded.id;
        } catch (e) { /* ignore */ }
      }
    }
    
    // If still no userId, use the test buster user
    if (!userId) {
      const userResult = await pool.query("SELECT id FROM users WHERE username = 'buster' LIMIT 1");
      if (userResult.rows.length > 0) {
        userId = userResult.rows[0].id;
      } else {
        return res.status(400).json({ error: 'No user found' });
      }
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
