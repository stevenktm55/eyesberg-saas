# Structure du Snapshot

## Structure actuelle du Snapshot

```typescript
interface Snapshot {
  productId: string;              // ID du produit Shopify
  version: string;                // Version du snapshot (ex: 'v1')
  publishedAt: string;            // Date de publication ISO
  
  // Modèle 3D
  model3D: {
    url: string;                  // URL du fichier .glb
    textureMaps?: Record<string, string>;  // Maps de textures (normal, roughness, etc.)
    materialMaps: Record<string, any>;     // Maps de matériaux avec propriétés
  };
  
  // Design 2D (optionnel)
  design2D?: {
    url: string;                  // URL du fichier SVG
    thumbnailUrl?: string;        // URL de la miniature
    colors?: Record<string, string>; // Couleurs du design (primary, secondary, etc.)
  };
  
  // Modules de personnalisation
  customizationModules: Array<{
    id: string;                   // ID unique du module
    type: string;                 // Type: 'colors', 'designs-2d', 'logos', 'text'
    label: string;                // Nom de l'onglet
    icon?: string;                // Emoji ou icône
    iconUrl?: string;             // URL de l'icône
    
    // Pour les designs
    allowedDesigns?: Array<{
      label: string;              // Nom du design
      svgUrl: string;             // URL du SVG
      thumbnailUrl?: string;       // URL de la miniature
    }>;
    
    // Pour les couleurs
    allowedColors?: Array<{
      label: string;              // Nom de la couleur
      hex: string;                // Code hexadécimal
      mesh?: string;              // Mesh associé (ex: 'primary', 'secondary')
    }>;
    
    // Pour les logos
    config?: {
      logoLibraries?: Array<{     // Bibliothèques de logos résolues
        id: string;
        name: string;
        logos?: Array<{            // Logos dans la bibliothèque
          id: string;
          name: string;
          variants?: Array<{      // Variantes du logo
            id: string;
            file: string;         // URL du fichier
            name: string;
          }>;
          file_url?: string;
          vector?: boolean;
        }>;
      }>;
      logoLibraryIds?: string[];  // IDs des bibliothèques
      logoPlacementMode?: 'zones' | 'free';
      logoZoneGroupIds?: string[];
      addLogoButtonLabel?: string;
      logoViewFrontLabel?: string;
      logoViewBackLabel?: string;
      logoViewLeftLabel?: string;
      logoViewRightLabel?: string;
    };
    
    // Pour les textes
    config?: {
      fontGroups?: Array<{         // Groupes de polices résolus
        id: string;
        name: string;
        fonts?: Array<{            // Polices dans le groupe
          id: string;
          name: string;
          font_url: string;
          category?: string;
        }>;
      }>;
      fontGroupIds?: string[];     // IDs des groupes de polices
      textZones?: Array<{          // Zones de texte (MANQUANT ACTUELLEMENT)
        id: string;
        name: string;
        categories: string[];
        zone_category: string;
        position: [number, number, number];
        default_text_width?: number;
        default_text_height?: number;
      }>;
    };
    
    default?: string;              // Valeur par défaut (colorId, design2DId, etc.)
    options?: any[];               // Options supplémentaires
  }>;
  
  // État par défaut
  defaultState: {
    design2DId?: string;          // Design 2D sélectionné par défaut
    colorId?: string;              // Couleur sélectionnée par défaut
    // ... autres états par défaut
  };
  
  // Paramètres de caméra
  cameraSettings: {
    initialZoom: number;
    initialRotation: number;
    minZoom: number;
    maxZoom: number;
    zoomSpeed?: number;
    rotateSpeed?: number;
    viewDistance?: Record<string, number>;
  };
}
```

## Ce qui est actuellement inclus dans le snapshot

✅ **Modèle 3D**
- URL du fichier .glb
- Texture maps (normal, roughness, etc.)
- Material maps avec propriétés

✅ **Design 2D**
- URL du SVG
- Thumbnail URL
- Couleurs du design (primary, secondary, tertiary)

✅ **Module Colors**
- Liste des couleurs autorisées (allowedColors)
- Chaque couleur avec label, hex, mesh
- Couleur par défaut

✅ **Module Designs-2D**
- Liste des designs autorisés (allowedDesigns)
- Chaque design avec label, svgUrl, thumbnailUrl
- Design par défaut

✅ **Module Logos**
- Bibliothèques de logos résolues (logoLibraries)
- Chaque bibliothèque avec ses logos et variantes
- Configuration du module (placement mode, zones, labels)

✅ **Module Text**
- Groupes de polices résolus (fontGroups)
- Chaque groupe avec ses polices
- Configuration du module

✅ **État par défaut**
- design2DId
- colorId

✅ **Paramètres de caméra**
- Zoom, rotation, distances

## Ce qui MANQUE actuellement dans le snapshot

❌ **Zones de texte (textZones)**
- Les zones de texte ne sont PAS incluses dans le snapshot
- Le configurateur client doit les charger depuis l'API `/api/text-zones`
- Les zones sont liées au modèle 3D et définissent où placer les textes

❌ **Polices complètes (fonts)**
- Seuls les fontGroups sont inclus, pas les détails complets des polices
- Le configurateur client doit charger les polices depuis l'API `/api/fonts`
- Les polices incluent font_url, category, etc.

❌ **Détails complets des logos**
- Les logos sont inclus dans logoLibraries, mais peut-être pas tous les détails
- Vérifier si file_url, variants, vector sont bien inclus

❌ **Snap lines**
- Les snap lines pour l'alignement ne sont pas incluses

❌ **Product mappings**
- Les mappings de produits liés ne sont pas inclus

## Recommandations pour améliorer le snapshot

### 1. Ajouter les zones de texte
```typescript
// Dans resolveCustomizationModules pour le module 'text'
textZones?: Array<{
  id: string;
  name: string;
  categories: string[];
  zone_category: string;
  position: [number, number, number];
  default_text_width?: number;
  default_text_height?: number;
  default_logo_width?: number;
  default_logo_height?: number;
  thumbnail_url?: string;
}>;
```

### 2. Ajouter les polices complètes
```typescript
// Dans resolveCustomizationModules pour le module 'text'
fonts?: Array<{
  id: string;
  name: string;
  display_name: string;
  font_url: string;
  format: string;
  category?: string;
}>;
```

### 3. S'assurer que tous les détails des logos sont inclus
- Vérifier que file_url, variants, vector sont bien présents
- S'assurer que les URLs sont complètes (pas relatives)

### 4. Ajouter les snap lines si nécessaire
```typescript
snapLines?: Array<{
  id: string;
  design2DId: string;
  type: 'horizontal' | 'vertical';
  position: number;
  label?: string;
}>;
```

## Comment vérifier le snapshot actuel

1. **Dans les logs serveur** (Vercel), chercher :
   ```
   📦 Snapshot final créé:
   ```

2. **Dans le configurateur client**, ouvrir la console et chercher :
   ```
   ✅ Snapshot chargé:
   ```

3. **Vérifier la structure** :
   ```javascript
   console.log('Snapshot complet:', JSON.stringify(snapshot, null, 2));
   ```

## Prochaines étapes

1. ✅ Vérifier ce qui est réellement dans le snapshot actuel
2. ❌ Ajouter les zones de texte au snapshot
3. ❌ Ajouter les polices complètes au snapshot
4. ❌ Vérifier que tous les détails des logos sont inclus
5. ❌ Tester que le configurateur client fonctionne sans appels API

