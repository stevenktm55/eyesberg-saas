"use client";

import React, { useState, useRef, useEffect } from "react";

type TextTabId = "contenu" | "police" | "couleur" | "contour" | "deformation";

const DEFORMATION_OPTIONS = [
  { id: "aucune", label: "Aucune déformation", Icon: () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 3l4 4-12 12H5v-4L17 3z" stroke="#EAB308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>) },
  { id: "arc", label: "Arc", Icon: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 18c4-4 8-4 12 0" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round"/></svg>) },
  { id: "drapeau", label: "Drapeau", Icon: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 4v16M5 4l3 4 3-4M5 4h14l-4 4 4 4H5" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>) },
  { id: "vague", label: "Vague", Icon: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"/></svg>) },
  { id: "bombe", label: "Bombé", Icon: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="12" cy="12" rx="8" ry="10" stroke="#EF4444" strokeWidth="2" fill="none"/></svg>) },
  { id: "pincement", label: "Pinçage", Icon: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 8l4 8 4-8" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>) },
  { id: "fisheye", label: "Fisheye", Icon: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="#92400E" strokeWidth="2" fill="#FEF3C7"/><circle cx="12" cy="12" r="4" fill="#92400E"/></svg>) },
  { id: "compression", label: "Compression", Icon: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 6c0 4 4 4 4 6s-4 2-4 6" stroke="#2563EB" strokeWidth="2" strokeLinecap="round"/><path d="M16 6c0 4-4 4-4 6s4 2 4 6" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"/></svg>) },
  { id: "inclinaison", label: "Inclinaison", Icon: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 20L20 4" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/></svg>) },
  { id: "spirale", label: "Spirale", Icon: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4a8 8 0 018 8" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"/><path d="M12 12a4 4 0 014 4" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"/></svg>) },
  { id: "rotation-progressive", label: "Rotation progressive", Icon: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4v4l2-2" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 20v-4l2 2" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 12h4l-2-2" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M20 12h-4l2-2" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>) },
  { id: "tilt", label: "Tilt", Icon: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4v16M12 4l-4 8h8l-4-8z" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>) },
  { id: "perspective", label: "Perspective", Icon: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="8" width="16" height="10" rx="1" stroke="#6B7280" strokeWidth="2"/><path d="M8 8l4-4 4 4" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>) },
] as const;

export type TextModuleColor = { id: string; name: string; hex: string };
export type TextModuleFont = { id: string; name: string; display_name?: string; /** URL du fichier police pour prévisualisation */ font_url?: string; file_url?: string };

export interface TextModuleText {
  id: string;
  content: string;
  fontFamily?: string;
  color?: string;
  fillType?: "solid" | "gradient";
  gradientColors?: [string, string];
  gradientDirection?: "horizontal" | "vertical";
  strokeColor?: string;
  strokeWidth?: number;
  deformation?: string;
  deformationIntensity?: number;
}

export interface TextModulePanelProps {
  texts: TextModuleText[];
  selectedTextId: string | null;
  onSelectText: (id: string | null) => void;
  onUpdateText: (id: string, patch: Partial<TextModuleText>) => void;
  onRemoveText: (id: string) => void;
  onAddText: () => void;
  colors: TextModuleColor[];
  /** Palette pour le contour (si différente de colors). Sinon utilise colors. */
  strokeColors?: TextModuleColor[];
  fonts: TextModuleFont[];
  enabledTabs?: { contenu?: boolean; police?: boolean; couleur?: boolean; contour?: boolean; deformation?: boolean };
  /** IDs des déformations à afficher (ex: ['aucune','arc','vague']). Si vide/absent = toutes. */
  enabledDeformationIds?: string[];
  isMobileView?: boolean;
  addTextLabel?: string;
  /** En-tête au-dessus de la liste des textes placés (ex. "Textes ajoutés"). */
  placedTextsLabel?: string;
  fontFamily?: string;
  /** Min/max épaisseur du contour (px) - si absent, défaut 0–10 */
  strokeMinWidthPx?: number;
  strokeMaxWidthPx?: number;
}

export function TextModulePanel({
  texts,
  selectedTextId,
  onSelectText,
  onUpdateText,
  onRemoveText,
  onAddText,
  colors,
  strokeColors,
  fonts,
  enabledTabs = {},
  enabledDeformationIds,
  isMobileView = false,
  addTextLabel = "Ajouter un texte",
  placedTextsLabel = "Textes placés",
  fontFamily: fontFamilyProp = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  strokeMinWidthPx = 0,
  strokeMaxWidthPx = 10,
}: TextModulePanelProps) {
  const [activeTextTab, setActiveTextTab] = useState<TextTabId>("contenu");
  const [textStep, setTextStep] = useState<"list" | "typography">("list");
  const [hoveredTextTabId, setHoveredTextTabId] = useState<TextTabId | null>(null);
  const [gradientPickingSlot, setGradientPickingSlot] = useState<"1" | "2" | null>(null);
  const [outlineGradientPickingSlot, setOutlineGradientPickingSlot] = useState<"1" | "2" | null>(null);
  const [deformationOptionsOpen, setDeformationOptionsOpen] = useState(false);
  const textTabsScrollRef = useRef<HTMLDivElement | null>(null);
  const policeFontsScrollRef = useRef<HTMLDivElement | null>(null);
  const textColorScrollRef = useRef<HTMLDivElement | null>(null);
  const outlineColorScrollRef = useRef<HTMLDivElement | null>(null);
  const placedTextsScrollRef = useRef<HTMLDivElement | null>(null);
  const panelRootRef = useRef<HTMLDivElement | null>(null);

  const selectedText = texts.find((t) => t.id === selectedTextId) ?? null;
  const allColors = colors;
  const outlineColors = strokeColors && strokeColors.length > 0 ? strokeColors : colors;

  // Charger les polices pour la prévisualisation (document du panel au cas où il est en iframe)
  const [loadedFontIds, setLoadedFontIds] = useState<Set<string>>(new Set());
  const startedLoadingRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const getFontUrl = (f: TextModuleFont) => f.font_url || f.file_url;
    const toLoad = fonts.filter(
      (f) => getFontUrl(f) && (f.display_name || f.name) && !loadedFontIds.has(f.id) && !startedLoadingRef.current.has(f.id)
    );
    if (toLoad.length === 0) return;
    const doc = typeof document !== "undefined" ? (panelRootRef.current?.ownerDocument ?? document) : document;
    const loadOne = async (font: TextModuleFont) => {
      startedLoadingRef.current.add(font.id);
      const familyName = font.display_name || font.name;
      const rawUrl = getFontUrl(font);
      try {
        let url = rawUrl!;
        if (typeof window !== "undefined" && !url.startsWith("http://") && !url.startsWith("https://")) {
          url = window.location.origin + (url.startsWith("/") ? url : "/" + url);
        }
        const res = await fetch(url);
        if (!res.ok) return;
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const face = new FontFace(familyName, `url('${blobUrl}')`);
        await face.load();
        doc.fonts.add(face);
        const style = doc.createElement("style");
        style.setAttribute("data-cv-font-preview", font.id);
        const idForSelector = font.id.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
        const familyValue = `${JSON.stringify(familyName)}, sans-serif`;
        style.textContent = `
@font-face { font-family: ${JSON.stringify(familyName)}; src: url('${blobUrl}'); }
.configurator-panel span.cv-font-preview[data-cv-font-id="${idForSelector}"] {
  font-family: ${familyValue} !important;
  -webkit-text-fill-color: inherit !important;
}
`;
        (doc.body || doc.head).appendChild(style);
        try {
          await doc.fonts.load(`12px ${familyName}`);
        } catch {
          // ignore
        }
        setLoadedFontIds((prev) => new Set([...prev, font.id]));
      } catch {
        // ignore
      }
    };
    toLoad.forEach(loadOne);
  }, [fonts, loadedFontIds]);

  useEffect(() => {
    if (selectedTextId) setTextStep("typography");
  }, [selectedTextId]);

  const tabs: { id: TextTabId; label: string }[] = [
    { id: "contenu", label: "Contenu" },
    { id: "police", label: "Police" },
    { id: "couleur", label: "Couleur" },
    { id: "contour", label: "Contour" },
    { id: "deformation", label: "Déformation" },
  ].filter((t) => enabledTabs[t.id] !== false);

  const getTextColorHex = (t: TextModuleText) => {
    if (t.fillType === "gradient" && t.gradientColors?.[0]) return t.gradientColors[0];
    return t.color || allColors[0]?.hex || "#111827";
  };

  const renderColorGrid = (
    onPick: (hex: string) => void,
    selectedHex: string,
    scrollRef: React.RefObject<HTMLDivElement | null>,
    colorsToUse: TextModuleColor[] = allColors
  ) => (
    <div style={{ position: "relative", width: "100%" }}>
      {isMobileView && colorsToUse.length > 6 && (
        <>
          <button
            type="button"
            aria-label="Couleurs précédentes"
            onClick={() => { const el = scrollRef.current; if (el) el.scrollBy({ left: -el.clientWidth, behavior: "smooth" }); }}
            style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", zIndex: 2, width: "28px", height: "48px", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(to right, rgba(255,255,255,0.95), transparent)", border: "none", cursor: "pointer" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <button
            type="button"
            aria-label="Couleurs suivantes"
            onClick={() => { const el = scrollRef.current; if (el) el.scrollBy({ left: el.clientWidth, behavior: "smooth" }); }}
            style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", zIndex: 2, width: "28px", height: "48px", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(to left, rgba(255,255,255,0.95), transparent)", border: "none", cursor: "pointer" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </>
      )}
      <div
        ref={isMobileView ? scrollRef : null}
        className={isMobileView ? "cv-text-tabs-mobile" : undefined}
        style={isMobileView ? { display: "flex", gap: "8px", overflowX: "auto", padding: "8px 0 4px 0", scrollBehavior: "smooth", scrollbarWidth: "none", msOverflowStyle: "none" } : { display: "grid", gridTemplateColumns: "repeat(6, minmax(0px, 1fr))", gap: "8px", padding: "8px 8px 4px" }}
      >
        {colorsToUse.map((color) => {
          const isSelected = (color.hex || "").toLowerCase() === (selectedHex || "").toLowerCase();
          return (
            <button
              key={color.id}
              type="button"
              onClick={() => onPick(color.hex)}
              style={{ width: "52px", height: "52px", minWidth: "52px", borderRadius: "9999px", backgroundColor: "#f9fafb", border: isSelected ? "2px solid #000000" : "1px solid #e5e7eb", cursor: "pointer", position: "relative", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", justifySelf: isMobileView ? undefined : "start" }}
            >
              <div style={{ width: "45px", height: "45px", borderRadius: "50%", backgroundColor: color.hex, border: "2px solid #d1d5db" }} />
              {isSelected && (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="20" height="20" fill="none" stroke="#ffffff" viewBox="0 0 24 24" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderTextTab = () => {
    if (!selectedText) return null;

    if (activeTextTab === "contenu") {
      return (
        <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <label style={{ fontSize: "11px", fontWeight: 500, color: "#4b5563" }}>Contenu du texte</label>
          <input type="text" value={selectedText.content} onChange={(e) => onUpdateText(selectedText.id, { content: e.target.value })} style={{ border: "1px solid #d1d5db", borderRadius: "6px", padding: "8px 10px", fontSize: "13px" }} />
        </div>
      );
    }

    if (activeTextTab === "police") {
      const getFontUrl = (f: TextModuleFont) => f.font_url || f.file_url;
      const withUrl = fonts.filter((f) => getFontUrl(f)).length;
      const sampleText = selectedText.content?.trim() || "BEHRTG";
      const fontCard = (font: TextModuleFont, isSelected: boolean) => {
        const hasUrl = !!getFontUrl(font);
        const isLoaded = loadedFontIds.has(font.id);
        return (
          <button
            key={font.id}
            type="button"
            onClick={() => onUpdateText(selectedText.id, { fontFamily: font.display_name || font.name })}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", padding: "8px", paddingBottom: isSelected ? "26px" : "8px", borderRadius: "10px", border: "none", backgroundColor: "transparent", cursor: "pointer", minHeight: "72px", minWidth: isMobileView ? "80px" : undefined, flexShrink: isMobileView ? 0 : undefined, position: "relative", textAlign: "center" }}
          >
            <div style={{ width: "100%", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "8px 6px", borderRadius: "8px", border: isSelected ? "2px solid #111827" : "1px solid #e5e7eb", backgroundColor: isSelected ? "#e5e7eb" : "#f9fafb", minHeight: "56px", boxSizing: "border-box" }}>
              <span style={{ fontSize: "10px", fontWeight: 500, color: "#9ca3af", marginBottom: "6px", lineHeight: 1.2 }}>{font.display_name || font.name}</span>
            <span
              key={`cv-preview-${font.id}-${isLoaded}`}
              className="cv-font-preview"
              data-cv-font-id={font.id}
              style={{ fontSize: "12px", fontWeight: 600, color: "#111827", fontFamily: `${font.display_name || font.name}, sans-serif`, lineHeight: 1.2, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}
            >
                {sampleText}
              </span>
              {hasUrl && !isLoaded && <span style={{ fontSize: "9px", color: "#f59e0b", marginTop: "2px" }}>chargement…</span>}
              {!hasUrl && <span style={{ fontSize: "9px", color: "#dc2626", marginTop: "2px" }}>pas d’URL</span>}
            </div>
            {isSelected && (
              <div style={{ position: "absolute", bottom: "6px", left: "50%", transform: "translateX(-50%)", width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "#111827", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
            )}
          </button>
        );
      };
      return (
        <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <p style={{ fontSize: "11px", color: "#6b7280", margin: "0 0 4px 0" }}>
            {fonts.length} police{fonts.length > 1 ? "s" : ""} · {withUrl} avec URL · {loadedFontIds.size} chargée{loadedFontIds.size > 1 ? "s" : ""} pour l’aperçu
          </p>
          <div style={{ position: "relative", width: "100%" }}>
            {isMobileView && (
              <>
                <button type="button" aria-label="Polices précédentes" onClick={() => { const el = policeFontsScrollRef.current; if (el) el.scrollBy({ left: -el.clientWidth * 0.6, behavior: "smooth" }); }} style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", zIndex: 2, width: "28px", height: "72px", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(to right, rgba(255,255,255,0.95), transparent)", border: "none", cursor: "pointer" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                </button>
                <button type="button" aria-label="Polices suivantes" onClick={() => { const el = policeFontsScrollRef.current; if (el) el.scrollBy({ left: el.clientWidth * 0.6, behavior: "smooth" }); }} style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", zIndex: 2, width: "28px", height: "72px", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(to left, rgba(255,255,255,0.95), transparent)", border: "none", cursor: "pointer" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                </button>
              </>
            )}
            <div ref={isMobileView ? policeFontsScrollRef : null} style={isMobileView ? { display: "flex", gap: "8px", overflowX: "auto", padding: "8px 0", scrollBehavior: "smooth", scrollbarWidth: "none", msOverflowStyle: "none" } : { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "8px" }} className={isMobileView ? "cv-text-tabs-mobile" : undefined}>
              {fonts.map((font) => fontCard(font, (selectedText.fontFamily || "") === (font.display_name || font.name)))}
            </div>
          </div>
        </div>
      );
    }

    if (activeTextTab === "couleur") {
      const isGradient = selectedText.fillType === "gradient";
      const hex1 = (isGradient ? selectedText.gradientColors?.[0] : selectedText.color) || allColors[0]?.hex || "#000000";
      const hex2 = selectedText.gradientColors?.[1] || allColors[1]?.hex || allColors[0]?.hex || "#ffffff";
      const dir = selectedText.gradientDirection || "horizontal";
      const gradientPreview = dir === "horizontal" ? `linear-gradient(to right, ${hex1}, ${hex2})` : `linear-gradient(to bottom, ${hex1}, ${hex2})`;
      const currentHex = (isGradient ? hex1 : selectedText.color) || allColors[0]?.hex || "#000000";

      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "12px" }}>
          <span style={{ fontSize: "11px", fontWeight: 500, color: "#4b5563" }}>Couleur du texte</span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="button" className={`cv-couleur-mode-btn ${!isGradient ? "cv-couleur-mode-btn-active" : ""}`} onClick={() => { onUpdateText(selectedText.id, { fillType: "solid" }); setGradientPickingSlot(null); }} style={{ flex: 1, padding: "8px 16px", height: "38px", boxSizing: "border-box", color: "#111827", fontSize: "12px", fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>Couleur unie</button>
            <button type="button" className={`cv-couleur-mode-btn ${isGradient ? "cv-couleur-mode-btn-active" : ""}`} onClick={() => { setGradientPickingSlot(null); onUpdateText(selectedText.id, { fillType: "gradient", gradientColors: [hex1, hex2], gradientDirection: dir }); }} style={{ flex: 1, padding: "8px 16px", height: "38px", boxSizing: "border-box", color: "#111827", fontSize: "12px", fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>Dégradé</button>
          </div>
          {!isGradient && renderColorGrid((hex) => onUpdateText(selectedText.id, { color: hex }), currentHex, textColorScrollRef)}
          {isGradient && (
            <>
              <span style={{ fontSize: "11px", fontWeight: 500, color: "#4b5563" }}>Aperçu du dégradé</span>
              <div style={{ width: "100%", height: "32px", borderRadius: "8px", background: gradientPreview, border: "1px solid #e5e7eb" }} />
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="button" className={`cv-couleur-mode-btn ${gradientPickingSlot === "1" ? "cv-couleur-mode-btn-active" : ""}`} onClick={() => setGradientPickingSlot("1")} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "8px 16px", height: "38px", boxSizing: "border-box", color: "#111827", fontSize: "12px", fontWeight: 500, cursor: "pointer" }}>
                  <div style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: hex1, border: "2px solid #d1d5db", flexShrink: 0 }} /> Couleur 1
                </button>
                <button type="button" className={`cv-couleur-mode-btn ${gradientPickingSlot === "2" ? "cv-couleur-mode-btn-active" : ""}`} onClick={() => setGradientPickingSlot("2")} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "8px 16px", height: "38px", boxSizing: "border-box", color: "#111827", fontSize: "12px", fontWeight: 500, cursor: "pointer" }}>
                  <div style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: hex2, border: "2px solid #d1d5db", flexShrink: 0 }} /> Couleur 2
                </button>
              </div>
              {(gradientPickingSlot === "1" || gradientPickingSlot === "2") && (
                <div>
                  <span style={{ fontSize: "11px", fontWeight: 500, color: "#4b5563", display: "block", marginBottom: "6px" }}>Choisir {gradientPickingSlot === "1" ? "Couleur 1" : "Couleur 2"}</span>
                  {renderColorGrid((hex) => { if (gradientPickingSlot === "1") onUpdateText(selectedText.id, { gradientColors: [hex, hex2] }); else onUpdateText(selectedText.id, { gradientColors: [hex1, hex] }); setGradientPickingSlot(null); }, gradientPickingSlot === "1" ? hex1 : hex2, textColorScrollRef)}
                </div>
              )}
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="button" className={`cv-couleur-mode-btn ${dir === "horizontal" ? "cv-couleur-mode-btn-active" : ""}`} onClick={() => onUpdateText(selectedText.id, { gradientDirection: "horizontal" })} style={{ flex: 1, padding: "8px 16px", height: "38px", boxSizing: "border-box", color: "#111827", fontSize: "12px", fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>Dégradé horizontal</button>
                <button type="button" className={`cv-couleur-mode-btn ${dir === "vertical" ? "cv-couleur-mode-btn-active" : ""}`} onClick={() => onUpdateText(selectedText.id, { gradientDirection: "vertical" })} style={{ flex: 1, padding: "8px 16px", height: "38px", boxSizing: "border-box", color: "#111827", fontSize: "12px", fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>Dégradé vertical</button>
              </div>
            </>
          )}
        </div>
      );
    }

    if (activeTextTab === "contour") {
      const outlineHex1 = selectedText.strokeColor || outlineColors[0]?.hex || "#000000";
      const minPx = Number.isFinite(strokeMinWidthPx) && strokeMinWidthPx >= 0 ? strokeMinWidthPx : 0;
      const maxPx = Number.isFinite(strokeMaxWidthPx) && strokeMaxWidthPx > minPx ? strokeMaxWidthPx : Math.max(minPx + 1, 10);
      const rawThickness = selectedText.strokeWidth ?? minPx;
      const outlineThickness = Math.min(maxPx, Math.max(minPx, Number(rawThickness)));
      const progressPct = maxPx > minPx ? ((outlineThickness - minPx) / (maxPx - minPx)) * 100 : 0;

      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "12px" }}>
          <span style={{ fontSize: "11px", fontWeight: 500, color: "#4b5563" }}>Épaisseur</span>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <input type="range" className="cv-outline-thickness-slider" min={minPx} max={maxPx} value={outlineThickness} onChange={(e) => onUpdateText(selectedText.id, { strokeWidth: Number(e.target.value) })} style={{ width: "100%", display: "block", "--slider-progress": String(progressPct) } as React.CSSProperties} />
            </div>
            <span style={{ fontSize: "12px", color: "#4b5563", minWidth: "24px" }}>{outlineThickness}</span>
          </div>
          <span style={{ fontSize: "11px", fontWeight: 500, color: "#4b5563" }}>Couleur du contour</span>
          {renderColorGrid((hex) => onUpdateText(selectedText.id, { strokeColor: hex }), outlineHex1, outlineColorScrollRef, outlineColors)}
        </div>
      );
    }

    if (activeTextTab === "deformation") {
      const deformationType = selectedText.deformation || "aucune";
      const deformationIntensity = selectedText.deformationIntensity ?? 0;
      const deformationOptions = enabledDeformationIds?.length
        ? DEFORMATION_OPTIONS.filter((d) => enabledDeformationIds.includes(d.id))
        : DEFORMATION_OPTIONS;
      const currentDeformation = deformationOptions.find((d) => d.id === deformationType) ?? deformationOptions[0];

      return (
        <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <span style={{ fontSize: "11px", fontWeight: 500, color: "#4b5563", display: "block", marginBottom: "8px" }}>Type de déformation</span>
            <button type="button" className="cv-deformation-type-btn" onClick={() => setDeformationOptionsOpen((v) => !v)} style={{ width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "12px", border: "1px solid #d1d5db", backgroundColor: "#ffffff", boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)", cursor: "pointer", textAlign: "left" }}>
              <div style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><currentDeformation.Icon /></div>
              <span style={{ flex: 1, fontSize: "13px", color: "#374151", fontWeight: 500 }}>{currentDeformation.label}</span>
              <svg width="16" height="16" fill="none" stroke="#9ca3af" viewBox="0 0 24 24" style={{ flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
            {deformationOptionsOpen && (
              <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px", maxHeight: "280px", overflowY: "auto" }}>
                {deformationOptions.map((opt) => (
                  <button key={opt.id} type="button" onClick={() => { onUpdateText(selectedText.id, { deformation: opt.id }); setDeformationOptionsOpen(false); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "8px", border: opt.id === deformationType ? "2px solid #111827" : "1px solid #e5e7eb", backgroundColor: "#ffffff", cursor: "pointer", textAlign: "left", position: "relative" }}>
                    <div style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><opt.Icon /></div>
                    <span style={{ flex: 1, fontSize: "13px", color: "#111827", fontWeight: opt.id === deformationType ? 600 : 500 }}>{opt.label}</span>
                    {opt.id === deformationType && <div style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "#111827", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg></div>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <span style={{ fontSize: "11px", fontWeight: 500, color: "#4b5563", display: "block", marginBottom: "8px" }}>Intensité de la déformation</span>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "12px", color: "#4b5563", minWidth: "32px" }}>-100</span>
              <div style={{ flex: 1, minWidth: 0, padding: "0 10px", margin: "0 -10px" }}>
                <input type="range" className="cv-deformation-intensity-slider" min={-100} max={100} value={deformationIntensity} onChange={(e) => onUpdateText(selectedText.id, { deformationIntensity: Number(e.target.value) })} style={{ width: "100%", display: "block", "--deformation-progress": String(((deformationIntensity + 100) / 200) * 100) } as React.CSSProperties} />
              </div>
              <span style={{ fontSize: "12px", color: "#4b5563", minWidth: "32px" }}>+100</span>
              <span style={{ fontSize: "12px", color: "#374151", fontWeight: 500, minWidth: "28px" }}>{deformationIntensity}</span>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  if (textStep === "typography" && selectedText) {
    return (
      <div ref={panelRootRef} style={{ display: "flex", flexDirection: "column", height: "100%", padding: 0, gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "12px", paddingTop: "12px", paddingLeft: isMobileView ? "4px" : "16px", paddingRight: isMobileView ? "4px" : "16px", borderBottom: "1px solid #e5e7eb", flexShrink: 0 }}>
          <button type="button" onClick={() => setTextStep("list")} style={{ display: "flex", alignItems: "center", gap: "4px", background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "#374151", fontWeight: 500 }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Retour
          </button>
        </div>
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", width: "100%" }}>
          {isMobileView && (
            <button type="button" aria-label="Onglets précédents" onClick={() => { const el = textTabsScrollRef.current; if (el) el.scrollBy({ left: -el.clientWidth * 0.6, behavior: "smooth" }); }} style={{ flexShrink: 0, width: "28px", height: "38px", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(to right, rgba(255,255,255,0.95), transparent)", border: "none", cursor: "pointer" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
          )}
          <div ref={isMobileView ? textTabsScrollRef : null} className={isMobileView ? "cv-text-tabs-mobile" : undefined} style={{ display: isMobileView ? "flex" : "grid", flexDirection: isMobileView ? "row" : undefined, flexWrap: isMobileView ? "nowrap" : undefined, overflowX: isMobileView ? "auto" : undefined, scrollbarWidth: isMobileView ? "none" : undefined, msOverflowStyle: isMobileView ? "none" : undefined, gridTemplateColumns: !isMobileView ? "repeat(5, minmax(0, 1fr))" : undefined, gap: "8px", paddingLeft: isMobileView ? "4px" : "16px", paddingRight: isMobileView ? "4px" : "16px", flex: isMobileView ? 1 : undefined, minWidth: isMobileView ? 0 : undefined }}>
            {tabs.map((tab) => {
              const isActive = activeTextTab === tab.id;
              const isHovered = hoveredTextTabId === tab.id;
              return (
                <div key={tab.id} role="button" tabIndex={0} onClick={() => setActiveTextTab(tab.id)} onMouseEnter={() => setHoveredTextTabId(tab.id)} onMouseLeave={() => setHoveredTextTabId((p) => (p === tab.id ? null : p))} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActiveTextTab(tab.id); } }} style={{ padding: "8px 16px", height: "38px", boxSizing: "border-box", borderRadius: "10px", border: isActive ? "2px solid #111827" : isHovered ? "1px solid #6b7280" : "1px solid #e5e7eb", backgroundColor: isActive ? "#e5e7eb" : isHovered ? "#f3f4f6" : "#f9fafb", color: "#111827", fontSize: "12px", fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", textAlign: "center", transition: "border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease", boxShadow: isActive ? "0 0 0 1px rgba(0,0,0,0.15)" : isHovered ? "0 0 0 1px rgba(148,163,184,0.35)" : "none", width: isMobileView ? "auto" : "100%", minWidth: isMobileView ? "max-content" : undefined, flexShrink: isMobileView ? 0 : undefined }}>{tab.label}</div>
              );
            })}
          </div>
          {isMobileView && (
            <button type="button" aria-label="Onglets suivants" onClick={() => { const el = textTabsScrollRef.current; if (el) el.scrollBy({ left: el.clientWidth * 0.6, behavior: "smooth" }); }} style={{ flexShrink: 0, width: "28px", height: "38px", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(to left, rgba(255,255,255,0.95), transparent)", border: "none", cursor: "pointer" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          )}
        </div>
        <div style={isMobileView ? { flex: "1 1 0%", minHeight: 0, overflow: "auto", padding: 0 } : { flex: 1, minHeight: 0, overflowY: "auto", padding: "0 16px 16px" }}>{renderTextTab()}</div>
      </div>
    );
  }

  return (
    <div ref={panelRootRef} style={{ display: "flex", flexDirection: "column", gap: isMobileView ? 0 : "12px", padding: isMobileView ? 0 : "16px 4px" }}>
      <div style={{ width: "100%", marginBottom: "8px" }}>
        <button className="cv-panel-add-logo-btn" role="button" tabIndex={0} onClick={onAddText} style={{ height: "44px", padding: "0 40px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", borderRadius: "12px", border: "none", backgroundColor: "#000000", color: "#ffffff", fontSize: "13px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", transition: "background-color 0.2s ease", width: "100%" }}>
          <span style={{ fontSize: "18px", lineHeight: 1, marginTop: "-1px" }}>+</span>
          {addTextLabel}
        </button>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "4px" }}>
        <span style={{ fontSize: "13px", fontWeight: 500, color: "#111827" }}>{placedTextsLabel} ({texts.length})</span>
      </div>
      {isMobileView ? (
        texts.length === 0 ? <span style={{ fontSize: "12px", color: "#9ca3af" }}>Aucun texte placé</span> : (
          <div style={{ position: "relative", width: "100%" }}>
            {texts.length > 2 && (
              <>
                <button type="button" aria-label="Textes précédents" onClick={() => { const el = placedTextsScrollRef.current; if (el) el.scrollBy({ left: -el.clientWidth, behavior: "smooth" }); }} style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", zIndex: 2, width: "28px", height: "64px", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(to right, rgba(255,255,255,0.95), transparent)", border: "none", cursor: "pointer" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg></button>
                <button type="button" aria-label="Textes suivants" onClick={() => { const el = placedTextsScrollRef.current; if (el) el.scrollBy({ left: el.clientWidth, behavior: "smooth" }); }} style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", zIndex: 2, width: "28px", height: "64px", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(to left, rgba(255,255,255,0.95), transparent)", border: "none", cursor: "pointer" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg></button>
              </>
            )}
            <div ref={placedTextsScrollRef} style={{ display: "flex", flexDirection: "row", gap: "8px", overflowX: "auto", padding: "8px 0 4px 0", scrollBehavior: "smooth", scrollbarWidth: "none", msOverflowStyle: "none" }}>
              {texts.map((t) => (
                <div key={t.id} role="button" tabIndex={0} onClick={() => { onSelectText(t.id); setActiveTextTab("contenu"); setTextStep("typography"); }} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelectText(t.id); setActiveTextTab("contenu"); setTextStep("typography"); } }} style={{ flexShrink: 0, width: "88px", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", padding: "8px", backgroundColor: "#ffffff", border: selectedTextId === t.id ? "1px solid #111827" : "1px solid #e0e0e0", borderRadius: "10px", cursor: "pointer", boxSizing: "border-box" }}>
                  <div style={{ minHeight: "40px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: "4px 0", maxWidth: "100%" }}>
                    <span className="cv-font-preview" style={{ fontSize: "13px", fontWeight: 600, fontFamily: `"${t.fontFamily || "sans-serif"}", sans-serif`, color: getTextColorHex(t), textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{t.content || "Texte"}</span>
                  </div>
                  <button type="button" onClick={(e) => { e.stopPropagation(); onRemoveText(t.id); if (selectedTextId === t.id) onSelectText(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: "4px" }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {texts.map((t) => (
            <div key={t.id} role="button" tabIndex={0} onClick={() => { onSelectText(t.id); setActiveTextTab("contenu"); setTextStep("typography"); }} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelectText(t.id); setActiveTextTab("contenu"); setTextStep("typography"); } }} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", backgroundColor: "#ffffff", border: selectedTextId === t.id ? "1px solid #111827" : "1px solid #e0e0e0", borderRadius: "10px", cursor: "pointer", boxSizing: "border-box" }}>
              <div style={{ minHeight: "40px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: "4px 0", minWidth: "60px" }}>
                <span className="cv-font-preview" style={{ fontSize: "13px", fontWeight: 600, fontFamily: `"${t.fontFamily || "sans-serif"}", sans-serif`, color: getTextColorHex(t), overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.content || "Texte"}</span>
              </div>
              <button type="button" onClick={(e) => { e.stopPropagation(); onRemoveText(t.id); if (selectedTextId === t.id) onSelectText(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: "4px", marginLeft: "auto" }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
