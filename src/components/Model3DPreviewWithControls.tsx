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
  const groupRef = useRef<THREE.Group>(null);
  
  // Clone la scène pour éviter les mutations
  const clonedScene = React.useMemo(() => {
    const cloned = scene.clone();
    
    // Auto-fit le modèle dans la scène
    const box = new THREE.Box3().setFromObject(cloned);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);
    
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      const scale = 1.5 / maxDim;
      cloned.scale.multiplyScalar(scale);
      cloned.position.sub(center.multiplyScalar(scale));
    }
    
    return cloned;
  }, [scene]);

  // Appliquer les material maps et le design 2D
  React.useEffect(() => {
    if (!clonedScene) return;

    console.log('Applying materials - materialMaps:', materialMaps, 'modelParts:', modelParts, 'design2DUrl:', design2DUrl);

    // Normaliser les noms pour la correspondance (enlever les numéros, underscores, etc.)
    const normalizeName = (name: string) => {
      return name.toLowerCase()
        .replace(/_\d+\.\d+/g, '') // Enlever les numéros comme "_2917.001"
        .replace(/[_\s-]/g, '') // Enlever underscores, espaces, tirets
        .trim();
    };

    clonedScene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.material) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        
        materials.forEach((material, index) => {
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
            if (Array.isArray(object.material)) {
              object.material[index] = standardMaterial;
            } else {
              object.material = standardMaterial;
            }
          }
          
          standardMaterial.transparent = false;
          standardMaterial.opacity = 1.0;
          if (standardMaterial.color.getHex() === 0x000000) {
            standardMaterial.color.setHex(0xffffff);
          }
          
          // Trouver le material map correspondant par nom du matériau
          // Essayer plusieurs stratégies de correspondance (comme dans Model3DPreview)
          const materialName = (material as any).name || '';
          const objectName = (object as any).name || '';
          const nodeName = (object.parent as any)?.name || '';
          
          let part: { name: string; material_map_id?: string | null } | undefined;
          
          if (modelParts && modelParts.length > 0) {
            // 1. Chercher une correspondance exacte d'abord (sans normalisation)
            part = modelParts.find(p => 
              p.name === materialName || 
              p.name === objectName ||
              p.name === nodeName
            );
            
            // 2. Si pas de correspondance exacte, essayer avec normalisation
            if (!part) {
              const materialNameNorm = normalizeName(materialName);
              const objectNameNorm = normalizeName(objectName);
              const nodeNameNorm = normalizeName(nodeName);
              
              part = modelParts.find(p => {
                const partNameNorm = normalizeName(p.name);
                return (
                  partNameNorm === materialNameNorm ||
                  partNameNorm === objectNameNorm ||
                  partNameNorm === nodeNameNorm
                );
              });
            }
            
            // 3. Si toujours pas de correspondance, essayer une correspondance partielle
            if (!part) {
              const materialNameLower = materialName.toLowerCase();
              const objectNameLower = objectName.toLowerCase();
              
              part = modelParts.find(p => {
                const partNameLower = p.name.toLowerCase();
                const partNameWithoutNumbers = partNameLower.replace(/_\d+\.\d+/g, '');
                const materialNameWithoutNumbers = materialNameLower.replace(/_\d+\.\d+/g, '');
                
                return (
                  materialNameWithoutNumbers.includes(partNameWithoutNumbers) ||
                  partNameWithoutNumbers.includes(materialNameWithoutNumbers) ||
                  objectNameLower.includes(partNameWithoutNumbers) ||
                  partNameWithoutNumbers.includes(objectNameLower)
                );
              });
            }
            
            // 4. Si pas de correspondance, essayer par index (si on a le même nombre de matériaux)
            if (!part && modelParts.length > 0) {
              const materialIndex = Array.isArray(object.material) ? index : 0;
              if (materialIndex < modelParts.length) {
                part = modelParts[materialIndex];
              }
            }
          }
          
          // Log détaillé pour debug
          const partNames = modelParts?.map(p => `${p.name} (map_id: ${p.material_map_id || 'none'})`) || [];
          console.log(`Mesh: "${objectName}", Material: "${materialName}", Parent: "${nodeName}"`, {
            foundPart: part ? `${part.name} (id: ${part.material_map_id})` : 'none',
            hasMaterialMap: part?.material_map_id ? 'yes' : 'no',
            allParts: partNames,
            materialMapsKeys: materialMaps ? Object.keys(materialMaps) : []
          });
        
        // Variable pour stocker la texture diffuse des material maps
        let materialDiffuseTexture: THREE.Texture | null = null;
        
         // Fonction pour combiner le design 2D avec la texture diffuse existante
         // Utiliser 4096x4096 pour le design 2D pour une meilleure qualité
         const combineDesignWithMaterial = (designImg: HTMLImageElement, materialTex: THREE.Texture | null) => {
           const canvas = document.createElement('canvas');
           canvas.width = 4096; // 4096px pour une meilleure qualité du design 2D
           canvas.height = 4096;
          const ctx = canvas.getContext('2d');
          if (!ctx) return null;
          
          // 1. D'abord, dessiner la texture diffuse des material maps (si elle existe)
          if (materialTex && materialTex.image) {
            ctx.drawImage(materialTex.image as CanvasImageSource, 0, 0, canvas.width, canvas.height);
          } else {
            // Pas de texture diffuse, mettre un fond blanc
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          
          // 2. Ensuite, dessiner le design 2D par-dessus
          const imgAspect = designImg.width / designImg.height;
          const canvasAspect = canvas.width / canvas.height;
          let drawWidth = canvas.width;
          let drawHeight = canvas.height;
          let drawX = 0;
          let drawY = 0;
          
          if (imgAspect > canvasAspect) {
            drawHeight = canvas.width / imgAspect;
            drawY = (canvas.height - drawHeight) / 2;
          } else {
            drawWidth = canvas.height * imgAspect;
            drawX = (canvas.width - drawWidth) / 2;
          }
          
          ctx.drawImage(designImg, drawX, drawY, drawWidth, drawHeight);
          
          return canvas;
        };
        
          // Variable pour suivre si on a une texture diffuse et les promesses de chargement
          let hasDiffuseTexture = false;
          let diffuseTexture: THREE.Texture | null = null;
          const texturePromises: Promise<void>[] = [];
          
          // Appliquer les material maps (par-dessus le design 2D)
          if (part && part.material_map_id && materialMaps?.[part.material_map_id]) {
            const materialMap = materialMaps[part.material_map_id];
            const files = materialMap.material_map_files || [];
            
            console.log(`Applying material map to ${objectName}:`, files);
            
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
              
              const texturePromise = new Promise<void>((resolve, reject) => {
                textureLoader.load(
                  fileUrl,
                  (texture) => {
                    console.log(`Texture loaded: ${mapType}, size: ${texture.image?.width}x${texture.image?.height}`);
                    // Optimiser les textures pour les performances
                    texture.generateMipmaps = true;
                    texture.minFilter = THREE.LinearMipmapLinearFilter;
                    texture.magFilter = THREE.LinearFilter;
                    texture.wrapS = THREE.RepeatWrapping;
                    texture.wrapT = THREE.RepeatWrapping;
                    texture.repeat.set(scale, scale);
                    
                     // Redimensionner toutes les textures pour améliorer les performances lors des rotations
                     if (texture.image && (texture.image.width > 512 || texture.image.height > 512)) {
                       const maxSize = 512; // Limiter à 512 pour le preview (améliore les performances)
                       const canvas = document.createElement('canvas');
                       const ctx = canvas.getContext('2d');
                       if (ctx) {
                         const ratio = Math.min(maxSize / texture.image.width, maxSize / texture.image.height);
                         canvas.width = texture.image.width * ratio;
                         canvas.height = texture.image.height * ratio;
                         ctx.drawImage(texture.image, 0, 0, canvas.width, canvas.height);
                         texture.image = canvas;
                         texture.needsUpdate = true;
                         console.log(`Texture resized to ${canvas.width}x${canvas.height} for performance`);
                       }
                     }
                    
                    switch (mapType) {
                      case 'diffuse':
                        // Appliquer la texture diffuse directement (comme dans Model3DPreview)
                        texture.colorSpace = THREE.SRGBColorSpace;
                        hasDiffuseTexture = true;
                        diffuseTexture = texture;
                        standardMaterial.map = texture;
                        standardMaterial.map.needsUpdate = true;
                        
                        // Si on a un design 2D, le combiner avec cette texture
                        if (design2DUrl) {
                          if (design2DUrl.toLowerCase().endsWith('.svg')) {
                            const img = new Image();
                            img.crossOrigin = 'anonymous';
                            img.onload = () => {
                              const canvas = combineDesignWithMaterial(img, texture);
                              if (canvas) {
                                const combinedTexture = new THREE.CanvasTexture(canvas);
                                combinedTexture.needsUpdate = true;
                                standardMaterial.map = combinedTexture;
                                standardMaterial.map.needsUpdate = true;
                                standardMaterial.needsUpdate = true;
                                console.log('Combined texture applied (material map + design 2D)');
                              }
                              resolve();
                            };
                            img.onerror = () => reject(new Error('Failed to load SVG'));
                            img.src = design2DUrl;
                            return; // Ne pas resolve ici, attendre le chargement du SVG
                          } else {
                            // Design 2D non-SVG, charger et combiner
                            const designLoader = new THREE.TextureLoader();
                            designLoader.load(
                              design2DUrl,
                              (designTexture) => {
                                if (designTexture.image && designTexture.image instanceof HTMLImageElement) {
                                  const canvas = combineDesignWithMaterial(designTexture.image, texture);
                                  if (canvas) {
                                    const combinedTexture = new THREE.CanvasTexture(canvas);
                                    combinedTexture.needsUpdate = true;
                                    standardMaterial.map = combinedTexture;
                                    standardMaterial.map.needsUpdate = true;
                                    standardMaterial.needsUpdate = true;
                                    console.log('Combined texture applied (material map + design 2D)');
                                  }
                                }
                                resolve();
                              },
                              undefined,
                              (error) => {
                                console.error('Error loading design 2D texture:', error);
                                reject(error);
                              }
                            );
                            return; // Ne pas resolve ici, attendre le chargement du design
                          }
                        }
                        resolve();
                        break;
                      case 'normal':
                        standardMaterial.normalMap = texture;
                        standardMaterial.normalScale = new THREE.Vector2(intensity, intensity);
                        standardMaterial.normalMap.needsUpdate = true;
                        resolve();
                        break;
                      case 'roughness':
                        standardMaterial.roughnessMap = texture;
                        standardMaterial.roughness = intensity;
                        standardMaterial.roughnessMap.needsUpdate = true;
                        resolve();
                        break;
                      case 'metallic':
                        standardMaterial.metalnessMap = texture;
                        standardMaterial.metalness = intensity;
                        standardMaterial.metalnessMap.needsUpdate = true;
                        resolve();
                        break;
                      case 'ao':
                        standardMaterial.aoMap = texture;
                        standardMaterial.aoMapIntensity = intensity;
                        standardMaterial.aoMap.needsUpdate = true;
                        resolve();
                        break;
                      default:
                        resolve();
                    }
                    
                    standardMaterial.needsUpdate = true;
                  },
                  undefined,
                  (error) => {
                    console.error(`Error loading texture ${mapType}:`, error);
                    reject(error);
                  }
                );
              });
              
              texturePromises.push(texturePromise);
            });
            
            // Après avoir chargé toutes les textures, si on a un design 2D mais pas de texture diffuse, appliquer le design
            Promise.all(texturePromises).then(() => {
              if (design2DUrl && !hasDiffuseTexture) {
                console.log('Applying design 2D after material maps (no diffuse texture found)');
                if (design2DUrl.toLowerCase().endsWith('.svg')) {
                  const img = new Image();
                  img.crossOrigin = 'anonymous';
                  img.onload = () => {
                    const canvas = combineDesignWithMaterial(img, null);
                    if (canvas) {
                      const texture = new THREE.CanvasTexture(canvas);
                      texture.needsUpdate = true;
                      standardMaterial.map = texture;
                      standardMaterial.map.needsUpdate = true;
                      standardMaterial.needsUpdate = true;
                      console.log('Design 2D applied after material maps (no diffuse)');
                    }
                  };
                  img.onerror = (error) => {
                    console.error('Error loading SVG for conversion:', error);
                  };
                  img.src = design2DUrl;
                } else {
                  const designLoader = new THREE.TextureLoader();
                  designLoader.load(
                    design2DUrl,
                    (designTexture) => {
                      if (designTexture.image && designTexture.image instanceof HTMLImageElement) {
                        const canvas = combineDesignWithMaterial(designTexture.image, null);
                        if (canvas) {
                          const texture = new THREE.CanvasTexture(canvas);
                          texture.needsUpdate = true;
                          standardMaterial.map = texture;
                          standardMaterial.map.needsUpdate = true;
                          standardMaterial.needsUpdate = true;
                          console.log('Design 2D applied after material maps (no diffuse)');
                        }
                      }
                    },
                    undefined,
                    (error) => {
                      console.error('Error loading design 2D texture:', error);
                    }
                  );
                }
              }
            }).catch((error) => {
              console.error('Error loading material map textures:', error);
            });
          }
          
          // Si pas de material maps mais qu'on a un design 2D, appliquer le design 2D seul
          if (!part && design2DUrl) {
            if (design2DUrl.toLowerCase().endsWith('.svg')) {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.onload = () => {
                const canvas = combineDesignWithMaterial(img, null);
                if (canvas) {
                  const texture = new THREE.CanvasTexture(canvas);
                  texture.needsUpdate = true;
                  standardMaterial.map = texture;
                  standardMaterial.map.needsUpdate = true;
                  standardMaterial.needsUpdate = true;
                  console.log('Design 2D applied alone (no material maps)');
                }
              };
              img.onerror = (error) => {
                console.error('Error loading SVG for conversion:', error);
              };
              img.src = design2DUrl;
            } else {
              const textureLoader = new THREE.TextureLoader();
              textureLoader.load(
                design2DUrl,
                (texture) => {
                  standardMaterial.map = texture;
                  standardMaterial.map.needsUpdate = true;
                  standardMaterial.needsUpdate = true;
                  console.log('Design 2D applied alone (no material maps)');
                },
                undefined,
                (error) => {
                  console.error('Error loading design 2D texture:', error);
                }
              );
            }
          }
        });
      }
    });
  }, [clonedScene, materialMaps, design2DUrl, modelParts]);

  return <primitive ref={groupRef} object={clonedScene} />;
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

  // Mettre à jour la vitesse de rotation
  React.useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.rotateSpeed = rotateSpeed;
    }
  }, [rotateSpeed]);

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
    <div className={className} style={style}>
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
        />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}

