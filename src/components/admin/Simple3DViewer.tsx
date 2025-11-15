"use client";

import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { ProductQuestion, ProductLayer } from "./ProductEditor3D";

interface Simple3DViewerProps {
  url: string;
  questions: ProductQuestion[];
  layers: ProductLayer[];
}

export function Simple3DViewer({ url, questions, layers }: Simple3DViewerProps) {
  const { scene } = useGLTF(url);

  // Clone the scene to avoid mutations
  const clonedScene = useMemo(() => {
    const cloned = scene.clone();
    return cloned;
  }, [scene]);

  // Apply layer visibility
  useMemo(() => {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const layer = layers.find((l) => l.meshName === child.name);
        if (layer) {
          child.visible = layer.visible;
        }
      }
    });
  }, [clonedScene, layers]);

  // Apply colors from questions
  useMemo(() => {
    const colorQuestions = questions.filter((q) => q.type === "color" || q.type === "group");
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const material = child.material as THREE.MeshStandardMaterial;
        if (material.isMeshStandardMaterial) {
          // Apply colors based on questions
          // TODO: Map questions to specific meshes
        }
      }
    });
  }, [clonedScene, questions]);

  return <primitive object={clonedScene} />;
}

