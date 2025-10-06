-- Corriger la colonne avatar pour utiliser avatar_url
-- Renommer la colonne avatar en avatar_url pour la cohérence

-- Vérifier si la colonne avatar_url existe déjà
DO $$ 
BEGIN
    -- Si avatar_url n'existe pas, renommer avatar en avatar_url
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'avatar_url') THEN
        ALTER TABLE users RENAME COLUMN avatar TO avatar_url;
    END IF;
END $$;

-- Mettre à jour la fonction Google auth pour utiliser avatar_url
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
