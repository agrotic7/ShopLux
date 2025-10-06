-- Gérer la création automatique du profil utilisateur pour Google OAuth
-- Cette fonction sera appelée lors de la première connexion Google

-- Fonction pour créer un profil utilisateur à partir des données Google
CREATE OR REPLACE FUNCTION public.handle_google_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier si l'utilisateur existe déjà dans la table users
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
      -- Extraire le nom complet et l'avatar depuis les métadonnées Google
      DECLARE
        full_name TEXT;
        first_name TEXT;
        last_name TEXT;
        avatar_url TEXT;
      BEGIN
        -- Récupérer le nom complet depuis les métadonnées
        full_name := COALESCE(
          NEW.raw_user_meta_data->>'full_name',
          NEW.raw_user_meta_data->>'name',
          NEW.email
        );
        
        -- Récupérer l'avatar depuis les métadonnées Google
        avatar_url := COALESCE(
          NEW.raw_user_meta_data->>'avatar_url',
          NEW.raw_user_meta_data->>'picture',
          ''
        );
        
        -- Séparer prénom et nom (logique simple)
        IF full_name ~ ' ' THEN
          first_name := split_part(full_name, ' ', 1);
          last_name := substring(full_name from position(' ' in full_name) + 1);
        ELSE
          first_name := full_name;
          last_name := '';
        END IF;
        
        -- Insérer l'utilisateur dans la table users
        INSERT INTO public.users (
          id,
          email,
          first_name,
          last_name,
          phone,
          avatar_url,
          role,
          created_at,
          updated_at
        ) VALUES (
          NEW.id,
          NEW.email,
          first_name,
          last_name,
          COALESCE(NEW.phone, ''),
          avatar_url,
          'customer', -- Rôle par défaut
          NOW(),
          NOW()
        );
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger pour la table auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_google_auth_user();

-- Politique RLS pour permettre l'insertion des profils Google
CREATE POLICY "Allow Google auth profile creation" ON users
  FOR INSERT 
  WITH CHECK (true); -- Permettre la création via le trigger
