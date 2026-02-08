/**
 * Cost API Client - Backend integration
 */

import axios, { AxiosError } from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL

/**
 * Record token usage
 */
export async function recordTokenUsage(
  action: string,
  inputTokens: number,
  outputTokens: number,
  model: string,
  battleId?: string,
  agentId?: string
) {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.post(
      `${API_URL}/api/costs/record`,
      {
        action,
        inputTokens,
        outputTokens,
        model,
        battleId,
        agentId,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )

    return response.data
  } catch (error: any) {
    console.error('Failed to record token usage:', error.response?.data || error.message)
    throw error
  }
}

/**
 * Get cost summary
 */
export async function getCostSummary(days: number = 1) {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get(`${API_URL}/api/costs/summary?days=${days}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    return response.data
  } catch (error: any) {
    console.error('Failed to get cost summary:', error.response?.data || error.message)
    throw error
  }
}

/**
 * Get cost history
 */
export async function getCostHistoryApi(
  days: number = 7,
  action?: string,
  limit: number = 100,
  offset: number = 0
) {
  try {
    const token = localStorage.getItem('token')
    let url = `${API_URL}/api/costs/history?days=${days}&limit=${limit}&offset=${offset}`

    if (action) {
      url += `&action=${action}`
    }

    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    })

    return response.data
  } catch (error: any) {
    console.error('Failed to get cost history:', error.response?.data || error.message)
    throw error
  }
}

/**
 * Get cost statistics
 */
export async function getCostStatsApi(days: number = 30) {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get(`${API_URL}/api/costs/stats?days=${days}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    return response.data
  } catch (error: any) {
    console.error('Failed to get cost stats:', error.response?.data || error.message)
    throw error
  }
}

/**
 * Estimate cost (doesn't record)
 */
export async function estimateCost(
  action: string,
  inputTokens: number,
  outputTokens: number,
  model: string
) {
  try {
    const response = await axios.post(`${API_URL}/api/costs/estimate`, {
      action,
      inputTokens,
      outputTokens,
      model,
    })

    return response.data
  } catch (error: any) {
    console.error('Failed to estimate cost:', error.response?.data || error.message)
    throw error
  }
}
