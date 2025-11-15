"use client";

import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { useSearchParams } from "next/navigation";
import * as THREE from "three";

function Model3DPreview() {
  const searchParams = useSearchParams();
  const modelId = searchParams?.get('modelId');
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [materialMaps, setMaterialMaps] = useState<Record<string, any>>({});
  const refreshKey = searchParams?.get('t') || '0';

  useEffect(() => {
    if (!modelId) return;

    // Charger les données du modèle
    fetch(`/api/models`)
      .then(r => r.json())
      .then(models => {
        const model = models.find((m: any) => m.id === modelId);
        if (model) {
          console.log('🔍 Modèle trouvé:', model);
          console.log('🔍 Material maps:', model.material_maps);
          setModelUrl(model.glbUrl);
          setMaterialMaps(model.material_maps || {});
        }
      })
      .catch(err => console.error('Erreur chargement modèle:', err));
  }, [modelId, refreshKey]);

  if (!modelUrl) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">Chargement du modèle...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gray-900">
      <Canvas camera={{ position: [0, 1, 5], fov: 50 }}>
        {/* Éclairage professionnel type studio photo */}
        {/* Lumière ambiante douce - base uniforme */}
        <ambientLight intensity={0.4} color="#f5f5f5" />
        
        {/* KEY LIGHT - Lumière principale 45° - révèle les détails et textures */}
        <directionalLight 
          position={[12, 18, 12]} 
          intensity={2.0}
          color="#ffffff"
        />
        
        {/* FILL LIGHT - Lumière de remplissage opposée - adoucit les ombres */}
        <directionalLight 
          position={[-8, 12, 8]} 
          intensity={1.0}
          color="#f8f8ff"
        />
        
        {/* BACK/RIM LIGHT - Lumière de contour arrière - détache le sujet */}
        <directionalLight 
          position={[0, 8, -15]} 
          intensity={1.2}
          color="#fafafa"
        />
        
        {/* SIDE LIGHTS - Lumières latérales pour le relief des textures */}
        <directionalLight 
          position={[20, 2, 0]} 
          intensity={0.7}
          color="#ffffff"
        />
        <directionalLight 
          position={[-20, 2, 0]} 
          intensity={0.7}
          color="#ffffff"
        />
        
        {/* TOP LIGHT - Lumière du haut pour les reflets naturels */}
        <directionalLight 
          position={[0, 25, 0]} 
          intensity={0.6}
          color="#ffffff"
        />
        
        {/* ACCENT LIGHTS - Points lumineux pour créer de la profondeur */}
        <pointLight 
          position={[5, 15, 8]} 
          intensity={1.5}
          distance={40}
          decay={1.8}
          color="#ffffff"
        />
        <pointLight 
          position={[-5, 12, 8]} 
          intensity={1.2}
          distance={40}
          decay={1.8}
          color="#f8f9fa"
        />
        
        {/* KICKER LIGHT - Lumière d'accentuation basse pour le relief */}
        <spotLight 
          position={[0, -5, 10]} 
          intensity={0.8}
          angle={Math.PI / 4}
          penumbra={0.5}
          color="#fafafa"
        />
        
        <Suspense fallback={null}>
          <Model3D url={modelUrl} materialMaps={materialMaps} />
        </Suspense>
        
        <OrbitControls 
          enablePan={false}
          minDistance={2}
          maxDistance={10}
        />
      </Canvas>
    </div>
  );
}

function Model3D({ url, materialMaps }: { url: string; materialMaps: Record<string, any> }) {
  const { scene } = useGLTF(url);
  const clonedScene = scene.clone();

  useEffect(() => {
    console.log('🔍 Material maps reçus:', materialMaps);
    console.log('🔍 Nombre de matériaux:', Object.keys(materialMaps).length);
    console.log('🔍 Clés des material maps:', Object.keys(materialMaps));
    
    // Appliquer les material maps
    clonedScene.traverse((child: any) => {
      if (child.isMesh && child.material) {
        const materialName = child.material.name || child.name;
        console.log('🔍 Matériau trouvé:', materialName);
        
        // Retirer le suffixe .001, .002, etc. ET les numéros à la fin pour le matching
        const baseMaterialName = materialName.replace(/\.\d+$/, '').replace(/_\d+$/, '');
        console.log('🔍 Nom de base:', baseMaterialName);
        
        // Chercher une correspondance flexible dans les material maps
        const config = Object.keys(materialMaps).find(key => {
          const configBaseName = key.replace(/\.\d+$/, '').replace(/_\d+$/, '');
          return configBaseName === baseMaterialName;
        }) ? materialMaps[Object.keys(materialMaps).find(key => {
          const configBaseName = key.replace(/\.\d+$/, '').replace(/_\d+$/, '');
          return configBaseName === baseMaterialName;
        })!] : null;

        if (config) {
          console.log('🎨 Application config pour:', baseMaterialName, config);

          // Appliquer les texture maps
          if (config.normalMap) {
            const texture = new THREE.TextureLoader().load(config.normalMap);
            child.material.normalMap = texture;
            child.material.normalScale.set(
              config.normalIntensity || 3.0,
              config.normalIntensity || 3.0
            );
          }

          if (config.roughnessMap) {
            const texture = new THREE.TextureLoader().load(config.roughnessMap);
            child.material.roughnessMap = texture;
            child.material.roughness = config.roughnessValue || 1.0;
          }

          if (config.metalnessMap) {
            const texture = new THREE.TextureLoader().load(config.metalnessMap);
            child.material.metalnessMap = texture;
            child.material.metalness = config.metalnessValue || 1.0;
          }

          if (config.aoMap) {
            const texture = new THREE.TextureLoader().load(config.aoMap);
            child.material.aoMap = texture;
            child.material.aoMapIntensity = config.aoIntensity || 3.0;
          }

          if (config.opacityMap) {
            const texture = new THREE.TextureLoader().load(config.opacityMap);
            child.material.alphaMap = texture;
            child.material.transparent = true;
          }

          // Appliquer le repeat (tiling)
          if (config.repeatX || config.repeatY) {
            const repeatX = config.repeatX || 1;
            const repeatY = config.repeatY || 1;

            [child.material.normalMap, child.material.roughnessMap, child.material.metalnessMap, child.material.aoMap, child.material.alphaMap].forEach((map) => {
              if (map) {
                map.repeat.set(repeatX, repeatY);
                map.wrapS = map.wrapT = THREE.RepeatWrapping;
              }
            });
          }

          child.material.needsUpdate = true;
        }
      }
    });
  }, [clonedScene, materialMaps]);

  return <primitive object={clonedScene} />;
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<div className="w-full h-screen flex items-center justify-center bg-gray-900 text-white">Chargement...</div>}>
      <Model3DPreview />
    </Suspense>
  );
}

