'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { FREE_TIER_LIMITS, LIMIT_MESSAGES } from '@/lib/subscription/free-tier-limits'

interface LimitStatus {
  atLimit: boolean
  current: number
  max: number | null
  remaining: number | null
  isFreeTier: boolean
}

interface UsageLimits {
  plan: string
  isFreeTier: boolean
  contacts: LimitStatus
  activeDeals: LimitStatus
  companies: LimitStatus
  monthlySubmissions: LimitStatus
  historyDays: number | null
  loading: boolean
  refresh: () => Promise<void>
}

const defaultLimitStatus: LimitStatus = {
  atLimit: false,
  current: 0,
  max: null,
  remaining: null,
  isFreeTier: false,
}

const defaultLimits: UsageLimits = {
  plan: 'solo',
  isFreeTier: true,
  contacts: defaultLimitStatus,
  activeDeals: defaultLimitStatus,
  companies: defaultLimitStatus,
  monthlySubmissions: defaultLimitStatus,
  historyDays: null,
  loading: true,
  refresh: async () => {},
}

const UsageLimitsContext = createContext<UsageLimits>(defaultLimits)

export function UsageLimitsProvider({ children }: { children: ReactNode }) {
  const [limits, setLimits] = useState<UsageLimits>(defaultLimits)

  const fetchLimits = useCallback(async () => {
    try {
      const res = await fetch('/api/usage-limits')
      if (!res.ok) return

      const data = await res.json()
      setLimits({
        plan: data.plan,
        isFreeTier: data.isFreeTier,
        contacts: data.contacts || defaultLimitStatus,
        activeDeals: data.activeDeals || defaultLimitStatus,
        companies: data.companies || defaultLimitStatus,
        monthlySubmissions: data.monthlySubmissions || defaultLimitStatus,
        historyDays: data.historyDays,
        loading: false,
        refresh: fetchLimits,
      })
    } catch {
      setLimits(prev => ({ ...prev, loading: false, refresh: fetchLimits }))
    }
  }, [])

  useEffect(() => {
    fetchLimits()
  }, [fetchLimits])

  return (
    <UsageLimitsContext.Provider value={{ ...limits, refresh: fetchLimits }}>
      {children}
    </UsageLimitsContext.Provider>
  )
}

/**
 * Hook to access usage limits throughout the dashboard.
 * Returns current counts, limit status, and helpers.
 */
export function useUsageLimits() {
  return useContext(UsageLimitsContext)
}

/**
 * Get the limit message for a given resource type
 */
export function getLimitMessage(resource: keyof typeof FREE_TIER_LIMITS) {
  return LIMIT_MESSAGES[resource]
}
