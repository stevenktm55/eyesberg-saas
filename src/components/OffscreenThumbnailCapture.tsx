"use client";

import { useRef, useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface OffscreenThumbnailCaptureProps {
  modelUrl: string;
  designSvgUrl: string;
  colors: Record<string, string>;
  textureMaps?: Record<string, string>;
  materialMaps?: Record<string, any>;
  onCapture: (canvas: HTMLCanvasElement) => void;
  onError: (error: string) => void;
}

function ThumbnailScene({ modelUrl, designSvgUrl, colors, textureMaps, materialMaps, onCapture }: Omit<OffscreenThumbnailCaptureProps, 'onError'>) {
  const groupRef = useRef<THREE.Group>(null);
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [designTexture, setDesignTexture] = useState<THREE.Texture | null>(null);
  const [loading, setLoading] = useState(true);
  const { camera } = useThree();

  useEffect(() => {
    let mounted = true;

    async function loadAssets() {
      try {
        // Charger le modèle 3D
        const loader = new GLTFLoader();
        const gltf = await loader.loadAsync(modelUrl);
        
        if (!mounted) return;
        
        const modelGroup = gltf.scene;
        
        // Ajuster la caméra pour bien cadrer le modèle
        const box = new THREE.Box3().setFromObject(modelGroup);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);
        
        // Calculer la distance nécessaire pour voir tout le modèle
        const maxDim = Math.max(size.x, size.y, size.z);
        const distance = maxDim * 1.5; // Facteur de zoom encore plus proche
        
        // Positionner la caméra
        camera.position.set(0, center.y + size.y * 0.3, distance);
        camera.lookAt(center);
        camera.updateProjectionMatrix();
        
        setModel(modelGroup);

        // Charger et traiter le design SVG
        const svgResponse = await fetch(designSvgUrl);
        const svgText = await svgResponse.text();
        
        // Appliquer les couleurs au SVG
        let processedSvg = svgText;
        Object.entries(colors).forEach(([colorName, colorValue]) => {
          // Remplacer les classes CSS par les couleurs directes
          processedSvg = processedSvg.replace(
            new RegExp(`class="${colorName}"`, 'g'),
            `fill="${colorValue}` + '"'
          );
        });

        // Forcer les classes CSS via un style en fin de SVG
        const overrideCss = Object.entries(colors)
          .map(([name, value]) => `.${name}{fill:${value} !important; stroke:${value} !important;}`)
          .join('');
        if (overrideCss.length > 0 && processedSvg.includes('</svg>')) {
          processedSvg = processedSvg.replace('</svg>', `<style>${overrideCss}</style></svg>`);
        }
        
        // Créer une texture à partir du SVG
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // Créer une image à partir du SVG
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            const texture = new THREE.CanvasTexture(canvas);
            texture.flipY = false;
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.generateMipmaps = true;
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.wrapS = THREE.ClampToEdgeWrapping;
            texture.wrapT = THREE.ClampToEdgeWrapping;
            texture.needsUpdate = true;
            
            if (mounted) {
              setDesignTexture(texture);
              setLoading(false);
            }
            // Libérer l'URL blob
            URL.revokeObjectURL(svgUrl);
          };
          
          const svgBlob = new Blob([processedSvg], { type: 'image/svg+xml' });
          const svgUrl = URL.createObjectURL(svgBlob);
          img.src = svgUrl;
        }

      } catch (error) {
        console.error('Erreur lors du chargement des assets:', error);
        setLoading(false);
      }
    }

    loadAssets();

    return () => {
      mounted = false;
    };
  }, [modelUrl, designSvgUrl, colors]);

  useEffect(() => {
    if (!loading && model && designTexture && groupRef.current) {
      // Appliquer la texture et les material maps au modèle
      model.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const materialName = child.material.name || child.name;
          
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => {
              if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial || mat instanceof THREE.MeshPhongMaterial) {
                // Appliquer le design sur tous les matériaux standards pour la miniature
                mat.map = designTexture;
                mat.color.set('#ffffff');
                if (mat.metalness === undefined || mat.metalness > 0.5) mat.metalness = 0.0;
                if (mat.roughness === undefined) mat.roughness = 1.0;
                // Désactiver l'environnement pour éviter les reflets sombres
                (mat as any).envMap = null;
                mat.side = THREE.DoubleSide;
                // Légère émissive pour éviter le noir si éclairage insuffisant
                (mat as any).emissive = new THREE.Color('#111111');
                (mat as any).emissiveIntensity = 0.15;
                
                // Appliquer les texture maps si disponibles
                if (textureMaps) {
                  Object.entries(textureMaps).forEach(([mapType, url]) => {
                    if (url) {
                      const loader = new THREE.TextureLoader();
                      loader.load(url, (texture) => {
                        texture.colorSpace = THREE.SRGBColorSpace;
                        texture.generateMipmaps = true;
                        texture.minFilter = THREE.LinearMipmapLinearFilter;
                        texture.magFilter = THREE.LinearFilter;
                        texture.wrapS = THREE.RepeatWrapping;
                        texture.wrapT = THREE.RepeatWrapping;
                        
                        switch (mapType) {
                          case 'normalMap':
                            mat.normalMap = texture;
                            mat.normalScale = new THREE.Vector2(1, 1);
                            break;
                          case 'roughnessMap':
                            mat.roughnessMap = texture;
                            break;
                          case 'metalnessMap':
                            mat.metalnessMap = texture;
                            break;
                          case 'aoMap':
                            mat.aoMap = texture;
                            break;
                        }
                        if (mat.normalMap) { mat.normalMap.wrapS = THREE.RepeatWrapping; mat.normalMap.wrapT = THREE.RepeatWrapping; mat.normalMap.needsUpdate = true; }
                        if (mat.roughnessMap) { mat.roughnessMap.wrapS = THREE.RepeatWrapping; mat.roughnessMap.wrapT = THREE.RepeatWrapping; mat.roughnessMap.needsUpdate = true; }
                        if (mat.metalnessMap) { mat.metalnessMap.wrapS = THREE.RepeatWrapping; mat.metalnessMap.wrapT = THREE.RepeatWrapping; mat.metalnessMap.needsUpdate = true; }
                        if (mat.aoMap) { mat.aoMap.wrapS = THREE.RepeatWrapping; mat.aoMap.wrapT = THREE.RepeatWrapping; mat.aoMap.needsUpdate = true; }
                        mat.needsUpdate = true;
                      });
                    }
                  });
                }
                
                // Appliquer les material maps si disponibles
                if (materialMaps) {
                  const baseMaterialName = materialName.replace(/\.\d+$/, '').replace(/_\d+$/, '');
                  const config = Object.keys(materialMaps).find(key => {
                    const configBaseName = key.replace(/\.\d+$/, '').replace(/_\d+$/, '');
                    return configBaseName === baseMaterialName;
                  }) ? materialMaps[Object.keys(materialMaps).find(key => {
                    const configBaseName = key.replace(/\.\d+$/, '').replace(/_\d+$/, '');
                    return configBaseName === baseMaterialName;
                  })!] : null;
                  
                  if (config) {
                    // Appliquer les repeatX/repeatY
                    if (config.repeatX && config.repeatY) {
                      if (mat.normalMap) mat.normalMap.repeat.set(config.repeatX, config.repeatY);
                      if (mat.roughnessMap) mat.roughnessMap.repeat.set(config.repeatX, config.repeatY);
                      if (mat.metalnessMap) mat.metalnessMap.repeat.set(config.repeatX, config.repeatY);
                      if (mat.aoMap) mat.aoMap.repeat.set(config.repeatX, config.repeatY);
                    }
                    
                    // Appliquer les autres propriétés
                    if (config.normalIntensity !== undefined) {
                      mat.normalScale.setScalar(config.normalIntensity);
                    }
                    if (config.metalnessValue !== undefined) {
                      mat.metalness = config.metalnessValue;
                    }
                    if (config.roughnessValue !== undefined) {
                      mat.roughness = config.roughnessValue;
                    }
                    if (config.aoIntensity !== undefined) {
                      mat.aoMapIntensity = config.aoIntensity;
                    }
                  }
                }
                
                mat.needsUpdate = true;
              }
            });
          } else if (
            child.material instanceof THREE.MeshStandardMaterial ||
            child.material instanceof THREE.MeshPhysicalMaterial ||
            child.material instanceof THREE.MeshPhongMaterial
          ) {
            const mat = child.material as THREE.MeshStandardMaterial;
            mat.map = designTexture;
            mat.color.set('#ffffff');
            if (mat.metalness === undefined || mat.metalness > 0.5) mat.metalness = 0.0;
            if (mat.roughness === undefined) mat.roughness = 1.0;
            (mat as any).envMap = null;
            (mat as any).side = THREE.DoubleSide;
            (mat as any).emissive = new THREE.Color('#111111');
            (mat as any).emissiveIntensity = 0.15;
            if (mat.map) {
              // Design texture should NOT repeat
              mat.map.wrapS = THREE.ClampToEdgeWrapping;
              mat.map.wrapT = THREE.ClampToEdgeWrapping;
              mat.map.repeat.set(1, 1);
              mat.map.offset.set(0, 0);
              mat.map.needsUpdate = true;
            }
            
            // Appliquer les texture maps si disponibles (même logique que ci-dessus)
            if (textureMaps) {
              Object.entries(textureMaps).forEach(([mapType, url]) => {
                if (url) {
                  const loader = new THREE.TextureLoader();
                  loader.load(url, (texture) => {
                    texture.colorSpace = THREE.SRGBColorSpace;
                    texture.generateMipmaps = true;
                    texture.minFilter = THREE.LinearMipmapLinearFilter;
                    texture.magFilter = THREE.LinearFilter;
                    
                    switch (mapType) {
                      case 'normalMap':
                        child.material.normalMap = texture;
                        child.material.normalScale = new THREE.Vector2(1, 1);
                        break;
                      case 'roughnessMap':
                        child.material.roughnessMap = texture;
                        break;
                      case 'metalnessMap':
                        child.material.metalnessMap = texture;
                        break;
                      case 'aoMap':
                        child.material.aoMap = texture;
                        break;
                    }
                    child.material.needsUpdate = true;
                  });
                }
              });
            }
            
            // Appliquer les material maps si disponibles (même logique que ci-dessus)
            if (materialMaps) {
              const baseMaterialName = materialName.replace(/\.\d+$/, '').replace(/_\d+$/, '');
              const config = Object.keys(materialMaps).find(key => {
                const configBaseName = key.replace(/\.\d+$/, '').replace(/_\d+$/, '');
                return configBaseName === baseMaterialName;
              }) ? materialMaps[Object.keys(materialMaps).find(key => {
                const configBaseName = key.replace(/\.\d+$/, '').replace(/_\d+$/, '');
                return configBaseName === baseMaterialName;
              })!] : null;
              
              if (config) {
                // Appliquer les repeatX/repeatY
                if (config.repeatX && config.repeatY) {
                  if (child.material.normalMap) child.material.normalMap.repeat.set(config.repeatX, config.repeatY);
                  if (child.material.roughnessMap) child.material.roughnessMap.repeat.set(config.repeatX, config.repeatY);
                  if (child.material.metalnessMap) child.material.metalnessMap.repeat.set(config.repeatX, config.repeatY);
                  if (child.material.aoMap) child.material.aoMap.repeat.set(config.repeatX, config.repeatY);
                }
                
                // Appliquer les autres propriétés
                if (config.normalIntensity !== undefined) {
                  child.material.normalScale.setScalar(config.normalIntensity);
                }
                if (config.metalnessValue !== undefined) {
                  child.material.metalness = config.metalnessValue;
                }
                if (config.roughnessValue !== undefined) {
                  child.material.roughness = config.roughnessValue;
                }
                if (config.aoIntensity !== undefined) {
                  child.material.aoMapIntensity = config.aoIntensity;
                }
              }
            }
            
            child.material.needsUpdate = true;
          }
        }
      });

      // Capturer après un délai pour s'assurer que tout est rendu
      setTimeout(() => {
        const canvas = document.querySelector('#thumb-canvas') as HTMLCanvasElement;
        if (canvas) {
          onCapture(canvas);
        }
      }, 3500);
    }
  }, [loading, model, designTexture, textureMaps, materialMaps, onCapture]);

  if (loading) {
    return null;
  }

  return (
    <group ref={groupRef}>
      {model && <primitive object={model} />}
    </group>
  );
}

function CaptureCanvas({ onReady }: { onReady: (c: HTMLCanvasElement) => void }) {
  const { gl } = useThree();
  useEffect(() => {
    const el = gl.domElement as HTMLCanvasElement;
    if (el) {
      el.setAttribute('id', 'thumb-canvas');
      onReady(el);
    }
  }, [gl, onReady]);
  return null;
}

export default function OffscreenThumbnailCapture({ 
  modelUrl, 
  designSvgUrl, 
  colors, 
  textureMaps,
  materialMaps,
  onCapture, 
  onError 
}: OffscreenThumbnailCaptureProps) {
  return (
    <div style={{ position: 'absolute', left: '-9999px', width: '512px', height: '512px' }}>
      <Canvas
        camera={{ 
          position: [0, 1, 5], // Position initiale, sera ajustée automatiquement
          fov: 50 
        }}
        gl={{
          preserveDrawingBuffer: true,
          antialias: true,
          powerPreference: 'high-performance',
          outputColorSpace: THREE.SRGBColorSpace,
          toneMapping: THREE.ACESFilmicToneMapping,
        }}
        dpr={[1, 2]}
        onCreated={(state) => {
          state.gl.toneMappingExposure = 1.0;
        }}
        style={{ 
          width: '512px', 
          height: '512px',
          background: 'linear-gradient(to bottom, #f8fafc, #e2e8f0)'
        }}
      >
        <CaptureCanvas onReady={() => { /* noop; id set for query */ }} />
        {/* Éclairage copié du configurateur */}
        <ambientLight intensity={0.4} color="#f5f5f5" />
        <directionalLight position={[12, 18, 12]} intensity={2.0} color="#ffffff" castShadow={false} />
        <directionalLight position={[-8, 12, 8]} intensity={1.0} color="#f8f8ff" />
        <directionalLight position={[0, 8, -15]} intensity={1.2} color="#fafafa" />
        <directionalLight position={[20, 2, 0]} intensity={0.7} color="#ffffff" />
        <directionalLight position={[-20, 2, 0]} intensity={0.7} color="#ffffff" />
        <directionalLight position={[0, 25, 0]} intensity={0.6} color="#ffffff" />
        <pointLight position={[5, 15, 8]} intensity={1.5} distance={40} decay={1.8} color="#ffffff" />
        <pointLight position={[-5, 12, 8]} intensity={1.2} distance={40} decay={1.8} color="#f8f9fa" />
        <spotLight position={[0, -5, 10]} intensity={0.8} angle={Math.PI / 4} penumbra={0.5} color="#fafafa" />
        
        <ThumbnailScene 
          modelUrl={modelUrl}
          designSvgUrl={designSvgUrl}
          colors={colors}
          textureMaps={textureMaps}
          materialMaps={materialMaps}
          onCapture={onCapture}
        />
      </Canvas>
    </div>
  );
}
