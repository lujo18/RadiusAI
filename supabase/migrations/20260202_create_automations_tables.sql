-- Create automations table for content automation workflows
CREATE TABLE IF NOT EXISTS automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  template_ids TEXT[] NOT NULL DEFAULT '{}',
  cta_ids TEXT[] NOT NULL DEFAULT '{}',
  platforms TEXT[] NOT NULL DEFAULT '{}',
  schedule JSONB NOT NULL DEFAULT '{"weekday": [], "time": []}',
  next_run_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_run_at TIMESTAMP WITH TIME ZONE,
  cursor_template_index INTEGER DEFAULT 0,
  cursor_cta_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create automation_runs table for audit log and execution history
CREATE TABLE IF NOT EXISTS automation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  run_started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  run_finished_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  error_message TEXT,
  template_id_used TEXT,
  cta_id_used TEXT,
  platforms_used TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_automations_brand_id ON automations(brand_id);
CREATE INDEX idx_automations_is_active_next_run ON automations(is_active, next_run_at);
CREATE INDEX idx_automation_runs_automation_id ON automation_runs(automation_id);
CREATE INDEX idx_automation_runs_created_at ON automation_runs(created_at DESC);

-- Enable RLS
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for automations
CREATE POLICY "Users can view their brand's automations"
  ON automations FOR SELECT
  USING (brand_id IN (
    SELECT id FROM brands WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Users can create automations for their brands"
  ON automations FOR INSERT
  WITH CHECK (brand_id IN (
    SELECT id FROM brands WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Users can update their brand's automations"
  ON automations FOR UPDATE
  USING (brand_id IN (
    SELECT id FROM brands WHERE owner_id = auth.uid()
  ))
  WITH CHECK (brand_id IN (
    SELECT id FROM brands WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Users can delete their brand's automations"
  ON automations FOR DELETE
  USING (brand_id IN (
    SELECT id FROM brands WHERE owner_id = auth.uid()
  ));

-- RLS Policies for automation_runs
CREATE POLICY "Users can view runs for their brand's automations"
  ON automation_runs FOR SELECT
  USING (automation_id IN (
    SELECT id FROM automations 
    WHERE brand_id IN (
      SELECT id FROM brands WHERE owner_id = auth.uid()
    )
  ));

-- Service role can insert runs (backend only)
CREATE POLICY "Service role can insert automation runs"
  ON automation_runs FOR INSERT
  WITH CHECK (true);

-- Trigger to update updated_at on automations
CREATE OR REPLACE FUNCTION update_automations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER automations_updated_at_trigger
BEFORE UPDATE ON automations
FOR EACH ROW
EXECUTE FUNCTION update_automations_updated_at();
