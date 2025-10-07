-- ============================================
-- PERMISSIONS DE SUPPRESSION POUR LES ADMINS
-- ============================================

-- Créer une fonction pour vérifier si l'utilisateur est admin (si elle n'existe pas déjà)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM users
  WHERE id = auth.uid();
  
  RETURN COALESCE(user_role = 'admin', FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer l'ancienne politique de gestion des produits
DROP POLICY IF EXISTS "admins_manage_products" ON products;
DROP POLICY IF EXISTS "admins_delete_products" ON products;

-- Politique pour que les admins puissent TOUT faire sur les produits (INSERT, UPDATE, DELETE)
CREATE POLICY "admins_full_access_products"
ON products FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- S'assurer que RLS est activé
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Vérifier aussi les politiques pour reviews (au cas où il y a des contraintes de clé étrangère)
DROP POLICY IF EXISTS "admins_delete_reviews" ON reviews;

CREATE POLICY "admins_delete_reviews"
ON reviews FOR DELETE
TO authenticated
USING (is_admin());

-- Politique pour les product_images si la table existe
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'product_images') THEN
    EXECUTE 'ALTER TABLE product_images ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "admins_manage_product_images" ON product_images';
    EXECUTE 'CREATE POLICY "admins_manage_product_images" ON product_images FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin())';
    EXECUTE 'CREATE POLICY "public_read_product_images" ON product_images FOR SELECT TO anon, authenticated USING (true)';
  END IF;
END $$;

-- Politique pour product_variants si la table existe
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'product_variants') THEN
    EXECUTE 'ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "admins_manage_product_variants" ON product_variants';
    EXECUTE 'CREATE POLICY "admins_manage_product_variants" ON product_variants FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin())';
    EXECUTE 'CREATE POLICY "public_read_product_variants" ON product_variants FOR SELECT TO anon, authenticated USING (true)';
  END IF;
END $$;

-- Politique pour product_recommendations si la table existe
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'product_recommendations') THEN
    EXECUTE 'ALTER TABLE product_recommendations ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "admins_manage_product_recommendations" ON product_recommendations';
    EXECUTE 'CREATE POLICY "admins_manage_product_recommendations" ON product_recommendations FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin())';
    EXECUTE 'CREATE POLICY "public_read_product_recommendations" ON product_recommendations FOR SELECT TO anon, authenticated USING (true)';
  END IF;
END $$;

-- Politique pour inventory_logs si la table existe
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'inventory_logs') THEN
    EXECUTE 'ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "admins_manage_inventory_logs" ON inventory_logs';
    EXECUTE 'CREATE POLICY "admins_manage_inventory_logs" ON inventory_logs FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin())';
  END IF;
END $$;

