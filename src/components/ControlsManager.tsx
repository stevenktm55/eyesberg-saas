'use client';

import { OrbitControls } from '@react-three/drei';
import { useEffect, useRef } from 'react';

// Composant pour gérer OrbitControls avec les réglages
export function ControlsManager({ 
  targetView, 
  viewDistance, 
  initialZoom, 
  initialRotation, 
  zoomSpeed, 
  rotateSpeed, 
  minZoom, 
  maxZoom,
  selectedTextId,
  isPlacingText,
  isDraggingText,
  isRotatingText,
  isResizingText,
  setTargetView,
  viewHasBeenSetRef
}: {
  targetView: 'torse' | 'dos' | 'bras-gauche' | 'bras-droit' | null;
  viewDistance: Record<'torse' | 'dos' | 'bras-gauche' | 'bras-droit', number>;
  initialZoom: number;
  initialRotation: number;
  zoomSpeed: number;
  rotateSpeed: number;
  minZoom: number;
  maxZoom: number;
  selectedTextId: string | null;
  isPlacingText: 'nom' | 'numero' | null;
  isDraggingText: boolean;
  isRotatingText: boolean;
  isResizingText: boolean;
  setTargetView: (view: 'torse' | 'dos' | 'bras-gauche' | 'bras-droit' | null) => void;
  viewHasBeenSetRef: React.MutableRefObject<boolean>;
}) {
  const controlsRef = useRef<any>(null);
  const rotationInitializedRef = useRef(false);
  
  // La rotation initiale est gérée par CameraInitializer, pas besoin de la gérer ici
  
  // Mettre à jour les réglages quand ils changent
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.zoomSpeed = zoomSpeed;
      controlsRef.current.rotateSpeed = rotateSpeed;
      controlsRef.current.minDistance = minZoom;
      controlsRef.current.maxDistance = maxZoom;
    }
  }, [zoomSpeed, rotateSpeed, minZoom, maxZoom]);
  
  // Gérer le changement de vue (sans appliquer la rotation initiale)
  useEffect(() => {
    if (controlsRef.current && targetView) {
      // Marquer qu'une vue a été définie (persistant, ne se réinitialise jamais)
      viewHasBeenSetRef.current = true;
      
      const camera = controlsRef.current.object;
      const distance = viewDistance[targetView] || initialZoom;
      // Positionner la caméra aux positions standard (sans rotation initiale)
      switch (targetView) {
        case 'torse':
          camera.position.set(0, 0, distance);
          controlsRef.current.target.set(0, 0, 0);
          break;
        case 'dos':
          camera.position.set(0, 0, -distance);
          controlsRef.current.target.set(0, 0, 0);
          break;
        case 'bras-gauche':
          camera.position.set(-distance, 0, 0);
          controlsRef.current.target.set(0, 0, 0);
          break;
        case 'bras-droit':
          camera.position.set(distance, 0, 0);
          controlsRef.current.target.set(0, 0, 0);
          break;
      }
      // S'assurer que la rotation de la caméra est réinitialisée (pas de rotation initiale lors du changement de vue)
      camera.rotation.set(0, 0, 0);
      controlsRef.current.update();
      setTimeout(() => {
        setTargetView(null);
      }, 100);
    }
  }, [targetView, viewDistance, initialZoom, setTargetView, viewHasBeenSetRef]);
  
  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableZoom={!selectedTextId && !isPlacingText}
      enableRotate={!selectedTextId && !isPlacingText}
      enabled={!isDraggingText && !isRotatingText && !isResizingText && !isPlacingText}
      minDistance={minZoom}
      maxDistance={maxZoom}
      zoomSpeed={zoomSpeed}
      rotateSpeed={rotateSpeed}
    />
  );
}

