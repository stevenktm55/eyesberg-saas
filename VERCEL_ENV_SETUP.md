# 🔧 Configuration des Variables d'Environnement Vercel

## ⚠️ Important

Le build échoue car les variables d'environnement ne sont pas configurées dans Vercel.

## 📋 Variables à Configurer

Va dans **Vercel** → Ton projet → **Settings** → **Environment Variables**

Ajoute ces variables (coche **Production**, **Preview**, et **Development** pour chacune) :

### Supabase

```
NEXT_PUBLIC_SUPABASE_URL=https://ton-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ton_anon_key
SUPABASE_SERVICE_ROLE_KEY=ton_service_role_key
```

### Shopify

```
SHOPIFY_CLIENT_ID=ton_client_id
SHOPIFY_CLIENT_SECRET=ton_client_secret
SHOPIFY_SCOPES=read_products,write_products,read_orders,write_script_tags
SHOPIFY_REDIRECT_URI=https://eyesberg.app/api/shopify/callback
NEXT_PUBLIC_SHOPIFY_CLIENT_ID=ton_client_id
```

### App SAAS

```
NEXT_PUBLIC_ROOT_DOMAIN=eyesberg.app
NEXT_PUBLIC_APP_URL=https://eyesberg.app
```

### Webhooks (Optionnel)

```
SHOPIFY_WEBHOOK_SECRET=ton_webhook_secret
```

## 🚀 Après Configuration

1. **Redéploie** le projet (Vercel → Deployments → Redeploy)
2. Le build devrait maintenant fonctionner

## 📝 Note

Tu peux copier les valeurs depuis ton autre projet Vercel (`stretchmx-configurator`) si elles sont identiques.

