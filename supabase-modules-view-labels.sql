-- =====================================================
-- Labels de vues et sélection de vues pour les modules
-- =====================================================
-- Ce script ajoute les colonnes nécessaires pour gérer
-- les labels de vues et la sélection de vues dans les modules
-- 
-- Date: 2026-01-08
-- =====================================================

-- 1. Ajouter la colonne view_labels (JSONB) pour les labels de vues
ALTER TABLE customization_modules 
ADD COLUMN IF NOT EXISTS view_labels JSONB DEFAULT '[]'::jsonb;

-- 2. Ajouter la colonne selected_camera_views (JSONB) pour les vues sélectionnées
ALTER TABLE customization_modules 
ADD COLUMN IF NOT EXISTS selected_camera_views JSONB DEFAULT '[]'::jsonb;

-- 3. Ajouter des commentaires pour documenter les colonnes
COMMENT ON COLUMN customization_modules.view_labels IS 
'Liste des labels de vues configurés pour ce module.
Format: [{"id": "view-1", "label": "Front", "cameraViewId": "view-123"}]
- id: identifiant unique du label
- label: texte affiché dans l''onglet (ex: "Front", "Dos", "Torse")
- cameraViewId: ID de la vue de caméra à déclencher (référence à models_3d.camera_views)';

COMMENT ON COLUMN customization_modules.selected_camera_views IS 
'Liste des IDs de vues de caméra sélectionnées depuis le modèle 3D.
Format: ["view-1234567890", "view-0987654321"]
Ces vues sont disponibles pour être associées aux labels ou aux zones.';

-- 4. Créer des index GIN pour les requêtes JSONB
CREATE INDEX IF NOT EXISTS idx_customization_modules_view_labels 
ON customization_modules USING gin (view_labels);

CREATE INDEX IF NOT EXISTS idx_customization_modules_selected_camera_views 
ON customization_modules USING gin (selected_camera_views);

-- 5. Initialiser avec des valeurs par défaut pour les modules existants
-- (Front, Back, Left, Right - compatibilité avec l'ancien système)
UPDATE customization_modules 
SET view_labels = '[
  {"id": "label-front", "label": "Front", "cameraViewId": null},
  {"id": "label-back", "label": "Back", "cameraViewId": null},
  {"id": "label-left", "label": "Left", "cameraViewId": null},
  {"id": "label-right", "label": "Right", "cameraViewId": null}
]'::jsonb
WHERE (view_labels IS NULL OR view_labels = '[]'::jsonb)
  AND type IN ('logo', 'text');

-- =====================================================
-- Notes d'utilisation:
-- =====================================================
-- - view_labels : Configuration des onglets de vues dans le builder
-- - selected_camera_views : Vues disponibles depuis le modèle 3D
-- - Format view_labels permet de personnaliser les labels et d'associer des vues
-- - Si cameraViewId est null, le système utilise les vues par défaut (front, back, etc.)
-- =====================================================
