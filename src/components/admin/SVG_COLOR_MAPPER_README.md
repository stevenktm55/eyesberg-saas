# 🎨 SVG Color Mapper - Documentation

## Vue d'ensemble

Le composant `SvgColorMapper` permet aux utilisateurs d'importer un fichier SVG et de mapper visuellement les différentes parties du dessin aux classes de couleur configurables du configurateur (primary, secondary, tertiary, etc.).

## Fonctionnalités

### ✅ Import de SVG
- Supporte l'import via fichier (drag & drop ou sélection)
- Supporte l'import via string SVG (prop `svgInput`)

### ✅ Palette d'outils
- **Couleur Primaire** → applique la classe `.primary`
- **Couleur Secondaire** → applique la classe `.secondary`
- **Couleur Tertiaire** → applique la classe `.tertiary`
- **Couleur Quaternaire** → applique la classe `.quaternary`
- **Couleur Quinaire** → applique la classe `.quinary`
- **Couleur Senaire** → applique la classe `.senary`
- **Couleur Septenaire** → applique la classe `.septenary`
- **Couleur Octonaire** → applique la classe `.octonary`
- **Effacer** → retire toutes les classes de couleur

### ✅ Feedback visuel
Chaque classe de couleur est affichée avec une couleur vive pour permettre à l'utilisateur de voir visuellement ce qui a été mappé :
- Primaire : Rouge vif (#FF0000)
- Secondaire : Bleu (#0000FF)
- Tertiaire : Vert (#00FF00)
- Quaternaire : Jaune (#FFFF00)
- Quinaire : Magenta (#FF00FF)
- Senaire : Cyan (#00FFFF)
- Septenaire : Orange (#FFA500)
- Octonaire : Violet (#800080)

### ✅ Gestion des groupes SVG
- Option pour appliquer la couleur à tout un groupe `<g>` au lieu d'un seul élément
- Clic intelligent qui détecte si l'élément est dans un groupe

### ✅ Export
- Fonction `onExport` pour récupérer le SVG modifié
- Export par défaut en téléchargement de fichier si `onExport` n'est pas fourni

## Utilisation

### Exemple basique

```tsx
import { SvgColorMapper } from "@/components/admin/SvgColorMapper";

function MyComponent() {
  const handleExport = (svgString: string) => {
    console.log("SVG modifié:", svgString);
    // Envoyer au backend, sauvegarder, etc.
  };

  return (
    <div style={{ height: "100vh" }}>
      <SvgColorMapper onExport={handleExport} />
    </div>
  );
}
```

### Avec SVG initial

```tsx
const [svgFile, setSvgFile] = useState<File | null>(null);

<SvgColorMapper 
  svgInput={svgFile} 
  onExport={(svg) => {
    // Traiter le SVG exporté
    fetch("/api/designs/upload", {
      method: "POST",
      body: JSON.stringify({ svg }),
    });
  }}
/>
```

### Avec string SVG

```tsx
const svgString = `<svg>...</svg>`;

<SvgColorMapper 
  svgInput={svgString}
  onExport={handleExport}
/>
```

## Props

```typescript
interface SvgColorMapperProps {
  svgInput?: string | File | null;  // SVG à charger (optionnel)
  onExport?: (svgString: string) => void;  // Callback appelé lors de l'export
  className?: string;  // Classes CSS additionnelles
}
```

## Comportement

1. **Sélection d'outil** : L'utilisateur clique sur un bouton de couleur pour sélectionner l'outil
2. **Clic sur élément** : L'utilisateur clique sur un élément du SVG (path, rect, circle, etc.)
3. **Application** : La classe de couleur est appliquée à l'élément (ex: `class="primary"`)
4. **Feedback** : L'élément change de couleur immédiatement pour montrer le mapping
5. **Export** : L'utilisateur clique sur "Exporter le SVG" pour récupérer le SVG avec les classes

## Format de sortie

Le SVG exporté contient les classes CSS directement sur les éléments :

```svg
<svg>
  <path class="primary" d="M10 10..." />
  <rect class="secondary" x="20" y="20" />
  <circle class="tertiary" cx="50" cy="50" r="10" />
</svg>
```

Ces classes seront ensuite utilisées par le système de configuration pour appliquer les couleurs choisies par l'utilisateur final.

## Notes techniques

- Les styles de feedback visuel sont injectés dynamiquement dans le document
- Les éléments SVG sont rendus en mode inline pour permettre la manipulation du DOM
- Les attributs de debug (`data-clickable`) sont automatiquement retirés lors de l'export
- Le composant gère correctement les groupes SVG (`<g>`) et les éléments imbriqués

## Page de démonstration

Une page de démonstration est disponible à : `/admin/svg-color-mapper`
