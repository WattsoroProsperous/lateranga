-- ============================================
-- La Teranga - Enhanced Role System
-- ============================================

-- Add new roles to the enum
-- Note: PostgreSQL doesn't allow removing enum values, only adding
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'cashier';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'chef';

-- Function to check if user has any of the specified roles (using TEXT to avoid enum transaction issues)
CREATE OR REPLACE FUNCTION user_has_role(required_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role::TEXT = ANY(required_roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is staff (any non-customer role)
CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role::TEXT IN ('admin', 'super_admin', 'cashier', 'chef')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can manage (admin-level)
CREATE OR REPLACE FUNCTION is_manager()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role::TEXT IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing admin policies to include super_admin
-- Drop and recreate policies that need updating

-- Profiles policies
DROP POLICY IF EXISTS "Admins full access profiles" ON profiles;
CREATE POLICY "Managers full access profiles" ON profiles
  FOR ALL USING (is_manager());

-- Menu Categories policies
DROP POLICY IF EXISTS "Admins full access categories" ON menu_categories;
CREATE POLICY "Managers full access categories" ON menu_categories
  FOR ALL USING (is_manager());

-- Menu Items policies
DROP POLICY IF EXISTS "Admins full access items" ON menu_items;
CREATE POLICY "Managers full access items" ON menu_items
  FOR ALL USING (is_manager());
CREATE POLICY "Staff read all items" ON menu_items
  FOR SELECT USING (is_staff());

-- Orders policies
DROP POLICY IF EXISTS "Admins full access orders" ON orders;
CREATE POLICY "Staff read all orders" ON orders
  FOR SELECT USING (is_staff());
CREATE POLICY "Cashier manage orders" ON orders
  FOR ALL USING (user_has_role(ARRAY['admin', 'super_admin', 'cashier']));
CREATE POLICY "Chef update order status" ON orders
  FOR UPDATE USING (user_has_role(ARRAY['chef']));

-- Order Items policies
DROP POLICY IF EXISTS "Admins full access order items" ON order_items;
CREATE POLICY "Staff read all order items" ON order_items
  FOR SELECT USING (is_staff());
CREATE POLICY "Staff manage order items" ON order_items
  FOR ALL USING (user_has_role(ARRAY['admin', 'super_admin', 'cashier']));

-- Order Status History policies
DROP POLICY IF EXISTS "Admins read status history" ON order_status_history;
CREATE POLICY "Staff read status history" ON order_status_history
  FOR SELECT USING (is_staff());

-- Reviews policies
DROP POLICY IF EXISTS "Admins full access reviews" ON reviews;
CREATE POLICY "Managers full access reviews" ON reviews
  FOR ALL USING (is_manager());

-- Gallery Images policies
DROP POLICY IF EXISTS "Admins full access gallery" ON gallery_images;
CREATE POLICY "Managers full access gallery" ON gallery_images
  FOR ALL USING (is_manager());

-- Restaurant Settings policies
DROP POLICY IF EXISTS "Admins update settings" ON restaurant_settings;
CREATE POLICY "Managers update settings" ON restaurant_settings
  FOR ALL USING (is_manager());

-- Storage policies
DROP POLICY IF EXISTS "Admins upload images" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete images" ON storage.objects;
CREATE POLICY "Staff upload images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'images'
    AND is_staff()
  );
CREATE POLICY "Managers delete images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'images'
    AND is_manager()
  );
