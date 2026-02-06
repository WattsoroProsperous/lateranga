-- ============================================
-- La Teranga - Seed Data
-- ============================================

-- ============================================
-- Admin User (for local development)
-- Email: admin@lateranga.ci
-- Password: Admin1234
-- ============================================

-- Create admin user in auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change,
  email_change_token_new,
  email_change_token_current,
  phone_change,
  phone_change_token,
  reauthentication_token,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'admin@lateranga.ci',
  '$2a$06$D61ZoYHcBCahpbPRwneLVucIkbKGZ0o/L9tebClhWoL8PGCToPLpa', -- Admin1234
  NOW(),
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Admin La Teranga"}',
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Create admin identity
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  '{"sub":"a0000000-0000-0000-0000-000000000001","email":"admin@lateranga.ci","email_verified":true}',
  'email',
  'admin@lateranga.ci',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create admin profile
INSERT INTO profiles (id, full_name, role)
VALUES ('a0000000-0000-0000-0000-000000000001', 'Admin La Teranga', 'admin')
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- ============================================
-- Cashier User (for local development)
-- Email: caisse@lateranga.ci
-- Password: Caisse1234
-- ============================================

-- Create cashier user in auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change,
  email_change_token_new,
  email_change_token_current,
  phone_change,
  phone_change_token,
  reauthentication_token,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud
) VALUES (
  'a0000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'caisse@lateranga.ci',
  '$2a$06$OVAgKmh3KR01cY3ewp1bJO1QyA0RkDGR1POnYhygGMJj/HUTRascu', -- Caisse1234
  NOW(),
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Caissiere La Teranga"}',
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Create cashier identity
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000002',
  '{"sub":"a0000000-0000-0000-0000-000000000002","email":"caisse@lateranga.ci","email_verified":true}',
  'email',
  'caisse@lateranga.ci',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create cashier profile
INSERT INTO profiles (id, full_name, phone, role)
VALUES ('a0000000-0000-0000-0000-000000000002', 'Aminata Diallo', '+22507 11 11 11 11', 'cashier')
ON CONFLICT (id) DO UPDATE SET role = 'cashier';

-- ============================================
-- Chef User (for local development)
-- Email: cuisine@lateranga.ci
-- Password: Chef1234
-- ============================================

-- Create chef user in auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change,
  email_change_token_new,
  email_change_token_current,
  phone_change,
  phone_change_token,
  reauthentication_token,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud
) VALUES (
  'a0000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'cuisine@lateranga.ci',
  '$2a$06$37d4inNvZLvenOg/OZUSleUbqNBxS2VdJFvGuKg2oy2YXZo1f2636', -- Chef1234
  NOW(),
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Chef La Teranga"}',
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Create chef identity
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  'a0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000003',
  '{"sub":"a0000000-0000-0000-0000-000000000003","email":"cuisine@lateranga.ci","email_verified":true}',
  'email',
  'cuisine@lateranga.ci',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create chef profile
INSERT INTO profiles (id, full_name, phone, role)
VALUES ('a0000000-0000-0000-0000-000000000003', 'Mamadou Ndiaye', '+22507 22 22 22 22', 'chef')
ON CONFLICT (id) DO UPDATE SET role = 'chef';

-- ============================================
-- Menu Categories (8 categories)
-- ============================================

INSERT INTO menu_categories (id, name, slug, tab, description, sort_order) VALUES
  ('c0000001-0000-0000-0000-000000000001', 'Nos Tchieps', 'tchieps', 'plats', NULL, 1),
  ('c0000001-0000-0000-0000-000000000002', 'Nos Grillardes', 'grillardes', 'plats', NULL, 2),
  ('c0000001-0000-0000-0000-000000000003', 'Menu Général', 'menu-general', 'plats', NULL, 3),
  ('c0000001-0000-0000-0000-000000000004', 'Menus sur Commande', 'menus-sur-commande', 'plats', NULL, 4),
  ('c0000001-0000-0000-0000-000000000005', 'Nos Desserts', 'desserts', 'desserts', NULL, 5),
  ('c0000001-0000-0000-0000-000000000006', 'Jus Naturels', 'jus-naturels', 'boissons', 'Petit / Grand Format', 6),
  ('c0000001-0000-0000-0000-000000000007', 'Autres Boissons', 'autres-boissons', 'boissons', NULL, 7),
  ('c0000001-0000-0000-0000-000000000008', 'Thé Ataya', 'the-ataya', 'boissons', 'Le célèbre thé sénégalais à la menthe', 8);

-- ============================================
-- Menu Items (51 items)
-- ============================================

-- Tchieps (5)
INSERT INTO menu_items (legacy_id, category_id, name, slug, price, sort_order) VALUES
  ('t1', 'c0000001-0000-0000-0000-000000000001', 'Tcheip au poisson', 'tcheip-au-poisson', 5000, 1),
  ('t2', 'c0000001-0000-0000-0000-000000000001', 'Tcheip au poulet', 'tcheip-au-poulet', 5000, 2),
  ('t3', 'c0000001-0000-0000-0000-000000000001', 'Tcheip au mouton', 'tcheip-au-mouton', 5000, 3),
  ('t4', 'c0000001-0000-0000-0000-000000000001', 'Tcheip mechoui', 'tcheip-mechoui', 6000, 4),
  ('t5', 'c0000001-0000-0000-0000-000000000001', 'Tcheip Teranga', 'tcheip-teranga', 6000, 5);

UPDATE menu_items SET description = 'Notre spécialité maison', is_featured = true WHERE legacy_id = 't5';

-- Grillardes (11)
INSERT INTO menu_items (legacy_id, category_id, name, slug, price, sort_order) VALUES
  ('g1', 'c0000001-0000-0000-0000-000000000002', 'Poulet pané', 'poulet-pane', 6000, 1),
  ('g2', 'c0000001-0000-0000-0000-000000000002', 'Poissons braisés', 'poissons-braises', 6000, 2),
  ('g3', 'c0000001-0000-0000-0000-000000000002', 'Poulet braisé', 'poulet-braise', 6000, 3),
  ('g4', 'c0000001-0000-0000-0000-000000000002', 'Brochette de filet', 'brochette-de-filet', 6000, 4),
  ('g5', 'c0000001-0000-0000-0000-000000000002', 'Salade de poulet', 'salade-de-poulet', 6000, 5),
  ('g6', 'c0000001-0000-0000-0000-000000000002', 'Crudité simple', 'crudite-simple', 4000, 6),
  ('g7', 'c0000001-0000-0000-0000-000000000002', 'Frite au poulet', 'frite-au-poulet', 6000, 7),
  ('g8', 'c0000001-0000-0000-0000-000000000002', 'Sauté de Gambas', 'saute-de-gambas', 6000, 8),
  ('g9', 'c0000001-0000-0000-0000-000000000002', 'Roulade de filet', 'roulade-de-filet', 6000, 9),
  ('g10', 'c0000001-0000-0000-0000-000000000002', 'Blanc de poulet au jambon', 'blanc-de-poulet-au-jambon', 6000, 10),
  ('g11', 'c0000001-0000-0000-0000-000000000002', 'Poisson frite', 'poisson-frite-grillardes', 7000, 11);

-- Menu Général (11)
INSERT INTO menu_items (legacy_id, category_id, name, slug, price, sort_order) VALUES
  ('m1', 'c0000001-0000-0000-0000-000000000003', 'Gouagouassou', 'gouagouassou', 5000, 1),
  ('m2', 'c0000001-0000-0000-0000-000000000003', 'Soupe de poisson', 'soupe-de-poisson', 5000, 2),
  ('m3', 'c0000001-0000-0000-0000-000000000003', 'Soupe de mouton', 'soupe-de-mouton', 6000, 3),
  ('m4', 'c0000001-0000-0000-0000-000000000003', 'Kédjenou de poulet', 'kedjenou-de-poulet', 5000, 4),
  ('m5', 'c0000001-0000-0000-0000-000000000003', 'Kédjenou de pintade', 'kedjenou-de-pintade', 6000, 5),
  ('m6', 'c0000001-0000-0000-0000-000000000003', 'Yassa poulet', 'yassa-poulet', 5000, 6),
  ('m7', 'c0000001-0000-0000-0000-000000000003', 'Yassa mouton', 'yassa-mouton', 6000, 7),
  ('m8', 'c0000001-0000-0000-0000-000000000003', 'Couscous poulet', 'couscous-poulet', 5000, 8),
  ('m9', 'c0000001-0000-0000-0000-000000000003', 'Couscous mouton', 'couscous-mouton', 6000, 9),
  ('m10', 'c0000001-0000-0000-0000-000000000003', 'Blanc de poulet au jambon', 'blanc-de-poulet-au-jambon-menu', 7000, 10),
  ('m11', 'c0000001-0000-0000-0000-000000000003', 'Poisson frite', 'poisson-frite-menu', 7000, 11);

-- Menus sur Commande (7)
INSERT INTO menu_items (legacy_id, category_id, name, slug, price, requires_order, sort_order) VALUES
  ('c1', 'c0000001-0000-0000-0000-000000000004', 'Brochette de Filet', 'brochette-de-filet-commande', 6000, true, 1),
  ('c2', 'c0000001-0000-0000-0000-000000000004', 'Brochette de poulet', 'brochette-de-poulet-commande', 6000, true, 2),
  ('c3', 'c0000001-0000-0000-0000-000000000004', 'Sauté de gambas au riz', 'saute-de-gambas-au-riz', 6000, true, 3),
  ('c4', 'c0000001-0000-0000-0000-000000000004', 'Mechoui', 'mechoui', 6000, true, 4),
  ('c5', 'c0000001-0000-0000-0000-000000000004', 'Poulet braisé', 'poulet-braise-commande', 6000, true, 5),
  ('c6', 'c0000001-0000-0000-0000-000000000004', 'Poisson braisé / Frite', 'poisson-braise-frite', 6000, true, 6),
  ('c7', 'c0000001-0000-0000-0000-000000000004', 'Sauté de gambas au frite', 'saute-de-gambas-au-frite', 6000, true, 7);

-- Desserts (2)
INSERT INTO menu_items (legacy_id, category_id, name, slug, price, sort_order) VALUES
  ('d1', 'c0000001-0000-0000-0000-000000000005', 'Salade de fruit', 'salade-de-fruit', 1000, 1),
  ('d2', 'c0000001-0000-0000-0000-000000000005', 'Cocktail de fruit', 'cocktail-de-fruit', 2000, 2);

-- Jus Naturels (9)
INSERT INTO menu_items (legacy_id, category_id, name, slug, price, price_small, sort_order) VALUES
  ('j1', 'c0000001-0000-0000-0000-000000000006', 'Jus de Gingembre', 'jus-de-gingembre', 2000, 500, 1),
  ('j2', 'c0000001-0000-0000-0000-000000000006', 'Jus de Passion', 'jus-de-passion', 2000, 500, 2),
  ('j3', 'c0000001-0000-0000-0000-000000000006', 'Jus de Baobab', 'jus-de-baobab', 2000, 500, 3),
  ('j4', 'c0000001-0000-0000-0000-000000000006', 'Jus de Tamarin', 'jus-de-tamarin', 2000, 500, 4),
  ('j5', 'c0000001-0000-0000-0000-000000000006', 'Jus de Citron', 'jus-de-citron', 2000, 500, 5),
  ('j6', 'c0000001-0000-0000-0000-000000000006', 'Jus de Bissap', 'jus-de-bissap', 2000, 500, 6),
  ('j7', 'c0000001-0000-0000-0000-000000000006', 'Cocktail de jus de fruit', 'cocktail-de-jus-de-fruit', 2000, 500, 7),
  ('j8', 'c0000001-0000-0000-0000-000000000006', 'Jus d''orange (nature)', 'jus-d-orange-nature', 1000, NULL, 8),
  ('j9', 'c0000001-0000-0000-0000-000000000006', 'Jus d''ananas', 'jus-d-ananas', 1000, NULL, 9);

-- Autres Boissons (5)
INSERT INTO menu_items (legacy_id, category_id, name, slug, price, sort_order) VALUES
  ('b1', 'c0000001-0000-0000-0000-000000000007', 'Eau Minérale (petite)', 'eau-minerale-petite', 500, 1),
  ('b2', 'c0000001-0000-0000-0000-000000000007', 'Eau Minérale (grande)', 'eau-minerale-grande', 1000, 2),
  ('b3', 'c0000001-0000-0000-0000-000000000007', 'Sucrerie', 'sucrerie', 500, 3),
  ('b4', 'c0000001-0000-0000-0000-000000000007', 'Petit café', 'petit-cafe', 1000, 4),
  ('b5', 'c0000001-0000-0000-0000-000000000007', 'Thé', 'the', 500, 5);

-- Thé Ataya (1)
INSERT INTO menu_items (legacy_id, category_id, name, slug, description, price, sort_order) VALUES
  ('b6', 'c0000001-0000-0000-0000-000000000008', 'Thé Ataya à la Menthe Fraîche', 'the-ataya-menthe', 'Préparation traditionnelle', 500, 1);

-- ============================================
-- Reviews (3 Google reviews)
-- ============================================

INSERT INTO reviews (author_name, author_initials, rating, text, source, is_local_guide, is_approved, is_featured) VALUES
  ('Francky KITOKO', 'FK', 4, 'La nourriture proposée par ce restaurant est à la fois variée et d''un bon rapport qualité-prix. La présentation des plats est soignée et le goût est remarquable ! Un sans faute.', 'google', false, true, true),
  ('Rafiou OYEOSSI', 'RO', 4, 'Très bon restaurant sénégalais. Le thiéboudienne est excellent, les portions sont généreuses et le service est rapide et aimable.', 'google', true, true, true),
  ('JP LH', 'JP', 4, 'Bon restaurant. Ambiance sympa. Le personnel est accueillant. Cuisine savoureuse et authentique. Je recommande le tcheip teranga, c''est une tuerie !', 'google', false, true, true);

-- ============================================
-- Gallery Images (6)
-- ============================================

INSERT INTO gallery_images (url, alt_text, image_type, is_large, sort_order, is_active) VALUES
  ('/images/hero.jpg', 'Restaurant La Teranga', 'hero', false, 0, true),
  ('/images/gallery-1.jpg', 'Plat sénégalais', 'gallery', true, 1, true),
  ('/images/gallery-2.jpg', 'Tcheip au poisson', 'gallery', false, 2, true),
  ('/images/gallery-3.jpg', 'Grillades variées', 'gallery', false, 3, true),
  ('/images/gallery-4.jpg', 'Ambiance du restaurant', 'gallery', false, 4, true),
  ('/images/gallery-5.png', 'Boissons naturelles', 'gallery', false, 5, true);

-- ============================================
-- Restaurant Settings
-- ============================================

INSERT INTO restaurant_settings (key, value, description) VALUES
  ('phone', '"+22507 00 00 00 00"', 'Numéro de téléphone principal'),
  ('address', '"Abidjan, Côte d''Ivoire"', 'Adresse du restaurant'),
  ('hours', '{"lundi_samedi": "07h00 - 22h00", "dimanche": "Fermé"}', 'Horaires d''ouverture'),
  ('services', '["Sur place", "À emporter", "Livraison"]', 'Services proposés'),
  ('google_rating', '{"score": 4.0, "count": 120}', 'Note Google'),
  ('whatsapp', '{"phone": "+2250143848821"}', 'Configuration WhatsApp'),
  ('social_links', '{"facebook": "https://facebook.com/lateranga", "instagram": "https://instagram.com/lateranga"}', 'Réseaux sociaux');
