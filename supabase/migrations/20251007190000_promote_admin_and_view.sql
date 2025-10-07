-- ============================================
-- PROMOUVOIR L'ADMIN ET CRÉER UNE VUE PUBLIQUE
-- ============================================

-- Promouvoir l'utilisateur doumass124@gmail.com en admin
UPDATE public.users
SET role = 'admin'
WHERE email = 'doumass124@gmail.com';

-- Créer une vue qui permet de voir tous les utilisateurs (pour debug)
CREATE OR REPLACE VIEW public.all_users_view AS
SELECT 
  id,
  email,
  first_name,
  last_name,
  phone,
  role,
  loyalty_points,
  created_at,
  updated_at
FROM public.users;

-- Donner accès en lecture à la vue pour tous les utilisateurs authentifiés
GRANT SELECT ON public.all_users_view TO authenticated;

-- Afficher un message de confirmation
DO $$
DECLARE
  admin_count INTEGER;
  customer_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM public.users WHERE role = 'admin';
  SELECT COUNT(*) INTO customer_count FROM public.users WHERE role = 'customer';
  RAISE NOTICE 'Utilisateurs dans la base:';
  RAISE NOTICE '  - Admins: %', admin_count;
  RAISE NOTICE '  - Clients: %', customer_count;
END $$;

