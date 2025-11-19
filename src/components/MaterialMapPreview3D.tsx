"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";

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
  const [textures, setTextures] = useState<{
    diffuse?: THREE.Texture;
    normal?: THREE.Texture;
    roughness?: THREE.Texture;
    metallic?: THREE.Texture;
    ao?: THREE.Texture;
  }>({});

  // Charger les textures de manière asynchrone
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    const loadedTextures: typeof textures = {};

    const loadTexture = (url: string, key: keyof typeof textures, scale: number) => {
      loader.load(
        url,
        (texture) => {
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          texture.repeat.set(scale, scale);
          if (key === 'diffuse') {
            texture.colorSpace = THREE.SRGBColorSpace;
          }
          loadedTextures[key] = texture;
          setTextures({ ...loadedTextures });
        },
        undefined,
        (error) => {
          console.error(`Error loading ${key} texture:`, error);
        }
      );
    };

    if (diffuseUrl) loadTexture(diffuseUrl, 'diffuse', diffuseScale);
    if (normalUrl) loadTexture(normalUrl, 'normal', normalScale);
    if (roughnessUrl) loadTexture(roughnessUrl, 'roughness', roughnessScale);
    if (metallicUrl) loadTexture(metallicUrl, 'metallic', metallicScale);
    if (aoUrl) loadTexture(aoUrl, 'ao', aoScale);

    return () => {
      // Nettoyer les textures
      Object.values(loadedTextures).forEach(texture => texture?.dispose());
    };
  }, [diffuseUrl, normalUrl, roughnessUrl, metallicUrl, aoUrl, diffuseScale, normalScale, roughnessScale, metallicScale, aoScale]);

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: textures.diffuse ? '#ffffff' : '#888888',
    });

    // Diffuse map
    if (textures.diffuse) {
      mat.map = textures.diffuse;
    }

    // Normal map
    if (textures.normal) {
      mat.normalMap = textures.normal;
      mat.normalScale = new THREE.Vector2(normalIntensity / 100, normalIntensity / 100);
    }

    // Roughness map
    if (textures.roughness) {
      mat.roughnessMap = textures.roughness;
      mat.roughness = roughnessIntensity / 100;
    } else {
      mat.roughness = 0.5;
    }

    // Metallic map
    if (textures.metallic) {
      mat.metalnessMap = textures.metallic;
      mat.metalness = metallicIntensity / 100;
    } else {
      mat.metalness = 0.0;
    }

    // AO map
    if (textures.ao) {
      mat.aoMap = textures.ao;
      mat.aoMapIntensity = aoIntensity / 100;
    }

    return mat;
  }, [
    textures,
    normalIntensity,
    roughnessIntensity,
    metallicIntensity,
    aoIntensity
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
