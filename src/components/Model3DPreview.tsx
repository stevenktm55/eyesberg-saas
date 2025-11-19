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
    if (!modelParts || !materialMaps || !clonedScene) return;

    const loader = new THREE.TextureLoader();
    const texturePromises: Promise<void>[] = [];

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

          // Trouver le material map correspondant par nom du matériau
          // Essayer plusieurs stratégies de correspondance
          const materialName = material.name || '';
          const objectName = (object as any).name || '';
          const nodeName = (object.parent as any)?.name || '';
          
          // Chercher une correspondance exacte d'abord, puis partielle
          let part = modelParts.find(p => {
            const partNameLower = p.name.toLowerCase();
            return (
              partNameLower === materialName.toLowerCase() ||
              partNameLower === objectName.toLowerCase() ||
              partNameLower === nodeName.toLowerCase() ||
              materialName.toLowerCase().includes(partNameLower) ||
              partNameLower.includes(materialName.toLowerCase()) ||
              objectName.toLowerCase().includes(partNameLower) ||
              partNameLower.includes(objectName.toLowerCase())
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

          if (part && part.materialId) {
            const materialMap = materialMaps.find(m => m.id === part.materialId);
            
            if (materialMap && materialMap.material_map_files) {
              const files = materialMap.material_map_files;
              
              // Charger les textures
              files.forEach((file) => {
                const promise = new Promise<void>((resolve, reject) => {
                  loader.load(
                    file.file_url,
                    (texture) => {
                      texture.wrapS = THREE.RepeatWrapping;
                      texture.wrapT = THREE.RepeatWrapping;
                      texture.repeat.set(file.scale, file.scale);
                      
                      if (file.map_type === 'diffuse') {
                        texture.colorSpace = THREE.SRGBColorSpace;
                        material.map = texture;
                        material.needsUpdate = true;
                      } else if (file.map_type === 'normal') {
                        material.normalMap = texture;
                        material.normalScale = new THREE.Vector2(file.intensity / 100, file.intensity / 100);
                        material.needsUpdate = true;
                      } else if (file.map_type === 'roughness') {
                        material.roughnessMap = texture;
                        material.roughness = file.intensity / 100;
                        material.needsUpdate = true;
                      } else if (file.map_type === 'metallic') {
                        material.metalnessMap = texture;
                        material.metalness = file.intensity / 100;
                        material.needsUpdate = true;
                      } else if (file.map_type === 'ao') {
                        material.aoMap = texture;
                        material.aoMapIntensity = file.intensity / 100;
                        material.needsUpdate = true;
                      }
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
      setTexturesLoaded(true);
    });
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

