# Architecture du système de snapshot - Résumé pour débogage

## Vue d'ensemble

Nous avons implémenté un système de **snapshot** pour le configurateur 3D. Le principe est que le builder admin génère un snapshot JSON figé et autonome lors de la "publication" d'un produit, et le site client charge uniquement ce snapshot sans dépendre de la base de données admin.

## Architecture

### 1. Génération du snapshot (`src/lib/snapshot-generator.ts`)

Le snapshot est généré lors du "linking" d'un produit Shopify dans le builder admin (`src/app/api/products/[id]/shopify-link/route.ts`).

**Fonction principale : `generateSnapshot(builderData, shopifyProductId)`**

Le snapshot résout tous les IDs en valeurs finales :
- **Model3D** : Résout `model3DId` → URL du fichier GLB, textureMaps, materialMaps
- **Design2D** : Résout `design2DId` → URL SVG, thumbnailUrl, colors, **color_mappings**
- **TextZones** : Récupère toutes les zones de texte depuis la table `zones` ou `text_zones` via `model3d_id`
- **Fonts** : Récupère toutes les polices depuis `font_groups` via `font_group_id` (relation directe, pas de table de jointure)
- **CustomizationModules** : Résout chaque module :
  - **colors** : Résout `paletteId` → `allowedColors` avec hex, label, mesh, id
  - **designs-2d** : Résout `allowedDesignIds` → `allowedDesigns` avec svgUrl, thumbnailUrl, id
  - **logos** : Résout `logoLibraryIds` → `logoLibraries` avec logos et variants complets
  - **text** : Préserve `fontGroupIds` dans la config

**Structure du snapshot :**
```typescript
{
  productId: string;
  version: string;
  publishedAt: string;
  model3D: { url, textureMaps?, materialMaps };
  design2D?: { url, thumbnailUrl?, colors?, color_mappings? };
  customizationModules: Array<{ id, type, label, icon?, iconUrl?, allowedColors?, allowedDesigns?, config? }>;
  textZones?: Array<{ id, name, position, categories, zone_category, ... }>;
  fonts?: Array<{ id, name, font_url, format, category }>;
  defaultState?: { design2DId?, colorId? };
  cameraSettings?: { ... };
}
```

Le snapshot est sauvegardé dans `product_builder.builder_data.publishedSnapshot`.

### 2. Consommation du snapshot (`src/components/ConfiguratorViewer.tsx`)

Le client charge le snapshot via `/api/product-builder?shop=...&id=...` qui retourne `product.builder_data.publishedSnapshot`.

**Initialisation des données :**

1. **Designs 2D** : Chargés depuis `snapshot.customizationModules` (module `designs-2d`) → `allowedDesigns`
2. **Couleurs** : Initialisées depuis `snapshot.customizationModules` (module `colors`) → `allowedColors`
   - Si `snapshot.design2D.color_mappings` existe, utilise ces mappings pour mapper les couleurs aux classes (primary, secondary, tertiary)
   - Sinon, utilise les `mesh` des couleurs directement
3. **TextZones** : Converties en textes via `useEffect` qui appelle `addText()` pour chaque zone
4. **Fonts** : Chargées depuis `snapshot.fonts`
5. **Logos** : Extraits depuis `snapshot.customizationModules` (module `logos`) → `config.logoLibraries`

## Problèmes actuels

### 1. Les couleurs ne s'appliquent pas sur le modèle 3D

**Symptôme :** Seule une couleur s'applique au lieu de 3 couleurs (primary, secondary, tertiary).

**Code d'initialisation des couleurs :**
```typescript
// Dans ConfiguratorViewer.tsx, ligne ~3145
if (colorModule?.allowedColors && colorModule.allowedColors.length > 0) {
  const initialColors: Record<string, string> = {};
  const design2D = snapshot.design2D;
  const colorMappings = design2D?.color_mappings || {};
  
  if (Object.keys(colorMappings).length > 0) {
    // Mappe les couleurs via color_mappings
    Object.keys(colorMappings).forEach((colorClass) => {
      const colorId = colorMappings[colorClass];
      const color = colorModule.allowedColors.find((c: any) => 
        c.id === colorId || c.hex === colorId
      );
      if (color) {
        initialColors[colorClass] = color.hex;
      }
    });
  } else {
    // Fallback : utilise les meshes des couleurs
    colorModule.allowedColors.forEach((color: any) => {
      const mesh = color.mesh || 'primary';
      initialColors[mesh] = color.hex;
    });
  }
  
  replaceColors(initialColors);
}
```

**Questions à vérifier :**
- Est-ce que `snapshot.design2D.color_mappings` est présent dans le snapshot généré ?
- Est-ce que les `allowedColors` ont des `id` qui correspondent aux valeurs dans `color_mappings` ?
- Est-ce que `replaceColors()` applique correctement les couleurs au modèle 3D ?

**Logs à vérifier :**
- `🎨 Couleurs initiales calculées:` devrait montrer `initialColors`, `hasColorMappings`, `colorMappings`

### 2. Module texte affiche "À implémenter"

**Symptôme :** Le module texte dans la sidebar affiche "Module texte - À implémenter" au lieu du contenu.

**Code d'initialisation des textes :**
```typescript
// Dans ConfiguratorViewer.tsx, ligne ~3245
useEffect(() => {
  if (!snapshot?.textZones || snapshot.textZones.length === 0) {
    return;
  }
  if (texts.length > 0) {
    return; // Déjà initialisé
  }
  
  snapshot.textZones.forEach((zone: any) => {
    if (zone.position && Array.isArray(zone.position) && zone.position.length === 3) {
      addText('', position, undefined, category, zone.default_text_height || 100, zone.zone_category || 'torse', 0);
    }
  });
}, [snapshot, addText, texts.length]);
```

**Rendu du module texte :**
Le module texte devrait être rendu dans la sidebar quand `activeCustomizerTab` correspond au module de type `text`. Le contenu devrait afficher les zones de texte disponibles et permettre d'ajouter/modifier du texte.

**Questions à vérifier :**
- Est-ce que `snapshot.textZones` est présent et contient des zones ?
- Est-ce que `snapshot.fonts` est présent et contient des polices ?
- Est-ce que le module texte est correctement rendu dans la sidebar ? (chercher le code qui affiche "À implémenter")
- Est-ce que `texts` est correctement initialisé depuis `textZones` ?

**Logs à vérifier :**
- `📝 Initialisation des textes depuis les textZones:` devrait s'afficher
- `hasTextZones: true`, `textZonesCount: 2` dans les logs du snapshot

### 3. Module logo dit "sélectionnez des bibliothèques de logo"

**Symptôme :** Le module logo affiche un message demandant de sélectionner des bibliothèques alors que c'est déjà fait dans le builder.

**Code de chargement des logos :**
```typescript
// Dans ConfiguratorViewer.tsx, ligne ~3102
useEffect(() => {
  if (!snapshot) {
    setLogoLibraries([]);
    return;
  }
  
  const logoModule = snapshot.customizationModules.find((m: any) => 
    (m.type === 'logos' || m.contentType === 'logos')
  );
  if (logoModule?.config?.logoLibraries && logoModule.config.logoLibraries.length > 0) {
    setLogoLibraries(logoModule.config.logoLibraries);
  } else {
    setLogoLibraries([]);
  }
}, [snapshot]);
```

**Rendu du module logo :**
Le module logo devrait afficher les bibliothèques chargées depuis `logoLibraries`.

**Questions à vérifier :**
- Est-ce que `snapshot.customizationModules` contient un module de type `logos` ?
- Est-ce que `logoModule.config.logoLibraries` est présent et contient des bibliothèques ?
- Est-ce que le snapshot génère correctement les `logoLibraries` avec leurs `logos` et `variants` ?
- Est-ce que le message d'erreur vient du rendu du module logo dans la sidebar ?

**Logs à vérifier :**
- `📚 Bibliothèques de logos chargées depuis snapshot:` devrait s'afficher avec `librariesCount > 0`
- `📚 Résolution du module logos:` dans les logs de génération du snapshot devrait montrer `libraryIdsCount > 0`

## Points de vérification

### Dans les logs de génération du snapshot :
1. ✅ `hasTextZones: true`, `textZonesCount: 2`
2. ✅ `hasFonts: true`, `fontsCount: 2`
3. ✅ `✅ Palette résolue: 4 couleur(s)`
4. ✅ `📚 Résolution du module logos:` avec `libraryIdsCount > 0`
5. ❓ `hasColorMappings: true/false` dans `✅ Design2D résolu avec succès:`

### Dans les logs côté client :
1. ✅ `📦 Snapshot chargé:` avec tous les champs
2. ✅ `🎨 Palette de couleurs chargée depuis snapshot:` avec `colorsCount > 0`
3. ✅ `📚 Bibliothèques de logos chargées depuis snapshot:` avec `librariesCount > 0`
4. ✅ `📝 Initialisation des textes depuis les textZones:` avec `textZonesCount > 0`
5. ❓ `🎨 Couleurs initiales calculées:` avec `initialColors` contenant 3 couleurs

## Fichiers clés

- **Génération :** `src/lib/snapshot-generator.ts`
- **Consommation :** `src/components/ConfiguratorViewer.tsx`
- **API snapshot :** `src/app/api/product-builder/route.ts`
- **Linking produit :** `src/app/api/products/[id]/shopify-link/route.ts`

## Structure de données attendue

### Module colors dans le snapshot :
```json
{
  "id": "module-xxx",
  "type": "colors",
  "label": "Couleurs",
  "allowedColors": [
    { "id": "hex1", "label": "Rouge", "hex": "#FF0000", "mesh": "primary" },
    { "id": "hex2", "label": "Bleu", "hex": "#0000FF", "mesh": "secondary" },
    { "id": "hex3", "label": "Vert", "hex": "#00FF00", "mesh": "tertiary" }
  ]
}
```

### Module logos dans le snapshot :
```json
{
  "id": "module-xxx",
  "type": "logos",
  "label": "Logos",
  "config": {
    "logoLibraries": [
      {
        "id": "lib-id",
        "name": "Bibliothèque 1",
        "logos": [
          {
            "id": "logo-id",
            "name": "Logo 1",
            "file_url": "https://...",
            "variants": [...]
          }
        ]
      }
    ],
    "logoLibraryIds": ["lib-id"]
  }
}
```

### Design2D dans le snapshot :
```json
{
  "url": "https://...svg",
  "thumbnailUrl": "https://...png",
  "color_mappings": {
    "primary": "hex1",
    "secondary": "hex2",
    "tertiary": "hex3"
  }
}
```

## Actions de débogage recommandées

1. **Vérifier le snapshot généré** : Inspecter `product.builder_data.publishedSnapshot` dans Supabase
2. **Vérifier les logs de génération** : Chercher les logs `✅ Design2D résolu avec succès:` pour voir si `color_mappings` est présent
3. **Vérifier les logs côté client** : Chercher `🎨 Couleurs initiales calculées:` pour voir quelles couleurs sont initialisées
4. **Vérifier le rendu des modules** : 
   - Chercher dans `ConfiguratorViewer.tsx` où "À implémenter" est affiché (probablement dans le rendu du module texte)
   - Chercher où "sélectionnez des bibliothèques de logo" est affiché (probablement dans le rendu du module logo)
5. **Vérifier l'application des couleurs** : Vérifier comment `colors` est passé au `ModelViewer` (ligne ~1632) et comment il applique les couleurs au modèle 3D

## Emplacements du code à vérifier

### Module texte - "À implémenter"
**Ligne ~5377 dans `ConfiguratorViewer.tsx`** : Le message "Module texte - À implémenter" est affiché dans le rendu du module texte. Vérifier la condition qui détermine si ce message est affiché. Il semble que le module texte ne soit pas correctement implémenté ou que les données nécessaires (textZones, fonts) ne soient pas disponibles.

### Module logo - "sélectionnez des bibliothèques"
**Ligne ~4435 dans `ConfiguratorViewer.tsx`** : Le message "Sélectionnez des bibliothèques de logos dans les settings du module" est affiché quand `logoLibraries.length === 0` ou quand `activeModule.selectedItems?.logoLibraryIds` est vide. Vérifier :
- Si `logoLibraries` est correctement chargé depuis le snapshot (ligne ~3102)
- Si `activeModule.selectedItems?.logoLibraryIds` contient les IDs des bibliothèques
- Si la condition `logoLibraries.length === 0` est vraie alors que le snapshot contient des bibliothèques

### Application des couleurs
Le `ModelViewer` reçoit `colors` en prop (ligne ~1632). Vérifier comment `ModelViewer` applique ces couleurs au modèle 3D. Les couleurs sont probablement appliquées via des matériaux Three.js ou des shaders.

