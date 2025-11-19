"use client";

import { useEffect, useState } from "react";

type Design2D = {
  id: string;
  name: string;
  svgUrl: string;
  thumbUrl?: string;
  createdAt: string;
};

export default function DesignsConfigPage() {
  const [designs, setDesigns] = useState<Design2D[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDesigns();
  }, []);

  async function fetchDesigns() {
    try {
      const res = await fetch("/api/designs-2d");
      if (!res.ok) throw new Error("Failed to fetch designs");
      const data = await res.json();
      setDesigns(Array.isArray(data) ? data.map((d: any) => ({
        id: d.id,
        name: d.name,
        svgUrl: d.svg_url,
        thumbUrl: d.thumbnail_url,
        createdAt: d.created_at,
      })) : []);
    } catch (error) {
      console.error("Error fetching designs:", error);
    }
  }

  const filteredDesigns = designs.filter((design) =>
    design.name.toLowerCase().includes(searchQuery.toLowerCase())
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
            placeholder="Rechercher un design..."
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
          onClick={() => window.location.href = '/admin/designs'}
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
          Nouveau design
        </button>
      </div>

      {/* Grid */}
      {filteredDesigns.length === 0 ? (
        <div style={{
          border: '2px dashed #2a2a2a',
          borderRadius: '8px',
          padding: '64px 32px',
          textAlign: 'center',
          color: '#a0a0a0'
        }}>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>Aucun design 2D</p>
          <p style={{ fontSize: '14px' }}>
            {searchQuery ? 'Aucun résultat pour votre recherche' : 'Ajoutez votre premier design 2D pour commencer'}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '24px'
        }}>
          {filteredDesigns.map((design) => (
            <div
              key={design.id}
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
              {/* Preview */}
              <div style={{
                width: '100%',
                aspectRatio: '1',
                backgroundColor: '#0a0a0a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottom: '1px solid #2a2a2a',
                overflow: 'hidden'
              }}>
                {design.thumbUrl ? (
                  <img
                    src={design.thumbUrl}
                    alt={design.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '60px',
                    height: '60px',
                    color: '#4a4a4a',
                    fontSize: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    □
                  </div>
                )}
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
                  {design.name}
                </h3>
                <div style={{
                  fontSize: '12px',
                  color: '#a0a0a0',
                  fontFamily: 'var(--stepn-font-body)'
                }}>
                  PNG - 2048x2048
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
            onClick={() => window.location.href = '/admin/designs'}
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
              Ajouter
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
