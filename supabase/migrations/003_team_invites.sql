-- =====================================================
-- CADENCE CRM - TEAM INVITES SCHEMA
-- =====================================================

-- =====================================================
-- TEAM INVITES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS team_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- 'admin' or 'member'
  token TEXT NOT NULL UNIQUE,
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE,
  used_by UUID REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for quick lookups
CREATE INDEX IF NOT EXISTS idx_team_invites_org_id ON team_invites(org_id);
CREATE INDEX IF NOT EXISTS idx_team_invites_email ON team_invites(email);
CREATE INDEX IF NOT EXISTS idx_team_invites_token ON team_invites(token);
CREATE INDEX IF NOT EXISTS idx_team_invites_expires_at ON team_invites(expires_at);

-- Enable RLS
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policy (users can see invites for their org)
CREATE POLICY "Users can view their org invites" ON team_invites
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM users WHERE id = auth.uid()
    )
  );

-- Allow inserts from authenticated users (for admins creating invites)
CREATE POLICY "Authenticated users can create invites" ON team_invites
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow updates (marking as used)
CREATE POLICY "Allow updates for demo" ON team_invites
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow public read of invite by token (for invite acceptance)
CREATE POLICY "Anyone can view invite by token" ON team_invites
  FOR SELECT
  USING (true);
