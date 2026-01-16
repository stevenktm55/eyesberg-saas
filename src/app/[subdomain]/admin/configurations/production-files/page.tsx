"use client";

import { useState } from "react";

const SIZES = ["S", "M", "L", "XL", "XXL"];

export default function ProductionFilesPage() {
  const [size, setSize] = useState<string>("L");
  const [userDesignSvg, setUserDesignSvg] = useState<string>("");
  const [primaryColor, setPrimaryColor] = useState<string>("#FF0000");
  const [secondaryColor, setSecondaryColor] = useState<string>("#000000");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<{ success: boolean; svg?: string; error?: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!userDesignSvg.trim()) {
      alert("Veuillez entrer un SVG design");
      return;
    }

    setLoading(true);
    setResult(null);
    setPreviewUrl(null);

    try {
      const response = await fetch("/api/production/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          size,
          userDesignSvg,
          colorConfig: {
            primary: primaryColor,
            secondary: secondaryColor,
          },
        }),
      });

      const data = await response.json();

      if (data.success && data.svg) {
        setResult({ success: true, svg: data.svg });
        // Créer une URL de prévisualisation
        const blob = new Blob([data.svg], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      } else {
        setResult({ success: false, error: data.error || "Erreur inconnue" });
      }
    } catch (error) {
      console.error("Erreur génération:", error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result?.svg) return;

    const blob = new Blob([result.svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `production_${size}_${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLoadExample = () => {
    // Exemple de SVG design simple avec des groupes par ID
    const exampleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <style>
      .primary { fill: #FF0000; }
      .secondary { fill: #000000; }
    </style>
  </defs>
  <g id="manche_gauche">
    <rect x="10" y="10" width="30" height="40" class="primary"/>
    <circle cx="25" cy="30" r="5" class="secondary"/>
  </g>
  <g id="manche_droite">
    <rect x="60" y="10" width="30" height="40" class="primary"/>
    <circle cx="75" cy="30" r="5" class="secondary"/>
  </g>
  <g id="torse">
    <rect x="20" y="50" width="60" height="40" class="primary"/>
    <text x="50" y="75" text-anchor="middle" class="secondary" font-size="12">DESIGN</text>
  </g>
</svg>`;
    setUserDesignSvg(exampleSvg);
  };

  return (
    <div style={{ color: '#ffffff', fontFamily: 'var(--stepn-font-body)' }}>
      <div style={{ 
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        padding: '24px',
        border: '1px solid #2a2a2a'
      }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold',
          marginBottom: '8px',
          color: '#ffffff'
        }}>
          🖨️ Génération Fichiers de Production (Sublimation)
        </h2>
        <p style={{ 
          fontSize: '14px', 
          color: '#a0a0a0',
          marginBottom: '24px'
        }}>
          Générez des fichiers SVG d'impression en injectant un design utilisateur dans un template de patron.
          Le design doit contenir des groupes avec des IDs correspondants au template (ex: manche_gauche, manche_droite, torse).
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Paramètres */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Taille */}
            <div>
              <label style={{ 
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#ffffff',
                marginBottom: '8px'
              }}>
                Taille du template
              </label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontFamily: 'var(--stepn-font-body)'
                }}
              >
                {SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <p style={{ 
                marginTop: '8px',
                fontSize: '12px',
                color: '#666666'
              }}>
                Le template template_{size}.svg sera chargé depuis public/templates/
              </p>
            </div>

            {/* Couleurs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ 
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#ffffff',
                  marginBottom: '8px'
                }}>
                  Couleur Primaire
                </label>
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  style={{
                    width: '100%',
                    height: '40px',
                    border: '1px solid #2a2a2a',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    backgroundColor: '#0a0a0a'
                  }}
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  style={{
                    width: '100%',
                    marginTop: '8px',
                    padding: '8px 12px',
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontFamily: 'var(--stepn-font-body)'
                  }}
                  placeholder="#FF0000"
                />
              </div>
              <div>
                <label style={{ 
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#ffffff',
                  marginBottom: '8px'
                }}>
                  Couleur Secondaire
                </label>
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  style={{
                    width: '100%',
                    height: '40px',
                    border: '1px solid #2a2a2a',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    backgroundColor: '#0a0a0a'
                  }}
                />
                <input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  style={{
                    width: '100%',
                    marginTop: '8px',
                    padding: '8px 12px',
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontFamily: 'var(--stepn-font-body)'
                  }}
                  placeholder="#000000"
                />
              </div>
            </div>
          </div>

          {/* SVG Design */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ 
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#ffffff'
              }}>
                SVG Design Utilisateur
              </label>
              <button
                onClick={handleLoadExample}
                style={{
                  fontSize: '14px',
                  color: '#8eff36',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--stepn-font-body)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#a0ff50'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#8eff36'}
              >
                Charger un exemple
              </button>
            </div>
            <textarea
              value={userDesignSvg}
              onChange={(e) => setUserDesignSvg(e.target.value)}
              rows={12}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#0a0a0a',
                border: '1px solid #2a2a2a',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '12px',
                fontFamily: 'monospace',
                resize: 'vertical'
              }}
              placeholder="Collez ici le contenu XML de votre SVG design..."
            />
            <p style={{ 
              marginTop: '8px',
              fontSize: '12px',
              color: '#666666'
            }}>
              Le SVG doit contenir des groupes avec des IDs (ex: &lt;g id="manche_gauche"&gt;...&lt;/g&gt;)
              et utiliser les classes .primary et .secondary pour les couleurs.
            </p>
          </div>

          {/* Bouton Générer */}
          <div>
            <button
              onClick={handleGenerate}
              disabled={loading || !userDesignSvg.trim()}
              style={{
                padding: '12px 24px',
                backgroundColor: loading || !userDesignSvg.trim() ? '#2a2a2a' : '#8eff36',
                color: loading || !userDesignSvg.trim() ? '#666666' : '#000000',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: loading || !userDesignSvg.trim() ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--stepn-font-body)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!loading && userDesignSvg.trim()) {
                  e.currentTarget.style.backgroundColor = '#a0ff50';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && userDesignSvg.trim()) {
                  e.currentTarget.style.backgroundColor = '#8eff36';
                }
              }}
            >
              {loading ? "⏳ Génération..." : "🚀 Générer le fichier de production"}
            </button>
          </div>

          {/* Résultat */}
          {result && (
            <div style={{
              padding: '16px',
              borderRadius: '6px',
              border: `1px solid ${result.success ? '#2a5a2a' : '#5a2a2a'}`,
              backgroundColor: result.success ? '#0a2a0a' : '#2a0a0a'
            }}>
              {result.success ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <p style={{ color: '#8eff36', fontWeight: '500' }}>✅ Fichier généré avec succès !</p>
                    <button
                      onClick={handleDownload}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#8eff36',
                        color: '#000000',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        fontFamily: 'var(--stepn-font-body)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#a0ff50'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#8eff36'}
                    >
                      📥 Télécharger SVG
                    </button>
                  </div>
                  {previewUrl && (
                    <div style={{ marginTop: '16px' }}>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: '#ffffff', marginBottom: '8px' }}>Aperçu:</p>
                      <div style={{
                        border: '1px solid #2a2a2a',
                        borderRadius: '6px',
                        padding: '16px',
                        backgroundColor: '#0a0a0a',
                        overflow: 'auto',
                        maxHeight: '384px'
                      }}>
                        <img
                          src={previewUrl}
                          alt="Preview"
                          style={{ maxWidth: '100%', height: 'auto' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p style={{ color: '#ff6b6b', fontWeight: '500', marginBottom: '8px' }}>❌ Erreur</p>
                  <p style={{ color: '#ff9999', fontSize: '14px' }}>{result.error}</p>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div style={{
            marginTop: '32px',
            padding: '16px',
            backgroundColor: '#0a1a2a',
            border: '1px solid #1a3a5a',
            borderRadius: '6px'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#8eff36', marginBottom: '8px' }}>📋 Instructions</h3>
            <ul style={{ fontSize: '12px', color: '#a0a0a0', listStyle: 'disc', paddingLeft: '20px', lineHeight: '1.6' }}>
              <li>Les templates doivent être placés dans <code style={{ backgroundColor: '#1a1a1a', padding: '2px 6px', borderRadius: '4px' }}>public/templates/template_{size}.svg</code></li>
              <li>Le template doit contenir des paths avec <code style={{ backgroundColor: '#1a1a1a', padding: '2px 6px', borderRadius: '4px' }}>fill="url(#userDesignPattern)"</code></li>
              <li>Le design utilisateur doit avoir des groupes avec des IDs correspondants (ex: manche_gauche, torse)</li>
              <li>Les couleurs sont converties automatiquement en CMYK pour l'impression</li>
              <li>Le viewBox du design est préservé pour maintenir l'échelle</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
