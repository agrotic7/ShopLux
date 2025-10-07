-- ============================================
-- AJOUTER POLITIQUE POUR LES ADMINS
-- ============================================
-- Permet aux admins de voir tous les utilisateurs

-- Créer la politique pour que les admins puissent voir tous les utilisateurs
CREATE POLICY "admins_select_all_users"
ON users FOR SELECT
TO authenticated
USING (is_admin());

-- Créer la politique pour que les admins puissent mettre à jour tous les utilisateurs
CREATE POLICY "admins_update_all_users"
ON users FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Créer la politique pour que les admins puissent supprimer des utilisateurs
CREATE POLICY "admins_delete_users"
ON users FOR DELETE
TO authenticated
USING (is_admin());

