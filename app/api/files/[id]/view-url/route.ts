import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/files/[id]/view-url — Get signed download/preview URL
export async function GET(
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

    // Get file record (org-scoped)
    const { data: file } = await supabase
      .from('files')
      .select('id, storage_key, bucket_name, mime_type, original_filename')
      .eq('id', params.id)
      .eq('org_id', profile.org_id)
      .eq('is_deleted', false)
      .single()

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Generate signed download URL (300 seconds = 5 minutes)
    const adminSupabase = createAdminClient()
    const { data: urlData, error: urlError } = await adminSupabase
      .storage
      .from(file.bucket_name)
      .createSignedUrl(file.storage_key, 300)

    if (urlError || !urlData) {
      console.error('Failed to create signed URL:', urlError)
      return NextResponse.json({ error: 'Failed to generate view URL' }, { status: 500 })
    }

    return NextResponse.json({
      view_url: urlData.signedUrl,
      mime_type: file.mime_type,
      filename: file.original_filename,
      expires_in_seconds: 300,
    })
  } catch (error) {
    console.error('View URL error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
