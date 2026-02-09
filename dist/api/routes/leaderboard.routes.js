/**
 * Leaderboard Routes
 * Multi-category leaderboard with agent info, class filtering, and search
 */
import { Router } from 'express';
import pool from '../../database/connection.js';
const router = Router();
/**
 * Get leaderboard with multiple category support
 * GET /leaderboard?category=rating&class=all&search=&limit=50&offset=0
 */
router.get('/', async (req, res) => {
    try {
        const category = req.query.category || 'rating';
        const classFilter = req.query.class || 'all';
        const search = req.query.search || '';
        const limit = Math.min(parseInt(req.query.limit) || 50, 500);
        const offset = parseInt(req.query.offset) || 0;
        // Build ORDER BY clause based on category
        let orderBy;
        switch (category) {
            case 'wins':
                orderBy = 'COALESCE(l.wins, 0) DESC';
                break;
            case 'depth':
                orderBy = 'a.level DESC'; // Temporary: use level instead of max_depth
                break;
            case 'gold':
                orderBy = 'COALESCE(l.rating, 1000) DESC'; // Temporary: use rating instead of gold
                break;
            case 'rating':
            default:
                orderBy = 'COALESCE(l.rating, 1000) DESC';
        }
        // Build WHERE clause
        const conditions = [];
        const params = [];
        let paramIndex = 1;
        if (classFilter && classFilter !== 'all') {
            conditions.push(`a.class = $${paramIndex}`);
            params.push(classFilter);
            paramIndex++;
        }
        if (search) {
            conditions.push(`(u.username ILIKE $${paramIndex} OR a.name ILIKE $${paramIndex})`);
            params.push(`%${search}%`);
            paramIndex++;
        }
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        // Main query joining users, agents, and leaderboard
        const query = `
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
        1 as max_depth,
        0 as total_gold,
        CASE WHEN COALESCE(l.wins, 0) + COALESCE(l.losses, 0) > 0 
          THEN ROUND((COALESCE(l.wins, 0)::numeric / (COALESCE(l.wins, 0) + COALESCE(l.losses, 0))) * 100)
          ELSE 0 
        END as win_rate
      FROM users u
      JOIN agents a ON a.user_id = u.id
      LEFT JOIN leaderboard l ON l.user_id = u.id
      ${whereClause}
      ORDER BY ${orderBy}, a.level DESC, u.username ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
        params.push(limit, offset);
        const result = await pool.query(query, params);
        // Add rank based on position
        const leaderboard = result.rows.map((row, index) => ({
            rank: offset + index + 1,
            ...row
        }));
        // Get total count
        const countQuery = `
      SELECT COUNT(*) as count
      FROM users u
      JOIN agents a ON a.user_id = u.id
      LEFT JOIN leaderboard l ON l.user_id = u.id
      ${whereClause}
    `;
        const countResult = await pool.query(countQuery, params.slice(0, -2));
        const total = parseInt(countResult.rows[0].count);
        // Get aggregate stats
        const statsQuery = `
      SELECT 
        COUNT(DISTINCT u.id) as total_players,
        SUM(COALESCE(l.wins, 0)) as total_wins,
        MAX(COALESCE(a.max_depth, 1)) as deepest_floor,
        SUM(COALESCE(a.total_gold, 0)) as total_gold_earned
      FROM users u
      JOIN agents a ON a.user_id = u.id
      LEFT JOIN leaderboard l ON l.user_id = u.id
    `;
        const statsResult = await pool.query(statsQuery);
        res.json({
            leaderboard,
            pagination: {
                limit,
                offset,
                total
            },
            stats: statsResult.rows[0],
            category
        });
    }
    catch (err) {
        console.error('Leaderboard error:', err);
        res.status(400).json({ error: err.message });
    }
});
/**
 * Get user's leaderboard position across all categories
 * GET /leaderboard/user/:user_id
 */
router.get('/user/:user_id', async (req, res) => {
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
        const ranks = {};
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
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
/**
 * Get top N players for a specific category
 * GET /leaderboard/top/:count?category=rating
 */
router.get('/top/:count', async (req, res) => {
    try {
        const count = Math.min(parseInt(req.params.count) || 10, 100);
        const category = req.query.category || 'rating';
        let orderBy;
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
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
/**
 * Update ELO rating after a battle
 * Called internally after battles complete
 */
export async function updateEloRating(winnerId, loserId, kFactor = 32) {
    try {
        // Get current ratings
        const winnerResult = await pool.query('SELECT rating FROM leaderboard WHERE user_id = $1', [winnerId]);
        const loserResult = await pool.query('SELECT rating FROM leaderboard WHERE user_id = $1', [loserId]);
        const winnerRating = winnerResult.rows[0]?.rating || 1000;
        const loserRating = loserResult.rows[0]?.rating || 1000;
        // Calculate expected scores
        const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
        const expectedLoser = 1 / (1 + Math.pow(10, (winnerRating - loserRating) / 400));
        // Calculate new ratings
        const newWinnerRating = Math.round(winnerRating + kFactor * (1 - expectedWinner));
        const newLoserRating = Math.round(loserRating + kFactor * (0 - expectedLoser));
        // Update or insert winner
        await pool.query(`INSERT INTO leaderboard (user_id, rating, wins, losses, updated_at)
       VALUES ($1, $2, 1, 0, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         rating = $2,
         wins = leaderboard.wins + 1,
         updated_at = NOW()`, [winnerId, newWinnerRating]);
        // Update or insert loser
        await pool.query(`INSERT INTO leaderboard (user_id, rating, wins, losses, updated_at)
       VALUES ($1, $2, 0, 1, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         rating = $2,
         losses = leaderboard.losses + 1,
         updated_at = NOW()`, [loserId, Math.max(100, newLoserRating)]);
    }
    catch (err) {
        console.error('Failed to update ELO ratings:', err);
    }
}
export default router;
//# sourceMappingURL=leaderboard.routes.js.map