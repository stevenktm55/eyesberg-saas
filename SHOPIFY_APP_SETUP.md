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

### Étape 3 : Accéder au Dev Dashboard

1. Dans la page **Aperçu** (Overview) de votre application, vous verrez une carte bleue en haut
2. Cliquez sur le lien **"visiter votre Dev Dashboard"** (en bas de la carte bleue)
3. OU allez directement sur : https://partners.shopify.com/organizations/[votre-org-id]/apps/[votre-app-id]/dev_dashboard

### Étape 4 : Créer une nouvelle version de l'application

Dans le nouveau Dev Dashboard de Shopify, vous devez **créer une version** pour configurer les URLs :

1. Dans le Dev Dashboard, cliquez sur **"Create a version"** ou **"Versions"** dans le menu
2. Vous verrez un formulaire de configuration avec plusieurs sections

### Étape 5 : Configurer les URLs dans la version

**⚠️ IMPORTANT : Multi-tenant (plusieurs sous-domaines)**

Pour que l'application fonctionne avec **tous vos sous-domaines** (multi-tenant), utilisez une **URL unique** qui ne dépend pas d'un sous-domaine spécifique :

**Section "URLs"** :

1. **App URL** :
   ```
   https://www.eyesberg.app
   ```
   OU utilisez un sous-domaine dédié :
   ```
   https://shopify.eyesberg.app
   ```
   ⚠️ **Important** : 
   - Utilisez le domaine racine (`www.eyesberg.app`) ou un sous-domaine dédié (`shopify.eyesberg.app`)
   - **NE PAS** utiliser un sous-domaine client spécifique (comme `stretchmx.eyesberg.app`)
   - Pas de `/admin` à la fin, juste le domaine de base

2. **Redirect URLs** (dans la section "Access") :
   ```
   https://www.eyesberg.app/api/shopify/callback
   ```
   OU si vous utilisez un sous-domaine dédié :
   ```
   https://shopify.eyesberg.app/api/shopify/callback
   ```
   ⚠️ **Important** : 
   - Utilisez la même base de domaine que l'App URL
   - Les URLs doivent être en HTTPS
   - Pas d'espace, pas de slash final
   - Le système extrait automatiquement le sous-domaine depuis le paramètre `state` lors du callback OAuth

**Comment ça fonctionne :**
- Lors de l'installation, le sous-domaine est encodé dans le paramètre `state` de l'OAuth
- Le callback `/api/shopify/callback` extrait le sous-domaine depuis `state`
- La boutique est liée au bon compte (sous-domaine) automatiquement
- ✅ Fonctionne pour tous les sous-domaines sans configuration supplémentaire

**Section "Access" → "Scopes"** :

Ajoutez les scopes suivants (séparés par des virgules) :
```
read_orders,read_products,write_products,write_script_tags,read_customers
```

**Section "Embed app in Shopify admin"** :

✅ Cochez cette case pour que l'app s'intègre dans l'admin Shopify

### Étape 6 : Publier la version

1. Vérifiez que toutes les configurations sont correctes
2. Cliquez sur le bouton **"Release"** en haut à droite
3. La version sera créée et activée

⚠️ **Note importante** : Après avoir créé la version, vous devrez peut-être attendre quelques minutes pour que les changements soient pris en compte.

### Étape 5 : Configurer les scopes (permissions)

Dans la section **Configuration** → **Scopes**, ajoutez les permissions suivantes :

**Read access** :
- `read_products` - Lire les produits
- `read_orders` - Lire les commandes
- `read_customers` - Lire les clients

**Write access** :
- `write_products` - Modifier les produits
- `write_orders` - Modifier les commandes
- `write_script_tags` - Ajouter des scripts (pour l'intégration automatique)

### Étape 6 : Récupérer les identifiants

1. Dans la section **API credentials**, vous trouverez :
   - **Client ID** (à copier)
   - **Client secret** (à copier, gardez-le secret !)

2. Copiez ces valeurs

### Étape 7 : Configurer les variables d'environnement

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

### Étape 8 : Tester l'installation

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

