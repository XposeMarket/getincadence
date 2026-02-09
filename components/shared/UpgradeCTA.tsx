'use client'

import { ArrowUpRight, Crown, Lock } from 'lucide-react'
import Link from 'next/link'
import { FREE_TIER_LIMITS, LIMIT_MESSAGES } from '@/lib/subscription/free-tier-limits'

type LimitResource = keyof typeof FREE_TIER_LIMITS

interface UpgradeCTAProps {
  resource: LimitResource
  current?: number
  max?: number | null
  /** 'banner' = full-width card with details, 'inline' = compact single-line */
  variant?: 'banner' | 'inline'
  className?: string
}

/**
 * Reusable Upgrade CTA shown when a free tier limit is reached.
 * Explains WHY the limit exists and WHAT upgrading unlocks.
 * Never hostile — always calm, fair, and informative.
 */
export default function UpgradeCTA({
  resource,
  current,
  max,
  variant = 'banner',
  className = '',
}: UpgradeCTAProps) {
  const message = LIMIT_MESSAGES[resource]

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 ${className}`}>
        <Lock size={14} className="flex-shrink-0 text-amber-500" />
        <span>{message.title}</span>
        <Link
          href="/settings?tab=billing"
          className="ml-auto text-primary-600 hover:text-primary-700 font-medium whitespace-nowrap flex items-center gap-1"
        >
          Upgrade
          <ArrowUpRight size={14} />
        </Link>
      </div>
    )
  }

  return (
    <div className={`bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
          <Crown size={20} className="text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900">{message.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{message.description}</p>
          
          {current != null && max != null && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>{current} of {max} used</span>
                <span>Free plan</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-amber-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (current / max) * 100)}%` }}
                />
              </div>
            </div>
          )}

          <Link
            href="/settings?tab=billing"
            className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            {message.upgradeText}
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}

/**
 * A smaller variant that replaces/wraps a create button when at limit.
 */
export function UpgradeButton({
  resource,
  className = '',
}: {
  resource: LimitResource
  className?: string
}) {
  const message = LIMIT_MESSAGES[resource]

  return (
    <Link
      href="/settings?tab=billing"
      className={`btn bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 w-full sm:w-auto ${className}`}
    >
      <Crown size={16} className="mr-2" />
      {message.upgradeText}
    </Link>
  )
}
