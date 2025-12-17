# 🔗 Guide : Relier un produit Admin à Shopify

## 📋 Vue d'ensemble

Pour que le configurateur fonctionne sur votre site Shopify, vous devez relier votre produit créé dans l'admin au produit Shopify correspondant.

---

## 🎯 Méthode 1 : Via l'onglet "Connect" (Recommandé)

### Étape 1 : Créer votre produit dans Shopify

1. **Shopify Admin** → **Produits** → **Ajouter un produit**
2. Créez votre produit avec :
   - Nom du produit
   - Prix
   - Variantes (tailles, couleurs, etc.)
3. **Enregistrer** le produit
4. **Copier l'ID du produit** :
   - Dans l'URL de la page produit : `https://admin.shopify.com/store/VOTRE-BOUTIQUE/products/123456789`
   - L'ID est le nombre à la fin : `123456789`

### Étape 2 : Lier dans l'admin

1. **Ouvrez votre produit** dans l'admin du configurateur
2. Cliquez sur l'onglet **"Connect"** (en haut)
3. **Collez l'ID du produit Shopify** dans le champ
4. **Cliquez sur "Enregistrer"**

✅ **C'est fait !** Votre produit est maintenant lié.

---

## 🎯 Méthode 2 : Via l'URL du configurateur

Si vous connaissez l'ID du produit Shopify, vous pouvez directement utiliser l'URL :

```
https://VOTRE-URL/configure?shop=VOTRE-BOUTIQUE&productId=123456789&variantId=987654321
```

**Où trouver les IDs :**
- `productId` : Dans l'URL de la page produit Shopify Admin
- `variantId` : Dans l'URL de la variante ou via l'API Shopify

---

## 🎯 Méthode 3 : Via le tag Shopify (Automatique)

Si vous avez ajouté le script d'intégration automatique (`shopify-integration-auto.js`), le configurateur se connecte automatiquement via le tag `customizer`.

### Étapes :

1. **Dans Shopify Admin** → **Produits** → Sélectionnez votre produit
2. **Tags** → Ajoutez : `customizer`
3. **Enregistrer**

Le script détecte automatiquement le produit et utilise l'ID depuis Shopify Analytics.

---

## 🔍 Comment trouver l'ID d'un produit Shopify ?

### Méthode 1 : Depuis l'URL Admin

1. Allez sur **Shopify Admin** → **Produits**
2. Cliquez sur votre produit
3. Regardez l'URL : `https://admin.shopify.com/store/VOTRE-BOUTIQUE/products/123456789`
4. L'ID est le nombre à la fin : `123456789`

### Méthode 2 : Depuis l'API GraphQL

```graphql
query {
  products(first: 10) {
    edges {
      node {
        id
        title
        handle
      }
    }
  }
}
```

L'ID sera au format : `gid://shopify/Product/123456789`

### Méthode 3 : Depuis la console du navigateur

1. Ouvrez la page produit sur votre site Shopify
2. Ouvrez la console (F12)
3. Tapez : `window.ShopifyAnalytics.meta.product.id`
4. L'ID s'affiche

---

## 🔍 Comment trouver l'ID d'une variante ?

### Méthode 1 : Depuis l'URL Admin

1. Allez sur **Shopify Admin** → **Produits** → Votre produit
2. Cliquez sur une variante
3. Regardez l'URL : `https://admin.shopify.com/store/VOTRE-BOUTIQUE/products/123456789/variants/987654321`
4. L'ID de la variante est : `987654321`

### Méthode 2 : Depuis la console

1. Ouvrez la page produit sur votre site
2. Ouvrez la console (F12)
3. Tapez : `window.ShopifyAnalytics.meta.product.variants[0].id`
4. L'ID de la première variante s'affiche

---

## ✅ Vérifier que la liaison fonctionne

1. **Allez sur votre page produit Shopify**
2. **Cliquez sur "PERSONNALISER"** (si le script est installé)
3. **Ou allez directement sur** : `https://VOTRE-URL/configure?shop=VOTRE-BOUTIQUE&productId=123456789&variantId=987654321`
4. **Le configurateur doit s'ouvrir** avec votre produit configuré ✅

---

## 🆘 Dépannage

### Le configurateur ne charge pas le bon produit

- Vérifiez que l'ID du produit est correct
- Vérifiez que le produit existe bien dans Shopify
- Vérifiez que le domaine de la boutique (`shop`) est correct

### Le configurateur ne charge pas le bon modèle 3D

- Vérifiez que vous avez bien sélectionné un modèle 3D dans l'onglet "Build" de votre produit admin
- Vérifiez que le modèle 3D est actif

### Le bouton "PERSONNALISER" n'apparaît pas

- Vérifiez que le produit a le tag `customizer` dans Shopify
- Vérifiez que le script `shopify-integration-auto.js` est bien chargé dans `theme.liquid`

---

## 📝 Notes importantes

- **Un produit admin peut être lié à plusieurs produits Shopify** (si vous avez plusieurs boutiques)
- **Un produit Shopify peut être lié à un seul produit admin** (pour éviter la confusion)
- **Les IDs Shopify sont numériques** (ex: `123456789`) et non des UUIDs
- **Les variantes ont aussi des IDs numériques** (ex: `987654321`)

---

## 🎨 Exemple complet

1. **Produit Shopify** :
   - Nom : "Maillot StretchMX Personnalisé"
   - ID : `123456789`
   - Variante "Taille M" : `987654321`

2. **Produit Admin** :
   - Nom : "Maillot de base"
   - Modèle 3D : "maillot-3d.glb"
   - Shopify Product ID : `123456789`

3. **URL du configurateur** :
   ```
   https://votre-url.vercel.app/configure?shop=votre-boutique.myshopify.com&productId=123456789&variantId=987654321
   ```

4. **Résultat** : Le client clique sur "PERSONNALISER" → Le configurateur s'ouvre avec le bon modèle 3D ✅

















