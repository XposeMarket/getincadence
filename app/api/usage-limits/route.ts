import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { PlanType } from '@/lib/subscription/plans'
import { FREE_TIER_LIMITS, CLOSED_DEAL_STATUSES, isFreeTier, checkLimit } from '@/lib/subscription/free-tier-limits'

export async function GET() {
  try {
    const supabase = createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's org_id
    const { data: userProfile } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const orgId = userProfile.org_id

    // Get subscription plan
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('org_id', orgId)
      .single()

    const plan = (subscription?.plan || 'solo') as PlanType

    // If paid plan, return unlimited (no need to count)
    if (!isFreeTier(plan)) {
      return NextResponse.json({
        plan,
        isFreeTier: false,
        contacts: { atLimit: false, current: 0, max: null, remaining: null },
        activeDeals: { atLimit: false, current: 0, max: null, remaining: null },
        companies: { atLimit: false, current: 0, max: null, remaining: null },
        monthlySubmissions: { atLimit: false, current: 0, max: null, remaining: null },
        historyDays: null,
      })
    }

    // Count contacts
    const { count: contactCount } = await supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)

    // Count active deals (not in closed/won/lost stages)
    // First get pipeline stages that are closed
    const { data: closedStages } = await supabase
      .from('pipeline_stages')
      .select('id, is_won, is_lost')
      .or('is_won.eq.true,is_lost.eq.true')

    const closedStageIds = (closedStages || []).map(s => s.id)

    let activeDealCount = 0
    if (closedStageIds.length > 0) {
      // Count deals NOT in closed stages
      const { count: totalDeals } = await supabase
        .from('deals')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)

      const { count: closedDeals } = await supabase
        .from('deals')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .in('stage_id', closedStageIds)

      activeDealCount = (totalDeals || 0) - (closedDeals || 0)
    } else {
      // No closed stages defined — all deals are active
      const { count: totalDeals } = await supabase
        .from('deals')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)

      activeDealCount = totalDeals || 0
    }

    // Count companies
    const { count: companyCount } = await supabase
      .from('companies')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)

    // Count monthly form submissions (deals with source = 'intake_form' created this month)
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const { count: monthlySubCount } = await supabase
      .from('deals')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('source', 'intake_form')
      .gte('created_at', monthStart)

    return NextResponse.json({
      plan,
      isFreeTier: true,
      contacts: checkLimit(plan, 'contacts', contactCount || 0),
      activeDeals: checkLimit(plan, 'activeDeals', activeDealCount),
      companies: checkLimit(plan, 'companies', companyCount || 0),
      monthlySubmissions: checkLimit(plan, 'monthlySubmissions', monthlySubCount || 0),
      historyDays: FREE_TIER_LIMITS.historyDays,
    })
  } catch (error) {
    console.error('Usage limits fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
