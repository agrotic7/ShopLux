-- ============================================
-- OPTIMISATION DES IMAGES PRODUITS
-- ============================================
-- Ajout des paramètres Unsplash pour un meilleur remplissage

UPDATE products SET images = jsonb_set(
  images,
  '{0,url}',
  to_jsonb(regexp_replace(images->0->>'url', '\?w=\d+', '?w=800&h=800&fit=crop&crop=center'))
) WHERE images->0->>'url' IS NOT NULL;

UPDATE products SET images = jsonb_set(
  images,
  '{1,url}',
  to_jsonb(regexp_replace(images->1->>'url', '\?w=\d+', '?w=800&h=800&fit=crop&crop=center'))
) WHERE images->1->>'url' IS NOT NULL;

UPDATE products SET images = jsonb_set(
  images,
  '{2,url}',
  to_jsonb(regexp_replace(images->2->>'url', '\?w=\d+', '?w=800&h=800&fit=crop&crop=center'))
) WHERE images->2->>'url' IS NOT NULL;

