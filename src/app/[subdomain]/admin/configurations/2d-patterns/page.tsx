"use client";

import { useEffect, useState } from "react";
import { parseSVGPieces } from "@/utils/sizePatternGenerator";

type SizePattern = {
  id: string;
  name: string;
  model3dId: string;
  uvType: "UV0" | "UV2";
  files: Array<{
    id: string;
    size: string;
    svgUrl: string;
    metadata?: any;
  }>;
};

type Model3D = {
  id: string;
  name: string;
};

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

export default function PatternsConfigPage() {
  const [patterns, setPatterns] = useState<SizePattern[]>([]);
  const [models, setModels] = useState<Model3D[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState<SizePattern | null>(null);
  const [editingPattern, setEditingPattern] = useState<{
    model3dId: string;
    name: string;
    description: string;
    uvType: "UV0" | "UV2";
  } | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchModels();
    fetchPatterns();
  }, []);

  async function fetchModels() {
    try {
      const res = await fetch("/api/models");
      const data = await res.json();
      setModels(data);
    } catch (error) {
      console.error("Error fetching models:", error);
    }
  }

  async function fetchPatterns() {
    try {
      const res = await fetch("/api/size-patterns");
      if (!res.ok) throw new Error("Failed to fetch patterns");
      const data = await res.json();
      setPatterns(data);
    } catch (error) {
      console.error("Error fetching patterns:", error);
    }
  }

  async function createPattern() {
    if (!editingPattern || !editingPattern.model3dId || !editingPattern.name) {
      alert("Veuillez remplir tous les champs");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/size-patterns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model3dId: editingPattern.model3dId,
          name: editingPattern.name,
          description: editingPattern.description,
          uvType: editingPattern.uvType,
        }),
      });

      if (!res.ok) throw new Error("Failed to create pattern");
      const data = await res.json();
      
      const newPattern: SizePattern = {
        id: data.id,
        name: editingPattern.name,
        model3dId: editingPattern.model3dId,
        uvType: editingPattern.uvType,
        files: [],
      };
      
      setPatterns((prev) => [...prev, newPattern]);
      setSelectedPattern(newPattern);
      setEditingPattern(null);
      await fetchPatterns(); // Recharger la liste
    } catch (error) {
      console.error("Error creating pattern:", error);
      alert("Erreur lors de la création du pattern");
    } finally {
      setLoading(false);
    }
  }

  async function uploadPatternFile(patternId: string, size: string, file: File) {
    setUploadingFiles((prev) => ({ ...prev, [`${patternId}-${size}`]: true }));
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("patternId", patternId);
      formData.append("size", size);

      const res = await fetch("/api/size-patterns/upload-file", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to upload file");
      const data = await res.json();

      setPatterns((prev) =>
        prev.map((p) => {
          if (p.id === patternId) {
            const existingFile = p.files.find((f) => f.size === size);
            if (existingFile) {
              return {
                ...p,
                files: p.files.map((f) =>
                  f.size === size ? { ...f, svgUrl: data.url } : f
                ),
              };
            } else {
              return {
                ...p,
                files: [...p.files, { id: data.id || "", size, svgUrl: data.url }],
              };
            }
          }
          return p;
        })
      );

      await fetchPatterns();
    } catch (error) {
      console.error("Error uploading file:", error);
      alert(`Erreur lors de l'upload du fichier pour la taille ${size}`);
    } finally {
      setUploadingFiles((prev) => {
        const newState = { ...prev };
        delete newState[`${patternId}-${size}`];
        return newState;
      });
    }
  }

  return (
    <div style={{ fontFamily: 'var(--stepn-font-body)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffffff', marginBottom: '8px' }}>
            2D Patterns
          </h2>
          <p style={{ fontSize: '14px', color: '#a0a0a0' }}>
            Gérez les patrons multi-tailles pour la génération d'UV maps
          </p>
        </div>
        <button
          onClick={() =>
            setEditingPattern({
              model3dId: "",
              name: "",
              description: "",
              uvType: "UV0",
            })
          }
          style={{
            padding: '12px 24px',
            backgroundColor: '#8eff36',
            color: '#000000',
            border: 'none',
            borderRadius: '4px',
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
          Nouveau Pattern
        </button>
      </div>

      {/* Formulaire de création */}
      {editingPattern && (
        <div style={{
          backgroundColor: '#1a1a1a',
          border: '1px solid #2a2a2a',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '32px'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', marginBottom: '16px' }}>
            Créer un nouveau pattern
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#ffffff', marginBottom: '8px' }}>
                Modèle 3D
              </label>
              <select
                value={editingPattern.model3dId}
                onChange={(e) =>
                  setEditingPattern({ ...editingPattern, model3dId: e.target.value })
                }
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '4px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontFamily: 'var(--stepn-font-body)'
                }}
              >
                <option value="">Sélectionner un modèle</option>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#ffffff', marginBottom: '8px' }}>
                Nom du pattern
              </label>
              <input
                type="text"
                value={editingPattern.name}
                onChange={(e) =>
                  setEditingPattern({ ...editingPattern, name: e.target.value })
                }
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '4px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontFamily: 'var(--stepn-font-body)'
                }}
                placeholder="Maillot Standard - UV0"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#ffffff', marginBottom: '8px' }}>
                Description
              </label>
              <textarea
                value={editingPattern.description}
                onChange={(e) =>
                  setEditingPattern({ ...editingPattern, description: e.target.value })
                }
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '4px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontFamily: 'var(--stepn-font-body)',
                  minHeight: '80px',
                  resize: 'vertical'
                }}
                rows={3}
                placeholder="Pattern pour les designs (UV0)"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#ffffff', marginBottom: '8px' }}>
                Type d'UV
              </label>
              <select
                value={editingPattern.uvType}
                onChange={(e) =>
                  setEditingPattern({
                    ...editingPattern,
                    uvType: e.target.value as "UV0" | "UV2",
                  })
                }
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '4px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontFamily: 'var(--stepn-font-body)'
                }}
              >
                <option value="UV0">UV0 (Designs)</option>
                <option value="UV2">UV2 (Logos)</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={createPattern}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  backgroundColor: loading ? '#4a4a4a' : '#8eff36',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--stepn-font-body)',
                  opacity: loading ? 0.5 : 1
                }}
              >
                {loading ? "Création..." : "Créer"}
              </button>
              <button
                onClick={() => setEditingPattern(null)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#2a2a2a',
                  color: '#ffffff',
                  border: '1px solid #2a2a2a',
                  borderRadius: '4px',
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
            </div>
          </div>
        </div>
      )}

      {/* Liste des patterns */}
      <div style={{
        backgroundColor: '#1a1a1a',
        border: '1px solid #2a2a2a',
        borderRadius: '8px',
        padding: '24px'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', marginBottom: '16px' }}>
          Patterns existants ({patterns.length})
        </h3>

        {patterns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#a0a0a0' }}>
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>Aucun pattern pour le moment</p>
            <p style={{ fontSize: '14px' }}>
              Créez un nouveau pattern pour commencer
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {patterns.map((pattern) => {
              const model = models.find((m) => m.id === pattern.model3dId);
              return (
                <div
                  key={pattern.id}
                  style={{
                    border: '1px solid #2a2a2a',
                    borderRadius: '8px',
                    padding: '16px',
                    backgroundColor: '#1a1a1a',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#222222';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#1a1a1a';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div>
                      <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>
                        {pattern.name}
                      </h4>
                      <p style={{ fontSize: '14px', color: '#a0a0a0' }}>
                        Modèle: {model?.name || "Inconnu"} • Type: {pattern.uvType}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setSelectedPattern(
                          selectedPattern?.id === pattern.id ? null : pattern
                        )
                      }
                      style={{
                        padding: '8px 16px',
                        color: '#8eff36',
                        backgroundColor: 'transparent',
                        border: '1px solid #2a2a2a',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontFamily: 'var(--stepn-font-body)',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#2a2a2a';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {selectedPattern?.id === pattern.id ? "▼ Masquer" : "▶ Afficher"}
                    </button>
                  </div>

                  {selectedPattern?.id === pattern.id && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #2a2a2a' }}>
                      <h5 style={{ fontSize: '14px', fontWeight: '500', color: '#ffffff', marginBottom: '12px' }}>
                        Fichiers SVG par taille
                      </h5>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                        gap: '12px'
                      }}>
                        {SIZES.map((size) => {
                          const file = pattern.files.find((f) => f.size === size);
                          const isUploading = uploadingFiles[`${pattern.id}-${size}`];

                          return (
                            <div
                              key={size}
                              style={{
                                border: '1px solid #2a2a2a',
                                borderRadius: '8px',
                                padding: '12px',
                                backgroundColor: '#1a1a1a'
                              }}
                            >
                              <div style={{ fontSize: '12px', fontWeight: '500', color: '#ffffff', marginBottom: '8px' }}>
                                Taille {size}
                              </div>
                              {file ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  <a
                                    href={file.svgUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      fontSize: '11px',
                                      color: '#8eff36',
                                      textDecoration: 'none',
                                      fontFamily: 'var(--stepn-font-body)'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.textDecoration = 'underline';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.textDecoration = 'none';
                                    }}
                                  >
                                    Voir SVG
                                  </a>
                                  {file.metadata?.pieces && (
                                    <div style={{ fontSize: '11px', color: '#a0a0a0' }}>
                                      {file.metadata.pieces.length} pièce(s)
                                    </div>
                                  )}
                                  <label style={{ display: 'block' }}>
                                    <span style={{
                                      fontSize: '11px',
                                      color: '#a0a0a0',
                                      cursor: 'pointer',
                                      fontFamily: 'var(--stepn-font-body)'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.color = '#8eff36';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.color = '#a0a0a0';
                                    }}>
                                      Remplacer
                                    </span>
                                    <input
                                      type="file"
                                      accept=".svg"
                                      style={{ display: 'none' }}
                                      onChange={(e) => {
                                        const newFile = e.target.files?.[0];
                                        if (newFile) {
                                          uploadPatternFile(pattern.id, size, newFile);
                                        }
                                      }}
                                    />
                                  </label>
                                </div>
                              ) : (
                                <label style={{ display: 'block' }}>
                                  <div style={{
                                    border: '2px dashed #2a2a2a',
                                    borderRadius: '4px',
                                    padding: '16px',
                                    textAlign: 'center',
                                    cursor: isUploading ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    opacity: isUploading ? 0.5 : 1
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!isUploading) {
                                      e.currentTarget.style.borderColor = '#8eff36';
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!isUploading) {
                                      e.currentTarget.style.borderColor = '#2a2a2a';
                                    }
                                  }}>
                                    {isUploading ? (
                                      <div style={{ fontSize: '11px', color: '#a0a0a0' }}>
                                        Upload...
                                      </div>
                                    ) : (
                                      <div style={{ fontSize: '11px', color: '#a0a0a0' }}>
                                        Upload SVG
                                      </div>
                                    )}
                                  </div>
                                  <input
                                    type="file"
                                    accept=".svg"
                                    style={{ display: 'none' }}
                                    onChange={(e) => {
                                      const newFile = e.target.files?.[0];
                                      if (newFile) {
                                        uploadPatternFile(pattern.id, size, newFile);
                                      }
                                    }}
                                    disabled={isUploading}
                                  />
                                </label>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

