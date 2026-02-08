-- =====================================================
-- CADENCE CRM - FEEDBACK TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES orgs(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_name TEXT,
  
  -- Feedback categorization
  category TEXT NOT NULL, -- 'bug', 'feature', 'ui', 'general', 'other'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  
  -- Content
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Optional context
  page_url TEXT, -- Where they submitted from
  user_agent TEXT, -- Browser info
  screenshot_url TEXT, -- Future: allow screenshot uploads
  
  -- Admin tracking
  status TEXT DEFAULT 'new', -- 'new', 'reviewed', 'in_progress', 'resolved', 'wont_fix'
  admin_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feedback_org_id ON feedback(org_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_category ON feedback(category);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);

-- Enable RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Users can insert their own feedback
CREATE POLICY "Users can submit feedback" ON feedback
  FOR INSERT
  WITH CHECK (true);

-- Users can view their own feedback
CREATE POLICY "Users can view their own feedback" ON feedback
  FOR SELECT
  USING (user_id = auth.uid());

-- Service role can do everything (for admin dashboard later)
CREATE POLICY "Service role full access" ON feedback
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_feedback_updated_at ON feedback;
CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON feedback
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
