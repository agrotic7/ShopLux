-- Script SQL pour promouvoir un utilisateur en administrateur
-- Remplacez 'votre-email@example.com' par votre email de connexion

-- Option 1: Promouvoir par email
UPDATE users 
SET role = 'admin' 
WHERE email = 'votre-email@example.com';

-- Option 2: Vérifier votre email actuel
SELECT id, email, first_name, last_name, role, created_at 
FROM users 
WHERE email = 'votre-email@example.com';

-- Option 3: Lister tous les utilisateurs pour trouver le bon
SELECT id, email, first_name, last_name, role, created_at 
FROM users 
ORDER BY created_at DESC;

-- Option 4: Promouvoir le premier utilisateur (vous)
UPDATE users 
SET role = 'admin' 
WHERE id = (SELECT id FROM users ORDER BY created_at ASC LIMIT 1);

-- Vérification finale
SELECT id, email, first_name, last_name, role, created_at 
FROM users 
WHERE role = 'admin';
