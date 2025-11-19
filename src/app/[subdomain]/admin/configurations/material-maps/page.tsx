"use client";

import { useEffect, useState } from "react";

type MaterialMap = {
  id: string;
  name: string;
  diffuseMap?: string;
  normalMap?: string;
  roughnessMap?: string;
  metalnessMap?: string;
  aoMap?: string;
};

export default function MaterialMapsConfigPage() {
  const [materialMaps, setMaterialMaps] = useState<MaterialMap[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // TODO: Fetch material maps from API
    // For now, using mock data
    setMaterialMaps([
      { id: '1', name: 'Cotton White', diffuseMap: 'yes', normalMap: 'yes', roughnessMap: 'yes' },
      { id: '2', name: 'Cotton Black', diffuseMap: 'yes', normalMap: 'yes', roughnessMap: 'yes' },
      { id: '3', name: 'Polyester', diffuseMap: 'yes', normalMap: 'yes', roughnessMap: 'yes' },
    ]);
  }, []);

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
          onClick={() => {
            // TODO: Open create material map modal
            alert('Créer un nouveau material map');
          }}
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
          <span>+</span>
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
          >
            {/* Preview Placeholder */}
            <div style={{
              width: '100%',
              aspectRatio: '1',
              backgroundColor: '#0a0a0a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderBottom: '1px solid #2a2a2a'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                color: '#4a4a4a',
                fontSize: '32px'
              }}>
                ■
              </div>
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
          onClick={() => {
            alert('Ajouter un material');
          }}
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
    </div>
  );
}

