# 🔧 Debug : Le bouton "Personnaliser" n'apparaît pas

## ✅ Vérifications à faire

### 1️⃣ Vérifier que le Script Tag est chargé

**Sur la page produit de votre boutique Shopify**, ouvrez la console (F12) et exécutez :

```javascript
// Vérifier si le script est chargé
document.querySelector('script[src*="shopify-integration-auto"]')
```

**Résultat attendu :** Un élément `<script>` avec l'attribut `src` contenant `shopify-integration-auto.js`

**Si ça retourne `null` :** Le script tag n'a pas été créé. Voir section "Créer le Script Tag" ci-dessous.

### 2️⃣ Vérifier que le script s'exécute

Dans la console, vous devriez voir :
```
[StretchMX] Script auto-détection chargé - Version 2.0.0
```

**Si vous ne voyez pas ce message :** Le script ne se charge pas.

### 3️⃣ Vérifier la détection du tag

Dans la console, exécutez :

```javascript
// Vérifier ShopifyAnalytics
console.log('ShopifyAnalytics:', window.ShopifyAnalytics);
console.log('Product tags:', window.ShopifyAnalytics?.meta?.product?.tags);

// Vérifier JSON-LD
const jsonLd = document.querySelector('script[type="application/ld+json"]');
if (jsonLd) {
  const data = JSON.parse(jsonLd.textContent);
  console.log('JSON-LD data:', data);
  console.log('Tags dans JSON-LD:', data.tags || data.category);
}

// Vérifier data attributes
console.log('Body data-product-tags:', document.body.getAttribute('data-product-tags'));
const form = document.querySelector('form[action*="/cart/add"]');
console.log('Form data-product-tags:', form?.getAttribute('data-product-tags'));
```

### 4️⃣ Vérifier que le tag est bien présent

**Dans Shopify Admin :**
1. Allez dans **Produits** → votre produit
2. Vérifiez la section **Tags**
3. Le tag `customizer` doit être présent (exactement, en minuscules)

**Sur la page produit :**
Dans la console, exécutez :
```javascript
// Forcer la détection
if (window.StretchMXConfigurator) {
  console.log('Script disponible:', window.StretchMXConfigurator);
  console.log('Produit configurable?', window.StretchMXConfigurator.isProductConfigurable());
  // Forcer l'insertion du bouton
  window.StretchMXConfigurator.insertButton();
}
```

## 🔧 Solutions

### Problème 1 : Le Script Tag n'existe pas

**Solution : Créer le Script Tag**

1. Allez dans l'admin Eyesberg : **Settings** → **Online stores**
2. À côté de votre boutique, cliquez sur **"Créer Script Tag"**
3. Attendez le message de confirmation
4. Rafraîchissez la page produit Shopify (F5)
5. Vérifiez à nouveau avec `document.querySelector('script[src*="shopify-integration-auto"]')`

**Si le bouton "Créer Script Tag" ne fonctionne pas :**
- L'access token est probablement invalide
- Réinstallez l'app : **Uninstall** → puis reconnectez

### Problème 2 : Le script se charge mais ne détecte pas le tag

**Solution A : Vérifier le format du tag**

Le tag doit être exactement `customizer` (minuscules, sans espace).

**Solution B : Forcer la détection**

Dans la console, exécutez :
```javascript
// Forcer l'insertion du bouton
if (window.StretchMXConfigurator) {
  window.StretchMXConfigurator.insertButton();
} else {
  console.error('Script StretchMX non disponible');
}
```

**Solution C : Vérifier que vous êtes sur une page produit**

L'URL doit contenir `/products/`. Le script ne fonctionne que sur les pages produit.

### Problème 3 : Le script ne se charge pas du tout

**Vérifier l'URL du script tag :**

1. Dans Shopify Admin → **Settings** → **Apps and sales channels**
2. Cliquez sur **"Eyesberg"** (ou le nom de votre app)
3. Regardez les **Script Tags**
4. L'URL devrait être : `https://www.eyesberg.app/shopify-integration-auto.js`

**Tester l'URL directement :**
Ouvrez cette URL dans un nouvel onglet. Vous devriez voir le code JavaScript (pas une erreur 404).

**Si l'URL est incorrecte :**
- Vérifiez les variables d'environnement dans Vercel :
  - `NEXT_PUBLIC_APP_URL` ou `NEXT_PUBLIC_ROOT_DOMAIN`
- Redéployez après avoir corrigé

## 🧪 Test complet

1. **Vérifier le script tag :**
   ```javascript
   document.querySelector('script[src*="shopify-integration-auto"]')
   ```

2. **Vérifier les logs :**
   - Ouvrez la console (F12)
   - Vous devriez voir : `[StretchMX] Script auto-détection chargé - Version 2.0.0`

3. **Vérifier la détection :**
   ```javascript
   window.StretchMXConfigurator?.isProductConfigurable()
   ```

4. **Forcer l'insertion :**
   ```javascript
   window.StretchMXConfigurator?.insertButton()
   ```

## 📞 Informations à fournir si besoin d'aide

Si le problème persiste, fournissez :

1. **Résultat de** : `document.querySelector('script[src*="shopify-integration-auto"]')`
2. **Console logs** : Tous les messages `[StretchMX]`
3. **Résultat de** : `window.StretchMXConfigurator?.isProductConfigurable()`
4. **URL de la page produit** où le bouton devrait apparaître
5. **Tags du produit** (capture d'écran de la section Tags dans Shopify Admin)


