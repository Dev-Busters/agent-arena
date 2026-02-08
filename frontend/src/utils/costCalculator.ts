/**
 * Cost Calculator - Anthropic API Pricing
 * Based on current pricing for Claude models
 */

export const MODEL_PRICING = {
  'haiku': {
    inputPerMillionTokens: 0.80,
    outputPerMillionTokens: 4.00,
    displayName: 'Claude Haiku',
  },
  'sonnet': {
    inputPerMillionTokens: 3.00,
    outputPerMillionTokens: 15.00,
    displayName: 'Claude Sonnet',
  },
  'opus': {
    inputPerMillionTokens: 15.00,
    outputPerMillionTokens: 75.00,
    displayName: 'Claude Opus',
  },
};

export type ModelType = keyof typeof MODEL_PRICING;

interface TokenEstimate {
  inputTokens: number;
  outputTokens: number;
  model: ModelType;
}

export interface CostBreakdown {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  model: ModelType;
  displayModel: string;
}

/**
 * Calculate cost from token usage
 */
export function calculateTokenCost(estimate: TokenEstimate): CostBreakdown {
  const pricing = MODEL_PRICING[estimate.model];
  
  const inputCost = (estimate.inputTokens / 1_000_000) * pricing.inputPerMillionTokens;
  const outputCost = (estimate.outputTokens / 1_000_000) * pricing.outputPerMillionTokens;
  const totalCost = inputCost + outputCost;

  return {
    inputCost,
    outputCost,
    totalCost,
    model: estimate.model,
    displayModel: pricing.displayName,
  };
}

/**
 * Estimate costs for common tasks
 */
export const TASK_ESTIMATES = {
  // Battle: average 500-1000 tokens input, 200-400 output
  battle: (model: ModelType = 'haiku'): CostBreakdown => {
    return calculateTokenCost({
      inputTokens: 750,
      outputTokens: 300,
      model,
    });
  },
  
  // Agent creation: average 300-500 tokens input, 100-200 output
  createAgent: (model: ModelType = 'haiku'): CostBreakdown => {
    return calculateTokenCost({
      inputTokens: 400,
      outputTokens: 150,
      model,
    });
  },
  
  // Decision-making: average 1000-2000 tokens input, 200-500 output
  decision: (model: ModelType = 'haiku'): CostBreakdown => {
    return calculateTokenCost({
      inputTokens: 1500,
      outputTokens: 350,
      model,
    });
  },
};

/**
 * Format cost for display
 */
export function formatCost(cost: number): string {
  if (cost < 0.001) {
    return `$${(cost * 1_000_000).toFixed(1)}µ`; // micro-dollars
  }
  if (cost < 0.01) {
    return `$${(cost * 1000).toFixed(2)}m`; // milli-dollars
  }
  return `$${cost.toFixed(4)}`;
}

/**
 * Get cost percentage of a budget
 */
export function getCostPercentage(cost: number, budget: number): number {
  return Math.round((cost / budget) * 100);
}
