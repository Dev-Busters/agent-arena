/**
 * Token Tracker - Backend token usage tracking
 * Integrates with Claude API response headers
 */

export interface TokenUsageRecord {
  userId: string
  action: string
  inputTokens: number
  outputTokens: number
  model: string
  cost: number
  timestamp: Date
  battleId?: string
  agentId?: string
}

// Anthropic pricing (in USD per million tokens)
export const MODEL_COSTS = {
  'claude-haiku-4-5-20251001': {
    input: 0.80,
    output: 4.00,
    name: 'haiku',
  },
  'claude-sonnet-4-5-20250514': {
    input: 3.00,
    output: 15.00,
    name: 'sonnet',
  },
  'claude-opus-4-5': {
    input: 15.00,
    output: 75.00,
    name: 'opus',
  },
}

/**
 * Calculate cost from token usage
 */
export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  model: string
): { cost: number; modelName: string } {
  const pricing = MODEL_COSTS[model as keyof typeof MODEL_COSTS] || MODEL_COSTS['claude-haiku-4-5-20251001']

  const inputCost = (inputTokens / 1_000_000) * pricing.input
  const outputCost = (outputTokens / 1_000_000) * pricing.output

  return {
    cost: inputCost + outputCost,
    modelName: pricing.name,
  }
}

/**
 * Extract token usage from Claude API response headers
 * Claude returns usage in the response body as { input_tokens, output_tokens }
 */
export function extractTokenUsage(
  response: any
): { inputTokens: number; outputTokens: number } | null {
  if (!response) return null

  // OpenAI-style response (what Claude API uses)
  if (response.usage) {
    return {
      inputTokens: response.usage.input_tokens || 0,
      outputTokens: response.usage.output_tokens || 0,
    }
  }

  // Fallback: check response headers (some implementations)
  if (response.headers) {
    const inputTokens = parseInt(response.headers['x-anthropic-input-tokens'] || '0')
    const outputTokens = parseInt(response.headers['x-anthropic-output-tokens'] || '0')

    if (inputTokens > 0 || outputTokens > 0) {
      return { inputTokens, outputTokens }
    }
  }

  return null
}

/**
 * Format cost for display
 */
export function formatCost(cost: number): string {
  if (cost < 0.001) {
    return `$${(cost * 1_000_000).toFixed(1)}µ`
  }
  if (cost < 0.01) {
    return `$${(cost * 1000).toFixed(2)}m`
  }
  return `$${cost.toFixed(4)}`
}

/**
 * Estimate tokens for common tasks
 */
export const ESTIMATED_TOKENS = {
  battle: {
    input: 750,
    output: 300,
  },
  agentCreation: {
    input: 400,
    output: 150,
  },
  agentDecision: {
    input: 1500,
    output: 350,
  },
  battleLogAnalysis: {
    input: 2000,
    output: 500,
  },
}
