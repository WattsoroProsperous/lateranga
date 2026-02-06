-- ============================================
-- La Teranga - Profit Tracking & Stock Auto-Deduction
-- Migration 008
-- ============================================

-- ============================================
-- 1. Add ingredient_type to ingredients table
-- (weighable for vegetables that need to be weighed, unit for items like oil bottles)
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ingredients' AND column_name = 'ingredient_type'
  ) THEN
    ALTER TABLE ingredients ADD COLUMN ingredient_type TEXT DEFAULT 'unit'
      CHECK (ingredient_type IN ('unit', 'weighable'));
  END IF;
END $$;

-- Update existing vegetable-type ingredients to 'weighable'
UPDATE ingredients SET ingredient_type = 'weighable'
WHERE unit IN ('kg', 'g')
  AND name ILIKE ANY(ARRAY['%oignon%', '%tomate%', '%carotte%', '%chou%', '%aubergine%', '%piment%', '%ail%', '%persil%']);

-- ============================================
-- 2. Daily Summaries Table (for aggregated data and fast queries)
-- ============================================

CREATE TABLE IF NOT EXISTS daily_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  total_revenue INTEGER NOT NULL DEFAULT 0,
  total_cost INTEGER NOT NULL DEFAULT 0,
  total_profit INTEGER NOT NULL DEFAULT 0,
  total_orders INTEGER NOT NULL DEFAULT 0,
  -- By category breakdown (JSONB for flexibility)
  revenue_by_category JSONB NOT NULL DEFAULT '{}',
  cost_by_category JSONB NOT NULL DEFAULT '{}',
  -- Peak hours analysis (hour 0-23 -> order count)
  orders_by_hour JSONB NOT NULL DEFAULT '{}',
  -- Top selling items [{name, quantity, revenue}]
  top_items JSONB NOT NULL DEFAULT '[]',
  -- Stock cost breakdown
  stock_items_cost INTEGER NOT NULL DEFAULT 0,  -- Cost of beverages/desserts sold
  ingredients_cost INTEGER NOT NULL DEFAULT 0,   -- Cost of ingredients used
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fast date queries
CREATE INDEX IF NOT EXISTS idx_daily_summaries_date ON daily_summaries(date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_summaries_month ON daily_summaries(date_trunc('month', date));

-- RLS
ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers read daily summaries" ON daily_summaries
  FOR SELECT USING (is_manager());
CREATE POLICY "System manage daily summaries" ON daily_summaries
  FOR ALL USING (is_manager());

-- ============================================
-- 3. Order Cost Tracking - Add cost fields to orders table
-- ============================================

DO $$
BEGIN
  -- Add total_cost column to track the cost of each order
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'total_cost'
  ) THEN
    ALTER TABLE orders ADD COLUMN total_cost INTEGER DEFAULT 0;
  END IF;

  -- Add profit column for quick access
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'profit'
  ) THEN
    ALTER TABLE orders ADD COLUMN profit INTEGER DEFAULT 0;
  END IF;
END $$;

-- ============================================
-- 4. Calculate order cost function
-- Calculates cost based on:
-- - Stock items (beverages/desserts): uses cost_per_unit
-- - Menu items with recipes: uses recipe_ingredients
-- ============================================

CREATE OR REPLACE FUNCTION calculate_order_cost(p_order_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_total_cost INTEGER := 0;
  v_item RECORD;
  v_stock_cost INTEGER;
  v_recipe_cost INTEGER;
BEGIN
  -- Loop through order items
  FOR v_item IN
    SELECT
      oi.menu_item_id,
      oi.quantity,
      oi.item_name
    FROM order_items oi
    WHERE oi.order_id = p_order_id
  LOOP
    -- Skip items without menu_item_id (custom items)
    IF v_item.menu_item_id IS NULL THEN
      CONTINUE;
    END IF;

    -- Check if this menu item is a stock item (beverage/dessert)
    SELECT COALESCE(si.cost_per_unit, 0) INTO v_stock_cost
    FROM stock_items si
    WHERE si.menu_item_id = v_item.menu_item_id AND si.is_active = true;

    IF v_stock_cost > 0 THEN
      -- Add stock item cost
      v_total_cost := v_total_cost + (v_stock_cost * v_item.quantity);
    ELSE
      -- Check recipe ingredients cost
      SELECT COALESCE(SUM(ri.quantity_used * i.price_per_unit), 0)::INTEGER INTO v_recipe_cost
      FROM recipe_ingredients ri
      JOIN ingredients i ON i.id = ri.ingredient_id
      WHERE ri.menu_item_id = v_item.menu_item_id;

      v_total_cost := v_total_cost + (v_recipe_cost * v_item.quantity);
    END IF;
  END LOOP;

  RETURN v_total_cost;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. Trigger function: Auto-deduct stock when order is paid
-- ============================================

CREATE OR REPLACE FUNCTION on_order_paid()
RETURNS TRIGGER AS $$
DECLARE
  v_order_cost INTEGER;
  v_user_id UUID;
BEGIN
  -- Only trigger when payment_status changes to 'paid'
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid') THEN

    -- Get the user who validated the payment
    v_user_id := COALESCE(NEW.validated_by, auth.uid());

    -- Call the existing stock deduction function
    PERFORM decrement_stock_for_order(NEW.id, v_user_id);

    -- Calculate and store order cost
    v_order_cost := calculate_order_cost(NEW.id);

    -- Update order with cost and profit
    UPDATE orders
    SET total_cost = v_order_cost,
        profit = NEW.total - v_order_cost
    WHERE id = NEW.id;

    -- Update daily summary (upsert)
    PERFORM update_daily_summary(NEW.paid_at::date, NEW.total, v_order_cost, NEW.id);

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_order_paid ON orders;
CREATE TRIGGER trigger_order_paid
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION on_order_paid();

-- Also handle POS orders that are created as already paid
CREATE OR REPLACE FUNCTION on_order_created_paid()
RETURNS TRIGGER AS $$
DECLARE
  v_order_cost INTEGER;
  v_user_id UUID;
BEGIN
  -- Only trigger for orders created with payment_status = 'paid' (POS orders)
  IF NEW.payment_status = 'paid' THEN
    v_user_id := auth.uid();

    -- Call stock deduction
    PERFORM decrement_stock_for_order(NEW.id, v_user_id);

    -- Calculate cost
    v_order_cost := calculate_order_cost(NEW.id);

    -- Update order with cost and profit
    UPDATE orders
    SET total_cost = v_order_cost,
        profit = NEW.total - v_order_cost
    WHERE id = NEW.id;

    -- Update daily summary
    PERFORM update_daily_summary(COALESCE(NEW.paid_at::date, CURRENT_DATE), NEW.total, v_order_cost, NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_order_created_paid ON orders;
CREATE TRIGGER trigger_order_created_paid
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION on_order_created_paid();

-- ============================================
-- 6. Update daily summary function
-- ============================================

CREATE OR REPLACE FUNCTION update_daily_summary(
  p_date DATE,
  p_revenue INTEGER,
  p_cost INTEGER,
  p_order_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_hour INTEGER;
  v_current_hours JSONB;
  v_hour_count INTEGER;
BEGIN
  -- Get the hour of the order for peak analysis
  SELECT EXTRACT(HOUR FROM created_at)::INTEGER INTO v_hour
  FROM orders WHERE id = p_order_id;

  -- Upsert daily summary
  INSERT INTO daily_summaries (
    date,
    total_revenue,
    total_cost,
    total_profit,
    total_orders,
    orders_by_hour
  ) VALUES (
    p_date,
    p_revenue,
    p_cost,
    p_revenue - p_cost,
    1,
    jsonb_build_object(v_hour::text, 1)
  )
  ON CONFLICT (date) DO UPDATE SET
    total_revenue = daily_summaries.total_revenue + p_revenue,
    total_cost = daily_summaries.total_cost + p_cost,
    total_profit = daily_summaries.total_profit + (p_revenue - p_cost),
    total_orders = daily_summaries.total_orders + 1,
    orders_by_hour = (
      SELECT jsonb_object_agg(
        COALESCE(k, v_hour::text),
        CASE
          WHEN k = v_hour::text THEN (COALESCE((daily_summaries.orders_by_hour->>k)::int, 0) + 1)
          WHEN k IS NOT NULL THEN (daily_summaries.orders_by_hour->>k)::int
          ELSE 1
        END
      )
      FROM (
        SELECT DISTINCT k
        FROM (
          SELECT jsonb_object_keys(COALESCE(daily_summaries.orders_by_hour, '{}'::jsonb)) as k
          UNION SELECT v_hour::text
        ) keys
      ) all_keys
    ),
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. Chef withdrawal function (immediate deduction, no approval needed)
-- ============================================

CREATE OR REPLACE FUNCTION chef_withdraw_ingredient(
  p_ingredient_id UUID,
  p_quantity DECIMAL(10,2),
  p_note TEXT DEFAULT NULL,
  p_performed_by UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_ingredient RECORD;
  v_new_qty DECIMAL(10,2);
  v_user_id UUID;
BEGIN
  v_user_id := COALESCE(p_performed_by, auth.uid());

  -- Get current ingredient data
  SELECT * INTO v_ingredient FROM ingredients WHERE id = p_ingredient_id AND is_active = true;

  IF v_ingredient IS NULL THEN
    RAISE EXCEPTION 'Ingredient not found or inactive';
  END IF;

  -- Calculate new quantity
  v_new_qty := GREATEST(0, v_ingredient.current_quantity - p_quantity);

  -- Update ingredient stock
  UPDATE ingredients
  SET current_quantity = v_new_qty,
      updated_at = now()
  WHERE id = p_ingredient_id;

  -- Log movement
  INSERT INTO stock_movements (
    ingredient_id,
    movement_type,
    quantity,
    previous_quantity,
    new_quantity,
    reference_type,
    note,
    performed_by
  ) VALUES (
    p_ingredient_id,
    'request',
    -p_quantity,
    v_ingredient.current_quantity,
    v_new_qty,
    'chef_withdrawal',
    COALESCE(p_note, 'Retrait cuisine'),
    v_user_id
  );

  -- Check low stock and notify if needed
  IF v_new_qty <= v_ingredient.min_threshold THEN
    INSERT INTO notifications (
      type,
      title,
      message,
      data,
      target_roles
    ) VALUES (
      'low_stock',
      'Stock bas: ' || v_ingredient.name,
      'Le stock de ' || v_ingredient.name || ' est bas (' || v_new_qty || ' ' || v_ingredient.unit || ' restant)',
      jsonb_build_object(
        'ingredient_id', p_ingredient_id,
        'ingredient_name', v_ingredient.name,
        'current_quantity', v_new_qty,
        'min_threshold', v_ingredient.min_threshold,
        'unit', v_ingredient.unit
      ),
      ARRAY['admin', 'super_admin']::user_role[]
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. Get profit analytics functions
-- ============================================

-- Daily profit for the last N days
CREATE OR REPLACE FUNCTION get_daily_profit(p_days INTEGER DEFAULT 30)
RETURNS TABLE(
  date DATE,
  revenue INTEGER,
  cost INTEGER,
  profit INTEGER,
  orders INTEGER,
  profit_margin DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ds.date,
    ds.total_revenue,
    ds.total_cost,
    ds.total_profit,
    ds.total_orders,
    CASE
      WHEN ds.total_revenue > 0
      THEN ROUND((ds.total_profit::DECIMAL / ds.total_revenue * 100), 2)
      ELSE 0
    END as profit_margin
  FROM daily_summaries ds
  WHERE ds.date >= CURRENT_DATE - p_days
  ORDER BY ds.date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Peak hours analysis
CREATE OR REPLACE FUNCTION get_peak_hours_analysis(p_days INTEGER DEFAULT 30)
RETURNS TABLE(
  hour INTEGER,
  total_orders INTEGER,
  avg_orders_per_day DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH hourly_data AS (
    SELECT
      (key)::INTEGER as hour_num,
      SUM((value)::INTEGER) as total
    FROM daily_summaries ds,
         jsonb_each_text(ds.orders_by_hour)
    WHERE ds.date >= CURRENT_DATE - p_days
    GROUP BY key
  )
  SELECT
    hd.hour_num,
    hd.total::INTEGER,
    ROUND(hd.total::DECIMAL / NULLIF(p_days, 0), 2)
  FROM hourly_data hd
  ORDER BY hd.hour_num;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Item profit margins
CREATE OR REPLACE FUNCTION get_item_profit_margins()
RETURNS TABLE(
  item_id UUID,
  item_name TEXT,
  category_name TEXT,
  sale_price INTEGER,
  cost_price INTEGER,
  profit INTEGER,
  profit_margin DECIMAL(5,2),
  total_sold INTEGER,
  total_revenue INTEGER,
  total_profit INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH item_costs AS (
    -- Stock items (beverages/desserts)
    SELECT
      mi.id as menu_item_id,
      mi.name as item_name,
      mc.name as cat_name,
      mi.price as sale_price,
      COALESCE(si.cost_per_unit, 0) as cost_price
    FROM menu_items mi
    JOIN menu_categories mc ON mc.id = mi.category_id
    LEFT JOIN stock_items si ON si.menu_item_id = mi.id AND si.is_active = true
    WHERE mc.tab IN ('boissons', 'desserts')

    UNION ALL

    -- Dishes with recipe costs
    SELECT
      mi.id as menu_item_id,
      mi.name as item_name,
      mc.name as cat_name,
      mi.price as sale_price,
      COALESCE(calculate_item_cost(mi.id), 0) as cost_price
    FROM menu_items mi
    JOIN menu_categories mc ON mc.id = mi.category_id
    WHERE mc.tab = 'plats'
  ),
  sales_data AS (
    SELECT
      oi.menu_item_id,
      SUM(oi.quantity)::INTEGER as qty_sold,
      SUM(oi.line_total)::INTEGER as revenue
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.payment_status = 'paid'
      AND o.deleted_at IS NULL
      AND oi.menu_item_id IS NOT NULL
    GROUP BY oi.menu_item_id
  )
  SELECT
    ic.menu_item_id,
    ic.item_name,
    ic.cat_name,
    ic.sale_price,
    ic.cost_price,
    (ic.sale_price - ic.cost_price) as profit,
    CASE
      WHEN ic.sale_price > 0
      THEN ROUND(((ic.sale_price - ic.cost_price)::DECIMAL / ic.sale_price * 100), 2)
      ELSE 0
    END as profit_margin,
    COALESCE(sd.qty_sold, 0) as total_sold,
    COALESCE(sd.revenue, 0) as total_revenue,
    COALESCE(sd.qty_sold * (ic.sale_price - ic.cost_price), 0) as total_profit
  FROM item_costs ic
  LEFT JOIN sales_data sd ON sd.menu_item_id = ic.menu_item_id
  ORDER BY total_profit DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 9. Stock alerts with notification trigger
-- ============================================

-- Enhanced low stock check function
CREATE OR REPLACE FUNCTION check_and_notify_low_stock()
RETURNS TABLE(
  item_type TEXT,
  item_id UUID,
  name TEXT,
  current_quantity DECIMAL(10,2),
  min_threshold DECIMAL(10,2),
  unit TEXT,
  needs_restock BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  -- Stock items (beverages/desserts)
  SELECT
    'stock_item'::TEXT,
    si.id,
    si.name,
    si.current_quantity,
    si.min_threshold,
    si.unit::TEXT,
    (si.current_quantity <= si.min_threshold) as needs_restock
  FROM stock_items si
  WHERE si.is_active = true

  UNION ALL

  -- Ingredients
  SELECT
    'ingredient'::TEXT,
    i.id,
    i.name,
    i.current_quantity,
    i.min_threshold,
    i.unit::TEXT,
    (i.current_quantity <= i.min_threshold) as needs_restock
  FROM ingredients i
  WHERE i.is_active = true

  ORDER BY needs_restock DESC, current_quantity ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 10. Additional indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_orders_paid_date ON orders(paid_at) WHERE payment_status = 'paid';
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date_type ON stock_movements(created_at DESC, movement_type);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item ON order_items(menu_item_id) WHERE menu_item_id IS NOT NULL;

-- ============================================
-- 11. Update trigger for daily_summaries
-- ============================================

CREATE TRIGGER update_daily_summaries_updated_at
  BEFORE UPDATE ON daily_summaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 12. Grant permissions
-- ============================================

-- Grant execute on new functions
GRANT EXECUTE ON FUNCTION calculate_order_cost(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION chef_withdraw_ingredient(UUID, DECIMAL, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_profit(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_peak_hours_analysis(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_item_profit_margins() TO authenticated;
GRANT EXECUTE ON FUNCTION check_and_notify_low_stock() TO authenticated;
GRANT EXECUTE ON FUNCTION update_daily_summary(DATE, INTEGER, INTEGER, UUID) TO authenticated;
