# 🚀 Guide d'Intégration Automatique Shopify

## ✨ Intégration en 2 étapes seulement !

Avec ce script, **aucune modification de code Shopify n'est nécessaire**. Il suffit d'ajouter le script et le tag `customizer` aux produits !

---

## 📋 Étape 1 : Ajouter le script dans Shopify (2 minutes)

### 1.1 Accéder à l'éditeur de code

1. **Shopify Admin** → **Boutique en ligne** → **Thèmes**
2. Cliquez sur **Actions** → **Modifier le code** sur votre thème actif

### 1.2 Ajouter le script

1. Dans la barre latérale, trouvez **Layout** → **theme.liquid**
2. Ouvrez le fichier
3. Cherchez la balise `</body>` (tout en bas du fichier)
4. **Ajoutez AVANT** `</body>` :

```liquid
<!-- StretchMX Configurator - Intégration automatique -->
<script src="https://VOTRE_URL_VERCEL/shopify-integration-auto.js" defer></script>
```

**⚠️ IMPORTANT :** Remplacez `VOTRE_URL_VERCEL` par votre URL Vercel de production.

**Exemple :**
```liquid
<script src="https://eyesberg-saas-xxx.vercel.app/shopify-integration-auto.js" defer></script>
```

5. **Enregistrer**

---

## 🏷️ Étape 2 : Activer sur un produit (30 secondes)

1. **Shopify Admin** → **Produits** → Sélectionnez un produit
2. Dans la section **Tags**, ajoutez : **`customizer`**
3. **Enregistrer**

**✅ C'est tout !** Le bouton "PERSONNALISER" apparaîtra automatiquement sur ce produit.

---

## 🎯 Comment ça fonctionne ?

1. **Le script se charge automatiquement** sur toutes les pages produits
2. **Il détecte automatiquement** les produits avec le tag `customizer`
3. **Il remplace automatiquement** le bouton "Add to cart" par "PERSONNALISER"
4. **Au clic**, le configurateur s'ouvre dans un modal élégant
5. **Après personnalisation**, le client peut ajouter au panier directement depuis le configurateur

---

## 🔧 Configuration avancée (optionnel)

### Changer l'URL du configurateur via meta tag

Si vous préférez ne pas modifier le script, vous pouvez ajouter un meta tag dans `theme.liquid` :

```liquid
<meta name="stretchmx-configurator-url" content="https://votre-url.vercel.app">
```

Le script détectera automatiquement cette URL.

### Personnaliser le style du bouton

Le script expose une API pour personnaliser le bouton :

```javascript
// Dans la console du navigateur ou dans un script personnalisé
window.StretchMXConfigurator.config.buttonStyle.backgroundColor = '#ff0000';
window.StretchMXConfigurator.config.buttonText = '🎨 Personnaliser';
```

---

## ✅ Avantages de cette méthode

- ✅ **Aucune modification de code Liquid** nécessaire
- ✅ **Fonctionne avec tous les thèmes Shopify**
- ✅ **Mise à jour automatique** : si vous mettez à jour le script, tous les clients bénéficient de la mise à jour
- ✅ **Détection automatique** des produits configurables
- ✅ **Modal élégant** pour une meilleure expérience utilisateur
- ✅ **Fermeture automatique** après ajout au panier

---

## 🧪 Tester

1. Allez sur la page d'un produit avec le tag `customizer`
2. Vous devriez voir le bouton **"PERSONNALISER"** au lieu de "Add to cart"
3. Cliquez dessus → Le configurateur s'ouvre dans un modal
4. Personnalisez le produit
5. Ajoutez au panier → Le modal se ferme automatiquement

---

## 🆘 Dépannage

### Le bouton n'apparaît pas

1. **Vérifiez que le produit a le tag `customizer`**
2. **Vérifiez que le script est bien chargé** : Ouvrez la console (F12) et cherchez `[StretchMX]`
3. **Vérifiez l'URL du script** : Elle doit pointer vers votre domaine Vercel

### Le configurateur ne s'ouvre pas

1. **Vérifiez l'URL du configurateur** dans la console
2. **Vérifiez que votre configurateur est bien déployé** et accessible
3. **Ouvrez la console** (F12) pour voir les erreurs

### Le modal ne se ferme pas

1. **Vérifiez que le configurateur envoie bien le message** `closeCustomizer`
2. **Vérifiez les origines** : Le configurateur et Shopify doivent être sur les bons domaines

---

## 📞 Support

Si vous rencontrez des problèmes :

1. Ouvrez la console du navigateur (F12)
2. Cherchez les messages `[StretchMX]`
3. Vérifiez les erreurs JavaScript
4. Vérifiez que l'URL du configurateur est correcte

---

## 🎨 Personnalisation

Le script est entièrement personnalisable via l'API exposée :

```javascript
// Changer le tag de détection
window.StretchMXConfigurator.config.productTag = 'mon-tag';

// Changer le style du bouton
window.StretchMXConfigurator.config.buttonStyle.backgroundColor = '#ff0000';
window.StretchMXConfigurator.config.buttonText = 'Mon texte';

// Ouvrir manuellement le modal
window.StretchMXConfigurator.openModal();
```



























