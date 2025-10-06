-- Debug: Vérifier les métadonnées des utilisateurs
SELECT 
  u.id, 
  u.email, 
  u.first_name, 
  u.last_name, 
  u.avatar_url,
  au.raw_user_meta_data,
  au.raw_user_meta_data->>'avatar_url' as google_avatar_url,
  au.raw_user_meta_data->>'picture' as google_picture,
  au.raw_user_meta_data->>'full_name' as google_full_name
FROM users u
LEFT JOIN auth.users au ON au.id = u.id
ORDER BY u.created_at DESC
LIMIT 3;
