"use client";

import { useEffect, useState } from "react";

type Model3D = {
  id: string;
  name: string;
  glbUrl: string;
  createdAt: string;
  materialsSchema?: any;
};

type ModelPart = {
  name: string;
  materialId: string | null;
  materialName: string;
};

export default function ModelsConfigPage() {
  const [models, setModels] = useState<Model3D[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model3D | null>(null);
  const [modelParts, setModelParts] = useState<ModelPart[]>([]);
  const [materialMaps, setMaterialMaps] = useState<Array<{id: string; name: string}>>([]);

  useEffect(() => {
    fetchModels();
    fetchMaterialMaps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedModel) {
      // Extract model parts from materialsSchema or use defaults
      const parts: ModelPart[] = [
        { name: "Front", materialId: null, materialName: "Cotton White" },
        { name: "Back", materialId: null, materialName: "Cotton White" },
        { name: "Sleeves", materialId: null, materialName: "Cotton White" },
        { name: "Collar", materialId: null, materialName: "Cotton White" },
      ];
      setModelParts(parts);
    }
  }, [selectedModel]);

  async function fetchModels() {
    try {
      const res = await fetch("/api/models");
      const data = await res.json();
      setModels(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching models:", error);
    }
  }

  async function fetchMaterialMaps() {
    try {
      // TODO: Fetch from API when available
      setMaterialMaps([
        { id: '1', name: 'Cotton White' },
        { id: '2', name: 'Cotton Black' },
        { id: '3', name: 'Polyester' },
      ]);
    } catch (error) {
      console.error("Error fetching material maps:", error);
    }
  }

  function openModal(model: Model3D) {
    setSelectedModel(model);
  }

  function closeModal() {
    setSelectedModel(null);
    setModelParts([]);
  }

  function changeMaterial(partName: string) {
    // TODO: Open material selection modal
    alert(`Changer le material pour ${partName}`);
  }

  async function saveModel() {
    if (!selectedModel) return;
    // TODO: Save material assignments
    alert('Enregistrement...');
    closeModal();
  }

  async function deleteModel() {
    if (!selectedModel) return;
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${selectedModel.name}" ?`)) return;
    
    try {
      const res = await fetch(`/api/models?id=${encodeURIComponent(selectedModel.id)}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete");
      await fetchModels();
      closeModal();
    } catch (error) {
      console.error("Error deleting model:", error);
      alert("Erreur lors de la suppression");
    }
  }

  const filteredModels = models.filter((model) =>
    model.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          onClick={() => window.location.href = '/admin/models'}
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
      {filteredModels.length === 0 ? (
        <div style={{
          border: '2px dashed #2a2a2a',
          borderRadius: '8px',
          padding: '64px 32px',
          textAlign: 'center',
          color: '#a0a0a0'
        }}>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>Aucun modèle 3D</p>
          <p style={{ fontSize: '14px' }}>
            {searchQuery ? 'Aucun résultat pour votre recherche' : 'Ajoutez votre premier modèle 3D pour commencer'}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '24px'
        }}>
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
      )}

      {/* Material Mapping Modal */}
      {selectedModel && (
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
                {selectedModel.name} - Material Mapping
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
              {/* Left: 3D Preview */}
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
                  Prévisualisation 3D
                </h3>
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
                  Parties du modèle
                </h3>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  {modelParts.map((part) => (
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
                        gap: '12px'
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
                          fontFamily: 'var(--stepn-font-body)'
                        }}>
                          {part.name}
                        </span>
                        <span style={{
                          fontSize: '14px',
                          color: '#a0a0a0',
                          fontFamily: 'var(--stepn-font-body)'
                        }}>
                          {part.materialName}
                        </span>
                      </div>
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
                        Changer
                      </button>
                    </div>
                  ))}
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
                  onClick={saveModel}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#8eff36',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#000000',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    fontFamily: 'var(--stepn-font-body)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
