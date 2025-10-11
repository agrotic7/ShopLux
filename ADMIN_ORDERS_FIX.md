# Correction du problème d'accès aux commandes pour les admins

## Problème identifié
L'admin ne peut voir que les commandes d'un seul utilisateur au lieu de toutes les commandes. Ce problème est causé par l'absence des politiques RLS (Row Level Security) pour les admins sur la table `orders`.

## Cause
Dans la migration `20251007120000_fix_infinite_recursion_rls.sql`, les politiques pour les admins sur les commandes ont été supprimées mais n'ont jamais été recréées :
- `admins_select_all_orders` (supprimée ligne 11)
- `admins_update_orders` (supprimée ligne 12)

## Solution
Exécuter le script SQL `fix_admin_orders.sql` directement sur la base de données de production.

## Instructions d'application

### Option 1: Via Supabase Dashboard (Recommandé)
1. Aller sur https://supabase.com/dashboard
2. Sélectionner le projet `tepiaptcwcrahugnfmcq`
3. Aller dans l'onglet "SQL Editor"
4. Copier et coller le contenu du fichier `fix_admin_orders.sql`
5. Exécuter le script

### Option 2: Via CLI Supabase (si Docker est disponible)
```bash
cd shoplux-frontend
npx supabase db push
```

## Vérification
Après avoir appliqué le correctif, exécuter le script `test_admin_orders.sql` pour vérifier que :
1. Les politiques admin existent sur la table orders
2. Les admins peuvent voir toutes les commandes
3. La fonction `is_admin()` fonctionne correctement

## Fichiers créés
- `fix_admin_orders.sql` - Script de correction
- `test_admin_orders.sql` - Script de vérification
- `supabase/migrations/20250108000000_fix_admin_orders_access.sql` - Migration pour l'environnement local

## Résultat attendu
Après application du correctif, l'admin devrait pouvoir voir toutes les commandes de tous les utilisateurs dans le panel d'administration.
