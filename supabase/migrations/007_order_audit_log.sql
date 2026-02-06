-- ============================================
-- Order Audit Log for Security & Traceability
-- ============================================
-- Tracks all sensitive operations on orders:
-- - Deletions (by admin)
-- - Modifications to paid orders (by admin)
-- - Cancellations (by chef/admin)

-- Audit log table
CREATE TABLE IF NOT EXISTS order_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Action details
  action_type VARCHAR(50) NOT NULL, -- 'delete', 'modify', 'cancel'

  -- Actor (who did it)
  actor_id UUID NOT NULL REFERENCES auth.users(id),
  actor_role VARCHAR(50) NOT NULL,
  actor_name VARCHAR(255),

  -- Target order (snapshot at time of action)
  order_id UUID NOT NULL, -- Original order ID (may be deleted)
  order_number VARCHAR(50) NOT NULL,
  order_data JSONB NOT NULL, -- Full order snapshot before action

  -- Reason (mandatory for security)
  reason TEXT NOT NULL,

  -- For modifications: what changed
  changes JSONB, -- { field: { old: value, new: value } }

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX idx_order_audit_actor ON order_audit_log(actor_id);
CREATE INDEX idx_order_audit_order ON order_audit_log(order_id);
CREATE INDEX idx_order_audit_action ON order_audit_log(action_type);
CREATE INDEX idx_order_audit_date ON order_audit_log(created_at DESC);

-- RLS policies
ALTER TABLE order_audit_log ENABLE ROW LEVEL SECURITY;

-- Only super_admin and admin can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON order_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- Only service role can insert (from server actions)
-- No direct insert from client

-- Add soft delete column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- Index for soft delete queries
CREATE INDEX IF NOT EXISTS idx_orders_deleted ON orders(deleted_at) WHERE deleted_at IS NOT NULL;

-- Comment for documentation
COMMENT ON TABLE order_audit_log IS 'Security audit trail for all sensitive order operations (deletions, modifications, cancellations)';
COMMENT ON COLUMN order_audit_log.order_data IS 'Complete JSON snapshot of the order at the time of the action';
COMMENT ON COLUMN order_audit_log.changes IS 'For modifications: detailed field-by-field changes';
