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
        // Ne pas forcer le blanc si on a des material maps qui vont être appliqués
        // On ne met du blanc que si vraiment nécessaire (pas de texture et couleur noire)
        if (!standardMaterial.map && standardMaterial.color.getHex() === 0x000000) {
          standardMaterial.color.setHex(0xffffff); // Blanc par défaut si noir et pas de texture
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
        
        // Variables pour stocker les textures chargées
        let design2DImage: HTMLImageElement | null = null;
        let materialDiffuseImage: HTMLImageElement | null = null;
        let hasDesign2D = !!design2DUrl;
        
        // Fonction pour créer une texture combinée (design 2D en arrière-plan, material maps par-dessus)
        const createCombinedTexture = (designTexture: HTMLImageElement | null, materialTexture: HTMLImageElement | null) => {
          const canvas = document.createElement('canvas');
          canvas.width = 2048;
          canvas.height = 2048;
          const ctx = canvas.getContext('2d');
          if (!ctx) return null;
          
          // 1. D'abord, dessiner le design 2D (en arrière-plan)
          if (designTexture) {
            const imgAspect = designTexture.width / designTexture.height;
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
            
            ctx.drawImage(designTexture, drawX, drawY, drawWidth, drawHeight);
          } else {
            // Pas de design 2D, mettre un fond blanc
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          
          // 2. Ensuite, dessiner la texture diffuse des material maps par-dessus
          if (materialTexture) {
            ctx.drawImage(materialTexture, 0, 0, canvas.width, canvas.height);
          }
          
          return canvas;
        };
        
        // Fonction pour appliquer la texture combinée finale
        const applyCombinedTexture = () => {
          // Ne créer le canvas combiné que si on a un design 2D ET une texture diffuse
          // Sinon, appliquer directement les textures
          if (hasDesign2D && (design2DImage || materialDiffuseImage)) {
            const canvas = createCombinedTexture(design2DImage, materialDiffuseImage);
            if (canvas) {
              const texture = new THREE.CanvasTexture(canvas);
              texture.needsUpdate = true;
              standardMaterial.map = texture;
              standardMaterial.map.needsUpdate = true;
              standardMaterial.needsUpdate = true;
              console.log('Combined texture applied (design 2D + material maps)');
            }
          } else if (materialDiffuseImage && !hasDesign2D) {
            // Pas de design 2D, appliquer directement la texture diffuse
            const texture = new THREE.TextureLoader().load(
              materialDiffuseImage.src,
              (tex) => {
                standardMaterial.map = tex;
                standardMaterial.map.needsUpdate = true;
                standardMaterial.needsUpdate = true;
              }
            );
          } else if (design2DImage && !materialDiffuseImage) {
            // Pas de material maps, appliquer seulement le design 2D
            const canvas = createCombinedTexture(design2DImage, null);
            if (canvas) {
              const texture = new THREE.CanvasTexture(canvas);
              texture.needsUpdate = true;
              standardMaterial.map = texture;
              standardMaterial.map.needsUpdate = true;
              standardMaterial.needsUpdate = true;
            }
          }
        };
        
        // Charger le design 2D en premier (en arrière-plan)
        if (design2DUrl) {
          if (design2DUrl.toLowerCase().endsWith('.svg')) {
            console.log(`Design 2D is SVG, converting to image: ${design2DUrl}`);
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              design2DImage = img;
              applyCombinedTexture();
            };
            img.onerror = (error) => {
              console.error('Error loading SVG for conversion:', error);
            };
            img.src = design2DUrl;
          } else {
            console.log(`Loading design 2D: ${design2DUrl}`);
            const textureLoader = new THREE.TextureLoader();
            textureLoader.load(
              design2DUrl,
              (texture) => {
                if (texture.image && texture.image instanceof HTMLImageElement) {
                  design2DImage = texture.image;
                  applyCombinedTexture();
                }
              },
              undefined,
              (error) => {
                console.error('Error loading design 2D texture:', error);
              }
            );
          }
        }
        
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
                    // Pour la texture diffuse, on la combine avec le design 2D
                    if (texture.image && texture.image instanceof HTMLImageElement) {
                      materialDiffuseImage = texture.image;
                      applyCombinedTexture();
                    } else {
                      // Si ce n'est pas une HTMLImageElement, appliquer directement
                      standardMaterial.map = texture;
                      standardMaterial.map.needsUpdate = true;
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


