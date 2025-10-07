-- ============================================
-- FIX INFINITE RECURSION IN RLS POLICIES
-- ============================================

-- Supprimer toutes les politiques problématiques
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_select_all_admins" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_update_all_admins" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "admins_select_all_orders" ON orders;
DROP POLICY IF EXISTS "admins_update_orders" ON orders;
DROP POLICY IF EXISTS "admins_delete_reviews" ON reviews;
DROP POLICY IF EXISTS "admins_view_all_addresses" ON addresses;
DROP POLICY IF EXISTS "admins_manage_products" ON products;

-- Créer une fonction sécurisée pour vérifier le rôle admin
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

-- Créer une fonction pour obtenir le rôle de l'utilisateur actuel
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM users
  WHERE id = auth.uid();
  
  RETURN COALESCE(user_role, 'customer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- NOUVELLES POLITIQUES USERS SANS RÉCURSION
-- ============================================

-- Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "users_select_own"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Les utilisateurs peuvent mettre à jour leur propre profil (sauf le rôle)
CREATE POLICY "users_update_own"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  AND role = current_user_role()
);

-- Insertion automatique lors de l'inscription (via trigger)
CREATE POLICY "users_insert_own"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- ============================================
-- POLITIQUES ORDERS
-- ============================================

-- Les utilisateurs voient uniquement leurs commandes
-- (pas besoin de changer celle-ci)

-- ============================================
-- POLITIQUES REVIEWS  
-- ============================================

-- Les utilisateurs peuvent supprimer leurs propres avis
-- (pas besoin de changer celle-ci)

-- ============================================
-- POLITIQUES ADDRESSES
-- ============================================

-- Les utilisateurs gèrent uniquement leurs adresses
-- (pas besoin de changer celle-ci)

-- ============================================
-- POLITIQUES PRODUCTS
-- ============================================

-- Tout le monde peut lire les produits actifs
DROP POLICY IF EXISTS "anyone_read_products" ON products;
CREATE POLICY "anyone_read_products"
ON products FOR SELECT
TO anon, authenticated
USING (status = 'active');

-- ============================================
-- DÉSACTIVER RLS TEMPORAIREMENT POUR WISHLISTS
-- ============================================

-- Les politiques de wishlists peuvent aussi causer des problèmes
ALTER TABLE wishlists DISABLE ROW LEVEL SECURITY;
ALTER TABLE carts DISABLE ROW LEVEL SECURITY;

-- Recréer des politiques simples pour wishlists
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_manage_own_wishlist" ON wishlists;
CREATE POLICY "users_manage_own_wishlist"
ON wishlists FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Recréer des politiques simples pour carts
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_manage_own_cart" ON carts;
CREATE POLICY "users_manage_own_cart"
ON carts FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================
-- COMMENTAIRE
-- ============================================
-- Les fonctions SECURITY DEFINER contournent le RLS pour éviter la récursion
-- Les admins devront utiliser le dashboard Supabase ou des fonctions SQL spécifiques
-- pour gérer les utilisateurs et les produits

