'use client'

import Link from 'next/link'
import { CostBreakdown, formatCost } from '@/utils/costCalculator'

interface QuickActionsProps {
  costs: {
    battle: CostBreakdown
  }
}

export function QuickActions({ costs }: QuickActionsProps) {
  const actions = [
    {
      href: '/battle/queue',
      label: 'Join Battle',
      icon: '⚔️',
      description: 'Queue for matchmaking',
      cost: costs.battle,
      highlight: true,
    },
    {
      href: '/leaderboard',
      label: 'Leaderboard',
      icon: '🏆',
      description: 'View rankings',
    },
    {
      href: '/battles/history',
      label: 'Battle History',
      icon: '📋',
      description: 'View past battles',
    },
  ]

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider px-1">Quick Actions</h3>
      {actions.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className={`block p-4 rounded-lg border transition-all hover:shadow-lg ${
            action.highlight
              ? 'bg-gradient-to-r from-primary/20 to-primary/5 border-primary/50 hover:border-primary hover:shadow-primary/20'
              : 'bg-gray-900/50 border-primary/20 hover:border-primary/50'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="font-bold text-white flex items-center gap-2">
                <span>{action.icon}</span>
                {action.label}
              </p>
              <p className="text-xs text-gray-400 mt-1">{action.description}</p>
            </div>
            {action.cost && (
              <div className="text-right">
                <p className="text-xs text-gray-400">Est. Cost</p>
                <p className="text-sm font-bold text-amber-400">{formatCost(action.cost.totalCost)}</p>
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}
