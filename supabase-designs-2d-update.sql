-- Ajouter les colonnes manquantes à la table designs_2d
-- Pour permettre la sélection du modèle 3D, le mapping des couleurs et l'URL du preview

-- 1. Ajouter la colonne model3d_id (référence vers models_3d)
ALTER TABLE designs_2d
ADD COLUMN IF NOT EXISTS model3d_id TEXT;

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN designs_2d.model3d_id IS 'ID du modèle 3D associé pour le preview du design';

-- 2. Ajouter la colonne color_mappings (JSONB pour stocker les mappings classe -> color_id)
ALTER TABLE designs_2d
ADD COLUMN IF NOT EXISTS color_mappings JSONB DEFAULT '{}'::jsonb;

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN designs_2d.color_mappings IS 'Mapping des classes de couleurs détectées dans le SVG vers les IDs de couleurs sélectionnées (ex: {"primary": "color-id-1", "secondary": "color-id-2"})';

-- 3. Ajouter la colonne preview_url (URL du preview statique généré)
ALTER TABLE designs_2d
ADD COLUMN IF NOT EXISTS preview_url TEXT;

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN designs_2d.preview_url IS 'URL du preview statique du design appliqué sur le modèle 3D';

-- Optionnel: Ajouter un index sur model3d_id pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_designs_2d_model3d_id ON designs_2d(model3d_id);

-- Optionnel: Ajouter un index GIN sur color_mappings pour les recherches JSONB
CREATE INDEX IF NOT EXISTS idx_designs_2d_color_mappings ON designs_2d USING GIN(color_mappings);

