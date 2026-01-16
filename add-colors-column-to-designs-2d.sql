-- Ajouter la colonne colors à la table designs_2d
-- Cette colonne stocke les couleurs extraites depuis le SVG au format [{name: string, value: string}]

ALTER TABLE designs_2d 
ADD COLUMN IF NOT EXISTS colors JSONB DEFAULT '[]'::jsonb;

-- Commentaire pour documenter la colonne
COMMENT ON COLUMN designs_2d.colors IS 'Array of color objects extracted from SVG: [{name: string, value: string}]. Example: [{"name": "primary", "value": "#FF0000"}, {"name": "secondary", "value": "#00FF00"}]';
