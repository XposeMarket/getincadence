import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST /api/files/link — Link a file to a deal/company/contact
export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const orgId = profile.org_id
    const body = await request.json()
    const { file_id, entity_type, entity_id } = body

    // Validation
    if (!file_id || !entity_type || !entity_id) {
      return NextResponse.json({ error: 'Missing required fields: file_id, entity_type, entity_id' }, { status: 400 })
    }

    const validEntityTypes = ['deal', 'company', 'contact']
    if (!validEntityTypes.includes(entity_type)) {
      return NextResponse.json({ error: 'Invalid entity_type. Must be: deal, company, or contact' }, { status: 400 })
    }

    // Verify file exists and belongs to this org
    const { data: file } = await supabase
      .from('files')
      .select('id')
      .eq('id', file_id)
      .eq('org_id', orgId)
      .eq('is_deleted', false)
      .single()

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Verify entity exists and belongs to this org
    const tableName = entity_type === 'deal' ? 'deals'
      : entity_type === 'company' ? 'companies'
      : 'contacts'

    const { data: entity } = await supabase
      .from(tableName)
      .select('id')
      .eq('id', entity_id)
      .eq('org_id', orgId)
      .single()

    if (!entity) {
      return NextResponse.json({ error: `${entity_type} not found` }, { status: 404 })
    }

    // Create link (unique constraint prevents duplicates)
    const { data: link, error: insertError } = await supabase
      .from('file_links')
      .insert({
        org_id: orgId,
        file_id,
        entity_type,
        entity_id,
        created_by_user_id: user.id,
      })
      .select('id, file_id, entity_type, entity_id, created_at')
      .single()

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'File is already linked to this entity' }, { status: 409 })
      }
      console.error('Failed to create file link:', insertError)
      return NextResponse.json({ error: 'Failed to create file link' }, { status: 500 })
    }

    return NextResponse.json(link, { status: 201 })
  } catch (error) {
    console.error('File link error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
