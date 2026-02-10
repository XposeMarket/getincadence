-- =====================================================
-- CADENCE CRM — FILES & FILE LINKS
-- Migration: 007_files_and_file_links.sql
-- =====================================================

-- Drop trigger first if it exists (avoids conflicts)
DROP TRIGGER IF EXISTS update_files_updated_at ON files;

-- Drop tables if they exist
DROP TABLE IF EXISTS file_links CASCADE;
DROP TABLE IF EXISTS files CASCADE;

-- =====================================================
-- CREATE FUNCTION FIRST (referenced by trigger later)
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TABLES
-- =====================================================

CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  uploaded_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  doc_type TEXT DEFAULT 'other',
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  storage_key TEXT NOT NULL,
  bucket_name TEXT DEFAULT 'cadence-files',
  version_number INTEGER DEFAULT 1,
  parent_file_id UUID REFERENCES files(id) ON DELETE SET NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE file_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('deal', 'company', 'contact')),
  entity_id UUID NOT NULL,
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(file_id, entity_type, entity_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_files_org_id ON files(org_id);
CREATE INDEX idx_files_uploaded_by ON files(uploaded_by_user_id);
CREATE INDEX idx_files_doc_type ON files(doc_type);
CREATE INDEX idx_files_is_deleted ON files(is_deleted);
CREATE INDEX idx_files_parent_id ON files(parent_file_id);
CREATE INDEX idx_files_created_at ON files(created_at);
CREATE INDEX idx_file_links_org_id ON file_links(org_id);
CREATE INDEX idx_file_links_file_id ON file_links(file_id);
CREATE INDEX idx_file_links_entity ON file_links(entity_type, entity_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org files" ON files FOR SELECT
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can upload files to own org" ON files FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update own org files" ON files FOR UPDATE
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view own org file links" ON file_links FOR SELECT
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can create file links in own org" ON file_links FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete file links in own org" ON file_links FOR DELETE
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

-- =====================================================
-- TRIGGER (created AFTER function exists)
-- =====================================================

CREATE TRIGGER update_files_updated_at
  BEFORE UPDATE ON files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
