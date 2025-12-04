"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type MaterialConfig = {
  materialName: string;
  normalMap?: string;
  roughnessMap?: string;
  metalnessMap?: string;
  aoMap?: string;
  opacityMap?: string;         // Opacity/Alpha map
  repeatX?: number; // Nouveau: repeat horizontal
  repeatY?: number; // Nouveau: repeat vertical
  normalIntensity?: number;    // Intensité de la normal map (0-5)
  roughnessValue?: number;     // Valeur de roughness (0-1)
  metalnessValue?: number;     // Valeur de metalness (0-1)
  aoIntensity?: number;        // Intensité de l'AO map (0-5)
};

type Model3D = {
  id: string;
  name: string;
  glbUrl: string;
  materials?: string[]; // Liste des noms de matériaux
  materialMaps?: Record<string, MaterialConfig>; // Config par matériau
};

export default function MaterialMapsPage() {
  const [models, setModels] = useState<Model3D[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [materials, setMaterials] = useState<string[]>([]);
  const [materialConfigs, setMaterialConfigs] = useState<Record<string, MaterialConfig>>({});
  const [loading, setLoading] = useState(false);
  const [previewKey, setPreviewKey] = useState(0); // Pour forcer le rechargement de l'iframe
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Charger les modèles
  useEffect(() => {
    fetch("/api/models")
      .then((r) => r.json())
      .then((data) => {
        setModels(data);
        if (data.length > 0) {
          selectModel(data[0].id);
        }
      });
  }, []);

  // Détecter automatiquement les matériaux d'un modèle GLB
  async function detectMaterialsFromGLB(glbUrl: string, modelId: string) {
    try {
      console.log('🔍 Détection automatique des matériaux depuis:', glbUrl);
      
      // Charger le modèle GLB directement
      const response = await fetch(glbUrl);
      const arrayBuffer = await response.arrayBuffer();
      
      // Utiliser GLTFLoader pour parser le modèle
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader');
      const loader = new GLTFLoader();
      
      const gltf = await new Promise((resolve, reject) => {
        loader.parse(arrayBuffer, '', resolve, reject);
      });
      
      const materials = new Set<string>();
      
      gltf.scene.traverse((child: any) => {
        if (child.isMesh && child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat: any) => {
              if (mat.name) {
                materials.add(mat.name);
                console.log('📦 Matériau détecté (array):', mat.name);
              }
            });
          } else if (child.material.name) {
            materials.add(child.material.name);
            console.log('📦 Matériau détecté (single):', child.material.name);
          }
        }
      });
      
      const materialArray = Array.from(materials);
      console.log('📦 Matériaux détectés pour le modèle', modelId, ':', materialArray);
      
      if (materialArray.length > 0) {
        // Sauvegarder les matériaux détectés
        const saveResponse = await fetch(`/api/models/${modelId}/detect-materials`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ detectedMaterials: materialArray })
        });
        
        if (saveResponse.ok) {
          console.log('✅ Matériaux sauvegardés pour le modèle', modelId);
          return materialArray;
        }
      }
      
      return [];
    } catch (error) {
      console.error('❌ Erreur détection matériaux:', error);
      return [];
    }
  }

  // Sélectionner un modèle et charger ses matériaux
  async function selectModel(modelId: string) {
    if (!modelId) {
      console.log('❌ Pas de modelId fourni');
      return;
    }
    
    console.log('🔍 Sélection du modèle:', modelId);
    setSelectedModelId(modelId);
    setLoading(true);

    try {
      console.log('📡 Chargement des matériaux...');
      
      // Récupérer les informations du modèle
      const modelResponse = await fetch('/api/models');
      const models = await modelResponse.json();
      const selectedModel = models.find((m: any) => m.id === modelId);
      
      if (!selectedModel) {
        console.error('❌ Modèle non trouvé');
        return;
      }
      
      // Charger les métadonnées du modèle
      const response = await fetch(`/api/models/${modelId}/materials`);
      const data = await response.json();
      console.log('📦 Matériaux chargés:', data);
      
      let materials = data.materials || [];
      
      // Si aucun matériau détecté, essayer de les détecter automatiquement
      if (materials.length === 0 && selectedModel.glbUrl) {
        console.log('🔍 Aucun matériau détecté, tentative de détection automatique...');
        const detectedMaterials = await detectMaterialsFromGLB(selectedModel.glbUrl, modelId);
        materials = detectedMaterials;
        
        // Recharger les matériaux après détection
        if (detectedMaterials.length > 0) {
          const refreshResponse = await fetch(`/api/models/${modelId}/materials`);
          const refreshData = await refreshResponse.json();
          materials = refreshData.materials || [];
        }
      }
      
      setMaterials(materials);
      setMaterialConfigs(data.material_maps || data.materialMaps || {});
      console.log('🔍 Material configs chargés:', data.material_maps || data.materialMaps);
    } catch (error) {
      console.error("❌ Erreur chargement matériaux:", error);
    } finally {
      setLoading(false);
    }
  }

  // Compresser une image côté client avant upload
  async function compressImage(file: File, maxSizeKB: number = 500): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculer les nouvelles dimensions (max 512px pour garder la qualité)
        const maxDimension = 512;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Dessiner l'image redimensionnée
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convertir en blob avec compression
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Erreur compression image'));
            return;
          }
          
          // Si le fichier est encore trop lourd, réduire la qualité
          const sizeKB = blob.size / 1024;
          if (sizeKB > maxSizeKB) {
            console.log(`🗜️ Image trop lourde (${Math.round(sizeKB)}KB), compression supplémentaire...`);
            
            // Essayer avec une qualité plus faible
            canvas.toBlob((compressedBlob) => {
              if (!compressedBlob) {
                reject(new Error('Erreur compression image'));
                return;
              }
              
              const finalFile = new File([compressedBlob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              
              console.log(`✅ Image compressée: ${Math.round(compressedBlob.size / 1024)}KB (${width}x${height})`);
              resolve(finalFile);
            }, 'image/jpeg', 0.7);
          } else {
            const finalFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            
            console.log(`✅ Image compressée: ${Math.round(blob.size / 1024)}KB (${width}x${height})`);
            resolve(finalFile);
          }
        }, 'image/jpeg', 0.8);
      };
      
      img.onerror = () => reject(new Error('Erreur chargement image'));
      img.src = URL.createObjectURL(file);
    });
  }

  // Uploader une texture map pour un matériau spécifique
  async function uploadTextureMap(materialName: string, mapType: 'normalMap' | 'roughnessMap' | 'metalnessMap' | 'aoMap' | 'opacityMap', file: File) {
    if (!selectedModelId) {
      console.error('❌ Pas de modèle sélectionné');
      return;
    }

    console.log('📤 Upload texture map:', { materialName, mapType, fileName: file.name, originalSize: Math.round(file.size / 1024) + 'KB', modelId: selectedModelId });

    try {
      // Compresser l'image côté client d'abord
      console.log('🗜️ Compression côté client...');
      const compressedFile = await compressImage(file, 500); // Max 500KB
      
      const fd = new FormData();
      fd.append("modelId", selectedModelId);
      fd.append("materialName", materialName);
      fd.append("mapType", mapType);
      fd.append("file", compressedFile);

      console.log('🚀 Envoi vers API...');
      const res = await fetch("/api/models/material-maps", { method: "POST", body: fd });
      
      console.log('📡 Réponse API:', res.status, res.statusText);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ Erreur API:', errorText);
        throw new Error(`Upload failed: ${res.status} ${errorText}`);
      }
      
      const updated = await res.json();
      console.log('✅ Upload réussi:', updated);
      console.log('📦 Material maps mis à jour:', updated.materialMaps);
      console.log('🔍 Config du matériau après update:', updated.materialMaps[materialName]);
      
      setMaterialConfigs(updated.materialMaps);
      setHasUnsavedChanges(false); // Les maps sont sauvegardées automatiquement
      setPreviewKey(prev => prev + 1); // Recharger l'aperçu
      
      // Forcer le rechargement des données du modèle pour synchroniser l'UI
      console.log('🔄 Rechargement des données après upload...');
      await selectModel(selectedModelId);
      
      alert(`✅ ${mapType} uploadée pour ${materialName}!`);
    } catch (error) {
      console.error('❌ Erreur upload:', error);
      alert(`❌ Erreur: ${error}`);
    }
  }

  // Sauvegarder automatiquement les configurations d'un matériau
  async function saveMaterialConfig(materialName: string, config: any) {
    if (!selectedModelId) return;
    
    try {
      console.log('💾 Sauvegarde automatique pour:', materialName, {
        materialName,
        config: {
          normalIntensity: config.normalIntensity,
          roughnessValue: config.roughnessValue,
          metalnessValue: config.metalnessValue,
          aoIntensity: config.aoIntensity,
          repeatX: config.repeatX,
          repeatY: config.repeatY
        },
        allConfigKeys: Object.keys(config)
      });
      
      const payload = {
        modelId: selectedModelId, 
        materialName, 
        repeatX: config.repeatX || 1, 
        repeatY: config.repeatY || 1,
        normalIntensity: config.normalIntensity,
        roughnessValue: config.roughnessValue,
        metalnessValue: config.metalnessValue,
        aoIntensity: config.aoIntensity
      };
      
      console.log('📤 Payload envoyé à /api/models/material-maps/repeat:', payload);
      
      const res = await fetch("/api/models/material-maps/repeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error("Update failed");
      
      // Recharger l'aperçu 3D
      setPreviewKey(prev => prev + 1);
      console.log('✅ Configuration sauvegardée pour:', materialName);
    } catch (error) {
      console.error("Erreur sauvegarde automatique:", error);
    }
  }

  // Sauvegarder toutes les configurations de repeat
  async function saveAllConfigs() {
    if (!selectedModelId) return;
    
    setLoading(true);
    try {
      // Sauvegarder chaque matériau configuré
      for (const [materialName, config] of Object.entries(materialConfigs)) {
        if (config.repeatX !== undefined || config.repeatY !== undefined || 
            config.normalIntensity !== undefined || config.roughnessValue !== undefined ||
            config.metalnessValue !== undefined || config.aoIntensity !== undefined) {
          await saveMaterialConfig(materialName, config);
        }
      }
      
      setHasUnsavedChanges(false);
      alert("✅ Configurations sauvegardées avec succès!");
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      alert("❌ Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  }

  // Supprimer une texture map
  async function removeTextureMap(materialName: string, mapType: string) {
    if (!selectedModelId || !confirm(`Supprimer cette ${mapType} ?`)) return;

    try {
      const res = await fetch("/api/models/material-maps", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId: selectedModelId, materialName, mapType })
      });
      
      if (!res.ok) throw new Error("Delete failed");
      
      const updated = await res.json();
      setMaterialConfigs(updated.materialMaps);
    } catch (error) {
      alert(`❌ Erreur: ${error}`);
    }
  }

  const selectedModel = models.find(m => m.id === selectedModelId);

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">🗺️ Configuration des Texture Maps par Matériau</h1>
            <Link 
              href="/admin"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              ← Retour
            </Link>
          </div>
        </div>
      </header>

      <main className="flex h-[calc(100vh-64px)]">
        {/* Configuration à gauche */}
        <div className="w-[500px] flex-shrink-0 bg-white border-r overflow-auto">
          <div className="p-6">
            {/* Sélecteur de modèle + Bouton sauvegarder */}
            <div className="bg-gray-50 rounded-lg border p-4 mb-6">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Sélectionner un modèle 3D
                  </label>
                  <select
                    value={selectedModelId || ""}
                    onChange={(e) => {
                      selectModel(e.target.value);
                      setHasUnsavedChanges(false);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {selectedModelId && (
                  <>
                    <button
                      onClick={async () => {
                        setLoading(true);
                        try {
                          await selectModel(selectedModelId);
                          alert('✅ Matériaux rechargés avec succès!');
                        } catch (error) {
                          alert('❌ Erreur lors du rechargement des matériaux');
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                    >
                      🔄 Recharger matériaux
                    </button>
                    <button
                      onClick={async () => {
                        if (!selectedModelId) return;
                        
                        setLoading(true);
                        try {
                          // Forcer la détection en appelant directement l'API
                          const response = await fetch(`/api/models/${selectedModelId}/materials`);
                          const data = await response.json();
                          
                          console.log('🔍 Debug - Matériaux récupérés:', data);
                          alert(`🔍 Debug - Modèle: ${selectedModelId}\nMatériaux: ${data.materials.join(', ')}\n\nVérifiez la console pour plus de détails.`);
                        } catch (error) {
                          console.error('❌ Erreur debug:', error);
                          alert('❌ Erreur lors du debug');
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors whitespace-nowrap"
                    >
                      🔍 Debug matériaux
                    </button>
                    <button
                      onClick={async () => {
                        if (!selectedModelId || !confirm(`Êtes-vous sûr de vouloir nettoyer tous les matériaux détectés pour ce modèle ?\n\nCela supprimera tous les matériaux auto-détectés et vous devrez les redétecter.`)) {
                          return;
                        }
                        
                        setLoading(true);
                        try {
                          // Nettoyer les matériaux détectés en envoyant une liste vide
                          const response = await fetch(`/api/models/${selectedModelId}/detect-materials`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ detectedMaterials: [] })
                          });
                          
                          if (response.ok) {
                            alert('✅ Matériaux nettoyés ! Rechargez la page pour voir le résultat.');
                            window.location.reload();
                          } else {
                            alert('❌ Erreur lors du nettoyage');
                          }
                        } catch (error) {
                          console.error('❌ Erreur nettoyage:', error);
                          alert('❌ Erreur lors du nettoyage');
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
                    >
                      🧹 Nettoyer matériaux
                    </button>
                    <button
                      onClick={saveAllConfigs}
                      disabled={!hasUnsavedChanges || loading}
                      className={`px-6 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                        hasUnsavedChanges && !loading
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {loading ? "⏳ Sauvegarde..." : hasUnsavedChanges ? "💾 Sauvegarder" : "✅ Sauvegardé"}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Configuration des matériaux */}
            {selectedModel && (
              <div>
                <div className="mb-4 pb-2 border-b">
                  <h2 className="text-xl font-semibold mb-2">
                    ⚙️ Configuration: {selectedModel.name}
                  </h2>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800">
                      💡 <strong>Conseil :</strong> Les textures sont automatiquement optimisées à 128x128px WebP pour de meilleures performances mobiles.
                    </p>
                  </div>
                  
                  {/* Information sur la détection automatique */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <h3 className="text-sm font-semibold text-green-800 mb-2">🔍 Détection automatique des matériaux</h3>
                  <p className="text-xs text-green-700 mb-2">
                    Les matériaux de ce modèle sont détectés automatiquement dès que vous sélectionnez un modèle.
                  </p>
                  <p className="text-xs text-green-700">
                    💡 <strong>Automatique :</strong> Plus besoin d'ouvrir le configurateur, la détection se fait directement ici !
                  </p>
                </div>
                </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin text-4xl">⏳</div>
                <p className="mt-4 text-gray-600">Chargement des matériaux...</p>
              </div>
            ) : materials.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-4">🔍</div>
                <p className="mb-4">Aucun matériau détecté pour ce modèle.</p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                    <p className="text-sm text-blue-800 mb-3">
                      <strong>Détection automatique :</strong>
                    </p>
                    <p className="text-sm text-blue-700">
                      Les matériaux sont détectés automatiquement quand vous sélectionnez un modèle. 
                      Si aucun matériau n'apparaît, utilisez le bouton "🧹 Nettoyer matériaux" puis sélectionnez à nouveau le modèle.
                    </p>
                  </div>
              </div>
            ) : (
              <div className="space-y-6">
                {materials.map((materialName) => {
                  console.log('🔍 [CONFIG UI] Recherche config pour:', materialName);
                  console.log('🔍 [CONFIG UI] materialConfigs disponibles:', Object.keys(materialConfigs));
                  console.log('🔍 [CONFIG UI] materialConfigs complet:', materialConfigs);
                  const config = materialConfigs[materialName] || {};
                  console.log('🔍 [CONFIG UI] Config trouvée:', config);
                  console.log('🔍 [CONFIG UI] config.normalMap existe?', !!config.normalMap);
                  const isFront = materialName.toLowerCase().includes('front');
                  const isBack = materialName.toLowerCase().includes('back');

                  return (
                    <div key={materialName} className={`border rounded-lg p-6 ${isFront ? 'border-blue-300 bg-blue-50' : isBack ? 'border-gray-300 bg-gray-50' : 'border-green-300 bg-green-50'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">
                          {isFront && '🎨 '}{isBack && '🤍 '}
                          {materialName}
                        </h3>
                        <span className="text-sm text-gray-600">
                          {isFront ? 'Extérieur (FRONT)' : isBack ? 'Intérieur (BACK)' : 'Autre'}
                        </span>
                      </div>

                      {/* Jauges de Repeat (Tiling) */}
                      <div className="mb-4 p-4 bg-white border rounded">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">📐 Tiling / Repeat</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Repeat X (horizontal): {config.repeatX || 1}
                            </label>
                            <input
                              type="range"
                              min="0.1"
                              max="50"
                              step="0.1"
                              value={config.repeatX || 1}
                              onChange={(e) => {
                                const newValue = parseFloat(e.target.value);
                                // Mettre à jour LOCALEMENT
                                const updatedConfig = {
                                  ...config,
                                  repeatX: newValue
                                };
                                setMaterialConfigs(prev => ({
                                  ...prev,
                                  [materialName]: updatedConfig
                                }));
                                // Sauvegarder automatiquement
                                saveMaterialConfig(materialName, updatedConfig);
                              }}
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Repeat Y (vertical): {config.repeatY || 1}
                            </label>
                            <input
                              type="range"
                              min="0.1"
                              max="50"
                              step="0.1"
                              value={config.repeatY || 1}
                              onChange={(e) => {
                                const newValue = parseFloat(e.target.value);
                                // Mettre à jour LOCALEMENT
                                const updatedConfig = {
                                  ...config,
                                  repeatY: newValue
                                };
                                setMaterialConfigs(prev => ({
                                  ...prev,
                                  [materialName]: updatedConfig
                                }));
                                // Sauvegarder automatiquement
                                saveMaterialConfig(materialName, updatedConfig);
                              }}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Intensités des texture maps */}
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <h4 className="text-sm font-semibold text-blue-900 mb-3">⚡ Intensités des effets</h4>
                        <div className="space-y-3">
                          {/* Intensité Normal Map */}
                          {config.normalMap && (
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">
                                Normal Map Intensity: {config.normalIntensity || 3.0}
                              </label>
                              <input
                                type="range"
                                min="0"
                                max="5"
                                step="0.1"
                                value={config.normalIntensity || 3.0}
                                onChange={(e) => {
                                  const newValue = parseFloat(e.target.value);
                                  const updatedConfig = {
                                    ...config,
                                    normalIntensity: newValue
                                  };
                                  setMaterialConfigs(prev => ({
                                    ...prev,
                                    [materialName]: updatedConfig
                                  }));
                                  // Sauvegarder automatiquement
                                  saveMaterialConfig(materialName, updatedConfig);
                                }}
                                className="w-full"
                              />
                            </div>
                          )}
                          
                          {/* Roughness Value */}
                          {config.roughnessMap && (
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">
                                Roughness Value: {config.roughnessValue || 1.0}
                              </label>
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={config.roughnessValue || 1.0}
                                onChange={(e) => {
                                  const newValue = parseFloat(e.target.value);
                                  const updatedConfig = {
                                    ...config,
                                    roughnessValue: newValue
                                  };
                                  setMaterialConfigs(prev => ({
                                    ...prev,
                                    [materialName]: updatedConfig
                                  }));
                                  // Sauvegarder automatiquement
                                  saveMaterialConfig(materialName, updatedConfig);
                                }}
                                className="w-full"
                              />
                            </div>
                          )}
                          
                          {/* Metalness Value */}
                          {config.metalnessMap && (
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">
                                Metalness Value: {config.metalnessValue || 1.0}
                              </label>
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={config.metalnessValue || 1.0}
                                onChange={(e) => {
                                  const newValue = parseFloat(e.target.value);
                                  const updatedConfig = {
                                    ...config,
                                    metalnessValue: newValue
                                  };
                                  setMaterialConfigs(prev => ({
                                    ...prev,
                                    [materialName]: updatedConfig
                                  }));
                                  // Sauvegarder automatiquement
                                  saveMaterialConfig(materialName, updatedConfig);
                                }}
                                className="w-full"
                              />
                            </div>
                          )}
                          
                          {/* AO Intensity */}
                          {config.aoMap && (
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">
                                AO Map Intensity: {config.aoIntensity || 3.0}
                              </label>
                              <input
                                type="range"
                                min="0"
                                max="5"
                                step="0.1"
                                value={config.aoIntensity || 3.0}
                                onChange={(e) => {
                                  const newValue = parseFloat(e.target.value);
                                  const updatedConfig = {
                                    ...config,
                                    aoIntensity: newValue
                                  };
                                  setMaterialConfigs(prev => ({
                                    ...prev,
                                    [materialName]: updatedConfig
                                  }));
                                  // Sauvegarder automatiquement
                                  saveMaterialConfig(materialName, updatedConfig);
                                }}
                                className="w-full"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Normal Map */}
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Normal Map
                          </label>
                          {config.normalMap ? (
                            <div className="flex items-center gap-2">
                              <img src={config.normalMap} alt="Normal map" className="w-16 h-16 object-cover rounded border" />
                              <div className="flex-1">
                                <p className="text-xs text-gray-600 truncate">{config.normalMap}</p>
                                <button
                                  onClick={() => removeTextureMap(materialName, 'normalMap')}
                                  className="text-xs text-red-600 hover:underline mt-1"
                                >
                                  🗑️ Supprimer
                                </button>
                              </div>
                            </div>
                          ) : (
                            <input
                              type="file"
                              accept=".png,.jpg,.jpeg"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) uploadTextureMap(materialName, 'normalMap', file);
                                e.target.value = '';
                              }}
                              className="w-full text-sm"
                            />
                          )}
                        </div>

                        {/* Roughness Map */}
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Roughness Map
                          </label>
                          {config.roughnessMap ? (
                            <div className="flex items-center gap-2">
                              <img src={config.roughnessMap} alt="Roughness map" className="w-16 h-16 object-cover rounded border" />
                              <div className="flex-1">
                                <p className="text-xs text-gray-600 truncate">{config.roughnessMap}</p>
                                <button
                                  onClick={() => removeTextureMap(materialName, 'roughnessMap')}
                                  className="text-xs text-red-600 hover:underline mt-1"
                                >
                                  🗑️ Supprimer
                                </button>
                              </div>
                            </div>
                          ) : (
                            <input
                              type="file"
                              accept=".png,.jpg,.jpeg"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) uploadTextureMap(materialName, 'roughnessMap', file);
                                e.target.value = '';
                              }}
                              className="w-full text-sm"
                            />
                          )}
                        </div>

                        {/* Metalness Map */}
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Metalness Map
                          </label>
                          {config.metalnessMap ? (
                            <div className="flex items-center gap-2">
                              <img src={config.metalnessMap} alt="Metalness map" className="w-16 h-16 object-cover rounded border" />
                              <div className="flex-1">
                                <p className="text-xs text-gray-600 truncate">{config.metalnessMap}</p>
                                <button
                                  onClick={() => removeTextureMap(materialName, 'metalnessMap')}
                                  className="text-xs text-red-600 hover:underline mt-1"
                                >
                                  🗑️ Supprimer
                                </button>
                              </div>
                            </div>
                          ) : (
                            <input
                              type="file"
                              accept=".png,.jpg,.jpeg"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) uploadTextureMap(materialName, 'metalnessMap', file);
                                e.target.value = '';
                              }}
                              className="w-full text-sm"
                            />
                          )}
                        </div>

                        {/* AO Map */}
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            AO Map (Ambient Occlusion)
                          </label>
                          {config.aoMap ? (
                            <div className="flex items-center gap-2">
                              <img src={config.aoMap} alt="AO map" className="w-16 h-16 object-cover rounded border" />
                              <div className="flex-1">
                                <p className="text-xs text-gray-600 truncate">{config.aoMap}</p>
                                <button
                                  onClick={() => removeTextureMap(materialName, 'aoMap')}
                                  className="text-xs text-red-600 hover:underline mt-1"
                                >
                                  🗑️ Supprimer
                                </button>
                              </div>
                            </div>
                          ) : (
                            <input
                              type="file"
                              accept=".png,.jpg,.jpeg"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) uploadTextureMap(materialName, 'aoMap', file);
                                e.target.value = '';
                              }}
                              className="w-full text-sm"
                            />
                          )}
                        </div>

                        {/* Opacity Map */}
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Opacity Map (Transparence)
                          </label>
                          {config.opacityMap ? (
                            <div className="flex items-center gap-2">
                              <img src={config.opacityMap} alt="Opacity map" className="w-16 h-16 object-cover rounded border" />
                              <div className="flex-1">
                                <p className="text-xs text-gray-600 truncate">{config.opacityMap}</p>
                                <button
                                  onClick={() => removeTextureMap(materialName, 'opacityMap')}
                                  className="text-xs text-red-600 hover:underline mt-1"
                                >
                                  🗑️ Supprimer
                                </button>
                              </div>
                            </div>
                          ) : (
                            <input
                              type="file"
                              accept=".png,.jpg,.jpeg"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) uploadTextureMap(materialName, 'opacityMap', file);
                                e.target.value = '';
                              }}
                              className="w-full text-sm"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
              </div>
            )}
          </div>
        </div>

        {/* Aperçu 3D - DROITE (Plein écran) */}
        {selectedModel && (
          <div className="flex-1 bg-gray-900 overflow-hidden">
            <iframe
              src={`/preview-material-maps?modelId=${selectedModel.id}&t=${previewKey}`}
              className="w-full h-full border-0"
              title="Aperçu 3D"
              key={`${selectedModel.id}-${previewKey}`}
            />
          </div>
        )}
      </main>
    </div>
  );
}
