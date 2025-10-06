-- ⚠️ SCRIPT MANUEL - À EXÉCUTER UNIQUEMENT PAR LE PROPRIÉTAIRE DU SITE
-- Ce script permet de promouvoir un utilisateur spécifique en tant qu'administrateur
-- 
-- INSTRUCTIONS:
-- 1. Connectez-vous à votre dashboard Supabase
-- 2. Allez dans SQL Editor
-- 3. Remplacez 'EMAIL_DE_LADMIN@example.com' par l'email de l'utilisateur à promouvoir
-- 4. Exécutez ce script
--
-- ⚠️ NE PARTAGEZ JAMAIS CE SCRIPT AVEC DES UTILISATEURS NORMAUX !

-- Promouvoir un utilisateur spécifique en tant qu'admin
UPDATE users
SET role = 'admin'
WHERE email = 'EMAIL_DE_LADMIN@example.com';  -- ⚠️ REMPLACEZ PAR L'EMAIL RÉEL

-- Vérifier que la promotion a fonctionné
SELECT id, email, first_name, last_name, role, created_at
FROM users
WHERE role = 'admin';

