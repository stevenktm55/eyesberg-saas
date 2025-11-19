"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF } from "@react-three/drei";
import * as THREE from "three";

interface Model3DPreviewProps {
  url: string | null;
  className?: string;
  style?: React.CSSProperties;
}

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  
  // Auto-fit le modèle dans la scène
  const box = new THREE.Box3().setFromObject(scene);
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  box.getCenter(center);
  box.getSize(size);
  
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = 1 / maxDim;
  scene.scale.multiplyScalar(scale);
  scene.position.sub(center.multiplyScalar(scale));

  return <primitive object={scene} />;
}

export function Model3DPreview({ url, className, style }: Model3DPreviewProps) {
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
          <Model url={url} />
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

