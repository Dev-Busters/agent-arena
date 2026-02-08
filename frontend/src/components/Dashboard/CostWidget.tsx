'use client'

import { CostBreakdown, formatCost } from '@/utils/costCalculator'
import { useState } from 'react'

interface CostWidgetProps {
  title: string
  cost: CostBreakdown
  estimatedCount?: number
  isLoading?: boolean
}

export function CostWidget({
  title,
  cost,
  estimatedCount = 1,
  isLoading = false,
}: CostWidgetProps) {
  const [expanded, setExpanded] = useState(false)
  const totalEstimate = cost.totalCost * estimatedCount

  return (
    <div className="bg-gradient-to-br from-amber-900/20 to-amber-900/5 border border-amber-500/30 rounded-lg p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left hover:text-amber-400 transition flex items-center justify-between"
      >
        <div>
          <p className="text-sm text-gray-400 font-medium">{title}</p>
          <p className="text-xl font-bold text-amber-400 mt-1">
            {formatCost(totalEstimate)}
            {estimatedCount > 1 && (
              <span className="text-xs text-gray-500 ml-2">
                ({estimatedCount}x @ {formatCost(cost.totalCost)})
              </span>
            )}
          </p>
        </div>
        <svg
          className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-amber-500/20 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Input ({cost.model})</span>
            <span className="text-amber-400">{formatCost(cost.inputCost * estimatedCount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Output</span>
            <span className="text-amber-400">{formatCost(cost.outputCost * estimatedCount)}</span>
          </div>
          <div className="flex justify-between font-bold pt-2 border-t border-amber-500/20">
            <span className="text-gray-300">Total</span>
            <span className="text-amber-400">{formatCost(totalEstimate)}</span>
          </div>
          <p className="text-xs text-gray-500 italic mt-2">
            *Estimates based on average token usage. Actual costs may vary.
          </p>
        </div>
      )}
    </div>
  )
}
