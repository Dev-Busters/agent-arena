'use client'

import { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string | number
  icon?: string
  tooltip?: string
  onClick?: () => void
  highlight?: boolean
  subtext?: string
}

export function StatCard({
  label,
  value,
  icon,
  tooltip,
  onClick,
  highlight = false,
  subtext,
}: StatCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg transition-all duration-200 cursor-pointer group ${
        highlight
          ? 'bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/50'
          : 'bg-gray-900/50 border border-primary/20'
      } ${onClick ? 'hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20' : ''} p-4`}
      onClick={onClick}
      title={tooltip}
    >
      {/* Background gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <p className="text-gray-400 text-sm font-medium">{label}</p>
          {icon && <span className="text-lg">{icon}</span>}
        </div>

        <p className="text-2xl font-bold text-white">{value}</p>

        {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
      </div>
    </div>
  )
}
