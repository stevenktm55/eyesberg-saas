# ✅ Prochaines étapes après l'installation Shopify

Maintenant que votre boutique Shopify est connectée, voici ce que vous pouvez faire :

## 🎯 1. Vérifier la connexion

### Dans l'admin Eyesberg :
1. Allez dans **Settings** → **Online stores**
2. Vérifiez que votre boutique apparaît avec le statut **"installed"**
3. Vous devriez voir :
   - Le nom de votre boutique
   - Le domaine Shopify
   - Le statut "installed"

### Dans Shopify Admin :
1. Allez dans **Settings** → **Apps and sales channels**
2. Vérifiez que **"Eyesberg"** (ou le nom de votre app) apparaît dans la liste
3. L'app doit être **Active**

## 🔗 2. Lier un produit admin à un produit Shopify

### Créer un produit dans l'admin :
1. Allez dans **Products** → **New product**
2. Configurez votre produit (modules, zones, designs, etc.)
3. Allez dans l'onglet **"Connect"**

### Lier au produit Shopify :
1. Dans l'onglet **"Connect"**, vous verrez automatiquement le domaine de votre boutique connectée
2. Cliquez sur **"Charger les produits"**
3. Tous vos produits Shopify s'affichent
4. Sélectionnez un produit dans la liste
5. Sélectionnez une variante (si le produit en a plusieurs)
6. Cliquez sur **"Connecter à ce configurateur"**
7. ✅ Le produit est maintenant lié !

## 🎨 3. Activer le configurateur sur Shopify

### Option A : Intégration automatique (recommandée)

1. **Ajouter le script dans votre thème Shopify** :
   - Shopify Admin → **Boutique en ligne** → **Thèmes**
   - Cliquez sur **"Actions"** → **"Modifier le code"**
   - Ouvrez `layout/theme.liquid`
   - Avant `</body>`, ajoutez :
     ```liquid
     <script src="https://www.eyesberg.app/shopify-integration-auto.js" defer></script>
     ```
   - Sauvegardez

2. **Ajouter le tag `customizer` sur vos produits** :
   - Shopify Admin → **Produits**
   - Sélectionnez le produit que vous avez lié
   - Dans la section **"Tags"**, ajoutez : `customizer`
   - Sauvegardez

3. **Tester** :
   - Allez sur la page produit de votre boutique
   - Le bouton **"🎨 Personnaliser ce produit"** devrait apparaître
   - Cliquez dessus → Le configurateur s'ouvre dans un modal

### Option B : Intégration manuelle

Si vous préférez plus de contrôle, vous pouvez utiliser le snippet Liquid (voir `GUIDE_INTEGRATION_AUTOMATIQUE.md`)

## 🛒 4. Tester le flux complet

### Test de bout en bout :
1. **Sur votre boutique Shopify** :
   - Allez sur la page d'un produit avec le tag `customizer`
   - Cliquez sur **"Personnaliser ce produit"**
   - Le configurateur s'ouvre

2. **Dans le configurateur** :
   - Personnalisez le produit (ajoutez des designs, textes, etc.)
   - Cliquez sur **"Ajouter au panier"**

3. **Vérification** :
   - Vous êtes redirigé vers le panier Shopify
   - Le produit personnalisé est dans le panier
   - Les propriétés de configuration sont sauvegardées

## 📊 5. Gérer les produits liés

### Voir les produits liés :
- Dans l'admin Eyesberg → **Products**
- Les produits avec un lien Shopify affichent le domaine Shopify dans l'onglet **"Connect"**

### Modifier le lien :
- Allez dans le produit → Onglet **"Connect"**
- Cliquez sur **"Charger les produits"**
- Sélectionnez un autre produit/variante
- Cliquez sur **"Connecter à ce configurateur"**

### Délier un produit :
- Pour l'instant, il faut supprimer manuellement le lien dans la base de données
- (Fonctionnalité à venir : bouton "Délier" dans l'interface)

## 🔄 6. Synchronisation des données

### Produits Shopify :
- Les produits sont récupérés en temps réel depuis l'API Shopify
- Pas de synchronisation automatique nécessaire
- Cliquez sur **"Charger les produits"** pour rafraîchir la liste### Commandes :
- Les commandes Shopify peuvent être synchronisées (si configuré)
- Les webhooks sont créés automatiquement lors de l'installation## 🐛 Dépannage### Le bouton "Personnaliser" n'apparaît pas :
1. Vérifiez que le tag `customizer` est bien ajouté au produit
2. Vérifiez que le script est bien ajouté dans `theme.liquid`
3. Ouvrez la console (F12) et vérifiez s'il y a des erreurs
4. Vérifiez que l'URL du script est correcte### "Failed to fetch products" dans l'onglet Connect :
1. Vérifiez que la boutique est bien connectée (Settings → Online stores)
2. Vérifiez que la boutique n'est pas protégée par un mot de passe
3. Testez l'URL : `https://votre-boutique.myshopify.com/products.json`### Le configurateur ne s'ouvre pas :
1. Vérifiez que le produit est bien lié (onglet Connect)
2. Vérifiez que l'URL du configurateur est correcte dans le script
3. Vérifiez les logs dans la console du navigateur## 📝 Notes importantes- **Multi-tenant** : Chaque sous-domaine Eyesberg peut avoir sa propre boutique Shopify connectée
- **Sécurité** : L'access token est stocké de manière sécurisée dans Supabase
- **Webhooks** : Créés automatiquement lors de l'installation
- **Scopes** : L'app a accès à read_products, write_products, read_orders, write_script_tags## 🎉 C'est tout !Votre intégration Shopify est maintenant complète. Vous pouvez :
- ✅ Créer des produits dans l'admin
- ✅ Les lier à vos produits Shopify
- ✅ Les clients peuvent personnaliser et ajouter au panier
- ✅ Tout fonctionne automatiquement !