"use client";

import { Suspense, useState, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";

function ModelAnalyzer() {
  const gltf = useGLTF('/uploads/models/bb01b7a2-e657-41f0-87bb-a4af35bb9bff.glb') as any;
  const [analysis, setAnalysis] = useState<any>(null);

  useEffect(() => {
    let mesh: THREE.Mesh | null = null;
    gltf.scene.traverse((obj: THREE.Object3D) => {
      if (obj instanceof THREE.Mesh && !mesh) {
        mesh = obj;
      }
    });

    if (mesh) {
      const geometry = (mesh as THREE.Mesh).geometry;
      const uvAttribute = geometry.attributes.uv;
      
      if (uvAttribute) {
        // Analyser toutes les UV pour trouver min/max
        let minU = Infinity, maxU = -Infinity;
        let minV = Infinity, maxV = -Infinity;
        
        for (let i = 0; i < uvAttribute.count; i++) {
          const u = uvAttribute.getX(i);
          const v = uvAttribute.getY(i);
          
          minU = Math.min(minU, u);
          maxU = Math.max(maxU, u);
          minV = Math.min(minV, v);
          maxV = Math.max(maxV, v);
        }
        
        setAnalysis({
          uvCount: uvAttribute.count,
          uvRange: {
            u: { min: minU, max: maxU, range: maxU - minU },
            v: { min: minV, max: maxV, range: maxV - minV }
          },
          meshName: (mesh as THREE.Mesh).name || 'unnamed',
          vertexCount: geometry.attributes.position.count,
        });

        console.log('📊 Analyse du modèle GLB:');
        console.log('UV Range U:', minU.toFixed(3), 'à', maxU.toFixed(3));
        console.log('UV Range V:', minV.toFixed(3), 'à', maxV.toFixed(3));
      }
    }
  }, [gltf]);

  return (
    <>
      <primitive object={gltf.scene} />
      {analysis && (
        <group position={[0, 3, 0]}>
          {/* Afficher les infos dans le 3D */}
        </group>
      )}
    </>
  );
}

export default function AnalyzeModelPage() {
  const [analysis, setAnalysis] = useState<any>(null);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔬 Analyse du modèle GLB</h1>
        
        <div className="grid grid-cols-2 gap-6">
          {/* Viewer 3D */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Modèle 3D</h2>
            <div className="bg-gray-100 rounded" style={{ height: '500px' }}>
              <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
                <ambientLight intensity={0.6} />
                <directionalLight position={[10, 10, 5]} intensity={1.2} />
                
                <Suspense fallback={null}>
                  <ModelAnalyzer />
                </Suspense>
                
                <OrbitControls />
                <gridHelper args={[10, 10]} />
              </Canvas>
            </div>
          </div>

          {/* Analyse */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Analyse UV</h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded">
                <h3 className="font-semibold mb-2">📊 Plages UV du modèle :</h3>
                <div className="text-sm font-mono space-y-1">
                  <div>Ouvrez la console (F12) pour voir l'analyse complète</div>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 rounded border border-yellow-200">
                <h3 className="font-semibold text-yellow-900 mb-2">🔍 Ce que nous cherchons :</h3>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• <strong>UV normales</strong> : U et V entre 0 et 1</li>
                  <li>• <strong>UV avec offset</strong> : Valeurs négatives ou &gt; 1</li>
                  <li>• <strong>UV répétées</strong> : Plage &gt; 1 (tiling)</li>
                </ul>
              </div>

              <div className="p-4 bg-green-50 rounded border border-green-200">
                <h3 className="font-semibold text-green-900 mb-2">💡 Solution selon l'analyse :</h3>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Si V est entre <strong>-1 et 0</strong> → Ajouter +1 à V</li>
                  <li>• Si V est entre <strong>0 et 1</strong> → Inverser (1 - V)</li>
                  <li>• Si plage personnalisée → Normaliser avec min/max</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">📋 Instructions</h2>
          <ol className="text-sm space-y-2">
            <li>1. Ouvrez la console (F12)</li>
            <li>2. Regardez les valeurs affichées : "UV Range U:" et "UV Range V:"</li>
            <li>3. Envoyez-moi ces valeurs exactes</li>
            <li>4. Je vais calculer la transformation nécessaire pour corriger les UV</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

