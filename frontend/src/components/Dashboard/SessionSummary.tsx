'use client'

import { useEffect, useState } from 'react'
import { getSessionSummary, TokenUsage, formatCost } from '@/utils/costTracker'

interface SessionSummaryProps {
  onUsageUpdate?: (usage: TokenUsage[]) => void
}

export function SessionSummary({ onUsageUpdate }: SessionSummaryProps) {
  const [summary, setSummary] = useState<any>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    // Update summary every second
    const interval = setInterval(() => {
      const newSummary = getSessionSummary()
      setSummary(newSummary)
      onUsageUpdate?.(newSummary.usages)
    }, 1000)

    return () => clearInterval(interval)
  }, [onUsageUpdate])

  if (!summary) {
    return null
  }

  const { totalCost, totalInputTokens, totalOutputTokens, actionCount, usages } = summary

  // Get unique models used
  const modelsUsed = Array.from(new Set(usages.map((u: TokenUsage) => u.model)))

  // Calculate budget warning
  const dailyBudgetEstimate = totalCost / (Date.now() / (1000 * 60 * 60 * 24))
  const shouldWarn = dailyBudgetEstimate > 10 // Warn if estimated daily cost > $10

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-gray-950 via-gray-900 to-transparent pt-8">
      <div className="max-w-7xl mx-auto px-4 pb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-full px-4 py-4 rounded-lg transition border ${
            shouldWarn
              ? 'bg-red-900/30 border-red-500/50 hover:border-red-500'
              : 'bg-gradient-to-r from-amber-900/20 to-amber-900/5 border-amber-500/30 hover:border-amber-500'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className="text-xs text-gray-400 font-medium flex items-center gap-2">
                <span>📊</span> Session Cost Summary
                {shouldWarn && <span className="text-red-400">⚠️ High usage detected</span>}
              </p>
              <p className={`text-xl font-bold mt-1 ${shouldWarn ? 'text-red-400' : 'text-amber-400'}`}>
                {formatCost(totalCost)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {actionCount} actions • {totalInputTokens.toLocaleString()} in • {totalOutputTokens.toLocaleString()} out
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs text-gray-400">Daily Run Rate</p>
              <p className={`text-lg font-bold ${shouldWarn ? 'text-red-400' : 'text-amber-400'}`}>
                ~{formatCost(dailyBudgetEstimate)}/day
              </p>
              {modelsUsed.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Models: {modelsUsed.map((m) => m.toUpperCase()).join(', ')}
                </p>
              )}
            </div>

            <svg
              className={`w-5 h-5 transition-transform ml-4 ${isExpanded ? 'rotate-180' : ''} ${
                shouldWarn ? 'text-red-400' : 'text-amber-400'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </button>

        {isExpanded && (
          <div className={`mt-2 p-4 rounded-lg border bg-gray-900/80 backdrop-blur ${
            shouldWarn ? 'border-red-500/50' : 'border-amber-500/30'
          }`}>
            {/* Actions List */}
            <div className="mb-6">
              <h4 className="text-sm font-bold text-gray-300 mb-3">Actions This Session</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {usages.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">No actions recorded yet</p>
                ) : (
                  usages
                    .slice()
                    .reverse()
                    .map((usage: TokenUsage) => (
                      <div key={usage.id} className="flex items-center justify-between text-xs bg-gray-800/50 rounded p-2">
                        <div>
                          <p className="text-gray-300 capitalize font-medium">{usage.action}</p>
                          <p className="text-gray-500">
                            {usage.inputTokens.toLocaleString()} in + {usage.outputTokens.toLocaleString()} out ({usage.model})
                          </p>
                        </div>
                        <p className="text-amber-400 font-bold">{formatCost(usage.cost)}</p>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Budget Warning */}
            {shouldWarn && (
              <div className="bg-red-900/30 border border-red-500/50 rounded p-3">
                <p className="text-xs text-red-200 font-bold mb-1">⚠️ Budget Alert</p>
                <p className="text-xs text-red-300">
                  Your current usage rate ({formatCost(dailyBudgetEstimate)}/day) exceeds recommended limits. Consider using
                  cheaper models or reducing action frequency.
                </p>
              </div>
            )}

            {/* Tips */}
            <div className="mt-4 p-3 bg-gray-800/50 rounded border border-gray-700 text-xs text-gray-400">
              <p className="font-bold mb-1">💡 Cost Optimization Tips</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Use Claude Haiku for routine battles (⚡ Cheapest)</li>
                <li>Use Sonnet for complex decisions (⚙️ Balanced)</li>
                <li>Reserve Opus for critical moments only (🧠 Most expensive)</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
