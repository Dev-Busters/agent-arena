/**
 * Leaderboard Routes
 * Multi-category leaderboard with agent info, class filtering, and search
 */

import { Router, Request, Response } from 'express';
import pool from '../../database/connection.js';

const router = Router();

type LeaderboardCategory = 'rating' | 'wins' | 'depth' | 'gold';

/**
 * Get leaderboard with multiple category support
 * GET /leaderboard?category=rating&class=all&search=&limit=50&offset=0
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const doctrine = req.query.doctrine as string;
    const search = (req.query.search as string) || '';
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 500);

    // Build WHERE clause
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (doctrine && doctrine !== 'all') {
      conditions.push(`a.doctrine = $${paramIndex}`);
      params.push(doctrine);
      paramIndex++;
    }

    if (search) {
      conditions.push(`(u.username ILIKE $${paramIndex} OR a.name ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Query for Crucible PvE leaderboard (deepest floor, kills, runs)
    const query = `
      SELECT 
        ROW_NUMBER() OVER (ORDER BY a.deepest_floor DESC, a.total_kills DESC) AS rank,
        u.id as "userId",
        u.username,
        a.name as "agentName",
        a.doctrine,
        a.deepest_floor as "deepestFloor",
        a.total_kills as "totalKills",
        a.total_runs as "totalRuns",
        jsonb_build_object(
          'iron', a.doctrine_lvl_iron,
          'arc', a.doctrine_lvl_arc,
          'edge', a.doctrine_lvl_edge
        ) as "doctrineLevel"
      FROM agents a
      JOIN users u ON a.user_id = u.id
      ${whereClause}
      ORDER BY a.deepest_floor DESC, a.total_kills DESC
      LIMIT $${paramIndex}
    `;

    params.push(limit);

    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (err: any) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get user's leaderboard position across all categories
 * GET /leaderboard/user/:user_id
 */
router.get('/user/:user_id', async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;

    // Get user's data
    const userQuery = `
      SELECT 
        u.id as user_id,
        u.username,
        a.id as agent_id,
        a.name as agent_name,
        a.class,
        a.level,
        COALESCE(l.rating, 1000) as rating,
        COALESCE(l.wins, 0) as wins,
        COALESCE(l.losses, 0) as losses,
        COALESCE(a.max_depth, 1) as max_depth,
        COALESCE(a.total_gold, 0) as total_gold
      FROM users u
      JOIN agents a ON a.user_id = u.id
      LEFT JOIN leaderboard l ON l.user_id = u.id
      WHERE u.id = $1
    `;
    const userResult = await pool.query(userQuery, [user_id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Get ranks for each category
    const rankQueries = {
      rating: `SELECT COUNT(*) + 1 as rank FROM leaderboard WHERE rating > $1`,
      wins: `SELECT COUNT(*) + 1 as rank FROM leaderboard WHERE wins > $1`,
      depth: `SELECT COUNT(*) + 1 as rank FROM agents WHERE max_depth > $1`,
      gold: `SELECT COUNT(*) + 1 as rank FROM agents WHERE total_gold > $1`
    };

    const ranks: Record<string, number> = {};
    
    const ratingRank = await pool.query(rankQueries.rating, [user.rating]);
    ranks.rating = parseInt(ratingRank.rows[0].rank);
    
    const winsRank = await pool.query(rankQueries.wins, [user.wins]);
    ranks.wins = parseInt(winsRank.rows[0].rank);
    
    const depthRank = await pool.query(rankQueries.depth, [user.max_depth]);
    ranks.depth = parseInt(depthRank.rows[0].rank);
    
    const goldRank = await pool.query(rankQueries.gold, [user.total_gold]);
    ranks.gold = parseInt(goldRank.rows[0].rank);

    // Get nearby players by rating
    const nearbyQuery = `
      SELECT 
        u.id as user_id,
        u.username,
        a.name as agent_name,
        a.class,
        a.level,
        COALESCE(l.rating, 1000) as rating,
        COALESCE(l.wins, 0) as wins,
        COALESCE(l.losses, 0) as losses
      FROM users u
      JOIN agents a ON a.user_id = u.id
      LEFT JOIN leaderboard l ON l.user_id = u.id
      WHERE COALESCE(l.rating, 1000) BETWEEN $1 - 100 AND $1 + 100
      ORDER BY COALESCE(l.rating, 1000) DESC
      LIMIT 11
    `;
    const nearbyResult = await pool.query(nearbyQuery, [user.rating]);

    res.json({
      user,
      ranks,
      nearby: nearbyResult.rows
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * Get top N players for a specific category
 * GET /leaderboard/top/:count?category=rating
 */
router.get('/top/:count', async (req: Request, res: Response) => {
  try {
    const count = Math.min(parseInt(req.params.count) || 10, 100);
    const category = (req.query.category as LeaderboardCategory) || 'rating';

    let orderBy: string;
    switch (category) {
      case 'wins':
        orderBy = 'COALESCE(l.wins, 0) DESC';
        break;
      case 'depth':
        orderBy = 'COALESCE(a.max_depth, 0) DESC';
        break;
      case 'gold':
        orderBy = 'COALESCE(a.total_gold, 0) DESC';
        break;
      case 'rating':
      default:
        orderBy = 'COALESCE(l.rating, 1000) DESC';
    }

    const query = `
      SELECT 
        u.id as user_id,
        u.username,
        a.name as agent_name,
        a.class,
        a.level,
        COALESCE(l.rating, 1000) as rating,
        COALESCE(l.wins, 0) as wins,
        COALESCE(l.losses, 0) as losses,
        COALESCE(a.max_depth, 1) as max_depth,
        COALESCE(a.total_gold, 0) as total_gold
      FROM users u
      JOIN agents a ON a.user_id = u.id
      LEFT JOIN leaderboard l ON l.user_id = u.id
      ORDER BY ${orderBy}, a.level DESC
      LIMIT $1
    `;

    const result = await pool.query(query, [count]);

    const leaderboard = result.rows.map((row, index) => ({
      rank: index + 1,
      ...row
    }));

    res.json(leaderboard);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * Update ELO rating after a battle
 * Called internally after battles complete
 */
export async function updateEloRating(
  winnerId: string,
  loserId: string,
  kFactor: number = 32
): Promise<void> {
  try {
    // Get current ratings
    const winnerResult = await pool.query(
      'SELECT rating FROM leaderboard WHERE user_id = $1',
      [winnerId]
    );
    const loserResult = await pool.query(
      'SELECT rating FROM leaderboard WHERE user_id = $1',
      [loserId]
    );

    const winnerRating = winnerResult.rows[0]?.rating || 1000;
    const loserRating = loserResult.rows[0]?.rating || 1000;

    // Calculate expected scores
    const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
    const expectedLoser = 1 / (1 + Math.pow(10, (winnerRating - loserRating) / 400));

    // Calculate new ratings
    const newWinnerRating = Math.round(winnerRating + kFactor * (1 - expectedWinner));
    const newLoserRating = Math.round(loserRating + kFactor * (0 - expectedLoser));

    // Update or insert winner
    await pool.query(
      `INSERT INTO leaderboard (user_id, rating, wins, losses, updated_at)
       VALUES ($1, $2, 1, 0, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         rating = $2,
         wins = leaderboard.wins + 1,
         updated_at = NOW()`,
      [winnerId, newWinnerRating]
    );

    // Update or insert loser
    await pool.query(
      `INSERT INTO leaderboard (user_id, rating, wins, losses, updated_at)
       VALUES ($1, $2, 0, 1, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         rating = $2,
         losses = leaderboard.losses + 1,
         updated_at = NOW()`,
      [loserId, Math.max(100, newLoserRating)]
    );
  } catch (err) {
    console.error('Failed to update ELO ratings:', err);
  }
}

export default router;
