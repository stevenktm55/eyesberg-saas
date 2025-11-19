"use client";

import { Suspense, useEffect, useMemo } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";
import { TextureLoader } from "three";

interface MaterialMapPreview3DProps {
  diffuseUrl?: string | null;
  normalUrl?: string | null;
  roughnessUrl?: string | null;
  metallicUrl?: string | null;
  aoUrl?: string | null;
  diffuseIntensity?: number;
  normalIntensity?: number;
  roughnessIntensity?: number;
  metallicIntensity?: number;
  aoIntensity?: number;
  diffuseScale?: number;
  normalScale?: number;
  roughnessScale?: number;
  metallicScale?: number;
  aoScale?: number;
  className?: string;
  style?: React.CSSProperties;
}

function Sphere({ 
  diffuseUrl, 
  normalUrl, 
  roughnessUrl, 
  metallicUrl, 
  aoUrl,
  diffuseIntensity = 100,
  normalIntensity = 100,
  roughnessIntensity = 100,
  metallicIntensity = 100,
  aoIntensity = 100,
  diffuseScale = 1.0,
  normalScale = 1.0,
  roughnessScale = 1.0,
  metallicScale = 1.0,
  aoScale = 1.0,
}: Omit<MaterialMapPreview3DProps, 'className' | 'style'>) {
  const meshRef = useFrame(() => {});
  
  // Charger les textures individuellement avec TextureLoader
  const diffuseMap = diffuseUrl ? useLoader(TextureLoader, diffuseUrl) : null;
  const normalMap = normalUrl ? useLoader(TextureLoader, normalUrl) : null;
  const roughnessMap = roughnessUrl ? useLoader(TextureLoader, roughnessUrl) : null;
  const metallicMap = metallicUrl ? useLoader(TextureLoader, metallicUrl) : null;
  const aoMap = aoUrl ? useLoader(TextureLoader, aoUrl) : null;
  
  // Configurer les textures
  useEffect(() => {
    if (diffuseMap) {
      diffuseMap.wrapS = THREE.RepeatWrapping;
      diffuseMap.wrapT = THREE.RepeatWrapping;
      diffuseMap.repeat.set(diffuseScale, diffuseScale);
      diffuseMap.colorSpace = THREE.SRGBColorSpace;
    }
    
    if (normalMap) {
      normalMap.wrapS = THREE.RepeatWrapping;
      normalMap.wrapT = THREE.RepeatWrapping;
      normalMap.repeat.set(normalScale, normalScale);
    }
    
    if (roughnessMap) {
      roughnessMap.wrapS = THREE.RepeatWrapping;
      roughnessMap.wrapT = THREE.RepeatWrapping;
      roughnessMap.repeat.set(roughnessScale, roughnessScale);
    }
    
    if (metallicMap) {
      metallicMap.wrapS = THREE.RepeatWrapping;
      metallicMap.wrapT = THREE.RepeatWrapping;
      metallicMap.repeat.set(metallicScale, metallicScale);
    }
    
    if (aoMap) {
      aoMap.wrapS = THREE.RepeatWrapping;
      aoMap.wrapT = THREE.RepeatWrapping;
      aoMap.repeat.set(aoScale, aoScale);
    }
  }, [diffuseMap, normalMap, roughnessMap, metallicMap, aoMap, diffuseScale, normalScale, roughnessScale, metallicScale, aoScale]);

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: diffuseMap ? '#ffffff' : '#888888',
    });

    // Diffuse map
    if (diffuseMap) {
      mat.map = diffuseMap;
    }

    // Normal map
    if (normalMap) {
      mat.normalMap = normalMap;
      mat.normalScale = new THREE.Vector2(normalIntensity / 100, normalIntensity / 100);
    }

    // Roughness map
    if (roughnessMap) {
      mat.roughnessMap = roughnessMap;
      mat.roughness = roughnessIntensity / 100;
    } else {
      mat.roughness = 0.5;
    }

    // Metallic map
    if (metallicMap) {
      mat.metalnessMap = metallicMap;
      mat.metalness = metallicIntensity / 100;
    } else {
      mat.metalness = 0.0;
    }

    // AO map
    if (aoMap) {
      mat.aoMap = aoMap;
      mat.aoMapIntensity = aoIntensity / 100;
    }

    return mat;
  }, [
    diffuseMap, normalMap, roughnessMap, metallicMap, aoMap,
    normalIntensity, roughnessIntensity, metallicIntensity, aoIntensity
  ]);

  return (
    <mesh ref={meshRef} material={material}>
      <sphereGeometry args={[1, 64, 64]} />
    </mesh>
  );
}

export function MaterialMapPreview3D({
  diffuseUrl,
  normalUrl,
  roughnessUrl,
  metallicUrl,
  aoUrl,
  diffuseIntensity = 100,
  normalIntensity = 100,
  roughnessIntensity = 100,
  metallicIntensity = 100,
  aoIntensity = 100,
  diffuseScale = 1.0,
  normalScale = 1.0,
  roughnessScale = 1.0,
  metallicScale = 1.0,
  aoScale = 1.0,
  className,
  style,
}: MaterialMapPreview3DProps) {
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
        camera={{ position: [0, 0, 3], fov: 50 }}
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
          <Sphere
            diffuseUrl={diffuseUrl}
            normalUrl={normalUrl}
            roughnessUrl={roughnessUrl}
            metallicUrl={metallicUrl}
            aoUrl={aoUrl}
            diffuseIntensity={diffuseIntensity}
            normalIntensity={normalIntensity}
            roughnessIntensity={roughnessIntensity}
            metallicIntensity={metallicIntensity}
            aoIntensity={aoIntensity}
            diffuseScale={diffuseScale}
            normalScale={normalScale}
            roughnessScale={roughnessScale}
            metallicScale={metallicScale}
            aoScale={aoScale}
          />
          <OrbitControls 
            enableZoom={true}
            enablePan={false}
            minDistance={2}
            maxDistance={5}
            autoRotate={false}
          />
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  );
}

