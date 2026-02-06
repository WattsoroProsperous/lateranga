-- ============================================
-- La Teranga - Notifications System
-- ============================================

-- Notification type enum
CREATE TYPE notification_type AS ENUM (
  'new_order',
  'order_cancelled',
  'order_ready',
  'low_stock',
  'ingredient_request',
  'payment_validated',
  'table_order'
);

-- ============================================
-- Notifications Table
-- ============================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  target_roles TEXT[] NOT NULL,
  target_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Functions
-- ============================================

-- Create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_type notification_type,
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT '{}',
  p_target_roles TEXT[] DEFAULT NULL,
  p_target_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
  v_roles TEXT[];
BEGIN
  -- Set default roles based on notification type
  IF p_target_roles IS NULL THEN
    v_roles := CASE p_type
      WHEN 'new_order' THEN ARRAY['admin', 'super_admin', 'cashier', 'chef']
      WHEN 'order_cancelled' THEN ARRAY['admin', 'super_admin', 'cashier']
      WHEN 'order_ready' THEN ARRAY['cashier']
      WHEN 'low_stock' THEN ARRAY['admin', 'super_admin']
      WHEN 'ingredient_request' THEN ARRAY['admin', 'super_admin']
      WHEN 'payment_validated' THEN ARRAY['admin', 'super_admin']
      WHEN 'table_order' THEN ARRAY['cashier', 'chef']
      ELSE ARRAY['admin']
    END;
  ELSE
    v_roles := p_target_roles;
  END IF;

  INSERT INTO notifications (type, title, message, data, target_roles, target_user_id)
  VALUES (p_type, p_title, p_message, p_data, v_roles, p_target_user_id)
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE notifications
  SET is_read = true, read_at = now()
  WHERE id = p_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark all notifications as read for user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_user_role TEXT;
BEGIN
  SELECT role::TEXT INTO v_user_role FROM profiles WHERE id = p_user_id;

  UPDATE notifications
  SET is_read = true, read_at = now()
  WHERE is_read = false
    AND (target_user_id = p_user_id OR v_user_role = ANY(target_roles));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get unread notifications for user
CREATE OR REPLACE FUNCTION get_user_notifications(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE(
  id UUID,
  type notification_type,
  title TEXT,
  message TEXT,
  data JSONB,
  is_read BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  v_user_role TEXT;
BEGIN
  SELECT role::TEXT INTO v_user_role FROM profiles WHERE id = p_user_id;

  RETURN QUERY
  SELECT n.id, n.type, n.title, n.message, n.data, n.is_read, n.created_at
  FROM notifications n
  WHERE (n.target_user_id = p_user_id OR v_user_role = ANY(n.target_roles))
  ORDER BY n.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_user_role TEXT;
  v_count INTEGER;
BEGIN
  SELECT role::TEXT INTO v_user_role FROM profiles WHERE id = p_user_id;

  SELECT COUNT(*)::INTEGER INTO v_count
  FROM notifications n
  WHERE n.is_read = false
    AND (n.target_user_id = p_user_id OR v_user_role = ANY(n.target_roles));

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function: Create notification on new order
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
DECLARE
  v_type notification_type;
  v_title TEXT;
BEGIN
  -- Determine notification type
  IF NEW.table_id IS NOT NULL THEN
    v_type := 'table_order';
    v_title := 'Nouvelle commande table';
  ELSE
    v_type := 'new_order';
    v_title := 'Nouvelle commande';
  END IF;

  PERFORM create_notification(
    v_type,
    v_title,
    'Commande ' || NEW.order_number || ' de ' || NEW.client_name,
    jsonb_build_object(
      'order_id', NEW.id,
      'order_number', NEW.order_number,
      'client_name', NEW.client_name,
      'total', NEW.total,
      'table_id', NEW.table_id
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function: Notify on order cancellation
CREATE OR REPLACE FUNCTION notify_order_cancelled()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    PERFORM create_notification(
      'order_cancelled',
      'Commande annulee',
      'Commande ' || NEW.order_number || ' a ete annulee. Raison: ' || COALESCE(NEW.cancellation_reason, 'Non specifiee'),
      jsonb_build_object(
        'order_id', NEW.id,
        'order_number', NEW.order_number,
        'reason', NEW.cancellation_reason
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function: Notify on low stock
CREATE OR REPLACE FUNCTION check_and_notify_low_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_quantity <= NEW.min_threshold AND OLD.current_quantity > OLD.min_threshold THEN
    PERFORM create_notification(
      'low_stock',
      'Stock bas',
      NEW.name || ': ' || NEW.current_quantity || ' ' || NEW.unit || ' restant(s)',
      jsonb_build_object(
        'item_type', TG_TABLE_NAME,
        'item_id', NEW.id,
        'item_name', NEW.name,
        'current_quantity', NEW.current_quantity,
        'min_threshold', NEW.min_threshold
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Triggers
-- ============================================

-- Notify on new order
CREATE TRIGGER notify_new_order_trigger
  AFTER INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION notify_new_order();

-- Notify on order cancellation
CREATE TRIGGER notify_order_cancelled_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION notify_order_cancelled();

-- Notify on low stock items
CREATE TRIGGER check_low_stock_items_trigger
  AFTER UPDATE ON stock_items
  FOR EACH ROW EXECUTE FUNCTION check_and_notify_low_stock();

-- Notify on low ingredients
CREATE TRIGGER check_low_ingredients_trigger
  AFTER UPDATE ON ingredients
  FOR EACH ROW EXECUTE FUNCTION check_and_notify_low_stock();

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY "Users read own notifications" ON notifications
  FOR SELECT USING (
    target_user_id = auth.uid()
    OR (SELECT role::TEXT FROM profiles WHERE id = auth.uid()) = ANY(target_roles)
  );

-- System can insert notifications
CREATE POLICY "System insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Users can update (mark read) their notifications
CREATE POLICY "Users update own notifications" ON notifications
  FOR UPDATE USING (
    target_user_id = auth.uid()
    OR (SELECT role::TEXT FROM profiles WHERE id = auth.uid()) = ANY(target_roles)
  );

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX idx_notifications_unread ON notifications(target_roles, is_read, created_at DESC) WHERE is_read = false;
CREATE INDEX idx_notifications_user ON notifications(target_user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ============================================
-- Cleanup old notifications (optional cron job)
-- ============================================

-- Function to delete old read notifications (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM notifications
  WHERE is_read = true AND created_at < now() - INTERVAL '30 days';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;
