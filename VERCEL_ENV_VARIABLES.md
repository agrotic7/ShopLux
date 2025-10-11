# 🔐 Variables d'Environnement Vercel - ShopLux

## 📋 Liste des Variables à Configurer

### 🗄️ **1. Supabase (OBLIGATOIRE)**

#### Variable 1 : URL Supabase
```
Nom (Name):
SUPABASE_URL

Valeur (Value):
https://tepiaptcwcrahugnfmcq.supabase.co

Environnements:
☑️ Production
☑️ Preview
☑️ Development
```

#### Variable 2 : Clé Publique Supabase (Anon Key)
```
Nom (Name):
SUPABASE_ANON_KEY

Valeur (Value):
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlcGlhcHRjd2NyYWh1Z25mbWNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NTg3ODIsImV4cCI6MjA3NTMzNDc4Mn0.tqdUV3r918BZ5X3wOveuap66mTgRh7HTJqDIW3o-8Iw

Environnements:
☑️ Production
☑️ Preview
☑️ Development
```

---

### 💳 **2. Wave Payment (OBLIGATOIRE)**

#### Variable 3 : Lien de Paiement Wave
```
Nom (Name):
WAVE_PAYMENT_URL

Valeur (Value):
https://pay.wave.com/m/M_sn_l1suFj7U33OF/c/sn/

Environnements:
☑️ Production
☑️ Preview
☑️ Development
```

---

### 📊 **3. Google Analytics 4 (OPTIONNEL)**

#### Variable 4 : Measurement ID GA4
```
Nom (Name):
GA4_MEASUREMENT_ID

Valeur (Value):
G-CDQJPD85DY

Environnements:
☑️ Production
☐ Preview (optionnel)
☐ Development (non recommandé)
```

---

### 🔑 **4. API URL (OPTIONNEL - Pour fonctionnalités futures)**

#### Variable 5 : URL de l'API Backend
```
Nom (Name):
API_URL

Valeur (Value - Production):
https://votre-api.vercel.app/api

Valeur (Value - Development):
http://localhost:3000/api

Environnements:
☑️ Production
☑️ Preview
☑️ Development
```

---

## 🚀 Comment Configurer sur Vercel

### Méthode 1 : Via le Dashboard Vercel (Recommandé)

1. **Accédez à votre projet Vercel**
   - Allez sur [vercel.com](https://vercel.com)
   - Sélectionnez votre projet ShopLux

2. **Accédez aux Settings**
   - Cliquez sur l'onglet **Settings**

3. **Ouvrez Environment Variables**
   - Dans le menu de gauche, cliquez sur **Environment Variables**

4. **Ajoutez chaque variable**
   - Cliquez sur **Add New**
   - Remplissez :
     - **Name** : Le nom de la variable (ex: `SUPABASE_URL`)
     - **Value** : La valeur correspondante
     - **Environments** : Cochez Production, Preview, Development

5. **Sauvegardez**
   - Cliquez sur **Save**
   - Répétez pour chaque variable

6. **Redéployez**
   - Après avoir ajouté toutes les variables
   - Allez dans l'onglet **Deployments**
   - Cliquez sur les 3 points du dernier déploiement
   - Cliquez sur **Redeploy**

---

### Méthode 2 : Via Vercel CLI

```bash
# Installer Vercel CLI si pas déjà fait
npm i -g vercel

# Se connecter
vercel login

# Se placer dans le dossier du projet
cd shoplux-frontend

# Ajouter les variables une par une
vercel env add SUPABASE_URL
# Puis entrer la valeur quand demandé

vercel env add SUPABASE_ANON_KEY
# Puis entrer la valeur

vercel env add WAVE_PAYMENT_URL
# Puis entrer la valeur

vercel env add GA4_MEASUREMENT_ID
# Puis entrer la valeur

# Redéployer
vercel --prod
```

---

## 📝 Template à Copier-Coller

### Pour Vercel Dashboard

```
Variable 1:
Name: SUPABASE_URL
Value: https://tepiaptcwcrahugnfmcq.supabase.co

Variable 2:
Name: SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlcGlhcHRjd2NyYWh1Z25mbWNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NTg3ODIsImV4cCI6MjA3NTMzNDc4Mn0.tqdUV3r918BZ5X3wOveuap66mTgRh7HTJqDIW3o-8Iw

Variable 3:
Name: WAVE_PAYMENT_URL
Value: https://pay.wave.com/m/M_sn_l1suFj7U33OF/c/sn/

Variable 4:
Name: GA4_MEASUREMENT_ID
Value: G-CDQJPD85DY
```

---

## ⚠️ Important

### ✅ À FAIRE
- ✅ Configurer SUPABASE_URL (obligatoire)
- ✅ Configurer SUPABASE_ANON_KEY (obligatoire)
- ✅ Configurer WAVE_PAYMENT_URL (obligatoire pour paiements)
- ✅ Sélectionner tous les environnements (Production, Preview, Development)
- ✅ Redéployer après avoir ajouté toutes les variables

### ❌ À NE PAS FAIRE
- ❌ Ne jamais partager ces clés publiquement
- ❌ Ne jamais commit les clés dans Git (déjà géré avec .gitignore)
- ❌ Ne pas oublier de redéployer après modification

---

## 🔍 Vérification

Après configuration, vous pouvez vérifier que tout fonctionne :

1. **Allez sur votre site déployé**
2. **Ouvrez la console du navigateur** (F12)
3. **Vérifiez qu'il n'y a pas d'erreurs** liées à Supabase ou Wave
4. **Testez un paiement Wave** pour confirmer que le lien s'ouvre

---

## 🆘 Dépannage

### Erreur : "Supabase client error"
→ Vérifiez que `SUPABASE_URL` et `SUPABASE_ANON_KEY` sont correctement configurées

### Erreur : "Wave payment link not found"
→ Vérifiez que `WAVE_PAYMENT_URL` est configurée

### Les changements ne sont pas visibles
→ Vous devez redéployer après avoir modifié les variables d'environnement

### Comment redéployer ?
1. Allez dans **Deployments**
2. Cliquez sur les 3 points du dernier déploiement
3. Cliquez sur **Redeploy**

---

## 📊 Résumé Visuel

```
┌─────────────────────────────────────────────────┐
│  VERCEL ENVIRONMENT VARIABLES                   │
├─────────────────────────────────────────────────┤
│                                                 │
│  ✅ SUPABASE_URL                                │
│     https://tepiaptcwcrahugnfmcq.supabase.co   │
│                                                 │
│  ✅ SUPABASE_ANON_KEY                           │
│     eyJhbGciOiJIUzI1NiIsInR5cCI6...            │
│                                                 │
│  ✅ WAVE_PAYMENT_URL                            │
│     https://pay.wave.com/m/M_sn_l1suFj7U...    │
│                                                 │
│  📊 GA4_MEASUREMENT_ID (optionnel)              │
│     G-CDQJPD85DY                                │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 📱 Contact

Si vous avez des questions sur la configuration :
- Vérifiez que toutes les variables sont bien ajoutées
- Assurez-vous d'avoir redéployé
- Consultez les logs de déploiement Vercel

---

**Dernière mise à jour :** 8 octobre 2025  
**Version :** 1.0  
**Statut :** ✅ Prêt pour configuration


