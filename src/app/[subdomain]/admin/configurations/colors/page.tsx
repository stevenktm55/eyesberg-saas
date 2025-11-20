"use client";

import { useEffect, useState } from "react";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";

type ColorPalette = {
  id: string;
  name: string;
  colors: string[]; // Array of hex colors
  created_at?: string;
  updated_at?: string;
};

export default function ColorsConfigPage() {
  const [palettes, setPalettes] = useState<ColorPalette[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedPalette, setSelectedPalette] = useState<ColorPalette | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newPaletteName, setNewPaletteName] = useState("");
  const [newPaletteColors, setNewPaletteColors] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [paletteToDelete, setPaletteToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchPalettes();
  }, []);

  async function fetchPalettes() {
    setLoading(true);
    try {
      const res = await fetch("/api/color-palettes");
      if (!res.ok) throw new Error("Failed to fetch palettes");
      const data = await res.json();
      setPalettes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching palettes:", error);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setNewPaletteName("");
    setNewPaletteColors([]);
    setIsCreating(true);
    setSelectedPalette(null);
  }

  function openEditModal(palette: ColorPalette) {
    setSelectedPalette(palette);
    setNewPaletteName(palette.name);
    setNewPaletteColors([...palette.colors]);
    setIsCreating(false);
  }

  function closeModal() {
    setIsCreating(false);
    setSelectedPalette(null);
    setNewPaletteName("");
    setNewPaletteColors([]);
  }

  function addColor() {
    setNewPaletteColors([...newPaletteColors, "#000000"]);
  }

  function removeColor(index: number) {
    setNewPaletteColors(newPaletteColors.filter((_, i) => i !== index));
  }

  function updateColor(index: number, color: string) {
    const updated = [...newPaletteColors];
    updated[index] = color;
    setNewPaletteColors(updated);
  }

  async function savePalette() {
    if (!newPaletteName.trim()) {
      alert("Veuillez entrer un nom pour la palette");
      return;
    }

    if (newPaletteColors.length === 0) {
      alert("Veuillez ajouter au moins une couleur");
      return;
    }

    setLoading(true);
    try {
      const method = selectedPalette ? "PUT" : "POST";
      const url = selectedPalette
        ? `/api/color-palettes?id=${encodeURIComponent(selectedPalette.id)}`
        : "/api/color-palettes";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPaletteName,
          colors: newPaletteColors,
        }),
      });

      if (!res.ok) throw new Error("Failed to save palette");
      await fetchPalettes();
      closeModal();
    } catch (error) {
      console.error("Error saving palette:", error);
      alert("Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  }

  function openDeleteModal(id: string) {
    const palette = palettes.find((p) => p.id === id);
    setPaletteToDelete(id);
    setShowDeleteModal(true);
  }

  async function deletePalette() {
    if (!paletteToDelete) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/color-palettes?id=${encodeURIComponent(paletteToDelete)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete palette");
      await fetchPalettes();
      setShowDeleteModal(false);
      setPaletteToDelete(null);
    } catch (error) {
      console.error("Error deleting palette:", error);
      alert("Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  }

  const filteredPalettes = palettes.filter((palette) =>
    palette.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      {/* Search and Action Bar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '24px'
      }}>
        <input
          type="text"
          placeholder="Rechercher une palette..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            maxWidth: '400px',
            padding: '12px 16px',
            backgroundColor: '#0a0a0a',
            border: '1px solid #2a2a2a',
            borderRadius: '8px',
            color: '#ffffff',
            fontSize: '14px',
            fontFamily: 'var(--stepn-font-body)',
            outline: 'none',
            transition: 'all 0.2s'
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#8eff36';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#2a2a2a';
          }}
        />
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
          Nouvelle palette
        </button>
      </div>

      {/* Palettes Grid */}
      {loading && palettes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#a0a0a0' }}>
          <p style={{ fontFamily: 'var(--stepn-font-body)' }}>Chargement...</p>
        </div>
      ) : filteredPalettes.length === 0 ? (
        <div style={{
          border: '2px dashed #2a2a2a',
          borderRadius: '8px',
          padding: '64px 32px',
          textAlign: 'center',
          color: '#a0a0a0'
        }}>
          <p style={{ fontFamily: 'var(--stepn-font-body)', fontSize: '16px', marginBottom: '8px' }}>
            {searchQuery ? 'Aucune palette trouvée' : 'Aucune palette de couleurs'}
          </p>
          <p style={{ fontFamily: 'var(--stepn-font-body)', fontSize: '14px' }}>
            {searchQuery ? 'Essayez une autre recherche' : 'Créez votre première palette de couleurs'}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '24px'
        }}>
          {filteredPalettes.map((palette) => (
            <div
              key={palette.id}
              style={{
                backgroundColor: '#0a0a0a',
                borderRadius: '8px',
                padding: '20px',
                border: '1px solid #2a2a2a',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#8eff36';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#2a2a2a';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              onClick={() => openEditModal(palette)}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#ffffff',
                  fontFamily: 'var(--stepn-font-body)',
                  margin: 0
                }}>
                  {palette.name}
                </h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openDeleteModal(palette.id);
                  }}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#ff4444',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontFamily: 'var(--stepn-font-body)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 68, 68, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  ✕
                </button>
              </div>
              <div style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap'
              }}>
                {palette.colors.map((color, index) => (
                  <div
                    key={index}
                    style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: color,
                      borderRadius: '4px',
                      border: '1px solid #2a2a2a',
                      cursor: 'pointer'
                    }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(isCreating || selectedPalette) && (
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
          onClick={closeModal}
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
                {selectedPalette ? 'Modifier la palette' : 'Nouvelle palette'}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Name */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    color: '#ffffff',
                    marginBottom: '8px',
                    fontFamily: 'var(--stepn-font-body)'
                  }}>
                    Nom de la palette
                  </label>
                  <input
                    type="text"
                    value={newPaletteName}
                    onChange={(e) => setNewPaletteName(e.target.value)}
                    placeholder="Ex: Palette d'été"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: '#0a0a0a',
                      border: '1px solid #2a2a2a',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontFamily: 'var(--stepn-font-body)',
                      outline: 'none',
                      transition: 'all 0.2s'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#8eff36';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#2a2a2a';
                    }}
                    autoFocus
                  />
                </div>

                {/* Colors */}
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px'
                  }}>
                    <label style={{
                      fontSize: '14px',
                      color: '#ffffff',
                      fontFamily: 'var(--stepn-font-body)'
                    }}>
                      Couleurs ({newPaletteColors.length})
                    </label>
                    <button
                      onClick={addColor}
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
                      + Ajouter une couleur
                    </button>
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    flexWrap: 'wrap'
                  }}>
                    {newPaletteColors.map((color, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          backgroundColor: '#0a0a0a',
                          padding: '8px',
                          borderRadius: '6px',
                          border: '1px solid #2a2a2a'
                        }}
                      >
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => updateColor(index, e.target.value)}
                          style={{
                            width: '50px',
                            height: '50px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        />
                        <input
                          type="text"
                          value={color}
                          onChange={(e) => updateColor(index, e.target.value)}
                          placeholder="#000000"
                          style={{
                            width: '100px',
                            padding: '8px',
                            backgroundColor: '#1a1a1a',
                            border: '1px solid #2a2a2a',
                            borderRadius: '4px',
                            color: '#ffffff',
                            fontSize: '12px',
                            fontFamily: 'var(--stepn-font-body)',
                            outline: 'none'
                          }}
                        />
                        <button
                          onClick={() => removeColor(index)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: '#ff4444',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontFamily: 'var(--stepn-font-body)'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              padding: '24px',
              borderTop: '1px solid #2a2a2a'
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
                onClick={savePalette}
                disabled={loading || !newPaletteName.trim() || newPaletteColors.length === 0}
                style={{
                  padding: '12px 24px',
                  backgroundColor: loading || !newPaletteName.trim() || newPaletteColors.length === 0 ? '#4a4a4a' : '#8eff36',
                  border: 'none',
                  borderRadius: '8px',
                  color: loading || !newPaletteName.trim() || newPaletteColors.length === 0 ? '#a0a0a0' : '#000000',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: loading || !newPaletteName.trim() || newPaletteColors.length === 0 ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--stepn-font-body)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!loading && newPaletteName.trim() && newPaletteColors.length > 0) {
                    e.currentTarget.style.opacity = '0.9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading && newPaletteName.trim() && newPaletteColors.length > 0) {
                    e.currentTarget.style.opacity = '1';
                  }
                }}
              >
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setPaletteToDelete(null);
        }}
        onConfirm={deletePalette}
        title={paletteToDelete ? `Êtes-vous sûr de vouloir supprimer "${palettes.find(p => p.id === paletteToDelete)?.name}" ?` : ""}
        message="Cette action est irréversible."
      />
    </div>
  );
}

