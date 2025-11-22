"use client";

import { useEffect, useState, useRef, Suspense, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { ModelViewer } from "@/components/ModelViewer";

type Zone = {
  id: string;
  name: string;
  model3d_id: string;
  position: [number, number, number]; // UV coordinates [u, v, 0]
  rotation: number; // Rotation in radians
  scale: number; // Scale factor
  width: number; // Width in UV space (0-1)
  height: number; // Height in UV space (0-1)
  createdAt?: string;
};

type Model3D = {
  id: string;
  name: string;
  glb_url?: string;
  glbUrl?: string;
};

// Composant pour afficher la preview UV2
function UV2Preview({ canvas }: { canvas: HTMLCanvasElement }) {
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  useEffect(() => {
    if (!previewCanvasRef.current || !canvas) return;
    
    const previewCtx = previewCanvasRef.current.getContext('2d');
    if (!previewCtx) return;
    
    // Copier le contenu du canvas UV2
    previewCanvasRef.current.width = canvas.width;
    previewCanvasRef.current.height = canvas.height;
    
    const updatePreview = () => {
      if (previewCanvasRef.current && canvas) {
        previewCtx.clearRect(0, 0, previewCanvasRef.current.width, previewCanvasRef.current.height);
        previewCtx.drawImage(canvas, 0, 0);
      }
    };
    
    // Mettre à jour immédiatement
    updatePreview();
    
    // Mettre à jour périodiquement
    const interval = setInterval(updatePreview, 100);
    
    return () => clearInterval(interval);
  }, [canvas]);
  
  return (
    <div style={{
      width: '300px',
      height: '300px',
      backgroundColor: '#1a1a1a',
      border: '1px solid #2a2a2a',
      borderRadius: '8px',
      padding: '8px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      <div style={{
        fontSize: '12px',
        fontWeight: '600',
        color: '#ffffff',
        fontFamily: 'var(--stepn-font-body)'
      }}>
        Preview UV2
      </div>
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        borderRadius: '4px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <canvas
          ref={previewCanvasRef}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            imageRendering: 'pixelated',
            display: 'block'
          }}
        />
      </div>
    </div>
  );
}

export default function ZonesConfigPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [models3D, setModels3D] = useState<Model3D[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedModel3DId, setSelectedModel3DId] = useState<string | null>(null);
  const [newZoneName, setNewZoneName] = useState("");
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [editingZones, setEditingZones] = useState<Zone[]>([]);
  const [isDraggingZone, setIsDraggingZone] = useState(false);
  const [isResizingZone, setIsResizingZone] = useState(false);
  const [isRotatingZone, setIsRotatingZone] = useState(false);
  const [isPlacingZone, setIsPlacingZone] = useState(false);
  const [uv2Canvas, setUv2Canvas] = useState<HTMLCanvasElement | null>(null);

  useEffect(() => {
    fetchZones();
    fetchModels3D();
  }, []);

  async function fetchZones() {
    try {
      setLoading(true);
      // TODO: Créer l'API route pour récupérer les zones
      // const res = await fetch('/api/zones');
      // if (res.ok) {
      //   const data = await res.json();
      //   setZones(data);
      // }
      setZones([]);
    } catch (error) {
      console.error('Error fetching zones:', error);
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

  function handleAddZone() {
    if (!selectedModel3DId) {
      alert('Veuillez d\'abord sélectionner un modèle 3D');
      return;
    }
    setIsPlacingZone(true);
  }

  function handleZonePlaced(position: [number, number, number]) {
    if (!selectedModel3DId) return;
    
    console.log('📍 Zone placed at position:', position);
    
    const newZone: Zone = {
      id: `temp-${Date.now()}`,
      name: newZoneName || `Zone ${editingZones.length + 1}`,
      model3d_id: selectedModel3DId,
      position: position,
      rotation: 0,
      scale: 1,
      width: 0.1, // Default width (10% of UV space)
      height: 0.1 // Default height (10% of UV space)
    };
    
    console.log('✅ Creating new zone:', newZone);
    setEditingZones([...editingZones, newZone]);
    setSelectedZoneId(newZone.id);
    setIsPlacingZone(false);
  }

  function handleUpdateZonePosition(zoneId: string, position: [number, number, number]) {
    setEditingZones(editingZones.map(zone => 
      zone.id === zoneId 
        ? { ...zone, position }
        : zone
    ));
  }

  function handleUpdateZoneRotation(zoneId: string, rotation: number) {
    setEditingZones(editingZones.map(zone => 
      zone.id === zoneId 
        ? { ...zone, rotation }
        : zone
    ));
  }

  function handleUpdateZoneScale(zoneId: string, scale: number) {
    setEditingZones(editingZones.map(zone => 
      zone.id === zoneId 
        ? { ...zone, scale }
        : zone
    ));
  }

  function handleCreateZone() {
    if (!selectedModel3DId || !newZoneName || editingZones.length === 0) {
      alert('Veuillez sélectionner un modèle 3D, donner un nom à la zone et ajouter au moins une zone');
      return;
    }
    // TODO: Implémenter la création de zone via API
    console.log('Creating zones:', editingZones);
    // Pour l'instant, on ajoute juste aux zones existantes
    setZones([...zones, ...editingZones]);
    setShowCreateModal(false);
    setNewZoneName("");
    setSelectedModel3DId(null);
    setEditingZones([]);
    setSelectedZoneId(null);
    setIsPlacingZone(false);
  }

  const selectedModel = models3D.find(m => m.id === selectedModel3DId);
  const modelUrl = selectedModel?.glb_url || selectedModel?.glbUrl || '';

  // Convertir les zones en format compatible avec ModelViewer (comme textZones)
  const textZonesForViewer = editingZones.map(zone => ({
    id: zone.id,
    name: zone.name,
    position: zone.position,
    color: '#000000',
    image: undefined,
    categories: [],
    zoneCategory: 'text',
    view: 'front' as const,
    designId: null
  }));

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
          Zones de texte
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
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
          Créer une zone
        </button>
      </div>

      {loading ? (
        <p style={{ color: '#a0a0a0' }}>Chargement...</p>
      ) : zones.length === 0 ? (
        <div style={{
          padding: '48px',
          textAlign: 'center',
          backgroundColor: '#1a1a1a',
          borderRadius: '8px',
          border: '1px solid #2a2a2a'
        }}>
          <p style={{ color: '#a0a0a0', fontSize: '14px', marginBottom: '16px' }}>
            Aucune zone configurée
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
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
            Créer votre première zone
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '16px'
        }}>
          {zones.map((zone) => (
            <div
              key={zone.id}
              style={{
                padding: '16px',
                backgroundColor: '#1a1a1a',
                borderRadius: '8px',
                border: '1px solid #2a2a2a'
              }}
            >
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: '600',
                marginBottom: '8px',
                fontFamily: 'var(--stepn-font-body)'
              }}>
                {zone.name}
              </h3>
              <p style={{ 
                fontSize: '12px', 
                color: '#a0a0a0',
                fontFamily: 'var(--stepn-font-body)'
              }}>
                Modèle: {models3D.find(m => m.id === zone.model3d_id)?.name || 'N/A'}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Modal de création de zone */}
      {showCreateModal && (
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
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              width: '90%',
              maxWidth: '1400px',
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
                Créer une zone
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
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

            {/* Content */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              {/* Sélection du modèle 3D */}
              <div style={{
                padding: '20px',
                borderBottom: '1px solid #2a2a2a',
                display: 'flex',
                gap: '16px',
                alignItems: 'center'
              }}>
                <div style={{ flex: 1 }}>
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
                      backgroundColor: '#0a0a0a',
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
                <div style={{ flex: 1 }}>
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
                    value={newZoneName}
                    onChange={(e) => setNewZoneName(e.target.value)}
                    placeholder="Ex: Zone de texte avant"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: '#0a0a0a',
                      border: '1px solid #2a2a2a',
                      borderRadius: '4px',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontFamily: 'var(--stepn-font-body)',
                      outline: 'none'
                    }}
                  />
                </div>
                <button
                  onClick={handleAddZone}
                  disabled={!selectedModel3DId || isPlacingZone}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: (!selectedModel3DId || isPlacingZone) ? '#4a4a4a' : '#8eff36',
                    color: (!selectedModel3DId || isPlacingZone) ? '#a0a0a0' : '#000000',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: (!selectedModel3DId || isPlacingZone) ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--stepn-font-body)',
                    alignSelf: 'flex-end'
                  }}
                >
                  {isPlacingZone ? 'Cliquez sur le modèle pour placer la zone' : 'Ajouter une zone'}
                </button>
              </div>

              {/* Viewer 3D avec zones sur UV */}
              {modelUrl && (
                <div style={{
                  flex: 1,
                  minHeight: '400px',
                  position: 'relative',
                  backgroundColor: '#0a0a0a',
                  display: 'flex',
                  gap: '16px'
                }}>
                  {/* Viewer 3D principal */}
                  <div style={{
                    flex: 1,
                    position: 'relative',
                    backgroundColor: '#0a0a0a'
                  }}>
                  <Canvas
                    camera={{ position: [0, 0, 5], fov: 50 }}
                    gl={{ preserveDrawingBuffer: true }}
                    style={{ width: '100%', height: '100%' }}
                  >
                    <ambientLight intensity={0.4} color="#f5f5f5" />
                    <directionalLight position={[12, 18, 12]} intensity={2.0} color="#ffffff" />
                    <directionalLight position={[-8, 12, 8]} intensity={1.0} color="#f8f8ff" />
                    <directionalLight position={[0, 8, -15]} intensity={1.2} color="#fafafa" />
                    <Suspense fallback={null}>
                      <ModelViewer
                        url={modelUrl}
                        color="#ffffff"
                        // Pas de design 2D ni de material maps en mode zones
                        designTexture={undefined}
                        materialMaps={undefined}
                        // Utiliser les zones comme textes pour le système de placement
                        texts={editingZones.map(zone => {
                          const fontSize = zone.width * 2048; // Convertir width (0-1) en pixels
                          console.log('🔄 Mapping zone to text:', { id: zone.id, position: zone.position, width: zone.width, fontSize });
                          return {
                            id: zone.id,
                            content: '', // Pas de texte, juste un rectangle
                            position: zone.position,
                            rotation: zone.rotation,
                            fontSize: fontSize,
                            fontFamily: undefined,
                            category: 'nom' as const,
                            locked: false,
                            zoneCategory: 'text',
                            color: '#000000',
                            editable: true
                          };
                        })}
                        textZones={[]}
                        isPlacingText={isPlacingZone ? 'nom' : null}
                        onTextPlaced={(category, position) => {
                          if (isPlacingZone) {
                            handleZonePlaced(position);
                          }
                        }}
                        selectedTextId={selectedZoneId}
                        selectText={(id) => setSelectedZoneId(id)}
                        isDraggingText={isDraggingZone}
                        setIsDraggingText={setIsDraggingZone}
                        isRotatingText={isRotatingZone}
                        setIsRotatingText={setIsRotatingZone}
                        isResizingText={isResizingZone}
                        setIsResizingText={setIsResizingZone}
                        updateTextPosition={(id, position) => {
                          handleUpdateZonePosition(id, position);
                        }}
                        updateTextRotation={(id, rotation) => {
                          handleUpdateZoneRotation(id, rotation);
                        }}
                        updateTextSize={(id, size) => {
                          // Convertir size en scale
                          const zone = editingZones.find(z => z.id === id);
                          if (zone) {
                            const newScale = size / (zone.width * 2048);
                            handleUpdateZoneScale(id, newScale);
                          }
                        }}
                        // Mode zones : afficher des rectangles noirs au lieu de texte
                        renderZonesAsRectangles={true}
                        onCanvasReady={(canvas) => {
                          console.log('📥 Received canvas from ModelViewer:', canvas);
                          setUv2Canvas(canvas);
                        }}
                      />
                    </Suspense>
                    <OrbitControls
                      enablePan={false}
                      enableZoom={!isDraggingZone && !isRotatingZone && !isResizingZone}
                      enableRotate={!isDraggingZone && !isRotatingZone && !isResizingZone}
                      enabled={!isDraggingZone && !isRotatingZone && !isResizingZone}
                      minDistance={1}
                      maxDistance={10}
                    />
                  </Canvas>
                  </div>
                  
                  {/* Preview UV2 */}
                  <div style={{
                    width: '300px',
                    height: '300px',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '8px',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#ffffff',
                      fontFamily: 'var(--stepn-font-body)'
                    }}>
                      Preview UV2 {uv2Canvas ? '(Ready)' : '(Waiting...)'}
                    </div>
                    {uv2Canvas ? (
                      <UV2Preview canvas={uv2Canvas} />
                    ) : (
                      <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#ffffff',
                        borderRadius: '4px',
                        color: '#666',
                        fontSize: '12px',
                        fontFamily: 'var(--stepn-font-body)'
                      }}>
                        Canvas not ready yet...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div style={{
                padding: '20px',
                borderTop: '1px solid #2a2a2a',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px'
              }}>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingZones([]);
                    setSelectedZoneId(null);
                    setIsPlacingZone(false);
                  }}
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
                  onClick={handleCreateZone}
                  disabled={!selectedModel3DId || !newZoneName || editingZones.length === 0}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: (!selectedModel3DId || !newZoneName || editingZones.length === 0) ? '#4a4a4a' : '#8eff36',
                    color: (!selectedModel3DId || !newZoneName || editingZones.length === 0) ? '#a0a0a0' : '#000000',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: (!selectedModel3DId || !newZoneName || editingZones.length === 0) ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--stepn-font-body)'
                  }}
                >
                  Créer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
