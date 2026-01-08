import { useState, useEffect } from 'react';

export interface CameraView {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
  distance?: number;
  fov?: number;
}

// Fonction pour convertir le format Supabase vers le format attendu par ClientPage
function convertSupabaseViewToClientFormat(view: CameraView): {
  id: string;
  modelId: string;
  label: string;
  position: [number, number, number];
  target: [number, number, number];
  distance: number;
  fov: number;
} {
  return {
    id: view.id,
    modelId: '', // Pas utilisé dans le format Supabase
    label: view.name,
    position: [view.position.x, view.position.y, view.position.z],
    target: [view.target.x, view.target.y, view.target.z],
    distance: view.distance || 8.0,
    fov: view.fov || 50.0
  };
}

export function useCameraViews(modelId?: string | null) {
  const [cameraViews, setCameraViews] = useState<ReturnType<typeof convertSupabaseViewToClientFormat>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!modelId) {
      setCameraViews([]);
      setIsLoading(false);
      return;
    }

    async function loadCameraViews() {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('🔍 Chargement des vues de caméra pour modelId:', modelId);
        
        // Charger le modèle 3D avec ses vues de caméra depuis Supabase
        const response = await fetch(`/api/models-3d/${modelId}`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const model = await response.json();
        console.log('📦 Modèle chargé:', model);
        console.log('📷 Vues brutes du modèle:', model.camera_views);
        
        const views = model.camera_views || [];
        
        // Convertir au format attendu par ClientPage
        const convertedViews = views.map(convertSupabaseViewToClientFormat);
        console.log('🔄 Vues converties:', convertedViews);
        
        setCameraViews(convertedViews);
      } catch (err) {
        console.error('❌ Error loading camera views:', err);
        setError(err instanceof Error ? err.message : 'Failed to load camera views');
        setCameraViews([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadCameraViews();
  }, [modelId]);

  const saveCameraView = async (view: {
    modelId: string;
    label: string;
    position: [number, number, number];
    target: [number, number, number];
    distance: number;
    fov: number;
  }) => {
    try {
      // Convertir vers le format Supabase
      const supabaseView: CameraView = {
        id: `view-${view.label.toLowerCase()}`,
        name: view.label,
        position: { x: view.position[0], y: view.position[1], z: view.position[2] },
        target: { x: view.target[0], y: view.target[1], z: view.target[2] },
        distance: view.distance,
        fov: view.fov
      };

      const response = await fetch(`/api/models/${view.modelId}/camera-views`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(supabaseView),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const updatedModel = await response.json();
      
      // Mettre à jour la liste locale
      const views = updatedModel.camera_views || [];
      const convertedViews = views.map(convertSupabaseViewToClientFormat);
      setCameraViews(convertedViews);

      return convertSupabaseViewToClientFormat(supabaseView);
    } catch (err) {
      console.error('Error saving camera view:', err);
      throw err;
    }
  };

  return {
    cameraViews,
    isLoading,
    error,
    saveCameraView
  };
}