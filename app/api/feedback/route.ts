import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get current user (optional - allow anonymous feedback too)
    const { data: { user } } = await supabase.auth.getUser()
    
    const body = await request.json()
    const { category, priority, subject, message, pageUrl } = body

    // Validate required fields
    if (!category || !subject || !message) {
      return NextResponse.json(
        { error: 'Category, subject, and message are required' },
        { status: 400 }
      )
    }

    // Validate category
    const validCategories = ['bug', 'feature', 'ui', 'general', 'other']
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      )
    }

    // Get user profile if logged in
    let orgId = null
    let userName = null
    let userEmail = user?.email || null

    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('org_id, full_name')
        .eq('id', user.id)
        .single()
      
      if (profile) {
        orgId = profile.org_id
        userName = profile.full_name
      }
    }

    // Insert feedback
    const { data: feedback, error: insertError } = await supabase
      .from('feedback')
      .insert({
        org_id: orgId,
        user_id: user?.id || null,
        user_email: userEmail,
        user_name: userName,
        category,
        priority: priority || 'medium',
        subject,
        message,
        page_url: pageUrl || null,
        user_agent: request.headers.get('user-agent') || null,
        status: 'new',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Feedback insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to submit feedback' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you for your feedback!',
      feedbackId: feedback.id,
    })
  } catch (error) {
    console.error('Feedback error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Fetch user's own feedback history
export async function GET() {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: feedbackList, error: fetchError } = await supabase
      .from('feedback')
      .select('id, category, priority, subject, message, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Feedback fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch feedback' },
        { status: 500 }
      )
    }

    return NextResponse.json({ feedback: feedbackList || [] })
  } catch (error) {
    console.error('Feedback fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
