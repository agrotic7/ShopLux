-- ============================================
-- SYNCHRONISER LES UTILISATEURS AUTH AVEC LA TABLE USERS
-- ============================================

-- Fonction pour créer automatiquement un profil utilisateur lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    'customer'  -- Tous les nouveaux utilisateurs sont des clients par défaut
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Créer le trigger pour synchroniser automatiquement
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Synchroniser les utilisateurs existants dans auth.users vers public.users
-- Note: Les utilisateurs existants dans public.users ne seront pas modifiés

-- Note: Vous devrez promouvoir manuellement les admins via la console Supabase
-- ou en utilisant le script SQL MANUAL_promote_user_to_admin.sql

