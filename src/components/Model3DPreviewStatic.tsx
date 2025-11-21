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
  onCanvasReady?: (canvas: HTMLCanvasElement) => void; // Callback when canvas is ready
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
        // Toujours avoir une couleur de base blanche pour éviter le noir
        if (standardMaterial.color.getHex() === 0x000000) {
          standardMaterial.color.setHex(0xffffff);
        }
        
        // Trouver la partie correspondante par nom de mesh
        // Les noms peuvent varier (ex: "Cloth_mesh001" vs "Cloth" ou "Front")
        const meshName = mesh.name || '';
        let part: { name: string; material_map_id?: string | null } | undefined;
        
        if (modelParts && modelParts.length > 0) {
          // 1. Essayer correspondance exacte
          part = modelParts.find(p => {
            const partName = (p.name || '').toLowerCase();
            const meshNameLower = meshName.toLowerCase();
            return partName === meshNameLower;
          });
          
          // 2. Si pas trouvé, essayer correspondance partielle
          if (!part) {
            part = modelParts.find(p => {
              const partName = (p.name || '').toLowerCase();
              const meshNameLower = meshName.toLowerCase();
              
              // Le nom de la partie est contenu dans le nom du mesh
              if (meshNameLower.includes(partName) && partName.length > 2) return true;
              
              // Le nom du mesh est contenu dans le nom de la partie
              if (partName.includes(meshNameLower) && meshNameLower.length > 2) return true;
              
              // Correspondance par préfixe (ex: "Cloth_mesh001" -> "Cloth")
              if (meshNameLower.includes('_')) {
                const meshPrefix = meshNameLower.split('_')[0];
                if (partName.includes(meshPrefix) || meshPrefix.includes(partName)) return true;
              }
              
              // Correspondance par mots-clés communs (ignorer les mots trop courts)
              const meshWords = meshNameLower.split(/[_\s]+/).filter(w => w.length > 2);
              const partWords = partName.split(/[_\s]+/).filter(w => w.length > 2);
              const commonWords = meshWords.filter(w => partWords.includes(w));
              if (commonWords.length > 0) return true;
              
              return false;
            });
          }
          
          // 3. Si toujours pas trouvé et qu'on a le même nombre de meshes que de parties,
          // utiliser l'index (mais seulement si c'est le dernier recours)
          // On ne fait pas ça automatiquement car l'ordre peut être différent
        }
        
        // Log détaillé pour debug
        const partNames = modelParts?.map(p => `${p.name} (map_id: ${p.material_map_id || 'none'})`) || [];
        console.log(`Mesh: "${meshName}"`, {
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
        
        // Appliquer les material maps (par-dessus le design 2D)
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
                    // Appliquer la texture diffuse directement (comme dans Model3DPreview)
                    texture.colorSpace = THREE.SRGBColorSpace;
                    materialDiffuseTexture = texture;
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
                            combinedTexture.colorSpace = THREE.SRGBColorSpace;
                            // Utiliser ClampToEdgeWrapping pour le design 2D (pas de tiling)
                            combinedTexture.wrapS = THREE.ClampToEdgeWrapping;
                            combinedTexture.wrapT = THREE.ClampToEdgeWrapping;
                            combinedTexture.repeat.set(1, 1);
                            combinedTexture.offset.set(0, 0);
                            combinedTexture.flipY = false;
                            combinedTexture.needsUpdate = true;
                            standardMaterial.map = combinedTexture;
                            standardMaterial.map.needsUpdate = true;
                            standardMaterial.needsUpdate = true;
                            console.log('Combined texture applied (material map + design 2D)');
                          }
                        };
                        img.src = design2DUrl;
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
                                combinedTexture.colorSpace = THREE.SRGBColorSpace;
                                // Utiliser ClampToEdgeWrapping pour le design 2D (pas de tiling)
                                combinedTexture.wrapS = THREE.ClampToEdgeWrapping;
                                combinedTexture.wrapT = THREE.ClampToEdgeWrapping;
                                combinedTexture.repeat.set(1, 1);
                                combinedTexture.offset.set(0, 0);
                                combinedTexture.flipY = false;
                                combinedTexture.needsUpdate = true;
                                standardMaterial.map = combinedTexture;
                                standardMaterial.map.needsUpdate = true;
                                standardMaterial.needsUpdate = true;
                                console.log('Combined texture applied (material map + design 2D)');
                              }
                            }
                          }
                        );
                      }
                    }
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
        
        // Si pas de material maps mais qu'on a un design 2D, appliquer le design 2D seul
        // Appliquer le design 2D à TOUS les meshes, pas seulement ceux sans material maps
        if (design2DUrl && !materialDiffuseTexture) {
          if (design2DUrl.toLowerCase().endsWith('.svg')) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              const canvas = combineDesignWithMaterial(img, null);
              if (canvas) {
                const texture = new THREE.CanvasTexture(canvas);
                texture.colorSpace = THREE.SRGBColorSpace;
                // Utiliser ClampToEdgeWrapping pour le design 2D (pas de tiling)
                texture.wrapS = THREE.ClampToEdgeWrapping;
                texture.wrapT = THREE.ClampToEdgeWrapping;
                texture.repeat.set(1, 1);
                texture.offset.set(0, 0);
                texture.flipY = false;
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
                texture.colorSpace = THREE.SRGBColorSpace;
                // Utiliser ClampToEdgeWrapping pour le design 2D (pas de tiling)
                texture.wrapS = THREE.ClampToEdgeWrapping;
                texture.wrapT = THREE.ClampToEdgeWrapping;
                texture.repeat.set(1, 1);
                texture.offset.set(0, 0);
                texture.flipY = false;
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
        
        // Si pas de material maps ET pas de design 2D, s'assurer qu'on a une couleur de base
        if (!part && !design2DUrl) {
          // Pas de correspondance de partie et pas de design 2D
          // Le matériau devrait déjà avoir une couleur blanche de base
          if (standardMaterial.color.getHex() === 0x000000) {
            standardMaterial.color.setHex(0xffffff);
          }
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
  modelParts,
  onCanvasReady
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
          preserveDrawingBuffer: true, // Permet de capturer le canvas
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(bgColor, 1);
          // Exposer le canvas via le callback
          if (onCanvasReady) {
            const canvas = gl.domElement as HTMLCanvasElement;
            // Attendre que le rendu soit terminé (textures chargées, matériaux appliqués)
            // On attend plus longtemps pour s'assurer que tout est chargé
            setTimeout(() => {
              onCanvasReady(canvas);
            }, 3000);
          }
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


