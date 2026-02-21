import { Router, Request, Response } from 'express';

const router = Router();

// Quick test: create a run without any auth
router.post('/test-create', async (req: Response) => {
  try {
    const pool = await import('../../database/connection.js');
    
    // Get buster user
    const userResult = await pool.default.query("SELECT id FROM users WHERE username = 'buster' LIMIT 1");
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'No buster user found' });
    }
    const userId = userResult.rows[0].id;

    // Insert test run
    const result = await pool.default.query(`
      INSERT INTO runs (user_id, doctrine, floors_cleared, kills, time_seconds, ash_earned, ember_earned, arena_marks_earned, outcome)
      VALUES ($1, 'iron', 3, 10, 180, 15, 5, 1, 'fallen')
      RETURNING id, doctrine, floors_cleared, kills
    `, [userId]);

    res.json({ success: true, run: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;