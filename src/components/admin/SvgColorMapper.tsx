"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export type ColorClass = "primary" | "secondary" | "tertiary" | "quaternary" | "quinary" | "senary" | "septenary" | "octonary" | null;

interface Design2D {
  id: string;
  name: string;
  svgUrl?: string;
  svg_url?: string;
  thumbUrl?: string;
  thumb_url?: string;
  preview_url?: string;
}

interface SvgColorMapperProps {
  svgInput?: string | File | null;
  onExport?: (svgString: string) => void;
  className?: string;
}

interface ColorTool {
  id: ColorClass;
  label: string;
  previewColor: string;
}

const COLOR_TOOLS: ColorTool[] = [
  { id: "primary", label: "Couleur Primaire", previewColor: "#FF0000" },
  { id: "secondary", label: "Couleur Secondaire", previewColor: "#0000FF" },
  { id: "tertiary", label: "Couleur Tertiaire", previewColor: "#00FF00" },
  { id: "quaternary", label: "Couleur Quaternaire", previewColor: "#FFFF00" },
  { id: "quinary", label: "Couleur Quinaire", previewColor: "#FF00FF" },
  { id: "senary", label: "Couleur Senaire", previewColor: "#00FFFF" },
  { id: "septenary", label: "Couleur Septenaire", previewColor: "#FFA500" },
  { id: "octonary", label: "Couleur Octonaire", previewColor: "#800080" },
];

export function SvgColorMapper({ svgInput, onExport, className = "" }: SvgColorMapperProps) {
  const [designs, setDesigns] = useState<Design2D[]>([]);
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [selectedTool, setSelectedTool] = useState<ColorClass | undefined>(undefined);
  const [svgContainer, setSvgContainer] = useState<HTMLDivElement | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [targetGroup, setTargetGroup] = useState(false); // Option pour cibler tout le groupe
  const [searchQuery, setSearchQuery] = useState("");

  // Charger les designs 2D
  useEffect(() => {
    async function fetchDesigns() {
      try {
        const response = await fetch("/api/designs-2d");
        if (!response.ok) throw new Error("Failed to fetch designs");
        const data = await response.json();
        const designsArray = Array.isArray(data) ? data : [];
        setDesigns(designsArray.map((d: any) => ({
          id: d.id,
          name: d.name,
          svgUrl: d.svg_url || d.svgUrl,
          thumbUrl: d.thumb_url || d.thumbUrl || d.preview_url,
        })));
      } catch (error) {
        console.error("Error fetching designs:", error);
      }
    }
    fetchDesigns();
  }, []);

  // Charger le SVG depuis le design sélectionné
  useEffect(() => {
    if (!selectedDesignId) {
      setSvgContent("");
      return;
    }

    const loadSvg = async () => {
      setIsProcessing(true);
      try {
        const design = designs.find(d => d.id === selectedDesignId);
        if (!design || !design.svgUrl) {
          alert("Design introuvable ou URL SVG manquante");
          return;
        }

        const response = await fetch(design.svgUrl);
        if (!response.ok) throw new Error("Failed to fetch SVG");
        const text = await response.text();
        setSvgContent(text);
      } catch (error) {
        console.error("Erreur lors du chargement du SVG:", error);
        alert("Erreur lors du chargement du SVG");
      } finally {
        setIsProcessing(false);
      }
    };

    loadSvg();
  }, [selectedDesignId, designs]);

  // Charger le SVG depuis l'input (fallback pour compatibilité)
  useEffect(() => {
    if (!svgInput || selectedDesignId) return;

    const loadSvg = async () => {
      setIsProcessing(true);
      try {
        if (typeof svgInput === "string") {
          setSvgContent(svgInput);
        } else if (svgInput instanceof File) {
          const text = await svgInput.text();
          setSvgContent(text);
        }
      } catch (error) {
        console.error("Erreur lors du chargement du SVG:", error);
        alert("Erreur lors du chargement du SVG");
      } finally {
        setIsProcessing(false);
      }
    };

    loadSvg();
  }, [svgInput, selectedDesignId]);

  // Appliquer les styles de feedback visuel après le rendu
  useEffect(() => {
    if (!svgContainer || !svgContent) return;

    const svgElement = svgContainer.querySelector("svg");
    if (!svgElement) return;

    // Injecter les styles CSS pour le feedback visuel
    const styleId = "svg-color-mapper-styles";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        .svg-color-mapper-container .primary { fill: #FF0000 !important; }
        .svg-color-mapper-container .secondary { fill: #0000FF !important; }
        .svg-color-mapper-container .tertiary { fill: #00FF00 !important; }
        .svg-color-mapper-container .quaternary { fill: #FFFF00 !important; }
        .svg-color-mapper-container .quinary { fill: #FF00FF !important; }
        .svg-color-mapper-container .senary { fill: #00FFFF !important; }
        .svg-color-mapper-container .septenary { fill: #FFA500 !important; }
        .svg-color-mapper-container .octonary { fill: #800080 !important; }
        .svg-color-mapper-container svg * {
          cursor: crosshair;
          transition: fill 0.2s ease;
        }
        .svg-color-mapper-container svg *:hover {
          opacity: 0.8;
        }
      `;
      document.head.appendChild(style);
    }

    // Rendre tous les éléments cliquables (path, rect, circle, ellipse, polygon, polyline, line, g, etc.)
    const makeClickable = (element: Element) => {
      const skipTags = ["svg", "defs", "style", "metadata", "title", "desc"];
      if (skipTags.includes(element.tagName.toLowerCase())) {
        return;
      }

      // Marquer les éléments graphiques comme cliquables
      const graphicTags = ["path", "rect", "circle", "ellipse", "polygon", "polyline", "line", "g", "text", "tspan", "use"];
      if (graphicTags.includes(element.tagName.toLowerCase())) {
        element.setAttribute("data-clickable", "true");
      }
      
      // Récursivement traiter les enfants
      Array.from(element.children).forEach(child => makeClickable(child));
    };

    makeClickable(svgElement);

    // Ajouter les event listeners
    const handleClick = (e: MouseEvent) => {
      // Si aucun outil n'est sélectionné, on demande de sélectionner
      if (selectedTool === undefined) {
        alert("Veuillez d'abord sélectionner un outil de couleur ou l'outil 'Effacer'");
        return;
      }
      // Si selectedTool est null, c'est l'outil "Effacer", on continue

      const target = e.target as HTMLElement;
      if (!target || target.tagName === "svg") return;

      // Vérifier si l'élément ou un parent a l'attribut data-clickable
      let clickableElement: HTMLElement | null = target;
      while (clickableElement && clickableElement !== svgElement) {
        if (clickableElement.hasAttribute("data-clickable")) {
          break;
        }
        clickableElement = clickableElement.parentElement;
      }

      if (!clickableElement || clickableElement === svgElement) return;

      e.stopPropagation();
      e.preventDefault();

      // Si l'option "targetGroup" est activée et que l'élément est dans un groupe <g>, mapper tout le groupe
      if (targetGroup && clickableElement.parentElement?.tagName === "g") {
        const group = clickableElement.parentElement;
        // Appliquer la couleur à tous les enfants du groupe
        Array.from(group.children).forEach(child => {
          if (child.hasAttribute("data-clickable")) {
            applyColorClass(child as HTMLElement, selectedTool);
          }
        });
      } else {
        // Sinon, mapper uniquement l'élément cliqué
        applyColorClass(clickableElement, selectedTool);
      }
    };

    svgElement.addEventListener("click", handleClick);
    
    return () => {
      svgElement.removeEventListener("click", handleClick);
    };
  }, [svgContainer, svgContent, selectedTool, targetGroup]);

  // Fonction pour appliquer une classe de couleur à un élément
  const applyColorClass = useCallback((element: HTMLElement, colorClass: ColorClass) => {
    if (!colorClass) {
      // Mode "Effacer" - retirer toutes les classes de couleur
      const colorClasses = COLOR_TOOLS.map(t => t.id).filter(Boolean) as string[];
      colorClasses.forEach(cls => {
        element.classList.remove(cls);
      });
      return;
    }

    // Nettoyer les anciennes classes de couleur
    const colorClasses = COLOR_TOOLS.map(t => t.id).filter(Boolean) as string[];
    colorClasses.forEach(cls => {
      element.classList.remove(cls);
    });

    // Appliquer la nouvelle classe
    element.classList.add(colorClass);
  }, []);

  // Fonction pour exporter le SVG modifié
  const handleExport = useCallback(() => {
    if (!svgContainer) {
      alert("Aucun SVG à exporter");
      return;
    }

    const svgElement = svgContainer.querySelector("svg");
    if (!svgElement) {
      alert("Aucun élément SVG trouvé");
      return;
    }

    // Cloner le SVG pour éviter de modifier l'original
    const clonedSvg = svgElement.cloneNode(true) as SVGElement;

    // Nettoyer les attributs de debug
    const cleanAttributes = (element: Element) => {
      element.removeAttribute("data-clickable");
      Array.from(element.children).forEach(child => cleanAttributes(child));
    };
    cleanAttributes(clonedSvg);

    // Convertir en string
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clonedSvg);

    if (onExport) {
      onExport(svgString);
    } else {
      // Par défaut, télécharger le fichier
      const blob = new Blob([svgString], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "design-mapped.svg";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [svgContainer, onExport]);


  const filteredDesigns = designs.filter((design) =>
    design.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ 
      fontFamily: 'var(--stepn-font-body)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#000000',
      color: '#ffffff'
    }}>
      {/* Sélection du design */}
      {!svgContent && (
        <div style={{ padding: '24px', borderBottom: '1px solid #1a1a1a' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              color: '#ffffff',
              marginBottom: '8px',
              fontFamily: 'var(--stepn-font-body)'
            }}>
              Rechercher un design 2D
            </label>
            <input
              type="text"
              placeholder="Rechercher un design 2D..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '14px',
                fontFamily: 'var(--stepn-font-body)'
              }}
            />
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '16px',
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {filteredDesigns.map((design) => (
              <div
                key={design.id}
                onClick={() => setSelectedDesignId(design.id)}
                style={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
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
                <div style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#ffffff',
                  marginBottom: '8px',
                  fontFamily: 'var(--stepn-font-body)'
                }}>
                  {design.name}
                </div>
                {design.thumbUrl && (
                  <img
                    src={design.thumbUrl}
                    alt={design.name}
                    style={{
                      width: '100%',
                      height: '120px',
                      objectFit: 'contain',
                      backgroundColor: '#0a0a0a',
                      borderRadius: '4px'
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Palette d'outils */}
      {svgContent && (
        <div style={{
          flexShrink: 0,
          borderBottom: '1px solid #1a1a1a',
          backgroundColor: '#000000',
          padding: '16px'
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
            <span style={{
              fontSize: '14px',
              color: '#a0a0a0',
              marginRight: '8px',
              fontFamily: 'var(--stepn-font-body)'
            }}>
              Outils :
            </span>
            {COLOR_TOOLS.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setSelectedTool(selectedTool === tool.id ? undefined : tool.id)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: selectedTool === tool.id ? 'rgba(142, 255, 54, 0.1)' : 'transparent',
                  border: selectedTool === tool.id ? '2px solid #8eff36' : '2px solid #2a2a2a',
                  borderRadius: '8px',
                  color: selectedTool === tool.id ? '#8eff36' : '#a0a0a0',
                  fontSize: '12px',
                  fontFamily: 'var(--stepn-font-body)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  if (selectedTool !== tool.id) {
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.borderColor = '#3a3a3a';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedTool !== tool.id) {
                    e.currentTarget.style.color = '#a0a0a0';
                    e.currentTarget.style.borderColor = '#2a2a2a';
                  }
                }}
                title={tool.label}
              >
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '4px',
                    border: '1px solid #2a2a2a',
                    backgroundColor: tool.previewColor
                  }}
                />
                <span>{tool.label}</span>
              </button>
            ))}
            <button
              onClick={() => setSelectedTool(selectedTool === null ? undefined : null)}
              style={{
                padding: '8px 16px',
                backgroundColor: selectedTool === null ? 'rgba(255, 68, 68, 0.1)' : 'transparent',
                border: selectedTool === null ? '2px solid #ff4444' : '2px solid #2a2a2a',
                borderRadius: '8px',
                color: selectedTool === null ? '#ff4444' : '#a0a0a0',
                fontSize: '12px',
                fontFamily: 'var(--stepn-font-body)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                if (selectedTool !== null) {
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.borderColor = '#3a3a3a';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedTool !== null) {
                  e.currentTarget.style.color = '#a0a0a0';
                  e.currentTarget.style.borderColor = '#2a2a2a';
                }
              }}
              title="Effacer les classes de couleur"
            >
              <span>🗑️</span>
              <span>Effacer</span>
            </button>
          </div>
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={targetGroup}
              onChange={(e) => setTargetGroup(e.target.checked)}
              style={{
                width: '16px',
                height: '16px',
                cursor: 'pointer'
              }}
            />
            <label style={{
              fontSize: '12px',
              color: '#a0a0a0',
              fontFamily: 'var(--stepn-font-body)',
              cursor: 'pointer'
            }}>
              Appliquer au groupe entier (si l'élément est dans un &lt;g&gt;)
            </label>
          </div>
          {selectedTool !== undefined && (
            <div style={{
              marginTop: '12px',
              fontSize: '12px',
              color: '#a0a0a0',
              fontFamily: 'var(--stepn-font-body)'
            }}>
              <span style={{ fontWeight: '500', color: '#8eff36' }}>Outil sélectionné :</span>{" "}
              {selectedTool === null 
                ? "Effacer - Cliquez sur les éléments pour retirer leurs classes de couleur"
                : `${COLOR_TOOLS.find(t => t.id === selectedTool)?.label} - Cliquez sur les éléments du SVG pour leur attribuer cette couleur.`
              }
            </div>
          )}
        </div>
      )}

      {/* Zone de contenu */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        backgroundColor: '#000000',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {!svgContent ? (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#a0a0a0',
            fontSize: '14px',
            fontFamily: 'var(--stepn-font-body)'
          }}>
            {designs.length === 0 ? 'Aucun design disponible' : 'Sélectionnez un design 2D ci-dessus'}
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Contrôles */}
            <div style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setSvgContent("");
                  setSelectedDesignId(null);
                  setSelectedTool(undefined);
                }}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#2a2a2a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontFamily: 'var(--stepn-font-body)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#3a3a3a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#2a2a2a';
                }}
              >
                Réinitialiser
              </button>
              <button
                onClick={handleExport}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#8eff36',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#000000',
                  fontSize: '14px',
                  fontWeight: '500',
                  fontFamily: 'var(--stepn-font-body)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                💾 Exporter le SVG
              </button>
              <button
                onClick={() => {
                  setSvgContent("");
                  setSelectedDesignId(null);
                }}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#2a2a2a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontFamily: 'var(--stepn-font-body)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#3a3a3a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#2a2a2a';
                }}
              >
                📁 Changer de design
              </button>
            </div>

            {/* SVG Container */}
            <div
              ref={setSvgContainer}
              style={{
                flex: 1,
                overflow: 'auto',
                backgroundColor: '#0a0a0a',
                border: '1px solid #2a2a2a',
                borderRadius: '8px',
                padding: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          </div>
        )}
        {isProcessing && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: '#1a1a1a',
              padding: '24px',
              borderRadius: '8px',
              color: '#ffffff',
              fontFamily: 'var(--stepn-font-body)'
            }}>
              Chargement...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
