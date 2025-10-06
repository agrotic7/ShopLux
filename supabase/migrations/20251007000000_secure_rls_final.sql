-- ============================================
-- SÉCURISATION FINALE DES TABLES - ShopLux
-- ============================================
-- Cette migration réactive et sécurise correctement RLS
-- pour protéger contre les hackers

-- ============================================
-- 1. SÉCURISER LA TABLE USERS
-- ============================================

-- Réactiver RLS sur users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Supprimer toutes les anciennes politiques
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile (except role)" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Anyone can insert new users during registration" ON users;

-- Politique 1: Les utilisateurs peuvent UNIQUEMENT voir leur propre profil
CREATE POLICY "users_select_own"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Politique 2: Les admins peuvent voir tous les profils
CREATE POLICY "users_select_all_admins"
ON users FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u2 
    WHERE u2.id = auth.uid() 
    AND u2.role = 'admin'
  )
);

-- Politique 3: Les utilisateurs peuvent mettre à jour UNIQUEMENT leur profil (sauf le rôle)
CREATE POLICY "users_update_own"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  AND role = (SELECT role FROM users WHERE id = auth.uid())
);

-- Politique 4: Les admins peuvent mettre à jour n'importe quel profil
CREATE POLICY "users_update_all_admins"
ON users FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u2 
    WHERE u2.id = auth.uid() 
    AND u2.role = 'admin'
  )
);

-- Politique 5: Insertion automatique lors de l'inscription
CREATE POLICY "users_insert_own"
ON users FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = id 
  AND role = 'customer' -- Force le rôle customer
);

-- ============================================
-- 2. SÉCURISER LA TABLE ORDERS
-- ============================================

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own_orders" ON orders;
DROP POLICY IF EXISTS "admins_select_all_orders" ON orders;
DROP POLICY IF EXISTS "users_insert_own_orders" ON orders;
DROP POLICY IF EXISTS "admins_update_orders" ON orders;

-- Les utilisateurs voient uniquement leurs commandes
CREATE POLICY "users_select_own_orders"
ON orders FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Les admins voient toutes les commandes
CREATE POLICY "admins_select_all_orders"
ON orders FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Les utilisateurs peuvent créer leurs propres commandes
CREATE POLICY "users_insert_own_orders"
ON orders FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Seuls les admins peuvent modifier les commandes
CREATE POLICY "admins_update_orders"
ON orders FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- ============================================
-- 3. SÉCURISER LA TABLE REVIEWS
-- ============================================

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone_read_reviews" ON reviews;
DROP POLICY IF EXISTS "users_insert_own_reviews" ON reviews;
DROP POLICY IF EXISTS "users_update_own_reviews" ON reviews;
DROP POLICY IF EXISTS "users_delete_own_reviews" ON reviews;
DROP POLICY IF EXISTS "admins_delete_reviews" ON reviews;

-- Tout le monde peut lire les avis (même non connecté)
CREATE POLICY "anyone_read_reviews"
ON reviews FOR SELECT
TO anon, authenticated
USING (true);

-- Les utilisateurs peuvent créer leurs propres avis
CREATE POLICY "users_insert_own_reviews"
ON reviews FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Les utilisateurs peuvent modifier leurs propres avis
CREATE POLICY "users_update_own_reviews"
ON reviews FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Les utilisateurs peuvent supprimer leurs propres avis
CREATE POLICY "users_delete_own_reviews"
ON reviews FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Les admins peuvent supprimer n'importe quel avis
CREATE POLICY "admins_delete_reviews"
ON reviews FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- ============================================
-- 4. SÉCURISER LA TABLE ADDRESSES
-- ============================================

ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_manage_own_addresses" ON addresses;
DROP POLICY IF EXISTS "admins_view_all_addresses" ON addresses;

-- Les utilisateurs gèrent uniquement leurs adresses
CREATE POLICY "users_manage_own_addresses"
ON addresses FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Les admins peuvent voir toutes les adresses
CREATE POLICY "admins_view_all_addresses"
ON addresses FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- ============================================
-- 5. SÉCURISER LA TABLE PRODUCTS
-- ============================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone_read_products" ON products;
DROP POLICY IF EXISTS "admins_manage_products" ON products;

-- Tout le monde peut lire les produits actifs
CREATE POLICY "anyone_read_products"
ON products FOR SELECT
TO anon, authenticated
USING (status = 'active' OR EXISTS (
  SELECT 1 FROM users 
  WHERE users.id = auth.uid() 
  AND users.role = 'admin'
));

-- Seuls les admins peuvent gérer les produits
CREATE POLICY "admins_manage_products"
ON products FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- ============================================
-- 6. SÉCURISER LES AUTRES TABLES
-- ============================================

-- Wishlist
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_manage_own_wishlist" ON wishlist;

CREATE POLICY "users_manage_own_wishlist"
ON wishlist FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Cart
ALTER TABLE cart ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_manage_own_cart" ON cart;

CREATE POLICY "users_manage_own_cart"
ON cart FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_manage_own_notifications" ON notifications;

CREATE POLICY "users_manage_own_notifications"
ON notifications FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================
-- 7. FUNCTION DE VÉRIFICATION ADMIN
-- ============================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RÉSUMÉ DE LA SÉCURITÉ
-- ============================================
-- ✅ RLS activé sur toutes les tables sensibles
-- ✅ Les utilisateurs ne peuvent accéder qu'à leurs propres données
-- ✅ Les admins ont un accès complet via des politiques dédiées
-- ✅ Le rôle 'customer' est forcé à l'inscription
-- ✅ Les utilisateurs ne peuvent pas modifier leur propre rôle
-- ✅ Les produits inactifs ne sont visibles que par les admins
-- ✅ Protection contre l'élévation de privilèges

