/**
 * Agent Routes
 * POST /agents - Create new agent
 * GET /agents/:id - Get agent details
 * PUT /agents/:id - Update agent
 * DELETE /agents/:id - Delete agent
 */
import { Router } from 'express';
import { z } from 'zod';
import pool from '../../database/connection.js';
import { authMiddleware } from '../auth.js';
const router = Router();
// Apply auth to all routes
router.use(authMiddleware);
const CreateAgentSchema = z.object({
    class: z.enum(['warrior', 'mage', 'rogue', 'paladin'])
});
// Base stats by class
const BASE_STATS = {
    warrior: { max_hp: 120, attack: 15, defense: 12, speed: 8, accuracy: 85, evasion: 5 },
    mage: { max_hp: 80, attack: 10, defense: 8, speed: 12, accuracy: 90, evasion: 8 },
    rogue: { max_hp: 100, attack: 14, defense: 8, speed: 15, accuracy: 95, evasion: 12 },
    paladin: { max_hp: 110, attack: 12, defense: 15, speed: 9, accuracy: 88, evasion: 6 }
};
/**
 * Create new agent
 * POST /agents
 */
router.post('/', async (req, res) => {
    try {
        const user = req.user;
        const validated = CreateAgentSchema.parse(req.body);
        // Check if user already has an active agent
        const existing = await pool.query('SELECT id FROM agents WHERE user_id = $1 AND deleted_at IS NULL', [user.id]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'You already have an active agent' });
        }
        const stats = BASE_STATS[validated.class];
        // Create agent - use username as agent name
        const result = await pool.query(`INSERT INTO agents (
        user_id, name, class, level, experience,
        max_hp, current_hp, attack, defense, speed, accuracy, evasion
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, user_id, name, class, level, experience, max_hp, current_hp,
                attack, defense, speed, accuracy, evasion, created_at`, [
            user.id,
            user.username,
            validated.class,
            1,
            0,
            stats.max_hp,
            stats.max_hp,
            stats.attack,
            stats.defense,
            stats.speed,
            stats.accuracy,
            stats.evasion
        ]);
        res.status(201).json(result.rows[0]);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
/**
 * Get user's active agent
 * GET /agents/me/current
 */
router.get('/me/current', async (req, res) => {
    try {
        const user = req.user;
        const result = await pool.query(`SELECT a.*, 
              array_agg(
                json_build_object('id', e.id, 'slot', e.slot, 'item_id', e.item_id, 'item_name', i.name)
              ) AS equipment
       FROM agents a
       LEFT JOIN equipment e ON a.id = e.agent_id
       LEFT JOIN items i ON e.item_id = i.id
       WHERE a.user_id = $1 AND a.deleted_at IS NULL
       GROUP BY a.id
       LIMIT 1`, [user.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No active agent' });
        }
        res.json(result.rows[0]);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
/**
 * Get agent details by ID
 * GET /agents/:id
 */
router.get('/:id', async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const result = await pool.query(`SELECT a.*, 
              array_agg(
                json_build_object('id', e.id, 'slot', e.slot, 'item_id', e.item_id, 'item_name', i.name)
              ) AS equipment
       FROM agents a
       LEFT JOIN equipment e ON a.id = e.agent_id
       LEFT JOIN items i ON e.item_id = i.id
       WHERE a.id = $1 AND a.user_id = $2 AND a.deleted_at IS NULL
       GROUP BY a.id`, [id, user.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Agent not found' });
        }
        res.json(result.rows[0]);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
/**
 * Update agent
 * PUT /agents/:id
 */
router.put('/:id', async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        const result = await pool.query(`UPDATE agents SET name = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND user_id = $3 AND deleted_at IS NULL
       RETURNING id, user_id, name, class, level, experience, max_hp, current_hp,
                 attack, defense, speed, accuracy, evasion, updated_at`, [name, id, user.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Agent not found' });
        }
        res.json(result.rows[0]);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
/**
 * Delete agent (soft delete)
 * DELETE /agents/:id
 */
router.delete('/:id', async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const result = await pool.query(`UPDATE agents SET deleted_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
       RETURNING id`, [id, user.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Agent not found' });
        }
        res.json({ message: 'Agent deleted' });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
export default router;
//# sourceMappingURL=agent.routes.js.map