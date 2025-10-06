-- Fix: Ajouter la politique INSERT pour les notifications
-- Actuellement les utilisateurs ne peuvent pas créer leurs propres notifications

-- Ajouter la politique pour permettre aux utilisateurs de créer des notifications pour eux-mêmes
CREATE POLICY "Users can create own notifications" ON notifications
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Ajouter une politique pour permettre au système de créer des notifications
-- (en utilisant le service_role qui bypass RLS)

