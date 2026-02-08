import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's org_id
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Fetch all users in the same organization
    const { data: members, error: membersError } = await supabase
      .from('users')
      .select('id, email, full_name, role, created_at')
      .eq('org_id', userProfile.org_id)
      .order('created_at', { ascending: true })

    if (membersError) {
      console.error('Error fetching team members:', membersError)
      return NextResponse.json(
        { error: 'Failed to fetch team members' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      members: members || [],
    })
  } catch (error) {
    console.error('Team members fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update a team member's role
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { memberId, role } = await request.json()

    if (!memberId || !role) {
      return NextResponse.json(
        { error: 'Member ID and role are required' },
        { status: 400 }
      )
    }

    if (!['admin', 'member'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be admin or member' },
        { status: 400 }
      )
    }

    // Get current user's profile to check permissions
    const { data: currentUserProfile, error: profileError } = await supabase
      .from('users')
      .select('org_id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !currentUserProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Only admins can change roles
    if (currentUserProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can change team member roles' },
        { status: 403 }
      )
    }

    // Get the target member to verify they're in the same org
    const { data: targetMember, error: targetError } = await supabase
      .from('users')
      .select('id, org_id, role')
      .eq('id', memberId)
      .single()

    if (targetError || !targetMember) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      )
    }

    // Verify same organization
    if (targetMember.org_id !== currentUserProfile.org_id) {
      return NextResponse.json(
        { error: 'Team member not found in your organization' },
        { status: 404 }
      )
    }

    // Prevent user from demoting themselves if they're the only admin
    if (memberId === user.id && role === 'member') {
      const { count: adminCount } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', currentUserProfile.org_id)
        .eq('role', 'admin')

      if (adminCount === 1) {
        return NextResponse.json(
          { error: 'Cannot demote yourself. You are the only admin. Promote another user first.' },
          { status: 400 }
        )
      }
    }

    // Update the role
    const { error: updateError } = await supabase
      .from('users')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', memberId)

    if (updateError) {
      console.error('Error updating member role:', updateError)
      return NextResponse.json(
        { error: 'Failed to update member role' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Role updated to ${role}`,
    })
  } catch (error) {
    console.error('Update member error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Remove a team member
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('memberId')

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      )
    }

    // Get current user's profile to check permissions
    const { data: currentUserProfile, error: profileError } = await supabase
      .from('users')
      .select('org_id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !currentUserProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Only admins can remove members
    if (currentUserProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can remove team members' },
        { status: 403 }
      )
    }

    // Can't remove yourself
    if (memberId === user.id) {
      return NextResponse.json(
        { error: 'You cannot remove yourself from the organization' },
        { status: 400 }
      )
    }

    // Get the target member to verify they're in the same org
    const { data: targetMember, error: targetError } = await supabase
      .from('users')
      .select('id, org_id, email, full_name')
      .eq('id', memberId)
      .single()

    if (targetError || !targetMember) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      )
    }

    // Verify same organization
    if (targetMember.org_id !== currentUserProfile.org_id) {
      return NextResponse.json(
        { error: 'Team member not found in your organization' },
        { status: 404 }
      )
    }

    // Delete the user profile (this will cascade to other related records if set up)
    // Note: This doesn't delete the auth.users entry - that would need admin API
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', memberId)

    if (deleteError) {
      console.error('Error deleting member:', deleteError)
      return NextResponse.json(
        { error: 'Failed to remove team member' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `${targetMember.full_name || targetMember.email} has been removed from the organization`,
    })
  } catch (error) {
    console.error('Delete member error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
