"use client";

import { useEffect, useState, useRef } from "react";
import { Design2DPreviewStatic } from "@/components/Design2DPreviewStatic";

type Design2D = {
  id: string;
  name: string;
  svg_url?: string;
  svgUrl?: string; // Fallback pour compatibilité
  format?: string;
  createdAt?: string;
  created_at?: string;
};

export default function Designs2DConfigPage() {
  const [designs, setDesigns] = useState<Design2D[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState<Design2D | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newDesignName, setNewDesignName] = useState("");
  const [newDesignFile, setNewDesignFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDesigns();
  }, []);

  async function fetchDesigns() {
    try {
      const res = await fetch("/api/designs-2d");
      if (!res.ok) throw new Error("Failed to fetch designs");
      const data = await res.json();
      setDesigns(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching designs:", error);
    }
  }

  function openModal(design: Design2D) {
    setSelectedDesign(design);
    setIsCreating(false);
  }

  function openCreateModal() {
    setSelectedDesign(null);
    setIsCreating(true);
    setNewDesignName("");
    setNewDesignFile(null);
  }

  function closeModal() {
    setSelectedDesign(null);
    setIsCreating(false);
    setNewDesignName("");
    setNewDesignFile(null);
  }

  async function createDesign() {
    if (!newDesignName || !newDesignFile) {
      alert("Veuillez remplir le nom et sélectionner un fichier");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', newDesignName);
      formData.append('file', newDesignFile);
      formData.append('format', newDesignFile.name.split('.').pop() || 'svg');

      const res = await fetch("/api/designs-2d", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || "Failed to create design");
      }

      await fetchDesigns();
      closeModal();
    } catch (error: any) {
      console.error("Error creating design:", error);
      alert(`Erreur lors de la création: ${error.message || 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  }

  async function deleteDesign() {
    if (!selectedDesign) return;
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${selectedDesign.name}" ?`)) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/designs-2d?id=${encodeURIComponent(selectedDesign.id)}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete");
      await fetchDesigns();
      closeModal();
    } catch (error) {
      console.error("Error deleting design:", error);
      alert("Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  }

  const filteredDesigns = designs.filter((design) =>
    design.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showModal = selectedDesign || isCreating;

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
            placeholder="Rechercher un design 2D..."
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
          <span style={{ color: '#000000' }}>+</span>
          Nouveau design 2D
        </button>
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '24px'
      }}>
        {/* Rectangle "Ajouter un design 2D" */}
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
            Ajouter un design 2D
          </p>
        </div>

        {/* Existing Designs */}
        {filteredDesigns.map((design) => (
          <div
            key={design.id}
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
            onClick={() => openModal(design)}
          >
            {/* Preview 2D Static */}
            <div style={{
              width: '100%',
              aspectRatio: '1',
              backgroundColor: '#0a0a0a',
              borderBottom: '1px solid #2a2a2a',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <Design2DPreviewStatic 
                url={(design as any).svg_url || (design as any).svgUrl} 
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
                {design.name}
              </h3>
              <div style={{
                fontSize: '12px',
                color: '#a0a0a0',
                fontFamily: 'var(--stepn-font-body)'
              }}>
                <div>Format: {(design.format || 'SVG').toUpperCase()}</div>
                <div style={{ marginTop: '4px' }}>
                  Design 2D
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
              maxWidth: '800px',
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
                {isCreating ? 'Nouveau design 2D' : selectedDesign?.name}
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
              padding: '24px',
              overflowY: 'auto',
              flex: 1
            }}>
              {isCreating ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      color: '#ffffff',
                      marginBottom: '8px',
                      fontFamily: 'var(--stepn-font-body)'
                    }}>
                      Nom du design
                    </label>
                    <input
                      type="text"
                      value={newDesignName}
                      onChange={(e) => setNewDesignName(e.target.value)}
                      placeholder="Ex: Design Floral"
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
                      Fichier SVG
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".svg"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setNewDesignFile(file);
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
                    />
                    {newDesignFile && (
                      <p style={{ color: '#8eff36', fontSize: '12px', marginTop: '4px' }}>
                        Fichier sélectionné: {newDesignFile.name}
                      </p>
                    )}
                  </div>
                </div>
              ) : selectedDesign ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{
                    width: '100%',
                    aspectRatio: '1',
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}>
                    <Design2DPreviewStatic 
                      url={(selectedDesign as any).svg_url || (selectedDesign as any).svgUrl} 
                      style={{ width: '100%', height: '100%' }}
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
                      Nom
                    </label>
                    <input
                      type="text"
                      value={selectedDesign.name}
                      disabled
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #2a2a2a',
                        borderRadius: '8px',
                        color: '#a0a0a0',
                        fontSize: '14px',
                        fontFamily: 'var(--stepn-font-body)',
                        cursor: 'not-allowed'
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
                      Format
                    </label>
                    <input
                      type="text"
                      value={(selectedDesign.format || 'SVG').toUpperCase()}
                      disabled
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #2a2a2a',
                        borderRadius: '8px',
                        color: '#a0a0a0',
                        fontSize: '14px',
                        fontFamily: 'var(--stepn-font-body)',
                        cursor: 'not-allowed'
                      }}
                    />
                  </div>
                  {(selectedDesign as any).svg_url || (selectedDesign as any).svgUrl ? (
                    <div>
                      <a
                        href={(selectedDesign as any).svg_url || (selectedDesign as any).svgUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-block',
                          padding: '12px 24px',
                          backgroundColor: '#2a2a2a',
                          border: '1px solid #2a2a2a',
                          borderRadius: '8px',
                          color: '#8eff36',
                          fontSize: '14px',
                          fontWeight: '500',
                          textDecoration: 'none',
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
                        Voir le fichier SVG
                      </a>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '24px',
              borderTop: '1px solid #2a2a2a'
            }}>
              {selectedDesign && (
                <button
                  onClick={deleteDesign}
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
                {isCreating && (
                  <button
                    onClick={createDesign}
                    disabled={loading || !newDesignName.trim() || !newDesignFile}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: loading || !newDesignName.trim() || !newDesignFile ? '#4a4a4a' : '#8eff36',
                      border: 'none',
                      borderRadius: '8px',
                      color: loading || !newDesignName.trim() || !newDesignFile ? '#a0a0a0' : '#000000',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: loading || !newDesignName.trim() || !newDesignFile ? 'not-allowed' : 'pointer',
                      fontFamily: 'var(--stepn-font-body)',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (!loading && newDesignName.trim() && newDesignFile) {
                        e.currentTarget.style.opacity = '0.9';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loading && newDesignName.trim() && newDesignFile) {
                        e.currentTarget.style.opacity = '1';
                      }
                    }}
                  >
                    {loading ? 'Création...' : 'Créer'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
