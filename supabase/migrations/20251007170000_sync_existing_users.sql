-- ============================================
-- SYNCHRONISER LES UTILISATEURS EXISTANTS
-- ============================================

-- Cette migration s'exécute manuellement pour synchroniser tous les utilisateurs
-- existants dans auth.users vers public.users

-- Utiliser une fonction SECURITY DEFINER pour contourner RLS
CREATE OR REPLACE FUNCTION sync_existing_auth_users()
RETURNS void AS $$
BEGIN
  -- Parcourir tous les utilisateurs dans auth.users qui n'existent pas dans public.users
  INSERT INTO public.users (id, email, first_name, last_name, phone, role)
  SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'first_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)) as first_name,
    COALESCE(au.raw_user_meta_data->>'last_name', '') as last_name,
    COALESCE(au.raw_user_meta_data->>'phone', au.phone) as phone,
    'customer' as role
  FROM auth.users au
  WHERE au.id NOT IN (SELECT id FROM public.users)
  ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Exécuter la synchronisation
SELECT sync_existing_auth_users();

-- Supprimer la fonction après utilisation (optionnel)
-- DROP FUNCTION IF EXISTS sync_existing_auth_users();

