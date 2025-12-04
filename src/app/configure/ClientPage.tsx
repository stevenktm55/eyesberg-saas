"use client";

import { Suspense, useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
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

type TextModuleSettings = {
  minFontSize: number;
  maxFontSize: number;
  strokeMinWidth: number;
  strokeMaxWidth: number;
  baseStrokeWidth: number;
  defaultColor: string;
  defaultStrokeColor: string;
  enabledDeformations?: string[]; // IDs des déformations activées
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

// Hook pour charger les snap lines depuis l'API
function useSnapLines(selectedDesignId?: string | null) {
  const [snapLines, setSnapLines] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSnapLines() {
      try {
        const response = await fetch('/api/snap-line-groups');
        if (response.ok) {
          const data = await response.json();
          // Flatten all snap lines from all groups
          const allSnapLines: any[] = [];
          data.forEach((group: any) => {
            if (group.snapLines && Array.isArray(group.snapLines)) {
              // Filter by design if specified
              if (!selectedDesignId || !group.design2dIds || group.design2dIds.length === 0 || group.design2dIds.includes(selectedDesignId)) {
                allSnapLines.push(...group.snapLines);
              }
            }
          });
          setSnapLines(allSnapLines);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des snap lines:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadSnapLines();
  }, [selectedDesignId]);

  return { snapLines, isLoading };
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

// Normaliser la structure des material maps venant de l'API/models
// pour qu'elle corresponde à ce que `ModelViewer` attend (roughnessFactor, metalnessFactor, aoIntensity, normalScale, etc.)
function normalizeMaterialMaps(raw: Record<string, any> | null | undefined): Record<string, any> | null {
  if (!raw || typeof raw !== 'object') return raw || null;
  const normalized: Record<string, any> = {};

  Object.entries(raw).forEach(([key, value]) => {
    const mm: any = { ...(value as any) };

    // Roughness: value (0-1) enregistré sous roughnessValue → roughnessFactor / roughness
    // IMPORTANT: Préserver roughnessValue pour que ModelViewer puisse le lire
    if (typeof mm.roughnessValue === 'number') {
      if (typeof mm.roughnessFactor !== 'number') mm.roughnessFactor = mm.roughnessValue;
      if (typeof mm.roughness !== 'number') mm.roughness = mm.roughnessValue;
      // Préserver la valeur originale
    }

    // Metalness: value (0-1) enregistré sous metalnessValue → metalnessFactor / metallic / metalness
    // IMPORTANT: Préserver metalnessValue pour que ModelViewer puisse le lire
    if (typeof mm.metalnessValue === 'number') {
      if (typeof mm.metalnessFactor !== 'number') mm.metalnessFactor = mm.metalnessValue;
      if (typeof mm.metallic !== 'number') mm.metallic = mm.metalnessValue;
      if (typeof mm.metalness !== 'number') mm.metalness = mm.metalnessValue;
      // Préserver la valeur originale
    }

    // AO: value (0-1) enregistré sous aoIntensity → aoIntensity
    // IMPORTANT: Préserver aoIntensity (déjà présent, rien à faire)
    if (typeof mm.aoIntensity === 'number') {
      // rien à faire, ModelViewer lit déjà aoIntensity
    }

    // Normal: intensité enregistrée sous normalIntensity → normalScale / normalScaleX / normalScaleY
    // IMPORTANT: Préserver normalIntensity pour que ModelViewer puisse le lire
    if (typeof mm.normalIntensity === 'number') {
      const n = mm.normalIntensity;
      if (typeof mm.normalScale !== 'number') mm.normalScale = n;
      if (typeof mm.normalScaleX !== 'number') mm.normalScaleX = n;
      if (typeof mm.normalScaleY !== 'number') mm.normalScaleY = n;
      // Préserver la valeur originale (déjà présente dans mm.normalIntensity)
    }

    normalized[key] = mm;
  });

  return normalized;
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
          // Utilisation du modèle depuis la configuration sauvegardée
          setModelUrl(forcedModelUrl);
          
          // Charger les texture maps et material maps du modèle
          if (forcedModelId) {
            const res = await fetch('/api/models');
            const models = await res.json();
            const selectedModel = models.find((m: any) => m.id === forcedModelId);
            if (selectedModel) {
              setTextureMaps(selectedModel.textureMaps || null);
              // Charger les material maps normalisés depuis l'endpoint dédié (même logique que l'admin)
              try {
                const matsRes = await fetch(`/api/models/${selectedModel.id}/materials`);
                if (matsRes.ok) {
                  const matsData = await matsRes.json();
                  const normalized = normalizeMaterialMaps(matsData.materialMaps) || null;
                  setMaterialMaps(normalized);
                } else {
                  setMaterialMaps(normalizeMaterialMaps(selectedModel.materialMaps) || null);
                }
              } catch (e) {
                setMaterialMaps(normalizeMaterialMaps(selectedModel.materialMaps) || null);
              }
              setModelId(selectedModel.id);
            } else {
              setTextureMaps(null);
              setMaterialMaps(null);
            }
          } else {
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
          // Charger les material maps normalisés via /api/models/[id]/materials (comme l'admin)
          try {
            const matsRes = await fetch(`/api/models/${chosen.id}/materials`);
            if (matsRes.ok) {
              const matsData = await matsRes.json();
              const normalized = normalizeMaterialMaps(matsData.materialMaps) || null;
              setMaterialMaps(normalized);
            } else {
              setMaterialMaps(normalizeMaterialMaps(chosen.materialMaps) || null);
            }
          } catch (e) {
            setMaterialMaps(normalizeMaterialMaps(chosen.materialMaps) || null);
          }
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
        // Utiliser l'endpoint /api/models/[id]/materials pour rester aligné avec l'admin
        const matsRes = await fetch(`/api/models/${modelId}/materials`);
        if (!matsRes.ok) return;
        const matsData = await matsRes.json();
        const nextMaterialMaps = normalizeMaterialMaps(matsData.materialMaps) || null;

        // Les textureMaps ne sont pas gérées par cet endpoint, ne synchroniser que les materialMaps ici
        const mmChanged = JSON.stringify(nextMaterialMaps) !== JSON.stringify(materialMaps);

        if (mounted && mmChanged) {
          setMaterialMaps(nextMaterialMaps);
        }
      } catch (e) {
        // Silently fail
      }
    }, 2000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [modelId, materialMaps]);

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
  function useTextSelection(
    onTextSelectionChange?: (textId: string | null, autoOpenTypography: boolean) => void,
    textSettings?: TextModuleSettings
  ) {
  const minFontSizeConstraint = textSettings?.minFontSize ?? 60;
  const maxFontSizeConstraint = Math.max(minFontSizeConstraint, textSettings?.maxFontSize ?? 750);
  const strokeMinConstraint = textSettings?.strokeMinWidth ?? 0;
  const strokeMaxConstraint = Math.max(strokeMinConstraint, textSettings?.strokeMaxWidth ?? 50);
  const strokeBaseConstraint = Math.min(strokeMaxConstraint, Math.max(strokeMinConstraint, textSettings?.baseStrokeWidth ?? strokeMinConstraint));
  const defaultFillColor = textSettings?.defaultColor;
  const defaultStrokeColor = textSettings?.defaultStrokeColor;

  const clampFontSizeValue = (value: number) => {
    if (!Number.isFinite(value)) return minFontSizeConstraint;
    return Math.min(maxFontSizeConstraint, Math.max(minFontSizeConstraint, value));
  };

  const convertLegacyStrokeWidth = (value?: number, unit?: string) => {
    if (unit === 'px') {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : strokeBaseConstraint;
    }
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return strokeBaseConstraint;
    if (numeric <= 2 && strokeMaxConstraint > strokeMinConstraint) {
      const ratio = numeric <= 1 ? numeric : numeric / 2;
      const clamped = Math.max(0, Math.min(1, ratio));
      return strokeMinConstraint + (strokeMaxConstraint - strokeMinConstraint) * clamped;
    }
    if (numeric <= 100 && strokeMaxConstraint > strokeMinConstraint) {
      const clamped = Math.max(0, Math.min(1, numeric / 100));
      return strokeMinConstraint + (strokeMaxConstraint - strokeMinConstraint) * clamped;
    }
    return numeric;
  };

  const clampStrokeWidthValue = (value?: number, unit?: string) => {
    const normalized = convertLegacyStrokeWidth(value, unit);
    if (!Number.isFinite(normalized)) return strokeBaseConstraint;
    return Math.min(strokeMaxConstraint, Math.max(strokeMinConstraint, normalized));
  };

  const getInitialTextColor = (category: 'text' | 'nom' | 'numero') => {
    if (defaultFillColor) return defaultFillColor;
    if (category === 'nom' || category === 'numero') return '#ffffff';
    return '#000000';
  };

  const getInitialStrokeColor = () => defaultStrokeColor ?? '#000000';

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
      strokeWidthUnit?: 'px';
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
      const resolvedPosition: [number, number, number] = position
        ? [position[0], position[1], position[2] ?? 0]
        : [0.5, 0.5, 0];
      const resolvedFontSize = clampFontSizeValue(initialFontSize ?? maxFontSizeConstraint);
      const resolvedStrokeWidth = clampStrokeWidthValue(textSettings?.baseStrokeWidth ?? strokeBaseConstraint, 'px');
      const initialColor = getInitialTextColor(category);
      const initialStrokeColor = getInitialStrokeColor();

      const newText = {
     id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content,
        position: resolvedPosition,
        fontSize: resolvedFontSize,
        color: initialColor,
        editable: true,
        rotation: initialRotation ?? 0, // Rotation par défaut de la zone
        category, // Catégorie du texte
        zoneCategory,
        fontFamily: defaultFontFamily,
        strokeColor: initialStrokeColor,
        strokeWidth: resolvedStrokeWidth,
        strokeWidthUnit: 'px' as const,
        deformation: 'none',
        deformationIntensity: 0,
        fillType: 'solid',
        gradientColors: [initialColor, initialColor],
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
    const sanitizedUpdates = { ...updates };

    if (sanitizedUpdates.fontSize !== undefined) {
      sanitizedUpdates.fontSize = clampFontSizeValue(sanitizedUpdates.fontSize);
    }
    if (sanitizedUpdates.strokeWidth !== undefined) {
      sanitizedUpdates.strokeWidth = clampStrokeWidthValue(sanitizedUpdates.strokeWidth, (sanitizedUpdates as any).strokeWidthUnit);
      (sanitizedUpdates as any).strokeWidthUnit = 'px';
    }

    setTexts(prev => prev.map(text => 
      text.id === id 
        ? { 
            ...text, 
            ...sanitizedUpdates,
            position: sanitizedUpdates.position
              ? [sanitizedUpdates.position[0], sanitizedUpdates.position[1], sanitizedUpdates.position[2] ?? 0] as [number, number, number]
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
    const clamped = clampFontSizeValue(fontSize);
    setTexts(prev => prev.map(text => 
      text.id === id ? { ...text, fontSize: clamped } : text
    ));
  };


  const selectText = (id: string | null, autoOpenTypography = false) => {
    setSelectedTextId(id);
    if (onTextSelectionChange) {
      const shouldAutoOpen = (() => {
        if (!id) return false;
        const t = texts.find(tx => tx.id === id);
        return t ? (t.category === 'nom' || t.category === 'numero') : autoOpenTypography;
      })();
      onTextSelectionChange(id, shouldAutoOpen);
    } else {
      console.log("⚠️ onTextSelectionChange n'est pas défini");
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

    lockToggleRef.current.delete(id);
  }, []);

  const loadTexts = (textsToLoad: typeof texts) => {
    setTexts(textsToLoad.map(text => ({
      ...text,
      fontSize: clampFontSizeValue(text.fontSize ?? minFontSizeConstraint),
      strokeWidth: clampStrokeWidthValue(text.strokeWidth, (text as any).strokeWidthUnit),
      strokeWidthUnit: 'px' as const,
      position: [text.position[0], text.position[1], text.position[2] ?? 0] as [number, number, number]
    })));
  };

  useEffect(() => {
    setTexts(prev => prev.map(text => {
      const nextFont = clampFontSizeValue(text.fontSize ?? minFontSizeConstraint);
      const nextStroke = clampStrokeWidthValue(text.strokeWidth, (text as any).strokeWidthUnit);
      const needsUpdate =
        nextFont !== text.fontSize ||
        nextStroke !== text.strokeWidth ||
        (text as any).strokeWidthUnit !== 'px';
      return needsUpdate ? { ...text, fontSize: nextFont, strokeWidth: nextStroke, strokeWidthUnit: 'px' as const } : text;
    }));
  }, [
    minFontSizeConstraint,
    maxFontSizeConstraint,
    strokeMinConstraint,
    strokeMaxConstraint,
    strokeBaseConstraint
  ]);

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
}) {
  const [testUVMap, setTestUVMap] = useState<string | null>(null);
  const [clickCoordinates, setClickCoordinates] = useState<{uv: [number, number], svg: [number, number]} | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const controlsRef = useRef<any>(null);
  // Timestamp de la dernière modification explicite de la caméra
  const lastCameraChangeRef = useRef<number>(0);
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
    if (isMobile) {
      switch (direction) {
        case 'back':
          // Pour le dos, tourner autour et utiliser la même distance
          camera.position.set(0, 1, -18);
          target.set(0, 1, 0); // Regarder en avant
          break;
        case 'left':
          camera.position.set(-18, 1, 0);
          target.set(0, 1, 0);
          break;
        case 'right':
          camera.position.set(18, 1, 0);
          target.set(0, 1, 0);
          break;
        default: // front
          camera.position.set(0, 1, 18);
          target.set(0, 1, 0);
      }
    } else {
      switch (direction) {
        case 'back':
          camera.position.set(0, 1, -10);
          target.set(0, 1, 0);
          break;
        case 'left':
          camera.position.set(-10, 1, 0);
          target.set(0, 1, 0);
          break;
        case 'right':
          camera.position.set(10, 1, 0);
          target.set(0, 1, 0);
          break;
        default: // front
          camera.position.set(0, 1, 10);
          target.set(0, 1, 0);
      }
    }
    
    controls.update();
    requestAnimationFrame(() => controls.update());
    lastCameraChangeRef.current = Date.now();
  }, [isMobile]);

  const setCameraView = useCallback((view: 'front' | 'back' | 'left' | 'right') => {
    const controls = controlsRef.current;
    console.log('🎥 setCameraView appelé avec view:', view);
    if (!controls || !controls.object || !controls.target) {
      console.log('⚠️ Pas de controls ou camera disponible');
      return;
    }
    const camera = controls.object;
    const target = controls.target;
    if (view === 'front') {
      camera.position.set(0, 1, isMobile ? 18 : 10);
      target.set(0, isMobile ? -1.5 : 0, 0);
      console.log('📍 Positionnée caméra en front');
    } else if (view === 'back') {
      camera.position.set(0, 1, isMobile ? -18 : -10);
      target.set(0, isMobile ? -1.5 : 0, 0);
      console.log('📍 Positionnée caméra en back');
    } else if (view === 'left') {
      camera.position.set(-10, 1, 0);
      target.set(0, 0, 0);
      console.log('📍 Positionnée caméra en left');
    } else if (view === 'right') {
      camera.position.set(10, 1, 0);
      target.set(0, 0, 0);
      console.log('📍 Positionnée caméra en right');
    }
    controls.update();
    requestAnimationFrame(() => controls.update());
    // Marquer l'heure de modification pour éviter un reset immédiat
    lastCameraChangeRef.current = Date.now();
  }, [isMobile]);

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
          if (isMobile) {
            controls.object.position.set(0, 1, 18);
            controls.target.set(0, -1, 0);
          } else {
            // Desktop: zoom max comme mobile
            controls.object.position.set(0, 1, 10);
            controls.target.set(0, 0, 0);
          }
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
  }, [isMobile]);

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
  const cameraPosition: [number, number, number] = isMobile ? [0, 1, 18] : [0, 1, 10];
  const cameraTarget: [number, number, number] = isMobile ? [0, -1, 0] : [0, 0, 0];
  const minDistance = isMobile ? 7 : 2.5;
  const maxDistance = isMobile ? 18 : 10;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Canvas 3D - prend tout l'espace */}
      <div 
        className="flex-1 bg-gray-100 relative"
        onContextMenu={(e) => e.preventDefault()}
      >
        <Canvas
          camera={{ position: cameraPosition, fov: 50 }}
          gl={{
            preserveDrawingBuffer: true,
            antialias: true,
            alpha: false,
          }}
          style={{
            background: '#0a0a0a',
            width: '100%',
            height: '100%',
          }}
        >
          {/* Éclairage aligné sur le viewer des Material Maps */}
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <directionalLight position={[-10, -10, -5]} intensity={0.5} />
          <Environment preset="city" />
          
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
              textSizeLimits={{ min: fontSizeSliderMin, max: fontSizeSliderMax }}
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

// Composant LogoTab - Reprend exactement le système de configurator.stretchmx.com
function LogoTab({
  placedLogos,
  addLogo,
  updateLogo,
  removeLogo,
  selectedLogoId,
  selectLogo,
  textZones,
  isLoadingZones,
  logos,
  isLoadingLogos,
  onOpenZoneSelector,
  addLogoButtonLabel,
  logoPlacementMode,
  logoZoneGroupIds,
  logoLibraryIds,
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
    category: 'torse' | 'dos' | 'bras-gauche' | 'bras-droit';
    width?: number;
    height?: number;
  }>;
  addLogo: (logoId: string, variantId: string, variantFile: string, position?: [number, number, number], category?: 'torse' | 'dos' | 'bras-gauche' | 'bras-droit', initialPixelWidth?: number, initialPixelHeight?: number, initialRotation?: number) => void;
  updateLogo: (id: string, updates: Partial<any>) => void;
  removeLogo: (id: string) => void;
  selectedLogoId: string | null;
  selectLogo: (id: string | null) => void;
  textZones: TextZone[];
  isLoadingZones: boolean;
  logos: Logo[];
  isLoadingLogos: boolean;
  onOpenZoneSelector: (data: {logoId: string, variantId: string, variantFile: string, view?: 'front' | 'back' | 'left' | 'right'} | null) => void;
  addLogoButtonLabel?: string;
  logoPlacementMode?: 'zones' | 'free';
  logoZoneGroupIds?: string[];
  logoLibraryIds?: string[];
  logoViewFrontLabel?: string;
  logoViewBackLabel?: string;
  logoViewLeftLabel?: string;
  logoViewRightLabel?: string;
  onCameraViewChange?: (view: 'front' | 'back' | 'left' | 'right') => void;
}) {
  const [activeView, setActiveView] = useState<'front' | 'back' | 'left' | 'right'>('front');
  const [activeCategory, setActiveCategory] = useState<'torse' | 'dos' | 'bras-gauche' | 'bras-droit'>('torse');
  const [showLibrary, setShowLibrary] = useState(false);
  const [selectedZone, setSelectedZone] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showVariantSelector, setShowVariantSelector] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [logoName, setLogoName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Labels des vues (définis en premier pour être accessibles partout)
  const viewLabels = {
    'front': logoViewFrontLabel || 'Torse',
    'back': logoViewBackLabel || 'Dos',
    'left': logoViewLeftLabel || 'Bras gauche',
    'right': logoViewRightLabel || 'Bras droit'
  };

  // Mapper la vue active vers la catégorie
  const viewToCategory: Record<'front' | 'back' | 'left' | 'right', 'torse' | 'dos' | 'bras-gauche' | 'bras-droit'> = {
    'front': 'torse',
    'back': 'dos',
    'left': 'bras-gauche',
    'right': 'bras-droit'
  };

  // Synchroniser activeCategory avec activeView
  useEffect(() => {
    setActiveCategory(viewToCategory[activeView]);
  }, [activeView]);

  // Gérer le changement de vue
  const handleViewChange = (view: 'front' | 'back' | 'left' | 'right') => {
    setActiveView(view);
    if (onCameraViewChange) {
      onCameraViewChange(view);
    }
    // Émettre un événement pour changer la vue de la caméra
    window.dispatchEvent(new CustomEvent('setCameraView', { detail: view }));
  };

  // Filtrer les logos placés selon la catégorie active
  const activeCategoryLogos = placedLogos.filter(l => l.category === activeCategory);

  // Filtrer les zones selon la vue active et les groupes de zones configurés
  const filteredZones = textZones.filter(zone => {
    // Filtrer par vue (catégorie correspondante)
    const categoryForView = viewToCategory[activeView];
    if (!zone.categories || !zone.categories.includes(`logo-${categoryForView}`)) return false;
    
    // Filtrer par view si disponible
    if (zone.view && zone.view !== activeView) return false;
    
    // Si logoPlacementMode est 'zones' et logoZoneGroupIds est défini, filtrer par groupes
    if (logoPlacementMode === 'zones' && logoZoneGroupIds && logoZoneGroupIds.length > 0) {
      // Vérifier si la zone appartient à un des groupes configurés
      // Note: on suppose que zone.zoneGroupId existe (à vérifier selon la structure réelle)
      return logoZoneGroupIds.some(groupId => (zone as any).zoneGroupId === groupId);
    }
    return true;
  });
  
  // Mettre à jour la zone sélectionnée quand les zones sont chargées
  useEffect(() => {
    if (filteredZones.length > 0 && !selectedZone) {
      setSelectedZone(filteredZones[0].id);
    }
  }, [filteredZones, selectedZone]);

  // Libellés par catégorie
  const buttonLabel = addLogoButtonLabel || 'Ajouter un logo';
  const categoryLabels = {
    'torse': { button: buttonLabel, title: buttonLabel, label: 'Torse' },
    'dos': { button: buttonLabel, title: buttonLabel, label: 'Dos' },
    'bras-gauche': { button: buttonLabel, title: buttonLabel, label: 'Bras gauche' },
    'bras-droit': { button: buttonLabel, title: buttonLabel, label: 'Bras droit' },
  };
  const labels = categoryLabels[activeCategory];

  // Filtrer les logos par recherche et par bibliothèques configurées
  console.log('🔍 Filtrage des logos - Paramètres:', { 
    totalLogos: logos.length, 
    logoLibraryIds, 
    hasFilter: !!logoLibraryIds && logoLibraryIds.length > 0,
    sampleLogo: logos[0] ? { 
      id: logos[0].id, 
      name: logos[0].name,
      logo_library_id: (logos[0] as any).logo_library_id,
      allKeys: Object.keys(logos[0] as any)
    } : null
  });
  
  const filteredLibraryLogos = logos.filter(logo => {
    // Filtrer par bibliothèques si configuré
    if (logoLibraryIds && logoLibraryIds.length > 0) {
      // Le champ dans la base de données est logo_library_id (snake_case)
      const logoLibId = (logo as any).logo_library_id || (logo as any).libraryId || (logo as any).logoLibraryId || (logo as any).logo_library?.id;
      const matches = logoLibId && logoLibraryIds.includes(logoLibId);
      if (!matches) {
        return false;
      }
    }
    // Filtrer par recherche
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      logo.name.toLowerCase().includes(query) ||
      (logo.tags && logo.tags.some(tag => tag.toLowerCase().includes(query)))
    );
  });
  
  console.log('📚 Résultat du filtrage:', { 
    total: logos.length, 
    filtered: filteredLibraryLogos.length
  });

  // Gérer la sélection d'une variante (ouvre le sélecteur de zone si mode zones, sinon placement libre)
  const handleVariantSelect = (logoId: string, variantId: string, variantFile: string) => {
    if (logoPlacementMode === 'zones') {
      onOpenZoneSelector({ logoId, variantId, variantFile, view: activeView });
    } else {
      // Placement libre - ajouter directement au centre
      addLogo(logoId, variantId, variantFile, [0.5, 0.5, 0], activeCategory);
    }
    setShowVariantSelector(null);
  };

  // Gérer l'upload d'un logo personnalisé (envoi direct vers sélection de zone)
  const handleUploadLogo = async () => {
    if (!selectedFile || !logoName.trim()) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('name', logoName);
      formData.append('variantName', 'Original');

      const response = await fetch('/api/logos', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        // Récupérer le logo et sa variante créés
        const uploadedLogos = data.logos;
        const uploadedLogo = uploadedLogos[uploadedLogos.length - 1];
        const uploadedVariant = uploadedLogo.variants[0];

        // Fermer le modal d'import
        setShowImportModal(false);
        setSelectedFile(null);
        setLogoName('');

        // Ouvrir directement le sélecteur de zone avec le logo uploadé
        onOpenZoneSelector({
          logoId: uploadedLogo.id,
          variantId: uploadedVariant.id,
          variantFile: uploadedVariant.file,
          view: activeView
        });
      } else {
        alert('Erreur lors de l\'upload du logo');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Erreur lors de l\'upload');
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
        {/* Boutons de vue en haut */}
        <div className="flex-shrink-0 border-b border-gray-200 bg-white">
          <div className="grid grid-cols-4 gap-1 p-1">
            {(['front', 'back', 'left', 'right'] as const).map((view) => (
              <button
                key={view}
                onClick={() => handleViewChange(view)}
                className={`px-3 py-2 text-sm font-medium transition-colors rounded ${
                  activeView === view
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {viewLabels[view]}
              </button>
            ))}
          </div>
        </div>

        {/* Header avec bouton retour */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <button
            onClick={() => setShowVariantSelector(null)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
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
          <div className="grid grid-cols-3 gap-4">
            {selectedLibraryLogo.variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => handleVariantSelect(selectedLibraryLogo.id, variant.id, variant.file)}
                className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="relative w-full h-24 bg-gray-100 rounded mb-2 flex items-center justify-center">
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
                <p className="text-sm font-medium text-gray-900 text-center">{variant.name}</p>
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
                Nom du logo
              </label>
              <input
                type="text"
                value={logoName}
                onChange={(e) => setLogoName(e.target.value)}
                placeholder="Ex: Mon logo"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

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
              <div className="text-sm text-gray-600">
                Fichier sélectionné : {selectedFile.name}
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => {
                setShowImportModal(false);
                setSelectedFile(null);
                setLogoName('');
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={handleUploadLogo}
              disabled={!selectedFile || !logoName.trim() || isUploading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Upload...' : 'Importer'}
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
        {/* Boutons de vue en haut */}
        <div className="flex-shrink-0 border-b border-gray-200 bg-white">
          <div className="grid grid-cols-4 gap-1 p-1">
            {(['front', 'back', 'left', 'right'] as const).map((view) => (
              <button
                key={view}
                onClick={() => handleViewChange(view)}
                className={`px-3 py-2 text-sm font-medium transition-colors rounded ${
                  activeView === view
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {viewLabels[view]}
              </button>
            ))}
          </div>
        </div>

        {/* Header avec bouton retour */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <button
            onClick={() => setShowLibrary(false)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Retour</span>
          </button>
          
          <div className="flex items-center gap-3">
            <span className="font-medium text-gray-900">{buttonLabel}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Bouton d'importation */}
          <div className="mb-4">
            <button
              onClick={() => setShowImportModal(true)}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Importer un logo
            </button>
          </div>

          {/* Barre de recherche */}
          <input
            type="text"
            placeholder="Rechercher un logo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
          />

          {/* Bibliothèque de logos */}
          {isLoadingLogos ? (
            <div className="text-center py-4 text-gray-500">Chargement...</div>
          ) : logos.length === 0 ? (
            <div className="text-center py-4 text-gray-500 text-sm">
              <p>Aucun logo disponible.</p>
              <p className="text-xs mt-1">Ajoutez des logos dans l'admin.</p>
            </div>
          ) : filteredLibraryLogos.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {filteredLibraryLogos.map((logo) => (
                <button
                  key={logo.id}
                  onClick={() => {
                    if (logo.variants.length === 0) {
                      if (logoPlacementMode === 'zones') {
                        onOpenZoneSelector({ logoId: logo.id, variantId: '', variantFile: '', view: activeView });
                      } else {
                        addLogo(logo.id, '', '', [0.5, 0.5, 0], activeCategory);
                      }
                    } else if (logo.variants.length === 1) {
                      if (logoPlacementMode === 'zones') {
                        onOpenZoneSelector({ logoId: logo.id, variantId: logo.variants[0].id, variantFile: logo.variants[0].file, view: activeView });
                      } else {
                        addLogo(logo.id, logo.variants[0].id, logo.variants[0].file, [0.5, 0.5, 0], activeCategory);
                      }
                    } else {
                      setShowVariantSelector(logo.id);
                    }
                  }}
                  className="border border-gray-200 rounded-lg p-2 hover:bg-gray-50 transition-colors"
                >
                  <div className="relative w-full h-20 bg-gray-100 rounded mb-2 flex items-center justify-center">
                    {logo.variants.length > 0 ? (
                      logo.variants[0].file.endsWith('.svg') ? (
                        <img
                          src={logo.variants[0].file}
                          alt={logo.name}
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <Image
                          src={logo.variants[0].file}
                          alt={logo.name}
                          width={80}
                          height={80}
                          className="object-contain"
                        />
                      )
                    ) : (
                      <span className="text-gray-400 text-xs">Pas d'image</span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-gray-900 text-center truncate">
                    {logo.name}
                  </p>
                  {logo.variants.length > 1 && (
                    <p className="text-xs text-gray-500 text-center">
                      {logo.variants.length} variantes
                    </p>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500 text-sm">
              {searchQuery ? (
                'Aucun logo trouvé'
              ) : logoLibraryIds && logoLibraryIds.length > 0 ? (
                <>
                  <p>Aucun logo disponible dans les bibliothèques sélectionnées.</p>
                  <p className="text-xs mt-1">Vérifiez les settings du module ou ajoutez des logos dans l'admin.</p>
                </>
              ) : (
                <>
                  <p>Aucun logo disponible.</p>
                  <p className="text-xs mt-1">Sélectionnez des bibliothèques dans les settings du module ou ajoutez des logos dans l'admin.</p>
                </>
              )}
            </div>
          )}
        </div>
        
        {/* Modals */}
        {importModal}
      </div>
    );
  }

  // Vue par défaut : Liste des logos placés
  return (
    <div className="h-full flex flex-col">
      {/* Boutons de vue en haut */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white p-1">
        <div className="grid grid-cols-4 gap-1">
          {(['front', 'back', 'left', 'right'] as const).map((view) => (
            <button
              key={view}
              onClick={() => handleViewChange(view)}
              className={`px-3 py-2 text-sm font-medium transition-colors rounded ${
                activeView === view
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {viewLabels[view] || view}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Bouton Ajouter un logo */}
        <div className="mb-6">
          <button
            onClick={() => setShowLibrary(true)}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {buttonLabel}
          </button>
        </div>

        {/* Liste des logos placés */}
        <div className="mb-3">
          <h3 className="text-base font-semibold text-gray-900">Logos placés ({activeCategoryLogos.length})</h3>
        </div>
        
        {activeCategoryLogos.length > 0 ? (
          <div className="space-y-3">
            {activeCategoryLogos.map((logo) => {
              const libraryLogo = logos.find(l => l.id === logo.logoId);
              const variant = libraryLogo?.variants.find(v => v.id === logo.variantId);
              
              return (
                <div 
                  key={logo.id}
                  onClick={() => selectLogo(logo.id)}
                  className={`flex items-center gap-3 p-3 bg-white border-2 rounded-lg transition-colors cursor-pointer ${
                    selectedLogoId === logo.id ? 'border-blue-500' : 'border-gray-200'
                  }`}
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
                      e.stopPropagation();
                      removeLogo(logo.id);
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm font-medium">Aucun logo ajouté</p>
            <p className="text-xs mt-1">Cliquez sur "{buttonLabel}" pour commencer</p>
          </div>
        )}
      </div>
      
      {/* Modals */}
      {importModal}
    </div>
  );
}

// Hook pour charger les modules de configuration depuis l'API
function useProductModules(shopDomain?: string | null, productId?: string | null) {
  console.log('🚀 useProductModules appelé avec:', { shopDomain, productId });
  
  const [logoModuleConfig, setLogoModuleConfig] = useState<{
    addLogoButtonLabel?: string;
    logoPlacementMode?: 'zones' | 'free';
    logoZoneGroupIds?: string[];
    logoLibraryIds?: string[];
    logoViewFrontLabel?: string;
    logoViewBackLabel?: string;
    logoViewLeftLabel?: string;
    logoViewRightLabel?: string;
  } | null>(null);

  useEffect(() => {
    console.log('🔄 useProductModules useEffect déclenché');
    async function loadModules() {
      // Récupérer shopDomain et productId depuis l'URL si non fournis
      const urlParams = new URLSearchParams(window.location.search);
      const shop = shopDomain || urlParams.get('shop');
      const product = productId || urlParams.get('productId');
      
      console.log('🔍 useProductModules - shop:', shop, 'product:', product);
      
      if (!shop) {
        console.warn('⚠️ Pas de shop dans l\'URL, impossible de charger les modules');
        return;
      }
      
      try {
        const url = product 
          ? `/api/product-builder?shop=${encodeURIComponent(shop)}&id=${encodeURIComponent(product)}`
          : `/api/product-builder?shop=${encodeURIComponent(shop)}`;
        
        console.log('📡 Chargement des modules depuis:', url);
        const response = await fetch(url);
        
        if (response.ok) {
          const productData = await response.json();
          console.log('✅ Produit chargé:', productData);
          const modules = productData.builder_data?.customizationModules || [];
          
          console.log('📦 Modules chargés:', modules);
          console.log('📦 Nombre de modules:', modules.length);
          
          // Trouver le module logo
          const logoModule = modules.find((m: any) => m.contentType === 'logos');
          console.log('🎯 Module logo trouvé:', logoModule);
          
          if (logoModule) {
            const config = {
              addLogoButtonLabel: logoModule.addLogoButtonLabel,
              logoPlacementMode: logoModule.logoPlacementMode,
              logoZoneGroupIds: logoModule.logoZoneGroupIds,
              logoLibraryIds: logoModule.selectedItems?.logoLibraryIds,
              logoViewFrontLabel: logoModule.logoViewFrontLabel,
              logoViewBackLabel: logoModule.logoViewBackLabel,
              logoViewLeftLabel: logoModule.logoViewLeftLabel,
              logoViewRightLabel: logoModule.logoViewRightLabel,
            };
            console.log('⚙️ Configuration logo module:', config);
            console.log('📚 logoLibraryIds:', config.logoLibraryIds);
            setLogoModuleConfig(config);
          } else {
            console.warn('⚠️ Aucun module logo trouvé dans les modules');
          }
        } else {
          const errorText = await response.text();
          console.error('❌ Erreur lors du chargement des modules:', response.status, response.statusText, errorText);
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement des modules:', error);
      }
    }
    
    loadModules();
  }, [shopDomain, productId]);

  return logoModuleConfig;
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
  shopDomain?: string | null;
  productId?: string | null;
}) {
  // Sidebar RENDU avec activeTab
  
  // Charger les modules de configuration
  const logoModuleConfig = useProductModules(shopDomain, productId);
  
  // Gestion du sélecteur de zone pour les logos
  const [showZoneSelector, setShowZoneSelector] = useState<{logoId: string, variantId: string, variantFile: string, view?: 'front' | 'back' | 'left' | 'right'} | null>(null);
  const [selectedZone, setSelectedZone] = useState<string>('');
  
  // Mapper la vue vers la catégorie
  const viewToCategory: Record<'front' | 'back' | 'left' | 'right', 'torse' | 'dos' | 'bras-gauche' | 'bras-droit'> = {
    'front': 'torse',
    'back': 'dos',
    'left': 'bras-gauche',
    'right': 'bras-droit'
  };

  // Déterminer la catégorie active pour le sélecteur de zone
  const activeCategoryForZone = showZoneSelector?.view ? viewToCategory[showZoneSelector.view] : 'torse';

  // Filtrer les zones selon la vue active pour le sélecteur de zone
  const filteredZonesForSelector = textZones.filter(zone => {
    const categoryForView = activeCategoryForZone;
    if (!zone.categories || !zone.categories.includes(`logo-${categoryForView}`)) return false;
    // Filtrer par view si disponible et si showZoneSelector a une vue
    if (showZoneSelector?.view && zone.view && zone.view !== showZoneSelector.view) return false;
    return true;
  });

  // Mettre à jour la zone sélectionnée quand les zones sont chargées
  useEffect(() => {
    if (filteredZonesForSelector.length > 0 && !selectedZone) {
      setSelectedZone(filteredZonesForSelector[0].id);
    }
  }, [filteredZonesForSelector, selectedZone]);

  // Modal de sélection de zone pour les logos
  const zoneModal = showZoneSelector && (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.25)' }}>
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Choisir une zone de placement</h3>
          
          {/* Affichage de la vue active (non modifiable depuis le modal) */}
          {showZoneSelector?.view && (
            <div className="mb-4">
              <div className="px-3 py-2 text-sm font-medium bg-blue-50 text-blue-700 rounded-lg">
                Vue: {showZoneSelector.view === 'front' ? 'Front' : showZoneSelector.view === 'back' ? 'Back' : showZoneSelector.view === 'left' ? 'Left' : 'Right'}
              </div>
            </div>
          )}
          
          {/* Sélection de zone par vignettes */}
          <div className="mb-6">
            {isLoadingZones ? (
              <div className="text-center py-4 text-gray-500">Chargement...</div>
            ) : filteredZonesForSelector.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {filteredZonesForSelector.map((zone) => (
                  <button
                    key={zone.id}
                    onClick={() => setSelectedZone(zone.id)}
                    className={`relative rounded-lg border-2 overflow-hidden transition-all ${
                      selectedZone === zone.id
                        ? 'border-blue-500 ring-2 ring-blue-200'
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
                      <div className="relative h-32 bg-gray-100 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-white border-2 border-gray-300 rounded flex items-center justify-center mb-2 mx-auto">
                            <span className="text-xs font-bold text-black">LOGO</span>
                          </div>
                          <p className="text-xs text-gray-600 font-medium">{zone.name}</p>
                        </div>
                      </div>
                    )}
                    {selectedZone === zone.id && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
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
              onClick={() => {
                setShowZoneSelector(null);
                setSelectedZone('');
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={() => {
                if (showZoneSelector && selectedZone) {
                  const zone = filteredZonesForSelector.find(z => z.id === selectedZone);
                  if (zone) {
                    // Si pas de variante, utiliser le logo principal
                    let variantId = showZoneSelector.variantId;
                    let variantFile = showZoneSelector.variantFile;
                    
                    if (!variantId || !variantFile) {
                      const logo = logos.find(l => l.id === showZoneSelector.logoId);
                      if (logo && logo.variants.length > 0) {
                        variantId = logo.variants[0].id;
                        variantFile = logo.variants[0].file;
                      }
                    }
                    
                    addLogo(showZoneSelector.logoId, variantId, variantFile, zone.position, activeCategoryForZone);
                    setShowZoneSelector(null);
                    setSelectedZone('');
                  }
                }
              }}
              disabled={!selectedZone}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Confirmer
            </button>
          </div>
        </div>
      </div>
    </div>
  );

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
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Contenu spécifique à chaque onglet */}
        {activeTab === 'design' && (
          <div className="flex-1 overflow-y-auto p-4">
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
          </div>
        )}
        {activeTab === 'color' && (
          <div className="flex-1 overflow-y-auto p-4">
            <ColorTab colors={colors} updateColor={updateColor} />
          </div>
        )}
        {activeTab === 'logo' && (
          <LogoTab
            placedLogos={placedLogos}
            addLogo={addLogo}
            updateLogo={updateLogo}
            removeLogo={removeLogo}
            selectedLogoId={selectedLogoId}
            selectLogo={selectLogo}
            textZones={textZones}
            isLoadingZones={isLoadingZones}
            logos={logos}
            isLoadingLogos={isLoadingLogos}
            onOpenZoneSelector={setShowZoneSelector}
            addLogoButtonLabel={logoModuleConfig?.addLogoButtonLabel}
            logoPlacementMode={logoModuleConfig?.logoPlacementMode}
            logoZoneGroupIds={logoModuleConfig?.logoZoneGroupIds}
            logoLibraryIds={logoModuleConfig?.logoLibraryIds}
            logoViewFrontLabel={logoModuleConfig?.logoViewFrontLabel}
            logoViewBackLabel={logoModuleConfig?.logoViewBackLabel}
            logoViewLeftLabel={logoModuleConfig?.logoViewLeftLabel}
            logoViewRightLabel={logoModuleConfig?.logoViewRightLabel}
            onCameraViewChange={(view) => {
              // Émettre un événement pour changer la vue de la caméra
              window.dispatchEvent(new CustomEvent('setCameraView', { detail: view }));
            }}
          />
        )}
          
          {/* Onglets motif / dégradé retirés */}
        </div>
      </div>
      
      {/* Modal de sélection de zone */}
      {zoneModal}
    </div>
  );
}
