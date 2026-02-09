import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { onDealIdle7Days } from '@/lib/automation-engine'

/**
 * POST /api/automations/check-idle
 * GET  /api/automations/check-idle (Vercel Cron)
 * 
 * Checks all orgs for deals with no activity in 7 days
 * and runs matching `deal_idle_7_days` automations.
 * 
 * Can be called by:
 * - Vercel Cron (daily at 9am UTC) via GET
 * - Dashboard page load (fire-and-forget) via POST
 * - Manual call
 * 
 * Protected by a simple secret or authenticated user.
 */
async function handler(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Auth check: either valid user session or Vercel cron secret
    const authHeader = request.headers.get('authorization')
    const isAuthorizedCron = authHeader === `Bearer ${process.env.CRON_SECRET}`
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user && !isAuthorizedCron) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // If user is logged in, only check their org
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('org_id')
        .eq('id', user.id)
        .single()

      if (!profile?.org_id) {
        return NextResponse.json({ error: 'No org found' }, { status: 400 })
      }

      const result = await onDealIdle7Days(supabase, profile.org_id)
      return NextResponse.json({ 
        success: true, 
        orgs: 1, 
        ...result 
      })
    }

    // Cron: check ALL orgs that have active idle automations
    const { data: orgIds } = await supabase
      .from('automations')
      .select('org_id')
      .eq('trigger_type', 'deal_idle_7_days')
      .eq('is_active', true)

    const uniqueOrgs = Array.from(new Set((orgIds || []).map(r => r.org_id)))
    
    let totalDeals = 0
    let totalTasks = 0

    for (const orgId of uniqueOrgs) {
      const result = await onDealIdle7Days(supabase, orgId)
      totalDeals += result.dealsChecked
      totalTasks += result.tasksCreated
    }

    return NextResponse.json({ 
      success: true, 
      orgs: uniqueOrgs.length,
      dealsChecked: totalDeals, 
      tasksCreated: totalTasks 
    })
  } catch (err: any) {
    console.error('check-idle error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export { handler as GET, handler as POST }