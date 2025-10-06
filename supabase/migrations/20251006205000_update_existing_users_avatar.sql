-- Mettre à jour les utilisateurs existants qui n'ont pas d'avatar
-- Récupérer l'avatar depuis auth.users.raw_user_meta_data

UPDATE users 
SET avatar_url = COALESCE(
  au.raw_user_meta_data->>'avatar_url',
  au.raw_user_meta_data->>'picture',
  ''
)
FROM auth.users au
WHERE users.id = au.id 
  AND (users.avatar_url IS NULL OR users.avatar_url = '');

-- Vérifier le résultat
SELECT 
  u.id, 
  u.email, 
  u.first_name, 
  u.last_name, 
  u.avatar_url,
  au.raw_user_meta_data->>'avatar_url' as google_avatar_url,
  au.raw_user_meta_data->>'picture' as google_picture
FROM users u
LEFT JOIN auth.users au ON au.id = u.id
ORDER BY u.created_at DESC
LIMIT 5;
