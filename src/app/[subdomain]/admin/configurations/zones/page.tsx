"use client";

import { useEffect, useState, useMemo } from "react";
import { UVMapViewer } from "@/components/UVMapViewer";

type Zone = {
  id: string;
  name: string;
  model3d_id: string;
  position: [number, number, number]; // UV coordinates [u, v, 0]
  rotation: number; // Rotation in degrees
  width: number; // Width in UV space (0-1)
  height: number; // Height in UV space (0-1)
  thumbnailUrl?: string;
  isLogo: boolean; // true for logo, false for text
  view?: "Face" | "Dos" | "Gauche" | "Droite"; // Vue de la zone
  createdAt?: string;
};

type ZoneGroup = {
  id: string;
  name: string;
  zones: Zone[];
  design2dIds?: string[]; // IDs of 2D designs that can use these zones
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

export default function ZonesConfigPage() {
  const [zoneGroups, setZoneGroups] = useState<ZoneGroup[]>([]);
  const [models3D, setModels3D] = useState<Model3D[]>([]);
  const [designs2D, setDesigns2D] = useState<Design2D[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ZoneGroup | null>(null);
  const [selectedModel3DId, setSelectedModel3DId] = useState<string | null>(null);
  const [selectedDesign2DId, setSelectedDesign2DId] = useState<string | null>(null);
  const [editingZones, setEditingZones] = useState<Zone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [isPlacingZone, setIsPlacingZone] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  // Zone settings (left panel)
  const [zoneSettings, setZoneSettings] = useState<{
    thumbnailUrl?: string;
    isLogo: boolean;
    width: number;
    height: number;
    rotation: number;
    view?: "Face" | "Dos" | "Gauche" | "Droite";
  }>({
    isLogo: false,
    width: 0.1,
    height: 0.1,
    rotation: 0,
    view: "Face"
  });

  useEffect(() => {
    fetchZoneGroups();
    fetchModels3D();
    fetchDesigns2D();
  }, []);

  async function fetchZoneGroups() {
    try {
      setLoading(true);
      const res = await fetch('/api/zone-groups');
      if (res.ok) {
        const data = await res.json();
        setZoneGroups(data);
      } else {
        console.error('Failed to fetch zone groups:', res.statusText);
        setZoneGroups([]);
      }
    } catch (error) {
      console.error('Error fetching zone groups:', error);
      setZoneGroups([]);
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
        // Map svg_url (from API) to svgUrl (for TypeScript)
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
    setEditingZones([]);
    setSelectedZoneId(null);
    setSelectedModel3DId(null);
    setSelectedDesign2DId(null);
    setIsPlacingZone(false);
  }

  function openEditGroupModal(group: ZoneGroup) {
    setSelectedGroup(group);
    setIsCreatingGroup(false);
    setShowEditModal(true);
    setEditingZones([...group.zones]);
    setSelectedZoneId(null);
    setSelectedModel3DId(group.zones[0]?.model3d_id || null);
    setSelectedDesign2DId(null);
    setIsPlacingZone(false);
  }

  function closeEditModal() {
    setShowEditModal(false);
    setSelectedGroup(null);
    setEditingZones([]);
    setSelectedZoneId(null);
    setSelectedModel3DId(null);
    setSelectedDesign2DId(null);
    setIsPlacingZone(false);
    setNewGroupName("");
    setIsCreatingGroup(false);
    setZoneSettings({
      isLogo: false,
      width: 0.1,
      height: 0.1,
      rotation: 0
    });
  }

  function handleAddZone() {
    if (!selectedModel3DId) {
      alert('Veuillez d\'abord sélectionner un modèle 3D');
      return;
    }
    setIsPlacingZone(true);
  }

  function handleZonePlaced(position: [number, number, number]) {
    if (!selectedModel3DId) return;
    
    const newZone: Zone = {
      id: `temp-${Date.now()}`,
      name: `Zone ${editingZones.length + 1}`,
      model3d_id: selectedModel3DId,
      position: position,
      rotation: zoneSettings.rotation,
      width: zoneSettings.width,
      height: zoneSettings.height,
      isLogo: zoneSettings.isLogo,
      thumbnailUrl: zoneSettings.thumbnailUrl,
      view: zoneSettings.view || "Face"
    };
    setEditingZones([...editingZones, newZone]);
    setSelectedZoneId(newZone.id);
    setIsPlacingZone(false);
    
    // Reset settings to defaults
    setZoneSettings({
      isLogo: false,
      width: 0.1,
      height: 0.1,
      rotation: 0
    });
  }

  function handleSelectZone(zoneId: string) {
    setSelectedZoneId(zoneId);
    const zone = editingZones.find(z => z.id === zoneId);
    if (zone) {
      setZoneSettings({
        thumbnailUrl: zone.thumbnailUrl,
        isLogo: zone.isLogo,
        width: zone.width,
        height: zone.height,
        rotation: zone.rotation,
        view: zone.view || "Face"
      });
    }
  }

  function handleUpdateZone(updates: Partial<Zone>) {
    if (!selectedZoneId) return;
    
    setEditingZones(editingZones.map(zone => 
      zone.id === selectedZoneId 
        ? { ...zone, ...updates }
        : zone
    ));
    
    // Update settings if they match
    if (updates.width !== undefined) setZoneSettings(prev => ({ ...prev, width: updates.width! }));
    if (updates.height !== undefined) setZoneSettings(prev => ({ ...prev, height: updates.height! }));
    if (updates.rotation !== undefined) setZoneSettings(prev => ({ ...prev, rotation: updates.rotation! }));
    if (updates.isLogo !== undefined) setZoneSettings(prev => ({ ...prev, isLogo: updates.isLogo! }));
    if (updates.view !== undefined) setZoneSettings(prev => ({ ...prev, view: updates.view! }));
  }

  function handleDeleteZone(zoneId: string) {
    setEditingZones(editingZones.filter(z => z.id !== zoneId));
    if (selectedZoneId === zoneId) {
      setSelectedZoneId(null);
      setZoneSettings({
        isLogo: false,
        width: 0.1,
        height: 0.1,
        rotation: 0,
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
    if (editingZones.length === 0) {
      alert('Veuillez ajouter au moins une zone');
      return;
    }

    try {
      setLoading(true);
      const groupName = isCreatingGroup ? newGroupName : selectedGroup?.name || 'Nouveau groupe';
      
      // Préparer les zones pour l'API (convertir les IDs temporaires et s'assurer que model3d_id est défini)
      const zonesToSave = editingZones.map(zone => ({
        ...zone,
        model3d_id: zone.model3d_id || selectedModel3DId
      }));

      if (isCreatingGroup) {
        // Créer un nouveau groupe
        const res = await fetch('/api/zone-groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: groupName,
            zones: zonesToSave,
            model3d_id: selectedModel3DId,
            design2dIds: []
          })
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Failed to create zone group');
        }

        const newGroup = await res.json();
        setZoneGroups([...zoneGroups, newGroup]);
      } else {
        // Mettre à jour un groupe existant
        const res = await fetch(`/api/zone-groups?id=${encodeURIComponent(selectedGroup!.id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: groupName,
            zones: zonesToSave,
            model3d_id: selectedModel3DId,
            design2dIds: selectedGroup?.design2dIds || []
          })
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Failed to update zone group');
        }

        const updatedGroup = await res.json();
        setZoneGroups(zoneGroups.map(g => g.id === updatedGroup.id ? updatedGroup : g));
      }

      closeEditModal();
    } catch (error: any) {
      console.error('Error saving zone group:', error);
      alert(`Erreur lors de la sauvegarde: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  const selectedModel = models3D.find(m => m.id === selectedModel3DId);
  const modelUrl = selectedModel?.glb_url || selectedModel?.glbUrl || '';
  const selectedDesign = designs2D.find(d => d.id === selectedDesign2DId);
  // Support both svgUrl (camelCase) and svg_url (snake_case)
  const designUrl = selectedDesign?.svgUrl || selectedDesign?.svg_url || null;
  
  // Debug log
  useEffect(() => {
    console.log('🎨 Design 2D selection:', {
      selectedDesign2DId,
      selectedDesign,
      designUrl,
      totalDesigns: designs2D.length,
      designKeys: selectedDesign ? Object.keys(selectedDesign) : []
    });
  }, [selectedDesign2DId, selectedDesign, designUrl, designs2D.length]);

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
          Zones de texte et logos
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
      ) : zoneGroups.length === 0 ? (
        <div style={{
          padding: '48px',
          textAlign: 'center',
          backgroundColor: '#1a1a1a',
          borderRadius: '8px',
          border: '1px solid #2a2a2a'
        }}>
          <p style={{ color: '#a0a0a0', fontSize: '14px', marginBottom: '16px' }}>
            Aucun groupe de zones configuré
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
          {zoneGroups.map((group) => (
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
                    ({group.zones.length} zone{group.zones.length > 1 ? 's' : ''})
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
                  {group.zones.map((zone) => (
                    <div
                      key={zone.id}
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
                        {zone.name}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#a0a0a0',
                        fontFamily: 'var(--stepn-font-body)'
                      }}>
                        {zone.isLogo ? 'Logo' : 'Texte'}
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
                {isCreatingGroup ? 'Créer un groupe de zones' : `Modifier: ${selectedGroup?.name}`}
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
                      setEditingZones([]);
                      setSelectedZoneId(null);
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
                    Design 2D (optionnel)
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

                {selectedZoneId && (
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
                        Réglages de la zone
                      </h3>

                      <div style={{ marginBottom: '16px' }}>
                        <label style={{
                          display: 'block',
                          fontSize: '12px',
                          color: '#a0a0a0',
                          marginBottom: '8px',
                          fontFamily: 'var(--stepn-font-body)'
                        }}>
                          Nom de la zone
                        </label>
                        <input
                          type="text"
                          value={editingZones.find(z => z.id === selectedZoneId)?.name || ''}
                          onChange={(e) => {
                            if (selectedZoneId) {
                              handleUpdateZone({ name: e.target.value });
                            }
                          }}
                          placeholder="Nom de la zone"
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
                          Image de la vignette
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const url = URL.createObjectURL(file);
                              setZoneSettings(prev => ({ ...prev, thumbnailUrl: url }));
                              handleUpdateZone({ thumbnailUrl: url });
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '8px',
                            backgroundColor: '#1a1a1a',
                            border: '1px solid #2a2a2a',
                            borderRadius: '4px',
                            color: '#ffffff',
                            fontSize: '12px',
                            fontFamily: 'var(--stepn-font-body)',
                            cursor: 'pointer'
                          }}
                        />
                        {zoneSettings.thumbnailUrl && (
                          <img
                            src={zoneSettings.thumbnailUrl}
                            alt="Vignette"
                            style={{
                              width: '100%',
                              marginTop: '8px',
                              borderRadius: '4px',
                              maxHeight: '100px',
                              objectFit: 'contain'
                            }}
                          />
                        )}
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
                          value={zoneSettings.view || "Face"}
                          onChange={(e) => {
                            const view = e.target.value as "Face" | "Dos" | "Gauche" | "Droite";
                            setZoneSettings(prev => ({ ...prev, view }));
                            handleUpdateZone({ view });
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

                      <div style={{ marginBottom: '16px' }}>
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '12px',
                          color: '#a0a0a0',
                          fontFamily: 'var(--stepn-font-body)',
                          cursor: 'pointer'
                        }}>
                          <input
                            type="checkbox"
                            checked={zoneSettings.isLogo}
                            onChange={(e) => {
                              setZoneSettings(prev => ({ ...prev, isLogo: e.target.checked }));
                              handleUpdateZone({ isLogo: e.target.checked });
                            }}
                            style={{ cursor: 'pointer' }}
                          />
                          Logo (sinon Texte)
                        </label>
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <label style={{
                          display: 'block',
                          fontSize: '12px',
                          color: '#a0a0a0',
                          marginBottom: '8px',
                          fontFamily: 'var(--stepn-font-body)'
                        }}>
                          Largeur (0-1)
                        </label>
                        <input
                          type="number"
                          min="0.01"
                          max="1"
                          step="0.01"
                          value={zoneSettings.width}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setZoneSettings(prev => ({ ...prev, width: val }));
                            handleUpdateZone({ width: val });
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
                          Hauteur (0-1)
                        </label>
                        <input
                          type="number"
                          min="0.01"
                          max="1"
                          step="0.01"
                          value={zoneSettings.height}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setZoneSettings(prev => ({ ...prev, height: val }));
                            handleUpdateZone({ height: val });
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
                          Rotation (degrés)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="360"
                          step="1"
                          value={zoneSettings.rotation}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setZoneSettings(prev => ({ ...prev, rotation: val }));
                            handleUpdateZone({ rotation: val });
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
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>
                  </>
                )}

                <div style={{ marginTop: '24px' }}>
                  {selectedZoneId ? (
                    <button
                      onClick={() => {
                        setIsPlacingZone(false);
                        setSelectedZoneId(null);
                        setZoneSettings({
                          isLogo: false,
                          width: 0.1,
                          height: 0.1,
                          rotation: 0
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
                      Confirmer la zone
                    </button>
                  ) : (
                    <button
                      onClick={handleAddZone}
                      disabled={!selectedModel3DId || isPlacingZone}
                      style={{
                        width: '100%',
                        padding: '10px 20px',
                        backgroundColor: (!selectedModel3DId || isPlacingZone) ? '#4a4a4a' : '#8eff36',
                        color: (!selectedModel3DId || isPlacingZone) ? '#a0a0a0' : '#000000',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: (!selectedModel3DId || isPlacingZone) ? 'not-allowed' : 'pointer',
                        fontFamily: 'var(--stepn-font-body)'
                      }}
                    >
                      {isPlacingZone ? 'Cliquez sur l\'UV map' : 'Ajouter une zone'}
                    </button>
                  )}
                </div>
              </div>

              {/* Center: UV Map Viewer */}
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
                    zones={editingZones}
                    selectedZoneId={selectedZoneId}
                    onZoneSelect={handleSelectZone}
                    onZonePlaced={(position) => {
                      if (isPlacingZone) {
                        handleZonePlaced(position);
                      }
                    }}
                    onZoneUpdate={(id, updates) => {
                      if (updates.position) {
                        handleUpdateZone({ position: updates.position });
                      }
                    }}
                    isPlacingZone={isPlacingZone}
                    design2DUrl={designUrl}
                    onZoneConfirm={() => {
                      setSelectedZoneId(null);
                      setZoneSettings({
                        isLogo: false,
                        width: 0.1,
                        height: 0.1,
                        rotation: 0
                      });
                    }}
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

              {/* Right: Zones list */}
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
                  Zones configurées ({editingZones.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {editingZones.map((zone) => (
                    <div
                      key={zone.id}
                      onClick={() => handleSelectZone(zone.id)}
                      style={{
                        padding: '12px',
                        backgroundColor: selectedZoneId === zone.id ? '#2a2a2a' : '#1a1a1a',
                        borderRadius: '4px',
                        border: selectedZoneId === zone.id ? '2px solid #8eff36' : '1px solid #2a2a2a',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      {zone.thumbnailUrl && (
                        <img
                          src={zone.thumbnailUrl}
                          alt={zone.name}
                          style={{
                            width: '100%',
                            height: '80px',
                            objectFit: 'contain',
                            borderRadius: '4px',
                            backgroundColor: '#0a0a0a'
                          }}
                        />
                      )}
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
                            {zone.name}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: '#a0a0a0',
                            fontFamily: 'var(--stepn-font-body)'
                          }}>
                            {zone.isLogo ? 'Logo' : 'Texte'}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteZone(zone.id);
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
                disabled={!selectedModel3DId || editingZones.length === 0}
                style={{
                  padding: '10px 20px',
                  backgroundColor: (!selectedModel3DId || editingZones.length === 0) ? '#4a4a4a' : '#8eff36',
                  color: (!selectedModel3DId || editingZones.length === 0) ? '#a0a0a0' : '#000000',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: (!selectedModel3DId || editingZones.length === 0) ? 'not-allowed' : 'pointer',
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
