/**
 * Cost Tracking Routes
 * GET /api/costs - Get cost summary
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../auth.js';

const router = Router();

/**
 * Get cost summary for user
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    // Placeholder - return mock data for now
    res.json({
      total_cost: 0,
      daily_cost: 0,
      monthly_cost: 0,
      breakdown: []
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
