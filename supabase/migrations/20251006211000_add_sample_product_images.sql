-- Add sample product images to existing products
-- This migration adds placeholder images to products that don't have any images

UPDATE products 
SET images = '["https://via.placeholder.com/600x600/4F46E5/FFFFFF?text=Product+1", "https://via.placeholder.com/600x600/7C3AED/FFFFFF?text=Product+1+Alt"]'::jsonb
WHERE images IS NULL OR images = '[]'::jsonb OR jsonb_array_length(images) = 0;

-- Add some variety to the images
UPDATE products 
SET images = '["https://via.placeholder.com/600x600/059669/FFFFFF?text=Electronics", "https://via.placeholder.com/600x600/DC2626/FFFFFF?text=Electronics+Alt"]'::jsonb
WHERE id IN (
  SELECT id FROM products 
  WHERE images IS NULL OR images = '[]'::jsonb OR jsonb_array_length(images) = 0
  LIMIT 3
);

UPDATE products 
SET images = '["https://via.placeholder.com/600x600/EA580C/FFFFFF?text=Fashion", "https://via.placeholder.com/600x600/0891B2/FFFFFF?text=Fashion+Alt"]'::jsonb
WHERE id IN (
  SELECT id FROM products 
  WHERE images IS NULL OR images = '[]'::jsonb OR jsonb_array_length(images) = 0
  LIMIT 3
);

UPDATE products 
SET images = '["https://via.placeholder.com/600x600/7C2D12/FFFFFF?text=Home+%26+Garden", "https://via.placeholder.com/600x600/581C87/FFFFFF?text=Home+%26+Garden+Alt"]'::jsonb
WHERE id IN (
  SELECT id FROM products 
  WHERE images IS NULL OR images = '[]'::jsonb OR jsonb_array_length(images) = 0
  LIMIT 3
);
