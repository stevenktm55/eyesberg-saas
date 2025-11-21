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

  // Charger le design 2D d'abord (comme dans ModelViewer)
  const [designTexture, setDesignTexture] = React.useState<THREE.CanvasTexture | null>(null);
  
  React.useEffect(() => {
    if (!design2DUrl) {
      setDesignTexture(null);
      return;
    }
    
    console.log('🎨 Loading design 2D from:', design2DUrl);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      console.log('✅ Design 2D image loaded, size:', img.width, 'x', img.height);
      const size = 512; // 512x512 pour les performances
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('❌ Failed to get canvas context');
        return;
      }
      
      // Fond blanc d'abord (comme dans ModelViewer)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, size, size);
      
      // Dessiner le design directement (comme dans ModelViewer ligne 696)
      ctx.drawImage(img, 0, 0, size, size);
      console.log('✅ Design drawn on canvas');
      
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = true;
      tex.flipY = false;
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.offset.set(0, 0);
      tex.repeat.set(1, 1);
      tex.needsUpdate = true;
      
      setDesignTexture(tex);
      console.log('✅ Design texture created');
    };
    img.onerror = (error) => {
      console.error('Error loading design 2D:', error);
      setDesignTexture(null);
    };
    img.src = design2DUrl;
  }, [design2DUrl]);

  // Appliquer les material maps et le design 2D (comme dans ModelViewer - créer un nouveau matériau avec le design)
  React.useEffect(() => {
    if (!clonedScene) return;
    if (design2DUrl && !designTexture) return; // Attendre que le design soit chargé

    console.log('Applying materials - materialMaps:', materialMaps, 'modelParts:', modelParts, 'design2DUrl:', design2DUrl, 'designTexture:', designTexture ? 'loaded' : 'null');

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
          // Toujours s'assurer que la couleur est blanche par défaut
          standardMaterial.color.setHex(0xffffff);
          
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
        
        // Vérifier si c'est un mesh BACK (ne pas appliquer le design sur les BACK)
        const isBack = /back/i.test(materialName) || /back/i.test(objectName) || /back/i.test(nodeName);
        
        if (isBack) {
          // Forcer les meshes BACK en blanc sans texture (comme dans ModelViewer)
          const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
          (whiteMat as any).map = null;
          (whiteMat as any).normalMap = null;
          (whiteMat as any).roughnessMap = null;
          (whiteMat as any).metalnessMap = null;
          (whiteMat as any).aoMap = null;
          (whiteMat as any).name = materialName || (objectName ? `${objectName}_BACK_WHITE` : 'BACK_WHITE');
          if (Array.isArray(object.material)) {
            object.material[index] = whiteMat;
          } else {
            object.material = whiteMat;
          }
          console.log('⬜ Back mesh forced white:', objectName || '(unnamed)', '| Material:', (whiteMat as any).name);
          return; // Ne pas continuer pour les meshes BACK
        }
        
        // Ensure uv2 exists for AO (comme dans ModelViewer ligne 787-788)
        const g = object.geometry as THREE.BufferGeometry;
        if (!g.getAttribute('uv2')) { 
          const uv = g.getAttribute('uv'); 
          if (uv) g.setAttribute('uv2', uv); 
        }
        
        // Créer un nouveau matériau avec le design intégré (comme dans ModelViewer ligne 789)
        const newMaterial = new THREE.MeshStandardMaterial({ 
          map: designTexture || undefined, 
          color: 0xffffff, 
          roughness: 0.6, 
          metalness: 0.0, 
          transparent: false 
        });
        (newMaterial as any).name = materialName || (objectName ? `${objectName}_FRONT` : 'FRONT');
        
        if (designTexture) {
          console.log('✅ Design 2D applied as base map texture (UV0) to material:', (newMaterial as any).name);
        }
        
        // Stocker une référence à la texture du design pour s'assurer qu'elle ne soit pas écrasée
        const designTexRef = designTexture;
        
        // Appliquer les material maps (normal, roughness, etc.) en plus
        if (part && part.material_map_id && materialMaps?.[part.material_map_id]) {
          // Always use UV2 for PBR maps if available: remap uv <- uv2 to guarantee alignment (comme dans ModelViewer ligne 794-799)
          const g2 = object.geometry as THREE.BufferGeometry;
          const uv2Attr = g2.getAttribute('uv2');
          if (uv2Attr) {
            g2.setAttribute('uv', uv2Attr);
          }
          const materialMap = materialMaps[part.material_map_id];
          const files = materialMap.material_map_files || [];
          
          console.log(`Applying material maps to ${objectName}:`, files);
          
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
            
            // Ne PAS appliquer la texture diffuse des material maps - le design 2D est déjà la map
            if (mapType === 'diffuse') {
              console.log('Skipping material map diffuse - design 2D is already the map');
              return;
            }
            
            console.log(`Loading texture: ${mapType} from ${fileUrl}`);
            
            textureLoader.load(
              fileUrl,
              (texture) => {
                // Optimiser les textures pour les performances
                texture.generateMipmaps = true;
                texture.minFilter = THREE.LinearMipmapLinearFilter;
                texture.magFilter = THREE.LinearFilter;
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set(scale, scale);
                
                // Redimensionner toutes les textures à 512x512 max pour améliorer les performances lors des rotations
                if (texture.image && (texture.image.width > 512 || texture.image.height > 512)) {
                  const maxSize = 512;
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    const ratio = Math.min(maxSize / texture.image.width, maxSize / texture.image.height);
                    canvas.width = texture.image.width * ratio;
                    canvas.height = texture.image.height * ratio;
                    ctx.drawImage(texture.image, 0, 0, canvas.width, canvas.height);
                    texture.image = canvas;
                    texture.needsUpdate = true;
                  }
                }
                
                switch (mapType) {
                  case 'normal':
                    newMaterial.normalMap = texture;
                    newMaterial.normalScale = new THREE.Vector2(intensity, intensity);
                    newMaterial.normalMap.needsUpdate = true;
                    break;
                  case 'roughness':
                    newMaterial.roughnessMap = texture;
                    newMaterial.roughness = intensity;
                    newMaterial.roughnessMap.needsUpdate = true;
                    break;
                  case 'metallic':
                    newMaterial.metalnessMap = texture;
                    newMaterial.metalness = intensity;
                    newMaterial.metalnessMap.needsUpdate = true;
                    break;
                  case 'ao':
                    newMaterial.aoMap = texture;
                    newMaterial.aoMapIntensity = intensity;
                    newMaterial.aoMap.needsUpdate = true;
                    break;
                }
                
                // S'assurer que la map du design n'est JAMAIS écrasée
                // Toujours restaurer la map du design après avoir appliqué les material maps
                if (designTexRef && (!newMaterial.map || newMaterial.map !== designTexRef)) {
                  newMaterial.map = designTexRef;
                  newMaterial.map.needsUpdate = true;
                  console.log('🔄 Restored design texture to material after applying', mapType);
                }
                
                newMaterial.needsUpdate = true;
              },
              undefined,
              (error) => {
                console.error(`Error loading texture ${mapType}:`, error);
              }
            );
          });
        }
        
        // Appliquer le nouveau matériau au mesh
        newMaterial.needsUpdate = true;
        if (Array.isArray(object.material)) {
          object.material[index] = newMaterial;
        } else {
          object.material = newMaterial;
        }
        (object as any).castShadow = true;
        (object as any).receiveShadow = true;
        console.log('🎯 Applied material to mesh:', objectName || '(unnamed)', '→', (newMaterial as any).name);
        }); // Fin du forEach materials
      }
    }); // Fin du traverse
  }, [clonedScene, materialMaps, designTexture, modelParts]);

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

