-- ============================================
-- MIGRATION: Fonctionnalités E-commerce Complètes
-- ============================================

-- ============================================
-- 1. TABLES ADDITIONNELLES
-- ============================================

-- Product Images (Galerie d'images avancée)
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product Variants (Variantes produits avec stock)
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL(10, 2),
  stock INTEGER DEFAULT 0,
  attributes JSONB DEFAULT '{}'::jsonb, -- {color: "red", size: "L"}
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shipping Methods
CREATE TABLE IF NOT EXISTS shipping_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  estimated_days_min INTEGER,
  estimated_days_max INTEGER,
  free_shipping_threshold DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT TRUE,
  countries TEXT[] DEFAULT ARRAY['FR', 'BE', 'CH', 'LU'],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  transaction_id TEXT UNIQUE NOT NULL,
  payment_provider TEXT NOT NULL, -- stripe, paypal, etc.
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  status TEXT CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded')),
  payment_method_details JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Refunds
CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  transaction_id UUID REFERENCES payment_transactions(id),
  amount DECIMAL(10, 2) NOT NULL,
  reason TEXT,
  status TEXT CHECK (status IN ('requested', 'approved', 'rejected', 'processed')),
  processed_by UUID REFERENCES users(id),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('order', 'promotion', 'system', 'review')),
  is_read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Templates
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Promotional Banners
CREATE TABLE IF NOT EXISTS promotional_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  link_url TEXT,
  button_text TEXT,
  position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product Recommendations
CREATE TABLE IF NOT EXISTS product_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  recommended_product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  score DECIMAL(5, 2) DEFAULT 0,
  type TEXT CHECK (type IN ('similar', 'frequently_bought', 'alternative')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory Logs
CREATE TABLE IF NOT EXISTS inventory_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  change_type TEXT CHECK (change_type IN ('sale', 'restock', 'adjustment', 'return')),
  quantity_change INTEGER NOT NULL,
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  reference_id UUID, -- order_id or other reference
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support Tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  order_id UUID REFERENCES orders(id),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Ticket Messages
CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  message TEXT NOT NULL,
  is_staff_reply BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Newsletter Subscribers
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  is_subscribed BOOLEAN DEFAULT TRUE,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE
);

-- Product Views (Analytics)
CREATE TABLE IF NOT EXISTS product_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Abandoned Carts
CREATE TABLE IF NOT EXISTS abandoned_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  email TEXT,
  cart_data JSONB NOT NULL,
  total_amount DECIMAL(10, 2),
  reminder_sent BOOLEAN DEFAULT FALSE,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  converted_to_order_id UUID REFERENCES orders(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. INDEXES POUR PERFORMANCE
-- ============================================

CREATE INDEX idx_product_images_product ON product_images(product_id);
CREATE INDEX idx_product_variants_product ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(sku);
CREATE INDEX idx_payment_transactions_order ON payment_transactions(order_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_inventory_logs_product ON inventory_logs(product_id);
CREATE INDEX idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX idx_product_views_product ON product_views(product_id);
CREATE INDEX idx_product_views_date ON product_views(viewed_at);

-- ============================================
-- 3. FONCTIONS SQL
-- ============================================

-- Fonction: Calculer le rating moyen d'un produit
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET 
    rating = (SELECT AVG(rating)::DECIMAL(3,2) FROM reviews WHERE product_id = NEW.product_id),
    review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = NEW.product_id)
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction: Mettre à jour le stock après une commande
CREATE OR REPLACE FUNCTION update_stock_on_order()
RETURNS TRIGGER AS $$
DECLARE
  item JSONB;
BEGIN
  IF NEW.status = 'processing' AND (OLD.status IS NULL OR OLD.status = 'pending') THEN
    FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
    LOOP
      UPDATE products
      SET stock = stock - (item->>'quantity')::INTEGER
      WHERE id = (item->>'product_id')::UUID;
      
      -- Log inventory change
      INSERT INTO inventory_logs (product_id, change_type, quantity_change, quantity_before, quantity_after, reference_id)
      SELECT 
        id,
        'sale',
        -(item->>'quantity')::INTEGER,
        stock + (item->>'quantity')::INTEGER,
        stock,
        NEW.id
      FROM products
      WHERE id = (item->>'product_id')::UUID;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction: Créer une notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT,
  p_link TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, title, message, type, link)
  VALUES (p_user_id, p_title, p_message, p_type, p_link)
  RETURNING id INTO notification_id;
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. TRIGGERS
-- ============================================

-- Trigger: Mise à jour du rating produit
DROP TRIGGER IF EXISTS trg_update_product_rating ON reviews;
CREATE TRIGGER trg_update_product_rating
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_product_rating();

-- Trigger: Mise à jour du stock
DROP TRIGGER IF EXISTS trg_update_stock ON orders;
CREATE TRIGGER trg_update_stock
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_on_order();

-- Trigger: Updated_at pour les nouvelles tables
CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. VUES SQL (Analytics)
-- ============================================

-- Vue: Best Sellers (top produits)
CREATE OR REPLACE VIEW best_sellers AS
SELECT 
  p.id,
  p.name,
  p.slug,
  p.price,
  p.images,
  COUNT(DISTINCT o.id) as order_count,
  SUM((item->>'quantity')::INTEGER) as total_sold
FROM products p
JOIN orders o ON TRUE
JOIN LATERAL jsonb_array_elements(o.items) item ON (item->>'product_id')::UUID = p.id
WHERE o.status IN ('processing', 'shipped', 'delivered')
GROUP BY p.id, p.name, p.slug, p.price, p.images
ORDER BY total_sold DESC;

-- Vue: Produits en rupture de stock
CREATE OR REPLACE VIEW low_stock_products AS
SELECT 
  id,
  name,
  sku,
  stock,
  price,
  CASE 
    WHEN stock = 0 THEN 'out_of_stock'
    WHEN stock <= 5 THEN 'critical'
    WHEN stock <= 10 THEN 'low'
    ELSE 'ok'
  END as stock_status
FROM products
WHERE stock <= 10 AND status = 'active'
ORDER BY stock ASC;

-- Vue: Statistiques de ventes (30 derniers jours)
CREATE OR REPLACE VIEW sales_stats_30d AS
SELECT 
  DATE(created_at) as sale_date,
  COUNT(*) as order_count,
  SUM(total) as total_revenue,
  AVG(total) as avg_order_value
FROM orders
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND status IN ('processing', 'shipped', 'delivered')
GROUP BY DATE(created_at)
ORDER BY sale_date DESC;

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Support Tickets
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own tickets" ON support_tickets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create tickets" ON support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Ticket Messages
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own ticket messages" ON ticket_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM support_tickets 
      WHERE id = ticket_messages.ticket_id 
      AND user_id = auth.uid()
    )
  );

-- Public read access
CREATE POLICY "Public can read shipping methods" ON shipping_methods
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Public can read promotional banners" ON promotional_banners
  FOR SELECT USING (is_active = TRUE AND NOW() BETWEEN start_date AND end_date);

-- ============================================
-- 7. DONNÉES DE TEST ENRICHIES
-- ============================================

-- Méthodes de livraison
INSERT INTO shipping_methods (name, description, price, estimated_days_min, estimated_days_max, free_shipping_threshold) VALUES
('Standard', 'Livraison standard', 4.99, 3, 5, 50.00),
('Express', 'Livraison express 24-48h', 9.99, 1, 2, 100.00),
('Premium', 'Livraison le jour même (Paris uniquement)', 14.99, 0, 1, 150.00),
('Click & Collect', 'Retrait en magasin gratuit', 0.00, 0, 1, 0.00);

-- Templates d'emails
INSERT INTO email_templates (name, subject, body_html, body_text, variables) VALUES
('order_confirmation', 'Confirmation de commande #{{order_number}}', 
 '<h1>Merci pour votre commande!</h1><p>Numéro: {{order_number}}</p><p>Total: {{total}}€</p>',
 'Merci pour votre commande! Numéro: {{order_number}}, Total: {{total}}€',
 '["order_number", "total", "items"]'::jsonb),
 
('shipping_notification', 'Votre commande #{{order_number}} a été expédiée', 
 '<h1>Votre commande est en route!</h1><p>Numéro de suivi: {{tracking_number}}</p>',
 'Votre commande est en route! Numéro de suivi: {{tracking_number}}',
 '["order_number", "tracking_number"]'::jsonb),
 
('password_reset', 'Réinitialisation de votre mot de passe', 
 '<h1>Réinitialisation de mot de passe</h1><p><a href="{{reset_link}}">Cliquez ici</a></p>',
 'Réinitialisation de mot de passe: {{reset_link}}',
 '["reset_link"]'::jsonb);

-- Bannières promotionnelles
INSERT INTO promotional_banners (title, description, image_url, link_url, button_text, position, start_date, end_date) VALUES
('Soldes d''hiver -50%', 'Profitez de réductions exceptionnelles', 
 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200', 
 '/products?sale=true', 'Découvrir', 1, NOW(), NOW() + INTERVAL '30 days'),
 
('Livraison gratuite', 'Dès 50€ d''achat', 
 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=1200', 
 '/products', 'Profiter', 2, NOW(), NOW() + INTERVAL '60 days');

-- Plus de produits variés
INSERT INTO products (name, slug, description, short_description, price, compare_at_price, sku, stock, images, category_id, brand, is_featured, is_new_arrival, status) VALUES
-- Électronique
('Laptop Pro 15"', 'laptop-pro-15', 'Ordinateur portable professionnel haute performance', '16GB RAM, 512GB SSD, Intel i7', 1299.00, 1599.00, 'ELEC-001', 25,
 '[{"id":"1","url":"https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600","alt":"Laptop","isPrimary":true,"order":1}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'electronics'), 'TechPro', true, true, 'active'),

('Souris Gaming RGB', 'souris-gaming-rgb', 'Souris gamer avec éclairage RGB personnalisable', '16000 DPI, 8 boutons programmables', 59.90, 79.90, 'ELEC-002', 150,
 '[{"id":"1","url":"https://images.unsplash.com/photo-1527814050087-3793815479db?w=600","alt":"Gaming Mouse","isPrimary":true,"order":1}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'electronics'), 'GamerTech', false, true, 'active'),

('Écouteurs Sans Fil Pro', 'ecouteurs-sans-fil-pro', 'Écouteurs Bluetooth avec réduction de bruit', 'ANC, 30h autonomie, Bluetooth 5.2', 149.00, 199.00, 'ELEC-003', 80,
 '[{"id":"1","url":"https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600","alt":"Headphones","isPrimary":true,"order":1}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'electronics'), 'AudioMax', true, false, 'active'),

-- Mode
('Jean Slim Noir', 'jean-slim-noir', 'Jean slim confortable en denim stretch', '98% coton, 2% élasthanne', 79.90, NULL, 'MODE-001', 200,
 '[{"id":"1","url":"https://images.unsplash.com/photo-1542272604-787c3835535d?w=600","alt":"Jeans","isPrimary":true,"order":1}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'fashion'), 'UrbanStyle', false, false, 'active'),

('Veste en Cuir Premium', 'veste-cuir-premium', 'Veste en cuir véritable fait main', '100% cuir véritable, doublure soie', 399.00, 599.00, 'MODE-002', 15,
 '[{"id":"1","url":"https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600","alt":"Leather Jacket","isPrimary":true,"order":1}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'fashion'), 'LuxLeather', true, true, 'active'),

-- Maison
('Cafetière Espresso Automatique', 'cafetiere-espresso', 'Machine à café automatique avec broyeur intégré', '15 bars, écran tactile, 2L', 449.00, 599.00, 'HOME-001', 35,
 '[{"id":"1","url":"https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=600","alt":"Coffee Machine","isPrimary":true,"order":1}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'home'), 'HomeBrew', true, false, 'active'),

('Set de Couteaux Chef', 'set-couteaux-chef', 'Set professionnel de 6 couteaux en acier japonais', 'Acier damassé, manche ergonomique', 199.00, 299.00, 'HOME-002', 50,
 '[{"id":"1","url":"https://images.unsplash.com/photo-1593618998160-e34014e67546?w=600","alt":"Knife Set","isPrimary":true,"order":1}]'::jsonb,
 (SELECT id FROM categories WHERE slug = 'home'), 'ChefPro', false, true, 'active');

-- Reviews produits
INSERT INTO reviews (product_id, user_id, rating, title, comment, verified_purchase) VALUES
((SELECT id FROM products WHERE slug = 'smartphone-premium-x1'), 
 (SELECT id FROM users LIMIT 1), 5, 'Excellent produit!', 'Très satisfait de mon achat, performances au top!', true),

((SELECT id FROM products WHERE slug = 'casque-audio-bluetooth'),
 (SELECT id FROM users LIMIT 1), 4, 'Très bon rapport qualité/prix', 'Le son est excellent, léger manque de basses.', true);

-- Product recommendations
INSERT INTO product_recommendations (product_id, recommended_product_id, score, type)
SELECT 
  p1.id,
  p2.id,
  95.0,
  'similar'
FROM products p1, products p2
WHERE p1.slug = 'smartphone-premium-x1' 
  AND p2.slug = 'casque-audio-bluetooth';

