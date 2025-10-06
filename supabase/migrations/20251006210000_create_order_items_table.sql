-- Créer la table order_items pour les analyses détaillées
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer les index pour les performances
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_order_items_created_at ON order_items(created_at);

-- Créer un trigger pour calculer automatiquement le total
CREATE OR REPLACE FUNCTION calculate_order_item_total()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total = NEW.quantity * NEW.price;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_order_item_total
  BEFORE INSERT OR UPDATE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_order_item_total();

-- Remplir la table order_items avec les données existantes des commandes
-- Cette fonction migre les données JSONB vers la table order_items
CREATE OR REPLACE FUNCTION migrate_orders_to_order_items()
RETURNS void AS $$
DECLARE
  order_record RECORD;
  item JSONB;
BEGIN
  -- Parcourir toutes les commandes existantes
  FOR order_record IN 
    SELECT id, items, created_at 
    FROM orders 
    WHERE items IS NOT NULL AND jsonb_array_length(items) > 0
  LOOP
    -- Parcourir chaque article dans la commande
    FOR item IN SELECT * FROM jsonb_array_elements(order_record.items)
    LOOP
      -- Insérer l'article dans la table order_items
      INSERT INTO order_items (
        order_id,
        product_id,
        quantity,
        price,
        total,
        created_at
      ) VALUES (
        order_record.id,
        (item->>'productId')::UUID,
        (item->>'quantity')::INTEGER,
        (item->>'price')::DECIMAL(10,2),
        (item->>'total')::DECIMAL(10,2),
        order_record.created_at
      ) ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Exécuter la migration des données
SELECT migrate_orders_to_order_items();

-- Supprimer la fonction de migration après utilisation
DROP FUNCTION migrate_orders_to_order_items();

-- Politiques RLS pour order_items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs propres articles de commande
CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Les admins peuvent voir tous les articles de commande
CREATE POLICY "Admins can view all order items" ON order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Les utilisateurs peuvent créer des articles de commande (via le processus de commande)
CREATE POLICY "Users can create order items" ON order_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );
