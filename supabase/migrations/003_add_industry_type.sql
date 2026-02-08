-- Add industry_type column to organizations table
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS industry_type TEXT DEFAULT 'default';

-- Add constraint to validate industry_type values
ALTER TABLE orgs ADD CONSTRAINT industry_type_check CHECK (industry_type IN ('default', 'photographer'));
