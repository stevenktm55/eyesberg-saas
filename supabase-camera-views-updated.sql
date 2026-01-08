-- =====================================================
-- Mise à jour: Système de vues caméra pour les modèles 3D
-- =====================================================
-- Ce script ajoute la colonne camera_views à la table models_3d
-- SANS initialiser avec des vues par défaut
-- 
-- Date: 2026-01-08
-- Version: 2.0 (sans vues par défaut)
-- =====================================================

-- 1. Ajouter la colonne camera_views (JSONB)
ALTER TABLE models_3d 
ADD COLUMN IF NOT EXISTS camera_views JSONB DEFAULT '[]'::jsonb;

-- 2. Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN models_3d.camera_views IS 
'Liste des vues caméra personnalisées pour ce modèle 3D. 
Format: [{id, name, position: {x, y, z}, target: {x, y, z}}]
Chaque modèle commence avec un tableau vide - l''utilisateur créé ses propres vues.';

-- 3. Créer un index GIN pour les requêtes JSONB (performance)
CREATE INDEX IF NOT EXISTS idx_models_3d_camera_views 
ON models_3d USING gin (camera_views);

-- 4. NE PAS initialiser avec des vues par défaut
-- Les modèles existants conservent leur valeur actuelle
-- Les nouveaux modèles commenceront avec un tableau vide []

-- =====================================================
-- Notes d'utilisation:
-- =====================================================
-- - Chaque modèle 3D commence avec camera_views = []
-- - L'utilisateur créé ses propres vues via l'interface admin
-- - Les vues sont stockées avec le modèle et réutilisables
-- - Format de chaque vue:
--   {
--     "id": "vue-unique-id",
--     "name": "Nom de la vue",
--     "position": {"x": 0, "y": 0, "z": 15},
--     "target": {"x": 0, "y": 0, "z": 0}
--   }
-- =====================================================
