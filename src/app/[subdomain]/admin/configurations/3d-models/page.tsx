"use client";

import { useEffect, useState } from "react";

type Model3D = {
  id: string;
  name: string;
  glbUrl: string;
  createdAt: string;
};

export default function ModelsConfigPage() {
  const [models, setModels] = useState<Model3D[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchModels();
  }, []);

  async function fetchModels() {
    try {
      const res = await fetch("/api/models");
      const data = await res.json();
      setModels(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching models:", error);
    }
  }

  const filteredModels = models.filter((model) =>
    model.name.toLowerCase().includes(searchQuery.toLowerCase())
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
            placeholder="Rechercher un modèle 3D..."
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
          onClick={() => window.location.href = '/admin/models'}
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
          Nouveau modèle 3D
        </button>
      </div>

      {/* Grid */}
      {filteredModels.length === 0 ? (
        <div style={{
          border: '2px dashed #2a2a2a',
          borderRadius: '8px',
          padding: '64px 32px',
          textAlign: 'center',
          color: '#a0a0a0'
        }}>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>Aucun modèle 3D</p>
          <p style={{ fontSize: '14px' }}>
            {searchQuery ? 'Aucun résultat pour votre recherche' : 'Ajoutez votre premier modèle 3D pour commencer'}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '24px'
        }}>
          {filteredModels.map((model) => (
            <div
              key={model.id}
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
                  border: '2px solid #2a2a2a',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#4a4a4a',
                  fontSize: '24px'
                }}>
                  □
                </div>
              </div>
              
              {/* Info */}
              <div style={{ padding: '16px' }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#ffffff',
                  marginBottom: '8px',
                  fontFamily: 'var(--stepn-font-body)'
                }}>
                  {model.name}
                </h3>
                <div style={{
                  fontSize: '12px',
                  color: '#a0a0a0',
                  fontFamily: 'var(--stepn-font-body)'
                }}>
                  <div>Format: GLB/GLTF</div>
                  <div style={{ marginTop: '4px' }}>
                    Vertices: 15,234 • 2.4 MB
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
