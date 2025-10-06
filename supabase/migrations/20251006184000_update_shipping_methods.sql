-- Update shipping methods - Keep only 3 types
-- This migration removes old methods and adds the new simplified ones

-- Delete all existing shipping methods
DELETE FROM shipping_methods;

-- 1. Free Shipping (Available from 50,000 FCFA)
INSERT INTO shipping_methods (name, description, price, estimated_days_min, estimated_days_max, free_shipping_threshold, countries, is_active)
VALUES 
  (
    'Livraison Gratuite',
    'Livraison gratuite partout au Sénégal (à partir de 50 000 FCFA)',
    0.00,
    5,
    7,
    50000.00,
    ARRAY['SN'],
    TRUE
  );

-- 2. Dakar Shipping (2000 FCFA)
INSERT INTO shipping_methods (name, description, price, estimated_days_min, estimated_days_max, free_shipping_threshold, countries, is_active)
VALUES 
  (
    'Livraison Dakar',
    'Livraison à Dakar et environs',
    2000.00,
    2,
    3,
    NULL,
    ARRAY['SN'],
    TRUE
  );

-- 3. Regions Shipping (5000 FCFA)
INSERT INTO shipping_methods (name, description, price, estimated_days_min, estimated_days_max, free_shipping_threshold, countries, is_active)
VALUES 
  (
    'Livraison Régions',
    'Livraison dans les régions du Sénégal (hors Dakar)',
    5000.00,
    3,
    5,
    NULL,
    ARRAY['SN'],
    TRUE
  );

