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

  // Pre-compute visibility and color configuration maps
  const { visibilityByMeshName, colorByMeshName } = useMemo(() => {
    const visibilityMap: Record<string, boolean> = {};
    const colorMap: Record<string, string> = {};

    // Map layers → mesh visibility
    for (const layer of layers) {
      if (layer.meshName) {
        visibilityMap[layer.meshName] = layer.visible;
      }
    }

    // Map questions → target mesh color
    // We rely on SettingsPanel where a question can target a layer via layerId,
    // and QuestionOptionsEditor where each option can have a color.
    for (const question of questions) {
      // Only color-type questions with a target layer and configured colors
      if (
        question.displayType === "color" &&
        question.layerId &&
        question.optionColors &&
        Object.keys(question.optionColors).length > 0
      ) {
        const targetLayer = layers.find((l) => l.id === question.layerId);
        if (!targetLayer || !targetLayer.meshName) continue;

        // Determine which option is currently "selected":
        // - Prefer explicit value (when we later add a way to preview values)
        // - Fallback to the first option defined
        const options = question.options || [];
        let selectedOptionKey: string | undefined;

        if (typeof question.value === "string" && question.value) {
          selectedOptionKey = question.value;
        } else if (options.length > 0) {
          selectedOptionKey = options[0];
        }

        if (selectedOptionKey && question.optionColors[selectedOptionKey]) {
          colorMap[targetLayer.meshName] = question.optionColors[selectedOptionKey];
        }
      }
    }

    return {
      visibilityByMeshName: visibilityMap,
      colorByMeshName: colorMap,
    };
  }, [layers, questions]);

  // Apply layer visibility
  useMemo(() => {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const meshName = child.name;
        if (meshName in visibilityByMeshName) {
          child.visible = visibilityByMeshName[meshName];
        }
      }
    });
  }, [clonedScene, visibilityByMeshName]);

  // Apply colors from questions to target meshes
  useMemo(() => {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const meshName = child.name;
        const hexColor = colorByMeshName[meshName];
        if (!hexColor) return;

        const material = child.material as THREE.MeshStandardMaterial;
        if (material.isMeshStandardMaterial) {
          // Ensure we don't mutate a shared material instance across meshes
          const anyMaterial = material as any;
          if (anyMaterial._stretchmxCloned !== true) {
            const clonedMaterial = material.clone();
            (clonedMaterial as any)._stretchmxCloned = true;
            child.material = clonedMaterial;
          }

          (child.material as THREE.MeshStandardMaterial).color = new THREE.Color(hexColor);
        }
      }
    });
  }, [clonedScene, colorByMeshName]);

  return <primitive object={clonedScene} />;
}

