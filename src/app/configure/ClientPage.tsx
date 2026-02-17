"use client";

import { Suspense, useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { ModelViewer } from "@/components/ModelViewer";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import * as THREE from "three";
import { ProductConfiguratorPanel, type TextModuleFromBuilder } from "@/app/test-viewer/page";
import { ConfiguratorLogoPanel } from "@/components/ConfiguratorLogoPanel";

// Constante pour la font du configurator-panel
const CONFIGURATOR_PANEL_FONT = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
// Style global (identique au builder : noir/blanc)
// IMPORTANT: Scoper UNIQUEMENT au .configurator-panel pour ne pas affecter le reste de la page
// Copié exactement du builder pour correspondre
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
    .configurator-panel .mobile-action-btn-black,
    .configurator-panel .mobile-action-btn-black * {
      color: #ffffff !important;
      -webkit-text-fill-color: #ffffff !important;
      -webkit-text-stroke-color: #ffffff !important;
      font-family: ${CONFIGURATOR_PANEL_FONT} !important;
    }
    .configurator-panel .cv-panel-add-logo-btn,
    .configurator-panel .cv-panel-add-logo-btn *,
    .configurator-panel .cv-panel-add-logo-btn span,
    .configurator-viewer-isolated .cv-panel-add-logo-btn,
    .configurator-viewer-isolated .cv-panel-add-logo-btn *,
    .configurator-viewer-isolated .cv-panel-add-logo-btn span {
      color: #ffffff !important;
      -webkit-text-fill-color: #ffffff !important;
      -webkit-text-stroke-color: #ffffff !important;
      fill: #ffffff !important;
      stroke: #ffffff !important;
      font-family: ${CONFIGURATOR_PANEL_FONT} !important;
    }
    .configurator-panel [data-zone-checkmark],
    .configurator-panel [data-zone-checkmark] span {
      color: #111827 !important;
      -webkit-text-fill-color: #111827 !important;
      font-family: ${CONFIGURATOR_PANEL_FONT} !important;
    }
    .configurator-panel button.configurator-panel-sidebar-tab-active {
      border-radius: 12px !important;
      -webkit-border-radius: 12px !important;
      -moz-border-radius: 12px !important;
    }
    button.configurator-panel-sidebar-tab-active {
      border-radius: 12px !important;
      -webkit-border-radius: 12px !important;
      -moz-border-radius: 12px !important;
    }
  `;
  if (!document.getElementById('customizer-tab-style')) {
    style.id = 'customizer-tab-style';
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
    logoZoneGroupIds?: string[];
    fontGroupIds?: string[];
    textZoneGroupIds?: string[];
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
  viewLabels?: Array<{ id: string; label: string; cameraViewId?: string }>;
  zoneGroupIds?: string[];
  /** Couleurs autorisées (depuis snapshot) pour la résolution designColors → hex */
  allowedColors?: Array<{ id?: string; hex?: string; label?: string; name?: string }>;
}

interface ProductData {
  id: string;
  name: string;
  snapshot?: {
    customizationModules?: CustomizationModule[];
    fonts?: Array<{
      id: string;
      name: string;
      display_name: string;
      font_url: string;
      format: string;
      category?: string;
    }>;
    textZones?: Array<{
      id: string;
      name: string;
      categories: string[];
      zone_category: string;
      position: [number, number, number];
      view?: 'front' | 'back' | 'left' | 'right';
    }>;
    defaultState?: {
      texts?: any[];
      logos?: any[];
      design2DId?: string;
    };
    design2D?: {
      id?: string;
      url?: string;
    };
    model3D?: {
      id?: string;
      url?: string;
    };
    resolvedColors?: Record<string, string>; // Mapping final mesh → hex, prêt à être appliqué
    cameraSettings?: {
      initialZoom: number;
      initialRotation: number;
      minZoom: number;
      maxZoom: number;
      zoomSpeed?: number;
      rotateSpeed?: number;
      viewDistance?: Record<string, number>;
    };
  };
  builder_data?: {
    model3DId?: string;
    design2DId?: string;
    customizationModules?: CustomizationModule[];
    defaultState?: {
      texts?: any[];
      logos?: any[];
      design2DId?: string;
    };
    settings?: any;
  };
}

export default function ConfigurePage() {
  const searchParams = useSearchParams();
  const productId = searchParams.get('productId');
  const shop = searchParams.get('shop');
  const variantId = searchParams.get('variantId') || '1';
  const isPreview = searchParams.get('preview') === 'true';
  const isPreviewLive = searchParams.get('preview') === 'live';

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
  const [textZones, setTextZones] = useState<any[]>([]);
  const [isLoadingZones, setIsLoadingZones] = useState(false);
  
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
  const [hoveredLogoViewId, setHoveredLogoViewId] = useState<string | null>(null);
  
  // Version mobile
  const [viewportMode, setViewportMode] = useState<'desktop' | 'mobile'>('desktop');
  const [mobileActivePanel, setMobileActivePanel] = useState<string | null>(null);
  
  // États pour les améliorations UI
  const [isAddingText, setIsAddingText] = useState(false);
  const [newTextContent, setNewTextContent] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [logoSearchQuery, setLogoSearchQuery] = useState('');
  const [isAddLogoHovered, setIsAddLogoHovered] = useState(false);
  const [showVariantSelector, setShowVariantSelector] = useState<string | null>(null);
  const [showZoneSelector, setShowZoneSelector] = useState<{logoId: string, variantId: string, variantFile: string} | null>(null);
  const [showTextZoneModal, setShowTextZoneModal] = useState(false);
  const [textInputValue, setTextInputValue] = useState<string>('');
  const [selectedLogoZoneId, setSelectedLogoZoneId] = useState<string | null>(null);
  const [selectedTextZoneId, setSelectedTextZoneId] = useState<string | null>(null);
  const [activeLogoCategory, setActiveLogoCategory] = useState<'torse' | 'dos' | 'bras-gauche' | 'bras-droit'>('torse');

  // Charger le produit et sa configuration
  const designColorsLoadedFromProductRef = useRef(false);
  useEffect(() => {
    async function loadProduct() {
      if (!productId || !shop) {
        setIsLoading(false);
        return;
      }
      designColorsLoadedFromProductRef.current = false;

      try {
        let productData: any = null;

        // Mode preview live : charger depuis localStorage (snapshot généré par le builder)
        if (isPreviewLive && typeof window !== 'undefined') {
          const stored = localStorage.getItem('preview_snapshot_live');
          if (stored) {
            const parsed = JSON.parse(stored);
            productData = { id: productId, name: 'Preview', snapshot: parsed, builder_data: null };
          }
        }

        // Sinon charger depuis l'API
        if (!productData) {
          const previewParam = isPreview ? '&preview=true' : '';
          const res = await fetch(`/api/product-builder?id=${encodeURIComponent(productId)}&shop=${encodeURIComponent(shop)}&for=client${previewParam}`);
          if (res.ok) {
            productData = await res.json();
          }
        }

        if (productData) {
          
          // DEBUG: Vérifier que le snapshot est présent
          console.log('📦 ProductData reçu:', {
            hasSnapshot: !!productData.snapshot,
            hasBuilderData: !!productData.builder_data,
            snapshotKeys: productData.snapshot ? Object.keys(productData.snapshot) : [],
            snapshotDesign2D: productData.snapshot?.design2D,
            snapshotResolvedColors: productData.snapshot?.resolvedColors
          });
          
          setProduct(productData);
          
          // Charger les customizationModules depuis snapshot ou builder_data
          const snapshot = productData.snapshot;
          const builderData = productData.builder_data;
          
          // DEBUG: Vérifier que le snapshot est bien utilisé
          if (snapshot) {
            console.log('✅ Snapshot trouvé dans productData:', {
              hasDesign2D: !!snapshot.design2D,
              design2DUrl: snapshot.design2D?.url,
              design2DId: snapshot.design2D?.id,
              hasResolvedColors: !!snapshot.resolvedColors,
              resolvedColorsKeys: snapshot.resolvedColors ? Object.keys(snapshot.resolvedColors) : []
            });
          } else {
            console.warn('⚠️ Aucun snapshot trouvé dans productData, utilisation de builder_data');
          }
          
          // Priorité au snapshot s'il existe, sinon builder_data
          const rawModules = snapshot?.customizationModules || builderData?.customizationModules || [];
          
          // Mapper les modules du snapshot vers l'interface CustomizationModule
          // Le snapshot peut avoir `type`/`label` alors que ClientPage attend `contentType`/`tabName`
          const modules = rawModules.map((module: any): CustomizationModule => ({
            id: module.id,
            tabName: module.tabName || module.label || '',
            icon: module.icon,
            iconUrl: module.iconUrl,
            contentType: module.contentType || module.type || 'unknown',
            selectedItems: module.selectedItems || {},
            colorClassLabels: module.colorClassLabels || module.config?.colorClassLabels,
            addTextButtonLabel: module.addTextButtonLabel || module.config?.addTextButtonLabel,
            placedTextsLabel: module.placedTextsLabel || module.config?.placedTextsLabel,
            textPlacementMode: module.textPlacementMode || module.config?.textPlacementMode,
            enableTextContent: module.enableTextContent ?? module.config?.enableTextContent,
            enableTextFont: module.enableTextFont ?? module.config?.enableTextFont,
            enableTextColor: module.enableTextColor ?? module.config?.enableTextColor,
            enableTextStroke: module.enableTextStroke ?? module.config?.enableTextStroke,
            enableTextDeformation: module.enableTextDeformation ?? module.config?.enableTextDeformation,
            textColorPaletteId: module.textColorPaletteId || module.config?.textColorPaletteId,
            textStrokePaletteId: module.textStrokePaletteId || module.config?.textStrokePaletteId,
            textStrokeMinWidth: module.textStrokeMinWidth || module.config?.textStrokeMinWidth,
            textMinFontSize: module.textMinFontSize || module.config?.textMinFontSize,
            textMaxFontSize: module.textMaxFontSize || module.config?.textMaxFontSize,
            textStrokeMaxWidth: module.textStrokeMaxWidth || module.config?.textStrokeMaxWidth,
            textBaseStrokeWidth: module.textBaseStrokeWidth || module.config?.textBaseStrokeWidth,
            textDefaultColor: module.textDefaultColor || module.config?.textDefaultColor,
            textDefaultStrokeColor: module.textDefaultStrokeColor || module.config?.textDefaultStrokeColor,
            textDefaultFontId: module.textDefaultFontId || module.config?.textDefaultFontId,
            textEnabledDeformations: module.textEnabledDeformations || module.config?.textEnabledDeformations,
            addLogoButtonLabel: module.addLogoButtonLabel || module.config?.addLogoButtonLabel,
            importLogoButtonLabel: module.importLogoButtonLabel || module.config?.importLogoButtonLabel,
            placedLogosLabel: module.placedLogosLabel || module.config?.placedLogosLabel,
            logoPlacementMode: module.logoPlacementMode || module.config?.logoPlacementMode,
            viewLabels: module.viewLabels || module.config?.viewLabels,
            zoneGroupIds: module.zoneGroupIds || module.config?.zoneGroupIds || module.selectedItems?.zoneGroupIds || module.selectedItems?.textZoneGroupIds,
            ...(module.allowedColors && { allowedColors: module.allowedColors }),
            ...(module.config?.allowedColors && !module.allowedColors && { allowedColors: module.config.allowedColors })
          }));
          
          console.log('📦 Modules mappés:', {
            rawCount: rawModules.length,
            mappedCount: modules.length,
            modules: modules.map((m: CustomizationModule) => ({
              id: m.id,
              tabName: m.tabName,
              contentType: m.contentType,
              hasSelectedItems: !!m.selectedItems
            }))
          });
          
          setCustomizationModules(modules);
          
          // Charger les bibliothèques de logos depuis le snapshot si disponibles
          const logoModules = modules.filter((m: CustomizationModule) => m.contentType === 'logos');
          if (logoModules.length > 0) {
            const allLogoLibraries: any[] = [];
            logoModules.forEach((module: CustomizationModule) => {
              const snapshotModule = rawModules.find((m: any) => m.id === module.id);
              if (snapshotModule?.config?.logoLibraries && Array.isArray(snapshotModule.config.logoLibraries)) {
                allLogoLibraries.push(...snapshotModule.config.logoLibraries);
              }
            });
            if (allLogoLibraries.length > 0) {
              setLogoLibraries(allLogoLibraries);
            }
          }
          
          // Charger les groupes de polices depuis le snapshot si disponibles
          const textModules = modules.filter((m: CustomizationModule) => m.contentType === 'texts' || m.contentType === 'text');
          if (textModules.length > 0) {
            const allFontGroups: any[] = [];
            textModules.forEach((module: CustomizationModule) => {
              const snapshotModule = rawModules.find((m: any) => m.id === module.id);
              if (snapshotModule?.config?.fontGroups && Array.isArray(snapshotModule.config.fontGroups)) {
                allFontGroups.push(...snapshotModule.config.fontGroups);
              }
            });
            if (allFontGroups.length > 0) {
              setFontGroups(allFontGroups);
            }
          }
          
          // Charger les textes depuis le snapshot ou builder_data
          const defaultState = snapshot?.defaultState || builderData?.defaultState;
          if (defaultState?.texts && Array.isArray(defaultState.texts)) {
            setTexts(defaultState.texts);
          }
          
          // Charger les logos depuis le snapshot ou builder_data
          if (defaultState?.logos && Array.isArray(defaultState.logos)) {
            setPlacedLogos(defaultState.logos);
          }
          
          // Activer le premier module si disponible
          if (modules.length > 0) {
            setActiveCustomizerTab(modules[0].id);
          }
          
          // Charger le modèle 3D et le design depuis snapshot ou builder_data
          const model3DId = snapshot?.model3D?.id || builderData?.model3DId || null;
          setSelectedModel3DId(model3DId);
          
          // Le design 2D doit être récupéré depuis les selectedItems des modules
          // PRIORITÉ ABSOLUE au snapshot pour le design 2D ID
          let design2DId = null;
          if (snapshot?.design2D?.id) {
            design2DId = snapshot.design2D.id;
            console.log('✅ Design 2D ID depuis snapshot:', design2DId);
          } else {
            const designModule = modules.find((m: any) => 
              (m.contentType === 'designs-2d' || m.type === 'designs-2d') && m.selectedItems?.design2DId
            );
            if (designModule?.selectedItems?.design2DId) {
              design2DId = designModule.selectedItems.design2DId;
            } else if (defaultState?.design2DId) {
              design2DId = defaultState.design2DId;
            } else if (builderData?.design2DId) {
              design2DId = builderData.design2DId;
            }
          }
          setSelectedDesign2DId(design2DId);
          
          // Charger designColors depuis builder_data ou snapshot (couleurs sauvegardées du builder)
          if (builderData?.designColors && typeof builderData.designColors === 'object' && Object.keys(builderData.designColors).length > 0) {
            setDesignColors(builderData.designColors);
            designColorsLoadedFromProductRef.current = true;
          } else if (snapshot?.designColors && typeof snapshot.designColors === 'object' && Object.keys(snapshot.designColors).length > 0) {
            setDesignColors(snapshot.designColors);
            designColorsLoadedFromProductRef.current = true;
          }
        }
      } catch (error) {
        console.error('Error loading product:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadProduct();
  }, [productId, shop, isPreview, isPreviewLive]);

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

  // Initialiser designColors depuis le design UNIQUEMENT si pas déjà chargé depuis product (builder_data/snapshot)
  const lastDesignIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (designColorsLoadedFromProductRef.current) return; // Déjà chargé depuis product
    if (designs2D.length === 0) return;
    const designId = customizationModules.find((m: any) => m.contentType === 'designs-2d')?.selectedItems?.design2DId || selectedDesign2DId;
    if (!designId || designId === lastDesignIdRef.current) return;
    lastDesignIdRef.current = designId;
    const design = designs2D.find((d: any) => d.id === designId);
    if (design?.color_mappings && Object.keys(design.color_mappings).length > 0) {
      setDesignColors(prev => (Object.keys(prev).length > 0 ? prev : { ...design.color_mappings }));
    }
  }, [selectedDesign2DId, designs2D, customizationModules]);

  // Charger les zones de texte à partir du snapshot ou des groupes de zones sélectionnés dans les modules
  useEffect(() => {
    async function loadTextZones() {
      // Priorité au snapshot s'il existe
      const snapshot = product?.snapshot;
      if (snapshot?.textZones && Array.isArray(snapshot.textZones) && snapshot.textZones.length > 0) {
        // Utiliser directement les zones du snapshot avec toutes leurs propriétés (position, taille, etc.)
        setTextZones(snapshot.textZones.map((zone: any) => ({
          ...zone,
          // S'assurer que toutes les propriétés sont présentes
          position: zone.position || [0, 0, 0],
          width: zone.width || zone.default_text_width,
          height: zone.height || zone.default_text_height,
          rotation: zone.rotation || zone.default_rotation || 0,
          categories: zone.categories || [zone.zone_category || 'text']
        })));
        return;
      }

      if (zoneGroups.length === 0 || customizationModules.length === 0) {
        setTextZones([]);
        return;
      }

      setIsLoadingZones(true);
      try {
        // Récupérer tous les zoneGroupIds sélectionnés dans les modules de texte
        const allZoneGroupIds = new Set<string>();
        customizationModules.forEach(module => {
          if (module.contentType === 'texts' || module.contentType === 'text') {
            const textZoneGroupIds = (module as any).zoneGroupIds || 
                                   ((module as any).config as any)?.textZoneGroupIds || 
                                   (module.selectedItems as any)?.textZoneGroupIds || 
                                   [];
            textZoneGroupIds.forEach((id: string) => allZoneGroupIds.add(id));
          }
        });

        // Extraire toutes les zones des groupes sélectionnés
        const zones: any[] = [];
        zoneGroups.forEach(group => {
          if (allZoneGroupIds.has(group.id) && group.zones) {
            group.zones.forEach((zone: any) => {
              zones.push({
                ...zone,
                groupId: group.id,
                groupName: group.name,
                categories: zone.categories || ['text']
              });
            });
          }
        });

        setTextZones(zones);
      } catch (error) {
        console.error('Error loading text zones:', error);
        setTextZones([]);
      } finally {
        setIsLoadingZones(false);
      }
    }

    loadTextZones();
  }, [zoneGroups, customizationModules, product]);
  
  // Refs pour que les listeners caméra accèdent aux données à jour
  const productRef = useRef(product);
  const models3DRef = useRef(models3D);
  const customizationModulesRef = useRef(customizationModules);
  const selectedModel3DIdRef = useRef(selectedModel3DId);
  productRef.current = product;
  models3DRef.current = models3D;
  customizationModulesRef.current = customizationModules;
  selectedModel3DIdRef.current = selectedModel3DId;

  // Écouter les événements de caméra (goToCameraView avec position/target, setCameraView avec view id)
  useEffect(() => {
    const defaultPositions: Record<string, { position: [number, number, number]; target: [number, number, number] }> = {
      front: { position: [0, 0, 15], target: [0, 0, 0] },
      back: { position: [0, 0, -15], target: [0, 0, 0] },
      left: { position: [-15, 0, 0], target: [0, 0, 0] },
      right: { position: [15, 0, 0], target: [0, 0, 0] }
    };

    const applyPositionTarget = (position: number[] | { x: number; y: number; z: number }, target: number[] | { x: number; y: number; z: number }) => {
      const controlsRef = (window as any).__orbitControlsRef;
      if (!controlsRef) return;
      const controls = controlsRef as any;
      const camera = controls.object;
      if (!camera || !controls) return;
      const p = Array.isArray(position) ? position : [position.x, position.y, position.z];
      const t = Array.isArray(target) ? target : [target.x, target.y, target.z];
      const scaleFactor = 4.67;
      const endPosition = new THREE.Vector3((p[0] || 0) * scaleFactor, (p[1] || 0) * scaleFactor, (p[2] || 0) * scaleFactor);
      const endTarget = new THREE.Vector3(t[0] || 0, t[1] || 0, t[2] || 0);
      const startPosition = camera.position.clone();
      const startTarget = controls.target.clone();
      let progress = 0;
      const duration = 600;
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        progress = Math.min(elapsed / duration, 1);
        const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        camera.position.lerpVectors(startPosition, endPosition, eased);
        controls.target.lerpVectors(startTarget, endTarget, eased);
        controls.update();
        if (progress < 1) requestAnimationFrame(animate);
      };
      animate();
    };

    const handleGoToCameraView = (event: any) => {
      const detail = event.detail;
      if (typeof detail === 'string') {
        const viewId = detail;
        if (defaultPositions[viewId]) {
          const { position, target } = defaultPositions[viewId];
          applyPositionTarget(position, target);
          return;
        }
        const modules = customizationModulesRef.current;
        const models = models3DRef.current;
        const modelId = selectedModel3DIdRef.current;
        const logoModule = modules.find((m: any) => m.contentType === 'logos');
        const viewLabels = logoModule?.viewLabels || logoModule?.config?.viewLabels || [];
        const viewConfig = viewLabels.find((v: any) => v.id === viewId);
        const cameraViewId = viewConfig?.cameraViewId;
        if (cameraViewId && modelId) {
          const selectedModel = models.find((m: any) => m.id === modelId);
          const cameraViews = selectedModel?.cameraViews || selectedModel?.camera_views || [];
          const cameraView = cameraViews.find((cv: any) => cv.id === cameraViewId);
          if (cameraView?.position && cameraView?.target) {
            applyPositionTarget(cameraView.position, cameraView.target);
            return;
          }
        }
        if (defaultPositions[viewId as keyof typeof defaultPositions]) {
          const { position, target } = defaultPositions[viewId as keyof typeof defaultPositions];
          applyPositionTarget(position, target);
        }
        return;
      }
      const { position, target } = detail || {};
      if (position && target) applyPositionTarget(position, target);
    };

    window.addEventListener('goToCameraView', handleGoToCameraView as any);
    window.addEventListener('setCameraView', handleGoToCameraView as any);
    return () => {
      window.removeEventListener('goToCameraView', handleGoToCameraView as any);
      window.removeEventListener('setCameraView', handleGoToCameraView as any);
    };
  }, []);

  // Fonctions de gestion des textes


  const addText = useCallback((content: string, position?: [number, number, number], defaultFontFamily?: string, category: 'text' | 'nom' | 'numero' = 'text', initialFontSize?: number, _zoneCategory?: string, rotation?: number) => {
    const resolvedPosition: [number, number, number] = position || [0.5, 0.5, 0];
    const resolvedFontSize = initialFontSize || 700;

    const newText = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content,
      position: resolvedPosition,
      fontSize: resolvedFontSize,
      color: '#000000',
      editable: true,
      rotation: typeof rotation === 'number' ? rotation : 0,
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
    setSelectedLogoId(null);
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
      setSelectedLogoId(null);
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
    if (id) setSelectedTextId(null);
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

  // État pour les modaux de confirmation de suppression (comme le builder)
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'text'; id: string; name: string } | { type: 'logo'; id: string; name: string } | null>(null);

  const confirmDeleteText = useCallback((id: string) => {
    const text = texts.find(t => t.id === id);
    if (text) setDeleteConfirm({ type: 'text', id, name: text.content || 'Texte vide' });
  }, [texts]);

  const confirmDeleteLogo = useCallback((id: string, name?: string) => {
    const logo = placedLogos.find(l => l.id === id);
    if (logo) setDeleteConfirm({ type: 'logo', id, name: name || 'Logo' });
  }, [placedLogos]);

  const executeDeleteAndClose = useCallback(() => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'text') {
      removeText(deleteConfirm.id);
      if (selectedTextId === deleteConfirm.id) setSelectedTextId(null);
    } else {
      removeLogo(deleteConfirm.id);
      if (selectedLogoId === deleteConfirm.id) setSelectedLogoId(null);
    }
    setDeleteConfirm(null);
  }, [deleteConfirm, removeText, removeLogo, selectedTextId, selectedLogoId]);

  // Calculer les valeurs pour le viewer 3D
  const viewerConfig = useMemo(() => {
    if (!selectedModel3DId) return null;

    const snapshot = product?.snapshot;
    const selectedModel = models3D.find(m => m.id === selectedModel3DId);
    const modelUrl = snapshot?.model3D?.url || selectedModel?.glb_url || selectedModel?.glbUrl || '';
    
    // Chercher le design sélectionné - Même logique que le builder (priorité aux selectedItems des modules)
    let designIdToUse: string | null = null;
    let designUrl: string | null = null;
    
    // 1. Vérifier les selectedItems des modules (comme le builder fait)
    customizationModules.forEach(module => {
      if (module.contentType === 'designs-2d' && module.selectedItems?.design2DId) {
        designIdToUse = module.selectedItems.design2DId;
      }
    });
    
    // 2. Sinon, vérifier le snapshot
    if (!designIdToUse) {
      if (snapshot?.design2D?.id) {
        designIdToUse = snapshot.design2D.id;
      } else if (snapshot?.defaultState?.design2DId) {
        designIdToUse = snapshot.defaultState.design2DId;
      }
    }
    
    // 3. Sinon, utiliser selectedDesign2DId
    if (!designIdToUse) {
      designIdToUse = selectedDesign2DId;
    }
    
    // Trouver le design pour selectedDesign
    const selectedDesign = designIdToUse ? designs2D.find(d => d.id === designIdToUse) : null;
    
    // Toujours utiliser le SVG brut depuis designs2D pour permettre le re-coloriage dynamique côté client
    // Priorité à selectedDesign (raw SVG) pour que le ModelViewer puisse appliquer designColors
    if (selectedDesign) {
      designUrl = selectedDesign.svg_url || selectedDesign.svgUrl || null;
      if (designUrl) console.log('✅ Design 2D (raw SVG pour couleurs dynamiques):', designUrl, 'ID:', selectedDesign.id);
    }
    if (!designUrl && snapshot?.design2D?.url) {
      designUrl = snapshot.design2D.url;
      console.log('✅ Fallback design 2D snapshot:', snapshot.design2D.url);
    }
    
    // DEBUG: Vérifier que l'URL est bien définie
    if (!designUrl) {
      console.warn('⚠️ Aucune URL de design 2D trouvée. Snapshot:', snapshot?.design2D, 'SelectedDesign:', selectedDesign);
    }
    
    // Calculer les couleurs pour le viewer 3D - Même logique que le builder
    let colorsForViewer: Record<string, string> = {};
    const allColors = colorPalettes.flatMap(p => p.colors || []);
    const colorModule = customizationModules.find((m: any) => m.contentType === 'colors');
    const allowedColorsFromModule = (colorModule as any)?.allowedColors || [];
    const colorLookup = [...allColors];
    allowedColorsFromModule.forEach((c: any) => {
      if (c && !colorLookup.find(x => x.id === (c.id || c.hex))) {
        colorLookup.push({ id: c.id || c.hex, hex: (c.hex || '').startsWith('#') ? c.hex : `#${c.hex}`, name: c.label || c.name });
      }
    });
    const normalizeColorKey = (k: string) => k.replace(/^--/, '').toLowerCase();
    const toHex = (v: string) => (typeof v === 'string' && v) ? (v.startsWith('#') ? v : `#${v}`) : '';
    const getHexFromColorId = (colorId: string): string | null => {
      if (!colorId || typeof colorId !== 'string') return null;
      const hexMatch = colorId.match(/#([0-9a-f]{3,6})$/i);
      if (hexMatch) return `#${hexMatch[1]}`;
      const color = colorLookup.find((c: any) => (c.id || '') === colorId || (c.hex || '').toLowerCase() === (colorId || '').toLowerCase().replace(/^#?/, '#'));
      return color?.hex ? ((color.hex || '').startsWith('#') ? color.hex : `#${color.hex}`) : null;
    };
    if (snapshot?.resolvedColors && Object.keys(snapshot.resolvedColors).length > 0) {
      Object.entries(snapshot.resolvedColors).forEach(([k, v]) => {
        const hex = toHex(v);
        if (hex) colorsForViewer[normalizeColorKey(k)] = hex;
      });
    }
    const designColorMappings = selectedDesign?.color_mappings || null;
    if (designColorMappings) {
      Object.entries(designColorMappings).forEach(([colorClass, mappedColorId]) => {
        const key = normalizeColorKey(colorClass);
        const overrideColorId = designColors[colorClass] || designColors[key];
        const colorIdToUse = overrideColorId || mappedColorId;
        const hex = getHexFromColorId(colorIdToUse);
        if (hex) colorsForViewer[key] = hex;
      });
    }
    if (Object.keys(designColors).length > 0) {
      Object.entries(designColors).forEach(([colorClass, colorId]) => {
        const hex = getHexFromColorId(colorId);
        if (hex) colorsForViewer[normalizeColorKey(colorClass)] = hex;
      });
    }
    
    // Material maps - priorité au snapshot (preview live) puis fallback sur model parts
    let materialMapsForModel: Record<string, any> = {};
    if (snapshot?.model3D?.materialMaps && Object.keys(snapshot.model3D.materialMaps).length > 0) {
      materialMapsForModel = snapshot.model3D.materialMaps;
    } else if (selectedModel?.parts) {
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
  }, [selectedModel3DId, models3D, customizationModules, selectedDesign2DId, designs2D, colorPalettes, designColors, modelMaterialMaps, product]);

  // Calculer les fonts à utiliser - Priorité au snapshot, puis aux fontGroups sélectionnés
  const fontsForViewer = useMemo(() => {
    // Priorité au snapshot s'il existe
    const snapshot = product?.snapshot;
    if (snapshot?.fonts && Array.isArray(snapshot.fonts) && snapshot.fonts.length > 0) {
      // S'assurer que toutes les fonts ont leurs URLs complètes
      return snapshot.fonts.map((font: any) => ({
        ...font,
        font_url: font.font_url || font.fontUrl || font.file_url,
        active: true
      }));
    }
    
    // Sinon, charger depuis les fontGroups sélectionnés dans les modules
    const allFonts: any[] = [];
    customizationModules.forEach(module => {
      if (module.contentType === 'texts' || module.contentType === 'text') {
        const fontGroupIds = (module as any).fontGroupIds || 
                           ((module as any).config as any)?.fontGroupIds || 
                           (module.selectedItems as any)?.fontGroupIds || 
                           [];
        fontGroups.forEach(group => {
          if (fontGroupIds.includes(group.id) && group.fonts) {
            group.fonts.forEach((font: any) => {
              if (!allFonts.find(f => f.id === font.id)) {
                allFonts.push(font);
              }
            });
          }
        });
      }
    });
    return allFonts;
  }, [product, customizationModules, fontGroups]);

  // addLogo pour le mode libre (ConfiguratorLogoPanel)
  const addLogoForConfigure = useCallback(async (
    logoId: string,
    variantId: string | undefined,
    variantFile: string,
    position: [number, number, number],
    category: 'torse' | 'dos' | 'bras-gauche' | 'bras-droit',
    zoneWidth?: number,
    zoneHeight?: number,
    zoneRotation?: number
  ) => {
    let scale = 0.1;
    let logoWidth: number | undefined;
    let logoHeight: number | undefined;
    if (zoneWidth && zoneHeight && zoneWidth > 0 && zoneHeight > 0) {
      try {
        let actualWidth = 0, actualHeight = 0;
        if (logoId === 'imported' || variantFile.startsWith('data:') || variantFile.startsWith('blob:')) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise<void>((resolve, reject) => {
            img.onload = () => { actualWidth = img.naturalWidth || img.width; actualHeight = img.naturalHeight || img.height; resolve(); };
            img.onerror = () => reject(new Error('Failed to load'));
            img.src = variantFile;
          });
        } else {
          const res = await fetch(variantFile);
          const svgText = await res.text();
          const parser = new DOMParser();
          const svg = parser.parseFromString(svgText, 'image/svg+xml').querySelector('svg');
          if (svg) {
            const vb = svg.getAttribute('viewBox')?.split(' ').map(parseFloat);
            actualWidth = parseFloat(svg.getAttribute('width') || '0') || (vb?.[2] ?? 100);
            actualHeight = parseFloat(svg.getAttribute('height') || '0') || (vb?.[3] ?? 100);
          }
        }
        if (actualWidth > 0 && actualHeight > 0) {
          logoWidth = actualWidth;
          logoHeight = actualHeight;
          const CANVAS_SIZE = 2048;
          const SCALE_FACTOR = 0.5;
          const zoneWidthPx = zoneWidth * CANVAS_SIZE;
          const zoneHeightPx = zoneHeight * CANVAS_SIZE;
          const targetW = zoneWidthPx * 0.8, targetH = zoneHeightPx * 0.8;
          scale = Math.min(targetW / (actualWidth * SCALE_FACTOR), targetH / (actualHeight * SCALE_FACTOR));
        }
      } catch {
        scale = 0.1;
      }
    }
    const newLogo = {
      id: `logo-${Date.now()}`,
      logoId,
      variantId: variantId ?? '',
      variantFile,
      position,
      scale,
      rotation: zoneRotation ?? 0,
      category,
      width: logoWidth,
      height: logoHeight,
    };
    setPlacedLogos((prev: any[]) => [...prev, newLogo]);
    setSelectedLogoId(newLogo.id);
    setSelectedTextId(null);
  }, [setPlacedLogos, setSelectedLogoId, setSelectedTextId]);

  // Contenu du panel Logo (ConfiguratorLogoPanel partagé avec le builder)
  const renderConfigureLogoPanelContent = useCallback(() => {
    const logoModule = customizationModules.find(m => m.contentType === 'logos');
    return (
      <ConfiguratorLogoPanel
        activeModule={logoModule ? { ...logoModule, contentType: 'logos' } : null}
        placedLogos={placedLogos}
        setPlacedLogos={setPlacedLogos}
        logoLibraries={logoLibraries}
        selectedLogoId={selectedLogoId}
        setSelectedLogoId={selectLogo}
        showLogoLibrary={showLogoLibrary}
        setShowLogoLibrary={setShowLogoLibrary}
        activeLogoView={activeLogoView}
        setActiveLogoView={(v) => setActiveLogoView(v)}
        logoSearchQuery={logoSearchQuery}
        setLogoSearchQuery={setLogoSearchQuery}
        selectedLogoForVariants={selectedLogoForVariants}
        setSelectedLogoForVariants={setSelectedLogoForVariants}
        logoToReplace={logoToReplace}
        setLogoToReplace={setLogoToReplace}
        hoveredLogoViewId={hoveredLogoViewId}
        setHoveredLogoViewId={setHoveredLogoViewId}
        isAddLogoHovered={isAddLogoHovered}
        setIsAddLogoHovered={setIsAddLogoHovered}
        models3D={models3D.map(m => ({ ...m, cameraViews: m.cameraViews || m.camera_views || [] }))}
        selectedModel3DId={selectedModel3DId}
        setShowLogoZoneModal={(v) => { if (!v) setShowZoneSelector(null); }}
        setSelectedLogoForZone={(v) => { if (v) { setShowZoneSelector({ logoId: v.logoId, variantId: v.variantId ?? 'base', variantFile: v.variantFile ?? '' }); setSelectedLogoZoneId(null); } }}
        onAddLogo={addLogoForConfigure}
        onRequestDeleteLogo={(id, name) => confirmDeleteLogo(id, name)}
      />
    );
  }, [customizationModules, placedLogos, selectedLogoId, selectLogo, logoLibraries, logoSearchQuery, showLogoLibrary, selectedLogoForVariants, logoToReplace, activeLogoView, hoveredLogoViewId, isAddLogoHovered, models3D, selectedModel3DId, confirmDeleteLogo, addLogoForConfigure]);

  // Quand un logo est sélectionné sur le 3D : ouvrir la bibliothèque en mode remplacement (comme le builder)
  // Pas de modal de zones : on remplace directement, l'onglet logos s'affiche via controlledActiveTab
  useEffect(() => {
    const logoModule = customizationModules.find(m => m.contentType === 'logos');
    if (!logoModule) return;
    // Lors d'un clic sur un logo 3D, selectedLogoId est défini et controlledActiveTab bascule sur logos
    const isLogosTabActive = activeCustomizerTab === logoModule.id || !!selectedLogoId;
    if (!isLogosTabActive) return;
    if (selectedLogoId) {
      const logo = placedLogos.find(l => l.id === selectedLogoId);
      if (logo && !logoToReplace) {
        setLogoToReplace(selectedLogoId);
        setShowLogoLibrary(true);
        setActiveCustomizerTab(logoModule.id); // S'assurer que l'onglet logos est actif
      }
    } else {
      if (logoToReplace && showLogoLibrary) {
        setShowLogoLibrary(false);
        setLogoToReplace(null);
        setSelectedLogoForVariants(null);
      }
    }
  }, [selectedLogoId, activeCustomizerTab, customizationModules, placedLogos, logoToReplace, showLogoLibrary]);

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

  // Canvas 3D - Même logique que le builder (IIFE, colorsForViewer inline, key avec colors)
  const renderConfigure3DCanvas = () => {
    return (() => {
      const snapshot = product?.snapshot;
      const selectedModel = selectedModel3DId ? models3D.find((m) => m.id === selectedModel3DId) : models3D[0];
      const modelUrl = snapshot?.model3D?.url || selectedModel?.glb_url || selectedModel?.glbUrl || '';
      const designIdToUse = customizationModules.find((m: any) => m.contentType === 'designs-2d')?.selectedItems?.design2DId
        || snapshot?.design2D?.id || selectedDesign2DId;
      const selectedDesign = designIdToUse ? designs2D.find((d) => d.id === designIdToUse) : null;
      const designUrl = selectedDesign?.svg_url || selectedDesign?.svgUrl || snapshot?.design2D?.url || null;
      const allColors = colorPalettes.flatMap((p) => p.colors || []);
      const colorModule = customizationModules.find((m: any) => m.contentType === 'colors');
      const allowedColorsFromModule = (colorModule as any)?.allowedColors || (snapshot?.customizationModules?.find((m: any) => m.contentType === 'colors') as any)?.allowedColors || [];
      const colorLookup = [...allColors];
      allowedColorsFromModule.forEach((c: any) => {
        if (c?.hex && !colorLookup.some((x: any) => (x.id || x.hex) === (c.id || c.hex))) {
          colorLookup.push({ id: c.id || c.hex, hex: (c.hex || '').startsWith('#') ? c.hex : `#${c.hex}` });
        }
      });
      const designColorMappings = selectedDesign?.color_mappings || null;
      let colorsForViewer: Record<string, string> = {};
      const getHexFromColorId = (colorId: string): string | null => {
        if (!colorId) return null;
        const hexMatch = String(colorId).match(/#([0-9a-f]{3,6})$/i);
        if (hexMatch) return `#${hexMatch[1]}`;
        const norm = (s: string) => (s || '').toLowerCase().replace(/^#?/, '#');
        const c = colorLookup.find((x: any) => (x.id || '') === colorId || (x.hex || '').toLowerCase() === norm(colorId));
        return c?.hex ? ((c.hex || '').startsWith('#') ? c.hex : `#${c.hex}`) : null;
      };
      if (designColorMappings) {
        Object.entries(designColorMappings).forEach(([colorClass, mappedColorId]) => {
          const overrideColorId = designColors[colorClass] || designColors[colorClass.toLowerCase()];
          const colorIdToUse = overrideColorId || mappedColorId;
          const hex = getHexFromColorId(colorIdToUse);
          if (hex) colorsForViewer[colorClass.toLowerCase()] = hex;
        });
      }
      if (Object.keys(designColors).length > 0) {
        Object.entries(designColors).forEach(([colorClass, colorId]) => {
          const hex = getHexFromColorId(colorId);
          if (hex) colorsForViewer[colorClass.toLowerCase()] = hex;
        });
      }
      if (Object.keys(colorsForViewer).length === 0 && snapshot?.resolvedColors) {
        Object.entries(snapshot.resolvedColors).forEach(([k, v]) => {
          const hex = (v || '').toString().startsWith('#') ? String(v) : `#${v}`;
          if (hex && hex !== '#') colorsForViewer[k.replace(/^--/, '').toLowerCase()] = hex;
        });
      }
      const materialMapsForModel = snapshot?.model3D?.materialMaps && Object.keys(snapshot.model3D.materialMaps).length > 0
        ? snapshot.model3D.materialMaps : {};
      if (!modelUrl) return <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>Modèle 3D non disponible</div>;
      return (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}>
          <Canvas
            key={`canvas-${selectedModel?.id || 'default'}`}
            camera={{ position: [0, 0, product?.snapshot?.cameraSettings?.initialZoom || 15], fov: 50 }}
            gl={{ preserveDrawingBuffer: true }}
            style={{ width: '100%', height: '100%' }}
          >
            <ambientLight intensity={0.4} color="#f5f5f5" />
            <directionalLight position={[12, 18, 12]} intensity={2.0} color="#ffffff" />
            <directionalLight position={[-8, 12, 8]} intensity={1.0} color="#f8f8ff" />
            <directionalLight position={[0, 8, -15]} intensity={1.2} color="#fafafa" />
            <Suspense fallback={null}>
              <ModelViewer
                key={`${modelUrl}-${designIdToUse || 'no-design'}`}
                url={modelUrl}
                color="#ffffff"
                designTexture={designUrl || undefined}
                materialMaps={Object.keys(materialMapsForModel).length > 0 ? materialMapsForModel : undefined}
                colors={colorsForViewer}
                selectedDesign={selectedDesign ? { id: selectedDesign.id, svgUrl: designUrl } : undefined}
              texts={texts}
              fonts={fontsForViewer}
              textZones={textZones}
              placedLogos={placedLogos}
              updateTextPosition={updateTextPosition}
              updateTextRotation={updateTextRotation}
              updateTextSize={updateTextSize}
              toggleTextLock={toggleTextLock}
              removeText={removeText}
              onRequestTextDelete={(id) => { const t = texts.find(x => x.id === id); if (t) setDeleteConfirm({ type: 'text', id, name: t.content || 'Texte vide' }); }}
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
              onRequestLogoDelete={(id) => { const l = placedLogos.find(x => x.id === id); if (l) setDeleteConfirm({ type: 'logo', id, name: l.logoId || 'Logo' }); }}
              toggleLogoLock={toggleLogoLock}
              setIsDraggingLogo={setIsDraggingLogo}
              isPlacingText={isPlacingText === 'text' ? 'nom' : isPlacingText}
              onTextPlaced={(category, position, zoneCategory, rotation) => {
                addText('Votre texte', position, undefined, category === 'numero' ? 'numero' : 'text', 700);
                setIsPlacingText(null);
              }}
            />
          </Suspense>
          <OrbitControls
            ref={(c) => { if (c) (window as any).__orbitControlsRef = c; }}
            enablePan enableZoom enableRotate
            minDistance={product?.snapshot?.cameraSettings?.minZoom || 5}
            maxDistance={product?.snapshot?.cameraSettings?.maxZoom || 25}
            zoomSpeed={product?.snapshot?.cameraSettings?.zoomSpeed}
            rotateSpeed={product?.snapshot?.cameraSettings?.rotateSpeed}
          />
        </Canvas>
      </div>
      );
    })();
  };

  return (
    <div
      className="configurator-panel configurator-viewer-isolated"
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: '#ffffff'
      }}
    >
      {/* Toggle Vue desktop / mobile (identique test-viewer) */}
      <div style={{ position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', gap: 4, padding: 4, backgroundColor: '#f9fafb', borderRadius: 10, border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <button type="button" onClick={() => setViewportMode('desktop')} title="Vue ordinateur" style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: viewportMode === 'desktop' ? '#000000' : 'transparent', color: viewportMode === 'desktop' ? '#ffffff' : '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>🖥️ Desktop</button>
        <button type="button" onClick={() => setViewportMode('mobile')} title="Vue téléphone" style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: viewportMode === 'mobile' ? '#000000' : 'transparent', color: viewportMode === 'mobile' ? '#ffffff' : '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>📱 Mobile</button>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
      <ProductConfiguratorPanel
        embedMode
        showTestSidebar={false}
        controlledMobile={viewportMode === 'mobile'}
        onSave={() => {}}
        onAddToCart={() => {}}
        canvasContent={renderConfigure3DCanvas()}
        designModuleFromBuilder={(() => {
          const designModule = customizationModules.find((m) => m.contentType === 'designs-2d');
          if (!designModule) return undefined;
          const snapshot = product?.snapshot;
          const snapshotModule = snapshot?.customizationModules?.find((m: any) => m.id === designModule.id);
          const allowedDesigns = snapshotModule?.allowedDesigns;
          let designs: any[];
          let selId = designModule.selectedItems?.design2DId || selectedDesign2DId;
          if (Array.isArray(allowedDesigns) && allowedDesigns.length > 0) {
            designs = allowedDesigns.map((d: any, i: number) => ({ id: d.id || `d-${i}`, name: d.label || d.name || `Design ${i + 1}`, label: d.label, svg_url: d.svgUrl, svgUrl: d.svgUrl, color_mappings: null }));
            if (!selId && snapshot?.design2D?.id) selId = snapshot.design2D.id;
            else if (!selId && designs.length) selId = designs[0].id;
          } else {
            const allowedIds = designModule.selectedItems?.design2DIds || [];
            designs = allowedIds.length ? designs2D.filter((d) => allowedIds.includes(d.id)) : designs2D;
            selId = designModule.selectedItems?.design2DId || selectedDesign2DId;
          }
          const colorModule = customizationModules.find((m) => m.contentType === 'colors');
          const palette = colorPalettes.find((p) => p.id === colorModule?.selectedItems?.colorPaletteId) || colorPalettes[0];
          const paletteColors = (palette?.colors || []).map((c: any, i: number) => ({ id: c.id || `${palette?.id}-${i}`, name: c.name || '', hex: (c.hex || '#000000').toLowerCase() }));
          return {
            tabName: designModule.tabName || 'Design',
            icon: designModule.icon,
            iconUrl: designModule.iconUrl,
            designs,
            paletteColors: paletteColors.length ? paletteColors : [{ id: 'default', name: 'Noir', hex: '#000000' }],
            selectedDesignId: selId,
            onSelectDesign: (id: string) => {
              setSelectedDesign2DId(id);
              setCustomizationModules(customizationModules.map((m) => m.contentType === 'designs-2d' ? { ...m, selectedItems: { ...m.selectedItems, design2DId: id } } : m));
            },
          };
        })()}
        colorsModuleFromBuilder={(() => {
          const colorModule = customizationModules.find((m) => m.contentType === 'colors');
          if (!colorModule) return undefined;
          const paletteId = colorModule.selectedItems?.colorPaletteId || colorModule.config?.paletteId;
          const palette = paletteId ? colorPalettes.find((p) => p.id === paletteId) : null;
          const allowedColors = (colorModule as any).allowedColors || [];
          const normHex = (h: string) => {
            let s = (h || '#000000').toString().trim().toLowerCase();
            if (!s.startsWith('#')) s = '#' + s;
            return /^#[0-9a-f]{3}$/i.test(s) ? '#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3] : s;
          };
          let paletteColorsList = palette
            ? (palette.colors || []).map((c: any, i: number) => ({ id: c.id || `${palette.id}-${i}`, name: c.name || '', hex: normHex(c.hex) }))
            : allowedColors.map((c: any, i: number) => ({ id: c.id || c.hex || `c-${i}`, name: c.label || c.name || '', hex: normHex(c.hex) }));
          const seen = new Set(paletteColorsList.map((p: any) => p.hex?.toLowerCase()));
          allowedColors.forEach((c: any) => {
            const hex = normHex(c.hex);
            const id = c.id || c.hex || hex;
            if (hex && !seen.has(hex.toLowerCase()) && !paletteColorsList.some((p: any) => p.id === id)) {
              paletteColorsList = [...paletteColorsList, { id, name: c.label || c.name || '', hex }];
              seen.add(hex.toLowerCase());
            }
          });
          if (!paletteColorsList.length) return undefined;
          const ordinalColors = ['primary', 'secondary', 'tertiary', 'quaternary', 'quinary'];
          const designIdToUse = customizationModules.find((m) => m.contentType === 'designs-2d')?.selectedItems?.design2DId || selectedDesign2DId;
          const selectedDesign = designs2D.find((d) => d.id === designIdToUse);
          const mappingKeys = selectedDesign?.color_mappings ? Object.keys(selectedDesign.color_mappings).filter((c) => ordinalColors.includes(c.toLowerCase())) : [];
          const colorClassesList = mappingKeys.length ? mappingKeys : ['primary', 'secondary', 'tertiary'];
          const colorClasses = colorClassesList.map((id) => ({ id, label: colorModule.colorClassLabels?.[id] ?? (id === 'primary' ? 'Principal' : id === 'secondary' ? 'Secondaire' : id === 'tertiary' ? 'Tertiaire' : id.charAt(0).toUpperCase() + id.slice(1)) }));
          const resolvedColorHex = (viewerConfig?.colors && Object.keys(viewerConfig.colors).length > 0)
            ? viewerConfig.colors
            : product?.snapshot?.resolvedColors
              ? Object.fromEntries(
                  Object.entries(product.snapshot.resolvedColors).map(([k, v]) => [k.replace(/^--/, '').toLowerCase(), (v || '').toString().startsWith('#') ? (v as string) : `#${(v as string)}`])
                )
              : undefined;
          Object.entries(designColors || {}).forEach(([colorClass, colorId]) => {
            if (colorId && !paletteColorsList.some((p: any) => p.id === colorId || p.hex?.toLowerCase() === colorId?.toLowerCase())) {
              const hex = resolvedColorHex?.[colorClass.toLowerCase()] ?? (colorId.startsWith('#') ? colorId : null);
              if (hex) paletteColorsList = [...paletteColorsList, { id: colorId, name: '', hex: normHex(hex) }];
            }
          });
          return {
            tabName: colorModule.tabName || 'Couleur',
            icon: colorModule.icon,
            iconUrl: colorModule.iconUrl,
            paletteColors: paletteColorsList,
            colorClasses,
            designColors,
            resolvedColorHex: resolvedColorHex && Object.keys(resolvedColorHex).length > 0 ? resolvedColorHex : undefined,
            onDesignColorsChange: (colorClass: string, colorId: string) => {
              setDesignColors((prev) => ({ ...prev, [colorClass]: colorId }));
              if (selectedDesign) {
                setDesigns2D(designs2D.map((d) => d.id === selectedDesign.id ? { ...d, color_mappings: { ...(d.color_mappings || {}), [colorClass]: colorId } } : d));
              }
            },
          };
        })()}
        textModuleFromBuilder={(() => {
          const textModule = customizationModules.find((m) => m.contentType === 'text' || m.contentType === 'texts');
          if (!textModule) return undefined;
          const textPalette = colorPalettes.find((p) => p.id === textModule.textColorPaletteId);
          const strokePalette = textModule.textStrokePaletteId ? colorPalettes.find((p) => p.id === textModule.textStrokePaletteId) : null;
          const paletteColors = (textPalette?.colors || []).map((c: any, i: number) => ({ id: c.id || `c-${i}`, name: c.name || '', hex: (c.hex || '#000000').toLowerCase() }));
          if (!paletteColors.length) paletteColors.push({ id: 'default', name: 'Noir', hex: '#000000' });
          const strokeColors = strokePalette && strokePalette.id !== textPalette?.id ? (strokePalette.colors || []).map((c: any, i: number) => ({ id: c.id || `s-${i}`, name: c.name || '', hex: (c.hex || '#000000').toLowerCase() })) : undefined;
          const allowedFontGroupIds = textModule?.selectedItems?.fontGroupIds;
          const visibleFonts = (() => {
            const all: any[] = [];
            fontGroups.forEach((group: any) => {
              if (group.fonts) {
                group.fonts.forEach((f: any) => {
                  if (!allowedFontGroupIds?.length || allowedFontGroupIds.includes(group.id)) {
                    all.push({ id: f.id, name: f.name || f.id, display_name: f.display_name || f.name, font_url: f.font_url || f.file_url || f.url });
                  }
                });
              }
            });
            return all;
          })();
          const mappedTexts = texts.map((t: any) => ({ id: t.id, content: t.content || '', fontFamily: t.fontFamily, color: t.color ? String(t.color).toLowerCase() : undefined, fillType: t.fillType || 'solid', gradientColors: t.gradientColors, gradientDirection: t.gradientDirection || 'horizontal', strokeColor: t.strokeColor ? String(t.strokeColor).toLowerCase() : undefined, strokeWidth: t.strokeWidth, deformation: t.deformation || 'aucune', deformationIntensity: t.deformationIntensity ?? 0 }));
          return {
            tabName: textModule.tabName || 'Texte',
            icon: textModule.icon,
            iconUrl: textModule.iconUrl,
            texts: mappedTexts,
            selectedTextId,
            onSelectText: selectText,
            onUpdateText: (id: string, patch: any) => { const p = { ...patch }; if (p.color) p.color = p.color.toLowerCase(); if (p.strokeColor) p.strokeColor = p.strokeColor?.toLowerCase(); updateText(id, p); },
            onRemoveText: (id: string) => { const t = texts.find(x => x.id === id); if (t) setDeleteConfirm({ type: 'text', id, name: t.content || 'Texte vide' }); },
            onAddText: () => {
              const textModule = customizationModules.find(m => m.contentType === 'text' || m.contentType === 'texts');
              const textPlacementMode = (textModule as any)?.textPlacementMode || (textModule as any)?.config?.textPlacementMode;
              if (textPlacementMode === 'zones') {
                setShowTextZoneModal(true);
                setSelectedTextZoneId(null);
                setTextInputValue('');
              } else {
                setIsPlacingText((prev) => (prev ? null : 'text'));
              }
            },
            colors: paletteColors,
            strokeColors: strokeColors?.length ? strokeColors : undefined,
            fonts: visibleFonts,
            enabledTabs: { contenu: textModule.enableTextContent !== false, police: textModule.enableTextFont !== false, couleur: textModule.enableTextColor !== false, contour: textModule.enableTextStroke !== false, deformation: textModule.enableTextDeformation !== false },
            enabledDeformationIds: textModule.textEnabledDeformations?.length ? textModule.textEnabledDeformations : undefined,
            addTextLabel: textModule.addTextButtonLabel || 'Ajouter un texte',
            placedTextsLabel: textModule.placedTextsLabel || 'Textes ajoutés',
            strokeMinWidthPx: Math.max(0, Number(textModule.textStrokeMinWidth ?? 0)),
            strokeMaxWidthPx: Math.max(50, Number(textModule.textStrokeMaxWidth ?? 50)),
          } satisfies TextModuleFromBuilder;
        })()}
        logoPanelContent={renderConfigureLogoPanelContent()}
        orderedModulesFromBuilder={customizationModules.map((m) => ({ id: m.id, name: m.tabName || m.id, icon: m.icon, iconUrl: m.iconUrl, contentType: m.contentType ?? null }))}
        controlledActiveTab={selectedTextId ? (customizationModules.find((m) => m.contentType === 'text' || m.contentType === 'texts')?.id ?? '') : selectedLogoId ? (customizationModules.find((m) => m.contentType === 'logos')?.id ?? '') : (activeCustomizerTab || '')}
        onControlledTabChange={(id) => {
          setActiveCustomizerTab(id);
          const logoMod = customizationModules.find((m) => m.contentType === 'logos');
          if (logoMod && id !== logoMod.id) setSelectedLogoId(null);
          const textMod = customizationModules.find((m) => m.contentType === 'text' || m.contentType === 'texts');
          if (textMod && id !== textMod.id) setSelectedTextId(null);
        }}
      />
      </div>
      {showZoneSelector && (() => {
        const logoModule = customizationModules.find(m => m.contentType === 'logos');
        const logoZoneGroupIds = (logoModule as any)?.selectedItems?.logoZoneGroupIds || (logoModule as any)?.config?.logoZoneGroupIds || [];
        let availableZones = zoneGroups
          .filter((g: any) => logoZoneGroupIds.includes(g.id))
          .flatMap((g: any) => (g.zones || []).map((z: any) => ({ ...z, groupName: g.name })));
        return typeof document !== 'undefined' && createPortal(
          <div
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 999999
            }}
            onClick={() => { setShowZoneSelector(null); setSelectedLogoZoneId(null); }}
          >
            <div
              className="zone-selection-modal-content"
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                padding: '32px',
                width: '90%',
                maxWidth: '700px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                color: '#111827',
                fontFamily: CONFIGURATOR_PANEL_FONT
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <style>{`
                .zone-selection-modal-content button:not([style*="background-color: #000"]):not([style*="background-color:#000"]):not(.zone-confirm-button) { color: #111827 !important; }
                .zone-selection-modal-content button[style*="background-color: #000"],
                .zone-selection-modal-content button[style*="background-color:#000"],
                .zone-selection-modal-content .zone-confirm-button { color: #ffffff !important; }
              `}</style>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', fontFamily: CONFIGURATOR_PANEL_FONT, margin: 0 }}>
                  {logoModule?.addLogoButtonLabel || 'Placer un logo'}
                </h2>
                <button
                  type="button"
                  onClick={() => { setShowZoneSelector(null); setSelectedLogoZoneId(null); }}
                  style={{ background: 'none', border: 'none', color: '#666666', fontSize: 24, cursor: 'pointer', padding: 0, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
                >
                  ×
                </button>
              </div>
              {availableZones.length === 0 ? (
                <p style={{ color: '#666', fontSize: '14px', fontFamily: CONFIGURATOR_PANEL_FONT, padding: '12px' }}>
                  Aucune zone disponible. Veuillez sélectionner des groupes de zones dans les paramètres du module.
                </p>
              ) : (
                <>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#000000', fontFamily: CONFIGURATOR_PANEL_FONT, marginBottom: '16px' }}>
                    Choisissez une position standard
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
                    {availableZones.map((zone: any) => {
                      const isSelected = selectedLogoZoneId === zone.id;
                      return (
                        <div
                          key={zone.id}
                          onClick={() => setSelectedLogoZoneId(zone.id)}
                          style={{
                            position: 'relative',
                            cursor: 'pointer',
                            border: isSelected ? '3px solid #000000' : '1px solid #e0e0e0',
                            borderRadius: 8,
                            overflow: 'hidden',
                            backgroundColor: '#ffffff',
                            transition: 'all 0.2s'
                          }}
                        >
                          {isSelected && (
                            <div style={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, backgroundColor: '#000000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                              <svg width="14" height="14" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
                            </div>
                          )}
                          <div style={{ width: '100%', height: 140, backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 8 }}>
                            {(zone.thumbnailUrl || zone.thumbnail_url) ? (
                              <img src={zone.thumbnailUrl || zone.thumbnail_url} alt={zone.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', filter: 'grayscale(100%)' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', backgroundColor: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#111827', textAlign: 'center', padding: 8 }}>{zone.name}</div>
                            )}
                          </div>
                          <div style={{ padding: '12px', textAlign: 'center', backgroundColor: '#ffffff' }}>
                            <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: '#111827', fontFamily: CONFIGURATOR_PANEL_FONT }}>{zone.name}{zone.view ? ` (${zone.view})` : ''}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {selectedLogoZoneId && (
                    <button
                      type="button"
                      onClick={async () => {
                        const zone = availableZones.find((z: any) => z.id === selectedLogoZoneId);
                        if (zone && showZoneSelector) {
                          const viewToCategory: Record<string, 'torse' | 'dos' | 'bras-gauche' | 'bras-droit'> = { 'Face': 'torse', 'Dos': 'dos', 'Gauche': 'bras-gauche', 'Droite': 'bras-droit' };
                          const cat = zone.view ? viewToCategory[zone.view] : 'torse';
                          const pos: [number, number, number] = [zone.position?.[0] ?? 0.5, 1 - (zone.position?.[1] ?? 0.5), zone.position?.[2] ?? 0];
                          const zoneWidth = zone.width;
                          const zoneHeight = zone.height;
                          const zoneRotation = zone.defaultRotation != null ? zone.defaultRotation * (Math.PI / 180) : undefined;
                          await addLogoForConfigure(showZoneSelector.logoId, showZoneSelector.variantId === 'base' ? undefined : showZoneSelector.variantId, showZoneSelector.variantFile, pos, cat, zoneWidth, zoneHeight, zoneRotation);
                        }
                        setShowZoneSelector(null);
                        setSelectedLogoZoneId(null);
                      }}
                      className="zone-confirm-button"
                      style={{
                        width: '100%',
                        padding: '10px 20px',
                        backgroundColor: '#000000',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: '14px',
                        fontFamily: CONFIGURATOR_PANEL_FONT,
                        fontWeight: 500,
                        cursor: 'pointer',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      Confirmer
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        , document.body);
      })()}
      {showTextZoneModal && (() => {
        const textModule = customizationModules.find(m => m.contentType === 'text' || m.contentType === 'texts');
        if (!textModule) return null;
        const textZoneGroupIds = (textModule as any)?.zoneGroupIds || (textModule as any)?.config?.zoneGroupIds || (textModule as any)?.selectedItems?.zoneGroupIds || [];
        const availableZones = zoneGroups
          .filter((g: any) => textZoneGroupIds.includes(g.id))
          .flatMap((g: any) => (g.zones || []).map((z: any) => ({ ...z, groupName: g.name })));
        return typeof document !== 'undefined' && createPortal(
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 999999
            }}
            onClick={() => { setShowTextZoneModal(false); setSelectedTextZoneId(null); setTextInputValue(''); }}
          >
            <div
              className="zone-selection-modal-content"
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                padding: '32px',
                width: '90%',
                maxWidth: '700px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                color: '#111827',
                fontFamily: CONFIGURATOR_PANEL_FONT
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <style>{`
                .zone-selection-modal-content input,
                .zone-selection-modal-content label,
                .zone-selection-modal-content h2,
                .zone-selection-modal-content h3,
                .zone-selection-modal-content p { color: #111827 !important; }
              `}</style>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', fontFamily: CONFIGURATOR_PANEL_FONT, margin: 0 }}>
                  {(textModule as any)?.addTextButtonLabel || 'Ajouter un texte'}
                </h2>
                <button
                  type="button"
                  onClick={() => { setShowTextZoneModal(false); setSelectedTextZoneId(null); setTextInputValue(''); }}
                  style={{ background: 'none', border: 'none', color: '#666666', fontSize: 24, cursor: 'pointer', padding: 0, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
                >
                  ×
                </button>
              </div>
              {availableZones.length === 0 ? (
                <p style={{ color: '#666', fontSize: '14px', fontFamily: CONFIGURATOR_PANEL_FONT, padding: '12px' }}>
                  Aucune zone disponible. Veuillez sélectionner des groupes de zones dans les paramètres du module.
                </p>
              ) : (
                <>
                  <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#000000', fontFamily: CONFIGURATOR_PANEL_FONT, marginBottom: '16px' }}>
                      Choisissez une position standard
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      {availableZones.map((zone: any) => {
                        const isSelected = selectedTextZoneId === zone.id;
                        const thumbUrl = zone.thumbnail_url || zone.thumbnailUrl;
                        return (
                          <div
                            key={zone.id}
                            onClick={() => { setSelectedTextZoneId(zone.id); setTextInputValue(''); }}
                            style={{
                              position: 'relative',
                              cursor: 'pointer',
                              border: isSelected ? '3px solid #000000' : '1px solid #e0e0e0',
                              borderRadius: 8,
                              overflow: 'hidden',
                              backgroundColor: '#ffffff',
                              transition: 'all 0.2s'
                            }}
                          >
                            {isSelected && (
                              <div style={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, backgroundColor: '#000000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                                <svg width="14" height="14" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
                              </div>
                            )}
                            <div style={{ width: '100%', height: 140, backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 8 }}>
                              {thumbUrl ? (
                                <img src={thumbUrl} alt={zone.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', filter: 'grayscale(100%)' }} />
                              ) : (
                                <div style={{ width: '100%', height: '100%', backgroundColor: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#111827', textAlign: 'center', padding: 8 }}>{zone.name}</div>
                              )}
                            </div>
                            <div style={{ padding: '12px', textAlign: 'center', backgroundColor: '#ffffff' }}>
                              <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: '#111827', fontFamily: CONFIGURATOR_PANEL_FONT }}>{zone.name}{zone.view ? ` (${zone.view})` : ''}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#000000', fontFamily: CONFIGURATOR_PANEL_FONT, marginBottom: '12px' }}>
                      Contenu du texte
                    </h3>
                    <input
                      type="text"
                      value={textInputValue}
                      onChange={(e) => setTextInputValue(e.target.value)}
                      placeholder="Saisir l'inscription ici..."
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #d1d5db',
                        borderRadius: 6,
                        fontSize: '14px',
                        fontFamily: CONFIGURATOR_PANEL_FONT,
                        color: '#111827',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={() => { setShowTextZoneModal(false); setSelectedTextZoneId(null); setTextInputValue(''); }}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#f3f4f6',
                        border: '1px solid #e5e7eb',
                        borderRadius: 8,
                        fontSize: '14px',
                        fontFamily: CONFIGURATOR_PANEL_FONT,
                        color: '#374151',
                        cursor: 'pointer',
                        fontWeight: 500,
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      disabled={!textInputValue.trim() || !selectedTextZoneId}
                      onClick={() => {
                        const zone = availableZones.find((z: any) => z.id === selectedTextZoneId);
                        if (zone && textInputValue.trim()) {
                          const viewToCategory: Record<string, 'torse' | 'dos' | 'bras-gauche' | 'bras-droit'> = { 'Face': 'torse', 'Dos': 'dos', 'Gauche': 'bras-gauche', 'Droite': 'bras-droit', 'front': 'torse', 'back': 'dos', 'left': 'bras-gauche', 'right': 'bras-droit' };
                          const cat = zone.view ? viewToCategory[zone.view] || 'torse' : 'torse';
                          const pos: [number, number, number] = [zone.position?.[0] ?? 0.5, 1 - (zone.position?.[1] ?? 0.5), zone.position?.[2] ?? 0];
                          // Rotation de la zone (deg → rad). Pour les zones "dos", si pas de rotation définie, ajouter 180° pour orienter le texte vers la caméra
                          const zoneViewRaw = zone.view || (zone as any).zone_category || '';
                          const isBackZone = /dos|back/i.test(String(zoneViewRaw));
                          let zoneRotationRaw = (zone as any).rotation ?? zone.default_rotation ?? zone.defaultRotation;
                          if (zoneRotationRaw == null && isBackZone) zoneRotationRaw = 180;
                          if (zoneRotationRaw == null) zoneRotationRaw = 0;
                          const zoneRotationRad = zoneRotationRaw * (Math.PI / 180);
                          const CANVAS_SIZE = 2048;
                          const SCALE_FACTOR = 0.5;
                          // width/height en UV space (0-1); fallback default_text_width/height si pixels → diviser par CANVAS_SIZE
                          let zoneWidth = (zone as any).width;
                          let zoneHeight = (zone as any).height;
                          if (zoneWidth == null && zone.default_text_width != null) zoneWidth = zone.default_text_width / CANVAS_SIZE;
                          if (zoneHeight == null && zone.default_text_height != null) zoneHeight = zone.default_text_height / CANVAS_SIZE;
                          if (zoneWidth == null) zoneWidth = 0.1;
                          if (zoneHeight == null) zoneHeight = 0.1;
                          const zoneWidthPx = zoneWidth * CANVAS_SIZE;
                          const zoneHeightPx = zoneHeight * CANVAS_SIZE;
                          const availableWidth = zoneWidthPx * 0.8;
                          const availableHeight = zoneHeightPx * 0.8;
                          const estimatedCharWidth = 0.6;
                          const textLen = textInputValue.length || 1;
                          const fontSizeFromWidth = (availableWidth / textLen) / estimatedCharWidth / SCALE_FACTOR;
                          const fontSizeFromHeight = availableHeight / SCALE_FACTOR;
                          const calculatedFontSize = Math.min(fontSizeFromWidth, fontSizeFromHeight);
                          const finalFontSize = Math.max(100, Math.min(2000, calculatedFontSize));
                          addText(textInputValue.trim(), pos, undefined, 'text', finalFontSize, undefined, zoneRotationRad);
                          // Pivoter la caméra vers la vue correspondant à la zone (ex: dos → back)
                          const viewMap: Record<string, 'front' | 'back' | 'left' | 'right'> = { 'torse': 'front', 'dos': 'back', 'bras-gauche': 'left', 'bras-droit': 'right', 'Face': 'front', 'Dos': 'back', 'Gauche': 'left', 'Droite': 'right', 'front': 'front', 'back': 'back', 'left': 'left', 'right': 'right' };
                          const zoneView = zone.view || (zone as any).zone_category;
                          const cameraView = zoneView ? viewMap[zoneView] || viewMap[(zoneView as string).toLowerCase()] : undefined;
                          if (cameraView) {
                            setTimeout(() => window.dispatchEvent(new CustomEvent('setCameraView', { detail: cameraView })), 50);
                          }
                        }
                        setShowTextZoneModal(false);
                        setSelectedTextZoneId(null);
                        setTextInputValue('');
                      }}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: (!textInputValue.trim() || !selectedTextZoneId) ? '#cccccc' : '#000000',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: '14px',
                        fontFamily: CONFIGURATOR_PANEL_FONT,
                        color: '#ffffff',
                        cursor: (!textInputValue.trim() || !selectedTextZoneId) ? 'not-allowed' : 'pointer',
                        fontWeight: 500,
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      Confirmer
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        , document.body);
      })()}
      {deleteConfirm && typeof document !== 'undefined' && createPortal(
        <div className="configurator-panel-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000000 }} onClick={() => setDeleteConfirm(null)}>
          <div className="configurator-panel-modal" style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '32px', width: '90%', maxWidth: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🗑️</div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#111827', fontFamily: CONFIGURATOR_PANEL_FONT, margin: 0, textAlign: 'center' }}>Supprimer l&apos;élément ?</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: '#6b7280', fontFamily: CONFIGURATOR_PANEL_FONT, margin: 0 }}>
                Êtes-vous sûr de vouloir supprimer {deleteConfirm.type === 'logo' ? 'le logo' : 'le texte'} &quot;{deleteConfirm.name}&quot; ?
              </p>
              <p style={{ fontSize: 14, color: '#6b7280', fontFamily: CONFIGURATOR_PANEL_FONT, margin: 0 }}>Cette action ne peut pas être annulée.</p>
            </div>
            <div style={{ display: 'flex', gap: 12, width: '100%' }}>
              <button type="button" onClick={() => setDeleteConfirm(null)} className="btn-primary" style={{ flex: 1, padding: '10px 16px', backgroundColor: '#f3f4f6', color: '#111827', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', fontFamily: CONFIGURATOR_PANEL_FONT, fontWeight: 600 }}>Annuler</button>
              <button type="button" onClick={() => { executeDeleteAndClose(); }} className="btn-primary mobile-action-btn-black" style={{ flex: 1, padding: '10px 16px', backgroundColor: '#000000', color: '#ffffff', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: CONFIGURATOR_PANEL_FONT, fontWeight: 600 }}>Supprimer</button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
}
