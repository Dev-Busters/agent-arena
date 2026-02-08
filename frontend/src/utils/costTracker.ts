/**
 * Cost Tracker - Track API usage over sessions
 */

import { formatCost } from './costCalculator'

export { formatCost }

export interface TokenUsage {
  id: string
  timestamp: number
  action: string
  inputTokens: number
  outputTokens: number
  model: string
  cost: number
}

export interface CostSession {
  sessionId: string
  startedAt: number
  endedAt?: number
  usages: TokenUsage[]
}

const STORAGE_KEY = 'agent_arena_cost_history'
const SESSION_KEY = 'agent_arena_current_session'

/**
 * Initialize a new cost tracking session
 */
export function initSession(): string {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const session: CostSession = {
    sessionId,
    startedAt: Date.now(),
    usages: [],
  }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return sessionId
}

/**
 * Get current session
 */
export function getCurrentSession(): CostSession {
  const stored = sessionStorage.getItem(SESSION_KEY)
  if (!stored) {
    const sessionId = initSession()
    return JSON.parse(sessionStorage.getItem(SESSION_KEY)!)
  }
  return JSON.parse(stored)
}

/**
 * Record a token usage event
 */
export function recordUsage(
  action: string,
  inputTokens: number,
  outputTokens: number,
  model: string,
  cost: number
): TokenUsage {
  const session = getCurrentSession()

  const usage: TokenUsage = {
    id: `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    action,
    inputTokens,
    outputTokens,
    model,
    cost,
  }

  session.usages.push(usage)
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))

  // Also save to persistent storage
  saveToHistory(usage)

  return usage
}

/**
 * Save usage to persistent history
 */
function saveToHistory(usage: TokenUsage) {
  const history: TokenUsage[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  history.push(usage)

  // Keep only last 1000 entries
  if (history.length > 1000) {
    history.shift()
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
}

/**
 * Get session summary
 */
export function getSessionSummary(): {
  totalCost: number
  totalInputTokens: number
  totalOutputTokens: number
  actionCount: number
  usages: TokenUsage[]
} {
  const session = getCurrentSession()

  const totalCost = session.usages.reduce((sum, u) => sum + u.cost, 0)
  const totalInputTokens = session.usages.reduce((sum, u) => sum + u.inputTokens, 0)
  const totalOutputTokens = session.usages.reduce((sum, u) => sum + u.outputTokens, 0)

  return {
    totalCost,
    totalInputTokens,
    totalOutputTokens,
    actionCount: session.usages.length,
    usages: session.usages,
  }
}

/**
 * Get cost history
 */
export function getCostHistory(days: number = 7): TokenUsage[] {
  const history: TokenUsage[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000

  return history.filter((u) => u.timestamp > cutoff)
}

/**
 * Get stats for a time period
 */
export function getCostStats(days: number = 7) {
  const history = getCostHistory(days)

  const totalCost = history.reduce((sum, u) => sum + u.cost, 0)
  const totalTokens = history.reduce((sum, u) => sum + u.inputTokens + u.outputTokens, 0)
  const avgCostPerAction = history.length > 0 ? totalCost / history.length : 0

  // Group by action
  const byAction: Record<string, number> = {}
  history.forEach((u) => {
    byAction[u.action] = (byAction[u.action] || 0) + u.cost
  })

  // Group by model
  const byModel: Record<string, number> = {}
  history.forEach((u) => {
    byModel[u.model] = (byModel[u.model] || 0) + u.cost
  })

  return {
    totalCost,
    totalTokens,
    avgCostPerAction,
    actionCount: history.length,
    byAction,
    byModel,
  }
}

/**
 * Export session data
 */
export function exportSessionData(): string {
  const session = getCurrentSession()
  const history = getCostHistory(30)

  return JSON.stringify(
    {
      session,
      history,
      exportedAt: new Date().toISOString(),
    },
    null,
    2
  )
}

/**
 * Clear all tracking data
 */
export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY)
  sessionStorage.removeItem(SESSION_KEY)
}
