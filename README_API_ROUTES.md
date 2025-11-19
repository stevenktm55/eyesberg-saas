# 📡 API Routes - Eyesberg SaaS

Ce document liste toutes les API routes créées pour eyesberg-saas avec le nouveau projet Supabase.

## 🔗 Modèles 3D

### `GET /api/models-3d`
Récupère tous les modèles 3D avec leurs parties et material maps assignés.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "T-Shirt Model 1",
    "glb_url": "https://...",
    "model_parts": [
      {
        "id": "uuid",
        "name": "Front",
        "material_map_id": "uuid",
        "material_maps": {
          "id": "uuid",
          "name": "Cotton White"
        }
      }
    ]
  }
]
```

### `POST /api/models-3d`
Crée un nouveau modèle 3D avec les parties par défaut (Front, Back, Sleeves, Collar).

**Body (FormData):**
- `name` (string, required)
- `file` (File, optional) - Fichier .glb
- `description` (string, optional)

### `PUT /api/models-3d`
Met à jour un modèle 3D.

**Body (FormData):**
- `id` (string, required)
- `name` (string, optional)
- `file` (File, optional) - Nouveau fichier .glb
- `description` (string, optional)

### `DELETE /api/models-3d?id={id}`
Supprime un modèle 3D et ses parties.

---

## 🎨 Material Maps

### `GET /api/material-maps`
Récupère tous les Material Maps avec leurs fichiers de textures.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Cotton White",
    "material_map_files": [
      {
        "id": "uuid",
        "map_type": "diffuse",
        "file_url": "https://...",
        "intensity": 100,
        "scale": 1.0
      }
    ]
  }
]
```

### `POST /api/material-maps`
Crée un nouveau Material Map.

**Body (JSON):**
```json
{
  "name": "Cotton White",
  "description": "Material en coton blanc"
}
```

### `PUT /api/material-maps`
Met à jour un Material Map et ses settings.

**Body (JSON):**
```json
{
  "id": "uuid",
  "name": "Cotton White",
  "description": "Updated description",
  "settings": [
    {
      "mapType": "diffuse",
      "intensity": 100,
      "scale": 1.0
    }
  ]
}
```

### `DELETE /api/material-maps?id={id}`
Supprime un Material Map et ses fichiers.

---

## 📤 Upload Material Map Files

### `POST /api/material-maps/upload`
Upload un fichier de texture pour un Material Map.

**Body (FormData):**
- `materialMapId` (string, required)
- `mapType` (string, required) - 'diffuse', 'normal', 'roughness', 'metallic'
- `file` (File, required)
- `intensity` (number, optional, default: 100)
- `scale` (number, optional, default: 1.0)

**Response:**
```json
{
  "id": "uuid",
  "fileUrl": "https://...",
  "mapType": "diffuse",
  "intensity": 100,
  "scale": 1.0
}
```

---

## 🔗 Model Parts

### `PUT /api/models-3d/parts`
Met à jour les parties d'un modèle 3D (assigner des material maps).

**Body (JSON):**
```json
{
  "modelId": "uuid",
  "parts": [
    {
      "id": "uuid",
      "materialMapId": "uuid" // ou null pour désassigner
    }
  ]
}
```

---

## 📏 Size Patterns

Les routes existent déjà dans `/api/size-patterns` et sont compatibles avec le nouveau schéma.

---

## 🖼️ Designs 2D

### `GET /api/designs-2d`
Récupère tous les Designs 2D.

### `POST /api/designs-2d`
Crée un nouveau Design 2D.

**Body (FormData):**
- `name` (string, required)
- `file` (File, optional) - Fichier SVG
- `format` (string, optional) - Ex: "PNG - 2048x2048"

### `DELETE /api/designs-2d?id={id}`
Supprime un Design 2D.

---

## 🔐 Authentification

Toutes les routes utilisent `supabaseAdmin` pour contourner RLS (Row Level Security). 
Pour la production, vous devrez configurer RLS dans Supabase si nécessaire.

## 📦 Storage Buckets

Les fichiers sont stockés dans les buckets suivants :
- `models-3d` - Fichiers .glb
- `material-maps` - Textures (PNG, JPG)
- `size-patterns` - Fichiers SVG de patrons
- `designs-2d` - Designs SVG
- `thumbnails` - Miniatures

