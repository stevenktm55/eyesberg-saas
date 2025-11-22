"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, TransformControls } from "@react-three/drei";
import * as THREE from "three";

type Zone = {
  id: string;
  name: string;
  model3d_id: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  createdAt?: string;
};

type Model3D = {
  id: string;
  name: string;
  glb_url?: string;
  glbUrl?: string;
};

// Composant pour la zone 3D (plan noir avec opacité 70%)
function TextZone({ 
  position, 
  rotation, 
  scale, 
  isSelected, 
  onSelect,
  onUpdate,
  mode 
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  isSelected: boolean;
  onSelect: () => void;
  onUpdate?: (position: [number, number, number], rotation: [number, number, number], scale: [number, number, number]) => void;
  mode?: 'translate' | 'rotate' | 'scale';
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const transformControlsRef = useRef<any>(null);
  const [localPosition, setLocalPosition] = useState<[number, number, number]>(position);
  const [localRotation, setLocalRotation] = useState<[number, number, number]>(rotation);
  const [localScale, setLocalScale] = useState<[number, number, number]>(scale);

  useEffect(() => {
    setLocalPosition(position);
    setLocalRotation(rotation);
    setLocalScale(scale);
    if (meshRef.current && transformControlsRef.current) {
      transformControlsRef.current.attach(meshRef.current);
    }
  }, [position, rotation, scale]);

  useEffect(() => {
    if (isSelected && mode && meshRef.current && transformControlsRef.current) {
      transformControlsRef.current.attach(meshRef.current);
    } else if (transformControlsRef.current) {
      transformControlsRef.current.detach();
    }
  }, [isSelected, mode]);

  useFrame(() => {
    if (transformControlsRef.current && meshRef.current && isSelected && mode) {
      const mesh = meshRef.current;
      const newPos: [number, number, number] = [
        mesh.position.x,
        mesh.position.y,
        mesh.position.z
      ];
      const newRot: [number, number, number] = [
        mesh.rotation.x,
        mesh.rotation.y,
        mesh.rotation.z
      ];
      const newScale: [number, number, number] = [
        mesh.scale.x,
        mesh.scale.y,
        mesh.scale.z
      ];
      
      if (
        newPos[0] !== localPosition[0] || newPos[1] !== localPosition[1] || newPos[2] !== localPosition[2] ||
        newRot[0] !== localRotation[0] || newRot[1] !== localRotation[1] || newRot[2] !== localRotation[2] ||
        newScale[0] !== localScale[0] || newScale[1] !== localScale[1] || newScale[2] !== localScale[2]
      ) {
        setLocalPosition(newPos);
        setLocalRotation(newRot);
        setLocalScale(newScale);
        if (onUpdate) {
          onUpdate(newPos, newRot, newScale);
        }
      }
    }
  });

  return (
    <>
      <mesh
        ref={meshRef}
        position={localPosition}
        rotation={localRotation}
        scale={localScale}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial
          color="#000000"
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>
      {isSelected && mode && (
        <TransformControls
          ref={transformControlsRef}
          mode={mode}
          showX={true}
          showY={true}
          showZ={true}
        />
      )}
    </>
  );
}

// Composant pour le modèle 3D
function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  
  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  return <primitive object={scene} />;
}

// Composant pour le viewer 3D interactif
function ZoneEditor3D({ 
  modelUrl, 
  zones, 
  selectedZoneId,
  onZoneSelect,
  onAddZone,
  onZoneUpdate
}: {
  modelUrl: string;
  zones: Zone[];
  selectedZoneId: string | null;
  onZoneSelect: (zoneId: string) => void;
  onAddZone: () => void;
  onZoneUpdate?: (zoneId: string, position: [number, number, number], rotation: [number, number, number], scale: [number, number, number]) => void;
}) {
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
  const controlsRef = useRef<any>(null);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ width: '100%', height: '100%' }}
        gl={{ preserveDrawingBuffer: true }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Suspense fallback={null}>
          <Model url={modelUrl} />
          {zones.map((zone) => (
            <TextZone
              key={zone.id}
              position={[zone.position.x, zone.position.y, zone.position.z]}
              rotation={[zone.rotation.x, zone.rotation.y, zone.rotation.z]}
              scale={[zone.scale.x, zone.scale.y, zone.scale.z]}
              isSelected={selectedZoneId === zone.id}
              onSelect={() => onZoneSelect(zone.id)}
              mode={selectedZoneId === zone.id ? transformMode : undefined}
              onUpdate={(pos, rot, scl) => {
                if (onZoneUpdate) {
                  onZoneUpdate(zone.id, pos, rot, scl);
                }
              }}
            />
          ))}
        </Suspense>
        <OrbitControls 
          ref={controlsRef}
          enabled={!selectedZoneId || transformMode === undefined}
        />
      </Canvas>
      
      {/* Contrôles */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <button
          onClick={() => {
            onAddZone();
          }}
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
          Ajouter une zone
        </button>
        
        {selectedZoneId && (
          <div style={{
            display: 'flex',
            gap: '4px',
            backgroundColor: '#1a1a1a',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #2a2a2a'
          }}>
            <button
              onClick={() => setTransformMode('translate')}
              style={{
                padding: '6px 12px',
                backgroundColor: transformMode === 'translate' ? '#8eff36' : '#2a2a2a',
                color: transformMode === 'translate' ? '#000000' : '#ffffff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
                fontFamily: 'var(--stepn-font-body)'
              }}
            >
              Déplacer
            </button>
            <button
              onClick={() => setTransformMode('rotate')}
              style={{
                padding: '6px 12px',
                backgroundColor: transformMode === 'rotate' ? '#8eff36' : '#2a2a2a',
                color: transformMode === 'rotate' ? '#000000' : '#ffffff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
                fontFamily: 'var(--stepn-font-body)'
              }}
            >
              Rotation
            </button>
            <button
              onClick={() => setTransformMode('scale')}
              style={{
                padding: '6px 12px',
                backgroundColor: transformMode === 'scale' ? '#8eff36' : '#2a2a2a',
                color: transformMode === 'scale' ? '#000000' : '#ffffff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
                fontFamily: 'var(--stepn-font-body)'
              }}
            >
              Taille
            </button>
          </div>
        )}
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
    // Créer une nouvelle zone temporaire pour l'édition
    const newZone: Zone = {
      id: `temp-${Date.now()}`,
      name: newZoneName || `Zone ${editingZones.length + 1}`,
      model3d_id: selectedModel3DId,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 }
    };
    setEditingZones([...editingZones, newZone]);
    setSelectedZoneId(newZone.id);
  }

  function handleZoneUpdate(zoneId: string, position: [number, number, number], rotation: [number, number, number], scale: [number, number, number]) {
    setEditingZones(editingZones.map(zone => 
      zone.id === zoneId 
        ? {
            ...zone,
            position: { x: position[0], y: position[1], z: position[2] },
            rotation: { x: rotation[0], y: rotation[1], z: rotation[2] },
            scale: { x: scale[0], y: scale[1], z: scale[2] }
          }
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
  }

  const selectedModel = models3D.find(m => m.id === selectedModel3DId);
  const modelUrl = selectedModel?.glb_url || selectedModel?.glbUrl || '';

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
              maxWidth: '1200px',
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
                borderBottom: '1px solid #2a2a2a'
              }}>
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
                  onChange={(e) => setSelectedModel3DId(e.target.value || null)}
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

              {/* Nom de la zone */}
              <div style={{
                padding: '20px',
                borderBottom: '1px solid #2a2a2a'
              }}>
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

              {/* Viewer 3D */}
              {modelUrl && (
                <div style={{
                  flex: 1,
                  minHeight: '400px',
                  position: 'relative'
                }}>
                  <ZoneEditor3D
                    modelUrl={modelUrl}
                    zones={editingZones}
                    selectedZoneId={selectedZoneId}
                    onZoneSelect={setSelectedZoneId}
                    onAddZone={handleAddZone}
                    onZoneUpdate={handleZoneUpdate}
                  />
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
                  onClick={() => setShowCreateModal(false)}
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
                  disabled={!selectedModel3DId || !newZoneName}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: (!selectedModel3DId || !newZoneName) ? '#4a4a4a' : '#8eff36',
                    color: (!selectedModel3DId || !newZoneName) ? '#a0a0a0' : '#000000',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: (!selectedModel3DId || !newZoneName) ? 'not-allowed' : 'pointer',
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

