"use client";

import { Suspense, useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { ModelViewer } from "@/components/ModelViewer";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

// Constante pour la font du configurator-panel
const CONFIGURATOR_PANEL_FONT = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const CONFIGURATOR_PANEL_PRIMARY_COLOR = '#3b82f6';

// Style global pour forcer les couleurs de texte dans le configurator-panel
// IMPORTANT: Scoper UNIQUEMENT au .configurator-panel pour ne pas affecter le reste de la page
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
    .configurator-panel p,
    .configurator-panel span:not([style*="color: #ffffff"]):not([style*="color:#ffffff"]):not([style*="color: white"]):not([style*="color:white"]),
    .configurator-panel div:not([style*="background"]):not([style*="backgroundColor"]):not([style*="color: #ffffff"]):not([style*="color:#ffffff"]),
    .configurator-panel h1,
    .configurator-panel h2,
    .configurator-panel h3,
    .configurator-panel h4,
    .configurator-panel h5,
    .configurator-panel h6,
    .configurator-panel label {
      color: #111827 !important;
      -webkit-text-fill-color: #111827 !important;
      -webkit-text-stroke-color: #111827 !important;
    }
    .configurator-panel input,
    .configurator-panel textarea,
    .configurator-panel select {
      color: #111827 !important;
      -webkit-text-fill-color: #111827 !important;
      -webkit-text-stroke-color: #111827 !important;
    }
    .configurator-panel *:not(button[style*="backgroundColor: '#000"]):not(button[style*="backgroundColor:'#000"]):not(button[style*="backgroundColor: '#000000"]):not(button[style*="backgroundColor:'#000000"]):not(button[style*="backgroundColor: black"]):not(button[style*="backgroundColor:black"]):not([style*="color: #fff"]):not([style*="color:#fff"]):not([style*="color: '#fff'"]):not([style*="color:'#fff'"]):not([style*="color: '#ffffff'"]):not([style*="color:'#ffffff'"]):not([style*="color: white"]):not([style*="color:white"]):not(.btn-primary *):not(.mobile-action-btn-black *) {
      color: #111827 !important;
      -webkit-text-fill-color: #111827 !important;
      -webkit-text-stroke-color: #111827 !important;
    }
    .configurator-panel button:not(.btn-primary):not(.mobile-action-btn-black):not([style*="backgroundColor: '#3b82f6"]):not([style*="backgroundColor: '#000"]) * {
      color: #111827 !important;
      -webkit-text-fill-color: #111827 !important;
      -webkit-text-stroke-color: #111827 !important;
    }
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
          
          // Charger les customizationModules depuis snapshot ou builder_data
          const snapshot = productData.snapshot;
          const builderData = productData.builder_data;
          
          // Priorité au snapshot s'il existe, sinon builder_data
          const modules = snapshot?.customizationModules || builderData?.customizationModules || [];
          setCustomizationModules(modules);
          
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
          let design2DId = null;
          const designModule = modules.find((m: any) => 
            (m.contentType === 'designs-2d' || m.type === 'designs-2d') && m.selectedItems?.design2DId
          );
          if (designModule?.selectedItems?.design2DId) {
            design2DId = designModule.selectedItems.design2DId;
          } else if (snapshot?.design2D?.id) {
            design2DId = snapshot.design2D.id;
          } else if (defaultState?.design2DId) {
            design2DId = defaultState.design2DId;
          } else if (builderData?.design2DId) {
            design2DId = builderData.design2DId;
          }
          setSelectedDesign2DId(design2DId);
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

  // Charger les zones de texte à partir du snapshot ou des groupes de zones sélectionnés dans les modules
  useEffect(() => {
    async function loadTextZones() {
      // Priorité au snapshot s'il existe
      const snapshot = product?.snapshot;
      if (snapshot?.textZones && Array.isArray(snapshot.textZones) && snapshot.textZones.length > 0) {
        setTextZones(snapshot.textZones);
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

  // Fonctions de gestion des textes
  // Fonction SCOPÉE pour forcer les styles UNIQUEMENT dans le configurator-panel
  const forceConfiguratorPanelStyles = useCallback((element?: Element) => {
    // Fonction pour vérifier si un élément appartient au configurator-panel ou à ses modaux
    const isInConfiguratorPanel = (el: Element): boolean => {
      const panel = document.querySelector('.configurator-panel');
      if (!panel) return false;
      
      // Vérifier si l'élément est dans le panel
      if (panel.contains(el)) return true;
      
      // Vérifier si l'élément est dans un modal du configurator
      const isInModal = el.closest('.configurator-panel-modal') !== null ||
                       el.closest('.zone-selection-modal-content') !== null ||
                       el.classList.contains('configurator-panel-modal') ||
                       el.classList.contains('zone-selection-modal-content');
      
      return isInModal;
    };
    
    // Vérifier d'abord que le panel existe
    const panel = document.querySelector('.configurator-panel');
    if (!panel) return;
    
    // Traiter le panel ET tous les modaux même en dehors
    const modals = document.querySelectorAll('.configurator-panel-modal, .zone-selection-modal-content');
    
    const targets: Element[] = [];
    if (element && isInConfiguratorPanel(element)) {
      targets.push(element);
    } else {
      targets.push(panel);
      modals.forEach(modal => targets.push(modal));
    }
    
    if (targets.length === 0) return;

    // Traiter chaque cible et tous ses enfants
    targets.forEach(target => {
      if (!isInConfiguratorPanel(target)) return;
      
      const allElements = target.querySelectorAll('*');
      const elementsToProcess = [target, ...Array.from(allElements)];
      
      elementsToProcess.forEach((el: Element) => {
        const htmlEl = el as HTMLElement;
        if (!htmlEl) return;
        
        if (!isInConfiguratorPanel(el)) return;
        
        // FORCER les styles pour les inputs dans les modaux
        if (htmlEl.tagName === 'INPUT' && (htmlEl.closest('.zone-selection-modal-content') || htmlEl.closest('.configurator-panel-modal'))) {
          htmlEl.style.setProperty('background-color', '#ffffff', 'important');
          htmlEl.style.setProperty('color', '#111827', 'important');
          htmlEl.style.setProperty('-webkit-text-fill-color', '#111827', 'important');
          htmlEl.style.setProperty('-webkit-text-stroke-color', '#111827', 'important');
        }
        
        // FORCER les labels du background remover en noir
        if (htmlEl.classList.contains('background-remover-label')) {
          htmlEl.style.setProperty('color', '#111827', 'important');
          htmlEl.style.setProperty('-webkit-text-fill-color', '#111827', 'important');
          htmlEl.style.setProperty('-webkit-text-stroke-color', '#111827', 'important');
        }
        
        // FORCER TOUS les textes en noir dans le configurator-panel (sauf boutons avec texte blanc)
        if ((htmlEl.tagName === 'P' || htmlEl.tagName === 'SPAN' || htmlEl.tagName === 'DIV' || htmlEl.tagName === 'LABEL' || htmlEl.tagName === 'H1' || htmlEl.tagName === 'H2' || htmlEl.tagName === 'H3' || htmlEl.tagName === 'H4' || htmlEl.tagName === 'H5' || htmlEl.tagName === 'H6')) {
          // Vérifier si c'est un bouton avec texte blanc
          const isWhiteTextButton = htmlEl.closest('button') && (
            htmlEl.closest('button')?.classList.contains('btn-primary') ||
            htmlEl.closest('button')?.classList.contains('mobile-action-btn-black') ||
            (htmlEl.closest('button')?.getAttribute('style') || '').includes('backgroundColor: \'#3b82f6\'') ||
            (htmlEl.closest('button')?.getAttribute('style') || '').includes('backgroundColor: \'#000000\'')
          );
          
          if (!isWhiteTextButton) {
            htmlEl.style.setProperty('color', '#111827', 'important');
            htmlEl.style.setProperty('-webkit-text-fill-color', '#111827', 'important');
            htmlEl.style.setProperty('-webkit-text-stroke-color', '#111827', 'important');
          }
        }
        
        // FORCER BLEU sur les boutons primaires ET FORCER TEXTE BLANC
        if (htmlEl.tagName === 'BUTTON') {
          if (htmlEl.classList.contains('color-circle-button')) {
            return;
          }
          
          const buttonTitle = htmlEl.getAttribute('title') || '';
          if (buttonTitle === 'Vue ordinateur' || buttonTitle === 'Vue téléphone') {
            htmlEl.style.setProperty('background-color', '#ffffff', 'important');
            return;
          }
          
          const reactBgColor = htmlEl.style.backgroundColor || htmlEl.style.getPropertyValue('background-color');
          const inlineStyle = htmlEl.getAttribute('style') || '';
          
          const isPrimaryButton = reactBgColor === 'rgb(59, 130, 246)' ||
                                 reactBgColor === '#3b82f6' ||
                                 reactBgColor === 'rgb(0, 0, 0)' || 
                                 reactBgColor === '#000000' || 
                                 reactBgColor === 'black' ||
                                 htmlEl.classList.contains('btn-primary') ||
                                 htmlEl.classList.contains('mobile-action-btn-black') ||
                                 inlineStyle.includes('backgroundColor: \'#3b82f6\'') ||
                                 inlineStyle.includes('background-color: #3b82f6') ||
                                 inlineStyle.includes('backgroundColor: \'#000000\'') ||
                                 inlineStyle.includes('background-color: #000000');
          
          const isColorButton = inlineStyle.includes('color?.hex') || 
                               htmlEl.getAttribute('data-color-button') === 'true' ||
                               htmlEl.closest('[class*="color"]') !== null;
          
          if (isPrimaryButton && !isColorButton) {
            htmlEl.style.setProperty('background-color', '#3b82f6', 'important');
            htmlEl.style.setProperty('color', '#ffffff', 'important');
            htmlEl.style.setProperty('-webkit-text-fill-color', '#ffffff', 'important');
            
            const children = htmlEl.querySelectorAll('*');
            children.forEach((child: Element) => {
              const childEl = child as HTMLElement;
              childEl.style.setProperty('color', '#ffffff', 'important');
              childEl.style.setProperty('-webkit-text-fill-color', '#ffffff', 'important');
            });
          }
        }
      });
    });
  }, []);

  // Utiliser useEffect avec MutationObserver pour détecter les changements DOM
  useEffect(() => {
    const panel = document.querySelector('.configurator-panel');
    if (!panel) return;

    const checkAndForce = () => {
      const currentPanel = document.querySelector('.configurator-panel');
      if (!currentPanel) return;
      forceConfiguratorPanelStyles();
    };

    checkAndForce();

    const isConfiguratorElement = (element: Element): boolean => {
      return panel.contains(element) || 
             element.classList.contains('configurator-panel') ||
             element.classList.contains('configurator-panel-modal') ||
             element.classList.contains('zone-selection-modal-content') ||
             (element.closest('.configurator-panel-modal') !== null) ||
             (element.closest('.zone-selection-modal-content') !== null);
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (isConfiguratorElement(element)) {
                forceConfiguratorPanelStyles(element);
              }
            }
          });
        }
        
        if (mutation.type === 'attributes') {
          const target = mutation.target as HTMLElement;
          const isConfiguratorModal = target.classList.contains('configurator-panel-modal') ||
              target.classList.contains('zone-selection-modal-content') ||
              target.closest('.configurator-panel-modal') !== null ||
              target.closest('.zone-selection-modal-content') !== null;
          
          if (isConfiguratorModal) {
            forceConfiguratorPanelStyles(target);
          }
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    const interval = setInterval(() => {
      const currentPanel = document.querySelector('.configurator-panel');
      if (!currentPanel) return;
      forceConfiguratorPanelStyles();
      
      const modals = document.querySelectorAll('.configurator-panel-modal, .zone-selection-modal-content');
      modals.forEach(modal => {
        forceConfiguratorPanelStyles(modal);
      });
    }, 300);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, [forceConfiguratorPanelStyles, customizationModules, activeCustomizerTab, selectedLogoId, texts, placedLogos]);

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
    
    // Chercher le design sélectionné - Priorité au snapshot, puis aux selectedItems des modules
    let designIdToUse: string | null = null;
    let designUrl: string | null = null;
    const snapshot = product?.snapshot;
    
    // 1. Vérifier le snapshot d'abord - utiliser directement l'URL si disponible
    if (snapshot?.design2D?.url) {
      designUrl = snapshot.design2D.url;
      designIdToUse = snapshot.design2D.id || null;
    } else if (snapshot?.design2D?.id) {
      designIdToUse = snapshot.design2D.id;
    } else if (snapshot?.defaultState?.design2DId) {
      designIdToUse = snapshot.defaultState.design2DId;
    }
    
    // 2. Sinon, vérifier les selectedItems des modules
    if (!designUrl && !designIdToUse) {
      customizationModules.forEach(module => {
        if (module.contentType === 'designs-2d' && module.selectedItems?.design2DId) {
          designIdToUse = module.selectedItems.design2DId;
        }
      });
    }
    
    // 3. Sinon, utiliser selectedDesign2DId
    if (!designUrl && !designIdToUse) {
      designIdToUse = selectedDesign2DId;
    }
    
    // Si on n'a pas encore l'URL, chercher le design par ID
    if (!designUrl && designIdToUse) {
      const selectedDesign = designs2D.find(d => d.id === designIdToUse);
      designUrl = selectedDesign?.svg_url || selectedDesign?.svgUrl || null;
    }
    
    // Calculer les couleurs - Priorité aux resolvedColors du snapshot
    let colorsForViewer: Record<string, string> = {};
    
    // 1. Utiliser resolvedColors du snapshot si disponible (déjà calculées)
    if (snapshot?.resolvedColors && Object.keys(snapshot.resolvedColors).length > 0) {
      colorsForViewer = snapshot.resolvedColors;
    } else {
      // 2. Sinon, calculer depuis le design
      const selectedDesign = designs2D.find(d => d.id === designIdToUse);
      const designColorMappings = selectedDesign?.color_mappings || null;
      const allColors = colorPalettes.flatMap(p => p.colors || []);
      
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
    
    // Trouver le design pour selectedDesign
    const selectedDesign = designIdToUse ? designs2D.find(d => d.id === designIdToUse) : null;
    
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
      return snapshot.fonts;
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
                
                const selectedColorId = designColors[selectedColorClass] || selectedDesign?.color_mappings?.[selectedColorClass];
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
                        const currentColorId = designColors[colorClass] || selectedDesign?.color_mappings?.[colorClass];
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
            const textZoneGroupIds = (activeModule as any).zoneGroupIds || 
                                     ((activeModule as any).config as any)?.textZoneGroupIds || 
                                     (activeModule.selectedItems as any)?.textZoneGroupIds || 
                                     [];
            const category = textZoneGroupIds.length > 0 ? 'text' : 'text';
            const filteredZones = textZones.filter((zone: any) => 
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
                const textZoneGroupIds = (activeModule as any).zoneGroupIds || 
                                         ((activeModule as any).config as any)?.textZoneGroupIds || 
                                         (activeModule.selectedItems as any)?.textZoneGroupIds || 
                                         [];
                const category = textZoneGroupIds.length > 0 ? 'text' : 'text';
                const filteredZones = textZones.filter((zone: any) => 
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
                    {filteredZones.map((zone: any) => (
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
                    const zone = textZones.find((z: any) => z.id === selectedZone);
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
                    const zone = textZones.find((z: any) => z.id === selectedZone);
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
    let content: React.JSX.Element | null = null;
    
    // Fonction helper pour garantir un retour JSX.Element
    const ensureJSX = (element: React.JSX.Element | null): React.JSX.Element => {
      return element || <div style={{ padding: '16px' }}>Aucun contenu disponible</div>;
    };
    
    // Type de retour explicite pour le IIFE
    let result: React.JSX.Element;
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
        </div>
      );
    }
    }
    
    // Code par défaut : afficher la liste des logos placés (si showLogoLibrary est false)
    if (!content) {
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
    
    // Si content est défini (bibliothèque de logos ouverte), retourner content
    if (content) {
      result = content;
    } else {
      // Sinon, retourner le contenu par défaut avec les boutons et la liste des logos placés
      // content est déjà défini par le if (!content) plus haut, donc on peut le retourner directement
      // S'assurer de toujours retourner un JSX.Element
      result = ensureJSX(content);
    }
    
    return result;
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
            flexDirection: viewportMode === 'mobile' ? 'column' : 'row',
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
            {/* Canvas 3D - prend l'espace restant */}
            <div style={{ flex: '1 1 0%', minHeight: 0, position: 'relative', overflow: 'hidden', width: '100%', height: '100%' }}>
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
                  fonts={fontsForViewer}
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

            {/* Barre mobile en bas du téléphone - Style stretchmx */}
            {viewportMode === 'mobile' && (
              <div style={{ 
                flexShrink: 0, 
                backgroundColor: '#ffffff', 
                borderTop: '1px solid #e5e7eb', 
                color: '#111827'
              }}>
            <style>{`
              [style*="backgroundColor: '#ffffff'"] [style*="flexShrink: 0"] *,
              [style*="backgroundColor: '#ffffff'"] [style*="flexShrink: 0"] span {
                color: #111827 !important;
              }
            `}</style>
            {/* Onglets des modules */}
            <div style={{ display: 'flex', padding: '8px 4px', gap: '2px', color: '#111827' }}>
              <style>{`
                .mobile-tab-btn,
                .mobile-tab-btn span {
                  color: inherit !important;
                }
                .mobile-tab-btn[style*="color"] span {
                  color: inherit !important;
                }
              `}</style>
              {customizationModules.length > 0 ? (
                customizationModules.map((module) => {
                  const isActive = mobileActivePanel === module.id;
                  return (
                    <button
                      key={module.id}
                      className="mobile-tab-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const newPanel = isActive ? null : module.id;
                        setMobileActivePanel(newPanel);
                        // Si on ouvre un module, on l'active aussi dans la sidebar desktop
                        if (newPanel) {
                          setActiveCustomizerTab(newPanel);
                        }
                      }}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px 4px',
                        borderRadius: '8px',
                        backgroundColor: isActive ? '#f3f4f6' : 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: isActive ? '#111827' : '#6b7280'
                      }}
                    >
                      <div style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
                        {module.iconUrl ? (
                          <img src={module.iconUrl} alt={module.tabName} style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                        ) : (
                          <span style={{ fontSize: '18px' }}>{module.icon || '🎨'}</span>
                        )}
                      </div>
                      <span style={{ fontSize: '10px', color: isActive ? '#111827' : '#6b7280', fontWeight: isActive ? '600' : '400', fontFamily: CONFIGURATOR_PANEL_FONT }}>
                        {module.tabName || 'Module'}
                      </span>
                    </button>
                  );
                })
              ) : (
                <>
                  {['Design', 'Couleur', 'Texte', 'Logo'].map((name, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 4px', color: '#111827' }}>
                      <span style={{ fontSize: '18px', marginBottom: '4px' }}>{['🎨', '🎨', '✏️', '🖼️'][i]}</span>
                      <span style={{ fontSize: '10px', color: '#6b7280', fontFamily: CONFIGURATOR_PANEL_FONT }}>{name}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
            {/* Barre d'actions - Toujours réserver l'espace pour éviter le redimensionnement du Canvas */}
            <div style={{ display: 'flex', padding: '8px 12px 12px', gap: '8px', visibility: mobileActivePanel ? 'hidden' : 'visible', height: mobileActivePanel ? 'auto' : 'auto', minHeight: '60px' }}>
              <button className="mobile-action-btn" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '12px', fontWeight: '500', color: '#374151', cursor: 'pointer', fontFamily: CONFIGURATOR_PANEL_FONT, boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', transition: 'all 0.2s ease' }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                Sauvegarder
              </button>
              <button className="btn-primary mobile-action-btn" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', backgroundColor: '#3b82f6', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '500', color: '#ffffff', cursor: 'pointer', fontFamily: CONFIGURATOR_PANEL_FONT, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', transition: 'all 0.2s ease' }}>
                <svg width="14" height="14" fill="none" stroke="#ffffff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} stroke="#ffffff" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                <span style={{ color: '#ffffff' }}>Ajouter au panier</span>
              </button>
            </div>
          </div>
            )}
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
      </div>
    </div>
  );
}
