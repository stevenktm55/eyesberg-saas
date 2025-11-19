"use client";

import { useEffect, useState } from "react";

type SizePattern = {
  id: string;
  name: string;
  model3dId: string;
  uvType: "UV0" | "UV2";
  files: Array<{
    id: string;
    size: string;
    svgUrl: string;
    metadata?: any;
  }>;
};

type Model3D = {
  id: string;
  name: string;
};

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

export default function SizesConfigPage() {
  const [patterns, setPatterns] = useState<SizePattern[]>([]);
  const [models, setModels] = useState<Model3D[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPatterns, setExpandedPatterns] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [editingPattern, setEditingPattern] = useState<{
    model3dId: string;
    name: string;
    description: string;
    uvType: "UV0" | "UV2";
  } | null>(null);

  useEffect(() => {
    fetchModels();
    fetchPatterns();
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

  async function fetchPatterns() {
    try {
      const res = await fetch("/api/size-patterns");
      if (!res.ok) throw new Error("Failed to fetch patterns");
      const data = await res.json();
      setPatterns(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching patterns:", error);
    }
  }

  const togglePattern = (patternId: string) => {
    const newExpanded = new Set(expandedPatterns);
    if (newExpanded.has(patternId)) {
      newExpanded.delete(patternId);
    } else {
      newExpanded.add(patternId);
    }
    setExpandedPatterns(newExpanded);
  };

  const filteredPatterns = patterns.filter((pattern) =>
    pattern.name.toLowerCase().includes(searchQuery.toLowerCase())
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
            placeholder="Rechercher un groupe de tailles..."
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
            setEditingPattern({
              model3dId: "",
              name: "",
              description: "",
              uvType: "UV0",
            });
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
          Nouveau groupe de tailles
        </button>
      </div>

      {/* Pattern Groups List */}
      {filteredPatterns.length === 0 ? (
        <div style={{
          border: '2px dashed #2a2a2a',
          borderRadius: '8px',
          padding: '64px 32px',
          textAlign: 'center',
          color: '#a0a0a0'
        }}>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>Aucun groupe de tailles</p>
          <p style={{ fontSize: '14px' }}>
            {searchQuery ? 'Aucun résultat pour votre recherche' : 'Créez votre premier groupe de tailles pour commencer'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredPatterns.map((pattern) => {
            const isExpanded = expandedPatterns.has(pattern.id);
            const model = models.find((m) => m.id === pattern.model3dId);
            const fileCount = pattern.files.length;

            return (
              <div
                key={pattern.id}
                style={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => togglePattern(pattern.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#222222';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#1a1a1a';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <span style={{
                      color: isExpanded ? '#8eff36' : '#a0a0a0',
                      fontSize: '12px',
                      transition: 'transform 0.2s',
                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                    }}>
                      ▶
                    </span>
                    <span style={{
                      color: isExpanded ? '#8eff36' : '#ffffff',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      ✓
                    </span>
                    <div>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#ffffff',
                        marginBottom: '4px',
                        fontFamily: 'var(--stepn-font-body)'
                      }}>
                        {pattern.name}
                      </h3>
                      <p style={{
                        fontSize: '12px',
                        color: '#a0a0a0',
                        fontFamily: 'var(--stepn-font-body)'
                      }}>
                        {fileCount} taille{fileCount > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Edit pattern
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
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div style={{
                    borderTop: '1px solid #2a2a2a',
                    padding: '16px',
                    backgroundColor: '#0a0a0a'
                  }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '14px',
                      fontFamily: 'var(--stepn-font-body)'
                    }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #2a2a2a' }}>
                          <th style={{
                            textAlign: 'left',
                            padding: '12px',
                            color: '#a0a0a0',
                            fontWeight: '500',
                            fontSize: '12px'
                          }}>Nom</th>
                          <th style={{
                            textAlign: 'left',
                            padding: '12px',
                            color: '#a0a0a0',
                            fontWeight: '500',
                            fontSize: '12px'
                          }}>Dimensions</th>
                          <th style={{
                            textAlign: 'left',
                            padding: '12px',
                            color: '#a0a0a0',
                            fontWeight: '500',
                            fontSize: '12px'
                          }}>Fichiers liés</th>
                          <th style={{
                            textAlign: 'left',
                            padding: '12px',
                            color: '#a0a0a0',
                            fontWeight: '500',
                            fontSize: '12px'
                          }}>Fichier correspondant</th>
                          <th style={{
                            textAlign: 'left',
                            padding: '12px',
                            color: '#a0a0a0',
                            fontWeight: '500',
                            fontSize: '12px'
                          }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {SIZES.map((size) => {
                          const file = pattern.files.find((f) => f.size === size);
                          return (
                            <tr key={size} style={{ borderBottom: '1px solid #1a1a1a' }}>
                              <td style={{ padding: '12px', color: '#ffffff' }}>{size}</td>
                              <td style={{ padding: '12px', color: '#a0a0a0' }}>50 x 70 cm</td>
                              <td style={{ padding: '12px', color: '#a0a0a0' }}>
                                {file ? `pattern_${size.toLowerCase()}.pdf` : '-'}
                              </td>
                              <td style={{ padding: '12px' }}>
                                {file ? (
                                  <a
                                    href={file.svgUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      color: '#8eff36',
                                      textDecoration: 'none',
                                      fontSize: '12px'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.textDecoration = 'underline';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.textDecoration = 'none';
                                    }}
                                  >
                                    Voir fichier
                                  </a>
                                ) : (
                                  <button
                                    style={{
                                      padding: '6px 12px',
                                      backgroundColor: '#2a2a2a',
                                      border: '1px solid #2a2a2a',
                                      borderRadius: '4px',
                                      color: '#ffffff',
                                      fontSize: '12px',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = '#3a3a3a';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = '#2a2a2a';
                                    }}
                                  >
                                    Upload
                                  </button>
                                )}
                              </td>
                              <td style={{ padding: '12px' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button
                                    style={{
                                      padding: '6px',
                                      backgroundColor: 'transparent',
                                      border: 'none',
                                      color: '#a0a0a0',
                                      cursor: 'pointer',
                                      fontSize: '14px',
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
                                    style={{
                                      padding: '6px',
                                      backgroundColor: 'transparent',
                                      border: 'none',
                                      color: '#a0a0a0',
                                      cursor: 'pointer',
                                      fontSize: '14px',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.color = '#ff4444';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.color = '#a0a0a0';
                                    }}
                                  >
                                    ×
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

