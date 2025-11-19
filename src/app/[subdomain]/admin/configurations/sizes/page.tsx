"use client";

import { useEffect, useState, useRef } from "react";

type SizePattern = {
  id: string;
  name: string;
  model3dId: string;
  uvType: "UV0" | "UV2";
  description?: string;
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

export default function SizesConfigPage() {
  const [patterns, setPatterns] = useState<SizePattern[]>([]);
  const [models, setModels] = useState<Model3D[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPatterns, setExpandedPatterns] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [editingPattern, setEditingPattern] = useState<SizePattern | null>(null);
  const [newPattern, setNewPattern] = useState<{
    model3dId: string;
    name: string;
    description: string;
    uvType: "UV0" | "UV2";
  }>({
    model3dId: "",
    name: "",
    description: "",
    uvType: "UV0",
  });
  const [uploadingSize, setUploadingSize] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  useEffect(() => {
    fetchModels();
    fetchPatterns();
  }, []);

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

  async function fetchPatterns() {
    try {
      const res = await fetch("/api/size-patterns");
      if (!res.ok) throw new Error("Failed to fetch patterns");
      const data = await res.json();
      setPatterns(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching patterns:", error);
    }
  }

  async function createPattern() {
    if (!newPattern.model3dId || !newPattern.name) {
      alert("Veuillez remplir le nom et sélectionner un modèle 3D");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/size-patterns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model3dId: newPattern.model3dId,
          name: newPattern.name,
          description: newPattern.description,
          uvType: newPattern.uvType,
        }),
      });

      if (!res.ok) throw new Error("Failed to create pattern");
      
      await fetchPatterns();
      setNewPattern({
        model3dId: "",
        name: "",
        description: "",
        uvType: "UV0",
      });
      setEditingPattern(null);
    } catch (error) {
      console.error("Error creating pattern:", error);
      alert("Erreur lors de la création du groupe de tailles");
    } finally {
      setLoading(false);
    }
  }

  async function updatePattern() {
    if (!editingPattern || !editingPattern.model3dId || !editingPattern.name) {
      alert("Veuillez remplir le nom et sélectionner un modèle 3D");
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
          description: editingPattern.description || "",
          uvType: editingPattern.uvType,
        }),
      });

      if (!res.ok) throw new Error("Failed to update pattern");
      
      await fetchPatterns();
      setEditingPattern(null);
    } catch (error) {
      console.error("Error updating pattern:", error);
      alert("Erreur lors de la mise à jour du groupe de tailles");
    } finally {
      setLoading(false);
    }
  }

  async function deletePattern(patternId: string) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce groupe de tailles ?")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/size-patterns?id=${encodeURIComponent(patternId)}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete pattern");
      
      await fetchPatterns();
    } catch (error) {
      console.error("Error deleting pattern:", error);
      alert("Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  }

  async function uploadFile(patternId: string, size: string, file: File) {
    setUploadingSize(size);
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
      
      await fetchPatterns();
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Erreur lors de l'upload du fichier");
    } finally {
      setUploadingSize(null);
    }
  }

  async function deleteFile(patternId: string, fileId: string) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce fichier ?")) return;

    setLoading(true);
    try {
      // TODO: Implémenter l'API DELETE pour les fichiers
      // Pour l'instant, on peut juste mettre à jour le pattern sans ce fichier
      await fetchPatterns();
    } catch (error) {
      console.error("Error deleting file:", error);
      alert("Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  }

  const togglePattern = (patternId: string) => {
    const newExpanded = new Set(expandedPatterns);
    if (newExpanded.has(patternId)) {
      newExpanded.delete(patternId);
    } else {
      newExpanded.add(patternId);
    }
    setExpandedPatterns(newExpanded);
  };

  const filteredPatterns = patterns.filter((pattern) =>
    pattern.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isCreating = editingPattern === null && (newPattern.name || newPattern.model3dId);
  const showModal = editingPattern !== null || isCreating;

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
            placeholder="Rechercher un groupe de tailles..."
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
          onClick={() => {
            setNewPattern({
              model3dId: "",
              name: "",
              description: "",
              uvType: "UV0",
            });
            setEditingPattern(null);
          }}
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
          Nouveau groupe de tailles
        </button>
      </div>

      {/* Pattern Groups List */}
      {filteredPatterns.length === 0 ? (
        <div style={{
          border: '2px dashed #2a2a2a',
          borderRadius: '8px',
          padding: '64px 32px',
          textAlign: 'center',
          color: '#a0a0a0'
        }}>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>Aucun groupe de tailles</p>
          <p style={{ fontSize: '14px' }}>
            {searchQuery ? 'Aucun résultat pour votre recherche' : 'Créez votre premier groupe de tailles pour commencer'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredPatterns.map((pattern) => {
            const isExpanded = expandedPatterns.has(pattern.id);
            const model = models.find((m) => m.id === pattern.model3dId);
            const fileCount = pattern.files.length;

            return (
              <div
                key={pattern.id}
                style={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => togglePattern(pattern.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#222222';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#1a1a1a';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <span style={{
                      color: isExpanded ? '#8eff36' : '#a0a0a0',
                      fontSize: '12px',
                      transition: 'transform 0.2s',
                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                    }}>
                      ▶
                    </span>
                    <span style={{
                      color: isExpanded ? '#8eff36' : '#ffffff',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      ✓
                    </span>
                    <div>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#ffffff',
                        marginBottom: '4px',
                        fontFamily: 'var(--stepn-font-body)'
                      }}>
                        {pattern.name}
                      </h3>
                      <p style={{
                        fontSize: '12px',
                        color: '#a0a0a0',
                        fontFamily: 'var(--stepn-font-body)'
                      }}>
                        {fileCount} taille{fileCount > 1 ? 's' : ''} • {model?.name || 'Modèle inconnu'} • {pattern.uvType}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingPattern(pattern);
                      setNewPattern({
                        model3dId: "",
                        name: "",
                        description: "",
                        uvType: "UV0",
                      });
                    }}
                    style={{
                      padding: '8px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#a0a0a0',
                      cursor: 'pointer',
                      fontSize: '16px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#8eff36';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#a0a0a0';
                    }}
                  >
                    ✎
                  </button>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div style={{
                    borderTop: '1px solid #2a2a2a',
                    padding: '16px',
                    backgroundColor: '#0a0a0a'
                  }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '14px',
                      fontFamily: 'var(--stepn-font-body)'
                    }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #2a2a2a' }}>
                          <th style={{
                            textAlign: 'left',
                            padding: '12px',
                            color: '#a0a0a0',
                            fontWeight: '500',
                            fontSize: '12px'
                          }}>Taille</th>
                          <th style={{
                            textAlign: 'left',
                            padding: '12px',
                            color: '#a0a0a0',
                            fontWeight: '500',
                            fontSize: '12px'
                          }}>Fichier SVG</th>
                          <th style={{
                            textAlign: 'left',
                            padding: '12px',
                            color: '#a0a0a0',
                            fontWeight: '500',
                            fontSize: '12px'
                          }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {SIZES.map((size) => {
                          const file = pattern.files.find((f) => f.size === size);
                          const fileKey = `${pattern.id}-${size}`;
                          const isUploading = uploadingSize === size;

                          return (
                            <tr key={size} style={{ borderBottom: '1px solid #1a1a1a' }}>
                              <td style={{ padding: '12px', color: '#ffffff', fontWeight: '500' }}>{size}</td>
                              <td style={{ padding: '12px' }}>
                                {file ? (
                                  <a
                                    href={file.svgUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      color: '#8eff36',
                                      textDecoration: 'none',
                                      fontSize: '12px'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.textDecoration = 'underline';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.textDecoration = 'none';
                                    }}
                                  >
                                    Voir fichier SVG
                                  </a>
                                ) : (
                                  <span style={{ color: '#a0a0a0', fontSize: '12px' }}>-</span>
                                )}
                              </td>
                              <td style={{ padding: '12px' }}>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <input
                                    ref={(el) => {
                                      fileInputRefs.current[fileKey] = el;
                                    }}
                                    type="file"
                                    accept=".svg"
                                    style={{ display: 'none' }}
                                    onChange={(e) => {
                                      const selectedFile = e.target.files?.[0];
                                      if (selectedFile) {
                                        uploadFile(pattern.id, size, selectedFile);
                                      }
                                    }}
                                  />
                                  <button
                                    onClick={() => {
                                      fileInputRefs.current[fileKey]?.click();
                                    }}
                                    disabled={isUploading}
                                    style={{
                                      padding: '6px 12px',
                                      backgroundColor: isUploading ? '#3a3a3a' : '#2a2a2a',
                                      border: '1px solid #2a2a2a',
                                      borderRadius: '4px',
                                      color: isUploading ? '#8eff36' : '#ffffff',
                                      fontSize: '12px',
                                      cursor: isUploading ? 'not-allowed' : 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!isUploading) {
                                        e.currentTarget.style.backgroundColor = '#3a3a3a';
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!isUploading) {
                                        e.currentTarget.style.backgroundColor = '#2a2a2a';
                                      }
                                    }}
                                  >
                                    {isUploading ? 'Upload...' : file ? 'Remplacer' : 'Upload'}
                                  </button>
                                  {file && (
                                    <button
                                      onClick={() => deleteFile(pattern.id, file.id)}
                                      style={{
                                        padding: '6px',
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        color: '#a0a0a0',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        transition: 'all 0.2s'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.color = '#ff4444';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.color = '#a0a0a0';
                                      }}
                                    >
                                      ×
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
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
            zIndex: 10000,
            padding: '20px'
          }}
          onClick={() => {
            setEditingPattern(null);
            setNewPattern({
              model3dId: "",
              name: "",
              description: "",
              uvType: "UV0",
            });
          }}
        >
          <div
            style={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #2a2a2a',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '600px',
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
                {editingPattern ? 'Modifier le groupe de tailles' : 'Nouveau groupe de tailles'}
              </h2>
              <button
                onClick={() => {
                  setEditingPattern(null);
                  setNewPattern({
                    model3dId: "",
                    name: "",
                    description: "",
                    uvType: "UV0",
                  });
                }}
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
              padding: '24px',
              overflowY: 'auto',
              flex: 1
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    color: '#ffffff',
                    marginBottom: '8px',
                    fontFamily: 'var(--stepn-font-body)'
                  }}>
                    Nom du groupe
                  </label>
                  <input
                    type="text"
                    value={editingPattern ? editingPattern.name : newPattern.name}
                    onChange={(e) => {
                      if (editingPattern) {
                        setEditingPattern({ ...editingPattern, name: e.target.value });
                      } else {
                        setNewPattern({ ...newPattern, name: e.target.value });
                      }
                    }}
                    placeholder="Ex: Maillot Standard"
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
                    Modèle 3D
                  </label>
                  <select
                    value={editingPattern ? editingPattern.model3dId : newPattern.model3dId}
                    onChange={(e) => {
                      if (editingPattern) {
                        setEditingPattern({ ...editingPattern, model3dId: e.target.value });
                      } else {
                        setNewPattern({ ...newPattern, model3dId: e.target.value });
                      }
                    }}
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
                  >
                    <option value="">Sélectionner un modèle 3D</option>
                    {models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    color: '#ffffff',
                    marginBottom: '8px',
                    fontFamily: 'var(--stepn-font-body)'
                  }}>
                    Type UV
                  </label>
                  <select
                    value={editingPattern ? editingPattern.uvType : newPattern.uvType}
                    onChange={(e) => {
                      if (editingPattern) {
                        setEditingPattern({ ...editingPattern, uvType: e.target.value as "UV0" | "UV2" });
                      } else {
                        setNewPattern({ ...newPattern, uvType: e.target.value as "UV0" | "UV2" });
                      }
                    }}
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
                  >
                    <option value="UV0">UV0 (Designs)</option>
                    <option value="UV2">UV2 (Logos)</option>
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    color: '#ffffff',
                    marginBottom: '8px',
                    fontFamily: 'var(--stepn-font-body)'
                  }}>
                    Description (optionnel)
                  </label>
                  <textarea
                    value={editingPattern ? editingPattern.description || "" : newPattern.description}
                    onChange={(e) => {
                      if (editingPattern) {
                        setEditingPattern({ ...editingPattern, description: e.target.value });
                      } else {
                        setNewPattern({ ...newPattern, description: e.target.value });
                      }
                    }}
                    placeholder="Description du groupe de tailles..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: '#0a0a0a',
                      border: '1px solid #2a2a2a',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontFamily: 'var(--stepn-font-body)',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '24px',
              borderTop: '1px solid #2a2a2a'
            }}>
              {editingPattern && (
                <button
                  onClick={() => deletePattern(editingPattern.id)}
                  disabled={loading}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: loading ? '#4a4a4a' : '#ff4444',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--stepn-font-body)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.opacity = '0.9';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.currentTarget.style.opacity = '1';
                    }
                  }}
                >
                  Supprimer
                </button>
              )}
              <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto' }}>
                <button
                  onClick={() => {
                    setEditingPattern(null);
                    setNewPattern({
                      model3dId: "",
                      name: "",
                      description: "",
                      uvType: "UV0",
                    });
                  }}
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
                  onClick={editingPattern ? updatePattern : createPattern}
                  disabled={loading || (!editingPattern && (!newPattern.name || !newPattern.model3dId)) || (editingPattern && (!editingPattern.name || !editingPattern.model3dId))}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: loading || (!editingPattern && (!newPattern.name || !newPattern.model3dId)) || (editingPattern && (!editingPattern.name || !editingPattern.model3dId)) ? '#4a4a4a' : '#8eff36',
                    border: 'none',
                    borderRadius: '8px',
                    color: loading || (!editingPattern && (!newPattern.name || !newPattern.model3dId)) || (editingPattern && (!editingPattern.name || !editingPattern.model3dId)) ? '#a0a0a0' : '#000000',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: loading || (!editingPattern && (!newPattern.name || !newPattern.model3dId)) || (editingPattern && (!editingPattern.name || !editingPattern.model3dId)) ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--stepn-font-body)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!loading && ((editingPattern && editingPattern.name && editingPattern.model3dId) || (!editingPattern && newPattern.name && newPattern.model3dId))) {
                      e.currentTarget.style.opacity = '0.9';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading && ((editingPattern && editingPattern.name && editingPattern.model3dId) || (!editingPattern && newPattern.name && newPattern.model3dId))) {
                      e.currentTarget.style.opacity = '1';
                    }
                  }}
                >
                  {loading ? 'Enregistrement...' : editingPattern ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
