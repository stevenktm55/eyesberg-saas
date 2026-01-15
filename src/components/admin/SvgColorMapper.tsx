"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export type ColorClass = "primary" | "secondary" | "tertiary" | "quaternary" | "quinary" | "senary" | "septenary" | "octonary" | null;

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
  const [svgContent, setSvgContent] = useState<string>("");
  const [selectedTool, setSelectedTool] = useState<ColorClass | undefined>(undefined);
  const [svgContainer, setSvgContainer] = useState<HTMLDivElement | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [targetGroup, setTargetGroup] = useState(false); // Option pour cibler tout le groupe
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Charger le SVG depuis l'input
  useEffect(() => {
    if (!svgInput) {
      setSvgContent("");
      return;
    }

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
  }, [svgInput]);

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

  // Gestion du drag & drop de fichier
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === "image/svg+xml") {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSvgContent(event.target?.result as string);
      };
      reader.readAsText(file);
    } else {
      alert("Veuillez déposer un fichier SVG");
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "image/svg+xml") {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSvgContent(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  }, []);

  return (
    <div className={`svg-color-mapper-container flex flex-col ${className || "h-full"}`}>
      {/* Palette d'outils */}
      <div className="flex-shrink-0 border-b bg-white p-4">
        <div className="flex flex-wrap gap-2 items-center mb-2">
          <span className="text-sm font-medium text-gray-700 mr-2">Outils :</span>
          {COLOR_TOOLS.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setSelectedTool(selectedTool === tool.id ? null : tool.id)}
              className={`px-4 py-2 rounded border-2 transition-all ${
                selectedTool === tool.id
                  ? "border-blue-500 bg-blue-50 shadow-md"
                  : "border-gray-300 bg-white hover:border-gray-400"
              }`}
              title={tool.label}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded border-2 border-gray-400"
                  style={{ backgroundColor: tool.previewColor }}
                />
                <span className="text-sm font-medium text-gray-700">{tool.label}</span>
              </div>
            </button>
          ))}
          <button
            onClick={() => setSelectedTool(selectedTool === null ? undefined : null)}
            className={`px-4 py-2 rounded border-2 transition-all ${
              selectedTool === null
                ? "border-red-500 bg-red-50 shadow-md"
                : "border-gray-300 bg-white hover:border-gray-400"
            }`}
            title="Effacer les classes de couleur"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">🗑️</span>
              <span className="text-sm font-medium text-gray-700">Effacer</span>
            </div>
          </button>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={targetGroup}
              onChange={(e) => setTargetGroup(e.target.checked)}
              className="w-4 h-4"
            />
            <span>Appliquer au groupe entier (si l'élément est dans un &lt;g&gt;)</span>
          </label>
        </div>
        {selectedTool !== undefined && (
          <div className="mt-2 text-xs text-gray-600">
            <span className="font-medium">Outil sélectionné :</span>{" "}
            {selectedTool === null 
              ? "Effacer - Cliquez sur les éléments pour retirer leurs classes de couleur"
              : `${COLOR_TOOLS.find(t => t.id === selectedTool)?.label} - Cliquez sur les éléments du SVG pour leur attribuer cette couleur.`
            }
          </div>
        )}
      </div>

      {/* Zone de contenu */}
      <div className="flex-1 overflow-auto bg-gray-100 p-4">
        {!svgContent ? (
          <div
            className="h-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <div className="text-center">
              <p className="text-gray-600 mb-4">Déposez un fichier SVG ici ou</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/svg+xml"
                onChange={handleFileInput}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Choisir un fichier SVG
              </button>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {/* Contrôles */}
            <div className="mb-4 flex gap-2">
              <button
                onClick={() => {
                  setSvgContent("");
                  setSelectedTool(undefined);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                Réinitialiser
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                💾 Exporter le SVG
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/svg+xml"
                onChange={handleFileInput}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                📁 Charger un autre SVG
              </button>
            </div>

            {/* SVG Container */}
            <div
              ref={setSvgContainer}
              className="flex-1 overflow-auto bg-white border-2 border-gray-300 rounded-lg p-4 flex items-center justify-center"
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          </div>
        )}
        {isProcessing && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-4 rounded">Chargement...</div>
          </div>
        )}
      </div>
    </div>
  );
}
