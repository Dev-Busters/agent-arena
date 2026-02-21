/**
 * Debug Routes - Check database schema and data
 * For troubleshooting leaderboard sync issues
 */

import { Router, Request, Response } from 'express';
import pool from '../../database/connection.js';

const router = Router();

/**
 * Check agents table schema
 */
router.get('/schema', async (req: Request, res: Response) => {
  try {
    // Get agents table columns
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'agents' 
      ORDER BY ordinal_position
    `);
    
    // Check if runs table exists
    const runsTable = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'runs'
    `);

    res.json({
      agentsColumns: columns.rows,
      runsTableExists: runsTable.rows.length > 0,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('[Debug] Schema error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Check buster agent data
 */
router.get('/buster', async (req: Request, res: Response) => {
  try {
    const agent = await pool.query(`
      SELECT a.*, u.username
      FROM agents a
      JOIN users u ON a.user_id = u.id
      WHERE u.username = 'buster'
    `);

    const runs = await pool.query(`
      SELECT doctrine, floors_cleared, kills, time_seconds, outcome
      FROM runs
      WHERE user_id = (SELECT id FROM users WHERE username = 'buster')
      ORDER BY created_at DESC
      LIMIT 10
    `);

    res.json({
      agent: agent.rows[0] || null,
      runs: runs.rows,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('[Debug] Buster data error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Check leaderboard query with buster data
 */
router.get('/leaderboard-test', async (req: Request, res: Response) => {
  try {
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
      ORDER BY a.deepest_floor DESC, a.total_kills DESC
      LIMIT 50
    `;

    const result = await pool.query(query);
    res.json({
      data: result.rows,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('[Debug] Leaderboard test error:', err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

export default router;
