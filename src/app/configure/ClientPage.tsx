"use client";

import { Suspense, useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { ModelViewer } from "@/components/ModelViewer";
import { useSearchParams } from "next/navigation";

// Constante pour la font du configurator-panel
const CONFIGURATOR_PANEL_FONT = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const CONFIGURATOR_PANEL_PRIMARY_COLOR = '#3b82f6';

// Style global pour forcer les couleurs de texte dans le configurator-panel
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .configurator-panel .customizer-tab-name {
      color: #000000 !important;
      -webkit-text-fill-color: #000000 !important;
      -webkit-text-stroke-color: #000000 !important;
      font-family: ${CONFIGURATOR_PANEL_FONT} !important;
    }
    .configurator-panel .color-class-card-label {
      color: #111827 !important;
      -webkit-text-fill-color: #111827 !important;
      -webkit-text-stroke-color: #111827 !important;
      font-family: ${CONFIGURATOR_PANEL_FONT} !important;
    }
    .configurator-panel .typography-back-button,
    .configurator-panel .typography-back-button * {
      color: #111827 !important;
      -webkit-text-fill-color: #111827 !important;
      -webkit-text-stroke-color: #111827 !important;
      font-family: ${CONFIGURATOR_PANEL_FONT} !important;
    }
    .configurator-panel p,
    .configurator-panel span,
    .configurator-panel div {
      color: #111827 !important;
    }
    .configurator-panel button {
      color: inherit !important;
    }
  `;
  if (!document.getElementById('configurator-panel-style')) {
    style.id = 'configurator-panel-style';
    document.head.appendChild(style);
  }
}

interface CustomizationModule {
  id: string;
  tabName: string;
  icon?: string;
  iconUrl?: string;
  contentType?: 'designs-2d' | 'colors' | 'texts' | 'logos' | 'text' | 'numbers' | 'names';
  selectedItems?: {
    design2DId?: string;
    design2DIds?: string[];
    colorPaletteId?: string;
    logoLibraryId?: string;
    logoLibraryIds?: string[];
    fontGroupIds?: string[];
  };
  colorClassLabels?: Record<string, string>;
  // Options pour les textes
  addTextButtonLabel?: string;
  placedTextsLabel?: string;
  textPlacementMode?: 'zones' | 'free';
  enableTextContent?: boolean;
  enableTextFont?: boolean;
  enableTextColor?: boolean;
  enableTextStroke?: boolean;
  enableTextDeformation?: boolean;
  textColorPaletteId?: string;
  textStrokePaletteId?: string;
  textStrokeMinWidth?: number;
  textMinFontSize?: number;
  textMaxFontSize?: number;
  textStrokeMaxWidth?: number;
  textBaseStrokeWidth?: number;
  textDefaultColor?: string;
  textDefaultStrokeColor?: string;
  textDefaultFontId?: string;
  textEnabledDeformations?: string[];
  // Options pour les logos
  addLogoButtonLabel?: string;
  importLogoButtonLabel?: string;
  placedLogosLabel?: string;
  logoPlacementMode?: 'zones' | 'free';
}

interface ProductData {
  id: string;
  name: string;
  builder_data?: {
    model3DId?: string;
    design2DId?: string;
    customizationModules?: CustomizationModule[];
    settings?: any;
  };
}

export default function ConfigurePage() {
  const searchParams = useSearchParams();
  const productId = searchParams.get('productId');
  const shop = searchParams.get('shop');
  const variantId = searchParams.get('variantId') || '1';

  const [product, setProduct] = useState<ProductData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [customizationModules, setCustomizationModules] = useState<CustomizationModule[]>([]);
  const [activeCustomizerTab, setActiveCustomizerTab] = useState<string | null>(null);
  const [selectedModel3DId, setSelectedModel3DId] = useState<string | null>(null);
  const [selectedDesign2DId, setSelectedDesign2DId] = useState<string | null>(null);
  const [models3D, setModels3D] = useState<any[]>([]);
  const [designs2D, setDesigns2D] = useState<any[]>([]);
  const [colorPalettes, setColorPalettes] = useState<any[]>([]);
  const [designColors, setDesignColors] = useState<Record<string, string>>({});
  const [texts, setTexts] = useState<any[]>([]);
  const [placedLogos, setPlacedLogos] = useState<any[]>([]);
  const [modelMaterialMaps, setModelMaterialMaps] = useState<Record<string, any>>({});
  
  // Ressources supplémentaires
  const [logoLibraries, setLogoLibraries] = useState<any[]>([]);
  const [fontGroups, setFontGroups] = useState<any[]>([]);
  const [zoneGroups, setZoneGroups] = useState<any[]>([]);
  const [sizePatterns, setSizePatterns] = useState<any[]>([]);
  
  // États pour la gestion des interactions
  const [selectedColorClass, setSelectedColorClass] = useState<string | null>(null);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [activeTextTab, setActiveTextTab] = useState<'contenu' | 'police' | 'couleur' | 'contour' | 'deformation'>('contenu');
  const [isPlacingText, setIsPlacingText] = useState<'text' | 'nom' | 'numero' | null>(null);
  const [selectedLogoId, setSelectedLogoId] = useState<string | null>(null);
  const [showLogoLibrary, setShowLogoLibrary] = useState(false);
  const [selectedLogoForVariants, setSelectedLogoForVariants] = useState<any | null>(null);
  const [logoToReplace, setLogoToReplace] = useState<string | null>(null);
  const [activeLogoView, setActiveLogoView] = useState<'front' | 'back' | 'left' | 'right' | string>('front');
  
  // Version mobile
  const [viewportMode, setViewportMode] = useState<'desktop' | 'mobile'>('desktop');
  const [mobileActivePanel, setMobileActivePanel] = useState<string | null>(null);
  
  // États pour les améliorations UI
  const [isAddingText, setIsAddingText] = useState(false);
  const [newTextContent, setNewTextContent] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [logoSearchQuery, setLogoSearchQuery] = useState('');
  const [showVariantSelector, setShowVariantSelector] = useState<string | null>(null);
  const [showZoneSelector, setShowZoneSelector] = useState<{logoId: string, variantId: string, variantFile: string} | null>(null);
  const [activeLogoCategory, setActiveLogoCategory] = useState<'torse' | 'dos' | 'bras-gauche' | 'bras-droit'>('torse');

  // Charger le produit et sa configuration
  useEffect(() => {
    async function loadProduct() {
      if (!productId || !shop) {
        setIsLoading(false);
        return;
      }

      try {
        // Charger le produit depuis l'API
        const res = await fetch(`/api/product-builder?id=${encodeURIComponent(productId)}&shop=${encodeURIComponent(shop)}&for=admin`);
        if (res.ok) {
          const productData = await res.json();
          setProduct(productData);
          
          // Charger les customizationModules
          const modules = productData.builder_data?.customizationModules || [];
          setCustomizationModules(modules);
          
          // Activer le premier module si disponible
          if (modules.length > 0) {
            setActiveCustomizerTab(modules[0].id);
          }
          
          // Charger le modèle 3D et le design
          setSelectedModel3DId(productData.builder_data?.model3DId || null);
          setSelectedDesign2DId(productData.builder_data?.design2DId || null);
        }
      } catch (error) {
        console.error('Error loading product:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadProduct();
  }, [productId, shop]);

  // Charger les modèles 3D, designs, palettes de couleurs
  useEffect(() => {
    async function loadResources() {

      try {
        // Charger les modèles 3D
        const modelsRes = await fetch('/api/models-3d');
        if (modelsRes.ok) {
          const modelsData = await modelsRes.json();
          setModels3D(Array.isArray(modelsData) ? modelsData : []);
        }

        // Charger les designs 2D
        const designsRes = await fetch('/api/designs-2d');
        if (designsRes.ok) {
          const designsData = await designsRes.json();
          setDesigns2D(Array.isArray(designsData) ? designsData : []);
        }

        // Charger les palettes de couleurs
        const colorsRes = await fetch('/api/color-palettes');
        if (colorsRes.ok) {
          const colorsData = await colorsRes.json();
          setColorPalettes(Array.isArray(colorsData) ? colorsData : (colorsData.palettes || []));
        }

        // Charger les bibliothèques de logos
        const logosRes = await fetch('/api/logo-libraries');
        if (logosRes.ok) {
          const logosData = await logosRes.json();
          setLogoLibraries(Array.isArray(logosData) ? logosData : []);
        }

        // Charger les groupes de polices
        const fontsRes = await fetch('/api/font-groups');
        if (fontsRes.ok) {
          const fontsData = await fontsRes.json();
          setFontGroups(Array.isArray(fontsData) ? fontsData : []);
        }

        // Charger les groupes de zones
        const zonesRes = await fetch('/api/zone-groups');
        if (zonesRes.ok) {
          const zonesData = await zonesRes.json();
          setZoneGroups(Array.isArray(zonesData) ? zonesData : []);
        }

        // Charger les patterns de tailles
        const sizesRes = await fetch('/api/size-patterns');
        if (sizesRes.ok) {
          const sizesData = await sizesRes.json();
          setSizePatterns(Array.isArray(sizesData) ? sizesData : []);
        }
      } catch (error) {
        console.error('Error loading resources:', error);
      }
    }

    loadResources();
  }, []);

  // Fonctions de gestion des textes
  const addText = useCallback((content: string, position?: [number, number, number], defaultFontFamily?: string, category: 'text' | 'nom' | 'numero' = 'text', initialFontSize?: number) => {
    const resolvedPosition: [number, number, number] = position || [0.5, 0.5, 0];
    const resolvedFontSize = initialFontSize || 700;

    const newText = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content,
      position: resolvedPosition,
      fontSize: resolvedFontSize,
      color: '#000000',
      editable: true,
      rotation: 0,
      category,
      fontFamily: defaultFontFamily || CONFIGURATOR_PANEL_FONT,
      strokeColor: '#000000',
      strokeWidth: 0,
      strokeWidthUnit: 'px' as const,
      deformation: 'none',
      deformationIntensity: 0,
      fillType: 'solid' as const,
      gradientColors: ['#000000', '#000000'],
      gradientDirection: 'horizontal' as const
    };
    
    setTexts(prev => [...prev, newText]);
    setSelectedTextId(newText.id);
    setIsPlacingText(null);
  }, []);

  const updateText = useCallback((id: string, updates: Partial<typeof texts[0]>) => {
    setTexts(prev => prev.map(text => 
      text.id === id ? { ...text, ...updates } : text
    ));
  }, []);

  const removeText = useCallback((id: string) => {
    setTexts(prev => prev.filter(text => text.id !== id));
    if (selectedTextId === id) {
      setSelectedTextId(null);
    }
  }, [selectedTextId]);

  const selectText = useCallback((id: string | null) => {
    setSelectedTextId(id);
    if (id) {
      setActiveTextTab('contenu');
    }
  }, []);

  const toggleTextLock = useCallback((id: string) => {
    setTexts(prev => prev.map(text => 
      text.id === id ? { ...text, locked: !text.locked } : text
    ));
  }, []);

  // Fonctions de gestion des logos
  const removeLogo = useCallback((id: string) => {
    setPlacedLogos(prev => prev.filter(logo => logo.id !== id));
    if (selectedLogoId === id) {
      setSelectedLogoId(null);
    }
  }, [selectedLogoId]);

  const selectLogo = useCallback((id: string | null) => {
    setSelectedLogoId(id);
  }, []);

  const toggleLogoLock = useCallback((id: string) => {
    setPlacedLogos(prev => prev.map(logo => 
      logo.id === id ? { ...logo, locked: !logo.locked } : logo
    ));
  }, []);

  // Fonctions pour ModelViewer
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [isRotatingText, setIsRotatingText] = useState(false);
  const [isResizingText, setIsResizingText] = useState(false);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);

  const updateTextPosition = useCallback((id: string, position: [number, number, number]) => {
    updateText(id, { position });
  }, [updateText]);

  const updateTextRotation = useCallback((id: string, rotation: number) => {
    updateText(id, { rotation });
  }, [updateText]);

  const updateTextSize = useCallback((id: string, fontSize: number) => {
    updateText(id, { fontSize });
  }, [updateText]);

  const updateLogoPosition = useCallback((id: string, position: [number, number, number]) => {
    setPlacedLogos(prev => prev.map(logo => 
      logo.id === id ? { ...logo, position } : logo
    ));
  }, []);

  const updateLogoScale = useCallback((id: string, scale: number) => {
    setPlacedLogos(prev => prev.map(logo => 
      logo.id === id ? { ...logo, scale } : logo
    ));
  }, []);

  const updateLogoRotation = useCallback((id: string, rotation: number) => {
    setPlacedLogos(prev => prev.map(logo => 
      logo.id === id ? { ...logo, rotation } : logo
    ));
  }, []);

  // Fonction pour obtenir le module texte configuré
  const getTextModuleConfig = useCallback(() => {
    return customizationModules.find(m => 
      (m.contentType === 'text' || m.contentType === 'texts') && 
      m.id === activeCustomizerTab
    );
  }, [customizationModules, activeCustomizerTab]);

  // Fonction pour obtenir les contraintes de texte
  const getTextConstraintValues = useCallback(() => {
    const module = getTextModuleConfig();

    let minFontSizePx = Number(module?.textMinFontSize ?? 10);
    let maxFontSizePx = Number(module?.textMaxFontSize ?? 500);
    if (!Number.isFinite(minFontSizePx) || minFontSizePx <= 0) minFontSizePx = 10;
    if (!Number.isFinite(maxFontSizePx) || maxFontSizePx <= 0) maxFontSizePx = 500;
    if (maxFontSizePx < minFontSizePx) {
      const temp = minFontSizePx;
      minFontSizePx = maxFontSizePx;
      maxFontSizePx = temp;
    }

    let strokeMinWidthPx = Number(module?.textStrokeMinWidth ?? 0);
    if (!Number.isFinite(strokeMinWidthPx) || strokeMinWidthPx < 0) strokeMinWidthPx = 0;

    let strokeMaxWidthPx = Number(module?.textStrokeMaxWidth ?? 50);
    if (!Number.isFinite(strokeMaxWidthPx) || strokeMaxWidthPx <= strokeMinWidthPx) {
      strokeMaxWidthPx = Math.max(strokeMinWidthPx + 1, 50);
    }

    let baseStrokeWidthPx = Number(module?.textBaseStrokeWidth ?? strokeMinWidthPx);
    if (!Number.isFinite(baseStrokeWidthPx)) baseStrokeWidthPx = strokeMinWidthPx;
    baseStrokeWidthPx = Math.min(strokeMaxWidthPx, Math.max(strokeMinWidthPx, baseStrokeWidthPx));

    const defaultColor = module?.textDefaultColor || '#000000';
    const defaultStrokeColor = module?.textDefaultStrokeColor || '#000000';

    return {
      minFontSizePx,
      maxFontSizePx,
      strokeMinWidthPx,
      strokeMaxWidthPx,
      baseStrokeWidthPx,
      defaultColor,
      defaultStrokeColor
    };
  }, [getTextModuleConfig]);

  const textConstraints = getTextConstraintValues();

  // Fonction pour confirmer la suppression de texte
  const confirmDeleteText = useCallback((id: string) => {
    const text = texts.find(t => t.id === id);
    if (text) {
      if (window.confirm(`Supprimer le texte "${text.content || 'Texte vide'}" ?`)) {
        removeText(id);
      }
    }
  }, [texts, removeText]);

  // Fonction pour confirmer la suppression de logo
  const confirmDeleteLogo = useCallback((id: string) => {
    const logo = placedLogos.find(l => l.id === id);
    if (logo) {
      if (window.confirm(`Supprimer ce logo ?`)) {
        removeLogo(id);
      }
    }
  }, [placedLogos, removeLogo]);

  // Calculer les valeurs pour le viewer 3D
  const viewerConfig = useMemo(() => {
    if (!selectedModel3DId) return null;

    const selectedModel = models3D.find(m => m.id === selectedModel3DId);
    const modelUrl = selectedModel?.glb_url || selectedModel?.glbUrl || '';
    
    // Chercher le design sélectionné
    let designIdToUse: string | null = null;
    customizationModules.forEach(module => {
      if (module.contentType === 'designs-2d' && module.selectedItems?.design2DId) {
        designIdToUse = module.selectedItems.design2DId;
      }
    });
    if (!designIdToUse) {
      designIdToUse = selectedDesign2DId;
    }
    
    const selectedDesign = designs2D.find(d => d.id === designIdToUse);
    const designUrl = selectedDesign?.svg_url || selectedDesign?.svgUrl || null;
    
    // Calculer les couleurs
    const designColorMappings = selectedDesign?.color_mappings || null;
    const allColors = colorPalettes.flatMap(p => p.colors || []);
    const colorsForViewer: Record<string, string> = {};
    
    if (designColorMappings) {
      Object.entries(designColorMappings).forEach(([colorClass, mappedColorId]) => {
        const overrideColor = designColors[colorClass];
        const colorIdToUse = overrideColor || mappedColorId;
        const color = allColors.find(c => c.id === colorIdToUse);
        if (color?.hex) {
          colorsForViewer[colorClass] = color.hex;
        }
      });
    }
    
    // Material maps
    const materialMapsForModel: Record<string, any> = {};
    if (selectedModel?.parts) {
      selectedModel.parts.forEach((part: any) => {
        if (part.material_map_id && modelMaterialMaps[part.material_map_id]) {
          const materialMap = modelMaterialMaps[part.material_map_id];
          const materialMapFiles = materialMap.material_map_files || [];
          materialMapsForModel[part.name] = {
            diffuse: materialMapFiles.find((f: any) => f.type === 'diffuse')?.file_url,
            normal: materialMapFiles.find((f: any) => f.type === 'normal')?.file_url,
            roughness: materialMapFiles.find((f: any) => f.type === 'roughness')?.file_url,
          };
        }
      });
    }
    
    return {
      modelUrl,
      designUrl,
      colors: colorsForViewer,
      materialMaps: materialMapsForModel,
      selectedDesign: selectedDesign ? { id: selectedDesign.id, svgUrl: designUrl } : undefined,
    };
  }, [selectedModel3DId, models3D, customizationModules, selectedDesign2DId, designs2D, colorPalettes, designColors, modelMaterialMaps]);

  if (isLoading) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        fontFamily: CONFIGURATOR_PANEL_FONT
      }}>
        <div style={{ fontSize: '16px', color: '#111827' }}>Chargement...</div>
      </div>
    );
  }

  if (!product || !selectedModel3DId) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        fontFamily: CONFIGURATOR_PANEL_FONT
      }}>
        <div style={{ fontSize: '16px', color: '#111827' }}>Produit non trouvé ou non configuré</div>
      </div>
    );
  }

  const activeModule = customizationModules.find(m => m.id === activeCustomizerTab);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      overflow: 'hidden',
      backgroundColor: '#f8f8f8'
    }}>
      {/* Sidebar - Customizer Tabs */}
      {customizationModules.length > 0 && (
        <div style={{
          width: '80px',
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e0e0e0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '8px',
          gap: '8px'
        }}>
          {customizationModules.map((module) => (
            <button
              key={module.id}
              onClick={() => setActiveCustomizerTab(module.id)}
              style={{
                width: '64px',
                height: '64px',
                padding: '0',
                backgroundColor: activeCustomizerTab === module.id ? CONFIGURATOR_PANEL_PRIMARY_COLOR : '#ffffff',
                border: 'none',
                borderRadius: activeCustomizerTab === module.id ? '12px' : '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                gap: '4px'
              }}
              title={module.tabName}
            >
              {module.iconUrl ? (
                <img
                  src={module.iconUrl}
                  alt={module.tabName}
                  style={{
                    width: '14px',
                    height: '14px',
                    objectFit: 'contain',
                    filter: activeCustomizerTab === module.id ? 'invert(1)' : 'invert(0)'
                  }}
                />
              ) : (
                <span style={{
                  fontSize: '14px',
                  color: activeCustomizerTab === module.id ? '#ffffff' : '#000000'
                }}>
                  {module.icon || '📦'}
                </span>
              )}
              <span style={{
                fontSize: '10px',
                fontWeight: '400',
                textAlign: 'center',
                color: activeCustomizerTab === module.id ? '#ffffff' : '#000000'
              }}>
                {module.tabName}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Customizer Tab Panel */}
      {activeModule && (
        <div style={{
          width: '420px',
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e0e0e0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '16px',
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            {activeModule.iconUrl ? (
              <img
                src={activeModule.iconUrl}
                alt={activeModule.tabName}
                style={{ width: '28px', height: '28px' }}
              />
            ) : (
              <span style={{ fontSize: '20px' }}>{activeModule.icon || '📦'}</span>
            )}
            <span style={{
              fontSize: '14px',
              fontWeight: '500',
              fontFamily: CONFIGURATOR_PANEL_FONT
            }}>
              {activeModule.tabName}
            </span>
          </div>
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px'
          }}>
            {/* Contenu selon le type de module */}
            {activeModule.contentType === 'designs-2d' ? (() => {
              const allowedIds = activeModule.selectedItems?.design2DIds;
              const visibleDesigns = Array.isArray(allowedIds) && allowedIds.length > 0
                ? designs2D.filter(d => allowedIds.includes(d.id))
                : designs2D;
              const selectedDesignId = activeModule.selectedItems?.design2DId;
              
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {visibleDesigns.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 0', color: '#6b7280' }}>
                      <p style={{ fontSize: '14px', fontFamily: CONFIGURATOR_PANEL_FONT, marginBottom: '4px' }}>
                        Aucun design disponible
                      </p>
                      <p style={{ fontSize: '12px', fontFamily: CONFIGURATOR_PANEL_FONT }}>
                        Uploadez des designs dans l'admin
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {/* Design "Aucun" */}
                      <button
                        onClick={() => {
                          const updated = {
                            ...activeModule,
                            selectedItems: {
                              ...activeModule.selectedItems,
                              design2DId: null
                            }
                          };
                          setCustomizationModules(customizationModules.map(m =>
                            m.id === activeModule.id ? updated : m
                          ));
                        }}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '8px',
                          border: !selectedDesignId ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                          backgroundColor: !selectedDesignId ? '#eff6ff' : '#ffffff',
                          color: !selectedDesignId ? '#1e40af' : '#111827',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          fontFamily: CONFIGURATOR_PANEL_FONT
                        }}
                      >
                        <div style={{
                          width: '48px',
                          height: '48px',
                          backgroundColor: '#f3f4f6',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>Aucun</span>
                        </div>
                        <span style={{ fontWeight: '500', fontSize: '14px' }}>Aucun design</span>
                      </button>

                      {/* Grille des designs */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '12px'
                      }}>
                        {visibleDesigns.map((design) => {
                          const isSelected = design.id === selectedDesignId;
                          return (
                            <button
                              key={design.id}
                              onClick={() => {
                                const updated = {
                                  ...activeModule,
                                  selectedItems: {
                                    ...activeModule.selectedItems,
                                    design2DId: design.id
                                  }
                                };
                                setCustomizationModules(customizationModules.map(m =>
                                  m.id === activeModule.id ? updated : m
                                ));
                              }}
                              style={{
                                padding: '12px',
                                backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                                borderRadius: '8px',
                                border: isSelected ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '8px'
                              }}
                            >
                              <div style={{
                                width: '100%',
                                height: '64px',
                                backgroundColor: '#ffffff',
                                borderRadius: '4px',
                                border: '1px solid #e5e7eb',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden'
                              }}>
                                {(design.preview_url && design.preview_url.trim() !== '') ? (
                                  <img
                                    src={design.preview_url}
                                    alt={design.name}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'contain'
                                    }}
                                    onError={(e) => {
                                      const svgUrl = design.svg_url || design.svgUrl;
                                      if (svgUrl) {
                                        e.currentTarget.src = svgUrl;
                                      }
                                    }}
                                  />
                                ) : (
                                  <img
                                    src={design.svg_url || design.svgUrl}
                                    alt={design.name}
                                    style={{
                                      maxWidth: '100%',
                                      maxHeight: '100%',
                                      objectFit: 'contain'
                                    }}
                                  />
                                )}
                              </div>
                              <p style={{
                                color: '#111827',
                                fontSize: '12px',
                                fontFamily: CONFIGURATOR_PANEL_FONT,
                                fontWeight: isSelected ? '600' : '400',
                                textAlign: 'center',
                                margin: 0
                              }}>
                                {design.name}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Message de confirmation */}
                  {selectedDesignId && (
                    <div style={{
                      marginTop: '16px',
                      padding: '12px',
                      backgroundColor: '#f0fdf4',
                      borderRadius: '8px',
                      border: '1px solid #86efac'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          backgroundColor: '#22c55e',
                          borderRadius: '50%'
                        }} />
                        <span style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#166534',
                          fontFamily: CONFIGURATOR_PANEL_FONT
                        }}>
                          Design sélectionné
                        </span>
                      </div>
                      <p style={{
                        fontSize: '12px',
                        color: '#15803d',
                        marginTop: '4px',
                        fontFamily: CONFIGURATOR_PANEL_FONT
                      }}>
                        Le design est appliqué au modèle 3D
                      </p>
                    </div>
                  )}
                </div>
              );
            })() : activeModule.contentType === 'colors' ? (() => {
              // Détecter automatiquement les couleurs disponibles à modifier
              const ordinalColors = ['primary', 'secondary', 'tertiary', 'quaternary', 'quinary', 'senary', 'septenary', 'octonary', 'nonary', 'denary'];
              
              // Trouver le design 2D sélectionné pour détecter les couleurs
              let availableColorClasses: string[] = [];
              let designIdToUse: string | null = null;
              customizationModules.forEach(m => {
                if (m.contentType === 'designs-2d' && m.selectedItems?.design2DId) {
                  designIdToUse = m.selectedItems.design2DId;
                }
              });
              if (!designIdToUse) {
                designIdToUse = selectedDesign2DId;
              }
              
              const selectedDesign = designs2D.find(d => d.id === designIdToUse);
              
              // PRIORITÉ à design.colors (source de vérité depuis SVG Color Mapper)
              if (selectedDesign?.colors && Array.isArray(selectedDesign.colors) && selectedDesign.colors.length > 0) {
                availableColorClasses = selectedDesign.colors.map((c: any) => c.name).filter(Boolean);
              } else if (selectedDesign?.color_mappings) {
                availableColorClasses = Object.keys(selectedDesign.color_mappings);
              } else {
                availableColorClasses = ['primary', 'secondary', 'tertiary'];
              }
              
              availableColorClasses = availableColorClasses.filter(c => ordinalColors.includes(c.toLowerCase()));
              if (availableColorClasses.length === 0) {
                availableColorClasses = ['primary', 'secondary', 'tertiary'];
              }
              
              // Si on a sélectionné une classe de couleur, afficher la grille de couleurs
              if (selectedColorClass && activeModule.selectedItems?.colorPaletteId) {
                const palette = colorPalettes.find(p => p.id === activeModule.selectedItems?.colorPaletteId);
                if (!palette) return <p style={{ color: '#111827', fontSize: '14px' }}>Palette non trouvée</p>;
                
                const allColors: Array<{ id: string; name: string; hex: string }> = [];
                if (palette.colors) {
                  palette.colors.forEach((color: any, index: number) => {
                    const colorId = color.id || `${palette.id}-${index}-${color.hex}`;
                    allColors.push({
                      id: colorId,
                      name: color.name || '',
                      hex: color.hex || '#000000'
                    });
                  });
                }
                
                const selectedColorId = selectedDesign?.color_mappings?.[selectedColorClass] || designColors[selectedColorClass];
                const currentColorHex = selectedColorId ? allColors.find(c => c.id === selectedColorId)?.hex : null;
                const currentColorName = selectedColorId ? allColors.find(c => c.id === selectedColorId)?.name : '';
                
                return (
                  <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px',
                      borderBottom: '1px solid #e5e7eb'
                    }}>
                      <button
                        onClick={() => setSelectedColorClass(null)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#111827',
                          fontFamily: CONFIGURATOR_PANEL_FONT
                        }}
                      >
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Retour
                      </button>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#111827',
                          fontFamily: CONFIGURATOR_PANEL_FONT
                        }}>
                          {currentColorName || activeModule.colorClassLabels?.[selectedColorClass] || selectedColorClass.charAt(0).toUpperCase() + selectedColorClass.slice(1)}
                        </span>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          border: '2px solid #d1d5db',
                          backgroundColor: currentColorHex || 'transparent'
                        }} />
                      </div>
                    </div>
                    
                    <div style={{
                      flex: 1,
                      padding: '16px',
                      overflowY: 'auto'
                    }}>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(6, 1fr)', 
                        gap: '12px' 
                      }}>
                        {allColors.map((color) => {
                          const isSelected = color.id === selectedColorId;
                          return (
                            <button
                              key={color.id}
                              onClick={() => {
                                const newDesignColors = { ...designColors };
                                newDesignColors[selectedColorClass] = color.id;
                                setDesignColors(newDesignColors);
                              }}
                              style={{
                                position: 'relative',
                                aspectRatio: '1',
                                borderRadius: '50%',
                                border: '2px solid #e5e7eb',
                                backgroundColor: color.hex,
                                cursor: 'pointer',
                                padding: 0,
                                overflow: 'hidden'
                              }}
                            >
                              {isSelected && (
                                <div style={{
                                  position: 'absolute',
                                  inset: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  <div style={{
                                    width: '24px',
                                    height: '24px',
                                    backgroundColor: '#ffffff',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                                  }}>
                                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#000000' }}>
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
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
              
              // Afficher les cartes de sélection de classe de couleur
              return (
                <div>
                  {!activeModule.selectedItems?.colorPaletteId ? (
                    <p style={{ color: '#111827', fontSize: '14px', fontFamily: CONFIGURATOR_PANEL_FONT }}>
                      Veuillez sélectionner une palette dans les paramètres du module.
                    </p>
                  ) : (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '12px'
                    }}>
                      {availableColorClasses.map((colorClass) => {
                        const currentColorId = selectedDesign?.color_mappings?.[colorClass];
                        let currentColorHex = '#cccccc';
                        
                        if (currentColorId && activeModule.selectedItems?.colorPaletteId) {
                          const palette = colorPalettes.find(p => p.id === activeModule.selectedItems?.colorPaletteId);
                          if (palette?.colors) {
                            palette.colors.forEach((color: any, index: number) => {
                              const colorId = color.id || `${palette.id}-${index}-${color.hex}`;
                              if (colorId === currentColorId) {
                                currentColorHex = color.hex || '#cccccc';
                              }
                            });
                          }
                        }
                        
                        return (
                          <div
                            key={colorClass}
                            onClick={() => setSelectedColorClass(colorClass)}
                            style={{
                              padding: '16px',
                              backgroundColor: '#ffffff',
                              borderRadius: '8px',
                              border: '1px solid #e5e7eb',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                          >
                            <div style={{
                              width: '32px',
                              height: '32px',
                              backgroundColor: currentColorHex !== '#cccccc' ? currentColorHex : 'transparent',
                              borderRadius: '50%',
                              border: currentColorHex !== '#cccccc' ? '2px solid #d1d5db' : '2px solid #6b7280'
                            }} />
                            <span style={{
                              fontSize: '14px',
                              fontWeight: '500',
                              color: '#111827',
                              fontFamily: CONFIGURATOR_PANEL_FONT,
                              textAlign: 'center'
                            }}>
                              {activeModule.colorClassLabels?.[colorClass] || colorClass.charAt(0).toUpperCase() + colorClass.slice(1)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })() : activeModule.contentType === 'texts' || activeModule.contentType === 'text' ? (
              <div>
  {!selectedTextId && (
    <>
      <button
        className="btn-primary"
        onClick={() => {
          if (activeModule.textPlacementMode === 'zones') {
            setIsAddingText(true);
            // Sélectionner automatiquement la première zone si disponible
            const category = activeModule.zoneGroupIds && activeModule.zoneGroupIds.length > 0 ? 'text' : 'text';
            const filteredZones = textZones.filter(zone => 
              zone.categories && zone.categories.includes(category)
            );
            if (filteredZones.length > 0 && !selectedZone) {
              setSelectedZone(filteredZones[0].id);
            }
          } else {
            if (isPlacingText) {
              setIsPlacingText(null);
            } else {
              setIsPlacingText('nom');
            }
          }
        }}
        style={{
          width: '100%',
          padding: '10px 20px',
          backgroundColor: isPlacingText ? '#8eff36' : '#3b82f6',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontFamily: CONFIGURATOR_PANEL_FONT,
          color: '#ffffff',
          cursor: 'pointer',
          fontWeight: '500',
          transition: 'all 0.2s ease',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          textTransform: 'none',
          letterSpacing: 'normal'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = isPlacingText ? '#7ae62e' : '#2563eb';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = isPlacingText ? '#8eff36' : '#3b82f6';
        }}
      >
        <span style={{ color: '#ffffff' }}>
          {isPlacingText ? 'Cliquez sur le modèle pour placer le texte (ou cliquez ici pour annuler)' : (activeModule.addTextButtonLabel || 'Ajouter un texte')}
        </span>
      </button>

      {/* Modal d'ajout de texte avec sélection de zones */}
      {isAddingText && activeModule.textPlacementMode === 'zones' && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          backgroundColor: 'rgba(0, 0, 0, 0.25)'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            width: '100%',
            maxWidth: '512px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '16px',
              fontFamily: CONFIGURATOR_PANEL_FONT
            }}>
              {activeModule.addTextButtonLabel || 'Ajouter un texte'}
            </h3>
            
            {/* Sélecteur de zone avec vignettes */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#111827',
                marginBottom: '12px',
                fontFamily: CONFIGURATOR_PANEL_FONT
              }}>
                Choisissez une position standard
              </label>
              
              {isLoadingZones ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#6b7280' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    border: '2px solid #3b82f6',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 8px'
                  }} />
                  Chargement des zones...
                </div>
              ) : (() => {
                const category = activeModule.zoneGroupIds && activeModule.zoneGroupIds.length > 0 ? 'text' : 'text';
                const filteredZones = textZones.filter(zone => 
                  zone.categories && zone.categories.includes(category)
                );
                
                return filteredZones.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: '#6b7280' }}>
                    <p style={{ fontSize: '14px', fontFamily: CONFIGURATOR_PANEL_FONT, marginBottom: '4px' }}>
                      Aucune zone définie pour cette catégorie
                    </p>
                    <p style={{ fontSize: '12px', fontFamily: CONFIGURATOR_PANEL_FONT }}>
                      Configurez des zones via l'interface admin
                    </p>
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px'
                  }}>
                    {filteredZones.map(zone => (
                      <button
                        key={zone.id}
                        onClick={() => setSelectedZone(zone.id)}
                        style={{
                          position: 'relative',
                          padding: '12px',
                          border: selectedZone === zone.id ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                          borderRadius: '8px',
                          backgroundColor: selectedZone === zone.id ? '#eff6ff' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}
                      >
                        {/* Image de la vignette */}
                        {zone.image ? (
                          <div style={{
                            width: '100%',
                            height: '128px',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            backgroundColor: '#f9fafb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Image
                              src={zone.image}
                              alt={zone.name}
                              width={160}
                              height={128}
                              style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain'
                              }}
                            />
                          </div>
                        ) : (
                          <div style={{
                            width: '100%',
                            height: '128px',
                            borderRadius: '6px',
                            backgroundColor: '#f3f4f6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            color: '#6b7280'
                          }}>
                            <div style={{ fontSize: '24px', marginBottom: '4px' }}>👕</div>
                            <div style={{ fontSize: '12px' }}>Pas d'image</div>
                          </div>
                        )}
                        
                        {/* Nom de la zone */}
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#111827',
                          textAlign: 'center',
                          fontFamily: CONFIGURATOR_PANEL_FONT
                        }}>
                          {zone.name}
                        </div>
                        
                        {/* Indicateur de sélection */}
                        {selectedZone === zone.id && (
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            width: '20px',
                            height: '20px',
                            backgroundColor: '#3b82f6',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <svg width="12" height="12" fill="none" stroke="white" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Champ de texte */}
            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="newText" style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#111827',
                marginBottom: '4px',
                fontFamily: CONFIGURATOR_PANEL_FONT
              }}>
                Contenu du texte
              </label>
              <input
                type="text"
                id="newText"
                value={newTextContent}
                onChange={(e) => setNewTextContent(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newTextContent.trim() && selectedZone) {
                    const zone = textZones.find(z => z.id === selectedZone);
                    const defaultFont = fontGroups.length > 0 && fontGroups[0]?.fonts?.[0] 
                      ? fontGroups[0].fonts[0].id 
                      : 'Arial';
                    addText(newTextContent.trim(), zone?.position, defaultFont, 'text');
                    setNewTextContent('');
                    setIsAddingText(false);
                    setSelectedZone('');
                  }
                }}
                placeholder="Saisir l'inscription ici..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: CONFIGURATOR_PANEL_FONT,
                  color: '#111827',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                autoFocus
              />
            </div>
            
            {/* Boutons d'action */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setIsAddingText(false);
                  setNewTextContent('');
                  setSelectedZone('');
                }}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  fontFamily: CONFIGURATOR_PANEL_FONT,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (newTextContent.trim() && selectedZone) {
                    const zone = textZones.find(z => z.id === selectedZone);
                    const defaultFont = fontGroups.length > 0 && fontGroups[0]?.fonts?.[0] 
                      ? fontGroups[0].fonts[0].id 
                      : 'Arial';
                    addText(newTextContent.trim(), zone?.position, defaultFont, 'text');
                    setNewTextContent('');
                    setIsAddingText(false);
                    setSelectedZone('');
                  }
                }}
                disabled={!newTextContent.trim() || !selectedZone}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  backgroundColor: (!newTextContent.trim() || !selectedZone) ? '#d1d5db' : '#3b82f6',
                  color: '#ffffff',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  fontFamily: CONFIGURATOR_PANEL_FONT,
                  cursor: (!newTextContent.trim() || !selectedZone) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (newTextContent.trim() && selectedZone) {
                    e.currentTarget.style.backgroundColor = '#2563eb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (newTextContent.trim() && selectedZone) {
                    e.currentTarget.style.backgroundColor = '#3b82f6';
                  }
                }}
              >
                {activeModule.addTextButtonLabel || 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )}

  {!selectedTextId && texts.length > 0 && (
    <div style={{
      marginTop: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <div style={{
        fontSize: '14px',
        color: '#000000',
        fontFamily: CONFIGURATOR_PANEL_FONT,
        marginBottom: '4px',
        fontWeight: '600'
      }}>
        {activeModule.placedTextsLabel || 'Textes ajoutés'} ({texts.length})
      </div>
      {texts.map((text) => (
        <div
          key={text.id}
          style={{
            padding: '16px',
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            transition: 'all 0.2s',
            cursor: 'default'
          }}
        >
          <div 
            onClick={() => selectText(text.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <div style={{
              fontSize: text.fontSize ? `${text.fontSize / 10}px` : '15px',
              color: text.color || '#111827',
              fontFamily: text.fontFamily || CONFIGURATOR_PANEL_FONT,
              fontWeight: '500',
              lineHeight: '1.4',
              ...(text.strokeColor && text.strokeWidth ? {
                WebkitTextStroke: `${text.strokeWidth}px ${text.strokeColor}`,
                textStroke: `${text.strokeWidth}px ${text.strokeColor}`
              } : {})
            }}>
              {text.content || '(Texte vide)'}
              {text.locked && ' 🔒'}
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              confirmDeleteText(text.id);
            }}
            style={{
              padding: '8px',
              backgroundColor: '#ef4444',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              flexShrink: 0,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#dc2626';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ef4444';
            }}
            title="Supprimer"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )}

  {selectedTextId && (() => {
    const selectedText = texts.find(t => t.id === selectedTextId);
    if (!selectedText) return null;
    
    const tabs = [
      { id: 'contenu' as const, label: 'Contenu', enabled: activeModule.enableTextContent !== false },
      { id: 'police' as const, label: 'Police', enabled: activeModule.enableTextFont !== false },
      { id: 'couleur' as const, label: 'Couleur', enabled: activeModule.enableTextColor !== false },
      { id: 'contour' as const, label: 'Contour', enabled: activeModule.enableTextStroke !== false },
      { id: 'deformation' as const, label: 'Déformation', enabled: activeModule.enableTextDeformation !== false }
    ].filter(tab => tab.enabled);
    
    return (
      <div style={{
        marginTop: '20px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid #e5e5e5'
      }}>
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e5e5e5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <button
            onClick={() => selectText(null)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '16px',
              color: '#111827',
              cursor: 'pointer',
              padding: '4px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontFamily: CONFIGURATOR_PANEL_FONT
            }}
          >
            <span style={{ color: '#111827' }}>←</span>
            <span style={{ color: '#111827' }}>Retour</span>
          </button>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#111827',
            fontFamily: CONFIGURATOR_PANEL_FONT
          }}>
            Typographie
          </div>
          <div style={{ width: '80px' }} />
        </div>

        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e5e5e5',
          backgroundColor: '#ffffff',
          overflow: 'hidden'
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTextTab(tab.id)}
              style={{
                flex: '1 1 0',
                minWidth: '0',
                padding: '10px 8px',
                background: 'none',
                border: 'none',
                borderBottom: activeTextTab === tab.id ? '2px solid #111827' : '2px solid transparent',
                color: activeTextTab === tab.id ? '#111827' : '#6b7280',
                fontSize: '12px',
                fontWeight: activeTextTab === tab.id ? '600' : '400',
                fontFamily: CONFIGURATOR_PANEL_FONT,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '20px' }}>
          {activeTextTab === 'contenu' && (
            <div>
              <div style={{
                fontSize: '13px',
                fontWeight: '500',
                color: '#111827',
                marginBottom: '12px',
                fontFamily: CONFIGURATOR_PANEL_FONT
              }}>
                Contenu du texte
              </div>
              <input
                type="text"
                value={selectedText.content}
                onChange={(e) => updateText(selectedTextId, { content: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  color: '#111827',
                  fontSize: '14px',
                  fontFamily: CONFIGURATOR_PANEL_FONT,
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#8eff36'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
          )}

          {activeTextTab === 'police' && (() => {
            const allowedGroupIds = activeModule?.selectedItems?.fontGroupIds;
            const visibleFonts = (() => {
              const allFonts: Array<{ id: string; name: string; display_name?: string; file_url?: string; file_type?: string; groupId: string }> = [];
              fontGroups.forEach(group => {
                if (group.fonts) {
                  group.fonts.forEach((font: any) => {
                    allFonts.push({
                      id: font.id,
                      name: font.name || font.id,
                      display_name: font.display_name,
                      file_url: font.file_url,
                      file_type: font.file_type || font.format,
                      groupId: group.id
                    });
                  });
                }
              });
              
              if (allowedGroupIds && allowedGroupIds.length > 0) {
                return allFonts.filter(font => allowedGroupIds.includes(font.groupId));
              }
              return allFonts;
            })();
            
            const previewText = selectedText.content && selectedText.content.trim() !== '' 
              ? selectedText.content 
              : 'ZG';
            
            return (
              <div>
                <div style={{
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#111827',
                  marginBottom: '12px',
                  fontFamily: CONFIGURATOR_PANEL_FONT
                }}>
                  Police
                </div>
                {visibleFonts.length === 0 ? (
                  <p style={{ 
                    color: '#6b7280', 
                    fontSize: '12px', 
                    fontFamily: CONFIGURATOR_PANEL_FONT,
                    padding: '12px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px'
                  }}>
                    Aucune police disponible. Cochez des groupes de polices dans les settings du module.
                  </p>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '12px',
                    padding: '4px'
                  }}>
                    {visibleFonts.map((font) => {
                      const isSelected = selectedText.fontFamily === font.id;
                      const fontFamilyValue = font.display_name || font.name;
                      const fontFamilyQuoted = fontFamilyValue ? `"${fontFamilyValue}"` : '';
                      
                      return (
                        <div
                          key={font.id}
                          onClick={() => updateText(selectedTextId, { fontFamily: font.id })}
                          style={{
                            padding: '12px',
                            backgroundColor: isSelected ? '#f0f0f0' : '#ffffff',
                            borderRadius: '8px',
                            border: isSelected ? '2px solid #111827' : '1px solid #e5e7eb',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '8px',
                            minHeight: '100px',
                            position: 'relative'
                          }}
                        >
                          <div
                            style={{
                              width: '100%',
                              padding: '8px',
                              backgroundColor: '#f5f5f5',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              minHeight: '60px',
                              fontFamily: fontFamilyValue ? `${fontFamilyQuoted}, sans-serif` : 'sans-serif',
                              fontSize: '18px',
                              fontWeight: 'bold',
                              color: '#111827'
                            }}
                            ref={(el) => {
                              if (el && fontFamilyValue) {
                                el.style.fontFamily = `${fontFamilyQuoted}, sans-serif`;
                                el.style.setProperty('font-family', `${fontFamilyQuoted}, sans-serif`, 'important');
                              }
                            }}
                          >
                            {previewText}
                          </div>
                          <span style={{
                            fontSize: '11px',
                            color: '#111827',
                            fontFamily: CONFIGURATOR_PANEL_FONT,
                            textAlign: 'center',
                            fontWeight: '500'
                          }}>
                            {font.display_name || font.name}
                          </span>
                          {isSelected && (
                            <div style={{
                              position: 'absolute',
                              bottom: '8px',
                              right: '8px',
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              backgroundColor: '#111827',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                <div style={{ marginTop: '16px' }}>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#111827',
                    marginBottom: '8px',
                    fontFamily: CONFIGURATOR_PANEL_FONT,
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <span>Taille du texte</span>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      {Math.round(textConstraints.minFontSizePx)} px – {Math.round(textConstraints.maxFontSizePx)} px
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="range"
                      min={textConstraints.minFontSizePx}
                      max={textConstraints.maxFontSizePx}
                      step={1}
                      value={selectedText.fontSize}
                      onChange={(e) => updateText(selectedTextId, { fontSize: parseFloat(e.target.value) })}
                      style={{
                        flex: 1,
                        accentColor: '#111827'
                      }}
                    />
                    <span style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#111827',
                      minWidth: '48px',
                      textAlign: 'right',
                      fontFamily: CONFIGURATOR_PANEL_FONT
                    }}>
                      {Math.round(selectedText.fontSize)} px
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {activeTextTab === 'couleur' && (
            <div>
              <div style={{
                fontSize: '13px',
                fontWeight: '500',
                color: '#111827',
                marginBottom: '12px',
                fontFamily: CONFIGURATOR_PANEL_FONT
              }}>
                Couleur
              </div>
              {activeModule.textColorPaletteId ? (() => {
                const palette = colorPalettes.find(p => p.id === activeModule.textColorPaletteId);
                if (!palette) {
                  return (
                    <p style={{ color: '#6b7280', fontSize: '12px', fontFamily: CONFIGURATOR_PANEL_FONT }}>
                      Palette introuvable.
                    </p>
                  );
                }
                const paletteColors = palette.colors || [];
                if (paletteColors.length === 0) {
                  return (
                    <p style={{ color: '#6b7280', fontSize: '12px', fontFamily: CONFIGURATOR_PANEL_FONT }}>
                      La palette sélectionnée ne contient aucune couleur.
                    </p>
                  );
                }
                return (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                    gap: '12px'
                  }}>
                    {paletteColors.map((color: any, index: number) => {
                      const hex = (color?.hex || '#000000').toLowerCase();
                      const isSelected = (selectedText.color || '').toLowerCase() === hex;
                      return (
                        <button
                          key={color?.id || `${palette.id}-${index}`}
                          onClick={() => updateText(selectedTextId, { color: color?.hex || '#000000' })}
                          style={{
                            border: isSelected ? '2px solid #111827' : '1px solid #e5e5e5',
                            borderRadius: '10px',
                            padding: '10px',
                            backgroundColor: '#ffffff',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          <span style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            border: '1px solid #d1d5db',
                            backgroundColor: color?.hex || '#000000',
                            display: 'inline-block'
                          }} />
                          <span style={{
                            fontSize: '11px',
                            color: '#111827',
                            fontFamily: CONFIGURATOR_PANEL_FONT,
                            textAlign: 'center'
                          }}>
                            {color?.name || (color?.hex || '#000000').toUpperCase()}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })() : (
                <p style={{ color: '#6b7280', fontSize: '12px', fontFamily: CONFIGURATOR_PANEL_FONT }}>
                  Sélectionnez une palette de couleurs pour le texte dans les réglages du module.
                </p>
              )}
            </div>
          )}

          {activeTextTab === 'contour' && (
            <div>
              <div style={{
                fontSize: '13px',
                fontWeight: '500',
                color: '#111827',
                marginBottom: '12px',
                fontFamily: CONFIGURATOR_PANEL_FONT
              }}>
                Contour
              </div>
              {activeModule.textStrokePaletteId ? (() => {
                const palette = colorPalettes.find(p => p.id === activeModule.textStrokePaletteId);
                if (!palette) {
                  return (
                    <p style={{ color: '#6b7280', fontSize: '12px', fontFamily: CONFIGURATOR_PANEL_FONT }}>
                      Palette introuvable.
                    </p>
                  );
                }
                const paletteColors = palette.colors || [];
                return (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                    gap: '12px',
                    marginBottom: '20px'
                  }}>
                    {paletteColors.map((color: any, index: number) => {
                      const hex = (color?.hex || '#000000').toLowerCase();
                      const isSelected = (selectedText.strokeColor || '').toLowerCase() === hex;
                      return (
                        <button
                          key={color?.id || `${palette.id}-${index}`}
                          onClick={() => updateText(selectedTextId, { strokeColor: color?.hex || '#000000' })}
                          style={{
                            border: isSelected ? '2px solid #111827' : '1px solid #e5e5e5',
                            borderRadius: '10px',
                            padding: '10px',
                            backgroundColor: '#ffffff',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          <span style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            border: '1px solid #d1d5db',
                            backgroundColor: color?.hex || '#000000',
                            display: 'inline-block'
                          }} />
                          <span style={{
                            fontSize: '11px',
                            color: '#111827',
                            fontFamily: CONFIGURATOR_PANEL_FONT,
                            textAlign: 'center'
                          }}>
                            {color?.name || (color?.hex || '#000000').toUpperCase()}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })() : (
                <p style={{ color: '#6b7280', fontSize: '12px', fontFamily: CONFIGURATOR_PANEL_FONT, marginBottom: '20px' }}>
                  Sélectionnez une palette de contours dans les réglages du module.
                </p>
              )}
              <div>
                {(() => {
                  const sliderMin = textConstraints.strokeMinWidthPx;
                  const sliderMax = textConstraints.strokeMaxWidthPx;
                  const rawValue = selectedText.strokeWidth ?? textConstraints.baseStrokeWidthPx;
                  let currentPxValue = Number.isFinite(rawValue) ? rawValue : sliderMin;
                  currentPxValue = Math.min(sliderMax, Math.max(sliderMin, currentPxValue));
                  currentPxValue = Math.round(currentPxValue);
                  if (currentPxValue < sliderMin) currentPxValue = sliderMin;
                  if (currentPxValue > sliderMax) currentPxValue = sliderMax;
                  
                  const sliderId = `stroke-slider-${selectedTextId}`;
                  
                  return (
                    <div style={{ width: '100%' }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px'
                      }}>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: '500',
                          color: '#111827',
                          fontFamily: CONFIGURATOR_PANEL_FONT
                        }}>
                          Épaisseur {currentPxValue}
                        </div>
                      </div>
                      <style>{`
                        #${sliderId} {
                          -webkit-appearance: none;
                          appearance: none;
                          width: 100%;
                          height: 6px;
                          border-radius: 3px;
                          background: #e5e7eb;
                          outline: none;
                          padding: 0;
                          margin: 0;
                        }
                        #${sliderId}::-webkit-slider-thumb {
                          -webkit-appearance: none;
                          appearance: none;
                          width: 18px;
                          height: 18px;
                          border-radius: 50%;
                          background: #3b82f6;
                          cursor: pointer;
                          border: none;
                          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                        }
                        #${sliderId}::-moz-range-thumb {
                          width: 18px;
                          height: 18px;
                          border-radius: 50%;
                          background: #3b82f6;
                          cursor: pointer;
                          border: none;
                          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                        }
                      `}</style>
                      <input
                        id={sliderId}
                        type="range"
                        min={sliderMin}
                        max={sliderMax}
                        step="1"
                        value={currentPxValue}
                        onChange={(e) => {
                          const pxValue = parseFloat(e.target.value);
                          if (!Number.isFinite(pxValue)) return;
                          let clampedValue = Math.min(sliderMax, Math.max(sliderMin, pxValue));
                          clampedValue = Math.round(clampedValue);
                          if (clampedValue < sliderMin) clampedValue = sliderMin;
                          if (clampedValue > sliderMax) clampedValue = sliderMax;
                          updateText(selectedTextId, { strokeWidth: clampedValue });
                        }}
                      />
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {activeTextTab === 'deformation' && (
            <div>
              <div style={{
                fontSize: '13px',
                fontWeight: '500',
                color: '#111827',
                marginBottom: '12px',
                fontFamily: CONFIGURATOR_PANEL_FONT
              }}>
                Type de déformation
              </div>
              <select
                value={selectedText.deformation || ''}
                onChange={(e) => updateText(selectedTextId, { 
                  deformation: e.target.value || undefined 
                })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  color: '#111827',
                  fontSize: '14px',
                  fontFamily: CONFIGURATOR_PANEL_FONT,
                  cursor: 'pointer',
                  outline: 'none',
                  marginBottom: selectedText.deformation ? '20px' : '0',
                  transition: 'border-color 0.2s'
                }}
              >
                {(() => {
                  const allDeformations = [
                    { value: '', label: 'Aucune' },
                    { value: 'arc', label: 'Arc' },
                    { value: 'wave', label: 'Vague' },
                    { value: 'bulge', label: 'Bombé' },
                    { value: 'pinch', label: 'Pincement' },
                    { value: 'flag', label: 'Drapeau' },
                    { value: 'fisheye', label: 'Fisheye' },
                    { value: 'squeeze', label: 'Compression' },
                    { value: 'skew', label: 'Inclinaison' },
                    { value: 'spiral', label: 'Spirale' },
                    { value: 'rotate', label: 'Rotation progressive' },
                    { value: 'tilt', label: 'Tilt' },
                    { value: 'perspective', label: 'Perspective' },
                    { value: 'fade', label: 'Fondu' },
                    { value: 'ribbon', label: 'Ruban' },
                    { value: 'incline', label: 'Montée/descente' },
                    { value: 'staircase', label: 'Escalier' },
                    { value: 'wave-arc', label: 'Vague + Arc' },
                    { value: 'pulse', label: 'Pulse' },
                  ];
                  
                  const enabledDeformations = activeModule?.textEnabledDeformations;
                  const filteredDeformations = enabledDeformations && enabledDeformations.length > 0
                    ? allDeformations.filter(def => 
                        def.value === '' || enabledDeformations.includes(def.value)
                      )
                    : allDeformations;
                  
                  return filteredDeformations.map(def => (
                    <option key={def.value} value={def.value}>{def.label}</option>
                  ));
                })()}
              </select>
              {selectedText.deformation && (() => {
                const sliderId = `deformation-slider-${selectedTextId}`;
                const intensity = selectedText.deformationIntensity ?? 0;
                
                return (
                  <div style={{ marginTop: '20px' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: '500',
                        color: '#111827',
                        fontFamily: CONFIGURATOR_PANEL_FONT
                      }}>
                        Intensité
                      </div>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#111827',
                        fontFamily: CONFIGURATOR_PANEL_FONT,
                        minWidth: '60px',
                        textAlign: 'right'
                      }}>
                        {intensity > 0 ? `+${intensity}` : intensity.toString()}
                      </div>
                    </div>
                    <style>{`
                      #${sliderId} {
                        -webkit-appearance: none;
                        appearance: none;
                        width: 100%;
                        height: 6px;
                        border-radius: 3px;
                        background: #e5e7eb;
                        outline: none;
                        padding: 0;
                        margin: 0;
                      }
                      #${sliderId}::-webkit-slider-thumb {
                        -webkit-appearance: none;
                        appearance: none;
                        width: 18px;
                        height: 18px;
                        border-radius: 50%;
                        background: #8eff36;
                        border: 2px solid #ffffff;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                        cursor: pointer;
                      }
                      #${sliderId}::-moz-range-thumb {
                        width: 18px;
                        height: 18px;
                        border-radius: 50%;
                        background: #8eff36;
                        border: 2px solid #ffffff;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                        cursor: pointer;
                      }
                    `}</style>
                    <input
                      id={sliderId}
                      type="range"
                      min="-100"
                      max="100"
                      step="1"
                      value={intensity}
                      onChange={(e) => updateText(selectedTextId, { 
                        deformationIntensity: parseInt(e.target.value) 
                      })}
                    />
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '6px',
                      paddingTop: '4px',
                      fontSize: '11px',
                      fontFamily: CONFIGURATOR_PANEL_FONT,
                      fontWeight: '400'
                    }}>
                      <span style={{ color: '#111827' }}>-100</span>
                      <span style={{ color: '#111827' }}>0</span>
                      <span style={{ color: '#111827' }}>+100</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    );
  })()}
</div>
            ) : activeModule.contentType === 'logos' ? (
              <div>
  {(() => {
    const buttonLabel = activeModule.addLogoButtonLabel || 'Ajouter un logo';
    const hasSelectedLibraries = activeModule.selectedItems?.logoLibraryIds && 
      Array.isArray(activeModule.selectedItems.logoLibraryIds) && 
      activeModule.selectedItems.logoLibraryIds.length > 0;
    
    if (!hasSelectedLibraries) {
      return (
        <div>
          <p style={{ color: '#666', fontSize: '14px', fontFamily: CONFIGURATOR_PANEL_FONT }}>
            Sélectionnez des bibliothèques de logos dans les settings du module.
          </p>
        </div>
      );
    }
    
    const selectedLibraries = logoLibraries.filter(l => 
      activeModule.selectedItems?.logoLibraryIds?.includes(l.id)
    );
    
    const allLogos: any[] = [];
    selectedLibraries.forEach(library => {
      if (library.logos && Array.isArray(library.logos)) {
        allLogos.push(...library.logos);
      }
    });
    
    const filteredPlacedLogos = placedLogos.filter(logo => {
      if (activeModule.logoPlacementMode === 'zones') {
        const categoryToView: Record<'torse' | 'dos' | 'bras-gauche' | 'bras-droit', 'front' | 'back' | 'left' | 'right'> = {
          'torse': 'front',
          'dos': 'back',
          'bras-gauche': 'left',
          'bras-droit': 'right'
        };
        const logoView = categoryToView[logo.category as keyof typeof categoryToView];
        const currentView = typeof activeLogoView === 'string' && (activeLogoView === 'front' || activeLogoView === 'back' || activeLogoView === 'left' || activeLogoView === 'right') 
          ? activeLogoView 
          : 'front';
        return logoView === currentView;
      }
      return true;
    });
    
    // Variable pour stocker le contenu à afficher
    let content = null;
    
    // Afficher la bibliothèque de logos si elle est ouverte
    if (showLogoLibrary && activeCustomizerTab === activeModule.id) {
      if (selectedLogoForVariants) {
        const baseVariant = {
          id: 'base',
          file_url: selectedLogoForVariants.file_url || '',
          name: selectedLogoForVariants.name || 'Logo de base'
        };
        const allVariants = [baseVariant, ...(selectedLogoForVariants.variants || [])];
        
        content = (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header avec bouton retour */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              borderBottom: '1px solid #e5e7eb',
              marginBottom: '16px'
            }}>
              <button
                onClick={() => setSelectedLogoForVariants(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#6b7280',
                  fontFamily: CONFIGURATOR_PANEL_FONT,
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#111827'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Retour</span>
              </button>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#111827',
                  fontFamily: CONFIGURATOR_PANEL_FONT
                }}>
                  Choisir une variante
                </span>
              </div>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827',
                fontFamily: CONFIGURATOR_PANEL_FONT,
                marginBottom: '16px'
              }}>
                {selectedLogoForVariants.name}
              </h3>
            
              {allVariants.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#6b7280' }}>
                  <p style={{ fontSize: '14px', fontFamily: CONFIGURATOR_PANEL_FONT }}>
                    Aucune variante disponible
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {allVariants.map((variant: any, index: number) => (
                  <div
                    key={variant.id || `base-${index}`}
                    onClick={async () => {
                      if (logoToReplace) {
                        const logoToReplaceData = placedLogos.find(l => l.id === logoToReplace);
                        if (logoToReplaceData) {
                          const fileToUse = variant.id === 'base' 
                            ? selectedLogoForVariants.file_url 
                            : (variant.file_url || selectedLogoForVariants.file_url);
                          setPlacedLogos(prev => prev.map(l => 
                            l.id === logoToReplace 
                              ? {
                                  ...l,
                                  logoId: selectedLogoForVariants.id,
                                  variantId: variant.id === 'base' ? undefined : variant.id,
                                  variantFile: fileToUse
                                }
                              : l
                          ));
                          setSelectedLogoId(logoToReplace);
                          setLogoToReplace(null);
                          setSelectedLogoForVariants(null);
                          setShowLogoLibrary(false);
                          return;
                        }
                      }
                      
                      if (activeModule.logoPlacementMode === 'zones') {
                        alert('Mode zones à implémenter');
                      } else {
                        console.log('Mode libre - variante sélectionnée:', variant.id);
                      }
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #e0e0e0',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div
                      style={{
                        width: '80px',
                        height: '80px',
                        backgroundColor: '#f0f0f0',
                        borderRadius: '4px',
                        border: '1px solid #e0e0e0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px'
                      }}
                    >
                      <img
                        src={variant.id === 'base' 
                          ? selectedLogoForVariants.file_url 
                          : (variant.file_url || selectedLogoForVariants.file_url)}
                        alt={variant.name || selectedLogoForVariants.name}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain'
                        }}
                      />
                    </div>
                    <span style={{ 
                      fontSize: '11px', 
                      color: '#000000', 
                      textAlign: 'center',
                      fontWeight: '500'
                    }}>
                      {variant.id === 'base' ? 'Logo de base' : variant.name || 'Variante'}
                    </span>
                  </div>
                ))}
                </div>
              )}
            </div>
        </div>
      );
    } else {
      // Afficher la bibliothèque de logos (pas de variante sélectionnée)
      // Filtrer les logos par recherche
      const filteredLibraryLogos = allLogos.filter(logo => {
        if (!logoSearchQuery.trim()) return true;
        const query = logoSearchQuery.toLowerCase();
        return (
          (logo.name && logo.name.toLowerCase().includes(query)) ||
          (logo.tags && Array.isArray(logo.tags) && logo.tags.some((tag: string) => tag.toLowerCase().includes(query)))
        );
      });
      
      content = (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header avec bouton retour */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            borderBottom: '1px solid #e5e7eb',
            marginBottom: '16px'
          }}>
            <button
              onClick={() => {
                setShowLogoLibrary(false);
                setSelectedLogoForVariants(null);
                setLogoToReplace(null);
                setSelectedLogoId(null);
                setLogoSearchQuery('');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                color: '#6b7280',
                fontFamily: CONFIGURATOR_PANEL_FONT,
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#111827'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Retour</span>
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#111827',
                fontFamily: CONFIGURATOR_PANEL_FONT
              }}>
                {activeModule.addLogoButtonLabel || 'Ajouter un logo'}
              </span>
            </div>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
            {!selectedLogoForVariants && (
              <>
                {/* Bouton d'importation */}
                <div style={{ marginBottom: '16px' }}>
                  <button
                    onClick={() => {
                      alert('Import logo à implémenter');
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: '#3b82f6',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      fontFamily: CONFIGURATOR_PANEL_FONT,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                  >
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {activeModule.importLogoButtonLabel || 'Importer un logo'}
                  </button>
                </div>

                {/* Barre de recherche */}
                <input
                  type="text"
                  placeholder="Rechercher un logo..."
                  value={logoSearchQuery}
                  onChange={(e) => setLogoSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: CONFIGURATOR_PANEL_FONT,
                    color: '#111827',
                    marginBottom: '16px',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </>
            )}
            
            {allLogos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#6b7280' }}>
                <p style={{ fontSize: '14px', fontFamily: CONFIGURATOR_PANEL_FONT, marginBottom: '4px' }}>
                  Aucun logo disponible dans les bibliothèques sélectionnées
                </p>
                <p style={{ fontSize: '12px', fontFamily: CONFIGURATOR_PANEL_FONT }}>
                  Ajoutez des logos dans l'admin
                </p>
              </div>
            ) : filteredLibraryLogos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#6b7280' }}>
                <p style={{ fontSize: '14px', fontFamily: CONFIGURATOR_PANEL_FONT }}>
                  {logoSearchQuery ? 'Aucun logo trouvé' : 'Aucun logo disponible'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {filteredLibraryLogos.map((logo: any) => {
                const hasVariants = logo.variants && logo.variants.length > 0;
                
                return (
                  <div
                    key={logo.id}
                    onClick={() => {
                      if (logoToReplace) {
                        if (hasVariants) {
                          setSelectedLogoForVariants(logo);
                          return;
                        }
                        
                        const logoToReplaceData = placedLogos.find(l => l.id === logoToReplace);
                        if (logoToReplaceData) {
                          setPlacedLogos(prev => prev.map(l => 
                            l.id === logoToReplace 
                              ? {
                                  ...l,
                                  logoId: logo.id,
                                  variantId: undefined,
                                  variantFile: logo.file_url
                                }
                              : l
                          ));
                          setSelectedLogoId(logoToReplace);
                          setLogoToReplace(null);
                          setShowLogoLibrary(false);
                          return;
                        }
                      }
                      
                      if (hasVariants) {
                        setSelectedLogoForVariants(logo);
                        return;
                      }
                      
                      if (activeModule.logoPlacementMode === 'zones') {
                        alert('Mode zones à implémenter');
                      } else {
                        console.log('Mode libre - logo sélectionné:', logo.id);
                      }
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #e0e0e0',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div
                      style={{
                        width: '80px',
                        height: '80px',
                        backgroundColor: '#f0f0f0',
                        borderRadius: '4px',
                        border: '1px solid #e0e0e0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px'
                      }}
                    >
                      <img
                        src={logo.file_url}
                        alt={logo.name}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                      <span style={{ 
                        fontSize: '11px', 
                        color: '#000000', 
                        textAlign: 'center', 
                        fontWeight: '500'
                      }}>
                        {logo.name}
                      </span>
                      {hasVariants && (
                        <span style={{ 
                          fontSize: '10px', 
                          color: '#999999', 
                          textAlign: 'center'
                        }}>
                          variantes
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
      }
    }
    
    // Code par défaut : afficher la liste des logos placés (si showLogoLibrary est false)
    if (!content) {
    // Code par défaut : afficher la liste des logos placés (si showLogoLibrary est false)
    content = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {activeModule.logoPlacementMode === 'zones' && (
          <div style={{ 
            display: 'flex', 
            gap: '8px',
            padding: '4px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            {(['front', 'back', 'left', 'right'] as const).map((view) => {
              const viewLabels: Record<'front' | 'back' | 'left' | 'right', string> = {
                'front': 'Face',
                'back': 'Dos',
                'left': 'Gauche',
                'right': 'Droite'
              };
              const isActive = activeLogoView === view;
              return (
                <button
                  key={view}
                  onClick={() => setActiveLogoView(view)}
                  style={{
                    flex: 1,
                    height: '42px',
                    padding: '0 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: isActive ? '2px solid #374151' : '1px solid #e5e7eb',
                    borderRadius: '8px',
                    backgroundColor: isActive ? '#111827' : 'transparent',
                    cursor: 'pointer',
                    color: isActive ? '#ffffff' : '#6b7280',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                    fontFamily: CONFIGURATOR_PANEL_FONT
                  }}
                >
                  {viewLabels[view]}
                </button>
              );
            })}
          </div>
        )}
        
        {!logoToReplace && (
          <button
            onClick={() => {
              setShowLogoLibrary(true);
            }}
            style={{
              width: '100%',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '500',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
          >
            <span style={{ fontSize: '18px', fontWeight: '300', color: '#ffffff' }}>+</span>
            <span style={{ color: '#ffffff' }}>{buttonLabel}</span>
          </button>
        )}
        
        {filteredPlacedLogos.length > 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{
              fontSize: '14px',
              color: '#000000',
              fontFamily: CONFIGURATOR_PANEL_FONT,
              fontWeight: '600',
              marginBottom: '4px'
            }}>
              {activeModule.placedLogosLabel || 'Logos placés'} ({filteredPlacedLogos.length})
            </div>
            {filteredPlacedLogos.map((logo) => {
              let logoName = 'Logo';
              for (const library of logoLibraries) {
                const foundLogo = library.logos?.find((l: any) => l.id === logo.logoId);
                if (foundLogo) {
                  logoName = foundLogo.name || 'Logo';
                  break;
                }
              }
              
              return (
                <div
                  key={logo.id}
                  onClick={() => {
                    setSelectedLogoId(logo.id);
                    setLogoToReplace(logo.id);
                    setShowLogoLibrary(true);
                  }}
                  style={{
                    padding: '14px',
                    backgroundColor: selectedLogoId === logo.id ? '#fafafa' : '#fafafa',
                    border: selectedLogoId === logo.id ? '2px solid #000000' : '1px solid #e0e0e0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      padding: '4px'
                    }}>
                      {logo.variantFile ? (
                        <img
                          src={logo.variantFile}
                          alt={logoName}
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain'
                          }}
                        />
                      ) : (
                        <div style={{
                          fontSize: '10px',
                          color: '#6b7280',
                          textAlign: 'center'
                        }}>
                          No img
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: '14px', color: '#111827', fontFamily: CONFIGURATOR_PANEL_FONT }}>
                      {logoName}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmDeleteLogo(logo.id);
                    }}
                    style={{
                      padding: '8px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#6b7280',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
    }
    
    return content;
  })()}
              </div>
            ) : (
        {activeModule.logoPlacementMode === 'zones' && (
          <div style={{ 
            display: 'flex', 
            gap: '8px',
            padding: '4px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            {(['front', 'back', 'left', 'right'] as const).map((view) => {
              const viewLabels: Record<'front' | 'back' | 'left' | 'right', string> = {
                'front': 'Face',
                'back': 'Dos',
                'left': 'Gauche',
                'right': 'Droite'
              };
              const isActive = activeLogoView === view;
              return (
                <button
                  key={view}
                  onClick={() => setActiveLogoView(view)}
                  style={{
                    flex: 1,
                    height: '42px',
                    padding: '0 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: isActive ? '2px solid #374151' : '1px solid #e5e7eb',
                    borderRadius: '8px',
                    backgroundColor: isActive ? '#111827' : 'transparent',
                    cursor: 'pointer',
                    color: isActive ? '#ffffff' : '#6b7280',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                    fontFamily: CONFIGURATOR_PANEL_FONT
                  }}
                >
                  {viewLabels[view]}
                </button>
              );
            })}
          </div>
        )}
        
        {!logoToReplace && (
          <button
            onClick={() => {
              setShowLogoLibrary(true);
            }}
            style={{
              width: '100%',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '500',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
          >
            <span style={{ fontSize: '18px', fontWeight: '300', color: '#ffffff' }}>+</span>
            <span style={{ color: '#ffffff' }}>{buttonLabel}</span>
          </button>
        )}
        
        {filteredPlacedLogos.length > 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{
              fontSize: '14px',
              color: '#000000',
              fontFamily: CONFIGURATOR_PANEL_FONT,
              fontWeight: '600',
              marginBottom: '4px'
            }}>
              {activeModule.placedLogosLabel || 'Logos placés'} ({filteredPlacedLogos.length})
            </div>
            {filteredPlacedLogos.map((logo) => {
              let logoName = 'Logo';
              for (const library of logoLibraries) {
                const foundLogo = library.logos?.find((l: any) => l.id === logo.logoId);
                if (foundLogo) {
                  logoName = foundLogo.name || 'Logo';
                  break;
                }
              }
              
              return (
                <div
                  key={logo.id}
                  onClick={() => {
                    setSelectedLogoId(logo.id);
                    setLogoToReplace(logo.id);
                    setShowLogoLibrary(true);
                  }}
                  style={{
                    padding: '14px',
                    backgroundColor: selectedLogoId === logo.id ? '#fafafa' : '#fafafa',
                    border: selectedLogoId === logo.id ? '2px solid #000000' : '1px solid #e0e0e0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      padding: '4px'
                    }}>
                      {logo.variantFile ? (
                        <img
                          src={logo.variantFile}
                          alt={logoName}
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain'
                          }}
                        />
                      ) : (
                        <div style={{
                          fontSize: '10px',
                          color: '#6b7280',
                          textAlign: 'center'
                        }}>
                          No img
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: '14px', color: '#111827', fontFamily: CONFIGURATOR_PANEL_FONT }}>
                      {logoName}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmDeleteLogo(logo.id);
                    }}
                    style={{
                      padding: '8px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#6b7280',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
    }
  })()}
              </div>
            ) : (
              <div>
                <p style={{ color: '#111827', fontSize: '14px', fontFamily: CONFIGURATOR_PANEL_FONT }}>
                  Module de personnalisation: {activeModule.contentType || 'Non configuré'}
                </p>
              </div>
            )}
          </div>
          
          {/* Boutons d'action en bas */}
          <div style={{
            padding: '16px',
            backgroundColor: '#ffffff',
            borderTop: '1px solid #e0e0e0',
            display: 'flex',
            gap: '12px'
          }}>
            <button
              onClick={async () => {
                // TODO: Implémenter la sauvegarde
                console.log('Sauvegarder');
              }}
              style={{
                flex: 1,
                padding: '10px 20px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                fontFamily: CONFIGURATOR_PANEL_FONT
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e5e7eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
              </svg>
              Sauvegarder
            </button>
            <button
              onClick={() => {
                // TODO: Implémenter l'ajout au panier
                console.log('Ajouter au panier');
              }}
              style={{
                flex: 1,
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                fontFamily: CONFIGURATOR_PANEL_FONT
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6';
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
              Ajouter au panier
            </button>
          </div>
        </div>
      )}

      {/* Viewer 3D */}
      <div style={{
        flex: 1,
        backgroundColor: '#f8f8f8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        ...(viewportMode === 'mobile' ? {
          padding: '20px'
        } : {})
      }}>
        {/* Viewport Mode Toggle */}
        <div 
          style={{ 
            position: 'absolute',
            top: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10000,
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div 
            style={{
              backgroundColor: 'white',
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
              border: '2px solid #d1d5db',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              borderRadius: '8px',
              padding: '4px'
            }}
          >
            <button
              onClick={() => setViewportMode('desktop')}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                transition: 'all 0.2s',
                backgroundColor: viewportMode === 'desktop' ? '#3b82f6' : 'transparent',
                color: viewportMode === 'desktop' ? '#ffffff' : '#374151',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Vue ordinateur"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewportMode('mobile')}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                transition: 'all 0.2s',
                backgroundColor: viewportMode === 'mobile' ? '#3b82f6' : 'transparent',
                color: viewportMode === 'mobile' ? '#ffffff' : '#374151',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Vue téléphone"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>

        {viewerConfig && viewerConfig.modelUrl ? (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ...(viewportMode === 'mobile' ? {
              maxWidth: '393px',
              maxHeight: '852px',
              width: '393px',
              height: '852px',
              margin: '0 auto',
              border: '8px solid #1f2937',
              borderRadius: '20px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
              overflow: 'hidden',
              backgroundColor: '#e8e8e8'
            } : {})
          }}>
            <Canvas
              camera={{ 
                position: viewportMode === 'mobile' ? [0, 0, 8] : [0, 0, 15], 
                fov: viewportMode === 'mobile' ? 65 : 50 
              }}
              gl={{ preserveDrawingBuffer: true }}
              style={{ width: '100%', height: '100%' }}
            >
            <ambientLight intensity={0.4} color="#f5f5f5" />
            <directionalLight position={[12, 18, 12]} intensity={2.0} color="#ffffff" />
            <directionalLight position={[-8, 12, 8]} intensity={1.0} color="#f8f8ff" />
            <directionalLight position={[0, 8, -15]} intensity={1.2} color="#fafafa" />
            <Suspense fallback={null}>
              <ModelViewer
                url={viewerConfig.modelUrl}
                color="#ffffff"
                designTexture={viewerConfig.designUrl || undefined}
                materialMaps={Object.keys(viewerConfig.materialMaps).length > 0 ? viewerConfig.materialMaps : undefined}
                colors={Object.keys(viewerConfig.colors).length > 0 ? viewerConfig.colors : undefined}
                selectedDesign={viewerConfig.selectedDesign}
                texts={texts}
                fonts={[]}
                placedLogos={placedLogos}
                updateTextPosition={updateTextPosition}
                updateTextRotation={updateTextRotation}
                updateTextSize={updateTextSize}
                toggleTextLock={toggleTextLock}
                removeText={removeText}
                selectedTextId={selectedTextId}
                selectText={selectText}
                isDraggingText={isDraggingText}
                setIsDraggingText={setIsDraggingText}
                isRotatingText={isRotatingText}
                setIsRotatingText={setIsRotatingText}
                isResizingText={isResizingText}
                setIsResizingText={setIsResizingText}
                updateLogoPosition={updateLogoPosition}
                updateLogoScale={updateLogoScale}
                updateLogoRotation={updateLogoRotation}
                selectedLogoId={selectedLogoId}
                selectLogo={selectLogo}
                toggleLogoLock={toggleLogoLock}
                setIsDraggingLogo={setIsDraggingLogo}
              />
            </Suspense>
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={viewportMode === 'mobile' ? 3 : 5}
              maxDistance={viewportMode === 'mobile' ? 15 : 25}
            />
          </Canvas>
          </div>
        ) : (
          <div style={{
            fontSize: '16px',
            color: '#111827',
            fontFamily: CONFIGURATOR_PANEL_FONT
          }}>
            Modèle 3D non disponible
          </div>
        )}

        {/* Boutons d'action mobile en bas */}
        {viewportMode === 'mobile' && (
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '16px',
            backgroundColor: '#ffffff',
            borderTop: '1px solid #e0e0e0',
            display: 'flex',
            gap: '12px',
            zIndex: 10000,
            boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
          }}>
            <button
              onClick={async () => {
                // TODO: Implémenter la sauvegarde
                console.log('Sauvegarder');
              }}
              style={{
                flex: 1,
                padding: '12px 20px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                fontFamily: CONFIGURATOR_PANEL_FONT
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
              </svg>
              Sauvegarder
            </button>
            <button
              onClick={() => {
                // TODO: Implémenter l'ajout au panier
                console.log('Ajouter au panier');
              }}
              style={{
                flex: 1,
                padding: '12px 20px',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                fontFamily: CONFIGURATOR_PANEL_FONT
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
              Ajouter au panier
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
