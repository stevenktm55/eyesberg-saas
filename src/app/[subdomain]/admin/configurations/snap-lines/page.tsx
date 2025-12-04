"use client";

import { useEffect, useState, useMemo } from "react";
import { UVMapViewer } from "@/components/UVMapViewer";

type SnapLine = {
  id: string;
  name: string;
  model3d_id: string;
  start: [number, number]; // UV coordinates [u, v]
  end: [number, number]; // UV coordinates [u, v]
  type: "horizontal" | "vertical" | "diagonal";
  view?: "Face" | "Dos" | "Gauche" | "Droite";
  createdAt?: string;
};

type SnapLineGroup = {
  id: string;
  name: string;
  snapLines: SnapLine[];
  design2dIds?: string[]; // IDs of 2D designs that can use these snap lines
  created_at?: string;
  updated_at?: string;
};

type Model3D = {
  id: string;
  name: string;
  glb_url?: string;
  glbUrl?: string;
};

type Design2D = {
  id: string;
  name: string;
  svgUrl: string;
};

export default function SnapLinesConfigPage() {
  const [snapLineGroups, setSnapLineGroups] = useState<SnapLineGroup[]>([]);
  const [models3D, setModels3D] = useState<Model3D[]>([]);
  const [designs2D, setDesigns2D] = useState<Design2D[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<SnapLineGroup | null>(null);
  const [selectedModel3DId, setSelectedModel3DId] = useState<string | null>(null);
  const [selectedDesign2DId, setSelectedDesign2DId] = useState<string | null>(null);
  const [selectedDesign2DIdsForGroup, setSelectedDesign2DIdsForGroup] = useState<string[]>([]);
  const [editingSnapLines, setEditingSnapLines] = useState<SnapLine[]>([]);
  const [selectedSnapLineId, setSelectedSnapLineId] = useState<string | null>(null);
  const [isPlacingSnapLine, setIsPlacingSnapLine] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [placingStart, setPlacingStart] = useState<[number, number] | null>(null);

  // Snap line settings (left panel)
  const [snapLineSettings, setSnapLineSettings] = useState<{
    type: "horizontal" | "vertical" | "diagonal";
    view?: "Face" | "Dos" | "Gauche" | "Droite";
  }>({
    type: "vertical",
    view: "Face"
  });

  useEffect(() => {
    fetchSnapLineGroups();
    fetchModels3D();
    fetchDesigns2D();
  }, []);

  async function fetchSnapLineGroups() {
    try {
      setLoading(true);
      const res = await fetch('/api/snap-line-groups');
      if (res.ok) {
        const data = await res.json();
        setSnapLineGroups(data);
      } else {
        console.error('Failed to fetch snap line groups:', res.statusText);
        setSnapLineGroups([]);
      }
    } catch (error) {
      console.error('Error fetching snap line groups:', error);
      setSnapLineGroups([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchModels3D() {
    try {
      const res = await fetch('/api/models-3d');
      if (res.ok) {
        const data = await res.json();
        setModels3D(data);
      }
    } catch (error) {
      console.error('Error fetching models 3D:', error);
    }
  }

  async function fetchDesigns2D() {
    try {
      const res = await fetch('/api/designs-2d');
      if (res.ok) {
        const data = await res.json();
        const mappedData = data.map((design: any) => ({
          ...design,
          svgUrl: design.svg_url || design.svgUrl
        }));
        setDesigns2D(mappedData);
      }
    } catch (error) {
      console.error('Error fetching designs 2D:', error);
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

  function openCreateGroupModal() {
    setNewGroupName("");
    setIsCreatingGroup(true);
    setSelectedGroup(null);
    setShowEditModal(true);
    setEditingSnapLines([]);
    setSelectedSnapLineId(null);
    setSelectedModel3DId(null);
    setSelectedDesign2DId(null);
    setSelectedDesign2DIdsForGroup([]);
    setIsPlacingSnapLine(false);
    setPlacingStart(null);
  }

  function openEditGroupModal(group: SnapLineGroup) {
    setSelectedGroup(group);
    setIsCreatingGroup(false);
    setShowEditModal(true);
    setEditingSnapLines([...group.snapLines]);
    setSelectedSnapLineId(null);
    setSelectedModel3DId(group.snapLines[0]?.model3d_id || null);
    setSelectedDesign2DIdsForGroup(group.design2dIds || []);
    setSelectedDesign2DId(null);
    setIsPlacingSnapLine(false);
    setPlacingStart(null);
  }

  function closeEditModal() {
    setShowEditModal(false);
    setSelectedGroup(null);
    setEditingSnapLines([]);
    setSelectedSnapLineId(null);
    setSelectedModel3DId(null);
    setSelectedDesign2DId(null);
    setSelectedDesign2DIdsForGroup([]);
    setIsPlacingSnapLine(false);
    setPlacingStart(null);
    setNewGroupName("");
    setIsCreatingGroup(false);
    setSnapLineSettings({
      type: "vertical",
      view: "Face"
    });
  }

  function handleAddSnapLine() {
    if (!selectedModel3DId) {
      alert('Veuillez d\'abord sélectionner un modèle 3D');
      return;
    }
    setIsPlacingSnapLine(true);
    setPlacingStart(null);
  }

  function handleSnapLinePlaced(position: [number, number]) {
    if (!selectedModel3DId) return;
    
    if (!placingStart) {
      // Premier clic : définir le point de départ
      setPlacingStart(position);
      return;
    }

    // Deuxième clic : créer la ligne
    const newSnapLine: SnapLine = {
      id: `temp-${Date.now()}`,
      name: `Ligne ${editingSnapLines.length + 1}`,
      model3d_id: selectedModel3DId,
      start: placingStart,
      end: position,
      type: snapLineSettings.type,
      view: snapLineSettings.view || "Face"
    };
    setEditingSnapLines([...editingSnapLines, newSnapLine]);
    setSelectedSnapLineId(newSnapLine.id);
    setIsPlacingSnapLine(false);
    setPlacingStart(null);
    
    // Reset settings to defaults
    setSnapLineSettings({
      type: "vertical",
      view: "Face"
    });
  }

  function handleSelectSnapLine(snapLineId: string) {
    setSelectedSnapLineId(snapLineId);
    const snapLine = editingSnapLines.find(sl => sl.id === snapLineId);
    if (snapLine) {
      setSnapLineSettings({
        type: snapLine.type,
        view: snapLine.view || "Face"
      });
    }
  }

  function handleUpdateSnapLine(updates: Partial<SnapLine>) {
    if (!selectedSnapLineId) return;
    
    setEditingSnapLines(editingSnapLines.map(snapLine => 
      snapLine.id === selectedSnapLineId 
        ? { ...snapLine, ...updates }
        : snapLine
    ));
    
    // Update settings if they match
    if (updates.type !== undefined) setSnapLineSettings(prev => ({ ...prev, type: updates.type! }));
    if (updates.view !== undefined) setSnapLineSettings(prev => ({ ...prev, view: updates.view! }));
  }

  function handleDeleteSnapLine(snapLineId: string) {
    setEditingSnapLines(editingSnapLines.filter(sl => sl.id !== snapLineId));
    if (selectedSnapLineId === snapLineId) {
      setSelectedSnapLineId(null);
      setSnapLineSettings({
        type: "vertical",
        view: "Face"
      });
    }
  }

  async function handleSaveGroup() {
    if (!newGroupName.trim() && isCreatingGroup) {
      alert('Veuillez entrer un nom pour le groupe');
      return;
    }
    if (!selectedModel3DId) {
      alert('Veuillez sélectionner un modèle 3D');
      return;
    }
    if (editingSnapLines.length === 0) {
      alert('Veuillez ajouter au moins une ligne');
      return;
    }

    try {
      setLoading(true);
      const groupName = isCreatingGroup ? newGroupName : selectedGroup?.name || 'Nouveau groupe';
      
      const snapLinesToSave = editingSnapLines.map(snapLine => ({
        ...snapLine,
        model3d_id: snapLine.model3d_id || selectedModel3DId
      }));

      if (isCreatingGroup) {
        const res = await fetch('/api/snap-line-groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: groupName,
            snapLines: snapLinesToSave,
            model3d_id: selectedModel3DId,
            design2dIds: selectedDesign2DIdsForGroup
          })
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Failed to create snap line group');
        }

        const newGroup = await res.json();
        setSnapLineGroups([...snapLineGroups, newGroup]);
      } else {
        const res = await fetch(`/api/snap-line-groups?id=${encodeURIComponent(selectedGroup!.id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: groupName,
            snapLines: snapLinesToSave,
            model3d_id: selectedModel3DId,
            design2dIds: selectedDesign2DIdsForGroup
          })
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Failed to update snap line group');
        }

        const updatedGroup = await res.json();
        setSnapLineGroups(snapLineGroups.map(g => g.id === updatedGroup.id ? updatedGroup : g));
      }

      closeEditModal();
    } catch (error: any) {
      console.error('Error saving snap line group:', error);
      alert(`Erreur lors de la sauvegarde: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  const selectedModel = models3D.find(m => m.id === selectedModel3DId);
  const modelUrl = selectedModel?.glb_url || selectedModel?.glbUrl || '';
  const selectedDesign = designs2D.find(d => d.id === selectedDesign2DId);
  const designUrl = selectedDesign?.svgUrl || selectedDesign?.svg_url || null;

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h2 style={{ 
          fontSize: '20px', 
          fontWeight: '600',
          fontFamily: 'var(--stepn-font-body)'
        }}>
          Snap Lines
        </h2>
        <button
          onClick={openCreateGroupModal}
          style={{
            padding: '10px 20px',
            backgroundColor: '#8eff36',
            color: '#000000',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            fontFamily: 'var(--stepn-font-body)'
          }}
        >
          Créer un groupe
        </button>
      </div>

      {loading ? (
        <p style={{ color: '#a0a0a0' }}>Chargement...</p>
      ) : snapLineGroups.length === 0 ? (
        <div style={{
          padding: '48px',
          textAlign: 'center',
          backgroundColor: '#1a1a1a',
          borderRadius: '8px',
          border: '1px solid #2a2a2a'
        }}>
          <p style={{ color: '#a0a0a0', fontSize: '14px', marginBottom: '16px' }}>
            Aucun groupe de snap lines configuré
          </p>
          <button
            onClick={openCreateGroupModal}
            style={{
              padding: '10px 20px',
              backgroundColor: '#8eff36',
              color: '#000000',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              fontFamily: 'var(--stepn-font-body)'
            }}
          >
            Créer votre premier groupe
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {snapLineGroups.map((group) => (
            <div
              key={group.id}
              style={{
                backgroundColor: '#1a1a1a',
                borderRadius: '8px',
                border: '1px solid #2a2a2a',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
                onClick={() => toggleGroup(group.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '18px' }}>
                    {expandedGroups.has(group.id) ? '▼' : '▶'}
                  </span>
                  <h3 style={{ 
                    fontSize: '16px', 
                    fontWeight: '600',
                    fontFamily: 'var(--stepn-font-body)'
                  }}>
                    {group.name}
                  </h3>
                  <span style={{ 
                    fontSize: '12px', 
                    color: '#a0a0a0',
                    fontFamily: 'var(--stepn-font-body)'
                  }}>
                    ({group.snapLines.length} ligne{group.snapLines.length > 1 ? 's' : ''})
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditGroupModal(group);
                  }}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#2a2a2a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontFamily: 'var(--stepn-font-body)'
                  }}
                >
                  Modifier
                </button>
              </div>
              {expandedGroups.has(group.id) && (
                <div style={{
                  padding: '16px',
                  paddingTop: '0',
                  borderTop: '1px solid #2a2a2a',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '12px'
                }}>
                  {group.snapLines.map((snapLine) => (
                    <div
                      key={snapLine.id}
                      style={{
                        padding: '12px',
                        backgroundColor: '#0a0a0a',
                        borderRadius: '4px',
                        border: '1px solid #2a2a2a'
                      }}
                    >
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        marginBottom: '4px',
                        fontFamily: 'var(--stepn-font-body)'
                      }}>
                        {snapLine.name}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#a0a0a0',
                        fontFamily: 'var(--stepn-font-body)'
                      }}>
                        {snapLine.type}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal d'édition */}
      {showEditModal && (
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
          onClick={closeEditModal}
        >
          <div
            style={{
              width: '95%',
              maxWidth: '1800px',
              height: '90%',
              backgroundColor: '#1a1a1a',
              borderRadius: '8px',
              border: '1px solid #2a2a2a',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #2a2a2a',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                fontFamily: 'var(--stepn-font-body)'
              }}>
                {isCreatingGroup ? 'Créer un groupe de snap lines' : `Modifier: ${selectedGroup?.name}`}
              </h2>
              <button
                onClick={closeEditModal}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#2a2a2a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontFamily: 'var(--stepn-font-body)'
                }}
              >
                Fermer
              </button>
            </div>

            {/* Content: 3 columns layout */}
            <div style={{
              flex: 1,
              display: 'flex',
              overflow: 'hidden'
            }}>
              {/* Left: Settings */}
              <div style={{
                width: '300px',
                borderRight: '1px solid #2a2a2a',
                padding: '20px',
                overflowY: 'auto',
                backgroundColor: '#0a0a0a'
              }}>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    color: '#a0a0a0',
                    marginBottom: '8px',
                    fontFamily: 'var(--stepn-font-body)'
                  }}>
                    Nom du groupe
                  </label>
                  <input
                    type="text"
                    value={isCreatingGroup ? newGroupName : selectedGroup?.name || ''}
                    onChange={(e) => isCreatingGroup ? setNewGroupName(e.target.value) : undefined}
                    disabled={!isCreatingGroup}
                    placeholder="Nom du groupe"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #2a2a2a',
                      borderRadius: '4px',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontFamily: 'var(--stepn-font-body)',
                      outline: 'none',
                      opacity: isCreatingGroup ? 1 : 0.5
                    }}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    color: '#a0a0a0',
                    marginBottom: '8px',
                    fontFamily: 'var(--stepn-font-body)'
                  }}>
                    Modèle 3D
                  </label>
                  <select
                    value={selectedModel3DId || ''}
                    onChange={(e) => {
                      setSelectedModel3DId(e.target.value || null);
                      setEditingSnapLines([]);
                      setSelectedSnapLineId(null);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #2a2a2a',
                      borderRadius: '4px',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontFamily: 'var(--stepn-font-body)',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="">Sélectionner un modèle 3D</option>
                    {models3D.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    color: '#a0a0a0',
                    marginBottom: '8px',
                    fontFamily: 'var(--stepn-font-body)'
                  }}>
                    Design 2D pour l'aperçu (optionnel)
                  </label>
                  <select
                    value={selectedDesign2DId || ''}
                    onChange={(e) => setSelectedDesign2DId(e.target.value || null)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #2a2a2a',
                      borderRadius: '4px',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontFamily: 'var(--stepn-font-body)',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="">Aucun design</option>
                    {designs2D.map((design) => (
                      <option key={design.id} value={design.id}>
                        {design.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sélection multi-designs pour le groupe */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    color: '#a0a0a0',
                    marginBottom: '8px',
                    fontFamily: 'var(--stepn-font-body)'
                  }}>
                    Designs 2D autorisés pour ce groupe
                  </label>
                  <div style={{
                    maxHeight: '180px',
                    overflowY: 'auto',
                    padding: '8px',
                    backgroundColor: '#0a0a0a',
                    borderRadius: '4px',
                    border: '1px solid #2a2a2a',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    {designs2D.length === 0 ? (
                      <span style={{ fontSize: '12px', color: '#a0a0a0', fontFamily: 'var(--stepn-font-body)' }}>
                        Aucun design 2D disponible.
                      </span>
                    ) : (
                      designs2D.map((design) => {
                        const checked = selectedDesign2DIdsForGroup.includes(design.id);
                        return (
                          <label
                            key={design.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontSize: '12px',
                              color: '#ffffff',
                              cursor: 'pointer',
                              fontFamily: 'var(--stepn-font-body)'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                setSelectedDesign2DIdsForGroup((prev) => {
                                  if (e.target.checked) {
                                    if (prev.includes(design.id)) return prev;
                                    return [...prev, design.id];
                                  }
                                  return prev.filter((id) => id !== design.id);
                                });
                              }}
                              style={{ cursor: 'pointer' }}
                            />
                            <span>{design.name}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                {selectedSnapLineId && (
                  <>
                    <div style={{ 
                      marginTop: '32px',
                      paddingTop: '24px',
                      borderTop: '1px solid #2a2a2a'
                    }}>
                      <h3 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        marginBottom: '16px',
                        fontFamily: 'var(--stepn-font-body)'
                      }}>
                        Réglages de la ligne
                      </h3>

                      <div style={{ marginBottom: '16px' }}>
                        <label style={{
                          display: 'block',
                          fontSize: '12px',
                          color: '#a0a0a0',
                          marginBottom: '8px',
                          fontFamily: 'var(--stepn-font-body)'
                        }}>
                          Nom de la ligne
                        </label>
                        <input
                          type="text"
                          value={editingSnapLines.find(sl => sl.id === selectedSnapLineId)?.name || ''}
                          onChange={(e) => {
                            if (selectedSnapLineId) {
                              handleUpdateSnapLine({ name: e.target.value });
                            }
                          }}
                          placeholder="Nom de la ligne"
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            backgroundColor: '#1a1a1a',
                            border: '1px solid #2a2a2a',
                            borderRadius: '4px',
                            color: '#ffffff',
                            fontSize: '14px',
                            fontFamily: 'var(--stepn-font-body)',
                            outline: 'none'
                          }}
                        />
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <label style={{
                          display: 'block',
                          fontSize: '12px',
                          color: '#a0a0a0',
                          marginBottom: '8px',
                          fontFamily: 'var(--stepn-font-body)'
                        }}>
                          Type
                        </label>
                        <select
                          value={snapLineSettings.type}
                          onChange={(e) => {
                            const type = e.target.value as "horizontal" | "vertical" | "diagonal";
                            setSnapLineSettings(prev => ({ ...prev, type }));
                            handleUpdateSnapLine({ type });
                          }}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            backgroundColor: '#1a1a1a',
                            border: '1px solid #2a2a2a',
                            borderRadius: '4px',
                            color: '#ffffff',
                            fontSize: '14px',
                            fontFamily: 'var(--stepn-font-body)',
                            cursor: 'pointer',
                            outline: 'none'
                          }}
                        >
                          <option value="horizontal">Horizontale</option>
                          <option value="vertical">Verticale</option>
                          <option value="diagonal">Diagonale</option>
                        </select>
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <label style={{
                          display: 'block',
                          fontSize: '12px',
                          color: '#a0a0a0',
                          marginBottom: '8px',
                          fontFamily: 'var(--stepn-font-body)'
                        }}>
                          Vue
                        </label>
                        <select
                          value={snapLineSettings.view || "Face"}
                          onChange={(e) => {
                            const view = e.target.value as "Face" | "Dos" | "Gauche" | "Droite";
                            setSnapLineSettings(prev => ({ ...prev, view }));
                            handleUpdateSnapLine({ view });
                          }}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            backgroundColor: '#1a1a1a',
                            border: '1px solid #2a2a2a',
                            borderRadius: '4px',
                            color: '#ffffff',
                            fontSize: '14px',
                            fontFamily: 'var(--stepn-font-body)',
                            cursor: 'pointer',
                            outline: 'none'
                          }}
                        >
                          <option value="Face">Face</option>
                          <option value="Dos">Dos</option>
                          <option value="Gauche">Gauche</option>
                          <option value="Droite">Droite</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                <div style={{ marginTop: '24px' }}>
                  {selectedSnapLineId ? (
                    <button
                      onClick={() => {
                        setIsPlacingSnapLine(false);
                        setSelectedSnapLineId(null);
                        setPlacingStart(null);
                        setSnapLineSettings({
                          type: "vertical",
                          view: "Face"
                        });
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 20px',
                        backgroundColor: '#8eff36',
                        color: '#000000',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        fontFamily: 'var(--stepn-font-body)'
                      }}
                    >
                      Confirmer la ligne
                    </button>
                  ) : (
                    <button
                      onClick={handleAddSnapLine}
                      disabled={!selectedModel3DId || isPlacingSnapLine}
                      style={{
                        width: '100%',
                        padding: '10px 20px',
                        backgroundColor: (!selectedModel3DId || isPlacingSnapLine) ? '#4a4a4a' : '#8eff36',
                        color: (!selectedModel3DId || isPlacingSnapLine) ? '#a0a0a0' : '#000000',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: (!selectedModel3DId || isPlacingSnapLine) ? 'not-allowed' : 'pointer',
                        fontFamily: 'var(--stepn-font-body)'
                      }}
                    >
                      {isPlacingSnapLine 
                        ? (placingStart ? 'Cliquez pour terminer la ligne' : 'Cliquez pour commencer la ligne')
                        : 'Ajouter une ligne'}
                    </button>
                  )}
                </div>
              </div>

              {/* Center: UV Map Viewer avec snap lines */}
              <div style={{
                flex: 1,
                position: 'relative',
                backgroundColor: '#0a0a0a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {modelUrl ? (
                  <UVMapViewer
                    modelUrl={modelUrl}
                    zones={[]}
                    snapLines={editingSnapLines.map(sl => ({
                      id: sl.id,
                      name: sl.name,
                      start: sl.start,
                      end: sl.end,
                      type: sl.type
                    }))}
                    selectedZoneId={null}
                    selectedSnapLineId={selectedSnapLineId}
                    onZoneSelect={() => {}}
                    onSnapLineSelect={handleSelectSnapLine}
                    onZonePlaced={() => {}}
                    onSnapLinePlaced={handleSnapLinePlaced}
                    onZoneUpdate={() => {}}
                    onSnapLineUpdate={(id, updates) => {
                      if (updates.start || updates.end) {
                        handleUpdateSnapLine(updates);
                      }
                    }}
                    isPlacingZone={false}
                    isPlacingSnapLine={isPlacingSnapLine}
                    placingStart={placingStart}
                    design2DUrl={designUrl}
                    onZoneConfirm={() => {}}
                  />
                ) : (
                  <div style={{
                    color: '#a0a0a0',
                    fontSize: '14px',
                    fontFamily: 'var(--stepn-font-body)'
                  }}>
                    Sélectionnez un modèle 3D pour afficher l'UV map
                  </div>
                )}
              </div>

              {/* Right: Snap lines list */}
              <div style={{
                width: '300px',
                borderLeft: '1px solid #2a2a2a',
                padding: '20px',
                overflowY: 'auto',
                backgroundColor: '#0a0a0a'
              }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '16px',
                  fontFamily: 'var(--stepn-font-body)'
                }}>
                  Lignes configurées ({editingSnapLines.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {editingSnapLines.map((snapLine) => (
                    <div
                      key={snapLine.id}
                      onClick={() => handleSelectSnapLine(snapLine.id)}
                      style={{
                        padding: '12px',
                        backgroundColor: selectedSnapLineId === snapLine.id ? '#2a2a2a' : '#1a1a1a',
                        borderRadius: '4px',
                        border: selectedSnapLineId === snapLine.id ? '2px solid #8eff36' : '1px solid #2a2a2a',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: '500',
                            marginBottom: '4px',
                            fontFamily: 'var(--stepn-font-body)'
                          }}>
                            {snapLine.name}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: '#a0a0a0',
                            fontFamily: 'var(--stepn-font-body)'
                          }}>
                            {snapLine.type}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSnapLine(snapLine.id);
                          }}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#ff4444',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            fontFamily: 'var(--stepn-font-body)'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '20px',
              borderTop: '1px solid #2a2a2a',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={closeEditModal}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#2a2a2a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontFamily: 'var(--stepn-font-body)'
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleSaveGroup}
                disabled={!selectedModel3DId || editingSnapLines.length === 0}
                style={{
                  padding: '10px 20px',
                  backgroundColor: (!selectedModel3DId || editingSnapLines.length === 0) ? '#4a4a4a' : '#8eff36',
                  color: (!selectedModel3DId || editingSnapLines.length === 0) ? '#a0a0a0' : '#000000',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: (!selectedModel3DId || editingSnapLines.length === 0) ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--stepn-font-body)'
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

