-- Sécurisation de la table users pour empêcher les utilisateurs de modifier leur rôle
-- Ce script ajoute des politiques RLS pour protéger les données sensibles

-- Activer RLS sur la table users si ce n'est pas déjà fait
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile (except role)" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;

-- Politique 1: Les utilisateurs peuvent voir uniquement leur propre profil
CREATE POLICY "Users can view their own profile"
ON users
FOR SELECT
USING (auth.uid() = id);

-- Politique 2: Les utilisateurs peuvent mettre à jour leur profil SAUF le rôle
CREATE POLICY "Users can update their own profile (except role)"
ON users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  AND role = (SELECT role FROM users WHERE id = auth.uid())  -- Le rôle ne doit pas changer
);

-- Politique 3: Les admins peuvent voir tous les utilisateurs
CREATE POLICY "Admins can view all users"
ON users
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Politique 4: Les admins peuvent mettre à jour tous les utilisateurs (y compris les rôles)
CREATE POLICY "Admins can update all users"
ON users
FOR UPDATE
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

-- Politique 5: Permettre l'insertion lors de l'inscription (role par défaut sera 'customer')
DROP POLICY IF EXISTS "Anyone can insert new users during registration" ON users;
CREATE POLICY "Anyone can insert new users during registration"
ON users
FOR INSERT
WITH CHECK (role = 'customer');  -- Force le rôle à être 'customer' lors de l'inscription

