-- ============================================
-- NOUVELLES FONCTIONNALITÉS UTILISATEUR
-- ============================================

-- 1. Table d'historique de navigation
CREATE TABLE IF NOT EXISTS product_views_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id TEXT,
  UNIQUE(user_id, product_id, viewed_at)
);

CREATE INDEX idx_product_views_history_user ON product_views_history(user_id, viewed_at DESC);
CREATE INDEX idx_product_views_history_product ON product_views_history(product_id);

-- 2. Table de codes de parrainage
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  code TEXT UNIQUE NOT NULL,
  uses INTEGER DEFAULT 0,
  reward_points INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Table de parrainages
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES users(id) ON DELETE CASCADE,
  code_used TEXT,
  reward_given BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(referred_id)
);

-- 4. Table d'historique des points de fidélité
CREATE TABLE IF NOT EXISTS loyalty_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  points_change INTEGER NOT NULL,
  reason TEXT NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_loyalty_history_user ON loyalty_history(user_id, created_at DESC);

-- 5. Table d'alertes de prix wishlist
CREATE TABLE IF NOT EXISTS wishlist_price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  target_price DECIMAL(10, 2),
  notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- 6. Préférences utilisateur
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  push_notifications BOOLEAN DEFAULT TRUE,
  newsletter BOOLEAN DEFAULT TRUE,
  price_alert BOOLEAN DEFAULT TRUE,
  order_updates BOOLEAN DEFAULT TRUE,
  promotional_offers BOOLEAN DEFAULT TRUE,
  language TEXT DEFAULT 'fr',
  currency TEXT DEFAULT 'FCFA',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- POLITIQUES RLS
-- ============================================

-- Product views history
ALTER TABLE product_views_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_views"
ON product_views_history FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Referral codes
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_referral_code"
ON referral_codes FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "users_create_own_referral_code"
ON referral_codes FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Referrals
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_referrals"
ON referrals FOR SELECT
TO authenticated
USING (referrer_id = auth.uid() OR referred_id = auth.uid());

-- Loyalty history
ALTER TABLE loyalty_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_loyalty_history"
ON loyalty_history FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Wishlist price alerts
ALTER TABLE wishlist_price_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_price_alerts"
ON wishlist_price_alerts FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- User preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_preferences"
ON user_preferences FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================
-- FONCTIONS UTILES
-- ============================================

-- Fonction pour générer un code de parrainage unique
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Générer un code aléatoire de 8 caractères
    v_code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Vérifier si le code existe déjà
    SELECT EXISTS(SELECT 1 FROM referral_codes WHERE referral_codes.code = v_code) INTO v_exists;
    
    -- Si le code n'existe pas, on le retourne
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer automatiquement un code de parrainage pour les nouveaux utilisateurs
CREATE OR REPLACE FUNCTION create_user_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO referral_codes (user_id, code)
  VALUES (NEW.id, generate_referral_code())
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Créer aussi les préférences par défaut
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer le code de parrainage
DROP TRIGGER IF EXISTS create_referral_code_trigger ON users;
CREATE TRIGGER create_referral_code_trigger
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_referral_code();

-- Créer des codes de parrainage pour les utilisateurs existants
INSERT INTO referral_codes (user_id, code)
SELECT id, generate_referral_code()
FROM users
WHERE id NOT IN (SELECT user_id FROM referral_codes)
ON CONFLICT (user_id) DO NOTHING;

-- Créer des préférences pour les utilisateurs existants
INSERT INTO user_preferences (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM user_preferences)
ON CONFLICT (user_id) DO NOTHING;

