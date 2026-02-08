/**
 * Cost Tracking Routes
 * GET /costs/summary - Get current session cost summary
 * GET /costs/history - Get cost history
 * POST /costs/record - Record a token usage event
 * GET /costs/stats - Get cost statistics
 */

import { Router, Request, Response } from 'express'
import pool from '../../database/connection.js'
import { authMiddleware } from '../auth.js'
import { calculateCost } from '../../utils/tokenTracker.js'

const router = Router()
router.use(authMiddleware)

/**
 * Record token usage
 * POST /costs/record
 */
router.post('/record', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { action, inputTokens, outputTokens, model = 'claude-haiku-4-5-20251001', battleId, agentId } = req.body

    if (!action || typeof inputTokens !== 'number' || typeof outputTokens !== 'number') {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const { cost } = calculateCost(inputTokens, outputTokens, model)

    const result = await pool.query(
      `INSERT INTO token_usage (user_id, action, input_tokens, output_tokens, model, cost, battle_id, agent_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [user.id, action, inputTokens, outputTokens, model, cost, battleId || null, agentId || null]
    )

    res.json({
      success: true,
      usage: result.rows[0],
      cost,
    })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

/**
 * Get cost summary for current day
 * GET /costs/summary
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const days = parseInt(req.query.days as string) || 1

    const result = await pool.query(
      `SELECT
        COUNT(*) as action_count,
        SUM(input_tokens) as total_input_tokens,
        SUM(output_tokens) as total_output_tokens,
        SUM(cost) as total_cost,
        AVG(cost) as avg_cost_per_action,
        array_agg(DISTINCT model) as models_used
       FROM token_usage
       WHERE user_id = $1
       AND created_at > NOW() - INTERVAL '1 day' * $2`,
      [user.id, days]
    )

    const summary = result.rows[0]

    res.json({
      actionCount: parseInt(summary.action_count) || 0,
      totalInputTokens: parseInt(summary.total_input_tokens) || 0,
      totalOutputTokens: parseInt(summary.total_output_tokens) || 0,
      totalCost: parseFloat(summary.total_cost) || 0,
      avgCostPerAction: parseFloat(summary.avg_cost_per_action) || 0,
      modelsUsed: summary.models_used || [],
      period: `${days} day(s)`,
    })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

/**
 * Get cost history with filtering
 * GET /costs/history?days=7&action=battle&limit=50
 */
router.get('/history', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const days = parseInt(req.query.days as string) || 7
    const action = req.query.action as string
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000)
    const offset = parseInt(req.query.offset as string) || 0

    let query = `SELECT * FROM token_usage WHERE user_id = $1 AND created_at > NOW() - INTERVAL '1 day' * $2`
    const params: any[] = [user.id, days]

    if (action) {
      query += ` AND action = $${params.length + 1}`
      params.push(action)
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)

    const result = await pool.query(query, params)

    res.json({
      items: result.rows,
      count: result.rows.length,
      limit,
      offset,
    })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

/**
 * Get cost statistics
 * GET /costs/stats
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const days = parseInt(req.query.days as string) || 30

    // Get breakdown by action
    const actionResult = await pool.query(
      `SELECT action, COUNT(*) as count, SUM(cost) as total_cost
       FROM token_usage
       WHERE user_id = $1 AND created_at > NOW() - INTERVAL '1 day' * $2
       GROUP BY action
       ORDER BY total_cost DESC`,
      [user.id, days]
    )

    // Get breakdown by model
    const modelResult = await pool.query(
      `SELECT model, COUNT(*) as count, SUM(cost) as total_cost
       FROM token_usage
       WHERE user_id = $1 AND created_at > NOW() - INTERVAL '1 day' * $2
       GROUP BY model
       ORDER BY total_cost DESC`,
      [user.id, days]
    )

    // Get daily totals
    const dailyResult = await pool.query(
      `SELECT DATE(created_at) as day, COUNT(*) as action_count, SUM(cost) as total_cost
       FROM token_usage
       WHERE user_id = $1 AND created_at > NOW() - INTERVAL '1 day' * $2
       GROUP BY DATE(created_at)
       ORDER BY day DESC`,
      [user.id, days]
    )

    res.json({
      period: `${days} days`,
      byAction: actionResult.rows,
      byModel: modelResult.rows,
      daily: dailyResult.rows,
    })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

/**
 * Get cost estimate (does not record)
 * POST /costs/estimate
 */
router.post('/estimate', async (req: Request, res: Response) => {
  try {
    const { action, inputTokens, outputTokens, model = 'claude-haiku-4-5-20251001' } = req.body

    const { cost } = calculateCost(inputTokens, outputTokens, model)

    res.json({
      action,
      inputTokens,
      outputTokens,
      model,
      cost,
      currency: 'USD',
    })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

export default router
