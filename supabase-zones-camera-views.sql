-- =====================================================
-- Liaison Zones → Vues de caméra
-- =====================================================
-- Ce script ajoute la colonne camera_view_id à la table zones
-- pour lier chaque zone à une vue de caméra du modèle 3D
-- 
-- Date: 2026-01-08
-- =====================================================

-- 1. Ajouter la colonne camera_view_id (VARCHAR pour stocker l'ID de la vue)
ALTER TABLE zones 
ADD COLUMN IF NOT EXISTS camera_view_id VARCHAR(255);

-- 2. Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN zones.camera_view_id IS 
'ID de la vue de caméra associée à cette zone. 
Référence l''ID d''une vue dans models_3d.camera_views.
Quand un logo/texte est placé sur cette zone, la caméra se positionne selon cette vue.';

-- 3. Ajouter un index pour les requêtes
CREATE INDEX IF NOT EXISTS idx_zones_camera_view_id 
ON zones (camera_view_id);

-- =====================================================
-- Notes d'utilisation:
-- =====================================================
-- - Chaque zone peut être liée à UNE vue de caméra
-- - Les vues sont stockées dans models_3d.camera_views
-- - Le camera_view_id correspond au champ "id" de la vue (ex: "view-1234567890")
-- - Si camera_view_id est NULL, la zone n'a pas de vue associée
-- =====================================================
