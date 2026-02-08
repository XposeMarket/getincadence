'use client'

import { ReactNode } from 'react'
import { PlanType } from '@/lib/subscription/plans'
import { 
  canAccessSection, 
  getRequiredTierDisplay, 
  SectionKey,
  SECTION_META 
} from '@/lib/reports/tier-permissions'
import LockedCard from './LockedCard'
import { 
  BarChart3, TrendingUp, DollarSign, Users, Target, Clock, 
  CheckSquare, AlertTriangle, PieChart, Zap, TrendingDown
} from 'lucide-react'
import { LucideIcon } from 'lucide-react'

// Map section keys to their icons
const SECTION_ICONS: Record<SectionKey, LucideIcon> = {
  stats: BarChart3,
  pipeline: PieChart,
  dealsByOwner: Users,
  winMetrics: Target,
  dealsLost: TrendingDown,
  stageTimings: Clock,
  funnel: TrendingUp,
  velocity: Zap,
  forecast: DollarSign,
  topDeals: DollarSign,
  idleDeals3to7: AlertTriangle,
  idleDeals7plus: AlertTriangle,
  overdueTasks: CheckSquare,
  incompleteTasks: CheckSquare,
}

interface ReportSectionProps {
  sectionKey: SectionKey
  userTier: PlanType
  children: ReactNode
  // Optional summary data to show in locked state
  summaryData?: { label: string; value: string | number }[]
  // Custom className for the wrapper
  className?: string
  // The data-report-section attribute is passed through
  'data-report-section'?: string
}

export default function ReportSection({
  sectionKey,
  userTier,
  children,
  summaryData,
  className = '',
  ...props
}: ReportSectionProps) {
  const canAccess = canAccessSection(sectionKey, userTier)
  
  if (canAccess) {
    // User has access - render children as-is
    return (
      <div className={className} data-report-section={sectionKey} {...props}>
        {children}
      </div>
    )
  }
  
  // User doesn't have access - show locked card
  const meta = SECTION_META[sectionKey]
  const requiredTier = getRequiredTierDisplay(sectionKey)
  const Icon = SECTION_ICONS[sectionKey]
  
  return (
    <div className={className} data-report-section={sectionKey} {...props}>
      <LockedCard
        icon={Icon}
        title={meta.title}
        description={meta.description}
        requiredTier={requiredTier}
        summaryData={summaryData}
      />
    </div>
  )
}
