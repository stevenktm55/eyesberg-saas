"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, useGLTF } from "@react-three/drei";
import * as THREE from "three";

interface Model3DPreviewStaticProps {
  url: string | null;
  className?: string;
  style?: React.CSSProperties;
  materialMaps?: Record<string, any>; // material_map_id -> material map with files
  design2DUrl?: string | null;
  modelParts?: Array<{ name: string; material_map_id?: string | null }>;
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
    const scale = 1.5 / maxDim; // Légèrement plus petit pour avoir de la marge
    scene.scale.multiplyScalar(scale);
    scene.position.sub(center.multiplyScalar(scale));
  }

  // Appliquer les material maps et le design 2D
  React.useEffect(() => {
    if (!scene) return;

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mesh = child as THREE.Mesh;
        const material = mesh.material;
        
        // Trouver la partie correspondante par nom de mesh
        const meshName = mesh.name || '';
        const part = modelParts?.find(p => p.name === meshName);
        
        if (part && part.material_map_id && materialMaps?.[part.material_map_id]) {
          const materialMap = materialMaps[part.material_map_id];
          const files = materialMap.material_map_files || [];
          
          // Créer un nouveau matériau MeshStandardMaterial si nécessaire
          let standardMaterial: THREE.MeshStandardMaterial;
          if (material instanceof THREE.MeshStandardMaterial) {
            standardMaterial = material;
          } else {
            standardMaterial = new THREE.MeshStandardMaterial();
            if (material instanceof THREE.MeshBasicMaterial) {
              standardMaterial.color.copy(material.color);
            }
            mesh.material = standardMaterial;
          }
          
          // S'assurer que le matériau n'est pas transparent
          standardMaterial.transparent = false;
          standardMaterial.opacity = 1.0;
          
          // Appliquer les textures
          const textureLoader = new THREE.TextureLoader();
          
          files.forEach((file: any) => {
            const mapType = file.map_type;
            const fileUrl = file.file_url;
            const intensity = file.intensity !== undefined ? file.intensity / 100 : 1;
            const scale = file.scale !== undefined ? file.scale : 1;
            
            if (!fileUrl) return;
            
            textureLoader.load(fileUrl, (texture) => {
              texture.wrapS = THREE.RepeatWrapping;
              texture.wrapT = THREE.RepeatWrapping;
              texture.repeat.set(scale, scale);
              
              switch (mapType) {
                case 'diffuse':
                  standardMaterial.map = texture;
                  standardMaterial.map.needsUpdate = true;
                  break;
                case 'normal':
                  standardMaterial.normalMap = texture;
                  standardMaterial.normalScale.set(intensity, intensity);
                  standardMaterial.normalMap.needsUpdate = true;
                  break;
                case 'roughness':
                  standardMaterial.roughnessMap = texture;
                  standardMaterial.roughnessMap.needsUpdate = true;
                  break;
                case 'metallic':
                  standardMaterial.metalnessMap = texture;
                  standardMaterial.metalnessMap.needsUpdate = true;
                  break;
                case 'ao':
                  standardMaterial.aoMap = texture;
                  standardMaterial.aoMapIntensity = intensity;
                  standardMaterial.aoMap.needsUpdate = true;
                  break;
              }
              
              standardMaterial.needsUpdate = true;
            });
          });
        }
        
        // S'assurer que tous les matériaux ne sont pas transparents
        if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshBasicMaterial) {
          material.transparent = false;
          material.opacity = 1.0;
        }
        
        // Appliquer le design 2D comme texture si disponible
        if (design2DUrl && material instanceof THREE.MeshStandardMaterial) {
          const textureLoader = new THREE.TextureLoader();
          textureLoader.load(design2DUrl, (texture) => {
            // Utiliser le design 2D comme texture de base ou overlay
            if (!material.map) {
              material.map = texture;
            } else {
              // Si une texture existe déjà, on peut la combiner ou la remplacer
              material.map = texture;
            }
            material.map.needsUpdate = true;
            material.needsUpdate = true;
            material.transparent = false;
            material.opacity = 1.0;
          }, undefined, (error) => {
            console.error('Error loading design 2D texture:', error);
          });
        }
      }
    });
  }, [scene, materialMaps, design2DUrl, modelParts]);

  return <primitive object={scene} />;
}

export function Model3DPreviewStatic({ 
  url, 
  className, 
  style, 
  materialMaps, 
  design2DUrl, 
  modelParts 
}: Model3DPreviewStaticProps) {
  if (!url) {
    return (
      <div 
        className={className}
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0a',
        }}
      >
        <div style={{
          width: '60px',
          height: '60px',
          border: '2px solid #2a2a2a',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#4a4a4a',
          fontSize: '24px'
        }}>
          □
        </div>
      </div>
    );
  }

  // Extraire backgroundColor du style passé ou utiliser une valeur par défaut
  const backgroundColor = style?.backgroundColor || '#e8e8e8';
  
  return (
    <div 
      className={className}
      style={{
        position: 'relative',
        backgroundColor: backgroundColor,
        ...style, // Appliquer tous les autres styles
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 2], fov: 50 }}
        gl={{ 
          antialias: true,
          alpha: false,
          outputColorSpace: THREE.SRGBColorSpace,
          clearColor: backgroundColor, // Utiliser le backgroundColor pour le clearColor
        }}
        style={{ width: '100%', height: '100%', backgroundColor: backgroundColor }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <directionalLight position={[-10, -10, -5]} intensity={0.5} />
          <Model 
            url={url} 
            materialMaps={materialMaps}
            design2DUrl={design2DUrl}
            modelParts={modelParts}
          />
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  );
}


