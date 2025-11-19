"use client";

import { Suspense, useMemo, useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF } from "@react-three/drei";
import * as THREE from "three";

interface MaterialMapData {
  id: string;
  name: string;
  material_map_files?: Array<{
    map_type: string;
    file_url: string;
    intensity: number;
    scale: number;
  }>;
}

interface ModelPart {
  name: string;
  materialId: string | null;
  materialName: string;
}

interface Model3DPreviewProps {
  url: string | null;
  modelParts?: ModelPart[];
  materialMaps?: MaterialMapData[];
  className?: string;
  style?: React.CSSProperties;
}

function Model({ url, modelParts, materialMaps }: { url: string; modelParts?: ModelPart[]; materialMaps?: MaterialMapData[] }) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null);
  const [texturesLoaded, setTexturesLoaded] = useState(false);
  
  // Clone la scène pour éviter les mutations
  const clonedScene = useMemo(() => {
    const cloned = scene.clone();
    
    // Auto-fit le modèle dans la scène
    const box = new THREE.Box3().setFromObject(cloned);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);
    
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      const scale = 1.5 / maxDim; // Légèrement plus petit pour avoir de la marge
      cloned.scale.multiplyScalar(scale);
      cloned.position.sub(center.multiplyScalar(scale));
    }
    
    return cloned;
  }, [scene]);

  // Appliquer les material maps aux matériaux du modèle
  useEffect(() => {
    if (!modelParts || !materialMaps || !clonedScene) {
      console.log('Model3DPreview: Missing dependencies', { 
        hasModelParts: !!modelParts, 
        hasMaterialMaps: !!materialMaps, 
        hasClonedScene: !!clonedScene 
      });
      return;
    }

    console.log('Model3DPreview: Applying material maps', { 
      partsCount: modelParts.length, 
      mapsCount: materialMaps.length,
      parts: modelParts.map(p => ({ name: p.name, materialId: p.materialId, materialName: p.materialName })),
      materialMaps: materialMaps.map(m => ({ id: m.id, name: m.name, filesCount: m.material_map_files?.length || 0 }))
    });

    const loader = new THREE.TextureLoader();
    const texturePromises: Promise<void>[] = [];
    const loadedTextures: THREE.Texture[] = [];
    let materialsProcessed = 0;

    // Parcourir tous les objets de la scène
    clonedScene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.material) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        
        materials.forEach((material, index) => {
          if (!(material instanceof THREE.MeshStandardMaterial)) {
            // Convertir en MeshStandardMaterial si nécessaire
            const standardMat = new THREE.MeshStandardMaterial();
            standardMat.copy(material as THREE.Material);
            if (Array.isArray(object.material)) {
              object.material[index] = standardMat;
            } else {
              object.material = standardMat;
            }
            return;
          }

          // Nettoyer les textures précédentes
          if (material.map) material.map.dispose();
          if (material.normalMap) material.normalMap.dispose();
          if (material.roughnessMap) material.roughnessMap.dispose();
          if (material.metalnessMap) material.metalnessMap.dispose();
          if (material.aoMap) material.aoMap.dispose();

          // Réinitialiser les propriétés
          material.map = null;
          material.normalMap = null;
          material.roughnessMap = null;
          material.metalnessMap = null;
          material.aoMap = null;

          // Trouver le material map correspondant par nom du matériau
          // Essayer plusieurs stratégies de correspondance
          const materialName = material.name || '';
          const objectName = (object as any).name || '';
          const nodeName = (object.parent as any)?.name || '';
          
          // Normaliser les noms pour la correspondance (enlever les numéros, underscores, etc.)
          const normalizeName = (name: string) => {
            return name.toLowerCase()
              .replace(/_\d+\.\d+/g, '') // Enlever les numéros comme "_2917.001"
              .replace(/[_\s-]/g, '') // Enlever underscores, espaces, tirets
              .trim();
          };
          
          // Chercher une correspondance exacte d'abord, puis partielle
          let part = modelParts.find(p => {
            const partNameLower = normalizeName(p.name);
            const materialNameNorm = normalizeName(materialName);
            const objectNameNorm = normalizeName(objectName);
            const nodeNameNorm = normalizeName(nodeName);
            
            return (
              partNameLower === materialNameNorm ||
              partNameLower === objectNameNorm ||
              partNameLower === nodeNameNorm ||
              materialNameNorm.includes(partNameLower) ||
              partNameLower.includes(materialNameNorm) ||
              objectNameNorm.includes(partNameLower) ||
              partNameLower.includes(objectNameNorm) ||
              // Correspondance par mots-clés communs (FRONT, BACK, etc.)
              (partNameLower.includes('front') && (materialNameNorm.includes('front') || objectNameNorm.includes('front'))) ||
              (partNameLower.includes('back') && (materialNameNorm.includes('back') || objectNameNorm.includes('back'))) ||
              (partNameLower.includes('sleeve') && (materialNameNorm.includes('sleeve') || objectNameNorm.includes('sleeve'))) ||
              (partNameLower.includes('collar') && (materialNameNorm.includes('collar') || objectNameNorm.includes('collar')))
            );
          });
          
          // Si pas de correspondance, essayer par index (si on a le même nombre de matériaux)
          if (!part && modelParts.length > 0) {
            // Utiliser l'index du matériau comme fallback
            const materialIndex = Array.isArray(object.material) ? index : 0;
            if (materialIndex < modelParts.length) {
              part = modelParts[materialIndex];
            }
          }
          
          // Debug log pour voir les correspondances
          if (part) {
            console.log(`Model3DPreview: Matched part "${part.name}" (materialId: ${part.materialId}) with material "${materialName}" or object "${objectName}"`);
          } else {
            console.log(`Model3DPreview: No match found for material "${materialName}" or object "${objectName}"`);
          }

          if (part && part.materialId) {
            const materialMap = materialMaps.find(m => m.id === part.materialId);
            
            if (materialMap && materialMap.material_map_files) {
              const files = materialMap.material_map_files;
              console.log(`Model3DPreview: Applying material map "${materialMap.name}" to part "${part.name}" with ${files.length} files`);
              
              // Charger les textures
              files.forEach((file) => {
                const promise = new Promise<void>((resolve, reject) => {
                  loader.load(
                    file.file_url,
                    (texture) => {
                      texture.wrapS = THREE.RepeatWrapping;
                      texture.wrapT = THREE.RepeatWrapping;
                      texture.repeat.set(file.scale, file.scale);
                      loadedTextures.push(texture);
                      
                      if (file.map_type === 'diffuse') {
                        texture.colorSpace = THREE.SRGBColorSpace;
                        material.map = texture;
                        material.needsUpdate = true;
                        console.log(`Model3DPreview: Applied diffuse map to material "${materialName}"`);
                      } else if (file.map_type === 'normal') {
                        material.normalMap = texture;
                        material.normalScale = new THREE.Vector2(file.intensity / 100, file.intensity / 100);
                        material.needsUpdate = true;
                        console.log(`Model3DPreview: Applied normal map to material "${materialName}"`);
                      } else if (file.map_type === 'roughness') {
                        material.roughnessMap = texture;
                        material.roughness = file.intensity / 100;
                        material.needsUpdate = true;
                        console.log(`Model3DPreview: Applied roughness map to material "${materialName}"`);
                      } else if (file.map_type === 'metallic') {
                        material.metalnessMap = texture;
                        material.metalness = file.intensity / 100;
                        material.needsUpdate = true;
                        console.log(`Model3DPreview: Applied metallic map to material "${materialName}"`);
                      } else if (file.map_type === 'ao') {
                        material.aoMap = texture;
                        material.aoMapIntensity = file.intensity / 100;
                        material.needsUpdate = true;
                        console.log(`Model3DPreview: Applied AO map to material "${materialName}"`);
                      }
                      materialsProcessed++;
                      resolve();
                    },
                    undefined,
                    (error) => {
                      console.error(`Error loading ${file.map_type} texture:`, error);
                      reject(error);
                    }
                  );
                });
                texturePromises.push(promise);
              });
            }
          }
        });
      }
    });

    Promise.all(texturePromises).then(() => {
      console.log(`Model3DPreview: Loaded ${texturePromises.length} textures, processed ${materialsProcessed} materials`);
      setTexturesLoaded(true);
    }).catch((error) => {
      console.error('Model3DPreview: Error loading textures:', error);
    });

    // Cleanup function
    return () => {
      loadedTextures.forEach(texture => texture.dispose());
    };
  }, [clonedScene, modelParts, materialMaps]);

  return <primitive ref={groupRef} object={clonedScene} />;
}

export function Model3DPreview({ url, modelParts, materialMaps, className, style }: Model3DPreviewProps) {
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

  return (
    <div 
      className={className}
      style={{
        ...style,
        backgroundColor: '#0a0a0a',
        position: 'relative',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 2], fov: 50 }}
        gl={{ 
          antialias: true,
          alpha: false,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <directionalLight position={[-10, -10, -5]} intensity={0.5} />
          <Model url={url} modelParts={modelParts} materialMaps={materialMaps} />
          <OrbitControls 
            enableZoom={true}
            enablePan={false}
            minDistance={1}
            maxDistance={5}
            autoRotate={false}
          />
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  );
}

