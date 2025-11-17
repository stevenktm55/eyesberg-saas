# 🔧 Variables d'Environnement pour Vercel

## 📋 Instructions

1. Va dans **Vercel** → Projet `eyesberg-saas` → **Settings** → **Environment Variables**
2. Pour chaque variable ci-dessous :
   - Clique sur **Add New**
   - Copie-colle le **Name** et la **Value**
   - Coche **Production**, **Preview**, et **Development**
   - Clique sur **Save**

---

## ✅ Variables à Ajouter

### 1. NEXT_PUBLIC_SUPABASE_URL
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: [Copie depuis ton autre projet Vercel ou .env.local]
Environments: ✅ Production, ✅ Preview, ✅ Development
```

### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY
```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: [Copie depuis ton autre projet Vercel ou .env.local]
Environments: ✅ Production, ✅ Preview, ✅ Development
```

### 3. SUPABASE_SERVICE_ROLE_KEY
```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: [Copie depuis ton autre projet Vercel ou .env.local]
Environments: ✅ Production, ✅ Preview, ✅ Development
```

### 4. SHOPIFY_CLIENT_ID
```
Name: SHOPIFY_CLIENT_ID
Value: [Copie depuis ton autre projet Vercel ou .env.local]
Environments: ✅ Production, ✅ Preview, ✅ Development
```

### 5. SHOPIFY_CLIENT_SECRET
```
Name: SHOPIFY_CLIENT_SECRET
Value: [Copie depuis ton autre projet Vercel ou .env.local]
Environments: ✅ Production, ✅ Preview, ✅ Development
```

### 6. SHOPIFY_SCOPES
```
Name: SHOPIFY_SCOPES
Value: read_products,write_products,read_orders,write_script_tags
Environments: ✅ Production, ✅ Preview, ✅ Development
```

### 7. SHOPIFY_REDIRECT_URI
```
Name: SHOPIFY_REDIRECT_URI
Value: https://eyesberg.app/api/shopify/callback
Environments: ✅ Production, ✅ Preview, ✅ Development
```

### 8. NEXT_PUBLIC_SHOPIFY_CLIENT_ID
```
Name: NEXT_PUBLIC_SHOPIFY_CLIENT_ID
Value: [Même valeur que SHOPIFY_CLIENT_ID]
Environments: ✅ Production, ✅ Preview, ✅ Development
```

### 9. NEXT_PUBLIC_ROOT_DOMAIN
```
Name: NEXT_PUBLIC_ROOT_DOMAIN
Value: eyesberg.app
Environments: ✅ Production, ✅ Preview, ✅ Development
```

### 10. NEXT_PUBLIC_APP_URL
```
Name: NEXT_PUBLIC_APP_URL
Value: https://eyesberg.app
Environments: ✅ Production, ✅ Preview, ✅ Development
```

### 11. SHOPIFY_WEBHOOK_SECRET (Optionnel)
```
Name: SHOPIFY_WEBHOOK_SECRET
Value: [Copie depuis ton autre projet Vercel ou .env.local]
Environments: ✅ Production, ✅ Preview, ✅ Development
```

---

## 🚀 Après Configuration

1. **Redéploie** le projet :
   - Va dans **Deployments**
   - Clique sur les **3 points** du dernier déploiement
   - Clique sur **Redeploy**

2. Le build devrait maintenant fonctionner ! ✅

---

## 💡 Astuce

Tu peux copier toutes les variables depuis ton autre projet Vercel (`stretchmx-configurator`) :
1. Va dans l'autre projet → **Settings** → **Environment Variables**
2. Copie les valeurs
3. Colle-les dans le nouveau projet


