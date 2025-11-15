import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";

interface DecalPlaneProps {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  designUrl: string;
  editable?: boolean;
}

export function DecalPlane({ position, rotation, scale, designUrl, editable = false }: DecalPlaneProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isDragging, setIsDragging] = useState(false);

  useFrame(() => {
    if (meshRef.current && editable) {
      // Animation subtile pour indiquer que l'élément est éditable
      meshRef.current.rotation.z = Math.sin(Date.now() * 0.001) * 0.05;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      scale={[scale, scale, scale]}
      onPointerOver={() => {
        if (editable) {
          document.body.style.cursor = 'grab';
        }
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
      }}
      onPointerDown={() => {
        if (editable) {
          setIsDragging(true);
          document.body.style.cursor = 'grabbing';
        }
      }}
      onPointerUp={() => {
        setIsDragging(false);
        document.body.style.cursor = 'default';
      }}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial 
        color="#ff6b6b"
        transparent 
        opacity={0.8}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}