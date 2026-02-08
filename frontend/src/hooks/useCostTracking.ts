'use client'

import { useState, useEffect, useCallback } from 'react'
import { getSessionSummary, TokenUsage } from '@/utils/costTracker'
import { getCostSummary, getCostHistoryApi } from '@/utils/costApi'

export interface CostSummary {
  totalCost: number
  totalInputTokens: number
  totalOutputTokens: number
  actionCount: number
  modelsUsed: string[]
  isLoading: boolean
  error?: string
}

export function useCostTracking(refreshInterval: number = 5000) {
  const [summary, setSummary] = useState<CostSummary>({
    totalCost: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    actionCount: 0,
    modelsUsed: [],
    isLoading: true,
  })

  const [history, setHistory] = useState<any[]>([])
  const [lastSync, setLastSync] = useState<number>(0)

  // Load from backend
  const syncWithBackend = useCallback(async () => {
    try {
      const [summaryData, historyData] = await Promise.all([
        getCostSummary(1), // Last 1 day
        getCostHistoryApi(1, undefined, 50, 0), // Last 50 actions today
      ])

      setSummary({
        totalCost: summaryData.totalCost,
        totalInputTokens: summaryData.totalInputTokens,
        totalOutputTokens: summaryData.totalOutputTokens,
        actionCount: summaryData.actionCount,
        modelsUsed: summaryData.modelsUsed,
        isLoading: false,
      })

      setHistory(historyData.items)
      setLastSync(Date.now())
    } catch (err: any) {
      console.error('Failed to sync with backend:', err)
      // Fall back to local session data
      const sessionSummary = getSessionSummary()
      setSummary({
        totalCost: sessionSummary.totalCost,
        totalInputTokens: sessionSummary.totalInputTokens,
        totalOutputTokens: sessionSummary.totalOutputTokens,
        actionCount: sessionSummary.actionCount,
        modelsUsed: [],
        isLoading: false,
        error: 'Using session data (offline)',
      })
    }
  }, [])

  // Initial load and periodic refresh
  useEffect(() => {
    syncWithBackend()
    const interval = setInterval(() => {
      syncWithBackend()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [syncWithBackend, refreshInterval])

  return {
    summary,
    history,
    lastSync,
    refresh: syncWithBackend,
  }
}

/**
 * Hook to load cost stats
 */
export function useCostStats(days: number = 30) {
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>()

  useEffect(() => {
    const loadStats = async () => {
      try {
        const { getCostStatsApi } = await import('@/utils/costApi')
        const data = await getCostStatsApi(days)
        setStats(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [days])

  return { stats, isLoading, error }
}
