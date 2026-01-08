-- Script pour ajouter des vues de caméra de test à un modèle 3D existant
-- À exécuter dans Supabase SQL Editor

-- 1. Voir les modèles existants
-- SELECT id, name, camera_views FROM models_3d;

-- 2. Ajouter des vues de caméra de test au premier modèle trouvé
-- Remplacer 'YOUR_MODEL_ID' par l'ID réel d'un modèle

UPDATE models_3d 
SET camera_views = '[
  {
    "id": "face",
    "name": "FACE", 
    "position": {"x": 0, "y": 0, "z": 5},
    "target": {"x": 0, "y": 0, "z": 0},
    "distance": 5,
    "fov": 50
  },
  {
    "id": "dos",
    "name": "DOS",
    "position": {"x": 0, "y": 0, "z": -5}, 
    "target": {"x": 0, "y": 0, "z": 0},
    "distance": 5,
    "fov": 50
  },
  {
    "id": "gauche", 
    "name": "GAUCHE",
    "position": {"x": -5, "y": 0, "z": 0},
    "target": {"x": 0, "y": 0, "z": 0},
    "distance": 5,
    "fov": 50
  },
  {
    "id": "droite",
    "name": "DROITE", 
    "position": {"x": 5, "y": 0, "z": 0},
    "target": {"x": 0, "y": 0, "z": 0},
    "distance": 5,
    "fov": 50
  }
]'::jsonb
WHERE id = 'YOUR_MODEL_ID';

-- 3. Vérifier que les vues ont été ajoutées
-- SELECT id, name, camera_views FROM models_3d WHERE id = 'YOUR_MODEL_ID';