# 🧪 Guide de test : Tester l'intégration Shopify

Maintenant que votre produit est lié, voici comment tester que tout fonctionne :

## 📋 Prérequis

✅ Produit lié dans l'admin Eyesberg (onglet "Connect")  
✅ Boutique Shopify connectée (Settings → Online stores)

## 🚀 Étapes de test

### 1️⃣ Ajouter le script dans votre thème Shopify

1. **Connectez-vous à Shopify Admin**
2. Allez dans **Boutique en ligne** → **Thèmes**
3. Cliquez sur **"Actions"** → **"Modifier le code"** (sur votre thème actif)
4. Dans la liste des fichiers à gauche, trouvez **`layout/theme.liquid`**
5. Ouvrez ce fichier
6. Cherchez la balise `</body>` (tout en bas du fichier)
7. **Avant** `</body>`, ajoutez cette ligne :

```liquid
<script src="https://www.eyesberg.app/shopify-integration-auto.js" defer></script>
```

8. **Sauvegardez** le fichier

**Note :** Si vous utilisez un autre domaine (pas `www.eyesberg.app`), remplacez l'URL par votre domaine.

### 2️⃣ Ajouter le tag `customizer` sur votre produit Shopify

1. Dans **Shopify Admin**, allez dans **Produits**
2. Trouvez et ouvrez le produit que vous avez lié dans l'admin Eyesberg
3. Scroll jusqu'à la section **"Tags"** (en bas de la page)
4. Ajoutez le tag : **`customizer`** (en minuscules, sans espace)
5. Cliquez sur **"Enregistrer"** ou **"Save"**

### 3️⃣ Tester sur la page produit

1. **Allez sur votre boutique Shopify** (votre domaine public, pas l'admin)
2. Naviguez vers la **page du produit** que vous avez lié
3. Vous devriez voir :
   - ✅ Le bouton **"PERSONNALISER"** (noir, en haut du formulaire d'ajout au panier)
   - ✅ Le bouton "Add to cart" est caché (remplacé par le bouton personnaliser)

4. **Cliquez sur "PERSONNALISER"**
   - Un modal s'ouvre avec le configurateur
   - Le configurateur se charge dans l'iframe

5. **Testez le configurateur** :
   - Ajoutez des designs, textes, logos
   - Personnalisez le produit

6. **Ajoutez au panier** :
   - Cliquez sur "Ajouter au panier" dans le configurateur
   - Le modal se ferme automatiquement
   - Vous êtes redirigé vers le panier Shopify
   - Le produit personnalisé est dans le panier

## ✅ Vérifications

### Le bouton n'apparaît pas ?

1. **Vérifiez le tag** :
   - Le produit doit avoir le tag `customizer` (exactement, en minuscules)
   - Allez dans Produits → votre produit → Tags

2. **Vérifiez le script** :
   - Ouvrez la console du navigateur (F12)
   - Allez dans l'onglet "Console"
   - Vous devriez voir : `[StretchMX] Script auto-détection chargé - Version 2.0.0`
   - Si vous voyez une erreur, vérifiez que l'URL du script est correcte

3. **Vérifiez que vous êtes sur une page produit** :
   - L'URL doit contenir `/products/`
   - Le script ne fonctionne que sur les pages produit

### Le configurateur ne se charge pas ?

1. **Vérifiez l'URL** :
   - Ouvrez la console (F12)
   - Regardez l'URL chargée dans l'iframe
   - Elle devrait être : `https://www.eyesberg.app/configure?shop=...&productId=...&variantId=...`

2. **Vérifiez la liaison** :
   - Retournez dans l'admin Eyesberg
   - Allez dans Products → votre produit → onglet "Connect"
   - Vérifiez que le produit Shopify est bien lié

3. **Vérifiez les paramètres** :
   - L'URL doit contenir `shop`, `productId`, et `variantId`
   - Si un paramètre manque, le configurateur ne saura pas quel produit charger

### Le produit n'est pas ajouté au panier ?

1. **Vérifiez les logs** :
   - Ouvrez la console (F12)
   - Regardez s'il y a des erreurs lors du clic sur "Ajouter au panier"

2. **Vérifiez la configuration du produit** :
   - Dans l'admin Eyesberg, vérifiez que le produit est bien configuré
   - Vérifiez que les modules, zones, designs sont bien définis

## 🐛 Dépannage avancé

### Console du navigateur

Ouvrez la console (F12) et vérifiez :

1. **Messages de chargement** :
   ```
   [StretchMX] Script auto-détection chargé - Version 2.0.0
   [StretchMX] ✅ Bouton de personnalisation ajouté avec succès
   ```

2. **Erreurs** :
   - Si vous voyez des erreurs en rouge, notez-les
   - Les erreurs courantes :
     - `Failed to load resource` → L'URL du script est incorrecte
     - `CORS error` → Problème de configuration CORS
     - `404 Not Found` → Le fichier n'existe pas à cette URL

### Test manuel de l'URL

Vous pouvez tester l'URL du configurateur directement :

1. Récupérez les informations du produit :
   - Product ID : visible dans l'URL Shopify Admin ou dans les meta tags
   - Variant ID : visible dans le code source de la page produit
   - Shop domain : votre domaine `.myshopify.com`

2. Construisez l'URL manuellement :
   ```
   https://www.eyesberg.app/configure?shop=votre-boutique.myshopify.com&productId=123456&variantId=789012
   ```

3. Ouvrez cette URL dans un nouvel onglet
   - Si le configurateur se charge, le problème vient du script
   - Si le configurateur ne se charge pas, le problème vient de la configuration du produit

## 📝 Notes importantes

- **Le script fonctionne automatiquement** : Pas besoin de modifier le code du thème (sauf ajouter le script)
- **Le tag `customizer` est obligatoire** : Sans ce tag, le bouton n'apparaît pas
- **Multi-tenant** : Chaque sous-domaine Eyesberg peut avoir sa propre boutique Shopify
- **Sécurité** : Le script vérifie l'origine des messages pour éviter les attaques

## 🎉 C'est tout !

Une fois que tout fonctionne :
- ✅ Le bouton apparaît automatiquement sur les produits avec le tag `customizer`
- ✅ Le configurateur s'ouvre dans un modal
- ✅ Le produit personnalisé est ajouté au panier Shopify
- ✅ Tout fonctionne de manière transparente pour vos clients !


