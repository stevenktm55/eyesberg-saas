"use client";

import { Suspense, useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { ModelViewer } from "@/components/ModelViewer";
import { ShopifyAddToCart } from "@/components/ShopifyAddToCart";
import { useShopifyIntegration, AddToCartSuccess } from "@/hooks/useShopifyIntegration";
import { useShopifyCustomer } from "@/hooks/useShopifyCustomer";
import { ShopifyLoginModal } from "@/components/ShopifyLoginModal";
import SizeSelectionModal from "@/components/SizeSelectionModal";
import { LinkedProductPromptModal } from "@/components/LinkedProductPromptModal";
import Image from "next/image";

// Interface pour les zones de texte
interface TextZone {
  id: string;
  name: string;
  position: [number, number, number];
  color: string;
  image?: string; // Chemin vers l'image de la vignette
  categories?: string[]; // Catégories: 'text', 'nom', 'numero'
  zoneCategory?: string;
  view?: 'front' | 'back' | 'left' | 'right';
  designId?: string | null;
  defaultTextWidth?: number;
  defaultTextHeight?: number;
}

type LinkedProductLink = {
  id: string;
  primary_product_id: string;
  primary_design_id: string | null;
  linked_product_id: string;
  linked_design_id: string | null;
  linked_variant_id: string | null;
  auto_apply_colors: boolean;
};

const normalizeShopifyProductId = (
  value: string | number | null | undefined
): string | null => {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const sanitized = raw.split('?')[0].split('#')[0];
  const gidMatch = sanitized.match(/Product(?:Variant)?\/(\d+)/i);
  if (gidMatch) return gidMatch[1];
  const digitsMatch = sanitized.match(/(\d{5,})$/);
  if (digitsMatch) return digitsMatch[1];
  return sanitized;
};

const isSameShopifyProductId = (
  a: string | number | null | undefined,
  b: string | number | null | undefined
): boolean => {
  if (a === b) return true;
  const normA = normalizeShopifyProductId(a);
  const normB = normalizeShopifyProductId(b);
  if (normA && normB) {
    return normA === normB;
  }
  return (
    (a ?? null) !== null &&
    (b ?? null) !== null &&
    String(a) === String(b)
  );
};

const isLinkedPrefillParam = (value?: string | null) =>
  value === 'linked' || value === 'linked_done';

// Hook pour charger les zones de texte depuis l'API
function useTextZones(selectedDesignId?: string | null) {
  const [zones, setZones] = useState<TextZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadZones() {
      try {
        const url = selectedDesignId ? `/api/text-zones?designId=${encodeURIComponent(selectedDesignId)}` : '/api/text-zones';
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setZones(data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des zones:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadZones();
  }, [selectedDesignId]);

  return { zones, isLoading };
}

// Interface pour les polices
interface FontItem {
  id: string;
  name: string; // nom du fichier
  display_name: string; // nom d'affichage
  font_url: string;
  format: string;
  category?: string;
  active: boolean;
  letter_spacing?: number;
  created_at: string;
  updated_at: string;
}

// Hook pour charger les polices depuis l'API
function useFonts() {
  const [fonts, setFonts] = useState<FontItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Éviter les appels multiples si les polices sont déjà chargées
    if (fonts.length > 0) {
      return;
    }
    
    async function loadFonts() {
      try {
        const response = await fetch('/api/fonts');
        if (response.ok) {
          const data = await response.json();
          // Pour les numéros, mettre "Race" en premier si présente
          const raceFirst = [...data].sort((a: any, b: any) => {
            const an = (a.display_name || a.name || '').toLowerCase();
            const bn = (b.display_name || b.name || '').toLowerCase();
            const aIsRace = an === 'race';
            const bIsRace = bn === 'race';
            if (aIsRace && !bIsRace) return -1;
            if (!aIsRace && bIsRace) return 1;
            return 0;
          });
          setFonts(raceFirst);
          
          // Vider le cache des polices existantes et forcer le rechargement
          document.fonts.clear();
          
          // Charger dynamiquement les polices dans le document avec un timestamp pour forcer le rechargement
          const fontPromises = data.map((font: FontItem) => {
            // Ajouter un timestamp pour forcer le rechargement des polices modifiées
            const fontUrlWithTimestamp = `${font.font_url}?v=${Date.now()}`;
            const fontFace = new FontFace(font.display_name, `url(${fontUrlWithTimestamp})`);
            
            return fontFace.load().then(() => {
              document.fonts.add(fontFace);
              
              // Injecter le style CSS directement dans le DOM pour forcer l'application
              const style = document.createElement('style');
              style.textContent = `
                @font-face {
                  font-family: '${font.display_name}';
                  src: url('${fontUrlWithTimestamp}');
                  font-display: swap;
                }
              `;
              document.head.appendChild(style);
              
              // Ne plus déclencher d'événements pour éviter les boucles infinies
              return font;
            }).catch(err => {
              console.error('❌ Erreur lors du chargement de la police:', font.display_name, err);
              return null;
            });
          });
          
          // Attendre que toutes les polices soient chargées
          Promise.all(fontPromises).then(() => {
            console.log('🎯 Toutes les polices sont chargées');
            
            // Approche simplifiée pour le chargement des polices sur mobile
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            if (isMobile) {
              console.log('📱 Mobile détecté - chargement simplifié des polices');
              
              // Créer un canvas de test pour forcer le chargement des polices
              const testCanvas = document.createElement('canvas');
              const testCtx = testCanvas.getContext('2d');
              
              data.forEach((font: FontItem) => {
                // Méthode 1: Style @font-face simple
                const style = document.createElement('style');
                style.textContent = `
                  @font-face {
                    font-family: '${font.display_name}';
                    src: url('${font.font_url}?v=${Date.now()}') format('woff2');
                    font-display: swap;
                    font-weight: normal;
                    font-style: normal;
                  }
                `;
                document.head.appendChild(style);
                
                // Méthode 2: Test immédiat sur canvas pour forcer le chargement
                if (testCtx) {
                  testCtx.font = `16px "${font.display_name}"`;
                  testCtx.fillText('test', 0, 0);
                }
              });
              
              // Attendre un peu puis tester toutes les polices
              setTimeout(() => {
                data.forEach((font: FontItem) => {
                  if (testCtx) {
                    testCtx.font = `16px "${font.display_name}"`;
                    const width = testCtx.measureText('test').width;
                  }
                });
              }, 2000); // Augmenté à 2 secondes
            }
            
            // Ne plus déclencher d'événements pour éviter les boucles infinies
            console.log('📱 Polices chargées - pas de re-render forcé');
          });
        }
      } catch (error) {
        console.error('Erreur lors du chargement des polices:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadFonts();
  }, []);

  return { fonts, isLoading };
}

// Hook pour charger les polices filtrées par catégorie
function useFilteredFonts(category: 'names' | 'numbers' | 'all') {
  const [fonts, setFonts] = useState<FontItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Éviter les appels multiples si les polices sont déjà chargées
    if (fonts.length > 0) {
      return;
    }
    
    async function loadFilteredFonts() {
      try {
        const url = category === 'all' ? '/api/fonts' : `/api/fonts?category=${category}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setFonts(data);
          
          // Vider le cache des polices existantes et forcer le rechargement
          document.fonts.clear();
          
          // Charger dynamiquement les polices dans le document avec un timestamp pour forcer le rechargement
          const fontPromises = data.map((font: FontItem) => {
            // Ajouter un timestamp pour forcer le rechargement des polices modifiées
            const fontUrlWithTimestamp = `${font.font_url}?v=${Date.now()}`;
            const fontFace = new FontFace(font.display_name, `url(${fontUrlWithTimestamp})`);
            
            return fontFace.load().then(() => {
              document.fonts.add(fontFace);
              
              // Injecter le style CSS directement dans le DOM pour forcer l'application
              const style = document.createElement('style');
              style.textContent = `
                @font-face {
                  font-family: '${font.display_name}';
                  src: url('${fontUrlWithTimestamp}');
                  font-display: swap;
                }
              `;
              document.head.appendChild(style);
              
              // Ne plus déclencher d'événements pour éviter les boucles infinies
              return font;
            }).catch(err => {
              console.error('❌ Erreur lors du chargement de la police:', font.display_name, err);
              return null;
            });
          });
          
          // Attendre que toutes les polices soient chargées
          Promise.all(fontPromises).then(() => {
            console.log(`🎯 Toutes les polices (${category}) sont chargées`);
            
            // Approche simplifiée pour le chargement des polices sur mobile
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            if (isMobile) {
              console.log(`📱 Mobile détecté (${category}) - chargement simplifié des polices`);
              
              // Créer un canvas de test pour forcer le chargement des polices
              const testCanvas = document.createElement('canvas');
              const testCtx = testCanvas.getContext('2d');
              
              data.forEach((font: FontItem) => {
                // Méthode 1: Style @font-face simple
                const style = document.createElement('style');
                style.textContent = `
                  @font-face {
                    font-family: '${font.display_name}';
                    src: url('${font.font_url}?v=${Date.now()}') format('woff2');
                    font-display: swap;
                    font-weight: normal;
                    font-style: normal;
                  }
                `;
                document.head.appendChild(style);
                
                // Méthode 2: Test immédiat sur canvas pour forcer le chargement
                if (testCtx) {
                  testCtx.font = `16px "${font.display_name}"`;
                  testCtx.fillText('test', 0, 0);
                }
              });
              
              // Attendre un peu puis tester toutes les polices
              setTimeout(() => {
                data.forEach((font: FontItem) => {
                  if (testCtx) {
                    testCtx.font = `16px "${font.display_name}"`;
                    const width = testCtx.measureText('test').width;
                  }
                });
              }, 2000); // Augmenté à 2 secondes
            }
            
            // Ne plus déclencher d'événements pour éviter les boucles infinies
          });
        }
      } catch (error) {
        console.error(`Erreur lors du chargement des polices (${category}):`, error);
      } finally {
        setIsLoading(false);
      }
    }
    loadFilteredFonts();
  }, [category]);

  return { fonts, isLoading };
}

// Interface pour les logos
interface LogoVariant {
  id: string;
  name: string;
  file: string;
}

interface Logo {
  id: string;
  name: string;
  tags?: string[];
  variants: LogoVariant[];
}

// Hook pour charger les logos depuis l'API
function useLogos(selectedDesignId?: string | null) {
  const [logos, setLogos] = useState<Logo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [libraries, setLibraries] = useState<Array<{id: string; name: string}>>([]);

  useEffect(() => {
    async function loadLogos() {
      try {
        const url = selectedDesignId ? `/api/logos?designId=${encodeURIComponent(selectedDesignId)}` : '/api/logos';
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setLogos(data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des logos:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadLogos();
  }, [selectedDesignId]);

  return { logos, isLoading };
}

// Hook pour charger automatiquement le modèle associé au produit
function useAutoLoadModel(forcedModelId?: string | null, forcedModelUrl?: string | null, productId?: string | null) {
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [textureMaps, setTextureMaps] = useState<Record<string, string> | null>(null);
  const [materialMaps, setMaterialMaps] = useState<Record<string, any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [modelId, setModelId] = useState<string | null>(null);

  useEffect(() => {
    async function loadModel() {
      try {
        // Chargement des modèles
        
        // Si on a une URL de modèle forcée (depuis une config sauvegardée), l'utiliser directement
        if (forcedModelUrl) {
          console.log('🔍 Chargement modèle depuis configuration - URL:', forcedModelUrl, 'ID:', forcedModelId);
          // Utilisation du modèle depuis la configuration sauvegardée
          setModelUrl(forcedModelUrl);
          
          // Charger les texture maps et material maps du modèle
          if (forcedModelId) {
            const res = await fetch('/api/models');
            const models = await res.json();
            const selectedModel = models.find((m: any) => m.id === forcedModelId);
            if (selectedModel) {
              console.log('✅ Modèle trouvé - ID:', selectedModel.id, 'materialMaps:', Object.keys(selectedModel.materialMaps || {}));
              setTextureMaps(selectedModel.textureMaps || null);
              setMaterialMaps(selectedModel.materialMaps || null);
              setModelId(selectedModel.id);
            } else {
              console.warn('⚠️ Modèle non trouvé avec ID:', forcedModelId);
              setTextureMaps(null);
              setMaterialMaps(null);
            }
          } else {
            console.warn('⚠️ Aucun modelId fourni pour charger les materialMaps');
            setTextureMaps(null);
            setMaterialMaps(null);
          }
          
          setIsLoading(false);
          return;
        }
        
        // Charger tous les modèles
        const response = await fetch('/api/models');
        const models = await response.json();
        
        let chosen = null;
        
        // Si on a un productId, chercher le modèle associé via product_mappings
        if (productId && !forcedModelId) {
          const mappingResponse = await fetch(`/api/product-mappings?shopify_product_id=${encodeURIComponent(productId)}`);
          if (mappingResponse.ok) {
            const mappingData = await mappingResponse.json();
            if (mappingData && mappingData.model_id) {
              chosen = models.find((m: any) => m.id === mappingData.model_id);
            }
          }
        }
        
        // Si aucun modèle trouvé via le mapping, utiliser le modèle forcé ou le premier disponible
        if (!chosen && models.length > 0) {
          chosen = forcedModelId ? models.find((m: any) => m.id === forcedModelId) : models[0];
        }
        
        if (chosen) {
          // Modèle sélectionné
          setModelId(chosen.id);
          setModelUrl(chosen.glbUrl);
          setTextureMaps(chosen.textureMaps || null);
          setMaterialMaps(chosen.materialMaps || null);
        } else {
          console.warn('⚠️ Aucun modèle disponible');
        }
      } catch (error) {
        console.error('Erreur lors du chargement des modèles:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadModel();
  }, [forcedModelId, forcedModelUrl, productId]);

  // Sync en continu des materialMaps du modèle sélectionné
  useEffect(() => {
    if (!modelId) return;
    let mounted = true;
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/models');
        const models = await res.json();
        const current = models.find((m: any) => m.id === modelId);
        if (!current) return;

        const nextMaterialMaps = current.materialMaps || null;
        const nextTextureMaps = current.textureMaps || null;

        const mmChanged = JSON.stringify(nextMaterialMaps) !== JSON.stringify(materialMaps);
        const tmChanged = JSON.stringify(nextTextureMaps) !== JSON.stringify(textureMaps);

        if (mounted && (mmChanged || tmChanged)) {
          console.log('🔄 Sync materialMaps/textureMaps depuis API (configure)');
          if (tmChanged) setTextureMaps(nextTextureMaps);
          if (mmChanged) setMaterialMaps(nextMaterialMaps);
        }
      } catch (e) {
        console.warn('⚠️ Sync materialMaps échoué:', e);
      }
    }, 2000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [modelId, materialMaps, textureMaps]);

  return { modelUrl, textureMaps, materialMaps, modelId, isLoading };
}

// Hook pour gérer la sélection de design
function useDesignSelection() {
  const [selectedDesign, setSelectedDesign] = useState<{
    id: string | null;
    svgUrl: string | null;
    model_type?: 'maillot' | 'pantalon';
  }>({ id: null, svgUrl: null });

  const selectDesign = (design: { id: string; svgUrl: string; model_type?: 'maillot' | 'pantalon' } | null) => {
    console.log('🎯 selectDesign appelé avec:', design);
    // selectDesign appelé
    if (design) {
      console.log('🎯 model_type du design reçu:', design.model_type);
      setSelectedDesign({ id: design.id, svgUrl: design.svgUrl, model_type: design.model_type });
      console.log('✅ selectedDesign mis à jour avec model_type:', design.model_type);
    } else {
      setSelectedDesign({ id: null, svgUrl: null });
      // selectedDesign mis à jour vers null
    }
  };

  return { selectedDesign, selectDesign };
}

// Hook pour gérer les couleurs
function useColorSelection() {
  const [colors, setColors] = useState<Record<string, string>>({});

  // Fonction pour générer des variantes de couleurs (clair/foncé)
  const generateColorVariants = (hex: string) => {
    // Convertir hex en RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };

    // Convertir RGB en hex
    const rgbToHex = (r: number, g: number, b: number) => {
      return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    };

    // Fonction pour mélanger avec blanc (éclaircir)
    const lighten = (hex: string, amount: number) => {
      const rgb = hexToRgb(hex);
      if (!rgb) return hex;
      const r = Math.round(rgb.r + (255 - rgb.r) * amount);
      const g = Math.round(rgb.g + (255 - rgb.g) * amount);
      const b = Math.round(rgb.b + (255 - rgb.b) * amount);
      return rgbToHex(r, g, b);
    };

    // Fonction pour mélanger avec noir (assombrir)
    const darken = (hex: string, amount: number) => {
      const rgb = hexToRgb(hex);
      if (!rgb) return hex;
      const r = Math.round(rgb.r * (1 - amount));
      const g = Math.round(rgb.g * (1 - amount));
      const b = Math.round(rgb.b * (1 - amount));
      return rgbToHex(r, g, b);
    };

    return {
      base: hex,
      light: lighten(hex, 0.3), // 30% plus clair
      dark: darken(hex, 0.3)    // 30% plus foncé
    };
  };

  const normalizeColorKey = (key: string) =>
    key.replace(/^--/, '').replace(/\s+/g, '-').toLowerCase();

  const updateColor = (colorType: string, color: string) => {
    const normalizedKey = normalizeColorKey(colorType);
    setColors(prev => ({
      ...prev,
      [normalizedKey]: color
    }));
    
    // Générer les variantes et les appliquer comme variables CSS
    const variants = generateColorVariants(color);
    
    // Appliquer les variables CSS sur le conteneur SVG (si disponible)
    // Note: Les variables CSS sont maintenant injectées directement dans le SVG par ModelViewer
    console.log(`🎨 Couleur ${normalizedKey} mise à jour:`, {
      [`--${normalizedKey}`]: variants.base,
      [`--${normalizedKey}-light`]: variants.light,
      [`--${normalizedKey}-dark`]: variants.dark
    });
  };

  // Fonction pour réinitialiser les couleurs (vide l'objet)
  const resetColors = () => {
    setColors({});
  };

  const replaceColors = (newColors: Record<string, string>) => {
    const normalizedEntries = Object.entries(newColors || {}).reduce<Record<string, string>>(
      (acc, [key, value]) => {
        if (typeof value === 'string' && value.trim()) {
          acc[normalizeColorKey(key)] = value;
        }
        return acc;
      },
      {}
    );
    setColors(normalizedEntries);
  };

  return { colors, updateColor, resetColors, replaceColors };
}
// Hook pour gérer le texte
  function useTextSelection(onTextSelectionChange?: (textId: string | null, autoOpenTypography: boolean) => void) {
  const lockToggleRef = useRef<Map<string, boolean>>(new Map());
  const [texts, setTexts] = useState<Array<{
    id: string;
    content: string;
    position: [number, number, number];
    fontSize: number;
    color: string;
    editable: boolean;
      rotation: number; // Rotation en degrés
      locked?: boolean; // Verrouillage du texte
      category: 'text' | 'nom' | 'numero'; // Catégorie du texte
      zoneCategory?: 'torse' | 'dos' | 'bras-gauche' | 'bras-droit';
      fontFamily?: string;
      strokeColor?: string;
      strokeWidth?: number;
      deformation?: string; // Type de déformation (arc, flag, wave, etc.)
      deformationIntensity?: number; // Intensité de la déformation (-100 à 100)
      fillType?: 'solid' | 'gradient';
      gradientColors?: string[];
      gradientDirection?: 'horizontal' | 'vertical';
  }>>([]);
    const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
    const [isDraggingText, setIsDraggingText] = useState(false);

   const addText = (content: string, position?: [number, number, number], defaultFontFamily?: string, category: 'text' | 'nom' | 'numero' = 'text', initialFontSize?: number, zoneCategory?: 'torse' | 'dos' | 'bras-gauche' | 'bras-droit', initialRotation?: number) => {
     console.log('🔧 addText appelé avec:', { content, position, defaultFontFamily, category, initialFontSize, zoneCategory, initialRotation });
     const isNameOrNumber = category === 'nom' || category === 'numero';
      const resolvedPosition: [number, number, number] = position
        ? [position[0], position[1], position[2] ?? 0]
        : [0.5, 0.5, 0];

      const newText = {
     id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content,
        position: resolvedPosition,
        fontSize: initialFontSize ?? 700,
        color: isNameOrNumber ? '#ffffff' : '#000000',
        editable: true,
        rotation: initialRotation ?? 0, // Rotation par défaut de la zone
        category, // Catégorie du texte
        zoneCategory,
        fontFamily: defaultFontFamily,
        strokeColor: isNameOrNumber ? '#000000' : '#000000',
        strokeWidth: 0.1, // 10% par défaut (UI en %)
        deformation: 'none',
        deformationIntensity: 0,
        fillType: 'solid',
        gradientColors: [isNameOrNumber ? '#ffffff' : '#000000', isNameOrNumber ? '#ffffff' : '#000000'],
        gradientDirection: 'horizontal'
      };
      console.log('📝 Nouveau texte créé:', newText);
      console.log('📝 Ajout texte - Position:', position, '→ UV final:', newText.position);
    setTexts(prev => {
      const newTexts = [...prev, newText];
      console.log('📝 Liste des textes après ajout:', newTexts);
      return newTexts;
    });
      setSelectedTextId(newText.id); // Sélectionner automatiquement le nouveau texte
      // Sur mobile, dézoomer au maximum après ajout de texte dans la direction de la zone
      const isMobileDetected = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobileDetected) {
        setTimeout(() => zoomOutMax(zoneCategory), 100);
      }
  };

  const updateText = (id: string, updates: Partial<typeof texts[0]>) => {
    setTexts(prev => prev.map(text => 
      text.id === id 
        ? { 
            ...text, 
            ...updates,
            position: updates.position
              ? [updates.position[0], updates.position[1], updates.position[2] ?? 0] as [number, number, number]
              : text.position
          }
        : text
    ));
  };

  const removeText = (id: string) => {
    setTexts(prev => prev.filter(text => text.id !== id));
  };

  const updateTextPosition = (id: string, position: [number, number, number]) => {
    setTexts(prev => {
        const updated = prev.map(text => 
        text.id === id ? { ...text, position: [position[0], position[1], position[2] ?? 0] as [number, number, number] } : text
      );
      return updated;
    });
  };

  const updateTextRotation = (id: string, rotation: number) => {
    setTexts(prev => prev.map(text => 
      text.id === id ? { ...text, rotation } : text
    ));
  };

  const updateTextSize = (id: string, fontSize: number) => {
    setTexts(prev => prev.map(text => 
      text.id === id ? { ...text, fontSize } : text
    ));
  };


  const selectText = (id: string | null, autoOpenTypography = false) => {
    setSelectedTextId(id);
    
    // Callback pour notifier le parent de l'ouverture/fermeture du panneau typographie
    if (onTextSelectionChange) {
      // Forcer l'ouverture automatique si un nom/numéro est sélectionné
      const shouldAutoOpen = (() => {
        if (!id) return false;
        const t = texts.find(tx => tx.id === id);
        return t ? (t.category === 'nom' || t.category === 'numero') : autoOpenTypography;
      })();
      onTextSelectionChange(id, shouldAutoOpen);
    } else {
      console.log('⚠️ onTextSelectionChange n\'est pas défini');
    }
  };

  const startDraggingText = () => {
    setIsDraggingText(true);
  };

  const stopDraggingText = () => {
    setIsDraggingText(false);
  };

  const toggleTextLock = useCallback((id: string) => {
    
    setTexts(currentTexts => {
      const currentText = currentTexts.find(t => t.id === id);
      if (!currentText) {
        return currentTexts;
      }
      
      // Utiliser une ref pour mémoriser le nouvel état cible
      // Si la ref existe déjà pour cet ID, utiliser cette valeur
      // Sinon, calculer le toggle et le stocker
      if (!lockToggleRef.current.has(id)) {
        const targetLockState = !currentText.locked;
        lockToggleRef.current.set(id, targetLockState);
      } else {
      }
      
      const targetLockState = lockToggleRef.current.get(id)!;
      
      return currentTexts.map(text => 
        text.id === id ? { ...text, locked: targetLockState } : text
      );
    });
    
    // Nettoyer la ref immédiatement
    lockToggleRef.current.delete(id);
  }, []);

  // Fonction pour charger plusieurs textes en une fois (pour restauration de config)
  const loadTexts = (textsToLoad: typeof texts) => {
    setTexts(textsToLoad.map(text => ({
      ...text,
      position: [text.position[0], text.position[1], text.position[2] ?? 0] as [number, number, number]
    })));
  };

  return { 
    texts, 
    addText, 
    updateText, 
    removeText, 
    updateTextPosition,
    updateTextRotation,
    updateTextSize,
    toggleTextLock,
    selectedTextId,
    selectText,
    isDraggingText,
    startDraggingText,
    stopDraggingText,
    loadTexts, // Nouvelle fonction pour charger tous les textes
  };
}

// Fonction pour extraire les dimensions d'un SVG
const getSvgDimensions = async (svgUrl: string): Promise<{width: number, height: number}> => {
  try {
    const response = await fetch(svgUrl);
    const svgText = await response.text();
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
    const svgElement = svgDoc.querySelector('svg');
    
    if (svgElement) {
      const width = parseFloat(svgElement.getAttribute('width') || '0');
      const height = parseFloat(svgElement.getAttribute('height') || '0');
      const viewBox = svgElement.getAttribute('viewBox');
      
      if (viewBox) {
        const [, , vbWidth, vbHeight] = viewBox.split(' ').map(Number);
        return {
          width: width || vbWidth,
          height: height || vbHeight
        };
      }
      
      return { width, height };
    }
  } catch (error) {
    console.error('Erreur lors de l\'extraction des dimensions SVG:', error);
  }
  
  // Valeurs par défaut si l'extraction échoue
  return { width: 100, height: 100 };
};
// Hook pour gérer les logos placés sur le modèle
function useLogoSelection(onLogoSelectionChange?: (logoId: string | null) => void) {
  const lockToggleRef = useRef<Map<string, boolean>>(new Map());
  const [placedLogos, setPlacedLogos] = useState<Array<{
    id: string;
    logoId: string; // ID du logo de la bibliothèque
    variantId: string; // ID de la variante choisie
    variantFile: string; // Fichier de la variante (pour affichage rapide)
    position: [number, number, number];
    scale: number;
    rotation: number;
    locked?: boolean;
    category: string;
    width?: number; // Largeur réelle du SVG
    height?: number; // Hauteur réelle du SVG
  }>>([]);
  const [selectedLogoId, setSelectedLogoId] = useState<string | null>(null);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);

  const addLogo = async (
    logoId: string, 
    variantId: string, 
    variantFile: string,
    position?: [number, number, number], 
    category: string = 'torse',
    initialPixelWidth?: number,
    initialPixelHeight?: number,
    initialRotation?: number
  ) => {
    // Extraire les dimensions du SVG
    const dimensions = await getSvgDimensions(variantFile);
    
    // Calculer l'échelle pour respecter les dimensions par défaut de la zone si fournies
    let scale = 1;
    if (initialPixelWidth && initialPixelWidth > 0) {
      scale = initialPixelWidth / dimensions.width;
    } else if (initialPixelHeight && initialPixelHeight > 0) {
      scale = initialPixelHeight / dimensions.height;
    } else {
      const targetWidth = 300; // fallback
      scale = targetWidth / dimensions.width;
    }
   // Create a new position array to avoid reference sharing between logos
   const logoPosition: [number, number, number] = position 
     ? [position[0], position[1], position[2] || 0]
     : [0.5, 0.5, 0];
   
   const newLogo = {
     id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
     logoId,
     variantId,
     variantFile,
      position: logoPosition,
      scale: scale,
      rotation: initialRotation ?? 0,
      category,
      width: dimensions.width,
      height: dimensions.height,
    };
    console.log('🖼️ Ajout logo - Position:', position, '→ UV final:', newLogo.position, 'Dimensions:', dimensions, 'Rotation:', initialRotation);
    setPlacedLogos(prev => [...prev, newLogo]);
    setSelectedLogoId(newLogo.id);
    // Sur mobile, dézoomer au maximum après ajout de logo dans la direction de la catégorie
    // const isMobileDetected = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    // if (isMobileDetected) {
    //   setTimeout(() => zoomOutMax(category as any), 100);
    // }
    return newLogo.id; // Retourner l'ID du logo créé
  };

  const updateLogo = (id: string, updates: Partial<typeof placedLogos[0]>) => {
    setPlacedLogos(prev => prev.map(logo => 
      logo.id === id ? { ...logo, ...updates } : logo
    ));
  };

  const removeLogo = (id: string) => {
    setPlacedLogos(prev => prev.filter(logo => logo.id !== id));
  };

  const updateLogoPosition = (id: string, position: [number, number, number]) => {
    console.log('🔄 updateLogoPosition called:', { id, position });
    // Create a new position array to avoid reference sharing
    const newPosition: [number, number, number] = [position[0], position[1], position[2] || 0];
    setPlacedLogos(prev => prev.map(logo => 
      logo.id === id ? { ...logo, position: newPosition } : logo
    ));
  };

  const updateLogoRotation = (id: string, rotation: number) => {
    console.log('🔄 updateLogoRotation called:', { id, rotation });
    setPlacedLogos(prev => prev.map(logo => 
      logo.id === id ? { ...logo, rotation } : logo
    ));
  };

  const updateLogoScale = (id: string, scale: number) => {
    console.log('📏 updateLogoScale called:', { id, scale });
    setPlacedLogos(prev => prev.map(logo => 
      logo.id === id ? { ...logo, scale } : logo
    ));
  };

  const selectLogo = (id: string | null) => {
    console.log('🔄 selectLogo appelé:', { id, stack: new Error().stack });
    setSelectedLogoId(id);
    
    if (onLogoSelectionChange) {
      onLogoSelectionChange(id);
    }
  };

  const startDraggingLogo = () => {
    setIsDraggingLogo(true);
  };

  const stopDraggingLogo = () => {
    setIsDraggingLogo(false);
  };

  const toggleLogoLock = useCallback((id: string) => {
    console.log('🔒 toggleLogoLock appelé pour:', id);
    
    setPlacedLogos(currentLogos => {
      const currentLogo = currentLogos.find(l => l.id === id);
      if (!currentLogo) {
        console.log('🔒 Logo non trouvé:', id);
        return currentLogos;
      }
      
      if (!lockToggleRef.current.has(id)) {
        const targetLockState = !currentLogo.locked;
        lockToggleRef.current.set(id, targetLockState);
        console.log('🔒 Première exécution - Ancien état:', currentLogo.locked, '→ Nouveau:', targetLockState);
      } else {
        console.log('🔒 Exécution suivante - Utilisation valeur mémorisée:', lockToggleRef.current.get(id));
      }
      
      const targetLockState = lockToggleRef.current.get(id)!;
      
      return currentLogos.map(logo => 
        logo.id === id ? { ...logo, locked: targetLockState } : logo
      );
    });
    
    // Nettoyer la ref immédiatement
    lockToggleRef.current.delete(id);
  }, []);

  // Fonction pour charger plusieurs logos en une fois (pour restauration de config)
  const loadPlacedLogos = (logosToLoad: typeof placedLogos) => {
    setPlacedLogos(logosToLoad);
  };

  return {
    placedLogos,
    addLogo,
    updateLogo,
    removeLogo,
    updateLogoPosition,
    updateLogoRotation,
    updateLogoScale,
    toggleLogoLock,
    selectedLogoId,
    selectLogo,
    isDraggingLogo,
    setIsDraggingLogo,
    startDraggingLogo,
    stopDraggingLogo,
    loadPlacedLogos,
  };
}

// Fonction pour créer une UV map de test
function createTestUVMap() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  
  // Fond blanc
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 512, 512);
  
  // Grille UV
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  
  // Lignes verticales
  for (let i = 0; i <= 10; i++) {
    const x = (i / 10) * 512;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  
  // Lignes horizontales
  for (let i = 0; i <= 10; i++) {
    const y = (i / 10) * 512;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }
  
  // Marquer les coins
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(0, 0, 20, 20); // Coin bas-gauche (0,0)
  ctx.fillStyle = '#00ff00';
  ctx.fillRect(492, 0, 20, 20); // Coin bas-droit (1,0)
  ctx.fillStyle = '#0000ff';
  ctx.fillRect(0, 492, 20, 20); // Coin haut-gauche (0,1)
  ctx.fillStyle = '#ffff00';
  ctx.fillRect(492, 492, 20, 20); // Coin haut-droit (1,1)
  
  // Ajouter des labels
  ctx.fillStyle = '#000000';
  ctx.font = '16px Arial';
  ctx.fillText('UV(0,0)', 5, 35);
  ctx.fillText('UV(1,0)', 400, 35);
  ctx.fillText('UV(0,1)', 5, 480);
  ctx.fillText('UV(1,1)', 400, 480);
  
  return canvas.toDataURL();
}

function Viewer3D({ 
  designTexture, 
  colors, 
  fonts,
  texts,
  updateTextPosition,
  updateTextRotation,
  updateTextSize,
  toggleTextLock,
  removeText,
  selectedTextId,
  selectText,
  isDraggingText,
  setIsDraggingText,
  isRotatingText,
  setIsRotatingText,
  isResizingText,
  setIsResizingText,
  onTextAdded,
  placedLogos,
  updateLogoPosition,
  updateLogoRotation,
  updateLogoScale,
  toggleLogoLock,
  removeLogo,
  selectedLogoId,
  selectLogo,
  isDraggingLogo,
  setIsDraggingLogo,
  isRotatingLogo,
  setIsRotatingLogo,
  isResizingLogo,
  setIsResizingLogo,
  onRequestLogoDelete,
  selectedDesign,
  modelUrl,
  modelId,
  textureMaps,
  materialMaps,
  isPlacingText,
  textZones,
  onTextPlaced,
}: { 
  designTexture: string | null; 
  colors: Record<string, string>;
  fonts: FontItem[];
  texts: Array<{
    id: string;
    content: string;
    position: [number, number, number];
    fontSize: number;
    color: string;
    editable: boolean;
    rotation: number;
    locked?: boolean;
    category: 'text' | 'nom' | 'numero';
    fontFamily?: string;
    strokeColor?: string;
    strokeWidth?: number;
    deformation?: string;
    deformationIntensity?: number;
  }>;
  updateTextPosition: (id: string, position: [number, number, number]) => void;
  updateTextRotation: (id: string, rotation: number) => void;
  updateTextSize: (id: string, fontSize: number) => void;
  toggleTextLock: (id: string) => void;
  removeText: (id: string) => void;
  selectedTextId: string | null;
  selectText: (id: string | null) => void;
  isDraggingText: boolean;
  setIsDraggingText: (dragging: boolean) => void;
  isRotatingText: boolean;
  setIsRotatingText: (rotating: boolean) => void;
  isResizingText: boolean;
  setIsResizingText: (resizing: boolean) => void;
  onTextAdded?: (textId: string, position: [number, number, number]) => void;
  placedLogos: Array<{
    id: string;
    logoId: string;
    variantId: string;
    variantFile: string;
    position: [number, number, number];
    scale: number;
    rotation: number;
    locked?: boolean;
    category: 'torse' | 'dos' | 'bras-gauche' | 'bras-droit';
    width?: number;
    height?: number;
  }>;
  updateLogoPosition: (id: string, position: [number, number, number]) => void;
  updateLogoRotation: (id: string, rotation: number) => void;
  updateLogoScale: (id: string, scale: number) => void;
  toggleLogoLock: (id: string) => void;
  removeLogo: (id: string) => void;
  selectedLogoId: string | null;
  selectLogo: (id: string | null) => void;
  isDraggingLogo: boolean;
  setIsDraggingLogo: (dragging: boolean) => void;
  isRotatingLogo: boolean;
  setIsRotatingLogo: (rotating: boolean) => void;
  isResizingLogo: boolean;
  setIsResizingLogo: (resizing: boolean) => void;
  onRequestLogoDelete?: (id: string) => void;
  selectedDesign: { id: string | null; svgUrl: string | null };
  modelUrl: string | null;
  modelId: string | null;
  textureMaps: Record<string, string> | null;
  materialMaps: Record<string, any> | null;
  // Mode placement de texte
  isPlacingText?: 'nom' | 'numero' | null;
  textZones?: TextZone[];
  onTextPlaced?: (category: 'nom' | 'numero', position: [number, number, number], zoneCategory?: string, rotation?: number) => void;
  // Fermeture du modal mobile
  onCloseModal?: () => void;
}) {
  const [testUVMap, setTestUVMap] = useState<string | null>(null);
  const [clickCoordinates, setClickCoordinates] = useState<{uv: [number, number], svg: [number, number]} | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const controlsRef = useRef<any>(null);
  // Timestamp de la dernière modification explicite de la caméra
  const lastCameraChangeRef = useRef<number>(0);

  // Fonction de conversion pour mapper les distances de zoom entre desktop et mobile
  // Ratio basé sur maxDistance pour maintenir la cohérence du zoom
  const ZOOM_RATIO = 1.8; // 18/10 = 1.8 (ratio entre mobile et desktop maxDistance)
  
  // Valeurs de base pour desktop
  const DESKTOP_MIN_DISTANCE = 2.5;
  const DESKTOP_MAX_DISTANCE = 10;
  const DESKTOP_DEFAULT_POSITION_Z = 10;
  
  // Conversion des distances desktop vers mobile
  const convertDesktopToMobileDistance = (desktopDistance: number): number => {
    return desktopDistance * ZOOM_RATIO;
  };
  
  // Conversion des distances mobile vers desktop
  const convertMobileToDesktopDistance = (mobileDistance: number): number => {
    return mobileDistance / ZOOM_RATIO;
  };
  
  // Calcul des valeurs de distance cohérentes (mémorisé pour éviter les recalculs)
  // Le ratio de 1.8 est utilisé pour maintenir la cohérence entre desktop et mobile
  // minDistance sur mobile est ajusté à 6 (au lieu de 4.5) pour éviter un zoom excessif
  const cameraSettings = useMemo(() => {
    if (isMobile) {
      return {
        minDistance: 6, // Ajusté pour éviter le zoom excessif (au lieu de 2.5 * 1.8 = 4.5)
        maxDistance: convertDesktopToMobileDistance(DESKTOP_MAX_DISTANCE), // 10 * 1.8 = 18
        defaultPositionZ: convertDesktopToMobileDistance(DESKTOP_DEFAULT_POSITION_Z), // 10 * 1.8 = 18
      };
    } else {
      return {
        minDistance: DESKTOP_MIN_DISTANCE, // 2.5
        maxDistance: DESKTOP_MAX_DISTANCE, // 10
        defaultPositionZ: DESKTOP_DEFAULT_POSITION_Z, // 10
      };
    }
  }, [isMobile]);
  
  const zoomOutMax = useCallback((zone?: string) => {
    const controls = controlsRef.current;
    if (!controls || !controls.object || !controls.target) return;
    const camera = controls.object;
    const target = controls.target;
    
    console.log('🔍 zoomOutMax appelé avec zone:', zone);
    
    // Déterminer la direction selon la zone
    let direction: 'front' | 'back' | 'left' | 'right' = 'front';
    
    if (zone === 'dos' || zone === 'Dos') {
      direction = 'back';
    } else if (zone === 'bras-gauche' || zone === 'Bras gauche') {
      direction = 'right';
    } else if (zone === 'bras-droit' || zone === 'Bras droit') {
      direction = 'left';
    } else if (zone === 'torse' || zone === 'Torse' || zone === 'Buttpatch') {
      direction = 'front';
    }
    
    console.log('📷 Direction déterminée:', direction);
    
    // Positionner la caméra selon la direction avec dézoom max
    const maxDistance = cameraSettings.maxDistance;
    
    switch (direction) {
      case 'back':
        camera.position.set(0, 1, -maxDistance);
        target.set(0, 1, 0);
        break;
      case 'left':
        camera.position.set(-maxDistance, 1, 0);
        target.set(0, 1, 0);
        break;
      case 'right':
        camera.position.set(maxDistance, 1, 0);
        target.set(0, 1, 0);
        break;
      default: // front
        camera.position.set(0, 1, maxDistance);
        target.set(0, 1, 0);
    }
    
    controls.update();
    requestAnimationFrame(() => controls.update());
    lastCameraChangeRef.current = Date.now();
  }, [isMobile, cameraSettings]);

  const setCameraView = useCallback((view: 'front' | 'back' | 'left' | 'right') => {
    const controls = controlsRef.current;
    console.log('🎥 setCameraView appelé avec view:', view);
    if (!controls || !controls.object || !controls.target) {
      console.log('⚠️ Pas de controls ou camera disponible');
      return;
    }
    const camera = controls.object;
    const target = controls.target;
    const maxDistance = cameraSettings.maxDistance;
    
    if (view === 'front') {
      camera.position.set(0, 1, maxDistance);
      target.set(0, isMobile ? -1.5 : 0, 0);
      console.log('📍 Positionnée caméra en front');
    } else if (view === 'back') {
      camera.position.set(0, 1, -maxDistance);
      target.set(0, isMobile ? -1.5 : 0, 0);
      console.log('📍 Positionnée caméra en back');
    } else if (view === 'left') {
      camera.position.set(-maxDistance, 1, 0);
      target.set(0, 0, 0);
      console.log('📍 Positionnée caméra en left');
    } else if (view === 'right') {
      camera.position.set(maxDistance, 1, 0);
      target.set(0, 0, 0);
      console.log('📍 Positionnée caméra en right');
    }
    controls.update();
    requestAnimationFrame(() => controls.update());
    // Marquer l'heure de modification pour éviter un reset immédiat
    lastCameraChangeRef.current = Date.now();
  }, [isMobile, cameraSettings]);

  // Écouter les événements de changement de vue de caméra
  useEffect(() => {
    const handleSetCameraView = (event: CustomEvent) => {
      console.log('📡 Événement setCameraView reçu avec detail:', event.detail);
      // Marquer l'heure de modification avant d'appliquer
      lastCameraChangeRef.current = Date.now();
      setCameraView(event.detail);
    };

    window.addEventListener('setCameraView', handleSetCameraView as EventListener);
    return () => window.removeEventListener('setCameraView', handleSetCameraView as EventListener);
  }, [setCameraView]);

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Forcer la distance maximale au chargement (desktop ET mobile)
  useEffect(() => {
    if (controlsRef.current) {
      const controls = controlsRef.current;
      const applyPosition = () => {
        if (controls.object && controls.target) {
          controls.object.position.set(0, 1, cameraSettings.defaultPositionZ);
          controls.target.set(0, isMobile ? -1 : 0, 0);
          controls.update();
          console.log('📷 Position caméra appliquée:', controls.object.position);
        }
      };
      
      applyPosition();
      const timer1 = setTimeout(applyPosition, 100);
      const timer2 = setTimeout(applyPosition, 300);
      const timer3 = setTimeout(applyPosition, 500);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [isMobile, cameraSettings]);

  // Listener pour reset caméra vers la vue de face (pour capture preview) - DÉSACTIVÉ
  useEffect(() => {
    const handleResetCameraToFront = () => {
      // DÉSACTIVÉ: Le reset automatique vers "face" interfère avec les vues de zones
      console.log('⏭️ resetCameraToFront ignoré pour préserver les vues de zones');
      return;
      
      // if (Date.now() - lastCameraChangeRef.current < 2000) {
      //   console.log('⏭️ Skip resetCameraToFront (recent camera change)');
      //   return;
      // }
      // if (controlsRef.current && controlsRef.current.object) {
      //   const camera = controlsRef.current.object;
      //   const target = controlsRef.current.target;
      //   
      //   if (isMobile) {
      //     camera.position.set(0, 1, 18);
      //     target.set(0, -1.5, 0);
      //   } else {
      //     camera.position.set(0, 1, 10);
      //     target.set(0, 0, 0);
      //   }
      //   
      //   controlsRef.current.update();
      //   camera.lookAt(target);
      //   
      //   requestAnimationFrame(() => {
      //     controlsRef.current?.update();
      //     requestAnimationFrame(() => {
      //       controlsRef.current?.update();
      //       requestAnimationFrame(() => {
      //         controlsRef.current?.update();
      //       });
      //     });
      //   });
      //   
      //   console.log(`📸 Caméra réinitialisée vers la vue de FACE pour preview`);
      // }
    };

    window.addEventListener('resetCameraToFront', handleResetCameraToFront);
    return () => window.removeEventListener('resetCameraToFront', handleResetCameraToFront);
  }, [isMobile]);

  // Debug: Log selectedDesign changes
  useEffect(() => {
    // selectedDesign changed
  }, [selectedDesign]);

  useEffect(() => {
    setTestUVMap(createTestUVMap());
  }, []);

  // Paramètres de caméra adaptés au mobile - dézoom max sur desktop aussi
  // Utilisation de la fonction de conversion pour maintenir la cohérence
  const cameraPosition: [number, number, number] = [0, 1, cameraSettings.defaultPositionZ];
  const cameraTarget: [number, number, number] = isMobile ? [0, -1, 0] : [0, 0, 0];
  const minDistance = cameraSettings.minDistance;
  const maxDistance = cameraSettings.maxDistance;

  // Gestionnaire de clic pour fermer le modal sur mobile
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // Ne fermer que sur mobile et si on ne clique pas sur un élément interactif
    if (isMobile && onCloseModal) {
      const target = e.target as HTMLElement;
      // Vérifier qu'on ne clique pas sur un élément interactif (boutons, inputs, etc.)
      const isInteractiveElement = target.closest('button, input, select, textarea, a, [role="button"]');
      if (!isInteractiveElement && !isDraggingText && !isRotatingText && !isResizingText && !isDraggingLogo && !isRotatingLogo && !isResizingLogo) {
        onCloseModal();
      }
    }
  }, [isMobile, onCloseModal, isDraggingText, isRotatingText, isResizingText, isDraggingLogo, isRotatingLogo, isResizingLogo]);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Canvas 3D - prend tout l'espace */}
      <div 
        className="flex-1 bg-gray-100 relative"
        onContextMenu={(e) => e.preventDefault()}
        onClick={handleCanvasClick}
      >
        <Canvas 
          camera={{ position: cameraPosition, fov: 50 }}
          gl={{ preserveDrawingBuffer: true }}
          style={{ 
            background: 'linear-gradient(to bottom, #f8fafc, #e2e8f0)',
            width: '100%',
            height: '100%'
          }}
        >
          {/* Éclairage professionnel type studio photo */}
          {/* Lumière ambiante douce - base uniforme */}
          <ambientLight intensity={0.4} color="#f5f5f5" />
          
          {/* KEY LIGHT - Lumière principale 45° - révèle les détails et textures */}
          <directionalLight 
            position={[12, 18, 12]} 
            intensity={2.0}
            color="#ffffff"
            castShadow={false}
          />
          
          {/* FILL LIGHT - Lumière de remplissage opposée - adoucit les ombres */}
          <directionalLight 
            position={[-8, 12, 8]} 
            intensity={1.0}
            color="#f8f8ff"
          />
          
          {/* BACK/RIM LIGHT - Lumière de contour arrière - détache le sujet */}
          <directionalLight 
            position={[0, 8, -15]} 
            intensity={1.2}
            color="#fafafa"
          />
          
          {/* SIDE LIGHTS - Lumières latérales pour le relief des textures */}
          <directionalLight 
            position={[20, 2, 0]} 
            intensity={0.7}
            color="#ffffff"
          />
          <directionalLight 
            position={[-20, 2, 0]} 
            intensity={0.7}
            color="#ffffff"
          />
          
          {/* TOP LIGHT - Lumière du haut pour les reflets naturels */}
          <directionalLight 
            position={[0, 25, 0]} 
            intensity={0.6}
            color="#ffffff"
          />
          
          {/* ACCENT LIGHTS - Points lumineux pour créer de la profondeur */}
          <pointLight 
            position={[5, 15, 8]} 
            intensity={1.5}
            distance={40}
            decay={1.8}
            color="#ffffff"
          />
          <pointLight 
            position={[-5, 12, 8]} 
            intensity={1.2}
            distance={40}
            decay={1.8}
            color="#f8f9fa"
          />
          
          {/* KICKER LIGHT - Lumière d'accentuation basse pour le relief */}
          <spotLight 
            position={[0, -5, 10]} 
            intensity={0.8}
            angle={Math.PI / 4}
            penumbra={0.5}
            color="#fafafa"
          />
          
          {/* Modèle 3D */}
          {modelUrl ? (
            <Suspense fallback={
              <mesh>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#3b82f6" wireframe />
              </mesh>
            }>
              <ModelViewer 
                url={modelUrl} 
                color="#ffffff"
                modelId={modelId || undefined}
                designTexture={selectedDesign?.svgUrl || (designTexture || undefined)}
                textureMaps={textureMaps || undefined}
                materialMaps={materialMaps || undefined}
                colors={colors}
                fonts={fonts}
                texts={texts}
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
                onTextAdded={onTextAdded}
                placedLogos={placedLogos}
                updateLogoPosition={updateLogoPosition}
                updateLogoRotation={updateLogoRotation}
                updateLogoScale={updateLogoScale}
                toggleLogoLock={toggleLogoLock}
                removeLogo={removeLogo}
                onRequestLogoDelete={onRequestLogoDelete}
                selectedLogoId={selectedLogoId}
                selectLogo={selectLogo}
                isDraggingLogo={isDraggingLogo}
                setIsDraggingLogo={setIsDraggingLogo}
                isRotatingLogo={isRotatingLogo}
                setIsRotatingLogo={setIsRotatingLogo}
              isResizingLogo={isResizingLogo}
              setIsResizingLogo={setIsResizingLogo}
              onClickCoordinates={setClickCoordinates}
              selectedDesign={selectedDesign}
              isPlacingText={isPlacingText}
              textZones={textZones}
              onTextPlaced={onTextPlaced}
              />
            </Suspense>
          ) : null}
          
          <OrbitControls 
            ref={controlsRef}
            enablePan={false}
            enableZoom={!selectedTextId && !selectedLogoId} 
            enableRotate={!selectedTextId && !selectedLogoId}
            enabled={!isDraggingText && !isRotatingText && !isResizingText && !isDraggingLogo && !isRotatingLogo && !isResizingLogo}
            target={cameraTarget}
            minDistance={minDistance}
            maxDistance={maxDistance}
            makeDefault={false}
            zoomToCursor={false}
            screenSpacePanning={false}
          />
        </Canvas>
      </div>
    </div>
  );
}
function Sidebar({
  selectedDesign,
  selectDesign,
  colors,
  updateColor,
  replaceColors,
  resetColors,
  isLinkedPrefillActive,
  hasPendingLinkedPrefill,
  texts,
  addText,
  updateText,
  removeText,
  updateTextPosition,
  selectedTextId,
  selectText,
  textZones,
  isLoadingZones,
  fonts,
  fontsForNames,
  fontsForNumbers,
  placedLogos,
  addLogo,
  updateLogo,
  removeLogo,
  onRequestDelete,
  selectedLogoId,
  selectLogo,
  logos,
  isLoadingLogos,
  autoOpenTypography,
  shouldOpenTypographyPanel,
  onTypographyPanelOpened,
  activeTab,
  configModelUrl,
  configDesignIds,
  modelUrl,
  textureMaps,
  materialMaps,
  modelId,
  isLoading,
  setActiveTab,
  isDraggingLogo,
  setIsDraggingLogo,
  isRotatingLogo,
  setIsRotatingLogo,
  isResizingLogo,
  setIsResizingLogo,
  showColorWarningModal,
  setShowColorWarningModal,
  onCategoryChange,
  isPlacingText,
  setIsPlacingText,
}: {
  selectedDesign: { id: string | null; svgUrl: string | null };
  selectDesign: (design: { id: string; svgUrl: string } | null) => void;
  colors: Record<string, string>;
  updateColor: (colorType: string, color: string) => void;
  replaceColors: (newColors: Record<string, string>) => void;
  resetColors: () => void;
  isLinkedPrefillActive: boolean;
  hasPendingLinkedPrefill: boolean;
  texts: Array<{
    id: string;
    content: string;
    position: [number, number, number];
    fontSize: number;
    color: string;
    editable: boolean;
    category: 'text' | 'nom' | 'numero';
    fontFamily?: string;
    strokeColor?: string;
    strokeWidth?: number;
  }>;
  addText: (content: string, position?: [number, number, number], defaultFontFamily?: string, category?: 'text' | 'nom' | 'numero', initialFontSize?: number, zoneCategory?: 'torse' | 'dos' | 'bras-gauche' | 'bras-droit', initialRotation?: number) => void;
  updateText: (id: string, updates: Partial<any>) => void;
  removeText: (id: string) => void;
  updateTextPosition: (id: string, position: [number, number, number]) => void;
  selectedTextId: string | null;
  selectText: (id: string | null, autoOpenTypography?: boolean) => void;
  textZones: TextZone[];
  isLoadingZones: boolean;
  fonts: FontItem[];
  placedLogos: Array<{
    id: string;
    logoId: string;
    variantId: string;
    variantFile: string;
    position: [number, number, number];
    scale: number;
    rotation: number;
    locked?: boolean;
    category: 'torse' | 'dos' | 'bras-gauche' | 'bras-droit';
    width?: number;
    height?: number;
  }>;
  addLogo: (logoId: string, variantId: string, variantFile: string, position?: [number, number, number], category?: 'torse' | 'dos' | 'bras-gauche' | 'bras-droit', initialPixelWidth?: number, initialPixelHeight?: number, initialRotation?: number) => void;
  updateLogo: (id: string, updates: Partial<any>) => void;
  removeLogo: (id: string) => void;
  onRequestDelete?: (id: string) => void;
  selectedLogoId: string | null;
  selectLogo: (id: string | null) => void;
  logos: Logo[];
  isLoadingLogos: boolean;
  autoOpenTypography?: {textId: string | null, shouldOpen: boolean};
  shouldOpenTypographyPanel?: string | null;
  onTypographyPanelOpened?: () => void;
  activeTab: 'design' | 'color' | 'numero' | 'nom' | 'logo';
  setActiveTab: (tab: 'design' | 'color' | 'numero' | 'nom' | 'logo') => void;
  isDraggingLogo: boolean;
  setIsDraggingLogo: (dragging: boolean) => void;
  isRotatingLogo: boolean;
  setIsRotatingLogo: (rotating: boolean) => void;
  isResizingLogo: boolean;
  setIsResizingLogo: (resizing: boolean) => void;
  showColorWarningModal: boolean;
  setShowColorWarningModal: (show: boolean) => void;
  onCategoryChange?: (category: string) => void;
  configModelUrl: string | null;
  configDesignIds: string[] | null;
  fontsForNames: FontItem[];
  fontsForNumbers: FontItem[];
  modelUrl: string | null;
  textureMaps: Record<string, string> | null;
  materialMaps: Record<string, any> | null;
  modelId: string | null;
  isLoading: boolean;
  isPlacingText?: 'nom' | 'numero' | null;
  setIsPlacingText?: (value: 'nom' | 'numero' | null) => void;
}) {
  // Sidebar RENDU avec activeTab

  const tabs = [
    { id: 'design', label: 'Design', title: 'Sélectionner le design', iconUrl: '/icons/design.svg', iconUrlWhite: '/icons/design-white.svg?v=2', bgColor: 'bg-black', textColor: 'text-black' },
    { id: 'color', label: 'Couleur', title: 'Choisir une couleur', iconUrl: '/icons/color.svg', iconUrlWhite: '/icons/color-white.svg', bgColor: 'bg-black', textColor: 'text-black' },
    { id: 'numero', label: 'Numéro', title: 'Ajouter des numéros', iconUrl: '/icons/numero.svg', iconUrlWhite: '/icons/numero-white.svg', bgColor: 'bg-black', textColor: 'text-black' },
    { id: 'nom', label: 'Nom', title: 'Ajouter un nom', iconUrl: '/icons/nom.svg', iconUrlWhite: '/icons/nom-white.svg', bgColor: 'bg-black', textColor: 'text-black' },
    { id: 'logo', label: 'Logo', title: 'Ajouter des logos', iconUrl: '/icons/logo.svg?v=2', iconUrlWhite: '/icons/logo-white.svg', bgColor: 'bg-black', textColor: 'text-black' },
  ];

  return (
    <div className="h-full flex">
      {/* Onglets verticaux à gauche */}
      <div className="w-20 bg-gray-50 p-2 flex flex-col gap-2 flex-shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              console.log('🎨 Clic sur onglet:', tab.id);
              if (tab.id === 'color') {
                // Vérifier si l'utilisateur a déjà accepté l'avertissement
                const hasAcceptedColorWarning = localStorage.getItem('colorWarningAccepted');
                if (!hasAcceptedColorWarning) {
                  console.log('🎨 Ouverture modal couleur (première fois)');
                  setShowColorWarningModal(true);
                } else {
                  console.log('🎨 Accès direct à couleur (déjà accepté)');
                  setActiveTab(tab.id as any);
                }
              } else {
                console.log('🎨 Changement d\'onglet vers:', tab.id);
                setActiveTab(tab.id as any);
              }
            }}
            className={`w-16 h-16 rounded-lg flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
              activeTab === tab.id
                ? `${tab.bgColor} text-white shadow-lg scale-105 tab-active`
                : 'bg-white text-black hover:bg-gray-100 hover:scale-102 shadow-sm'
            }`}
            title={tab.label}
          >
            <img src={activeTab === tab.id ? tab.iconUrlWhite : tab.iconUrl} alt={tab.label} className="w-7 h-7" />
            <span className="text-xs font-medium leading-tight text-center">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Contenu des onglets à droite */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* En-tête fixe */}
        <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-white sticky top-0 z-20">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <span className={`w-8 h-8 rounded-lg ${tabs.find(t => t.id === activeTab)?.bgColor} text-white flex items-center justify-center`}>
              <img src={tabs.find(t => t.id === activeTab)?.iconUrlWhite as string} alt="icon" className="w-7 h-7" />
            </span>
            {tabs.find(t => t.id === activeTab)?.title}
          </h2>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Contenu spécifique à chaque onglet */}
        {activeTab === 'design' && (
          <DesignTab
            selectedDesign={selectedDesign}
            selectDesign={selectDesign}
            colors={colors}
            updateColor={updateColor}
            replaceColors={replaceColors}
            resetColors={resetColors}
            allowedDesignIds={configDesignIds || undefined}
            isLinkedPrefillActive={isLinkedPrefillActive}
            hasPendingLinkedPrefill={hasPendingLinkedPrefill}
          />
        )}
        {activeTab === 'color' && <ColorTab colors={colors} updateColor={updateColor} />}
          
          {/* Onglets motif / dégradé retirés */}
          {activeTab === 'numero' && <TextTab texts={texts} addText={addText} updateText={updateText} removeText={removeText} updateTextPosition={updateTextPosition} selectedTextId={selectedTextId} selectText={selectText} textZones={textZones} isLoadingZones={isLoadingZones} fonts={fontsForNumbers} selectedDesign={selectedDesign} category="numero" autoOpenTypography={autoOpenTypography} shouldOpenTypographyPanel={shouldOpenTypographyPanel} onTypographyPanelOpened={onTypographyPanelOpened} onStartPlacingText={setIsPlacingText} isPlacingText={isPlacingText} />}
          {activeTab === 'nom' && <TextTab texts={texts} addText={addText} updateText={updateText} removeText={removeText} updateTextPosition={updateTextPosition} selectedTextId={selectedTextId} selectText={selectText} textZones={textZones} isLoadingZones={isLoadingZones} fonts={fontsForNames} selectedDesign={selectedDesign} category="nom" autoOpenTypography={autoOpenTypography} shouldOpenTypographyPanel={shouldOpenTypographyPanel} onTypographyPanelOpened={onTypographyPanelOpened} onStartPlacingText={setIsPlacingText} isPlacingText={isPlacingText} />}
        {activeTab === 'logo' && <LogoTab placedLogos={placedLogos} addLogo={addLogo} updateLogo={updateLogo} removeLogo={removeLogo} onRequestDelete={onRequestDelete} selectedLogoId={selectedLogoId} selectLogo={selectLogo} textZones={textZones} isLoadingZones={isLoadingZones} logos={logos} isLoadingLogos={isLoadingLogos} category="torse" isDraggingLogo={isDraggingLogo} setIsDraggingLogo={setIsDraggingLogo} isRotatingLogo={isRotatingLogo} setIsRotatingLogo={setIsRotatingLogo} isResizingLogo={isResizingLogo} setIsResizingLogo={setIsResizingLogo} setLogoLibraryOpen={() => { /* desktop: no-op */ }} selectedDesign={selectedDesign} onCategoryChange={onCategoryChange} />}
        </div>
      </div>
    </div>
  );
}

const getDeformationOption = (id: string | undefined | null) => {
  return deformationOptions.find(opt => opt.id === id) || deformationOptions[0];
};

function normalizeZoneView(view?: 'front' | 'back' | 'left' | 'right'): 'front' | 'back' | 'left' | 'right' | undefined {
  if (!view) return undefined;
  if (view === 'left') return 'right';
  if (view === 'right') return 'left';
  return view;
}

function mapZoneCategoryToView(zoneCategory?: string | null): 'front' | 'back' | 'left' | 'right' {
  if (!zoneCategory) return 'front';
  const normalized = String(zoneCategory).toLowerCase().replace(/\u0000/g, '').replace(/\s+/g, '-');
  if (normalized === 'dos' || normalized === 'back') return 'back';
  if (normalized === 'bras-gauche' || normalized === 'left' || normalized === 'bras_gauche') return 'right';
  if (normalized === 'bras-droit' || normalized === 'right' || normalized === 'bras_droit') return 'left';
  if (normalized === 'torse' || normalized === 'front') return 'front';
  return 'front';
}

function dispatchCameraViewForZoneCategory(zoneCategory?: string | null) {
  const mapped = mapZoneCategoryToView(zoneCategory);
  window.dispatchEvent(new CustomEvent('setCameraView', { detail: mapped }));
}

function DesignTab({
  selectedDesign,
  selectDesign,
  colors,
  updateColor,
  replaceColors,
  resetColors,
  allowedDesignIds,
  isLinkedPrefillActive,
  hasPendingLinkedPrefill,
}: {
  selectedDesign: { id: string | null; svgUrl: string | null; model_type?: 'maillot' | 'pantalon' };
  selectDesign: (design: { id: string; svgUrl: string; model_type?: 'maillot' | 'pantalon' } | null) => void;
  colors: Record<string, string>;
  updateColor: (colorType: string, color: string) => void; // Modifié pour accepter n'importe quel nom de couleur
  replaceColors: (newColors: Record<string, string>) => void; // Permet de remplacer tout le dictionnaire
  resetColors: () => void; // Fonction pour réinitialiser les couleurs
  allowedDesignIds?: string[]; // Nouveau paramètre pour filtrer les designs
  isLinkedPrefillActive: boolean;
  hasPendingLinkedPrefill: boolean;
}) {
  // Mémoriser allowedDesignIds pour éviter les boucles infinies
  const memoizedAllowedDesignIds = useMemo(() => allowedDesignIds, [allowedDesignIds?.join(',')]);
  
  const [designs, setDesigns] = useState<Array<{
    id: string;
    name: string;
    svgUrl: string;
    thumbUrl?: string;
    model_type?: 'maillot' | 'pantalon'; // Type de modèle
    primaryColor?: string; // Legacy
    secondaryColor?: string; // Legacy
    tertiaryColor?: string; // Legacy
    colors?: Array<{name: string, value: string}>; // Nouveau système dynamique
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const autoSelectRetryRef = useRef<NodeJS.Timeout | null>(null);
  const initialColorsAppliedRef = useRef<string | null>(null);

  useEffect(() => {
    async function loadDesigns() {
      try {
        // Chargement des designs
        const response = await fetch('/api/designs');
        const designsData = await response.json();
        const normalizedDesigns = (Array.isArray(designsData) ? designsData : []).map((design: any) => ({
          id: design.id,
          name: design.name || design.title || design.id,
          svgUrl: design.svgUrl || design.svg_url,
          thumbUrl: design.thumbUrl || design.thumb_url || design.preview_url,
          model_type: design.model_type || design.modelType || design.type,
          colors: Array.isArray(design.colors) ? design.colors : Array.isArray(design.design_colors) ? design.design_colors : undefined,
          primaryColor: design.primaryColor || design.primary_color,
          secondaryColor: design.secondaryColor || design.secondary_color,
          tertiaryColor: design.tertiaryColor || design.tertiary_color,
        }));

        // Designs chargés
        // Si un mapping produit existe, filtrer les designs autorisés
        const params = new URLSearchParams(window.location.search);
        const productId = params.get('productId');
        const variantOnly = !!params.get('variantId') && !productId;
        const prefillParam = params.get('prefill');
        const shouldSkipDefaultColors =
          isLinkedPrefillParam(prefillParam) ||
          isLinkedPrefillActive ||
          hasPendingLinkedPrefill;
        let finalDesigns = normalizedDesigns;
        
        // Si on a des design_ids autorisés (depuis une config sauvegardée), les utiliser
        if (memoizedAllowedDesignIds && memoizedAllowedDesignIds.length > 0) {
          // Filtrage avec allowedDesignIds
          finalDesigns = normalizedDesigns.filter((d: any) => memoizedAllowedDesignIds.includes(d.id));
        } else if (productId) {
          // Sinon, utiliser le système existant avec productId
          // Utilisation du système productId
          try {
            const mapRes = await fetch(`/api/product-mappings?shopify_product_id=${encodeURIComponent(productId)}`);
            const mapJson = await mapRes.json();
            if (mapJson?.design_ids?.length) {
              finalDesigns = normalizedDesigns.filter((d: any) => mapJson.design_ids.includes(d.id));
              // Designs filtrés par productId
            }
          } catch {}
        } else {
          // Aucun filtrage par productId
        }

        // Cas fort: arrivée via variantId seul (sans productId) → n'afficher que le selectedDesign
        if (variantOnly && selectedDesign.id) {
          finalDesigns = normalizedDesigns.filter((d: any) => d.id === selectedDesign.id);
        }
        setDesigns(finalDesigns);
        
        // Vérifier si designId est dans l'URL
        const designIdParam = params.get('designId');
        let designToSelect = null;
        
        if (designIdParam) {
          // Trouver le design par ID
          const foundDesign = normalizedDesigns.find((d: any) => d.id === designIdParam);
        if (foundDesign) {
          designToSelect = foundDesign;
          console.log('🎯 Design trouvé via URL designId:', foundDesign.name);
        }
        }
        
        // Sélectionner automatiquement le design (depuis URL ou premier disponible)
        // Vérifier si le design actuellement sélectionné est toujours dans la liste valide
        const currentDesignIsValid = selectedDesign.id && finalDesigns.some((d: any) => d.id === selectedDesign.id);
        
        // Vérifier si on charge une configuration sauvegardée (config=xxx dans l'URL)
        const isLoadingSavedConfig = params.get('config') !== null;
        // Différencier nouvelle config vs sauvegarde:
        // - fresh=1 => nouvelle config tout juste préparée
        // - allowedDesignIds présent et non vide => sauvegarde avec contenu
        const freshParam = params.get('fresh') === '1';
        const hasSavedDesign = allowedDesignIds && allowedDesignIds.length > 0;
        // Sauvegarde stricte: config présent SANS fresh=1 (ignore le flag sessionStorage pour éviter les fuites)
        const isSavedConfigStrict = isLoadingSavedConfig && !freshParam;
        
        if (finalDesigns.length > 0 && (!selectedDesign.id || !currentDesignIsValid)) {
          // Vérifier si on a une config temporaire à restaurer OU une config sauvegardée à charger
          const hasTempConfig = localStorage.getItem('temp_design_config');
          // Auto-select SEULEMENT si: c'est une nouvelle config (fresh=1 OU pas de config param) ET pas de sauvegarde stricte
          const shouldAutoSelect = !isSavedConfigStrict && (freshParam || (!hasTempConfig && !isLoadingSavedConfig));
          
          if (shouldAutoSelect) {
            // Sélectionner le design depuis l'URL si présent, sinon le premier
            const targetDesign = designToSelect || (finalDesigns.find((d: any) => d.id === designIdParam) || finalDesigns[0]);
            
            if (targetDesign) {
              console.log('🎯 Auto-sélection du design:', targetDesign.name, 'ID:', targetDesign.id);
              selectDesign(targetDesign);

              if (!shouldSkipDefaultColors) {
                applyDefaultDesignColors(targetDesign, replaceColors, updateColor);
                initialColorsAppliedRef.current = targetDesign.id;
              } else {
                console.log('🎯 Préconfiguration liée détectée, on laisse pendingLinkedPrefill appliquer les couleurs');
              }

              // Nettoyer le flag fresh après usage pour éviter ré-application
              if (freshParam) {
                const cleanParams = new URLSearchParams(window.location.search);
                cleanParams.delete('fresh');
                window.history.replaceState({}, '', `${window.location.pathname}?${cleanParams.toString()}`);
              }
              // Nettoyer aussi le flag sessionStorage après usage
              try { sessionStorage.removeItem('__new_config'); } catch {}
            }
          } else if (isSavedConfigStrict) {
            try { sessionStorage.removeItem('__new_config'); } catch {}
            console.log('⏸️ Chargement d\'une configuration sauvegardée - pas d\'auto-application des couleurs du design');
          }
        } else if (designToSelect && selectedDesign.id !== designToSelect.id && !isLoadingSavedConfig) {
          // Si un designId est dans l'URL mais différent du design actuellement sélectionné, le changer
          // SAUF si on charge une config sauvegardée (dans ce cas, loadExistingConfiguration gère ça)
          selectDesign(designToSelect);
            if (!shouldSkipDefaultColors) {
            applyDefaultDesignColors(designToSelect, replaceColors, updateColor);
            initialColorsAppliedRef.current = designToSelect.id;
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des designs:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadDesigns();
    
    // Retry mechanism: sur certains téléphones lents, le chargement peut être plus long
    // On vérifie après un délai si aucun design n'a été sélectionné automatiquement
    if (autoSelectRetryRef.current) {
      clearTimeout(autoSelectRetryRef.current);
    }
    
    autoSelectRetryRef.current = setTimeout(() => {
      // Si après 1.5 secondes, on a des designs mais pas de sélection, forcer la sélection
      if (designs.length > 0 && !selectedDesign.id) {
        const hasTempConfig = localStorage.getItem('temp_design_config');
        const params = new URLSearchParams(window.location.search);
        const isLoadingSavedConfig = params.get('config') !== null;
        const freshParam = params.get('fresh') === '1';
        const prefillFlag =
          isLinkedPrefillParam(params.get('prefill')) ||
          isLinkedPrefillActive ||
          hasPendingLinkedPrefill;
        // Sauvegarde stricte: config présent SANS fresh=1
        const isSavedConfigStrict = isLoadingSavedConfig && !freshParam;
        
        // Ne pas auto-sélectionner si on charge une config sauvegardée
        if (!hasTempConfig && !isSavedConfigStrict) {
          const designIdParam = params.get('designId');
          const targetDesign = designs.find((d: any) => d.id === designIdParam) || designs[0];
          if (targetDesign) {
            console.log('🔄 Retry: Auto-sélection du design après délai (téléphone lent):', targetDesign.name);
            selectDesign(targetDesign);
            if (!prefillFlag) {
              applyDefaultDesignColors(targetDesign, replaceColors, updateColor);
              initialColorsAppliedRef.current = targetDesign.id;
            } else {
              console.log('🔄 Retry: préconfiguration liée présente, on laisse pendingLinkedPrefill gérer les couleurs');
            }
            // Nettoyer le flag sessionStorage après usage
            try { sessionStorage.removeItem('__new_config'); } catch {}
          }
        }
      }
    }, 1500);
    
    return () => {
      if (autoSelectRetryRef.current) {
        clearTimeout(autoSelectRetryRef.current);
      }
    };
  }, [
    memoizedAllowedDesignIds,
    designs.length,
    selectedDesign.id,
    allowedDesignIds,
    replaceColors,
    updateColor,
    selectDesign,
    isLinkedPrefillActive,
    hasPendingLinkedPrefill,
  ]);

  useEffect(() => {
    if (!selectedDesign.id) return;
    if (!designs || designs.length === 0) return;
    if (initialColorsAppliedRef.current === selectedDesign.id) return;
    if (Object.keys(colors || {}).length > 0) return;
    if (isLinkedPrefillActive || hasPendingLinkedPrefill) return;
    const params = new URLSearchParams(window.location.search);
    if (isLinkedPrefillParam(params.get('prefill'))) return;

    const design = designs.find((d) => d.id === selectedDesign.id);
    if (!design) return;

    console.log('🎯 Auto-application des couleurs par défaut après sélection:', design.name);
    applyDefaultDesignColors(design, replaceColors, updateColor);
    initialColorsAppliedRef.current = design.id;
  }, [
    designs,
    selectedDesign.id,
    colors,
    replaceColors,
    updateColor,
    isLinkedPrefillActive,
    hasPendingLinkedPrefill,
  ]);

  // Sélection par défaut si aucune sélection après normalisation
  useEffect(() => {
    if (!designs || designs.length === 0) return;
    if (selectedDesign.id) return;

    const params = new URLSearchParams(window.location.search);
    const urlDesignId = params.get('designId');
    const mappingDesignId =
      allowedDesignIds && allowedDesignIds.length > 0
        ? allowedDesignIds[0]
        : null;
    const targetId = urlDesignId || mappingDesignId || designs[0].id;
    const targetDesign = designs.find((design) => design.id === targetId) || designs[0];

    if (targetDesign) {
      console.log('🎯 Sélection par défaut du design:', targetDesign.id);
      selectDesign(targetDesign);
    }
  }, [designs, selectedDesign.id, allowedDesignIds, selectDesign]);

  const [designTab, setDesignTab] = useState<'designs' | 'best'>('designs');

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="text-center py-8">
          <div className="text-gray-500">Chargement des designs...</div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Grille des designs */}
          {designs.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {(() => {
                const params = new URLSearchParams(window.location.search);
                const variantId = params.get('variantId');
                const productId = params.get('productId');
                const base = (memoizedAllowedDesignIds && memoizedAllowedDesignIds.length > 0
                  ? designs.filter((d) => memoizedAllowedDesignIds.includes(d.id))
                  : designs);
                const enforceSingle = !!variantId && !productId && selectedDesign.id;
                const finalList = enforceSingle ? base.filter(d => d.id === selectedDesign.id) : base;
                return finalList;
              })().map((design) => (
                <button
                  key={design.id}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedDesign.id === design.id
                      ? "border-black bg-gray-100"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => {
                    console.log('🔍 DEBUG: Sélection du design:', design);
                    console.log('🔍 DEBUG: model_type du design:', design.model_type);
                    selectDesign(design);
                    
                    // Réinitialiser les couleurs avant d'appliquer les nouvelles
                    resetColors();
                    
                    // Appliquer automatiquement les couleurs du design (nouveau système dynamique ou legacy)
                    if (design.colors && design.colors.length > 0) {
                      // Nouveau système dynamique
                      design.colors.forEach(color => {
                        updateColor(color.name, color.value);
                      });
                    } else {
                      // Système legacy
                      if (design.primaryColor) {
                        updateColor('primary', design.primaryColor);
                      }
                      if (design.secondaryColor) {
                        updateColor('secondary', design.secondaryColor);
                      }
                      if (design.tertiaryColor) {
                        updateColor('tertiary', design.tertiaryColor);
                      }
                    }
                  }}
                >
                  <div className="space-y-2">
                    <div className="w-full h-16 bg-white rounded border flex items-center justify-center overflow-hidden">
                      {design.thumbUrl ? (
                        <img 
                          src={design.thumbUrl} 
                          alt={design.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-gray-400 text-xs">SVG</span>
                      )}
                    </div>
                    <div className="text-xs font-medium text-center text-gray-900 truncate">
                      {design.name}
                    </div>
                    
                    {/* Afficher les couleurs si disponibles (nouveau système dynamique ou legacy) */}
                    {((design.colors && design.colors.length > 0) || design.primaryColor || design.secondaryColor || design.tertiaryColor) && (
                      <div className="flex justify-center gap-1 flex-wrap">
                        {design.colors && design.colors.length > 0 ? (
                          // Nouveau système dynamique
                          design.colors.map((color, index) => (
                            <div 
                              key={index}
                              className="w-3 h-3 rounded-full border border-gray-300" 
                              style={{ backgroundColor: color.value }}
                              title={`${color.name}: ${color.value}`}
                            ></div>
                          ))
                        ) : (
                          // Système legacy
                          <>
                            {design.primaryColor && (
                              <div 
                                className="w-3 h-3 rounded-full border border-gray-300" 
                                style={{ backgroundColor: design.primaryColor }}
                                title={`Primary: ${design.primaryColor}`}
                              ></div>
                            )}
                            {design.secondaryColor && (
                              <div 
                                className="w-3 h-3 rounded-full border border-gray-300" 
                                style={{ backgroundColor: design.secondaryColor }}
                                title={`Secondary: ${design.secondaryColor}`}
                              ></div>
                            )}
                            {design.tertiaryColor && (
                              <div 
                                className="w-3 h-3 rounded-full border border-gray-300" 
                                style={{ backgroundColor: design.tertiaryColor }}
                                title={`Tertiary: ${design.tertiaryColor}`}
                              ></div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">Aucun design disponible</p>
              <p className="text-xs mt-1">Uploadez des designs dans l'admin</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Fonction pour déterminer la couleur du texte en fonction de la couleur de fond
function getContrastColor(hexColor: string): string {
  // Convertir hex en RGB
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculer la luminance relative
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Retourner blanc pour les couleurs sombres, noir pour les couleurs claires
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

// Fonction pour traduire les noms de couleurs en français
const translateColorName = (colorKey: string): string => {
  const translations: Record<string, string> = {
    'primary': 'Principal',
    'secondary': 'Secondaire', 
    'tertiary': 'Tertiaire',
    'quaternary': 'Quaternaire',
    'quinary': 'Quinaire',
    'accent': 'Accent',
    'background': 'Arrière-plan',
    'foreground': 'Premier plan',
    'text': 'Texte',
    'border': 'Bordure',
    'highlight': 'Surlignage',
    'shadow': 'Ombre'
  };
  
  return translations[colorKey.toLowerCase()] || colorKey.charAt(0).toUpperCase() + colorKey.slice(1);
};

const normalizeColorKey = (key: string) =>
  key.replace(/^--/, '').replace(/\s+/g, '-').toLowerCase();

const applyDefaultDesignColors = (
  design: {
    colors?: Array<{ name: string; value: string }>;
    primaryColor?: string;
    secondaryColor?: string;
    tertiaryColor?: string;
  },
  replaceColors: (colors: Record<string, string>) => void,
  updateColor: (colorType: string, color: string) => void
) => {
  const result: Record<string, string> = {};

  if (Array.isArray(design.colors) && design.colors.length > 0) {
    design.colors.forEach((color) => {
      if (!color?.name || typeof color.value !== 'string') return;
      result[normalizeColorKey(color.name)] = color.value;
    });
  } else {
    if (design.primaryColor) result.primary = design.primaryColor;
    if (design.secondaryColor) result.secondary = design.secondaryColor;
    if (design.tertiaryColor) result.tertiary = design.tertiaryColor;
  }

  replaceColors(result);
  Object.entries(result).forEach(([key, value]) => updateColor(key, value));
};
function ColorTab({ colors, updateColor }: { 
  colors: Record<string, string>;
  updateColor: (colorType: string, color: string) => void;
}) {
  const [palettes, setPalettes] = useState<Array<{
    id: string;
    name: string;
    colors: Array<{ hex: string; name: string }>;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPalette, setSelectedPalette] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState<{ colorKey: string | null }>({ colorKey: null });

  const colorKeys = Object.keys(colors);

  // Charger les palettes depuis l'admin
  useEffect(() => {
    async function loadPalettes() {
      try {
        const response = await fetch('/api/palettes');
        const palettesData = await response.json();
        setPalettes(palettesData);
        
        // Sélectionner la première palette par défaut
        if (palettesData.length > 0 && !selectedPalette) {
          setSelectedPalette(palettesData[0].id);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des palettes:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadPalettes();
  }, []);

  // Obtenir toutes les couleurs de toutes les palettes
  const allColors = palettes.flatMap(palette => 
    palette.colors.map(color => ({
      ...color,
      paletteName: palette.name
    }))
  );

  // Gérer l'ouverture du sélecteur de couleur
  const handleColorClick = (key: string) => setShowColorPicker({ colorKey: key });

  // Gérer la sélection d'une couleur
  const handleColorSelect = (colorHex: string) => {
    if (showColorPicker.colorKey) {
      updateColor(showColorPicker.colorKey, colorHex);
      // Ne pas fermer automatiquement - l'utilisateur doit cliquer sur "Retour"
    }
  };

  // Gérer la fermeture du sélecteur
  const handleClosePicker = () => setShowColorPicker({ colorKey: null });

  // Si on est en mode sélection de couleur, afficher la palette full-screen
  if (showColorPicker.colorKey) {
    const currentColor = colors[showColorPicker.colorKey];
    const currentColorName = allColors.find(c => c.hex === currentColor)?.name || 'Couleur sélectionnée';
    const colorIndex = colorKeys.findIndex(k => k === showColorPicker.colorKey) + 1;

  return (
      <div className="h-full flex flex-col">
        {/* Header avec bouton retour et couleur actuelle */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <button
            onClick={handleClosePicker}
            className="flex items-center gap-2 text-black hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Retour</span>
          </button>
          
          <div className="flex items-center gap-3">
            <span className="font-medium text-gray-900">{currentColorName}</span>
            <div 
              className="w-8 h-8 rounded-full border-2 border-gray-300"
              style={{ backgroundColor: currentColor || 'transparent' }}
            />
          </div>
      </div>
      
        {/* Palette de couleurs - Desktop en grille, Mobile en slider */}
        <div className="flex-1 p-0 md:p-4 overflow-y-auto">
      {isLoading ? (
            <div className="text-center py-12">
          <div className="text-gray-500">Chargement des couleurs...</div>
        </div>
      ) : allColors.length > 0 ? (
            <>
              {/* Version Desktop - Grille 6 colonnes */}
              <div className="hidden md:block">
                <div className="grid grid-cols-6 gap-3">
                  {allColors.map((colorObj, index) => (
                    <button
                      key={index}
                      onClick={() => handleColorSelect(colorObj.hex)}
                      className="relative aspect-square rounded-full border-2 border-gray-200 hover:border-gray-300 transition-colors overflow-hidden"
                      style={{ backgroundColor: colorObj.hex }}
                    >
                      {/* Coche si couleur sélectionnée */}
                      {currentColor === colorObj.hex && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                            <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                </div>
                </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Version Mobile - Slider avec flèches */}
              <div className="md:hidden relative -mx-4">
                {/* Slider de couleurs - étendu sur toute la largeur */}
              <div className="overflow-x-auto" id="color-slider" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', overscrollBehavior: 'contain', touchAction: 'pan-x' }}>
                  <div className="flex gap-3 min-w-max py-4 px-4">
                    {allColors.map((colorObj, index) => (
              <button
                        key={index}
                        onClick={() => handleColorSelect(colorObj.hex)}
                        className="relative w-12 h-12 rounded-full border-2 border-gray-200 hover:border-gray-300 transition-colors overflow-hidden flex-shrink-0"
                        style={{ backgroundColor: colorObj.hex }}
                      >
                        {/* Coche si couleur sélectionnée */}
                        {currentColor === colorObj.hex && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                              <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
            </div>
                        )}
                      </button>
          ))}
        </div>
        </div>

                {/* Flèche gauche - positionnée par-dessus */}
                <button
                  onClick={() => {
                    const container = document.getElementById('color-slider');
                    if (container) {
                      container.scrollLeft -= 60;
                    }
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-gray-100 flex items-center justify-center shadow-lg z-10"
                  aria-label="Précédent"
                >
                  <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Flèche droite - positionnée par-dessus */}
              <button 
                  onClick={() => {
                    const container = document.getElementById('color-slider');
                    if (container) {
                      container.scrollLeft += 60;
                    }
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-gray-100 flex items-center justify-center shadow-lg z-10"
                  aria-label="Suivant"
                >
                  <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            </>
      ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-lg mb-2">🎨</div>
              <div className="text-sm">Aucune couleur disponible</div>
              <div className="text-xs mt-1">Ajoutez des palettes via l'interface admin</div>
        </div>
      )}
        </div>
      </div>
    );
  }

  // Vue normale avec les couleurs sur une ligne horizontale
  // Afficher seulement les couleurs qui ont une valeur définie
  return (
      <div className="space-y-6">
        {colorKeys.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-lg mb-2">🎨</div>
            <div className="text-sm">Aucune couleur définie</div>
            <div className="text-xs mt-1">Sélectionnez un design pour afficher ses couleurs</div>
          </div>
        ) : (
          <>
            {/* Grille 3x3 de sélecteurs de couleurs */}
            <div className="grid grid-cols-3 gap-3">
              {colorKeys.map((key, index) => (
                <button
                  key={key}
                  onClick={() => handleColorClick(key)}
                  className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {/* Cercle de couleur */}
                  <div 
                    className={`w-8 h-8 rounded-full border-2 ${
                      colors[key] && colors[key] !== '#ffffff' && colors[key] !== '#FFFFFF'
                        ? 'border-gray-300' 
                        : 'border-gray-400'
                    }`}
                    style={{ 
                      backgroundColor: colors[key] && colors[key] !== '#ffffff' && colors[key] !== '#FFFFFF'
                        ? colors[key]
                        : 'transparent'
                    }}
                  />
                  
                  {/* Label */}
                  <span className="text-sm font-medium text-gray-900 text-center">
                    {translateColorName(key)}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
    </div>
  );
}
function TextTab({ 
  texts, 
  addText, 
  updateText, 
  removeText,
  updateTextPosition,
  selectedTextId,
  selectText,
  textZones,
  isLoadingZones,
  fonts,
  selectedDesign,
  category = 'text', // Catégorie par défaut
  autoOpenTypography,
  shouldOpenTypographyPanel,
  onTypographyPanelOpened,
  onStartPlacingText,
  isPlacingText,
}: {
  texts: Array<{
    id: string;
    content: string;
    position: [number, number, number];
    fontSize: number;
    color: string;
    editable: boolean;
    locked?: boolean;
    category: 'text' | 'nom' | 'numero';
    fontFamily?: string;
    strokeColor?: string;
    strokeWidth?: number;
    deformation?: string;
    deformationIntensity?: number;
  }>;
  addText: (content: string, position?: [number, number, number], defaultFontFamily?: string, category?: 'text' | 'nom' | 'numero', initialFontSize?: number, zoneCategory?: 'torse' | 'dos' | 'bras-gauche' | 'bras-droit', initialRotation?: number) => void;
  updateText: (id: string, updates: Partial<any>) => void;
  removeText: (id: string) => void;
  updateTextPosition: (id: string, position: [number, number, number]) => void;
  selectedTextId: string | null;
  selectText: (id: string | null, autoOpenTypography?: boolean) => void;
  textZones: TextZone[];
  isLoadingZones: boolean;
  fonts: FontItem[];
  selectedDesign: { id: string | null; svgUrl: string | null };
  category?: 'text' | 'nom' | 'numero'; // Catégorie de l'onglet
  autoOpenTypography?: {textId: string | null, shouldOpen: boolean};
  shouldOpenTypographyPanel?: string | null;
  onTypographyPanelOpened?: () => void;
  onStartPlacingText?: (category: 'nom' | 'numero') => void;
  isPlacingText?: 'nom' | 'numero' | null;
}) {
  console.log('🎭 TextTab RENDU avec props:', { shouldOpenTypographyPanel, autoOpenTypography, category });
  
  // Filtrer les textes selon la catégorie
  const filteredTexts = texts.filter(t => t.category === category);
  
  // Filtrer les zones selon le design sélectionné, la catégorie et trier
  const filteredZones = textZones
    .filter(zone => !selectedDesign?.id || zone.designId === selectedDesign.id)
    .filter(zone => zone.categories && zone.categories.includes(category))
    .sort((a, b) => a.name.localeCompare(b.name));
  
  const [newTextContent, setNewTextContent] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [isAddingText, setIsAddingText] = useState(false);
  const [showZoneSelector, setShowZoneSelector] = useState(false);
  const [showTypographyPanel, setShowTypographyPanel] = useState(false);
  const [selectedTextForTypography, setSelectedTextForTypography] = useState<string | null>(null);
  const [typographyColorTab, setTypographyColorTab] = useState<'text' | 'stroke' | 'gradientStart' | 'gradientEnd' | null>(null);
  const [allColors, setAllColors] = useState<Array<{ hex: string; name?: string; paletteName?: string }>>([]);
  const [isLoadingColors, setIsLoadingColors] = useState(false);
  const [showDeformationSelector, setShowDeformationSelector] = useState(false);
  // États pour le système de catégories (comme pour les logos)
  const [typographyCategory, setTypographyCategory] = useState<'contenu' | 'police' | 'couleur' | 'contour' | 'deformation'>('contenu');
  const [palettes, setPalettes] = useState<Array<{
    id: string;
    name: string;
    colors: Array<{ hex: string; name: string }>;
  }>>([]);
  const [selectedPalette, setSelectedPalette] = useState<string | null>(null);
  const [activeGradientStop, setActiveGradientStop] = useState<0 | 1>(0);

  const deformationOptions = [
    { id: 'none' as const, name: 'Aucune déformation', icon: '📝' },
    { id: 'arc' as const, name: 'Arc', icon: '🌈' },
    { id: 'flag' as const, name: 'Drapeau', icon: '🏳️' },
    { id: 'wave' as const, name: 'Vague', icon: '🌊' },
    { id: 'bulge' as const, name: 'Bombé', icon: '🎈' },
    { id: 'pinch' as const, name: 'Pinçage', icon: '🗜️' },
    { id: 'fisheye' as const, name: 'Fisheye', icon: '👁️' },
    { id: 'squeeze' as const, name: 'Compression', icon: '🪢' },
    { id: 'skew' as const, name: 'Inclinaison', icon: '📐' },
    { id: 'spiral' as const, name: 'Spirale', icon: '🌀' },
    { id: 'rotate' as const, name: 'Rotation progressive', icon: '🔄' },
    { id: 'tilt' as const, name: 'Tilt', icon: '↕️' },
    { id: 'perspective' as const, name: 'Perspective', icon: '🎥' },
    { id: 'fade' as const, name: 'Fondu', icon: '🌫️' },
    { id: 'ribbon' as const, name: 'Ruban', icon: '🎀' },
    { id: 'incline' as const, name: 'Montée/descente', icon: '⛰️' },
    { id: 'staircase' as const, name: 'Escalier', icon: '🧗' },
    { id: 'wave-arc' as const, name: 'Vague + Arc', icon: '♒️' },
    { id: 'pulse' as const, name: 'Pulse', icon: '💓' },
  ] as const;

  const getDeformationOption = (id: string | undefined | null) => {
    return deformationOptions.find(opt => opt.id === id) || deformationOptions[0];
  };

  function normalizeZoneView(view?: 'front' | 'back' | 'left' | 'right'): 'front' | 'back' | 'left' | 'right' | undefined {
    if (!view) return undefined;
    if (view === 'left') return 'right';
    if (view === 'right') return 'left';
    return view;
  }

  function mapZoneCategoryToView(zoneCategory?: string | null): 'front' | 'back' | 'left' | 'right' {
    if (!zoneCategory) return 'front';
    const normalized = String(zoneCategory).toLowerCase().replace(/\u0000/g, '').replace(/\s+/g, '-');
    if (normalized === 'dos' || normalized === 'back') return 'back';
    if (normalized === 'bras-gauche' || normalized === 'left' || normalized === 'bras_gauche') return 'right';
    if (normalized === 'bras-droit' || normalized === 'right' || normalized === 'bras_droit') return 'left';
    if (normalized === 'torse' || normalized === 'front') return 'front';
    return 'front';
  }

  function dispatchCameraViewForZoneCategory(zoneCategory?: string | null) {
    const mapped = mapZoneCategoryToView(zoneCategory);
    window.dispatchEvent(new CustomEvent('setCameraView', { detail: mapped }));
  }

  // Gérer l'ouverture automatique du panneau typographie quand le composant se monte
  useEffect(() => {
    console.log('🎭 TextTab monté avec shouldOpenTypographyPanel:', shouldOpenTypographyPanel, 'category:', category);
    if (shouldOpenTypographyPanel) {
      const t = texts.find(tx => tx.id === shouldOpenTypographyPanel);
      if (!t) {
        // Ne pas ouvrir si le texte n'existe pas
        return;
      }
      // VÉRIFIER que le texte appartient à la catégorie de l'onglet actuel
      if (t.category !== category) {
        console.log('🚫 TextTab - Ne pas ouvrir le panneau car catégorie ne correspond pas:', t.category, 'vs', category);
        return;
      }
      console.log('🎨 TextTab monté - Ouverture automatique du panneau typographie pour:', shouldOpenTypographyPanel);
      setShowTypographyPanel(true);
      setSelectedTextForTypography(shouldOpenTypographyPanel);
      onTypographyPanelOpened?.(); // Notifier que le panneau a été ouvert
    }
  }, [shouldOpenTypographyPanel, onTypographyPanelOpened, texts, category]);

  // Surveiller spécifiquement les changements de shouldOpenTypographyPanel (même si déjà monté)
  useEffect(() => {
    console.log('🔄 shouldOpenTypographyPanel a changé dans TextTab:', shouldOpenTypographyPanel);
    if (shouldOpenTypographyPanel) {
      const t = texts.find(tx => tx.id === shouldOpenTypographyPanel);
      if (!t) {
        // Ne pas ouvrir si le texte n'existe pas
        return;
      }
      // VÉRIFIER que le texte appartient à la catégorie de l'onglet actuel
      if (t.category !== category) {
        console.log('🚫 Ne pas ouvrir le panneau car catégorie ne correspond pas:', t.category, 'vs', category);
        return;
      }
      console.log('🎨 Ouverture du panneau typographie suite au changement de shouldOpenTypographyPanel:', shouldOpenTypographyPanel);
      setShowTypographyPanel(true);
      setSelectedTextForTypography(shouldOpenTypographyPanel);
    }
  }, [shouldOpenTypographyPanel, texts, category]);

  // Gérer l'ouverture/fermeture automatique du panneau typographie
  useEffect(() => {
    console.log('📋 TextTab useEffect - autoOpenTypography changé:', autoOpenTypography);
    
    if (autoOpenTypography?.shouldOpen && autoOpenTypography.textId) {
      const t = texts.find(tx => tx.id === autoOpenTypography.textId);
      if (!t) {
        // Ne pas ouvrir si le texte n'existe pas
        return;
      }
      // VÉRIFIER que le texte appartient à la catégorie de l'onglet actuel
      if (t.category !== category) {
        console.log('🚫 Ne pas ouvrir le panneau car catégorie ne correspond pas:', t.category, 'vs', category);
        return;
      }
      console.log('🎨 Ouverture du panneau typographie dans TextTab pour:', autoOpenTypography.textId);
      setShowTypographyPanel(true);
      setSelectedTextForTypography(autoOpenTypography.textId);
    } else if (autoOpenTypography?.shouldOpen === false) {
      console.log('🚫 Fermeture du panneau typographie dans TextTab');
      setShowTypographyPanel(false);
      setSelectedTextForTypography(null);
      setTypographyColorTab(null);
      setShowDeformationSelector(false);
    }
  }, [autoOpenTypography?.textId, autoOpenTypography?.shouldOpen, texts, category]);

  // Si selectedTextId change et que le panneau est ouvert, mettre à jour selectedTextForTypography
  useEffect(() => {
    if (selectedTextId && showTypographyPanel) {
      console.log('🔄 Mise à jour selectedTextForTypography car selectedTextId a changé:', selectedTextId);
      setSelectedTextForTypography(selectedTextId);
    }
  }, [selectedTextId, showTypographyPanel]);

  useEffect(() => {
    setActiveGradientStop(0);
  }, [selectedTextForTypography]);

  // Mettre à jour la zone sélectionnée quand les zones sont chargées
  // Sélectionner la première zone uniquement si aucune n'est choisie ou si la sélection courante n'existe plus
  useEffect(() => {
    if (filteredZones.length > 0) {
      const currentStillValid = selectedZone && filteredZones.some(z => z.id === selectedZone);
      if (!currentStillValid) {
        console.log('🔧 TextTab: présélection de la première zone', filteredZones[0].id);
        setSelectedZone(filteredZones[0].id);
      }
    }
  }, [filteredZones.length, selectedZone]);

  // Changer automatiquement la vue de la caméra quand le modal s'ouvre et qu'une zone est présélectionnée
  useEffect(() => {
    if (showZoneSelector && selectedZone && filteredZones.length > 0) {
      const zone = filteredZones.find(z => z.id === selectedZone);
      if (zone?.zoneCategory) {
        const mapped = mapZoneCategoryToView(zone.zoneCategory);
        console.log('📍 Changement automatique de vue pour zone présélectionnée:', zone.name, 'vue:', mapped);
        dispatchCameraViewForZoneCategory(zone.zoneCategory);
      }
    }
  }, [showZoneSelector, selectedZone, filteredZones]);

  const handleTypographyClick = (textId: string) => {
    // Sélectionner aussi le texte dans le viewer 3D
    if (selectText) {
      selectText(textId, true);
    }
    setSelectedTextForTypography(textId);
    setShowTypographyPanel(true);
  };

  const handleCloseTypography = () => {
    setShowTypographyPanel(false);
    setSelectedTextForTypography(null);
    setTypographyColorTab(null);
    setShowDeformationSelector(false);
  };


  // Précharger les palettes et les polices dès le montage du composant
  useEffect(() => {
    const loadPalettes = async () => {
      if (allColors.length === 0) {
        // Ne charger que si pas déjà chargé
        setIsLoadingColors(true);
        try {
          const response = await fetch('/api/palettes');
          if (response.ok) {
            const palettesData = await response.json();
            setPalettes(palettesData);
            
            // Sélectionner la première palette par défaut
            if (palettesData.length > 0 && !selectedPalette) {
              setSelectedPalette(palettesData[0].id);
            }
            
            // Construire allColors depuis les palettes
            const colors = palettesData.flatMap((palette: any) => 
              palette.colors.map((color: any) => ({
                hex: color.hex,
                name: color.name,
                paletteName: palette.name
              }))
            );
            setAllColors(colors);
          }
        } catch (error) {
          console.error('Erreur lors du chargement des palettes:', error);
        } finally {
          setIsLoadingColors(false);
        }
      }
    };

    loadPalettes();
  }, []);

  // Précharger toutes les polices disponibles pour qu'elles soient prêtes
  useEffect(() => {
    const preloadFonts = () => {
      fonts.forEach(font => {
        const fontUrl = font.font_url;
        const fontFace = new FontFace(font.display_name, `url(${fontUrl})`);
        fontFace.load().then(() => {
          document.fonts.add(fontFace);
          console.log(`✅ Police préchargée: ${font.display_name}`);
        }).catch(err => {
          console.error(`❌ Erreur préchargement police ${font.display_name}:`, err);
        });
      });
    };

    if (fonts.length > 0) {
      preloadFonts();
    }
  }, [fonts]);

  const handleColorClick = (colorType: 'text' | 'stroke' | 'gradientStart' | 'gradientEnd') => {
    setTypographyColorTab(colorType);
  };

  const handleColorSelect = (colorHex: string) => {
    if (selectedTextForTypography && typographyColorTab) {
      const targetText = texts.find(tx => tx.id === selectedTextForTypography);
      if (!targetText) return;

      if (typographyColorTab === 'text') {
        updateText(selectedTextForTypography, { color: colorHex, fillType: 'solid' });
      } else if (typographyColorTab === 'stroke') {
        updateText(selectedTextForTypography, { strokeColor: colorHex });
      } else {
        const existing: [string, string] = Array.isArray(targetText.gradientColors) && targetText.gradientColors.length >= 2
          ? [targetText.gradientColors[0], targetText.gradientColors[1]]
          : [targetText.color || '#000000', targetText.color || '#000000'];
        const direction: 'horizontal' | 'vertical' = (targetText as any).gradientDirection === 'vertical' ? 'vertical' : 'horizontal';

        if (typographyColorTab === 'gradientStart') {
          existing[0] = colorHex;
        } else if (typographyColorTab === 'gradientEnd') {
          existing[1] = colorHex;
        }

        updateText(selectedTextForTypography, {
          gradientColors: existing,
          color: existing[0],
          fillType: 'gradient',
          gradientDirection: direction
        });
      }
    }
  };

  const handleBackToTypography = () => {
    setTypographyColorTab(null);
  };

  const handleDeformationSelect = (deformationType: string) => {
    if (selectedTextForTypography) {
      updateText(selectedTextForTypography, { deformation: deformationType });
    }
    // Ne pas fermer l'onglet automatiquement pour permettre l'ajustement de l'intensité
  };

  const handleAddText = () => {
    if (!newTextContent.trim()) {
      console.log('❌ Pas de contenu de texte');
      return;
    }
    console.log('🔍 DEBUG handleAddText:', { 
      newTextContent: newTextContent.trim(), 
      selectedZone, 
      filteredZones: filteredZones.length,
      category 
    });
    try {
      const zone = filteredZones.find(z => z.id === selectedZone);
      console.log('🔍 Zone trouvée:', zone);
      if (!zone) {
        console.error('❌ Aucune zone trouvée pour selectedZone:', selectedZone);
        alert('Veuillez sélectionner une zone avant d\'ajouter du texte.');
        return;
      }
      const defaultFont = fonts.length > 0 ? fonts[0].id : undefined;
      // Convertir la hauteur par défaut (px UV 4096) en fontSize (0..1 UV) si disponible
      const pxToUv = (px?: number) => (px && px > 0 ? px / 4096 : undefined);
      const initialFontSize = pxToUv((zone as any)?.defaultTextHeight);
      const initialRotation = (zone as any)?.defaultRotation;
      console.log('🔄 Zone sélectionnée:', zone);
      console.log('🔄 Rotation initiale de la zone:', initialRotation);
      // Orienter la caméra selon la vue associée à la zone (si définie)
      const zoneView = normalizeZoneView((zone as any)?.view as ('front'|'back'|'left'|'right')|undefined);
      if (zoneView) {
        console.log('📸 Application de la vue liée à la zone:', zoneView);
        window.dispatchEvent(new CustomEvent('setCameraView', { detail: zoneView }));
      } else if ((zone as any)?.zoneCategory) {
        dispatchCameraViewForZoneCategory((zone as any).zoneCategory);
      } else {
        dispatchCameraViewForZoneCategory(category);
      }
      // Déterminer la zoneCategory: priorité à la zone (comme les logos)
      let zoneCategory: 'torse' | 'dos' | 'bras-gauche' | 'bras-droit' | undefined = (zone as any)?.zoneCategory;
      if (!zoneCategory && zone && (zone as any)?.color) {
        const z = String((zone as any).color).toLowerCase().replaceAll(' ', '_');
        if (z === 'dos' || z === 'back') zoneCategory = 'dos';
        else if (z === 'torse' || z === 'face' || z === 'avant' || z === 'front') zoneCategory = 'torse';
        else if (z === 'manche_gauche' || z === 'bras_gauche' || z === 'left_sleeve' || z === 'left_arm') zoneCategory = 'bras-gauche';
        else if (z === 'manche_droite' || z === 'bras_droit' || z === 'right_sleeve' || z === 'right_arm') zoneCategory = 'bras-droit';
        else zoneCategory = 'torse';
      }
      console.log('📝 Appel addText avec:', {
        content: newTextContent.trim(),
        position: zone?.position,
        font: defaultFont,
        category,
        fontSize: initialFontSize,
        zoneCategory,
        rotation: initialRotation
      });
      addText(newTextContent.trim(), zone?.position, defaultFont, category, initialFontSize, zoneCategory, initialRotation);
      console.log('✅ addText appelé avec succès');
    } catch (err) {
      console.error('❌ Erreur lors de l\'ajout du texte:', err);
    } finally {
      setNewTextContent('');
      setIsAddingText(false); // Toujours fermer le formulaire
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddText();
    }
  };

  // Si on est en mode sélecteur de déformation, afficher les déformations
  if (showDeformationSelector && selectedTextForTypography) {
    const selectedText = texts.find(t => t.id === selectedTextForTypography);
    if (!selectedText) {
      setShowDeformationSelector(false);
      return null;
    }

    const deformations = deformationOptions;

  return (
      <div className="h-full flex flex-col">
        {/* Header avec bouton retour */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <button
            onClick={() => setShowDeformationSelector(false)}
            className="flex items-center gap-2 text-black hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Retour</span>
          </button>
          
          <div className="flex items-center gap-3">
            <span className="font-medium text-gray-900">Déformation</span>
          </div>
      </div>
      
        {/* Contenu des déformations */}
        <div className="flex-1 p-4 overflow-y-auto">
          {/* Version Desktop - Vertical */}
          <div className="hidden md:block space-y-3">
            {deformations.map((deformation) => (
              <button
                key={deformation.id}
                onClick={() => handleDeformationSelect(deformation.id)}
                className={`w-full flex items-center justify-between p-4 border-2 rounded-lg transition-colors ${
                  (selectedText as any).deformation === deformation.id
                    ? 'border-black bg-gray-100'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-lg">
                    {deformation.icon}
                  </div>
                  <span className="font-medium text-gray-900">
                    {deformation.name}
                  </span>
                </div>
                {(selectedText as any).deformation === deformation.id && (
                  <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
          
          {/* Version Mobile - Grille 4 colonnes (1 ligne) */}
          <div className="md:hidden grid grid-cols-4 gap-2">
            {deformations.map((deformation) => (
              <button
                key={deformation.id}
                onClick={() => handleDeformationSelect(deformation.id)}
                className={`flex flex-col items-center justify-center p-3 border-2 rounded-lg transition-colors ${
                  (selectedText as any).deformation === deformation.id
                    ? 'border-black bg-gray-100'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-xl mb-1">
                  {deformation.icon}
                </div>
                <span className="font-medium text-gray-900 text-[10px] text-center leading-tight">
                  {deformation.name}
                </span>
                {(selectedText as any).deformation === deformation.id && (
                  <div className="w-4 h-4 bg-black rounded-full flex items-center justify-center mt-1">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }
  // Si on est en mode sous-onglet couleur, afficher la palette
  if (typographyColorTab && selectedTextForTypography) {
    const selectedText = texts.find(t => t.id === selectedTextForTypography);
    if (!selectedText) {
      setTypographyColorTab(null);
      return null;
    }

    const isGradientStart = typographyColorTab === 'gradientStart';
    const isGradientEnd = typographyColorTab === 'gradientEnd';
    const currentColor = typographyColorTab === 'text'
      ? selectedText.color
      : typographyColorTab === 'stroke'
        ? selectedText.strokeColor
        : isGradientStart
          ? (selectedText as any).gradientColors?.[0] || selectedText.color
          : (selectedText as any).gradientColors?.[1] || selectedText.color;
    const paletteTitle = typographyColorTab === 'text'
      ? 'Couleur du texte'
      : typographyColorTab === 'stroke'
        ? 'Couleur du contour'
        : isGradientStart
          ? 'Dégradé - couleur 1'
          : 'Dégradé - couleur 2';

    return (
      <div className="h-full flex flex-col">
        {/* Header avec bouton retour */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <button
            onClick={handleBackToTypography}
            className="flex items-center gap-2 text-black hover:text-gray-900 transition-colors"
            >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Retour</span>
            </button>
          
          <div className="flex items-center gap-3">
            <span className="font-medium text-gray-900">
              {paletteTitle}
            </span>
          </div>
        </div>

        {/* Contenu de la palette */}
        <div className="flex-1 p-4 overflow-y-auto">
          {isLoadingColors ? (
            <div className="text-center py-4">
              <div className="text-gray-500">Chargement des couleurs...</div>
      </div>
          ) : allColors.length > 0 ? (
            <div className="grid grid-cols-6 gap-3">
              {allColors.map((colorObj, index) => (
                <button
                  key={index}
                  onClick={() => handleColorSelect(colorObj.hex)}
                  className="relative aspect-square rounded-full border-2 border-gray-200 hover:border-gray-300 transition-colors overflow-hidden"
                  style={{ backgroundColor: colorObj.hex }}
                >
                  {/* Coche si couleur sélectionnée */}
                  {currentColor === colorObj.hex && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </button>
              ))}
              {/* Cercle vide pour "aucune couleur" (seulement pour le contour) */}
              {typographyColorTab === 'stroke' && (
                <button
                  onClick={() => handleColorSelect('')}
                  className="relative aspect-square rounded-full border-2 border-gray-400 border-dashed hover:border-gray-500 transition-colors bg-transparent flex items-center justify-center"
                >
                  {!currentColor && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </button>
              )}
          </div>
        ) : (
            <div className="text-center py-4 text-gray-500">
              <div className="text-sm">Aucune couleur disponible</div>
              <div className="text-xs mt-1">Ajoutez des palettes via l'interface admin</div>
            </div>
          )}
        </div>
      </div>
    );
  }
  // Si on est en mode typographie, afficher le panel typographie
  if (showTypographyPanel && selectedTextForTypography) {
    // Utiliser texts directement (tous les textes) pour trouver le texte sélectionné, pas filteredTexts
    const selectedText = texts.find(t => t.id === selectedTextForTypography);
    if (!selectedText) {
      setShowTypographyPanel(false);
      return null;
    }

    const fillType: 'solid' | 'gradient' = (selectedText as any).fillType === 'gradient' ? 'gradient' : 'solid';
    const gradientStops: [string, string] = (() => {
      const maybeStops = (selectedText as any).gradientColors;
      if (Array.isArray(maybeStops) && maybeStops.length >= 2) {
        return [maybeStops[0], maybeStops[1]];
      }
      const fallback = selectedText.color || '#000000';
      return [fallback, fallback];
    })();
    const gradientDirection: 'horizontal' | 'vertical' = (selectedText as any).gradientDirection === 'vertical' ? 'vertical' : 'horizontal';

    // Catégories de typographie
    const typographyCategories = [
      { id: 'contenu' as const, label: 'Contenu' },
      { id: 'police' as const, label: 'Police' },
      { id: 'couleur' as const, label: 'Couleur' },
      { id: 'contour' as const, label: 'Contour' },
      { id: 'deformation' as const, label: 'Déform.' },
    ];

    return (
      <div className="h-full flex flex-col">
        {/* Header avec bouton retour - masqué sur mobile pour gagner de la place */}
        <div className="hidden md:flex items-center justify-between p-4 border-b border-gray-200">
                  <button
            onClick={handleCloseTypography}
            className="flex items-center gap-2 text-black hover:text-gray-900 transition-colors"
                  >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Retour</span>
                  </button>
          
          <div className="flex items-center gap-3">
            <span className="font-medium text-gray-900">Typographie</span>
          </div>
        </div>

        {/* Catégories (comme pour les logos) */}
        <div className="flex overflow-x-auto border-b border-gray-200 px-2 bg-gray-50">
          {typographyCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setTypographyCategory(cat.id)}
              className={`flex-1 min-w-[80px] py-3 px-2 text-center transition-all ${
                typographyCategory === cat.id
                  ? 'border-b-2 border-black font-semibold text-black'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="text-sm whitespace-nowrap">{cat.label}</div>
            </button>
          ))}
        </div>
        
        {/* Contenu du panel typographie selon la catégorie */}
        <div className={`flex-1 space-y-6 ${typographyCategory === 'contour' ? 'overflow-hidden p-0 flex flex-col' : 'overflow-y-auto p-4'}`}>
          {/* Catégorie: Contenu */}
          {typographyCategory === 'contenu' && (
        <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Contenu du texte
          </label>
            <input
              type="text"
                value={selectedText.content}
                onChange={(e) => updateText(selectedText.id, { content: e.target.value })}
                placeholder="Saisir l'inscription ici..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-gray-900"
              />
            </div>
          )}

          {/* Catégorie: Police */}
          {typographyCategory === 'police' && (
            <>
              <div>
                <label className="hidden sm:block text-sm font-medium text-gray-900 mb-3">
                  Police
                </label>
                {fonts.length > 0 ? (
                  <div className="relative">
                    {/* Grille sur desktop, slider horizontal sur mobile */}
                    <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {fonts.map((font) => (
            <button
                          key={font.id}
                          onClick={() => updateText(selectedText.id, { fontFamily: font.id })}
                          className={`p-3 border-2 rounded-lg transition-all flex flex-col items-center justify-center min-h-[80px] ${
                            selectedText.fontFamily === font.id
                              ? 'border-black bg-gray-100'
                              : 'border-gray-200 bg-white hover:bg-gray-50'
                          }`}
                        >
                          <div className="text-xs text-gray-500 mb-1 text-center">{font.display_name}</div>
                          <div 
                            className="text-sm font-medium text-gray-900 text-center break-words w-full"
                            style={{ fontFamily: font.display_name }}
                          >
                            {selectedText.content || 'Abc'}
                          </div>
                          {selectedText.fontFamily === font.id && (
                            <div className="w-4 h-4 bg-black rounded-full flex items-center justify-center mt-1">
                              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
            </button>
                      ))}
          </div>
                    {/* Slider horizontal pour mobile uniquement */}
                    <div className="flex overflow-x-auto gap-2 px-4 scrollbar-hide snap-x snap-mandatory md:hidden" id="font-slider">
                      {fonts.map((font) => (
                        <button
                          key={font.id}
                          onClick={() => updateText(selectedText.id, { fontFamily: font.id })}
                          className={`flex-shrink-0 w-24 p-3 border-2 rounded-lg transition-all flex flex-col items-center justify-center min-h-[80px] snap-start ${
                            selectedText.fontFamily === font.id
                              ? 'border-black bg-gray-100'
                              : 'border-gray-200 bg-white hover:bg-gray-50'
                          }`}
                        >
                          <div className="text-xs text-gray-500 mb-1 text-center">{font.display_name}</div>
                          <div 
                            className="text-sm font-medium text-gray-900 text-center break-words w-full"
                            style={{ fontFamily: font.display_name }}
                          >
                            {selectedText.content || 'Abc'}
        </div>
                          {selectedText.fontFamily === font.id && (
                            <div className="w-4 h-4 bg-black rounded-full flex items-center justify-center mt-1">
                              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    Aucune police disponible
                  </div>
                )}
      </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 text-center">
                  Taille de police
                </label>
                <div className="flex items-center justify-center gap-3">
                  <input
                    type="range"
                    min="60"
                    max="750"
                    step="10"
                    value={selectedText.fontSize}
                    onChange={(e) => updateText(selectedText.id, { fontSize: parseInt(e.target.value) })}
                    disabled={selectedText.locked}
                    className={`flex-1 ${selectedText.locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                  <span className={`text-sm min-w-[60px] ${selectedText.locked ? 'text-gray-400' : 'text-black'}`}>
                    {selectedText.fontSize}px
                  </span>
        </div>
              </div>
            </>
          )}

          {/* Catégorie: Couleur */}
          {typographyCategory === 'couleur' && (
            <div className="space-y-4 -mx-4">
              <div className="px-4 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      updateText(selectedText.id, { fillType: 'solid' });
                      setActiveGradientStop(0);
                    }}
                    className={`flex items-center justify-center gap-2 p-3 border-2 rounded-lg transition-colors ${fillType === 'solid' ? 'border-black bg-gray-100' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                  >
                    <span className="text-sm font-medium text-gray-900">Couleur unie</span>
                  </button>
                  <button
                    onClick={() => {
                      const stops = [...gradientStops] as [string, string];
                      updateText(selectedText.id, {
                        fillType: 'gradient',
                        gradientColors: stops,
                        color: stops[0],
                        gradientDirection
                      });
                      setActiveGradientStop(0);
                    }}
                    className={`flex items-center justify-center gap-2 p-3 border-2 rounded-lg transition-colors ${fillType === 'gradient' ? 'border-black bg-gray-100' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                  >
                    <span className="text-sm font-medium text-gray-900">Dégradé</span>
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-900">
                    {fillType === 'gradient' ? 'Aperçu du dégradé' : 'Couleur du texte'}
                  </label>
                  <div
                    className="w-10 h-10 rounded-full border-2 border-gray-300"
                    style={fillType === 'gradient'
                      ? { backgroundImage: `linear-gradient(${gradientDirection === 'vertical' ? '180deg' : '90deg'}, ${gradientStops[0]}, ${gradientStops[1]})` }
                      : { backgroundColor: selectedText.color }}
                  />
                </div>

                {fillType === 'gradient' && (
                  <div className="grid grid-cols-2 gap-2">
                    {[0, 1].map((idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveGradientStop(idx as 0 | 1)}
                        className={`flex items-center gap-3 p-3 border-2 rounded-lg transition-colors ${activeGradientStop === idx ? 'border-black bg-gray-100' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                      >
                        <div
                          className="w-8 h-8 rounded-full border border-gray-300"
                          style={{ backgroundColor: gradientStops[idx as 0 | 1] }}
                        />
                        <span className="text-sm font-medium text-gray-900">{`Couleur ${idx + 1}`}</span>
                      </button>
                    ))}
                  </div>
                )}

                {fillType === 'gradient' && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => updateText(selectedText.id, { gradientDirection: 'horizontal' })}
                      className={`flex items-center justify-center gap-2 p-3 border-2 rounded-lg transition-colors ${gradientDirection === 'horizontal' ? 'border-black bg-gray-100' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                    >
                      <span className="text-sm font-medium text-gray-900">Dégradé horizontal</span>
                    </button>
                    <button
                      onClick={() => updateText(selectedText.id, { gradientDirection: 'vertical' })}
                      className={`flex items-center justify-center gap-2 p-3 border-2 rounded-lg transition-colors ${gradientDirection === 'vertical' ? 'border-black bg-gray-100' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                    >
                      <span className="text-sm font-medium text-gray-900">Dégradé vertical</span>
                    </button>
                  </div>
                )}
              </div>

              {isLoadingColors ? (
                <div className="text-center py-8 text-gray-500">
                  Chargement...
                </div>
              ) : allColors.length > 0 ? (
                <div className="relative">
                  <div className="hidden md:grid grid-cols-6 gap-3 py-4 px-4">
                    {allColors.map((colorObj, index) => {
                      const isSelected = fillType === 'gradient'
                        ? gradientStops[activeGradientStop] === colorObj.hex
                        : selectedText.color === colorObj.hex;
                      return (
                        <button
                          key={index}
                          onClick={() => {
                            if (fillType === 'gradient') {
                              const updatedStops = [...gradientStops] as [string, string];
                              updatedStops[activeGradientStop] = colorObj.hex;
                              updateText(selectedText.id, {
                                gradientColors: updatedStops,
                                color: updatedStops[0],
                                fillType: 'gradient',
                                gradientDirection
                              });
                            } else {
                              updateText(selectedText.id, { color: colorObj.hex, fillType: 'solid' });
                            }
                          }}
                          className={`relative w-12 h-12 rounded-full border-2 transition-colors overflow-hidden ${
                            isSelected ? 'border-black' : 'border-gray-200 hover:border-gray-300'
                          }`}
                          style={{ backgroundColor: colorObj.hex }}
                          title={colorObj.name}
                        >
                          {isSelected && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                                <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="md:hidden overflow-x-auto" id="text-color-slider" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <div className="flex gap-3 min-w-max py-4 px-4">
                      {allColors.map((colorObj, index) => {
                        const isSelected = fillType === 'gradient'
                          ? gradientStops[activeGradientStop] === colorObj.hex
                          : selectedText.color === colorObj.hex;
                        return (
                          <button
                            key={index}
                            onClick={() => {
                              if (fillType === 'gradient') {
                                const updatedStops = [...gradientStops] as [string, string];
                                updatedStops[activeGradientStop] = colorObj.hex;
                                updateText(selectedText.id, {
                                  gradientColors: updatedStops,
                                  color: updatedStops[0],
                                  fillType: 'gradient',
                                  gradientDirection
                                });
                              } else {
                                updateText(selectedText.id, { color: colorObj.hex, fillType: 'solid' });
                              }
                            }}
                            className={`relative w-12 h-12 rounded-full border-2 transition-colors overflow-hidden flex-shrink-0 ${
                              isSelected ? 'border-black' : 'border-gray-200 hover:border-gray-300'
                            }`}
                            style={{ backgroundColor: colorObj.hex }}
                            title={colorObj.name}
                          >
                            {isSelected && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                                  <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

                  <button
                    onClick={() => {
                      const container = document.getElementById('text-color-slider');
                      if (container) container.scrollLeft -= 60;
                    }}
                    className="md:hidden absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-gray-100 flex items-center justify-center shadow-lg z-10"
                  >
                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      const container = document.getElementById('text-color-slider');
                      if (container) container.scrollLeft += 60;
                    }}
                    className="md:hidden absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-gray-100 flex items-center justify-center shadow-lg z-10"
                  >
                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Aucune couleur disponible
                </div>
              )}
            </div>
          )}

          {/* Catégorie: Contour */}
          {typographyCategory === 'contour' && (
            <div className="flex flex-col h-full pt-4">
              {/* Épaisseur du contour EN PREMIER sur mobile */}
              <div className="flex-shrink-0 px-4 pb-4">
                <label className="block text-sm font-medium text-gray-900 mb-1 text-center">
                  Épaisseur du contour
                </label>
                <div className="flex items-center justify-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={Math.round(((selectedText.strokeWidth || 0) * 100))}
                    onChange={(e) => updateText(selectedText.id, { strokeWidth: parseFloat(e.target.value) / 100 })}
                    className="flex-1"
                  />
                  <span className="text-sm text-black min-w-[60px]">
                    {Math.round((selectedText.strokeWidth || 0) * 100)}%
                  </span>
                </div>
              </div>

              {/* Couleur du contour APRÈS avec slider horizontal */}
              <div className="flex flex-col flex-1 min-h-0">
                <div className="flex-shrink-0 flex items-center justify-between px-4 pb-2">
                  <label className="block text-sm font-medium text-gray-900">
                    Couleur du contour
                  </label>
                  <div 
                    className="w-8 h-8 rounded-full border-2 border-gray-300"
                    style={{ backgroundColor: selectedText.strokeColor || '#000000' }}
                  />
                </div>
                
                {/* Grille de couleurs sur desktop, slider sur mobile */}
                {isLoadingColors ? (
                  <div className="text-center py-8 text-gray-500">
                    Chargement...
                  </div>
                ) : allColors.length > 0 ? (
                  <div className="relative flex-1 min-h-0">
                    {/* Desktop: grille avec scrollbar native */}
                    <div className="hidden md:block overflow-y-auto h-full py-4 px-4" id="stroke-color-vertical">
                      <div className="grid grid-cols-6 gap-3">
                        {allColors.map((colorObj, index) => (
                          <button
                            key={index}
                            onClick={() => updateText(selectedText.id, { strokeColor: colorObj.hex })}
                            className="relative w-12 h-12 rounded-full border-2 border-gray-200 hover:border-gray-300 transition-colors overflow-hidden"
                            style={{ backgroundColor: colorObj.hex }}
                            title={colorObj.name}
                          >
                            {selectedText.strokeColor === colorObj.hex && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                                  <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              </div>
                            )}
                          </button>
                        ))}
                        {/* Cercle vide pour "aucune couleur" */}
                        <button
                          onClick={() => updateText(selectedText.id, { strokeColor: '' })}
                          className="relative w-12 h-12 rounded-full border-2 border-gray-400 border-dashed hover:border-gray-500 transition-colors bg-transparent flex items-center justify-center"
                        >
                          {!selectedText.strokeColor && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                                <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </button>
                      </div>
                    </div>
                
                    {/* Slider horizontal pour mobile */}
                    <div className="md:hidden overflow-x-auto" id="stroke-color-slider" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      <div className="flex gap-3 min-w-max py-4 px-4">
                        {allColors.map((colorObj, index) => (
                          <button
                            key={index}
                            onClick={() => updateText(selectedText.id, { strokeColor: colorObj.hex })}
                            className="relative w-12 h-12 rounded-full border-2 border-gray-200 hover:border-gray-300 transition-colors overflow-hidden flex-shrink-0"
                            style={{ backgroundColor: colorObj.hex }}
                            title={colorObj.name}
                          >
                            {selectedText.strokeColor === colorObj.hex && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                                  <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Desktop: uniquement la grille ci-dessus; pas de slider supplémentaire */}
                
                    {/* Pas de flèches de navigation désirées */}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    Aucune couleur disponible
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Catégorie: Déformation */}
          {typographyCategory === 'deformation' && (() => {
            const currentOption = getDeformationOption((selectedText as any).deformation);
            return (
            <>
                  <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Type de déformation
                    </label>
                <button
                  onClick={() => setShowDeformationSelector(true)}
                  className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-sm">{currentOption.icon}</span>
                    </div>
                    <span className="font-medium text-gray-900">
                      {currentOption.name}
                    </span>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Intensité de la déformation
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-8">-100</span>
                    <input
                      type="range"
                    min="-100"
                    max="100"
                    value={typeof (selectedText as any).deformationIntensity === 'number' ? (selectedText as any).deformationIntensity : 0}
                    onChange={(e) => updateText(selectedText.id, { deformationIntensity: parseInt(e.target.value, 10) })}
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-500 w-12">+100</span>
                  <span className="text-sm font-medium text-gray-900 w-12 text-right">{typeof (selectedText as any).deformationIntensity === 'number' ? (selectedText as any).deformationIntensity : 0}</span>
                    </div>
                  </div>
            </>
          )})()}
        </div>
      </div>
    );
  }

  // Vue normale avec la liste des textes
  // Labels selon la catégorie
  const categoryLabels = {
    text: { button: 'Ajouter du texte', title: 'Ajouter un texte' },
    nom: { button: 'Ajouter un nom', title: 'Ajouter un nom' },
    numero: { button: 'Ajouter des numéros', title: 'Ajouter des numéros' }
  };
  const labels = categoryLabels[category];
  // Get the category for placement mode
  const placementCategory = category as 'nom' | 'numero';
  return (
    <div className="space-y-4 p-4 md:p-0">
      {/* Bouton Ajouter - padding sur mobile pour éviter la barre */}
      <button
        onClick={() => {
          if ((category === 'nom' || category === 'numero')) {
            // Open zone selector modal
            setShowZoneSelector(true);
          } else {
            setIsAddingText(true);
          }
        }}
        className="w-full px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 font-medium"
      >
        {labels.button}
      </button>
      
      {/* Message when in placement mode */}
      {(isPlacingText && isPlacingText !== null) && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          Cliquez sur une zone du modèle 3D pour placer le {isPlacingText === 'nom' ? 'nom' : 'numéro'}
        </div>
      )}

      {/* Modal de sélection de zone */}
      {showZoneSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }} onClick={() => setShowZoneSelector(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Titre */}
            <h3 className="text-xl font-bold mb-6">{labels.title}</h3>
            
            {filteredZones.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aucune zone disponible pour cette catégorie
              </div>
            ) : (
              <>
                {/* Section de sélection de zone avec images */}
                <div className="mb-6">
                  <p className="mb-3 text-black">Choisissez une position standard</p>
                  <div className="grid grid-cols-2 gap-3">
                    {filteredZones.map((zone) => (
                      <button
                        key={zone.id}
                        onClick={() => {
                          setSelectedZone(zone.id);
                          const zoneView = normalizeZoneView((zone as any)?.view as ('front'|'back'|'left'|'right') | undefined);
                          if (zoneView) {
                            window.dispatchEvent(new CustomEvent('setCameraView', { detail: zoneView }));
                          } else if (zone.zoneCategory) {
                            const mapped = mapZoneCategoryToView(zone.zoneCategory);
                            console.log('📍 Zone cliquée:', zone.name, 'zoneCategory:', zone.zoneCategory, 'vue appliquée:', mapped);
                            dispatchCameraViewForZoneCategory(zone.zoneCategory);
                          }
                        }}
                        className={`relative p-4 bg-gray-100 border-2 rounded-lg hover:border-black transition-all text-left ${
                          selectedZone === zone.id ? 'border-black' : 'border-gray-200'
                        }`}
                      >
                        {selectedZone === zone.id && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-black rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        <div className="bg-white rounded mb-2 flex items-center justify-center h-32">
                          {zone.image ? (
                            <img 
                              src={zone.image} 
                              alt={zone.name}
                              className="max-h-full max-w-full object-contain"
                            />
                          ) : (
                            <div className="text-gray-400 text-xs">Image non disponible</div>
                          )}
                        </div>
                        <div className="font-medium text-gray-900 text-sm text-center">{zone.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section du contenu du texte */}
                <div className="mb-6">
                  <p className="mb-2 text-black">Contenu du texte</p>
                  <input
                    type="text"
                    placeholder="Saisir l'inscription ici..."
                    value={newTextContent}
                    onChange={(e) => setNewTextContent(e.target.value)}
                    className="w-full px-4 py-3 border border-black rounded-lg focus:outline-none"
                  />
                </div>
              </>
            )}
            
            {/* Boutons */}
            <div className="flex justify-center gap-3">
              <button
                onClick={() => {
                  setShowZoneSelector(false);
                  setSelectedZone('');
                  setNewTextContent('');
                }}
                className="flex-1 px-6 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (!selectedZone) {
                    alert('Veuillez sélectionner une zone');
                    return;
                  }
                  
                  const zone = filteredZones.find(z => z.id === selectedZone);
                  if (zone) {
                    // Get default font for the category (use FONT ID; ModelViewer resolves by id)
                    // Forcer "Race" par défaut pour la catégorie numero si disponible
                    let defaultFontFamily = fonts.length > 0 ? fonts[0].id : undefined;
                    if (category === 'numero') {
                      // Chercher Race d'abord dans la liste filtrée fournie au composant, puis dans toutes les polices
                      let race = fonts.find((f: any) => (f.display_name || f.name || '').toLowerCase() === 'race');
                      if (!race && Array.isArray(allFontsRef?.current)) {
                        race = allFontsRef.current.find((f: any) => (f.display_name || f.name || '').toLowerCase() === 'race');
                      }
                      if (race) defaultFontFamily = race.id;
                    }
                    
                    // Calculate fontSize based on zone dimensions
                    // Use defaultTextHeight if available, fallback to 700
                    const fontSize = zone.defaultTextHeight || zone.defaultTextWidth || 700;
                    
                    // Create text in the selected zone with calculated fontSize
                    addText(newTextContent, zone.position, defaultFontFamily, category, fontSize, zone.zoneCategory);
                    
                    // Close modal and reset
                    setShowZoneSelector(false);
                    setSelectedZone('');
                    setNewTextContent('');
                  }
                }}
                className="flex-1 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                {labels.button}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'ajout de texte */}
      {isAddingText && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.25)' }}>
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{labels.title}</h3>
            
            {/* Sélecteur de zone avec vignettes */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-900 mb-3">
                Choisissez une position standard
                    </label>
              
              {isLoadingZones ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="animate-spin w-6 h-6 border-2 border-black border-t-transparent rounded-full mx-auto mb-2"></div>
                  Chargement des zones...
                </div>
              ) : filteredZones.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Aucune zone définie pour cette catégorie</p>
                  <p className="text-xs mt-1">Configurez des zones via l'interface admin</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {filteredZones.map(zone => (
                    <button
                      key={zone.id}
                      onClick={() => {
                        setSelectedZone(zone.id);
                        const zoneView = normalizeZoneView((zone as any)?.view as ('front'|'back'|'left'|'right') | undefined);
                        if (zoneView) {
                          window.dispatchEvent(new CustomEvent('setCameraView', { detail: zoneView }));
                        } else if ((zone as any)?.zoneCategory) {
                          const mapped = mapZoneCategoryToView((zone as any).zoneCategory);
                          console.log('🔍 Modal zone click - zoneCategory:', zone.zoneCategory, 'mapped:', mapped);
                          dispatchCameraViewForZoneCategory((zone as any).zoneCategory);
                        }
                      }}
                      className={`relative p-3 border-2 rounded-lg transition-all hover:shadow-md ${
                        selectedZone === zone.id
                          ? 'border-black bg-gray-100'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      {/* Image de la vignette */}
                      {zone.image ? (
                        <div className="w-full h-32 rounded-md overflow-hidden mb-2 bg-gray-50 flex items-center justify-center">
                          <Image
                            src={zone.image}
                            alt={zone.name}
                            width={160}
                            height={128}
                            className="max-w-full max-h-full object-contain"
                    />
                  </div>
                      ) : (
                        <div className="w-full h-32 rounded-md bg-gray-100 flex items-center justify-center mb-2">
                          <div className="text-gray-400 text-center">
                            <div className="text-2xl mb-1">👕</div>
                            <div className="text-xs">Pas d'image</div>
                          </div>
                        </div>
                      )}
                      
                      {/* Nom de la zone */}
                      <div className="text-sm font-medium text-gray-900 text-center">
                        {zone.name}
                      </div>
                      
                      {/* Indicateur de sélection */}
                      {selectedZone === zone.id && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-black rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
            ))}
          </div>
        )}
      </div>

            {/* Champ de texte */}
            <div className="mb-6">
              <label htmlFor="newText" className="block text-sm font-medium text-gray-900 mb-1">
                Contenu du texte
                      </label>
              <input
                type="text"
                id="newText"
                value={newTextContent}
                onChange={(e) => setNewTextContent(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Saisir l'inscription ici..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-gray-900"
                autoFocus
              />
                    </div>
                    
            {/* Boutons d'action */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsAddingText(false);
                  setNewTextContent('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleAddText}
                className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                disabled={!newTextContent.trim()}
              >
                {labels.button}
              </button>
        </div>
      </div>
        </div>
      )}
      
      {/* Liste des textes existants */}
      {filteredTexts.length > 0 && (
        <div className="space-y-3">
          {filteredTexts.map((text) => (
            <TextItem 
              key={text.id}
              text={text}
              updateText={updateText}
              removeText={removeText}
              onTypographyClick={handleTypographyClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
// Composant LogoTab
function LogoTab({
  placedLogos,
  addLogo,
  updateLogo,
  removeLogo,
  onRequestDelete,
  selectedLogoId,
  selectLogo,
  textZones,
  isLoadingZones,
  logos,
  isLoadingLogos,
  category = 'torse',
  isDraggingLogo,
  setIsDraggingLogo,
  isRotatingLogo,
  setIsRotatingLogo,
  isResizingLogo,
  setIsResizingLogo,
  setLogoLibraryOpen,
  selectedDesign,
  onCategoryChange,
}: {
  placedLogos: Array<{
    id: string;
    logoId: string;
    variantId: string;
    variantFile: string;
    position: [number, number, number];
    scale: number;
    rotation: number;
    locked?: boolean;
    category: string;
    width?: number;
    height?: number;
  }>;
  addLogo: (logoId: string, variantId: string, variantFile: string, position?: [number, number, number], category?: string, initialPixelWidth?: number, initialPixelHeight?: number, initialRotation?: number) => void;
  updateLogo: (id: string, updates: Partial<any>) => void;
  removeLogo: (id: string) => void;
  onRequestDelete?: (id: string) => void;
  selectedLogoId: string | null;
  selectLogo: (id: string | null) => void;
  textZones: TextZone[];
  isLoadingZones: boolean;
  logos: Logo[];
  isLoadingLogos: boolean;
  category?: string;
  isDraggingLogo: boolean;
  setIsDraggingLogo: (dragging: boolean) => void;
  isRotatingLogo: boolean;
  setIsRotatingLogo: (rotating: boolean) => void;
  isResizingLogo: boolean;
  setIsResizingLogo: (resizing: boolean) => void;
  setLogoLibraryOpen: (open: boolean) => void;
  selectedDesign: { id: string | null; svgUrl: string | null };
  onCategoryChange?: (category: string) => void;
}) {
  // Zones filtrées par design
  const zonesForDesign = (selectedDesign && selectedDesign.id)
    ? textZones.filter(z => z.designId === selectedDesign.id)
    : textZones;

  // Catégories dynamiques disponibles pour les logos sur ce design
  const defaultFour = new Set(['torse', 'dos', 'bras-gauche', 'bras-droit']);
  const allCategories = Array.from(new Set(
    zonesForDesign.flatMap(z => {
      const prefixed = (z.categories || [])
        .filter(c => typeof c === 'string' && c.startsWith('logo-'))
        .map(c => c.replace('logo-', ''));
      if (prefixed.length > 0) return prefixed;
      const cat = z.zoneCategory ? String(z.zoneCategory) : '';
      return cat && !defaultFour.has(cat) ? [cat] : [];
    })
  ));
  
  // Trier les catégories dans l'ordre souhaité : Buttpatch en premier pour pantalons, puis Torse / Dos / Bras droit / Bras gauche
  // Utiliser les vraies valeurs des catégories (avec espaces et majuscules)
  const categoryOrder = ['Buttpatch', 'Torse', 'Dos', 'Bras droit', 'Bras gauche'];
  const availableLogoCategories = categoryOrder.filter(cat => allCategories.includes(cat))
    .concat(allCategories.filter(cat => !categoryOrder.includes(cat)));
  
  // Debug: afficher l'ordre des catégories
  console.log('🔍 LogoTab - Catégories détectées:', allCategories);
  console.log('🔍 LogoTab - Ordre appliqué:', availableLogoCategories);

  const [activeCategory, setActiveCategory] = useState<string>(availableLogoCategories[0] || '');
  useEffect(() => {
    if (!activeCategory && availableLogoCategories.length > 0) {
      setActiveCategory(availableLogoCategories[0]);
    }
  }, [availableLogoCategories.join(','), activeCategory]);
  
  // Dézoomer quand la catégorie change - DÉSACTIVÉ pour le moment
  // useEffect(() => {
  //   if (activeCategory && onCategoryChange) {
  //     onCategoryChange(activeCategory);
  //   }
  // }, [activeCategory, onCategoryChange]);

  // (debug retiré)
  const [showLibrary, setShowLibrary] = useState(false);
  const [selectedZone, setSelectedZone] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showVariantSelector, setShowVariantSelector] = useState<string | null>(null);
  const [showZoneSelector, setShowZoneSelector] = useState<{logoId: string, variantId: string, variantFile: string} | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [logoName, setLogoName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [editingLogoId, setEditingLogoId] = useState<string | null>(null);

  // Filtrer les logos placés selon la catégorie active
  const activeCategoryLogos = placedLogos.filter(l => l.category === activeCategory);

  // Filtrer les zones selon la catégorie active et trier par ordre alphabétique
  // NOUVEAU: Ne montrer que les zones qui ont explicitement la catégorie "logo"
  const filteredZones = zonesForDesign
    .filter(zone => {
      // Vérifier que la zone a la catégorie "logo" (ou "logo-" + activeCategory)
      const hasLogoCategory = (zone.categories || []).includes('logo') || 
                              (zone.categories || []).includes(`logo-${activeCategory}`);
      
      // Si la zone a une catégorie logo spécifique, l'utiliser
      if (hasLogoCategory) {
        const hasPrefixed = (zone.categories || []).includes(`logo-${activeCategory}`);
        const cat = zone.zoneCategory ? String(zone.zoneCategory) : '';
        const matchesFallback = !hasPrefixed && !!activeCategory && cat === activeCategory && !defaultFour.has(cat);
        return hasPrefixed || matchesFallback;
      }
      
      // Sinon, ne pas inclure cette zone
      return false;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  // Mettre à jour la zone sélectionnée quand les zones sont chargées
  // Sélectionner la première zone uniquement si aucune n'est choisie ou si la sélection courante n'existe plus
  useEffect(() => {
    if (filteredZones.length > 0) {
      const currentStillValid = selectedZone && filteredZones.some(z => z.id === selectedZone);
      if (!currentStillValid) {
        console.log('🔧 LogoTab: présélection de la première zone', filteredZones[0].id);
        setSelectedZone(filteredZones[0].id);
      }
    }
  }, [filteredZones.length, selectedZone]);

  // Détecter la sélection d'un logo sur le 3D et ouvrir la bibliothèque
  useEffect(() => {
    // Ignore changes during drag to prevent unwanted deselection
    if (isDraggingLogo) {
      console.log('⚠️ Ignoring useEffect during drag - isDraggingLogo:', isDraggingLogo);
      return;
    }
    
    if (selectedLogoId) {
      const selectedLogo = placedLogos.find(l => l.id === selectedLogoId);
      if (selectedLogo) {
        // Changer la catégorie active vers celle du logo sélectionné
        setActiveCategory(selectedLogo.category);
        // Ouvrir la bibliothèque en mode édition
        setEditingLogoId(selectedLogoId);
        setShowLibrary(true);
        setLogoLibraryOpen(true); // Ouvrir le modal mobile aussi
      }
    } else {
      // Désélectionner le logo en cours d'édition et fermer la bibliothèque
      setEditingLogoId(null);
      setShowLibrary(false);
    }
  }, [selectedLogoId, placedLogos, isDraggingLogo]);


  // Libellés par catégorie
  const labels = { button: 'Ajouter un logo', title: 'Ajouter un logo', label: activeCategory };

  // Filtrer les logos par recherche et trier par ordre alphabétique
  const filteredLibraryLogos = logos
    .filter(logo => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        logo.name.toLowerCase().includes(query) ||
        (logo.tags && logo.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  // Gérer la sélection d'une variante (ouvre le sélecteur de zone ou remplace directement)
  const handleVariantSelect = async (logoId: string, variantId: string, variantFile: string) => {
    if (editingLogoId) {
      // Mode édition : modifier le logo existant en gardant la largeur et ajustant la hauteur selon les proportions
      const currentLogo = placedLogos.find(logo => logo.id === editingLogoId);
      const newDimensions = await getSvgDimensions(variantFile);
      
      if (currentLogo?.width && newDimensions.width && newDimensions.height) {
        // Calculer la nouvelle hauteur en gardant la largeur et respectant les proportions du nouveau logo
        const aspectRatio = newDimensions.height / newDimensions.width;
        const newHeight = currentLogo.width * aspectRatio;
        
        updateLogo(editingLogoId, {
          logoId: logoId,
          variantId: variantId,
          variantFile: variantFile,
          // Garder la largeur, ajuster la hauteur selon les proportions
          width: currentLogo.width,
          height: newHeight
        });
      }
      setShowVariantSelector(null);
    } else {
      // Mode ajout : ouvrir le sélecteur de zone (ne pas bouger la caméra ici pour éviter les resets)
      setShowZoneSelector({ logoId, variantId, variantFile });
      setShowVariantSelector(null);
    }
  };

  // Gérer la sélection finale de zone
  const handleZoneSelect = async () => {
    if (showZoneSelector && selectedZone) {
      const zone = filteredZones.find(z => z.id === selectedZone);
      
      if (editingLogoId) {
        // Mode édition : modifier le logo existant en gardant la largeur et ajustant la hauteur selon les proportions
        const currentLogo = placedLogos.find(logo => logo.id === editingLogoId);
        const newDimensions = await getSvgDimensions(showZoneSelector.variantFile);
        
        if (currentLogo?.width && newDimensions.width && newDimensions.height) {
          // Calculer la nouvelle hauteur en gardant la largeur et respectant les proportions du nouveau logo
          const aspectRatio = newDimensions.height / newDimensions.width;
          const newHeight = currentLogo.width * aspectRatio;
          
          updateLogo(editingLogoId, {
            logoId: showZoneSelector.logoId,
            variantId: showZoneSelector.variantId,
            variantFile: showZoneSelector.variantFile,
            // Garder la largeur, ajuster la hauteur selon les proportions
            width: currentLogo.width,
            height: newHeight
          });
        }
        setEditingLogoId(null);
      } else {
      // Mode ajout : ajouter un nouveau logo
        // Passer les dimensions par défaut de la zone (si disponibles) pour initialiser l'échelle
        const iw = (zone as any)?.defaultLogoWidth as number | undefined;
        const ih = (zone as any)?.defaultLogoHeight as number | undefined;
        const ir = (zone as any)?.defaultRotation as number | undefined;
        console.log('🔄 Zone logo - Rotation par défaut:', ir);
        addLogo(
          showZoneSelector.logoId,
          showZoneSelector.variantId,
          showZoneSelector.variantFile,
          zone?.position,
          activeCategory,
          iw,
          ih,
          ir
        );

        // Positionner la caméra selon la vue stockée sur la zone si disponible
        const zoneView = normalizeZoneView((zone as any)?.view as ('front'|'back'|'left'|'right') | undefined);
        if (zoneView) {
          console.log('📸 Application de la vue liée à la zone:', zoneView);
          window.dispatchEvent(new CustomEvent('setCameraView', { detail: zoneView }));
        } else if ((zone as any)?.zoneCategory) {
          dispatchCameraViewForZoneCategory((zone as any).zoneCategory);
        } else {
          dispatchCameraViewForZoneCategory(activeCategory);
        }
      }
      
      setShowZoneSelector(null);
    }
  };

  // Gérer l'upload d'un logo personnalisé (placement direct sur le 3D, pas de sauvegarde)
  const handleUploadLogo = async () => {
    if (!selectedFile) {
      alert('Veuillez sélectionner un fichier');
      return;
    }

    setIsUploading(true);

    try {
      // Uploader le fichier vers Supabase Storage
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const uploadResponse = await fetch('/api/logos/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Erreur lors de l\'upload du logo');
      }
      
      const { url: publicUrl } = await uploadResponse.json();
      console.log('✅ Logo uploadé vers Supabase:', publicUrl);

      // Convertir l'URL publique en data URL pour l'affichage (compatibilité client)
      const fileResponse = await fetch(publicUrl);
      const blob = await fileResponse.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Obtenir les dimensions du fichier
      const dimensions = await getSvgDimensions(dataUrl);
      
      // Créer un ID temporaire pour le logo importé
      const tempLogoId = `imported-${Date.now()}`;
      const tempVariantId = `variant-${Date.now()}`;

      // Fermer le modal d'import
      setShowImportModal(false);
      setSelectedFile(null);

      if (editingLogoId) {
        // Mode édition : modifier le logo existant
        const currentLogo = placedLogos.find(logo => logo.id === editingLogoId);
        
        if (currentLogo?.width && dimensions.width && dimensions.height) {
          // Calculer la nouvelle hauteur en gardant la largeur et respectant les proportions
          const aspectRatio = dimensions.height / dimensions.width;
          const newHeight = currentLogo.width * aspectRatio;
          
          updateLogo(editingLogoId, {
            logoId: tempLogoId,
            variantId: tempVariantId,
            variantFile: publicUrl, // Utiliser l'URL Supabase au lieu de data URL
            width: currentLogo.width,
            height: newHeight
          });
        }
      } else {
        // Mode ajout : ouvrir le sélecteur de zone avec le logo importé
        setShowZoneSelector({
          logoId: tempLogoId,
          variantId: tempVariantId,
          variantFile: publicUrl // Utiliser l'URL Supabase au lieu de data URL
        });
      }
    } catch (error) {
      console.error('Error processing uploaded logo:', error);
      alert('Erreur lors du traitement du logo');
    } finally {
      setIsUploading(false);
    }
  };

  // Si on est en mode sélecteur de variantes
  if (showVariantSelector) {
    const selectedLibraryLogo = logos.find(l => l.id === showVariantSelector);
    if (!selectedLibraryLogo) {
      setShowVariantSelector(null);
      return null;
    }

    return (
      <div className="h-full flex flex-col">
        {/* Header avec bouton retour */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <button
            onClick={() => setShowVariantSelector(null)}
            className="flex items-center gap-2 text-black hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
            <span className="font-medium">Retour</span>
          </button>
          
          <div className="flex items-center gap-3">
            <span className="font-medium text-gray-900">Choisir une variante</span>
          </div>
        </div>
        
        {/* Contenu des variantes */}
        <div className="flex-1 p-4 overflow-y-auto">
          <h3 className="text-lg font-bold text-gray-900 mb-4">{selectedLibraryLogo.name}</h3>
          <div className="grid grid-cols-4 gap-4">
            {selectedLibraryLogo.variants
              .sort((a, b) => {
                // Mettre la variante "default" en premier
                if (a.name.toLowerCase() === 'default') return -1;
                if (b.name.toLowerCase() === 'default') return 1;
                // Ensuite trier par ordre alphabétique
                return a.name.localeCompare(b.name);
              })
              .map((variant) => (
              <button
                key={variant.id}
                onClick={() => handleVariantSelect(selectedLibraryLogo.id, variant.id, variant.file)}
                className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="relative w-full h-12 bg-gray-100 rounded mb-2 flex items-center justify-center">
                  {variant.file.endsWith('.svg') ? (
                    <img
                      src={variant.file}
                      alt={variant.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <Image
                      src={variant.file}
                      alt={variant.name}
                      width={96}
                      height={96}
                      className="object-contain"
                    />
                  )}
                </div>
                <p className="text-[10px] font-medium text-gray-900 text-center truncate leading-tight">{variant.name}</p>
                    </button>
                  ))}
          </div>
        </div>
      </div>
    );
  }

  // Modal d'import de logo
  const importModal = showImportModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.25)' }}>
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Importer un logo</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Fichier (SVG, PNG, JPG, JPEG)
              </label>
              <input
                type="file"
                accept=".svg,.png,.jpg,.jpeg"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            {selectedFile && (
              <div className="text-sm text-black">
                Fichier sélectionné : {selectedFile.name}
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => {
                setShowImportModal(false);
                setSelectedFile(null);
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={handleUploadLogo}
              disabled={!selectedFile || isUploading}
              className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Upload...' : 'Importer'}
            </button>
          </div>
              </div>
      </div>
    </div>
  );

  // Modal de sélection de zone
  const zoneModal = showZoneSelector && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.25)' }}>
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Choisir une zone de placement</h3>
          
          {/* Sélection de zone par vignettes */}
          <div className="mb-6">
            {isLoadingZones ? (
              <div className="text-center py-4 text-gray-500">Chargement...</div>
            ) : filteredZones.length > 0 ? (
              <div className="grid grid-cols-4 gap-3">
                {filteredZones.map((zone) => (
                  <button
                    key={zone.id}
                    onClick={() => {
                      setSelectedZone(zone.id);
                      const zoneView = normalizeZoneView((zone as any)?.view as ('front'|'back'|'left'|'right') | undefined);
                      if (zoneView) {
                        window.dispatchEvent(new CustomEvent('setCameraView', { detail: zoneView }));
                      } else if ((zone as any)?.zoneCategory) {
                        dispatchCameraViewForZoneCategory((zone as any).zoneCategory);
                      }
                    }}
                    className={`relative rounded-lg border-2 overflow-hidden transition-all ${
                      selectedZone === zone.id
                        ? 'border-black ring-2 ring-gray-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {zone.image ? (
                      <div className="relative h-32 bg-gray-100">
                        <Image
                          src={zone.image}
                          alt={zone.name}
                          width={160}
                          height={128}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="h-32 bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-400 text-xs">Pas d'image</span>
                      </div>
                    )}
                    <div className="p-2 bg-white">
                      <p className="text-xs font-medium text-gray-900 text-center truncate">
                        {zone.name}
                      </p>
                    </div>
                    {selectedZone === zone.id && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-black rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
            ))}
          </div>
            ) : (
              <div className="text-center py-4 text-gray-500 text-sm">
                Aucune zone disponible pour cette catégorie. Créez des zones dans l'admin.
          </div>
        )}
      </div>

          {/* Boutons */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowZoneSelector(null)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={handleZoneSelect}
              disabled={!selectedZone}
              className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Confirmer
            </button>
        </div>
        </div>
      </div>
    </div>
  );
  // Si on est en mode bibliothèque
  if (showLibrary) {
    return (
      <div className="h-full flex flex-col">
        {/* Header avec bouton retour */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200">
          <button
            onClick={() => {
              setShowLibrary(false);
              setLogoLibraryOpen(false);
              if (editingLogoId) {
                setEditingLogoId(null);
                selectLogo(null); // Désélectionner le logo sur le 3D
              }
            }}
            className="flex items-center gap-2 text-black hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Retour</span>
          </button>
          
          <div className="flex items-center gap-3">
            <span className="font-medium text-gray-900">
              {editingLogoId ? 'Modifier le logo' : 'Bibliothèque de logos'}
            </span>
          </div>
        </div>

        {/* Contenu fixe (non scrollable) */}
        <div className="flex-shrink-0 px-4 pt-4 pb-0">
          {/* Boutons d'action - Supprimer (si en mode édition) et Importer */}
          <div className="mb-4 flex gap-3">
            {/* Bouton supprimer (visible seulement en mode édition) */}
            {editingLogoId && (
              <button
                onClick={() => {
                  if (onRequestDelete) {
                    onRequestDelete(editingLogoId);
                  } else {
                    removeLogo(editingLogoId);
                  }
                  // Fermer la bibliothèque après suppression
                  setShowLibrary(false);
                  setLogoLibraryOpen(false);
                  setEditingLogoId(null);
                  selectLogo(null);
                }}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Supprimer
              </button>
            )}
            
            {/* Bouton d'importation */}
            <button
              onClick={() => setShowImportModal(true)}
              className={`px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 ${editingLogoId ? 'flex-1' : 'w-full'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Importer un logo
            </button>
          </div>
          
          {/* Barre de recherche (fixe) */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Rechercher un logo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        {/* Zone scrollable (seulement la grille de logos) */}
        <div className="overflow-y-scroll px-4 pb-4 overscroll-contain -webkit-overflow-scrolling-touch" style={{ WebkitOverflowScrolling: 'touch', height: 'calc(70vh - 280px)' }}>

          {isLoadingLogos ? (
            <div className="text-center py-4 text-gray-500">Chargement...</div>
          ) : filteredLibraryLogos.length > 0 ? (
            <>
              {/* Version Desktop - Grille 4 colonnes */}
              <div className="hidden md:grid grid-cols-4 gap-3 pb-4">
                {filteredLibraryLogos
                  .sort((a, b) => {
                    // Trier par ordre alphabétique
                    return a.name.localeCompare(b.name);
                  })
                  .map((logo) => {
                    // Trier les variantes pour mettre "default" en premier
                    const sortedVariants = logo.variants.sort((a, b) => {
                      if (a.name.toLowerCase() === 'default') return -1;
                      if (b.name.toLowerCase() === 'default') return 1;
                      return a.name.localeCompare(b.name);
                    });
                    const primaryVariant = sortedVariants[0];
                    
                    return (
                    <button
                      key={logo.id}
                      onClick={async () => {
                      if (logo.variants.length === 1) {
                        // Si une seule variante
                        if (editingLogoId) {
                          // Mode édition : modifier le logo existant en gardant la largeur et ajustant la hauteur selon les proportions
                          const currentLogo = placedLogos.find(l => l.id === editingLogoId);
                          const newDimensions = await getSvgDimensions(primaryVariant.file);
                          
                          if (currentLogo?.width && newDimensions.width && newDimensions.height) {
                            // Calculer la nouvelle hauteur en gardant la largeur et respectant les proportions du nouveau logo
                            const aspectRatio = newDimensions.height / newDimensions.width;
                            const newHeight = currentLogo.width * aspectRatio;
                            
                            updateLogo(editingLogoId, {
                              logoId: logo.id,
                              variantId: primaryVariant.id,
                              variantFile: primaryVariant.file,
                              // Garder la largeur, ajuster la hauteur selon les proportions
                              width: currentLogo.width,
                              height: newHeight
                            });
                          }
                        } else {
                          // Mode ajout : ouvrir le sélecteur de zone
                          setShowZoneSelector({ logoId: logo.id, variantId: primaryVariant.id, variantFile: primaryVariant.file });
                        }
                      } else {
                        // Sinon, ouvrir le sélecteur de variantes
                        setShowVariantSelector(logo.id);
                      }
                    }}
                    className="border border-gray-200 rounded-lg p-2 hover:bg-gray-50 transition-colors"
                  >
                    <div className="relative w-full h-12 bg-gray-100 rounded mb-2 flex items-center justify-center">
                      {primaryVariant.file.endsWith('.svg') ? (
                        <img
                          src={primaryVariant.file}
                          alt={logo.name}
                          className="max-w-full max-h-full object-contain"
                      />
                      ) : (
                        <Image
                          src={primaryVariant.file}
                          alt={logo.name}
                          width={80}
                          height={80}
                          className="object-contain"
                        />
                      )}
                  </div>
                  <p className="text-xs font-medium text-gray-900 text-center truncate">
                    {logo.name}
                  </p>
                  {logo.variants.length > 1 && (
                    <p className="text-xs text-gray-500 text-center">
                      variantes
                    </p>
                  )}
                </button>
                    );
                  })}
            </div>

            {/* Version Mobile - Slider horizontal avec flèches */}
            <div className="md:hidden relative pb-2">
            <div className="overflow-x-auto" id="logo-library-slider" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', overscrollBehavior: 'contain', touchAction: 'pan-x' }}>
                <div className="flex gap-3 min-w-max pb-2">
                  {filteredLibraryLogos
                    .sort((a, b) => {
                      // Trier par ordre alphabétique
                      return a.name.localeCompare(b.name);
                    })
                    .map((logo) => {
                      // Trier les variantes pour mettre "default" en premier
                      const sortedVariants = logo.variants.sort((a, b) => {
                        if (a.name.toLowerCase() === 'default') return -1;
                        if (b.name.toLowerCase() === 'default') return 1;
                        return a.name.localeCompare(b.name);
                      });
                      const primaryVariant = sortedVariants[0];
                      
                      return (
                      <button
                        key={logo.id}
                        onClick={async () => {
                          if (logo.variants.length === 1) {
                            if (editingLogoId) {
                              const currentLogo = placedLogos.find(l => l.id === editingLogoId);
                              const newDimensions = await getSvgDimensions(primaryVariant.file);
                              
                              if (currentLogo?.width && newDimensions.width && newDimensions.height) {
                                const aspectRatio = newDimensions.height / newDimensions.width;
                                const newHeight = currentLogo.width * aspectRatio;
                                
                                updateLogo(editingLogoId, {
                                  logoId: logo.id,
                                  variantId: primaryVariant.id,
                                  variantFile: primaryVariant.file,
                                  width: currentLogo.width,
                                  height: newHeight
                                });
                              }
                            } else {
                            setShowZoneSelector({ logoId: logo.id, variantId: primaryVariant.id, variantFile: primaryVariant.file });
                          }
                        } else {
                          setShowVariantSelector(logo.id);
                        }
                      }}
                      className="border border-gray-200 rounded-lg p-2 hover:bg-gray-50 transition-colors flex-shrink-0 w-20"
                    >
                      <div className="relative w-full h-12 bg-gray-100 rounded mb-1 flex items-center justify-center">
                        {primaryVariant.file.endsWith('.svg') ? (
                          <img
                            src={primaryVariant.file}
                            alt={logo.name}
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <Image
                            src={primaryVariant.file}
                            alt={logo.name}
                            width={48}
                            height={48}
                            className="object-contain"
                          />
                        )}
                      </div>
                      <p className="text-xs font-medium text-gray-900 text-center truncate">
                        {logo.name}
                      </p>
                      {logo.variants.length > 1 && (
                        <p className="text-xs text-gray-500 text-center">
                          {logo.variants.length}
                        </p>
                      )}
                    </button>
                      );
                    })}
                </div>
              </div>

              {/* Flèches de navigation */}
              <button
                onClick={() => {
                  const container = document.getElementById('logo-library-slider');
                  if (container) container.scrollLeft -= 100;
                }}
                className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-gray-100 flex items-center justify-center shadow-lg z-10"
              >
                <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => {
                  const container = document.getElementById('logo-library-slider');
                  if (container) container.scrollLeft += 100;
                }}
                className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-gray-100 flex items-center justify-center shadow-lg z-10"
              >
                <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            </>
          ) : (
            <div className="text-center py-4 text-gray-500 text-sm">
              {searchQuery ? 'Aucun logo trouvé' : 'Aucun logo disponible. Ajoutez des logos dans l\'admin.'}
            </div>
          )}
        </div>
        
        {/* Modals */}
        {importModal}
        {zoneModal}
      </div>
    );
  }
  // Vue par défaut : Onglets de catégories avec boutons "Ajouter un logo"
  return (
    <div className="h-full flex flex-col">
      {/* bandeau debug retiré */}
      {/* Onglets de catégories dynamiques */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white">
        <div className="flex">
          {(availableLogoCategories.length ? availableLogoCategories : []).map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                dispatchCameraViewForZoneCategory(cat);
              }}
              className={`flex-1 px-3 py-0 text-sm font-medium transition-colors border-b-2 ${
                activeCategory === cat
                  ? 'border-black text-black bg-gray-100'
                  : 'border-transparent text-black hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
          </div>
        </div>
        
      <div className="flex-1 overflow-y-auto p-4">
        {/* Bouton "Ajouter un logo" pour la catégorie active */}
        <div className="mb-3 md:mb-6">
          <button
            onClick={() => { setShowLibrary(true); setLogoLibraryOpen(true); }}
            className="w-full px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {labels.button}
          </button>
        </div>

        {/* Liste des logos placés */}
        <div className="mb-2 md:mb-3">
          <h3 className="text-base font-semibold text-gray-900">Logos placés ({activeCategoryLogos.length})</h3>
        </div>
        
        {activeCategoryLogos.length > 0 ? (
          <>
          {/* Version Desktop - Liste verticale */}
          <div className="hidden md:block space-y-3">
            {activeCategoryLogos.map((logo) => {
              const libraryLogo = logos.find(l => l.id === logo.logoId);
              const variant = libraryLogo?.variants.find(v => v.id === logo.variantId);
              
              return (
                <div key={logo.id}>
                  <div 
                    className={`flex items-center gap-3 p-3 bg-white border-2 rounded-lg transition-colors cursor-pointer hover:bg-gray-50 ${
                      selectedLogoId === logo.id ? 'border-black' : 'border-gray-200'
                    }`}
                    onClick={() => {
                      // Sélectionner le logo sur le 3D et ouvrir la bibliothèque en mode édition
                      selectLogo(logo.id);
                      setEditingLogoId(logo.id);
                      setShowLibrary(true);
                      setLogoLibraryOpen(true);
                    }}
                  >
                    {/* Aperçu du logo */}
                    <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                      {logo.variantFile.endsWith('.svg') ? (
                        <img
                          src={logo.variantFile}
                          alt={libraryLogo?.name || 'Logo'}
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <Image
                          src={logo.variantFile}
                          alt={libraryLogo?.name || 'Logo'}
                          width={64}
                          height={64}
                          className="object-contain"
                        />
                      )}
                    </div>

                    {/* Infos du logo */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {libraryLogo?.name || 'Logo'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {variant?.name || 'Variante'}
                      </p>
                    </div>

                    {/* Bouton supprimer */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Empêcher la sélection du logo
                        if (onRequestDelete) {
                          onRequestDelete(logo.id);
                        } else {
                          removeLogo(logo.id);
                        }
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Contrôles du logo sélectionné */}
                  {selectedLogoId === logo.id && (
                    <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Taille du logo
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="0.1"
                            max="3"
                            step="0.1"
                            value={logo.scale}
                            onChange={(e) => updateLogo(logo.id, { scale: parseFloat(e.target.value) })}
                            disabled={logo.locked}
                            className={`flex-1 ${logo.locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                          />
                          <span className={`text-sm min-w-[60px] ${logo.locked ? 'text-gray-400' : 'text-black'}`}>
                            {(logo.scale * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Version Mobile - Slider horizontal */}
          <div className="md:hidden relative">
            <div className="overflow-x-auto" id="placed-logos-slider" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', overscrollBehavior: 'contain', touchAction: 'pan-x' }}>
              <div className="flex gap-3 min-w-max pb-2">
                {activeCategoryLogos.map((logo) => {
                  const libraryLogo = logos.find(l => l.id === logo.logoId);
                  const variant = libraryLogo?.variants.find(v => v.id === logo.variantId);
                  
                  return (
                    <button
                      key={logo.id}
                      onClick={() => {
                        selectLogo(logo.id);
                        setEditingLogoId(logo.id);
                        setShowLibrary(true);
                        setLogoLibraryOpen(true);
                      }}
                      className={`border-2 rounded-lg p-2 transition-colors flex-shrink-0 w-20 ${
                        selectedLogoId === logo.id ? 'border-black bg-gray-100' : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-full h-12 bg-gray-100 rounded mb-1 flex items-center justify-center">
                        {logo.variantFile.endsWith('.svg') ? (
                          <img
                            src={logo.variantFile}
                            alt={libraryLogo?.name || 'Logo'}
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <Image
                            src={logo.variantFile}
                            alt={libraryLogo?.name || 'Logo'}
                            width={48}
                            height={48}
                            className="object-contain"
                          />
                        )}
                      </div>
                      <p className="text-xs font-medium text-gray-900 text-center truncate">
                        {libraryLogo?.name || 'Logo'}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Flèches de navigation */}
            {activeCategoryLogos.length > 3 && (
              <>
                <button
                  onClick={() => {
                    const container = document.getElementById('placed-logos-slider');
                    if (container) container.scrollLeft -= 100;
                  }}
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-gray-100 flex items-center justify-center shadow-lg z-10"
                >
                  <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    const container = document.getElementById('placed-logos-slider');
                    if (container) container.scrollLeft += 100;
                  }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-gray-100 flex items-center justify-center shadow-lg z-10"
                >
                  <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm font-medium">Aucun logo ajouté</p>
            <p className="text-xs mt-1">Cliquez sur "Ajouter un logo" pour commencer</p>
          </div>
        )}
      </div>
      
      {/* Modals */}
      {importModal}
      {zoneModal}
    </div>
  );
}

function TextItem({ 
  text, 
  updateText, 
  removeText,
  onTypographyClick
}: {
  text: {
    id: string;
    content: string;
    position: [number, number, number];
    fontSize: number;
    color: string;
    editable: boolean;
    locked?: boolean;
    category: 'text' | 'nom' | 'numero';
    fontFamily?: string;
    strokeColor?: string;
    strokeWidth?: number;
    deformation?: string;
    deformationIntensity?: number;
  };
  updateText: (id: string, updates: Partial<any>) => void;
  removeText: (id: string) => void;
  onTypographyClick: (textId: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
      {/* Aperçu du texte avec styles */}
      <div className="flex-1 px-4 py-3 min-h-[50px] flex items-center">
        <span 
          className="font-medium truncate text-xl"
          style={{
            color: text.color,
            fontFamily: (typeof text.fontFamily === 'string' && text.fontFamily.length > 0) ? text.fontFamily : undefined,
            textShadow: text.strokeColor && text.strokeWidth && text.strokeWidth > 0
              ? `
                -1px -1px 0 ${text.strokeColor},
                1px -1px 0 ${text.strokeColor},
                -1px 1px 0 ${text.strokeColor},
                1px 1px 0 ${text.strokeColor}
              `
              : 'none'
          }}
        >
          {text.content || 'Texte vide'}
        </span>
      </div>
      
      {/* Bouton typographie avec flèche */}
      <button
        onClick={() => onTypographyClick(text.id)}
        className="flex items-center justify-center p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors w-12 h-12"
        title="Modifier la typographie"
      >
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      
      {/* Bouton supprimer */}
      <button
        onClick={() => !text.locked && removeText(text.id)}
        disabled={text.locked}
        className={`p-2 rounded-lg transition-colors ${
          text.locked 
            ? 'text-gray-300 cursor-not-allowed' 
            : 'text-red-500 hover:text-red-700 hover:bg-red-50'
        }`}
        title={text.locked ? "Texte verrouillé - Impossible de supprimer" : "Supprimer le texte"}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}
export default function ConfigurePage() {
  // Logs de montage supprimés pour éviter les boucles infinies
  useEffect(() => {
    const w = window as typeof window & { __STRETCHMX_BUILD?: string };
    w.__STRETCHMX_BUILD = 'QEASQNP8N';
    console.warn('🔥 ConfigurePage build marker: QEASQNP8N', w.__STRETCHMX_BUILD);
  }, []);

useEffect(() => {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  if (isLinkedPrefillParam(params.get('prefill'))) {
    let changed = false;
    if (params.has('config')) {
      params.delete('config');
      changed = true;
    }
    const triggers = ['fresh', 'config', 'customer_email', 'return_from_login'];
    if (triggers.some((key) => window.sessionStorage.getItem(`__skip_${key}`) === '1')) {
      triggers.forEach((key) => {
        try {
          window.sessionStorage.removeItem(`__skip_${key}`);
        } catch {}
      });
      return;
    }
    if (params.has('fresh')) {
      params.delete('fresh');
      changed = true;
    }
    if (changed) {
      const newQuery = params.toString();
      const newUrl = `${window.location.pathname}${newQuery ? `?${newQuery}` : ''}`;
      window.history.replaceState({}, '', newUrl);
      console.log('🧹 URL nettoyée pour préconfiguration liée', newUrl);
    }
  }
}, []);
  
  // Récupérer le productId depuis les paramètres de l'URL
  const [productId, setProductId] = useState<string | null>(null);

  // Bootstrap: si on ouvre via ?productId=... sans config, préparer une configuration et rediriger avec le numéro
  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const productId = params.get('productId');
        const variantId = params.get('variantId');
        const configId = params.get('config');
        const customerEmail = params.get('customer_email');
        
        // Si on a productId + variantId mais pas de config, préparer une nouvelle configuration
        if (productId && variantId && !configId) {
          console.log('🔢 Préparation nouvelle configuration pour produit:', productId, variantId);
          
          try {
            const prepareResponse = await fetch('/api/configurations/prepare', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ productId, variantId, customerEmail })
            });
            
            if (prepareResponse.ok) {
              const { configNumber } = await prepareResponse.json();
              console.log('✅ Configuration préparée avec numéro:', configNumber);
              
              // Marquer explicitement la nouvelle configuration (session-scoped)
              try { sessionStorage.setItem('__new_config', '1'); } catch {}
              
              // Rediriger vers l'URL avec le numéro de configuration et fresh=1
              const newParams = new URLSearchParams(window.location.search);
              newParams.set('config', configNumber);
              newParams.set('fresh', '1');
              const newUrl = `${window.location.pathname}?${newParams.toString()}`;
              window.location.replace(newUrl);
              return;
            } else {
              console.error('❌ Erreur préparation configuration:', await prepareResponse.text());
            }
          } catch (error) {
            console.error('❌ Erreur lors de la préparation:', error);
            // Continuer sans préparation si erreur
          }
        }
        
        // Si on a config mais pas productId, résoudre productId via model mapping
        const hasProduct = !!params.get('productId');
        if (!configId || hasProduct) return;

        // Récupérer la configuration (API publique)
        const r = await fetch(`/api/configurations/${encodeURIComponent(configId)}`, { headers: { 'Accept': 'application/json' } });
        if (!r.ok) return;
        const data = await r.json();
        const cfg = data?.config_data || data?.config || data;
        const variant = data?.variantId || cfg?.variantId;
        const modelUrl = cfg?.modelUrl || cfg?.model_url;

        let inferredProductId: string | null = null;
        if (modelUrl) {
          // Associer modelUrl -> model_id -> product mapping
          const modelsRes = await fetch('/api/models');
          if (modelsRes.ok) {
            const models = await modelsRes.json();
            const m = Array.isArray(models) ? models.find((mm: any) => mm.glbUrl === modelUrl) : null;
            if (m?.id) {
              const mapRes = await fetch(`/api/product-mappings?model_id=${encodeURIComponent(m.id)}`);
              if (mapRes.ok) {
                const map = await mapRes.json();
                if (map?.shopify_product_id) inferredProductId = String(map.shopify_product_id);
              }
            }
          }
        }

        if (inferredProductId || variant) {
          const newParams = new URLSearchParams(window.location.search);
          if (inferredProductId) newParams.set('productId', inferredProductId);
          if (variant) newParams.set('variantId', String(variant));
          const newUrl = `${window.location.pathname}?${newParams.toString()}`;
          window.location.replace(newUrl);
        }
      } catch (e) {
        // silent fail, on continue le flux normal
      }
    })();
  }, []);
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setProductId(params.get('productId'));
    // Support direct model selection via URL (for local testing)
    const urlModelId = params.get('modelId');
    const urlModelUrl = params.get('modelUrl');
    if (urlModelId) {
      setConfigModelId(urlModelId);
    }
    if (urlModelUrl) {
      setConfigModelUrl(urlModelUrl);
    }
  }, []);
  
  const { selectedDesign, selectDesign } = useDesignSelection();
const { colors, updateColor, resetColors, replaceColors } = useColorSelection();
  const { fonts } = useFonts();
  const { fonts: fontsForNames } = useFilteredFonts('names');
  const { fonts: fontsForNumbers } = useFilteredFonts('numbers');
  // Ref vers toutes les polices chargées (non filtrées)
  const allFontsRef = useRef<any[]>([]);
  useEffect(() => {
    // Charger toutes les polices une fois via l'API globale déjà utilisée par useFonts
    (async () => {
      try {
        const res = await fetch('/api/fonts');
        if (res.ok) {
          const data = await res.json();
          allFontsRef.current = data || [];
        }
      } catch {}
    })();
  }, []);
  const { logos, isLoading: isLoadingLogos } = useLogos(selectedDesign?.id ?? null);
  
  // État pour stocker l'URL du modèle depuis une configuration sauvegardée
  const [configModelUrl, setConfigModelUrl] = useState<string | null>(null);
  
  // État pour stocker l'ID du modèle depuis une configuration sauvegardée
  const [configModelId, setConfigModelId] = useState<string | null>(null);
  
  // État pour stocker les design_ids autorisés depuis une configuration sauvegardée
  const [configDesignIds, setConfigDesignIds] = useState<string[] | null>(null);
  
  // Mémoriser configDesignIds pour éviter les re-rendus inutiles
  const memoizedConfigDesignIds = useMemo(() => configDesignIds, [configDesignIds?.join(',')]);

  // Pré-filtrer les designs dès le boot quand on arrive via ?config=... & variantId sans productId
  // Objectif: ne montrer que le design de la sauvegarde le plus vite possible
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const cfg = params.get('config');
      const variant = params.get('variantId');
      const pid = params.get('productId');
      if (cfg && variant && !pid) {
        (async () => {
          try {
            const res = await fetch(`/api/configurations/${encodeURIComponent(cfg)}`);
            if (!res.ok) return;
            const data = await res.json();
            let designId = data?.config_data?.designId || data?.designId || data?.config?.designId || null;
            if (!designId) {
              // Fallback via designUrl → /api/designs mapping
              const designUrl = data?.config_data?.designUrl || data?.config_data?.design?.svgUrl || null;
              if (designUrl) {
                try {
                  const dRes = await fetch('/api/designs');
                  const dList = await dRes.json();
                  const file = String(designUrl).split('/').pop();
                  const match = (dList || []).find((d: any) => d.svgUrl === designUrl || (d.svgUrl && d.svgUrl.split('/').pop() === file));
                  if (match?.id) {
                    designId = match.id;
                  }
                } catch {}
              }
            }
            if (designId) setConfigDesignIds([String(designId)]);
          } catch {}
        })();
      }
    } catch {}
  }, []);
  
  const { modelUrl, textureMaps, materialMaps, modelId, isLoading: modelIsLoading } = useAutoLoadModel(configModelId, configModelUrl, productId);
  
  // Si designId est dans l'URL mais pas de modelId/configModelId/productId, charger le premier modèle disponible
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hasDesignId = params.get('designId');
    const hasModelParam = params.get('modelId') || params.get('modelUrl');
    
    if (hasDesignId && !hasModelParam && !configModelId && !configModelUrl && !productId && !modelId && !modelIsLoading) {
      // Charger le premier modèle disponible si aucun n'est chargé
      (async () => {
        try {
          const res = await fetch('/api/models');
          const models = await res.json();
          if (models && models.length > 0) {
            const firstModel = models[0];
            setConfigModelId(firstModel.id);
            setConfigModelUrl(firstModel.glbUrl);
            console.log('🎯 Modèle automatiquement chargé pour designId:', hasDesignId, '->', firstModel.name);
          }
        } catch (e) {
          console.warn('⚠️ Impossible de charger un modèle automatiquement:', e);
        }
      })();
    }
  }, [configModelId, configModelUrl, productId, modelId, modelIsLoading]);
  
  // Fonction pour contrôler la caméra (à passer aux composants enfants)
  const setCameraView = useCallback((view: 'front' | 'back' | 'left' | 'right') => {
    // Cette fonction sera implémentée dans Viewer3D et passée via ref ou event
    window.dispatchEvent(new CustomEvent('setCameraView', { detail: view }));
  }, []);
  
  // États pour l'interface
  const [productMapping, setProductMapping] = useState<{ shopify_product_id: string; model_id: string; design_ids: string[]; model_type?: 'maillot' | 'pantalon' } | null>(null);
  useEffect(() => {
    if (!productId) return;
    (async () => {
      try {
        const res = await fetch(`/api/product-mappings?shopify_product_id=${encodeURIComponent(productId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data) setProductMapping(data);
        }
      } catch (e) {
        console.warn('⚠️ Impossible de charger le mapping produit:', e);
      }
    })();
  }, [productId]);
  
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [isRotatingText, setIsRotatingText] = useState(false);
  const [isResizingText, setIsResizingText] = useState(false);
  const [isRotatingLogo, setIsRotatingLogo] = useState(false);
  const [isResizingLogo, setIsResizingLogo] = useState(false);
  const [autoOpenTypography, setAutoOpenTypography] = useState<{textId: string | null, shouldOpen: boolean}>({textId: null, shouldOpen: false});
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'design' | 'color' | 'numero' | 'nom' | 'text' | 'logo'>('design');
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [isLogoLibraryOpen, setIsLogoLibraryOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{textId: string, textContent: string} | null>(null);
  const [logoDeleteConfirmation, setLogoDeleteConfirmation] = useState<{logoId: string, logoName: string} | null>(null);

  // Si on arrive avec seulement un variantId (sans productId), masquer tous les designs
  // sauf le design actuellement sélectionné (lié à la sauvegarde en cours)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const hasVariantOnly = !!params.get('variantId') && !params.get('productId');
      const currentDesignId = selectedDesign?.id || null;
      if (hasVariantOnly && currentDesignId) {
        // Forcer le filtrage sur le seul design courant
        if (!configDesignIds || configDesignIds.length !== 1 || configDesignIds[0] !== currentDesignId) {
          setConfigDesignIds([currentDesignId]);
        }
      }
    } catch {}
  }, [selectedDesign?.id]);
  const [showColorWarningModal, setShowColorWarningModal] = useState(false);
  
  // États pour la sélection de taille
  const [isSizeModalOpen, setIsSizeModalOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState<{id: string, name: string} | null>(null);
  const productTitleCacheRef = useRef<Map<string, string>>(new Map());
  const shopifyProductsCacheRef = useRef<Map<string, any>>(new Map());
  const defaultVariantCacheRef = useRef<Map<string, string | null>>(new Map());
  const shopifyProductsLoadedRef = useRef(false);
  const productMappingsCacheRef = useRef<Map<string, any | null>>(new Map());
  const designNameCacheRef = useRef<Map<string, string>>(new Map());
  const designCacheInitializedRef = useRef(false);
  const [linkedProductLink, setLinkedProductLink] = useState<LinkedProductLink | null>(null);
  const [linkedProductTitle, setLinkedProductTitle] = useState<string | null>(null);
  const [pendingCartInfo, setPendingCartInfo] = useState<AddToCartSuccess | null>(null);
  const [showLinkedProductPrompt, setShowLinkedProductPrompt] = useState(false);
  const [pendingLinkedPrefill, setPendingLinkedPrefill] = useState<{
    colors: Record<string, string>;
    targetDesignId?: string | null;
    targetProductId?: string | null;
    targetCanonicalProductId?: string | null;
    targetVariantId?: string | null;
    targetCanonicalVariantId?: string | null;
    auto_apply_colors?: boolean;
  } | null>(null);
  const [isLinkedPrefillActive, setIsLinkedPrefillActive] = useState(false);
  const [hasPendingLinkedPrefill, setHasPendingLinkedPrefill] = useState(false);

  const resolveDefaultVariantId = useCallback(
    async (productId?: string | null) => {
      const canonical = normalizeShopifyProductId(productId ?? null);
      if (!canonical) return null;

      if (defaultVariantCacheRef.current.has(canonical)) {
        return defaultVariantCacheRef.current.get(canonical) ?? null;
      }

      try {
        const response = await fetch(
          `/api/shopify/default-variant?productId=${encodeURIComponent(canonical)}`,
          { cache: 'no-store' }
        );
        if (response.ok) {
          const data = await response.json();
          const variantId =
            data?.variantId != null && String(data.variantId).trim().length > 0
              ? String(data.variantId)
              : null;
          defaultVariantCacheRef.current.set(canonical, variantId);
          return variantId;
        }
        console.warn(
          '⚠️ Impossible de récupérer la variante par défaut (HTTP %s) pour le produit %s',
          response.status,
          canonical
        );
      } catch (error) {
        console.warn('⚠️ Impossible de récupérer la variante par défaut:', error);
      }

      defaultVariantCacheRef.current.set(canonical, null);
      return null;
    },
    []
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const active = window.sessionStorage?.getItem('linked_prefill_active') === '1';
      setIsLinkedPrefillActive(active);
    } catch {}
  }, []);

  useEffect(() => {
    if (pendingLinkedPrefill) {
      setIsLinkedPrefillActive(true);
      return;
    }
    if (typeof window === 'undefined') {
      setIsLinkedPrefillActive(false);
      return;
    }
    try {
      const active = window.sessionStorage?.getItem('linked_prefill_active') === '1';
      setIsLinkedPrefillActive(active);
    } catch {
      setIsLinkedPrefillActive(false);
    }
  }, [pendingLinkedPrefill]);

  const loadLinkedProductTitle = useCallback(async (productId: string) => {
    if (!productId) {
      setLinkedProductTitle(null);
      return;
    }

    const canonical = normalizeShopifyProductId(productId) ?? productId;
    const cached =
      productTitleCacheRef.current.get(productId) ??
      productTitleCacheRef.current.get(canonical);
    if (cached) {
      setLinkedProductTitle(cached);
      return;
    }

    try {
      if (!shopifyProductsLoadedRef.current) {
        const response = await fetch('/api/shopify-products');
        if (response.ok) {
          const products = await response.json();
          if (Array.isArray(products)) {
            products.forEach((item: any) => {
              if (!item?.shopify_product_id) return;
              const canonicalId = normalizeShopifyProductId(item.shopify_product_id);
              shopifyProductsCacheRef.current.set(item.shopify_product_id, item);
              if (canonicalId && canonicalId !== item.shopify_product_id) {
                shopifyProductsCacheRef.current.set(canonicalId, item);
              }
              const rawLabel =
                item.shopify_product_title ||
                item.title ||
                item.name ||
                null;
              if (rawLabel) {
                productTitleCacheRef.current.set(item.shopify_product_id, rawLabel);
                if (canonicalId && canonicalId !== item.shopify_product_id) {
                  productTitleCacheRef.current.set(canonicalId, rawLabel);
                }
              }
            });
          }
        }
        shopifyProductsLoadedRef.current = true;
      }

      const canonicalId = normalizeShopifyProductId(productId) ?? productId;

      let product =
        shopifyProductsCacheRef.current.get(productId) ||
        shopifyProductsCacheRef.current.get(canonicalId) ||
        null;

      let mapping =
        productMappingsCacheRef.current.get(productId) ??
        productMappingsCacheRef.current.get(canonicalId);
      if (mapping === undefined) {
        try {
          const mappingResponse = await fetch(
            `/api/product-mappings?shopify_product_id=${encodeURIComponent(canonicalId)}`
          );
          if (mappingResponse.ok) {
            mapping = await mappingResponse.json();
          } else {
            mapping = null;
          }
        } catch {
          mapping = null;
        }
        productMappingsCacheRef.current.set(productId, mapping);
        if (canonicalId && canonicalId !== productId) {
          productMappingsCacheRef.current.set(canonicalId, mapping);
        }
      }

      if (mapping && !product) {
        product = { model_type: mapping.model_type ?? null };
      }

      let designName: string | null = null;
      const designId =
        (mapping?.design_ids && mapping.design_ids[0]) ||
        product?.design_id ||
        null;

      if (designId) {
        if (!designNameCacheRef.current.has(designId)) {
          if (!designCacheInitializedRef.current) {
            try {
              const designsResponse = await fetch('/api/designs');
              if (designsResponse.ok) {
                const designs = await designsResponse.json();
                if (Array.isArray(designs)) {
                  designs.forEach((design: any) => {
                    if (design?.id) {
                      designNameCacheRef.current.set(
                        design.id,
                        design.name || design.id
                      );
                    }
                  });
                }
              }
            } catch (error) {
              console.warn('⚠️ Impossible de charger les designs:', error);
            }
            designCacheInitializedRef.current = true;
          }
        }
        designName =
          designNameCacheRef.current.get(designId) || String(designId);
      }

      const rawTitle =
        product?.shopify_product_title &&
        product.shopify_product_title !== productId &&
        product.shopify_product_title !== canonicalId
          ? String(product.shopify_product_title)
          : null;
      const modelType =
        mapping?.model_type ||
        product?.model_type ||
        product?.modelLabel ||
        null;
      const humanModel =
        typeof modelType === 'string' && modelType.length > 0
          ? modelType.charAt(0).toUpperCase() + modelType.slice(1)
          : null;

      let finalLabel = rawTitle;

      if (!finalLabel) {
        if (humanModel && designName) {
          finalLabel = `${humanModel} ${designName}`;
        } else if (designName) {
          finalLabel = designName;
        } else if (humanModel) {
          finalLabel = humanModel;
        }
      }

      if (!finalLabel) {
        finalLabel = productId;
      }

      productTitleCacheRef.current.set(productId, finalLabel);
      if (canonicalId && canonicalId !== productId) {
        productTitleCacheRef.current.set(canonicalId, finalLabel);
      }
      setLinkedProductTitle(finalLabel);
    } catch (error) {
      console.warn('⚠️ Impossible de charger le nom du produit lié:', error);
      setLinkedProductTitle(productId);
    }
  }, []);
  
  // État pour le mode placement de texte
  const [isPlacingText, setIsPlacingText] = useState<'nom' | 'numero' | null>(null);
  
  // États pour le loading screen
  const [modelLoaded, setModelLoaded] = useState(false);
  const [showLoading, setShowLoading] = useState(true);

  // Vérifier l'accès Shopify au chargement
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hasShopifyParams = params.get('shop') || params.get('productId') || params.get('variantId');
    const hasConfigParam = params.get('config'); // Paramètre pour modifier une config existante
    const hasModelParam = params.get('modelId') || params.get('modelUrl'); // Paramètres pour charger directement un modèle
    const hasDesignParam = params.get('designId'); // Paramètre pour charger directement un design
    
    // Autoriser l'accès si :
    // 1. Il y a des paramètres Shopify (nouvelle config)
    // 2. OU il y a un paramètre config (modification d'une config existante)
    // 3. OU il y a un paramètre modelId/modelUrl (chargement direct d'un modèle pour test)
    // 4. OU il y a un paramètre designId (chargement direct d'un design pour test)
    if (!hasShopifyParams && !hasConfigParam && !hasModelParam && !hasDesignParam) {
      // Rediriger vers la page d'accueil si aucun paramètre valide
      window.location.href = '/';
    }
  }, []);

  // Masquer le loading après le chargement du modèle
  useEffect(() => {
    if (!modelIsLoading && modelUrl) {
      // Attendre un peu pour que le rendu 3D soit complet
      const timer = setTimeout(() => {
        setModelLoaded(true);
        // Masquer le loading avec une transition
        setTimeout(() => setShowLoading(false), 300);
      }, 4000); // Délai pour garantir que tout est chargé (augmenté de 3s à 4s)
      
      return () => clearTimeout(timer);
    }
  }, [modelIsLoading, modelUrl]);

  // État pour gérer l'ouverture automatique du panneau typographie
  const [shouldOpenTypographyPanel, setShouldOpenTypographyPanel] = useState<string | null>(null);

  // Fonction de callback pour gérer l'ouverture/fermeture automatique du panneau typographie
  const handleTextSelectionChange = useCallback((textId: string | null, shouldAutoOpen: boolean) => {
    
    if (shouldAutoOpen && textId) {
      // Ouvrir automatiquement le panneau typographie et basculer sur l'onglet nom/numero
      // La logique sera gérée dans le useEffect qui suit
      setAutoOpenTypography({textId, shouldOpen: true});
      setShouldOpenTypographyPanel(textId);
      
      // Sur mobile, s'assurer que le modal s'ouvre
      if (window.innerWidth < 768) {
        setIsMobileModalOpen(true);
      }
      
    } else if (!textId) {
      // Fermer le panneau typographie si aucun texte n'est sélectionné
      setAutoOpenTypography({textId: null, shouldOpen: false});
      setShouldOpenTypographyPanel(null);
    }
  }, []);

  // Hook pour gérer le texte avec callback
  const { 
    texts, 
    addText, 
    updateText, 
    removeText, 
    updateTextPosition,
    updateTextRotation,
    updateTextSize,
    toggleTextLock,
    selectedTextId,
    selectText,
    loadTexts, // Fonction pour charger tous les textes
  } = useTextSelection(handleTextSelectionChange);

  // Gérer l'ouverture automatique du panneau pour nom/numero (sans onglet 'text')
  useEffect(() => {
    if (autoOpenTypography?.shouldOpen && autoOpenTypography.textId && texts.length > 0) {
      // Trouver le texte pour déterminer l'onglet
      const t = texts.find(tx => tx.id === autoOpenTypography.textId);
      if (t) {
        if (t.category === 'nom') {
          setActiveTab('nom');
          setShouldOpenTypographyPanel(autoOpenTypography.textId);
        } else if (t.category === 'numero') {
          setActiveTab('numero');
          setShouldOpenTypographyPanel(autoOpenTypography.textId);
        }
      }
    }
  }, [autoOpenTypography?.shouldOpen, autoOpenTypography?.textId, texts.length]);
  
  // Fonction de callback pour gérer la sélection de logo
  const handleLogoSelectionChange = (logoId: string | null) => {
    
    if (!logoId) {
      // Désélection du logo → Ne rien changer à l'onglet actif
    } else {
      // Sélection du logo → Ouvrir l'onglet logo
      setActiveTab('logo');
    }
  };

  // Hook pour gérer les logos
  const {
    placedLogos,
    addLogo,
    updateLogo,
    removeLogo,
    updateLogoPosition,
    updateLogoRotation,
    updateLogoScale,
    toggleLogoLock,
    selectedLogoId,
    selectLogo: selectLogoRaw,
    isDraggingLogo,
    setIsDraggingLogo,
    startDraggingLogo,
    stopDraggingLogo,
    loadPlacedLogos,
  } = useLogoSelection(handleLogoSelectionChange);
  
  // Use a ref to track isDraggingLogo in real-time for the selectLogo wrapper
  const isDraggingLogoRef = useRef(false);
  
  // Update the ref whenever isDraggingLogo changes
  useEffect(() => {
    isDraggingLogoRef.current = isDraggingLogo;
    console.log('🔄 isDraggingLogoRef updated to:', isDraggingLogo);
  }, [isDraggingLogo]);
  
  // Wrapper to prevent deselection during drag
  const selectLogo = useCallback((id: string | null) => {
    if (id === null && isDraggingLogoRef.current) {
      console.log('⚠️ page.tsx: Blocked deselection during drag, isDraggingLogoRef.current:', isDraggingLogoRef.current);
      return;
    }
    console.log('✅ page.tsx: selectLogo called:', { id, isDraggingLogo: isDraggingLogoRef.current });
    selectLogoRaw(id);
  }, [selectLogoRaw]);
  

  // Fonction pour demander la confirmation de suppression
  const requestDeleteConfirmation = (textId: string) => {
    const text = texts.find(t => t.id === textId);
    if (text) {
      setDeleteConfirmation({
        textId: textId,
        textContent: text.content
      });
    }
  };

  // Use refs to always access current values
  const placedLogosRef = useRef(placedLogos);
  const logosRef = useRef(logos);
  
  useEffect(() => {
    placedLogosRef.current = placedLogos;
  }, [placedLogos]);
  
  useEffect(() => {
    logosRef.current = logos;
  }, [logos]);

  // Fonction pour demander la confirmation de suppression de logo
  const requestLogoDeleteConfirmation = (logoId: string) => {
    const logo = placedLogosRef.current.find(l => l.id === logoId);
    if (logo) {
      const libraryLogo = logosRef.current.find(l => l.id === logo.logoId);
      setLogoDeleteConfirmation({
        logoId: logoId,
        logoName: libraryLogo?.name || 'Logo inconnu'
      });
    }
  };


  // Fonction pour confirmer la suppression
  const confirmDelete = () => {
    if (deleteConfirmation) {
      removeText(deleteConfirmation.textId);
      // Désélectionner le texte supprimé
      if (selectedTextId === deleteConfirmation.textId) {
        selectText(null, false);
      }
      setDeleteConfirmation(null);
    }
  };

  // Fonction pour confirmer la suppression de logo
  const confirmLogoDelete = () => {
    if (logoDeleteConfirmation) {
      removeLogo(logoDeleteConfirmation.logoId);
      // Désélectionner le logo supprimé
      if (selectedLogoId === logoDeleteConfirmation.logoId) {
        selectLogo(null);
      }
      setLogoDeleteConfirmation(null);
    }
  };

  // Fonction pour annuler la suppression
  const cancelDelete = () => {
    setDeleteConfirmation(null);
  };

  // Fonction pour annuler la suppression de logo
  const cancelLogoDelete = () => {
    setLogoDeleteConfirmation(null);
  };

  const { zones: textZones, isLoading: isLoadingZones } = useTextZones(selectedDesign?.id ?? null);

  // Fonction pour gérer le placement de texte depuis le modèle 3D
  const handleTextPlaced = useCallback((category: 'nom' | 'numero', position: [number, number, number], zoneCategory?: string, rotation?: number) => {
    console.log('📍 Texte placé:', { category, position, zoneCategory, rotation });
    
    // Trouver la première font par défaut selon la catégorie
    const defaultFonts = category === 'nom' ? fontsForNames : fontsForNumbers;
    let defaultFontFamily = defaultFonts.length > 0 ? defaultFonts[0].id : undefined;
    if (category === 'numero') {
      let race = defaultFonts.find((f: any) => (f.display_name || f.name || '').toLowerCase() === 'race');
      if (!race && Array.isArray(allFontsRef?.current)) {
        race = allFontsRef.current.find((f: any) => (f.display_name || f.name || '').toLowerCase() === 'race');
      }
      if (race) defaultFontFamily = race.id;
    }
    
    // Trouver la zone correspondante pour obtenir ses dimensions
    const zone = textZones.find(z => z.zoneCategory === zoneCategory && z.categories?.includes(category));
    const fontSize = zone?.defaultTextHeight || zone?.defaultTextWidth || 700;
    
    // Créer le texte à la position cliquée avec fontSize calculé
    addText('', position, defaultFontFamily, category, fontSize, zoneCategory, rotation);
    
    // Désactiver le mode placement
    setIsPlacingText(null);
  }, [addText, fontsForNames, fontsForNumbers, textZones]);

  // Récupérer les paramètres Shopify depuis l'URL (si disponibles)
  const [shopifyConfig, setShopifyConfig] = useState<{
    shopDomain?: string;
    productId?: string;
    variantId?: string;
  }>({});

      useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const shopParam = params.get('shop') || '5ae84f-3.myshopify.com';

        // Convertir le domaine Shopify interne vers le domaine public
        const publicDomain = shopParam.includes('myshopify.com') ? 'stretchmx.com' : shopParam;

        const rawProductId = params.get('productId');
        const normalizedProductId =
          normalizeShopifyProductId(rawProductId) ??
          rawProductId ??
          '15663861137757';

        const rawVariantId = params.get('variantId');
        const normalizedVariantId =
          normalizeShopifyProductId(rawVariantId) ??
          rawVariantId ??
          '58755538813277';

        setShopifyConfig({
          // Valeurs par défaut (production)
          shopDomain: publicDomain,
          productId: normalizedProductId,
          variantId: normalizedVariantId,
        });

        // Log pour debug
        // Shopify Config
      }, []);

  useEffect(() => {
    if (!shopifyConfig.productId) {
      setLinkedProductLink(null);
      setLinkedProductTitle(null);
      setPendingCartInfo(null);
      setShowLinkedProductPrompt(false);
      return;
    }

    let isActive = true;

    const readHistory = (): Array<{ source: string; target: string }> => {
      try {
        const raw = window.sessionStorage.getItem('linked_history');
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed
          .filter(
            (entry) =>
              entry &&
              typeof entry.source === 'string' &&
              typeof entry.target === 'string'
          )
          .map((entry) => ({
            ...entry,
            source: normalizeShopifyProductId(entry.source) ?? entry.source,
            target: normalizeShopifyProductId(entry.target) ?? entry.target,
          }))
          .slice(-20);
      } catch (error) {
        console.warn('⚠️ Impossible de lire linked_history:', error);
        return [];
      }
    };

    const hasVisited = (
      history: Array<{ source: string; target: string }>,
      a: string,
      b: string
    ) =>
      history.some(
        (entry) =>
          (isSameShopifyProductId(entry.source, a) &&
            isSameShopifyProductId(entry.target, b)) ||
          (isSameShopifyProductId(entry.source, b) &&
            isSameShopifyProductId(entry.target, a))
      );

    const pickForwardLink = (
      links: LinkedProductLink[] | null | undefined,
      history: Array<{ source: string; target: string }>
    ): LinkedProductLink | null => {
      if (!Array.isArray(links)) return null;
      const match = links.find(
        (item) => !hasVisited(history, item.primary_product_id, item.linked_product_id)
      );
      return match || null;
    };

    const pickReversedLink = (
      links: LinkedProductLink[] | null | undefined,
      history: Array<{ source: string; target: string }>
    ): LinkedProductLink | null => {
      if (!Array.isArray(links)) return null;
      const match = links.find(
        (item) => !hasVisited(history, item.primary_product_id, item.linked_product_id)
      );
      if (!match) return null;
      return {
        ...match,
        primary_product_id: match.linked_product_id,
        primary_design_id: match.linked_design_id,
        linked_product_id: match.primary_product_id,
        linked_design_id: match.primary_design_id,
        linked_variant_id: match.linked_variant_id ?? null,
      };
    };

    async function fetchLinkedProduct() {
      const encodedProductId = encodeURIComponent(shopifyConfig.productId!);
      const history = readHistory();
      let fetchedLink: LinkedProductLink | null = null;

      try {
        if (selectedDesign?.id) {
          const response = await fetch(
            `/api/product-links?primary_product_id=${encodedProductId}&primary_design_id=${encodeURIComponent(selectedDesign.id)}`
          );
          if (response.ok) {
            const data = await response.json();
            fetchedLink = pickForwardLink(data, history);
          }
        }

        if (!fetchedLink) {
          const response = await fetch(
            `/api/product-links?primary_product_id=${encodedProductId}&primary_design_id=null`
          );
          if (response.ok) {
            const data = await response.json();
            fetchedLink = pickForwardLink(data, history);
          }
        }

        if (!fetchedLink) {
          const response = await fetch(
            `/api/product-links?linked_product_id=${encodedProductId}`
          );
          if (response.ok) {
            const data = await response.json();
            fetchedLink = pickReversedLink(data, history);
          }
        }
      } catch (error) {
        console.warn('⚠️ Impossible de charger les liaisons produit:', error);
      }

      if (!isActive) return;

      if (!fetchedLink) {
        window.sessionStorage.removeItem('linked_history');
        setLinkedProductLink(null);
        setLinkedProductTitle(null);
        setPendingCartInfo(null);
        setShowLinkedProductPrompt(false);
        return;
      }

      setLinkedProductLink(fetchedLink);
      setPendingCartInfo(null);
      setShowLinkedProductPrompt(false);
      await loadLinkedProductTitle(fetchedLink.linked_product_id);
    }

    fetchLinkedProduct();

    return () => {
      isActive = false;
    };
  }, [shopifyConfig.productId, selectedDesign?.id, loadLinkedProductTitle]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!shopifyConfig.productId) return;

    try {
      let raw = window.localStorage.getItem('linked_prefill');
      if (!raw) {
        raw = window.sessionStorage.getItem('linked_prefill');
      }
      console.log('🔎 Lecture linked_prefill (local/session storage):', raw);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      const targetProductId =
        typeof parsed?.targetProductId === 'string'
          ? parsed.targetProductId
          : parsed?.targetProductId != null
          ? String(parsed.targetProductId)
          : null;
      const targetCanonical =
        typeof parsed?.targetCanonicalProductId === 'string'
          ? parsed.targetCanonicalProductId
          : normalizeShopifyProductId(targetProductId);
      const targetVariantId =
        typeof parsed?.targetVariantId === 'string'
          ? parsed.targetVariantId
          : parsed?.targetVariantId != null
          ? String(parsed.targetVariantId)
          : parsed?.targetVariantId === null
          ? null
          : parsed?.targetVariantId;
      const targetVariantCanonical =
        typeof parsed?.targetCanonicalVariantId === 'string'
          ? parsed.targetCanonicalVariantId
          : normalizeShopifyProductId(targetVariantId);

      const matchesCurrentProduct =
        isSameShopifyProductId(targetProductId, shopifyConfig.productId) ||
        (targetCanonical
          ? isSameShopifyProductId(
              targetCanonical,
              shopifyConfig.productId
            )
          : false);

      if (matchesCurrentProduct) {
        try {
          window.sessionStorage?.setItem('linked_prefill_active', '1');
        } catch {}
        console.log('🔗 Linked prefill payload trouvé pour ce produit', parsed);
        setIsLinkedPrefillActive(true);
        setHasPendingLinkedPrefill(true);
        setPendingLinkedPrefill({
          ...parsed,
          targetProductId,
          targetCanonicalProductId: targetCanonical ?? null,
          targetVariantId:
            targetVariantId != null ? String(targetVariantId) : null,
          targetCanonicalVariantId:
            targetVariantCanonical ?? targetVariantId ?? null,
        });
        window.localStorage.removeItem('linked_prefill');
        window.sessionStorage.removeItem('linked_prefill');
      } else {
        setHasPendingLinkedPrefill(false);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement de la pré-configuration liée:', error);
      try {
        window.localStorage.removeItem('linked_prefill');
        window.sessionStorage.removeItem('linked_prefill');
      } catch {}
      setHasPendingLinkedPrefill(false);
      console.log('ℹ️ Aucun linked_prefill applicable trouvé pour ce produit');
    }
  }, [shopifyConfig.productId]);

  useEffect(() => {
    if (!pendingLinkedPrefill) {
      console.log('ℹ️ pendingLinkedPrefill vidé');
      setHasPendingLinkedPrefill(false);
      return;
    }
    console.log('✅ pendingLinkedPrefill détecté', pendingLinkedPrefill);
    setHasPendingLinkedPrefill(true);

    if (!selectedDesign?.id) {
      console.log('⏸️ Préconfiguration liée en attente du design chargé');
      return;
    }

    if (
      pendingLinkedPrefill.targetDesignId &&
      pendingLinkedPrefill.targetDesignId !== selectedDesign.id
    ) {
      console.log(
        '⏸️ Préconfiguration liée en attente du design',
        pendingLinkedPrefill.targetDesignId,
        'actuel:',
        selectedDesign.id
      );
      return;
    }

    if (pendingLinkedPrefill.auto_apply_colors === false) {
      try {
        window.sessionStorage?.removeItem('linked_prefill_active');
      } catch {}
      setIsLinkedPrefillActive(false);
      setHasPendingLinkedPrefill(false);
      setPendingLinkedPrefill(null);
      return;
    }

    const colorsToApply = pendingLinkedPrefill.colors || {};
    console.log('🎯 Application préconfiguration liée', {
      targetProductId: pendingLinkedPrefill.targetProductId,
      targetCanonicalProductId: pendingLinkedPrefill.targetCanonicalProductId,
      targetDesignId: pendingLinkedPrefill.targetDesignId,
      selectedDesignId: selectedDesign.id,
      colorKeys: Object.keys(colorsToApply),
    });
    console.log('🎯 Application préconfiguration liée', {
      targetProductId: pendingLinkedPrefill.targetProductId,
      targetCanonicalProductId: pendingLinkedPrefill.targetCanonicalProductId,
      targetDesignId: pendingLinkedPrefill.targetDesignId,
      selectedDesignId: selectedDesign.id,
      colorKeys: Object.keys(colorsToApply),
    });

    const applyColors = () => {
    const sanitized: Record<string, string> = {};
      Object.entries(colorsToApply).forEach(([key, value]) => {
        if (typeof value === 'string' && value.trim()) {
        sanitized[normalizeColorKey(key)] = value;
        }
      });

      replaceColors(sanitized);

      Object.entries(sanitized).forEach(([key, value]) => {
        updateColor(key, value);
      });
      console.log('🎨 Couleurs liées appliquées', sanitized);
      setPendingLinkedPrefill(null);
      setHasPendingLinkedPrefill(false);
      setTimeout(() => {
        try {
        const params = new URLSearchParams(window.location.search);
        if (isLinkedPrefillParam(params.get('prefill'))) {
            params.set('prefill', 'linked_done');
            const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
            window.history.replaceState({}, '', newUrl);
          }
          window.sessionStorage?.removeItem('linked_prefill_active');
          setIsLinkedPrefillActive(false);
          setHasPendingLinkedPrefill(false);
          localStorage.removeItem('auto_save_config');
          const pid =
            params.get('productId') ||
            pendingLinkedPrefill.targetProductId ||
            pendingLinkedPrefill.targetCanonicalProductId ||
            shopifyConfig.productId ||
            'dev';
          const mid =
            params.get('modelId') ||
            modelId ||
            '';
          const vid =
            params.get('variantId') ||
            pendingLinkedPrefill.targetVariantId ||
            pendingLinkedPrefill.targetCanonicalVariantId ||
            shopifyConfig.variantId ||
            '';
          if (pid) {
            localStorage.removeItem(`cfg:${pid}:latest`);
            localStorage.removeItem(`cfg:${pid}:${mid}:${vid}`);
          }
        } catch (cleanupError) {
          console.warn('⚠️ Impossible de nettoyer l\'auto-sauvegarde après préconfiguration liée:', cleanupError);
        }
      }, 0);
    };

    // Appliquer juste après la mise à jour du design
    const timer = setTimeout(applyColors, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [pendingLinkedPrefill, selectedDesign.id, updateColor, replaceColors]);

  // Vérifier si on est en mode preview
  const isPreviewMode = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('preview') === 'true';
  }, []);

  // Intégration Shopify pour les actions des boutons mobiles
  const {
    isLoading: isShopifyLoading,
    saveConfiguration: saveShopifyConfiguration,
    addToCart: addToShopifyCart,
    loadConfiguration,
    capturePreview,
  } = useShopifyIntegration(
    shopifyConfig.shopDomain && shopifyConfig.productId
      ? {
          shopDomain: shopifyConfig.shopDomain!,
          productId: shopifyConfig.productId!,
          variantId: shopifyConfig.variantId,
        }
      : undefined
  );

  // Détection du client Shopify connecté
  const { customer, isLoggedIn, isLoading: isCustomerLoading } = useShopifyCustomer(
    shopifyConfig.shopDomain
  );

  // Utiliser simplement la détection du hook
  const finalIsLoggedIn = isLoggedIn;

  // État pour la modal de connexion
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Debug: Afficher le statut de connexion (simplifié)
  // Ref pour éviter les appels multiples
  const tempConfigProcessedRef = useRef(false);
  const autoSaveTriggeredRef = useRef(false);
  
  // Détecter le retour après connexion et sauvegarder automatiquement
  useEffect(() => {
    console.log('🔍 useEffect auto-save - finalIsLoggedIn:', finalIsLoggedIn, 'customer?.email:', customer?.email, 'autoSaveTriggeredRef.current:', autoSaveTriggeredRef.current);
    
    if (finalIsLoggedIn && customer?.email && !autoSaveTriggeredRef.current) {
      const tempConfigKey = 'temp_design_config';
      const tempConfigData = localStorage.getItem(tempConfigKey);
      
      console.log('🔍 Données temporaires trouvées:', !!tempConfigData);
      
      if (tempConfigData) {
        console.log('🔍 Configuration temporaire trouvée après connexion, sauvegarde automatique...');
        autoSaveTriggeredRef.current = true; // Éviter les appels multiples
        
        try {
          const configData = JSON.parse(tempConfigData);
          configData.customerEmail = customer.email;
          
          console.log('📦 Données à sauvegarder:', { texts: configData.texts?.length, logos: configData.logos?.length });
          
          saveShopifyConfiguration(configData).then(savedConfigId => {
            console.log('✅ Configuration sauvegardée automatiquement:', savedConfigId);
            // Supprimer la configuration temporaire
            localStorage.removeItem(tempConfigKey);
            localStorage.removeItem('pending_config_id');
            
            // Attendre un peu et rediriger vers Mon compte
            setTimeout(() => {
              window.location.href = `https://${shopifyConfig.shopDomain}/account?config_saved=true`;
            }, 1000);
          }).catch(error => {
            console.error('❌ Erreur lors de la sauvegarde automatique:', error);
            autoSaveTriggeredRef.current = false;
          });
        } catch (parseError) {
          console.error('❌ Erreur parsing config temporaire:', parseError);
          autoSaveTriggeredRef.current = false;
        }
      } else {
        console.log('⚠️ Aucune configuration temporaire trouvée dans localStorage');
      }
    }
  }, [finalIsLoggedIn, customer?.email, shopifyConfig.shopDomain, saveShopifyConfiguration]);
  
  // Détecter le retour depuis la connexion et sauvegarder automatiquement
  useEffect(() => {
    console.log('🔍 useEffect retour appelé - URL:', window.location.href);
    const tempConfigKey = 'temp_design_config';
    const tempConfigData = localStorage.getItem(tempConfigKey);
    
    console.log('🔍 useEffect retour - tempConfigData:', !!tempConfigData, 'finalIsLoggedIn:', finalIsLoggedIn);
    
    // Si on a une config temporaire ET qu'on est connecté, déclencher la sauvegarde automatique
    if (tempConfigData && finalIsLoggedIn && customer?.email) {
      console.log('🔍 Configuration temporaire détectée, déclenchement de la sauvegarde...');
      // Forcer le déclenchement du useEffect de sauvegarde automatique
      autoSaveTriggeredRef.current = false;
      // Le useEffect de sauvegarde automatique va détecter le changement
    }
  }, [finalIsLoggedIn, customer?.email]);

  // Fonction pour détecter si on est sur mobile
  const isMobile = () => {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 768;
  };
  // Fonction pour afficher un modal de chargement sur mobile
  const showLoadingModal = () => {
    if (!isMobile()) return null; // Ne pas afficher sur desktop
    
    const loadingModal = document.createElement('div');
    loadingModal.id = 'save-loading-modal';
    loadingModal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    loadingModal.innerHTML = `
      <div style="background: white; padding: 32px; border-radius: 16px; text-align: center; max-width: 90%; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);">
        <div style="width: 60px; height: 60px; border: 4px solid #f3f3f3; border-top: 4px solid #000; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
        <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 600; color: #1f2937;">Sauvegarde en cours...</h2>
        <p style="margin: 0; color: #6b7280; font-size: 14px;">Redirection vers Mon compte dans quelques instants</p>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
    
    document.body.appendChild(loadingModal);
    return loadingModal;
  };

  // Fonction pour fermer le modal de chargement
  const hideLoadingModal = () => {
    const modal = document.getElementById('save-loading-modal');
    if (modal) {
      modal.remove();
    }
  };
  // Fonction wrapper pour sauvegarder avec vérification d'authentification
  const handleSaveConfiguration = async (configData: any) => {
    
    // Afficher le modal de chargement sur mobile avant de commencer la sauvegarde
    const loadingModal = showLoadingModal();

    // Ajouter l'email du client si connecté
    if (finalIsLoggedIn && customer?.email) {
      configData.customerEmail = customer.email;
    }

    // Si pas connecté, sauvegarder temporairement dans Supabase et localStorage, puis afficher la modal de connexion
    if (!finalIsLoggedIn) {
      console.log('🔍 DEBUG - Utilisateur non connecté, sauvegarde temporaire dans Supabase');
      
      try {
        // D'abord sauvegarder dans Supabase pour avoir un vrai ID
        const tempConfigResponse = await fetch('/api/temp-configs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(configData),
        });
        
        if (!tempConfigResponse.ok) {
          throw new Error('Erreur sauvegarde temporaire Supabase');
        }
        
        const { id: tempConfigId } = await tempConfigResponse.json();
        console.log('✅ Configuration temporaire sauvegardée dans Supabase:', tempConfigId);
        
        // Sauvegarder aussi dans localStorage ET dans un cookie (fallback)
        // IMPORTANT: Exclure previewUrl car c'est une image base64 très volumineuse qui dépasse la limite localStorage
        // L'image est déjà sauvegardée dans Supabase, on peut la récupérer depuis là
        const tempConfigKey = 'temp_design_config';
        const { previewUrl, ...configDataWithoutPreview } = configData;
        const configJson = JSON.stringify(configDataWithoutPreview);
        
        try {
          localStorage.setItem(tempConfigKey, configJson);
          console.log('✅ Configuration sauvegardée dans localStorage (sans previewUrl)');
        } catch (error) {
          console.warn('⚠️ Impossible de sauvegarder dans localStorage (quota dépassé):', error);
          // Ne pas bloquer le flux si localStorage échoue, Supabase est la source principale
        }
        
        // Sauvegarder aussi dans un cookie (persiste entre domaines) - sans previewUrl aussi
        try {
          document.cookie = `temp_design_config=${encodeURIComponent(configJson)}; path=/; max-age=3600; SameSite=Lax`;
        } catch (error) {
          console.warn('⚠️ Impossible de sauvegarder dans cookie (trop volumineux):', error);
        }
        
        // Stocker l'ID Supabase dans localStorage (sera passé via URL)
        localStorage.setItem('pending_config_id', tempConfigId);
        console.log('✅ ID Supabase sauvegardé:', tempConfigId);
        
        // Afficher la modal de connexion au lieu de rediriger directement
        hideLoadingModal(); // Fermer le modal si on affiche la modal de connexion
        setShowLoginModal(true);
        return;
      } catch (error) {
        console.error('❌ Erreur sauvegarde temporaire:', error);
        alert('Erreur lors de la sauvegarde temporaire. Veuillez réessayer.');
        hideLoadingModal();
        return;
      }
    }

    console.log('🔍 DEBUG - Utilisateur connecté, sauvegarde directe');
    // Vérifier s'il y a une configuration temporaire à traiter en priorité
    const tempConfigKey = 'temp_design_config';
    const tempConfigData = localStorage.getItem(tempConfigKey);
    
    if (tempConfigData && finalIsLoggedIn && customer?.email) {
      console.log('🔍 Configuration temporaire trouvée, traitement en priorité...');
      tempConfigProcessedRef.current = true;
      const tempConfig = JSON.parse(tempConfigData);
      tempConfig.customerEmail = customer.email;
      
      saveShopifyConfiguration(tempConfig).then(savedConfigId => {
        console.log('✅ Configuration temporaire sauvegardée:', savedConfigId);
        if (savedConfigId) {
          localStorage.removeItem(tempConfigKey);
          localStorage.removeItem('pending_config_id');
          // Garder le modal affiché pendant la redirection
          setTimeout(() => {
            window.location.href = `https://${shopifyConfig.shopDomain}/account?config_saved=true`;
          }, 500);
        } else {
          hideLoadingModal(); // Fermer si erreur
        }
      }).catch(error => {
        console.error('❌ Erreur sauvegarde config temporaire:', error);
        tempConfigProcessedRef.current = false;
        hideLoadingModal(); // Fermer le modal en cas d'erreur
      });
      return;
    }
    
    // Si connecté, sauvegarder directement
    try {
      const savedConfigId = await saveShopifyConfiguration(configData);
      
      if (savedConfigId) {
        console.log('🔍 DEBUG - Configuration sauvegardée, redirection vers Mon compte');
        // Garder le modal affiché pendant la redirection (le modal disparaîtra avec la page)
        // Rediriger vers "Mon compte" après sauvegarde
        // Utiliser window.location.href au lieu de window.open() pour fonctionner sur mobile
        setTimeout(() => {
          window.location.href = `https://${shopifyConfig.shopDomain}/account?config_saved=true`;
        }, 2000); // Attendre 2 secondes
      } else {
        hideLoadingModal(); // Fermer si pas de configId sauvegardé
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      hideLoadingModal(); // Fermer le modal en cas d'erreur
      
      // Gérer l'erreur de limite de configurations
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      const isLimitError = errorMessage.includes('Limite de 10 configurations');
      
      if (isLimitError) {
        // Afficher le modal de limite
        const limitModal = document.createElement('div');
        limitModal.id = 'save-limit-modal';
        limitModal.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10000;
          font-family: inherit;
          animation: fadeIn 0.3s ease-in-out;
        `;
        limitModal.innerHTML = `
          <div style="background: white; padding: 40px; border-radius: 12px; text-align: center; max-width: 500px; animation: scaleIn 0.3s ease-in-out;">
            <div style="width: 60px; height: 60px; background: #f59e0b; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; animation: errorShake 0.5s ease-in-out;">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
          </div>
            <h2 style="margin: 0 0 10px; font-size: 24px; font-weight: 600; color: #1f2937; font-family: inherit;">
              Limite atteinte
            </h2>
            <p style="margin: 0 0 24px; color: #6b7280; font-size: 16px; line-height: 1.5; font-family: inherit;">
              ${errorMessage}
            </p>
            <a href="https://${shopifyConfig.shopDomain}/account" 
               style="display: inline-block; padding: 12px 24px; background: #f59e0b; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px; transition: background 0.2s; margin-bottom: 12px;"
               onmouseover="this.style.background='#d97706'"
               onmouseout="this.style.background='#f59e0b'">
              Gérer mes configurations
            </a>
            <button onclick="document.getElementById('save-limit-modal').remove()" 
                    style="display: block; width: 100%; padding: 12px; background: #e5e7eb; color: #1f2937; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; font-family: inherit;"
                    onmouseover="this.style.background='#d1d5db'"
                    onmouseout="this.style.background='#e5e7eb'">
              Fermer
            </button>
        </div>
          <style>
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes scaleIn {
              from { transform: scale(0.9); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
            @keyframes errorShake {
              0%, 100% { transform: translateX(0); }
              25% { transform: translateX(-10px); }
              75% { transform: translateX(10px); }
            }
          </style>
        `;
        document.body.appendChild(limitModal);
        
        // Fermer automatiquement après 15 secondes
        setTimeout(() => {
          const modal = document.getElementById('save-limit-modal');
          if (modal) modal.remove();
        }, 15000);
      } else {
        // Pour les autres erreurs, afficher une alerte simple
        alert('Erreur lors de la sauvegarde: ' + errorMessage);
      }
    }
  };

  // Fonction appelée après connexion réussie
  const handleLoginSuccess = async (email: string) => {
    setShowLoginModal(false);
    
    // Ne rien faire ici car la restauration est gérée dans le useEffect ci-dessus
    console.log('✅ Connexion réussie pour:', email);
  };
  // Fonction pour charger une configuration existante
  const loadExistingConfiguration = async (configId: string) => {
    try {
      
      const configData = await loadConfiguration(configId);
      
      if (!configData) {
        alert('❌ Configuration non trouvée');
        return;
      }

      // Restaurer productId / variantId depuis la configuration sauvegardée et mettre à jour l'URL
      const urlParams = new URLSearchParams(window.location.search);
      let urlChanged = false;
      if (configData.productId) {
        console.log('✅ Product ID restauré depuis la configuration:', configData.productId);
        setProductId(String(configData.productId));
        setShopifyConfig(prev => ({
          ...prev,
          productId: String(configData.productId),
        }));
        if (urlParams.get('productId') !== String(configData.productId)) {
          urlParams.set('productId', String(configData.productId));
          urlChanged = true;
        }
      }
      if (configData.variantId) {
        console.log('✅ Variant ID restauré depuis la configuration:', configData.variantId);
        setShopifyConfig(prev => ({
          ...prev,
          variantId: String(configData.variantId),
        }));
        if (urlParams.get('variantId') !== String(configData.variantId)) {
          urlParams.set('variantId', String(configData.variantId));
          urlChanged = true;
        }
      }
      if (urlChanged) {
        const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
        // Redirection complète pour réinitialiser la page dans le bon contexte produit/variante
        window.location.replace(newUrl);
        return; // Stop further processing; page will reload
      }

      // Extraire l'URL du modèle depuis la configuration
      if (configData.modelUrl) {
        setConfigModelUrl(configData.modelUrl);
        
        // Récupérer les design_ids autorisés pour ce modèle
        try {
          const response = await fetch('/api/models');
          const models = await response.json();
          const currentModel = models.find((m: any) => m.glbUrl === configData.modelUrl);
          
          if (currentModel) {
            console.log('🔍 Modèle trouvé dans la liste:', currentModel.id);
            setConfigModelId(currentModel.id);
            
            // Récupérer le mapping produit pour ce modèle
            const mappingResponse = await fetch(`/api/product-mappings?model_id=${encodeURIComponent(currentModel.id)}`);
            if (mappingResponse.ok) {
              const mappingData = await mappingResponse.json();
              if (mappingData && mappingData.design_ids && mappingData.design_ids.length > 0) {
                setConfigDesignIds(mappingData.design_ids);
                
                // Vérifier que le design sauvegardé est dans la liste des designs autorisés
                if (!mappingData.design_ids.includes(configData.designId)) {
                  console.warn('⚠️ Le design sauvegardé n\'est pas dans la liste des designs autorisés:', {
                    savedDesignId: configData.designId,
                    allowedDesignIds: mappingData.design_ids
                  });
                }
              } else {
                setConfigDesignIds(null);
              }
            } else {
              setConfigDesignIds(null);
            }

            // Fallback: si pas de productId dans la config, tenter de le déduire via le mapping du modèle
            try {
              if (!configData.productId) {
                const mapByModelRes = await fetch(`/api/product-mappings?model_id=${encodeURIComponent(currentModel.id)}`);
                if (mapByModelRes.ok) {
                  const mapByModel = await mapByModelRes.json();
                  if (mapByModel && mapByModel.shopify_product_id) {
                    const inferredProductId = String(mapByModel.shopify_product_id);
                    console.log('🧭 Product ID déduit via model_id:', inferredProductId);
                    setProductId(inferredProductId);
                    setShopifyConfig(prev => ({ ...prev, productId: inferredProductId }));
                    const urlParams2 = new URLSearchParams(window.location.search);
                    if (urlParams2.get('productId') !== inferredProductId) {
                      urlParams2.set('productId', inferredProductId);
                      window.history.replaceState({}, '', `${window.location.pathname}?${urlParams2.toString()}`);
                    }
                  }
                }
              }
            } catch (e) {
              console.warn('⚠️ Impossible de déduire le productId via model_id', e);
            }
          }
        } catch (error) {
          console.error('❌ Erreur lors de la récupération des design_ids:', error);
          setConfigDesignIds(null);
        }
      }

      // Charger les couleurs EN PREMIER (avant le design)
      if (configData.colors) {
        console.log('🎨 Type de colors:', typeof configData.colors, Array.isArray(configData.colors) ? 'TABLEAU' : 'OBJET');
        console.log('🎨 Chargement des couleurs:', configData.colors);
        
        // Gérer les deux formats: objet {primary, secondary, tertiary} OU tableau [{hex, name}, {hex, name}, ...]
        if (Array.isArray(configData.colors)) {
          // Format tableau (nouveau) - charger TOUTES les couleurs
          // Mapping des noms français vers les clés anglaises
          const nameToKey: Record<string, string> = {
            'Primaire': 'primary',
            'Secondaire': 'secondary',
            'Tertiaire': 'tertiary',
            'Quaternaire': 'quaternary',
            'Quinaire': 'quinary',
            'Accent': 'accent',
            'Arrière-plan': 'background',
            'Premier plan': 'foreground',
            'Texte': 'text',
            'Bordure': 'border',
          };
          
          // Ordre par défaut si pas de nom (pour compatibilité)
          const defaultColorOrder = ['primary', 'secondary', 'tertiary', 'quaternary', 'quinary'];
          
          configData.colors.forEach((color: any, index: number) => {
            if (color?.hex) {
              let colorKey: string | null = null;
              
              // Essayer de déterminer la clé à partir du nom
              if (color.name) {
                // Si le nom correspond à un mapping
                if (nameToKey[color.name]) {
                  colorKey = nameToKey[color.name];
                } else {
                  // Si le nom est déjà une clé anglaise
                  colorKey = color.name.toLowerCase();
                }
              }
              
              // Fallback: utiliser l'ordre par index si pas de nom ou nom non reconnu
              if (!colorKey && index < defaultColorOrder.length) {
                colorKey = defaultColorOrder[index];
              }
              
              // Si on a trouvé une clé, mettre à jour la couleur
              if (colorKey) {
                updateColor(colorKey, color.hex);
                console.log(`✅ Couleur ${colorKey} (tableau, index ${index}):`, color.hex, color.name || 'sans nom');
              } else {
                // Si pas de clé déterminée, utiliser le nom tel quel (en minuscules)
                const fallbackKey = color.name ? color.name.toLowerCase().replace(/\s+/g, '-') : `color-${index}`;
                updateColor(fallbackKey, color.hex);
                console.log(`✅ Couleur ${fallbackKey} (tableau, fallback):`, color.hex);
              }
            }
          });
        } else if (typeof configData.colors === 'object' && configData.colors !== null) {
          // Format objet (ancien) - charger TOUTES les propriétés
          const colorsObj = configData.colors as any;
          for (const key in colorsObj) {
            if (colorsObj[key]) {
              updateColor(key, colorsObj[key]);
              console.log(`✅ Couleur ${key} (objet):`, colorsObj[key]);
            }
          }
        }
        
        // Log des couleurs après mise à jour
        console.log('🎨 État des couleurs après mise à jour');
      }

      // Attendre que les couleurs soient bien appliquées
      console.log('⏳ Attente application des couleurs...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Augmenter le délai
      
      // Vérifier que les couleurs sont bien appliquées
      console.log('🎨 État des couleurs avant chargement du design:', colors);
      
      // Forcer la mise à jour de toutes les couleurs sauvegardées
      if (configData.colors && Array.isArray(configData.colors)) {
        const nameToKey: Record<string, string> = {
          'Primaire': 'primary',
          'Secondaire': 'secondary',
          'Tertiaire': 'tertiary',
          'Quaternaire': 'quaternary',
          'Quinaire': 'quinary',
          'Accent': 'accent',
          'Arrière-plan': 'background',
          'Premier plan': 'foreground',
          'Texte': 'text',
          'Bordure': 'border',
        };
        const defaultColorOrder = ['primary', 'secondary', 'tertiary', 'quaternary', 'quinary'];
        
        configData.colors.forEach((color: any, index: number) => {
          if (color?.hex) {
            let colorKey: string | null = null;
            if (color.name && nameToKey[color.name]) {
              colorKey = nameToKey[color.name];
            } else if (color.name) {
              colorKey = color.name.toLowerCase();
            } else if (index < defaultColorOrder.length) {
              colorKey = defaultColorOrder[index];
            }
            if (colorKey) {
              updateColor(colorKey, color.hex);
              console.log(`🔧 Force update ${colorKey}:`, color.hex);
            }
          }
        });
        // Attendre un peu après la mise à jour forcée
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Charger le design (après les couleurs et les design_ids)
      if (configData.designId && configData.designUrl) {
        console.log('🎨 Effacement du design pour forcer le rechargement...');
        // D'abord effacer le design pour forcer un rechargement
        selectDesign(null);
        
        // Attendre que l'effacement soit effectif ET que les design_ids soient chargés
        await new Promise(resolve => setTimeout(resolve, 600));
        
        console.log('🎨 Rechargement du design avec les nouvelles couleurs:', {
          designId: configData.designId,
          designUrl: configData.designUrl,
          colors: {
            primary: configData.colors?.[0]?.hex,
            secondary: configData.colors?.[1]?.hex,
            tertiary: configData.colors?.[2]?.hex
          }
        });
        
        // Puis le charger avec les nouvelles couleurs
        selectDesign({ id: configData.designId, svgUrl: configData.designUrl });
        
        // Attendre que le design soit chargé
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // FORCER les couleurs APRÈS le chargement du design pour éviter qu'elles soient réinitialisées
        console.log('🔧 Application forcée des couleurs APRÈS le chargement du design...');
        if (configData.colors && Array.isArray(configData.colors)) {
          const nameToKey: Record<string, string> = {
            'Primaire': 'primary',
            'Secondaire': 'secondary',
            'Tertiaire': 'tertiary',
            'Quaternaire': 'quaternary',
            'Quinaire': 'quinary',
            'Accent': 'accent',
            'Arrière-plan': 'background',
            'Premier plan': 'foreground',
            'Texte': 'text',
            'Bordure': 'border',
          };
          const defaultColorOrder = ['primary', 'secondary', 'tertiary', 'quaternary', 'quinary'];
          
          configData.colors.forEach((color: any, index: number) => {
            if (color?.hex) {
              let colorKey: string | null = null;
              if (color.name && nameToKey[color.name]) {
                colorKey = nameToKey[color.name];
              } else if (color.name) {
                colorKey = color.name.toLowerCase();
              } else if (index < defaultColorOrder.length) {
                colorKey = defaultColorOrder[index];
              }
              if (colorKey) {
                updateColor(colorKey, color.hex);
                console.log(`🔧 Force update ${colorKey} APRÈS design:`, color.hex);
              }
            }
          });
        } else if (configData.colors && typeof configData.colors === 'object' && configData.colors !== null) {
          // Format objet - charger TOUTES les propriétés
          const colorsObj = configData.colors as any;
          for (const key in colorsObj) {
            if (colorsObj[key]) {
              updateColor(key, colorsObj[key]);
              console.log(`🔧 Force update ${key} APRÈS design (objet):`, colorsObj[key]);
            }
          }
        }
        
        // Attendre que les couleurs soient appliquées
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('✅ Design rechargé avec couleurs forcées - vérifiez que les couleurs sont appliquées dans ModelViewer');
      } else {
        console.log('⚠️ Pas de design à charger - designId:', configData.designId, 'designUrl:', configData.designUrl);
      }

      // Charger les textes avec toutes leurs propriétés
      if (configData.texts && Array.isArray(configData.texts)) {
        console.log('📝 Chargement des textes:', configData.texts.length);
        console.log('📝 Détails des textes:', JSON.stringify(configData.texts, null, 2));
        
        // Restaurer tous les textes avec leurs propriétés
        const restoredTexts = configData.texts.map((text: any, index: number) => {
          const savedFillType: 'solid' | 'gradient' = text.fillType === 'gradient' ? 'gradient' : 'solid';
          const savedGradientStops: [string, string] = (() => {
            if (Array.isArray(text.gradientColors) && text.gradientColors.length >= 2) {
              return [text.gradientColors[0], text.gradientColors[1]];
            }
            const fallback = text.color || '#000000';
            return [fallback, fallback];
          })();
          const baseColor = text.color || savedGradientStops[0] || '#000000';
          const savedDirection: 'horizontal' | 'vertical' = text.gradientDirection === 'vertical' ? 'vertical' : 'horizontal';
          const savedPosition: [number, number, number] = Array.isArray(text.position)
            ? [text.position[0] ?? 0, text.position[1] ?? 0, text.position[2] ?? 0]
            : [0, 0, 0];

          const restored = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            content: text.content || '',
            position: savedPosition,
            fontSize: text.fontSize || 0.5,
            color: baseColor,
            editable: text.editable !== undefined ? text.editable : true,
            rotation: text.rotation || 0,
            locked: text.locked || false,
            category: text.category || 'text',
            zoneCategory: text.zoneCategory,
            fontFamily: text.fontFamily || 'Arial',
            strokeColor: text.strokeColor || '#000000',
            strokeWidth: (text.strokeWidth !== undefined && text.strokeWidth !== null) ? text.strokeWidth : 0.01,
            deformation: text.deformation || 'none',
      deformationIntensity: typeof text.deformationIntensity === 'number' ? text.deformationIntensity : 0,
            fillType: savedFillType,
            gradientColors: savedGradientStops,
            gradientDirection: savedDirection
          };
          
          console.log(`📝 Texte ${index + 1} restauré:`, restored);
          return restored;
        });
        
        console.log('📝 Textes restaurés:', restoredTexts);
        loadTexts(restoredTexts);
        console.log('✅ Textes chargés dans le state');
      } else {
        console.log('ℹ️ Aucun texte à charger dans la configuration');
      }
      // Attendre un peu pour s'assurer que le design est bien chargé avant d'ajouter les logos
      console.log('⏳ Attente pour que le design soit bien charge avant d ajouter les logos...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Charger les logos avec leurs dimensions sauvegardées
      if (configData.logos && Array.isArray(configData.logos)) {
        console.log('🖼️ Chargement des logos:', configData.logos.length, configData.logos);
        
        // Charger les logos séquentiellement pour s'assurer qu'ils sont ajoutés correctement
        for (const logo of configData.logos) {
          console.log('📦 Logo à charger:', {
            logoId: logo.logoId,
            variantId: logo.variantId,
            variantFile: logo.variantFile,
            scale: logo.scale,
            position: logo.position,
            rotation: logo.rotation,
            category: logo.category,
            width: logo.width,
            height: logo.height
          });
          
          try {
            // Récupérer les dimensions du logo pour calculer le scale initial
            const dimensions = await getSvgDimensions(logo.variantFile);
            
            // Calculer la width initiale en pixels à partir du scale sauvegardé
            const savedScale = logo.scale || 1;
            const initialWidth = savedScale * dimensions.width;
            
            console.log('🔧 Calcul du scale:', {
              savedScale,
              dimensionsWidth: dimensions.width,
              initialWidth,
              savedDimensions: { width: logo.width, height: logo.height }
            });
            
            // Ajouter le logo avec sa position, scale et rotation sauvegardées
            const addedLogoId = addLogo(
              logo.logoId,
              logo.variantId,
              logo.variantFile,
              logo.position,
              logo.category,
              initialWidth,
              undefined, // height calculé automatiquement
              logo.rotation
            );
            
            console.log('✅ Logo ajouté avec ID:', addedLogoId, 'scale attendu:', savedScale);
            
            // Attendre que le state soit mis à jour
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Vérifier que le scale est correctement appliqué
            if (addedLogoId) {
              // Forcer la mise à jour du scale et de la rotation avec les dimensions originales
              updateLogo(addedLogoId, {
                scale: savedScale,
                rotation: logo.rotation || 0,
                width: logo.width || dimensions.width,
                height: logo.height || dimensions.height
              });
              
              console.log('✅ Logo mis à jour avec scale:', savedScale, 'rotation:', logo.rotation, 'width:', logo.width, 'height:', logo.height);
              
              // Attendre que la mise à jour soit propagée
              await new Promise(resolve => setTimeout(resolve, 200));
            } else {
              console.error('❌ Échec de l\'ajout du logo:', logo);
            }
          } catch (error) {
            console.error('❌ Erreur lors du chargement du logo:', logo, error);
          }
        }
        
        console.log('✅ Tous les logos ont été traités');
        
        // Forcer une mise à jour finale du SVG après avoir ajouté tous les logos
        console.log('🔄 Force update finale du SVG après chargement de tous les logos');
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        console.log('ℹ️ Aucun logo à charger dans la configuration');
      }

      console.log('✅ Configuration appliquée avec succès');
      
      // Log de vérification final
      console.log('🔍 État final après chargement:', {
        selectedDesign: selectedDesign,
        textsCount: texts.length,
        placedLogosCount: placedLogos.length,
        colors: colors
      });
    } catch (error) {
      console.error('❌ Erreur lors du chargement:', error);
      alert('❌ Erreur lors du chargement de la configuration');
    }
  };

  // useEffect simplifié pour charger une configuration existante si config=xxx dans l'URL
  // Suppression de fontsLoaded pour éviter les boucles infinies
  const configLoadedRef = useRef(false);
  const autoCaptureHandledRef = useRef(false);
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autocapture') !== '1') {
      return;
    }

    const configIdentifier = params.get('config');
    if (!configIdentifier) {
      return;
    }

    if (autoCaptureHandledRef.current) {
      return;
    }

    if (typeof capturePreview !== 'function') {
      console.warn('⚠️ [autocapture] capturePreview indisponible');
      return;
    }

    autoCaptureHandledRef.current = true;
    console.log('📸 [autocapture] démarrage pour', configIdentifier);

    (async () => {
      try {
        console.log('📸 [autocapture] chargement configuration...');
        await loadExistingConfiguration(configIdentifier);
        console.log('📸 [autocapture] configuration chargée, attente du rendu...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('📸 [autocapture] capture en cours...');
        const captured = await capturePreview();

        if (!captured) {
          throw new Error('capturePreview returned null');
        }

        console.log('📸 [autocapture] upload vers API...');
        const uploadResp = await fetch('/api/configurations/preview/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: configIdentifier, image: captured })
        });

        const uploadText = await uploadResp.text();
        console.log('📸 [autocapture] réponse upload:', uploadResp.status, uploadText);

        if (!uploadResp.ok) {
          throw new Error(uploadText || `Upload failed (${uploadResp.status})`);
        }

        let uploadData: any = null;
        try {
          uploadData = JSON.parse(uploadText);
        } catch (error) {
          console.warn('⚠️ [autocapture] impossible de parser la réponse upload:', error);
        }

        if (window.parent && window.parent !== window) {
          window.parent.postMessage({
            type: 'previewCaptured',
            id: configIdentifier,
            url: uploadData?.url || null,
          }, '*');
        }

        console.log('✅ [autocapture] aperçu capturé et uploadé');
      } catch (error) {
        console.error('❌ [autocapture] échec:', error);
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({
            type: 'previewFailed',
            id: configIdentifier,
            error: error instanceof Error ? error.message : String(error),
          }, '*');
        }
      }
    })();
  }, [capturePreview, loadExistingConfiguration]);

  // Suppression des listeners d'événements pour éviter les boucles infinies
  
  useEffect(() => {
    
    // Ne charger qu'une seule fois
    if (configLoadedRef.current) {
      return;
    }
    
    const params = new URLSearchParams(window.location.search);
    const configId = params.get('config');
    
    if (!configId) {
      return;
    }
    
    configLoadedRef.current = true; // Marquer immédiatement comme chargé
    
    // Charger directement après un délai pour s'assurer que tous les hooks sont prêts
    setTimeout(() => {
      loadExistingConfiguration(configId);
    }, 1000);
    
  }, []); // Exécuter une seule fois au montage

  const buildConfigurationData = useCallback(() => {
    // Nettoyer les logos pour ne garder que les données sérialisables
    const cleanedLogos = placedLogos.map(logo => ({
      id: logo.id,
      logoId: logo.logoId,
      variantId: logo.variantId,
      variantFile: logo.variantFile,
      position: logo.position,
      scale: logo.scale,
      rotation: logo.rotation,
      category: logo.category,
      width: logo.width,
      height: logo.height,
    }));
    
    // Netoyer les textes pour ne garder que les données sérialisables
    const cleanedTexts = texts.map(text => ({
      id: text.id,
      content: text.content,
      position: text.position,
      fontSize: text.fontSize,
      color: text.color,
      editable: text.editable,
      rotation: text.rotation,
      locked: text.locked,
      category: text.category,
      zoneCategory: text.zoneCategory,
      fontFamily: text.fontFamily,
      strokeColor: text.strokeColor,
      strokeWidth: text.strokeWidth,
      deformation: text.deformation,
      deformationIntensity: text.deformationIntensity,
      fillType: text.fillType || 'solid',
      gradientColors: Array.isArray(text.gradientColors) ? text.gradientColors : undefined,
      gradientDirection: text.gradientDirection || 'horizontal'
    }));

    // Noms par défaut pour les couleurs
    const defaultColorNames: Record<string, string> = {
      'primary': 'Primaire',
      'secondary': 'Secondaire',
      'tertiary': 'Tertiaire',
      'quaternary': 'Quaternaire',
      'quinary': 'Quinaire',
      'accent': 'Accent',
      'background': 'Arrière-plan',
      'foreground': 'Premier plan',
      'text': 'Texte',
      'border': 'Bordure',
    };
    
    // Construire le tableau de couleurs avec TOUTES les couleurs présentes (pas seulement les 3 premières)
    const colorsArray: Array<{hex: string, name: string}> = [];
    
    // Ordre de priorité pour l'affichage (mais on sauvegarde toutes les couleurs)
    const colorOrder = ['primary', 'secondary', 'tertiary', 'quaternary', 'quinary'];
    
    // D'abord ajouter les couleurs dans l'ordre standard
    for (const colorKey of colorOrder) {
      if (colors[colorKey]) {
        colorsArray.push({
          hex: colors[colorKey],
          name: defaultColorNames[colorKey] || colorKey
        });
      }
    }
    
    // Ensuite ajouter toutes les autres couleurs (accent, background, etc.)
    for (const colorKey in colors) {
      if (!colorOrder.includes(colorKey) && colors[colorKey]) {
        colorsArray.push({
          hex: colors[colorKey],
          name: defaultColorNames[colorKey] || colorKey
        });
      }
    }
    
    const configData = {
      savedAt: Date.now(),
      modelUrl: modelUrl || undefined,
      designId: selectedDesign.id || undefined,
      designUrl: selectedDesign.svgUrl || undefined,
      colors: colorsArray,
      texts: cleanedTexts,
      logos: cleanedLogos,
      productId: shopifyConfig.productId || productId || undefined,
      variantId: shopifyConfig.variantId || undefined, // Sauvegarder le variantId
    };
    
    // Log pour débogage
    console.log('💾 Configuration sauvegardée:', {
      colors: configData.colors,
      textsCount: configData.texts.length,
      logosCount: configData.logos.length,
      texts: configData.texts,
      logos: configData.logos
    });

    return configData;
  }, [modelUrl, selectedDesign, colors, texts, placedLogos, shopifyConfig.variantId]);

  const openBridgeInBackground = useCallback((redirectUrl: string | null | undefined) => {
    if (!redirectUrl) return;
    try {
      const iframe = document.createElement('iframe');
      iframe.src = redirectUrl;
      iframe.style.position = 'fixed';
      iframe.style.width = '1px';
      iframe.style.height = '1px';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
      setTimeout(() => {
        try {
          iframe.remove();
        } catch {}
      }, 15000);
    } catch {
      // Fallback: ouvrir dans le même onglet
      window.location.href = redirectUrl;
    }
  }, []);

  const handleSizeSelection = useCallback(async (size: { id: string; name: string }) => {
    setSelectedSize({ id: size.id, name: size.name });
    try {
      const configData = buildConfigurationData();
      const shouldSkipRedirect = !!linkedProductLink;
      const result = await addToShopifyCart(
        configData,
        1,
        size.name,
        shouldSkipRedirect ? { skipRedirect: true } : {}
      );

      if (!result.success) {
        alert(`Erreur lors de l'ajout au panier: ${result.error}`);
        setPendingCartInfo(null);
        setShowLinkedProductPrompt(false);
        return;
      }

      if (shouldSkipRedirect) {
        console.log('🟪 handleSizeSelection -> pendingCartInfo', result);
        setPendingCartInfo(result);
        setShowLinkedProductPrompt(true);
      } else {
        window.location.href = result.redirectUrl;
      }
    } catch (error) {
      console.error('❌ Erreur lors du traitement de la sélection de taille:', error);
      alert('Une erreur est survenue lors de l\'ajout au panier. Veuillez réessayer.');
    }
  }, [addToShopifyCart, buildConfigurationData, linkedProductLink]);

  const handleLinkedProductDecline = useCallback(() => {
    const redirectUrl = pendingCartInfo?.redirectUrl;
    setShowLinkedProductPrompt(false);
    setPendingCartInfo(null);
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  }, [pendingCartInfo]);

  const handleLinkedProductAccept = useCallback(() => {
    void (async () => {
      console.log('👉 handleLinkedProductAccept déclenché', {
        pendingCartInfo,
        linkedProductLink,
        colorsSnapshot: { ...colors },
        selectedDesignId: selectedDesign.id,
      });
      try {
        window.sessionStorage?.setItem('linked_prefill_active', '1');
        window.localStorage.removeItem('linked_prefill');
      } catch (prefillFlagError) {
        console.warn('⚠️ Impossible de préparer linked_prefill_active', prefillFlagError);
      }
      if (!pendingCartInfo?.redirectUrl) {
        setShowLinkedProductPrompt(false);
        return;
      }

  const redirectUrl = pendingCartInfo.redirectUrl;
      const colorsSnapshot = { ...colors };
      const targetProductId = linkedProductLink?.linked_product_id
        ? String(linkedProductLink.linked_product_id)
        : null;
      let targetVariantId = linkedProductLink?.linked_variant_id
        ? String(linkedProductLink.linked_variant_id)
        : null;

      if (!targetVariantId && targetProductId) {
        targetVariantId = await resolveDefaultVariantId(targetProductId);
        if (targetVariantId) {
          console.log('✅ Variante par défaut résolue pour le produit lié:', {
            targetProductId,
            targetVariantId,
          });
        } else {
          console.warn('⚠️ Variante par défaut introuvable pour le produit lié:', targetProductId);
        }
      }

      const payload = {
        colors: colorsSnapshot,
        sourceDesignId: selectedDesign.id,
        sourceProductId: shopifyConfig.productId ?? null,
        sourceVariantId: shopifyConfig.variantId ?? null,
        targetProductId,
        targetCanonicalProductId: normalizeShopifyProductId(targetProductId),
        targetVariantId: targetVariantId ?? null,
        targetCanonicalVariantId: normalizeShopifyProductId(targetVariantId),
        targetDesignId: linkedProductLink?.linked_design_id || null,
        auto_apply_colors: linkedProductLink?.auto_apply_colors !== false,
        createdAt: Date.now(),
      };

      try {
        const serialized = JSON.stringify(payload);
        window.localStorage.setItem('linked_prefill', serialized);
        window.sessionStorage.setItem('linked_prefill', serialized);
        window.sessionStorage.setItem('linked_prefill_active', '1');
        console.log('💾 linked_prefill (fallback) enregistré', payload);
      } catch (error) {
        console.warn('⚠️ Impossible de stocker linked_prefill fallback:', error);
      }

      openBridgeInBackground(redirectUrl);
      setShowLinkedProductPrompt(false);
      setPendingCartInfo(null);

      const nextUrl = new URL(`${window.location.origin}/configure`);
      if (payload.targetProductId) {
        nextUrl.searchParams.set('productId', payload.targetProductId);
      }
      if (payload.targetVariantId) {
        nextUrl.searchParams.set('variantId', payload.targetVariantId);
      }
      if (payload.targetDesignId) {
        nextUrl.searchParams.set('designId', payload.targetDesignId);
      }
      window.sessionStorage.setItem('__skip_config', '1');
      window.sessionStorage.setItem('__skip_fresh', '1');
      nextUrl.searchParams.set('prefill', 'linked');
      console.log('🔗 handleLinkedProductAccept → redirect URL', nextUrl.toString(), payload);
      window.location.href = nextUrl.toString();
    })();
  }, [
    pendingCartInfo,
    linkedProductLink,
    colors,
    shopifyConfig.productId,
    selectedDesign.id,
    openBridgeInBackground,
    resolveDefaultVariantId,
  ]);
  // Sauvegarde locale automatique (avec debounce pour éviter trop de sauvegardes)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    // Ne pas sauvegarder si on est en train de charger une configuration spécifique
    const params = new URLSearchParams(window.location.search);
    const isLoadingSpecificConfig = params.get('config') !== null;
    const pf = params.get('prefill');
    const linkedPrefillGuard =
      isLinkedPrefillParam(pf) || isLinkedPrefillActive || hasPendingLinkedPrefill;
    
    if (isLoadingSpecificConfig || linkedPrefillGuard) {
      return; // Ne pas écraser la config en cours de chargement
    }

    // Debounce: sauvegarder après 500ms d'inactivité
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      try {
        const pid = params.get('productId') || 'dev';
        const mid = modelId || params.get('modelId') || '';
        const vid = params.get('variantId') || shopifyConfig.variantId || '';
        const key = `cfg:${pid}:${mid}:${vid}`;
        const data = buildConfigurationData();
        localStorage.setItem(key, JSON.stringify(data));
        // clé de secours pour ce produit (dernier)
        localStorage.setItem(`cfg:${pid}:latest`, JSON.stringify(data));
        // Clé générique pour restauration au rafraîchissement
        localStorage.setItem('auto_save_config', JSON.stringify(data));
        console.log('💾 Auto-sauvegarde effectuée');
      } catch (error) {
        console.error('❌ Erreur auto-sauvegarde:', error);
      }
    }, 500); // Debounce de 500ms

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [
    selectedDesign,
    colors,
    texts,
    placedLogos,
    modelId,
    shopifyConfig.variantId,
    buildConfigurationData,
    isLinkedPrefillActive,
    hasPendingLinkedPrefill,
  ]);

  // Restauration locale automatique au rafraîchissement (essaie au montage, puis quand modelId arrive)
  const restoredOnceRef = useRef(false);
  useEffect(() => {
    if (restoredOnceRef.current) return;
    
    // Ne pas restaurer si on charge une configuration spécifique (paramètre config=)
    const params = new URLSearchParams(window.location.search);
    const hasTempConfig = localStorage.getItem('temp_design_config');
    const isLinkedPrefill =
      isLinkedPrefillParam(params.get('prefill')) || hasPendingLinkedPrefill;
    if (isLinkedPrefill) {
      console.log('⏸️ Restauration auto-sauvegarde ignorée (prefill=linked)');
      restoredOnceRef.current = true;
      return;
    }
    
    // Attendre un peu pour vérifier si une config spécifique est chargée
    setTimeout(() => {
      // Vérifier à nouveau après le délai (au cas où config= serait dans l'URL)
      const paramsAfterDelay = new URLSearchParams(window.location.search);
      const stillLoadingSpecificConfig = paramsAfterDelay.get('config') !== null;
      const stillLinkedPrefill =
        isLinkedPrefillParam(paramsAfterDelay.get('prefill')) || hasPendingLinkedPrefill;
      
      if (stillLoadingSpecificConfig || stillLinkedPrefill || hasTempConfig) {
        console.log('⏸️ Restauration auto-sauvegarde ignorée (config spécifique en cours ou config temporaire)');
        restoredOnceRef.current = true; // Marquer comme restauré pour ne pas bloquer
        return;
      }
    
      try {
        const pid = paramsAfterDelay.get('productId') || 'dev';
        const midCandidates = [
          modelId,
          paramsAfterDelay.get('modelId') || '',
          ''
        ].filter(Boolean) as string[];
        const vidCandidates = [
          paramsAfterDelay.get('variantId') || '',
          shopifyConfig.variantId || ''
        ];
        let parsed: any = null;
        
        // 1) Essayer auto_save_config (le plus récent)
        const autoSaveRaw = localStorage.getItem('auto_save_config');
        if (autoSaveRaw) {
          try {
            parsed = JSON.parse(autoSaveRaw);
            console.log('✅ Configuration auto-sauvegardée trouvée, restauration...');
          } catch (e) {
            console.error('❌ Erreur parsing auto_save_config:', e);
          }
        }
        
        // 2) tenter clef exacte parmi combinaisons connues
        if (!parsed) {
          for (const mid of midCandidates) {
            for (const vid of vidCandidates) {
              const raw = localStorage.getItem(`cfg:${pid}:${mid}:${vid}`);
              if (raw) { 
                parsed = JSON.parse(raw); 
                console.log('✅ Configuration trouvée avec clé exacte, restauration...');
                break; 
              }
            }
            if (parsed) break;
          }
        }
        
        // 3) fallback: latest pour ce produit
        if (!parsed) {
          const raw = localStorage.getItem(`cfg:${pid}:latest`);
          if (raw) {
            parsed = JSON.parse(raw);
            console.log('✅ Configuration latest trouvée, restauration...');
          }
        }
        
        if (!parsed) {
          console.log('ℹ️ Aucune configuration auto-sauvegardée trouvée');
          restoredOnceRef.current = true;
          return;
        }

        // Restaurer la configuration
        console.log('🔄 Restauration de la configuration auto-sauvegardée...');
        
        // Attendre un peu pour que les hooks soient prêts
        setTimeout(() => {
          if (parsed?.designId || parsed?.designUrl) {
            selectDesign({ 
              id: parsed.designId || null, 
              svgUrl: parsed.designUrl || null, 
              model_type: parsed.model_type || selectedDesign?.model_type || 'maillot' 
            });
          }
          if (Array.isArray(parsed?.colors)) {
            const [p, s, t] = parsed.colors;
            if (p?.hex) updateColor('primary', p.hex);
            if (s?.hex) updateColor('secondary', s.hex);
            if (t?.hex) updateColor('tertiary', t.hex);
          }
          if (Array.isArray(parsed?.texts)) {
            loadTexts(parsed.texts);
          }
          if (Array.isArray(parsed?.logos)) {
            loadPlacedLogos(parsed.logos);
          }
          console.log('✅ Configuration restaurée avec succès');
        }, 1000); // Délai pour s'assurer que tout est chargé
        
        restoredOnceRef.current = true;
      } catch (error) {
        console.error('❌ Erreur lors de la restauration:', error);
        restoredOnceRef.current = true;
      }
    }, 1500); // Attendre 1.5s pour que configLoadedRef soit mis à jour si une config spécifique est chargée
  }, [
    modelId,
    shopifyConfig.variantId,
    selectDesign,
    updateColor,
    loadTexts,
    loadPlacedLogos,
    selectedDesign?.model_type,
    hasPendingLinkedPrefill,
  ]);
  
  // Gérer le retour après connexion - nettoyer l'URL pour éviter la boucle infinie
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const returnFromLogin = params.get('return_from_login') === 'true' || params.get('redirect_from_account') === 'true';
    
    if (!returnFromLogin) {
      return;
    }
    
    const tempConfigKey = 'temp_design_config';
    const tempConfigData = localStorage.getItem(tempConfigKey);
    
    if (!tempConfigData) {
      console.log('⚠️ Aucune config temporaire trouvée');
      return;
    }
    
    console.log('🔄 Retour après connexion détecté, nettoyage URL...');
    
    // Juste nettoyer l'URL - la restauration se fera via le auto-save useEffect qui a accès à tout
    const newParams = new URLSearchParams(window.location.search);
    newParams.delete('return_from_login');
    newParams.delete('redirect_from_account');
    window.history.replaceState({}, '', `${window.location.pathname}?${newParams.toString()}`);
    
  }, []); // Une seule fois au montage

  const tabs = [
    { id: 'design', label: 'Design', title: 'Sélectionner le design', icon: '✏️', bgColor: 'bg-black', textColor: 'text-blue-500' },
    { id: 'color', label: 'Couleur', title: 'Choisir une couleur', icon: '🎨', bgColor: 'bg-green-500', textColor: 'text-green-500' },
    { id: 'numero', label: 'Numéro', title: 'Ajouter des numéros', icon: 'ℹ️', bgColor: 'bg-orange-500', textColor: 'text-orange-500' },
    { id: 'nom', label: 'Nom', title: 'Ajouter un nom', icon: '👤', bgColor: 'bg-pink-500', textColor: 'text-pink-500' },
    { id: 'text', label: 'Texte', title: 'Ajouter du texte', icon: '📝', bgColor: 'bg-red-500', textColor: 'text-red-500' },
    { id: 'logo', label: 'Logo', title: 'Ajouter des logos', icon: '🖼️', bgColor: 'bg-yellow-500', textColor: 'text-yellow-500' },
  ];

  const handleTabClick = (tabId: typeof activeTab) => {
    setActiveTab(tabId);
    setIsMobileModalOpen(true);
  };
  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Loading Screen */}
      {showLoading && (
        <div 
          className={`fixed inset-0 z-50 flex items-center justify-center bg-white transition-opacity duration-300 ${
            modelLoaded ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <img 
            src="/stretch.gif" 
            alt="Chargement..." 
            className="max-w-md w-full"
          />
          </div>
      )}
      
      {/* Contenu principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Desktop uniquement */}
        <div className="hidden md:flex w-96 lg:w-[420px] xl:w-[480px] flex-shrink-0 bg-white border-r border-gray-200 flex-col">
          <div className="flex-1 overflow-hidden">
            <Sidebar 
              selectedDesign={selectedDesign} 
              selectDesign={selectDesign}
              colors={colors}
              updateColor={updateColor}
            replaceColors={replaceColors}
              resetColors={resetColors}
              isLinkedPrefillActive={isLinkedPrefillActive}
              hasPendingLinkedPrefill={hasPendingLinkedPrefill}
              texts={texts}
              addText={addText}
              updateText={updateText}
              removeText={requestDeleteConfirmation}
              updateTextPosition={updateTextPosition}
              selectedTextId={selectedTextId}
              selectText={selectText}
              textZones={textZones}
              isLoadingZones={isLoadingZones}
              fonts={fonts}
              fontsForNames={fontsForNames}
              fontsForNumbers={fontsForNumbers}
              placedLogos={placedLogos}
              addLogo={addLogo}
              updateLogo={updateLogo}
              removeLogo={requestLogoDeleteConfirmation}
              onRequestDelete={requestLogoDeleteConfirmation}
              selectedLogoId={selectedLogoId}
              selectLogo={selectLogo}
              isDraggingLogo={isDraggingLogo}
              setIsDraggingLogo={setIsDraggingLogo}
              isRotatingLogo={isRotatingLogo}
              setIsRotatingLogo={setIsRotatingLogo}
              isResizingLogo={isResizingLogo}
              setIsResizingLogo={setIsResizingLogo}
              configModelUrl={configModelUrl}
              configDesignIds={memoizedConfigDesignIds}
              modelUrl={modelUrl}
              textureMaps={textureMaps}
              materialMaps={materialMaps}
              modelId={modelId}
              isLoading={modelIsLoading}
              activeTab={(activeTab === 'text' ? 'design' : activeTab) as any}
              setActiveTab={setActiveTab as any}
              showColorWarningModal={showColorWarningModal}
              setShowColorWarningModal={setShowColorWarningModal}
              logos={logos}
              isLoadingLogos={isLoadingLogos}
              autoOpenTypography={autoOpenTypography}
              shouldOpenTypographyPanel={shouldOpenTypographyPanel}
              onTypographyPanelOpened={() => setShouldOpenTypographyPanel(null)}
              isPlacingText={isPlacingText}
              setIsPlacingText={setIsPlacingText}
            />
          </div>

          {/* Boutons d'action - fixés en bas (comme sur mobile) */}
          <div className="flex-shrink-0 p-4 border-t border-gray-200">
            <div className="flex gap-3">
              {/* Bouton Sauvegarder - Masqué en mode preview */}
              {!isPreviewMode && (
                <button 
                  onClick={() => handleSaveConfiguration(buildConfigurationData())} 
                  disabled={isShopifyLoading} 
                  className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors disabled:opacity-60"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Sauvegarder
                </button>
              )}
              
              {/* Bouton Ajouter au panier - Masqué en mode preview */}
              {!isPreviewMode && (
                <button 
                  onClick={() => setIsSizeModalOpen(true)} 
                  disabled={isShopifyLoading} 
                  className="flex-1 bg-black text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors disabled:opacity-60"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9M17 21a1 1 0 100-2 1 1 0 000 2zm-8 0a1 1 0 100-2 1 1 0 000 2z" />
                  </svg>
                  Ajouter au panier
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Viewer 3D - prend tout l'espace restant */}
        <div className="flex-1 flex flex-col min-w-0 md:pb-0 h-screen md:h-auto fixed md:relative inset-0 md:inset-auto pb-32">
            <Viewer3D 
              key={`${modelId}-${modelUrl}`}
              designTexture={selectedDesign.svgUrl} 
              colors={colors}
              fonts={fonts}
              texts={texts}
              updateTextPosition={updateTextPosition}
              updateTextRotation={updateTextRotation}
              updateTextSize={updateTextSize}
              toggleTextLock={toggleTextLock}
              removeText={requestDeleteConfirmation}
              selectedTextId={selectedTextId}
              selectText={selectText}
              isDraggingText={isDraggingText}
              setIsDraggingText={setIsDraggingText}
              isRotatingText={isRotatingText}
              setIsRotatingText={setIsRotatingText}
              isResizingText={isResizingText}
              setIsResizingText={setIsResizingText}
              onTextAdded={(textId, position) => {
                console.log('🎥 Texte ajouté - ID:', textId, 'Position:', position);
                // Ouvrir automatiquement le panneau typographie après ajout
                selectText(textId, true);
              }}
              placedLogos={placedLogos}
              updateLogoPosition={updateLogoPosition}
              updateLogoRotation={updateLogoRotation}
              updateLogoScale={updateLogoScale}
              toggleLogoLock={toggleLogoLock}
              removeLogo={requestLogoDeleteConfirmation}
              selectedLogoId={selectedLogoId}
              selectLogo={selectLogo}
              isDraggingLogo={isDraggingLogo}
              setIsDraggingLogo={setIsDraggingLogo}
              isRotatingLogo={isRotatingLogo}
              setIsRotatingLogo={setIsRotatingLogo}
              isResizingLogo={isResizingLogo}
              setIsResizingLogo={setIsResizingLogo}
              onRequestLogoDelete={requestLogoDeleteConfirmation}
              selectedDesign={selectedDesign}
              modelUrl={modelUrl}
              modelId={modelId}
              textureMaps={textureMaps}
              materialMaps={materialMaps}
              isPlacingText={isPlacingText}
              textZones={textZones}
              onTextPlaced={handleTextPlaced}
              onCloseModal={() => setIsMobileModalOpen(false)}
            />
          </div>
        </div>

      {/* Barre d'onglets mobile */}
      <div className="md:hidden fixed bottom-14 left-0 right-0 bg-white z-40">
        <div className="flex w-full py-1">
          {[
            { id: 'design', label: 'Design', iconUrl: '/icons/design.svg', iconUrlWhite: '/icons/design-white.svg?v=2', bgColor: 'bg-black' },
            { id: 'color', label: 'Couleur', iconUrl: '/icons/color.svg', iconUrlWhite: '/icons/color-white.svg', bgColor: 'bg-black' },
            { id: 'numero', label: 'Numéro', iconUrl: '/icons/numero.svg', iconUrlWhite: '/icons/numero-white.svg', bgColor: 'bg-black' },
            { id: 'nom', label: 'Nom', iconUrl: '/icons/nom.svg', iconUrlWhite: '/icons/nom-white.svg', bgColor: 'bg-black' },
            { id: 'logo', label: 'Logo', iconUrl: '/icons/logo.svg?v=2', iconUrlWhite: '/icons/logo-white.svg', bgColor: 'bg-black' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id as typeof activeTab)}
              className={`flex-1 flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 ${
                activeTab === tab.id
                  ? `${tab.bgColor} text-white shadow-lg tab-active`
                  : 'text-black hover:bg-gray-100'
              }`}
            >
              <img src={activeTab === tab.id ? tab.iconUrlWhite : tab.iconUrl} alt={tab.label} className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}
      </div>
      </div>

      {/* Boutons d'action mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 h-14">
        <div className="h-full px-2 py-2">
          <div className="flex gap-2">
            {/* Bouton Sauvegarder (mobile) - Masqué en mode preview */}
            {!isPreviewMode && (
              <button onClick={() => handleSaveConfiguration(buildConfigurationData())} disabled={isShopifyLoading} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-1 hover:bg-gray-50 transition-colors disabled:opacity-60">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Sauvegarder
              </button>
            )}
            
            {/* Bouton Ajouter au panier (mobile) - Masqué en mode preview */}
            {!isPreviewMode && (
              <button onClick={() => setIsSizeModalOpen(true)} disabled={isShopifyLoading} className="flex-1 bg-black text-white py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-1 hover:bg-gray-800 transition-colors disabled:opacity-60">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9M17 21a1 1 0 100-2 1 1 0 000 2zm-8 0a1 1 0 100-2 1 1 0 000 2z" />
                </svg>
                Ajouter au panier
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal Mobile qui s'ouvre vers le haut */}
      {isMobileModalOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end pointer-events-none">
          {/* Modal Content - 40% de l'écran. Swipe down actif sur la poignée et le header */}
          <div className="mobile-sheet relative w-full bg-white rounded-t-2xl max-h-[40vh] flex flex-col animate-slide-up pointer-events-auto transition-transform duration-200">
            {/* Header du modal avec indicateur de swipe - masqué pour la bibliothèque de logo sur mobile uniquement */}
            {!(activeTab === 'logo' && isLogoLibraryOpen) && (
              <div 
                className="flex items-center justify-between p-4 border-b border-gray-200 relative"
                onTouchStart={(e) => {
                  // Démarrer le swipe depuis n'importe où dans le header
                  const touch = e.touches[0];
                  (e.currentTarget as any).swipeStartY = touch.clientY;
                  (e.currentTarget as any).swipeStartTime = Date.now();
                }}
                onTouchMove={(e) => {
                  const touch = e.touches[0];
                  const startY = (e.currentTarget as any).swipeStartY;
                  if (startY !== undefined) {
                    const deltaY = touch.clientY - startY;
                    const sheet = (e.currentTarget as HTMLElement).closest('.mobile-sheet');
                    if (sheet && deltaY > 0) {
                      // Suivre le doigt pendant le swipe
                      (sheet as HTMLElement).style.transform = `translateY(${deltaY}px)`;
                      (sheet as HTMLElement).style.transition = 'none';
                    }
                  }
                }}
                onTouchEnd={(e) => {
                  const startY = (e.currentTarget as any).swipeStartY;
                  const startTime = (e.currentTarget as any).swipeStartTime;
                  if (startY !== undefined) {
                    const touch = e.changedTouches[0];
                    const deltaY = touch.clientY - startY;
                    const deltaTime = Date.now() - (startTime || 0);
                    const sheet = (e.currentTarget as HTMLElement).closest('.mobile-sheet');
                    
                    // Fermer si le swipe est suffisant (100px ou plus) ou si c'est rapide (vitesse > 0.5px/ms)
                    const velocity = deltaY / deltaTime;
                    if (deltaY > 100 || (deltaY > 50 && velocity > 0.5)) {
                      setIsMobileModalOpen(false);
                    }
                    
                    // Réinitialiser la position
                    if (sheet) {
                      (sheet as HTMLElement).style.transform = '';
                      (sheet as HTMLElement).style.transition = '';
                    }
                    delete (e.currentTarget as any).swipeStartY;
                    delete (e.currentTarget as any).swipeStartTime;
                  }
                }}
                style={{ touchAction: 'pan-y' }}
              >
                {/* Poignée (barre grise) - zone de drag visible */}
                <div
                  className="absolute top-1 left-1/2 -translate-x-1/2 w-20 h-10 flex items-center justify-center cursor-grab active:cursor-grabbing"
                  style={{ touchAction: 'pan-y' }}
                >
                  <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
                </div>
                <div className="flex items-center gap-3">
                  {(() => {
                    const modalTabs = [
                      { id: 'design', label: 'Design', iconUrl: '/icons/design.svg', iconUrlWhite: '/icons/design-white.svg?v=2', bgColor: 'bg-black' },
                      { id: 'color', label: 'Couleur', iconUrl: '/icons/color.svg', iconUrlWhite: '/icons/color-white.svg', bgColor: 'bg-black' },
                      { id: 'numero', label: 'Numéro', iconUrl: '/icons/numero.svg', iconUrlWhite: '/icons/numero-white.svg', bgColor: 'bg-black' },
                      { id: 'nom', label: 'Nom', iconUrl: '/icons/nom.svg', iconUrlWhite: '/icons/nom-white.svg', bgColor: 'bg-black' },
                      { id: 'logo', label: 'Logo', iconUrl: '/icons/logo.svg?v=2', iconUrlWhite: '/icons/logo-white.svg', bgColor: 'bg-black' },
                    ];
                    const currentTab = modalTabs.find(t => t.id === activeTab);
                    return (
                      <span className={`w-8 h-8 rounded-lg ${currentTab?.bgColor} text-white flex items-center justify-center`}>
                        {currentTab && <img src={currentTab.iconUrlWhite} alt={currentTab.label} className="w-5 h-5" />}
                      </span>
                    );
                  })()}
                  <h2 className="text-lg font-semibold text-gray-900">
                    {(() => {
                      const modalTabs = [
                        { id: 'design', label: 'Design' },
                        { id: 'color', label: 'Couleur' },
                        { id: 'numero', label: 'Numéro' },
                        { id: 'nom', label: 'Nom' },
                        { id: 'logo', label: 'Logo' },
                      ];
                      return modalTabs.find(t => t.id === activeTab)?.label;
                    })()}
                  </h2>
                </div>
                <button
                  onClick={() => setIsMobileModalOpen(false)}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Contenu - scrollable pour tous les onglets SAUF logo, sans padding sur mobile */}
            <div className={`flex-1 ${activeTab === 'logo' ? 'flex flex-col min-h-0' : 'overflow-y-auto p-0'}`} style={{ touchAction: activeTab==='color' ? 'pan-x' : 'auto' }}>
              {activeTab === 'design' && (
                <DesignTab
                  selectedDesign={selectedDesign}
                  selectDesign={selectDesign}
                  colors={colors}
                  updateColor={updateColor}
                  replaceColors={replaceColors}
                  resetColors={resetColors}
                  allowedDesignIds={configDesignIds || undefined}
                  isLinkedPrefillActive={isLinkedPrefillActive}
              hasPendingLinkedPrefill={hasPendingLinkedPrefill}
                  hasPendingLinkedPrefill={hasPendingLinkedPrefill}
                />
              )}
              {activeTab === 'color' && <ColorTab colors={colors} updateColor={updateColor} />}
              {activeTab === 'text' && (console.log('📱 MOBILE: Rendu TextTab avec activeTab:', activeTab), <TextTab texts={texts} addText={addText} updateText={updateText} removeText={removeText} updateTextPosition={updateTextPosition} selectedTextId={selectedTextId} selectText={selectText} textZones={textZones} isLoadingZones={isLoadingZones} fonts={fonts} selectedDesign={selectedDesign} autoOpenTypography={autoOpenTypography} shouldOpenTypographyPanel={shouldOpenTypographyPanel} onTypographyPanelOpened={() => setShouldOpenTypographyPanel(null)} />)}
              
              {/* Onglets temporaires */}
          
              {activeTab === 'numero' && (console.log('📱 MOBILE: Rendu NumeroTab avec activeTab:', activeTab), <TextTab texts={texts} addText={addText} updateText={updateText} removeText={removeText} updateTextPosition={updateTextPosition} selectedTextId={selectedTextId} selectText={selectText} textZones={textZones} isLoadingZones={isLoadingZones} fonts={fontsForNumbers} selectedDesign={selectedDesign} category="numero" autoOpenTypography={autoOpenTypography} shouldOpenTypographyPanel={shouldOpenTypographyPanel} onTypographyPanelOpened={() => setShouldOpenTypographyPanel(null)} />)}
              {activeTab === 'nom' && (console.log('📱 MOBILE: Rendu NomTab avec activeTab:', activeTab), <TextTab texts={texts} addText={addText} updateText={updateText} removeText={removeText} updateTextPosition={updateTextPosition} selectedTextId={selectedTextId} selectText={selectText} textZones={textZones} isLoadingZones={isLoadingZones} fonts={fontsForNames} selectedDesign={selectedDesign} category="nom" autoOpenTypography={autoOpenTypography} shouldOpenTypographyPanel={shouldOpenTypographyPanel} onTypographyPanelOpened={() => setShouldOpenTypographyPanel(null)} />)}
              {activeTab === 'logo' && (
                <LogoTab 
                  placedLogos={placedLogos}
                  addLogo={addLogo}
                  updateLogo={updateLogo}
                  removeLogo={removeLogo}
                  onRequestDelete={requestLogoDeleteConfirmation}
                  selectedLogoId={selectedLogoId}
                  selectLogo={selectLogo}
                  textZones={textZones}
                  isLoadingZones={isLoadingZones}
                  logos={logos}
                  isLoadingLogos={isLoadingLogos}
                  category="torse"
                  isDraggingLogo={isDraggingLogo}
                  setIsDraggingLogo={setIsDraggingLogo}
                  isRotatingLogo={isRotatingLogo}
                  setIsRotatingLogo={setIsRotatingLogo}
                  isResizingLogo={isResizingLogo}
                  setIsResizingLogo={setIsResizingLogo}
                  setLogoLibraryOpen={setIsLogoLibraryOpen}
                  selectedDesign={selectedDesign}
                />
              )}
            </div>

            {/* Footer mobile allégé (plus de doublon de boutons) */}
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {deleteConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={cancelDelete}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-lg shadow-xl p-6 m-4 max-w-sm w-full">
            <div className="text-center">
              {/* Icône */}
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              
              {/* Titre */}
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Supprimer l'élément ?
              </h3>
              
              {/* Message */}
              <p className="text-sm text-gray-500 mb-6">
                Êtes-vous sûr de vouloir supprimer le texte <span className="font-medium text-gray-900">"{deleteConfirmation.textContent}"</span> ? Cette action ne peut pas être annulée.
              </p>
              
              {/* Boutons */}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Non
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  Oui
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression de logo */}
      {logoDeleteConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={cancelLogoDelete}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-lg shadow-xl p-6 m-4 max-w-sm w-full">
            <div className="text-center">
              {/* Icône */}
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              
              {/* Titre */}
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Supprimer l'élément ?
              </h3>
              
              {/* Message */}
              <p className="text-sm text-gray-500 mb-6">
                Êtes-vous sûr de vouloir supprimer le logo <span className="font-medium text-gray-900">"{logoDeleteConfirmation.logoName}"</span> ? Cette action ne peut pas être annulée.
              </p>
              
              {/* Boutons */}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={cancelLogoDelete}
                  className="px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Non
                </button>
                <button
                  onClick={confirmLogoDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  Oui
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'avertissement couleur */}
      {showColorWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {console.log('🎨 Modal couleur affiché:', showColorWarningModal)}
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowColorWarningModal(false)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-lg shadow-xl p-6 m-4 max-w-md w-full">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Avertissement sur les couleurs
              </h3>
              
              <div className="text-sm text-gray-600 mb-6 text-left space-y-3">
                <p>
                  Les couleurs que vous voyez sur votre écran peuvent varier d'un écran à l'autre. Même si nous faisons tout notre possible pour que le rendu final se rapproche au maximum de ce que vous avez choisi, il est possible que l'impression diffère légèrement.
                </p>
                <p className="font-semibold text-gray-800">
                  Important : les couleurs affichées sur votre écran ne sont pas contractuelles et STRETCHMX ne peut être tenu responsable de ces variations.
                </p>
              </div>
              
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    // Sauvegarder que l'utilisateur a accepté l'avertissement
                    localStorage.setItem('colorWarningAccepted', 'true');
                    setShowColorWarningModal(false);
                    setActiveTab('color');
                  }}
                  className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Accepter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de connexion Shopify */}
      {showLoginModal && shopifyConfig.shopDomain && (
        <ShopifyLoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          shopDomain={shopifyConfig.shopDomain}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {/* Modal de sélection de taille */}
      <SizeSelectionModal
        isOpen={isSizeModalOpen}
        onClose={() => setIsSizeModalOpen(false)}
        onSelect={handleSizeSelection}
        modelType={productMapping?.model_type || selectedDesign?.model_type || 'maillot'}
      />

      {/* Modal d'avertissement couleur */}
      {showColorWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {console.log('🎨 Modal couleur affiché:', showColorWarningModal)}
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowColorWarningModal(false)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-lg shadow-xl p-6 m-4 max-w-md w-full">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Avertissement sur les couleurs
              </h3>
              
              <div className="text-sm text-gray-600 mb-6 text-left space-y-3">
                <p>
                  Les couleurs que vous voyez sur votre écran peuvent varier d'un écran à l'autre. Même si nous faisons tout notre possible pour que le rendu final se rapproche au maximum de ce que vous avez choisi, il est possible que l'impression diffère légèrement.
                </p>
                <p className="font-semibold text-gray-800">
                  Important : les couleurs affichées sur votre écran ne sont pas contractuelles et STRETCHMX ne peut être tenu responsable de ces variations.
                </p>
              </div>
              
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    // Sauvegarder que l'utilisateur a accepté l'avertissement
                    localStorage.setItem('colorWarningAccepted', 'true');
                    setShowColorWarningModal(false);
                    setActiveTab('color');
                  }}
                  className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Accepter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de connexion Shopify */}
      {showLoginModal && shopifyConfig.shopDomain && (
        <ShopifyLoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          shopDomain={shopifyConfig.shopDomain}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {/* Modal de sélection de taille */}
      <SizeSelectionModal
        isOpen={isSizeModalOpen}
        onClose={() => setIsSizeModalOpen(false)}
        onSelect={handleSizeSelection}
        modelType={productMapping?.model_type || selectedDesign?.model_type || 'maillot'}
      />
      <LinkedProductPromptModal
        isOpen={showLinkedProductPrompt}
        linkedProductName={linkedProductTitle}
        onAccept={handleLinkedProductAccept}
        onDecline={handleLinkedProductDecline}
        onClose={handleLinkedProductDecline}
      />
    </div>
  );
}