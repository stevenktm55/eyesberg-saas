"use client";

import { useEffect, useState } from "react";
import { MaterialMapPreview3D } from "@/components/MaterialMapPreview3D";
import { MaterialMapPreview3DStatic } from "@/components/MaterialMapPreview3DStatic";

type MaterialMap = {
  id: string;
  name: string;
  diffuseMap?: string;
  normalMap?: string;
  roughnessMap?: string;
  metalnessMap?: string;
  aoMap?: string;
};

type MapSettings = {
  diffuse: { intensity: number; scale: number; loaded: boolean };
  normal: { intensity: number; scale: number; loaded: boolean };
  roughness: { intensity: number; scale: number; loaded: boolean };
  metallic: { intensity: number; scale: number; loaded: boolean };
  ao: { intensity: number; scale: number; loaded: boolean };
};

export default function MaterialMapsConfigPage() {
  const [materialMaps, setMaterialMaps] = useState<MaterialMap[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingMapType, setUploadingMapType] = useState<string | null>(null);
  const [selectedMap, setSelectedMap] = useState<MaterialMap | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newMapName, setNewMapName] = useState("");
  const [mapSettings, setMapSettings] = useState<MapSettings>({
    diffuse: { intensity: 100, scale: 1.0, loaded: true },
    normal: { intensity: 100, scale: 1.0, loaded: true },
    roughness: { intensity: 100, scale: 1.0, loaded: false },
    metallic: { intensity: 100, scale: 1.0, loaded: false },
    ao: { intensity: 100, scale: 1.0, loaded: false },
  });

  useEffect(() => {
    fetchMaterialMaps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchMaterialMaps() {
    try {
      const res = await fetch("/api/material-maps");
      if (!res.ok) throw new Error("Failed to fetch material maps");
      const data = await res.json();
      setMaterialMaps(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching material maps:", error);
    }
  }

  useEffect(() => {
    if (selectedMap) {
      // Load settings from material_map_files
      const files = (selectedMap as any).material_map_files || [];
      const diffuseFile = files.find((f: any) => f.map_type === 'diffuse');
      const normalFile = files.find((f: any) => f.map_type === 'normal');
      const roughnessFile = files.find((f: any) => f.map_type === 'roughness');
      const metallicFile = files.find((f: any) => f.map_type === 'metallic');
      const aoFile = files.find((f: any) => f.map_type === 'ao');

      setMapSettings({
        diffuse: {
          intensity: diffuseFile?.intensity || 100,
          scale: diffuseFile?.scale || 1.0,
          loaded: !!diffuseFile,
        },
        normal: {
          intensity: normalFile?.intensity || 100,
          scale: normalFile?.scale || 1.0,
          loaded: !!normalFile,
        },
        roughness: {
          intensity: roughnessFile?.intensity || 100,
          scale: roughnessFile?.scale || 1.0,
          loaded: !!roughnessFile,
        },
        metallic: {
          intensity: metallicFile?.intensity || 100,
          scale: metallicFile?.scale || 1.0,
          loaded: !!metallicFile,
        },
        ao: {
          intensity: aoFile?.intensity || 100,
          scale: aoFile?.scale || 1.0,
          loaded: !!aoFile,
        },
      });
    }
  }, [selectedMap]);

  function openModal(map: MaterialMap) {
    setSelectedMap(map);
  }

  function closeModal() {
    setSelectedMap(null);
  }

  function openCreateModal() {
    setIsCreating(true);
    setNewMapName("");
  }

  function closeCreateModal() {
    setIsCreating(false);
    setNewMapName("");
  }

  async function createMaterialMap() {
    if (!newMapName.trim()) {
      alert("Veuillez entrer un nom pour le material map");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/material-maps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newMapName.trim() }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create material map");
      }

      await fetchMaterialMaps();
      closeCreateModal();
    } catch (error: any) {
      console.error("Error creating material map:", error);
      alert(error.message || "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  }

  function updateMapSetting(
    mapType: keyof MapSettings,
    setting: 'intensity' | 'scale',
    value: number
  ) {
    setMapSettings((prev) => ({
      ...prev,
      [mapType]: {
        ...prev[mapType],
        [setting]: value,
      },
    }));
  }

  async function handleFileUpload(mapType: keyof MapSettings, file: File) {
    console.log('handleFileUpload called:', mapType, file.name, 'selectedMap:', selectedMap?.id);
    if (!selectedMap) {
      console.error('No selected map');
      alert('Aucun material map sélectionné');
      return;
    }

    console.log('Setting uploadingMapType to:', mapType);
    setUploadingMapType(mapType);
    setLoading(true);
    console.log('State updated, uploadingMapType should be:', mapType);
    try {
      const formData = new FormData();
      formData.append('materialMapId', selectedMap.id);
      formData.append('mapType', mapType);
      formData.append('file', file);
      formData.append('intensity', mapSettings[mapType].intensity.toString());
      formData.append('scale', mapSettings[mapType].scale.toString());

      const res = await fetch("/api/material-maps/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to upload file");
      }

      // Recharger les material maps pour avoir les nouveaux fichiers
      await fetchMaterialMaps();
      
      // Recharger le material map sélectionné avec les nouveaux fichiers
      const updatedMaps = await fetch("/api/material-maps").then(r => r.json());
      const updatedMap = updatedMaps.find((m: any) => m.id === selectedMap.id);
      if (updatedMap) {
        setSelectedMap(updatedMap);
      }

      // Mettre à jour les settings pour indiquer que le fichier est chargé
      setMapSettings((prev) => ({
        ...prev,
        [mapType]: {
          ...prev[mapType],
          loaded: true,
        },
      }));
    } catch (error: any) {
      console.error("Error uploading file:", error);
      alert(error.message || "Erreur lors de l'upload du fichier");
    } finally {
      setLoading(false);
      setUploadingMapType(null);
    }
  }

  async function saveMap() {
    if (!selectedMap) return;
    
    setLoading(true);
    try {
      const settings = [
        { mapType: 'diffuse', intensity: mapSettings.diffuse.intensity, scale: mapSettings.diffuse.scale },
        { mapType: 'normal', intensity: mapSettings.normal.intensity, scale: mapSettings.normal.scale },
        { mapType: 'roughness', intensity: mapSettings.roughness.intensity, scale: mapSettings.roughness.scale },
        { mapType: 'metallic', intensity: mapSettings.metallic.intensity, scale: mapSettings.metallic.scale },
        { mapType: 'ao', intensity: mapSettings.ao.intensity, scale: mapSettings.ao.scale },
      ];

      const res = await fetch("/api/material-maps", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedMap.id,
          settings,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save material map");
      }
      
      await fetchMaterialMaps();
      closeModal();
    } catch (error) {
      console.error("Error saving material map:", error);
      alert("Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  }

  async function deleteMap() {
    if (!selectedMap) return;
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${selectedMap.name}" ?`)) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/material-maps?id=${encodeURIComponent(selectedMap.id)}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete");
      await fetchMaterialMaps();
      closeModal();
    } catch (error) {
      console.error("Error deleting material map:", error);
      alert("Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  }

  const filteredMaps = materialMaps.filter((map) =>
    map.name.toLowerCase().includes(searchQuery.toLowerCase())
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
            placeholder="Rechercher une texture..."
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
          Nouveau material map
        </button>
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '24px'
      }}>
        {filteredMaps.map((map) => (
          <div
            key={map.id}
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
            onClick={() => openModal(map)}
          >
            {/* Preview 3D Static */}
            <div style={{
              width: '100%',
              aspectRatio: '1',
              backgroundColor: '#0a0a0a',
              borderBottom: '1px solid #2a2a2a',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {(() => {
                const files = (map as any).material_map_files || [];
                const diffuseFile = files.find((f: any) => f.map_type === 'diffuse');
                const normalFile = files.find((f: any) => f.map_type === 'normal');
                const roughnessFile = files.find((f: any) => f.map_type === 'roughness');
                const metallicFile = files.find((f: any) => f.map_type === 'metallic');
                const aoFile = files.find((f: any) => f.map_type === 'ao');

                return (
                  <MaterialMapPreview3DStatic
                    diffuseUrl={diffuseFile?.file_url || null}
                    normalUrl={normalFile?.file_url || null}
                    roughnessUrl={roughnessFile?.file_url || null}
                    metallicUrl={metallicFile?.file_url || null}
                    aoUrl={aoFile?.file_url || null}
                    style={{ width: '100%', height: '100%' }}
                  />
                );
              })()}
            </div>
            
            {/* Info */}
            <div style={{ padding: '16px' }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#ffffff',
                marginBottom: '12px',
                fontFamily: 'var(--stepn-font-body)'
              }}>
                {map.name}
              </h3>
              <div style={{
                fontSize: '12px',
                color: '#a0a0a0',
                fontFamily: 'var(--stepn-font-body)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                {map.diffuseMap && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#8eff36', fontSize: '10px' }}>●</span>
                    <span>Diffuse map</span>
                  </div>
                )}
                {map.normalMap && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#8eff36', fontSize: '10px' }}>●</span>
                    <span>Normal map</span>
                  </div>
                )}
                {map.roughnessMap && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#8eff36', fontSize: '10px' }}>●</span>
                    <span>Roughness map</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {/* Add New Card */}
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
            Ajouter un material
          </p>
        </div>
      </div>

      {/* Create Material Map Modal */}
      {isCreating && (
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
            if (e.target === e.currentTarget) closeCreateModal();
          }}
        >
          <div
            style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '12px',
              border: '1px solid #2a2a2a',
              width: '100%',
              maxWidth: '500px',
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
                Nouveau Material Map
              </h2>
              <button
                onClick={closeCreateModal}
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
              display: 'flex',
              flexDirection: 'column',
              gap: '24px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#ffffff',
                  marginBottom: '8px',
                  fontFamily: 'var(--stepn-font-body)'
                }}>
                  Nom du Material Map
                </label>
                <input
                  type="text"
                  value={newMapName}
                  onChange={(e) => setNewMapName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      createMaterialMap();
                    }
                  }}
                  placeholder="Ex: Tissu coton, Cuir noir..."
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
            </div>

            {/* Footer Actions */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              padding: '24px',
              borderTop: '1px solid #2a2a2a'
            }}>
              <button
                onClick={closeCreateModal}
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
                onClick={createMaterialMap}
                disabled={loading || !newMapName.trim()}
                style={{
                  padding: '12px 24px',
                  backgroundColor: loading || !newMapName.trim() ? '#2a2a2a' : '#8eff36',
                  border: 'none',
                  borderRadius: '8px',
                  color: loading || !newMapName.trim() ? '#666666' : '#000000',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: loading || !newMapName.trim() ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--stepn-font-body)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!loading && newMapName.trim()) {
                    e.currentTarget.style.opacity = '0.9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading && newMapName.trim()) {
                    e.currentTarget.style.opacity = '1';
                  }
                }}
              >
                {loading ? 'Création...' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Material Map Modal */}
      {selectedMap && (
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
                {selectedMap.name} - Material Maps
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
              {/* Left: Material Preview */}
              <div style={{
                flex: '1.5',
                padding: '24px',
                borderRight: '1px solid #2a2a2a',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
              }}>
                <div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#ffffff',
                    marginBottom: '16px',
                    fontFamily: 'var(--stepn-font-body)'
                  }}>
                    Prévisualisation Material
                  </h3>
                  <div style={{
                    width: '100%',
                    aspectRatio: '1',
                    backgroundColor: '#0a0a0a',
                    borderRadius: '8px',
                    border: '1px solid #2a2a2a',
                    minHeight: '300px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {(() => {
                      const files = (selectedMap as any)?.material_map_files || [];
                      const diffuseFile = files.find((f: any) => f.map_type === 'diffuse');
                      const normalFile = files.find((f: any) => f.map_type === 'normal');
                      const roughnessFile = files.find((f: any) => f.map_type === 'roughness');
                      const metallicFile = files.find((f: any) => f.map_type === 'metallic');
                      const aoFile = files.find((f: any) => f.map_type === 'ao');

                      return (
                        <MaterialMapPreview3D
                          diffuseUrl={diffuseFile?.file_url || null}
                          normalUrl={normalFile?.file_url || null}
                          roughnessUrl={roughnessFile?.file_url || null}
                          metallicUrl={metallicFile?.file_url || null}
                          aoUrl={aoFile?.file_url || null}
                          diffuseIntensity={mapSettings.diffuse.intensity}
                          normalIntensity={mapSettings.normal.intensity}
                          roughnessIntensity={mapSettings.roughness.intensity}
                          metallicIntensity={mapSettings.metallic.intensity}
                          aoIntensity={mapSettings.ao.intensity}
                          diffuseScale={mapSettings.diffuse.scale}
                          normalScale={mapSettings.normal.scale}
                          roughnessScale={mapSettings.roughness.scale}
                          metallicScale={mapSettings.metallic.scale}
                          aoScale={mapSettings.ao.scale}
                          style={{ width: '100%', height: '100%' }}
                        />
                      );
                    })()}
                  </div>
                </div>

              </div>

              {/* Right: Map Settings */}
              <div style={{
                flex: '1',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                overflowY: 'auto'
              }}>
                {/* Diffuse Map */}
                <div style={{
                  padding: '20px',
                  backgroundColor: '#0a0a0a',
                  borderRadius: '8px',
                  border: '1px solid #2a2a2a'
                }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#ffffff',
                    marginBottom: '4px',
                    fontFamily: 'var(--stepn-font-body)'
                  }}>
                    Diffuse Map
                  </h4>
                  <p style={{
                    fontSize: '12px',
                    color: '#a0a0a0',
                    marginBottom: '16px',
                    fontFamily: 'var(--stepn-font-body)'
                  }}>
                    Couleur de base du material
                  </p>
                  
                  <label 
                    htmlFor={`diffuse-upload-${selectedMap?.id || 'new'}`}
                    style={{
                      display: 'block',
                      marginBottom: '16px',
                      cursor: 'pointer'
                    }}
                    onClick={() => console.log('Label clicked for diffuse')}
                  >
                    <div style={{
                      border: '2px dashed #2a2a2a',
                      borderRadius: '8px',
                      padding: '32px',
                      textAlign: 'center',
                      transition: 'all 0.2s',
                      minHeight: '120px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#8eff36';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#2a2a2a';
                    }}>
                      {(() => {
                        const files = (selectedMap as any)?.material_map_files || [];
                        const diffuseFile = files.find((f: any) => f.map_type === 'diffuse');
                        const fileUrl = diffuseFile?.file_url;
                        
                        if (uploadingMapType === 'diffuse') {
                          return (
                            <div style={{
                              fontSize: '12px',
                              color: '#8eff36',
                              fontFamily: 'var(--stepn-font-body)'
                            }}>
                              Upload en cours...
                            </div>
                          );
                        }
                        
                        if (fileUrl) {
                          return (
                            <img 
                              src={fileUrl} 
                              alt="Diffuse map"
                              style={{
                                maxWidth: '100%',
                                maxHeight: '200px',
                                borderRadius: '4px',
                                objectFit: 'contain'
                              }}
                            />
                          );
                        }
                        
                        return (
                          <>
                            <div style={{
                              fontSize: '24px',
                              color: '#a0a0a0',
                              marginBottom: '8px'
                            }}>↑</div>
                            <div style={{
                              fontSize: '12px',
                              color: '#a0a0a0',
                              fontFamily: 'var(--stepn-font-body)'
                            }}>
                              Cliquez pour uploader
                            </div>
                            <div style={{
                              fontSize: '10px',
                              color: '#666666',
                              marginTop: '4px',
                              fontFamily: 'var(--stepn-font-body)'
                            }}>
                              PNG, JPG (max 4096x4096)
                            </div>
                          </>
                        );
                      })()}
                    </div>
                    <input
                      id={`diffuse-upload-${selectedMap?.id || 'new'}`}
                      type="file"
                      accept=".png,.jpg,.jpeg"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        console.log('File input changed:', e.target.files);
                        const file = e.target.files?.[0];
                        if (file) {
                          console.log('Calling handleFileUpload with file:', file.name);
                          handleFileUpload('diffuse', file);
                        } else {
                          console.log('No file selected');
                        }
                      }}
                    />
                  </label>

                  {/* Intensity Slider */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px'
                    }}>
                      <label style={{
                        fontSize: '12px',
                        color: '#ffffff',
                        fontFamily: 'var(--stepn-font-body)'
                      }}>
                        Intensité
                      </label>
                      <span style={{
                        fontSize: '12px',
                        color: '#8eff36',
                        fontFamily: 'var(--stepn-font-body)'
                      }}>
                        {mapSettings.diffuse.intensity}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={mapSettings.diffuse.intensity}
                      onChange={(e) => updateMapSetting('diffuse', 'intensity', Number(e.target.value))}
                      style={{
                        width: '100%',
                        height: '6px',
                        borderRadius: '3px',
                        backgroundColor: '#2a2a2a',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    />
                  </div>

                  {/* Scale Slider */}
                  <div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px'
                    }}>
                      <label style={{
                        fontSize: '12px',
                        color: '#ffffff',
                        fontFamily: 'var(--stepn-font-body)'
                      }}>
                        Échelle
                      </label>
                      <span style={{
                        fontSize: '12px',
                        color: '#8eff36',
                        fontFamily: 'var(--stepn-font-body)'
                      }}>
                        {mapSettings.diffuse.scale.toFixed(1)}x
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="50"
                      step="0.1"
                      value={mapSettings.diffuse.scale}
                      onChange={(e) => updateMapSetting('diffuse', 'scale', Number(e.target.value))}
                      style={{
                        width: '100%',
                        height: '6px',
                        borderRadius: '3px',
                        backgroundColor: '#2a2a2a',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    />
                  </div>
                </div>

                {/* Normal Map */}
                <div style={{
                  padding: '20px',
                  backgroundColor: '#0a0a0a',
                  borderRadius: '8px',
                  border: '1px solid #2a2a2a'
                }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#ffffff',
                    marginBottom: '4px',
                    fontFamily: 'var(--stepn-font-body)'
                  }}>
                    Normal Map
                  </h4>
                  <p style={{
                    fontSize: '12px',
                    color: '#a0a0a0',
                    marginBottom: '16px',
                    fontFamily: 'var(--stepn-font-body)'
                  }}>
                    Relief et détails de surface
                  </p>
                  
                  <label style={{
                    display: 'block',
                    marginBottom: '16px',
                    cursor: 'pointer'
                  }}>
                    <div style={{
                      border: '2px dashed #2a2a2a',
                      borderRadius: '8px',
                      padding: '32px',
                      textAlign: 'center',
                      transition: 'all 0.2s',
                      minHeight: '120px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#8eff36';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#2a2a2a';
                    }}>
                      {(() => {
                        const files = (selectedMap as any)?.material_map_files || [];
                        const normalFile = files.find((f: any) => f.map_type === 'normal');
                        const fileUrl = normalFile?.file_url;
                        
                        if (uploadingMapType === 'normal') {
                          return (
                            <div style={{
                              fontSize: '12px',
                              color: '#8eff36',
                              fontFamily: 'var(--stepn-font-body)'
                            }}>
                              Upload en cours...
                            </div>
                          );
                        }
                        
                        if (fileUrl) {
                          return (
                            <img 
                              src={fileUrl} 
                              alt="Normal map"
                              style={{
                                maxWidth: '100%',
                                maxHeight: '200px',
                                borderRadius: '4px',
                                objectFit: 'contain'
                              }}
                            />
                          );
                        }
                        
                        return (
                          <>
                            <div style={{
                              fontSize: '24px',
                              color: '#a0a0a0',
                              marginBottom: '8px'
                            }}>↑</div>
                            <div style={{
                              fontSize: '12px',
                              color: '#a0a0a0',
                              fontFamily: 'var(--stepn-font-body)'
                            }}>
                              Cliquez pour uploader
                            </div>
                            <div style={{
                              fontSize: '10px',
                              color: '#666666',
                              marginTop: '4px',
                              fontFamily: 'var(--stepn-font-body)'
                            }}>
                              PNG, JPG (max 4096x4096)
                            </div>
                          </>
                        );
                      })()}
                    </div>
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload('normal', file);
                      }}
                    />
                  </label>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px'
                    }}>
                      <label style={{
                        fontSize: '12px',
                        color: '#ffffff',
                        fontFamily: 'var(--stepn-font-body)'
                      }}>
                        Intensité
                      </label>
                      <span style={{
                        fontSize: '12px',
                        color: '#8eff36',
                        fontFamily: 'var(--stepn-font-body)'
                      }}>
                        {mapSettings.normal.intensity}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={mapSettings.normal.intensity}
                      onChange={(e) => updateMapSetting('normal', 'intensity', Number(e.target.value))}
                      style={{
                        width: '100%',
                        height: '6px',
                        borderRadius: '3px',
                        backgroundColor: '#2a2a2a',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    />
                  </div>

                  <div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px'
                    }}>
                      <label style={{
                        fontSize: '12px',
                        color: '#ffffff',
                        fontFamily: 'var(--stepn-font-body)'
                      }}>
                        Échelle
                      </label>
                      <span style={{
                        fontSize: '12px',
                        color: '#8eff36',
                        fontFamily: 'var(--stepn-font-body)'
                      }}>
                        {mapSettings.normal.scale.toFixed(1)}x
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="50"
                      step="0.1"
                      value={mapSettings.normal.scale}
                      onChange={(e) => updateMapSetting('normal', 'scale', Number(e.target.value))}
                      style={{
                        width: '100%',
                        height: '6px',
                        borderRadius: '3px',
                        backgroundColor: '#2a2a2a',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    />
                  </div>
                </div>

                {/* Roughness Map */}
                <div style={{
                  padding: '20px',
                  backgroundColor: '#0a0a0a',
                  borderRadius: '8px',
                  border: '1px solid #2a2a2a'
                }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#ffffff',
                    marginBottom: '4px',
                    fontFamily: 'var(--stepn-font-body)'
                  }}>
                    Roughness Map
                  </h4>
                  <p style={{
                    fontSize: '12px',
                    color: '#a0a0a0',
                    marginBottom: '16px',
                    fontFamily: 'var(--stepn-font-body)'
                  }}>
                    Rugosité du material
                  </p>
                  
                  <label style={{
                    display: 'block',
                    marginBottom: '16px',
                    cursor: 'pointer'
                  }}>
                    <div style={{
                      border: '2px dashed #2a2a2a',
                      borderRadius: '8px',
                      padding: '32px',
                      textAlign: 'center',
                      transition: 'all 0.2s',
                      minHeight: '120px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#8eff36';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#2a2a2a';
                    }}>
                      {(() => {
                        const files = (selectedMap as any)?.material_map_files || [];
                        const roughnessFile = files.find((f: any) => f.map_type === 'roughness');
                        const fileUrl = roughnessFile?.file_url;
                        
                        if (uploadingMapType === 'roughness') {
                          return (
                            <div style={{
                              fontSize: '12px',
                              color: '#8eff36',
                              fontFamily: 'var(--stepn-font-body)'
                            }}>
                              Upload en cours...
                            </div>
                          );
                        }
                        
                        if (fileUrl) {
                          return (
                            <img 
                              src={fileUrl} 
                              alt="Roughness map"
                              style={{
                                maxWidth: '100%',
                                maxHeight: '200px',
                                borderRadius: '4px',
                                objectFit: 'contain'
                              }}
                            />
                          );
                        }
                        
                        return (
                          <>
                            <div style={{
                              fontSize: '24px',
                              color: '#a0a0a0',
                              marginBottom: '8px'
                            }}>↑</div>
                            <div style={{
                              fontSize: '12px',
                              color: '#a0a0a0',
                              fontFamily: 'var(--stepn-font-body)'
                            }}>
                              Cliquez pour uploader
                            </div>
                            <div style={{
                              fontSize: '10px',
                              color: '#666666',
                              marginTop: '4px',
                              fontFamily: 'var(--stepn-font-body)'
                            }}>
                              PNG, JPG (max 4096x4096)
                            </div>
                          </>
                        );
                      })()}
                    </div>
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload('roughness', file);
                      }}
                    />
                  </label>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px'
                    }}>
                      <label style={{
                        fontSize: '12px',
                        color: '#ffffff',
                        fontFamily: 'var(--stepn-font-body)'
                      }}>
                        Intensité
                      </label>
                      <span style={{
                        fontSize: '12px',
                        color: '#8eff36',
                        fontFamily: 'var(--stepn-font-body)'
                      }}>
                        {mapSettings.roughness.intensity}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={mapSettings.roughness.intensity}
                      onChange={(e) => updateMapSetting('roughness', 'intensity', Number(e.target.value))}
                      style={{
                        width: '100%',
                        height: '6px',
                        borderRadius: '3px',
                        backgroundColor: '#2a2a2a',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    />
                  </div>

                  <div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px'
                    }}>
                      <label style={{
                        fontSize: '12px',
                        color: '#ffffff',
                        fontFamily: 'var(--stepn-font-body)'
                      }}>
                        Échelle
                      </label>
                      <span style={{
                        fontSize: '12px',
                        color: '#8eff36',
                        fontFamily: 'var(--stepn-font-body)'
                      }}>
                        {mapSettings.roughness.scale.toFixed(1)}x
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="50"
                      step="0.1"
                      value={mapSettings.roughness.scale}
                      onChange={(e) => updateMapSetting('roughness', 'scale', Number(e.target.value))}
                      style={{
                        width: '100%',
                        height: '6px',
                        borderRadius: '3px',
                        backgroundColor: '#2a2a2a',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    />
                  </div>
                </div>

                {/* Metallic Map */}
                <div style={{
                  padding: '20px',
                  backgroundColor: '#0a0a0a',
                  borderRadius: '8px',
                  border: '1px solid #2a2a2a'
                }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#ffffff',
                    marginBottom: '4px',
                    fontFamily: 'var(--stepn-font-body)'
                  }}>
                    Metallic Map
                  </h4>
                  <p style={{
                    fontSize: '12px',
                    color: '#a0a0a0',
                    marginBottom: '16px',
                    fontFamily: 'var(--stepn-font-body)'
                  }}>
                    Propriétés métalliques
                  </p>
                  
                  <label style={{
                    display: 'block',
                    marginBottom: '16px',
                    cursor: 'pointer'
                  }}>
                    <div style={{
                      border: '2px dashed #2a2a2a',
                      borderRadius: '8px',
                      padding: '32px',
                      textAlign: 'center',
                      transition: 'all 0.2s',
                      minHeight: '120px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#8eff36';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#2a2a2a';
                    }}>
                      {(() => {
                        const files = (selectedMap as any)?.material_map_files || [];
                        const metallicFile = files.find((f: any) => f.map_type === 'metallic');
                        const fileUrl = metallicFile?.file_url;
                        
                        if (uploadingMapType === 'metallic') {
                          return (
                            <div style={{
                              fontSize: '12px',
                              color: '#8eff36',
                              fontFamily: 'var(--stepn-font-body)'
                            }}>
                              Upload en cours...
                            </div>
                          );
                        }
                        
                        if (fileUrl) {
                          return (
                            <img 
                              src={fileUrl} 
                              alt="Metallic map"
                              style={{
                                maxWidth: '100%',
                                maxHeight: '200px',
                                borderRadius: '4px',
                                objectFit: 'contain'
                              }}
                            />
                          );
                        }
                        
                        return (
                          <>
                            <div style={{
                              fontSize: '24px',
                              color: '#a0a0a0',
                              marginBottom: '8px'
                            }}>↑</div>
                            <div style={{
                              fontSize: '12px',
                              color: '#a0a0a0',
                              fontFamily: 'var(--stepn-font-body)'
                            }}>
                              Cliquez pour uploader
                            </div>
                            <div style={{
                              fontSize: '10px',
                              color: '#666666',
                              marginTop: '4px',
                              fontFamily: 'var(--stepn-font-body)'
                            }}>
                              PNG, JPG (max 4096x4096)
                            </div>
                          </>
                        );
                      })()}
                    </div>
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload('metallic', file);
                      }}
                    />
                  </label>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px'
                    }}>
                      <label style={{
                        fontSize: '12px',
                        color: '#ffffff',
                        fontFamily: 'var(--stepn-font-body)'
                      }}>
                        Intensité
                      </label>
                      <span style={{
                        fontSize: '12px',
                        color: '#8eff36',
                        fontFamily: 'var(--stepn-font-body)'
                      }}>
                        {mapSettings.metallic.intensity}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={mapSettings.metallic.intensity}
                      onChange={(e) => updateMapSetting('metallic', 'intensity', Number(e.target.value))}
                      style={{
                        width: '100%',
                        height: '6px',
                        borderRadius: '3px',
                        backgroundColor: '#2a2a2a',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    />
                  </div>

                  <div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px'
                    }}>
                      <label style={{
                        fontSize: '12px',
                        color: '#ffffff',
                        fontFamily: 'var(--stepn-font-body)'
                      }}>
                        Échelle
                      </label>
                      <span style={{
                        fontSize: '12px',
                        color: '#8eff36',
                        fontFamily: 'var(--stepn-font-body)'
                      }}>
                        {mapSettings.metallic.scale.toFixed(1)}x
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="50"
                      step="0.1"
                      value={mapSettings.metallic.scale}
                      onChange={(e) => updateMapSetting('metallic', 'scale', Number(e.target.value))}
                      style={{
                        width: '100%',
                        height: '6px',
                        borderRadius: '3px',
                        backgroundColor: '#2a2a2a',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    />
                  </div>
                </div>

                {/* AO Map */}
                <div style={{
                  padding: '20px',
                  backgroundColor: '#0a0a0a',
                  borderRadius: '8px',
                  border: '1px solid #2a2a2a'
                }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#ffffff',
                    marginBottom: '4px',
                    fontFamily: 'var(--stepn-font-body)'
                  }}>
                    AO Map
                  </h4>
                  <p style={{
                    fontSize: '12px',
                    color: '#a0a0a0',
                    marginBottom: '16px',
                    fontFamily: 'var(--stepn-font-body)'
                  }}>
                    Occlusion ambiante pour les ombres
                  </p>
                  
                  <label style={{
                    display: 'block',
                    marginBottom: '16px',
                    cursor: 'pointer'
                  }}>
                    <div style={{
                      border: '2px dashed #2a2a2a',
                      borderRadius: '8px',
                      padding: '32px',
                      textAlign: 'center',
                      transition: 'all 0.2s',
                      minHeight: '120px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#8eff36';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#2a2a2a';
                    }}>
                      {(() => {
                        const files = (selectedMap as any)?.material_map_files || [];
                        const aoFile = files.find((f: any) => f.map_type === 'ao');
                        const fileUrl = aoFile?.file_url;
                        
                        if (uploadingMapType === 'ao') {
                          return (
                            <div style={{
                              fontSize: '12px',
                              color: '#8eff36',
                              fontFamily: 'var(--stepn-font-body)'
                            }}>
                              Upload en cours...
                            </div>
                          );
                        }
                        
                        if (fileUrl) {
                          return (
                            <img 
                              src={fileUrl} 
                              alt="AO map"
                              style={{
                                maxWidth: '100%',
                                maxHeight: '200px',
                                borderRadius: '4px',
                                objectFit: 'contain'
                              }}
                            />
                          );
                        }
                        
                        return (
                          <>
                            <div style={{
                              fontSize: '24px',
                              color: '#a0a0a0',
                              marginBottom: '8px'
                            }}>↑</div>
                            <div style={{
                              fontSize: '12px',
                              color: '#a0a0a0',
                              fontFamily: 'var(--stepn-font-body)'
                            }}>
                              Cliquez pour uploader
                            </div>
                            <div style={{
                              fontSize: '10px',
                              color: '#666666',
                              marginTop: '4px',
                              fontFamily: 'var(--stepn-font-body)'
                            }}>
                              PNG, JPG (max 4096x4096)
                            </div>
                          </>
                        );
                      })()}
                    </div>
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload('ao', file);
                      }}
                    />
                  </label>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px'
                    }}>
                      <label style={{
                        fontSize: '12px',
                        color: '#ffffff',
                        fontFamily: 'var(--stepn-font-body)'
                      }}>
                        Intensité
                      </label>
                      <span style={{
                        fontSize: '12px',
                        color: '#8eff36',
                        fontFamily: 'var(--stepn-font-body)'
                      }}>
                        {mapSettings.ao.intensity}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={mapSettings.ao.intensity}
                      onChange={(e) => updateMapSetting('ao', 'intensity', Number(e.target.value))}
                      style={{
                        width: '100%',
                        height: '6px',
                        borderRadius: '3px',
                        backgroundColor: '#2a2a2a',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    />
                  </div>

                  <div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px'
                    }}>
                      <label style={{
                        fontSize: '12px',
                        color: '#ffffff',
                        fontFamily: 'var(--stepn-font-body)'
                      }}>
                        Échelle
                      </label>
                      <span style={{
                        fontSize: '12px',
                        color: '#8eff36',
                        fontFamily: 'var(--stepn-font-body)'
                      }}>
                        {mapSettings.ao.scale.toFixed(1)}x
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="50"
                      step="0.1"
                      value={mapSettings.ao.scale}
                      onChange={(e) => updateMapSetting('ao', 'scale', Number(e.target.value))}
                      style={{
                        width: '100%',
                        height: '6px',
                        borderRadius: '3px',
                        backgroundColor: '#2a2a2a',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    />
                  </div>
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
                onClick={deleteMap}
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
                  onClick={saveMap}
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

