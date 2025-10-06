# 🔒 DÉPLOIEMENT SÉCURISÉ - ShopLux

## ⚠️ ÉTAPES CRITIQUES AVANT LE DÉPLOIEMENT

### 1️⃣ **Appliquer la migration de sécurité RLS**

**IMPORTANT:** Cette migration est **CRITIQUE** pour la sécurité !

#### Option A: Via Supabase CLI (Recommandé)

```bash
# 1. Installer Supabase CLI (si pas déjà fait)
npm install -g supabase

# 2. Se connecter à votre projet
supabase login

# 3. Lier votre projet local
supabase link --project-ref tepiaptcwcrahugnfmcq

# 4. Appliquer la migration
supabase db push
```

#### Option B: Via Dashboard Supabase

1. Allez sur [supabase.com](https://supabase.com/dashboard)
2. Ouvrez votre projet `tepiaptcwcrahugnfmcq`
3. Cliquez sur **SQL Editor**
4. Copiez-collez le contenu de `supabase/migrations/20251007000000_secure_rls_final.sql`
5. Cliquez sur **Run**
6. Vérifiez qu'il n'y a pas d'erreurs

#### Vérification

Pour vérifier que RLS est actif :

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'orders', 'products', 'reviews', 'addresses');
```

Toutes les tables doivent avoir `rowsecurity = true`.

---

### 2️⃣ **Configurer les URLs autorisées**

#### Dans Supabase Dashboard:

1. **Authentication** → **URL Configuration**
2. Ajoutez votre URL Vercel :

```
Site URL: https://votre-app.vercel.app

Redirect URLs:
https://votre-app.vercel.app/**
https://votre-app.vercel.app/auth/callback
http://localhost:4200/** (pour développement)
```

---

### 3️⃣ **Variables d'environnement Vercel**

Dans **Vercel Dashboard** → **Settings** → **Environment Variables** :

```bash
VITE_SUPABASE_URL=https://tepiaptcwcrahugnfmcq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **Cochez les 3 environnements**: Production, Preview, Development

---

### 4️⃣ **Google OAuth (si utilisé)**

#### Dans Google Cloud Console:

1. **APIs & Services** → **Credentials**
2. Modifiez votre OAuth 2.0 Client ID
3. **Authorized JavaScript origins:**
   ```
   https://votre-app.vercel.app
   https://tepiaptcwcrahugnfmcq.supabase.co
   ```

4. **Authorized redirect URIs:**
   ```
   https://votre-app.vercel.app/auth/callback
   https://tepiaptcwcrahugnfmcq.supabase.co/auth/v1/callback
   ```

---

### 5️⃣ **Tester la sécurité**

#### Test 1: Essayer d'accéder aux données d'un autre utilisateur

```javascript
// Dans la console du navigateur
// Vous ne devriez PAS pouvoir voir d'autres utilisateurs
const { data, error } = await supabase
  .from('users')
  .select('*')

console.log(data) // Devrait montrer uniquement VOTRE profil
```

#### Test 2: Essayer de modifier votre rôle

```javascript
// Ceci devrait ÉCHOUER
const { error } = await supabase
  .from('users')
  .update({ role: 'admin' })
  .eq('id', 'votre-user-id')

console.log(error) // Devrait montrer une erreur RLS
```

#### Test 3: Accès admin

1. Créez un compte test normal
2. Essayez d'accéder à `/admin`
3. Vous devriez être redirigé vers `/account/dashboard`

---

## 📋 Checklist de déploiement

### Avant de pousser sur Vercel:

- [ ] Migration RLS appliquée sur Supabase
- [ ] URLs autorisées configurées
- [ ] Variables d'environnement Vercel configurées
- [ ] Google OAuth configuré (si utilisé)
- [ ] Headers de sécurité dans `vercel.json`
- [ ] Aucun secret dans le code
- [ ] `npm audit` passé sans erreurs critiques

### Après le déploiement:

- [ ] Tester l'authentification
- [ ] Tester Google OAuth
- [ ] Vérifier qu'un user normal ne peut pas accéder à `/admin`
- [ ] Vérifier les headers HTTP avec [Security Headers](https://securityheaders.com/)
- [ ] Tester un paiement (mode test)
- [ ] Vérifier les logs Supabase

---

## 🆘 Dépannage

### "Error: relation does not exist"

Vous avez oublié d'appliquer les migrations :

```bash
supabase db push
```

### "Row Level Security policy violation"

C'est **NORMAL** ! RLS fonctionne correctement et empêche l'accès non autorisé.

Vérifiez que vous êtes authentifié :

```javascript
const { data: { user } } = await supabase.auth.getUser()
console.log(user) // Doit afficher votre utilisateur
```

### "Google OAuth redirect error"

Vérifiez les URLs autorisées dans Google Cloud Console ET Supabase Dashboard.

### Headers non appliqués

Vercel peut mettre jusqu'à 5 minutes pour appliquer les nouveaux headers.

Testez avec :

```bash
curl -I https://votre-app.vercel.app
```

---

## 🔍 Audit de sécurité

Après le déploiement, exécutez :

```bash
chmod +x security-audit.sh
./security-audit.sh
```

Score minimum requis : **70%** (BON)

---

## 📚 Documentation

- [SECURITY.md](./SECURITY.md) - Guide complet de sécurité
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Vercel Security](https://vercel.com/docs/security/overview)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

**🎯 Objectif:** Score de sécurité **B+** ou supérieur

**Dernière mise à jour:** 2025-10-07

