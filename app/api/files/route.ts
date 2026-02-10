import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/files?entity_type=deal&entity_id=... — List files linked to an entity
export async function GET(request: Request) {
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
    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entity_type')
    const entityId = searchParams.get('entity_id')

    if (!entityType || !entityId) {
      return NextResponse.json({ error: 'Missing required params: entity_type, entity_id' }, { status: 400 })
    }

    // Get file IDs linked to this entity
    const { data: links, error: linksError } = await supabase
      .from('file_links')
      .select('file_id')
      .eq('org_id', orgId)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)

    if (linksError) {
      console.error('Failed to fetch file links:', linksError)
      return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 })
    }

    if (!links || links.length === 0) {
      return NextResponse.json({ files: [] })
    }

    const fileIds = links.map(l => l.file_id)

    // Get file details with uploader info
    const { data: files, error: filesError } = await supabase
      .from('files')
      .select('id, title, original_filename, doc_type, mime_type, size_bytes, version_number, parent_file_id, uploaded_by_user_id, created_at, updated_at')
      .in('id', fileIds)
      .eq('org_id', orgId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    if (filesError) {
      console.error('Failed to fetch files:', filesError)
      return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 })
    }

    // Get uploader names
    const uploaderIds = Array.from(new Set(files?.map(f => f.uploaded_by_user_id) || []))
    const { data: uploaders } = await supabase
      .from('users')
      .select('id, full_name')
      .in('id', uploaderIds)

    const uploaderMap = new Map(uploaders?.map(u => [u.id, u.full_name]) || [])

    // For each file, get its version chain (all versions sharing the same root)
    const enrichedFiles = await Promise.all((files || []).map(async (file) => {
      // Find root file ID (the original, version 1)
      const rootId = file.parent_file_id || file.id

      const { data: versions } = await supabase
        .from('files')
        .select('id, version_number, created_at, title, size_bytes')
        .eq('org_id', orgId)
        .eq('is_deleted', false)
        .or(`id.eq.${rootId},parent_file_id.eq.${rootId}`)
        .order('version_number', { ascending: true })

      return {
        ...file,
        uploaded_by: {
          id: file.uploaded_by_user_id,
          full_name: uploaderMap.get(file.uploaded_by_user_id) || 'Unknown',
        },
        versions: versions || [],
      }
    }))

    return NextResponse.json({ files: enrichedFiles })
  } catch (error) {
    console.error('Files list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
