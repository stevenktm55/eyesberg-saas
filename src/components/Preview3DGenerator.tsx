'use client';

import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ModelViewer } from './ModelViewer';
import { LightRig } from './LightRig';
import { supabase } from '@/lib/supabase';
import * as THREE from 'three';

interface Preview3DGeneratorProps {
  configData: any;
  configId: string;
  onPreviewsGenerated?: (urls: string[]) => void;
}

export function Preview3DGenerator({ configData, configId, onPreviewsGenerated }: Preview3DGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentAngle, setCurrentAngle] = useState<string>('');
  const [generatedPreviews, setGeneratedPreviews] = useState<string[]>([]);
  const controlsRef = useRef<any>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Debug: afficher ce qu'on reçoit
  useEffect(() => {
    console.log('🔍 Preview3DGenerator - configData:', configData);
    console.log('🔍 - modelUrl:', configData.modelUrl);
    console.log('🔍 - design:', configData.design);
    console.log('🔍 - colors:', configData.colors);
    console.log('🔍 - texts:', configData.texts);
    console.log('🔍 - logos:', configData.logos);
    console.log('🔍 - fonts:', configData.fonts);
  }, [configData]);

  const angles = [
    { label: 'Face', angleY: 0 },       // Vue devant le modèle
    { label: 'Dos', angleY: Math.PI },  // Vue derrière le modèle
    { label: 'Gauche', angleY: Math.PI / 2 },
    { label: 'Droite', angleY: -Math.PI / 2 },
  ];

  const captureView = async (angleY: number, label: string): Promise<Blob | null> => {
    try {
      console.log(`📸 Capture ${label}...`);
      
      // Tourner la caméra
      if (controlsRef.current && controlsRef.current.object) {
        const camera = controlsRef.current.object;
        // Distance différente : Face = 5, autres = 12 (plus de recul)
        const distance = label === 'Face' ? 5 : 12;
        
        camera.position.x = Math.sin(angleY) * distance;
        camera.position.z = Math.cos(angleY) * distance;
        camera.position.y = 1;
        
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
        camera.lookAt(0, 0, 0);
        
        // Forcer plusieurs rendus
        await new Promise(resolve => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              requestAnimationFrame(resolve);
            });
          });
        });
      }

      // Attendre que le rendu soit stable
      await new Promise(resolve => setTimeout(resolve, 1500));

      const canvas = canvasContainerRef.current?.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) {
        console.error('❌ Canvas non trouvé');
        return null;
      }

      // Créer un canvas 512x512
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 512;
      tempCanvas.height = 512;
      const ctx = tempCanvas.getContext('2d');
      
      if (!ctx) return null;

      const minDim = Math.min(canvas.width, canvas.height);
      const cropX = (canvas.width - minDim) / 2;
      const cropY = (canvas.height - minDim) / 2;

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 512, 512);
      ctx.drawImage(canvas, cropX, cropY, minDim, minDim, 0, 0, 512, 512);

      return new Promise((resolve) => {
        tempCanvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
      });
    } catch (err) {
      console.error('❌ Erreur capture:', err);
      return null;
    }
  };

  const generatePreviews = async () => {
    setIsGenerating(true);
    const urls: string[] = [];

    for (const angle of angles) {
      setCurrentAngle(angle.label);
      
      const blob = await captureView(angle.angleY, angle.label);
      if (!blob) continue;

      // Upload vers Supabase
      const filename = `preview-${configId}-${angle.label.toLowerCase()}-${Date.now()}.png`;
      const { data, error } = await supabase.storage
        .from('configurations')
        .upload(filename, blob, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error(`❌ Erreur upload ${angle.label}:`, error);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('configurations')
        .getPublicUrl(data.path);

      urls.push(publicUrl);
      console.log(`✅ ${angle.label} uploadé`);
    }

    // Mettre à jour la config avec les 4 vues
    if (urls.length > 0) {
      await supabase
        .from('configurations')
        .update({ preview_images: urls })
        .eq('id', configId);
      
      setGeneratedPreviews(urls);
      onPreviewsGenerated?.(urls);
    }

    setIsGenerating(false);
    setCurrentAngle('');
  };

  return (
    <div className="space-y-4">
      {/* Mini viewer 3D caché */}
      <div 
        ref={canvasContainerRef}
        className="w-[400px] h-[400px] bg-gray-100 rounded-lg overflow-hidden"
        style={{ display: isGenerating ? 'block' : 'none' }}
      >
        <Canvas 
          camera={{ position: [0, 1, 5], fov: 50 }}
          dpr={[1, 2]}
          gl={{ preserveDrawingBuffer: true }}
          onCreated={({ gl }) => {
            // Align rendering with main viewer look
            gl.outputColorSpace = THREE.SRGBColorSpace;
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 2.6; // + lumineux
            // Réduire l'ombrage: désactiver les shadowMaps sur ces rendus preview
            gl.shadowMap.enabled = false;
          }}
        >
          <LightRig />
          <ModelViewer
            url={configData.modelUrl || '/test-cube.glb'}
            color="#ffffff"
            designTexture={configData.design?.svgUrl}
            colors={configData.colors ? {
              primary: configData.colors.primary || '#ffffff',
              secondary: configData.colors.secondary || '#ffffff',
              tertiary: configData.colors.tertiary || '#ffffff'
            } : undefined}
            texts={configData.texts || []}
            fonts={configData.fonts || []}
            placedLogos={configData.logos || []}
            materialMaps={configData.materialMaps}
            selectedDesign={configData.design ? {
              id: configData.design.id,
              svgUrl: configData.design.svgUrl
            } : undefined}
          />
          <OrbitControls 
            ref={controlsRef}
            enablePan={false}
            enableZoom={false}
            enableRotate={false}
          />
        </Canvas>
      </div>

      {/* Bouton de génération */}
      {!isGenerating && generatedPreviews.length === 0 && (
        <button
          onClick={generatePreviews}
          className="w-full px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
        >
          📸 Générer les 4 vues 3D
        </button>
      )}

      {/* État de génération */}
      {isGenerating && (
        <div className="text-center py-4">
          <div className="text-sm text-gray-600">
            Génération en cours : <span className="font-bold">{currentAngle}</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Veuillez patienter...
          </div>
        </div>
      )}

      {/* Affichage des 4 vues générées */}
      {generatedPreviews.length > 0 && (
        <div className="bg-gray-100 rounded-lg p-4">
          <h3 className="font-bold text-black mb-3">Aperçus générés (4 vues) :</h3>
          <div className="grid grid-cols-2 gap-3">
            {generatedPreviews.map((url, index) => (
              <div key={index} className="relative">
                <img
                  src={url}
                  alt={['Face', 'Dos', 'Gauche', 'Droite'][index]}
                  className="w-full rounded-lg border-2 border-gray-300"
                />
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                  {['Face', 'Dos', 'Gauche', 'Droite'][index]}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

