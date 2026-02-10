import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/files/related?company_id=...&contact_id=...
// Returns all files related to a company or contact (including through deals)
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
    const companyId = searchParams.get('company_id')
    const contactId = searchParams.get('contact_id')

    if (!companyId && !contactId) {
      return NextResponse.json({ error: 'Provide company_id or contact_id' }, { status: 400 })
    }

    let allFileIds: string[] = []
    let fileSourceMap: Map<string, { entity_type: string; entity_id: string; entity_name?: string }[]> = new Map()

    if (companyId) {
      // 1. Files linked directly to company
      const { data: companyLinks } = await supabase
        .from('file_links')
        .select('file_id')
        .eq('org_id', orgId)
        .eq('entity_type', 'company')
        .eq('entity_id', companyId)

      for (const link of companyLinks || []) {
        allFileIds.push(link.file_id)
        const existing = fileSourceMap.get(link.file_id) || []
        existing.push({ entity_type: 'company', entity_id: companyId })
        fileSourceMap.set(link.file_id, existing)
      }

      // 2. Files linked to deals under this company
      const { data: companyDeals } = await supabase
        .from('deals')
        .select('id, name')
        .eq('company_id', companyId)
        .eq('org_id', orgId)

      if (companyDeals && companyDeals.length > 0) {
        const dealIds = companyDeals.map(d => d.id)
        const dealNameMap = new Map(companyDeals.map(d => [d.id, d.name]))

        const { data: dealLinks } = await supabase
          .from('file_links')
          .select('file_id, entity_id')
          .eq('org_id', orgId)
          .eq('entity_type', 'deal')
          .in('entity_id', dealIds)

        for (const link of dealLinks || []) {
          allFileIds.push(link.file_id)
          const existing = fileSourceMap.get(link.file_id) || []
          existing.push({
            entity_type: 'deal',
            entity_id: link.entity_id,
            entity_name: dealNameMap.get(link.entity_id),
          })
          fileSourceMap.set(link.file_id, existing)
        }
      }
    }

    if (contactId) {
      // 1. Files linked directly to contact
      const { data: contactLinks } = await supabase
        .from('file_links')
        .select('file_id')
        .eq('org_id', orgId)
        .eq('entity_type', 'contact')
        .eq('entity_id', contactId)

      for (const link of contactLinks || []) {
        allFileIds.push(link.file_id)
        const existing = fileSourceMap.get(link.file_id) || []
        existing.push({ entity_type: 'contact', entity_id: contactId })
        fileSourceMap.set(link.file_id, existing)
      }

      // 2. Files linked to deals under contact's company
      const { data: contact } = await supabase
        .from('contacts')
        .select('company_id')
        .eq('id', contactId)
        .eq('org_id', orgId)
        .single()

      if (contact?.company_id) {
        const { data: contactDeals } = await supabase
          .from('deals')
          .select('id, name')
          .eq('company_id', contact.company_id)
          .eq('org_id', orgId)

        if (contactDeals && contactDeals.length > 0) {
          const dealIds = contactDeals.map(d => d.id)
          const dealNameMap = new Map(contactDeals.map(d => [d.id, d.name]))

          const { data: dealLinks } = await supabase
            .from('file_links')
            .select('file_id, entity_id')
            .eq('org_id', orgId)
            .eq('entity_type', 'deal')
            .in('entity_id', dealIds)

          for (const link of dealLinks || []) {
            allFileIds.push(link.file_id)
            const existing = fileSourceMap.get(link.file_id) || []
            existing.push({
              entity_type: 'deal',
              entity_id: link.entity_id,
              entity_name: dealNameMap.get(link.entity_id),
            })
            fileSourceMap.set(link.file_id, existing)
          }
        }
      }
    }

    // Deduplicate file IDs
    const uniqueFileIds = Array.from(new Set(allFileIds))

    if (uniqueFileIds.length === 0) {
      return NextResponse.json({ files: [] })
    }

    // Fetch full file details
    const { data: files } = await supabase
      .from('files')
      .select('id, title, original_filename, doc_type, mime_type, size_bytes, version_number, parent_file_id, uploaded_by_user_id, created_at, updated_at')
      .in('id', uniqueFileIds)
      .eq('org_id', orgId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    // Get uploader names
    const uploaderIds = Array.from(new Set(files?.map(f => f.uploaded_by_user_id) || []))
    const { data: uploaders } = uploaderIds.length > 0
      ? await supabase.from('users').select('id, full_name').in('id', uploaderIds)
      : { data: [] }

    const uploaderMap = new Map(uploaders?.map(u => [u.id, u.full_name]) || [])

    const enrichedFiles = (files || []).map(file => ({
      ...file,
      uploaded_by: {
        id: file.uploaded_by_user_id,
        full_name: uploaderMap.get(file.uploaded_by_user_id) || 'Unknown',
      },
      linked_to: fileSourceMap.get(file.id) || [],
    }))

    return NextResponse.json({ files: enrichedFiles })
  } catch (error) {
    console.error('Related files error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
