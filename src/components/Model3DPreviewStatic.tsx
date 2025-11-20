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

    console.log('Applying materials - materialMaps:', materialMaps, 'modelParts:', modelParts, 'design2DUrl:', design2DUrl);

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mesh = child as THREE.Mesh;
        let material = mesh.material;
        
        // Si c'est un tableau de matériaux, traiter chaque matériau
        if (Array.isArray(material)) {
          material = material[0];
          mesh.material = material;
        }
        
        // Créer un nouveau matériau MeshStandardMaterial si nécessaire
        let standardMaterial: THREE.MeshStandardMaterial;
        if (material instanceof THREE.MeshStandardMaterial) {
          standardMaterial = material;
        } else {
          standardMaterial = new THREE.MeshStandardMaterial();
          if (material instanceof THREE.MeshBasicMaterial) {
            standardMaterial.color.copy(material.color);
          } else {
            // Couleur par défaut si pas de couleur
            standardMaterial.color.setHex(0xffffff);
          }
          mesh.material = standardMaterial;
        }
        
        // S'assurer que le matériau n'est pas transparent et a une couleur de base
        standardMaterial.transparent = false;
        standardMaterial.opacity = 1.0;
        if (standardMaterial.color.getHex() === 0x000000) {
          standardMaterial.color.setHex(0xffffff); // Blanc par défaut si noir
        }
        
        // Trouver la partie correspondante par nom de mesh
        // Essayer plusieurs correspondances possibles
        const meshName = mesh.name || '';
        let part = modelParts?.find(p => p.name === meshName);
        
        // Si pas de correspondance exacte, essayer de trouver par préfixe ou pattern
        if (!part && modelParts) {
          // Essayer de trouver une partie dont le nom est contenu dans le nom du mesh
          part = modelParts.find(p => meshName.includes(p.name) || p.name.includes(meshName));
          
          // Si toujours pas trouvé, essayer avec le premier mesh (sans suffixe)
          if (!part && meshName.includes('_')) {
            const baseName = meshName.split('_')[0];
            part = modelParts.find(p => p.name.includes(baseName) || baseName.includes(p.name));
          }
        }
        
        console.log(`Mesh: ${meshName}, Part:`, part, 'MaterialMap:', part?.material_map_id ? materialMaps?.[part.material_map_id] : 'none', 'All parts:', modelParts?.map(p => p.name));
        
        if (part && part.material_map_id && materialMaps?.[part.material_map_id]) {
          const materialMap = materialMaps[part.material_map_id];
          const files = materialMap.material_map_files || [];
          
          console.log(`Applying material map to ${meshName}:`, files);
          
          // Appliquer les textures
          const textureLoader = new THREE.TextureLoader();
          
          files.forEach((file: any) => {
            const mapType = file.map_type;
            const fileUrl = file.file_url;
            const intensity = file.intensity !== undefined ? file.intensity / 100 : 1;
            const scale = file.scale !== undefined ? file.scale : 1;
            
            if (!fileUrl) {
              console.warn(`No file URL for ${mapType}`);
              return;
            }
            
            console.log(`Loading texture: ${mapType} from ${fileUrl}`);
            
            textureLoader.load(
              fileUrl,
              (texture) => {
                console.log(`Texture loaded: ${mapType}`);
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
              },
              undefined,
              (error) => {
                console.error(`Error loading texture ${mapType}:`, error);
              }
            );
          });
        }
        
        // Appliquer le design 2D comme texture si disponible
        // Note: Les SVG ne peuvent pas être chargés directement comme texture
        // Il faudrait les convertir en PNG/JPEG côté serveur ou utiliser un loader SVG
        if (design2DUrl && design2DUrl.toLowerCase().endsWith('.svg')) {
          console.log(`Design 2D is SVG, cannot load directly as texture: ${design2DUrl}`);
          // Pour l'instant, on ne peut pas charger les SVG directement
          // Il faudrait convertir le SVG en image raster (PNG/JPEG) côté serveur
        } else if (design2DUrl) {
          console.log(`Loading design 2D: ${design2DUrl}`);
          const textureLoader = new THREE.TextureLoader();
          textureLoader.load(
            design2DUrl,
            (texture) => {
              console.log('Design 2D texture loaded');
              // Utiliser le design 2D comme texture de base ou overlay
              standardMaterial.map = texture;
              standardMaterial.map.needsUpdate = true;
              standardMaterial.needsUpdate = true;
              standardMaterial.transparent = false;
              standardMaterial.opacity = 1.0;
            },
            undefined,
            (error) => {
              console.error('Error loading design 2D texture:', error);
            }
          );
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
  const backgroundColor = (style?.backgroundColor as string) || '#e8e8e8';
  
  // Convertir la couleur hex en THREE.Color
  const bgColor = new THREE.Color(backgroundColor);
  
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
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(bgColor, 1);
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <color attach="background" args={[backgroundColor]} />
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


