# 🚀 Configuration des Variables d'Environnement Vercel

## 📋 Variables d'Environnement Requises

### 🔐 Variables Supabase
```bash
SUPABASE_URL=https://tepiaptcwcrahugnfmcq.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlcGlhcHRjd2NyYWh1Z25mbWNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NTg3ODIsImV4cCI6MjA3NTMzNDc4Mn0.tqdUV3r918BZ5X3wOveuap66mTgRh7HTJqDIW3o-8Iw
```

### 💳 Variables Stripe (Optionnel)
```bash
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_STRIPE_LIVE_KEY
STRIPE_SECRET_KEY=sk_live_YOUR_STRIPE_SECRET_KEY
```

### 📊 Variables Google Analytics
```bash
GA4_MEASUREMENT_ID=G-CDQJPD85DY
```

### 🌐 Variables d'Application
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://shoplux.vercel.app
```

## 🛠️ Configuration via Vercel CLI

### 1. Installation de Vercel CLI
```bash
npm i -g vercel
```

### 2. Connexion à Vercel
```bash
vercel login
```

### 3. Lier le projet
```bash
vercel link
```

### 4. Ajouter les variables d'environnement
```bash
# Supabase
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY

# Stripe (si utilisé)
vercel env add STRIPE_PUBLISHABLE_KEY
vercel env add STRIPE_SECRET_KEY

# Google Analytics
vercel env add GA4_MEASUREMENT_ID

# Application
vercel env add NODE_ENV
vercel env add NEXT_PUBLIC_APP_URL
```

### 5. Déployer
```bash
vercel --prod
```

## 🌐 Configuration via Dashboard Vercel

### 1. Accéder au Dashboard
- Allez sur [vercel.com](https://vercel.com)
- Connectez-vous à votre compte
- Sélectionnez votre projet ShopLux

### 2. Ajouter les Variables
- Allez dans **Settings** → **Environment Variables**
- Cliquez sur **Add New**
- Ajoutez chaque variable avec sa valeur

### 3. Environnements
- **Production** : Variables pour la production
- **Preview** : Variables pour les previews
- **Development** : Variables pour le développement

## 📝 Exemple de Configuration Complète

### Variables de Production
```bash
SUPABASE_URL=https://tepiaptcwcrahugnfmcq.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlcGlhcHRjd2NyYWh1Z25mbWNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NTg3ODIsImV4cCI6MjA3NTMzNDc4Mn0.tqdUV3r918BZ5X3wOveuap66mTgRh7HTJqDIW3o-8Iw
STRIPE_PUBLISHABLE_KEY=pk_live_51ABC123...
STRIPE_SECRET_KEY=sk_live_51ABC123...
GA4_MEASUREMENT_ID=G-CDQJPD85DY
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://shoplux.vercel.app
```

### Variables de Staging
```bash
SUPABASE_URL=https://tepiaptcwcrahugnfmcq.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlcGlhcHRjd2NyYWh1Z25mbWNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NTg3ODIsImV4cCI6MjA3NTMzNDc4Mn0.tqdUV3r918BZ5X3wOveuap66mTgRh7HTJqDIW3o-8Iw
STRIPE_PUBLISHABLE_KEY=pk_test_51ABC123...
STRIPE_SECRET_KEY=sk_test_51ABC123...
GA4_MEASUREMENT_ID=G-CDQJPD85DY
NODE_ENV=staging
NEXT_PUBLIC_APP_URL=https://shoplux-staging.vercel.app
```

## 🔧 Configuration du Build

### Scripts package.json
```json
{
  "scripts": {
    "build": "ng build --configuration=production",
    "build:staging": "ng build --configuration=staging",
    "vercel-build": "ng build --configuration=production"
  }
}
```

### Configuration Angular
```json
{
  "build": {
    "configurations": {
      "production": {
        "fileReplacements": [
          {
            "replace": "src/environments/environment.ts",
            "with": "src/environments/environment.prod.ts"
          }
        ]
      },
      "staging": {
        "fileReplacements": [
          {
            "replace": "src/environments/environment.ts",
            "with": "src/environments/environment.staging.ts"
          }
        ]
      }
    }
  }
}
```

## 🚀 Déploiement

### 1. Build Local
```bash
npm run build
```

### 2. Déploiement Vercel
```bash
vercel --prod
```

### 3. Vérification
- Vérifiez que toutes les variables sont correctement chargées
- Testez les fonctionnalités principales
- Vérifiez les logs dans le dashboard Vercel

## 🔍 Debugging

### Vérifier les Variables
```typescript
// Dans votre composant Angular
console.log('Environment:', environment);
console.log('Supabase URL:', environment.supabase.url);
```

### Logs Vercel
- Allez dans **Functions** → **View Function Logs**
- Vérifiez les erreurs de build
- Consultez les logs runtime

## ⚠️ Sécurité

### Variables Sensibles
- ❌ Ne jamais commiter les clés secrètes
- ✅ Utiliser les variables d'environnement Vercel
- ✅ Utiliser des clés différentes pour dev/staging/prod
- ✅ Rotation régulière des clés

### Bonnes Pratiques
- Utiliser des noms de variables explicites
- Documenter chaque variable
- Tester en staging avant la production
- Monitorer l'utilisation des API

## 📞 Support

En cas de problème :
1. Vérifiez les logs Vercel
2. Consultez la documentation Vercel
3. Vérifiez la configuration des variables
4. Testez en local avec les mêmes variables
