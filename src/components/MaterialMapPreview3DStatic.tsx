"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";

interface MaterialMapPreview3DStaticProps {
  diffuseUrl?: string | null;
  normalUrl?: string | null;
  roughnessUrl?: string | null;
  metallicUrl?: string | null;
  aoUrl?: string | null;
  className?: string;
  style?: React.CSSProperties;
}

function Sphere({ 
  diffuseUrl, 
  normalUrl, 
  roughnessUrl, 
  metallicUrl, 
  aoUrl,
}: Omit<MaterialMapPreview3DStaticProps, 'className' | 'style'>) {
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

    const loadTexture = (url: string, key: keyof typeof textures) => {
      loader.load(
        url,
        (texture) => {
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
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

    if (diffuseUrl) loadTexture(diffuseUrl, 'diffuse');
    if (normalUrl) loadTexture(normalUrl, 'normal');
    if (roughnessUrl) loadTexture(roughnessUrl, 'roughness');
    if (metallicUrl) loadTexture(metallicUrl, 'metallic');
    if (aoUrl) loadTexture(aoUrl, 'ao');

    return () => {
      // Nettoyer les textures
      Object.values(loadedTextures).forEach(texture => texture?.dispose());
    };
  }, [diffuseUrl, normalUrl, roughnessUrl, metallicUrl, aoUrl]);

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: textures.diffuse ? '#ffffff' : '#888888',
    });

    if (textures.diffuse) {
      mat.map = textures.diffuse;
    }

    if (textures.normal) {
      mat.normalMap = textures.normal;
      mat.normalScale = new THREE.Vector2(1, 1);
    }

    if (textures.roughness) {
      mat.roughnessMap = textures.roughness;
      mat.roughness = 0.5;
    } else {
      mat.roughness = 0.5;
    }

    if (textures.metallic) {
      mat.metalnessMap = textures.metallic;
      mat.metalness = 0.0;
    } else {
      mat.metalness = 0.0;
    }

    if (textures.ao) {
      mat.aoMap = textures.ao;
      mat.aoMapIntensity = 1.0;
    }

    return mat;
  }, [textures]);

  return (
    <mesh material={material}>
      <sphereGeometry args={[1, 32, 32]} />
    </mesh>
  );
}

export function MaterialMapPreview3DStatic({
  diffuseUrl,
  normalUrl,
  roughnessUrl,
  metallicUrl,
  aoUrl,
  className,
  style,
}: MaterialMapPreview3DStaticProps) {
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
        camera={{ position: [0, 0, 2.5], fov: 50 }}
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
          />
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  );
}

