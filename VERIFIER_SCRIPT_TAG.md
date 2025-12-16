# 🔍 Vérifier que le Script Tag fonctionne

## ✅ Vérifications à faire

### 1️⃣ Vérifier que le Script Tag existe

**Sur la page produit de votre boutique Shopify**, ouvrez la console (F12) et exécutez :

```javascript
document.querySelector('script[src*="shopify-integration-auto"]')
```

**Résultat attendu :** Un élément `<script>` avec l'attribut `src`

**Si ça retourne `null` :** Le script tag n'a pas été créé. Voir section "Créer le Script Tag" ci-dessous.

### 2️⃣ Vérifier l'URL du Script Tag

Si le script tag existe, vérifiez son URL :

```javascript
const script = document.querySelector('script[src*="shopify-integration-auto"]');
console.log('Script URL:', script?.src);
```

**URL attendue :** `https://www.eyesberg.app/shopify-integration-auto.js` (ou avec un paramètre `?shop=...`)

### 3️⃣ Tester l'URL directement

Ouvrez l'URL du script dans un nouvel onglet. Vous devriez voir le code JavaScript (pas une erreur 404).

**Exemple :**
```
https://www.eyesberg.app/shopify-integration-auto.js
```

### 4️⃣ Vérifier que le script s'exécute

Après le déploiement, vous devriez voir dans la console :

```
[StretchMX] 🚀 Script shopify-integration-auto.js chargé
[StretchMX] 📍 URL actuelle: ...
[StretchMX] 📍 Pathname: ...
[StretchMX] 🔧 Initialisation du script...
[StretchMX] ✅ Initialisation terminée
[StretchMX] ✅ Script auto-détection chargé - Version 2.0.0
```

**Si vous ne voyez pas ces logs :** Le script ne se charge pas ou ne s'exécute pas.

### 5️⃣ Vérifier les erreurs

Dans la console, regardez s'il y a des erreurs en rouge. Les erreurs peuvent empêcher le script de s'exécuter.

## 🔧 Solutions

### Problème 1 : Le Script Tag n'existe pas

**Solution : Créer le Script Tag**

1. Allez dans l'admin Eyesberg : **Settings** → **Online stores**
2. À côté de votre boutique, cliquez sur **"Créer Script Tag"**
3. Attendez le message de confirmation
4. Rafraîchissez la page produit Shopify (F5)

**Si le bouton "Créer Script Tag" ne fonctionne pas :**
- L'access token est probablement invalide
- Réinstallez l'app : **Uninstall** → puis reconnectez

### Problème 2 : Le script ne se charge pas (404)

**Vérifier l'URL :**

1. L'URL devrait être : `https://www.eyesberg.app/shopify-integration-auto.js`
2. Testez cette URL directement dans un nouvel onglet
3. Si vous voyez une erreur 404, le fichier n'est pas accessible

**Solution :**
- Vérifiez que le fichier existe dans `public/shopify-integration-auto.js`
- Vérifiez que l'application est bien déployée sur Vercel
- Vérifiez les variables d'environnement dans Vercel

### Problème 3 : Le script se charge mais ne s'exécute pas

**Vérifier les erreurs :**

1. Ouvrez la console (F12)
2. Regardez s'il y a des erreurs en rouge
3. Les erreurs peuvent empêcher le script de s'exécuter

**Solution :**
- Corrigez les erreurs JavaScript dans la console
- Vérifiez que le script n'est pas bloqué par un Content Security Policy (CSP)

### Problème 4 : Le script s'exécute mais ne détecte pas le tag

**Vérifier le tag :**

1. Dans Shopify Admin → Produits → votre produit
2. Vérifiez que le tag `customizer` est bien présent
3. Le tag doit être exactement `customizer` (minuscules, sans espace)

**Forcer la détection :**

Dans la console, exécutez :

```javascript
// Forcer l'insertion du bouton
if (window.StretchMXConfigurator) {
  window.StretchMXConfigurator.insertButton();
} else {
  console.error('Script StretchMX non disponible');
}
```

## 🧪 Test complet

1. **Vérifier le script tag :**
   ```javascript
   const script = document.querySelector('script[src*="shopify-integration-auto"]');
   console.log('Script tag:', script);
   console.log('Script URL:', script?.src);
   ```

2. **Tester l'URL :**
   - Ouvrez `script.src` dans un nouvel onglet
   - Vous devriez voir le code JavaScript

3. **Vérifier les logs :**
   - Ouvrez la console (F12)
   - Vous devriez voir les logs `[StretchMX]`

4. **Forcer l'insertion :**
   ```javascript
   window.StretchMXConfigurator?.insertButton();
   ```

## 📞 Informations à fournir si besoin d'aide

Si le problème persiste, fournissez :

1. **Résultat de** : `document.querySelector('script[src*="shopify-integration-auto"]')`
2. **URL du script** : `document.querySelector('script[src*="shopify-integration-auto"]')?.src`
3. **Console logs** : Tous les messages `[StretchMX]` (s'il y en a)
4. **Erreurs** : Toutes les erreurs en rouge dans la console
5. **URL de la page produit** où le bouton devrait apparaître













