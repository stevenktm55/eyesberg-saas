'use client';

import { useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';

// Composant pour initialiser la caméra avec les réglages - UNIQUEMENT au chargement initial
// Doit être utilisé à l'intérieur d'un Canvas (utilise useThree())
export function CameraInitializer({ 
  initialZoom, 
  initialRotation, 
  viewHasBeenSetRef 
}: { 
  initialZoom: number; 
  initialRotation: number; 
  viewHasBeenSetRef: React.MutableRefObject<boolean> 
}) {
  const { camera } = useThree();
  const initializedRef = useRef(false);
  const valuesRef = useRef({ initialZoom, initialRotation });
  
  // Stocker les valeurs initiales
  useEffect(() => {
    valuesRef.current = { initialZoom, initialRotation };
  }, [initialZoom, initialRotation]);
  
  useEffect(() => {
    // Ne s'exécuter qu'une seule fois au montage et seulement si aucune vue n'a été définie
    if (initializedRef.current || viewHasBeenSetRef.current) return;
    
    // Attendre un peu pour s'assurer que OrbitControls est prêt
    const timer = setTimeout(() => {
      // Vérifier à nouveau si une vue a été définie entre-temps
      if (initializedRef.current || viewHasBeenSetRef.current) return;
      
      const { initialZoom: zoom, initialRotation: rotation } = valuesRef.current;
      
      // Appliquer le zoom initial
      const distance = zoom || 5;
      camera.position.set(0, 0, distance);
      
      // Appliquer la rotation initiale en faisant tourner la position autour du target
      if (rotation !== 0) {
        const angleRad = (rotation * Math.PI) / 180;
        // Rotation autour de l'axe Y
        const x = 0;
        const z = distance;
        const newX = x * Math.cos(angleRad) - z * Math.sin(angleRad);
        const newZ = x * Math.sin(angleRad) + z * Math.cos(angleRad);
        camera.position.set(newX, camera.position.y, newZ);
      }
      
      camera.updateProjectionMatrix();
      initializedRef.current = true;
    }, 200);
    
    return () => clearTimeout(timer);
  }, [camera, viewHasBeenSetRef]);
  
  return null;
}

