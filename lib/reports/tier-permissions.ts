import { PlanType } from '@/lib/subscription/plans'

/**
 * Report Sections Tier Mapping
 * 
 * This defines which report sections are available for each subscription tier.
 * The approach follows a "show summary + CTA" pattern for locked sections.
 * 
 * TIER PHILOSOPHY:
 * - Solo (Free): Core operational data - what you need to run a one-person sales operation
 * - Starter ($29): Full charts and breakdowns - everything Solo has plus visual analytics
 * - Team ($59): Advanced analytics with trends and historical comparisons
 * - Growth ($99): Everything Team has plus AI-powered insights (future)
 */

export type SectionKey = 
  | 'stats' | 'pipeline' | 'dealsByOwner' | 'idleDeals3to7' | 'idleDeals7plus'
  | 'overdueTasks' | 'incompleteTasks' | 'topDeals' | 'winMetrics'
  | 'dealsLost' | 'stageTimings' | 'funnel' | 'velocity' | 'forecast'

// Sections available at each tier (cumulative - each tier includes all sections from previous tiers)
const TIER_SECTIONS: Record<PlanType, SectionKey[]> = {
  solo: [
    'stats',           // Core KPIs - everyone needs this
    'topDeals',        // Your biggest opportunities
    'idleDeals3to7',   // Basic pipeline hygiene
    'idleDeals7plus',  // Critical stale deal alerts
    'overdueTasks',    // Operational must-have
    'incompleteTasks', // Task management essential
  ],
  starter: [
    // All Solo sections +
    'stats',
    'topDeals',
    'idleDeals3to7',
    'idleDeals7plus',
    'overdueTasks',
    'incompleteTasks',
    // New in Starter:
    'pipeline',        // Visual pipeline overview
    'dealsByOwner',    // Team performance (useful even solo for tracking)
    'winMetrics',      // Win rate and averages
    'dealsLost',       // Loss reason analysis
    'stageTimings',    // Bottleneck identification
  ],
  team: [
    // All Starter sections +
    'stats',
    'topDeals',
    'idleDeals3to7',
    'idleDeals7plus',
    'overdueTasks',
    'incompleteTasks',
    'pipeline',
    'dealsByOwner',
    'winMetrics',
    'dealsLost',
    'stageTimings',
    // New in Team:
    'funnel',          // Conversion funnel with drop-off
    'velocity',        // Sales velocity calculation
    'forecast',        // Weighted pipeline forecast
  ],
  growth: [
    // All Team sections (everything unlocked)
    'stats',
    'topDeals',
    'idleDeals3to7',
    'idleDeals7plus',
    'overdueTasks',
    'incompleteTasks',
    'pipeline',
    'dealsByOwner',
    'winMetrics',
    'dealsLost',
    'stageTimings',
    'funnel',
    'velocity',
    'forecast',
    // Future AI sections will go here
  ],
}

// Which tier is required to unlock each section
export const SECTION_REQUIRED_TIER: Record<SectionKey, PlanType> = {
  // Solo (Free)
  stats: 'solo',
  topDeals: 'solo',
  idleDeals3to7: 'solo',
  idleDeals7plus: 'solo',
  overdueTasks: 'solo',
  incompleteTasks: 'solo',
  // Starter
  pipeline: 'starter',
  dealsByOwner: 'starter',
  winMetrics: 'starter',
  dealsLost: 'starter',
  stageTimings: 'starter',
  // Team
  funnel: 'team',
  velocity: 'team',
  forecast: 'team',
}

// Friendly tier names for UI display
export const TIER_DISPLAY_NAMES: Record<PlanType, 'Solo' | 'Starter' | 'Team' | 'Growth'> = {
  solo: 'Solo',
  starter: 'Starter',
  team: 'Team',
  growth: 'Growth',
}

// Check if a section is accessible for a given tier
export function canAccessSection(section: SectionKey, userTier: PlanType): boolean {
  return TIER_SECTIONS[userTier].includes(section)
}

// Get the tier required to unlock a section
export function getRequiredTier(section: SectionKey): PlanType {
  return SECTION_REQUIRED_TIER[section]
}

// Get display name for required tier (for upgrade CTAs)
export function getRequiredTierDisplay(section: SectionKey): 'Starter' | 'Team' | 'Growth' {
  const tier = SECTION_REQUIRED_TIER[section]
  // Never show "Solo" since that's the free tier
  if (tier === 'solo') return 'Starter'
  return TIER_DISPLAY_NAMES[tier] as 'Starter' | 'Team' | 'Growth'
}

// Get all sections available for a tier
export function getSectionsForTier(tier: PlanType): SectionKey[] {
  return TIER_SECTIONS[tier]
}

// Get sections that are locked for a tier
export function getLockedSections(tier: PlanType): SectionKey[] {
  const allSections = Object.keys(SECTION_REQUIRED_TIER) as SectionKey[]
  const availableSections = TIER_SECTIONS[tier]
  return allSections.filter(s => !availableSections.includes(s))
}

// Section metadata for summary cards (shown when locked)
export const SECTION_META: Record<SectionKey, { 
  title: string
  description: string 
  summaryLabel: string // Used for "X deals" / "X tasks" etc.
}> = {
  stats: { 
    title: 'KPI Summary', 
    description: 'Revenue, contacts, deals won, tasks completed',
    summaryLabel: 'metrics'
  },
  pipeline: { 
    title: 'Pipeline Overview', 
    description: 'See deal distribution across stages with visual charts',
    summaryLabel: 'stages'
  },
  dealsByOwner: { 
    title: 'Deals by Owner', 
    description: 'Analyze deal distribution and performance by team member',
    summaryLabel: 'owners'
  },
  winMetrics: { 
    title: 'Win Rate & Metrics', 
    description: 'Track win rate, average deal size, and sales cycle length',
    summaryLabel: 'metrics'
  },
  dealsLost: { 
    title: 'Deals Lost', 
    description: 'Understand why deals are lost with reason breakdown',
    summaryLabel: 'lost deals'
  },
  stageTimings: { 
    title: 'Avg Time in Stage', 
    description: 'Identify bottlenecks by seeing how long deals stay in each stage',
    summaryLabel: 'stages tracked'
  },
  funnel: { 
    title: 'Conversion Funnel', 
    description: 'Track stage-to-stage conversion rates and drop-off points',
    summaryLabel: 'stages'
  },
  velocity: { 
    title: 'Sales Velocity', 
    description: 'Measure revenue throughput per day based on your pipeline',
    summaryLabel: 'velocity score'
  },
  forecast: { 
    title: 'Forecast Pipeline', 
    description: 'See weighted revenue projections based on stage probability',
    summaryLabel: 'deals in forecast'
  },
  topDeals: { 
    title: 'Top Open Deals', 
    description: 'Your highest value opportunities that need attention',
    summaryLabel: 'deals'
  },
  idleDeals3to7: { 
    title: 'Idle Deals (3-7 Days)', 
    description: 'Deals that haven\'t had activity in 3-7 days',
    summaryLabel: 'idle deals'
  },
  idleDeals7plus: { 
    title: 'Idle Deals (7+ Days)', 
    description: 'Stale deals that need immediate attention',
    summaryLabel: 'stale deals'
  },
  overdueTasks: { 
    title: 'Overdue Tasks', 
    description: 'Tasks that are past their due date',
    summaryLabel: 'overdue'
  },
  incompleteTasks: { 
    title: 'Incomplete Tasks', 
    description: 'All pending tasks that need to be completed',
    summaryLabel: 'pending'
  },
}
