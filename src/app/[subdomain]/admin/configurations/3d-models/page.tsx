"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Model3DPreview } from "@/components/Model3DPreview";
import { Model3DPreviewStatic } from "@/components/Model3DPreviewStatic";
import { MaterialMapPreview3DStatic } from "@/components/MaterialMapPreview3DStatic";
import { ModelViewer } from "@/components/ModelViewer";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";

// Composant pour contrôler la caméra depuis l'extérieur du Canvas
function CameraController() {
  const { camera, controls } = useThree();
  
  useEffect(() => {
    const handleGoToView = (e: any) => {
      const { position, target } = e.detail;
      if (position && target && controls) {
        camera.position.set(position.x, position.y, position.z);
        (controls as any).target.set(target.x, target.y, target.z);
        (controls as any).update();
      }
    };
    
    window.addEventListener('goToCameraView', handleGoToView);
    return () => window.removeEventListener('goToCameraView', handleGoToView);
  }, [camera, controls]);
  
  return null;
}

type Model3D = {
  id: string;
  name: string;
  glb_url?: string;
  glbUrl?: string; // Fallback pour compatibilité
  createdAt?: string;
  created_at?: string;
  materialsSchema?: any;
};

type ModelPart = {
  id: string;
  name: string;
  materialId: string | null;
  materialName: string;
};

type DetectedMaterial = {
  name: string;
  index: number;
};

type CameraView = {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
  isDefault?: boolean;
};

export default function ModelsConfigPage() {
  const [models, setModels] = useState<Model3D[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model3D | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [modelParts, setModelParts] = useState<ModelPart[]>([]);
  const [detectedMaterials, setDetectedMaterials] = useState<DetectedMaterial[]>([]);
  const [materialMaps, setMaterialMaps] = useState<Array<{id: string; name: string; material_map_files?: any[]}>>([]);
  const [newModelName, setNewModelName] = useState("");
  const [newModelFile, setNewModelFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showMaterialMapSelector, setShowMaterialMapSelector] = useState(false);
  const [selectedPartForMaterial, setSelectedPartForMaterial] = useState<string | null>(null);
  
  // Camera Views states
  const [activeModalTab, setActiveModalTab] = useState<'materials' | 'camera'>('materials');
  const [cameraViews, setCameraViews] = useState<CameraView[]>([]);
  const [captureMode, setCaptureMode] = useState(false);
  const [currentCameraPosition, setCurrentCameraPosition] = useState({ x: 0, y: 0, z: 0 });
  const [currentCameraTarget, setCurrentCameraTarget] = useState({ x: 0, y: 0, z: 0 });
  const [showNameViewModal, setShowNameViewModal] = useState(false);
  const [newViewName, setNewViewName] = useState('');

  useEffect(() => {
    fetchModels();
    fetchMaterialMaps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedModel && !isCreating) {
      // Load camera views from the model
      const modelCameraViews = (selectedModel as any).camera_views;
      if (modelCameraViews && Array.isArray(modelCameraViews) && modelCameraViews.length > 0) {
        setCameraViews(modelCameraViews);
      } else {
        // Start with empty array - no default views
        setCameraViews([]);
      }
      
      // Extract model parts from the model data
      // Ne charger que si modelParts est vide ou si le modèle a changé
      const parts: ModelPart[] = (selectedModel as any).model_parts?.map((part: any) => ({
        id: part.id,
        name: part.name,
        materialId: part.material_map_id || null,
        materialName: part.material_maps?.name || "Aucun material",
      })) || [];
      
      // Ne mettre à jour que si les parties sont différentes (éviter d'écraser les changements locaux)
      setModelParts(prev => {
        // Si prev est vide ou si le nombre de parties a changé, on met à jour
        if (prev.length === 0 || prev.length !== parts.length) {
          return parts;
        }
        // Sinon, on garde les parties existantes avec leurs materialId locaux
        // mais on met à jour les IDs et noms si nécessaire
        return prev.map(p => {
          const dbPart = parts.find(db => db.name === p.name);
          if (dbPart) {
            // Garder le materialId local s'il existe, sinon utiliser celui de la DB
            return {
              ...p,
              id: dbPart.id,
              materialId: p.materialId !== null ? p.materialId : dbPart.materialId,
              materialName: p.materialId !== null ? p.materialName : dbPart.materialName,
            };
          }
          return p;
        });
      });
    } else if (isCreating) {
      // Reset for new model
      setModelParts([]);
      setDetectedMaterials([]);
      setNewModelName("");
      setNewModelFile(null);
    }
  }, [selectedModel, isCreating]);

  async function fetchModels() {
    try {
      const res = await fetch("/api/models-3d");
      if (!res.ok) throw new Error("Failed to fetch models");
      const data = await res.json();
      setModels(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching models:", error);
    }
  }

  async function fetchMaterialMaps() {
    try {
      const res = await fetch("/api/material-maps");
      if (!res.ok) throw new Error("Failed to fetch material maps");
      const data = await res.json();
      const maps = Array.isArray(data) ? data : [];
      setMaterialMaps(maps);
    } catch (error) {
      console.error("Error fetching material maps:", error);
    }
  }

  function openModal(model: Model3D) {
    setSelectedModel(model);
    setIsCreating(false);
  }

  function openCreateModal() {
    setSelectedModel(null);
    setIsCreating(true);
  }

  function closeModal() {
    setSelectedModel(null);
    setIsCreating(false);
    setModelParts([]);
    setDetectedMaterials([]);
    setNewModelName("");
    setNewModelFile(null);
  }

  async function detectMaterials(file: File) {
    try {
      // Créer un FormData pour envoyer le fichier
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch("/api/models-3d/detect-materials", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to detect materials");
      const data = await res.json();
      
      // Convertir les matériaux détectés en ModelPart
      const parts: ModelPart[] = data.materials.map((mat: DetectedMaterial, index: number) => ({
        id: `temp-${index}`,
        name: mat.name,
        materialId: null,
        materialName: "Aucun material",
      }));
      
      setDetectedMaterials(data.materials);
      setModelParts(parts);
    } catch (error) {
      console.error("Error detecting materials:", error);
      alert("Erreur lors de la détection des matériaux");
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setNewModelFile(file);
      // Détecter automatiquement les matériaux
      detectMaterials(file);
    }
  }

  function renameMaterial(partName: string) {
    const part = modelParts.find(p => p.name === partName);
    if (!part) return;

    const newName = prompt(`Renommer "${part.name}" :`, part.name);
    if (newName && newName.trim() && newName !== part.name) {
      setModelParts(prev => prev.map(p => 
        p.name === partName 
          ? { ...p, name: newName.trim() }
          : p
      ));
      // Mettre à jour aussi detectedMaterials pour garder la cohérence
      setDetectedMaterials(prev => prev.map((m, idx) => {
        const partIndex = modelParts.findIndex(p => p.name === partName);
        if (partIndex === idx) {
          return { ...m, name: newName.trim() };
        }
        return m;
      }));
    }
  }

  function changeMaterial(partName: string) {
    const part = modelParts.find(p => p.name === partName);
    if (!part) return;
    
    setSelectedPartForMaterial(partName);
    setShowMaterialMapSelector(true);
  }

  function selectMaterialMap(materialMapId: string, materialMapName: string) {
    if (!selectedPartForMaterial) return;
    
    // Si materialMapId est vide, on le traite comme null
    const finalMaterialId = materialMapId && materialMapId.trim() !== '' ? materialMapId : null;
    
    setModelParts(prev => prev.map(p => 
      p.name === selectedPartForMaterial 
        ? { ...p, materialId: finalMaterialId, materialName: materialMapName }
        : p
    ));
    
    setShowMaterialMapSelector(false);
    setSelectedPartForMaterial(null);
  }

  function closeMaterialMapSelector() {
    setShowMaterialMapSelector(false);
    setSelectedPartForMaterial(null);
  }

  async function createModel() {
    if (!newModelName || !newModelFile) {
      alert("Veuillez remplir le nom et sélectionner un fichier");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', newModelName);
      formData.append('file', newModelFile);
      
      // Envoyer les parties détectées pour qu'elles soient créées avec les bons noms
      if (modelParts.length > 0) {
        formData.append('parts', JSON.stringify(modelParts.map(p => ({ name: p.name }))));
      }

      const res = await fetch("/api/models-3d", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || "Failed to create model");
      }
      const newModel = await res.json();

      // Attendre un peu pour que les parties soient créées
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Récupérer le modèle créé avec ses parties
      const modelsRes = await fetch("/api/models-3d");
      if (modelsRes.ok) {
        const allModels = await modelsRes.json();
        const createdModel = allModels.find((m: any) => m.id === newModel.id);
        
        // Assigner les material maps aux parties si des matériaux ont été détectés et assignés
        if (createdModel && modelParts.length > 0 && createdModel.model_parts) {
          const partsToUpdate = modelParts
            .filter(p => p.materialId !== null) // Seulement les parties avec un material assigné
            .map((p) => {
              // Trouver la partie correspondante par nom
              const matchingPart = createdModel.model_parts.find((mp: any) => mp.name === p.name);
              return {
                id: matchingPart?.id || '',
                materialMapId: p.materialId,
              };
            })
            .filter(p => p.id !== ''); // Filtrer les parties non trouvées

          if (partsToUpdate.length > 0) {
            const partsRes = await fetch("/api/models-3d/parts", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                modelId: newModel.id,
                parts: partsToUpdate,
              }),
            });

            if (!partsRes.ok) {
              console.warn("Failed to assign material maps, but model was created");
            }
          }
        }
      }

      await fetchModels();
      closeModal();
    } catch (error: any) {
      console.error("Error creating model:", error);
      alert(`Erreur lors de la création: ${error.message || 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  }

  async function saveModel() {
    if (!selectedModel) return;
    
    setLoading(true);
    try {
      // Sauvegarder les assignments de material maps
      const parts = modelParts.map(p => ({
        id: p.id,
        materialMapId: p.materialId,
      }));

      const res = await fetch("/api/models-3d/parts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId: selectedModel.id,
          parts,
        }),
      });

      if (!res.ok) throw new Error("Failed to save model parts");
      
      // Sauvegarder les vues caméra
      const cameraRes = await fetch("/api/models-3d/camera-views", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId: selectedModel.id,
          cameraViews,
        }),
      });

      if (!cameraRes.ok) {
        console.warn("Failed to save camera views, but model parts were saved");
      }
      
      await fetchModels();
      closeModal();
    } catch (error) {
      console.error("Error saving model:", error);
      alert("Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  }

  function openDeleteModal() {
    if (!selectedModel) return;
    setShowDeleteModal(true);
  }

  async function deleteModel() {
    if (!selectedModel) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/models-3d?id=${encodeURIComponent(selectedModel.id)}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete");
      await fetchModels();
      closeModal();
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Error deleting model:", error);
      alert("Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  }

  const filteredModels = models.filter((model) =>
    model.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showModal = selectedModel || isCreating;

  return (
    <div style={{ fontFamily: 'var(--stepn-font-body)' }}>
      {/* Search and Action Bar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: '32px',
        gap: '16px'
      }}>
        <div style={{ 
          position: 'relative', 
          flex: 1,
          maxWidth: '400px'
        }}>
          <input
            type="text"
            placeholder="Rechercher un modèle 3D..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 40px',
              backgroundColor: '#1a1a1a',
              border: '1px solid #2a2a2a',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '14px',
              fontFamily: 'var(--stepn-font-body)'
            }}
          />
          <span style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#a0a0a0',
            fontSize: '16px'
          }}>
            ⌕
          </span>
        </div>
        <button
          onClick={openCreateModal}
          style={{
            padding: '12px 24px',
            backgroundColor: '#8eff36',
            color: '#000000',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            fontFamily: 'var(--stepn-font-body)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          <span className="green-button-icon">+</span>
          Nouveau modèle 3D
        </button>
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '24px'
      }}>
        {/* Rectangle "Ajouter un modèle 3D" */}
        <div
          style={{
            backgroundColor: '#1a1a1a',
            border: '2px dashed #2a2a2a',
            borderRadius: '8px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '280px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#8eff36';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#2a2a2a';
          }}
          onClick={openCreateModal}
        >
          <div style={{
            fontSize: '48px',
            color: '#a0a0a0',
            marginBottom: '12px'
          }}>
            +
          </div>
          <p style={{
            fontSize: '14px',
            color: '#a0a0a0',
            fontFamily: 'var(--stepn-font-body)'
          }}>
            Ajouter un modèle 3D
          </p>
        </div>

        {/* Existing Models */}
        {filteredModels.map((model) => (
          <div
            key={model.id}
            style={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #2a2a2a',
              borderRadius: '8px',
              overflow: 'hidden',
              transition: 'all 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#8eff36';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#2a2a2a';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            onClick={() => openModal(model)}
          >
              {/* Preview 3D Static */}
              <div style={{
                width: '100%',
                aspectRatio: '1',
                backgroundColor: '#0a0a0a',
                borderBottom: '1px solid #2a2a2a',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <Model3DPreviewStatic 
                  url={(model as any).glb_url || (model as any).glbUrl} 
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            
            {/* Info */}
            <div style={{ padding: '16px' }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#ffffff',
                marginBottom: '8px',
                fontFamily: 'var(--stepn-font-body)'
              }}>
                {model.name}
              </h3>
              <div style={{
                fontSize: '12px',
                color: '#a0a0a0',
                fontFamily: 'var(--stepn-font-body)'
              }}>
                <div>Format: GLB/GLTF</div>
                <div style={{ marginTop: '4px' }}>
                  Vertices: 15,234 • 2.4 MB
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '32px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '12px',
              border: '1px solid #2a2a2a',
              width: '100%',
              maxWidth: '1400px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              borderBottom: '1px solid #2a2a2a'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '24px 24px 16px 24px'
              }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#ffffff',
                  fontFamily: 'var(--stepn-font-body)'
                }}>
                  {isCreating ? 'Nouveau modèle 3D' : selectedModel?.name}
                </h2>
                <button
                  onClick={closeModal}
                  style={{
                    padding: '8px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#a0a0a0',
                    cursor: 'pointer',
                    fontSize: '20px',
                    transition: 'all 0.2s',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#2a2a2a';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#a0a0a0';
                  }}
                >
                  ×
                </button>
              </div>
              
              {/* Tabs - Only show for existing models */}
              {!isCreating && (
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  padding: '0 24px'
                }}>
                  <button
                    onClick={() => setActiveModalTab('materials')}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: activeModalTab === 'materials' ? '#2a2a2a' : 'transparent',
                      border: 'none',
                      borderBottom: activeModalTab === 'materials' ? '2px solid #8eff36' : '2px solid transparent',
                      color: activeModalTab === 'materials' ? '#ffffff' : '#a0a0a0',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      fontFamily: 'var(--stepn-font-body)',
                      transition: 'all 0.2s'
                    }}
                  >
                    🎨 Material Mapping
                  </button>
                  <button
                    onClick={() => setActiveModalTab('camera')}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: activeModalTab === 'camera' ? '#2a2a2a' : 'transparent',
                      border: 'none',
                      borderBottom: activeModalTab === 'camera' ? '2px solid #8eff36' : '2px solid transparent',
                      color: activeModalTab === 'camera' ? '#ffffff' : '#a0a0a0',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      fontFamily: 'var(--stepn-font-body)',
                      transition: 'all 0.2s'
                    }}
                  >
                    📷 Camera Views
                  </button>
                </div>
              )}
            </div>

            {/* Content */}
            {activeModalTab === 'materials' || isCreating ? (
            <div style={{
              display: 'flex',
              flex: 1,
              overflow: 'hidden',
              minHeight: '600px'
            }}>
              {/* Left: 3D Preview / Form */}
              <div style={{
                flex: '1.5',
                padding: '24px',
                borderRight: '1px solid #2a2a2a',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#ffffff',
                  marginBottom: '8px',
                  fontFamily: 'var(--stepn-font-body)'
                }}>
                  {isCreating ? 'Informations du modèle' : 'Prévisualisation 3D'}
                </h3>
                
                {isCreating ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        color: '#ffffff',
                        marginBottom: '8px',
                        fontFamily: 'var(--stepn-font-body)'
                      }}>
                        Nom du modèle
                      </label>
                      <input
                        type="text"
                        value={newModelName}
                        onChange={(e) => setNewModelName(e.target.value)}
                        placeholder="Ex: T-Shirt Standard"
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          backgroundColor: '#0a0a0a',
                          border: '1px solid #2a2a2a',
                          borderRadius: '8px',
                          color: '#ffffff',
                          fontSize: '14px',
                          fontFamily: 'var(--stepn-font-body)'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        color: '#ffffff',
                        marginBottom: '8px',
                        fontFamily: 'var(--stepn-font-body)'
                      }}>
                        Fichier GLB/GLTF
                      </label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".glb,.gltf"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          width: '100%',
                          padding: '12px 24px',
                          backgroundColor: '#2a2a2a',
                          border: '1px solid #2a2a2a',
                          borderRadius: '8px',
                          color: '#ffffff',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          fontFamily: 'var(--stepn-font-body)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#3a3a3a';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#2a2a2a';
                        }}
                      >
                        <span>↑</span>
                        {newModelFile ? newModelFile.name : 'Sélectionner un fichier'}
                      </button>
                      {detectedMaterials.length > 0 && (
                        <p style={{
                          fontSize: '12px',
                          color: '#8eff36',
                          marginTop: '8px',
                          fontFamily: 'var(--stepn-font-body)'
                        }}>
                          {detectedMaterials.length} matériau(x) détecté(s)
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{
                      flex: 1,
                      backgroundColor: '#0a0a0a',
                      borderRadius: '8px',
                      border: '1px solid #2a2a2a',
                      minHeight: '400px',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <Model3DPreview 
                        url={(selectedModel as any).glb_url || (selectedModel as any).glbUrl} 
                        modelParts={modelParts}
                        materialMaps={materialMaps}
                        style={{ width: '100%', height: '100%' }}
                        key={`preview-${modelParts.map(p => `${p.name}-${p.materialId || 'none'}`).join('-')}`}
                      />
                    </div>
                    <button
                      style={{
                        padding: '12px 24px',
                        backgroundColor: '#2a2a2a',
                        border: '1px solid #2a2a2a',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        fontFamily: 'var(--stepn-font-body)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#3a3a3a';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#2a2a2a';
                      }}
                    >
                      <span>↑</span>
                      Modifier le modèle 3D
                    </button>
                    <p style={{
                      fontSize: '12px',
                      color: '#a0a0a0',
                      fontFamily: 'var(--stepn-font-body)',
                      margin: 0
                    }}>
                      Cliquez sur une partie pour assigner un material
                    </p>
                  </>
                )}
              </div>

              {/* Right: Model Parts */}
              <div style={{
                flex: '1',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                overflowY: 'auto'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#ffffff',
                  marginBottom: '8px',
                  fontFamily: 'var(--stepn-font-body)'
                }}>
                  {isCreating ? 'Matériaux détectés' : 'Parties du modèle'}
                </h3>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  {modelParts.length === 0 ? (
                    <p style={{
                      fontSize: '14px',
                      color: '#a0a0a0',
                      fontFamily: 'var(--stepn-font-body)',
                      textAlign: 'center',
                      padding: '32px'
                    }}>
                      {isCreating ? 'Aucun matériau détecté. Uploadez un fichier GLB/GLTF pour détecter les matériaux.' : 'Aucune partie configurée'}
                    </p>
                  ) : (
                    modelParts.map((part) => (
                      <div
                        key={part.name}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '16px',
                          backgroundColor: '#0a0a0a',
                          borderRadius: '8px',
                          border: '1px solid #2a2a2a',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#8eff36';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#2a2a2a';
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          flex: 1
                        }}>
                          {(() => {
                            // Trouver le material map assigné pour afficher sa miniature
                            const assignedMaterialMap = part.materialId 
                              ? materialMaps.find(m => m.id === part.materialId)
                              : null;
                            const diffuseFile = assignedMaterialMap?.material_map_files?.find(
                              (f: any) => f.map_type === 'diffuse'
                            );
                            
                            return (
                              <div style={{
                                width: '40px',
                                height: '40px',
                                backgroundColor: '#4a4a4a',
                                borderRadius: '4px',
                                border: '1px solid #2a2a2a',
                                overflow: 'hidden',
                                flexShrink: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                {diffuseFile?.file_url ? (
                                  <img
                                    src={diffuseFile.file_url}
                                    alt={assignedMaterialMap?.name || 'Material map'}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover'
                                    }}
                                  />
                                ) : (
                                  <div style={{
                                    width: '100%',
                                    height: '100%',
                                    backgroundColor: '#4a4a4a'
                                  }} />
                                )}
                              </div>
                            );
                          })()}
                          <span style={{
                            fontSize: '14px',
                            color: '#ffffff',
                            fontFamily: 'var(--stepn-font-body)',
                            fontWeight: '500',
                            fontStyle: 'italic'
                          }}>
                            {part.name}
                          </span>
                          {!isCreating && (
                            <span style={{
                              fontSize: '14px',
                              color: '#a0a0a0',
                              fontFamily: 'var(--stepn-font-body)',
                              fontStyle: 'italic'
                            }}>
                              {part.materialName}
                            </span>
                          )}
                        </div>
                        <div style={{
                          display: 'flex',
                          gap: '8px'
                        }}>
                          {isCreating && (
                            <button
                              onClick={() => renameMaterial(part.name)}
                              style={{
                                padding: '8px 16px',
                                backgroundColor: '#2a2a2a',
                                border: '1px solid #2a2a2a',
                                borderRadius: '6px',
                                color: '#ffffff',
                                fontSize: '12px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                fontFamily: 'var(--stepn-font-body)',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#3a3a3a';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#2a2a2a';
                              }}
                            >
                              Renommer
                            </button>
                          )}
                          <button
                            onClick={() => changeMaterial(part.name)}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#2a2a2a',
                              border: '1px solid #2a2a2a',
                              borderRadius: '6px',
                              color: '#ffffff',
                              fontSize: '12px',
                              fontWeight: '500',
                              cursor: 'pointer',
                              fontFamily: 'var(--stepn-font-body)',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#3a3a3a';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#2a2a2a';
                            }}
                          >
                            {isCreating ? 'Assigner' : 'Changer'}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            ) : (
              /* Tab Camera Views */
              <div style={{
                flex: 1,
                display: 'flex',
                overflow: 'hidden',
                backgroundColor: '#0a0a0a',
                minHeight: '600px'
              }}>
                {/* Viewer 3D */}
                <div style={{
                  flex: 1,
                  position: 'relative',
                  backgroundColor: '#1a1a1a'
                }}>
                  <Canvas
                    camera={{ position: [0, 0, 15], fov: 50 }}
                    style={{
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(to bottom, #1a1a1a, #0a0a0a)'
                    }}
                  >
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[10, 10, 5]} intensity={1} />
                    <directionalLight position={[-10, -10, -5]} intensity={0.5} />
                    
                    <Suspense fallback={null}>
                      {selectedModel?.glbUrl || (selectedModel as any)?.glb_url ? (
                        <ModelViewer 
                          url={(selectedModel as any).glb_url || selectedModel.glbUrl || ''}
                          designTexture={null}
                          colors={{}}
                          texts={[]}
                          updateTextPosition={() => {}}
                          selectedTextId={null}
                          updateTextRotation={() => {}}
                          updateTextSize={() => {}}
                          placedLogos={[]}
                          updateLogoPosition={() => {}}
                          updateLogoRotation={() => {}}
                          updateLogoScale={() => {}}
                          selectedLogoId={null}
                          setIsDraggingText={() => {}}
                          isDraggingText={false}
                          setIsRotatingText={() => {}}
                          isRotatingText={false}
                          setIsResizingText={() => {}}
                          isResizingText={false}
                          setIsDraggingLogo={() => {}}
                          isDraggingLogo={false}
                          setIsRotatingLogo={() => {}}
                          isRotatingLogo={false}
                          setIsResizingLogo={() => {}}
                          isResizingLogo={false}
                          selectedDesign={{ id: null, svgUrl: null }}
                        />
                      ) : (
                        <mesh>
                          <boxGeometry args={[2, 2, 2]} />
                          <meshStandardMaterial color="#8eff36" />
                        </mesh>
                      )}
                    </Suspense>
                    
                    <CameraController />
                    
                    <OrbitControls 
                      enablePan={true}
                      enableZoom={true}
                      enableRotate={true}
                      onChange={(e) => {
                        if (captureMode && e?.target) {
                          const camera = (e.target as any).object;
                          const target = (e.target as any).target;
                          setCurrentCameraPosition({
                            x: parseFloat(camera.position.x.toFixed(2)),
                            y: parseFloat(camera.position.y.toFixed(2)),
                            z: parseFloat(camera.position.z.toFixed(2))
                          });
                          setCurrentCameraTarget({
                            x: parseFloat(target.x.toFixed(2)),
                            y: parseFloat(target.y.toFixed(2)),
                            z: parseFloat(target.z.toFixed(2))
                          });
                        }
                      }}
                    />
                  </Canvas>

                  {/* Overlay Info quand mode capture actif */}
                  {captureMode && (
                    <div style={{
                      position: 'absolute',
                      top: '20px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: 'rgba(0, 0, 0, 0.9)',
                      border: '2px solid #8eff36',
                      borderRadius: '8px',
                      padding: '16px 24px',
                      zIndex: 10,
                      color: '#ffffff',
                      fontFamily: 'var(--stepn-font-body)',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#8eff36' }}>
                        📷 Mode Capture Actif
                      </div>
                      <div style={{ fontSize: '12px', color: '#a0a0a0', marginBottom: '8px' }}>
                        Positionnez la caméra comme vous le souhaitez
                      </div>
                      <div style={{ fontSize: '11px', color: '#666', fontFamily: 'monospace' }}>
                        Position: X:{currentCameraPosition.x} Y:{currentCameraPosition.y} Z:{currentCameraPosition.z}
                      </div>
                      <div style={{ fontSize: '11px', color: '#666', fontFamily: 'monospace' }}>
                        Target: X:{currentCameraTarget.x} Y:{currentCameraTarget.y} Z:{currentCameraTarget.z}
                      </div>
                    </div>
                  )}
                </div>

                {/* Panel de gestion des vues */}
                <div style={{
                  width: '400px',
                  backgroundColor: '#0a0a0a',
                  borderLeft: '1px solid #1a1a1a',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}>
                  {/* Header */}
                  <div style={{
                    padding: '20px',
                    borderBottom: '1px solid #1a1a1a'
                  }}>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#ffffff',
                      fontFamily: 'var(--stepn-font-body)',
                      margin: 0,
                      marginBottom: '8px'
                    }}>
                      📷 Vues Caméra
                    </h3>
                    <p style={{
                      fontSize: '12px',
                      color: '#a0a0a0',
                      fontFamily: 'var(--stepn-font-body)',
                      margin: 0
                    }}>
                      Créez des vues réutilisables pour ce modèle
                    </p>
                  </div>

                  {/* Liste des vues */}
                  <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '16px'
                  }}>
                    {cameraViews.map((view) => (
                      <div
                        key={view.id}
                        style={{
                          backgroundColor: '#1a1a1a',
                          border: '1px solid #2a2a2a',
                          borderRadius: '8px',
                          padding: '16px',
                          marginBottom: '12px',
                          fontFamily: 'var(--stepn-font-body)'
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '12px'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <span style={{ fontSize: '18px' }}>👁️</span>
                            <span style={{
                              fontSize: '14px',
                              fontWeight: '600',
                              color: '#ffffff'
                            }}>
                              {view.name}
                            </span>
                          </div>
                          <button
                              onClick={() => {
                                if (confirm(`Supprimer la vue "${view.name}" ?`)) {
                                  setCameraViews(cameraViews.filter(v => v.id !== view.id));
                                }
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#ef4444',
                                cursor: 'pointer',
                                fontSize: '18px',
                                padding: '4px'
                              }}
                              title="Supprimer"
                            >
                              🗑️
                            </button>
                        </div>

                        <div style={{
                          fontSize: '11px',
                          color: '#666',
                          fontFamily: 'monospace',
                          marginBottom: '8px'
                        }}>
                          <div>Pos: X:{view.position.x} Y:{view.position.y} Z:{view.position.z}</div>
                          <div>Target: X:{view.target.x} Y:{view.target.y} Z:{view.target.z}</div>
                        </div>

                        <button
                          onClick={() => {
                            window.dispatchEvent(new CustomEvent('goToCameraView', {
                              detail: {
                                position: view.position,
                                target: view.target
                              }
                            }));
                          }}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            backgroundColor: '#2a2a2a',
                            border: '1px solid #3a3a3a',
                            borderRadius: '4px',
                            color: '#ffffff',
                            fontSize: '12px',
                            cursor: 'pointer',
                            fontFamily: 'var(--stepn-font-body)',
                            fontWeight: '500',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#3a3a3a';
                            e.currentTarget.style.borderColor = '#8eff36';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#2a2a2a';
                            e.currentTarget.style.borderColor = '#3a3a3a';
                          }}
                        >
                          📍 Aller à cette vue
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Bouton Capturer */}
                  <div style={{
                    padding: '16px',
                    borderTop: '1px solid #1a1a1a'
                  }}>
                    {!captureMode ? (
                      <button
                        onClick={() => {
                          setCaptureMode(true);
                        }}
                        style={{
                          width: '100%',
                          padding: '14px',
                          backgroundColor: '#8eff36',
                          border: 'none',
                          borderRadius: '6px',
                          color: '#000000',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          fontFamily: 'var(--stepn-font-body)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#7de82e';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#8eff36';
                        }}
                      >
                        <span style={{ fontSize: '18px' }}>📸</span>
                        Capturer une nouvelle vue
                      </button>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Ajustements précis Position & Target */}
                        <div style={{
                          backgroundColor: '#2a2a2a',
                          padding: '12px',
                          borderRadius: '6px',
                          border: '1px solid #3a3a3a'
                        }}>
                          <div style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#8eff36',
                            marginBottom: '8px',
                            fontFamily: 'var(--stepn-font-body)'
                          }}>
                            📐 Position Caméra (où est la caméra)
                          </div>
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                            {(['x', 'y', 'z'] as const).map((axis) => (
                              <div key={`pos-${axis}`} style={{ flex: 1 }}>
                                <label style={{
                                  fontSize: '10px',
                                  color: '#a0a0a0',
                                  textTransform: 'uppercase',
                                  fontWeight: '600',
                                  display: 'block',
                                  marginBottom: '4px'
                                }}>
                                  {axis.toUpperCase()}
                                </label>
                                <input
                                  type="number"
                                  step="0.5"
                                  value={currentCameraPosition?.[axis] || 0}
                                  onChange={(e) => {
                                    const newPos = { ...currentCameraPosition, [axis]: parseFloat(e.target.value) || 0 };
                                    setCurrentCameraPosition(newPos as any);
                                    // Appliquer immédiatement
                                    window.dispatchEvent(new CustomEvent('goToCameraView', {
                                      detail: { position: newPos, target: currentCameraTarget }
                                    }));
                                  }}
                                  style={{
                                    width: '100%',
                                    padding: '6px',
                                    backgroundColor: '#1a1a1a',
                                    border: '1px solid #3a3a3a',
                                    borderRadius: '4px',
                                    color: '#ffffff',
                                    fontSize: '12px',
                                    fontFamily: 'monospace'
                                  }}
                                />
                              </div>
                            ))}
                          </div>

                          <div style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#8eff36',
                            marginBottom: '8px',
                            fontFamily: 'var(--stepn-font-body)'
                          }}>
                            🎯 Target (où regarde la caméra)
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {(['x', 'y', 'z'] as const).map((axis) => (
                              <div key={`target-${axis}`} style={{ flex: 1 }}>
                                <label style={{
                                  fontSize: '10px',
                                  color: '#a0a0a0',
                                  textTransform: 'uppercase',
                                  fontWeight: '600',
                                  display: 'block',
                                  marginBottom: '4px'
                                }}>
                                  {axis.toUpperCase()}
                                </label>
                                <input
                                  type="number"
                                  step="0.5"
                                  value={currentCameraTarget?.[axis] || 0}
                                  onChange={(e) => {
                                    const newTarget = { ...currentCameraTarget, [axis]: parseFloat(e.target.value) || 0 };
                                    setCurrentCameraTarget(newTarget as any);
                                    // Appliquer immédiatement
                                    window.dispatchEvent(new CustomEvent('goToCameraView', {
                                      detail: { position: currentCameraPosition, target: newTarget }
                                    }));
                                  }}
                                  style={{
                                    width: '100%',
                                    padding: '6px',
                                    backgroundColor: '#1a1a1a',
                                    border: '1px solid #3a3a3a',
                                    borderRadius: '4px',
                                    color: '#ffffff',
                                    fontSize: '12px',
                                    fontFamily: 'monospace'
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Boutons Annuler / Capturer */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => {
                              setCaptureMode(false);
                            }}
                            style={{
                              flex: 1,
                              padding: '12px',
                              backgroundColor: 'transparent',
                              border: '1px solid #3a3a3a',
                              borderRadius: '6px',
                              color: '#ffffff',
                              fontSize: '13px',
                              fontWeight: '500',
                              cursor: 'pointer',
                              fontFamily: 'var(--stepn-font-body)'
                            }}
                          >
                            Annuler
                          </button>
                          <button
                            onClick={() => {
                              setShowNameViewModal(true);
                            }}
                            style={{
                              flex: 1,
                              padding: '12px',
                              backgroundColor: '#8eff36',
                              border: 'none',
                            borderRadius: '6px',
                            color: '#000000',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontFamily: 'var(--stepn-font-body)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          <span>📸</span>
                          Capturer
                        </button>
                      </div>
                    </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '24px',
              borderTop: '1px solid #2a2a2a'
            }}>
              {!isCreating && (
                <button
                  onClick={openDeleteModal}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#ff4444',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    fontFamily: 'var(--stepn-font-body)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  Supprimer
                </button>
              )}
              {isCreating && <div />}
              <div style={{
                display: 'flex',
                gap: '12px'
              }}>
                <button
                  onClick={closeModal}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#2a2a2a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    fontFamily: 'var(--stepn-font-body)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#3a3a3a';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#2a2a2a';
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={isCreating ? createModel : saveModel}
                  disabled={loading || (isCreating && (!newModelName || !newModelFile))}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: loading || (isCreating && (!newModelName || !newModelFile)) ? '#4a4a4a' : '#8eff36',
                    border: 'none',
                    borderRadius: '8px',
                    color: loading || (isCreating && (!newModelName || !newModelFile)) ? '#a0a0a0' : '#000000',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: loading || (isCreating && (!newModelName || !newModelFile)) ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--stepn-font-body)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!loading && !(isCreating && (!newModelName || !newModelFile))) {
                      e.currentTarget.style.opacity = '0.9';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading && !(isCreating && (!newModelName || !newModelFile))) {
                      e.currentTarget.style.opacity = '1';
                    }
                  }}
                >
                  {loading ? 'Enregistrement...' : isCreating ? 'Créer' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Material Map Selector Modal */}
      {showMaterialMapSelector && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
          }}
          onClick={closeMaterialMapSelector}
        >
          <div
            style={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #2a2a2a',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '1200px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '24px',
              borderBottom: '1px solid #2a2a2a'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#ffffff',
                fontFamily: 'var(--stepn-font-body)',
                margin: 0
              }}>
                Sélectionner un material map pour "{selectedPartForMaterial}"
              </h2>
              <button
                onClick={closeMaterialMapSelector}
                style={{
                  padding: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#a0a0a0',
                  cursor: 'pointer',
                  fontSize: '20px',
                  transition: 'all 0.2s',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2a2a2a';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#a0a0a0';
                }}
              >
                ×
              </button>
            </div>

            {/* Content - Grid of Material Maps */}
            <div style={{
              padding: '24px',
              overflowY: 'auto',
              flex: 1
            }}>
              {materialMaps.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: '#a0a0a0',
                  fontFamily: 'var(--stepn-font-body)'
                }}>
                  Aucun material map disponible
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '24px'
                }}>
                  {/* Option: Aucun material */}
                  <div
                    style={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #2a2a2a',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      transition: 'all 0.2s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#8eff36';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#2a2a2a';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                    onClick={() => selectMaterialMap('', 'Aucun material')}
                  >
                    <div style={{
                      width: '100%',
                      aspectRatio: '1',
                      backgroundColor: '#0a0a0a',
                      borderBottom: '1px solid #2a2a2a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#4a4a4a',
                      fontSize: '48px'
                    }}>
                      □
                    </div>
                    <div style={{ padding: '16px' }}>
                      <h3 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#ffffff',
                        marginBottom: '0',
                        fontFamily: 'var(--stepn-font-body)'
                      }}>
                        Aucun material
                      </h3>
                    </div>
                  </div>

                  {/* Material Maps */}
                  {materialMaps.map((map: any) => {
                    const files = map.material_map_files || [];
                    const diffuseFile = files.find((f: any) => f.map_type === 'diffuse');
                    const normalFile = files.find((f: any) => f.map_type === 'normal');
                    const roughnessFile = files.find((f: any) => f.map_type === 'roughness');
                    const metallicFile = files.find((f: any) => f.map_type === 'metallic');
                    const aoFile = files.find((f: any) => f.map_type === 'ao');

                    return (
                      <div
                        key={map.id}
                        style={{
                          backgroundColor: '#1a1a1a',
                          border: '1px solid #2a2a2a',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          transition: 'all 0.2s',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#8eff36';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#2a2a2a';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                        onClick={() => selectMaterialMap(map.id, map.name)}
                      >
                        {/* Preview 3D Static */}
                        <div style={{
                          width: '100%',
                          aspectRatio: '1',
                          backgroundColor: '#0a0a0a',
                          borderBottom: '1px solid #2a2a2a',
                          position: 'relative',
                          overflow: 'hidden'
                        }}>
                          <MaterialMapPreview3DStatic
                            diffuseUrl={diffuseFile?.file_url || null}
                            normalUrl={normalFile?.file_url || null}
                            roughnessUrl={roughnessFile?.file_url || null}
                            metallicUrl={metallicFile?.file_url || null}
                            aoUrl={aoFile?.file_url || null}
                            style={{ width: '100%', height: '100%' }}
                          />
                        </div>
                        
                        {/* Info */}
                        <div style={{ padding: '16px' }}>
                          <h3 style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#ffffff',
                            marginBottom: '12px',
                            fontFamily: 'var(--stepn-font-body)'
                          }}>
                            {map.name}
                          </h3>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={deleteModel}
        title={selectedModel ? `Êtes-vous sûr de vouloir supprimer "${selectedModel.name}" ?` : ""}
        message="Cette action est irréversible."
      />

      {/* Modal: Nommer une nouvelle vue */}
      {showNameViewModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            backgroundColor: '#1a1a1a',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            border: '1px solid #2a2a2a',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#ffffff',
              fontFamily: 'var(--stepn-font-body)',
              margin: 0,
              marginBottom: '24px'
            }}>
              📷 Nommer la vue
            </h3>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                color: '#a0a0a0',
                fontFamily: 'var(--stepn-font-body)',
                marginBottom: '8px'
              }}>
                Nom de la vue
              </label>
              <input
                type="text"
                value={newViewName}
                onChange={(e) => setNewViewName(e.target.value)}
                placeholder="Ex: Manche gauche, Col devant..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newViewName.trim()) {
                    const newView: CameraView = {
                      id: `view-${Date.now()}`,
                      name: newViewName.trim(),
                      position: currentCameraPosition,
                      target: currentCameraTarget,
                      isDefault: false
                    };
                    setCameraViews([...cameraViews, newView]);
                    setNewViewName('');
                    setShowNameViewModal(false);
                    setCaptureMode(false);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontFamily: 'var(--stepn-font-body)',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{
              fontSize: '11px',
              color: '#666',
              fontFamily: 'monospace',
              backgroundColor: '#0a0a0a',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '24px'
            }}>
              <div>Position: X:{currentCameraPosition.x} Y:{currentCameraPosition.y} Z:{currentCameraPosition.z}</div>
              <div>Target: X:{currentCameraTarget.x} Y:{currentCameraTarget.y} Z:{currentCameraTarget.z}</div>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setNewViewName('');
                  setShowNameViewModal(false);
                  setCaptureMode(false);
                }}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'transparent',
                  border: '1px solid #3a3a3a',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'var(--stepn-font-body)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (newViewName.trim()) {
                    const newView: CameraView = {
                      id: `view-${Date.now()}`,
                      name: newViewName.trim(),
                      position: currentCameraPosition,
                      target: currentCameraTarget,
                      isDefault: false
                    };
                    setCameraViews([...cameraViews, newView]);
                    setNewViewName('');
                    setShowNameViewModal(false);
                    setCaptureMode(false);
                  }
                }}
                disabled={!newViewName.trim()}
                style={{
                  padding: '12px 24px',
                  backgroundColor: newViewName.trim() ? '#8eff36' : '#2a2a2a',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'var(--stepn-font-body)',
                  color: newViewName.trim() ? '#000000' : '#666',
                  cursor: newViewName.trim() ? 'pointer' : 'not-allowed',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                }}
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
