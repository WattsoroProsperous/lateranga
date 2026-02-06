-- ============================================
-- La Teranga - Table Management System
-- ============================================

-- Table location enum
CREATE TYPE table_location AS ENUM ('interieur', 'terrasse', 'vip');

-- Restaurant tables
CREATE TABLE restaurant_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  qr_code_token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::TEXT,
  capacity INTEGER NOT NULL DEFAULT 4,
  location table_location DEFAULT 'interieur',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table sessions (when customer scans QR code)
CREATE TABLE table_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID NOT NULL REFERENCES restaurant_tables(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '3 hours'),
  ended_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add table reference to orders
ALTER TABLE orders ADD COLUMN table_session_id UUID REFERENCES table_sessions(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN table_id UUID REFERENCES restaurant_tables(id) ON DELETE SET NULL;

-- ============================================
-- Functions
-- ============================================

-- Auto-close expired sessions
CREATE OR REPLACE FUNCTION close_expired_table_sessions()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE table_sessions
  SET is_active = false, ended_at = now()
  WHERE expires_at < now() AND is_active = true;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Get active session for table
CREATE OR REPLACE FUNCTION get_active_table_session(p_table_token TEXT)
RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
BEGIN
  SELECT ts.id INTO v_session_id
  FROM table_sessions ts
  JOIN restaurant_tables rt ON rt.id = ts.table_id
  WHERE rt.qr_code_token = p_table_token
    AND ts.is_active = true
    AND ts.expires_at > now()
  ORDER BY ts.created_at DESC
  LIMIT 1;

  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new table session
CREATE OR REPLACE FUNCTION create_table_session(p_table_token TEXT)
RETURNS TABLE(session_id UUID, session_token TEXT, table_name TEXT, expires_at TIMESTAMPTZ) AS $$
DECLARE
  v_table_id UUID;
  v_table_name TEXT;
  v_session_id UUID;
  v_session_token TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Get table info
  SELECT rt.id, rt.name INTO v_table_id, v_table_name
  FROM restaurant_tables rt
  WHERE rt.qr_code_token = p_table_token AND rt.is_active = true;

  IF v_table_id IS NULL THEN
    RAISE EXCEPTION 'Table not found or inactive';
  END IF;

  -- Close any existing active sessions for this table
  UPDATE table_sessions
  SET is_active = false, ended_at = now()
  WHERE table_id = v_table_id AND is_active = true;

  -- Create new session
  v_expires_at := now() + INTERVAL '3 hours';

  INSERT INTO table_sessions (table_id, expires_at)
  VALUES (v_table_id, v_expires_at)
  RETURNING id, table_sessions.session_token INTO v_session_id, v_session_token;

  RETURN QUERY SELECT v_session_id, v_session_token, v_table_name, v_expires_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Triggers
-- ============================================

CREATE TRIGGER update_restaurant_tables_updated_at
  BEFORE UPDATE ON restaurant_tables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_sessions ENABLE ROW LEVEL SECURITY;

-- Restaurant Tables - Public can read active, staff can manage
CREATE POLICY "Public read active tables" ON restaurant_tables
  FOR SELECT USING (is_active = true);
CREATE POLICY "Staff manage tables" ON restaurant_tables
  FOR ALL USING (user_has_role(ARRAY['admin', 'super_admin', 'cashier']));

-- Table Sessions - Public can read/create via functions, staff can manage
CREATE POLICY "Public read sessions" ON table_sessions
  FOR SELECT USING (true);
CREATE POLICY "Public create sessions" ON table_sessions
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff manage sessions" ON table_sessions
  FOR ALL USING (is_staff());

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX idx_table_sessions_active ON table_sessions(table_id, is_active) WHERE is_active = true;
CREATE INDEX idx_table_sessions_token ON table_sessions(session_token) WHERE is_active = true;
CREATE INDEX idx_table_sessions_expires ON table_sessions(expires_at) WHERE is_active = true;
CREATE INDEX idx_orders_table ON orders(table_id);
CREATE INDEX idx_orders_table_session ON orders(table_session_id);

-- ============================================
-- Seed Data - Sample Tables
-- ============================================

INSERT INTO restaurant_tables (table_number, name, capacity, location) VALUES
  (1, 'Table 1', 2, 'interieur'),
  (2, 'Table 2', 4, 'interieur'),
  (3, 'Table 3', 4, 'interieur'),
  (4, 'Table 4', 6, 'interieur'),
  (5, 'Table 5', 2, 'terrasse'),
  (6, 'Table 6', 4, 'terrasse'),
  (7, 'Table 7', 4, 'terrasse'),
  (8, 'Table VIP 1', 8, 'vip'),
  (9, 'Table VIP 2', 10, 'vip');
