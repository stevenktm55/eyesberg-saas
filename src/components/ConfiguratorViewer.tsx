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
function useTextZones(selectedDesignId?: string | null, shopDomain?: string | null) {
  const [zones, setZones] = useState<TextZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadZones() {
      try {
        const params = new URLSearchParams(); if (selectedDesignId) params.set('designId', selectedDesignId); if (shopDomain) params.set('shop', shopDomain); const url = `/api/text-zones${params.toString() ? '?' + params.toString() : ''}`;
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
  }, [selectedDesignId, shopDomain]);

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
  }, [selectedDesignId, shopDomain]);

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
function useFonts(shopDomain?: string | null) {
  const [fonts, setFonts] = useState<FontItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Éviter les appels multiples si les polices sont déjà chargées
    if (fonts.length > 0) {
      return;
    }
    
    async function loadFonts() {
      try {
        const url = shopDomain ? `/api/fonts?shop=${encodeURIComponent(shopDomain)}` : '/api/fonts'; const response = await fetch(url);
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
function useFilteredFonts(category: 'names' | 'numbers' | 'all', shopDomain?: string | null) {
  const [fonts, setFonts] = useState<FontItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Éviter les appels multiples si les polices sont déjà chargées
    if (fonts.length > 0) {
      return;
    }
    
    async function loadFilteredFonts() {
      try {
        const params = new URLSearchParams(); if (category !== 'all') params.set('category', category); if (shopDomain) params.set('shop', shopDomain); const url = `/api/fonts${params.toString() ? '?' + params.toString() : ''}`;
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
function useLogos(selectedDesignId?: string | null, shopDomain?: string | null) {
  const [logos, setLogos] = useState<Logo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [libraries, setLibraries] = useState<Array<{id: string; name: string}>>([]);

  useEffect(() => {
    async function loadLogos() {
      try {
        const params = new URLSearchParams(); if (selectedDesignId) params.set('designId', selectedDesignId); if (shopDomain) params.set('shop', shopDomain); const url = `/api/logos${params.toString() ? '?' + params.toString() : ''}`;
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
  }, [selectedDesignId, shopDomain]);

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
function useAutoLoadModel(forcedModelId?: string | null, forcedModelUrl?: string | null, productId?: string | null, shopDomain?: string | null) {
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
            const url = shopDomain ? `/api/models?shop=${encodeURIComponent(shopDomain)}` : '/api/models'; const res = await fetch(url);
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
        const url = shopDomain ? `/api/models?shop=${encodeURIComponent(shopDomain)}` : '/api/models'; const response = await fetch(url);
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

  const selectDesign = useCallback((design: { id: string; svgUrl: string; model_type?: 'maillot' | 'pantalon' } | null) => {
    if (design) {
      // Éviter les mises à jour inutiles si le design est déjà sélectionné
      setSelectedDesign(prev => {
        if (prev.id === design.id && prev.svgUrl === design.svgUrl) {
          return prev; // Pas de changement, éviter le re-render
        }
        return { id: design.id, svgUrl: design.svgUrl, model_type: design.model_type };
      });
    } else {
      setSelectedDesign(prev => {
        if (prev.id === null && prev.svgUrl === null) {
          return prev; // Pas de changement
        }
        return { id: null, svgUrl: null };
      });
    }
  }, []);

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
    
    setPlacedLogos(prev => prev.map(logo => 
      logo.id === id ? { ...logo, locked: !logo.locked } : logo
    ));
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
  onRequestTextDelete,
  selectedDesign,
  modelUrl,
  modelId,
  textureMaps,
  materialMaps,
  isPlacingText,
  textZones,
  onTextPlaced,
  viewerSettings,
  cameraSettings,
  onCloseModal,
  isMobileModalOpen,
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
  onRequestTextDelete?: (id: string) => void;
  selectedDesign: { id: string | null; svgUrl: string | null };
  modelUrl: string | null;
  modelId: string | null;
  textureMaps: Record<string, string> | null;
  materialMaps: Record<string, any> | null;
  // Mode placement de texte
  isPlacingText?: 'nom' | 'numero' | null;
  textZones?: TextZone[];
  onTextPlaced?: (category: 'nom' | 'numero', position: [number, number, number], zoneCategory?: string, rotation?: number) => void;
  viewerSettings?: {
    lights?: {
      ambientLight?: {
        intensity?: number;
      };
      directionalLights?: Array<{
        position: [number, number, number];
        intensity: number;
      }>;
    };
    environment?: {
      preset?: string;
    };
  };
  cameraSettings?: {
    initialZoom?: number;
    minZoom?: number;
    maxZoom?: number;
    zoomSpeed?: number;
    rotateSpeed?: number;
  };
  // Fermeture du panneau mobile
  onCloseModal?: () => void;
  isMobileModalOpen?: boolean;
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

  // Détecter si on est sur mobile (réactif avec media queries et mesure conteneur)
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  
  useEffect(() => {
    console.log('🔍 ConfiguratorViewer Viewer3D useEffect détection mobile - démarrage');
    
    const checkMobile = () => {
      if (typeof window === 'undefined') {
        setIsMobileView(false);
        return;
      }
      
      // Mesurer la largeur réelle du conteneur (pour la simulation mobile)
      const container = containerRef.current;
      const containerWidth = container ? container.offsetWidth : window.innerWidth;
      
      // Vérifier la largeur de la fenêtre
      const isWindowMobile = window.innerWidth < 768;
      
      // Vérifier la largeur du conteneur
      const isContainerMobile = containerWidth < 768;
      
      // Vérifier les media queries CSS
      const mediaQuery = window.matchMedia('(max-width: 767px)');
      const isMediaQueryMobile = mediaQuery.matches;
      
      // Considérer comme mobile si l'une des conditions est vraie
      const isMobile = isWindowMobile || isContainerMobile || isMediaQueryMobile;
      
      console.log('📱 ConfiguratorViewer Viewer3D - Détection mobile:', { 
        isWindowMobile, 
        isContainerMobile, 
        isMediaQueryMobile, 
        isMobile, 
        windowWidth: window.innerWidth,
        containerWidth: containerWidth,
        hasContainer: !!container
      });
      
      setIsMobileView(isMobile);
      setIsMobile(isMobile); // Mettre à jour aussi isMobile pour la compatibilité
    };
    
    // Vérifier immédiatement
    checkMobile();
    
    // Attendre un peu pour que le DOM soit prêt
    const timeoutId = setTimeout(checkMobile, 100);
    const timeoutId2 = setTimeout(checkMobile, 500);
    
    // Écouter les changements de taille de fenêtre
    window.addEventListener('resize', checkMobile);
    
    // Observer les changements de taille du conteneur (ResizeObserver)
    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        console.log('📐 ConfiguratorViewer Viewer3D ResizeObserver - conteneur redimensionné');
        checkMobile();
      });
      resizeObserver.observe(containerRef.current);
    }
    
    // Écouter les changements de media queries
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const handleMediaChange = () => {
      console.log('📱 ConfiguratorViewer Viewer3D Media query changée');
      checkMobile();
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    } else {
      mediaQuery.addListener(handleMediaChange);
    }
    
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
      window.removeEventListener('resize', checkMobile);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      } else {
        mediaQuery.removeListener(handleMediaChange);
      }
    };
  }, []);
  
  // Désactiver les interactions du Canvas quand le panneau mobile est ouvert
  const shouldDisableCanvasInteractions = isMobileModalOpen && isMobileView;
  
  useEffect(() => {
    console.log('🔍 Viewer3D ConfiguratorViewer - État interactions:', {
      isMobileModalOpen,
      isMobileView,
      shouldDisableCanvasInteractions
    });
  }, [isMobileModalOpen, isMobileView, shouldDisableCanvasInteractions]);

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

  // Constantes pour les textes
  const fontSizeSliderMin = 60;
  const fontSizeSliderMax = 750;

  // Paramètres de caméra depuis les props ou valeurs par défaut
  const initialZoom = cameraSettings?.initialZoom ?? (isMobile ? 18 : 10);
  const cameraPosition: [number, number, number] = isMobile ? [0, 1, 18] : [0, 1, initialZoom];
  const cameraTarget: [number, number, number] = isMobile ? [0, -1, 0] : [0, 0, 0];
  const minDistance = cameraSettings?.minZoom ?? (isMobile ? 7 : 2.5);
  const maxDistance = cameraSettings?.maxZoom ?? (isMobile ? 18 : 10);

  return (
    <div className="h-full flex flex-col bg-white" ref={containerRef}>
      {/* Canvas 3D - prend tout l'espace */}
      <div 
        className="flex-1 bg-gray-50 relative"
        onContextMenu={(e) => e.preventDefault()}
      >
        <Canvas
          camera={{ position: cameraPosition, fov: 50 }}
          gl={{
            preserveDrawingBuffer: true,
            antialias: true,
            alpha: true,
          }}
          style={{
            background: '#f5f5f5',
            width: '100%',
            height: '100%',
            pointerEvents: shouldDisableCanvasInteractions ? 'none' : 'auto'
          }}
        >
          {/* Éclairage depuis le snapshot ou valeurs par défaut */}
          <ambientLight intensity={viewerSettings?.lights?.ambientLight?.intensity ?? 0.5} />
          {viewerSettings?.lights?.directionalLights && viewerSettings.lights.directionalLights.length > 0 ? (
            viewerSettings.lights.directionalLights.map((light: any, index: number) => (
              <directionalLight key={index} position={light.position} intensity={light.intensity} />
            ))
          ) : (
            <>
              <directionalLight position={[10, 10, 5]} intensity={1} />
              <directionalLight position={[-10, -10, -5]} intensity={0.5} />
            </>
          )}
          <Environment preset={viewerSettings?.environment?.preset || "city"} />
          
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
                designTexture={designTexture || undefined}
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
                onRequestTextDelete={onRequestTextDelete}
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
            enableZoom={!selectedTextId && !selectedLogoId && !shouldDisableCanvasInteractions} 
            enableRotate={!selectedTextId && !selectedLogoId && !shouldDisableCanvasInteractions}
            enabled={!isDraggingText && !isRotatingText && !isResizingText && !isDraggingLogo && !isRotatingLogo && !isResizingLogo && !shouldDisableCanvasInteractions}
            target={cameraTarget}
            minDistance={minDistance}
            maxDistance={maxDistance}
            zoomSpeed={cameraSettings?.zoomSpeed ?? 1}
            rotateSpeed={cameraSettings?.rotateSpeed ?? 1}
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
  logoViewFrontLabel,
  logoViewBackLabel,
  logoViewLeftLabel,
  logoViewRightLabel,
  onCameraViewChange,
  onRequestLogoDelete,
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
  onRequestLogoDelete?: (id: string) => void;
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
  
  // Libellé du bouton
  const buttonLabel = addLogoButtonLabel || 'Ajouter un logo';
  
  // Debug: vérifier les valeurs reçues
  console.log('🎨 LogoTab - Composant rendu avec props:', {
    addLogoButtonLabel,
    logoPlacementMode,
    logoZoneGroupIds,
    logoLibraryIds,
    logoViewFrontLabel,
    logoViewBackLabel,
    logoViewLeftLabel,
    logoViewRightLabel,
    viewLabels,
    buttonLabel,
    textZonesCount: textZones.length,
    filteredZonesCount: 0 // sera calculé plus tard
  });

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
    // Filtrer par bibliothèques si configuré (si logoLibraryIds est défini ET non vide)
    // Si logoLibraryIds est undefined ou vide, on affiche tous les logos
    if (logoLibraryIds !== undefined && logoLibraryIds !== null && Array.isArray(logoLibraryIds) && logoLibraryIds.length > 0) {
      // Le champ dans la base de données est logo_library_id (snake_case)
      const logoLibId = (logo as any).logo_library_id || (logo as any).libraryId || (logo as any).logoLibraryId || (logo as any).logo_library?.id;
      if (!logoLibId || !logoLibraryIds.includes(logoLibId)) {
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
  
  console.log('📚 Logos filtrés:', { 
    total: logos.length, 
    filtered: filteredLibraryLogos.length, 
    logoLibraryIds, 
    hasFilter: logoLibraryIds !== undefined && logoLibraryIds !== null && Array.isArray(logoLibraryIds) && logoLibraryIds.length > 0
  });
  
  console.log('📚 Résultat du filtrage:', { 
    total: logos.length, 
    filtered: filteredLibraryLogos.length
  });

  // Gérer la sélection d'une variante (ouvre le sélecteur de zone si mode zones, sinon placement libre)
  const handleVariantSelect = (logoId: string, variantId: string, variantFile: string) => {
    if (logoPlacementMode === 'zones') {
      onOpenZoneSelector({ logoId, variantId, variantFile, view: activeView });
      setShowLibrary(false); // Fermer la bibliothèque immédiatement pour éviter le retour visuel
    } else {
      // Placement libre - ajouter directement au centre
      addLogo(logoId, variantId, variantFile, [0.5, 0.5, 0], activeCategory);
      setShowLibrary(false); // Fermer la bibliothèque après ajout
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
                    // Toujours ouvrir le sélecteur de zone si le mode zones est configuré
                    // Sinon, ajouter directement le logo (mode libre)
                    if (logoPlacementMode === 'zones') {
                      if (logo.variants.length === 0) {
                        onOpenZoneSelector({ logoId: logo.id, variantId: '', variantFile: '', view: activeView });
                        setShowLibrary(false); // Fermer la bibliothèque immédiatement pour éviter le retour visuel
                      } else if (logo.variants.length === 1) {
                        onOpenZoneSelector({ logoId: logo.id, variantId: logo.variants[0].id, variantFile: logo.variants[0].file, view: activeView });
                        setShowLibrary(false); // Fermer la bibliothèque immédiatement pour éviter le retour visuel
                      } else {
                        // Plusieurs variantes : ouvrir le sélecteur de variantes d'abord
                        setShowVariantSelector(logo.id);
                      }
                    } else {
                      // Mode libre : ajouter directement
                      if (logo.variants.length === 0) {
                        addLogo(logo.id, '', '', [0.5, 0.5, 0], activeCategory);
                        setShowLibrary(false); // Fermer la bibliothèque après ajout
                      } else if (logo.variants.length === 1) {
                        addLogo(logo.id, logo.variants[0].id, logo.variants[0].file, [0.5, 0.5, 0], activeCategory);
                        setShowLibrary(false); // Fermer la bibliothèque après ajout
                      } else {
                        setShowVariantSelector(logo.id);
                      }
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
                      if (onRequestLogoDelete) {
                        onRequestLogoDelete(logo.id);
                      }
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
// Hook pour charger toute la configuration du produit
function useProductConfig(shopDomain?: string | null, productId?: string | null, isPreview?: boolean) {
  const [config, setConfig] = useState<{
    model3DId?: string | null;
    design2DId?: string | null;
    customizationModules?: any[];
    settings?: {
      zoomSpeed?: number;
      rotateSpeed?: number;
      minZoom?: number;
      maxZoom?: number;
      initialZoom?: number;
      initialRotation?: [number, number, number];
      viewDistance?: number;
    };
    logoModuleConfig?: {
      addLogoButtonLabel?: string;
      logoPlacementMode?: 'zones' | 'free';
      logoZoneGroupIds?: string[];
      logoLibraryIds?: string[];
      logoViewFrontLabel?: string;
      logoViewBackLabel?: string;
      logoViewLeftLabel?: string;
      logoViewRightLabel?: string;
    } | null;
    designModuleConfig?: {
      allowedDesignIds?: string[];
    } | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadConfig() {
      // Récupération robuste des paramètres URL
      const urlParams = new URLSearchParams(window.location.search);
      const shop = shopDomain || urlParams.get('shop');
      const product = productId || urlParams.get('productId');
      
      // PRIORITÉ 1: Utiliser le paramètre preview passé en prop (le plus fiable)
      // PRIORITÉ 2: Récupérer depuis l'URL si non fourni
      const previewParamRaw = urlParams.get('preview');
      const previewFromHash = typeof window !== 'undefined' && window.location.hash 
        ? new URLSearchParams(window.location.hash.split('?')[1] || '').get('preview')
        : null;
      
      // Utiliser la prop isPreview en priorité, sinon détecter depuis l'URL
      const isPreviewMode = isPreview !== undefined 
        ? isPreview 
        : (previewParamRaw === 'true' || previewParamRaw === '1' || previewParamRaw === 'yes' || previewFromHash === 'true');
      
      // Toujours utiliser la valeur brute si présente, sinon utiliser la prop
      const previewValue = isPreview !== undefined 
        ? (isPreview ? 'true' : null)
        : (previewParamRaw || previewFromHash);
      
      
      if (!shop || !product) {
        setIsLoading(false);
        return;
      }
      
      try {
        const normalizedProductId = normalizeShopifyProductId(product);
        // Ajouter un timestamp pour éviter le cache
        const timestamp = Date.now();
        
        // Construire les paramètres de l'API
        const apiParams = new URLSearchParams();
        apiParams.append('shop', shop || '');
        apiParams.append('id', normalizedProductId || product);
        apiParams.append('_t', timestamp.toString());
        
        // CRITIQUE: Toujours ajouter preview à l'API si l'un de ces critères est rempli
        // On vérifie TOUTES les sources possibles pour être sûr de ne rien manquer
        const shouldAddPreview = isPreview === true || 
                                 isPreviewMode === true || 
                                 previewValue !== null && previewValue !== undefined ||
                                 previewParamRaw === 'true' || 
                                 previewParamRaw === '1' || 
                                 previewParamRaw === 'yes' ||
                                 previewFromHash === 'true';
        
        if (shouldAddPreview) {
          apiParams.append('preview', 'true');
        }
        
        const apiUrl = `/api/product-builder?${apiParams.toString()}`;
        
        // Vérification finale : si preview était dans l'URL, il DOIT être dans l'API
        if (previewValue !== null && !apiParams.has('preview')) {
          apiParams.append('preview', 'true');
        }
        
        // Vérification supplémentaire : si on est dans une iframe ou qu'on vient d'un preview
        const isInIframe = typeof window !== 'undefined' && window.self !== window.top;
        const referrer = typeof document !== 'undefined' ? document.referrer : '';
        const isFromPreviewPage = referrer.includes('/admin/preview') || isInIframe;
        
        if (isFromPreviewPage && !apiParams.has('preview')) {
          apiParams.append('preview', 'true');
        }
        
        const finalApiUrl = `/api/product-builder?${apiParams.toString()}`;
        const response = await fetch(finalApiUrl, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        // Gérer les erreurs HTTP (400, 404, etc.)
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
          console.error('❌ Erreur HTTP de l\'API:', {
            status: response.status,
            error: errorData.error,
            isPreview
          });
          setConfig(null);
          setIsLoading(false);
          // En mode preview, l'erreur sera affichée par le composant d'erreur
          return;
        }
        
        if (response.ok) {
          const productData = await response.json();
          
          console.log('📦 Données reçues de l\'API:', {
            hasSnapshot: !!productData.snapshot,
            productId: productData.id,
            productName: productData.name,
            shopifyProductId: productData.shopify_product_id,
            snapshotKeys: productData.snapshot ? Object.keys(productData.snapshot) : [],
            hasDesign2D: !!productData.snapshot?.design2D,
            design2DUrl: productData.snapshot?.design2D?.url,
            error: productData.error
          });
          
          // Si l'API retourne une erreur (par exemple builder_data vide pour preview)
          if (productData.error) {
            console.error('❌ Erreur de l\'API:', productData.error);
            setConfig(null);
            setIsLoading(false);
            // En mode preview, l'erreur sera affichée par le composant d'erreur
            return;
          }
          
          if (!productData.snapshot) {
            console.error('❌ Aucun snapshot dans la réponse de l\'API', {
              productDataKeys: Object.keys(productData),
              hasBuilderData: !!productData.builder_data,
              productId: productData.id,
              shopifyProductId: productData.shopify_product_id
            });
            
            // En mode preview, ne pas bloquer immédiatement
            // L'API devrait générer automatiquement le snapshot
            // Mais si ce n'est pas le cas, on retourne null quand même
            setConfig(null);
            setIsLoading(false);
            return;
          }
          
          const snapshot = productData.snapshot;
          
          console.log('✅ Snapshot chargé:', {
            version: snapshot.version,
            publishedAt: snapshot.publishedAt,
            hasModel3D: !!snapshot.model3D,
            hasDesign2D: !!snapshot.design2D,
            design2DUrl: snapshot.design2D?.url,
            modulesCount: snapshot.customizationModules?.length || 0,
            hasTextZones: !!snapshot.textZones?.length,
            textZonesCount: snapshot.textZones?.length || 0,
            hasFonts: !!snapshot.fonts?.length,
            fontsCount: snapshot.fonts?.length || 0
          });
          
          const rawModules = snapshot.customizationModules || [];
          const modules = rawModules.map((m: any) => {
            const module: any = {
              id: m.id,
              contentType: m.type || m.contentType || 'unknown',
              tabName: m.label || m.tabName || 'Module',
              type: m.type,
              label: m.label,
              icon: m.icon || m.config?.icon,
              iconUrl: m.iconUrl || m.config?.iconUrl,
              config: m.config || {},
              selectedItems: m.selectedItems || {
                design2DId: snapshot.defaultState?.design2DId,
                colorId: snapshot.defaultState?.colorId,
              },
              allowedDesigns: m.allowedDesigns,
              allowedColors: m.allowedColors,
              default: m.default
            };
            
            if ((m.type === 'designs-2d' || m.contentType === 'designs-2d') && !module.selectedItems.design2DId) {
              module.selectedItems.design2DId = snapshot.defaultState?.design2DId || m.default;
            }
            
            return module;
          });
          
          const logoModule = modules.find((m: any) => (m.type === 'logos' || m.contentType === 'logos'));
          const logoModuleConfig = logoModule ? {
            addLogoButtonLabel: logoModule.config?.addLogoButtonLabel,
            logoPlacementMode: logoModule.config?.logoPlacementMode,
            logoZoneGroupIds: logoModule.config?.logoZoneGroupIds,
            logoLibraryIds: logoModule.config?.logoLibraries?.map((lib: any) => lib.id) || [],
            logoViewFrontLabel: logoModule.config?.logoViewFrontLabel,
            logoViewBackLabel: logoModule.config?.logoViewBackLabel,
            logoViewLeftLabel: logoModule.config?.logoViewLeftLabel,
            logoViewRightLabel: logoModule.config?.logoViewRightLabel,
          } : null;
          
          const designModule = modules.find((m: any) => (m.type === 'designs-2d' || m.contentType === 'designs-2d'));
          const designModuleConfig = designModule ? {
            allowedDesignIds: designModule.allowedDesigns?.map((d: any) => d.svgUrl) || [],
          } : null;
          
          const configData = {
            snapshot: snapshot,
            model3DId: snapshot.model3D?.url ? 'snapshot-model' : null,
            design2DId: snapshot.design2D?.url ? 'snapshot-design' : null,
            customizationModules: modules,
            settings: snapshot.cameraSettings || {},
            logoModuleConfig,
            designModuleConfig,
          };
          
          setConfig(configData);
          return;
        }
      } catch (error) {
        // Erreur silencieuse
      } finally {
        setIsLoading(false);
      }
    }
    
    loadConfig();
  }, [shopDomain, productId]);

  return { config, isLoading };
}

function useProductModules(shopDomain?: string | null, productId?: string | null) {
  const { config } = useProductConfig(shopDomain, productId);
  return config?.logoModuleConfig || null;
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
  shopDomain,
  productId,
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
  const finalShopDomain: string | null = shopDomain ?? null;
  const finalProductId: string | null = productId ?? null;
  const logoModuleConfig = useProductModules(finalShopDomain, finalProductId);
  
  // Le modal de zone est géré dans ConfiguratorViewer, pas dans Sidebar

  // La sidebar droite affiche seulement le contenu basé sur activeTab
  // Les onglets sont maintenant dans la sidebar gauche (gérés par ConfiguratorViewer)
  
  // Déterminer le titre et l'icône de l'onglet actif
  const getTabInfo = () => {
    switch (activeTab) {
      case 'design':
        return { title: 'Sélectionner le design', icon: '🎨' };
      case 'color':
        return { title: 'Choisir une couleur', icon: '🎨' };
      case 'numero':
        return { title: 'Ajouter des numéros', icon: '🔢' };
      case 'nom':
        return { title: 'Ajouter un nom', icon: '✏️' };
      case 'logo':
        return { title: 'Ajouter des logos', icon: '🖼️' };
      default:
        return { title: 'Personnalisation', icon: '⚙️' };
    }
  };
  
  const tabInfo = getTabInfo();
  
  return (
    <div className="h-full flex flex-col">
        {/* En-tête fixe */}
        <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-white sticky top-0 z-20">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-2xl">{tabInfo.icon}</span>
            {tabInfo.title}
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
            onRequestLogoDelete={confirmDeleteLogo}
          />
        )}
        {activeTab === 'numero' && (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="text-center py-8">
              <p className="text-gray-500">Onglet Numéro - À implémenter</p>
            </div>
          </div>
        )}
        {activeTab === 'nom' && (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="text-center py-8">
              <p className="text-gray-500">Onglet Nom - À implémenter</p>
            </div>
          </div>
        )}
        </div>
      </div>
  );
}

// Le composant principal est la fonction Sidebar qui se termine à la ligne 2851
// On doit créer une fonction ClientPage qui appelle Sidebar avec tous les paramètres nécessaires
// Pour l'instant, on exporte une fonction vide qui retourne null pour éviter l'erreur
// TODO: Restructurer le fichier pour avoir une fonction ClientPage complète
// Fonction principale ConfiguratorViewer qui combine Sidebar et Viewer3D
export default function ConfiguratorViewer({
  mode = 'client',
  productId: propProductId,
  shopDomain: propShopDomain,
  preview: propPreview,
  onSave,
  onAddToCart,
  forceMobileLayout = false,
}: {
  mode?: 'client' | 'admin';
  productId?: string | null;
  shopDomain?: string | null;
  preview?: boolean;
  onSave?: () => void;
  onAddToCart?: () => void;
  forceMobileLayout?: boolean;
}) {
  // Récupérer les paramètres de l'URL si non fournis
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const productId = propProductId || urlParams?.get('productId') || null;
  const shopDomain = propShopDomain || urlParams?.get('shop') || null;
  // Définir finalShopDomain et finalProductId AVANT d'utiliser les hooks
  const finalShopDomain: string | null = shopDomain ?? null;
  const finalProductId: string | null = productId ?? null;
  
  // Vérifier si on est en mode preview (priorité à la prop, sinon depuis l'URL)
  const isPreviewMode = useMemo(() => {
    // PRIORITÉ 1: Utiliser la prop preview si fournie
    if (propPreview !== undefined) {
      return propPreview;
    }
    // PRIORITÉ 2: Détecter depuis l'URL
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    const previewParam = params.get('preview');
    return previewParam === 'true' || previewParam === '1' || previewParam === 'yes';
  }, [propPreview]);
  
  
  // Charger la configuration complète du produit (PASSER isPreviewMode)
  const { config: productConfig, isLoading: isLoadingConfig } = useProductConfig(finalShopDomain, finalProductId, isPreviewMode);
  
  // Extraire le snapshot AVANT les useEffect qui l'utilisent
  const snapshot = productConfig?.snapshot;
  
  // Tous les useState doivent être déclarés AVANT les useEffect qui les utilisent
  const [designs2D, setDesigns2D] = useState<any[]>([]);
  const [colorPalettes, setColorPalettes] = useState<any[]>([]);
  const [logoLibraries, setLogoLibraries] = useState<any[]>([]);
  const [logosFromSnapshot, setLogosFromSnapshot] = useState<Logo[]>([]);
  const [selectedDesign2DId, setSelectedDesign2DId] = useState<string | null>(null);
  const [selectedColorClass, setSelectedColorClass] = useState<string | null>(null);
  const [designColors, setDesignColors] = useState<Record<string, string>>({});
  const [showLogoLibrary, setShowLogoLibrary] = useState(false);
  const [showLogoZoneModal, setShowLogoZoneModal] = useState(false);
  const [selectedLogoForZone, setSelectedLogoForZone] = useState<{logoId: string, variantId?: string, variantFile?: string} | null>(null);
  const [activeLogoView, setActiveLogoView] = useState<'front' | 'back' | 'left' | 'right'>('front');
  const [selectedLogoZoneId, setSelectedLogoZoneId] = useState<string>('');
  const [selectedLogoForVariants, setSelectedLogoForVariants] = useState<any | null>(null);
  const [logoToReplace, setLogoToReplace] = useState<string | null>(null);
  const [isReplacingLogo, setIsReplacingLogo] = useState(false);
  // État pour le sélecteur de viewport (desktop/mobile)
  const [viewportMode, setViewportMode] = useState<'desktop' | 'mobile'>('desktop');
  // Gestion du sélecteur de zone pour les logos
  const [showZoneSelector, setShowZoneSelector] = useState<{logoId: string, variantId: string, variantFile: string, view?: 'front' | 'back' | 'left' | 'right'} | null>(null);
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [isLoadingZones] = useState(false); // Les zones sont déjà chargées dans le snapshot
  // Modal de confirmation de suppression
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, name: string, type: 'logo' | 'text'} | null>(null);
  const [targetView, setTargetView] = useState<'torse' | 'dos' | 'bras-gauche' | 'bras-droit' | null>(null);
  const [showTextZoneSelector, setShowTextZoneSelector] = useState<{textId: string | null, view?: 'torse' | 'dos' | 'bras-gauche' | 'bras-droit'} | null>(null);
  const [textZoneInputs, setTextZoneInputs] = useState<Record<string, string>>({});
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [textInputValue, setTextInputValue] = useState<string>('');
  const [activeTextTab, setActiveTextTab] = useState<'contenu' | 'police' | 'couleur' | 'contour' | 'deformation'>('contenu');
  
  // Utiliser UNIQUEMENT les données du snapshot - AUCUN appel API
  // Note: snapshot est déjà défini plus haut (ligne 2984)
  const textZones = snapshot?.textZones || [];
  const fonts = snapshot?.fonts || [];
  
  const { selectedDesign, selectDesign } = useDesignSelection();
  const { colors, updateColor, replaceColors, resetColors } = useColorSelection();
  
  // Pour les logos, extraire depuis logoLibraries du snapshot
  useEffect(() => {
    if (snapshot && logoLibraries.length > 0) {
      // Extraire tous les logos de toutes les bibliothèques
      const allLogos: Logo[] = [];
      logoLibraries.forEach((library: any) => {
        if (library.logos && Array.isArray(library.logos)) {
          library.logos.forEach((logo: any) => {
            allLogos.push({
              id: logo.id || logo.logoId,
              name: logo.name || '',
              variants: logo.variants || (logo.variantFile ? [{
                id: 'base',
                file: logo.variantFile || logo.file_url || '',
                name: logo.name || 'Base'
              }] : []),
              file_url: logo.file_url || logo.variantFile || '',
              vector: logo.vector || false
            });
          });
        }
      });
      setLogosFromSnapshot(allLogos);
    } else {
      setLogosFromSnapshot([]);
    }
  }, [snapshot, logoLibraries]);
  
  // Utiliser UNIQUEMENT les logos du snapshot - AUCUN appel API
  const logos = snapshot ? logosFromSnapshot : [];
  const isLoadingLogos = false;
  
  // Charger les designs 2D depuis le snapshot
  useEffect(() => {
    if (!snapshot) {
      setDesigns2D([]);
      return;
    }
    
    const designModule = snapshot.customizationModules
      .find((m: any) => (m.type === 'designs-2d' || m.contentType === 'designs-2d'));
    const snapshotDesigns = designModule?.allowedDesigns || [];
    
    if (snapshotDesigns.length > 0) {
      const mappedDesigns = snapshotDesigns.map((d: any) => ({
        id: d.id || d.svgUrl, // Utiliser l'ID si disponible, sinon l'URL
        name: d.label || d.name || 'Design',
        svgUrl: d.svgUrl,
        svg_url: d.svgUrl,
        thumbnail_url: d.thumbnailUrl,
        thumbnailUrl: d.thumbnailUrl // Ajouter aussi thumbnailUrl pour compatibilité
      }));
      console.log('🎨 Designs 2D chargés depuis snapshot:', {
        count: mappedDesigns.length,
        designs: mappedDesigns.map(d => ({
          id: d.id,
          name: d.name,
          hasThumbnail: !!d.thumbnailUrl,
          thumbnailUrl: d.thumbnailUrl
        }))
      });
      setDesigns2D(mappedDesigns);
    } else {
      setDesigns2D([]);
    }
  }, [snapshot]);
  
  // Charger les palettes de couleurs depuis le snapshot (pour les couleurs du design ET pour le texte)
  useEffect(() => {
    if (!snapshot) {
      setColorPalettes([]);
      return;
    }
    
    const palettes: any[] = [];
    
    // Palette pour les couleurs du design
    const colorModule = snapshot.customizationModules.find((m: any) => 
      (m.type === 'colors' || m.contentType === 'colors')
    );
    if (colorModule?.allowedColors && colorModule.allowedColors.length > 0) {
      const palette = {
        id: 'snapshot-palette',
        name: 'Snapshot Palette',
        colors: colorModule.allowedColors.map((c: any) => ({
          id: c.hex || c.id,
          name: c.label || c.name || '',
          hex: c.hex,
          value: c.hex,
          class: c.mesh || 'primary'
        }))
      };
      palettes.push(palette);
    }
    
    // Palettes pour le texte (couleur et contour) depuis le module texte
    const textModule = snapshot.customizationModules.find((m: any) => 
      (m.type === 'text' || m.contentType === 'text')
    );
    
    if (textModule?.config) {
      // Palette pour la couleur du texte
      if (textModule.config.textColorPaletteId && textModule.config.textColorPalette) {
        const textColorPalette = {
          id: textModule.config.textColorPaletteId,
          name: textModule.config.textColorPalette.name || 'Couleur texte',
          colors: textModule.config.textColorPalette.colors || []
        };
        if (textColorPalette.colors.length > 0) {
          palettes.push(textColorPalette);
        }
      }
      
      // Palette pour le contour du texte
      if (textModule.config.textStrokePaletteId && textModule.config.textStrokePalette) {
        const textStrokePalette = {
          id: textModule.config.textStrokePaletteId,
          name: textModule.config.textStrokePalette.name || 'Contour texte',
          colors: textModule.config.textStrokePalette.colors || []
        };
        if (textStrokePalette.colors.length > 0) {
          palettes.push(textStrokePalette);
        }
      }
    }
    
    console.log('🎨 Palettes de couleurs chargées depuis snapshot:', {
      palettesCount: palettes.length,
      palettes: palettes.map(p => ({ id: p.id, name: p.name, colorsCount: p.colors.length }))
    });
    setColorPalettes(palettes);
  }, [snapshot]);
  
  // Charger les bibliothèques de logos depuis le snapshot
  useEffect(() => {
    if (!snapshot) {
      setLogoLibraries([]);
      return;
    }
    
    const logoModule = snapshot.customizationModules.find((m: any) => 
      (m.type === 'logos' || m.contentType === 'logos')
    );
    if (logoModule?.config?.logoLibraries && logoModule.config.logoLibraries.length > 0) {
      console.log('📚 Bibliothèques de logos chargées depuis snapshot:', {
        librariesCount: logoModule.config.logoLibraries.length,
        libraries: logoModule.config.logoLibraries.map((lib: any) => ({
          id: lib.id,
          name: lib.name,
          logosCount: lib.logos?.length || 0,
          logos: lib.logos?.map((logo: any) => ({
            id: logo.id,
            name: logo.name,
            variantsCount: logo.variants?.length || 0
          })) || []
        }))
      });
      setLogoLibraries(logoModule.config.logoLibraries);
    } else {
      setLogoLibraries([]);
    }
  }, [snapshot]);
  
  // Initialiser les couleurs depuis le snapshot - AUCUNE LOGIQUE, juste exécuter le snapshot
  // Utiliser une ref pour éviter la boucle infinie
  const colorsInitializedRef = useRef(false);
  useEffect(() => {
    if (snapshot?.resolvedColors && !colorsInitializedRef.current) {
      replaceColors(snapshot.resolvedColors);
      colorsInitializedRef.current = true;
      console.log('🎨 Couleurs appliquées depuis snapshot.resolvedColors:', snapshot.resolvedColors);
    }
  }, [snapshot?.resolvedColors]);
  
  // Charger le modèle 3D depuis le snapshot uniquement
  const modelUrl = snapshot?.model3D?.url || null;
  const textureMaps = snapshot?.model3D?.textureMaps || {};
  const materialMaps = snapshot?.model3D?.materialMaps || {};
  const modelId = snapshot ? 'snapshot-model' : null;
  
  // Note: designTexture sera défini plus tard, on ne peut pas l'utiliser ici
  
  const textSelection = useTextSelection();
  const [isRotatingText, setIsRotatingText] = useState(false);
  const [isResizingText, setIsResizingText] = useState(false);
  const { texts, addText, updateText, removeText, updateTextPosition, updateTextRotation, updateTextSize, toggleTextLock, selectedTextId, selectText, isDraggingText, setIsDraggingText, startDraggingText, stopDraggingText } = textSelection;
  const logoSelection = useLogoSelection();
  const { placedLogos, addLogo, updateLogo, removeLogo, toggleLogoLock, selectedLogoId, selectLogo, isDraggingLogo, setIsDraggingLogo, isRotatingLogo, setIsRotatingLogo, isResizingLogo, setIsResizingLogo } = logoSelection;
  const logoModuleConfig = productConfig?.logoModuleConfig || null;
  
  // Déterminer les modules de personnalisation à partir du SNAPSHOT (source finale du viewer)
  // Priorité : snapshot.customizationModules (généré depuis builder_data)
  // Fallback : productConfig.customizationModules (ancienne source directe)
  const customizationModules = snapshot?.customizationModules || productConfig?.customizationModules || [];
  const [activeCustomizerTab, setActiveCustomizerTab] = useState<string | null>(null);
  
  // S'assurer que le panneau s'ouvre automatiquement sur le premier onglet quand les modules sont chargés
  useEffect(() => {
    if (customizationModules.length > 0 && !activeCustomizerTab) {
      setActiveCustomizerTab(customizationModules[0].id);
    }
  }, [customizationModules, activeCustomizerTab]);
  
  // NE PAS initialiser automatiquement les textes depuis les textZones
  // Les textZones sont disponibles pour sélection, mais les textes doivent être ajoutés manuellement par l'utilisateur
  
  // Initialiser selectedDesign2DId depuis le snapshot (une seule fois)
  useEffect(() => {
    // Ne s'exécuter que si selectedDesign n'est pas encore initialisé
    if (selectedDesign.id !== null) {
      return; // Déjà initialisé, éviter la boucle
    }
    
    if (snapshot?.design2D?.url) {
      setSelectedDesign2DId('snapshot-design');
      selectDesign({ 
        id: 'snapshot-design', 
        svgUrl: snapshot.design2D.url,
        model_type: snapshot.design2D.model_type
      });
      return;
    }
    
    if (designs2D.length === 0) {
      return;
    }
    
    const designModule = customizationModules.find((m: any) => 
      (m.contentType === 'designs-2d' || m.type === 'designs-2d')
    );
    if (designModule?.selectedItems?.design2DId) {
      setSelectedDesign2DId(designModule.selectedItems.design2DId);
      const design = designs2D.find((d: any) => d.id === designModule.selectedItems.design2DId);
      if (design) {
        selectDesign({ id: design.id, svgUrl: design.svg_url || design.svgUrl });
      }
    }
  }, [snapshot?.design2D?.url, designs2D.length, customizationModules.length, selectedDesign.id, selectDesign]);
  
  
  // Ouvrir/fermer la bibliothèque selon la sélection du logo
  useEffect(() => {
    const activeModule = customizationModules.find((m: any) => m.id === activeCustomizerTab);
    if (activeModule?.contentType === 'logos') {
      if (selectedLogoId) {
        // Logo sélectionné : ouvrir la bibliothèque si nécessaire
        // MAIS ne pas rouvrir si :
        // - le modal de zone est ouvert (pour éviter le retour visuel)
        // - on vient de remplacer un logo (isReplacingLogo est true)
        const logo = placedLogos.find(l => l.id === selectedLogoId);
        if (logo && !showZoneSelector && !isReplacingLogo) {
          if (!logoToReplace && !showLogoLibrary) {
            setLogoToReplace(selectedLogoId);
            setShowLogoLibrary(true);
          }
        }
      } else {
        if (logoToReplace && showLogoLibrary) {
          setShowLogoLibrary(false);
          setLogoToReplace(null);
          setSelectedLogoForVariants(null);
        }
      }
    }
  }, [selectedLogoId, activeCustomizerTab, customizationModules, placedLogos, logoToReplace, showLogoLibrary, showZoneSelector, isReplacingLogo]);
  
  // Log pour déboguer showZoneSelector
  useEffect(() => {
    console.log('🖼️ showZoneSelector changed:', showZoneSelector);
  }, [showZoneSelector]);
  
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
    console.log('🖼️ Filtrage zone - zone:', zone.name, 'categories:', zone.categories, 'zoneCategory:', zone.zoneCategory, 'categoryForView:', categoryForView);
    
    // Vérifier si le nom de la zone contient "logo" (insensible à la casse)
    const hasLogoInName = zone.name && zone.name.toLowerCase().includes('logo');
    console.log('🖼️ hasLogoInName:', hasLogoInName, 'zone.name:', zone.name);
    
    // Vérifier si la zone a la catégorie logo pour cette vue
    const hasLogoCategory = zone.categories && zone.categories.length > 0 && (
      zone.categories.includes(`logo-${categoryForView}`) ||
      zone.categories.includes('logo') ||
      zone.categories.some((cat: string) => cat.toLowerCase().includes('logo'))
    );
    console.log('🖼️ hasLogoCategory:', hasLogoCategory, 'zone.categories length:', zone.categories?.length);
    
    // Vérifier si zoneCategory correspond à la catégorie de vue
    const zoneCategoryMatches = zone.zoneCategory && zone.zoneCategory === categoryForView;
    console.log('🖼️ zoneCategoryMatches:', zoneCategoryMatches, 'zone.zoneCategory:', zone.zoneCategory);
    
    // Accepter la zone si :
    // 1. Elle a une catégorie logo
    // 2. Son nom contient "logo" (même si les catégories sont vides)
    // 3. Sa zoneCategory correspond à la catégorie de vue ET son nom contient "logo"
    const isLogoZone = hasLogoCategory || hasLogoInName || (zoneCategoryMatches && hasLogoInName);
    
    console.log('🖼️ isLogoZone:', isLogoZone);
    if (!isLogoZone) {
      console.log('🖼️ Zone rejetée (pas une zone logo):', zone.name);
      return false;
    }
    
    // Filtrer par view si disponible et si showZoneSelector a une vue
    // Mais seulement si la zone a une propriété view définie
    // Normaliser les valeurs de view pour la comparaison (Face -> front, Dos -> back, etc.)
    if (showZoneSelector?.view && zone.view) {
      const normalizeView = (view: string): string => {
        const normalized = view.toLowerCase();
        if (normalized === 'face' || normalized === 'front') return 'front';
        if (normalized === 'dos' || normalized === 'back') return 'back';
        if (normalized === 'gauche' || normalized === 'left') return 'left';
        if (normalized === 'droit' || normalized === 'right') return 'right';
        return normalized;
      };
      const normalizedZoneView = normalizeView(zone.view);
      const normalizedSelectorView = normalizeView(showZoneSelector.view);
      if (normalizedZoneView !== normalizedSelectorView) {
        console.log('🖼️ Zone filtrée par view - zone.view:', zone.view, 'normalized:', normalizedZoneView, 'showZoneSelector.view:', showZoneSelector.view, 'normalized:', normalizedSelectorView);
        return false;
      }
    }
    console.log('🖼️ ✅ Zone acceptée:', zone.name);
    return true;
  });
  console.log('🖼️ filteredZonesForSelector count:', filteredZonesForSelector.length, 'zones:', filteredZonesForSelector.map(z => z.name));

  // Mettre à jour la zone sélectionnée quand les zones sont chargées
  useEffect(() => {
    if (filteredZonesForSelector.length > 0 && !selectedZone) {
      setSelectedZone(filteredZonesForSelector[0].id);
    }
  }, [filteredZonesForSelector, selectedZone]);
  
  // Log pour déboguer avant le modal
  useEffect(() => {
    console.log('🖼️ AVANT zoneModal - showZoneSelector:', showZoneSelector, 'filteredZonesForSelector.length:', filteredZonesForSelector.length);
  }, [showZoneSelector, filteredZonesForSelector.length]);
  
  // Modal de sélection de zone pour les logos - Même UI que pour les textes
  const zoneModal = showZoneSelector ? (() => {
    console.log('🖼️ RENDERING ZONE MODAL, showZoneSelector:', JSON.stringify(showZoneSelector));
    console.log('🖼️ filteredZonesForSelector dans modal:', filteredZonesForSelector.length, 'zones:', filteredZonesForSelector.map(z => z.name));
    
    // Trouver le module actif pour les logos
    const activeModule = customizationModules.find((m: any) => m.contentType === 'logos');
    
    return (
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
          zIndex: 10000
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowZoneSelector(null);
            setSelectedZone('');
          }
        }}
      >
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '32px',
            width: '90%',
            maxWidth: '700px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#000000',
              fontFamily: 'var(--stepn-font-body)',
              margin: 0
            }}>
              {activeModule?.addLogoButtonLabel || 'Ajouter un logo'}
            </h2>
            <button
              onClick={() => {
                setShowZoneSelector(null);
                setSelectedZone('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#666666',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '0',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: '1'
              }}
            >
              ×
            </button>
          </div>

          {filteredZonesForSelector.length === 0 ? (
            <p style={{ color: '#666', fontSize: '14px', fontFamily: 'var(--stepn-font-body)', padding: '12px' }}>
              Aucune zone disponible.
            </p>
          ) : (
            <div>
              {/* Section: Choisissez une position standard */}
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#000000',
                  fontFamily: 'var(--stepn-font-body)',
                  marginBottom: '16px'
                }}>
                  Choisissez une position standard
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '16px'
                }}>
                  {filteredZonesForSelector.map((zone: any) => {
                    const isSelected = selectedZone === zone.id;
                    return (
                      <div
                        key={zone.id}
                        onClick={() => {
                          setSelectedZone(zone.id);
                          
                          // Faire pivoter la caméra vers la vue de la zone
                          const viewToCategory: Record<string, 'torse' | 'dos' | 'bras-gauche' | 'bras-droit'> = {
                            'Face': 'torse',
                            'Dos': 'dos',
                            'Gauche': 'bras-gauche',
                            'Droite': 'bras-droit',
                            'front': 'torse',
                            'back': 'dos',
                            'left': 'bras-gauche',
                            'right': 'bras-droit'
                          };
                          const zoneCategory = zone.view ? viewToCategory[zone.view] : zone.zone_category;
                          
                          if (zoneCategory) {
                            setTargetView(zoneCategory);
                            // Convertir la catégorie en vue de caméra
                            const categoryToView: Record<'torse' | 'dos' | 'bras-gauche' | 'bras-droit', 'front' | 'back' | 'left' | 'right'> = {
                              'torse': 'front',
                              'dos': 'back',
                              'bras-gauche': 'left',
                              'bras-droit': 'right'
                            };
                            const cameraView = categoryToView[zoneCategory];
                            if (cameraView) {
                              window.dispatchEvent(new CustomEvent('setCameraView', { detail: cameraView }));
                            }
                          }
                        }}
                        style={{
                          position: 'relative',
                          cursor: 'pointer',
                          border: isSelected ? '3px solid #000000' : '1px solid #e0e0e0',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          backgroundColor: '#ffffff',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = '#999999';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = '#e0e0e0';
                          }
                        }}
                      >
                        {/* Checkmark icon */}
                        {isSelected && (
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            width: '24px',
                            height: '24px',
                            backgroundColor: '#000000',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 10
                          }}>
                            <span style={{
                              color: '#ffffff',
                              fontSize: '14px',
                              fontWeight: 'bold'
                            }}>
                              ✓
                            </span>
                          </div>
                        )}
                        
                        {/* Zone thumbnail */}
                        <div style={{
                          width: '100%',
                          height: '140px',
                          backgroundColor: '#f5f5f5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          padding: '8px'
                        }}>
                          {zone.thumbnail_url && !zone.thumbnail_url.startsWith('blob:') ? (
                            <img
                              src={zone.thumbnail_url}
                              alt={zone.name}
                              style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                                filter: 'grayscale(100%)',
                                display: 'block'
                              }}
                              onError={(e) => {
                                console.error('❌ Error loading thumbnail for zone:', zone.name, zone.thumbnail_url);
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div style={{
                              width: '100%',
                              height: '100%',
                              backgroundColor: '#e0e0e0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#111827',
                              WebkitTextFillColor: '#111827',
                              fontSize: '12px',
                              textAlign: 'center',
                              padding: '8px'
                            }}>
                              {zone.name}
                              {!zone.thumbnail_url && (
                                <div style={{ fontSize: '10px', marginTop: '4px', color: '#999' }}>
                                  (Pas de vignette)
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Zone label */}
                        <div style={{
                          padding: '12px',
                          textAlign: 'center',
                          backgroundColor: '#ffffff'
                        }}>
                          <p style={{
                            margin: 0,
                            fontSize: '12px',
                            fontWeight: '500',
                            color: '#111827',
                            WebkitTextFillColor: '#111827',
                            WebkitTextStrokeColor: '#111827',
                            fontFamily: 'var(--stepn-font-body)'
                          }}>
                            {zone.name}
                            {zone.view && ` (${zone.view})`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action buttons */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px'
              }}>
                <button
                  onClick={() => {
                    setShowZoneSelector(null);
                    setSelectedZone('');
                  }}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#f5f5f5',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'var(--stepn-font-body)',
                    color: '#000000',
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e8e8e8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={async () => {
                    const selectedZoneData = filteredZonesForSelector.find((z: any) => z.id === selectedZone);
                    if (showZoneSelector && selectedZoneData) {
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
                      
                      // Utiliser la position de la zone directement (déjà en coordonnées UV2)
                      // IMPORTANT: Les zones sont stockées avec inversion verticale (comme dans UVMapViewer)
                      // Mais ModelViewer utilise des coordonnées directes, donc on doit inverser v
                      const zonePosition: [number, number, number] = [
                        selectedZoneData.position[0],
                        1 - selectedZoneData.position[1], // Inverser v pour correspondre à ModelViewer
                        selectedZoneData.position[2] || 0
                      ];
                      
                      // Convertir la rotation de degrés à radians si nécessaire
                      const zoneRotationRaw = selectedZoneData.rotation || selectedZoneData.default_rotation || 0;
                      const zoneRotation = zoneRotationRaw * (Math.PI / 180);
                      
                      // Calculer les dimensions en pixels à partir des dimensions de la zone
                      const CANVAS_SIZE = 2048;
                      const zoneWidth = selectedZoneData.width || 0.1;
                      const zoneHeight = selectedZoneData.height || 0.1;
                      
                      const zoneWidthPx = zoneWidth * CANVAS_SIZE;
                      const zoneHeightPx = zoneHeight * CANVAS_SIZE;
                      
                      // Déterminer la catégorie de la zone
                      const viewToCategory: Record<string, 'torse' | 'dos' | 'bras-gauche' | 'bras-droit'> = {
                        'Face': 'torse',
                        'Dos': 'dos',
                        'Gauche': 'bras-gauche',
                        'Droite': 'bras-droit',
                        'front': 'torse',
                        'back': 'dos',
                        'left': 'bras-gauche',
                        'right': 'bras-droit'
                      };
                      const zoneCategory = selectedZoneData.view ? viewToCategory[selectedZoneData.view] : selectedZoneData.zone_category || activeCategoryForZone;
                      
                      // Récupérer les dimensions du logo SVG pour calculer le scale
                      let logoWidth: number | undefined = undefined;
                      let logoHeight: number | undefined = undefined;
                      
                      try {
                        const response = await fetch(variantFile);
                        const svgText = await response.text();
                        const parser = new DOMParser();
                        const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
                        const svgElement = svgDoc.querySelector('svg');
                        if (svgElement) {
                          const svgWidth = parseFloat(svgElement.getAttribute('width') || '0');
                          const svgHeight = parseFloat(svgElement.getAttribute('height') || '0');
                          const viewBox = svgElement.getAttribute('viewBox');
                          
                          let actualWidth = svgWidth;
                          let actualHeight = svgHeight;
                          
                          if (viewBox) {
                            const [, , vbWidth, vbHeight] = viewBox.split(' ').map(parseFloat);
                            if (vbWidth && vbHeight) {
                              actualWidth = vbWidth;
                              actualHeight = vbHeight;
                            }
                          }
                          
                          if (actualWidth > 0 && actualHeight > 0) {
                            logoWidth = actualWidth;
                            logoHeight = actualHeight;
                          }
                        }
                      } catch (error) {
                        console.error('Erreur lors du calcul des dimensions du logo:', error);
                      }
                      
                      // Calculer le scale pour que le logo s'adapte à la zone
                      // Utiliser 80% de la zone pour laisser une marge
                      const SCALE_FACTOR = 0.5;
                      const availableWidth = zoneWidthPx * 0.8;
                      const availableHeight = zoneHeightPx * 0.8;
                      
                      let initialPixelWidth = availableWidth;
                      let initialPixelHeight = availableHeight;
                      
                      if (logoWidth && logoHeight) {
                        // Calculer le scale pour maintenir les proportions
                        const scaleX = availableWidth / logoWidth;
                        const scaleY = availableHeight / logoHeight;
                        const scale = Math.min(scaleX, scaleY);
                        
                        initialPixelWidth = logoWidth * scale;
                        initialPixelHeight = logoHeight * scale;
                      }
                      
                      addLogo(
                        showZoneSelector.logoId,
                        variantId,
                        variantFile,
                        zonePosition,
                        zoneCategory,
                        initialPixelWidth,
                        initialPixelHeight,
                        zoneRotation
                      );
                      
                      // Positionner la caméra sur la vue de la zone
                      if (zoneCategory) {
                        setTargetView(zoneCategory);
                      }
                      
                      setShowZoneSelector(null);
                      setSelectedZone('');
                    }
                  }}
                  disabled={!selectedZone}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: selectedZone ? '#000000' : '#e0e0e0',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'var(--stepn-font-body)',
                    color: selectedZone ? '#ffffff' : '#999999',
                    cursor: selectedZone ? 'pointer' : 'not-allowed',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedZone) {
                      e.currentTarget.style.backgroundColor = '#333333';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedZone) {
                      e.currentTarget.style.backgroundColor = '#000000';
                    }
                  }}
                >
                  Confirmer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  })() : null;
  
  // États pour la sidebar
  const [activeTab, setActiveTab] = useState<'design' | 'color' | 'numero' | 'nom' | 'logo'>('design');
  const [showColorWarningModal, setShowColorWarningModal] = useState(false);
  const [isPlacingText, setIsPlacingText] = useState<'nom' | 'numero' | null>(null);
  
  // États pour le viewer 3D
  const [isMobile, setIsMobile] = useState(false);
  const controlsRef = useRef<any>(null);
  const lastCameraChangeRef = useRef<number>(0);
  const [testUVMap, setTestUVMap] = useState<string | null>(null);
  const [clickCoordinates, setClickCoordinates] = useState<{uv: [number, number], svg: [number, number]} | null>(null);
  
  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Initialiser le test UV map
  useEffect(() => {
    setTestUVMap(createTestUVMap());
  }, []);
  
  // Fonctions pour le viewer 3D
  const zoomOutMax = useCallback((zone?: string) => {
    const controls = controlsRef.current;
    if (!controls || !controls.object || !controls.target) return;
    const camera = controls.object;
    const target = controls.target;
    
    let direction: 'front' | 'back' | 'left' | 'right' = 'front';
    if (zone === 'dos' || zone === 'Dos') direction = 'back';
    else if (zone === 'bras-gauche' || zone === 'Bras gauche') direction = 'right';
    else if (zone === 'bras-droit' || zone === 'Bras droit') direction = 'left';
    else if (zone === 'torse' || zone === 'Torse' || zone === 'Buttpatch') direction = 'front';
    
    if (isMobile) {
      switch (direction) {
        case 'back': camera.position.set(0, 1, -18); target.set(0, 1, 0); break;
        case 'left': camera.position.set(-18, 1, 0); target.set(0, 1, 0); break;
        case 'right': camera.position.set(18, 1, 0); target.set(0, 1, 0); break;
        default: camera.position.set(0, 1, 18); target.set(0, 1, 0);
      }
    } else {
      switch (direction) {
        case 'back': camera.position.set(0, 1, -10); target.set(0, 1, 0); break;
        case 'left': camera.position.set(-10, 1, 0); target.set(0, 1, 0); break;
        case 'right': camera.position.set(10, 1, 0); target.set(0, 1, 0); break;
        default: camera.position.set(0, 1, 10); target.set(0, 1, 0);
      }
    }
    controls.update();
    requestAnimationFrame(() => controls.update());
    lastCameraChangeRef.current = Date.now();
  }, [isMobile]);
  
  const setCameraView = useCallback((view: 'front' | 'back' | 'left' | 'right') => {
    const controls = controlsRef.current;
    if (!controls || !controls.object || !controls.target) return;
    const camera = controls.object;
    const target = controls.target;
    if (view === 'front') {
      camera.position.set(0, 1, isMobile ? 18 : 10);
      target.set(0, isMobile ? -1.5 : 0, 0);
    } else if (view === 'back') {
      camera.position.set(0, 1, isMobile ? -18 : -10);
      target.set(0, isMobile ? -1.5 : 0, 0);
    } else if (view === 'left') {
      camera.position.set(-10, 1, 0);
      target.set(0, 0, 0);
    } else if (view === 'right') {
      camera.position.set(10, 1, 0);
      target.set(0, 0, 0);
    }
    controls.update();
    requestAnimationFrame(() => controls.update());
    lastCameraChangeRef.current = Date.now();
  }, [isMobile]);
  
  // Écouter les événements de changement de vue de caméra
  useEffect(() => {
    const handleSetCameraView = (event: CustomEvent) => {
      lastCameraChangeRef.current = Date.now();
      setCameraView(event.detail);
    };
    window.addEventListener('setCameraView', handleSetCameraView as EventListener);
    return () => window.removeEventListener('setCameraView', handleSetCameraView as EventListener);
  }, [setCameraView]);
  
  // Paramètres de caméra
  const cameraPosition: [number, number, number] = isMobile ? [0, 1, 18] : [0, 1, 10];
  const cameraTarget: [number, number, number] = isMobile ? [0, -1, 0] : [0, 0, 0];
  const minDistance = isMobile ? 7 : 2.5;
  const maxDistance = isMobile ? 18 : 10;
  
  // Fonctions pour les textes
  const onTextPlaced = useCallback((category: 'nom' | 'numero', position: [number, number, number], zoneCategory?: string, rotation?: number) => {
    console.log('Text placed:', { category, position, zoneCategory, rotation });
  }, []);
  
  const onTextAdded = useCallback(() => {
    // Logique pour ajouter un texte
  }, []);
  
  const onRequestLogoDelete = useCallback((id: string) => {
    const logo = placedLogos.find(l => l.id === id);
    setItemToDelete({
      id,
      name: logo?.name || 'ce logo',
      type: 'logo'
    });
    setShowDeleteModal(true);
  }, [placedLogos]);
  
  const onRequestTextDelete = useCallback((id: string) => {
    if (!id) return;
    const text = texts.find(t => t.id === id);
    setItemToDelete({
      id,
      name: text?.content || 'ce texte',
      type: 'text'
    });
    setShowDeleteModal(true);
  }, [texts]);
  
  const confirmDeleteText = useCallback((id: string) => {
    const text = texts.find(t => t.id === id);
    setItemToDelete({
      id,
      name: text?.content || 'ce texte',
      type: 'text'
    });
    setShowDeleteModal(true);
  }, [texts]);
  
  const confirmDeleteLogo = useCallback((id: string) => {
    const logo = placedLogos.find(l => l.id === id);
    setItemToDelete({
      id,
      name: logo?.name || 'ce logo',
      type: 'logo'
    });
    setShowDeleteModal(true);
  }, [placedLogos]);
  
  const handleConfirmDelete = useCallback(() => {
    if (!itemToDelete) return;
    
    if (itemToDelete.type === 'text') {
      removeText(itemToDelete.id);
      if (selectedTextId === itemToDelete.id) {
        selectText(null);
      }
    } else {
      removeLogo(itemToDelete.id);
      if (selectedLogoId === itemToDelete.id) {
        selectLogo(null);
      }
    }
    
    setShowDeleteModal(false);
    setItemToDelete(null);
  }, [itemToDelete, removeText, removeLogo, selectedTextId, selectedLogoId, selectText, selectLogo]);
  
  const handleCancelDelete = useCallback(() => {
    setShowDeleteModal(false);
    setItemToDelete(null);
  }, []);
  
  // Constantes pour les textes
  const fontSizeSliderMin = 60;
  const fontSizeSliderMax = 750;
  
  // Filtrer les fonts pour les noms et numéros
  const fontsForNames = useFilteredFonts('names', finalShopDomain);
  const fontsForNumbers = useFilteredFonts('numbers', finalShopDomain);
  
  // Config design IDs depuis la configuration du produit
  const configDesignIds = productConfig?.designModuleConfig?.allowedDesignIds || null;
  
  // États pour les linked products (à implémenter)
  const isLinkedPrefillActive = false;
  const hasPendingLinkedPrefill = false;
  
  // Fonction pour changer de catégorie (à implémenter)
  const onCategoryChange = useCallback((category: string) => {
    console.log('Category changed:', category);
  }, []);
  
  // Fonction pour ouvrir le panneau de typographie (à implémenter)
  const onTypographyPanelOpened = useCallback(() => {
    console.log('Typography panel opened');
  }, []);
  
  // États pour l'auto-open typography (à implémenter)
  const autoOpenTypography = undefined;
  const shouldOpenTypographyPanel = null;
  
  // Fonction pour la suppression (à implémenter)
  const onRequestDelete = useCallback((id: string) => {
    // TODO: Implémenter la suppression
  }, []);
  
  // Design texture : depuis le snapshot si disponible, sinon depuis selectedDesign ou configuration
  const designTexture = useMemo(() => {
    // Priorité 1: snapshot.design2D.url (direct depuis le snapshot)
    if (snapshot?.design2D?.url) {
      return snapshot.design2D.url;
    }
    // Priorité 2: selectedDesign.svgUrl (design sélectionné)
    if (selectedDesign?.svgUrl) {
      return selectedDesign.svgUrl;
    }
    // Priorité 3: productConfig.design2DId (depuis la configuration)
    if (productConfig?.design2DId && designs2D.length > 0) {
      const design = designs2D.find((d: any) => d.id === productConfig.design2DId);
      if (design) {
        return design.svg_url || design.svgUrl || null;
      }
    }
    return null;
  }, [snapshot?.design2D?.url, selectedDesign?.svgUrl, productConfig?.design2DId, designs2D]);
  
  // Log pour déboguer designTexture
  useEffect(() => {
    if (snapshot) {
      console.log('🎨 designTexture calculé:', {
        hasSnapshot: !!snapshot,
        hasDesign2D: !!snapshot.design2D,
        design2DUrl: snapshot.design2D?.url,
        selectedDesignSvgUrl: selectedDesign?.svgUrl,
        finalDesignTexture: designTexture
      });
    }
  }, [snapshot, designTexture, selectedDesign]);
  
  
  // Config model URL (URL du modèle depuis la configuration)
  const configModelUrl = modelUrl || null;
  
  // Initialiser le design 2D depuis la configuration (utiliser designs2D déjà chargé)
  useEffect(() => {
    if (productConfig?.design2DId && !selectedDesign.id && designs2D.length > 0) {
      const design = designs2D.find((d: any) => d.id === productConfig.design2DId);
      if (design) {
        selectDesign({ 
          id: design.id, 
          svgUrl: design.svg_url || design.svgUrl,
          model_type: design.model_type
        });
      }
    }
  }, [productConfig?.design2DId, designs2D.length]); // Retirer selectedDesign.id et selectDesign des dépendances pour éviter la boucle
  
  // Initialiser les paramètres de caméra depuis le snapshot ou la configuration
  useEffect(() => {
    const cameraSettings = snapshot?.cameraSettings || productConfig?.settings;
    if (cameraSettings && controlsRef.current) {
      const settings = cameraSettings;
      const controls = controlsRef.current;
      const camera = controls.object;
      
      // Appliquer initialZoom si disponible
      if (settings.initialZoom !== undefined && camera) {
        const distance = settings.initialZoom;
        camera.position.set(0, 0, distance);
        camera.updateProjectionMatrix();
      }
      
      // Appliquer initialRotation si disponible
      if (settings.initialRotation !== undefined && camera) {
        const rotation = settings.initialRotation;
        if (typeof rotation === 'number') {
          const angleRad = (rotation * Math.PI) / 180;
          const distance = camera.position.length();
          const newX = 0 * Math.cos(angleRad) - distance * Math.sin(angleRad);
          const newZ = 0 * Math.sin(angleRad) + distance * Math.cos(angleRad);
          camera.position.set(newX, camera.position.y, newZ);
          camera.updateProjectionMatrix();
        }
      }
      
      controls.update();
    }
  }, [productConfig?.settings]);
  
  
  // Mapper les onglets de la sidebar vers les modules
  useEffect(() => {
    if (customizationModules.length > 0 && !activeCustomizerTab) {
      setActiveCustomizerTab(customizationModules[0].id);
    }
  }, [customizationModules, activeCustomizerTab]);
  
  // Mapper activeTab vers activeCustomizerTab
  useEffect(() => {
    const tabToModuleMap: Record<string, string> = {
      'design': 'design',
      'color': 'color',
      'numero': 'text',
      'nom': 'text',
      'logo': 'logo',
    };
    
    const contentTypeMap: Record<string, string> = {
      'designs-2d': 'design',
      'colors': 'color',
      'text': 'text',
      'logos': 'logo',
    };
    
    // Trouver le module correspondant à l'onglet actif
    const module = customizationModules.find((m: any) => {
      if (activeTab === 'design' && m.contentType === 'designs-2d') return true;
      if (activeTab === 'color' && m.contentType === 'colors') return true;
      if ((activeTab === 'numero' || activeTab === 'nom') && m.contentType === 'text') return true;
      if (activeTab === 'logo' && m.contentType === 'logos') return true;
      return false;
    });
    
    if (module) {
      setActiveCustomizerTab(module.id);
    }
  }, [activeTab, customizationModules]);
  
  
  // Retourner le layout combiné : Sidebar gauche + Viewer3D + Sidebar droite
  // La sidebar doit toujours être visible si des modules existent (pas de dépendance à modelId)
  const shouldShowLeftSidebar = customizationModules.length > 0;
  
  // Si le snapshot n'est pas disponible, afficher un message d'erreur
  if (isLoadingConfig) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de la configuration...</p>
        </div>
      </div>
    );
  }
  
  // En mode preview, permettre l'affichage même sans snapshot publié
  // Le snapshot sera généré automatiquement par l'API si nécessaire
  if (!snapshot || !productConfig) {
    // Si pas en mode preview, afficher le message d'erreur
    if (!isPreviewMode) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Configuration non disponible</h2>
            <p className="text-gray-600 mb-4">
              Ce produit n'a pas encore été configuré ou publié depuis le builder.
            </p>
            <p className="text-sm text-gray-500">
              Veuillez configurer et publier ce produit depuis l'interface d'administration.
            </p>
          </div>
        </div>
      );
    }
    
    // En mode preview, afficher un message d'erreur spécifique
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-yellow-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Snapshot non disponible</h2>
          <p className="text-gray-600 mb-4">
            Le snapshot de prévisualisation n'a pas pu être généré automatiquement.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Assurez-vous que :
          </p>
          <ul className="text-sm text-gray-500 text-left list-disc list-inside mb-4">
            <li>Un modèle 3D est sélectionné dans le builder</li>
            <li>Le produit a au moins un module de personnalisation configuré</li>
          </ul>
          <p className="text-xs text-gray-400">
            Vérifiez les logs de la console pour plus de détails.
          </p>
        </div>
      </div>
    );
  }
  
  // Utiliser forceMobileLayout ou isMobile pour déterminer le layout
  // forceMobileLayout a la priorité absolue : si true, on force le layout mobile même si la fenêtre est large
  // isMobileMode devient la variable de contrôle UNIQUE pour tout le layout (JS > CSS)
  const isMobileMode = forceMobileLayout === true ? true : (forceMobileLayout === false ? false : isMobile);
  
  return (
    <div 
      // Layout global contrôlé uniquement par isMobileMode (aucune classe responsive type md:hidden)
      className={isMobileMode ? 'flex flex-col h-full w-full relative overflow-hidden' : 'flex flex-row h-full w-full'}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        flexDirection: isMobileMode ? 'column' : 'row'
      }}
    >
      {/* Sidebar gauche avec icônes des modules - Cachée en mobile, remplacée par barre horizontale en bas */}
      {!isMobileMode && shouldShowLeftSidebar ? (
        <div className="w-20 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-2 z-10" data-testid="left-sidebar">
          {customizationModules.map((module: any) => {
            const hasIconUrl = !!module.iconUrl;
            const iconToShow = module.icon || '🎨';
            
            return (
              <button
                key={module.id}
                onClick={() => {
                  setActiveCustomizerTab(module.id);
                  // Mapper le module vers l'onglet de la sidebar
                  if (module.contentType === 'designs-2d') setActiveTab('design');
                  else if (module.contentType === 'colors') setActiveTab('color');
                  else if (module.contentType === 'text') {
                    // Pour les textes, on garde l'onglet actuel (numero ou nom)
                    if (activeTab !== 'numero' && activeTab !== 'nom') setActiveTab('numero');
                  }
                  else if (module.contentType === 'logos') setActiveTab('logo');
                }}
                className={`w-12 h-12 flex items-center justify-center rounded border transition-all relative ${
                  activeCustomizerTab === module.id
                    ? 'bg-gray-100 border-gray-300'
                    : 'bg-transparent border-gray-200 hover:bg-gray-50'
                }`}
                title={module.tabName}
                style={{ minWidth: '48px', minHeight: '48px' }}
              >
                {hasIconUrl ? (
                  <img
                    key={`icon-img-${module.id}`}
                    src={module.iconUrl}
                    alt={module.tabName}
                    className="w-8 h-8 object-contain"
                    style={{ 
                      display: 'block',
                      width: '32px',
                      height: '32px',
                      maxWidth: '32px',
                      maxHeight: '32px',
                      flexShrink: 0,
                      pointerEvents: 'none'
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      // Créer un fallback avec l'emoji
                      const fallback = document.createElement('span');
                      fallback.className = 'text-2xl';
                      fallback.style.display = 'block';
                      fallback.style.width = '32px';
                      fallback.style.height = '32px';
                      fallback.style.textAlign = 'center';
                      fallback.style.lineHeight = '32px';
                      fallback.textContent = iconToShow;
                      target.parentElement?.appendChild(fallback);
                    }}
                  />
                ) : (
                  <span 
                    className="text-2xl" 
                    style={{ 
                      display: 'block', 
                      lineHeight: '32px',
                      fontSize: '24px',
                      width: '32px',
                      height: '32px',
                      textAlign: 'center',
                      flexShrink: 0
                    }}
                  >
                    {iconToShow}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : null}
      
      {/* Panneau de contenu qui s'ouvre depuis la sidebar gauche */}
      {(shouldShowLeftSidebar || isMobileMode) && (() => {
        // Toujours afficher le panneau si la sidebar est visible, même si activeCustomizerTab n'est pas encore défini
        // Utiliser le premier module par défaut si activeCustomizerTab est null
        const hasModules = customizationModules.length > 0;

        // En mode mobile dans le simulateur, si aucun module n'est encore configuré,
        // on affiche quand même une barre mobile vide pour matérialiser le layout.
        if (isMobileMode && !hasModules) {
          return (
            <div
              className="w-full border-t border-gray-200 flex-shrink-0 bg-white flex flex-col overflow-hidden relative"
              style={{
                position: 'relative',
                width: '100%',
                borderTop: '1px solid #e5e7eb',
                borderRight: 'none',
                order: 2,
                flexShrink: 0,
                height: '40%',
                minHeight: 0,
                zIndex: 50,
                display: 'flex',
              }}
            >
              <div
                className="w-full bg-white border-b border-gray-200 flex flex-row items-center justify-around px-2 py-3 gap-1 flex-shrink-0"
                style={{
                  position: 'relative',
                  display: 'flex',
                  width: '100%',
                  zIndex: 50,
                }}
              >
                {/* Icônes factices pour représenter la future barre mobile */}
                <button className="w-10 h-10 flex items-center justify-center rounded border bg-gray-50 border-gray-200 text-gray-400 text-xs">
                  🎨
                </button>
                <button className="w-10 h-10 flex items-center justify-center rounded border bg-gray-50 border-gray-200 text-gray-400 text-xs">
                  🔤
                </button>
              </div>
              <div className="flex-1 bg-gray-50" />
            </div>
          );
        }

        const tabToUse = activeCustomizerTab || (hasModules ? customizationModules[0].id : null);
        if (!tabToUse) return null;

        const activeModule = customizationModules.find((m: any) => m.id === tabToUse);
        if (!activeModule) return null;
        
        // Déterminer l'onglet actif basé sur le contentType du module
        let tabToShow: 'design' | 'color' | 'numero' | 'nom' | 'logo' = 'design';
        if (activeModule.contentType === 'designs-2d') tabToShow = 'design';
        else if (activeModule.contentType === 'colors') tabToShow = 'color';
        else if (activeModule.contentType === 'text') {
          // Pour les textes, on garde l'onglet actuel (numero ou nom)
          if (activeTab !== 'numero' && activeTab !== 'nom') tabToShow = 'numero';
          else tabToShow = activeTab;
        }
        else if (activeModule.contentType === 'logos') tabToShow = 'logo';
        
        return (
          <div 
            className={`${isMobileMode ? 'w-full border-t border-gray-200' : 'w-[420px] min-w-[420px] border-r border-gray-200'} flex-shrink-0 bg-white flex flex-col overflow-hidden relative`}
            style={isMobileMode ? { 
              position: 'relative',
              width: '100%', 
              borderTop: '1px solid #e5e7eb', 
              borderRight: 'none', 
              order: 2,
              flexShrink: 0,
              // Occupe ~40% de la hauteur du téléphone en mobile
              height: '40%',
              minHeight: 0,
              zIndex: 50,
              display: 'flex'
            } : {
              position: 'relative',
              zIndex: 20
            }}
            >
            {/* Barre horizontale d'icônes en bas sur mobile */}
            {isMobileMode && (
              <div 
                className="w-full bg-white border-b border-gray-200 flex flex-row items-center justify-around px-2 py-3 gap-1 flex-shrink-0"
                style={{
                  position: 'relative',
                  display: 'flex',
                  width: '100%',
                  zIndex: 50
                }}
              >
                {customizationModules.map((module: any) => {
                  const hasIconUrl = !!module.iconUrl;
                  const iconToShow = module.icon || '🎨';
                  const isActive = activeCustomizerTab === module.id;
                  
                  return (
                    <button
                      key={module.id}
                      onClick={() => {
                        setActiveCustomizerTab(module.id);
                        if (module.contentType === 'designs-2d') setActiveTab('design');
                        else if (module.contentType === 'colors') setActiveTab('color');
                        else if (module.contentType === 'text') {
                          if (activeTab !== 'numero' && activeTab !== 'nom') setActiveTab('numero');
                        }
                        else if (module.contentType === 'logos') setActiveTab('logo');
                      }}
                      className="flex flex-col items-center justify-center gap-1 transition-all relative"
                      style={{ 
                        flex: 1,
                        minWidth: 0,
                        padding: '8px 4px',
                        backgroundColor: isActive ? '#000000' : 'transparent',
                        borderRadius: '8px'
                      }}
                    >
                      {hasIconUrl ? (
                        <img
                          src={module.iconUrl}
                          alt={module.tabName}
                          className="w-6 h-6 object-contain"
                          style={{ 
                            filter: isActive ? 'brightness(0) invert(1)' : 'none'
                          }}
                        />
                      ) : (
                        <span 
                          className="text-xl"
                          style={{ 
                            color: isActive ? '#ffffff' : '#111827',
                            fontSize: '20px',
                            fontWeight: '500'
                          }}
                        >
                          {iconToShow}
                        </span>
                      )}
                      <span 
                        style={{ 
                          fontSize: '11px',
                          color: isActive ? '#ffffff' : '#111827',
                          fontWeight: isActive ? '600' : '400',
                          textAlign: 'center'
                        }}
                      >
                        {module.tabName}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            
            {/* En-tête du panneau avec swipe down pour fermer en mobile */}
            <div 
              className="flex-shrink-0 p-4 border-b border-gray-200 bg-white"
              style={isMobileMode ? { touchAction: 'pan-y' } : {}}
              onTouchStart={isMobileMode ? (e) => {
                const touch = e.touches[0];
                (e.currentTarget as any).swipeStartY = touch.clientY;
                (e.currentTarget as any).swipeStartTime = Date.now();
              } : undefined}
              onTouchMove={isMobileMode ? (e) => {
                const touch = e.touches[0];
                const startY = (e.currentTarget as any).swipeStartY;
                if (startY !== undefined) {
                  const deltaY = touch.clientY - startY;
                  const panel = (e.currentTarget as HTMLElement).closest('[style*="height: 40%"]');
                  if (panel && deltaY > 0) {
                    (panel as HTMLElement).style.transform = `translateY(${deltaY}px)`;
                    (panel as HTMLElement).style.transition = 'none';
                  }
                }
              } : undefined}
              onTouchEnd={isMobileMode ? (e) => {
                const startY = (e.currentTarget as any).swipeStartY;
                const startTime = (e.currentTarget as any).swipeStartTime;
                if (startY !== undefined) {
                  const touch = e.changedTouches[0];
                  const deltaY = touch.clientY - startY;
                  const deltaTime = Date.now() - (startTime || 0);
                  const panel = (e.currentTarget as HTMLElement).closest('[style*="height: 40%"]');
                  
                  const velocity = deltaY / deltaTime;
                  if (deltaY > 100 || (deltaY > 50 && velocity > 0.5)) {
                    console.log('✅ Swipe down détecté - Fermeture du panneau');
                    setActiveCustomizerTab(null);
                  }
                  
                  if (panel) {
                    (panel as HTMLElement).style.transform = '';
                    (panel as HTMLElement).style.transition = '';
                  }
                  delete (e.currentTarget as any).swipeStartY;
                  delete (e.currentTarget as any).swipeStartTime;
                }
              } : undefined}
            >
              {isMobileMode && (
                <div
                  className="absolute top-1 left-1/2 -translate-x-1/2 w-20 h-10 flex items-center justify-center cursor-grab active:cursor-grabbing"
                  style={{ touchAction: 'pan-y' }}
                >
                  <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
                </div>
              )}
              <div className="flex items-center gap-3">
                {activeModule.iconUrl ? (
                  <img src={activeModule.iconUrl} alt={activeModule.tabName} className="w-7 h-7" />
                ) : (
                  <span className="text-2xl">{activeModule.icon}</span>
                )}
                <h2 className="text-lg font-semibold text-gray-900">{activeModule.tabName}</h2>
              </div>
            </div>
            
            {/* Contenu du panneau - Copie exacte du builder */}
            <div className="flex-1 overflow-y-auto" style={{ padding: '16px' }}>
              {!activeModule.contentType ? (
                <div>
                  <p style={{ color: '#666', fontSize: '14px', fontFamily: 'var(--stepn-font-body)' }}>
                    Configurez le module dans les settings pour afficher du contenu.
                  </p>
                </div>
              ) : (activeModule.contentType === 'colors' || activeModule.type === 'colors') ? (() => {
                // NOUVEAU SYSTÈME : Utiliser les couleurs du snapshot si disponible
                if (snapshot) {
                  const colorModule = activeModule.type === 'colors' ? activeModule : snapshot.customizationModules.find((m: any) => m.type === 'colors');
                  const allowedColors = colorModule?.allowedColors || [];
                  
                  if (allowedColors.length === 0) {
                    return (
                      <div>
                        <p style={{ color: '#666', fontSize: '14px', fontFamily: 'var(--stepn-font-body)' }}>
                          Aucune couleur disponible dans le snapshot.
                        </p>
                      </div>
                    );
                  }
                  
                  // Détecter les classes de couleurs depuis le design2D du snapshot
                  const design2D = snapshot.design2D;
                  // Utiliser color_mappings si disponible, sinon colors, sinon valeurs par défaut
                  const availableColorClasses = design2D?.color_mappings 
                    ? Object.keys(design2D.color_mappings) 
                    : (design2D?.colors ? Object.keys(design2D.colors) : ['primary', 'secondary', 'tertiary']);
                  
                  // Si on a sélectionné une classe de couleur, afficher la grille
                  if (selectedColorClass) {
                    const allColors = allowedColors.map((color: any, index: number) => ({
                      id: color.hex,
                      name: color.label || color.name || '',
                      hex: color.hex
                    }));
                    
                    const currentColorHex = design2D?.colors?.[selectedColorClass] || colors[selectedColorClass] || null;
                    const currentColorName = allColors.find(c => c.hex === currentColorHex)?.name || '';
                    
                    return (
                      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        {/* Header avec bouton retour et couleur actuelle */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '16px',
                          borderBottom: '1px solid #e5e7eb',
                          margin: '-16px -16px 16px -16px'
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
                              WebkitTextFillColor: '#111827',
                              fontFamily: 'var(--stepn-font-body)',
                              transition: 'color 0.2s'
                            }}
                            className="color-class-card-label"
                          >
                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#111827' }}>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            <span style={{ color: '#111827', WebkitTextFillColor: '#111827' }}>Retour</span>
                          </button>
                          
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                          }}>
                            <span style={{
                              fontSize: '14px',
                              fontWeight: '500',
                              color: '#111827',
                              WebkitTextFillColor: '#111827',
                              fontFamily: 'var(--stepn-font-body)'
                            }} className="color-class-card-label">
                              {currentColorName || selectedColorClass.charAt(0).toUpperCase() + selectedColorClass.slice(1)}
                            </span>
                            <div 
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                border: '2px solid #d1d5db',
                                backgroundColor: currentColorHex || 'transparent'
                              }}
                            />
                          </div>
                        </div>
                        
                        {/* Grille de couleurs */}
                        <div style={{
                          flex: 1,
                          overflowY: 'auto'
                        }}>
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(6, 1fr)', 
                            gap: '12px' 
                          }}>
                            {allColors.map((color) => {
                              const isSelected = color.hex === currentColorHex;
                              return (
                                <button
                                  key={color.id}
                                  onClick={() => {
                                    updateColor(selectedColorClass, color.hex);
                                  }}
                                  style={{
                                    position: 'relative',
                                    aspectRatio: '1',
                                    borderRadius: '50%',
                                    border: '2px solid #e5e7eb',
                                    backgroundColor: color.hex,
                                    cursor: 'pointer',
                                    transition: 'border-color 0.2s',
                                    overflow: 'hidden',
                                    padding: 0
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#d1d5db';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#e5e7eb';
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
                  
                  // Afficher les classes de couleurs disponibles
                  return (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '12px'
                    }}>
                      {availableColorClasses.map((colorClass) => {
                        // Utiliser color_mappings si disponible, sinon colors
                        const colorId = design2D?.color_mappings?.[colorClass] || design2D?.colors?.[colorClass];
                        const currentColorHex = colorId 
                          ? (colorPalettes[0]?.colors?.find((c: any) => c.id === colorId || c.hex === colorId)?.hex || colors[colorClass] || '#000000')
                          : (colors[colorClass] || '#000000');
                        return (
                          <button
                            key={colorClass}
                            onClick={() => setSelectedColorClass(colorClass)}
                            style={{
                              padding: '16px',
                              backgroundColor: '#ffffff',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '8px',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = '#d1d5db';
                              e.currentTarget.style.backgroundColor = '#f9fafb';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = '#e5e7eb';
                              e.currentTarget.style.backgroundColor = '#ffffff';
                            }}
                          >
                            <div 
                              style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                border: '2px solid #d1d5db',
                                backgroundColor: currentColorHex
                              }}
                            />
                            <span style={{
                              fontSize: '14px',
                              fontWeight: '500',
                              color: '#111827',
                              fontFamily: 'var(--stepn-font-body)'
                            }}>
                              {colorClass.charAt(0).toUpperCase() + colorClass.slice(1)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                }
                
                // ANCIEN SYSTÈME : Détecter automatiquement les couleurs disponibles à modifier
                const ordinalColors = ['primary', 'secondary', 'tertiary', 'quaternary', 'quinary', 'senary', 'septenary', 'octonary', 'nonary', 'denary'];
                
                // Trouver le design 2D sélectionné pour détecter les couleurs
                let availableColorClasses: string[] = [];
                let designIdToUse: string | null = null;
                if (activeCustomizerTab) {
                  const designModule = customizationModules.find((m: any) => 
                    m.contentType === 'designs-2d' && m.selectedItems?.design2DId
                  );
                  if (designModule?.selectedItems?.design2DId) {
                    designIdToUse = designModule.selectedItems.design2DId;
                  }
                }
                if (!designIdToUse) {
                  designIdToUse = selectedDesign2DId || selectedDesign?.id || null;
                }
                
                const selectedDesignObj = designs2D.find((d: any) => d.id === designIdToUse);
                if (selectedDesignObj?.color_mappings) {
                  availableColorClasses = Object.keys(selectedDesignObj.color_mappings);
                } else {
                  availableColorClasses = ['primary', 'secondary', 'tertiary'];
                }
                
                availableColorClasses = availableColorClasses.filter(c => ordinalColors.includes(c.toLowerCase()));
                if (availableColorClasses.length === 0) {
                  availableColorClasses = ['primary', 'secondary', 'tertiary'];
                }
                
                // Si on a sélectionné une classe de couleur, afficher la grille de couleurs
                if (selectedColorClass && activeModule.selectedItems?.colorPaletteId) {
                  const palette = colorPalettes.find((p: any) => p.id === activeModule.selectedItems?.colorPaletteId);
                  if (!palette) return <p style={{ color: '#666', fontSize: '14px' }}>Palette non trouvée</p>;
                  
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
                  
                  const selectedColorId = selectedDesignObj?.color_mappings?.[selectedColorClass] || designColors[selectedColorClass];
                  
                  const currentColorHex = selectedColorId ? allColors.find(c => c.id === selectedColorId)?.hex : null;
                  const currentColorName = selectedColorId ? allColors.find(c => c.id === selectedColorId)?.name : '';
                  
                  return (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      {/* Header avec bouton retour et couleur actuelle */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px',
                        borderBottom: '1px solid #e5e7eb',
                        margin: '-16px -16px 16px -16px'
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
                            WebkitTextFillColor: '#111827',
                            fontFamily: 'var(--stepn-font-body)',
                            transition: 'color 0.2s'
                          }}
                          className="color-class-card-label"
                        >
                          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#111827' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                          <span style={{ color: '#111827', WebkitTextFillColor: '#111827' }}>Retour</span>
                        </button>
                        
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}>
                          <span style={{
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#111827',
                            WebkitTextFillColor: '#111827',
                            fontFamily: 'var(--stepn-font-body)'
                          }} className="color-class-card-label">
                            {currentColorName || activeModule.colorClassLabels?.[selectedColorClass] || selectedColorClass.charAt(0).toUpperCase() + selectedColorClass.slice(1)}
                          </span>
                          <div 
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              border: '2px solid #d1d5db',
                              backgroundColor: currentColorHex || 'transparent'
                            }}
                          />
                        </div>
                      </div>
                      
                      {/* Grille de couleurs */}
                      <div style={{
                        flex: 1,
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
                                  // Mettre à jour les couleurs dans le système - AUCUN appel API, juste le state
                                  updateColor(selectedColorClass, color.hex);
                                }}
                                style={{
                                  position: 'relative',
                                  aspectRatio: '1',
                                  borderRadius: '50%',
                                  border: '2px solid #e5e7eb',
                                  backgroundColor: color.hex,
                                  cursor: 'pointer',
                                  transition: 'border-color 0.2s',
                                  overflow: 'hidden',
                                  padding: 0
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor = '#d1d5db';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor = '#e5e7eb';
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
                      <p style={{ color: '#666', fontSize: '14px', fontFamily: 'var(--stepn-font-body)' }}>
                        Veuillez sélectionner une palette dans les paramètres du module.
                      </p>
                    ) : (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '12px'
                      }}>
                        {availableColorClasses.map((colorClass) => {
                          // Utiliser la couleur actuelle depuis colors (state) ou depuis le snapshot
                          const currentColorHex = colors[colorClass] || snapshot?.resolvedColors?.[colorClass] || '#cccccc';
                          
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
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#f9fafb';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#ffffff';
                              }}
                            >
                              <div
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  backgroundColor: currentColorHex && currentColorHex !== '#cccccc' && currentColorHex !== '#ffffff' && currentColorHex !== '#FFFFFF'
                                    ? currentColorHex
                                    : 'transparent',
                                  borderRadius: '50%',
                                  border: currentColorHex && currentColorHex !== '#cccccc' && currentColorHex !== '#ffffff' && currentColorHex !== '#FFFFFF'
                                    ? '2px solid #d1d5db'
                                    : '2px solid #9ca3af'
                                }}
                              />
                              <span style={{
                                fontSize: '14px',
                                fontWeight: '500',
                                color: '#111827',
                                fontFamily: 'var(--stepn-font-body)',
                                textAlign: 'center'
                              }} className="color-class-card-label">
                                {activeModule.colorClassLabels?.[colorClass] || colorClass.charAt(0).toUpperCase() + colorClass.slice(1)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })() : activeModule.contentType === 'logos' ? (() => {
                // Labels des vues personnalisables
                const viewLabels = {
                  'front': activeModule.logoViewFrontLabel || activeModule.config?.logoViewFrontLabel || 'FRONT',
                  'back': activeModule.logoViewBackLabel || activeModule.config?.logoViewBackLabel || 'BACK',
                  'left': activeModule.logoViewLeftLabel || activeModule.config?.logoViewLeftLabel || 'LEFT',
                  'right': activeModule.logoViewRightLabel || activeModule.config?.logoViewRightLabel || 'RIGHT'
                };
                
                // Label du bouton personnalisable
                const buttonLabel = activeModule.addLogoButtonLabel || 'Ajouter un logo';
                
                // Vérifier si le module logo a des bibliothèques dans le snapshot (pas dans le state async)
                const logoModule = snapshot?.customizationModules?.find((m: any) => 
                  (m.type === 'logos' || m.contentType === 'logos')
                );
                const hasLogoModule = logoModule?.config?.logoLibraries?.length > 0;
                
                console.log('🖼️ Module logos - hasLogoModule:', hasLogoModule, 'logoModule:', logoModule);
                
                // Si pas de bibliothèques dans le snapshot, masquer le module (PAS d'erreur)
                if (!hasLogoModule) {
                  console.log('🖼️ Module logos caché car pas de bibliothèques');
                  return null;
                }
                
                console.log('🖼️ Module logos RENDU, bouton devrait être visible');
                
                // Vérifier si des bibliothèques sont sélectionnées (pour le filtrage)
                const hasSelectedLibraries = activeModule.selectedItems?.logoLibraryIds && 
                  Array.isArray(activeModule.selectedItems.logoLibraryIds) && 
                  activeModule.selectedItems.logoLibraryIds.length > 0;
                
                // Utiliser les bibliothèques depuis le snapshot (pas depuis le state async)
                const librariesFromSnapshot = logoModule?.config?.logoLibraries || [];
                
                // Récupérer toutes les bibliothèques sélectionnées depuis le snapshot
                const selectedLibraryIds = activeModule.selectedItems?.logoLibraryIds || 
                  logoModule?.config?.logoLibraryIds || [];
                const selectedLibraries = librariesFromSnapshot.filter((l: any) => 
                  selectedLibraryIds.includes(l.id)
                );
                
                // Récupérer tous les logos de toutes les bibliothèques sélectionnées
                const allLogos: any[] = [];
                selectedLibraries.forEach((library: any) => {
                  if (library.logos && Array.isArray(library.logos)) {
                    allLogos.push(...library.logos);
                  }
                });
                
                // Si on affiche la bibliothèque de logos
                if (showLogoLibrary && activeCustomizerTab === activeModule.id) {
                  // Si un logo est sélectionné pour afficher ses variantes
                  if (selectedLogoForVariants) {
                    // Construire la liste des variantes : logo de base + variantes
                    const baseVariant = {
                      id: 'base',
                      file_url: selectedLogoForVariants.file_url || '',
                      name: selectedLogoForVariants.name || 'Logo de base'
                    };
                    const allVariants = [baseVariant, ...(selectedLogoForVariants.variants || [])];
                    
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        {/* Bouton retour */}
                        <div style={{ marginBottom: '12px' }}>
                          <button
                            onClick={() => setSelectedLogoForVariants(null)}
                            style={{
                              padding: '8px 16px',
                              fontSize: '14px',
                              backgroundColor: 'transparent',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              color: '#374151',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                          >
                            ← Retour
                          </button>
                        </div>
                        
                        {/* Titre avec nom du logo */}
                        <div style={{ marginBottom: '16px' }}>
                          <h3 style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#000000',
                            fontFamily: 'var(--stepn-font-body)',
                            margin: 0
                          }}>
                            {selectedLogoForVariants.name}
                          </h3>
                        </div>
                        
                        {/* Liste des variantes */}
                        {allVariants.length === 0 ? (
                          <p style={{ color: '#666', fontSize: '14px', fontFamily: 'var(--stepn-font-body)' }}>
                            Aucune variante disponible
                          </p>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', overflowY: 'auto' }}>
                            {allVariants.map((variant: any, index: number) => (
                              <div
                                key={variant.id || `base-${index}`}
                                onClick={async () => {
                                  // Si on est en mode remplacement, remplacer directement le logo
                                  if (logoToReplace) {
                                    const logoToReplaceData = placedLogos.find(l => l.id === logoToReplace);
                                    if (logoToReplaceData) {
                                      const fileToUse = variant.id === 'base' 
                                        ? selectedLogoForVariants.file_url 
                                        : (variant.file_url || selectedLogoForVariants.file_url);
                                      
                                      // Calculer les dimensions du nouveau logo
                                      let logoWidth: number | undefined = undefined;
                                      let logoHeight: number | undefined = undefined;
                                      
                                      try {
                                        const response = await fetch(fileToUse);
                                        const svgText = await response.text();
                                        const parser = new DOMParser();
                                        const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
                                        const svgElement = svgDoc.querySelector('svg');
                                        if (svgElement) {
                                          const svgWidth = parseFloat(svgElement.getAttribute('width') || '0');
                                          const svgHeight = parseFloat(svgElement.getAttribute('height') || '0');
                                          const viewBox = svgElement.getAttribute('viewBox');
                                          
                                          let actualWidth = svgWidth;
                                          let actualHeight = svgHeight;
                                          
                                          if (viewBox) {
                                            const [, , vbWidth, vbHeight] = viewBox.split(' ').map(parseFloat);
                                            if (vbWidth && vbHeight) {
                                              actualWidth = vbWidth;
                                              actualHeight = vbHeight;
                                            }
                                          }
                                          
                                          if (actualWidth > 0 && actualHeight > 0) {
                                            logoWidth = actualWidth;
                                            logoHeight = actualHeight;
                                          }
                                        }
                                      } catch (error) {
                                        console.error('Erreur lors du calcul des dimensions du logo:', error);
                                      }
                                      
                                      // Calculer le nouveau scale pour conserver la même taille visuelle
                                      let newScale = logoToReplaceData.scale;
                                      if (logoWidth && logoHeight && logoToReplaceData.width && logoToReplaceData.height) {
                                        const SCALE_FACTOR = 0.50;
                                        const currentVisualWidth = logoToReplaceData.width * logoToReplaceData.scale * SCALE_FACTOR;
                                        const currentVisualHeight = logoToReplaceData.height * logoToReplaceData.scale * SCALE_FACTOR;
                                        
                                        const scaleX = currentVisualWidth / (logoWidth * SCALE_FACTOR);
                                        const scaleY = currentVisualHeight / (logoHeight * SCALE_FACTOR);
                                        
                                        newScale = Math.min(scaleX, scaleY);
                                      }
                                      
                                      // Remplacer le logo mais garder la bibliothèque ouverte pour permettre d'autres remplacements
                                      updateLogo(logoToReplace, {
                                        logoId: selectedLogoForVariants.id,
                                        variantId: variant.id === 'base' ? undefined : variant.id,
                                        variantFile: fileToUse,
                                        width: logoWidth,
                                        height: logoHeight,
                                        scale: newScale
                                      });
                                      selectLogo(logoToReplace);
                                      setSelectedLogoForVariants(null);
                                      // Ne pas fermer la bibliothèque - elle reste ouverte pour permettre d'autres remplacements
                                      return;
                                    }
                                  }
                                  
                                  // Si mode zones, ouvrir le modal de sélection de zone
                                  const placementMode = activeModule.logoPlacementMode || activeModule.config?.logoPlacementMode || activeModule.config?.placementMode;
                                  console.log('🖼️ Vérification du mode de placement (variante) - activeModule.logoPlacementMode:', activeModule.logoPlacementMode);
                                  console.log('🖼️ activeModule.config?.logoPlacementMode:', activeModule.config?.logoPlacementMode);
                                  console.log('🖼️ activeModule.config?.placementMode:', activeModule.config?.placementMode);
                                  console.log('🖼️ placementMode final (variante):', placementMode);
                                  
                                  // Si le mode est 'zones' ou non défini, ouvrir le modal de zone
                                  // (par défaut, on utilise le mode zones pour permettre la sélection)
                                  if (placementMode === 'zones' || !placementMode || placementMode === 'zone') {
                                    const fileToUse = variant.id === 'base' 
                                      ? selectedLogoForVariants.file_url 
                                      : (variant.file_url || selectedLogoForVariants.file_url);
                                    
                                    console.log('🖼️ Ouverture du modal de zone pour logo avec variante:', selectedLogoForVariants.id, variant.id);
                                    const zoneSelectorData = {
                                      logoId: selectedLogoForVariants.id,
                                      variantId: variant.id === 'base' ? '' : variant.id,
                                      variantFile: fileToUse,
                                      view: activeLogoView
                                    };
                                    console.log('🖼️ zoneSelectorData (variante):', JSON.stringify(zoneSelectorData));
                                    setShowZoneSelector(zoneSelectorData);
                                    console.log('🖼️ setShowZoneSelector appelé avec (variante):', JSON.stringify(zoneSelectorData));
                                    setSelectedLogoForVariants(null);
                                    setShowLogoLibrary(false);
                                    console.log('🖼️ setShowLogoLibrary(false) appelé (variante)');
                                  } else {
                                    console.log('🖼️ Mode de placement n\'est pas "zones" (variante), mode actuel:', placementMode);
                                    // Mode libre : ajouter directement
                                    const fileToUse = variant.id === 'base' 
                                      ? selectedLogoForVariants.file_url 
                                      : (variant.file_url || selectedLogoForVariants.file_url);
                                    
                                    // Calculer les dimensions
                                    let logoWidth: number | undefined = undefined;
                                    let logoHeight: number | undefined = undefined;
                                    
                                    try {
                                      const response = await fetch(fileToUse);
                                      const svgText = await response.text();
                                      const parser = new DOMParser();
                                      const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
                                      const svgElement = svgDoc.querySelector('svg');
                                      if (svgElement) {
                                        const svgWidth = parseFloat(svgElement.getAttribute('width') || '0');
                                        const svgHeight = parseFloat(svgElement.getAttribute('height') || '0');
                                        const viewBox = svgElement.getAttribute('viewBox');
                                        
                                        let actualWidth = svgWidth;
                                        let actualHeight = svgHeight;
                                        
                                        if (viewBox) {
                                          const [, , vbWidth, vbHeight] = viewBox.split(' ').map(parseFloat);
                                          if (vbWidth && vbHeight) {
                                            actualWidth = vbWidth;
                                            actualHeight = vbHeight;
                                          }
                                        }
                                        
                                        if (actualWidth > 0 && actualHeight > 0) {
                                          logoWidth = actualWidth;
                                          logoHeight = actualHeight;
                                        }
                                      }
                                    } catch (error) {
                                      console.error('Erreur lors du calcul des dimensions du logo:', error);
                                    }
                                    
                                    const category = activeLogoView === 'front' ? 'torse' : activeLogoView === 'back' ? 'dos' : activeLogoView === 'left' ? 'bras-gauche' : 'bras-droit';
                                    addLogo(selectedLogoForVariants.id, variant.id === 'base' ? '' : variant.id, fileToUse, undefined, category, logoWidth, logoHeight);
                                    setSelectedLogoForVariants(null);
                                    setShowLogoLibrary(false);
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
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
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
                                  fontWeight: '500',
                                  WebkitTextFillColor: '#000000',
                                  WebkitTextStrokeColor: '#000000'
                                }}>
                                  {variant.id === 'base' ? 'Logo de base' : variant.name || 'Variante'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }
                  
                  // Vue principale de la bibliothèque
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      {/* Boutons de vue en haut - uniquement si mode zones */}
                      {activeModule.logoPlacementMode === 'zones' && (
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(4, 1fr)', 
                          gap: '4px', 
                          marginBottom: '12px',
                          paddingBottom: '12px',
                          borderBottom: '1px solid #e0e0e0'
                        }}>
                          {(['front', 'back', 'left', 'right'] as const).map((view) => (
                            <button
                              key={view}
                              onClick={() => {
                                setActiveLogoView(view);
                                const viewToCategory: Record<'front' | 'back' | 'left' | 'right', 'torse' | 'dos' | 'bras-gauche' | 'bras-droit'> = {
                                  'front': 'torse',
                                  'back': 'dos',
                                  'left': 'bras-gauche',
                                  'right': 'bras-droit'
                                };
                                setTargetView(viewToCategory[view]);
                                window.dispatchEvent(new CustomEvent('setCameraView', { detail: view }));
                              }}
                              style={{
                                padding: '8px 12px',
                                fontSize: '12px',
                                fontWeight: '500',
                                borderRadius: '4px',
                                border: 'none',
                                cursor: 'pointer',
                                backgroundColor: activeLogoView === view ? '#3b82f6' : '#f3f4f6',
                                color: activeLogoView === view ? '#ffffff' : '#374151',
                                transition: 'all 0.2s'
                              }}
                            >
                              {viewLabels[view]}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {/* Bouton retour */}
                      <div style={{ marginBottom: '12px' }}>
                        <button
                          onClick={() => {
                            setShowLogoLibrary(false);
                            setSelectedLogoForVariants(null);
                            setLogoToReplace(null);
                          }}
                          style={{
                            padding: '8px 16px',
                            fontSize: '14px',
                            backgroundColor: 'transparent',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            color: '#374151',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          ← Retour
                        </button>
                      </div>
                      
                      {/* Bibliothèque de logos */}
                      {allLogos.length === 0 ? (
                        <p style={{ color: '#666', fontSize: '14px', fontFamily: 'var(--stepn-font-body)' }}>
                          Aucun logo disponible dans les bibliothèques sélectionnées
                        </p>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', overflowY: 'auto' }}>
                          {allLogos.map((logo: any) => {
                            const hasVariants = logo.variants && logo.variants.length > 0;
                            
                            return (
                              <div
                                key={logo.id}
                                onClick={async () => {
                                  console.log('🖼️🖼️🖼️ CLIC SUR UN LOGO - logo.id:', logo.id, 'hasVariants:', hasVariants);
                                  // Si le logo a des variantes, toujours ouvrir la vue des variantes
                                  if (hasVariants) {
                                    console.log('🖼️ Logo a des variantes, ouverture de la vue des variantes');
                                    setSelectedLogoForVariants(logo);
                                    return;
                                  }
                                  console.log('🖼️ Logo n\'a pas de variantes, traitement direct');
                                  
                                  // Si on est en mode remplacement et que le logo n'a pas de variantes, remplacer directement
                                  if (logoToReplace) {
                                    const logoToReplaceData = placedLogos.find(l => l.id === logoToReplace);
                                    if (logoToReplaceData) {
                                      // Calculer les dimensions
                                      let logoWidth: number | undefined = undefined;
                                      let logoHeight: number | undefined = undefined;
                                      
                                      try {
                                        const response = await fetch(logo.file_url);
                                        const svgText = await response.text();
                                        const parser = new DOMParser();
                                        const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
                                        const svgElement = svgDoc.querySelector('svg');
                                        if (svgElement) {
                                          const svgWidth = parseFloat(svgElement.getAttribute('width') || '0');
                                          const svgHeight = parseFloat(svgElement.getAttribute('height') || '0');
                                          const viewBox = svgElement.getAttribute('viewBox');
                                          
                                          let actualWidth = svgWidth;
                                          let actualHeight = svgHeight;
                                          
                                          if (viewBox) {
                                            const [, , vbWidth, vbHeight] = viewBox.split(' ').map(parseFloat);
                                            if (vbWidth && vbHeight) {
                                              actualWidth = vbWidth;
                                              actualHeight = vbHeight;
                                            }
                                          }
                                          
                                          if (actualWidth > 0 && actualHeight > 0) {
                                            logoWidth = actualWidth;
                                            logoHeight = actualHeight;
                                          }
                                        }
                                      } catch (error) {
                                        console.error('Erreur lors du calcul des dimensions du logo:', error);
                                      }
                                      
                                      // Calculer le nouveau scale
                                      let newScale = logoToReplaceData.scale;
                                      if (logoWidth && logoHeight && logoToReplaceData.width && logoToReplaceData.height) {
                                        const SCALE_FACTOR = 0.50;
                                        const currentVisualWidth = logoToReplaceData.width * logoToReplaceData.scale * SCALE_FACTOR;
                                        const currentVisualHeight = logoToReplaceData.height * logoToReplaceData.scale * SCALE_FACTOR;
                                        
                                        const scaleX = currentVisualWidth / (logoWidth * SCALE_FACTOR);
                                        const scaleY = currentVisualHeight / (logoHeight * SCALE_FACTOR);
                                        
                                        newScale = Math.min(scaleX, scaleY);
                                      }
                                      
                                      // Remplacer le logo mais garder la bibliothèque ouverte pour permettre d'autres remplacements
                                      updateLogo(logoToReplace, {
                                        logoId: logo.id,
                                        variantId: undefined,
                                        variantFile: logo.file_url,
                                        width: logoWidth,
                                        height: logoHeight,
                                        scale: newScale
                                      });
                                      selectLogo(logoToReplace);
                                      // Ne pas fermer la bibliothèque - elle reste ouverte pour permettre d'autres remplacements
                                      return;
                                    }
                                  }
                                  
                                  // Sinon, ouvrir directement le modal de sélection de zone
                                  const placementMode = activeModule.logoPlacementMode || activeModule.config?.logoPlacementMode || activeModule.config?.placementMode;
                                  console.log('🖼️ Vérification du mode de placement - activeModule.logoPlacementMode:', activeModule.logoPlacementMode);
                                  console.log('🖼️ activeModule.config?.logoPlacementMode:', activeModule.config?.logoPlacementMode);
                                  console.log('🖼️ activeModule.config?.placementMode:', activeModule.config?.placementMode);
                                  console.log('🖼️ placementMode final:', placementMode);
                                  
                                  // Si le mode est 'zones' ou non défini, ouvrir le modal de zone
                                  // (par défaut, on utilise le mode zones pour permettre la sélection)
                                  if (placementMode === 'zones' || !placementMode || placementMode === 'zone') {
                                    console.log('🖼️ Ouverture du modal de zone pour logo:', logo.id);
                                    console.log('🖼️ activeLogoView:', activeLogoView);
                                    console.log('🖼️ logo.file_url:', logo.file_url);
                                    const zoneSelectorData = {
                                      logoId: logo.id,
                                      variantId: '',
                                      variantFile: logo.file_url,
                                      view: activeLogoView
                                    };
                                    console.log('🖼️ zoneSelectorData:', JSON.stringify(zoneSelectorData));
                                    setShowZoneSelector(zoneSelectorData);
                                    console.log('🖼️ setShowZoneSelector appelé avec:', JSON.stringify(zoneSelectorData));
                                    setShowLogoLibrary(false);
                                    console.log('🖼️ setShowLogoLibrary(false) appelé');
                                  } else {
                                    console.log('🖼️ Mode de placement n\'est pas "zones", mode actuel:', activeModule.logoPlacementMode || activeModule.config?.logoPlacementMode);
                                    // Mode libre : ajouter directement
                                    let logoWidth: number | undefined = undefined;
                                    let logoHeight: number | undefined = undefined;
                                    
                                    try {
                                      const response = await fetch(logo.file_url);
                                      const svgText = await response.text();
                                      const parser = new DOMParser();
                                      const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
                                      const svgElement = svgDoc.querySelector('svg');
                                      if (svgElement) {
                                        const svgWidth = parseFloat(svgElement.getAttribute('width') || '0');
                                        const svgHeight = parseFloat(svgElement.getAttribute('height') || '0');
                                        const viewBox = svgElement.getAttribute('viewBox');
                                        
                                        let actualWidth = svgWidth;
                                        let actualHeight = svgHeight;
                                        
                                        if (viewBox) {
                                          const [, , vbWidth, vbHeight] = viewBox.split(' ').map(parseFloat);
                                          if (vbWidth && vbHeight) {
                                            actualWidth = vbWidth;
                                            actualHeight = vbHeight;
                                          }
                                        }
                                        
                                        if (actualWidth > 0 && actualHeight > 0) {
                                          logoWidth = actualWidth;
                                          logoHeight = actualHeight;
                                        }
                                      }
                                    } catch (error) {
                                      console.error('Erreur lors du calcul des dimensions du logo:', error);
                                    }
                                    
                                    const category = activeLogoView === 'front' ? 'torse' : activeLogoView === 'back' ? 'dos' : activeLogoView === 'left' ? 'bras-gauche' : 'bras-droit';
                                    addLogo(logo.id, undefined, logo.file_url, undefined, category, logoWidth, logoHeight);
                                    setShowLogoLibrary(false);
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
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
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
                                    fontWeight: '500',
                                    WebkitTextFillColor: '#000000',
                                    WebkitTextStrokeColor: '#000000'
                                  }}>
                                    {logo.name}
                                  </span>
                                  {hasVariants && (
                                    <span style={{ 
                                      fontSize: '10px', 
                                      color: '#999999', 
                                      textAlign: 'center',
                                      WebkitTextFillColor: '#999999',
                                      WebkitTextStrokeColor: '#999999'
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
                
                // Vue par défaut : boutons de vue + bouton "Ajouter un logo" + logos placés
                const categoryToView: Record<'torse' | 'dos' | 'bras-gauche' | 'bras-droit', 'front' | 'back' | 'left' | 'right'> = {
                  'torse': 'front',
                  'dos': 'back',
                  'bras-gauche': 'left',
                  'bras-droit': 'right'
                };
                
                // viewLabels est déjà défini plus haut dans ce bloc (ligne 4435), ne pas le redéfinir
                
                // Vérifier le mode de placement
                const placementMode = activeModule.logoPlacementMode || activeModule.config?.logoPlacementMode || 'zones';
                console.log('🖼️ Placement mode pour boutons de vue:', placementMode);
                
                // Filtrer les logos selon la vue active
                const filteredPlacedLogos = placedLogos.filter(logo => {
                  if (placementMode === 'zones' || placementMode === 'zone') {
                    const logoView = categoryToView[logo.category];
                    return logoView === activeLogoView;
                  }
                  return true;
                });
                
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Boutons de vue en haut - uniquement si mode zones */}
                    {(placementMode === 'zones' || placementMode === 'zone') && (
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(4, 1fr)', 
                        gap: '4px'
                      }}>
                        {(['front', 'back', 'left', 'right'] as const).map((view) => (
                          <button
                            key={view}
                            onClick={() => {
                              setActiveLogoView(view);
                              const viewToCategory: Record<'front' | 'back' | 'left' | 'right', 'torse' | 'dos' | 'bras-gauche' | 'bras-droit'> = {
                                'front': 'torse',
                                'back': 'dos',
                                'left': 'bras-droit',
                                'right': 'bras-gauche'
                              };
                              setTargetView(viewToCategory[view]);
                              window.dispatchEvent(new CustomEvent('setCameraView', { detail: view }));
                            }}
                            style={{
                              padding: '8px 12px',
                              fontSize: '12px',
                              fontWeight: '500',
                              borderRadius: '4px',
                              border: 'none',
                              cursor: 'pointer',
                              backgroundColor: activeLogoView === view ? '#3b82f6' : '#f3f4f6',
                              color: activeLogoView === view ? '#ffffff' : '#374151',
                              transition: 'all 0.2s'
                            }}
                          >
                            {viewLabels[view]}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {/* Bouton "Ajouter un logo" */}
                    {console.log('🖼️ RENDU DU BOUTON "Ajouter un logo" - buttonLabel:', buttonLabel, 'setShowLogoLibrary:', typeof setShowLogoLibrary)}
                    <button
                      data-testid="add-logo-button-main"
                      onClick={(e) => {
                        console.log('🖼️🖼️🖼️ CLIC SUR LE BOUTON "Ajouter un logo" (PREMIÈRE IMPLÉMENTATION)');
                        e.preventDefault();
                        e.stopPropagation();
                        // Vérifier le mode de placement depuis le module ou son config
                        const placementMode = activeModule.logoPlacementMode || activeModule.config?.logoPlacementMode || 'zones';
                        console.log('🖼️ Placement mode:', placementMode);
                        // IMPORTANT: Dans les deux cas, ouvrir d'abord la bibliothèque de logos
                        // Le modal de zone s'ouvrira automatiquement après sélection d'un logo
                        console.log('🖼️ Ouverture de la bibliothèque de logos (mode:', placementMode, ')');
                        setLogoToReplace(null);
                        setSelectedLogoForZone(null);
                        console.log('🖼️ Appel de setShowLogoLibrary(true)...');
                        setShowLogoLibrary(true);
                        console.log('🖼️ setShowLogoLibrary(true) appelé');
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 24px',
                        fontSize: '14px',
                        fontWeight: '500',
                        backgroundColor: '#3b82f6',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#2563eb';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#3b82f6';
                      }}
                    >
                      <span>+</span>
                      {buttonLabel}
                    </button>
                    
                    {/* Logos placés */}
                    {filteredPlacedLogos.length > 0 && (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}>
                        <div style={{
                          fontSize: '12px',
                          color: '#a0a0a0',
                          fontFamily: 'var(--stepn-font-body)',
                          marginBottom: '4px'
                        }}>
                          Logos ajoutés ({filteredPlacedLogos.length})
                        </div>
                        {filteredPlacedLogos.map((logo) => {
                          // Trouver le nom du logo depuis les bibliothèques
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
                              onClick={() => selectLogo(logo.id)}
                              style={{
                                padding: '10px 12px',
                                backgroundColor: selectedLogoId === logo.id ? '#2a2a2a' : '#1a1a1a',
                                border: selectedLogoId === logo.id ? '1px solid #8eff36' : '1px solid #2a2a2a',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                if (selectedLogoId !== logo.id) {
                                  e.currentTarget.style.backgroundColor = '#222222';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (selectedLogoId !== logo.id) {
                                  e.currentTarget.style.backgroundColor = '#1a1a1a';
                                }
                              }}
                            >
                              <span style={{
                                fontSize: '13px',
                                color: '#ffffff',
                                fontFamily: 'var(--stepn-font-body)',
                                fontWeight: '500'
                              }}>
                                {logoName}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  confirmDeleteLogo(logo.id);
                                }}
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '12px',
                                  backgroundColor: 'transparent',
                                  border: '1px solid #666',
                                  borderRadius: '4px',
                                  color: '#ffffff',
                                  cursor: 'pointer'
                                }}
                              >
                                Supprimer
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })() : activeModule.contentType === 'designs-2d' || activeModule.type === 'designs-2d' ? (() => {
                // NOUVEAU SYSTÈME : Utiliser les designs du snapshot si disponible
                if (snapshot) {
                  const designModule = activeModule.type === 'designs-2d' ? activeModule : snapshot.customizationModules.find((m: any) => m.type === 'designs-2d');
                  const visibleDesigns = designModule?.allowedDesigns || [];
                  const selectedDesignId = snapshot.defaultState?.design2DId || designModule?.default;
                  
                  if (visibleDesigns.length === 0) {
                    return (
                      <div>
                        <p style={{ color: '#666', fontSize: '14px', fontFamily: 'var(--stepn-font-body)' }}>
                          Aucun design disponible dans le snapshot.
                        </p>
                      </div>
                    );
                  }
                  
                  return (
                    <div>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '12px'
                      }}>
                        {visibleDesigns.map((design: any) => {
                          const isSelected = design.svgUrl === selectedDesignId || design.label === selectedDesignId;
                          return (
                            <div
                              key={design.svgUrl || design.label}
                              onClick={() => {
                                selectDesign({ id: design.svgUrl, svgUrl: design.svgUrl });
                                setSelectedDesign2DId(design.svgUrl);
                              }}
                              style={{
                                padding: '12px',
                                backgroundColor: isSelected ? '#f0f0f0' : '#ffffff',
                                borderRadius: '4px',
                                border: isSelected ? '2px solid #333333' : '1px solid #e0e0e0',
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
                                padding: '0',
                                backgroundColor: '#f5f5f5',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                aspectRatio: '1',
                                overflow: 'hidden'
                              }}>
                                {design.thumbnailUrl ? (
                                  <img
                                    src={design.thumbnailUrl}
                                    alt={design.label}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'contain'
                                    }}
                                  />
                                ) : (
                                  <span style={{ color: '#999', fontSize: '12px' }}>No preview</span>
                                )}
                              </div>
                              <span style={{
                                fontSize: '12px',
                                color: '#333',
                                textAlign: 'center',
                                fontFamily: 'var(--stepn-font-body)'
                              }}>
                                {design.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                
                // ANCIEN SYSTÈME : Utiliser designs2D chargés depuis l'API
                const allowedIds = activeModule.selectedItems?.design2DIds || activeModule.config?.allowedDesignIds;
                const visibleDesigns = Array.isArray(allowedIds) && allowedIds.length > 0
                  ? designs2D.filter((d: any) => allowedIds.includes(d.id))
                  : designs2D;
                const selectedDesignId = activeModule.selectedItems?.design2DId || productConfig?.design2DId;
                
                // Si les designs ne sont pas encore chargés, afficher un message d'attente
                if (designs2D.length === 0) {
                  return (
                    <div>
                      <p style={{ color: '#666', fontSize: '14px', fontFamily: 'var(--stepn-font-body)' }}>
                        Chargement des designs...
                      </p>
                    </div>
                  );
                }
                
                return (
                  <div>
                    {visibleDesigns.length === 0 ? (
                      <p style={{ color: '#666', fontSize: '14px', fontFamily: 'var(--stepn-font-body)' }}>
                        Aucun design disponible. Cochez des designs dans les settings du module.
                      </p>
                    ) : (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '12px'
                      }}>
                        {visibleDesigns.map((design: any) => {
                          const isSelected = design.id === selectedDesignId;
                          return (
                            <div
                              key={design.id}
                              onClick={() => {
                                // Mettre à jour le module avec le design sélectionné
                                const updated = {
                                  ...activeModule,
                                  selectedItems: {
                                    ...activeModule.selectedItems,
                                    design2DId: design.id
                                  }
                                };
                                
                                // Mettre à jour la configuration du produit (à implémenter)
                                selectDesign({ id: design.id, svgUrl: design.svg_url || design.svgUrl });
                                setSelectedDesign2DId(design.id);
                              }}
                              style={{
                                padding: '12px',
                                backgroundColor: isSelected ? '#f0f0f0' : '#ffffff',
                                borderRadius: '4px',
                                border: isSelected ? '2px solid #333333' : '1px solid #e0e0e0',
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
                                padding: '0',
                                backgroundColor: '#f5f5f5',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minHeight: '120px',
                                maxHeight: '120px',
                                overflow: 'hidden'
                              }}>
                                {(design.preview_url && design.preview_url.trim() !== '') ? (
                                  <img
                                    key={design.preview_url}
                                    src={design.preview_url}
                                    alt={design.name}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover'
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
                              <p 
                                className="customizer-tab-name"
                                style={{
                                  color: '#000000',
                                  fontSize: '12px',
                                  fontFamily: 'var(--stepn-font-body)',
                                  fontWeight: '500',
                                  textAlign: 'center',
                                  margin: 0
                                }}
                              >
                                {design.name}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })() : activeModule.contentType === 'text' ? (
                // Le module texte doit s'afficher si snapshot.textZones et snapshot.fonts existent
                (snapshot?.textZones && snapshot.textZones.length > 0 && snapshot?.fonts && snapshot.fonts.length > 0) ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Si un texte est sélectionné, afficher uniquement l'interface de typographie */}
                    {selectedTextId ? (() => {
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
                          backgroundColor: '#ffffff',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: '1px solid #e5e5e5'
                        }}>
                          {/* Header */}
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
                                fontFamily: 'var(--stepn-font-body)'
                              }}
                            >
                              <span style={{ color: '#111827' }}>←</span>
                              <span style={{ color: '#111827' }}>Retour</span>
                            </button>
                            <div style={{
                              fontSize: '14px',
                              fontWeight: '600',
                              color: '#111827',
                              fontFamily: 'var(--stepn-font-body)'
                            }}>
                              Typographie
                            </div>
                            <div style={{ width: '80px' }} /> {/* Spacer pour centrer */}
                          </div>

                          {/* Onglets */}
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
                                  fontFamily: 'var(--stepn-font-body)',
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap',
                                  transition: 'all 0.2s',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                                onMouseEnter={(e) => {
                                  if (activeTextTab !== tab.id) {
                                    e.currentTarget.style.color = '#111827';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (activeTextTab !== tab.id) {
                                    e.currentTarget.style.color = '#6b7280';
                                  }
                                }}
                              >
                                {tab.label}
                              </button>
                            ))}
                          </div>

                          {/* Contenu de l'onglet sélectionné */}
                          <div style={{ padding: '20px' }}>
                            {/* Onglet Contenu */}
                            {activeTextTab === 'contenu' && (
                              <div>
                                <div style={{
                                  fontSize: '13px',
                                  fontWeight: '500',
                                  color: '#111827',
                                  marginBottom: '12px',
                                  fontFamily: 'var(--stepn-font-body)'
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
                                    fontFamily: 'var(--stepn-font-body)',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                  }}
                                  onFocus={(e) => e.target.style.borderColor = '#8eff36'}
                                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                                />
                              </div>
                            )}

                            {/* Onglet Police */}
                            {activeTextTab === 'police' && (
                              <div>
                                <div style={{
                                  fontSize: '13px',
                                  fontWeight: '500',
                                  color: '#111827',
                                  marginBottom: '12px',
                                  fontFamily: 'var(--stepn-font-body)'
                                }}>
                                  Police
                                </div>
                                {fonts.length === 0 ? (
                                  <p style={{ 
                                    color: '#6b7280', 
                                    fontSize: '12px', 
                                    fontFamily: 'var(--stepn-font-body)',
                                    padding: '12px',
                                    backgroundColor: '#f9fafb',
                                    borderRadius: '8px'
                                  }}>
                                    Aucune police disponible.
                                  </p>
                                ) : (
                                  <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(4, 1fr)',
                                    gap: '12px',
                                    padding: '4px'
                                  }}>
                                    {fonts.map((font) => {
                                      const isSelected = selectedText.fontFamily === font.id;
                                      const fontFamilyValue = font.display_name || font.name;
                                      const previewText = selectedText.content && selectedText.content.trim() !== '' 
                                        ? selectedText.content 
                                        : 'ZG';
                                      
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
                                          <div style={{
                                            width: '100%',
                                            padding: '8px',
                                            backgroundColor: '#f5f5f5',
                                            borderRadius: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            minHeight: '60px',
                                            fontFamily: fontFamilyValue ? `"${fontFamilyValue}", sans-serif` : 'sans-serif',
                                            fontSize: '18px',
                                            fontWeight: 'bold',
                                            color: '#111827'
                                          }}>
                                            {previewText}
                                          </div>
                                          <span style={{
                                            fontSize: '11px',
                                            color: '#111827',
                                            WebkitTextFillColor: '#111827',
                                            fontFamily: 'var(--stepn-font-body)',
                                            textAlign: 'center',
                                            fontWeight: '500',
                                            backgroundColor: 'transparent'
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
                                              <span style={{ color: '#ffffff', fontSize: '12px' }}>✓</span>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Onglet Couleur */}
                            {activeTextTab === 'couleur' && (
                              <div>
                                <div style={{
                                  fontSize: '13px',
                                  fontWeight: '500',
                                  color: '#111827',
                                  marginBottom: '12px',
                                  fontFamily: 'var(--stepn-font-body)'
                                }}>
                                  Couleur
                                </div>
                                {(() => {
                                  // Utiliser DIRECTEMENT la palette depuis le snapshot (pas de recherche dans colorPalettes)
                                  const palette = activeModule.config?.textColorPalette;
                                  if (!palette || !palette.colors || palette.colors.length === 0) {
                                    return (
                                      <p style={{ color: '#6b7280', fontSize: '12px', fontFamily: 'var(--stepn-font-body)' }}>
                                        Aucune palette de couleur disponible dans le snapshot.
                                      </p>
                                    );
                                  }
                                  const paletteColors = palette.colors;
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
                                              cursor: 'pointer',
                                              transition: 'border-color 0.2s, transform 0.2s'
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
                                              fontFamily: 'var(--stepn-font-body)',
                                              textAlign: 'center'
                                            }}>
                                              {color?.name || (color?.hex || '#000000').toUpperCase()}
                                            </span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  );
                                })()}
                              </div>
                            )}

                            {/* Onglet Contour */}
                            {activeTextTab === 'contour' && (
                              <div>
                                <div style={{
                                  fontSize: '13px',
                                  fontWeight: '500',
                                  color: '#111827',
                                  marginBottom: '12px',
                                  fontFamily: 'var(--stepn-font-body)'
                                }}>
                                  Contour
                                </div>
                                {(() => {
                                  // Utiliser DIRECTEMENT la palette depuis le snapshot (pas de recherche dans colorPalettes)
                                  const palette = activeModule.config?.textStrokePalette;
                                  if (!palette || !palette.colors || palette.colors.length === 0) {
                                    return (
                                      <p style={{ color: '#6b7280', fontSize: '12px', fontFamily: 'var(--stepn-font-body)', marginBottom: '20px' }}>
                                        Aucune palette de contour disponible dans le snapshot.
                                      </p>
                                    );
                                  }
                                  const paletteColors = palette.colors;
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
                                              cursor: 'pointer',
                                              transition: 'border-color 0.2s, transform 0.2s'
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
                                              fontFamily: 'var(--stepn-font-body)',
                                              textAlign: 'center'
                                            }}>
                                              {color?.name || (color?.hex || '#000000').toUpperCase()}
                                            </span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  );
                                })()}
                                <div>
                                  {(() => {
                                    // Utiliser UNIQUEMENT les contraintes depuis le snapshot (pas de fallback)
                                    const textConstraints = activeModule.config?.textConstraints || activeModule.textConstraints;
                                    
                                    if (!textConstraints) {
                                      return (
                                        <p style={{ color: '#6b7280', fontSize: '12px', fontFamily: 'var(--stepn-font-body)' }}>
                                          Les contraintes de contour ne sont pas disponibles dans le snapshot.
                                        </p>
                                      );
                                    }
                                    
                                    // CODE EXACT DU BUILDER - Copié depuis /app/[subdomain]/admin/products/new/page.tsx
                                    // Convertir en nombres si nécessaire (peut être string dans le snapshot)
                                    const sliderMin = Number(textConstraints.strokeMinWidthPx) || 0;
                                    const sliderMax = Number(textConstraints.strokeMaxWidthPx) || 30;
                                    const sliderRange = sliderMax - sliderMin;
                                    
                                    // Utiliser directement la valeur stockée
                                    const baseValue = Number(textConstraints.baseStrokeWidthPx) || sliderMin;
                                    const rawValue = selectedText.strokeWidth ?? baseValue;
                                    let currentPxValue = Number(rawValue) || sliderMin;
                                    
                                    // Clamper strictement entre min et max
                                    currentPxValue = Math.min(sliderMax, Math.max(sliderMin, currentPxValue));
                                    
                                    // Arrondir à l'entier le plus proche (step de 1px)
                                    currentPxValue = Math.round(currentPxValue);
                                    
                                    // S'assurer que la valeur ne dépasse jamais les limites après arrondi
                                    if (currentPxValue < sliderMin) currentPxValue = sliderMin;
                                    if (currentPxValue > sliderMax) currentPxValue = sliderMax;
                                    
                                    // Debug logs
                                    console.log('📏 Jauge de contour:', {
                                      sliderMin,
                                      sliderMax,
                                      sliderRange,
                                      rawValue,
                                      currentPxValue,
                                      baseValue,
                                      strokeWidth: selectedText.strokeWidth
                                    });
                                    
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
                                            fontFamily: 'var(--stepn-font-body)'
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
                                          #${sliderId}::-webkit-slider-runnable-track {
                                            width: 100%;
                                            height: 6px;
                                            background: #e5e7eb;
                                            border-radius: 3px;
                                          }
                                          #${sliderId}::-moz-range-track {
                                            width: 100%;
                                            height: 6px;
                                            background: #e5e7eb;
                                            border-radius: 3px;
                                            border: none;
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
                                            
                                            // Vérifier que la valeur est valide
                                            if (!Number.isFinite(pxValue)) return;
                                            
                                            // Clamper strictement entre min et max
                                            let clampedValue = Math.min(sliderMax, Math.max(sliderMin, pxValue));
                                            
                                            // Arrondir à l'entier le plus proche (step de 1px)
                                            clampedValue = Math.round(clampedValue);
                                            
                                            // Double vérification après arrondi
                                            if (clampedValue < sliderMin) clampedValue = sliderMin;
                                            if (clampedValue > sliderMax) clampedValue = sliderMax;
                                            
                                            console.log('📏 onChange slider:', {
                                              pxValue,
                                              clampedValue,
                                              sliderMin,
                                              sliderMax
                                            });
                                            
                                            updateText(selectedTextId, { strokeWidth: clampedValue });
                                          }}
                                          onInput={(e) => {
                                            const pxValue = parseFloat((e.target as HTMLInputElement).value);
                                            
                                            // Vérifier que la valeur est valide
                                            if (!Number.isFinite(pxValue)) return;
                                            
                                            // Clamper strictement entre min et max
                                            let clampedValue = Math.min(sliderMax, Math.max(sliderMin, pxValue));
                                            
                                            // Arrondir à l'entier le plus proche (step de 1px)
                                            clampedValue = Math.round(clampedValue);
                                            
                                            // Double vérification après arrondi
                                            if (clampedValue < sliderMin) clampedValue = sliderMin;
                                            if (clampedValue > sliderMax) clampedValue = sliderMax;
                                            
                                            console.log('📏 onInput slider:', {
                                              pxValue,
                                              clampedValue,
                                              sliderMin,
                                              sliderMax
                                            });
                                            
                                            updateText(selectedTextId, { strokeWidth: clampedValue });
                                          }}
                                          disabled={sliderRange <= 0}
                                        />
                                        <div style={{
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                          marginTop: '6px',
                                          paddingTop: '4px',
                                          fontSize: '11px',
                                          fontFamily: 'var(--stepn-font-body)',
                                          fontWeight: '400'
                                        }}>
                                          <span style={{ 
                                            flex: '0 0 auto',
                                            color: '#111827',
                                            WebkitTextFillColor: '#111827'
                                          }}>Min.</span>
                                          <span style={{ 
                                            flex: '0 0 auto',
                                            color: '#111827',
                                            WebkitTextFillColor: '#111827'
                                          }}>Max.</span>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                            )}

                            {/* Onglet Déformation */}
                            {activeTextTab === 'deformation' && (
                              <div>
                                <div style={{
                                  fontSize: '13px',
                                  fontWeight: '500',
                                  color: '#111827',
                                  marginBottom: '12px',
                                  fontFamily: 'var(--stepn-font-body)'
                                }}>
                                  Type de déformation
                                </div>
                                <div>
                                  <style>{`
                                    select.deformation-select {
                                      color: #111827 !important;
                                    }
                                    select.deformation-select option {
                                      color: #111827 !important;
                                      background-color: #ffffff !important;
                                    }
                                    select.deformation-select:focus {
                                      color: #111827 !important;
                                    }
                                  `}</style>
                                  <select
                                    className="deformation-select"
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
                                      fontFamily: 'var(--stepn-font-body)',
                                      cursor: 'pointer',
                                      outline: 'none',
                                      marginBottom: selectedText.deformation ? '20px' : '0',
                                      transition: 'border-color 0.2s'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#8eff36'}
                                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
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
                                      
                                      const enabledDeformations = activeModule.config?.textEnabledDeformations || activeModule.textEnabledDeformations;
                                      const filteredDeformations = enabledDeformations && enabledDeformations.length > 0
                                        ? allDeformations.filter(def => 
                                            def.value === '' || enabledDeformations.includes(def.value)
                                          )
                                        : allDeformations;
                                      
                                      return filteredDeformations.map(def => (
                                        <option key={def.value} value={def.value} style={{ color: '#111827', backgroundColor: '#ffffff' }}>{def.label}</option>
                                      ));
                                    })()}
                                  </select>
                                </div>
                                {selectedText.deformation && (() => {
                                  const sliderId = `deformation-slider-${selectedTextId}`;
                                  const intensity = selectedText.deformationIntensity ?? 0;
                                  const positionPercent = ((intensity + 100) / 200) * 100;
                                  
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
                                          fontFamily: 'var(--stepn-font-body)'
                                        }}>
                                          Intensité {intensity}
                                        </div>
                                      </div>
                                      <style>{`
                                        #${sliderId} {
                                          -webkit-appearance: none;
                                          appearance: none;
                                          width: 100%;
                                          height: 6px;
                                          border-radius: 3px;
                                          background: linear-gradient(to right, #ef4444 0%, #ef4444 ${positionPercent}%, #e5e7eb ${positionPercent}%, #e5e7eb 100%);
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
                                        #${sliderId}::-webkit-slider-runnable-track {
                                          width: 100%;
                                          height: 6px;
                                          background: linear-gradient(to right, #ef4444 0%, #ef4444 ${positionPercent}%, #e5e7eb ${positionPercent}%, #e5e7eb 100%);
                                          border-radius: 3px;
                                        }
                                        #${sliderId}::-moz-range-track {
                                          width: 100%;
                                          height: 6px;
                                          background: linear-gradient(to right, #ef4444 0%, #ef4444 ${positionPercent}%, #e5e7eb ${positionPercent}%, #e5e7eb 100%);
                                          border-radius: 3px;
                                          border: none;
                                        }
                                      `}</style>
                                      <input
                                        id={sliderId}
                                        type="range"
                                        min={-100}
                                        max={100}
                                        step="1"
                                        value={intensity}
                                        onChange={(e) => {
                                          const newIntensity = parseFloat(e.target.value);
                                          if (Number.isFinite(newIntensity)) {
                                            updateText(selectedTextId, { deformationIntensity: newIntensity });
                                          }
                                        }}
                                      />
                                      <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginTop: '6px',
                                        paddingTop: '4px',
                                        fontSize: '11px',
                                        fontFamily: 'var(--stepn-font-body)',
                                        fontWeight: '400'
                                      }}>
                                        <span style={{ 
                                          flex: '0 0 auto',
                                          color: '#111827',
                                          WebkitTextFillColor: '#111827'
                                        }}>-100</span>
                                        <span style={{ 
                                          flex: '0 0 auto',
                                          color: '#111827',
                                          WebkitTextFillColor: '#111827'
                                        }}>+100</span>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })() : (
                      // Si aucun texte n'est sélectionné, afficher le bouton et la liste
                      <>
                        {/* Bouton "Ajouter un texte" */}
                        <button
                          onClick={() => {
                            // Vérifier le mode de placement depuis le module ou son config
                            const placementMode = activeModule.textPlacementMode || activeModule.config?.textPlacementMode || 'zones';
                            // Si mode zones et qu'il y a des zones disponibles, ouvrir le modal
                            if (placementMode === 'zones' && textZones && textZones.length > 0) {
                              setShowTextZoneSelector({
                                textId: null,
                                view: 'torse'
                              });
                            } else {
                              // Mode libre ou pas de zones : ajouter directement un texte
                              addText('', undefined, undefined, 'text');
                            }
                          }}
                          style={{
                            padding: '12px 16px',
                            fontSize: '14px',
                            fontWeight: '600',
                            backgroundColor: '#3b82f6',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontFamily: 'var(--stepn-font-body)',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#2563eb';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#3b82f6';
                          }}
                        >
                          {activeModule.addTextButtonLabel || 'Ajouter un texte'}
                        </button>
                        
                        {/* Liste des textes placés */}
                        {texts.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {texts.map((text) => (
                              <div
                                key={text.id}
                                style={{
                                  padding: '12px',
                                  backgroundColor: selectedTextId === text.id ? '#f3f4f6' : '#ffffff',
                                  border: `1px solid ${selectedTextId === text.id ? '#3b82f6' : '#e5e7eb'}`,
                                  borderRadius: '6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '8px',
                                  transition: 'all 0.2s'
                                }}
                              >
                                <div
                                  onClick={() => {
                                    selectText(text.id);
                                    setActiveTextTab('contenu'); // Réinitialiser à l'onglet Contenu quand on sélectionne un texte
                                  }}
                                  style={{
                                    flex: 1,
                                    cursor: 'pointer'
                                  }}
                                >
                                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827', fontFamily: 'var(--stepn-font-body)' }}>
                                    {text.content || '(Texte vide)'}
                                  </div>
                                  {text.zoneCategory && (
                                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                                      Zone: {text.zoneCategory}
                                    </div>
                                  )}
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    confirmDeleteText(text.id);
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: '4px 8px',
                                    cursor: 'pointer',
                                    color: '#ef4444',
                                    fontSize: '18px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '4px',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#fee2e2';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }}
                                  title="Supprimer le texte"
                                >
                                  🗑️
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                    
                    {/* Modal de sélection de zone de texte - Exactement comme dans le builder */}
                    {showTextZoneSelector && (() => {
                      const availableZones = textZones;
                      
                      return (
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
                            zIndex: 10000
                          }}
                          onClick={(e) => {
                            if (e.target === e.currentTarget) {
                              setShowTextZoneSelector(null);
                              setSelectedZoneId(null);
                              setTextInputValue('');
                            }
                          }}
                        >
                          <div
                            style={{
                              backgroundColor: '#ffffff',
                              borderRadius: '8px',
                              padding: '32px',
                              width: '90%',
                              maxWidth: '700px',
                              maxHeight: '90vh',
                              overflowY: 'auto',
                              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Header */}
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '24px'
                            }}>
                              <h2 style={{
                                fontSize: '20px',
                                fontWeight: '600',
                                color: '#000000',
                                fontFamily: 'var(--stepn-font-body)',
                                margin: 0
                              }}>
                                {activeModule.addTextButtonLabel || 'Ajouter un texte'}
                              </h2>
                              <button
                                onClick={() => {
                                  setShowTextZoneSelector(null);
                                  setSelectedZoneId(null);
                                  setTextInputValue('');
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#666666',
                                  fontSize: '24px',
                                  cursor: 'pointer',
                                  padding: '0',
                                  width: '32px',
                                  height: '32px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  lineHeight: '1'
                                }}
                              >
                                ×
                              </button>
                            </div>

                            {availableZones.length === 0 ? (
                              <p style={{ color: '#666', fontSize: '14px', fontFamily: 'var(--stepn-font-body)', padding: '12px' }}>
                                Aucune zone disponible.
                              </p>
                            ) : (
                              <div>
                                {/* Section: Choisissez une position standard */}
                                <div style={{ marginBottom: '32px' }}>
                                  <h3 style={{
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#000000',
                                    fontFamily: 'var(--stepn-font-body)',
                                    marginBottom: '16px'
                                  }}>
                                    Choisissez une position standard
                                  </h3>
                                  <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                    gap: '16px'
                                  }}>
                                    {availableZones.map((zone: any) => {
                                      const isSelected = selectedZoneId === zone.id;
                                      return (
                                        <div
                                          key={zone.id}
                                          onClick={() => {
                                            setSelectedZoneId(zone.id);
                                            setTextInputValue(zone.default_text || '');
                                            
                                            // Faire pivoter la caméra vers la vue de la zone
                                            const viewToCategory: Record<string, 'torse' | 'dos' | 'bras-gauche' | 'bras-droit'> = {
                                              'Face': 'torse',
                                              'Dos': 'dos',
                                              'Gauche': 'bras-gauche',
                                              'Droite': 'bras-droit',
                                              'front': 'torse',
                                              'back': 'dos',
                                              'left': 'bras-gauche',
                                              'right': 'bras-droit'
                                            };
                                            const zoneCategory = zone.view ? viewToCategory[zone.view] : zone.zone_category;
                                            
                                            if (zoneCategory) {
                                              setTargetView(zoneCategory);
                                              // Convertir la catégorie en vue de caméra
                                              const categoryToView: Record<'torse' | 'dos' | 'bras-gauche' | 'bras-droit', 'front' | 'back' | 'left' | 'right'> = {
                                                'torse': 'front',
                                                'dos': 'back',
                                                'bras-gauche': 'left',
                                                'bras-droit': 'right'
                                              };
                                              const cameraView = categoryToView[zoneCategory];
                                              if (cameraView) {
                                                window.dispatchEvent(new CustomEvent('setCameraView', { detail: cameraView }));
                                              }
                                            }
                                          }}
                                          style={{
                                            position: 'relative',
                                            cursor: 'pointer',
                                            border: isSelected ? '3px solid #000000' : '1px solid #e0e0e0',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            backgroundColor: '#ffffff',
                                            transition: 'all 0.2s'
                                          }}
                                          onMouseEnter={(e) => {
                                            if (!isSelected) {
                                              e.currentTarget.style.borderColor = '#999999';
                                            }
                                          }}
                                          onMouseLeave={(e) => {
                                            if (!isSelected) {
                                              e.currentTarget.style.borderColor = '#e0e0e0';
                                            }
                                          }}
                                        >
                                          {/* Checkmark icon */}
                                          {isSelected && (
                                            <div style={{
                                              position: 'absolute',
                                              top: '8px',
                                              right: '8px',
                                              width: '24px',
                                              height: '24px',
                                              backgroundColor: '#000000',
                                              borderRadius: '50%',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              zIndex: 10
                                            }}>
                                              <span style={{
                                                color: '#ffffff',
                                                fontSize: '14px',
                                                fontWeight: 'bold'
                                              }}>
                                                ✓
                                              </span>
                                            </div>
                                          )}
                                          
                                          {/* Zone thumbnail */}
                                          <div style={{
                                            width: '100%',
                                            height: '140px',
                                            backgroundColor: '#f5f5f5',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'hidden',
                                            padding: '8px'
                                          }}>
                                            {zone.thumbnail_url && !zone.thumbnail_url.startsWith('blob:') ? (
                                              <img
                                                src={zone.thumbnail_url}
                                                alt={zone.name}
                                                style={{
                                                  maxWidth: '100%',
                                                  maxHeight: '100%',
                                                  objectFit: 'contain',
                                                  filter: 'grayscale(100%)',
                                                  display: 'block'
                                                }}
                                                onError={(e) => {
                                                  console.error('❌ Error loading thumbnail for zone:', zone.name, zone.thumbnail_url);
                                                  e.currentTarget.style.display = 'none';
                                                }}
                                              />
                                            ) : (
                                              <div style={{
                                                width: '100%',
                                                height: '100%',
                                                backgroundColor: '#e0e0e0',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#111827',
                                                WebkitTextFillColor: '#111827',
                                                fontSize: '12px',
                                                textAlign: 'center',
                                                padding: '8px'
                                              }}>
                                                {zone.name}
                                                {!zone.thumbnail_url && (
                                                  <div style={{ fontSize: '10px', marginTop: '4px', color: '#999' }}>
                                                    (Pas de vignette)
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                          
                                          {/* Zone label */}
                                          <div style={{
                                            padding: '12px',
                                            textAlign: 'center',
                                            backgroundColor: '#ffffff'
                                          }}>
                                            <p style={{
                                              margin: 0,
                                              fontSize: '12px',
                                              fontWeight: '500',
                                              color: '#111827',
                                              WebkitTextFillColor: '#111827',
                                              WebkitTextStrokeColor: '#111827',
                                              fontFamily: 'var(--stepn-font-body)'
                                            }}>
                                              {zone.name}
                                              {zone.view && ` (${zone.view})`}
                                            </p>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Section: Contenu du texte */}
                                <div style={{ marginBottom: '32px' }}>
                                  <h3 style={{
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#000000',
                                    fontFamily: 'var(--stepn-font-body)',
                                    marginBottom: '12px'
                                  }}>
                                    Contenu du texte
                                  </h3>
                                  <input
                                    type="text"
                                    value={textInputValue}
                                    onChange={(e) => setTextInputValue(e.target.value)}
                                    placeholder="Saisir l'inscription ici..."
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && textInputValue.trim() && selectedZoneId) {
                                        const selectedZone = availableZones.find((z: any) => z.id === selectedZoneId);
                                        if (selectedZone) {
                                          const viewToCategory: Record<string, 'torse' | 'dos' | 'bras-gauche' | 'bras-droit'> = {
                                            'Face': 'torse',
                                            'Dos': 'dos',
                                            'Gauche': 'bras-gauche',
                                            'Droite': 'bras-droit',
                                            'front': 'torse',
                                            'back': 'dos',
                                            'left': 'bras-gauche',
                                            'right': 'bras-droit'
                                          };
                                          const zoneCategory = selectedZone.view ? viewToCategory[selectedZone.view] : selectedZone.zone_category;
                                          
                                          // Utiliser la position de la zone directement (déjà en coordonnées UV2)
                                          // IMPORTANT: Les zones sont stockées avec inversion verticale (comme dans UVMapViewer)
                                          // Mais ModelViewer utilise des coordonnées directes, donc on doit inverser v
                                          const zonePosition: [number, number, number] = [
                                            selectedZone.position[0],
                                            1 - selectedZone.position[1], // Inverser v pour correspondre à ModelViewer
                                            selectedZone.position[2] || 0
                                          ];
                                          
                                          // Convertir la rotation de degrés à radians si nécessaire
                                          const zoneRotationRaw = selectedZone.rotation || selectedZone.default_rotation || 0;
                                          const zoneRotation = zoneRotationRaw * (Math.PI / 180);
                                          
                                          // Calculer la taille de police en fonction des dimensions de la zone
                                          const CANVAS_SIZE = 2048;
                                          const SCALE_FACTOR = 0.5;
                                          const zoneWidth = selectedZone.width || 0.1;
                                          const zoneHeight = selectedZone.height || 0.1;
                                          
                                          const zoneWidthPx = zoneWidth * CANVAS_SIZE;
                                          const zoneHeightPx = zoneHeight * CANVAS_SIZE;
                                          
                                          const availableWidth = zoneWidthPx * 0.8;
                                          const availableHeight = zoneHeightPx * 0.8;
                                          
                                          const estimatedCharWidth = 0.6;
                                          const textLength = textInputValue.length || 1;
                                          
                                          const fontSizeFromWidth = (availableWidth / textLength) / estimatedCharWidth / SCALE_FACTOR;
                                          const fontSizeFromHeight = availableHeight / SCALE_FACTOR;
                                          
                                          const calculatedFontSize = Math.min(fontSizeFromWidth, fontSizeFromHeight);
                                          const finalFontSize = Math.max(100, Math.min(2000, calculatedFontSize));
                                          
                                          const categories = selectedZone.categories || [];
                                          let category: 'nom' | 'numero' | 'text' = 'text';
                                          if (categories.includes('nom')) {
                                            category = 'nom';
                                          } else if (categories.includes('numero')) {
                                            category = 'numero';
                                          }
                                          
                                          addText(
                                            textInputValue,
                                            zonePosition,
                                            undefined,
                                            category,
                                            finalFontSize,
                                            zoneCategory,
                                            zoneRotation
                                          );
                                          
                                          // Positionner la caméra sur la vue de la zone
                                          if (zoneCategory) {
                                            setTargetView(zoneCategory);
                                          }
                                          
                                          setShowTextZoneSelector(null);
                                          setSelectedZoneId(null);
                                          setTextInputValue('');
                                        }
                                      }
                                    }}
                                    style={{
                                      width: '100%',
                                      padding: '12px 16px',
                                      backgroundColor: '#ffffff',
                                      border: '1px solid #e0e0e0',
                                      borderRadius: '4px',
                                      fontSize: '14px',
                                      fontFamily: 'var(--stepn-font-body)',
                                      color: '#000000',
                                      outline: 'none'
                                    }}
                                  />
                                </div>

                                {/* Action buttons */}
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'flex-end',
                                  gap: '12px'
                                }}>
                                  <button
                                    onClick={() => {
                                      setShowTextZoneSelector(null);
                                      setSelectedZoneId(null);
                                      setTextInputValue('');
                                    }}
                                    style={{
                                      padding: '12px 24px',
                                      backgroundColor: '#f5f5f5',
                                      border: '1px solid #e0e0e0',
                                      borderRadius: '4px',
                                      fontSize: '14px',
                                      fontFamily: 'var(--stepn-font-body)',
                                      color: '#000000',
                                      cursor: 'pointer',
                                      fontWeight: '500',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = '#e8e8e8';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = '#f5f5f5';
                                    }}
                                  >
                                    Annuler
                                  </button>
                                  <button
                                    onClick={() => {
                                      const selectedZone = availableZones.find((z: any) => z.id === selectedZoneId);
                                      if (selectedZone && textInputValue.trim()) {
                                        const viewToCategory: Record<string, 'torse' | 'dos' | 'bras-gauche' | 'bras-droit'> = {
                                          'Face': 'torse',
                                          'Dos': 'dos',
                                          'Gauche': 'bras-gauche',
                                          'Droite': 'bras-droit',
                                          'front': 'torse',
                                          'back': 'dos',
                                          'left': 'bras-gauche',
                                          'right': 'bras-droit'
                                        };
                                        const zoneCategory = selectedZone.view ? viewToCategory[selectedZone.view] : selectedZone.zone_category;
                                        
                                        const zonePosition: [number, number, number] = [
                                          selectedZone.position[0],
                                          1 - selectedZone.position[1],
                                          selectedZone.position[2] || 0
                                        ];
                                        
                                        const zoneRotationRaw = selectedZone.rotation || selectedZone.default_rotation || 0;
                                        const zoneRotation = zoneRotationRaw * (Math.PI / 180);
                                        
                                        const CANVAS_SIZE = 2048;
                                        const SCALE_FACTOR = 0.5;
                                        const zoneWidth = selectedZone.width || 0.1;
                                        const zoneHeight = selectedZone.height || 0.1;
                                        
                                        const zoneWidthPx = zoneWidth * CANVAS_SIZE;
                                        const zoneHeightPx = zoneHeight * CANVAS_SIZE;
                                        
                                        const availableWidth = zoneWidthPx * 0.8;
                                        const availableHeight = zoneHeightPx * 0.8;
                                        
                                        const estimatedCharWidth = 0.6;
                                        const textLength = textInputValue.length || 1;
                                        
                                        const fontSizeFromWidth = (availableWidth / textLength) / estimatedCharWidth / SCALE_FACTOR;
                                        const fontSizeFromHeight = availableHeight / SCALE_FACTOR;
                                        
                                        const calculatedFontSize = Math.min(fontSizeFromWidth, fontSizeFromHeight);
                                        const finalFontSize = Math.max(100, Math.min(2000, calculatedFontSize));
                                        
                                        const categories = selectedZone.categories || [];
                                        let category: 'nom' | 'numero' | 'text' = 'text';
                                        if (categories.includes('nom')) {
                                          category = 'nom';
                                        } else if (categories.includes('numero')) {
                                          category = 'numero';
                                        }
                                        
                                        addText(
                                          textInputValue,
                                          zonePosition,
                                          undefined,
                                          category,
                                          finalFontSize,
                                          zoneCategory,
                                          zoneRotation
                                        );
                                        
                                        if (zoneCategory) {
                                          setTargetView(zoneCategory);
                                        }
                                        
                                        setShowTextZoneSelector(null);
                                        setSelectedZoneId(null);
                                        setTextInputValue('');
                                      }
                                    }}
                                    disabled={!textInputValue.trim() || !selectedZoneId}
                                    style={{
                                      padding: '12px 24px',
                                      backgroundColor: (!textInputValue.trim() || !selectedZoneId) ? '#cccccc' : '#000000',
                                      border: 'none',
                                      borderRadius: '4px',
                                      fontSize: '14px',
                                      fontFamily: 'var(--stepn-font-body)',
                                      color: (!textInputValue.trim() || !selectedZoneId) ? '#666666' : '#ffffff',
                                      cursor: (!textInputValue.trim() || !selectedZoneId) ? 'not-allowed' : 'pointer',
                                      fontWeight: '500',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                      if (textInputValue.trim() && selectedZoneId) {
                                        e.currentTarget.style.backgroundColor = '#333333';
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (textInputValue.trim() && selectedZoneId) {
                                        e.currentTarget.style.backgroundColor = '#000000';
                                      }
                                    }}
                                  >
                                    {activeModule.addTextButtonLabel || 'Ajouter un texte'}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : activeModule.contentType === 'logos' ? (() => {
                  const logoModule = snapshot?.customizationModules?.find((m: any) => 
                    (m.type === 'logos' || m.contentType === 'logos')
                  );
                  const hasLogoModule = logoModule?.config?.logoLibraries?.length > 0;
                  
                  console.log('🖼️ Module logos - hasLogoModule:', hasLogoModule, 'logoModule:', logoModule);
                  
                  if (!hasLogoModule) {
                    console.log('🖼️ Module logos caché car pas de bibliothèques');
                    return null; // Hide module if no libraries in snapshot
                  }
                  
                  console.log('🖼️ Module logos RENDU, bouton devrait être visible');

                  // Labels des vues depuis le module ou par défaut
                  const viewLabels = {
                    'front': activeModule.logoViewFrontLabel || activeModule.config?.logoViewFrontLabel || 'Torse',
                    'back': activeModule.logoViewBackLabel || activeModule.config?.logoViewBackLabel || 'Dos',
                    'left': activeModule.logoViewLeftLabel || activeModule.config?.logoViewLeftLabel || 'Bras gauche',
                    'right': activeModule.logoViewRightLabel || activeModule.config?.logoViewRightLabel || 'Bras droit'
                  };
                  
                  // Utiliser activeLogoView global (défini au niveau du composant principal)
                  // Récupérer les logos depuis le snapshot
                  const logosFromSnapshot: any[] = [];
                  if (logoModule?.config?.logoLibraries) {
                    logoModule.config.logoLibraries.forEach((library: any) => {
                      if (library.logos) {
                        library.logos.forEach((logo: any) => {
                          logosFromSnapshot.push({
                            ...logo,
                            logo_library_id: library.id
                          });
                        });
                      }
                    });
                  }
                  
                  const buttonLabel = activeModule.addLogoButtonLabel || activeModule.config?.addLogoButtonLabel || 'Ajouter un logo';
                  
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {/* Boutons de vue en haut */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '4px',
                        padding: '4px',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '8px'
                      }}>
                        {(['front', 'back', 'left', 'right'] as const).map((view) => (
                          <button
                            key={view}
                            onClick={() => {
                              setActiveLogoView(view);
                              // Émettre un événement pour changer la vue de la caméra
                              const categoryToView: Record<'torse' | 'dos' | 'bras-gauche' | 'bras-droit', 'front' | 'back' | 'left' | 'right'> = {
                                'torse': 'front',
                                'dos': 'back',
                                'bras-gauche': 'left',
                                'bras-droit': 'right'
                              };
                              const viewToCategory: Record<'front' | 'back' | 'left' | 'right', 'torse' | 'dos' | 'bras-gauche' | 'bras-droit'> = {
                                'front': 'torse',
                                'back': 'dos',
                                'left': 'bras-gauche',
                                'right': 'bras-droit'
                              };
                              const category = viewToCategory[view];
                              if (category) {
                                setTargetView(category);
                              }
                              window.dispatchEvent(new CustomEvent('setCameraView', { detail: view }));
                            }}
                            style={{
                              padding: '8px 12px',
                              fontSize: '12px',
                              fontWeight: '500',
                              backgroundColor: activeLogoView === view ? '#3b82f6' : '#ffffff',
                              color: activeLogoView === view ? '#ffffff' : '#111827',
                              border: `1px solid ${activeLogoView === view ? '#3b82f6' : '#e5e7eb'}`,
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontFamily: 'var(--stepn-font-body)',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              if (activeLogoView !== view) {
                                e.currentTarget.style.backgroundColor = '#f3f4f6';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (activeLogoView !== view) {
                                e.currentTarget.style.backgroundColor = '#ffffff';
                              }
                            }}
                          >
                            {viewLabels[view]}
                          </button>
                        ))}
                      </div>
                      
                      {/* Bouton "Ajouter un logo" */}
                      {console.log('🖼️ RENDU DU BOUTON - buttonLabel:', buttonLabel, 'setShowLogoLibrary:', typeof setShowLogoLibrary)}
                      <button
                        data-testid="add-logo-button"
                        data-button-type="add-logo"
                        onClick={(e) => {
                          console.log('🖼️🖼️🖼️ CLIC DÉTECTÉ SUR LE BOUTON!');
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('🖼️ Clic sur bouton "Ajouter un logo"');
                          console.log('🖼️ showLogoLibrary avant:', showLogoLibrary);
                          console.log('🖼️ setShowLogoLibrary disponible:', typeof setShowLogoLibrary);
                          // IMPORTANT: setShowLogoLibrary est défini au niveau du composant principal
                          // Il devrait être accessible via closure, mais vérifions
                          if (typeof setShowLogoLibrary !== 'function') {
                            console.error('🖼️ ERREUR CRITIQUE: setShowLogoLibrary n\'est pas une fonction!');
                            return;
                          }
                          // Utiliser directement setShowLogoLibrary depuis le scope parent
                          // Le state est défini au niveau du composant principal, donc il devrait être accessible
                          try {
                            console.log('🖼️ Appel de setShowLogoLibrary(true)...');
                            setShowLogoLibrary(true);
                            setSelectedLogoForZone(null);
                            setSelectedLogoForVariants(null);
                            console.log('🖼️ setShowLogoLibrary(true) appelé avec succès');
                            // Forcer un re-render en vérifiant après un court délai
                            setTimeout(() => {
                              console.log('🖼️ showLogoLibrary après setTimeout (peut être stale):', showLogoLibrary);
                              // Vérifier si le modal est rendu
                              const modalElement = document.querySelector('[data-logo-modal]');
                              console.log('🖼️ Modal element trouvé:', !!modalElement);
                              if (!modalElement) {
                                console.error('🖼️ ERREUR: Le modal n\'est pas rendu dans le DOM!');
                                console.log('🖼️ Vérification du state showLogoLibrary dans le DOM...');
                                // Essayer de forcer un re-render
                                const event = new Event('forceUpdate');
                                window.dispatchEvent(event);
                              }
                            }, 100);
                          } catch (error) {
                            console.error('🖼️ ERREUR lors de l\'ouverture du modal:', error);
                            console.error('🖼️ Stack trace:', error.stack);
                          }
                        }}
                        onMouseDown={(e) => {
                          console.log('🖼️ onMouseDown sur le bouton');
                          e.stopPropagation();
                        }}
                        onMouseUp={(e) => {
                          console.log('🖼️ onMouseUp sur le bouton');
                          e.stopPropagation();
                        }}
                        style={{
                          width: '100%',
                          padding: '12px 24px',
                          fontSize: '14px',
                          fontWeight: '500',
                          backgroundColor: '#3b82f6',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          transition: 'all 0.2s',
                          fontFamily: 'var(--stepn-font-body)',
                          position: 'relative',
                          zIndex: 1000
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#2563eb';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#3b82f6';
                        }}
                      >
                        <span>+</span>
                        {buttonLabel}
                      </button>
                      
                      {/* Liste des logos placés pour la vue active */}
                      {(() => {
                        const viewToCategory: Record<'front' | 'back' | 'left' | 'right', 'torse' | 'dos' | 'bras-gauche' | 'bras-droit'> = {
                          'front': 'torse',
                          'back': 'dos',
                          'left': 'bras-gauche',
                          'right': 'bras-droit'
                        };
                        const activeCategory = viewToCategory[activeLogoView];
                        const activeCategoryLogos = placedLogos.filter(l => l.category === activeCategory);
                        
                        if (activeCategoryLogos.length === 0) {
                          return null;
                        }
                        
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {activeCategoryLogos.map((logo) => {
                              const logoData = logosFromSnapshot.find(l => l.id === logo.logoId);
                              return (
                                <div
                                  key={logo.id}
                                  onClick={() => selectLogo(logo.id)}
                                  style={{
                                    padding: '12px',
                                    backgroundColor: selectedLogoId === logo.id ? '#f3f4f6' : '#ffffff',
                                    border: `1px solid ${selectedLogoId === logo.id ? '#3b82f6' : '#e5e7eb'}`,
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                  }}
                                >
                                  <div style={{ flexGrow: 1 }}>
                                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827', fontFamily: 'var(--stepn-font-body)' }}>
                                      {logoData?.name || 'Logo'}
                                    </div>
                                    {logo.category && (
                                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                                        {viewLabels[activeLogoView]}
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      confirmDeleteLogo(logo.id);
                                    }}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      padding: '4px 8px',
                                      cursor: 'pointer',
                                      color: '#ef4444',
                                      fontSize: '18px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      borderRadius: '4px',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = '#fee2e2';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                    title="Supprimer le logo"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })() : (
                  // Masquer le module si pas de données dans le snapshot (PAS d'erreur)
                  null
                )
              ) : null}
            </div>
          </div>
        );
      })()}
      
      {/* Modal de bibliothèque de logos - NE PAS UTILISER, la bibliothèque s'affiche dans la sidebar */}
      {false && showLogoLibrary ? (() => {
        console.log('🖼️ RENDERING MODAL, showLogoLibrary:', showLogoLibrary);
        console.log('🖼️ Modal de bibliothèque de logos RENDU, showLogoLibrary:', showLogoLibrary);
        const logoModule = snapshot?.customizationModules?.find((m: any) => 
          (m.type === 'logos' || m.contentType === 'logos')
        );
        const logosFromLibrary: any[] = [];
        if (logoModule?.config?.logoLibraries) {
          logoModule.config.logoLibraries.forEach((library: any) => {
            if (library.logos) {
              library.logos.forEach((logo: any) => {
                logosFromLibrary.push({
                  ...logo,
                  logo_library_id: library.id
                });
              });
            }
          });
        }
        
        console.log('🖼️ Logos depuis la bibliothèque:', logosFromLibrary.length);
        
        // Trouver le module logos actif
        const activeLogoModule = customizationModules.find((m: any) => m.id === activeCustomizerTab && (m.contentType === 'logos' || m.type === 'logos'));
        const placementMode = activeLogoModule?.logoPlacementMode || activeLogoModule?.config?.logoPlacementMode || 'zones';
        
        return (
          <div
            data-logo-modal="true"
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
              zIndex: 10000
            }}
            onClick={() => {
              setShowLogoLibrary(false);
              setSelectedLogoForVariants(null);
            }}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                padding: '24px',
                width: '90%',
                maxWidth: '800px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#111827',
                  fontFamily: 'var(--stepn-font-body)',
                  margin: 0
                }}>
                  Sélectionner un logo
                </h2>
                <button
                  onClick={() => {
                    setShowLogoLibrary(false);
                    setSelectedLogoForVariants(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#666666',
                    fontSize: '24px',
                    cursor: 'pointer',
                    padding: '0',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: '1'
                  }}
                >
                  ×
                </button>
              </div>
              
              {selectedLogoForVariants ? (() => {
                const selectedLogo = logosFromLibrary.find(l => l.id === selectedLogoForVariants);
                if (!selectedLogo) {
                  setSelectedLogoForVariants(null);
                  return null;
                }
                
                return (
                  <div>
                    <button
                      onClick={() => setSelectedLogoForVariants(null)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#3b82f6',
                        fontSize: '14px',
                        cursor: 'pointer',
                        marginBottom: '16px',
                        fontFamily: 'var(--stepn-font-body)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      ← Retour
                    </button>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#111827',
                      fontFamily: 'var(--stepn-font-body)',
                      marginBottom: '16px'
                    }}>
                      {selectedLogo.name}
                    </h3>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '16px'
                    }}>
                      {selectedLogo.variants?.map((variant: any) => (
                        <button
                          key={variant.id}
                          onClick={() => {
                            // NOUVEAU FLUX : Après sélection d'une variante, ouvrir le modal de zone
                            if (placementMode === 'zones') {
                              setShowLogoZoneModal(true);
                              setSelectedLogoForZone({
                                logoId: selectedLogo.id,
                                variantId: variant.id,
                                variantFile: variant.file
                              });
                              setShowLogoLibrary(false);
                            } else {
                              // Mode libre : ajouter directement
                              const viewToCategory: Record<'front' | 'back' | 'left' | 'right', 'torse' | 'dos' | 'bras-gauche' | 'bras-droit'> = {
                                'front': 'torse',
                                'back': 'dos',
                                'left': 'bras-gauche',
                                'right': 'bras-droit'
                              };
                              const category = viewToCategory[activeLogoView];
                              addLogo(selectedLogo.id, variant.id, variant.file, [0.5, 0.5, 0], category);
                              setShowLogoLibrary(false);
                              setSelectedLogoForVariants(null);
                            }
                          }}
                          style={{
                            padding: '16px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            backgroundColor: '#ffffff',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#3b82f6';
                            e.currentTarget.style.backgroundColor = '#f3f4f6';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#e5e7eb';
                            e.currentTarget.style.backgroundColor = '#ffffff';
                          }}
                        >
                          <div style={{
                            width: '100%',
                            height: '120px',
                            backgroundColor: '#f5f5f5',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '8px',
                            overflow: 'hidden'
                          }}>
                            {variant.file && (
                              <img
                                src={variant.file}
                                alt={variant.name || selectedLogo.name}
                                style={{
                                  maxWidth: '100%',
                                  maxHeight: '100%',
                                  objectFit: 'contain'
                                }}
                              />
                            )}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            fontWeight: '500',
                            color: '#111827',
                            fontFamily: 'var(--stepn-font-body)',
                            textAlign: 'center'
                          }}>
                            {variant.name || 'Variante'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })() : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '16px'
                }}>
                  {logosFromLibrary.map((logo) => (
                    <button
                      key={logo.id}
                      onClick={() => {
                        if (logo.variants && logo.variants.length > 1) {
                          // Plusieurs variantes : ouvrir le sélecteur de variantes
                          setSelectedLogoForVariants(logo.id);
                        } else {
                          // Une seule variante ou aucune : ouvrir directement le modal de zone
                          if (placementMode === 'zones') {
                            const variant = logo.variants?.[0];
                            setShowLogoZoneModal(true);
                            setSelectedLogoForZone({
                              logoId: logo.id,
                              variantId: variant?.id || '',
                              variantFile: variant?.file || ''
                            });
                            setShowLogoLibrary(false);
                          } else {
                            // Mode libre : ajouter directement
                            const viewToCategory: Record<'front' | 'back' | 'left' | 'right', 'torse' | 'dos' | 'bras-gauche' | 'bras-droit'> = {
                              'front': 'torse',
                              'back': 'dos',
                              'left': 'bras-gauche',
                              'right': 'bras-droit'
                            };
                            const category = viewToCategory[activeLogoView];
                            const variant = logo.variants?.[0];
                            addLogo(logo.id, variant?.id || '', variant?.file || '', [0.5, 0.5, 0], category);
                            setShowLogoLibrary(false);
                          }
                        }
                      }}
                      style={{
                        padding: '16px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        backgroundColor: '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#3b82f6';
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.backgroundColor = '#ffffff';
                      }}
                    >
                      <div style={{
                        width: '100%',
                        height: '120px',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '8px',
                        overflow: 'hidden'
                      }}>
                        {logo.variants?.[0]?.file && (
                          <img
                            src={logo.variants[0].file}
                            alt={logo.name}
                            style={{
                              maxWidth: '100%',
                              maxHeight: '100%',
                              objectFit: 'contain'
                            }}
                          />
                        )}
                      </div>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#111827',
                        fontFamily: 'var(--stepn-font-body)',
                        textAlign: 'center',
                        marginBottom: '4px'
                      }}>
                        {logo.name}
                      </div>
                      {logo.variants && logo.variants.length > 1 && (
                        <div style={{
                          fontSize: '12px',
                          color: '#6b7280',
                          fontFamily: 'var(--stepn-font-body)',
                          textAlign: 'center'
                        }}>
                          {logo.variants.length} variantes
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })() : null}
      
      {/* Viewer 3D au centre */}
      <div 
        className="flex-1 flex flex-col"
        style={isMobileMode ? {
          position: 'relative',
          width: '100%',
          flex: '1 1 0%',
          flexShrink: 1,
          minHeight: 0,
          overflow: 'hidden',
          order: 1
        } : {
          position: 'relative',
          flex: '1 1 0%',
          minWidth: 0
        }}
      >
        {/* Header avec sélecteur de viewport (desktop/mobile) - Centré et transparent */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
          <div className="flex items-center gap-1 bg-transparent rounded-lg p-1">
            <button
              onClick={() => setViewportMode('desktop')}
              className={`p-1.5 rounded transition-all ${
                viewportMode === 'desktop'
                  ? 'bg-white/80 text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 bg-white/50'
              }`}
              title="Vue ordinateur"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewportMode('mobile')}
              className={`p-1.5 rounded transition-all ${
                viewportMode === 'mobile'
                  ? 'bg-white/80 text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 bg-white/50'
              }`}
              title="Vue téléphone"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Container du viewer avec contrainte de viewport */}
        {/* Si preview={true} et forceMobileLayout={true}, on est dans un simulateur, donc pas de double cadre */}
        <div 
          className={isMobileMode ? "flex-1 relative flex flex-col" : "flex-1 relative"}
          style={isMobileMode && preview ? {
            // Mode simulateur : utiliser tout l'espace sans créer de cadre
            position: 'relative',
            width: '100%',
            height: '100%',
            overflow: 'visible',
            flex: '1 1 0%',
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column'
          } : isMobileMode ? {
            // Mode mobile normal : créer le cadre du téléphone
            position: 'relative',
            width: '100%',
            height: '100%',
            maxWidth: '375px',
            maxHeight: '667px',
            margin: '0 auto',
            border: '8px solid #1f2937',
            borderRadius: '20px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            flex: '1 1 0%',
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column'
          } : {
            position: 'relative',
            width: '100%',
            height: '100%',
            maxWidth: '100%',
            maxHeight: '100%',
            margin: '0',
            overflow: 'hidden',
            flex: '1 1 0%',
            minHeight: 0
          }}
        >
          <div style={{ flex: '1 1 0%', minHeight: 0, overflow: 'hidden', position: 'relative' }}>
            {/* Overlay pour fermer le panneau mobile en cliquant sur la zone 3D */}
            {isMobileMode && activeCustomizerTab && (
              <div 
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: '40%', // Laisser de l'espace pour le panneau
                  backgroundColor: 'rgba(0, 0, 0, 0.01)', // Légèrement visible pour debug
                  zIndex: 1000, // Z-index très élevé pour être au-dessus du Canvas
                  pointerEvents: 'auto',
                  touchAction: 'auto',
                  cursor: 'pointer'
                }}
                onClick={(e) => {
                  console.log('🖱️ ConfiguratorViewer - Clic sur overlay zone 3D', {
                    isMobileMode,
                    activeCustomizerTab,
                    target: e.target,
                    currentTarget: e.currentTarget
                  });
                  e.stopPropagation();
                  e.preventDefault();
                  console.log('✅ Fermeture du panneau mobile');
                  setActiveCustomizerTab(null);
                }}
                onTouchStart={(e) => {
                  console.log('👆 ConfiguratorViewer - Touch sur overlay zone 3D', {
                    isMobileMode,
                    activeCustomizerTab,
                    touches: e.touches.length
                  });
                  e.stopPropagation();
                  e.preventDefault();
                  console.log('✅ Fermeture du panneau mobile (touch)');
                  setActiveCustomizerTab(null);
                }}
                onMouseDown={(e) => {
                  console.log('🖱️ ConfiguratorViewer - MouseDown sur overlay zone 3D');
                  e.stopPropagation();
                  e.preventDefault();
                }}
              />
            )}
            <Viewer3D
            designTexture={designTexture}
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
            updateLogoPosition={(id, position) => updateLogo(id, { position })}
            updateLogoRotation={(id, rotation) => updateLogo(id, { rotation })}
            updateLogoScale={(id, scale) => updateLogo(id, { scale })}
            toggleLogoLock={toggleLogoLock}
            removeLogo={removeLogo}
            selectedLogoId={selectedLogoId}
            selectLogo={selectLogo}
            isDraggingLogo={isDraggingLogo}
            setIsDraggingLogo={setIsDraggingLogo}
            isRotatingLogo={isRotatingLogo}
            setIsRotatingLogo={setIsRotatingLogo}
            isResizingLogo={isResizingLogo}
            setIsResizingLogo={setIsResizingLogo}
            onRequestLogoDelete={onRequestLogoDelete}
            onRequestTextDelete={onRequestTextDelete}
            selectedDesign={selectedDesign}
            modelUrl={modelUrl}
            modelId={modelId}
            textureMaps={textureMaps}
            materialMaps={materialMaps}
            isPlacingText={isPlacingText}
            textZones={textZones}
            onTextPlaced={onTextPlaced}
            viewerSettings={snapshot?.viewerSettings}
            cameraSettings={snapshot?.cameraSettings}
            onCloseModal={() => {
              console.log('✅ Viewer3D - Fermeture du panneau mobile via onCloseModal');
              setActiveCustomizerTab(null);
            }}
            isMobileModalOpen={(() => {
              const isOpen = !!(isMobileMode && activeCustomizerTab);
              console.log('🔍 ConfiguratorViewer - isMobileModalOpen calculé:', {
                isMobileMode,
                activeCustomizerTab,
                isOpen
              });
              return isOpen;
            })()}
          />
          </div>
          
          {/* Barre mobile en bas du téléphone avec les modules de personnalisation */}
          {isMobileMode && (
            <div
              className="w-full bg-white border-t border-gray-200 flex flex-row items-center justify-around px-3 py-3 flex-shrink-0"
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                width: '100%',
                height: '80px',
                minHeight: '80px',
                maxHeight: '80px',
                zIndex: 10000,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-around',
                padding: '12px',
                backgroundColor: '#ff0000',
                borderTop: '3px solid #000000',
                boxShadow: '0 -2px 10px rgba(0,0,0,0.3)',
              }}
            >
              {customizationModules && customizationModules.length > 0 ? (
                customizationModules.map((module: any) => {
                const iconToShow = module.icon || module.iconUrl || module.emoji || module.iconChar || module.iconName || '🎨';
                const isActive = activeCustomizerTab === module.id;
                const moduleLabel = module.tabName || module.label || module.name || '';

                return (
                  <button
                    key={module.id}
                    onClick={() => {
                      setActiveCustomizerTab(module.id);
                    }}
                    className={`flex flex-col items-center justify-center rounded transition-all ${
                      isActive
                        ? 'bg-gray-100 border-gray-300'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                    style={{
                      minWidth: '48px',
                      minHeight: '48px',
                      padding: '8px',
                      border: `1px solid ${isActive ? '#d1d5db' : '#e5e7eb'}`,
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                    }}
                    title={moduleLabel}
                  >
                    {module.iconUrl ? (
                      <img
                        src={module.iconUrl}
                        alt={moduleLabel}
                        style={{
                          width: '24px',
                          height: '24px',
                          objectFit: 'contain',
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: '20px' }}>{iconToShow}</span>
                    )}
                    {moduleLabel && (
                      <span style={{ fontSize: '10px', color: '#6b7280', textAlign: 'center' }}>
                        {moduleLabel}
                      </span>
                    )}
                  </button>
                );
              })
              ) : (
                <div style={{ padding: '8px', color: '#666', fontSize: '12px' }}>
                  Aucun module disponible (debug: {customizationModules?.length || 0} modules)
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Modal de confirmation de suppression */}
      {showDeleteModal && itemToDelete && (
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
            zIndex: 10000
          }}
          onClick={handleCancelDelete}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '16px',
              fontFamily: 'var(--stepn-font-body)'
            }}>
              Confirmer la suppression
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '24px',
              fontFamily: 'var(--stepn-font-body)'
            }}>
              Êtes-vous sûr de vouloir supprimer {itemToDelete.type === 'text' ? 'ce texte' : 'ce logo'} ?
            </p>
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={handleCancelDelete}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#111827',
                  cursor: 'pointer',
                  fontFamily: 'var(--stepn-font-body)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e5e7eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDelete}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#ef4444',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontFamily: 'var(--stepn-font-body)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#dc2626';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ef4444';
                }}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de sélection de zone pour les logos */}
      {showLogoZoneModal && selectedLogoForZone && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 10001,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
        onClick={() => {
          setShowLogoZoneModal(false);
          setSelectedLogoForZone(null);
        }}
        >
          <div style={{
            backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px',
            width: '90%', maxWidth: '600px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', fontFamily: 'var(--stepn-font-body)', margin: 0 }}>
                Sélectionner une zone pour le logo
              </h3>
              <button
                onClick={() => {
                  setShowLogoZoneModal(false);
                  setSelectedLogoForZone(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#666666',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '0',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: '1'
                }}
              >
                ×
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
              {textZones.filter((zone: any) => {
                // Filtrer les zones selon la vue active
                const viewToCategory: Record<'front' | 'back' | 'left' | 'right', 'torse' | 'dos' | 'bras-gauche' | 'bras-droit'> = {
                  'front': 'torse',
                  'back': 'dos',
                  'left': 'bras-gauche',
                  'right': 'bras-droit'
                };
                const categoryForView = viewToCategory[activeLogoView];
                if (zone.categories && !zone.categories.includes(`logo-${categoryForView}`)) return false;
                if (zone.view && zone.view !== activeLogoView) return false;
                return true;
              }).map((zone: any) => (
                <button
                  key={zone.id}
                  onClick={() => {
                    // NOUVEAU FLUX : Placer le logo directement sur la zone sélectionnée
                    const viewToCategory: Record<'front' | 'back' | 'left' | 'right', 'torse' | 'dos' | 'bras-gauche' | 'bras-droit'> = {
                      'front': 'torse',
                      'back': 'dos',
                      'left': 'bras-gauche',
                      'right': 'bras-droit'
                    };
                    const category = viewToCategory[activeLogoView];
                    
                    // Utiliser la position de la zone
                    const zonePosition: [number, number, number] = [
                      zone.position[0],
                      1 - zone.position[1], // Inverser v pour correspondre à ModelViewer
                      zone.position[2] || 0
                    ];
                    
                    // Convertir la rotation de degrés à radians si nécessaire
                    const zoneRotationRaw = zone.rotation || zone.default_rotation || 0;
                    const zoneRotation = zoneRotationRaw * (Math.PI / 180);
                    
                    addLogo(
                      selectedLogoForZone.logoId,
                      selectedLogoForZone.variantId || '',
                      selectedLogoForZone.variantFile || '',
                      zonePosition,
                      category,
                      undefined,
                      undefined,
                      zoneRotation
                    );
                    
                    // Positionner la caméra sur la vue de la zone
                    if (category) {
                      setTargetView(category);
                    }
                    
                    setShowLogoZoneModal(false);
                    setSelectedLogoForZone(null);
                  }}
                  style={{
                    padding: '16px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#111827',
                    fontFamily: 'var(--stepn-font-body)',
                    transition: 'background-color 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    alignItems: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e5e7eb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }}
                >
                  {zone.thumbnail_url && (
                    <img
                      src={zone.thumbnail_url}
                      alt={zone.name}
                      style={{
                        width: '100%',
                        height: '120px',
                        objectFit: 'cover',
                        borderRadius: '6px'
                      }}
                    />
                  )}
                  <div>{zone.name || `Zone ${zone.zone_category || 'logo'}`}</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowLogoZoneModal(false)}
              style={{
                padding: '10px 16px',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                fontFamily: 'var(--stepn-font-body)'
              }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}
      {zoneModal}
    </div>
  );
}

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

function DesignTab({ selectedDesign, selectDesign, colors, updateColor, replaceColors, resetColors, allowedDesignIds, isLinkedPrefillActive, hasPendingLinkedPrefill }: { 
  selectedDesign: { id: string | null; svgUrl: string | null }; 
  selectDesign: (design: { id: string; svgUrl: string } | null) => void; 
  colors?: any; 
  updateColor?: any; 
  replaceColors?: any; 
  resetColors?: any; 
  allowedDesignIds?: string[] | undefined; 
  isLinkedPrefillActive?: boolean; 
  hasPendingLinkedPrefill?: boolean; 
}) {
  const [designs, setDesigns] = useState<Array<{
    id: string;
    name: string;
    svgUrl: string;
    thumbUrl?: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDesigns() {
      try {
        const response = await fetch('/api/designs');
        const designsData = await response.json();
        setDesigns(designsData);
      } catch (error) {
        console.error('Erreur lors du chargement des designs:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadDesigns();
  }, []);

  const [designTab, setDesignTab] = useState<'designs' | 'best'>('designs');

  return (
    <div className="space-y-4">
      {/* Sous-onglets pour les designs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setDesignTab('designs')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            designTab === 'designs'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Designs
        </button>
        <button
          onClick={() => setDesignTab('best')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            designTab === 'best'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Meilleurs designs des clients
        </button>
      </div>

      {/* Contenu des sous-onglets */}
      {designTab === 'designs' && (
        <>
      {isLoading ? (
        <div className="text-center py-8">
          <div className="text-gray-500">Chargement des designs...</div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Design "Aucun" */}
          <button
            className={`w-full p-3 rounded-lg border-2 transition-all ${
              !selectedDesign.id 
                ? "border-blue-500 bg-blue-50 text-blue-700" 
                : "border-gray-200 hover:border-gray-300 text-gray-900"
            }`}
            onClick={() => selectDesign(null)}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-400 text-xs">Aucun</span>
              </div>
              <span className="font-medium">Aucun design</span>
            </div>
          </button>

          {/* Grille des designs */}
          {designs.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {designs.map((design) => (
                <button
                  key={design.id}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedDesign.id === design.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => selectDesign(design)}
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
        </>
      )}

      {designTab === 'best' && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">⭐</div>
          <h3 className="text-lg font-medium mb-2">Meilleurs designs des clients</h3>
          <p className="text-sm">Cette fonctionnalité sera disponible prochainement.</p>
        </div>
      )}
      
      {selectedDesign.id && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-green-800">Design sélectionné</span>
          </div>
          <p className="text-xs text-green-600 mt-1">
            Le design est appliqué au modèle 3D
          </p>
        </div>
      )}
    </div>
  );
}

function ColorTab({ colors, updateColor }: { 
  colors: { primary: string; secondary: string; tertiary: string };
  updateColor: (colorType: 'primary' | 'secondary' | 'tertiary', color: string) => void;
}) {
  const [palettes, setPalettes] = useState<Array<{
    id: string;
    name: string;
    colors: Array<{ hex: string; name: string }>;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPalette, setSelectedPalette] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState<{
    colorType: 'primary' | 'secondary' | 'tertiary' | null;
  }>({ colorType: null });

  const colorTypes = [
    { 
      key: 'primary' as const, 
      label: 'Couleur Primaire', 
      description: 'Couleur principale du design'
    },
    { 
      key: 'secondary' as const, 
      label: 'Couleur Secondaire', 
      description: 'Couleur d\'accent du design'
    },
    { 
      key: 'tertiary' as const, 
      label: 'Couleur Tertiaire', 
      description: 'Couleur de détail du design'
    }
  ];

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
  const handleColorClick = (colorType: 'primary' | 'secondary' | 'tertiary') => {
    setShowColorPicker({
      colorType
    });
  };

  // Gérer la sélection d'une couleur
  const handleColorSelect = (colorHex: string) => {
    if (showColorPicker.colorType) {
      updateColor(showColorPicker.colorType, colorHex);
      // Ne pas fermer automatiquement - l'utilisateur doit cliquer sur "Retour"
    }
  };

  // Gérer la fermeture du sélecteur
  const handleClosePicker = () => {
    setShowColorPicker({ colorType: null });
  };

  // Si on est en mode sélection de couleur, afficher la palette full-screen
  if (showColorPicker.colorType) {
    const currentColor = colors[showColorPicker.colorType];
    const currentColorName = allColors.find(c => c.hex === currentColor)?.name || 'Couleur sélectionnée';
    const colorIndex = colorTypes.findIndex(t => t.key === showColorPicker.colorType) + 1;

  return (
      <div className="h-full flex flex-col">
        {/* Header avec bouton retour et couleur actuelle */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <button
            onClick={handleClosePicker}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
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
      
        {/* Grille de couleurs */}
        <div className="flex-1 p-4 overflow-y-auto">
      {isLoading ? (
            <div className="text-center py-12">
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
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                </div>
                </div>
                  )}
                </button>
              ))}
              
              {/* Cercle vide pour "aucune couleur" */}
              <button
                onClick={() => handleColorSelect('')}
                className="relative aspect-square rounded-full border-2 border-gray-400 border-dashed hover:border-gray-500 transition-colors bg-transparent flex items-center justify-center"
              >
                {!currentColor && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                  </div>
                )}
              </button>
        </div>
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

  // Vue normale avec la liste des couleurs
  return (
    <div className="space-y-6">
      {/* Liste des couleurs comme dans l'image */}
      <div className="space-y-3">
        {colorTypes.map((colorType, index) => (
                <button
            key={colorType.key}
            onClick={() => handleColorClick(colorType.key)}
            className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              {/* Cercle de couleur */}
              <div 
                className={`w-6 h-6 rounded-full border-2 ${
                  colors[colorType.key] && colors[colorType.key] !== '#ffffff' && colors[colorType.key] !== '#FFFFFF'
                    ? 'border-gray-300' 
                    : 'border-gray-400'
                }`}
                style={{ 
                  backgroundColor: colors[colorType.key] && colors[colorType.key] !== '#ffffff' && colors[colorType.key] !== '#FFFFFF'
                    ? colors[colorType.key]
                    : 'transparent'
                }}
              />
              
              {/* Label */}
              <span className="font-medium text-gray-900">
                Couleur {index + 1}
                  </span>
            </div>
            
            {/* Flèche */}
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

