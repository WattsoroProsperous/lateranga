-- ============================================
-- La Teranga - Payment System
-- ============================================

-- Payment method enum
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'wave', 'orange_money', 'mtn_money');

-- Payment status enum
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded', 'cancelled');

-- ============================================
-- Add payment fields to orders
-- ============================================

ALTER TABLE orders ADD COLUMN payment_status payment_status NOT NULL DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN payment_method payment_method;
ALTER TABLE orders ADD COLUMN paid_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN paid_amount INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN validated_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN payment_reference TEXT; -- For mobile money reference numbers

-- ============================================
-- Functions
-- ============================================

-- Validate payment
CREATE OR REPLACE FUNCTION validate_payment(
  p_order_id UUID,
  p_payment_method payment_method,
  p_paid_amount INTEGER,
  p_validated_by UUID,
  p_reference TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_order RECORD;
BEGIN
  -- Get order
  SELECT * INTO v_order FROM orders WHERE id = p_order_id;

  IF v_order IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_order.payment_status = 'paid' THEN
    RAISE EXCEPTION 'Order already paid';
  END IF;

  IF v_order.status = 'cancelled' THEN
    RAISE EXCEPTION 'Cannot pay cancelled order';
  END IF;

  -- Update order with payment info
  UPDATE orders
  SET payment_status = 'paid',
      payment_method = p_payment_method,
      paid_at = now(),
      paid_amount = p_paid_amount,
      validated_by = p_validated_by,
      payment_reference = p_reference,
      -- If order is still pending/confirmed, mark as completed
      status = CASE
        WHEN status IN ('pending', 'confirmed', 'ready') THEN 'completed'
        ELSE status
      END,
      completed_at = CASE
        WHEN status IN ('pending', 'confirmed', 'ready') THEN now()
        ELSE completed_at
      END
  WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Refund payment
CREATE OR REPLACE FUNCTION refund_payment(
  p_order_id UUID,
  p_refunded_by UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_order RECORD;
BEGIN
  -- Get order
  SELECT * INTO v_order FROM orders WHERE id = p_order_id;

  IF v_order IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_order.payment_status != 'paid' THEN
    RAISE EXCEPTION 'Order not paid';
  END IF;

  -- Update order
  UPDATE orders
  SET payment_status = 'refunded',
      status = 'cancelled',
      cancelled_at = now(),
      cancellation_reason = COALESCE(p_reason, 'Remboursement')
  WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get unpaid orders
CREATE OR REPLACE FUNCTION get_unpaid_orders()
RETURNS TABLE(
  id UUID,
  order_number TEXT,
  client_name TEXT,
  total INTEGER,
  status order_status,
  table_name TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT o.id, o.order_number, o.client_name, o.total, o.status,
         rt.name as table_name, o.created_at
  FROM orders o
  LEFT JOIN restaurant_tables rt ON rt.id = o.table_id
  WHERE o.payment_status = 'pending'
    AND o.status NOT IN ('cancelled')
  ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get daily sales summary
CREATE OR REPLACE FUNCTION get_daily_sales_summary(p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(
  payment_method payment_method,
  order_count BIGINT,
  total_amount BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT o.payment_method, COUNT(*)::BIGINT, SUM(o.paid_amount)::BIGINT
  FROM orders o
  WHERE o.payment_status = 'paid'
    AND DATE(o.paid_at) = p_date
  GROUP BY o.payment_method
  ORDER BY total_amount DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_paid_at ON orders(paid_at);
CREATE INDEX idx_orders_validated_by ON orders(validated_by);
