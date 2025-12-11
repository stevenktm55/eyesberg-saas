# 🔧 Dépannage : Le bouton "Personnaliser" n'apparaît pas

## ✅ Checklist de vérification

### 1️⃣ Vérifier que l'app est installée

1. Allez dans **Shopify Admin** → **Settings** → **Apps and sales channels**
2. Vérifiez que **"Eyesberg"** (ou le nom de votre app) est dans la liste
3. L'app doit être **Active**

### 2️⃣ Vérifier que le Script Tag a été créé

Le script tag doit être créé automatiquement lors de l'installation. Pour vérifier :

**Option A : Via l'API Shopify (recommandé)**

1. Ouvrez la console du navigateur (F12) sur votre page produit Shopify
2. Exécutez cette commande pour vérifier si le script est chargé :
   ```javascript
   document.querySelector('script[src*="shopify-integration-auto"]')
   ```
3. Si ça retourne `null`, le script tag n'a pas été créé

**Option B : Vérifier dans Shopify Admin**

1. Shopify Admin → **Settings** → **Apps and sales channels**
2. Cliquez sur **"Eyesberg"**
3. Regardez si des **Script Tags** sont listés
4. L'URL devrait être : `https://www.eyesberg.app/shopify-integration-auto.js`

### 3️⃣ Vérifier le tag sur le produit

1. Shopify Admin → **Produits**
2. Ouvrez le produit
3. Section **Tags** → Vérifiez que le tag `customizer` est bien présent
   - ⚠️ **Important** : Le tag doit être exactement `customizer` (minuscules, sans espace)
   - Pas `Customizer`, pas `CUSTOMIZER`, pas `customizer ` (avec espace)

### 4️⃣ Vérifier la console du navigateur

1. Allez sur la page produit de votre boutique
2. Ouvrez la console (F12 → onglet "Console")
3. Vous devriez voir :
   ```
   [StretchMX] Script auto-détection chargé - Version 2.0.0
   ```
4. Si le produit est configurable, vous devriez voir :
   ```
   [StretchMX] ✅ Produit configurable détecté via ...
   [StretchMX] ✅ Bouton de personnalisation ajouté avec succès
   ```
5. Si le produit n'est pas configurable :
   ```
   [StretchMX] ⚠️ Produit non configurable - tag "customizer" non trouvé
   ```

### 5️⃣ Vérifier que vous êtes sur une page produit

Le script ne fonctionne que sur les pages produit (URL contenant `/products/`).

## 🔧 Solutions

### Problème 1 : Le Script Tag n'a pas été créé

**Solution : Réinstaller l'app**

1. Dans l'admin Eyesberg : **Settings** → **Online stores**
2. Cliquez sur **"Uninstall"** à côté de votre boutique
3. Puis reconnectez : **"+ Online store"** → **Shopify**
4. Le script tag sera créé automatiquement lors de la réinstallation

### Problème 2 : Le tag n'est pas détecté

**Solution A : Vérifier le format du tag**

1. Le tag doit être exactement : `customizer` (minuscules)
2. Pas d'espaces avant/après
3. Pas de majuscules

**Solution B : Ajouter des logs de debug**

Ouvrez la console (F12) sur la page produit et exécutez :

```javascript
// Vérifier ShopifyAnalytics
console.log('ShopifyAnalytics:', window.ShopifyAnalytics);
console.log('Product tags:', window.ShopifyAnalytics?.meta?.product?.tags);

// Vérifier JSON-LD
const jsonLd = document.querySelector('script[type="application/ld+json"]');
if (jsonLd) {
  const data = JSON.parse(jsonLd.textContent);
  console.log('JSON-LD data:', data);
}

// Vérifier data attributes
console.log('Body data-product-tags:', document.body.getAttribute('data-product-tags'));
const form = document.querySelector('form[action*="/cart/add"]');
console.log('Form data-product-tags:', form?.getAttribute('data-product-tags'));
```

### Problème 3 : Le script ne se charge pas

**Vérifier l'URL du script tag :**

1. Le script tag doit pointer vers : `https://www.eyesberg.app/shopify-integration-auto.js`
2. Vérifiez que cette URL est accessible :
   - Ouvrez cette URL dans un nouvel onglet
   - Vous devriez voir le code JavaScript (pas une erreur 404)

**Si l'URL est incorrecte :**

1. Vérifiez les variables d'environnement dans Vercel :
   - `NEXT_PUBLIC_APP_URL` ou `NEXT_PUBLIC_ROOT_DOMAIN`
2. Si nécessaire, mettez à jour et redéployez

### Problème 4 : Le bouton apparaît mais ne fonctionne pas

**Vérifier l'URL du configurateur :**

1. Cliquez sur le bouton "PERSONNALISER"
2. Ouvrez la console (F12)
3. Vous devriez voir : `[StretchMX] Modal ouvert avec URL: ...`
4. Vérifiez que l'URL contient :
   - `shop=votre-boutique.myshopify.com`
   - `productId=...`
   - `variantId=...`

## 🧪 Test manuel

Pour tester si le script fonctionne manuellement :

1. Ouvrez la console (F12) sur la page produit
2. Exécutez :
   ```javascript
   // Forcer la détection
   if (window.StretchMXConfigurator) {
     window.StretchMXConfigurator.insertButton();
   }
   ```
3. Le bouton devrait apparaître

## 📞 Informations à fournir si besoin d'aide

Si le problème persiste, fournissez :

1. **URL de la page produit** où le bouton devrait apparaître
2. **Console logs** (copier-coller tous les messages `[StretchMX]`)
3. **Résultat de** : `document.querySelector('script[src*="shopify-integration-auto"]')`
4. **Tags du produit** (capture d'écran de la section Tags dans Shopify Admin)
5. **Script tags** (si visible dans Shopify Admin → Apps → Eyesberg)







