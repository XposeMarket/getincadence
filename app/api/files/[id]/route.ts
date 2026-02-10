import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// PATCH /api/files/[id] — Update file title or doc_type
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Verify file exists and belongs to org
    const { data: file } = await supabase
      .from('files')
      .select('id')
      .eq('id', params.id)
      .eq('org_id', profile.org_id)
      .eq('is_deleted', false)
      .single()

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const body = await request.json()
    const updateData: Record<string, string> = {}

    if (body.title !== undefined) {
      if (!body.title || typeof body.title !== 'string') {
        return NextResponse.json({ error: 'Title must be a non-empty string' }, { status: 400 })
      }
      updateData.title = body.title.trim()
    }

    if (body.doc_type !== undefined) {
      const validDocTypes = ['contract', 'receipt', 'proposal', 'invoice', 'other']
      if (!validDocTypes.includes(body.doc_type)) {
        return NextResponse.json({ error: `Invalid doc_type. Must be one of: ${validDocTypes.join(', ')}` }, { status: 400 })
      }
      updateData.doc_type = body.doc_type
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data: updated, error: updateError } = await supabase
      .from('files')
      .update(updateData)
      .eq('id', params.id)
      .select('id, title, doc_type, updated_at')
      .single()

    if (updateError) {
      console.error('Failed to update file:', updateError)
      return NextResponse.json({ error: 'Failed to update file' }, { status: 500 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('File update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/files/[id] — Soft delete a file
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('org_id, role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Get file (check org + not already deleted)
    const { data: file } = await supabase
      .from('files')
      .select('id, uploaded_by_user_id')
      .eq('id', params.id)
      .eq('org_id', profile.org_id)
      .eq('is_deleted', false)
      .single()

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Permission check: only uploader or admin can delete
    const isUploader = file.uploaded_by_user_id === user.id
    const isAdmin = profile.role === 'admin'

    if (!isUploader && !isAdmin) {
      return NextResponse.json(
        { error: 'Only the uploader or an org admin can delete this file' },
        { status: 403 }
      )
    }

    // Soft delete
    const { data: deleted, error: deleteError } = await supabase
      .from('files')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by_user_id: user.id,
      })
      .eq('id', params.id)
      .select('id, is_deleted, deleted_at')
      .single()

    if (deleteError) {
      console.error('Failed to delete file:', deleteError)
      return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
    }

    return NextResponse.json(deleted)
  } catch (error) {
    console.error('File delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
