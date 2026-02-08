/**
 * Progression Routes
 * Handle XP, leveling, gold updates
 */

import { Router, Request, Response } from 'express';
import { query } from '../../database/connection.js';
import { verifyToken } from '../auth.js';
import { calculateLevelUp } from '../../game/loot.js';

const router = Router();

/**
 * POST /api/progression/dungeon-rewards
 * Save rewards from completed dungeon encounter
 */
router.post('/dungeon-rewards', verifyToken, async (req: Request, res: Response) => {
  try {
    const { agentId, gold, xp } = req.body;
    const userId = (req as any).user.id;

    // Get current agent
    const agentResult = await query(
      'SELECT * FROM agents WHERE id = $1 AND user_id = $2',
      [agentId, userId]
    );

    if (agentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const agent = agentResult.rows[0];

    // Calculate new level
    const levelUpData = calculateLevelUp(
      agent.level,
      agent.experience,
      xp
    );

    // Update agent
    await query(
      `UPDATE agents 
       SET level = $1, experience = $2, current_hp = max_hp
       WHERE id = $3`,
      [levelUpData.newLevel, levelUpData.newXp, agentId]
    );

    // Update user gold
    await query(
      `UPDATE users 
       SET gold = gold + $1
       WHERE id = $2`,
      [gold, userId]
    );

    res.json({
      success: true,
      level: levelUpData.newLevel,
      experience: levelUpData.newXp,
      levelUp: levelUpData.levelsGained > 0,
      gold: gold
    });
  } catch (error) {
    console.error('Progression error:', error);
    res.status(500).json({ error: 'Failed to save progression' });
  }
});

/**
 * GET /api/progression/agent/:agentId
 * Get agent progression data
 */
router.get('/agent/:agentId', async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;

    const result = await query(
      'SELECT id, level, experience, current_hp, max_hp FROM agents WHERE id = $1',
      [agentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Fetch progression error:', error);
    res.status(500).json({ error: 'Failed to fetch progression' });
  }
});

export default router;
