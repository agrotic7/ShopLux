-- ============================================
-- MIGRATION: Mise à jour des prix pour le Sénégal (FCFA)
-- ============================================

-- ============================================
-- 1. MISE À JOUR DES PRODUITS EXISTANTS
-- ============================================

-- Mettre à jour les prix des produits existants en FCFA
UPDATE products 
SET 
  price = CASE 
    WHEN name = 'Smartphone Premium X1' THEN 450000
    WHEN name = 'Casque Audio Bluetooth' THEN 95000
    WHEN name = 'Montre Connectée Sport' THEN 125000
    WHEN name = 'T-Shirt Premium Cotton' THEN 15000
    ELSE price * 655.96 -- Conversion EUR vers FCFA pour les autres produits
  END,
  compare_at_price = CASE 
    WHEN name = 'Smartphone Premium X1' THEN 550000
    WHEN name = 'Casque Audio Bluetooth' THEN 150000
    WHEN name = 'Montre Connectée Sport' THEN 175000
    WHEN name = 'T-Shirt Premium Cotton' THEN 25000
    ELSE compare_at_price * 655.96 -- Conversion EUR vers FCFA pour les autres produits
  END
WHERE name IN (
  'Smartphone Premium X1',
  'Casque Audio Bluetooth', 
  'Montre Connectée Sport',
  'T-Shirt Premium Cotton'
);

-- ============================================
-- 2. MISE À JOUR DES COUPONS
-- ============================================

-- Mettre à jour les coupons pour des montants en FCFA
UPDATE coupons 
SET 
  min_purchase = CASE 
    WHEN code = 'WELCOME10' THEN 25000.00
    WHEN code = 'SAVE20' THEN 50000.00
    ELSE min_purchase * 655.96
  END,
  max_discount = CASE 
    WHEN code = 'WELCOME10' THEN 25000.00
    WHEN code = 'SAVE20' THEN 50000.00
    ELSE max_discount * 655.96
  END,
  value = CASE 
    WHEN code = 'FREESHIP' THEN 5000.00
    ELSE value * 655.96
  END
WHERE code IN ('WELCOME10', 'SAVE20', 'FREESHIP');

-- ============================================
-- 3. MISE À JOUR DES MÉTHODES DE LIVRAISON
-- ============================================

-- Mettre à jour les méthodes de livraison pour le Sénégal
UPDATE shipping_methods 
SET 
  price = price * 655.96, -- Conversion EUR vers FCFA
  free_shipping_threshold = CASE 
    WHEN free_shipping_threshold IS NOT NULL THEN free_shipping_threshold * 655.96
    ELSE 50000.00 -- 50 000 FCFA pour livraison gratuite
  END,
  countries = ARRAY['SN'] -- Sénégal uniquement
WHERE countries @> ARRAY['FR', 'BE', 'CH', 'LU'];

-- ============================================
-- 4. MISE À JOUR DES ADRESSES PAR DÉFAUT
-- ============================================

-- Mettre à jour le pays par défaut pour les nouvelles adresses
ALTER TABLE addresses 
ALTER COLUMN country SET DEFAULT 'Sénégal';

-- ============================================
-- 5. AJOUT DE NOUVEAUX PRODUITS SÉNÉGALAIS
-- ============================================

-- Ajouter des produits spécifiques au marché sénégalais
INSERT INTO products (name, slug, description, short_description, price, compare_at_price, sku, stock, images, category_id, brand, is_featured, is_new_arrival, is_best_seller, status) VALUES
('Sac à Main Artisanal', 'sac-main-artisanal', 'Sac à main en cuir artisanal du Sénégal', 'Cuir véritable, Fait main', 25000, 35000, 'SM-001', 30, 
 '[{"id": "1", "url": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600", "alt": "Sac artisanal", "isPrimary": true, "order": 1}]'::jsonb, 
 (SELECT id FROM categories WHERE slug = 'fashion'), 'ArtisanSénégal', TRUE, TRUE, FALSE, 'active'),

('Boubou Traditionnel', 'boubou-traditionnel', 'Boubou traditionnel sénégalais en coton', '100% coton, Coupe traditionnelle', 35000, 45000, 'BB-002', 25, 
 '[{"id": "1", "url": "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600", "alt": "Boubou", "isPrimary": true, "order": 1}]'::jsonb, 
 (SELECT id FROM categories WHERE slug = 'fashion'), 'TradSénégal', TRUE, FALSE, TRUE, 'active'),

('Bijoux Traditionnels', 'bijoux-traditionnels', 'Colliers et bracelets traditionnels', 'Perles colorées, Fait main', 12000, 18000, 'BJ-003', 50, 
 '[{"id": "1", "url": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600", "alt": "Bijoux", "isPrimary": true, "order": 1}]'::jsonb, 
 (SELECT id FROM categories WHERE slug = 'fashion'), 'BijouxSénégal', FALSE, TRUE, FALSE, 'active'),

('Huile de Baobab', 'huile-baobab', 'Huile de baobab pure du Sénégal', '100% naturelle, Cosmétique', 8000, 12000, 'HB-004', 100, 
 '[{"id": "1", "url": "https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=600", "alt": "Huile baobab", "isPrimary": true, "order": 1}]'::jsonb, 
 (SELECT id FROM categories WHERE slug = 'beauty'), 'NatureSénégal', TRUE, TRUE, TRUE, 'active'),

('Café Touba', 'cafe-touba', 'Café Touba traditionnel du Sénégal', 'Mélange épicé, 250g', 5000, 7000, 'CT-005', 200, 
 '[{"id": "1", "url": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600", "alt": "Café Touba", "isPrimary": true, "order": 1}]'::jsonb, 
 (SELECT id FROM categories WHERE slug = 'home'), 'CaféSénégal', FALSE, FALSE, TRUE, 'active');

-- ============================================
-- 6. AJOUT DE NOUVEAUX COUPONS SÉNÉGALAIS
-- ============================================

-- Ajouter des coupons spécifiques au marché sénégalais
INSERT INTO coupons (code, type, value, min_purchase, max_discount, usage_limit, is_active) VALUES
('SENEGAL10', 'percentage', 10.00, 30000.00, 30000.00, 1000, TRUE),
('Dakar20', 'percentage', 20.00, 75000.00, 75000.00, 500, TRUE),
('LIVRAISON', 'fixed', 3000.00, 20000.00, NULL, NULL, TRUE);

-- ============================================
-- 7. MISE À JOUR DES MÉTHODES DE LIVRAISON SÉNÉGALAISES
-- ============================================

-- Ajouter des méthodes de livraison spécifiques au Sénégal
INSERT INTO shipping_methods (name, description, price, estimated_days_min, estimated_days_max, free_shipping_threshold, countries) VALUES
('Livraison Dakar', 'Livraison dans Dakar et banlieue', 2000.00, 1, 2, 50000.00, ARRAY['SN']),
('Livraison Régions', 'Livraison dans les autres régions', 5000.00, 3, 5, 100000.00, ARRAY['SN']),
('Express Dakar', 'Livraison express dans Dakar', 5000.00, 1, 1, 100000.00, ARRAY['SN']);

-- ============================================
-- 8. COMMENTAIRES ET DOCUMENTATION
-- ============================================

-- Cette migration adapte ShopLux au marché sénégalais :
-- - Conversion des prix EUR vers FCFA (taux: 1 EUR = 655.96 FCFA)
-- - Ajout de produits locaux (artisanat, café Touba, etc.)
-- - Coupons adaptés au pouvoir d'achat local
-- - Méthodes de livraison pour le Sénégal
-- - Pays par défaut: Sénégal
