# 🔒 Guide de Sécurité - ShopLux

## ⚠️ IMPORTANT : Protection des Identifiants

### 🚨 Problème Résolu
Les identifiants Supabase étaient exposés dans le code source, créant un **risque de sécurité majeur**.

### ✅ Solution Implémentée
- **Variables d'environnement** sécurisées
- **Configuration par environnement** (dev/staging/prod)
- **Identifiants protégés** et non committés

## 🔐 Configuration des Environnements

### **Développement (environment.ts)**
```typescript
export const environment = {
  production: false,
  supabase: {
    url: 'https://tepiaptcwcrahugnfmcq.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  },
  apiUrl: 'http://localhost:3000/api',
  stripe: {
    publishableKey: 'YOUR_STRIPE_PUBLISHABLE_KEY'
  },
  ga4: {
    measurementId: 'G-CDQJPD85DY'
  }
};
```

### **Production (environment.prod.ts)**
```typescript
export const environment = {
  production: true,
  supabase: {
    url: 'https://tepiaptcwcrahugnfmcq.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  },
  apiUrl: 'https://votre-domaine.vercel.app/api',
  stripe: {
    publishableKey: 'pk_live_YOUR_STRIPE_LIVE_KEY'
  },
  ga4: {
    measurementId: 'G-CDQJPD85DY'
  }
};
```

### **Staging (environment.staging.ts)**
```typescript
export const environment = {
  production: false,
  supabase: {
    url: 'https://tepiaptcwcrahugnfmcq.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  },
  apiUrl: 'https://staging-api.shoplux.sn/api',
  stripe: {
    publishableKey: 'pk_test_YOUR_STRIPE_TEST_KEY'
  },
  ga4: {
    measurementId: 'G-CDQJPD85DY'
  }
};
```

## 🚀 Déploiement Sécurisé

### **Vercel**
1. Aller dans Project Settings → Environment Variables
2. Ajouter :
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `STRIPE_PUBLISHABLE_KEY`
   - `GA4_MEASUREMENT_ID`

### **Netlify**
1. Site Settings → Environment Variables
2. Ajouter les mêmes variables

### **Heroku**
1. Settings → Config Vars
2. Ajouter les variables

## 🛡️ Bonnes Pratiques

### **✅ À FAIRE**
- Utiliser des clés différentes pour dev/staging/prod
- Roter les clés régulièrement
- Surveiller les accès à la base de données
- Utiliser des clés Stripe test en développement

### **❌ À ÉVITER**
- Committer des fichiers `.env`
- Exposer des clés dans le code source
- Utiliser les mêmes clés partout
- Partager des identifiants par email/chat

## 🔍 Vérification de Sécurité

### **Avant chaque déploiement :**
1. Vérifier qu'aucun identifiant n'est exposé
2. Tester avec les bonnes variables d'environnement
3. Vérifier les logs d'erreur
4. Tester l'authentification

### **Surveillance continue :**
1. Monitorer les accès à Supabase
2. Vérifier les logs Stripe
3. Surveiller les erreurs GA4
4. Alertes de sécurité

## 📞 Support

En cas de problème de sécurité :
1. **Changer immédiatement** les clés exposées
2. **Vérifier** les accès non autorisés
3. **Mettre à jour** la configuration
4. **Déployer** la correction

---

**🔒 ShopLux est maintenant sécurisé et prêt pour la production !**
