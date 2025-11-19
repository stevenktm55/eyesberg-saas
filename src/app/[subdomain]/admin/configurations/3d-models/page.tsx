"use client";

import { useEffect, useState, useRef } from "react";

type Model3D = {
  id: string;
  name: string;
  glbUrl: string;
  createdAt: string;
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

export default function ModelsConfigPage() {
  const [models, setModels] = useState<Model3D[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model3D | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [modelParts, setModelParts] = useState<ModelPart[]>([]);
  const [detectedMaterials, setDetectedMaterials] = useState<DetectedMaterial[]>([]);
  const [materialMaps, setMaterialMaps] = useState<Array<{id: string; name: string}>>([]);
  const [newModelName, setNewModelName] = useState("");
  const [newModelFile, setNewModelFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchModels();
    fetchMaterialMaps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedModel && !isCreating) {
      // Extract model parts from the model data
      const parts: ModelPart[] = (selectedModel as any).model_parts?.map((part: any) => ({
        id: part.id,
        name: part.name,
        materialId: part.material_map_id,
        materialName: part.material_maps?.name || "Aucun material",
      })) || [];
      setModelParts(parts);
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
      setMaterialMaps(Array.isArray(data) ? data.map((m: any) => ({ id: m.id, name: m.name })) : []);
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

    // Créer un modal de sélection simple
    const options = materialMaps.map(m => m.name).join('\n');
    const materialName = prompt(
      `Choisir un material pour ${partName}:\n\n${options}\n\nEntrez le nom du material:`
    );

    if (materialName) {
      const selectedMaterial = materialMaps.find(m => m.name === materialName);
      if (selectedMaterial) {
        setModelParts(prev => prev.map(p => 
          p.name === partName 
            ? { ...p, materialId: selectedMaterial.id, materialName: selectedMaterial.name }
            : p
        ));
      }
    }
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
      
      await fetchModels();
      closeModal();
    } catch (error) {
      console.error("Error saving model:", error);
      alert("Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  }

  async function deleteModel() {
    if (!selectedModel) return;
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${selectedModel.name}" ?`)) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/models-3d?id=${encodeURIComponent(selectedModel.id)}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete");
      await fetchModels();
      closeModal();
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
          <span>+</span>
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
            {/* Preview Placeholder */}
            <div style={{
              width: '100%',
              aspectRatio: '1',
              backgroundColor: '#0a0a0a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderBottom: '1px solid #2a2a2a'
            }}>
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
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '24px',
              borderBottom: '1px solid #2a2a2a'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#ffffff',
                fontFamily: 'var(--stepn-font-body)'
              }}>
                {isCreating ? 'Nouveau modèle 3D' : `${selectedModel?.name} - Material Mapping`}
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

            {/* Content */}
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
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '400px'
                    }}>
                      <div style={{
                        width: '120px',
                        height: '120px',
                        border: '2px solid #8eff36',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#8eff36',
                        fontSize: '48px'
                      }}>
                        □
                      </div>
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
                          <div style={{
                            width: '40px',
                            height: '24px',
                            backgroundColor: '#4a4a4a',
                            borderRadius: '4px',
                            border: '1px solid #2a2a2a'
                          }} />
                          <span style={{
                            fontSize: '14px',
                            color: '#ffffff',
                            fontFamily: 'var(--stepn-font-body)',
                            fontWeight: '500'
                          }}>
                            {part.name}
                          </span>
                          {!isCreating && (
                            <span style={{
                              fontSize: '14px',
                              color: '#a0a0a0',
                              fontFamily: 'var(--stepn-font-body)'
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
                  onClick={deleteModel}
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
    </div>
  );
}
