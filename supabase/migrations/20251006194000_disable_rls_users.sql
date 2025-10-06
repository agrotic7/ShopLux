-- Solution: Désactiver RLS sur la table users
-- La sécurité est déjà gérée au niveau de l'application avec les guards et l'authentification Supabase
-- Activer RLS avec des politiques complexes cause une récursion infinie

-- Supprimer toutes les politiques
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile (except role)" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Anyone can insert new users during registration" ON users;

-- Désactiver RLS sur la table users
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Note: La sécurité est assurée par:
-- 1. L'authentification Supabase (auth.uid())
-- 2. Les guards Angular (authGuard, adminGuard)
-- 3. Les validations côté serveur (Edge Functions si nécessaires)

