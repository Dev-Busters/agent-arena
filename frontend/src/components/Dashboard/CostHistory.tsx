'use client'

import { useState, useEffect } from 'react'
import { getCostHistory, getCostStats } from '@/utils/costCalculator'
import { TokenUsage, formatCost } from '@/utils/costTracker'

export function CostHistory() {
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(7)
  const [stats, setStats] = useState<any>(null)
  const [history, setHistory] = useState<TokenUsage[]>([])
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const hist = getCostHistory(timeRange)
    const stat = getCostStats(timeRange)
    setHistory(hist)
    setStats(stat)
  }, [timeRange])

  if (!history || history.length === 0) {
    return (
      <div className="bg-gray-900/50 border border-primary/20 rounded-lg p-4 text-center text-gray-400">
        <p className="text-sm">No cost history yet</p>
      </div>
    )
  }

  const actionGroups = Object.entries(stats?.byAction || {})
    .map(([action, cost]) => ({ action, cost: cost as number }))
    .sort((a, b) => b.cost - a.cost)

  return (
    <div className="bg-gray-900/50 border border-primary/20 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-4 hover:bg-gray-800/50 transition flex items-center justify-between"
      >
        <div className="text-left">
          <p className="text-sm text-gray-400 font-medium">Cost History</p>
          <p className="text-lg font-bold text-amber-400 mt-1">{formatCost(stats?.totalCost || 0)}</p>
          <p className="text-xs text-gray-500 mt-1">
            {timeRange} days • {history.length} actions • {stats?.totalTokens.toLocaleString()} tokens
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-gray-400">Avg Cost</p>
          <p className="font-bold text-amber-400">{formatCost(stats?.avgCostPerAction || 0)}</p>
          <p className="text-xs text-gray-500 mt-1">per action</p>
        </div>

        <svg
          className={`w-5 h-5 transition-transform ml-4 ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      {expanded && (
        <>
          {/* Time Range Selector */}
          <div className="px-4 py-3 bg-gray-800/30 border-t border-gray-700 flex gap-2">
            {[7, 30, 90].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range as 7 | 30 | 90)}
                className={`text-xs px-3 py-1 rounded transition ${
                  timeRange === range
                    ? 'bg-primary text-dark font-bold'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {range}d
              </button>
            ))}
          </div>

          {/* Cost Breakdown by Action */}
          <div className="px-4 py-4 border-t border-gray-700 space-y-2 max-h-48 overflow-y-auto">
            {actionGroups.map(({ action, cost }) => (
              <div key={action} className="flex items-center justify-between text-sm">
                <span className="text-gray-400 capitalize">{action}</span>
                <span className="text-amber-400 font-bold">{formatCost(cost)}</span>
              </div>
            ))}
          </div>

          {/* Recent Actions */}
          <div className="px-4 py-4 border-t border-gray-700">
            <p className="text-xs text-gray-400 font-medium mb-3">Recent Actions</p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {history
                .slice()
                .reverse()
                .slice(0, 10)
                .map((usage) => (
                  <div
                    key={usage.id}
                    className="flex items-center justify-between text-xs bg-gray-800/50 rounded p-2"
                  >
                    <div>
                      <p className="text-gray-300 capitalize">{usage.action}</p>
                      <p className="text-gray-500">
                        {usage.inputTokens.toLocaleString()} in + {usage.outputTokens.toLocaleString()} out
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-amber-400 font-bold">{formatCost(usage.cost)}</p>
                      <p className="text-gray-500">
                        {new Date(usage.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
