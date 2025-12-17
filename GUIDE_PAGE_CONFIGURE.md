# 📖 Guide : Page `/configure`

## 🎯 À quoi sert cette page ?

La page `/configure` est **la page publique où vos clients configurent leur produit**. C'est l'interface client du configurateur.

### Fonctionnalités :
- ✅ **Viewer 3D** : Visualisation en temps réel du produit personnalisé
- ✅ **Sidebar blanche** : Onglets pour choisir :
  - Design (motifs)
  - Couleur
  - Numéro
  - Nom
  - Logo
- ✅ **Sauvegarde** : Le client peut sauvegarder sa configuration
- ✅ **Ajout au panier** : Le client peut ajouter le produit configuré au panier Shopify

### Différence avec le builder admin :
- **Builder admin** (`/admin/products/new`) : Zones noires pour créer/configurer les produits (BUILD, PRICING, VARIANTS, CONNECT)
- **Page `/configure`** : Zones blanches uniquement, pour que les clients configurent leur produit

---

## 🔗 Comment y accéder ?

### 1. **Depuis Shopify (automatique)** ⭐ Méthode principale

Quand un client visite une page produit Shopify avec le tag `customizer` :

1. Le script `shopify-integration-auto.js` détecte automatiquement le produit
2. Un bouton **"PERSONNALISER"** apparaît à la place du bouton "Ajouter au panier"
3. Le client clique sur "PERSONNALISER"
4. Un modal s'ouvre avec la page `/configure` dans une iframe

**URL générée automatiquement :**
```
https://www.eyesberg.app/configure?shop=xxx.myshopify.com&productId=123456&variantId=789012
```

### 2. **Manuellement (pour tester)**

Vous pouvez accéder directement à la page en construisant l'URL :

```
https://www.eyesberg.app/configure?shop=VOTRE_SHOP.myshopify.com&productId=ID_PRODUIT&variantId=ID_VARIANTE
```

**Exemple :**
```
https://www.eyesberg.app/configure?shop=26578d-f2.myshopify.com&productId=12424751710548&variantId=53171315048788
```

### 3. **Depuis l'admin (prévisualisation)**

Dans le builder admin (`/admin/products/new`), l'onglet BUILD affiche une prévisualisation qui utilise aussi `ConfiguratorViewer` (mais avec les zones noires autour).

---

## 🧪 Comment tester ?

### Test depuis Shopify :

1. **Connecter votre boutique Shopify** dans Settings > Online stores
2. **Créer un produit** dans l'admin Eyesberg (`/admin/products/new`)
3. **Lier le produit** à un produit Shopify dans l'onglet CONNECT
4. **Ajouter le tag `customizer`** au produit Shopify (fait automatiquement lors du linking)
5. **Visiter la page produit** sur votre site Shopify
6. **Cliquer sur "PERSONNALISER"**
7. ✅ Le configurateur s'ouvre dans un modal

### Test manuel :

1. **Récupérer les IDs** :
   - `shop` : Votre domaine Shopify (ex: `26578d-f2.myshopify.com`)
   - `productId` : ID du produit Shopify (visible dans l'URL admin Shopify)
   - `variantId` : ID de la variante (optionnel)

2. **Construire l'URL** :
   ```
   https://www.eyesberg.app/configure?shop=XXX&productId=YYY&variantId=ZZZ
   ```

3. **Ouvrir dans le navigateur**

---

## 📋 Paramètres de l'URL

| Paramètre | Description | Requis | Exemple |
|-----------|-------------|--------|---------|
| `shop` | Domaine Shopify | ✅ Oui | `26578d-f2.myshopify.com` |
| `productId` | ID du produit Shopify | ✅ Oui | `12424751710548` |
| `variantId` | ID de la variante Shopify | ❌ Non | `53171315048788` |
| `customer_email` | Email du client (si connecté) | ❌ Non | `client@example.com` |

---

## 🔧 Structure technique

### Fichiers impliqués :

1. **`/src/app/configure/page.tsx`** : Page Next.js qui affiche `ConfiguratorViewer`
2. **`/src/components/ConfiguratorViewer.tsx`** : Composant principal qui combine :
   - `Viewer3D` : Viewer 3D avec Canvas
   - `Sidebar` : Sidebar blanche avec onglets
3. **`/public/shopify-integration-auto.js`** : Script qui injecte le bouton "PERSONNALISER" sur Shopify

### Workflow :

```
Client sur Shopify
    ↓
Clic sur "PERSONNALISER"
    ↓
Script construit l'URL : /configure?shop=...&productId=...&variantId=...
    ↓
Ouvre dans un modal (iframe)
    ↓
Page /configure charge ConfiguratorViewer
    ↓
ConfiguratorViewer initialise les hooks et charge le produit
    ↓
Client configure son produit
    ↓
Sauvegarde ou Ajout au panier
```

---

## 🐛 Dépannage

### Le bouton "PERSONNALISER" n'apparaît pas ?

1. Vérifiez que le tag `customizer` est présent sur le produit Shopify
2. Vérifiez que le script `shopify-integration-auto.js` est bien injecté (Script Tag)
3. Vérifiez la console du navigateur pour les erreurs

### La page `/configure` ne charge pas ?

1. Vérifiez que les paramètres `shop` et `productId` sont présents dans l'URL
2. Vérifiez que le produit est bien lié dans l'admin Eyesberg
3. Vérifiez la console du navigateur pour les erreurs

### Le viewer 3D ne s'affiche pas ?

1. Vérifiez qu'un modèle 3D est sélectionné dans le builder admin
2. Vérifiez que le produit est bien configuré (modules, couleurs, etc.)

---

## 📝 Notes

- La page `/configure` est **publique** : n'importe qui avec l'URL peut y accéder
- Les configurations sont sauvegardées dans Supabase
- Le client peut ajouter le produit configuré directement au panier Shopify
- La page s'adapte automatiquement au mobile
















