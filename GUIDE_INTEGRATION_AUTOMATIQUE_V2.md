# 🚀 Intégration automatique Shopify (sans modification du thème)

## ✅ Fonctionnement automatique

Comme avec **Kickflip** et d'autres apps Shopify professionnelles, **aucune modification manuelle du thème n'est nécessaire** !

Le script est **automatiquement injecté** lors de l'installation de l'app via les **Script Tags** de Shopify.

## 🎯 Comment ça marche

### 1️⃣ Installation de l'app

Quand vous connectez votre boutique Shopify dans **Settings → Online stores** :

1. Vous autorisez l'app sur Shopify
2. L'app s'installe automatiquement
3. **Le script est automatiquement injecté** dans toutes les pages de votre boutique
4. ✅ **C'est tout !** Aucune modification du thème nécessaire

### 2️⃣ Activer sur un produit

Pour activer le configurateur sur un produit :

1. Allez dans **Shopify Admin → Produits**
2. Ouvrez le produit que vous avez lié dans l'admin Eyesberg
3. Dans la section **Tags**, ajoutez : `customizer`
4. Sauvegardez

### 3️⃣ Tester

1. Allez sur la page produit de votre boutique
2. Le bouton **"PERSONNALISER"** apparaît automatiquement
3. Cliquez dessus → Le configurateur s'ouvre dans un modal
4. Personnalisez et ajoutez au panier

## 🔧 Ce qui se passe automatiquement

### Lors de l'installation :

- ✅ **Script tag créé** : Le JavaScript est injecté automatiquement
- ✅ **Webhooks créés** : Pour synchroniser les commandes
- ✅ **Access token sauvegardé** : Pour accéder à l'API Shopify

### Le script tag :

- **URL** : `https://www.eyesberg.app/shopify-integration-auto.js`
- **Portée** : Toutes les pages du storefront (pas l'admin)
- **Événement** : Se charge automatiquement quand la page est prête

### Lors de la désinstallation :

- ✅ **Script tag supprimé** : Le JavaScript est retiré automatiquement
- ✅ **Webhooks supprimés** : Par Shopify automatiquement
- ✅ **Access token supprimé** : Plus d'accès à l'API

## 📋 Prérequis

### Dans l'admin Eyesberg :

1. **Créer un produit** avec vos configurations (modules, zones, designs)
2. **Lier le produit** à un produit Shopify (onglet "Connect")
3. **Connecter votre boutique** (Settings → Online stores)

### Dans Shopify :

1. **Installer l'app** (automatique lors de la connexion)
2. **Ajouter le tag `customizer`** sur les produits que vous voulez personnaliser

## 🎨 Personnalisation

Le script détecte automatiquement :
- ✅ Les produits avec le tag `customizer`
- ✅ L'ID du produit Shopify
- ✅ L'ID de la variante sélectionnée
- ✅ Le domaine de la boutique

Et construit automatiquement l'URL du configurateur avec tous les paramètres nécessaires.

## 🐛 Dépannage

### Le bouton n'apparaît pas ?

1. **Vérifiez que l'app est installée** :
   - Settings → Online stores → Votre boutique doit être "installed"

2. **Vérifiez le tag** :
   - Le produit doit avoir le tag `customizer` (exactement, en minuscules)

3. **Vérifiez les script tags** :
   - Shopify Admin → Settings → Apps and sales channels
   - Trouvez "Eyesberg" → Vérifiez que l'app est active
   - Le script tag devrait être créé automatiquement

4. **Vérifiez la console** :
   - Ouvrez la console (F12)
   - Vous devriez voir : `[StretchMX] Script auto-détection chargé - Version 2.0.0`
   - Si vous voyez des erreurs, notez-les

### Le script tag n'a pas été créé ?

Si pour une raison quelconque le script tag n'a pas été créé automatiquement :

1. **Réinstallez l'app** :
   - Settings → Online stores → Uninstall
   - Puis reconnectez la boutique

2. **Vérifiez les permissions** :
   - L'app doit avoir le scope `write_script_tags`
   - Vérifiez dans Shopify Partner Dashboard → votre app → Scopes

## 🔄 Réinstaller le script tag manuellement

Si nécessaire, vous pouvez créer le script tag manuellement via l'API :

```bash
curl -X POST "https://VOTRE-BOUTIQUE.myshopify.com/admin/api/2025-01/script_tags.json" \
  -H "X-Shopify-Access-Token: VOTRE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "script_tag": {
      "event": "onload",
      "src": "https://www.eyesberg.app/shopify-integration-auto.js",
      "display_scope": "online_store"
    }
  }'
```

Mais normalement, **ce n'est jamais nécessaire** - tout est automatique !

## ✅ Avantages de cette approche

- ✅ **Aucune modification du thème** : Pas besoin de toucher au code Liquid
- ✅ **Mise à jour automatique** : Si on met à jour le script, toutes les boutiques l'ont automatiquement
- ✅ **Compatible avec tous les thèmes** : Fonctionne avec n'importe quel thème Shopify
- ✅ **Désinstallation propre** : Le script est retiré automatiquement quand l'app est désinstallée
- ✅ **Comme les apps professionnelles** : Même approche que Kickflip, Klaviyo, etc.

## 🎉 C'est tout !

Plus besoin de modifier le thème manuellement. Tout est automatique, comme avec les meilleures apps Shopify !
















