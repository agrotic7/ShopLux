# 🔐 Accès à l'Interface Admin - ShopLux

## 🚀 Comment devenir Administrateur

### Méthode 1 : Via l'interface web (Recommandée)

1. **Connectez-vous** à votre compte sur ShopLux
2. **Cliquez sur votre avatar** en haut à droite
3. **Sélectionnez "Promotion Admin"** dans le menu déroulant
4. **Entrez votre mot de passe** de connexion
5. **Cliquez sur "Promouvoir en Admin"**
6. **Vous serez automatiquement redirigé** vers l'interface admin

### Méthode 2 : Via l'URL directe

1. **Connectez-vous** à votre compte
2. **Naviguez vers** : `http://localhost:4200/promote-admin`
3. **Suivez les étapes** de la méthode 1

### Méthode 3 : Via Supabase SQL Editor

1. **Ouvrez votre projet Supabase**
2. **Allez dans l'onglet "SQL Editor"**
3. **Exécutez cette requête** (remplacez l'email par le vôtre) :

```sql
UPDATE users 
SET role = 'admin' 
WHERE email = 'votre-email@example.com';
```

4. **Vérifiez** avec cette requête :
```sql
SELECT email, role FROM users WHERE email = 'votre-email@example.com';
```

## 🎯 Accès à l'Interface Admin

Une fois que vous avez le rôle `'admin'` :

1. **Naviguez vers** : `http://localhost:4200/admin`
2. **Ou cliquez sur "Promotion Admin"** dans le menu utilisateur

## 📊 Fonctionnalités Admin Disponibles

### 🏠 Dashboard
- **Statistiques en temps réel** : CA, commandes, clients, produits
- **Commandes récentes** : 5 dernières commandes
- **Raccourcis rapides** vers toutes les sections

### 🛍️ Gestion des Produits
- **CRUD Complet** : Créer, Modifier, Supprimer, Activer/Désactiver
- **Filtres avancés** : Recherche, catégorie, statut
- **Gestion des images** et spécifications
- **Badges** : Vedette, Nouvelle arrivée, Meilleure vente

### 📦 Gestion des Commandes
- **Liste complète** avec filtres
- **Modification des statuts** en temps réel
- **Détails des commandes** et clients
- **Suivi des paiements** et livraisons

### 👥 Gestion des Clients
- **Liste de tous les utilisateurs**
- **Statistiques par client** : commandes, points de fidélité
- **Recherche et filtrage**
- **Gestion des rôles**

## 🔧 Structure Technique

### Routes Admin
```
/admin                    → Dashboard principal
/admin/products          → Gestion des produits
/admin/orders            → Gestion des commandes
/admin/customers         → Gestion des clients
/promote-admin           → Page de promotion admin
```

### Protection d'Accès
- **adminGuard** : Vérifie que l'utilisateur a le rôle `'admin'`
- **Redirection automatique** si non autorisé
- **Session persistante** avec Supabase

### Base de Données
- **Table `users`** : Champ `role` avec valeurs `'customer'` ou `'admin'`
- **RLS (Row Level Security)** : Sécurité au niveau des lignes
- **Policies** : Accès contrôlé selon le rôle

## 🚨 Dépannage

### Problème : "Vous n'avez pas accès"
**Solution** : Vérifiez que votre rôle est bien `'admin'` dans la base de données

### Problème : Redirection vers la page d'accueil
**Solution** : Votre compte n'a pas le rôle admin, utilisez la page de promotion

### Problème : Erreur de mot de passe
**Solution** : Utilisez le mot de passe de votre compte de connexion

## 📝 Notes Importantes

- **Sécurité** : Seuls les utilisateurs avec le rôle `'admin'` peuvent accéder
- **Persistance** : Le rôle est sauvegardé en base de données
- **Interface** : Design moderne et responsive
- **Performance** : Chargement optimisé avec lazy loading

## 🎉 Félicitations !

Vous avez maintenant accès à l'interface d'administration complète de ShopLux ! 🚀
