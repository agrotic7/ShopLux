-- ============================================
-- FORCER LA SYNCHRONISATION DES UTILISATEURS
-- ============================================

-- Temporairement désactiver RLS pour permettre la synchronisation
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Synchroniser TOUS les utilisateurs de auth.users vers public.users
INSERT INTO public.users (id, email, first_name, last_name, phone, role, created_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'first_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
  COALESCE(au.raw_user_meta_data->>'last_name', ''),
  COALESCE(au.raw_user_meta_data->>'phone', au.phone),
  'customer',
  au.created_at
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM public.users WHERE id IS NOT NULL)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = COALESCE(EXCLUDED.first_name, users.first_name),
  last_name = COALESCE(EXCLUDED.last_name, users.last_name),
  phone = COALESCE(EXCLUDED.phone, users.phone),
  updated_at = NOW();

-- Réactiver RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Vérifier combien d'utilisateurs ont été synchronisés
DO $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.users;
  RAISE NOTICE 'Nombre d''utilisateurs synchronisés: %', user_count;
END $$;

