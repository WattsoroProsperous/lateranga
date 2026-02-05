-- ============================================
-- La Teranga - Stock Management System
-- ============================================

-- Stock unit enum
CREATE TYPE stock_unit AS ENUM ('unit', 'kg', 'g', 'l', 'ml', 'piece');

-- Stock movement type enum
CREATE TYPE stock_movement_type AS ENUM ('sale', 'restock', 'adjustment', 'request', 'waste', 'return');

-- Ingredient request status enum
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected');

-- ============================================
-- Stock Items (for countable items: drinks, desserts)
-- ============================================

CREATE TABLE stock_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  current_quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit stock_unit NOT NULL DEFAULT 'unit',
  min_threshold DECIMAL(10,2) NOT NULL DEFAULT 5,
  cost_per_unit INTEGER NOT NULL DEFAULT 0, -- Cost in FCFA
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Ingredients (for kitchen supplies)
-- ============================================

CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  current_quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit stock_unit NOT NULL DEFAULT 'kg',
  price_per_unit INTEGER NOT NULL DEFAULT 0, -- Price in FCFA
  min_threshold DECIMAL(10,2) NOT NULL DEFAULT 1,
  supplier TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Recipe Ingredients (link menu items to ingredients for cost calculation)
-- ============================================

CREATE TABLE recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity_used DECIMAL(10,3) NOT NULL, -- Amount used per dish
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(menu_item_id, ingredient_id)
);

-- ============================================
-- Ingredient Requests (chef requests ingredients)
-- ============================================

CREATE TABLE ingredient_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  quantity DECIMAL(10,2) NOT NULL,
  reason TEXT,
  status request_status NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Stock Movements (audit trail)
-- ============================================

CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_item_id UUID REFERENCES stock_items(id) ON DELETE SET NULL,
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE SET NULL,
  movement_type stock_movement_type NOT NULL,
  quantity DECIMAL(10,2) NOT NULL, -- Positive for in, negative for out
  previous_quantity DECIMAL(10,2) NOT NULL,
  new_quantity DECIMAL(10,2) NOT NULL,
  reference_id UUID, -- Order ID or request ID
  reference_type TEXT, -- 'order', 'request', 'manual'
  note TEXT,
  performed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT stock_movement_target CHECK (stock_item_id IS NOT NULL OR ingredient_id IS NOT NULL)
);

-- ============================================
-- Functions
-- ============================================

-- Calculate ingredient cost for a menu item
CREATE OR REPLACE FUNCTION calculate_item_cost(p_menu_item_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_total_cost DECIMAL(10,2);
BEGIN
  SELECT COALESCE(SUM(ri.quantity_used * i.price_per_unit), 0)
  INTO v_total_cost
  FROM recipe_ingredients ri
  JOIN ingredients i ON i.id = ri.ingredient_id
  WHERE ri.menu_item_id = p_menu_item_id;

  RETURN ROUND(v_total_cost)::INTEGER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrement stock for an order (drinks/desserts)
CREATE OR REPLACE FUNCTION decrement_stock_for_order(p_order_id UUID, p_performed_by UUID)
RETURNS VOID AS $$
DECLARE
  v_order_item RECORD;
  v_stock_item RECORD;
  v_new_qty DECIMAL(10,2);
BEGIN
  -- Loop through order items
  FOR v_order_item IN
    SELECT oi.menu_item_id, oi.quantity
    FROM order_items oi
    WHERE oi.order_id = p_order_id AND oi.menu_item_id IS NOT NULL
  LOOP
    -- Check if this menu item has a stock item (drinks/desserts)
    SELECT si.* INTO v_stock_item
    FROM stock_items si
    WHERE si.menu_item_id = v_order_item.menu_item_id AND si.is_active = true;

    IF v_stock_item.id IS NOT NULL THEN
      -- Calculate new quantity
      v_new_qty := v_stock_item.current_quantity - v_order_item.quantity;

      -- Update stock
      UPDATE stock_items
      SET current_quantity = GREATEST(0, v_new_qty)
      WHERE id = v_stock_item.id;

      -- Log movement
      INSERT INTO stock_movements (
        stock_item_id, movement_type, quantity,
        previous_quantity, new_quantity,
        reference_id, reference_type, performed_by
      ) VALUES (
        v_stock_item.id, 'sale', -v_order_item.quantity,
        v_stock_item.current_quantity, GREATEST(0, v_new_qty),
        p_order_id, 'order', p_performed_by
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Process ingredient request (approve/reject)
CREATE OR REPLACE FUNCTION process_ingredient_request(
  p_request_id UUID,
  p_status request_status,
  p_approver_id UUID,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_request RECORD;
  v_ingredient RECORD;
  v_new_qty DECIMAL(10,2);
BEGIN
  -- Get request details
  SELECT * INTO v_request FROM ingredient_requests WHERE id = p_request_id;

  IF v_request IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  IF v_request.status != 'pending' THEN
    RAISE EXCEPTION 'Request already processed';
  END IF;

  -- Update request status
  UPDATE ingredient_requests
  SET status = p_status,
      approved_by = p_approver_id,
      approved_at = CASE WHEN p_status = 'approved' THEN now() ELSE NULL END,
      rejection_reason = p_rejection_reason,
      updated_at = now()
  WHERE id = p_request_id;

  -- If approved, deduct from ingredient stock
  IF p_status = 'approved' THEN
    SELECT * INTO v_ingredient FROM ingredients WHERE id = v_request.ingredient_id;

    v_new_qty := v_ingredient.current_quantity - v_request.quantity;

    UPDATE ingredients
    SET current_quantity = GREATEST(0, v_new_qty)
    WHERE id = v_ingredient.id;

    -- Log movement
    INSERT INTO stock_movements (
      ingredient_id, movement_type, quantity,
      previous_quantity, new_quantity,
      reference_id, reference_type, performed_by
    ) VALUES (
      v_ingredient.id, 'request', -v_request.quantity,
      v_ingredient.current_quantity, GREATEST(0, v_new_qty),
      p_request_id, 'request', p_approver_id
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get low stock items
CREATE OR REPLACE FUNCTION get_low_stock_items()
RETURNS TABLE(
  item_type TEXT,
  item_id UUID,
  name TEXT,
  current_quantity DECIMAL(10,2),
  min_threshold DECIMAL(10,2),
  unit stock_unit
) AS $$
BEGIN
  RETURN QUERY
  SELECT 'stock'::TEXT, si.id, si.name, si.current_quantity, si.min_threshold, si.unit
  FROM stock_items si
  WHERE si.is_active = true AND si.current_quantity <= si.min_threshold
  UNION ALL
  SELECT 'ingredient'::TEXT, i.id, i.name, i.current_quantity, i.min_threshold, i.unit
  FROM ingredients i
  WHERE i.is_active = true AND i.current_quantity <= i.min_threshold
  ORDER BY current_quantity ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Triggers
-- ============================================

CREATE TRIGGER update_stock_items_updated_at
  BEFORE UPDATE ON stock_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_ingredients_updated_at
  BEFORE UPDATE ON ingredients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_recipe_ingredients_updated_at
  BEFORE UPDATE ON recipe_ingredients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_ingredient_requests_updated_at
  BEFORE UPDATE ON ingredient_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Stock Items
CREATE POLICY "Staff read stock items" ON stock_items
  FOR SELECT USING (is_staff());
CREATE POLICY "Managers manage stock items" ON stock_items
  FOR ALL USING (is_manager());

-- Ingredients
CREATE POLICY "Staff read ingredients" ON ingredients
  FOR SELECT USING (is_staff());
CREATE POLICY "Managers manage ingredients" ON ingredients
  FOR ALL USING (is_manager());

-- Recipe Ingredients
CREATE POLICY "Staff read recipes" ON recipe_ingredients
  FOR SELECT USING (is_staff());
CREATE POLICY "Managers manage recipes" ON recipe_ingredients
  FOR ALL USING (is_manager());

-- Ingredient Requests
CREATE POLICY "Staff read requests" ON ingredient_requests
  FOR SELECT USING (is_staff());
CREATE POLICY "Chef create requests" ON ingredient_requests
  FOR INSERT WITH CHECK (user_has_role(ARRAY['admin', 'super_admin', 'chef']::user_role[]));
CREATE POLICY "Managers process requests" ON ingredient_requests
  FOR UPDATE USING (is_manager());

-- Stock Movements
CREATE POLICY "Staff read movements" ON stock_movements
  FOR SELECT USING (is_staff());
CREATE POLICY "System insert movements" ON stock_movements
  FOR INSERT WITH CHECK (true);

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX idx_stock_items_menu ON stock_items(menu_item_id);
CREATE INDEX idx_stock_items_low ON stock_items(current_quantity, min_threshold) WHERE is_active = true;
CREATE INDEX idx_ingredients_low ON ingredients(current_quantity, min_threshold) WHERE is_active = true;
CREATE INDEX idx_recipe_ingredients_menu ON recipe_ingredients(menu_item_id);
CREATE INDEX idx_recipe_ingredients_ingredient ON recipe_ingredients(ingredient_id);
CREATE INDEX idx_ingredient_requests_status ON ingredient_requests(status);
CREATE INDEX idx_ingredient_requests_by ON ingredient_requests(requested_by);
CREATE INDEX idx_stock_movements_date ON stock_movements(created_at DESC);
CREATE INDEX idx_stock_movements_stock ON stock_movements(stock_item_id);
CREATE INDEX idx_stock_movements_ingredient ON stock_movements(ingredient_id);

-- ============================================
-- Seed Data - Sample Ingredients
-- ============================================

INSERT INTO ingredients (name, description, current_quantity, unit, price_per_unit, min_threshold, supplier) VALUES
  ('Riz brise', 'Riz pour tchiep', 50, 'kg', 500, 10, 'Marche Adjame'),
  ('Poisson Thiof', 'Poisson frais', 20, 'kg', 3500, 5, 'Port de peche'),
  ('Poulet entier', 'Poulet ferme', 30, 'piece', 3000, 5, 'Ferme locale'),
  ('Oignon', 'Oignon rouge', 25, 'kg', 400, 5, 'Marche'),
  ('Tomate fraiche', 'Tomate locale', 15, 'kg', 600, 3, 'Marche'),
  ('Concentre de tomate', 'Double concentre', 20, 'unit', 1200, 5, 'Supermarche'),
  ('Huile vegetale', 'Huile de cuisson', 30, 'l', 1500, 5, 'Supermarche'),
  ('Piment', 'Piment frais', 5, 'kg', 800, 1, 'Marche'),
  ('Ail', 'Ail frais', 3, 'kg', 2000, 0.5, 'Marche'),
  ('Cube Maggi', 'Assaisonnement', 100, 'unit', 50, 20, 'Supermarche'),
  ('Sel', 'Sel de cuisine', 10, 'kg', 300, 2, 'Supermarche'),
  ('Persil', 'Persil frais', 2, 'kg', 1500, 0.5, 'Marche'),
  ('Carotte', 'Carotte fraiche', 10, 'kg', 500, 2, 'Marche'),
  ('Chou', 'Chou vert', 15, 'piece', 500, 3, 'Marche'),
  ('Aubergine', 'Aubergine africaine', 8, 'kg', 600, 2, 'Marche');
