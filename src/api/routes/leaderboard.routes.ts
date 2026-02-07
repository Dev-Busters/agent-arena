/**
 * Leaderboard Routes
 * GET /leaderboard - Get global leaderboard
 * GET /leaderboard/user/:user_id - Get user's rank and stats
 */

import { Router, Request, Response } from 'express';
import pool from '../../database/connection.js';

const router = Router();

/**
 * Get global leaderboard
 * GET /leaderboard?limit=50&offset=0
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 500);
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await pool.query(
      `SELECT rank, user_id, username, rating, wins, losses, win_rate, updated_at
       FROM leaderboard
       ORDER BY rank ASC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    // Get total count
    const countResult = await pool.query('SELECT COUNT(*) as count FROM leaderboard');
    const total = parseInt(countResult.rows[0].count);

    res.json({
      entries: result.rows,
      pagination: {
        limit,
        offset,
        total
      }
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * Get user's leaderboard position
 * GET /leaderboard/user/:user_id
 */
router.get('/user/:user_id', async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;

    const result = await pool.query(
      `SELECT rank, user_id, username, rating, wins, losses, win_rate, updated_at
       FROM leaderboard
       WHERE user_id = $1`,
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found on leaderboard' });
    }

    // Get nearby players (top 5 above and below)
    const userRank = result.rows[0].rank;
    const nearby = await pool.query(
      `SELECT rank, user_id, username, rating, wins, losses, win_rate
       FROM leaderboard
       WHERE rank BETWEEN $1 - 5 AND $1 + 5
       ORDER BY rank ASC`,
      [userRank]
    );

    res.json({
      user: result.rows[0],
      nearby: nearby.rows
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * Get top players
 * GET /leaderboard/top/:count
 */
router.get('/top/:count', async (req: Request, res: Response) => {
  try {
    const count = Math.min(parseInt(req.params.count) || 10, 100);

    const result = await pool.query(
      `SELECT rank, user_id, username, rating, wins, losses, win_rate
       FROM leaderboard
       ORDER BY rank ASC
       LIMIT $1`,
      [count]
    );

    res.json(result.rows);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
