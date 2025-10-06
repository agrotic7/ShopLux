-- Fix: Corriger la récursion infinie dans les politiques RLS
-- Le problème était que la politique de mise à jour faisait un SELECT sur users, créant une boucle

-- Supprimer TOUTES les anciennes politiques
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile (except role)" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Anyone can insert new users during registration" ON users;

-- Politique 1: Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view their own profile"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Politique 2: Les utilisateurs peuvent mettre à jour leur profil SAUF le rôle
-- SANS récursion - on ne vérifie PAS le rôle dans la BD, on bloque juste la colonne
CREATE POLICY "Users can update their own profile (except role)"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Politique 3: Les admins peuvent voir tous les utilisateurs
-- On utilise auth.jwt() pour vérifier le rôle côté client sans requête récursive
CREATE POLICY "Admins can view all users"
ON users
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Politique 4: Les admins peuvent mettre à jour tous les utilisateurs
CREATE POLICY "Admins can update all users"
ON users
FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Politique 5: Permettre l'insertion lors de l'inscription
CREATE POLICY "Anyone can insert new users during registration"
ON users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id AND role = 'customer');

