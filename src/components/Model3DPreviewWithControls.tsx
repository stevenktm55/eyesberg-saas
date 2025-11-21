"use client";

import React, { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF } from "@react-three/drei";
import * as THREE from "three";

interface Model3DPreviewWithControlsProps {
  url: string | null;
  className?: string;
  style?: React.CSSProperties;
  materialMaps?: Record<string, any>;
  design2DUrl?: string | null;
  modelParts?: Array<{ name: string; material_map_id?: string | null }>;
  zoomSpeed?: number;
  rotateSpeed?: number;
  minZoom?: number;
  maxZoom?: number;
  initialZoom?: number;
  initialRotation?: number;
}

function Model({ 
  url, 
  materialMaps, 
  design2DUrl, 
  modelParts 
}: { 
  url: string;
  materialMaps?: Record<string, any>;
  design2DUrl?: string | null;
  modelParts?: Array<{ name: string; material_map_id?: string | null }>;
}) {
  const { scene } = useGLTF(url);
  
  // Auto-fit le modèle dans la scène
  const box = new THREE.Box3().setFromObject(scene);
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  box.getCenter(center);
  box.getSize(size);
  
  const maxDim = Math.max(size.x, size.y, size.z);
  if (maxDim > 0) {
    const scale = 1.5 / maxDim;
    scene.scale.multiplyScalar(scale);
    scene.position.sub(center.multiplyScalar(scale));
  }

  // Appliquer les material maps et le design 2D (simplifié pour l'instant)
  React.useEffect(() => {
    if (!scene) return;

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mesh = child as THREE.Mesh;
        let material = mesh.material;
        
        // Convertir en MeshStandardMaterial si nécessaire
        let standardMaterial: THREE.MeshStandardMaterial;
        if (material instanceof THREE.MeshStandardMaterial) {
          standardMaterial = material;
        } else {
          standardMaterial = new THREE.MeshStandardMaterial();
          if (material instanceof THREE.MeshBasicMaterial) {
            standardMaterial.color.copy(material.color);
          } else {
            standardMaterial.color.setHex(0xffffff);
          }
          mesh.material = standardMaterial;
        }
        
        standardMaterial.transparent = false;
        standardMaterial.opacity = 1.0;
        if (standardMaterial.color.getHex() === 0x000000) {
          standardMaterial.color.setHex(0xffffff);
        }
      }
    });
  }, [scene, materialMaps, design2DUrl, modelParts]);

  return <primitive object={scene} />;
}

// Composant pour gérer le recentrage progressif lors du dézoom
function ZoomController({ 
  controlsRef, 
  cameraRef, 
  initialZoom 
}: { 
  controlsRef: React.MutableRefObject<any>;
  cameraRef: React.MutableRefObject<THREE.PerspectiveCamera | null>;
  initialZoom: number;
}) {
  const lastZoomDistanceRef = useRef(initialZoom);

  useFrame(() => {
    if (!controlsRef.current || !cameraRef.current) return;
    
    const controls = controlsRef.current;
    const camera = cameraRef.current;
    const currentDistance = camera.position.distanceTo(controls.target);
    
    // Détecter si on dézoome (distance augmente)
    if (currentDistance > lastZoomDistanceRef.current) {
      // Calculer la distance du centre
      const centerDistance = controls.target.distanceTo(new THREE.Vector3(0, 0, 0));
      
      // Si on est loin du centre, recentrer progressivement
      if (centerDistance > 0.01) {
        const lerpFactor = 0.05; // Vitesse de recentrage (plus petit = plus lent)
        controls.target.lerp(new THREE.Vector3(0, 0, 0), lerpFactor);
        controls.update();
      }
    }
    
    lastZoomDistanceRef.current = currentDistance;
  });

  return null;
}

export function Model3DPreviewWithControls({ 
  url, 
  materialMaps, 
  design2DUrl, 
  modelParts,
  zoomSpeed = 1,
  rotateSpeed = 1,
  minZoom = 1,
  maxZoom = 10,
  initialZoom = 5,
  initialRotation = 0,
  className,
  style 
}: Model3DPreviewWithControlsProps) {
  const controlsRef = useRef<any>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mettre à jour la vitesse de rotation
  React.useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.rotateSpeed = rotateSpeed;
    }
  }, [rotateSpeed]);

  // Activer le zoom vers le curseur
  React.useEffect(() => {
    if (controlsRef.current) {
      // Activer le zoom vers le curseur
      controlsRef.current.zoomToCursor = true;
      controlsRef.current.screenSpacePanning = false;
    }
  }, []);

  // Appliquer le zoom initial et l'angle de rotation
  React.useEffect(() => {
    if (controlsRef.current && cameraRef.current) {
      const camera = cameraRef.current;
      const controls = controlsRef.current;
      
      // Convertir l'angle de rotation en radians
      const angleRad = (initialRotation * Math.PI) / 180;
      
      // Positionner la caméra selon l'angle de rotation (autour de l'axe Y)
      const x = Math.sin(angleRad) * initialZoom;
      const z = Math.cos(angleRad) * initialZoom;
      // Garder une hauteur Y raisonnable pour éviter la vue du dessus
      const y = Math.max(0.5, initialZoom * 0.3); // Au moins 0.5, ou 30% du zoom
      
      camera.position.set(x, y, z);
      controls.update();
    }
  }, [initialZoom, initialRotation]);

  if (!url) {
    return (
      <div 
        className={className}
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a1a1a',
          color: '#a0a0a0'
        }}
      >
        No 3D model selected
      </div>
    );
  }

  return (
    <div ref={containerRef} className={className} style={style}>
      <Canvas
        camera={{ position: [0, 0, initialZoom], fov: 50 }}
        style={{ width: '100%', height: '100%', backgroundColor: style?.backgroundColor || '#e8e8e8' }}
        gl={{ antialias: true }}
        onCreated={({ camera }) => {
          cameraRef.current = camera as THREE.PerspectiveCamera;
          // Appliquer l'angle de rotation initial
          const angleRad = (initialRotation * Math.PI) / 180;
          const x = Math.sin(angleRad) * initialZoom;
          const z = Math.cos(angleRad) * initialZoom;
          // Garder une hauteur Y raisonnable pour éviter la vue du dessus
          const y = Math.max(0.5, initialZoom * 0.3); // Au moins 0.5, ou 30% du zoom
          camera.position.set(x, y, z);
        }}
      >
        <color attach="background" args={[style?.backgroundColor || '#e8e8e8']} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Suspense fallback={null}>
          <Model 
            url={url} 
            materialMaps={materialMaps}
            design2DUrl={design2DUrl}
            modelParts={modelParts}
          />
        </Suspense>
        <OrbitControls
          ref={controlsRef}
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          zoomSpeed={zoomSpeed}
          rotateSpeed={rotateSpeed}
          minDistance={minZoom}
          maxDistance={maxZoom}
          zoomToCursor={true}
        />
        <ZoomController 
          controlsRef={controlsRef} 
          cameraRef={cameraRef} 
          initialZoom={initialZoom} 
        />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}

