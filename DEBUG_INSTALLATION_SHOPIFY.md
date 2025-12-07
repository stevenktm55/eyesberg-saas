# 🔧 Dépannage : "Cette application ne peut pas encore être installée"

## ❌ Problème

Vous voyez ce message lors de l'installation :
> "Cette application ne peut pas encore être installée. Le développeur/la développeuse d'application doit d'abord sélectionner un mode de distribution."

## ✅ Solution étape par étape

### Étape 1 : Vérifier que vous êtes dans la BONNE app

1. Allez sur [Shopify Partner Dashboard](https://partners.shopify.com)
2. Cliquez sur **"Apps"** dans le menu de gauche
3. **Vérifiez que vous êtes dans la nouvelle app** (ex: "Eyesberg Dev" ou "Eyesberg Custom")
   - ⚠️ **PAS** dans l'ancienne app "Public"
   - ✅ Dans la **nouvelle Custom app** que vous venez de créer

### Étape 2 : Vérifier le mode de distribution

1. Dans la page **"Aperçu"** (Overview) de votre app
2. Regardez la section **"Distribution"** ou **"Distribution mode"**
3. **Doit afficher** : **"Custom app"** ou **"Distribution personnalisée"**
4. Si ce n'est pas le cas :
   - Cliquez sur **"Choisir la distribution"** ou **"Select distribution"**
   - Sélectionnez **"Custom app"**
   - Sauvegardez

### Étape 3 : CRÉER ET PUBLIER une version (CRUCIAL !)

⚠️ **C'est souvent l'étape manquante !**

1. Dans la page **"Aperçu"** de votre app, cherchez une carte bleue en haut
2. Cliquez sur **"visiter votre Dev Dashboard"** (en bas de la carte)
   - OU allez dans **"Extensions"** → **"App setup"**
3. Dans le Dev Dashboard, vous devriez voir :
   - **"App setup"** dans le menu de gauche
   - Une section **"App versions"** ou **"Versions"**
4. **Créez une nouvelle version** :
   - Cliquez sur **"Create version"** ou **"Créer une version"**
   - Donnez-lui un nom (ex: "1.0.0" ou "Initial")
   - **Publiez la version** : Cliquez sur **"Release version"** ou **"Publier"**
5. **Vérifiez que la version est "Active"** ou **"Released"**

### Étape 4 : Vérifier les URLs dans App setup

Dans le Dev Dashboard → **"App setup"** :

1. **App URL** : 
   ```
   https://www.eyesberg.app
   ```
   (sans sous-domaine, le sous-domaine est passé via `state`)

2. **Allowed redirection URL(s)** :
   ```
   https://www.eyesberg.app/api/shopify/callback
   ```

3. **Scopes** (permissions) :
   ```
   read_products,write_products,read_orders,write_script_tags
   ```

4. **Sauvegardez** si vous avez fait des modifications

### Étape 5 : Vérifier les identifiants

Dans le Partner Dashboard → votre app → **"Settings"** → **"Credentials"** :

1. **Client ID** : Copiez-le
2. **Client Secret** : Copiez-le
3. **Vérifiez dans Vercel** que ces valeurs sont bien dans les variables d'environnement :
   - `SHOPIFY_CLIENT_ID` = le Client ID de la NOUVELLE app
   - `SHOPIFY_CLIENT_SECRET` = le Client Secret de la NOUVELLE app

⚠️ **Important** : Utilisez les identifiants de la **nouvelle Custom app**, pas ceux de l'ancienne Public app !

### Étape 6 : Redéployer sur Vercel

Après avoir mis à jour les variables d'environnement dans Vercel :

1. Allez dans Vercel Dashboard → votre projet
2. **Settings** → **Environment Variables**
3. Vérifiez que `SHOPIFY_CLIENT_ID` et `SHOPIFY_CLIENT_SECRET` sont bien ceux de la nouvelle app
4. **Redéployez** : 
   - Allez dans **"Deployments"**
   - Cliquez sur **"Redeploy"** sur le dernier déploiement
   - OU faites un commit pour déclencher un nouveau déploiement

### Étape 7 : Réessayer l'installation

1. Retournez dans votre admin Eyesberg
2. **Settings** → **Online stores**
3. Si une boutique est déjà listée, cliquez sur **"Uninstall"** pour la supprimer
4. Cliquez sur **"+ Online store"** → **Shopify**
5. Entrez votre domaine Shopify
6. Réessayez l'installation

## 🔍 Checklist de vérification

Avant de réessayer, cochez chaque point :

- [ ] Je suis dans la **nouvelle Custom app** (pas l'ancienne Public app)
- [ ] Le mode de distribution est **"Custom app"**
- [ ] J'ai **créé une version** dans le Dev Dashboard
- [ ] La version est **publiée** (status "Released" ou "Active")
- [ ] Les **URLs sont configurées** dans App setup
- [ ] Les **scopes sont configurés** (read_products, write_products, read_orders, write_script_tags)
- [ ] Les **identifiants dans Vercel** sont ceux de la nouvelle app
- [ ] J'ai **redéployé** l'application sur Vercel

## 🐛 Si ça ne fonctionne toujours pas

### Vérifier les logs

1. Dans Vercel → votre projet → **"Functions"** ou **"Logs"**
2. Regardez les logs lors de l'appel à `/api/shopify/install`
3. Vérifiez s'il y a des erreurs

### Vérifier la console du navigateur

1. Ouvrez la console (F12)
2. Allez dans **Settings** → **Online stores** → **"+ Online store"** → **Shopify**
3. Regardez s'il y a des erreurs dans la console

### Vérifier que l'app est bien Custom

Dans le Partner Dashboard :
1. Allez dans votre app
2. Regardez l'URL : elle devrait contenir quelque chose comme `/custom_apps/...`
3. Si vous voyez `/public_apps/...`, vous êtes dans la mauvaise app

## 📞 Informations à fournir si besoin d'aide

Si le problème persiste, fournissez :
1. Le nom exact de l'app dans le Partner Dashboard
2. Le mode de distribution affiché
3. Le statut de la version (Active/Released/Draft)
4. Les URLs configurées dans App setup
5. Les logs de Vercel lors de l'appel à `/api/shopify/install`


