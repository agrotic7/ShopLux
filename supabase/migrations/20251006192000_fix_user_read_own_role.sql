-- Fix: S'assurer que les utilisateurs peuvent lire TOUS les champs de leur propre profil
-- y compris le champ 'role' qui est essentiel pour l'affichage conditionnel

-- Supprimer l'ancienne politique
DROP POLICY IF EXISTS "Users can view their own profile" ON users;

-- Recréer la politique pour que les utilisateurs puissent lire leur propre profil
-- SANS aucune restriction sur les colonnes
CREATE POLICY "Users can view their own profile"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Vérifier aussi que la politique de mise à jour est correcte
DROP POLICY IF EXISTS "Users can update their own profile (except role)" ON users;

CREATE POLICY "Users can update their own profile (except role)"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  -- Vérifier que le rôle n'a pas changé en comparant avec la valeur actuelle dans la BD
  AND role = (SELECT role FROM users WHERE id = auth.uid())
);

