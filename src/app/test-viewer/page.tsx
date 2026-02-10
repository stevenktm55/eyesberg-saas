"use client";

import React, { useState, useEffect, useRef } from "react";
import ConfiguratorViewer, {
  ConfiguratorViewerProps,
} from "@/components/ConfiguratorViewer";
import { TextModulePanel, type TextModulePanelProps } from "@/components/TextModulePanel";

type Module = ConfiguratorViewerProps["modules"][number];

// Données fictives pour reproduire l'UI réelle des modules
const MOCK_DESIGNS = [
  {
    id: "design-1",
    name: "Maillot Home",
    label: "Home 24/25",
    svg_url: "/images/example-design-1.png",
    color_mappings: {
      primary: "color-1",
      secondary: "color-2",
      tertiary: "color-3",
    },
  },
  {
    id: "design-2",
    name: "Maillot Extérieur",
    label: "Away 24/25",
    svg_url: "/images/example-design-2.png",
    color_mappings: {
      primary: "color-4",
      secondary: "color-5",
      tertiary: "color-2",
    },
  },
];

const MOCK_PALETTE = {
  id: "palette-1",
  name: "Palette Club",
  colors: [
    { id: "color-1", name: "Noir", hex: "#000000" },
    { id: "color-2", name: "Blanc", hex: "#FFFFFF" },
    { id: "color-3", name: "Gris", hex: "#9CA3AF" },
    { id: "color-4", name: "Rouge", hex: "#EF4444" },
    { id: "color-5", name: "Bleu", hex: "#2563EB" },
  ],
};

const MOCK_LOGOS = [
  {
    id: "logo-1",
    name: "Logo 1",
    label: "Logo 1",
    image_url: "/uploads/example-logo-1.png",
  },
  {
    id: "logo-2",
    name: "Logo 2",
    label: "Logo 2",
    image_url: "/uploads/example-logo-2.png",
  },
  {
    id: "logo-3",
    name: "Logo 3",
    label: "Logo 3",
    image_url: "/uploads/example-logo-3.png",
  },
];

const TEXT_FONTS = [
  "Alien",
  "Astro",
  "Brush",
  "Classic",
  "Club",
  "Cool",
  "Cube",
  "Danger",
  "Factory",
  "Fast",
  "Kimber",
  "Master",
  "MODERN",
  "Podium",
  "Race",
  "Script",
  "Sharp",
  "Shift",
  "Signature",
  "Snake",
  "STOCK",
  "Tag",
  "Team",
  "Western",
  "Winner",
] as const;
const DEFAULT_TEXT_FONT = TEXT_FONTS[0];
const FONT_SAMPLE = "BEHRTG";

type TextColorMode = "solid" | "gradient";
type GradientDirection = "horizontal" | "vertical";

const DEFORMATION_OPTIONS = [
  { id: "aucune", label: "Aucune déformation", Icon: () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 3l4 4-12 12H5v-4L17 3z" stroke="#EAB308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>) },
  { id: "arc", label: "Arc", Icon: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 18c4-4 8-4 12 0" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round"/><path d="M4 14c3-2 6-2 9 0" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round"/></svg>) },
  { id: "drapeau", label: "Drapeau", Icon: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 4v16M5 4l3 4 3-4M5 4h14l-4 4 4 4H5" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>) },
  { id: "vague", label: "Vague", Icon: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"/><path d="M2 16c2-2 4-2 6 0s4 2 6 0 4-2 6 0" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round"/></svg>) },
  { id: "bombe", label: "Bombé", Icon: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="12" cy="12" rx="8" ry="10" stroke="#EF4444" strokeWidth="2" fill="none"/></svg>) },
  { id: "pincement", label: "Pinçage", Icon: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 8l4 8 4-8" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>) },
  { id: "fisheye", label: "Fisheye", Icon: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="#92400E" strokeWidth="2" fill="#FEF3C7"/><circle cx="12" cy="12" r="4" fill="#92400E"/></svg>) },
  { id: "compression", label: "Compression", Icon: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 6c0 4 4 4 4 6s-4 2-4 6" stroke="#2563EB" strokeWidth="2" strokeLinecap="round"/><path d="M16 6c0 4-4 4-4 6s4 2 4 6" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"/></svg>) },
  { id: "inclinaison", label: "Inclinaison", Icon: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 20L20 4" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/><path d="M8 20l4-4" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/></svg>) },
  { id: "spirale", label: "Spirale", Icon: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4a8 8 0 018 8" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"/><path d="M12 12a4 4 0 014 4" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"/></svg>) },
  { id: "rotation-progressive", label: "Rotation progressive", Icon: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4v4l2-2" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 20v-4l2 2" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 12h4l-2-2" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M20 12h-4l2-2" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>) },
  { id: "tilt", label: "Tilt", Icon: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4v16M12 4l-4 8h8l-4-8z" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>) },
  { id: "perspective", label: "Perspective", Icon: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="8" width="16" height="10" rx="1" stroke="#6B7280" strokeWidth="2"/><path d="M8 8l4-4 4 4" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>) },
] as const;

const MOCK_TEXTS: Array<{
  id: string;
  label: string;
  content: string;
  font?: string;
  colorId?: string;
  colorMode?: TextColorMode;
  gradientColor1Id?: string;
  gradientColor2Id?: string;
  gradientDirection?: GradientDirection;
  outlineThickness?: number;
  outlineColorId?: string;
  outlineColorMode?: TextColorMode;
  outlineGradientColor1Id?: string;
  outlineGradientColor2Id?: string;
  outlineGradientDirection?: GradientDirection;
  deformationType?: string;
  deformationIntensity?: number;
}> = [
  { id: "text-1", label: "Nom joueur", content: "MBAPPÉ", font: DEFAULT_TEXT_FONT, colorId: "color-1" },
  { id: "text-2", label: "Numéro", content: "7", font: DEFAULT_TEXT_FONT, colorId: "color-2" },
];

const MOCK_PLACED_LOGOS = [
  {
    id: "placed-1",
    view: "front",
    label: "Logo poitrine gauche",
    position: "Poitrine gauche",
  },
  {
    id: "placed-2",
    view: "front",
    label: "Logo poitrine centre",
    position: "Poitrine centre",
  },
  { id: "placed-3", view: "back", label: "Logo dos", position: "Nuque" },
];

type ColorClassId = string;

const INITIAL_COLOR_CLASSES: ColorClassId[] = [
  "primary",
  "secondary",
  "tertiary",
];

type TextTabId = "contenu" | "police" | "couleur" | "contour" | "deformation";
type LogoViewId = string;
type LogoView = {
  id: LogoViewId;
  label: string;
};

const INITIAL_LOGO_VIEWS: LogoView[] = [
  { id: "front", label: "Face" },
  { id: "back", label: "Dos" },
  { id: "left", label: "Bras gauche" },
  { id: "right", label: "Bras droit" },
];

/** Config du module Design fournie par le builder admin (titre, icône, designs autorisés). */
export type DesignModuleFromBuilder = {
  tabName: string;
  icon?: string;
  iconUrl?: string;
  designs: Array<{
    id: string;
    name: string;
    label?: string;
    svg_url?: string;
    svgUrl?: string;
    color_mappings?: Record<string, string> | null;
  }>;
  /** Couleurs de la palette pour afficher les pastilles sous chaque design. */
  paletteColors: Array<{ id: string; name: string; hex: string }>;
  selectedDesignId: string | null;
  onSelectDesign: (id: string) => void;
};

/** Config du module Couleur fournie par le builder (titre, icône, palette, classes avec labels). */
export type ColorsModuleFromBuilder = {
  tabName: string;
  icon?: string;
  iconUrl?: string;
  /** Palette de couleurs à afficher. */
  paletteColors: Array<{ id: string; name: string; hex: string }>;
  /** Classes de couleurs (ex. primary, secondary) avec libellé affiché. */
  colorClasses: Array<{ id: string; label: string }>;
  /** Mapping classe → id de couleur actuel. */
  designColors: Record<string, string>;
  onDesignColorsChange: (colorClass: string, colorId: string) => void;
};

/** Config du module Texte fournie par le builder (titre, icône + props du panel texte). */
export type TextModuleFromBuilder = {
  tabName: string;
  icon?: string;
  iconUrl?: string;
} & Omit<TextModulePanelProps, "isMobileView">;

export type ProductConfiguratorPanelProps = {
  /** Contenu du canvas (viewer 3D ou placeholder). Si non fourni, utilise un placeholder. */
  canvasContent?: React.ReactNode;
  /** Afficher la sidebar de test (boutons Forme, Logo, etc.). Par défaut true pour test-viewer. */
  showTestSidebar?: boolean;
  /** Mode intégré : ne rend que le panel + viewer (sans wrapper ni sidebar de test). Pour insérer dans admin. */
  embedMode?: boolean;
  /** Module Design branché au builder : titre, icône, liste des designs, sélection. */
  designModuleFromBuilder?: DesignModuleFromBuilder;
  /** Module Couleur branché au builder : titre, icône, palette, classes, sélection. */
  colorsModuleFromBuilder?: ColorsModuleFromBuilder;
  /** Module Texte branché au builder : titre, icône, textes, couleurs, polices, onglets, etc. */
  textModuleFromBuilder?: TextModuleFromBuilder;
};

export function ProductConfiguratorPanel({
  canvasContent,
  showTestSidebar = true,
  embedMode = false,
  designModuleFromBuilder,
  colorsModuleFromBuilder,
  textModuleFromBuilder,
}: ProductConfiguratorPanelProps) {
  const [activeTab, setActiveTab] = useState<string>("design");
  const [isMobileView, setIsMobileView] = useState(false);
  const [modulesState, setModulesState] = useState<Module[]>([
    { id: "design", name: "Design" },
    { id: "colors", name: "Couleur" },
    { id: "logo", name: "Logo" },
    { id: "text", name: "Texte" },
  ]);
  const modules: Module[] = (designModuleFromBuilder || colorsModuleFromBuilder || textModuleFromBuilder)
    ? modulesState.map((m) => {
        if (m.id === "design" && designModuleFromBuilder)
          return { ...m, name: designModuleFromBuilder.tabName, icon: designModuleFromBuilder.icon, iconUrl: designModuleFromBuilder.iconUrl };
        if (m.id === "colors" && colorsModuleFromBuilder)
          return { ...m, name: colorsModuleFromBuilder.tabName, icon: colorsModuleFromBuilder.icon, iconUrl: colorsModuleFromBuilder.iconUrl };
        if (m.id === "text" && textModuleFromBuilder)
          return { ...m, name: textModuleFromBuilder.tabName, icon: textModuleFromBuilder.icon, iconUrl: textModuleFromBuilder.iconUrl };
        return m;
      })
    : modulesState;
  const setModules = setModulesState;

  // État fictif pour reproduire les comportements des modules réels
  const [selectedDesignId, setSelectedDesignId] = useState<string>(MOCK_DESIGNS[0].id);
  const [selectedColorClass, setSelectedColorClass] = useState<ColorClassId | null>(null);
  const [colorClasses, setColorClasses] =
    useState<ColorClassId[]>(INITIAL_COLOR_CLASSES);
  const [designColors, setDesignColors] = useState<Record<ColorClassId, string>>({
    primary: "color-1",
    secondary: "color-2",
    tertiary: "color-3",
  });
  const [hoveredDesignId, setHoveredDesignId] = useState<string | null>(null);
  const [hoveredColorClass, setHoveredColorClass] = useState<ColorClassId | null>(null);
  const [selectedLogoId, setSelectedLogoId] = useState<string | null>(null);
  const [logoViews, setLogoViews] = useState<LogoView[]>(INITIAL_LOGO_VIEWS);
  const [activeLogoView, setActiveLogoView] = useState<LogoViewId>("front");
  const [hoveredLogoViewId, setHoveredLogoViewId] = useState<LogoViewId | null>(null);
  const [showLogoLibrary, setShowLogoLibrary] = useState(false);
  const [isAddLogoHovered, setIsAddLogoHovered] = useState(false);
  const [logos, setLogos] = useState(MOCK_LOGOS);
  const [placedLogos, setPlacedLogos] = useState(MOCK_PLACED_LOGOS);
  const [texts, setTexts] = useState(MOCK_TEXTS);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [activeTextTab, setActiveTextTab] = useState<TextTabId>("contenu");
  const [textStep, setTextStep] = useState<"list" | "typography">("list");
  const [hoveredTextTabId, setHoveredTextTabId] = useState<TextTabId | null>(null);
  const [isAddTextHovered, setIsAddTextHovered] = useState(false);
  const [gradientPickingSlot, setGradientPickingSlot] = useState<"1" | "2" | null>(null);
  const [outlineGradientPickingSlot, setOutlineGradientPickingSlot] = useState<"1" | "2" | null>(null);
  const [deformationOptionsOpen, setDeformationOptionsOpen] = useState(false);
  const [paletteColors, setPaletteColors] = useState(MOCK_PALETTE.colors);
  const colorsScrollRef = useRef<HTMLDivElement | null>(null);
  const textColorScrollRef = useRef<HTMLDivElement | null>(null);
  const outlineColorScrollRef = useRef<HTMLDivElement | null>(null);
  const placedLogosScrollRef = useRef<HTMLDivElement | null>(null);
  const logoLibraryScrollRef = useRef<HTMLDivElement | null>(null);
  const placedTextsScrollRef = useRef<HTMLDivElement | null>(null);
  const textTabsScrollRef = useRef<HTMLDivElement | null>(null);
  const policeFontsScrollRef = useRef<HTMLDivElement | null>(null);

  const handleAddColorClass = () => {
    setColorClasses((prev) => {
      const nextIndex = prev.length + 1;
      const newId: ColorClassId = `couleur-${nextIndex}`;
      if (prev.includes(newId)) return prev;

      setDesignColors((current) => ({
        ...current,
        [newId]: MOCK_PALETTE.colors[0]?.id ?? "color-1",
      }));

      return [...prev, newId];
    });
  };

  const handleAddPaletteColor = () => {
    setPaletteColors((prev) => {
      const nextIndex = prev.length + 1;
      const newId = `color-${nextIndex}`;
      if (prev.some((c) => c.id === newId)) return prev;
      return [
        ...prev,
        {
          id: newId,
          name: `Couleur-${nextIndex}`,
          hex: "#6B7280",
        },
      ];
    });
  };

  const handleAddLogoView = () => {
    setLogoViews((prev) => {
      const nextIndex = prev.length + 1;
      const newId: LogoViewId = `vue-${nextIndex}`;
      if (prev.some((v) => v.id === newId)) return prev;
      return [...prev, { id: newId, label: `Vue ${nextIndex}` }];
    });
  };

  const handleRemoveLogoView = () => {
    setLogoViews((prev) => {
      if (prev.length <= 1) return prev;
      const removed = prev[prev.length - 1];
      const next = prev.slice(0, -1);
      setActiveLogoView((current) => {
        if (!next.length) return current;
        return current === removed.id ? next[0].id : current;
      });
      setHoveredLogoViewId((current) => (current === removed.id ? null : current));
      return next;
    });
  };

  const handleAddPlacedLogo = () => {
    const logoCount = placedLogos.filter((l) => l.view === activeLogoView).length;
    const newLogo = {
      id: `placed-${Date.now()}`,
      view: activeLogoView,
      label: `Logo ${logoCount + 1}`,
      position: "Position par défaut",
    };
    setPlacedLogos((prev) => [...prev, newLogo]);
  };

  const handleRemovePlacedLogo = (id: string) => {
    setPlacedLogos((prev) => prev.filter((l) => l.id !== id));
    if (selectedLogoId === id) setSelectedLogoId(null);
  };

  const handleAddLogoToLibrary = () => {
    const nextIndex = logos.length + 1;
    const newLogo = {
      id: `logo-${nextIndex}`,
      name: `Logo ${nextIndex}`,
      label: `Logo ${nextIndex}`,
      image_url: `/uploads/example-logo-${nextIndex}.png`,
    };
    setLogos((prev) => [...prev, newLogo]);
  };

  const handleAddPlacedText = () => {
    const firstColorId = paletteColors[0]?.id ?? "color-1";
    const secondColorId = paletteColors[1]?.id ?? firstColorId;
    const newText = {
      id: `text-${Date.now()}`,
      label: `Texte ${texts.length + 1}`,
      content: "Nouveau",
      font: DEFAULT_TEXT_FONT,
      colorId: firstColorId,
      outlineThickness: 3,
      outlineColorId: firstColorId,
      outlineColorMode: "solid" as TextColorMode,
      outlineGradientColor1Id: firstColorId,
      outlineGradientColor2Id: secondColorId,
      outlineGradientDirection: "horizontal" as GradientDirection,
      deformationType: "aucune",
      deformationIntensity: 0,
    };
    setTexts((prev) => [...prev, newText]);
    setSelectedTextId(newText.id);
    setActiveTextTab("contenu");
    setTextStep("typography");
  };

  const updateText = (
    id: string,
    patch: {
      content?: string;
      font?: string;
      colorId?: string;
      colorMode?: TextColorMode;
      gradientColor1Id?: string;
      gradientColor2Id?: string;
      gradientDirection?: GradientDirection;
      outlineThickness?: number;
      outlineColorId?: string;
      outlineColorMode?: TextColorMode;
      outlineGradientColor1Id?: string;
      outlineGradientColor2Id?: string;
      outlineGradientDirection?: GradientDirection;
      deformationType?: string;
      deformationIntensity?: number;
    }
  ) => {
    setTexts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch } : t))
    );
  };

  const handleRemovePlacedText = (id: string) => {
    setTexts((prev) => prev.filter((t) => t.id !== id));
    if (selectedTextId === id) {
      setSelectedTextId(null);
      setTextStep("list");
    }
  };

  // Garde activeTab cohérent avec la liste de modules
  useEffect(() => {
    if (!modules.length) {
      setActiveTab("");
      return;
    }
    if (!modules.some((m) => m.id === activeTab)) {
      setActiveTab(modules[0].id);
    }
  }, [modules, activeTab]);

  const addModule = (id: string, name: string) => {
    setModules((prev) => {
      if (prev.some((m) => m.id === id)) return prev;
      return [...prev, { id, name }];
    });
    setActiveTab(id);
  };

  const handleRemoveLast = () => {
    setModules((prev) => {
      if (!prev.length) return prev;
      const newModules = prev.slice(0, -1);
      const removed = prev[prev.length - 1];
      if (removed.id === activeTab) {
        setActiveTab(newModules[0]?.id ?? "");
      }
      return newModules;
    });
  };

  // FONCTION QUI GÉNÈRE LE CONTENU (Simulation de l'Admin ou branché au builder)
  const renderPanelContent = () => {
    // Vue TEXT (module texte) — branchée au builder si textModuleFromBuilder fourni
    if (activeTab === "text" && textModuleFromBuilder) {
      const { tabName, icon, iconUrl, ...panelProps } = textModuleFromBuilder;
      return <TextModulePanel {...panelProps} isMobileView={isMobileView} />;
    }

    // Vue DESIGN (module designs-2d) — branché au builder si designModuleFromBuilder fourni
    if (activeTab === "design") {
      const fromBuilder = designModuleFromBuilder;
      const designList = fromBuilder?.designs ?? MOCK_DESIGNS;
      const selectedId = fromBuilder ? fromBuilder.selectedDesignId : selectedDesignId;
      const onSelect = fromBuilder ? fromBuilder.onSelectDesign : (id: string) => setSelectedDesignId(id);
      const colorsForDots = fromBuilder?.paletteColors ?? paletteColors;
      const selectedDesign = designList.find((d) => d.id === selectedId) ?? designList[0];
      const colorKeys = selectedDesign.color_mappings
        ? (Object.keys(selectedDesign.color_mappings) as ColorClassId[])
        : [];

      if (designList.length === 0 && fromBuilder) {
        return (
          <div style={{ padding: "24px", textAlign: "center", color: "#6b7280", fontSize: "13px" }}>
            Aucun design configuré. Ajoutez des designs dans les paramètres du module.
          </div>
        );
      }

      return (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            columnGap: "24px",
            rowGap: "24px",
            padding: "24px 0 24px 0",
            overflowY: "auto",
          }}
        >
          {designList.map((design) => {
            const isSelected = design.id === selectedId;
            const isHovered = design.id === hoveredDesignId;
            const mappings = (design.color_mappings || {}) as Record<ColorClassId, string>;
            const keys = Object.keys(mappings) as ColorClassId[];
            const svgUrl = "svg_url" in design ? design.svg_url : (design as { svgUrl?: string }).svgUrl;

            return (
              <div
                key={design.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(design.id)}
                onMouseEnter={() => setHoveredDesignId(design.id)}
                onMouseLeave={() =>
                  setHoveredDesignId((prev) => (prev === design.id ? null : prev))
                }
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  padding: "16px 12px 12px",
                  backgroundColor: "#ffffff",
                  border: isSelected
                    ? "2px solid #000000"
                    : isHovered
                    ? "1px solid #d1d5db"
                    : "1px solid #e5e7eb",
                  borderRadius: "12px",
                  cursor: "pointer",
                  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                  boxShadow: isHovered && !isSelected ? "0 0 0 1px #e5e7eb" : "none",
                }}
              >
                <div
                  style={{
                    width: "100px",
                    height: "100px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "10px",
                  }}
                >
                  {svgUrl ? (
                    <img
                      src={svgUrl}
                      alt={design.label || design.name}
                      style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100px",
                        height: "100px",
                        backgroundColor: "#f3f4f6",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#9ca3af",
                        fontSize: "11px",
                      }}
                    >
                      Aperçu
                    </div>
                  )}
                </div>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "#111827",
                    marginBottom: "6px",
                    textAlign: "center",
                  }}
                >
                  {design.label || design.name}
                </span>
                {keys.length > 0 && (
                  <div style={{ display: "flex", gap: "4px" }}>
                    {keys.map((key) => {
                      const colorId = mappings[key];
                      const color = colorsForDots.find((c) => c.id === colorId);
                      const hex = color?.hex ?? "#cccccc";
                      return (
                        <div
                          key={key}
                          style={{
                            width: "12px",
                            height: "12px",
                            borderRadius: "50%",
                            backgroundColor: hex,
                            border: "1px solid #d1d5db",
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    // Vue COLORS (module couleurs) — branché au builder si colorsModuleFromBuilder fourni
    if (activeTab === "colors") {
      const fromBuilder = colorsModuleFromBuilder;
      const allColors = fromBuilder?.paletteColors ?? paletteColors;
      const designColorsMap = fromBuilder ? fromBuilder.designColors : designColors;
      const onColorChange = fromBuilder
        ? (colorClass: string, colorId: string) => fromBuilder.onDesignColorsChange(colorClass, colorId)
        : (colorClass: string, colorId: string) => setDesignColors((prev) => ({ ...prev, [colorClass]: colorId }));
      const colorClassesList = fromBuilder
        ? fromBuilder.colorClasses
        : colorClasses.map((id) => ({
            id,
            label:
              id === "primary"
                ? "Principal"
                : id === "secondary"
                ? "Secondaire"
                : id === "tertiary"
                ? "Tertiaire"
                : id.charAt(0).toUpperCase() + id.slice(1),
          }));

      if (colorClassesList.length === 0 && fromBuilder) {
        return (
          <div style={{ padding: "24px", textAlign: "center", color: "#6b7280", fontSize: "13px" }}>
            Aucune classe de couleur. Sélectionnez un design avec des couleurs (principal, secondaire, etc.).
          </div>
        );
      }
      if (allColors.length === 0 && fromBuilder) {
        return (
          <div style={{ padding: "24px", textAlign: "center", color: "#6b7280", fontSize: "13px" }}>
            Sélectionnez une palette dans les paramètres du module.
          </div>
        );
      }

      // Vue sélection d'une couleur pour une classe (après clic sur une classe)
      if (selectedColorClass) {
        const currentColorId = designColorsMap[selectedColorClass];
        const currentColor =
          allColors.find((c) => c.id === currentColorId) ?? allColors[0];

        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              padding: "0 0px 0px 0px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: "12px",
                paddingTop: "12px",
                borderBottom: "1px solid #e5e7eb",
                marginBottom: "12px",
              }}
            >
              <button
                onClick={() => setSelectedColorClass(null)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "13px",
                  color: "#374151",
                  fontWeight: 500,
                }}
              >
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Retour
              </button>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "13px", color: "#374151" }}>
                  {currentColor.name}
                </span>
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    backgroundColor: currentColor.hex,
                    border: "2px solid #e5e7eb",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                position: "relative",
                width: "100%",
              }}
            >
              {isMobileView && allColors.length > 6 && (
                <>
                  <button
                    type="button"
                    aria-label="Couleurs précédentes"
                    onClick={() => {
                      const el = colorsScrollRef.current;
                      if (el) el.scrollBy({ left: -el.clientWidth, behavior: "smooth" });
                    }}
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "50%",
                      transform: "translateY(-50%)",
                      zIndex: 2,
                      width: "28px",
                      height: "48px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background:
                        "linear-gradient(to right, rgba(255,255,255,0.95), transparent)",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#111827"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    aria-label="Couleurs suivantes"
                    onClick={() => {
                      const el = colorsScrollRef.current;
                      if (el) el.scrollBy({ left: el.clientWidth, behavior: "smooth" });
                    }}
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "50%",
                      transform: "translateY(-50%)",
                      zIndex: 2,
                      width: "28px",
                      height: "48px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background:
                        "linear-gradient(to left, rgba(255,255,255,0.95), transparent)",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#111827"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </>
              )}
              <div
                ref={isMobileView ? colorsScrollRef : null}
                style={
                  isMobileView
                    ? {
                        display: "flex",
                        gap: "8px",
                        overflowX: "auto",
                        padding: "8px 0 4px 0",
                        scrollBehavior: "smooth",
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                      }
                    : {
                        display: "grid",
                        gridTemplateColumns: "repeat(6, minmax(0px, 1fr))",
                        gap: "8px",
                        padding: "8px 8px 4px",
                      }
                }
              >
                {allColors.map((color) => {
                  const isSelected = color.id === currentColorId;
                  return (
                    <button
                      key={color.id}
                      onClick={() => onColorChange(selectedColorClass, color.id)}
                      style={{
                        width: "52px",
                        height: "52px",
                        minWidth: "52px",
                        borderRadius: "9999px",
                        backgroundColor: "#f9fafb",
                        border: isSelected
                          ? "2px solid #000000"
                          : "1px solid #e5e7eb",
                        cursor: "pointer",
                        position: "relative",
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        justifySelf: isMobileView ? undefined : "start",
                      }}
                    >
                      <div
                        style={{
                          width: "45px",
                          height: "45px",
                          borderRadius: "50%",
                          backgroundColor: color.hex,
                          border: "2px solid #d1d5db",
                        }}
                      />
                      {isSelected && (
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <svg
                            width="20"
                            height="20"
                            fill="none"
                            stroke="#ffffff"
                            viewBox="0 0 24 24"
                            style={{
                              filter:
                                "drop-shadow(0 1px 2px rgba(0,0,0,0.5))",
                            }}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      }

      // Vue classes de couleur (avant sélection d'une classe)
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div
            style={{
              display: "grid",
              padding: isMobileView ? "0px 0px" : "24px 0 24px 0",
              gridTemplateColumns: isMobileView
                ? "repeat(4, minmax(0, 1fr))"
                : "repeat(3, minmax(0, 1fr))",
              gap: isMobileView ? "16px" : "24px",
            }}
          >
            {colorClassesList.map(({ id: colorClass, label: classLabel }) => {
              const currentColorId = designColorsMap[colorClass];
              const color =
                allColors.find((c) => c.id === currentColorId) ?? allColors[0];
              const hex = color?.hex ?? "#e5e7eb";
              const isHovered = colorClass === hoveredColorClass;

              return (
                <div
                  key={colorClass}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedColorClass(colorClass)}
                  onMouseEnter={() => setHoveredColorClass(colorClass)}
                  onMouseLeave={() =>
                    setHoveredColorClass((prev) =>
                      prev === colorClass ? null : prev
                    )
                  }
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    padding: isMobileView ? "6px 4px 6px" : "16px 12px 12px",
                    backgroundColor: "#ffffff",
                    border: isHovered ? "1px solid #d1d5db" : "1px solid #e5e7eb",
                    borderRadius: "12px",
                    cursor: "pointer",
                    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                    boxShadow: isHovered ? "0 0 0 1px #e5e7eb" : "none",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  <div
                    style={{
                      width: isMobileView ? "36px" : "48px",
                      height: isMobileView ? "36px" : "48px",
                      borderRadius: "50%",
                      backgroundColor: hex,
                      border: "2px solid #d1d5db",
                      marginBottom: "6px",
                      aspectRatio: "1 / 1",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 500,
                      color: "#374151",
                      textAlign: "center",
                      lineHeight: 1.2,
                    }}
                  >
                    {classLabel}
                  </span>
                </div>
              );
            })}
          </div>

        </div>
      );
    }

    // Vue LOGO (module logos) — vues + logos placés + bibliothèque sur demande
    if (activeTab === "logo") {
      const placedForView = placedLogos.filter((l) => l.view === activeLogoView);

      // Quand la bibliothèque est ouverte, on masque les vues + logos placés
      if (showLogoLibrary) {
        return (
          <div
            className="logo-library-container"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: isMobileView ? 0 : "8px",
              padding: isMobileView ? 0 : "0 4px",
              height: "100%",
              maxHeight: "100%",
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            {/* Header type mobile : retour + titre aligné à droite */}
            <div
              className="logo-library-header"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: isMobileView ? "0 0 8px" : "12px 4px 8px",
                flexShrink: 0,
              }}
            >
              <button
                type="button"
                onClick={() => setShowLogoLibrary(false)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px 4px",
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#111827",
                  }}
                >
                  Retour
                </span>
              </button>

              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#111827",
                  marginLeft: "auto",
                }}
              >
                Bibliothèque de logos
              </span>
            </div>

            {/* Bouton principal noir Importer un logo - même style que Ajouter un logo */}
            <div
              className="cv-panel-add-logo-btn"
              role="button"
              tabIndex={0}
              style={{
                height: "44px",
                padding: "0 40px",
                borderRadius: "12px",
                border: "none",
                backgroundColor: isAddLogoHovered ? "#374151" : "#000000",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                cursor: "pointer",
                width: "100%",
                transition: "background-color 0.2s ease",
                flexShrink: 0,
              }}
              onMouseEnter={() => setIsAddLogoHovered(true)}
              onMouseLeave={() => setIsAddLogoHovered(false)}
            >
              <span
                style={{
                  fontSize: "18px",
                  lineHeight: 1,
                  marginTop: "-1px",
                }}
              >
                ＋
              </span>
              Importer un logo
            </div>

            <div
              className="logo-library-content"
              style={{
                backgroundColor: "#ffffff",
                padding: isMobileView ? "8px 0 12px" : "14px 0px 12px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                flex: 1,
                minHeight: 0,
                maxHeight: "100%",
                overflow: "hidden",
              }}
            >
              <input
                type="text"
                placeholder="Rechercher un logo..."
                style={{
                  width: "100%",
                  borderRadius: "9999px",
                  border: "1px solid #e5e7eb",
                  padding: "10px 14px",
                  fontSize: "13px",
                  backgroundColor: "#f9fafb",
                  flexShrink: 0,
                }}
              />

              {isMobileView ? (
                /* Mobile : logos en horizontal avec scroll et flèches */
                <div style={{ position: "relative", width: "100%", flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                  {logos.length > 2 && (
                    <>
                      <button
                        type="button"
                        aria-label="Logos précédents"
                        onClick={() => {
                          const el = logoLibraryScrollRef.current;
                          if (el) el.scrollBy({ left: -el.clientWidth, behavior: "smooth" });
                        }}
                        style={{
                          position: "absolute",
                          left: 0,
                          top: "50%",
                          transform: "translateY(-50%)",
                          zIndex: 2,
                          width: "28px",
                          height: "80px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "linear-gradient(to right, rgba(255,255,255,0.95), transparent)",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M15 18l-6-6 6-6" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        aria-label="Logos suivants"
                        onClick={() => {
                          const el = logoLibraryScrollRef.current;
                          if (el) el.scrollBy({ left: el.clientWidth, behavior: "smooth" });
                        }}
                        style={{
                          position: "absolute",
                          right: 0,
                          top: "50%",
                          transform: "translateY(-50%)",
                          zIndex: 2,
                          width: "28px",
                          height: "80px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "linear-gradient(to left, rgba(255,255,255,0.95), transparent)",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </button>
                    </>
                  )}
                  <div
                    ref={logoLibraryScrollRef}
                    className="logo-library-grid"
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      gap: "8px",
                      overflowX: "auto",
                      overflowY: "hidden",
                      flex: 1,
                      minHeight: 0,
                      scrollBehavior: "smooth",
                      scrollbarWidth: "none",
                      msOverflowStyle: "none",
                      alignContent: "flex-start",
                    }}
                  >
                    {logos.map((logo) => {
                      const isPicked = selectedLogoId === logo.id;
                      return (
                        <button
                          key={logo.id}
                          type="button"
                          onClick={() => setSelectedLogoId(logo.id)}
                          style={{
                            flexShrink: 0,
                            width: "100px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "stretch",
                            padding: "8px 6px 6px",
                            backgroundColor: "#ffffff",
                            border: isPicked ? "2px solid #000000" : "1px solid #e5e7eb",
                            borderRadius: "12px",
                            cursor: "pointer",
                            textAlign: "center",
                          }}
                        >
                          <div
                            style={{
                              width: "100%",
                              height: "64px",
                              marginBottom: "4px",
                              borderRadius: "10px",
                              backgroundColor: "#f9fafb",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              overflow: "hidden",
                            }}
                          >
                            <span style={{ fontSize: "10px", color: "#9ca3af", padding: "0 4px" }}>Aperçu logo</span>
                          </div>
                          <span style={{ fontSize: "12px", fontWeight: 500, color: "#111827", lineHeight: 1.2 }}>
                            {logo.label || logo.name}
                          </span>
                          <span style={{ marginTop: "2px", fontSize: "11px", color: "#6b7280" }}>
                            {`${Math.floor(Math.random() * 9) + 1} variantes`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div
                  className="logo-library-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                    gap: "6px",
                    flex: 1,
                    minHeight: 0,
                    overflowY: "auto",
                    alignContent: "start",
                  }}
                >
                  {logos.map((logo) => {
                    const isPicked = selectedLogoId === logo.id;
                    return (
                      <button
                        key={logo.id}
                        type="button"
                        onClick={() => setSelectedLogoId(logo.id)}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "stretch",
                          padding: "8px 6px 6px",
                          backgroundColor: "#ffffff",
                          border: isPicked ? "2px solid #000000" : "1px solid #e5e7eb",
                          borderRadius: "12px",
                          cursor: "pointer",
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            width: "100%",
                            height: "64px",
                            marginBottom: "4px",
                            borderRadius: "10px",
                            backgroundColor: "#f9fafb",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                          }}
                        >
                          <span style={{ fontSize: "10px", color: "#9ca3af", padding: "0 4px" }}>Aperçu logo</span>
                        </div>
                        <span style={{ fontSize: "12px", fontWeight: 500, color: "#111827", lineHeight: 1.2 }}>
                          {logo.label || logo.name}
                        </span>
                        <span style={{ marginTop: "2px", fontSize: "11px", color: "#6b7280" }}>
                          {`${Math.floor(Math.random() * 9) + 1} variantes`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      }

      // Vue normale : vues + bouton ajouter + logos placés
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: isMobileView ? 0 : "12px",
            padding: isMobileView ? 0 : "16px 4px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: "8px",
            }}
          >
            {logoViews.map((view) => {
              const isActive = activeLogoView === view.id;
              const isHovered = hoveredLogoViewId === view.id;
              return (
                <div
                  key={view.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveLogoView(view.id)}
                  onMouseEnter={() => setHoveredLogoViewId(view.id)}
                  onMouseLeave={() =>
                    setHoveredLogoViewId((prev) => (prev === view.id ? null : prev))
                  }
                  style={{
                    padding: "8px 16px",
                    height: "38px",
                    boxSizing: "border-box",
                    borderRadius: "10px",
                    border: isActive
                      ? "2px solid #111827"
                      : isHovered
                      ? "1px solid #6b7280"
                      : "1px solid #e5e7eb",
                    backgroundColor: isActive
                      ? "#e5e7eb"
                      : isHovered
                      ? "#f3f4f6"
                      : "#f9fafb",
                    color: "#111827",
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    transition:
                      "border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease",
                    boxShadow: isActive
                      ? "0 0 0 1px rgba(0,0,0,0.15)"
                      : isHovered
                      ? "0 0 0 1px rgba(148,163,184,0.35)"
                      : "none",
                    width: "100%",
                  }}
                >
                  {view.label}
                </div>
              );
            })}
          </div>

          <div
            style={{
              height: "1px",
              backgroundColor: "#e5e7eb",
              margin: "12px 0 8px",
            }}
          />

          <div
            style={{
              width: "100%",
              marginBottom: "8px",
            }}
          >
            <div
              className="cv-panel-add-logo-btn"
              role="button"
              tabIndex={0}
              onClick={() => setShowLogoLibrary(true)}
              style={{
                height: "44px",
                padding: "0 40px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                borderRadius: "12px",
                border: "none",
                backgroundColor: isAddLogoHovered ? "#374151" : "#000000",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "background-color 0.2s ease",
                width: "100%",
              }}
              onMouseEnter={() => setIsAddLogoHovered(true)}
              onMouseLeave={() => setIsAddLogoHovered(false)}
            >
              <span>＋</span>
              Ajouter un logo
            </div>
          </div>

          {/* Logos placés */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: isMobileView ? "4px" : "4px",
            }}
          >
            <span style={{ fontSize: "13px", fontWeight: 500, color: "#111827" }}>
              {`Logos placés (${placedForView.length})`}
            </span>
          </div>

          {isMobileView ? (
            /* Mobile : cartes compactes côte à côte, scroll horizontal + flèches */
            placedForView.length === 0 ? (
              <span style={{ fontSize: "12px", color: "#9ca3af" }}>
                Aucun logo placé sur cette vue
              </span>
            ) : (
            <div style={{ position: "relative", width: "100%" }}>
              {placedForView.length > 2 && (
                <>
                  <button
                    type="button"
                    aria-label="Logos précédents"
                    onClick={() => {
                      const el = placedLogosScrollRef.current;
                      if (el) el.scrollBy({ left: -el.clientWidth, behavior: "smooth" });
                    }}
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "50%",
                      transform: "translateY(-50%)",
                      zIndex: 2,
                      width: "28px",
                      height: "64px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background:
                        "linear-gradient(to right, rgba(255,255,255,0.95), transparent)",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#111827"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    aria-label="Logos suivants"
                    onClick={() => {
                      const el = placedLogosScrollRef.current;
                      if (el) el.scrollBy({ left: el.clientWidth, behavior: "smooth" });
                    }}
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "50%",
                      transform: "translateY(-50%)",
                      zIndex: 2,
                      width: "28px",
                      height: "64px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background:
                        "linear-gradient(to left, rgba(255,255,255,0.95), transparent)",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#111827"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </>
              )}
              <div
                ref={placedLogosScrollRef}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  gap: "8px",
                  overflowX: "auto",
                  padding: "8px 0 4px 0",
                  scrollBehavior: "smooth",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                {placedForView.map((logo) => (
                  <div
                    key={logo.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setSelectedLogoId(logo.id);
                      setShowLogoLibrary(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedLogoId(logo.id);
                        setShowLogoLibrary(true);
                      }
                    }}
                    style={{
                      flexShrink: 0,
                      width: "88px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px",
                      backgroundColor: "#ffffff",
                      border: selectedLogoId === logo.id ? "1px solid #111827" : "1px solid #e0e0e0",
                      borderRadius: "10px",
                      cursor: "pointer",
                      boxSizing: "border-box",
                    }}
                  >
                    <div
                      style={{
                        width: "64px",
                        height: "64px",
                        borderRadius: "8px",
                        backgroundColor: "#f3f4f6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                      }}
                    >
                      <span style={{ fontSize: "10px", color: "#9ca3af" }}>Aperçu</span>
                    </div>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 500,
                        color: "#111827",
                        textAlign: "center",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "100%",
                      }}
                    >
                      {logo.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            )
          ) : (
            /* Desktop : liste verticale, aperçu à gauche, nom au centre, poubelle à droite */
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {placedForView.map((logo) => (
                <div
                  key={logo.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setSelectedLogoId(logo.id);
                    setShowLogoLibrary(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedLogoId(logo.id);
                      setShowLogoLibrary(true);
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 12px",
                    backgroundColor: "#ffffff",
                    border: selectedLogoId === logo.id ? "1px solid #111827" : "1px solid #e0e0e0",
                    borderRadius: "10px",
                    cursor: "pointer",
                    boxSizing: "border-box",
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      minWidth: "48px",
                      borderRadius: "8px",
                      backgroundColor: "#f3f4f6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    <span style={{ fontSize: "10px", color: "#9ca3af" }}>Aperçu</span>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      justifyContent: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "#111827",
                      }}
                    >
                      {logo.label}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemovePlacedLogo(logo.id);
                    }}
                    aria-label="Supprimer le logo"
                    style={{
                      flexShrink: 0,
                      width: "32px",
                      height: "32px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                      border: "none",
                      borderRadius: "6px",
                      backgroundColor: "transparent",
                      cursor: "pointer",
                      color: "#dc2626",
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                </div>
              ))}
              {!placedForView.length && (
                <span style={{ fontSize: "12px", color: "#9ca3af" }}>
                  Aucun logo placé sur cette vue
                </span>
              )}
            </div>
          )}
        </div>
      );
    }

    // Vue TEXT (module texte) — étape liste (bouton + textes placés) ou typographie (onglets + Retour)
    if (activeTab === "text") {
      const selectedText =
        texts.find((t) => t.id === selectedTextId) ?? null;
      const tabs: { id: TextTabId; label: string }[] = [
        { id: "contenu", label: "Contenu" },
        { id: "police", label: "Police" },
        { id: "couleur", label: "Couleur" },
        { id: "contour", label: "Contour" },
        { id: "deformation", label: "Déformation" },
      ];

      const renderTextTab = () => {
        if (!selectedText) return null;

        if (activeTextTab === "contenu") {
          return (
            <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "11px", fontWeight: 500, color: "#4b5563" }}>
                Contenu du texte
              </label>
              <input
                type="text"
                value={selectedText.content}
                onChange={(e) => updateText(selectedText.id, { content: e.target.value })}
                style={{
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  padding: "8px 10px",
                  fontSize: "13px",
                }}
              />
            </div>
          );
        }
        if (activeTextTab === "police") {
          const currentFont = selectedText.font ?? DEFAULT_TEXT_FONT;
          const sampleText = selectedText.content || FONT_SAMPLE;
          const fontCard = (font: string, isSelected: boolean) => (
            <button
              key={font}
              type="button"
              onClick={() => updateText(selectedText.id, { font })}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                padding: "8px",
                paddingBottom: isSelected ? "26px" : "8px",
                borderRadius: "10px",
                border: "none",
                backgroundColor: "transparent",
                cursor: "pointer",
                minHeight: "72px",
                minWidth: isMobileView ? "80px" : undefined,
                flexShrink: isMobileView ? 0 : undefined,
                position: "relative",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "100%",
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "8px 6px",
                  borderRadius: "8px",
                  border: isSelected ? "2px solid #111827" : "1px solid #e5e7eb",
                  backgroundColor: isSelected ? "#e5e7eb" : "#f9fafb",
                  minHeight: "56px",
                  boxSizing: "border-box",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 500,
                    color: "#9ca3af",
                    marginBottom: "6px",
                    lineHeight: 1.2,
                  }}
                >
                  {font}
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#111827",
                    fontFamily: `"${font}", sans-serif`,
                    lineHeight: 1.2,
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "100%",
                  }}
                >
                  {sampleText}
                </span>
              </div>
              {isSelected && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "6px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    backgroundColor: "#111827",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
            </button>
          );
          return (
            <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ position: "relative", width: "100%" }}>
                {isMobileView && (
                  <>
                    <button
                      type="button"
                      aria-label="Polices précédentes"
                      onClick={() => {
                        const el = policeFontsScrollRef.current;
                        if (el) el.scrollBy({ left: -el.clientWidth * 0.6, behavior: "smooth" });
                      }}
                      style={{
                        position: "absolute",
                        left: 0,
                        top: "50%",
                        transform: "translateY(-50%)",
                        zIndex: 2,
                        width: "28px",
                        height: "72px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "linear-gradient(to right, rgba(255,255,255,0.95), transparent)",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                    </button>
                    <button
                      type="button"
                      aria-label="Polices suivantes"
                      onClick={() => {
                        const el = policeFontsScrollRef.current;
                        if (el) el.scrollBy({ left: el.clientWidth * 0.6, behavior: "smooth" });
                      }}
                      style={{
                        position: "absolute",
                        right: 0,
                        top: "50%",
                        transform: "translateY(-50%)",
                        zIndex: 2,
                        width: "28px",
                        height: "72px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "linear-gradient(to left, rgba(255,255,255,0.95), transparent)",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                    </button>
                  </>
                )}
                <div
                  ref={isMobileView ? policeFontsScrollRef : null}
                  style={
                    isMobileView
                      ? {
                          display: "flex",
                          gap: "8px",
                          overflowX: "auto",
                          padding: "8px 0",
                          scrollBehavior: "smooth",
                          scrollbarWidth: "none",
                          msOverflowStyle: "none",
                        }
                      : {
                          display: "grid",
                          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                          gap: "8px",
                        }
                  }
                  className={isMobileView ? "cv-text-tabs-mobile" : undefined}
                >
                  {TEXT_FONTS.map((font) => fontCard(font, font === currentFont))}
                </div>
              </div>
            </div>
          );
        }
        if (activeTextTab === "couleur") {
          const allColors = paletteColors;
          const mode = selectedText.colorMode ?? "solid";
          const isGradient = mode === "gradient";
          const currentColorId = selectedText.colorId ?? allColors[0]?.id;
          const g1 = selectedText.gradientColor1Id ?? allColors[0]?.id;
          const g2 = selectedText.gradientColor2Id ?? allColors[1]?.id ?? allColors[0]?.id;
          const dir = selectedText.gradientDirection ?? "horizontal";
          const hex1 = allColors.find((c) => c.id === g1)?.hex ?? "#000000";
          const hex2 = allColors.find((c) => c.id === g2)?.hex ?? "#ffffff";
          const gradientPreview =
            dir === "horizontal"
              ? `linear-gradient(to right, ${hex1}, ${hex2})`
              : `linear-gradient(to bottom, ${hex1}, ${hex2})`;

          const renderColorGrid = (onPick: (colorId: string) => void, selectedId: string) => (
            <div style={{ position: "relative", width: "100%" }}>
              {isMobileView && allColors.length > 6 && (
                <>
                  <button
                    type="button"
                    aria-label="Couleurs précédentes"
                    onClick={() => {
                      const el = textColorScrollRef.current;
                      if (el) el.scrollBy({ left: -el.clientWidth, behavior: "smooth" });
                    }}
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "50%",
                      transform: "translateY(-50%)",
                      zIndex: 2,
                      width: "28px",
                      height: "48px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "linear-gradient(to right, rgba(255,255,255,0.95), transparent)",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                  </button>
                  <button
                    type="button"
                    aria-label="Couleurs suivantes"
                    onClick={() => {
                      const el = textColorScrollRef.current;
                      if (el) el.scrollBy({ left: el.clientWidth, behavior: "smooth" });
                    }}
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "50%",
                      transform: "translateY(-50%)",
                      zIndex: 2,
                      width: "28px",
                      height: "48px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "linear-gradient(to left, rgba(255,255,255,0.95), transparent)",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                  </button>
                </>
              )}
              <div
                ref={isMobileView ? textColorScrollRef : null}
                style={
                  isMobileView
                    ? { display: "flex", gap: "8px", overflowX: "auto", padding: "8px 0 4px 0", scrollBehavior: "smooth", scrollbarWidth: "none", msOverflowStyle: "none" }
                    : { display: "grid", gridTemplateColumns: "repeat(6, minmax(0px, 1fr))", gap: "8px", padding: "8px 8px 4px" }
                }
              >
                {allColors.map((color) => {
                  const isSelected = color.id === selectedId;
                  return (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => onPick(color.id)}
                      style={{
                        width: "52px",
                        height: "52px",
                        minWidth: "52px",
                        borderRadius: "9999px",
                        backgroundColor: "#f9fafb",
                        border: isSelected ? "2px solid #000000" : "1px solid #e5e7eb",
                        cursor: "pointer",
                        position: "relative",
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        justifySelf: isMobileView ? undefined : "start",
                      }}
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

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "12px" }}>
              <span style={{ fontSize: "11px", fontWeight: 500, color: "#4b5563" }}>Couleur du texte</span>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className={`cv-couleur-mode-btn ${!isGradient ? "cv-couleur-mode-btn-active" : ""}`}
                  onClick={() => { updateText(selectedText.id, { colorMode: "solid" }); setGradientPickingSlot(null); }}
                  style={{
                    flex: 1,
                    padding: "8px 16px",
                    height: "38px",
                    boxSizing: "border-box",
                    color: "#111827",
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  Couleur unie
                </button>
                <button
                  type="button"
                  className={`cv-couleur-mode-btn ${isGradient ? "cv-couleur-mode-btn-active" : ""}`}
                  onClick={() => {
                    setGradientPickingSlot(null);
                    updateText(selectedText.id, {
                      colorMode: "gradient",
                      gradientColor1Id: selectedText.gradientColor1Id ?? allColors[0]?.id,
                      gradientColor2Id: selectedText.gradientColor2Id ?? allColors[1]?.id ?? allColors[0]?.id,
                      gradientDirection: selectedText.gradientDirection ?? "horizontal",
                    });
                  }}
                  style={{
                    flex: 1,
                    padding: "8px 16px",
                    height: "38px",
                    boxSizing: "border-box",
                    color: "#111827",
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  Dégradé
                </button>
              </div>

              {!isGradient && renderColorGrid(
                (colorId) => updateText(selectedText.id, { colorId }),
                currentColorId
              )}

              {isGradient && (
                <>
                  <span style={{ fontSize: "11px", fontWeight: 500, color: "#4b5563" }}>Aperçu du dégradé</span>
                  <div
                    style={{
                      width: "100%",
                      height: "32px",
                      borderRadius: "8px",
                      background: gradientPreview,
                      border: "1px solid #e5e7eb",
                    }}
                  />
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      className={`cv-couleur-mode-btn ${gradientPickingSlot === "1" ? "cv-couleur-mode-btn-active" : ""}`}
                      onClick={() => setGradientPickingSlot("1")}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        padding: "8px 16px",
                        height: "38px",
                        boxSizing: "border-box",
                        color: "#111827",
                        fontSize: "12px",
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: hex1, border: "2px solid #d1d5db", flexShrink: 0 }} />
                      Couleur 1
                    </button>
                    <button
                      type="button"
                      className={`cv-couleur-mode-btn ${gradientPickingSlot === "2" ? "cv-couleur-mode-btn-active" : ""}`}
                      onClick={() => setGradientPickingSlot("2")}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        padding: "8px 16px",
                        height: "38px",
                        boxSizing: "border-box",
                        color: "#111827",
                        fontSize: "12px",
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: hex2, border: "2px solid #d1d5db", flexShrink: 0 }} />
                      Couleur 2
                    </button>
                  </div>
                  {(gradientPickingSlot === "1" || gradientPickingSlot === "2") && (
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: 500, color: "#4b5563", display: "block", marginBottom: "6px" }}>
                        Choisir {gradientPickingSlot === "1" ? "Couleur 1" : "Couleur 2"}
                      </span>
                      {renderColorGrid(
                        (colorId) => {
                          if (gradientPickingSlot === "1") updateText(selectedText.id, { gradientColor1Id: colorId });
                          else updateText(selectedText.id, { gradientColor2Id: colorId });
                          setGradientPickingSlot(null);
                        },
                        gradientPickingSlot === "1" ? g1 : g2
                      )}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      className={`cv-couleur-mode-btn ${dir === "horizontal" ? "cv-couleur-mode-btn-active" : ""}`}
                      onClick={() => updateText(selectedText.id, { gradientDirection: "horizontal" })}
                      style={{
                        flex: 1,
                        padding: "8px 16px",
                        height: "38px",
                        boxSizing: "border-box",
                        color: "#111827",
                        fontSize: "12px",
                        fontWeight: 500,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      Dégradé horizontal
                    </button>
                    <button
                      type="button"
                      className={`cv-couleur-mode-btn ${dir === "vertical" ? "cv-couleur-mode-btn-active" : ""}`}
                      onClick={() => updateText(selectedText.id, { gradientDirection: "vertical" })}
                      style={{
                        flex: 1,
                        padding: "8px 16px",
                        height: "38px",
                        boxSizing: "border-box",
                        color: "#111827",
                        fontSize: "12px",
                        fontWeight: 500,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      Dégradé vertical
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        }
        if (activeTextTab === "contour") {
          const allColors = paletteColors;
          const outlineMode = selectedText.outlineColorMode ?? "solid";
          const isOutlineGradient = outlineMode === "gradient";
          const outlineCurrentColorId = selectedText.outlineColorId ?? allColors[0]?.id;
          const og1 = selectedText.outlineGradientColor1Id ?? allColors[0]?.id;
          const og2 = selectedText.outlineGradientColor2Id ?? allColors[1]?.id ?? allColors[0]?.id;
          const outlineDir = selectedText.outlineGradientDirection ?? "horizontal";
          const outlineHex1 = allColors.find((c) => c.id === og1)?.hex ?? "#000000";
          const outlineHex2 = allColors.find((c) => c.id === og2)?.hex ?? "#ffffff";
          const outlineGradientPreview =
            outlineDir === "horizontal"
              ? `linear-gradient(to right, ${outlineHex1}, ${outlineHex2})`
              : `linear-gradient(to bottom, ${outlineHex1}, ${outlineHex2})`;
          const outlineThickness = selectedText.outlineThickness ?? 3;

          const renderOutlineColorGrid = (onPick: (colorId: string) => void, selectedId: string) => (
            <div style={{ position: "relative", width: "100%" }}>
              {isMobileView && allColors.length > 6 && (
                <>
                  <button
                    type="button"
                    aria-label="Couleurs précédentes"
                    onClick={() => {
                      const el = outlineColorScrollRef.current;
                      if (el) el.scrollBy({ left: -el.clientWidth, behavior: "smooth" });
                    }}
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "50%",
                      transform: "translateY(-50%)",
                      zIndex: 2,
                      width: "28px",
                      height: "48px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "linear-gradient(to right, rgba(255,255,255,0.95), transparent)",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                  </button>
                  <button
                    type="button"
                    aria-label="Couleurs suivantes"
                    onClick={() => {
                      const el = outlineColorScrollRef.current;
                      if (el) el.scrollBy({ left: el.clientWidth, behavior: "smooth" });
                    }}
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "50%",
                      transform: "translateY(-50%)",
                      zIndex: 2,
                      width: "28px",
                      height: "48px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "linear-gradient(to left, rgba(255,255,255,0.95), transparent)",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                  </button>
                </>
              )}
              <div
                ref={isMobileView ? outlineColorScrollRef : null}
                style={
                  isMobileView
                    ? { display: "flex", gap: "8px", overflowX: "auto", padding: "8px 0 4px 0", scrollBehavior: "smooth", scrollbarWidth: "none", msOverflowStyle: "none" }
                    : { display: "grid", gridTemplateColumns: "repeat(6, minmax(0px, 1fr))", gap: "8px", padding: "8px 8px 4px" }
                }
              >
                {allColors.map((color) => {
                  const isSelected = color.id === selectedId;
                  return (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => onPick(color.id)}
                      style={{
                        width: "52px",
                        height: "52px",
                        minWidth: "52px",
                        borderRadius: "9999px",
                        backgroundColor: "#f9fafb",
                        border: isSelected ? "2px solid #000000" : "1px solid #e5e7eb",
                        cursor: "pointer",
                        position: "relative",
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        justifySelf: isMobileView ? undefined : "start",
                      }}
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

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "12px" }}>
              <span style={{ fontSize: "11px", fontWeight: 500, color: "#4b5563" }}>Épaisseur</span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <input
                    type="range"
                    className="cv-outline-thickness-slider"
                    min={0}
                    max={10}
                    value={outlineThickness}
                    onChange={(e) => updateText(selectedText.id, { outlineThickness: Number(e.target.value) })}
                    style={{ width: "100%", display: "block", "--slider-progress": String((outlineThickness / 10) * 100) } as React.CSSProperties}
                  />
                </div>
                <span style={{ fontSize: "12px", color: "#4b5563", minWidth: "24px" }}>{outlineThickness}</span>
              </div>

              <span style={{ fontSize: "11px", fontWeight: 500, color: "#4b5563" }}>Couleur du contour</span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className={`cv-couleur-mode-btn ${!isOutlineGradient ? "cv-couleur-mode-btn-active" : ""}`}
                  onClick={() => { updateText(selectedText.id, { outlineColorMode: "solid" }); setOutlineGradientPickingSlot(null); }}
                  style={{
                    flex: 1,
                    padding: "8px 16px",
                    height: "38px",
                    boxSizing: "border-box",
                    color: "#111827",
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  Couleur unie
                </button>
                <button
                  type="button"
                  className={`cv-couleur-mode-btn ${isOutlineGradient ? "cv-couleur-mode-btn-active" : ""}`}
                  onClick={() => {
                    setOutlineGradientPickingSlot(null);
                    updateText(selectedText.id, {
                      outlineColorMode: "gradient",
                      outlineGradientColor1Id: selectedText.outlineGradientColor1Id ?? allColors[0]?.id,
                      outlineGradientColor2Id: selectedText.outlineGradientColor2Id ?? allColors[1]?.id ?? allColors[0]?.id,
                      outlineGradientDirection: selectedText.outlineGradientDirection ?? "horizontal",
                    });
                  }}
                  style={{
                    flex: 1,
                    padding: "8px 16px",
                    height: "38px",
                    boxSizing: "border-box",
                    color: "#111827",
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  Dégradé
                </button>
              </div>

              {!isOutlineGradient && renderOutlineColorGrid(
                (colorId) => updateText(selectedText.id, { outlineColorId: colorId }),
                outlineCurrentColorId
              )}

              {isOutlineGradient && (
                <>
                  <span style={{ fontSize: "11px", fontWeight: 500, color: "#4b5563" }}>Aperçu du dégradé</span>
                  <div
                    style={{
                      width: "100%",
                      height: "32px",
                      borderRadius: "8px",
                      background: outlineGradientPreview,
                      border: "1px solid #e5e7eb",
                    }}
                  />
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      className={`cv-couleur-mode-btn ${outlineGradientPickingSlot === "1" ? "cv-couleur-mode-btn-active" : ""}`}
                      onClick={() => setOutlineGradientPickingSlot("1")}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        padding: "8px 16px",
                        height: "38px",
                        boxSizing: "border-box",
                        color: "#111827",
                        fontSize: "12px",
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: outlineHex1, border: "2px solid #d1d5db", flexShrink: 0 }} />
                      Couleur 1
                    </button>
                    <button
                      type="button"
                      className={`cv-couleur-mode-btn ${outlineGradientPickingSlot === "2" ? "cv-couleur-mode-btn-active" : ""}`}
                      onClick={() => setOutlineGradientPickingSlot("2")}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        padding: "8px 16px",
                        height: "38px",
                        boxSizing: "border-box",
                        color: "#111827",
                        fontSize: "12px",
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: outlineHex2, border: "2px solid #d1d5db", flexShrink: 0 }} />
                      Couleur 2
                    </button>
                  </div>
                  {(outlineGradientPickingSlot === "1" || outlineGradientPickingSlot === "2") && (
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: 500, color: "#4b5563", display: "block", marginBottom: "6px" }}>
                        Choisir {outlineGradientPickingSlot === "1" ? "Couleur 1" : "Couleur 2"}
                      </span>
                      {renderOutlineColorGrid(
                        (colorId) => {
                          if (outlineGradientPickingSlot === "1") updateText(selectedText.id, { outlineGradientColor1Id: colorId });
                          else updateText(selectedText.id, { outlineGradientColor2Id: colorId });
                          setOutlineGradientPickingSlot(null);
                        },
                        outlineGradientPickingSlot === "1" ? og1 : og2
                      )}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      className={`cv-couleur-mode-btn ${outlineDir === "horizontal" ? "cv-couleur-mode-btn-active" : ""}`}
                      onClick={() => updateText(selectedText.id, { outlineGradientDirection: "horizontal" })}
                      style={{
                        flex: 1,
                        padding: "8px 16px",
                        height: "38px",
                        boxSizing: "border-box",
                        color: "#111827",
                        fontSize: "12px",
                        fontWeight: 500,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      Dégradé horizontal
                    </button>
                    <button
                      type="button"
                      className={`cv-couleur-mode-btn ${outlineDir === "vertical" ? "cv-couleur-mode-btn-active" : ""}`}
                      onClick={() => updateText(selectedText.id, { outlineGradientDirection: "vertical" })}
                      style={{
                        flex: 1,
                        padding: "8px 16px",
                        height: "38px",
                        boxSizing: "border-box",
                        color: "#111827",
                        fontSize: "12px",
                        fontWeight: 500,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      Dégradé vertical
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        }
        const deformationType = selectedText.deformationType ?? "aucune";
        const deformationIntensity = selectedText.deformationIntensity ?? 0;
        const currentDeformation = DEFORMATION_OPTIONS.find((d) => d.id === deformationType) ?? DEFORMATION_OPTIONS[0];

        return (
          <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <span style={{ fontSize: "11px", fontWeight: 500, color: "#4b5563", display: "block", marginBottom: "8px" }}>
                Type de déformation
              </span>
              <button
                type="button"
                className="cv-deformation-type-btn"
                onClick={() => setDeformationOptionsOpen((v) => !v)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 12px",
                  borderRadius: "12px",
                  border: "1px solid #d1d5db",
                  backgroundColor: "#ffffff",
                  boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <currentDeformation.Icon />
                </div>
                <span style={{ flex: 1, fontSize: "13px", color: "#374151", fontWeight: 500 }}>{currentDeformation.label}</span>
                <svg width="16" height="16" fill="none" stroke="#9ca3af" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {deformationOptionsOpen && (
                <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px", maxHeight: "280px", overflowY: "auto" }}>
                  {DEFORMATION_OPTIONS.map((opt) => {
                    const isSelected = opt.id === deformationType;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          updateText(selectedText.id, { deformationType: opt.id });
                          setDeformationOptionsOpen(false);
                        }}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: isSelected ? "2px solid #111827" : "1px solid #e5e7eb",
                          backgroundColor: "#ffffff",
                          cursor: "pointer",
                          textAlign: "left",
                          position: "relative",
                        }}
                      >
                        <div style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <opt.Icon />
                        </div>
                        <span style={{ flex: 1, fontSize: "13px", color: "#111827", fontWeight: isSelected ? 600 : 500 }}>{opt.label}</span>
                        {isSelected && (
                          <div style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "#111827", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <span style={{ fontSize: "11px", fontWeight: 500, color: "#4b5563", display: "block", marginBottom: "8px" }}>
                Intensité de la déformation
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "12px", color: "#4b5563", minWidth: "32px" }}>-100</span>
                <div style={{ flex: 1, minWidth: 0, padding: "0 10px", margin: "0 -10px" }}>
                  <input
                    type="range"
                    className="cv-deformation-intensity-slider"
                    min={-100}
                    max={100}
                    value={deformationIntensity}
                    onChange={(e) => updateText(selectedText.id, { deformationIntensity: Number(e.target.value) })}
                    style={{ width: "100%", display: "block", "--deformation-progress": String(((deformationIntensity + 100) / 200) * 100) } as React.CSSProperties}
                  />
                </div>
                <span style={{ fontSize: "12px", color: "#4b5563", minWidth: "32px" }}>+100</span>
                <span style={{ fontSize: "12px", color: "#374151", fontWeight: 500, minWidth: "28px" }}>{deformationIntensity}</span>
              </div>
            </div>
          </div>
        );
      };

      // Étape typographie : header Retour + onglets (style vues logos) + module actif en dessous
      if (textStep === "typography" && selectedText) {
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              padding: "0",
              gap: "12px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: "12px",
                paddingTop: "12px",
                paddingLeft: isMobileView ? "4px" : "16px",
                paddingRight: isMobileView ? "4px" : "16px",
                borderBottom: "1px solid #e5e7eb",
                flexShrink: 0,
              }}
            >
              <button
                type="button"
                onClick={() => setTextStep("list")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "13px",
                  color: "#374151",
                  fontWeight: 500,
                }}
              >
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Retour
              </button>
            </div>

            <div style={{ flexShrink: 0, display: "flex", alignItems: "center", width: "100%" }}>
              {isMobileView && (
                <button
                  type="button"
                  aria-label="Onglets précédents"
                  onClick={() => {
                    const el = textTabsScrollRef.current;
                    if (el) el.scrollBy({ left: -el.clientWidth * 0.6, behavior: "smooth" });
                  }}
                  style={{
                    flexShrink: 0,
                    width: "28px",
                    height: "38px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(to right, rgba(255,255,255,0.95), transparent)",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                </button>
              )}
            <div
              ref={isMobileView ? textTabsScrollRef : null}
              className={isMobileView ? "cv-text-tabs-mobile" : undefined}
              style={{
                display: isMobileView ? "flex" : "grid",
                flexDirection: isMobileView ? "row" : undefined,
                flexWrap: isMobileView ? "nowrap" : undefined,
                overflowX: isMobileView ? "auto" : undefined,
                scrollbarWidth: isMobileView ? "none" : undefined,
                msOverflowStyle: isMobileView ? "none" : undefined,
                gridTemplateColumns: !isMobileView ? "repeat(5, minmax(0, 1fr))" : undefined,
                gap: "8px",
                paddingLeft: isMobileView ? "4px" : "16px",
                paddingRight: isMobileView ? "4px" : "16px",
                flex: isMobileView ? 1 : undefined,
                minWidth: isMobileView ? 0 : undefined,
              }}
            >
              {tabs.map((tab) => {
                const isActive = activeTextTab === tab.id;
                const isHovered = hoveredTextTabId === tab.id;
                return (
                  <div
                    key={tab.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setActiveTextTab(tab.id)}
                    onMouseEnter={() => setHoveredTextTabId(tab.id)}
                    onMouseLeave={() =>
                      setHoveredTextTabId((prev) => (prev === tab.id ? null : prev))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setActiveTextTab(tab.id);
                      }
                    }}
                    style={{
                      padding: "8px 16px",
                      height: "38px",
                      boxSizing: "border-box",
                      borderRadius: "10px",
                      border: isActive
                        ? "2px solid #111827"
                        : isHovered
                        ? "1px solid #6b7280"
                        : "1px solid #e5e7eb",
                      backgroundColor: isActive
                        ? "#e5e7eb"
                        : isHovered
                        ? "#f3f4f6"
                        : "#f9fafb",
                      color: "#111827",
                      fontSize: "12px",
                      fontWeight: 500,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      transition:
                        "border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease",
                      boxShadow: isActive
                        ? "0 0 0 1px rgba(0,0,0,0.15)"
                        : isHovered
                        ? "0 0 0 1px rgba(148,163,184,0.35)"
                        : "none",
                      width: isMobileView ? "auto" : "100%",
                      minWidth: isMobileView ? "max-content" : undefined,
                      flexShrink: isMobileView ? 0 : undefined,
                    }}
                  >
                    {tab.label}
                  </div>
                );
              })}
            </div>
              {isMobileView && (
                <button
                  type="button"
                  aria-label="Onglets suivants"
                  onClick={() => {
                    const el = textTabsScrollRef.current;
                    if (el) el.scrollBy({ left: el.clientWidth * 0.6, behavior: "smooth" });
                  }}
                  style={{
                    flexShrink: 0,
                    width: "28px",
                    height: "38px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(to left, rgba(255,255,255,0.95), transparent)",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                </button>
              )}
            </div>

            <div
              style={
                isMobileView
                  ? { flex: "1 1 0%", minHeight: 0, overflow: "auto", padding: 0 }
                  : { flex: 1, minHeight: 0, overflowY: "auto", padding: "0 16px 16px" }
              }
            >
              {renderTextTab()}
            </div>
          </div>
        );
      }

      // Étape liste : bouton Ajouter un texte + textes placés (style logos : aperçu + corbeille, pas de nom)
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: isMobileView ? 0 : "12px",
            padding: isMobileView ? 0 : "16px 4px",
          }}
        >
          <div
            style={{
              width: "100%",
              marginBottom: "8px",
            }}
          >
            <div
              className="cv-panel-add-logo-btn"
              role="button"
              tabIndex={0}
              onClick={handleAddPlacedText}
              style={{
                height: "44px",
                padding: "0 40px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                borderRadius: "12px",
                border: "none",
                backgroundColor: isAddTextHovered ? "#374151" : "#000000",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "background-color 0.2s ease",
                width: "100%",
              }}
              onMouseEnter={() => setIsAddTextHovered(true)}
              onMouseLeave={() => setIsAddTextHovered(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleAddPlacedText();
                }
              }}
            >
              <span
                style={{
                  fontSize: "18px",
                  lineHeight: 1,
                  marginTop: "-1px",
                }}
              >
                ＋
              </span>
              Ajouter un texte
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: isMobileView ? "4px" : "4px",
            }}
          >
            <span style={{ fontSize: "13px", fontWeight: 500, color: "#111827" }}>
              {`Textes placés (${texts.length})`}
            </span>
          </div>

          {isMobileView ? (
            texts.length === 0 ? (
              <span style={{ fontSize: "12px", color: "#9ca3af" }}>
                Aucun texte placé
              </span>
            ) : (
              <div style={{ position: "relative", width: "100%" }}>
                {texts.length > 2 && (
                  <>
                    <button
                      type="button"
                      aria-label="Textes précédents"
                      onClick={() => {
                        const el = placedTextsScrollRef.current;
                        if (el) el.scrollBy({ left: -el.clientWidth, behavior: "smooth" });
                      }}
                      style={{
                        position: "absolute",
                        left: 0,
                        top: "50%",
                        transform: "translateY(-50%)",
                        zIndex: 2,
                        width: "28px",
                        height: "64px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background:
                          "linear-gradient(to right, rgba(255,255,255,0.95), transparent)",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 18l-6-6 6-6" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      aria-label="Textes suivants"
                      onClick={() => {
                        const el = placedTextsScrollRef.current;
                        if (el) el.scrollBy({ left: el.clientWidth, behavior: "smooth" });
                      }}
                      style={{
                        position: "absolute",
                        right: 0,
                        top: "50%",
                        transform: "translateY(-50%)",
                        zIndex: 2,
                        width: "28px",
                        height: "64px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background:
                          "linear-gradient(to left, rgba(255,255,255,0.95), transparent)",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                  </>
                )}
                <div
                  ref={placedTextsScrollRef}
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    gap: "8px",
                    overflowX: "auto",
                    padding: "8px 0 4px 0",
                    scrollBehavior: "smooth",
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                  }}
                >
                  {texts.map((t) => {
                    const hex = paletteColors.find((c) => c.id === (t.colorId ?? paletteColors[0]?.id))?.hex ?? "#111827";
                    const font = t.font ?? DEFAULT_TEXT_FONT;
                    return (
                    <div
                      key={t.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setSelectedTextId(t.id);
                        setActiveTextTab("contenu");
                        setTextStep("typography");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedTextId(t.id);
                          setActiveTextTab("contenu");
                          setTextStep("typography");
                        }
                      }}
                      style={{
                        flexShrink: 0,
                        width: "88px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px",
                        backgroundColor: "#ffffff",
                        border: selectedTextId === t.id ? "1px solid #111827" : "1px solid #e0e0e0",
                        borderRadius: "10px",
                        cursor: "pointer",
                        boxSizing: "border-box",
                      }}
                    >
                      <div
                        style={{
                          minHeight: "40px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                          padding: "4px 0",
                          maxWidth: "100%",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            fontFamily: `${font}, sans-serif`,
                            color: hex,
                            textAlign: "center",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical" as const,
                            lineHeight: 1.2,
                          }}
                        >
                          {t.content || "—"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePlacedText(t.id);
                        }}
                        aria-label="Supprimer le texte"
                        style={{
                          flexShrink: 0,
                          width: "28px",
                          height: "28px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: 0,
                          border: "none",
                          borderRadius: "6px",
                          backgroundColor: "transparent",
                          cursor: "pointer",
                          color: "#dc2626",
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
                    </div>
                    );
                  })}
                </div>
              </div>
            )
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {texts.map((t) => {
                const hex = paletteColors.find((c) => c.id === (t.colorId ?? paletteColors[0]?.id))?.hex ?? "#111827";
                const font = t.font ?? DEFAULT_TEXT_FONT;
                return (
                <div
                  key={t.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setSelectedTextId(t.id);
                    setActiveTextTab("contenu");
                    setTextStep("typography");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedTextId(t.id);
                      setActiveTextTab("contenu");
                      setTextStep("typography");
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 12px",
                    backgroundColor: "#ffffff",
                    border: selectedTextId === t.id ? "1px solid #111827" : "1px solid #e0e0e0",
                    borderRadius: "10px",
                    cursor: "pointer",
                    boxSizing: "border-box",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      overflow: "hidden",
                      padding: "4px 0",
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        fontFamily: `${font}, sans-serif`,
                        color: hex,
                        textAlign: "left",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical" as const,
                        lineHeight: 1.2,
                      }}
                    >
                      {t.content || "—"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemovePlacedText(t.id);
                    }}
                    aria-label="Supprimer le texte"
                    style={{
                      flexShrink: 0,
                      width: "32px",
                      height: "32px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                      border: "none",
                      borderRadius: "6px",
                      backgroundColor: "transparent",
                      cursor: "pointer",
                      color: "#dc2626",
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                </div>
                );
              })}
              {!texts.length && (
                <span style={{ fontSize: "12px", color: "#9ca3af" }}>
                  Aucun texte placé
                </span>
              )}
            </div>
          )}
        </div>
      );
    }

    // Fallback générique
    return (
      <div className="p-6 bg-gray-50 border border-gray-200 rounded text-gray-500 text-center">
        Contenu pour le module : <strong>{activeTab}</strong>
      </div>
    );
  };

  const defaultCanvasContent = (
    <div className="w-full h-full bg-slate-800 flex items-center justify-center text-white text-sm">
      🌍 Moteur 3D Simulé
    </div>
  );

  // Mode intégré : uniquement le panel + viewer (pour admin/products/new)
  if (embedMode) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', width: '100%' }}>
        <ConfiguratorViewer
          modules={modules}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          mobile={isMobileView}
          panelContent={renderPanelContent()}
          mobileSheetContentStyle={
            isMobileView &&
            activeTab === "text" &&
            textStep === "typography" &&
            selectedTextId
              ? { flex: "1 1 0%", minHeight: 0, overflow: "auto", padding: 0 }
              : undefined
          }
          canvasContent={canvasContent ?? defaultCanvasContent}
        />
      </div>
    );
  }

  return (
    <div className="configurator-panel h-screen bg-gray-100 text-gray-900 overflow-hidden">
      <div className="flex h-full min-h-0">
        {/* Sidebar de test (hors viewer) - masquée en production */}
        {showTestSidebar && (
          <aside className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col gap-4">
            <div>
              <div className="text-lg font-semibold mb-1">Test ConfiguratorViewer</div>
              <p className="text-xs text-gray-500">
                Cette sidebar simule l&apos;Admin pour tester le viewer sans back-end.
              </p>
            </div>

            <p className="text-xs font-medium text-gray-500 mt-1 mb-0.5">Ajouter un module :</p>
            <div className="flex flex-wrap gap-1">
              <button type="button" onClick={() => addModule("shape", "Forme")} className="px-2 py-1.5 text-xs font-medium rounded bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50" disabled={modules.some((m) => m.id === "shape")}>Forme</button>
              <button type="button" onClick={() => addModule("logo", "Logo")} className="px-2 py-1.5 text-xs font-medium rounded bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50" disabled={modules.some((m) => m.id === "logo")}>Logo</button>
              <button type="button" onClick={() => addModule("numero", "Numéro")} className="px-2 py-1.5 text-xs font-medium rounded bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-50" disabled={modules.some((m) => m.id === "numero")}>Numéro</button>
              <button type="button" onClick={() => addModule("nom", "Nom")} className="px-2 py-1.5 text-xs font-medium rounded bg-cyan-500 text-white hover:bg-cyan-600 disabled:opacity-50" disabled={modules.some((m) => m.id === "nom")}>Nom</button>
            </div>

            <button
              type="button"
              onClick={handleRemoveLast}
              className="w-full px-3 py-2 text-sm font-medium rounded-md bg-red-500 text-white hover:bg-red-600"
            >
              [-] Supprimer dernier
            </button>

            <div className="mt-3 border-t border-gray-200 pt-3 space-y-2">
              <p className="text-xs font-medium text-gray-500">
                Tester plus de classes couleur :
              </p>
              <button
                type="button"
                onClick={handleAddColorClass}
                className="w-full px-3 py-2 text-xs font-medium rounded-md bg-emerald-500 text-white hover:bg-emerald-600"
              >
                [+] Ajouter une classe couleur
              </button>
              <button
                type="button"
                onClick={handleAddPaletteColor}
                className="w-full px-3 py-2 text-xs font-medium rounded-md bg-slate-700 text-white hover:bg-slate-800"
              >
                [+] Ajouter une couleur (palette)
              </button>
              <p className="text-[11px] text-gray-500">
                Cela ajoute une nouvelle pastille dans l&apos;onglet Couleur pour
                simuler un design avec plus de 3 couleurs (quaternaire, etc.).
              </p>
            </div>

            <div className="mt-3 border-t border-gray-200 pt-3 space-y-2">
              <p className="text-xs font-medium text-gray-500">
                Gérer les vues logo :
              </p>
              <button
                type="button"
                onClick={handleAddLogoView}
                className="w-full px-3 py-2 text-xs font-medium rounded-md bg-indigo-500 text-white hover:bg-indigo-600"
              >
                [+] Ajouter une vue
              </button>
              <button
                type="button"
                onClick={handleRemoveLogoView}
                className="w-full px-3 py-2 text-xs font-medium rounded-md bg-rose-500 text-white hover:bg-rose-600"
              >
                [-] Supprimer la dernière vue
              </button>
              <p className="text-[11px] text-gray-500">
                Ajuste uniquement la liste des vues dans le module Logo.
              </p>
            </div>

            <div className="mt-3 border-t border-gray-200 pt-3 space-y-2">
              <p className="text-xs font-medium text-gray-500">
                Simuler l&apos;ajout d&apos;un logo :
              </p>
              <button
                type="button"
                onClick={handleAddPlacedLogo}
                className="w-full px-3 py-2 text-xs font-medium rounded-md bg-amber-500 text-white hover:bg-amber-600"
              >
                [+] Ajouter un logo placé
              </button>
              <button
                type="button"
                onClick={handleAddLogoToLibrary}
                className="w-full px-3 py-2 text-xs font-medium rounded-md bg-purple-500 text-white hover:bg-purple-600"
              >
                [+] Ajouter un logo à la bibliothèque
              </button>
              <p className="text-[11px] text-gray-500">
                Ajoute un logo dans la vue active ({activeLogoView}) ou dans la bibliothèque pour tester l&apos;affichage.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileView((v) => !v)}
              className={`w-full px-3 py-2 text-sm font-medium rounded-md ${
                isMobileView
                  ? "bg-slate-600 text-white hover:bg-slate-700"
                  : "bg-sky-500 text-white hover:bg-sky-600"
              }`}
              title={isMobileView ? "Revenir en vue desktop" : "Passer en vue mobile"}
            >
              {isMobileView ? "🖥️ Vue desktop" : "📱 Vue mobile"}
            </button>
            {isMobileView && (
              <span className="text-xs text-gray-500">
                Affichage type téléphone (375×667)
              </span>
            )}

            <div className="mt-4 border-t border-gray-200 pt-3">
              <p className="text-xs text-gray-500 mb-1">Modules actuels :</p>
              <ul className="text-xs space-y-1 text-gray-700">
                {modules.map((m) => {
                  const isActive = m.id === activeTab;
                  return (
                    <li
                      key={m.id}
                      className={isActive ? "text-emerald-600 font-medium" : ""}
                    >
                      - {m.name} ({m.id})
                    </li>
                  );
                })}
                {!modules.length && <li className="text-gray-400">Aucun module</li>}
              </ul>
            </div>
          </aside>
        )}

        {/* Zone centrale avec le viewer — min-h-0 pour que le flex ne grandisse pas avec le contenu */}
        <main className="flex-1 flex p-6 min-h-0 relative">
          {/* Toggle Vue desktop / mobile quand pas de sidebar de test (production) */}
          {!showTestSidebar && (
            <div
              className="absolute top-4 right-10 z-10 flex gap-1 bg-white border border-gray-200 rounded-lg shadow-sm p-1"
              style={{ fontFamily: "inherit" }}
            >
              <button
                type="button"
                onClick={() => setIsMobileView(false)}
                title="Vue ordinateur"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  !isMobileView ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span className="sr-only">Vue ordinateur</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setIsMobileView(true)}
                title="Vue téléphone"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isMobileView ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span className="sr-only">Vue téléphone</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          )}
          <div
            className={`bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-0 ${
              isMobileView
                ? "w-[414px] h-[800px] ring-4 ring-slate-300 rounded-[2rem] border-8 border-slate-800"
                : "w-full h-full"
            }`}
            style={
              isMobileView
                ? { boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }
                : undefined
            }
          >
            <ConfiguratorViewer
              modules={modules}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              mobile={isMobileView}
              panelContent={renderPanelContent()}
              mobileSheetContentStyle={
                isMobileView &&
                activeTab === "text" &&
                textStep === "typography" &&
                selectedTextId
                  ? { flex: "1 1 0%", minHeight: 0, overflow: "auto", padding: 0 }
                  : undefined
              }
              canvasContent={canvasContent ?? defaultCanvasContent}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function TestViewerPage() {
  return (
    <ProductConfiguratorPanel showTestSidebar={true} />
  );
}
