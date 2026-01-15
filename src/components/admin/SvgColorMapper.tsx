"use client";

import { useState, useEffect, useCallback } from "react";

export type ColorClass = "primary" | "secondary" | "tertiary" | "quaternary" | "quinary" | "senary" | "septenary" | "octonary";

interface Design2D {
  id: string;
  name: string;
  svgUrl?: string;
  svg_url?: string;
  thumbUrl?: string;
  thumb_url?: string;
  preview_url?: string;
}

interface ColorPalette {
  id: string;
  name: string;
  colors: Array<{ name: string; hex: string; cmyk?: string }>;
}

interface DetectedColor {
  originalColor: string; // La couleur originale dans le SVG (ex: #FF0000, rgb(255,0,0), etc.)
  normalizedHex: string; // Version normalisée en hex (ex: #FF0000)
  count: number; // Nombre d'occurrences dans le SVG
}

interface ColorMapping {
  originalColor: string; // La couleur originale détectée
  colorClass: ColorClass | null; // La classe de couleur (primary, secondary, etc.)
  paletteColorId: string | null; // L'ID de la couleur de la palette qui remplacera cette couleur
}

interface SvgColorMapperProps {
  svgInput?: string | File | null;
  onExport?: (svgString: string) => void;
  className?: string;
}

const COLOR_CLASSES: Array<{ id: ColorClass; label: string }> = [
  { id: "primary", label: "Couleur Primaire" },
  { id: "secondary", label: "Couleur Secondaire" },
  { id: "tertiary", label: "Couleur Tertiaire" },
  { id: "quaternary", label: "Couleur Quaternaire" },
  { id: "quinary", label: "Couleur Quinaire" },
  { id: "senary", label: "Couleur Senaire" },
  { id: "septenary", label: "Couleur Septenaire" },
  { id: "octonary", label: "Couleur Octonaire" },
];

// Fonction pour normaliser une couleur en hex
function normalizeColorToHex(color: string): string {
  if (!color || color === 'none' || color === 'transparent' || color === 'currentColor') {
    return '';
  }

  // Si c'est déjà en hex
  if (color.startsWith('#')) {
    if (color.length === 4) {
      // Format court #RGB -> #RRGGBB
      return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`.toUpperCase();
    }
    return color.toUpperCase();
  }

  // Si c'est rgb/rgba
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
    const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
    const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`.toUpperCase();
  }

  // Noms de couleurs CSS
  const colorNames: Record<string, string> = {
    'black': '#000000',
    'white': '#FFFFFF',
    'red': '#FF0000',
    'green': '#00FF00',
    'blue': '#0000FF',
    'yellow': '#FFFF00',
    'cyan': '#00FFFF',
    'magenta': '#FF00FF',
    'orange': '#FFA500',
    'purple': '#800080',
  };
  if (colorNames[color.toLowerCase()]) {
    return colorNames[color.toLowerCase()];
  }

  return '';
}

// Fonction pour détecter toutes les couleurs dans un SVG
function detectColorsInSvg(svgContent: string): DetectedColor[] {
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
  const colorMap = new Map<string, { original: string; count: number }>();

  // Fonction récursive pour parcourir tous les éléments
  const traverseElements = (element: Element) => {
    // Récupérer fill et stroke
    const fill = element.getAttribute('fill');
    const stroke = element.getAttribute('stroke');

    [fill, stroke].forEach(color => {
      if (color) {
        const normalized = normalizeColorToHex(color);
        if (normalized) {
          const existing = colorMap.get(normalized);
          if (existing) {
            existing.count++;
          } else {
            colorMap.set(normalized, { original: color, count: 1 });
          }
        }
      }
    });

    // Parcourir les enfants
    Array.from(element.children).forEach(child => traverseElements(child));
  };

  const svgElement = svgDoc.querySelector('svg');
  if (svgElement) {
    traverseElements(svgElement);
  }

  // Convertir en tableau et trier par nombre d'occurrences
  return Array.from(colorMap.entries())
    .map(([hex, data]) => ({
      originalColor: data.original,
      normalizedHex: hex,
      count: data.count
    }))
    .sort((a, b) => b.count - a.count);
}

export function SvgColorMapper({ svgInput, onExport, className = "" }: SvgColorMapperProps) {
  const [designs, setDesigns] = useState<Design2D[]>([]);
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [detectedColors, setDetectedColors] = useState<DetectedColor[]>([]);
  const [colorMappings, setColorMappings] = useState<Record<string, ColorMapping>>({});
  const [palettes, setPalettes] = useState<ColorPalette[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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

  // Charger les palettes de couleurs
  useEffect(() => {
    async function fetchPalettes() {
      try {
        const response = await fetch("/api/color-palettes");
        if (!response.ok) throw new Error("Failed to fetch palettes");
        const data = await response.json();
        setPalettes(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching palettes:", error);
      }
    }
    fetchPalettes();
  }, []);

  // Charger le SVG depuis le design sélectionné
  useEffect(() => {
    if (!selectedDesignId) {
      setSvgContent("");
      setDetectedColors([]);
      setColorMappings({});
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

        // Détecter les couleurs
        const colors = detectColorsInSvg(text);
        setDetectedColors(colors);
        setColorMappings({});
      } catch (error) {
        console.error("Erreur lors du chargement du SVG:", error);
        alert("Erreur lors du chargement du SVG");
      } finally {
        setIsProcessing(false);
      }
    };

    loadSvg();
  }, [selectedDesignId, designs]);

  // Fonction pour mettre à jour un mapping de couleur
  const updateColorMapping = useCallback((originalColor: string, colorClass: ColorClass | null, paletteColorId: string | null) => {
    setColorMappings(prev => {
      const newMappings = { ...prev };
      if (colorClass === null && paletteColorId === null) {
        delete newMappings[originalColor];
      } else {
        newMappings[originalColor] = { originalColor, colorClass, paletteColorId };
      }
      return newMappings;
    });
  }, []);

  // Obtenir toutes les couleurs disponibles depuis les palettes
  const getAllPaletteColors = useCallback((): Array<{ id: string; name: string; hex: string; paletteName: string }> => {
    const allColors: Array<{ id: string; name: string; hex: string; paletteName: string }> = [];
    palettes.forEach((palette) => {
      palette.colors.forEach((color, index) => {
        const colorId = `${palette.id}-${index}-${color.hex}`;
        allColors.push({
          id: colorId,
          name: color.name || '',
          hex: color.hex || '#000000',
          paletteName: palette.name
        });
      });
    });
    return allColors;
  }, [palettes]);

  // Fonction pour générer le SVG modifié
  const generateModifiedSvg = useCallback((): string => {
    if (!svgContent) return '';

    // Calculer allPaletteColors ici pour éviter la dépendance circulaire
    const allPaletteColors = getAllPaletteColors();

    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
    const svgElement = svgDoc.querySelector('svg');
    if (!svgElement) return svgContent;

    // Fonction récursive pour remplacer les couleurs
    const replaceColorsInElement = (element: Element) => {
      // Remplacer fill
      const fill = element.getAttribute('fill');
      if (fill && fill !== 'none' && fill !== 'transparent' && fill !== 'currentColor') {
        const normalized = normalizeColorToHex(fill);
        if (normalized) {
          // Chercher le mapping pour cette couleur normalisée
          let mapping = colorMappings[normalized];
          
          // Si pas trouvé, chercher dans toutes les couleurs détectées qui ont la même normalisation
          if (!mapping) {
            const detectedColor = detectedColors.find(dc => dc.normalizedHex === normalized);
            if (detectedColor) {
              mapping = colorMappings[detectedColor.normalizedHex];
            }
          }
          
          if (mapping?.colorClass) {
            // Retirer l'attribut fill et ajouter la classe
            element.removeAttribute('fill');
            const existingClass = element.getAttribute('class') || '';
            if (!existingClass.split(/\s+/).includes(mapping.colorClass)) {
              element.setAttribute('class', `${existingClass} ${mapping.colorClass}`.trim());
            }
          }
        }
      }

      // Remplacer stroke
      const stroke = element.getAttribute('stroke');
      if (stroke && stroke !== 'none' && stroke !== 'transparent' && stroke !== 'currentColor') {
        const normalized = normalizeColorToHex(stroke);
        if (normalized) {
          // Chercher le mapping pour cette couleur normalisée
          let mapping = colorMappings[normalized];
          
          // Si pas trouvé, chercher dans toutes les couleurs détectées qui ont la même normalisation
          if (!mapping) {
            const detectedColor = detectedColors.find(dc => dc.normalizedHex === normalized);
            if (detectedColor) {
              mapping = colorMappings[detectedColor.normalizedHex];
            }
          }
          
          if (mapping?.colorClass) {
            // Retirer l'attribut stroke et ajouter la classe
            element.removeAttribute('stroke');
            const existingClass = element.getAttribute('class') || '';
            if (!existingClass.split(/\s+/).includes(mapping.colorClass)) {
              element.setAttribute('class', `${existingClass} ${mapping.colorClass}`.trim());
            }
          }
        }
      }

      // Parcourir les enfants
      Array.from(element.children).forEach(child => replaceColorsInElement(child));
    };

    // Appliquer les remplacements
    replaceColorsInElement(svgElement);

    // Ajouter les styles CSS pour les classes (pour l'aperçu uniquement)
    let styleElement = svgDoc.querySelector('style');
    if (!styleElement) {
      styleElement = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'style');
      const defs = svgDoc.querySelector('defs') || svgDoc.createElementNS('http://www.w3.org/2000/svg', 'defs');
      defs.appendChild(styleElement);
      if (!svgDoc.querySelector('defs')) {
        svgElement.insertBefore(defs, svgElement.firstChild);
      }
    }

    // Ajouter les règles CSS pour chaque classe mappée (pour l'aperçu avec les couleurs de la palette)
    const styleContent = Object.values(colorMappings)
      .filter(m => m.colorClass)
      .map(m => {
        const paletteColor = allPaletteColors.find(c => c.id === m.paletteColorId);
        if (paletteColor) {
          return `.${m.colorClass} { fill: ${paletteColor.hex} !important; }`;
        }
        return '';
      })
      .filter(Boolean)
      .join('\n    ');

    if (styleContent) {
      // Vérifier si le style existe déjà pour éviter les doublons
      const existingStyle = styleElement.textContent || '';
      if (!existingStyle.includes(styleContent)) {
        styleElement.textContent = existingStyle + (existingStyle ? '\n    ' : '') + styleContent;
      }
    }

    // Convertir en string
    const serializer = new XMLSerializer();
    return serializer.serializeToString(svgDoc);
  }, [svgContent, colorMappings, detectedColors, getAllPaletteColors]);

  // Fonction pour sauvegarder le SVG modifié
  const handleSave = useCallback(async () => {
    if (!selectedDesignId) {
      alert("Aucun design sélectionné");
      return;
    }

    const modifiedSvg = generateModifiedSvg();
    if (!modifiedSvg) {
      alert("Aucun SVG à sauvegarder");
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('designId', selectedDesignId);
      formData.append('svgContent', modifiedSvg);

      const response = await fetch('/api/designs-2d/upload-svg', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save SVG');
      }

      const result = await response.json();
      alert('✅ SVG sauvegardé avec succès !');
      
      // Recharger les designs pour avoir la nouvelle URL
      const designsResponse = await fetch("/api/designs-2d");
      if (designsResponse.ok) {
        const data = await designsResponse.json();
        const designsArray = Array.isArray(data) ? data : [];
        setDesigns(designsArray.map((d: any) => ({
          id: d.id,
          name: d.name,
          svgUrl: d.svg_url || d.svgUrl,
          thumbUrl: d.thumb_url || d.thumbUrl || d.preview_url,
        })));
      }
    } catch (error: any) {
      console.error("Erreur lors de la sauvegarde:", error);
      alert(`Erreur lors de la sauvegarde: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  }, [selectedDesignId, generateModifiedSvg]);

  const filteredDesigns = designs.filter((design) =>
    design.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allPaletteColors = getAllPaletteColors();

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

      {/* Zone de mapping des couleurs */}
      {svgContent && detectedColors.length > 0 && (
        <div style={{
          flexShrink: 0,
          borderBottom: '1px solid #1a1a1a',
          backgroundColor: '#000000',
          padding: '24px',
          maxHeight: '50vh',
          overflowY: 'auto'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#8eff36',
            marginBottom: '16px',
            fontFamily: 'var(--stepn-font-body)'
          }}>
            Mapping des couleurs ({detectedColors.length} couleur{detectedColors.length > 1 ? 's' : ''} détectée{detectedColors.length > 1 ? 's' : ''})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {detectedColors.map((detectedColor) => {
              // Utiliser la couleur normalisée comme clé pour le mapping
              const mapping = colorMappings[detectedColor.normalizedHex];
              const selectedPaletteColor = mapping?.paletteColorId 
                ? allPaletteColors.find(c => c.id === mapping.paletteColorId)
                : null;

              return (
                <div
                  key={detectedColor.normalizedHex}
                  style={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '8px',
                    padding: '16px'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    marginBottom: '12px'
                  }}>
                    {/* Aperçu de la couleur originale */}
                    <div style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: detectedColor.normalizedHex,
                      border: '1px solid #2a2a2a',
                      borderRadius: '4px',
                      flexShrink: 0
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '12px',
                        color: '#a0a0a0',
                        fontFamily: 'var(--stepn-font-body)'
                      }}>
                        {detectedColor.originalColor}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: '#666666',
                        fontFamily: 'var(--stepn-font-body)'
                      }}>
                        {detectedColor.count} occurrence{detectedColor.count > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px'
                  }}>
                    {/* Sélection de la classe de couleur */}
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '12px',
                        color: '#a0a0a0',
                        marginBottom: '8px',
                        fontFamily: 'var(--stepn-font-body)'
                      }}>
                        Classe de couleur
                      </label>
                      <select
                        value={mapping?.colorClass || ''}
                        onChange={(e) => {
                          const colorClass = e.target.value as ColorClass | '';
                          updateColorMapping(
                            detectedColor.normalizedHex,
                            colorClass || null,
                            mapping?.paletteColorId || null
                          );
                        }}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          backgroundColor: '#0a0a0a',
                          border: '1px solid #2a2a2a',
                          borderRadius: '4px',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontFamily: 'var(--stepn-font-body)',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="">Aucune classe</option>
                        {COLOR_CLASSES.map(cls => (
                          <option key={cls.id} value={cls.id}>{cls.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Sélection de la couleur de la palette */}
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '12px',
                        color: '#a0a0a0',
                        marginBottom: '8px',
                        fontFamily: 'var(--stepn-font-body)'
                      }}>
                        Couleur de remplacement
                      </label>
                      <select
                        value={mapping?.paletteColorId || ''}
                        onChange={(e) => {
                          updateColorMapping(
                            detectedColor.normalizedHex,
                            mapping?.colorClass || null,
                            e.target.value || null
                          );
                        }}
                        disabled={!mapping?.colorClass}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          backgroundColor: mapping?.colorClass ? '#0a0a0a' : '#1a1a1a',
                          border: '1px solid #2a2a2a',
                          borderRadius: '4px',
                          color: mapping?.colorClass ? '#ffffff' : '#666666',
                          fontSize: '12px',
                          fontFamily: 'var(--stepn-font-body)',
                          cursor: mapping?.colorClass ? 'pointer' : 'not-allowed'
                        }}
                      >
                        <option value="">Sélectionner une couleur</option>
                        {allPaletteColors.map(color => (
                          <option key={color.id} value={color.id}>
                            {color.paletteName} - {color.name} ({color.hex})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Aperçu du mapping */}
                  {mapping?.colorClass && selectedPaletteColor && (
                    <div style={{
                      marginTop: '12px',
                      padding: '12px',
                      backgroundColor: '#0a0a0a',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        backgroundColor: selectedPaletteColor.hex,
                        border: '1px solid #2a2a2a',
                        borderRadius: '4px'
                      }} />
                      <div style={{
                        fontSize: '11px',
                        color: '#8eff36',
                        fontFamily: 'var(--stepn-font-body)'
                      }}>
                        → Sera remplacée par <strong>{selectedPaletteColor.name}</strong> ({selectedPaletteColor.hex}) 
                        avec la classe <strong>.{mapping.colorClass}</strong>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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
                  setDetectedColors([]);
                  setColorMappings(new Map());
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
                Changer de design
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || Object.keys(colorMappings).length === 0}
                style={{
                  padding: '12px 24px',
                  backgroundColor: (isSaving || Object.keys(colorMappings).length === 0) ? '#4a4a4a' : '#8eff36',
                  border: 'none',
                  borderRadius: '8px',
                  color: (isSaving || colorMappings.size === 0) ? '#a0a0a0' : '#000000',
                  fontSize: '14px',
                  fontWeight: '500',
                  fontFamily: 'var(--stepn-font-body)',
                  cursor: (isSaving || colorMappings.size === 0) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!isSaving && Object.keys(colorMappings).length > 0) {
                    e.currentTarget.style.opacity = '0.9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSaving && Object.keys(colorMappings).length > 0) {
                    e.currentTarget.style.opacity = '1';
                  }
                }}
              >
                {isSaving ? '⏳ Sauvegarde...' : '💾 Sauvegarder le SVG'}
              </button>
            </div>

            {/* Aperçu du SVG */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              backgroundColor: '#0a0a0a',
              border: '1px solid #2a2a2a',
              borderRadius: '8px',
              padding: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div
                dangerouslySetInnerHTML={{ __html: generateModifiedSvg() }}
                style={{ maxWidth: '100%', maxHeight: '100%' }}
              />
            </div>
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
