# 🔧 Fix Google OAuth Redirect URI Mismatch - ShopLux

## 🚨 **Problem**
You're getting this error when trying to sign in with Google:
```
Error 400: redirect_uri_mismatch
```

This happens when the redirect URI in your Google Cloud Console doesn't match the one your application is using.

## ✅ **Solution Steps**

### **Step 1: Google Cloud Console Configuration**

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**
2. **Select your project** (the one linked to your Supabase project)
3. **Navigate to:** APIs & Services → Credentials
4. **Find your OAuth 2.0 Client ID** and click on it
5. **Add these Authorized redirect URIs:**

```
# For local development:
http://localhost:4200/auth/callback
http://127.0.0.1:4200/auth/callback

# For production (replace with your actual domain):
https://shoplux.vercel.app/auth/callback
https://your-actual-domain.vercel.app/auth/callback

# For Supabase hosted auth:
https://tepiaptcwcrahugnfmcq.supabase.co/auth/v1/callback
```

6. **Add these Authorized JavaScript origins:**

```
# For local development:
http://localhost:4200
http://127.0.0.1:4200

# For production:
https://shoplux.vercel.app
https://your-actual-domain.vercel.app
```

7. **Click "Save"**

### **Step 2: Supabase Dashboard Configuration**

1. **Go to [Supabase Dashboard](https://supabase.com/dashboard)**
2. **Select your project:** `tepiaptcwcrahugnfmcq`
3. **Navigate to:** Authentication → URL Configuration
4. **Set Site URL:**
   ```
   https://shoplux.vercel.app
   ```
   (Replace with your actual production domain)

5. **Add these Redirect URLs:**
   ```
   https://shoplux.vercel.app/**
   https://shoplux.vercel.app/auth/callback
   http://localhost:4200/**
   http://localhost:4200/auth/callback
   ```

6. **Click "Save"**

### **Step 3: Verify Your Application Code**

Your application code is already correctly configured:

```typescript
// In auth.service.ts
async signInWithGoogle() {
  const { data, error } = await this.supabase.client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  });
}
```

This will automatically use the correct domain based on where your app is running.

### **Step 4: Test the Fix**

1. **Clear your browser cache and cookies**
2. **Try signing in with Google again**
3. **The redirect should now work properly**

## 🔍 **Troubleshooting**

### **If you're still getting the error:**

1. **Check the exact domain** in your browser's address bar
2. **Make sure the domain matches** what you configured in Google Cloud Console
3. **Wait a few minutes** for Google's changes to propagate
4. **Try in an incognito/private browser window**

### **Common Issues:**

- **Wrong domain:** Make sure you're using the exact domain (including subdomain)
- **HTTP vs HTTPS:** Use HTTPS for production, HTTP for local development
- **Trailing slashes:** Don't add trailing slashes to redirect URIs
- **Case sensitivity:** URLs are case-sensitive

### **For Different Environments:**

#### **Local Development:**
```
Authorized redirect URIs:
http://localhost:4200/auth/callback
http://127.0.0.1:4200/auth/callback
```

#### **Vercel Preview:**
```
Authorized redirect URIs:
https://shoplux-git-branch.vercel.app/auth/callback
```

#### **Production:**
```
Authorized redirect URIs:
https://shoplux.vercel.app/auth/callback
https://your-custom-domain.com/auth/callback
```

## 📝 **Quick Checklist**

- [ ] Added correct redirect URIs in Google Cloud Console
- [ ] Added correct JavaScript origins in Google Cloud Console
- [ ] Updated Supabase Site URL
- [ ] Updated Supabase Redirect URLs
- [ ] Cleared browser cache
- [ ] Tested in incognito mode
- [ ] Verified the exact domain being used

## 🆘 **Still Having Issues?**

If you're still experiencing problems:

1. **Check the browser's developer console** for more detailed error messages
2. **Verify your Google OAuth client ID** is correct in Supabase
3. **Make sure your Supabase project** has Google OAuth enabled
4. **Contact support** with the exact error message and domain you're using

---

**Note:** Changes to Google Cloud Console can take a few minutes to propagate. If you just made changes, wait 5-10 minutes before testing again.



