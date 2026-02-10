import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const BUCKET_NAME = 'cadence-files'
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

// POST /api/files/[id]/new-version — Upload a new version of an existing file
export async function POST(
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

    const orgId = profile.org_id

    // Get the original file (the one being versioned)
    const { data: originalFile } = await supabase
      .from('files')
      .select('id, title, doc_type, parent_file_id, version_number, org_id')
      .eq('id', params.id)
      .eq('org_id', orgId)
      .eq('is_deleted', false)
      .single()

    if (!originalFile) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const body = await request.json()
    const { original_filename, mime_type, size_bytes } = body

    if (!original_filename || !mime_type || !size_bytes) {
      return NextResponse.json({ error: 'Missing required fields: original_filename, mime_type, size_bytes' }, { status: 400 })
    }

    if (size_bytes > MAX_FILE_SIZE) {
      return NextResponse.json({ error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` }, { status: 400 })
    }

    // Determine root file ID (always point to the original v1)
    const rootFileId = originalFile.parent_file_id || originalFile.id

    // Get the highest version number in this chain
    const { data: versions } = await supabase
      .from('files')
      .select('version_number')
      .eq('org_id', orgId)
      .eq('is_deleted', false)
      .or(`id.eq.${rootFileId},parent_file_id.eq.${rootFileId}`)
      .order('version_number', { ascending: false })
      .limit(1)

    const nextVersion = (versions?.[0]?.version_number || 1) + 1

    // Create the new version file record
    const { data: newFile, error: insertError } = await supabase
      .from('files')
      .insert({
        org_id: orgId,
        uploaded_by_user_id: user.id,
        title: originalFile.title, // inherit title from original
        original_filename,
        doc_type: originalFile.doc_type, // inherit doc_type
        mime_type,
        size_bytes,
        storage_key: '', // placeholder
        bucket_name: BUCKET_NAME,
        version_number: nextVersion,
        parent_file_id: rootFileId,
      })
      .select('id')
      .single()

    if (insertError || !newFile) {
      console.error('Failed to create new version record:', insertError)
      return NextResponse.json({ error: 'Failed to create new version' }, { status: 500 })
    }

    // Build storage key
    const storageKey = `${orgId}/${newFile.id}/${original_filename}`
    await supabase.from('files').update({ storage_key: storageKey }).eq('id', newFile.id)

    // Generate signed upload URL
    const adminSupabase = createAdminClient()
    const { data: uploadData, error: uploadError } = await adminSupabase
      .storage
      .from(BUCKET_NAME)
      .createSignedUploadUrl(storageKey)

    if (uploadError || !uploadData) {
      await supabase.from('files').delete().eq('id', newFile.id)
      console.error('Failed to create signed upload URL:', uploadError)
      return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 })
    }

    // Copy file_links from the original/root to this new version
    const { data: existingLinks } = await supabase
      .from('file_links')
      .select('entity_type, entity_id')
      .eq('file_id', rootFileId)
      .eq('org_id', orgId)

    if (existingLinks && existingLinks.length > 0) {
      const newLinks = existingLinks.map(link => ({
        org_id: orgId,
        file_id: newFile.id,
        entity_type: link.entity_type,
        entity_id: link.entity_id,
        created_by_user_id: user.id,
      }))
      await supabase.from('file_links').insert(newLinks)
    }

    return NextResponse.json({
      new_file_id: newFile.id,
      version_number: nextVersion,
      parent_file_id: rootFileId,
      upload_url: uploadData.signedUrl,
      token: uploadData.token,
      storage_key: storageKey,
    })
  } catch (error) {
    console.error('New version error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
