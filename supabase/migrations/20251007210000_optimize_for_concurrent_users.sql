-- ============================================
-- OPTIMISATIONS POUR UTILISATEURS MULTIPLES
-- ============================================

-- 1. Ajouter une contrainte CHECK sur le stock (ne peut pas être négatif)
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_stock_check;
ALTER TABLE products ADD CONSTRAINT products_stock_check CHECK (stock >= 0);

-- 2. Fonction atomique pour réserver du stock
CREATE OR REPLACE FUNCTION reserve_product_stock(
  p_product_id UUID,
  p_quantity INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  current_stock INTEGER;
BEGIN
  -- Verrouiller la ligne du produit pour éviter les race conditions
  SELECT stock INTO current_stock
  FROM products
  WHERE id = p_product_id
  FOR UPDATE; -- LOCK pour éviter les accès concurrents
  
  -- Vérifier si le stock est suffisant
  IF current_stock < p_quantity THEN
    RETURN FALSE;
  END IF;
  
  -- Déduire le stock
  UPDATE products
  SET stock = stock - p_quantity,
      updated_at = NOW()
  WHERE id = p_product_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 3. Fonction pour créer une commande avec vérification de stock
CREATE OR REPLACE FUNCTION create_order_with_stock_check(
  p_order_data JSONB
) RETURNS JSONB AS $$
DECLARE
  v_order_id UUID;
  v_item JSONB;
  v_product_id UUID;
  v_quantity INTEGER;
  v_stock_ok BOOLEAN;
  v_result JSONB;
BEGIN
  -- Vérifier et réserver le stock pour tous les produits
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_order_data->'items')
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_quantity := (v_item->>'quantity')::INTEGER;
    
    -- Tenter de réserver le stock
    v_stock_ok := reserve_product_stock(v_product_id, v_quantity);
    
    -- Si le stock est insuffisant, annuler tout
    IF NOT v_stock_ok THEN
      -- ROLLBACK sera automatique car on lance une exception
      RAISE EXCEPTION 'Stock insuffisant pour le produit %', v_product_id;
    END IF;
  END LOOP;
  
  -- Créer la commande
  INSERT INTO orders (
    order_number, user_id, items, subtotal, discount, tax, shipping, total,
    status, payment_status, payment_method, shipping_address, billing_address, notes
  ) VALUES (
    p_order_data->>'order_number',
    (p_order_data->>'user_id')::UUID,
    p_order_data->'items',
    (p_order_data->>'subtotal')::DECIMAL,
    (p_order_data->>'discount')::DECIMAL,
    (p_order_data->>'tax')::DECIMAL,
    (p_order_data->>'shipping')::DECIMAL,
    (p_order_data->>'total')::DECIMAL,
    p_order_data->>'status',
    p_order_data->>'payment_status',
    p_order_data->>'payment_method',
    p_order_data->'shipping_address',
    p_order_data->'billing_address',
    p_order_data->>'notes'
  ) RETURNING id INTO v_order_id;
  
  -- Créer les order_items
  INSERT INTO order_items (order_id, product_id, quantity, price, total)
  SELECT 
    v_order_id,
    (item->>'product_id')::UUID,
    (item->>'quantity')::INTEGER,
    (item->>'price')::DECIMAL,
    (item->>'quantity')::INTEGER * (item->>'price')::DECIMAL
  FROM jsonb_array_elements(p_order_data->'items') as item;
  
  -- Retourner le résultat avec succès
  v_result := jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'message', 'Commande créée avec succès'
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- En cas d'erreur, retourner un message d'erreur
    v_result := jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 4. Supprimer l'ancien trigger qui ne gérait pas bien la concurrence
DROP TRIGGER IF EXISTS trg_update_stock ON orders;
DROP FUNCTION IF EXISTS update_stock_on_order();

-- 5. Ajouter des index pour améliorer les performances avec beaucoup d'utilisateurs
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_carts_user_updated ON carts(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_wishlists_user_created ON wishlists(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_product_created ON reviews(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_category_stock ON products(category_id, stock DESC);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_rating ON products(rating DESC);

-- 6. Fonction pour nettoyer les paniers abandonnés (performance)
CREATE OR REPLACE FUNCTION cleanup_old_carts()
RETURNS void AS $$
BEGIN
  DELETE FROM carts
  WHERE updated_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- 7. Fonction pour limiter le nombre de tentatives de commande (anti-spam)
CREATE TABLE IF NOT EXISTS order_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  attempt_count INTEGER DEFAULT 1,
  last_attempt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_order_attempts_user ON order_attempts(user_id, last_attempt DESC);

-- Politique RLS pour order_attempts
ALTER TABLE order_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_attempts"
ON order_attempts FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 8. Fonction pour vérifier le rate limiting
CREATE OR REPLACE FUNCTION check_order_rate_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_attempt_count INTEGER;
  v_last_attempt TIMESTAMP;
BEGIN
  -- Récupérer le nombre de tentatives
  SELECT attempt_count, last_attempt
  INTO v_attempt_count, v_last_attempt
  FROM order_attempts
  WHERE user_id = p_user_id;
  
  -- Si aucune tentative précédente, c'est OK
  IF v_attempt_count IS NULL THEN
    INSERT INTO order_attempts (user_id, attempt_count, last_attempt)
    VALUES (p_user_id, 1, NOW())
    ON CONFLICT (user_id) DO NOTHING;
    RETURN TRUE;
  END IF;
  
  -- Si dernière tentative il y a moins d'une minute ET plus de 5 tentatives
  IF v_last_attempt > NOW() - INTERVAL '1 minute' AND v_attempt_count >= 5 THEN
    RETURN FALSE; -- Rate limit dépassé
  END IF;
  
  -- Si dernière tentative il y a plus d'une minute, réinitialiser
  IF v_last_attempt < NOW() - INTERVAL '1 minute' THEN
    UPDATE order_attempts
    SET attempt_count = 1, last_attempt = NOW()
    WHERE user_id = p_user_id;
  ELSE
    -- Sinon incrémenter
    UPDATE order_attempts
    SET attempt_count = attempt_count + 1, last_attempt = NOW()
    WHERE user_id = p_user_id;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 9. Optimisation des requêtes fréquentes avec des vues matérialisées
CREATE MATERIALIZED VIEW IF NOT EXISTS popular_products AS
SELECT 
  p.*,
  COUNT(DISTINCT o.id) as order_count,
  SUM((item->>'quantity')::INTEGER) as total_sold
FROM products p
LEFT JOIN orders o ON o.status IN ('processing', 'shipped', 'delivered')
LEFT JOIN LATERAL jsonb_array_elements(o.items) item ON (item->>'product_id')::UUID = p.id
WHERE p.status = 'active'
GROUP BY p.id
ORDER BY total_sold DESC NULLS LAST
LIMIT 50;

-- Index sur la vue matérialisée
CREATE UNIQUE INDEX idx_popular_products_id ON popular_products(id);

-- Fonction pour rafraîchir la vue (à appeler périodiquement)
CREATE OR REPLACE FUNCTION refresh_popular_products()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY popular_products;
END;
$$ LANGUAGE plpgsql;

-- 10. Activer le Row-Level Security sur toutes les nouvelles tables
ALTER TABLE product_views_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_attempts ENABLE ROW LEVEL SECURITY;

-- Commenter pour documentation
COMMENT ON FUNCTION reserve_product_stock IS 'Fonction atomique pour réserver du stock avec verrouillage. Garantit qu''il n''y aura pas de survente.';
COMMENT ON FUNCTION create_order_with_stock_check IS 'Crée une commande avec vérification atomique du stock pour tous les produits.';
COMMENT ON FUNCTION check_order_rate_limit IS 'Limite à 5 tentatives de commande par minute par utilisateur pour éviter le spam.';

