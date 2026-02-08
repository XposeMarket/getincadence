'use client'

import { Lock, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { LucideIcon } from 'lucide-react'

interface LockedCardProps {
  icon: LucideIcon
  title: string
  description: string
  requiredTier: 'Starter' | 'Team' | 'Growth'
  // Optional: show summary data even when locked
  summaryData?: {
    label: string
    value: string | number
  }[]
}

const tierPrices: Record<string, number> = {
  Starter: 29,
  Team: 59,
  Growth: 99,
}

const tierColors: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  Starter: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-700',
  },
  Team: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-700',
  },
  Growth: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    badge: 'bg-purple-100 text-purple-700',
  },
}

export default function LockedCard({
  icon: Icon,
  title,
  description,
  requiredTier,
  summaryData,
}: LockedCardProps) {
  const colors = tierColors[requiredTier]
  const price = tierPrices[requiredTier]

  return (
    <div className={`card p-4 sm:p-6 ${colors.bg} ${colors.border} border-2 border-dashed relative overflow-hidden`}>
      {/* Lock badge */}
      <div className="absolute top-3 right-3">
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colors.badge}`}>
          <Lock size={12} />
          {requiredTier}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-lg ${colors.badge} flex items-center justify-center`}>
          <Icon size={16} className={colors.text} />
        </div>
        <h2 className="font-semibold text-gray-900">{title}</h2>
      </div>

      {/* Summary data (if provided) */}
      {summaryData && summaryData.length > 0 && (
        <div className="mb-4 p-3 bg-white/60 rounded-lg border border-white">
          <div className="flex items-center gap-4">
            {summaryData.map((item, i) => (
              <div key={i} className="text-center">
                <p className="text-lg font-bold text-gray-900">{item.value}</p>
                <p className="text-xs text-gray-500">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      <p className="text-sm text-gray-600 mb-4">{description}</p>

      {/* CTA */}
      <Link
        href="/settings?tab=billing"
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          requiredTier === 'Starter'
            ? 'bg-amber-500 hover:bg-amber-600 text-white'
            : requiredTier === 'Team'
            ? 'bg-blue-500 hover:bg-blue-600 text-white'
            : 'bg-purple-500 hover:bg-purple-600 text-white'
        }`}
      >
        Upgrade to {requiredTier}
        <span className="text-white/80">${price}/mo</span>
        <ArrowUpRight size={14} />
      </Link>
    </div>
  )
}
