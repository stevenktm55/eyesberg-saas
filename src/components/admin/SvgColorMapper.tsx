"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

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
  colorClass: ColorClass; // La classe de couleur (primary, secondary, etc.)
  paletteId: string | null; // ID de la palette sélectionnée
  paletteColorId: string; // L'ID de la couleur de la palette qui remplacera cette couleur
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

  // Détecter si le SVG contient déjà des classes de couleur mappées (primary, secondary, etc.)
  // Si c'est le cas, cela signifie que le SVG a déjà été traité par notre système
  // et on ne doit PAS détecter les couleurs dans les <style> car elles sont générées par notre système
  const colorClassNames = ['primary', 'secondary', 'tertiary', 'quaternary', 'quinary', 'senary', 'septenary', 'octonary'];
  const svgEl = svgDoc.querySelector('svg');
  const hasColorClasses = svgEl ? Array.from(svgEl.querySelectorAll('*')).some(el => {
    const classAttr = el.getAttribute('class');
    if (!classAttr) return false;
    return classAttr.split(/\s+/).some(c => colorClassNames.includes(c));
  }) : false;

  // Ne détecter les couleurs dans les <style> que si le SVG n'a PAS encore de classes de couleur
  // Si le SVG a des classes, cela signifie qu'il a été traité, donc on ignore les <style>
  if (!hasColorClasses) {
    // Détecter les couleurs dans les blocs <style>
    const styleElements = svgDoc.querySelectorAll('style');
    styleElements.forEach(styleEl => {
      const cssText = styleEl.textContent || '';
      // Chercher les règles CSS avec fill: ou stroke:
      const colorPatterns = [
        /fill:\s*([^;}\s]+)/gi,
        /stroke:\s*([^;}\s]+)/gi,
        /stop-color:\s*([^;}\s]+)/gi,
      ];
      
      colorPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(cssText)) !== null) {
          const color = match[1].trim();
          if (color && !color.startsWith('url(') && !color.startsWith('var(') && color !== 'none' && color !== 'transparent' && color !== 'currentColor') {
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
        }
      });
    });
  }
  // Si hasColorClasses est true, on ignore complètement les <style> pour éviter de détecter
  // les couleurs générées par notre système qui mappent les classes aux couleurs de palette

  // 2. Détecter les couleurs dans les attributs fill et stroke directement
  const traverseElements = (element: Element) => {
    // Récupérer fill et stroke
    const fill = element.getAttribute('fill');
    const stroke = element.getAttribute('stroke');

    [fill, stroke].forEach(color => {
      if (color && color !== 'none' && color !== 'transparent' && color !== 'currentColor' && !color.startsWith('url(') && !color.startsWith('var(')) {
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

    // Détecter les couleurs dans les gradients (stop-color)
    if (element.tagName === 'stop') {
      const stopColor = element.getAttribute('stop-color');
      if (stopColor && stopColor !== 'none' && stopColor !== 'transparent' && stopColor !== 'currentColor') {
        const normalized = normalizeColorToHex(stopColor);
        if (normalized) {
          const existing = colorMap.get(normalized);
          if (existing) {
            existing.count++;
          } else {
            colorMap.set(normalized, { original: stopColor, count: 1 });
          }
        }
      }
    }

    // Parcourir les enfants
    Array.from(element.children).forEach(child => traverseElements(child));
  };

  const svgElement = svgDoc.querySelector('svg');
  if (svgElement) {
    traverseElements(svgElement);
  }

  // 3. Détecter les couleurs directement dans le texte SVG (fallback pour les cas complexes)
  // MAIS uniquement si le SVG n'a pas encore de classes de couleur
  // (sinon on pourrait détecter les couleurs dans le <style> généré)
  if (!hasColorClasses) {
    // Chercher les patterns hexadécimaux dans le texte brut
    const hexPattern = /#([0-9A-Fa-f]{3,6})\b/g;
    let match;
    while ((match = hexPattern.exec(svgContent)) !== null) {
      const hex = '#' + match[1];
      const normalized = normalizeColorToHex(hex);
      if (normalized) {
        const existing = colorMap.get(normalized);
        if (existing) {
          existing.count++;
        } else {
          colorMap.set(normalized, { original: hex, count: 1 });
        }
      }
    }
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
  const [originalSvgContent, setOriginalSvgContent] = useState<string>(""); // SVG original sans modifications
  const [detectedColors, setDetectedColors] = useState<DetectedColor[]>([]);
  const [colorMappings, setColorMappings] = useState<Record<string, ColorMapping>>({});
  const [palettes, setPalettes] = useState<ColorPalette[]>([]);
  const [selectedPaletteId, setSelectedPaletteId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewKey, setPreviewKey] = useState(0); // Clé pour forcer le re-render de l'aperçu

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
        console.log("SVG chargé, longueur:", text.length);
        console.log("SVG preview (premiers 500 chars):", text.substring(0, 500));
        
        // Nettoyer le SVG pour enlever les styles ET classes générés par notre système
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(text, 'image/svg+xml');
        const svgElement = svgDoc.querySelector('svg');
        const colorClassNames = ['primary', 'secondary', 'tertiary', 'quaternary', 'quinary', 'senary', 'septenary', 'octonary'];
        
        if (svgElement) {
          // 1. Extraire les couleurs originales depuis les styles CSS AVANT de les supprimer
          // On va mapper les classes aux couleurs qu'elles définissent dans les styles
          const styleElements = Array.from(svgDoc.querySelectorAll('style'));
          const classToColorMap = new Map<string, string>();
          
          styleElements.forEach(styleEl => {
            const cssText = styleEl.textContent || '';
            const hasColorClassRules = colorClassNames.some(className => {
              const pattern = new RegExp(`\\.${className}\\s*\\{`);
              return pattern.test(cssText);
            });
            
            if (hasColorClassRules) {
              // Extraire les couleurs pour chaque classe avant de supprimer le style
              colorClassNames.forEach(className => {
                // Chercher fill: ou stroke: dans la règle CSS de cette classe
                const classPattern = new RegExp(`\\.${className}\\s*\\{[^}]*\\}`, 'gi');
                const classMatch = classPattern.exec(cssText);
                if (classMatch) {
                  const ruleContent = classMatch[0];
                  // Chercher fill: couleur ou stroke: couleur
                  const fillMatch = ruleContent.match(/fill:\s*([^;\\s]+)/i);
                  const strokeMatch = ruleContent.match(/stroke:\s*([^;\\s]+)/i);
                  if (fillMatch && fillMatch[1]) {
                    const color = fillMatch[1].trim();
                    if (!color.startsWith('url(') && !color.startsWith('var(') && color !== 'none') {
                      classToColorMap.set(className, color);
                    }
                  } else if (strokeMatch && strokeMatch[1]) {
                    const color = strokeMatch[1].trim();
                    if (!color.startsWith('url(') && !color.startsWith('var(') && color !== 'none') {
                      classToColorMap.set(className, color);
                    }
                  }
                }
              });
              
              // Maintenant supprimer le style
              styleEl.remove();
            }
          });
          
          // 2. Parcourir tous les éléments, retirer les classes de couleur ET restaurer les couleurs originales
          const allElements = svgElement.querySelectorAll('*');
          allElements.forEach(el => {
            const classAttr = el.getAttribute('class');
            if (classAttr) {
              const classes = classAttr.split(/\s+/);
              const colorClassesFound = classes.filter(c => colorClassNames.includes(c));
              
              if (colorClassesFound.length > 0) {
                // Restaurer la couleur originale depuis la map si disponible
                for (const className of colorClassesFound) {
                  const originalColor = classToColorMap.get(className);
                  if (originalColor && !el.hasAttribute('fill') && !el.hasAttribute('stroke')) {
                    // Restaurer dans fill par défaut
                    el.setAttribute('fill', originalColor);
                  } else if (originalColor) {
                    // Si l'élément a déjà un fill ou stroke, remplacer celui qui manque
                    if (!el.hasAttribute('fill')) {
                      el.setAttribute('fill', originalColor);
                    }
                    if (!el.hasAttribute('stroke')) {
                      el.setAttribute('stroke', originalColor);
                    }
                  }
                }
                
                // Retirer les classes de couleur
                const remainingClasses = classes.filter(c => !colorClassNames.includes(c));
                if (remainingClasses.length > 0) {
                  el.setAttribute('class', remainingClasses.join(' '));
                } else {
                  el.removeAttribute('class');
                }
              }
            }
          });
        }
        
        // Ré-sérialiser le SVG nettoyé
        const serializer = new XMLSerializer();
        const cleanedSvg = serializer.serializeToString(svgDoc);
        
        console.log("🔵 [LOAD SVG] SVG nettoyé, longueur:", cleanedSvg.length);
        console.log("🔵 [LOAD SVG] SVG nettoyé (premiers 1000 chars):", cleanedSvg.substring(0, 1000));
        console.log("🔵 [LOAD SVG] Nombre de <style> restants:", svgDoc.querySelectorAll('style').length);
        console.log("🔵 [LOAD SVG] Nombre d'éléments avec class:", svgElement.querySelectorAll('[class]').length);
        
        setOriginalSvgContent(cleanedSvg); // Garder le SVG original nettoyé
        setSvgContent(cleanedSvg);

        // Détecter les couleurs sur le SVG nettoyé, pas le texte original
        const colors = detectColorsInSvg(cleanedSvg);
        console.log("🔵 [LOAD SVG] Couleurs détectées:", colors);
        console.log("🔵 [LOAD SVG] Nombre de couleurs:", colors.length);
        
        // Si aucune couleur détectée, essayer une méthode alternative avec le DOM
        if (colors.length === 0) {
          console.log("Aucune couleur détectée avec la méthode standard, tentative avec le DOM...");
          try {
            // Créer un élément temporaire pour parser le SVG
            const tempDiv = document.createElement('div');
            tempDiv.style.position = 'absolute';
            tempDiv.style.visibility = 'hidden';
            tempDiv.style.width = '1px';
            tempDiv.style.height = '1px';
            tempDiv.innerHTML = cleanedSvg;
            document.body.appendChild(tempDiv);
            
            const svgEl = tempDiv.querySelector('svg');
            if (svgEl) {
              // Récupérer tous les éléments avec fill ou stroke
              const allElements = svgEl.querySelectorAll('*');
              const domColorMap = new Map<string, { original: string; count: number }>();
              
              allElements.forEach(el => {
                const computedStyle = window.getComputedStyle(el);
                const fill = computedStyle.fill;
                const stroke = computedStyle.stroke;
                
                [fill, stroke].forEach(color => {
                  if (color && color !== 'none' && color !== 'transparent' && color !== 'rgb(0, 0, 0)' && color !== 'rgba(0, 0, 0, 0)') {
                    const normalized = normalizeColorToHex(color);
                    if (normalized && normalized !== '#000000') {
                      const existing = domColorMap.get(normalized);
                      if (existing) {
                        existing.count++;
                      } else {
                        domColorMap.set(normalized, { original: color, count: 1 });
                      }
                    }
                  }
                });
              });
              
              const domColors = Array.from(domColorMap.entries())
                .map(([hex, data]) => ({
                  originalColor: data.original,
                  normalizedHex: hex,
                  count: data.count
                }))
                .sort((a, b) => b.count - a.count);
              
              console.log("Couleurs détectées via DOM:", domColors);
              
              if (domColors.length > 0) {
                setDetectedColors(domColors);
              } else {
                setDetectedColors([]);
              }
            }
            
            document.body.removeChild(tempDiv);
          } catch (error) {
            console.error("Erreur lors de la détection via DOM:", error);
            setDetectedColors([]);
          }
        } else {
          setDetectedColors(colors);
        }
        
        setColorMappings({});
        setPreviewKey(0); // Réinitialiser la clé de preview
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
    console.log("🟢 [UPDATE MAPPING] originalColor:", originalColor, "colorClass:", colorClass, "paletteColorId:", paletteColorId);
    setColorMappings(prev => {
      const newMappings = { ...prev };
      if (colorClass === null && paletteColorId === null) {
        delete newMappings[originalColor];
        console.log("🟢 [UPDATE MAPPING] Mapping supprimé pour:", originalColor);
      } else {
        newMappings[originalColor] = { 
          originalColor, 
          colorClass: colorClass!, 
          paletteId: selectedPaletteId,
          paletteColorId: paletteColorId || '' 
        };
        console.log("🟢 [UPDATE MAPPING] Nouveau mapping:", newMappings[originalColor]);
      }
      console.log("🟢 [UPDATE MAPPING] Total mappings:", Object.keys(newMappings).length);
      console.log("🟢 [UPDATE MAPPING] Tous les mappings:", JSON.stringify(newMappings, null, 2));
      // Forcer la mise à jour de l'aperçu
      setPreviewKey(prev => prev + 1);
      return newMappings;
    });
  }, [selectedPaletteId]);

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
    // Utiliser le SVG original nettoyé comme base, pas le svgContent qui peut être modifié
    const baseSvg = originalSvgContent || svgContent;
    if (!baseSvg) {
      console.log("🟡 [GENERATE SVG] pas de svgContent");
      return '';
    }

    console.log("🟡 [GENERATE SVG] Début génération");
    console.log("🟡 [GENERATE SVG] baseSvg longueur:", baseSvg.length);
    console.log("🟡 [GENERATE SVG] colorMappings:", JSON.stringify(colorMappings, null, 2));
    console.log("🟡 [GENERATE SVG] Nombre de mappings:", Object.keys(colorMappings).length);

    // Calculer allPaletteColors ici pour éviter la dépendance circulaire
    const allPaletteColors = getAllPaletteColors();
    console.log("🟡 [GENERATE SVG] Nombre de couleurs palette:", allPaletteColors.length);

    try {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(baseSvg, 'image/svg+xml');
      const svgElement = svgDoc.querySelector('svg');
      if (!svgElement) {
        console.log("🟡 [GENERATE SVG] pas d'élément SVG trouvé");
        return svgContent;
      }
      
      console.log("🟡 [GENERATE SVG] SVG parsé, nombre d'éléments:", svgElement.querySelectorAll('*').length);
      console.log("🟡 [GENERATE SVG] Nombre de <style> avant traitement:", svgDoc.querySelectorAll('style').length);
      console.log("🟡 [GENERATE SVG] Nombre d'éléments avec class avant traitement:", svgElement.querySelectorAll('[class]').length);

      // D'abord, extraire les couleurs depuis les styles CSS existants
      const styleElementsBefore = Array.from(svgDoc.querySelectorAll('style'));
      const cssClassToColorMap = new Map<string, string>(); // Map: className -> color hex
      
      styleElementsBefore.forEach(styleEl => {
        const cssText = styleEl.textContent || '';
        // Parser les règles CSS comme .st1 { fill: #111; }
        const rulePattern = /\.(\w+)\s*\{[^}]*fill:\s*([^;}\s]+)/gi;
        let match;
        while ((match = rulePattern.exec(cssText)) !== null) {
          const className = match[1];
          const colorValue = match[2].trim();
          // Ignorer les gradients et autres valeurs complexes
          if (!colorValue.startsWith('url(') && !colorValue.startsWith('var(') && colorValue !== 'none') {
            const normalized = normalizeColorToHex(colorValue);
            if (normalized) {
              cssClassToColorMap.set(className, normalized);
            }
          }
        }
      });
      
      console.log("🟡 [GENERATE SVG] cssClassToColorMap:", Array.from(cssClassToColorMap.entries()));

    // Fonction récursive pour remplacer les couleurs
    const replaceColorsInElement = (element: Element) => {
      const classAttr = element.getAttribute('class');
      const colorClassNames = ['primary', 'secondary', 'tertiary', 'quaternary', 'quinary', 'senary', 'septenary', 'octonary'];
      
      if (classAttr) {
        const classes = classAttr.split(/\s+/).filter(Boolean);
        
        // Vérifier si l'élément a une classe CSS qui correspond à une couleur mappée
        for (const cssClass of classes) {
          const colorFromCssClass = cssClassToColorMap.get(cssClass);
          if (colorFromCssClass) {
            const mapping = colorMappings[colorFromCssClass];
            if (mapping?.colorClass) {
              // Remplacer la classe CSS par notre classe de couleur
              const cleanedClasses = classes.filter(c => c !== cssClass && !colorClassNames.includes(c));
              cleanedClasses.push(mapping.colorClass);
              element.setAttribute('class', cleanedClasses.join(' ').trim());
              console.log(`🟡 [GENERATE SVG] Élément avec classe ${cssClass} (couleur ${colorFromCssClass}) remplacé par ${mapping.colorClass}`);
              break; // Un seul mapping par élément
            }
          }
        }
        
        // Nettoyer les anciennes classes de couleur si elles existent
        const hasOldColorClass = classes.some(c => colorClassNames.includes(c));
        if (hasOldColorClass && !classes.some(c => cssClassToColorMap.has(c))) {
          const cleanedClasses = classes.filter(c => !colorClassNames.includes(c));
          if (cleanedClasses.length > 0) {
            element.setAttribute('class', cleanedClasses.join(' '));
          } else {
            element.removeAttribute('class');
          }
        }
      }
      
      // Aussi vérifier les attributs fill/stroke directs (au cas où)
      const fill = element.getAttribute('fill');
      if (fill && fill !== 'none' && fill !== 'transparent' && fill !== 'currentColor') {
        const normalized = normalizeColorToHex(fill);
        if (normalized) {
          let mapping = colorMappings[normalized];
          if (!mapping) {
            const detectedColor = detectedColors.find(dc => dc.normalizedHex === normalized);
            if (detectedColor) {
              mapping = colorMappings[detectedColor.normalizedHex];
            }
          }
          
          if (mapping?.colorClass) {
            element.removeAttribute('fill');
            const existingClass = element.getAttribute('class') || '';
            const classList = existingClass.split(/\s+/).filter(Boolean);
            const cleanedClasses = classList.filter(c => !colorClassNames.includes(c));
            if (!cleanedClasses.includes(mapping.colorClass)) {
              cleanedClasses.push(mapping.colorClass);
            }
            element.setAttribute('class', cleanedClasses.join(' ').trim());
          }
        }
      }

      const stroke = element.getAttribute('stroke');
      if (stroke && stroke !== 'none' && stroke !== 'transparent' && stroke !== 'currentColor') {
        const normalized = normalizeColorToHex(stroke);
        if (normalized) {
          let mapping = colorMappings[normalized];
          if (!mapping) {
            const detectedColor = detectedColors.find(dc => dc.normalizedHex === normalized);
            if (detectedColor) {
              mapping = colorMappings[detectedColor.normalizedHex];
            }
          }
          
          if (mapping?.colorClass) {
            element.removeAttribute('stroke');
            const existingClass = element.getAttribute('class') || '';
            const classList = existingClass.split(/\s+/).filter(Boolean);
            const cleanedClasses = classList.filter(c => !colorClassNames.includes(c));
            if (!cleanedClasses.includes(mapping.colorClass)) {
              cleanedClasses.push(mapping.colorClass);
            }
            element.setAttribute('class', cleanedClasses.join(' ').trim());
          }
        }
      }

      Array.from(element.children).forEach(child => replaceColorsInElement(child));
    };

    // Appliquer les remplacements
    replaceColorsInElement(svgElement);

    // Gérer les styles CSS pour les classes de couleur
    // Supprimer complètement les anciens blocs <style> qui contiennent des règles pour nos classes de couleur
    const colorClassNames = ['primary', 'secondary', 'tertiary', 'quaternary', 'quinary', 'senary', 'septenary', 'octonary'];
    const styleElements = Array.from(svgDoc.querySelectorAll('style'));
    
    // Supprimer tous les blocs style qui contiennent des règles pour nos classes de couleur
    styleElements.forEach(styleEl => {
      const cssText = styleEl.textContent || '';
      const hasColorClassRules = colorClassNames.some(className => {
        const pattern = new RegExp(`\\.${className}\\s*\\{`);
        return pattern.test(cssText);
      });
      
      if (hasColorClassRules) {
        // Supprimer complètement ce bloc style
        styleEl.remove();
      }
    });

    // Créer un nouveau bloc style pour nos règles de classe de couleur
    let styleElement = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'style');
    
    // Générer les règles CSS pour chaque classe mappée
    const styleRules = Object.values(colorMappings)
      .filter(m => m.colorClass && m.paletteColorId)
      .map(m => {
        const paletteColor = allPaletteColors.find(c => c.id === m.paletteColorId);
        if (paletteColor) {
          // Ajouter à la fois fill et stroke pour être sûr que ça fonctionne
          return `.${m.colorClass} { fill: ${paletteColor.hex} !important; stroke: ${paletteColor.hex} !important; }`;
        }
        return '';
      })
      .filter(Boolean);

    console.log("🟡 [GENERATE SVG] styleRules générées:", styleRules);
    console.log("🟡 [GENERATE SVG] Nombre de styleRules:", styleRules.length);

    // Ajouter le contenu seulement s'il y a des règles
    if (styleRules.length > 0) {
      styleElement.textContent = styleRules.join('\n    ');
      console.log("🟡 [GENERATE SVG] Contenu du styleElement:", styleElement.textContent);
      
      // Ajouter le style dans un bloc <defs>
      let defs = svgDoc.querySelector('defs');
      if (!defs) {
        defs = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'defs');
        svgElement.insertBefore(defs, svgElement.firstChild);
        console.log("🟡 [GENERATE SVG] <defs> créé");
      } else {
        console.log("🟡 [GENERATE SVG] <defs> existant trouvé");
      }
      defs.appendChild(styleElement);
      console.log("🟡 [GENERATE SVG] styleElement ajouté dans defs");
      console.log("🟡 [GENERATE SVG] Nombre de <style> dans defs après ajout:", defs.querySelectorAll('style').length);
    } else {
      console.log("🟡 [GENERATE SVG] ⚠️ Aucune styleRule à ajouter (styleRules.length = 0)");
    }

      // Convertir en string
      const serializer = new XMLSerializer();
      const result = serializer.serializeToString(svgDoc);
      console.log("🟡 [GENERATE SVG] SVG généré, longueur:", result.length);
      const allStyles = svgDoc.querySelectorAll('style');
      console.log("🟡 [GENERATE SVG] Nombre de <style> après traitement:", allStyles.length);
      console.log("🟡 [GENERATE SVG] Nombre d'éléments avec class après traitement:", svgElement.querySelectorAll('[class]').length);
      allStyles.forEach((style, index) => {
        console.log(`🟡 [GENERATE SVG] Style ${index}:`, style.textContent?.substring(0, 200));
      });
      // Chercher spécifiquement le style avec nos classes de couleur
      const colorStyle = Array.from(allStyles).find(style => {
        const text = style.textContent || '';
        return text.includes('.primary') || text.includes('.secondary') || text.includes('.tertiary');
      });
      if (colorStyle) {
        console.log("🟡 [GENERATE SVG] Style avec classes de couleur trouvé:", colorStyle.textContent);
      } else {
        console.log("🟡 [GENERATE SVG] ⚠️ AUCUN style avec classes de couleur trouvé !");
      }
      console.log("🟡 [GENERATE SVG] SVG généré (premiers 1000 chars):", result.substring(0, 1000));
      return result;
    } catch (error) {
      console.error("🟡 [GENERATE SVG] Erreur:", error);
      return baseSvg; // Retourner le SVG original en cas d'erreur
    }
  }, [originalSvgContent, svgContent, colorMappings, detectedColors, getAllPaletteColors]);

  // Fonction pour sauvegarder le SVG modifié
  const handleSave = useCallback(async () => {
    console.log("🔴 [SAVE] Début sauvegarde");
    if (!selectedDesignId) {
      alert("Aucun design sélectionné");
      return;
    }

    const modifiedSvg = generateModifiedSvg();
    console.log("🔴 [SAVE] SVG généré, longueur:", modifiedSvg.length);
    console.log("🔴 [SAVE] SVG à sauvegarder (premiers 1000 chars):", modifiedSvg.substring(0, 1000));
    
    // Parser pour vérifier le contenu
    try {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(modifiedSvg, 'image/svg+xml');
      const svgElement = svgDoc.querySelector('svg');
      if (svgElement) {
        console.log("🔴 [SAVE] Nombre de <style> dans SVG à sauvegarder:", svgDoc.querySelectorAll('style').length);
        console.log("🔴 [SAVE] Contenu des styles:", svgDoc.querySelector('style')?.textContent);
        console.log("🔴 [SAVE] Nombre d'éléments avec class:", svgElement.querySelectorAll('[class]').length);
        const classesFound = Array.from(svgElement.querySelectorAll('[class]')).map(el => el.getAttribute('class')).filter(Boolean);
        console.log("🔴 [SAVE] Classes trouvées:", classesFound);
      }
    } catch (e) {
      console.error("🔴 [SAVE] Erreur parsing SVG avant sauvegarde:", e);
    }
    
    if (!modifiedSvg) {
      alert("Aucun SVG à sauvegarder");
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('designId', selectedDesignId);
      formData.append('svgContent', modifiedSvg);

      console.log("🔴 [SAVE] Envoi au serveur...");
      const response = await fetch('/api/designs-2d/upload-svg', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("🔴 [SAVE] Erreur serveur:", error);
        throw new Error(error.error || 'Failed to save SVG');
      }

      const result = await response.json();
      console.log("🔴 [SAVE] Réponse serveur:", result);
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

  // Utiliser un état pour le SVG modifié qui se met à jour à chaque changement
  const [modifiedSvgPreview, setModifiedSvgPreview] = useState<string>('');

  // Mettre à jour le SVG modifié quand les mappings changent
  useEffect(() => {
    console.log("🟣 [USE EFFECT PREVIEW] Déclenché - originalSvgContent:", !!originalSvgContent, "svgContent:", !!svgContent, "previewKey:", previewKey);
    console.log("🟣 [USE EFFECT PREVIEW] colorMappings:", Object.keys(colorMappings).length, "mappings:", JSON.stringify(colorMappings));
    console.log("🟣 [USE EFFECT PREVIEW] detectedColors:", detectedColors.length);
    console.log("🟣 [USE EFFECT PREVIEW] palettes:", palettes.length);
    
    if (originalSvgContent || svgContent) {
      // Appeler generateModifiedSvg directement ici au lieu d'utiliser la référence
      const baseSvg = originalSvgContent || svgContent;
      console.log("🟣 [USE EFFECT PREVIEW] baseSvg longueur:", baseSvg.length);
      if (baseSvg) {
        const allPaletteColors = getAllPaletteColors();
        console.log("🟣 [USE EFFECT PREVIEW] allPaletteColors:", allPaletteColors.length);
        try {
          const parser = new DOMParser();
          const svgDoc = parser.parseFromString(baseSvg, 'image/svg+xml');
          const svgElement = svgDoc.querySelector('svg');
          if (svgElement) {
            console.log("🟣 [USE EFFECT PREVIEW] SVG parsé, traitement en cours...");
            
            // D'abord, extraire les couleurs depuis les styles CSS existants
            const styleElements = Array.from(svgDoc.querySelectorAll('style'));
            const cssClassToColorMap = new Map<string, string>(); // Map: className -> color hex
            
            styleElements.forEach(styleEl => {
              const cssText = styleEl.textContent || '';
              // Parser les règles CSS comme .st1 { fill: #111; }
              const rulePattern = /\.(\w+)\s*\{[^}]*fill:\s*([^;}\s]+)/gi;
              let match;
              while ((match = rulePattern.exec(cssText)) !== null) {
                const className = match[1];
                const colorValue = match[2].trim();
                // Ignorer les gradients et autres valeurs complexes
                if (!colorValue.startsWith('url(') && !colorValue.startsWith('var(') && colorValue !== 'none') {
                  const normalized = normalizeColorToHex(colorValue);
                  if (normalized) {
                    cssClassToColorMap.set(className, normalized);
                  }
                }
              }
            });
            
            console.log("🟣 [USE EFFECT PREVIEW] cssClassToColorMap:", Array.from(cssClassToColorMap.entries()));
            
            // Fonction récursive pour remplacer les couleurs
            const replaceColorsInElement = (element: Element) => {
              // D'abord, nettoyer les anciennes classes de couleur
              const classAttr = element.getAttribute('class');
              const colorClassNames = ['primary', 'secondary', 'tertiary', 'quaternary', 'quinary', 'senary', 'septenary', 'octonary'];
              
              if (classAttr) {
                const classes = classAttr.split(/\s+/).filter(Boolean);
                
                // Vérifier si l'élément a une classe CSS qui correspond à une couleur mappée
                for (const cssClass of classes) {
                  const colorFromCssClass = cssClassToColorMap.get(cssClass);
                  if (colorFromCssClass) {
                    const mapping = colorMappings[colorFromCssClass];
                    if (mapping?.colorClass) {
                      // Remplacer la classe CSS par notre classe de couleur
                      const cleanedClasses = classes.filter(c => c !== cssClass && !colorClassNames.includes(c));
                      cleanedClasses.push(mapping.colorClass);
                      element.setAttribute('class', cleanedClasses.join(' ').trim());
                      console.log(`🟣 [USE EFFECT PREVIEW] Élément avec classe ${cssClass} (couleur ${colorFromCssClass}) remplacé par ${mapping.colorClass}`);
                      break; // Un seul mapping par élément
                    }
                  }
                }
                
                // Nettoyer les anciennes classes de couleur si elles existent
                const hasOldColorClass = classes.some(c => colorClassNames.includes(c));
                if (hasOldColorClass && !classes.some(c => cssClassToColorMap.has(c))) {
                  const cleanedClasses = classes.filter(c => !colorClassNames.includes(c));
                  if (cleanedClasses.length > 0) {
                    element.setAttribute('class', cleanedClasses.join(' '));
                  } else {
                    element.removeAttribute('class');
                  }
                }
              }
              
              // Aussi vérifier les attributs fill/stroke directs (au cas où)
              const fill = element.getAttribute('fill');
              if (fill && fill !== 'none' && fill !== 'transparent' && fill !== 'currentColor') {
                const normalized = normalizeColorToHex(fill);
                if (normalized) {
                  let mapping = colorMappings[normalized];
                  if (!mapping) {
                    const detectedColor = detectedColors.find(dc => dc.normalizedHex === normalized);
                    if (detectedColor) {
                      mapping = colorMappings[detectedColor.normalizedHex];
                    }
                  }
                  
                  if (mapping?.colorClass) {
                    element.removeAttribute('fill');
                    const existingClass = element.getAttribute('class') || '';
                    const classList = existingClass.split(/\s+/).filter(Boolean);
                    const cleanedClasses = classList.filter(c => !colorClassNames.includes(c));
                    if (!cleanedClasses.includes(mapping.colorClass)) {
                      cleanedClasses.push(mapping.colorClass);
                    }
                    element.setAttribute('class', cleanedClasses.join(' ').trim());
                  }
                }
              }

              const stroke = element.getAttribute('stroke');
              if (stroke && stroke !== 'none' && stroke !== 'transparent' && stroke !== 'currentColor') {
                const normalized = normalizeColorToHex(stroke);
                if (normalized) {
                  let mapping = colorMappings[normalized];
                  if (!mapping) {
                    const detectedColor = detectedColors.find(dc => dc.normalizedHex === normalized);
                    if (detectedColor) {
                      mapping = colorMappings[detectedColor.normalizedHex];
                    }
                  }
                  
                  if (mapping?.colorClass) {
                    element.removeAttribute('stroke');
                    const existingClass = element.getAttribute('class') || '';
                    const classList = existingClass.split(/\s+/).filter(Boolean);
                    const cleanedClasses = classList.filter(c => !colorClassNames.includes(c));
                    if (!cleanedClasses.includes(mapping.colorClass)) {
                      cleanedClasses.push(mapping.colorClass);
                    }
                    element.setAttribute('class', cleanedClasses.join(' ').trim());
                  }
                }
              }

              Array.from(element.children).forEach(child => replaceColorsInElement(child));
            };

            replaceColorsInElement(svgElement);

            // Gérer les styles CSS - supprimer les anciens styles qui contiennent nos classes de couleur
            const colorClassNames = ['primary', 'secondary', 'tertiary', 'quaternary', 'quinary', 'senary', 'septenary', 'octonary'];
            const allStyleElements = Array.from(svgDoc.querySelectorAll('style'));
            allStyleElements.forEach(styleEl => {
              const cssText = styleEl.textContent || '';
              const hasColorClassRules = colorClassNames.some(className => {
                const pattern = new RegExp(`\\.${className}\\s*\\{`);
                return pattern.test(cssText);
              });
              if (hasColorClassRules) {
                styleEl.remove();
              }
            });

            const styleElement = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'style');
            const styleRules = Object.values(colorMappings)
              .filter(m => m.colorClass && m.paletteColorId)
              .map(m => {
                const paletteColor = allPaletteColors.find(c => c.id === m.paletteColorId);
                if (paletteColor) {
                  return `.${m.colorClass} { fill: ${paletteColor.hex} !important; stroke: ${paletteColor.hex} !important; }`;
                }
                return '';
              })
              .filter(Boolean);

            console.log("🟣 [USE EFFECT PREVIEW] styleRules générées:", styleRules);
            console.log("🟣 [USE EFFECT PREVIEW] Nombre de styleRules:", styleRules.length);

            if (styleRules.length > 0) {
              styleElement.textContent = styleRules.join('\n    ');
              console.log("🟣 [USE EFFECT PREVIEW] Contenu du styleElement:", styleElement.textContent);
              let defs = svgDoc.querySelector('defs');
              if (!defs) {
                defs = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'defs');
                svgElement.insertBefore(defs, svgElement.firstChild);
                console.log("🟣 [USE EFFECT PREVIEW] <defs> créé");
              } else {
                console.log("🟣 [USE EFFECT PREVIEW] <defs> existant trouvé");
              }
              defs.appendChild(styleElement);
              console.log("🟣 [USE EFFECT PREVIEW] styleElement ajouté dans defs");
              console.log("🟣 [USE EFFECT PREVIEW] Nombre de <style> dans defs après ajout:", defs.querySelectorAll('style').length);
            } else {
              console.log("🟣 [USE EFFECT PREVIEW] Aucune styleRule à ajouter (styleRules.length = 0)");
            }

            const serializer = new XMLSerializer();
            const result = serializer.serializeToString(svgDoc);
            console.log("🟣 [USE EFFECT PREVIEW] SVG modifié généré, longueur:", result.length);
            const allStyles = svgDoc.querySelectorAll('style');
            console.log("🟣 [USE EFFECT PREVIEW] Nombre de <style> dans le résultat:", allStyles.length);
            allStyles.forEach((style, index) => {
              console.log(`🟣 [USE EFFECT PREVIEW] Style ${index}:`, style.textContent?.substring(0, 200));
            });
            // Chercher spécifiquement le style avec nos classes de couleur
            const colorStyle = Array.from(allStyles).find(style => {
              const text = style.textContent || '';
              return text.includes('.primary') || text.includes('.secondary') || text.includes('.tertiary');
            });
            if (colorStyle) {
              console.log("🟣 [USE EFFECT PREVIEW] Style avec classes de couleur trouvé:", colorStyle.textContent);
            } else {
              console.log("🟣 [USE EFFECT PREVIEW] ⚠️ AUCUN style avec classes de couleur trouvé !");
            }
            console.log("🟣 [USE EFFECT PREVIEW] SVG généré (premiers 1000 chars):", result.substring(0, 1000));
            setModifiedSvgPreview(result);
            console.log("🟣 [USE EFFECT PREVIEW] modifiedSvgPreview mis à jour");
          } else {
            console.log("🟣 [USE EFFECT PREVIEW] Pas d'élément SVG trouvé");
          }
        } catch (error) {
          console.error("🟣 [USE EFFECT PREVIEW] Erreur:", error);
          setModifiedSvgPreview('');
        }
      }
    } else {
      console.log("🟣 [USE EFFECT PREVIEW] Pas de SVG, reset preview");
      setModifiedSvgPreview('');
    }
  }, [originalSvgContent, svgContent, previewKey, colorMappings, detectedColors, palettes, getAllPaletteColors]); // Inclure toutes les dépendances nécessaires

  return (
    <div style={{ 
      fontFamily: 'var(--stepn-font-body)',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100%',
      backgroundColor: '#000000',
      color: '#ffffff'
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        select {
          color: #ffffff !important;
        }
        select option {
          background-color: #0a0a0a !important;
          color: #ffffff !important;
        }
        select:disabled {
          color: #666666 !important;
          opacity: 0.6;
        }
      `}} />
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
            gap: '16px'
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

      {/* Contrôles - Boutons */}
      {svgContent && (
        <div style={{
          flexShrink: 0,
          borderBottom: '1px solid #1a1a1a',
          backgroundColor: '#000000',
          padding: '24px',
          display: 'flex',
          gap: '12px'
        }}>
          <button
            onClick={() => {
              setSvgContent("");
              setOriginalSvgContent("");
              setSelectedDesignId(null);
              setDetectedColors([]);
              setColorMappings({});
              setSelectedPaletteId(null);
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
              color: (isSaving || Object.keys(colorMappings).length === 0) ? '#a0a0a0' : '#000000',
              fontSize: '14px',
              fontWeight: '500',
              fontFamily: 'var(--stepn-font-body)',
              cursor: (isSaving || Object.keys(colorMappings).length === 0) ? 'not-allowed' : 'pointer',
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
      )}

      {/* Zone de mapping des couleurs */}
      {svgContent && detectedColors.length > 0 ? (
        <div style={{
          flexShrink: 0,
          borderBottom: '1px solid #1a1a1a',
          backgroundColor: '#000000',
          padding: '24px'
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
          
          {/* Sélecteur de bibliothèque de couleurs */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              color: '#a0a0a0',
              marginBottom: '8px',
              fontFamily: 'var(--stepn-font-body)'
            }}>
              Bibliothèque de couleurs
            </label>
            <select
              value={selectedPaletteId || ''}
              onChange={(e) => {
                const paletteId = e.target.value || null;
                setSelectedPaletteId(paletteId);
                // Réinitialiser les mappings de couleurs si on change de palette
                if (paletteId !== selectedPaletteId) {
                  setColorMappings({});
                  setPreviewKey(prev => prev + 1);
                }
              }}
              style={{
                width: '100%',
                maxWidth: '400px',
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
              <option value="" style={{ backgroundColor: '#0a0a0a', color: '#ffffff' }}>Sélectionner une bibliothèque</option>
              {palettes.map(palette => (
                <option key={palette.id} value={palette.id} style={{ backgroundColor: '#0a0a0a', color: '#ffffff' }}>
                  {palette.name}
                </option>
              ))}
            </select>
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
                        <option value="" style={{ backgroundColor: '#0a0a0a', color: '#ffffff' }}>Aucune classe</option>
                        {COLOR_CLASSES.map(cls => (
                          <option key={cls.id} value={cls.id} style={{ backgroundColor: '#0a0a0a', color: '#ffffff' }}>{cls.label}</option>
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
                        disabled={!mapping?.colorClass || !selectedPaletteId}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          backgroundColor: (mapping?.colorClass && selectedPaletteId) ? '#0a0a0a' : '#1a1a1a',
                          border: '1px solid #2a2a2a',
                          borderRadius: '4px',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontFamily: 'var(--stepn-font-body)',
                          cursor: (mapping?.colorClass && selectedPaletteId) ? 'pointer' : 'not-allowed',
                          opacity: (mapping?.colorClass && selectedPaletteId) ? 1 : 0.6
                        }}
                      >
                        <option value="" style={{ backgroundColor: '#0a0a0a', color: '#ffffff' }}>Sélectionner une couleur</option>
                        {selectedPaletteId ? (
                          (() => {
                            const selectedPalette = palettes.find(p => p.id === selectedPaletteId);
                            return selectedPalette?.colors.map((color, index) => {
                              const colorId = `${selectedPalette.id}-${index}-${color.hex}`;
                              return (
                                <option key={colorId} value={colorId} style={{ backgroundColor: '#0a0a0a', color: '#ffffff' }}>
                                  {color.name || 'Sans nom'} ({color.hex})
                                </option>
                              );
                            });
                          })()
                        ) : null}
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
      ) : svgContent ? (
        <div style={{
          flexShrink: 0,
          borderBottom: '1px solid #1a1a1a',
          backgroundColor: '#000000',
          padding: '24px'
        }}>
          <div style={{
            fontSize: '14px',
            color: '#8eff36',
            fontFamily: 'var(--stepn-font-body)'
          }}>
            ⚠️ Aucune couleur détectée dans ce SVG. Le SVG sera affiché ci-dessous.
          </div>
        </div>
      ) : null}

      {/* Zone de contenu */}
      <div style={{
        flex: 1,
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
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Aperçu du SVG */}
            <div style={{
              width: '100%',
              backgroundColor: '#ffffff',
              border: '1px solid #2a2a2a',
              borderRadius: '8px',
              padding: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }} key={`preview-${previewKey}`}>
              {(() => {
                const modifiedSvg = modifiedSvgPreview;
                console.log("Aperçu SVG - longueur:", modifiedSvg?.length || 0);
                if (modifiedSvg) {
                  try {
                    // Parser le SVG pour extraire les dimensions et s'assurer qu'il a des dimensions
                    const parser = new DOMParser();
                    const svgDoc = parser.parseFromString(modifiedSvg, 'image/svg+xml');
                    const svgElement = svgDoc.querySelector('svg');
                    
                    if (svgElement) {
                      // S'assurer que le SVG a des dimensions
                      const viewBox = svgElement.getAttribute('viewBox');
                      let width = svgElement.getAttribute('width');
                      let height = svgElement.getAttribute('height');
                      
                      // Si pas de dimensions, essayer de les extraire du viewBox
                      if (!width || !height) {
                        if (viewBox) {
                          const [, , vbWidth, vbHeight] = viewBox.split(/\s+/).map(Number);
                          if (vbWidth && vbHeight) {
                            width = vbWidth.toString();
                            height = vbHeight.toString();
                            svgElement.setAttribute('width', width);
                            svgElement.setAttribute('height', height);
                          }
                        }
                      }
                      
                      // Si toujours pas de dimensions, utiliser des valeurs par défaut
                      if (!width || !height) {
                        width = '800';
                        height = '800';
                        svgElement.setAttribute('width', width);
                        svgElement.setAttribute('height', height);
                        if (!viewBox) {
                          svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
                        }
                      }
                      
                      // Ré-sérialiser le SVG avec les dimensions
                      const serializer = new XMLSerializer();
                      const svgWithDimensions = serializer.serializeToString(svgDoc);
                      
                      console.log("SVG avec dimensions - width:", width, "height:", height);
                      
                      return (
                        <>
                          <style dangerouslySetInnerHTML={{ __html: `
                            .svg-preview-container svg {
                              max-width: 50% !important;
                              width: 50% !important;
                              height: auto !important;
                            }
                          `}} />
                          <div
                            className="svg-preview-container"
                            style={{ 
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <div
                              dangerouslySetInnerHTML={{ __html: svgWithDimensions }}
                              style={{ 
                                width: '100%'
                              }}
                            />
                          </div>
                        </>
                      );
                    }
                  } catch (error) {
                    console.error("Erreur lors du parsing du SVG:", error);
                  }
                  
                  // Fallback: afficher le SVG tel quel avec style pour adaptation
                  const parserFallback = new DOMParser();
                  const svgDocFallback = parserFallback.parseFromString(modifiedSvg, 'image/svg+xml');
                  const svgElementFallback = svgDocFallback.querySelector('svg');
                  if (svgElementFallback) {
                    const serializerFallback = new XMLSerializer();
                    const svgAdapted = serializerFallback.serializeToString(svgDocFallback);
                    return (
                      <>
                        <style dangerouslySetInnerHTML={{ __html: `
                          .svg-preview-container svg {
                            max-width: 50% !important;
                            width: 50% !important;
                            height: auto !important;
                          }
                        `}} />
                        <div
                          className="svg-preview-container"
                          style={{ 
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <div
                            dangerouslySetInnerHTML={{ __html: svgAdapted }}
                            style={{ 
                              width: '100%'
                            }}
                          />
                        </div>
                      </>
                    );
                  }
                  return (
                    <>
                      <style dangerouslySetInnerHTML={{ __html: `
                        .svg-preview-container svg {
                          max-width: 50% !important;
                          width: 50% !important;
                          height: auto !important;
                        }
                      `}} />
                      <div
                        className="svg-preview-container"
                        style={{ 
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <div
                          dangerouslySetInnerHTML={{ __html: modifiedSvg }}
                          style={{ 
                            width: '100%'
                          }}
                        />
                      </div>
                    </>
                  );
                }
                return (
                  <div style={{
                    color: '#a0a0a0',
                    fontSize: '14px',
                    fontFamily: 'var(--stepn-font-body)'
                  }}>
                    Erreur lors de la génération du SVG
                  </div>
                );
              })()}
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
