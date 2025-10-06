# 🔒 GUIDE DE SÉCURITÉ - ShopLux

## 📋 Table des matières
1. [Vue d'ensemble](#vue-densemble)
2. [Mesures de sécurité implémentées](#mesures-de-sécurité-implémentées)
3. [Configuration requise](#configuration-requise)
4. [Bonnes pratiques](#bonnes-pratiques)
5. [Vulnérabilités connues](#vulnérabilités-connues)
6. [Checklist de déploiement](#checklist-de-déploiement)

---

## 🎯 Vue d'ensemble

ShopLux est une plateforme e-commerce sécurisée qui implémente plusieurs couches de protection contre les attaques courantes.

### Score de sécurité global: **B+ (85/100)**

---

## ✅ Mesures de sécurité implémentées

### 1. **Authentification & Autorisation**
- ✅ **Supabase Auth** - Authentification JWT sécurisée
- ✅ **Google OAuth 2.0** - Connexion sociale sécurisée
- ✅ **Guards Angular** - Protection des routes côté client
- ✅ **RLS (Row Level Security)** - Protection des données côté serveur
- ✅ **Rôles utilisateurs** - Admin / Customer avec permissions

### 2. **Protection contre les attaques**

#### **SQL Injection** 🛡️
- ✅ Supabase utilise des requêtes paramétrées
- ✅ Aucune concaténation de SQL raw
- **Score: 10/10**

#### **XSS (Cross-Site Scripting)** 🛡️
- ✅ Angular sanitize automatiquement le HTML
- ✅ Content-Security-Policy (CSP) configuré
- ✅ X-XSS-Protection header actif
- ⚠️ `unsafe-inline` et `unsafe-eval` nécessaires pour Angular
- **Score: 8/10**

#### **CSRF (Cross-Site Request Forgery)** ⚠️
- ⚠️ Protection partielle via SameSite cookies
- ⚠️ Supabase JWT protège partiellement
- ❌ Pas de tokens CSRF dédiés
- **Score: 6/10**

#### **Clickjacking** 🛡️
- ✅ X-Frame-Options: DENY
- ✅ Empêche l'intégration dans des iframes
- **Score: 10/10**

#### **Man-in-the-Middle (MITM)** 🛡️
- ✅ HTTPS forcé par Vercel
- ✅ HSTS (HTTP Strict Transport Security) activé
- ✅ Certificat SSL automatique
- **Score: 10/10**

#### **Brute Force** ⚠️
- ⚠️ Supabase limite les tentatives de connexion
- ❌ Pas de rate limiting personnalisé
- ❌ Pas de CAPTCHA
- **Score: 6/10**

#### **Session Hijacking** 🛡️
- ✅ Tokens JWT avec expiration courte
- ✅ Refresh tokens sécurisés
- ✅ HttpOnly cookies (Supabase)
- **Score: 9/10**

### 3. **Headers de sécurité HTTP**

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Content-Security-Policy: (voir vercel.json)
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### 4. **Protection des données sensibles**

#### **Mots de passe**
- ✅ Hachage bcrypt automatique (Supabase)
- ✅ Jamais stockés en clair
- ✅ Politique de mot de passe minimum 6 caractères

#### **Données personnelles**
- ✅ RLS Supabase empêche l'accès non autorisé
- ✅ Les utilisateurs voient uniquement leurs données
- ✅ Les admins ont des permissions spéciales

#### **Paiements**
- ⚠️ Clés API Stripe en clair dans le code
- ✅ Stripe gère la sécurité PCI-DSS
- ⚠️ Wave/Orange Money à implémenter en backend

### 5. **Storage & Upload**

#### **Avatar Supabase Storage**
- ✅ Taille max 2 MB
- ✅ Types MIME validés
- ✅ RLS sur le bucket storage
- ⚠️ Pas de scan antivirus

---

## ⚙️ Configuration requise

### **1. Variables d'environnement**

**IMPORTANT:** Ne JAMAIS commiter les clés en production dans Git !

```bash
# .env.production (NE PAS COMMITER)
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### **2. Supabase RLS**

Exécuter la migration de sécurité :

```bash
cd supabase
supabase db push --file migrations/20251007000000_secure_rls_final.sql
```

### **3. Supabase Auth**

Dans le dashboard Supabase:
- **Site URL:** `https://votre-domaine.vercel.app`
- **Redirect URLs:** `https://votre-domaine.vercel.app/**`
- **Email templates:** Personnalisés
- **Rate limiting:** Activé

### **4. Google OAuth**

Dans Google Cloud Console:
- **Authorized JavaScript origins:**
  ```
  https://votre-domaine.vercel.app
  https://votre-projet.supabase.co
  ```
- **Authorized redirect URIs:**
  ```
  https://votre-domaine.vercel.app/auth/callback
  https://votre-projet.supabase.co/auth/v1/callback
  ```

---

## 🔐 Bonnes pratiques

### **Pour les développeurs**

1. **Ne jamais désactiver RLS** sans raison valide
2. **Toujours valider les entrées** côté client ET serveur
3. **Utiliser les guards Angular** pour toutes les routes protégées
4. **Logger les actions sensibles** (changement de rôle, etc.)
5. **Tester avec des utilisateurs non-admin** pour vérifier les permissions

### **Pour les admins**

1. **Changer le mot de passe admin** régulièrement
2. **Activer l'authentification 2FA** (Google Authenticator)
3. **Monitorer les logs Supabase** pour détecter les activités suspectes
4. **Limiter le nombre d'admins** au strict minimum
5. **Faire des backups réguliers** de la base de données

### **Pour les utilisateurs**

1. Utiliser un **mot de passe fort** (12+ caractères)
2. Activer la **connexion Google** pour plus de sécurité
3. Ne jamais partager son **mot de passe**
4. Se déconnecter après utilisation sur un ordinateur partagé

---

## ⚠️ Vulnérabilités connues

### **CRITIQUES** 🚨

| Vulnérabilité | Risque | Solution | Statut |
|---------------|--------|----------|--------|
| ~~RLS désactivé sur `users`~~ | ~~CRITIQUE~~ | ~~Migration 20251007000000~~ | ✅ **CORRIGÉ** |
| Clés API dans le code source | HAUTE | Variables d'environnement | ⚠️ **À faire** |
| Pas de rate limiting personnalisé | MOYENNE | Cloudflare ou Vercel Edge | ⏳ **Futur** |

### **MOYENNES** ⚠️

- Pas de CAPTCHA sur le login (bots possibles)
- Pas de scan antivirus sur les uploads
- `unsafe-inline` dans CSP (requis par Angular)
- Pas de monitoring des tentatives d'intrusion

### **BASSES** ℹ️

- Pas de politique de mot de passe strict (8+ caractères recommandé)
- Pas de 2FA par défaut
- Pas de blocage IP automatique

---

## 📋 Checklist de déploiement

### **Avant le déploiement**

- [ ] Exécuter la migration de sécurité RLS
- [ ] Configurer les variables d'environnement sur Vercel
- [ ] Tester l'authentification Google
- [ ] Vérifier que RLS est actif sur toutes les tables
- [ ] Tester les permissions admin/customer
- [ ] Vérifier les headers de sécurité

### **Après le déploiement**

- [ ] Tester le site avec un compte non-admin
- [ ] Essayer d'accéder à `/admin` sans être admin
- [ ] Vérifier les logs Supabase
- [ ] Tester les paiements en mode test
- [ ] Scan de sécurité avec [Mozilla Observatory](https://observatory.mozilla.org/)
- [ ] Test SSL avec [SSL Labs](https://www.ssllabs.com/ssltest/)

### **Maintenance régulière**

- [ ] Mettre à jour les dépendances npm (`npm audit`)
- [ ] Vérifier les logs Supabase (hebdomadaire)
- [ ] Backup de la base de données (quotidien)
- [ ] Audit de sécurité (trimestriel)
- [ ] Renouveler les clés API (annuel)

---

## 🆘 En cas de problème

### **Compte compromis**

1. Changer immédiatement le mot de passe Supabase
2. Révoquer toutes les sessions actives
3. Vérifier les logs pour les activités suspectes
4. Notifier les utilisateurs concernés

### **Brèche de sécurité**

1. **Isoler** le système affecté
2. **Analyser** les logs Supabase et Vercel
3. **Corriger** la vulnérabilité
4. **Notifier** les utilisateurs (RGPD)
5. **Documenter** l'incident

### **Contact sécurité**

Pour signaler une vulnérabilité: security@shoplux.com

---

## 📚 Ressources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Angular Security](https://angular.io/guide/security)
- [Vercel Security](https://vercel.com/docs/security/overview)

---

**Dernière mise à jour:** 2025-10-07  
**Version:** 1.0.0  
**Niveau de sécurité:** B+ (85/100)

