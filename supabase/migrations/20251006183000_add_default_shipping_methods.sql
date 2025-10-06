-- Add default shipping methods for Senegal
-- This migration adds shipping methods if they don't already exist

-- Standard Shipping for Senegal
INSERT INTO shipping_methods (name, description, price, estimated_days_min, estimated_days_max, free_shipping_threshold, countries, is_active)
VALUES 
  (
    'Livraison Standard',
    'Livraison à domicile dans tout le Sénégal',
    2000.00,
    2,
    3,
    50000.00,
    ARRAY['SN'],
    TRUE
  )
ON CONFLICT DO NOTHING;

-- Express Shipping for Dakar
INSERT INTO shipping_methods (name, description, price, estimated_days_min, estimated_days_max, free_shipping_threshold, countries, is_active)
VALUES 
  (
    'Livraison Express Dakar',
    'Livraison rapide à Dakar et environs',
    5000.00,
    1,
    1,
    100000.00,
    ARRAY['SN'],
    TRUE
  )
ON CONFLICT DO NOTHING;

-- Regional Shipping (outside Dakar)
INSERT INTO shipping_methods (name, description, price, estimated_days_min, estimated_days_max, free_shipping_threshold, countries, is_active)
VALUES 
  (
    'Livraison Régions',
    'Livraison dans les autres régions du Sénégal',
    5000.00,
    3,
    5,
    75000.00,
    ARRAY['SN'],
    TRUE
  )
ON CONFLICT DO NOTHING;

-- Economy Shipping (Slower but cheaper)
INSERT INTO shipping_methods (name, description, price, estimated_days_min, estimated_days_max, free_shipping_threshold, countries, is_active)
VALUES 
  (
    'Livraison Économique',
    'Livraison économique partout au Sénégal',
    1000.00,
    5,
    7,
    30000.00,
    ARRAY['SN'],
    TRUE
  )
ON CONFLICT DO NOTHING;

-- Premium Shipping
INSERT INTO shipping_methods (name, description, price, estimated_days_min, estimated_days_max, free_shipping_threshold, countries, is_active)
VALUES 
  (
    'Livraison Premium',
    'Livraison rapide avec assurance et suivi',
    10000.00,
    1,
    2,
    NULL,
    ARRAY['SN'],
    TRUE
  )
ON CONFLICT DO NOTHING;

