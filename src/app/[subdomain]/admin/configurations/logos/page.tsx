"use client";

import { useEffect, useState } from "react";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";

type Logo = {
  id: string;
  name: string;
  file_url: string;
  file_name: string;
  created_at?: string;
  updated_at?: string;
};

type LogoLibrary = {
  id: string;
  name: string;
  logos: Logo[];
  created_at?: string;
  updated_at?: string;
};

export default function LogosConfigPage() {
  const [logoLibraries, setLogoLibraries] = useState<LogoLibrary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedLibraries, setExpandedLibraries] = useState<Set<string>>(new Set());
  const [editingLibrary, setEditingLibrary] = useState<LogoLibrary | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showLibraryEditModal, setShowLibraryEditModal] = useState(false);
  const [newLibraryName, setNewLibraryName] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteAction, setDeleteAction] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [newLogo, setNewLogo] = useState<{
    name: string;
    file: File | null;
  }>({
    name: "",
    file: null
  });
  const [editingLogo, setEditingLogo] = useState<{ libraryId: string; logo: Logo | null }>({ libraryId: "", logo: null });
  const [showLogoEditModal, setShowLogoEditModal] = useState(false);

  useEffect(() => {
    fetchLogoLibraries();
  }, []);

  async function fetchLogoLibraries() {
    setLoading(true);
    try {
      const res = await fetch("/api/logo-libraries");
      if (!res.ok) throw new Error("Failed to fetch logo libraries");
      const data = await res.json();
      setLogoLibraries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching logo libraries:", error);
    } finally {
      setLoading(false);
    }
  }

  function toggleLibrary(libraryId: string) {
    const newExpanded = new Set(expandedLibraries);
    if (newExpanded.has(libraryId)) {
      newExpanded.delete(libraryId);
    } else {
      newExpanded.add(libraryId);
    }
    setExpandedLibraries(newExpanded);
  }

  function openCreateModal() {
    setNewLibraryName("");
    setIsCreating(true);
    setEditingLibrary(null);
    setShowLibraryEditModal(true);
  }

  function openEditNameModal(library: LogoLibrary) {
    setEditingLibrary(library);
    setNewLibraryName(library.name);
    setIsCreating(false);
    setShowLibraryEditModal(true);
  }

  function closeLibraryModal() {
    setShowLibraryEditModal(false);
    setEditingLibrary(null);
    setIsCreating(false);
    setNewLibraryName("");
  }

  async function createLibrary() {
    if (!newLibraryName.trim()) {
      alert("Veuillez entrer un nom pour la bibliothèque");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/logo-libraries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newLibraryName }),
      });

      if (!res.ok) throw new Error("Failed to create library");
      await fetchLogoLibraries();
      closeLibraryModal();
    } catch (error) {
      console.error("Error creating library:", error);
      alert("Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  }

  async function updateLibraryName() {
    if (!editingLibrary || !newLibraryName.trim()) {
      alert("Veuillez entrer un nom pour la bibliothèque");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/logo-libraries?id=${encodeURIComponent(editingLibrary.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newLibraryName }),
      });

      if (!res.ok) throw new Error("Failed to update library");
      await fetchLogoLibraries();
      closeLibraryModal();
    } catch (error) {
      console.error("Error updating library:", error);
      alert("Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  }

  async function duplicateLibrary(library: LogoLibrary) {
    setLoading(true);
    try {
      const newName = `${library.name} (copie)`;
      const res = await fetch("/api/logo-libraries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });

      if (!res.ok) throw new Error("Failed to duplicate library");
      const newLibrary = await res.json();

      // Dupliquer tous les logos
      for (const logo of library.logos) {
        // Télécharger le fichier original
        const fileResponse = await fetch(logo.file_url);
        const blob = await fileResponse.blob();
        const file = new File([blob], logo.file_name, { type: 'image/svg+xml' });

        // Uploader le nouveau logo
        const formData = new FormData();
        formData.append('logoLibraryId', newLibrary.id);
        formData.append('name', logo.name);
        formData.append('file', file);

        await fetch("/api/logos", {
          method: "POST",
          body: formData,
        });
      }

      await fetchLogoLibraries();
    } catch (error) {
      console.error("Error duplicating library:", error);
      alert("Erreur lors de la duplication");
    } finally {
      setLoading(false);
    }
  }

  async function deleteLibrary(libraryId: string, libraryName: string) {
    openDeleteModal(() => {
      setLoading(true);
      fetch(`/api/logo-libraries?id=${encodeURIComponent(libraryId)}`, {
        method: "DELETE",
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to delete library");
          return fetchLogoLibraries();
        })
        .catch((error) => {
          console.error("Error deleting library:", error);
          alert("Erreur lors de la suppression");
        })
        .finally(() => {
          setLoading(false);
        });
    }, libraryName);
  }

  function openDeleteModal(action: () => void, name: string) {
    setDeleteAction({ id: "", name });
    setShowDeleteModal(true);
    // Store the action to execute on confirm
    (window as any).__pendingDeleteAction = action;
  }

  function confirmDelete() {
    if ((window as any).__pendingDeleteAction) {
      (window as any).__pendingDeleteAction();
      (window as any).__pendingDeleteAction = null;
    }
    setShowDeleteModal(false);
    setDeleteAction(null);
  }

  function cancelDelete() {
    (window as any).__pendingDeleteAction = null;
    setShowDeleteModal(false);
    setDeleteAction(null);
  }

  async function addLogoToLibrary(libraryId: string) {
    if (!newLogo.name.trim() || !newLogo.file) {
      alert("Veuillez entrer un nom et sélectionner un fichier");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('logoLibraryId', libraryId);
      formData.append('name', newLogo.name);
      formData.append('file', newLogo.file);

      const res = await fetch("/api/logos", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to add logo");
      await fetchLogoLibraries();
      setNewLogo({ name: "", file: null });
    } catch (error) {
      console.error("Error adding logo:", error);
      alert("Erreur lors de l'ajout du logo");
    } finally {
      setLoading(false);
    }
  }

  async function updateLogo(libraryId: string, logoId: string) {
    if (!editingLogo.logo || !editingLogo.logo.name.trim()) {
      alert("Veuillez entrer un nom");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', editingLogo.logo.name);
      if (editingLogo.logo.file) {
        formData.append('file', editingLogo.logo.file);
      }

      const res = await fetch(`/api/logos?id=${encodeURIComponent(logoId)}`, {
        method: "PUT",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to update logo");
      await fetchLogoLibraries();
      setShowLogoEditModal(false);
      setEditingLogo({ libraryId: "", logo: null });
    } catch (error) {
      console.error("Error updating logo:", error);
      alert("Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  }

  async function removeLogoFromLibrary(libraryId: string, logoId: string) {
    openDeleteModal(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/logos?id=${encodeURIComponent(logoId)}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to remove logo");
        await fetchLogoLibraries();
      } catch (error) {
        console.error("Error removing logo:", error);
        alert("Erreur lors de la suppression du logo");
      } finally {
        setLoading(false);
      }
    }, "ce logo");
  }

  function openEditLogoModal(libraryId: string, logo: Logo) {
    setEditingLogo({ libraryId, logo: { ...logo } });
    setShowLogoEditModal(true);
  }

  function closeLogoEditModal() {
    setShowLogoEditModal(false);
    setEditingLogo({ libraryId: "", logo: null });
  }

  // Filtrer les bibliothèques selon la recherche
  const filteredLibraries = logoLibraries.filter((library) =>
    library.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    library.logos.some((logo) => logo.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div>
      {/* Search Bar and Create Button */}
      <div style={{ 
        marginBottom: '24px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        gap: '16px'
      }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher une bibliothèque ou un logo..."
          style={{
            flex: 1,
            maxWidth: '400px',
            padding: '12px 16px',
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
          onClick={openCreateModal}
          disabled={loading}
          style={{
            padding: '12px 24px',
            backgroundColor: loading ? '#4a4a4a' : '#8eff36',
            border: 'none',
            borderRadius: '6px',
            color: loading ? '#a0a0a0' : '#000000',
            fontSize: '14px',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--stepn-font-body)',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
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
          <span className="green-button-icon" style={{ fontSize: '18px' }}>+</span>
          Nouvelle bibliothèque de logos
        </button>
      </div>

      {/* Logo Libraries List */}
      {loading && logoLibraries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#a0a0a0' }}>
          Chargement...
        </div>
      ) : filteredLibraries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#a0a0a0' }}>
          {searchQuery ? 'Aucun résultat trouvé' : 'Aucune bibliothèque de logos'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredLibraries.map((library) => {
            const isExpanded = expandedLibraries.has(library.id);
            return (
              <div
                key={library.id}
                style={{
                  backgroundColor: '#1a1a1a',
                  borderRadius: '8px',
                  border: '1px solid #2a2a2a',
                  overflow: 'hidden',
                  transition: 'all 0.2s'
                }}
              >
                {/* Library Header */}
                <div
                  onClick={() => toggleLibrary(library.id)}
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    backgroundColor: isExpanded ? '#0a0a0a' : '#1a1a1a',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#0a0a0a';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isExpanded ? '#0a0a0a' : '#1a1a1a';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <span style={{ fontSize: '16px', color: '#a0a0a0' }}>
                      {isExpanded ? '▼' : '▶'}
                    </span>
                    <div>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#ffffff',
                        margin: 0,
                        fontFamily: 'var(--stepn-font-body)'
                      }}>
                        {library.name}
                      </h3>
                      <p style={{
                        fontSize: '12px',
                        color: '#a0a0a0',
                        margin: 0,
                        fontFamily: 'var(--stepn-font-body)'
                      }}>
                        {library.logos.length} logo{library.logos.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditNameModal(library);
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateLibrary(library);
                      }}
                      disabled={loading}
                      style={{
                        padding: '8px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: loading ? '#4a4a4a' : '#a0a0a0',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '16px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) {
                          e.currentTarget.style.color = '#8eff36';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!loading) {
                          e.currentTarget.style.color = '#a0a0a0';
                        }
                      }}
                    >
                      ⧉
                    </button>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div style={{
                    borderTop: '1px solid #2a2a2a',
                    padding: '16px',
                    backgroundColor: '#0a0a0a'
                  }}>
                    {/* Add Logo */}
                    <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        value={newLogo.name}
                        onChange={(e) => setNewLogo({ ...newLogo, name: e.target.value })}
                        placeholder="Nom du logo"
                        style={{
                          flex: 1,
                          minWidth: '200px',
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
                      <input
                        type="file"
                        accept=".svg"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setNewLogo({ ...newLogo, file });
                        }}
                        style={{
                          padding: '10px 12px',
                          backgroundColor: '#1a1a1a',
                          border: '1px solid #2a2a2a',
                          borderRadius: '6px',
                          color: '#ffffff',
                          fontSize: '14px',
                          fontFamily: 'var(--stepn-font-body)',
                          outline: 'none',
                          transition: 'all 0.2s',
                          cursor: 'pointer'
                        }}
                      />
                      <button
                        onClick={() => addLogoToLibrary(library.id)}
                        disabled={loading || !newLogo.name.trim() || !newLogo.file}
                        style={{
                          padding: '10px 16px',
                          backgroundColor: loading || !newLogo.name.trim() || !newLogo.file ? '#4a4a4a' : '#8eff36',
                          border: 'none',
                          borderRadius: '6px',
                          color: loading || !newLogo.name.trim() || !newLogo.file ? '#a0a0a0' : '#000000',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: loading || !newLogo.name.trim() || !newLogo.file ? 'not-allowed' : 'pointer',
                          fontFamily: 'var(--stepn-font-body)',
                          transition: 'all 0.2s'
                        }}
                      >
                        Ajouter
                      </button>
                    </div>

                    {/* Logos List */}
                    {library.logos.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {library.logos.map((logo) => (
                          <div
                            key={logo.id}
                            style={{
                              backgroundColor: '#1a1a1a',
                              padding: '16px',
                              borderRadius: '6px',
                              border: '1px solid #2a2a2a',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '16px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                              {/* Logo Preview */}
                              <div style={{
                                width: '60px',
                                height: '60px',
                                backgroundColor: '#0a0a0a',
                                borderRadius: '4px',
                                border: '1px solid #2a2a2a',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}>
                                <img
                                  src={logo.file_url}
                                  alt={logo.name}
                                  style={{
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    objectFit: 'contain'
                                  }}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </div>
                              {/* Name and Info */}
                              <div style={{ flex: 1 }}>
                                <h4 style={{
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  color: '#ffffff',
                                  margin: 0,
                                  fontFamily: 'var(--stepn-font-body)'
                                }}>
                                  {logo.name}
                                </h4>
                                <p style={{
                                  fontSize: '12px',
                                  color: '#a0a0a0',
                                  margin: '4px 0 0 0',
                                  fontFamily: 'var(--stepn-font-body)'
                                }}>
                                  {logo.file_name}
                                </p>
                              </div>
                            </div>
                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                              <button
                                onClick={() => openEditLogoModal(library.id, logo)}
                                disabled={loading}
                                style={{
                                  padding: '8px 12px',
                                  backgroundColor: loading ? '#4a4a4a' : '#8eff36',
                                  border: 'none',
                                  borderRadius: '4px',
                                  color: loading ? '#a0a0a0' : '#000000',
                                  fontSize: '12px',
                                  fontWeight: '500',
                                  cursor: loading ? 'not-allowed' : 'pointer',
                                  fontFamily: 'var(--stepn-font-body)',
                                  transition: 'all 0.2s'
                                }}
                              >
                                ✎
                              </button>
                              <button
                                onClick={() => removeLogoFromLibrary(library.id, logo.id)}
                                disabled={loading}
                                style={{
                                  padding: '8px 12px',
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
                              >
                                Supprimer
                              </button>
                            </div>
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
                        Aucun logo dans cette bibliothèque
                      </div>
                    )}

                    {/* Delete Library Button */}
                    <div style={{ 
                      marginTop: '16px', 
                      paddingTop: '16px', 
                      borderTop: '1px solid #2a2a2a',
                      display: 'flex',
                      justifyContent: 'flex-end'
                    }}>
                      <button
                        onClick={() => deleteLibrary(library.id, library.name)}
                        disabled={loading}
                        style={{
                          padding: '10px 16px',
                          backgroundColor: loading ? '#4a4a4a' : '#ff4444',
                          border: 'none',
                          borderRadius: '6px',
                          color: '#ffffff',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          fontFamily: 'var(--stepn-font-body)',
                          transition: 'all 0.2s'
                        }}
                      >
                        SUPPRIMER LA BIBLIOTHÈQUE
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Library Name Modal */}
      {showLibraryEditModal && (
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
            zIndex: 10000
          }}
          onClick={closeLibraryModal}
        >
          <div
            style={{
              backgroundColor: '#1a1a1a',
              padding: '24px',
              borderRadius: '8px',
              border: '1px solid #2a2a2a',
              width: '90%',
              maxWidth: '400px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#ffffff',
              marginBottom: '16px',
              fontFamily: 'var(--stepn-font-body)'
            }}>
              {editingLibrary ? 'Modifier la bibliothèque' : 'Nouvelle bibliothèque de logos'}
            </h2>
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                color: '#a0a0a0',
                marginBottom: '8px',
                fontFamily: 'var(--stepn-font-body)'
              }}>
                Nom de la bibliothèque
              </label>
              <input
                type="text"
                value={newLibraryName}
                onChange={(e) => setNewLibraryName(e.target.value)}
                placeholder="Nom de la bibliothèque"
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontFamily: 'var(--stepn-font-body)',
                  outline: 'none',
                  marginBottom: '16px',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#8eff36';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#2a2a2a';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    editingLibrary ? updateLibraryName() : createLibrary();
                  }
                }}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={closeLibraryModal}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#2a2a2a',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontFamily: 'var(--stepn-font-body)',
                  transition: 'all 0.2s'
                }}
              >
                Annuler
              </button>
              <button
                onClick={editingLibrary ? updateLibraryName : createLibrary}
                disabled={loading || !newLibraryName.trim()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: loading || !newLibraryName.trim() ? '#4a4a4a' : '#8eff36',
                  border: 'none',
                  borderRadius: '6px',
                  color: loading || !newLibraryName.trim() ? '#a0a0a0' : '#000000',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: loading || !newLibraryName.trim() ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--stepn-font-body)',
                  transition: 'all 0.2s'
                }}
              >
                {editingLibrary ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Logo Modal */}
      {showLogoEditModal && editingLogo.logo && (
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
            zIndex: 10000
          }}
          onClick={closeLogoEditModal}
        >
          <div
            style={{
              backgroundColor: '#1a1a1a',
              padding: '24px',
              borderRadius: '8px',
              border: '1px solid #2a2a2a',
              width: '90%',
              maxWidth: '500px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#ffffff',
              marginBottom: '16px',
              fontFamily: 'var(--stepn-font-body)'
            }}>
              Modifier le logo
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  color: '#a0a0a0',
                  marginBottom: '8px',
                  fontFamily: 'var(--stepn-font-body)'
                }}>
                  Nom
                </label>
                <input
                  type="text"
                  value={editingLogo.logo.name}
                  onChange={(e) => setEditingLogo({
                    ...editingLogo,
                    logo: { ...editingLogo.logo, name: e.target.value }
                  })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontFamily: 'var(--stepn-font-body)',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#8eff36';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#2a2a2a';
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  color: '#a0a0a0',
                  marginBottom: '8px',
                  fontFamily: 'var(--stepn-font-body)'
                }}>
                  Remplacer le fichier (optionnel)
                </label>
                <input
                  type="file"
                  accept=".svg"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setEditingLogo({
                      ...editingLogo,
                      logo: { ...editingLogo.logo, file: file as any }
                    });
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontFamily: 'var(--stepn-font-body)',
                    outline: 'none',
                    boxSizing: 'border-box',
                    cursor: 'pointer'
                  }}
                />
              </div>
              {/* Preview */}
              {editingLogo.logo && (
                <div style={{
                  padding: '16px',
                  backgroundColor: '#0a0a0a',
                  borderRadius: '6px',
                  border: '1px solid #2a2a2a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '100px'
                }}>
                  <img
                    src={editingLogo.logo.file_url}
                    alt={editingLogo.logo.name}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '200px',
                      objectFit: 'contain'
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                onClick={closeLogoEditModal}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#2a2a2a',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontFamily: 'var(--stepn-font-body)',
                  transition: 'all 0.2s'
                }}
              >
                Annuler
              </button>
              <button
                onClick={() => updateLogo(editingLogo.libraryId, editingLogo.logo!.id)}
                disabled={loading || !editingLogo.logo?.name.trim()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: loading || !editingLogo.logo?.name.trim() ? '#4a4a4a' : '#8eff36',
                  border: 'none',
                  borderRadius: '6px',
                  color: loading || !editingLogo.logo?.name.trim() ? '#a0a0a0' : '#000000',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: loading || !editingLogo.logo?.name.trim() ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--stepn-font-body)',
                  transition: 'all 0.2s'
                }}
              >
                Modifier
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
        title="Confirmer la suppression"
        message="Cette action est irréversible."
        itemName={deleteAction?.name || ""}
      />
    </div>
  );
}

