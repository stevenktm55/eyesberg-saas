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
  const [expandedPalettes, setExpandedPalettes] = useState<Set<string>>(new Set());
  const [editingPalette, setEditingPalette] = useState<ColorPalette | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showPaletteEditModal, setShowPaletteEditModal] = useState(false);
  const [newPaletteName, setNewPaletteName] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteAction, setDeleteAction] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [newColor, setNewColor] = useState("#000000");

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

  function togglePalette(paletteId: string) {
    const newExpanded = new Set(expandedPalettes);
    if (newExpanded.has(paletteId)) {
      newExpanded.delete(paletteId);
    } else {
      newExpanded.add(paletteId);
    }
    setExpandedPalettes(newExpanded);
  }

  function openCreateModal() {
    setNewPaletteName("");
    setIsCreating(true);
    setEditingPalette(null);
    setShowPaletteEditModal(true);
  }

  function openEditNameModal(palette: ColorPalette) {
    setEditingPalette(palette);
    setNewPaletteName(palette.name);
    setIsCreating(false);
    setShowPaletteEditModal(true);
  }

  function closePaletteModal() {
    setShowPaletteEditModal(false);
    setEditingPalette(null);
    setIsCreating(false);
    setNewPaletteName("");
  }

  async function createPalette() {
    if (!newPaletteName.trim()) {
      alert("Veuillez entrer un nom pour la palette");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/color-palettes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPaletteName,
          colors: [], // Créer sans couleurs
        }),
      });

      if (!res.ok) throw new Error("Failed to create palette");
      await fetchPalettes();
      closePaletteModal();
    } catch (error) {
      console.error("Error creating palette:", error);
      alert("Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  }

  async function updatePaletteName() {
    if (!editingPalette || !newPaletteName.trim()) {
      alert("Veuillez entrer un nom pour la palette");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/color-palettes?id=${encodeURIComponent(editingPalette.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPaletteName,
          colors: editingPalette.colors, // Garder les couleurs existantes
        }),
      });

      if (!res.ok) throw new Error("Failed to update palette");
      await fetchPalettes();
      closePaletteModal();
    } catch (error) {
      console.error("Error updating palette:", error);
      alert("Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  }

  async function addColorToPalette(paletteId: string) {
    if (!newColor || !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(newColor)) {
      alert("Veuillez entrer une couleur hex valide (ex: #FF0000)");
      return;
    }

    setLoading(true);
    try {
      const palette = palettes.find((p) => p.id === paletteId);
      if (!palette) return;

      const updatedColors = [...palette.colors, newColor];

      const res = await fetch(`/api/color-palettes?id=${encodeURIComponent(paletteId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: palette.name,
          colors: updatedColors,
        }),
      });

      if (!res.ok) throw new Error("Failed to add color");
      await fetchPalettes();
      setNewColor("#000000");
    } catch (error) {
      console.error("Error adding color:", error);
      alert("Erreur lors de l'ajout de la couleur");
    } finally {
      setLoading(false);
    }
  }

  async function removeColorFromPalette(paletteId: string, colorIndex: number) {
    setLoading(true);
    try {
      const palette = palettes.find((p) => p.id === paletteId);
      if (!palette) return;

      const updatedColors = palette.colors.filter((_, i) => i !== colorIndex);

      const res = await fetch(`/api/color-palettes?id=${encodeURIComponent(paletteId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: palette.name,
          colors: updatedColors,
        }),
      });

      if (!res.ok) throw new Error("Failed to remove color");
      await fetchPalettes();
    } catch (error) {
      console.error("Error removing color:", error);
      alert("Erreur lors de la suppression de la couleur");
    } finally {
      setLoading(false);
    }
  }

  function openDeleteModal(id: string) {
    const palette = palettes.find((p) => p.id === id);
    if (palette) {
      setDeleteAction({ id, name: palette.name });
      setShowDeleteModal(true);
    }
  }

  async function confirmDelete() {
    if (!deleteAction) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/color-palettes?id=${encodeURIComponent(deleteAction.id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete palette");
      await fetchPalettes();
      setShowDeleteModal(false);
      setDeleteAction(null);
    } catch (error) {
      console.error("Error deleting palette:", error);
      alert("Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  }

  function cancelDelete() {
    setShowDeleteModal(false);
    setDeleteAction(null);
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

      {/* Palettes List */}
      {filteredPalettes.length === 0 ? (
        <div style={{
          border: '2px dashed #2a2a2a',
          borderRadius: '8px',
          padding: '64px 32px',
          textAlign: 'center',
          color: '#a0a0a0'
        }}>
          <p style={{ fontSize: '16px', marginBottom: '8px', fontFamily: 'var(--stepn-font-body)' }}>
            {searchQuery ? 'Aucun résultat pour votre recherche' : 'Aucune palette de couleurs'}
          </p>
          <p style={{ fontSize: '14px', fontFamily: 'var(--stepn-font-body)' }}>
            {searchQuery ? 'Essayez une autre recherche' : 'Créez votre première palette de couleurs pour commencer'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredPalettes.map((palette) => {
            const isExpanded = expandedPalettes.has(palette.id);

            return (
              <div
                key={palette.id}
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
                  onClick={() => togglePalette(palette.id)}
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
                        {palette.name}
                      </h3>
                      <p style={{
                        fontSize: '12px',
                        color: '#a0a0a0',
                        fontFamily: 'var(--stepn-font-body)'
                      }}>
                        {palette.colors.length} couleur{palette.colors.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditNameModal(palette);
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
                    {/* Add Color */}
                    <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <input
                        type="color"
                        value={newColor}
                        onChange={(e) => setNewColor(e.target.value)}
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
                        value={newColor}
                        onChange={(e) => setNewColor(e.target.value)}
                        placeholder="#000000"
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          backgroundColor: '#1a1a1a',
                          border: '1px solid #2a2a2a',
                          borderRadius: '6px',
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
                        onClick={() => addColorToPalette(palette.id)}
                        disabled={loading}
                        style={{
                          padding: '10px 16px',
                          backgroundColor: loading ? '#4a4a4a' : '#8eff36',
                          border: 'none',
                          borderRadius: '6px',
                          color: loading ? '#a0a0a0' : '#000000',
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
                        Ajouter
                      </button>
                    </div>

                    {/* Colors List */}
                    {palette.colors.length > 0 ? (
                      <div style={{
                        display: 'flex',
                        gap: '12px',
                        flexWrap: 'wrap'
                      }}>
                        {palette.colors.map((color, index) => (
                          <div
                            key={index}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              backgroundColor: '#1a1a1a',
                              padding: '8px',
                              borderRadius: '6px',
                              border: '1px solid #2a2a2a'
                            }}
                          >
                            <div
                              style={{
                                width: '40px',
                                height: '40px',
                                backgroundColor: color,
                                borderRadius: '4px',
                                border: '1px solid #2a2a2a'
                              }}
                              title={color}
                            />
                            <span style={{
                              color: '#ffffff',
                              fontSize: '12px',
                              fontFamily: 'var(--stepn-font-body)',
                              minWidth: '70px'
                            }}>
                              {color}
                            </span>
                            <button
                              onClick={() => removeColorFromPalette(palette.id, index)}
                              disabled={loading}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: loading ? '#4a4a4a' : '#ff4444',
                                border: 'none',
                                borderRadius: '4px',
                                color: '#ffffff',
                                fontSize: '12px',
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
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{
                        textAlign: 'center',
                        padding: '24px',
                        color: '#a0a0a0',
                        fontFamily: 'var(--stepn-font-body)',
                        fontSize: '14px'
                      }}>
                        Aucune couleur dans cette palette
                      </div>
                    )}

                    {/* Delete Palette Button */}
                    <div style={{
                      marginTop: '16px',
                      paddingTop: '16px',
                      borderTop: '1px solid #2a2a2a',
                      display: 'flex',
                      justifyContent: 'flex-end'
                    }}>
                      <button
                        onClick={() => openDeleteModal(palette.id)}
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
                        Supprimer la palette
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Name Modal */}
      {showPaletteEditModal && (
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
          onClick={closePaletteModal}
        >
          <div
            style={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #2a2a2a',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '500px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#ffffff',
              fontFamily: 'var(--stepn-font-body)',
              margin: 0
            }}>
              {editingPalette ? 'Modifier la palette' : 'Nouvelle palette'}
            </h2>
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
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={closePaletteModal}
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
                onClick={editingPalette ? updatePaletteName : createPalette}
                disabled={loading || !newPaletteName.trim()}
                style={{
                  padding: '12px 24px',
                  backgroundColor: loading || !newPaletteName.trim() ? '#4a4a4a' : '#8eff36',
                  border: 'none',
                  borderRadius: '8px',
                  color: loading || !newPaletteName.trim() ? '#a0a0a0' : '#000000',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: loading || !newPaletteName.trim() ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--stepn-font-body)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!loading && newPaletteName.trim()) {
                    e.currentTarget.style.opacity = '0.9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading && newPaletteName.trim()) {
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
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title={deleteAction ? `Êtes-vous sûr de vouloir supprimer "${deleteAction.name}" ?` : ""}
        message="Cette action est irréversible."
      />
    </div>
  );
}
