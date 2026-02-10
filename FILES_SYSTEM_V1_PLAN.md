# Cadence — Files System (V1) — Final Implementation Plan

**Status:** Ready for Build  
**Created:** February 9, 2026  
**Version:** 1.0 (Document, AI-ready design)

---

## 🎯 Goal (V1)

Implement a file upload + attachment system so users can:
1. Upload files (contracts, receipts, PDFs, images, etc.)
2. Attach/link files to a Deal (primary attachment point)
3. See the same files automatically appear on related entities:
   - Deal detail page (Files tab/panel)
   - Company detail page (shows all files from any deals under that company)
   - Contact detail page (shows all files linked to that contact or to deals under the contact's company)
4. Support basic file actions:
   - View/preview (signed URL, open in new tab)
   - Download (signed URL)
   - Rename/title edit
   - Change doc type
   - Delete (soft delete, permissions-aware)
5. Track file versions (original upload → latest version in a visible pipeline)

**Important:** This V1 is purely document storage + linking. No AI yet, but design enables AI integration later without refactoring.

---

## 🔮 Future Vision (AI-ready design)

Cadence AI will use DB + file text context to:
- Summarize contracts/receipts
- Extract key fields (deposit amount, due dates, cancellation, renewal)
- Create tasks from obligations (invoice due, renewal reminders)
- Draft emails based on deal + file content

To enable this later, V1 stores:
- File metadata in database  
- Actual file in Supabase Storage bucket
- Support for file versioning (every upload tracked)
- Soft delete (no data loss, safe for AI context queries)

---

## 📊 Database Schema (V1)

### Table: `files`
Stores file metadata. One row per file upload.

```sql
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  uploaded_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  
  -- File identity
  title TEXT NOT NULL,  -- User-friendly name, editable
  original_filename TEXT NOT NULL,  -- Original filename on upload
  doc_type TEXT NOT NULL DEFAULT 'other',  -- contract, receipt, proposal, invoice, other
  mime_type TEXT NOT NULL,  -- application/pdf, image/png, etc.
  size_bytes BIGINT NOT NULL,
  
  -- Storage location
  storage_key TEXT NOT NULL,  -- full path in Supabase Storage bucket
  bucket_name TEXT NOT NULL DEFAULT 'cadence-files',
  
  -- Versioning
  version_number INTEGER NOT NULL DEFAULT 1,  -- 1, 2, 3... for tracking file history
  parent_file_id UUID REFERENCES files(id),  -- if this is a new version, link to original
  
  -- Soft delete
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_files_org_id ON files(org_id);
CREATE INDEX idx_files_uploaded_by ON files(uploaded_by_user_id);
CREATE INDEX idx_files_doc_type ON files(doc_type);
CREATE INDEX idx_files_is_deleted ON files(is_deleted);
CREATE INDEX idx_files_parent_id ON files(parent_file_id);  -- for version chains
```

### Table: `file_links`
Connects files to entities (deals, companies, contacts). Supports many-to-many.

```sql
CREATE TABLE file_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  
  -- Polymorphic: one file linked to deal, company, or contact
  entity_type TEXT NOT NULL,  -- enum: 'deal', 'company', 'contact'
  entity_id UUID NOT NULL,
  
  -- Audit
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_file_links_org_id ON file_links(org_id);
CREATE INDEX idx_file_links_file_id ON file_links(file_id);
CREATE INDEX idx_file_links_entity ON file_links(entity_type, entity_id);
```

### doc_type Enum Values
```
- 'contract' — contracts, agreements
- 'receipt' — receipts, invoices, purchase orders
- 'proposal' — quotes, estimates, proposals
- 'invoice' — invoices, bills
- 'other' — other documents
```

---

## 🔒 Storage Setup (Supabase Storage)

**Bucket Name:** `cadence-files`

**Storage Key Format:**
```
{org_id}/{file_id}/{filename}
```

Example:
```
550e8400-e29b-41d4-a716-446655440000/123e4567-e89b-12d3-a456-426614174000/contract_2024.pdf
```

**Access Rules:**
- Files always served via signed URLs (60-300 second expiry)
- Direct bucket access restricted by RLS-equivalent policies
- Authenticated users can list/download only their org's files

---

## 🔓 Permissions & Security Rules

### Who Can Upload?
- Any authenticated team member (member or admin role)

### Who Can Download/View?
- Any authenticated team member in the same org
- All team members see all files (org-scoped, not user-scoped)

### Who Can Rename/Change Type?
- Any team member (no special permission)

### Who Can Delete?
- **The user who uploaded the file** (uploader)
- **Org admins** (any admin can delete any file)
- Delete is **soft delete** (is_deleted=true, deleted_at set, deleted_by logged)

### RLS Policies
- All queries filtered by `org_id` (org isolation)
- Soft-deleted files excluded from list/view queries by default
- Admin queries can see deleted files (audit trail)

---

## 🛠️ Backend API Endpoints

All endpoints require authentication + org_id scoping.

### 1. `POST /api/files/upload-url`
**Purpose:** Get signed upload URL + initialize file record

**Request:**
```json
{
  "title": "Q4 2024 Contract",
  "original_filename": "contract_signed.pdf",
  "doc_type": "contract",
  "mime_type": "application/pdf",
  "size_bytes": 2048000
}
```

**Response (200):**
```json
{
  "file_id": "123e4567-e89b-12d3-a456-426614174000",
  "upload_url": "https://storage.supabase.co/...",
  "storage_key": "550e8400-e29b-41d4-a716-446655440000/123e4567-e89b-12d3-a456-426614174000/contract_signed.pdf",
  "expires_in_seconds": 3600
}
```

**Actions:**
- Create row in `files` table (version_number=1, parent_file_id=null)
- Return signed POST URL to client for direct upload to Supabase Storage
- Bucket location: `cadence-files`

---

### 2. `POST /api/files/link`
**Purpose:** Connect file to a deal/company/contact

**Request:**
```json
{
  "file_id": "123e4567-e89b-12d3-a456-426614174000",
  "entity_type": "deal",
  "entity_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (201):**
```json
{
  "file_link_id": "abcd1234-...",
  "file_id": "123e4567-...",
  "entity_type": "deal",
  "entity_id": "550e8400-..."
}
```

**Actions:**
- Create row in `file_links` table
- Validate file_id exists + belongs to org
- Validate entity exists + belongs to org

---

### 3. `GET /api/files?entity_type=deal&entity_id=...`
**Purpose:** List files linked to a specific entity

**Query Params:**
- `entity_type`: 'deal', 'company', or 'contact'
- `entity_id`: UUID of the entity

**Response (200):**
```json
{
  "files": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "title": "Q4 2024 Contract",
      "doc_type": "contract",
      "mime_type": "application/pdf",
      "size_bytes": 2048000,
      "uploaded_by": {
        "id": "user-123",
        "full_name": "Jane Doe"
      },
      "created_at": "2026-02-09T10:00:00Z",
      "versions": [
        {
          "version_number": 1,
          "created_at": "2026-02-09T10:00:00Z",
          "file_id": "123e4567-e89b-12d3-a456-426614174000"
        },
        {
          "version_number": 2,
          "created_at": "2026-02-09T11:00:00Z",
          "file_id": "789abcde-f012-3456-789a-bcdef0123456"
        }
      ]
    }
  ]
}
```

**Actions:**
- Join `files` + `file_links` where entity matches
- Exclude soft-deleted files (is_deleted=true)
- Include version chain (all versions of each file)

---

### 4. `GET /api/files/related?company_id=...`
**Purpose:** Get all files related to a company/contact (including deal files)

**Query Params:**
- `company_id`: UUID of company (returns company + all deal files)
- OR `contact_id`: UUID of contact (returns contact + contact's company deal files)

**Response (200):**
```json
{
  "files": [
    {
      "id": "...",
      "title": "...",
      "doc_type": "...",
      "linked_to": [
        { "entity_type": "deal", "entity_id": "..." },
        { "entity_type": "company", "entity_id": "..." }
      ],
      "versions": [...]
    }
  ]
}
```

**Actions:**
- If company_id: return files linked to company + files linked to any deal under company
- If contact_id: return files linked to contact + files linked to any deal where deal.company_id = contact.company_id
- Exclude soft-deleted files

---

### 5. `GET /api/files/:id/view-url`
**Purpose:** Get signed download/preview URL for a file

**Response (200):**
```json
{
  "view_url": "https://storage.supabase.co/...",
  "expires_in_seconds": 300
}
```

**Actions:**
- Generate signed GET URL (300 second expiry)
- Verify file belongs to user's org
- Return URL (user opens in new tab)

---

### 6. `PATCH /api/files/:id`
**Purpose:** Update file title or doc_type

**Request:**
```json
{
  "title": "Updated Title",
  "doc_type": "receipt"
}
```

**Response (200):**
```json
{
  "id": "123e4567-...",
  "title": "Updated Title",
  "doc_type": "receipt",
  "updated_at": "2026-02-09T11:30:00Z"
}
```

**Actions:**
- Update `files` row
- Verify owned by org + not deleted
- Update `updated_at` timestamp

---

### 7. `POST /api/files/:id/upload-new-version`
**Purpose:** Upload a new version of an existing file

**Request:**
```json
{
  "original_filename": "contract_signed_v2.pdf",
  "mime_type": "application/pdf",
  "size_bytes": 2150000
}
```

**Response (200):**
```json
{
  "new_file_id": "abcd1234-e89b-12d3-a456-426614174000",
  "version_number": 2,
  "upload_url": "https://storage.supabase.co/...",
  "parent_file_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Actions:**
- Create new `files` row with version_number = max(version_number) + 1
- Set parent_file_id to original file_id
- Return signed upload URL for new version
- **Important:** Don't auto-link new version to old file's entities; let UI handle this

---

### 8. `DELETE /api/files/:id`
**Purpose:** Soft delete a file

**Response (200):**
```json
{
  "id": "123e4567-...",
  "is_deleted": true,
  "deleted_at": "2026-02-09T11:35:00Z"
}
```

**Actions:**
- Check permissions: user is uploader OR user is org admin
- Set is_deleted=true, deleted_at=NOW(), deleted_by_user_id=current_user
- **Do NOT delete from storage** (keep for recovery/audit)
- **Do NOT delete file_links** (keep audit trail)

**Error (403):**
```json
{
  "error": "Unauthorized. Only the uploader or org admin can delete this file."
}
```

---

## 🎨 Frontend UI Placement

### Deal Detail Page (`app/(dashboard)/deals/[id]/page.tsx`)
**Location:** New "Files" tab alongside Notes, Tasks, Activities

**UI Components:**
- Upload button (file input)
  - Shows modal: choose file, optional doc_type + title override
  - On success: auto-link to current deal
- Files list (if any linked):
  - Row per file: icon (doc_type) | title | uploaded_by | date | file size
  - Actions per row:
    - 👁️ View (download/preview URL)
    - ⬇️ Download (same URL)
    - ✏️ Rename (modal)
    - 📝 Change Type (dropdown)
    - 🗑️ Delete (confirm, soft delete)
  - **Versions dropdown** below title:
    - Shows: "v1 (2026-02-09) · v2 (2026-02-09) · v3 (2026-02-09)"
    - Click to switch view/download version

---

### Company Detail Page (`app/(dashboard)/companies/[id]/page.tsx`)
**Location:** New "Files" section (after Overview, before Contacts/Deals)

**UI Components:**
- **Same as deal but read-only actions** (no upload)
- Shows: all files linked directly to company + all files linked to any deal under company
- Grouped by source:
  - "Company Files" (linked to company)
  - "Deal Files" (from deals) — grouped by deal name

**Example:**
```
📄 Company Files
- contract_setup.pdf (contract) · Jane Doe · Feb 8

📄 Deal Files
  □ Q1 2024 Closing (Deal)
    - closing_agreement.pdf (contract) · John Smith · Feb 7
    - deposit_receipt.pdf (receipt) · Jane Doe · Feb 6
```

---

### Contact Detail Page (`app/(dashboard)/contacts/[id]/page.tsx`)
**Location:** New "Files" section

**UI Components:**
- Shows: all files linked directly to contact + all files linked to deals under contact's company
- Same read-only list format as contacts
- Grouped by source (similar to Company)

---

## 🔄 Upload Flow (Frontend)

1. User clicks "Upload" on deal/company/contact detail page
2. Modal opens:
   - File input (drag-drop or click)
   - Title field (pre-filled with filename, editable)
   - Doc Type dropdown (contract/receipt/proposal/invoice/other)
   - Submit button
3. On submit:
   - Call `POST /api/files/upload-url` → get file_id + signed upload URL
   - Upload file directly to Supabase Storage via signed URL
   - On success, call `POST /api/files/link` to connect file to entity
   - Reload files list
4. If error: show toast message

---

## 📋 Related Files Logic (Implementation)

### Query: "Files for a Deal"
```sql
SELECT DISTINCT f.* FROM files f
JOIN file_links fl ON f.id = fl.file_id
WHERE fl.entity_id = $deal_id
  AND fl.entity_type = 'deal'
  AND f.org_id = $org_id
  AND f.is_deleted = FALSE
ORDER BY f.created_at DESC;
```

### Query: "Files for a Company" (including deals)
```sql
SELECT DISTINCT f.* FROM files f
JOIN file_links fl ON f.id = fl.file_id
WHERE f.org_id = $org_id
  AND f.is_deleted = FALSE
  AND (
    (fl.entity_type = 'company' AND fl.entity_id = $company_id)
    OR (fl.entity_type = 'deal' AND fl.entity_id IN (
      SELECT id FROM deals WHERE company_id = $company_id AND org_id = $org_id
    ))
  )
ORDER BY f.created_at DESC;
```

### Query: "Files for a Contact" (including contact's company deals)
```sql
SELECT DISTINCT f.* FROM files f
JOIN file_links fl ON f.id = fl.file_id
WHERE f.org_id = $org_id
  AND f.is_deleted = FALSE
  AND (
    (fl.entity_type = 'contact' AND fl.entity_id = $contact_id)
    OR (fl.entity_type = 'deal' AND fl.entity_id IN (
      SELECT id FROM deals 
      WHERE company_id = (SELECT company_id FROM contacts WHERE id = $contact_id AND org_id = $org_id)
        AND org_id = $org_id
    ))
  )
ORDER BY f.created_at DESC;
```

### Query: "File Versions" (version chain)
```sql
-- Get all versions of a file (following parent_file_id chain)
WITH RECURSIVE versions AS (
  SELECT * FROM files WHERE id = $file_id OR parent_file_id = $file_id
  UNION ALL
  SELECT f.* FROM files f
  JOIN versions v ON f.parent_file_id = v.id
)
SELECT * FROM versions ORDER BY version_number;
```

---

## 🔐 RLS Policies

### files Table
- **SELECT:** org_id matches user's org (exclude is_deleted=true for non-admins)
- **INSERT:** org_id matches user's org, uploaded_by_user_id = current user
- **UPDATE:** org_id matches user's org, current user is uploader or admin
- **DELETE:** Not allowed (use soft delete via API instead)

### file_links Table
- **SELECT:** org_id matches user's org
- **INSERT:** org_id matches user's org
- **UPDATE/DELETE:** Not typically needed (managed via API)

---

## 📦 Implementation Order

### Phase 1: Database (⏱️ 30 min)
- [ ] Create migration: `007_files_and_file_links.sql`
  - Create `files` table
  - Create `file_links` table
  - Add indexes
  - Add RLS policies
  - Add `updated_at` trigger for files

### Phase 2: Backend API (⏱️ 2-3 hours)
- [ ] Create `/api/files/upload-url` endpoint
- [ ] Create `/api/files/link` endpoint
- [ ] Create `/api/files` list endpoint (with entity_type + entity_id filters)
- [ ] Create `/api/files/related` endpoint (company_id / contact_id variants)
- [ ] Create `/api/files/:id/view-url` endpoint
- [ ] Create `/api/files/:id` PATCH endpoint (rename, change type)
- [ ] Create `/api/files/:id` DELETE endpoint (soft delete)
- [ ] Create `/api/files/:id/upload-new-version` endpoint
- [ ] Add permission checks (uploader/admin for delete)
- [ ] Add org_id scoping to all endpoints

### Phase 3: Frontend Components (⏱️ 2-3 hours)
- [ ] Create `components/files/FileUploadModal.tsx`
- [ ] Create `components/files/FilesList.tsx` (reusable)
- [ ] Create `components/files/FileVersions.tsx` (version pipeline)
- [ ] Add Files tab to Deal detail page
- [ ] Add Files section to Company detail page
- [ ] Add Files section to Contact detail page

### Phase 4: QA & Polish (⏱️ 1-2 hours)
- [ ] Test upload flow (small PDF, image, doc)
- [ ] Test file appears on all related entities
- [ ] Test rename/change type
- [ ] Test delete (soft delete confirmed)
- [ ] Test version uploads + version switching
- [ ] Test org isolation (user from org B can't see org A files)
- [ ] Test permissions (non-uploader can't delete)
- [ ] Test signed URLs (valid, then expired)

---

## 🎯 Decisions Summary

| Decision | Value | Rationale |
|----------|-------|-----------|
| Free tier file limits | No limits in V1 | Keep simple, document for later billing |
| Delete behavior | Soft delete | Audit trail, recovery, AI-safe |
| Delete permissions | Uploader + Admin | Secure, matches RBAC |
| Storage backend | Supabase Storage | Built-in, integrated, no extra config |
| Versioning | Pipeline-based | User sees full history, can switch versions |
| Primary attachment | Deal | Deal is central hub for deal-related docs |
| Download method | Signed URLs | Secure, time-limited, no direct bucket access |
| Version auto-linking | Manual (UI) | User chooses which entity gets new version |

---

## 🚀 Ready to Build!

All approvals obtained. Ready to start Phase 1 (Database migrations).

Questions? Flag them before we start building!

