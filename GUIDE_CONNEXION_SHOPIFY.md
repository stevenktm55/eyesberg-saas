# 🔗 Guide : Connecter un site Shopify à l'app

Ce guide explique comment connecter votre boutique Shopify à votre compte Eyesberg.

## 📋 Prérequis

✅ Votre app Shopify est configurée en **Custom app** (pour éviter le review)  
✅ Les variables d'environnement sont configurées dans Vercel :
   - `SHOPIFY_CLIENT_ID`
   - `SHOPIFY_CLIENT_SECRET`
   - `SHOPIFY_REDIRECT_URI`

## 🚀 Étapes de connexion

### 1️⃣ Accéder aux paramètres

1. Connectez-vous à votre admin Eyesberg : `https://votre-sous-domaine.eyesberg.app/admin`
2. Allez dans **Settings** → **Online stores** (ou cliquez sur le lien "Settings" dans la sidebar)

### 2️⃣ Ajouter une boutique Shopify

1. Cliquez sur le bouton **"+ Online store"** (en haut à droite)
2. Un modal s'ouvre avec les plateformes disponibles
3. Cliquez sur **"Shopify"**

### 3️⃣ Entrer le domaine Shopify

Une popup vous demande d'entrer votre domaine Shopify :
- Format attendu : `votre-boutique.myshopify.com`
- Exemple : `eyesbergtest.myshopify.com`

⚠️ **Important** : Utilisez le domaine `.myshopify.com`, pas votre domaine personnalisé.

### 4️⃣ Autoriser l'application

1. Vous êtes redirigé vers Shopify
2. Shopify vous demande d'autoriser l'application
3. Vérifiez les permissions demandées :
   - ✅ `read_products` - Lire les produits
   - ✅ `write_products` - Modifier les produits
   - ✅ `read_orders` - Lire les commandes
   - ✅ `write_script_tags` - Ajouter des scripts (pour l'intégration automatique)
4. Cliquez sur **"Installer"** ou **"Install app"**

### 5️⃣ Confirmation

1. Après l'autorisation, vous êtes automatiquement redirigé vers votre admin Eyesberg
2. Un message de succès s'affiche : **"✅ Shopify store successfully installed!"**
3. Votre boutique apparaît dans le tableau avec le statut **"installed"**

## ✅ Vérification

### Dans l'admin Eyesberg

Dans **Settings** → **Online stores**, vous devriez voir :
- ✅ Le nom de votre boutique
- ✅ Le domaine Shopify
- ✅ Le statut **"installed"**

### Dans Shopify Admin

1. Allez dans **Settings** → **Apps and sales channels**
2. Vous devriez voir **"Eyesberg"** (ou le nom de votre app) dans la liste
3. L'app est **Active**

## 🔄 Utiliser la boutique connectée

Une fois connectée, vous pouvez :

1. **Lier des produits** :
   - Allez dans **Products** → Créer/éditer un produit
   - Cliquez sur l'onglet **"Connect"**
   - Cliquez sur **"Charger les produits"** pour voir tous vos produits Shopify
   - Sélectionnez un produit et une variante
   - Cliquez sur **"Connecter à ce configurateur"**

2. **Synchroniser les données** :
   - Les produits Shopify sont automatiquement récupérables
   - Les commandes peuvent être synchronisées (si configuré)

## 🗑️ Désinstaller une boutique

Si vous souhaitez déconnecter une boutique :

1. Dans **Settings** → **Online stores**
2. Cliquez sur **"Uninstall"** à côté de la boutique
3. Confirmez la désinstallation

⚠️ **Note** : Cela supprime l'access token. Vous devrez réinstaller l'app pour reconnecter la boutique.

## 🐛 Dépannage

### "Failed to fetch products"

**Causes possibles :**
- La boutique Shopify est protégée par un mot de passe (désactivez-le temporairement)
- Le domaine est incorrect
- L'API publique JSON est désactivée (normalement activée par défaut)

**Solution :**
1. Vérifiez que le domaine est correct : `votre-boutique.myshopify.com`
2. Assurez-vous que la boutique est accessible publiquement
3. Testez l'URL : `https://votre-boutique.myshopify.com/products.json`

### "Missing required permissions"

**Cause :** L'app a été installée avec des permissions incomplètes.

**Solution :**
1. Dans Shopify Admin → **Settings** → **Apps and sales channels**
2. Trouvez **"Eyesberg"** et cliquez sur **"Uninstall"**
3. Retournez dans Eyesberg Admin → **Settings** → **Online stores**
4. Cliquez sur **"+ Online store"** → **Shopify** et réinstallez

### "Cette application ne peut pas encore être installée"

**Cause :** L'app n'est pas en mode **Custom app** dans le Shopify Partner Dashboard.

**Solution :**
1. Allez dans [Shopify Partner Dashboard](https://partners.shopify.com)
2. Sélectionnez votre app
3. Allez dans **Distribution** ou **"Choisir la distribution"**
4. Sélectionnez **"Custom app"** (distribution personnalisée)
5. Créez une nouvelle version si nécessaire
6. Réessayez l'installation

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs dans Vercel (fonction serverless)
2. Vérifiez la console du navigateur (F12)
3. Contactez le support avec :
   - Le domaine Shopify
   - Le sous-domaine Eyesberg utilisé
   - Les messages d'erreur exacts
































