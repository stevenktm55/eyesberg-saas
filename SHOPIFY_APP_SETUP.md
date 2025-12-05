# 🛠️ Configuration de l'Application Shopify

## ❌ Problème actuel

L'erreur "Cette application ne peut pas encore être installée" signifie que l'application n'est pas correctement configurée dans le Shopify Partner Dashboard.

## ✅ Solution : Configurer l'application dans Shopify Partner Dashboard

### Étape 1 : Accéder au Partner Dashboard

1. Allez sur https://partners.shopify.com
2. Connectez-vous avec votre compte Shopify Partner
3. Si vous n'avez pas de compte, créez-en un (gratuit)

### Étape 2 : Créer ou configurer l'application

1. Dans le Partner Dashboard, allez dans **Apps**
2. Cliquez sur **Create app** ou sélectionnez votre application existante "Eyesberg"
3. Choisissez **Custom app** (pour le développement) ou **Public app** (pour la publication)

### Étape 3 : Configurer les URLs de redirection

1. Dans la section **App setup** de votre application
2. Trouvez la section **App URL** et **Allowed redirection URL(s)**
3. Configurez :

   **App URL** :
   ```
   https://votre-domaine.com/admin
   ```

   **Allowed redirection URL(s)** :
   ```
   https://votre-domaine.com/api/shopify/callback
   ```

   ⚠️ **Important** : Remplacez `votre-domaine.com` par votre vrai domaine (ex: `stretchmx.eyesberg.app`)

### Étape 4 : Configurer les scopes (permissions)

Dans la section **Configuration** → **Scopes**, ajoutez les permissions suivantes :

**Read access** :
- `read_products` - Lire les produits
- `read_orders` - Lire les commandes
- `read_customers` - Lire les clients

**Write access** :
- `write_products` - Modifier les produits
- `write_orders` - Modifier les commandes
- `write_script_tags` - Ajouter des scripts (pour l'intégration automatique)

### Étape 5 : Récupérer les identifiants

1. Dans la section **API credentials**, vous trouverez :
   - **Client ID** (à copier)
   - **Client secret** (à copier, gardez-le secret !)

2. Copiez ces valeurs

### Étape 6 : Configurer les variables d'environnement

Ajoutez ces variables dans votre fichier `.env.local` (local) et dans Vercel (production) :

```env
# Shopify App Configuration
SHOPIFY_CLIENT_ID=votre_client_id_ici
SHOPIFY_CLIENT_SECRET=votre_client_secret_ici
SHOPIFY_REDIRECT_URI=https://votre-domaine.com/api/shopify/callback
SHOPIFY_SCOPES=read_products,write_products,read_orders,write_script_tags,read_customers
```

**Pour Vercel** :
1. Allez dans votre projet Vercel
2. **Settings** → **Environment Variables**
3. Ajoutez chaque variable
4. Sélectionnez **Production**, **Preview**, et **Development**
5. **Redeploy** l'application

### Étape 7 : Tester l'installation

1. Allez dans votre admin : `https://votre-domaine.com/admin/settings`
2. Cliquez sur **+ Online store**
3. Sélectionnez **Shopify**
4. Entrez le domaine de votre boutique test (ex: `yourstore.myshopify.com`)
5. Vous devriez être redirigé vers Shopify pour autoriser l'application

## 🔍 Vérification

Pour vérifier que tout est bien configuré :

1. **Client ID** : Doit être présent dans `.env.local` et Vercel
2. **Redirect URI** : Doit correspondre exactement à l'URL dans Shopify Partner Dashboard
3. **Scopes** : Doivent correspondre aux permissions configurées dans Shopify
4. **App URL** : Doit pointer vers votre domaine

## ⚠️ Erreurs courantes

### "Invalid redirect_uri"
- Vérifiez que l'URL dans `SHOPIFY_REDIRECT_URI` correspond **exactement** à celle dans Shopify Partner Dashboard
- Pas d'espace, pas de slash final, même protocole (https)

### "Invalid client_id"
- Vérifiez que `SHOPIFY_CLIENT_ID` est correct
- Vérifiez qu'il n'y a pas d'espaces avant/après

### "Missing scopes"
- Vérifiez que tous les scopes demandés sont activés dans Shopify Partner Dashboard
- Vérifiez que `SHOPIFY_SCOPES` contient les mêmes permissions

## 📝 Notes

- Pour le développement, utilisez une **Custom app** (plus simple)
- Pour la production, vous devrez créer une **Public app** et la soumettre à l'App Store
- Le **Client secret** ne doit JAMAIS être exposé côté client (dans le code frontend)

