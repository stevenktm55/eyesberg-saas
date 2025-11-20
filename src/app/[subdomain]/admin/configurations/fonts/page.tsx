"use client";

import { useEffect, useState } from "react";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";

type Font = {
  id: string;
  name: string;
  file_url: string;
  file_name: string;
  file_type: string;
  letter_spacing: string;
  created_at?: string;
  updated_at?: string;
};

type FontGroup = {
  id: string;
  name: string;
  fonts: Font[];
  created_at?: string;
  updated_at?: string;
};

export default function FontsConfigPage() {
  const [fontGroups, setFontGroups] = useState<FontGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [editingGroup, setEditingGroup] = useState<FontGroup | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showGroupEditModal, setShowGroupEditModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteAction, setDeleteAction] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [newFont, setNewFont] = useState<{
    name: string;
    file: File | null;
    letterSpacing: string;
  }>({
    name: "",
    file: null,
    letterSpacing: "0px"
  });
  const [editingFont, setEditingFont] = useState<{ groupId: string; font: Font | null }>({ groupId: "", font: null });
  const [showFontEditModal, setShowFontEditModal] = useState(false);

  useEffect(() => {
    fetchFontGroups();
  }, []);

  async function fetchFontGroups() {
    setLoading(true);
    try {
      const res = await fetch("/api/font-groups");
      if (!res.ok) throw new Error("Failed to fetch font groups");
      const data = await res.json();
      setFontGroups(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching font groups:", error);
    } finally {
      setLoading(false);
    }
  }

  function toggleGroup(groupId: string) {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  }

  function openCreateModal() {
    setNewGroupName("");
    setIsCreating(true);
    setEditingGroup(null);
    setShowGroupEditModal(true);
  }

  function openEditNameModal(group: FontGroup) {
    setEditingGroup(group);
    setNewGroupName(group.name);
    setIsCreating(false);
    setShowGroupEditModal(true);
  }

  function closeGroupModal() {
    setShowGroupEditModal(false);
    setEditingGroup(null);
    setIsCreating(false);
    setNewGroupName("");
  }

  async function createGroup() {
    if (!newGroupName.trim()) {
      alert("Veuillez entrer un nom pour le groupe");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/font-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupName }),
      });

      if (!res.ok) throw new Error("Failed to create group");
      await fetchFontGroups();
      closeGroupModal();
    } catch (error) {
      console.error("Error creating group:", error);
      alert("Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  }

  async function updateGroupName() {
    if (!editingGroup || !newGroupName.trim()) {
      alert("Veuillez entrer un nom pour le groupe");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/font-groups?id=${encodeURIComponent(editingGroup.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupName }),
      });

      if (!res.ok) throw new Error("Failed to update group");
      await fetchFontGroups();
      closeGroupModal();
    } catch (error) {
      console.error("Error updating group:", error);
      alert("Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  }

  async function duplicateGroup(group: FontGroup) {
    setLoading(true);
    try {
      const newName = `${group.name} (copie)`;
      const res = await fetch("/api/font-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });

      if (!res.ok) throw new Error("Failed to duplicate group");
      const newGroup = await res.json();

      // Dupliquer toutes les fonts
      for (const font of group.fonts) {
        // Télécharger le fichier original
        const fileResponse = await fetch(font.file_url);
        const blob = await fileResponse.blob();
        const file = new File([blob], font.file_name, { type: `font/${font.file_type}` });

        // Uploader la nouvelle font
        const formData = new FormData();
        formData.append('fontGroupId', newGroup.id);
        formData.append('name', font.name);
        formData.append('file', file);
        formData.append('letterSpacing', font.letter_spacing);

        await fetch("/api/fonts", {
          method: "POST",
          body: formData,
        });
      }

      await fetchFontGroups();
    } catch (error) {
      console.error("Error duplicating group:", error);
      alert("Erreur lors de la duplication");
    } finally {
      setLoading(false);
    }
  }

  async function deleteGroup(groupId: string, groupName: string) {
    openDeleteModal(() => {
      setLoading(true);
      fetch(`/api/font-groups?id=${encodeURIComponent(groupId)}`, {
        method: "DELETE",
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to delete group");
          return fetchFontGroups();
        })
        .catch((error) => {
          console.error("Error deleting group:", error);
          alert("Erreur lors de la suppression");
        })
        .finally(() => {
          setLoading(false);
        });
    }, groupName);
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

  async function addFontToGroup(groupId: string) {
    if (!newFont.name.trim() || !newFont.file) {
      alert("Veuillez entrer un nom et sélectionner un fichier");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('fontGroupId', groupId);
      formData.append('name', newFont.name);
      formData.append('file', newFont.file);
      formData.append('letterSpacing', newFont.letterSpacing);

      const res = await fetch("/api/fonts", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to add font");
      await fetchFontGroups();
      setNewFont({ name: "", file: null, letterSpacing: "0px" });
    } catch (error) {
      console.error("Error adding font:", error);
      alert("Erreur lors de l'ajout de la font");
    } finally {
      setLoading(false);
    }
  }

  async function updateFont(groupId: string, fontId: string) {
    if (!editingFont.font || !editingFont.font.name.trim()) {
      alert("Veuillez entrer un nom");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', editingFont.font.name);
      formData.append('letterSpacing', editingFont.font.letter_spacing);
      if (editingFont.font.file) {
        formData.append('file', editingFont.font.file);
      }

      const res = await fetch(`/api/fonts?id=${encodeURIComponent(fontId)}`, {
        method: "PUT",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to update font");
      await fetchFontGroups();
      setShowFontEditModal(false);
      setEditingFont({ groupId: "", font: null });
    } catch (error) {
      console.error("Error updating font:", error);
      alert("Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  }

  async function removeFontFromGroup(groupId: string, fontId: string) {
    openDeleteModal(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/fonts?id=${encodeURIComponent(fontId)}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to remove font");
        await fetchFontGroups();
      } catch (error) {
        console.error("Error removing font:", error);
        alert("Erreur lors de la suppression de la font");
      } finally {
        setLoading(false);
      }
    }, "cette font");
  }

  function openEditFontModal(groupId: string, font: Font) {
    setEditingFont({ groupId, font: { ...font } });
    setShowFontEditModal(true);
  }

  function closeFontEditModal() {
    setShowFontEditModal(false);
    setEditingFont({ groupId: "", font: null });
  }

  // Filtrer les groupes selon la recherche
  const filteredGroups = fontGroups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.fonts.some((font) => font.name.toLowerCase().includes(searchQuery.toLowerCase()))
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
          placeholder="Rechercher un groupe ou une font..."
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
          Nouveau groupe de fonts
        </button>
      </div>

      {/* Font Groups List */}
      {loading && fontGroups.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#a0a0a0' }}>
          Chargement...
        </div>
      ) : filteredGroups.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#a0a0a0' }}>
          {searchQuery ? 'Aucun résultat trouvé' : 'Aucun groupe de fonts'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredGroups.map((group) => {
            const isExpanded = expandedGroups.has(group.id);
            return (
              <div
                key={group.id}
                style={{
                  backgroundColor: '#1a1a1a',
                  borderRadius: '8px',
                  border: '1px solid #2a2a2a',
                  overflow: 'hidden',
                  transition: 'all 0.2s'
                }}
              >
                {/* Group Header */}
                <div
                  onClick={() => toggleGroup(group.id)}
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
                        {group.name}
                      </h3>
                      <p style={{
                        fontSize: '12px',
                        color: '#a0a0a0',
                        margin: 0,
                        fontFamily: 'var(--stepn-font-body)'
                      }}>
                        {group.fonts.length} font{group.fonts.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditNameModal(group);
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
                        duplicateGroup(group);
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
                    {/* Add Font */}
                    <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        value={newFont.name}
                        onChange={(e) => setNewFont({ ...newFont, name: e.target.value })}
                        placeholder="Nom de la font"
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
                        accept=".ttf,.otf,.woff,.woff2"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setNewFont({ ...newFont, file });
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
                      <input
                        type="text"
                        value={newFont.letterSpacing}
                        onChange={(e) => setNewFont({ ...newFont, letterSpacing: e.target.value })}
                        placeholder="0px"
                        style={{
                          width: '100px',
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
                        onClick={() => addFontToGroup(group.id)}
                        disabled={loading || !newFont.name.trim() || !newFont.file}
                        style={{
                          padding: '10px 16px',
                          backgroundColor: loading || !newFont.name.trim() || !newFont.file ? '#4a4a4a' : '#8eff36',
                          border: 'none',
                          borderRadius: '6px',
                          color: loading || !newFont.name.trim() || !newFont.file ? '#a0a0a0' : '#000000',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: loading || !newFont.name.trim() || !newFont.file ? 'not-allowed' : 'pointer',
                          fontFamily: 'var(--stepn-font-body)',
                          transition: 'all 0.2s'
                        }}
                      >
                        Ajouter
                      </button>
                    </div>

                    {/* Fonts List */}
                    {group.fonts.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {group.fonts.map((font) => (
                          <div
                            key={font.id}
                            style={{
                              backgroundColor: '#1a1a1a',
                              padding: '16px',
                              borderRadius: '6px',
                              border: '1px solid #2a2a2a',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '16px'
                            }}
                          >
                            {/* Name and Info */}
                            <div style={{ minWidth: '200px' }}>
                              <h4 style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#ffffff',
                                margin: 0,
                                fontFamily: 'var(--stepn-font-body)'
                              }}>
                                {font.name}
                              </h4>
                              <p style={{
                                fontSize: '12px',
                                color: '#a0a0a0',
                                margin: '4px 0 0 0',
                                fontFamily: 'var(--stepn-font-body)'
                              }}>
                                {font.file_name} • Letter-spacing: {font.letter_spacing}
                              </p>
                            </div>
                            
                            {/* Font Preview */}
                            <div style={{
                              flex: 1,
                              padding: '12px',
                              backgroundColor: '#0a0a0a',
                              borderRadius: '4px',
                              border: '1px solid #2a2a2a',
                              minWidth: '200px'
                            }}>
                              <style>{`
                                @font-face {
                                  font-family: '${font.name}';
                                  src: url('${font.file_url}') format('${font.file_type === 'woff' ? 'woff' : font.file_type === 'woff2' ? 'woff2' : font.file_type === 'otf' ? 'opentype' : 'truetype'}');
                                }
                              `}</style>
                              <div
                                style={{
                                  fontFamily: `"${font.name}", sans-serif`,
                                  fontSize: '24px',
                                  color: '#ffffff',
                                  letterSpacing: font.letter_spacing,
                                  lineHeight: '1.4'
                                }}
                              >
                                AaBbCc 123
                              </div>
                            </div>
                            
                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                              <button
                                onClick={() => openEditFontModal(group.id, font)}
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
                                onClick={() => removeFontFromGroup(group.id, font.id)}
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
                        Aucune font dans ce groupe
                      </div>
                    )}

                    {/* Delete Group Button */}
                    <div style={{ 
                      marginTop: '16px', 
                      paddingTop: '16px', 
                      borderTop: '1px solid #2a2a2a',
                      display: 'flex',
                      justifyContent: 'flex-end'
                    }}>
                      <button
                        onClick={() => deleteGroup(group.id, group.name)}
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
                        SUPPRIMER LE GROUPE
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Group Name Modal */}
      {showGroupEditModal && (
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
          onClick={closeGroupModal}
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
              {editingGroup ? 'Modifier le groupe' : 'Nouveau groupe de fonts'}
            </h2>
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                color: '#a0a0a0',
                marginBottom: '8px',
                fontFamily: 'var(--stepn-font-body)'
              }}>
                Nom du groupe
              </label>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Nom du groupe"
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
                    editingGroup ? updateGroupName() : createGroup();
                  }
                }}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={closeGroupModal}
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
                onClick={editingGroup ? updateGroupName : createGroup}
                disabled={loading || !newGroupName.trim()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: loading || !newGroupName.trim() ? '#4a4a4a' : '#8eff36',
                  border: 'none',
                  borderRadius: '6px',
                  color: loading || !newGroupName.trim() ? '#a0a0a0' : '#000000',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: loading || !newGroupName.trim() ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--stepn-font-body)',
                  transition: 'all 0.2s'
                }}
              >
                {editingGroup ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Font Modal */}
      {showFontEditModal && editingFont.font && (
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
          onClick={closeFontEditModal}
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
              Modifier la font
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
                  value={editingFont.font.name}
                  onChange={(e) => setEditingFont({
                    ...editingFont,
                    font: { ...editingFont.font, name: e.target.value }
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
                  Letter-spacing
                </label>
                <input
                  type="text"
                  value={editingFont.font.letter_spacing}
                  onChange={(e) => setEditingFont({
                    ...editingFont,
                    font: { ...editingFont.font, letter_spacing: e.target.value }
                  })}
                  placeholder="0px"
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
                  accept=".ttf,.otf,.woff,.woff2"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setEditingFont({
                      ...editingFont,
                      font: { ...editingFont.font, file: file as any }
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
              {editingFont.font && (
                <div style={{
                  padding: '16px',
                  backgroundColor: '#0a0a0a',
                  borderRadius: '6px',
                  border: '1px solid #2a2a2a'
                }}>
                  <div style={{
                    fontSize: '12px',
                    color: '#a0a0a0',
                    marginBottom: '8px',
                    fontFamily: 'var(--stepn-font-body)'
                  }}>
                    Aperçu
                  </div>
                  <style>{`
                    @font-face {
                      font-family: '${editingFont.font.name}';
                      src: url('${editingFont.font.file_url}') format('${editingFont.font.file_type === 'woff' ? 'woff' : editingFont.font.file_type === 'woff2' ? 'woff2' : editingFont.font.file_type === 'otf' ? 'opentype' : 'truetype'}');
                    }
                  `}</style>
                  <div
                    style={{
                      fontFamily: editingFont.font.file_url ? `"${editingFont.font.name}", sans-serif` : 'sans-serif',
                      fontSize: '24px',
                      color: '#ffffff',
                      letterSpacing: editingFont.font.letter_spacing,
                      lineHeight: '1.4'
                    }}
                  >
                    AaBbCc 123
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                onClick={closeFontEditModal}
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
                onClick={() => updateFont(editingFont.groupId, editingFont.font!.id)}
                disabled={loading || !editingFont.font?.name.trim()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: loading || !editingFont.font?.name.trim() ? '#4a4a4a' : '#8eff36',
                  border: 'none',
                  borderRadius: '6px',
                  color: loading || !editingFont.font?.name.trim() ? '#a0a0a0' : '#000000',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: loading || !editingFont.font?.name.trim() ? 'not-allowed' : 'pointer',
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

