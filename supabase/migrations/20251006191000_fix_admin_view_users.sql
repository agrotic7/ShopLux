-- Fix: Permettre aux admins de voir TOUS les utilisateurs (pas seulement les admins)
-- Le problème était que la politique "Admins can view all users" était trop restrictive

-- Supprimer l'ancienne politique admin
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Recréer la politique pour que les admins voient TOUS les utilisateurs
CREATE POLICY "Admins can view all users"
ON users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role = 'admin'
  )
);

-- Vérifier aussi la politique de mise à jour admin
DROP POLICY IF EXISTS "Admins can update all users" ON users;

CREATE POLICY "Admins can update all users"
ON users
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role = 'admin'
  )
);

