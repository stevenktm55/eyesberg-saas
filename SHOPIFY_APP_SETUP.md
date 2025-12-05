# 🛠️ Configuration de l'Application Shopify

## ❌ Problème actuel

L'erreur "Cette application ne peut pas encore être installée" signifie que l'application n'est pas correctement configurée dans le Shopify Partner Dashboard.

## ✅ Solution : Configurer l'application dans Shopify Partner Dashboard

### Étape 1 : Accéder au Partner Dashboard

1. Allez sur https://partners.shopify.com
2. Connectez-vous avec votre compte Shopify Partner
3. Si vous n'avez pas de compte, créez-en un (gratuit)

### Étape 2 : Créer une nouvelle application (si vous avez déjà sélectionné Public app)

**⚠️ Si vous avez déjà sélectionné "Public app" et ne pouvez pas revenir en arrière :**

1. Dans le Partner Dashboard, allez dans **Apps**
2. Cliquez sur **"Create app"** (créer une nouvelle application)
3. Donnez-lui un nom différent, par exemple :
   - **"Eyesberg Dev"** (pour le développement)
   - **"Eyesberg Custom"** (pour les installations personnalisées)
4. Cette fois, choisissez **"Custom app"** (distribution personnalisée)
5. Suivez les étapes suivantes pour configurer cette nouvelle app

**Note :** Vous pouvez avoir plusieurs apps :
- Une Custom app pour le développement (sans review)
- Une Public app pour l'App Store (quand elle sera prête)

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

### Étape 7 : Configurer le mode de distribution

**⚠️ DÉCISION IMPORTANTE :** Vous devez choisir un mode de distribution. Cette décision peut être irréversible !

#### Options disponibles :

1. **Custom app (Distribution personnalisée)**
   - ✅ Permet l'installation par une seule boutique ou organisation Shopify Plus
   - ✅ Idéal pour le développement et les installations privées
   - ❌ **IRRÉVERSIBLE** - Vous ne pourrez pas publier sur l'App Store plus tard
   - ❌ Limité à une seule boutique/organisation

2. **Public app (App Store)**
   - ✅ Peut être installée par n'importe quelle boutique depuis l'App Store
   - ✅ Idéal pour un SaaS multi-tenant
   - ❌ Nécessite une soumission et approbation par Shopify
   - ❌ Processus de review plus strict

3. **Unlisted app (Non listée)**
   - ✅ Installation via lien direct (sans App Store)
   - ✅ Peut être convertie en Public app plus tard
   - ✅ Idéal pour un SaaS qui veut installer via son propre système
   - ⚠️ Nécessite de générer des liens d'installation personnalisés

#### 🎯 Recommandation pour votre cas (SaaS multi-tenant) :

**Option A : Custom app (RECOMMANDÉ POUR LE DÉVELOPPEMENT)**
- ✅ **Aucun review requis** - Installation immédiate
- ✅ Idéal pour le développement et les tests
- ✅ Fonctionne avec votre système d'installation actuel
- ⚠️ Limité à une seule boutique/organisation par installation
- ⚠️ **Solution pour multi-tenant** : Créez une Custom app par client OU utilisez une organisation Shopify Plus (qui peut installer une Custom app sur plusieurs boutiques)

**Option B : Unlisted app**
- ⚠️ Peut nécessiter un review Shopify même si ce n'est pas pour l'App Store
- Permet d'installer via lien direct
- Peut être convertie en Public app plus tard

**Option C : Public app**
- Nécessite un review complet par Shopify
- Pas adapté pour le développement

#### 💡 Solution pour contourner le review (Développement) :

**Stratégie recommandée :**

1. **Pour le développement** : Utilisez **Custom app**
   - Aucun review requis
   - Installation immédiate
   - Parfait pour tester et développer

2. **Pour la production plus tard** : Créez une **nouvelle app** (Public ou Unlisted)
   - Quand votre app sera prête
   - Vous pourrez soumettre cette nouvelle app pour review
   - L'ancienne Custom app restera pour le développement

**OU** utilisez une **organisation Shopify Plus** :
- Les organisations Shopify Plus peuvent installer une Custom app sur **plusieurs boutiques**
- Pas de review requis
- Parfait pour un SaaS multi-tenant

#### Comment choisir :

1. Si vous voulez garder la possibilité de publier sur l'App Store plus tard → **Unlisted app**
2. Si vous voulez publier sur l'App Store maintenant → **Public app** (mais il faudra soumettre l'app)
3. Si vous êtes sûr de ne jamais vouloir l'App Store → **Custom app**

⚠️ **Note importante** : 
- Après avoir configuré la distribution, attendez quelques minutes pour que les changements soient pris en compte
- Si le message persiste, essayez de désinstaller et réinstaller l'application depuis Shopify Admin

### Étape 6 : Configurer les scopes (permissions)

Dans la section **Configuration** → **Scopes**, ajoutez les permissions suivantes :

**Read access** :
- `read_products` - Lire les produits
- `read_orders` - Lire les commandes
- `read_customers` - Lire les clients

**Write access** :
- `write_products` - Modifier les produits
- `write_orders` - Modifier les commandes
- `write_script_tags` - Ajouter des scripts (pour l'intégration automatique)

### Étape 7 : Récupérer les identifiants de la NOUVELLE app

⚠️ **IMPORTANT** : Utilisez les identifiants de la **nouvelle Custom app**, pas ceux de l'ancienne Public app !

1. Dans la section **API credentials**, vous trouverez :
   - **Client ID** (à copier)
   - **Client secret** (à copier, gardez-le secret !)

2. Copiez ces valeurs

### Étape 8 : Configurer les variables d'environnement avec les NOUVEAUX identifiants

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

### Étape 9 : Tester l'installation

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

