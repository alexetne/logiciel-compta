CREATE TABLE IF NOT EXISTS app.retrocession_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES app.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  rate numeric(5,2) NOT NULL CHECK (rate >= 0 AND rate <= 100),
  effective_from date NOT NULL,
  effective_to date,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  created_by uuid NOT NULL REFERENCES app.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

CREATE INDEX IF NOT EXISTS retrocession_rules_org_dates_idx
  ON app.retrocession_rules (organization_id, effective_from DESC);

CREATE UNIQUE INDEX IF NOT EXISTS retrocession_rules_one_active_idx
  ON app.retrocession_rules (organization_id)
  WHERE status = 'active';
