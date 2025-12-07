// =====================================================
// GÉNÉRATEUR DE SNAPSHOT POUR LE CONFIGURATEUR
// =====================================================
// Ce module génère un snapshot autonome et figé du configurateur
// qui peut être utilisé en production sans accès à la DB admin

import { supabaseAdmin } from '@/lib/supabase';

export interface Snapshot {
  productId: string;
  version: string;
  publishedAt: string;
  model3D: {
    url: string;
    textureMaps?: Record<string, string>;
    materialMaps: Record<string, any>;
  };
  design2D?: {
    url: string;
    thumbnailUrl?: string;
    colors?: Record<string, string>;
    color_mappings?: Record<string, string>;
  };
  resolvedColors?: Record<string, string>; // Mapping final mesh → hex, prêt à être appliqué
  customizationModules: Array<{
    id: string;
    type: string;
    label: string;
    icon?: string;
    iconUrl?: string;
    options?: any[];
    allowedDesigns?: Array<{
      label: string;
      svgUrl: string;
      thumbnailUrl?: string;
    }>;
    allowedColors?: Array<{
      label: string;
      hex: string;
      mesh?: string;
    }>;
    default?: string;
    config?: any;
  }>;
  textZones?: Array<{
    id: string;
    name: string;
    categories: string[];
    zone_category: string;
    position: [number, number, number];
    default_text_width?: number;
    default_text_height?: number;
    default_logo_width?: number;
    default_logo_height?: number;
    thumbnail_url?: string;
    view?: 'front' | 'back' | 'left' | 'right';
    default_text?: string;
    default_font_size?: number;
    default_rotation?: number;
    width?: number;
    height?: number;
    rotation?: number;
  }>;
  fonts?: Array<{
    id: string;
    name: string;
    display_name: string;
    font_url: string;
    format: string;
    category?: string;
  }>;
  defaultState: Record<string, any>;
  cameraSettings: {
    initialZoom: number;
    initialRotation: number;
    minZoom: number;
    maxZoom: number;
    zoomSpeed?: number;
    rotateSpeed?: number;
    viewDistance?: Record<string, number>;
  };
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
}

/**
 * Génère un snapshot autonome depuis les données du builder
 */
export async function generateSnapshot(
  builderData: any,
  shopDomain: string,
  shopifyProductId: string
): Promise<Snapshot> {
  // Log complet de builderData pour debug
  console.log('📦 builderData reçu pour génération du snapshot:', {
    hasBuilderData: !!builderData,
    builderDataKeys: builderData ? Object.keys(builderData) : [],
    model3DId: builderData?.model3DId,
    design2DId: builderData?.design2DId,
    hasDefaultState: !!builderData?.defaultState,
    defaultStateDesign2DId: builderData?.defaultState?.design2DId,
    hasCustomizationModules: !!builderData?.customizationModules,
    customizationModulesCount: builderData?.customizationModules?.length || 0,
    customizationModulesTypes: builderData?.customizationModules?.map((m: any) => ({
      type: m.type || m.contentType,
      hasSelectedItems: !!m.selectedItems,
      selectedItemsDesign2DId: m.selectedItems?.design2DId,
      default: m.default
    })) || []
  });
  
  // Trouver le design2DId : d'abord dans builderData.design2DId, puis dans defaultState, puis dans les modules
  let design2DId = builderData.design2DId;
  if (!design2DId && builderData.defaultState?.design2DId) {
    design2DId = builderData.defaultState.design2DId;
  }
  if (!design2DId && builderData.customizationModules) {
    const designModule = builderData.customizationModules.find((m: any) => 
      (m.type === 'designs-2d' || m.contentType === 'designs-2d')
    );
    if (designModule?.selectedItems?.design2DId) {
      design2DId = designModule.selectedItems.design2DId;
    } else if (designModule?.default) {
      design2DId = designModule.default;
    }
  }
  
  console.log('📸 Génération du snapshot avec builderData:', {
    builderDataKeys: Object.keys(builderData),
    model3DId: builderData.model3DId,
    modelId: builderData.modelId,
    selectedModel3DId: builderData.selectedModel3DId,
    design2DId: design2DId,
    design2DIdSource: builderData.design2DId ? 'root' : 
                      builderData.defaultState?.design2DId ? 'defaultState' : 
                      builderData.customizationModules?.find((m: any) => 
                        (m.type === 'designs-2d' || m.contentType === 'designs-2d')
                      )?.selectedItems?.design2DId ? 'modules.selectedItems' :
                      builderData.customizationModules?.find((m: any) => 
                        (m.type === 'designs-2d' || m.contentType === 'designs-2d')
                      )?.default ? 'modules.default' :
                      'notFound',
    modulesCount: builderData.customizationModules?.length || 0,
    hasDefaultState: !!builderData.defaultState
  });
  
  // Essayer de trouver model3DId dans différentes propriétés possibles
  const actualModel3DId = builderData.model3DId || builderData.modelId || builderData.selectedModel3DId || builderData.selectedModelId;
  if (!actualModel3DId) {
    console.error('❌ Aucun model3DId trouvé dans builderData!', {
      builderDataKeys: Object.keys(builderData),
      builderData: JSON.stringify(builderData, null, 2).substring(0, 1000) // Limiter la taille du log
    });
  }

  // Utiliser le model3DId trouvé (ou celui par défaut)
  const model3DIdToUse = builderData.model3DId || builderData.modelId || builderData.selectedModel3DId || builderData.selectedModelId;
  
  if (!model3DIdToUse) {
    throw new Error('Model3D ID is required in builder_data (model3DId, modelId, selectedModel3DId, or selectedModelId)');
  }
  
  console.log('🎯 Utilisation du model3DId:', model3DIdToUse);
  
  const model3D = await resolveModel3D(model3DIdToUse);
  let design2D: Snapshot['design2D'] | undefined;
  
  if (design2DId) {
    console.log('🔍 Tentative de résolution du design2D:', {
      design2DId,
      design2DIdType: typeof design2DId
    });
    try {
      design2D = await resolveDesign2D(design2DId);
      console.log('✅ Design2D résolu avec succès:', {
        design2DId,
        url: design2D?.url,
        hasColors: !!design2D?.colors,
        thumbnailUrl: design2D?.thumbnailUrl
      });
    } catch (error: any) {
      console.error('❌ Erreur lors de la résolution du design2D:', {
        design2DId,
        error: error.message,
        errorCode: error.code,
        errorDetails: error.details,
        errorHint: error.hint
      });
      // Ne pas bloquer la génération du snapshot si le design2D n'est pas trouvé
      design2D = undefined;
    }
  } else {
    console.warn('⚠️ Aucun design2DId trouvé dans builderData:', {
      hasBuilderData: !!builderData,
      builderDataKeys: builderData ? Object.keys(builderData) : [],
      hasDefaultState: !!builderData.defaultState,
      defaultStateKeys: builderData.defaultState ? Object.keys(builderData.defaultState) : [],
      hasCustomizationModules: !!builderData.customizationModules,
      customizationModulesCount: builderData.customizationModules?.length || 0
    });
  }
  
  console.log('📸 Snapshot résolu:', {
    hasModel3D: !!model3D,
    hasDesign2D: !!design2D,
    design2DUrl: design2D?.url,
    design2DId: design2DId,
    snapshotWillIncludeDesign2D: !!design2D
  });

  // Résoudre les zones de texte depuis le modèle 3D
  const textZones = await resolveTextZones(model3DIdToUse);
  
  // Résoudre toutes les polices depuis les fontGroups des modules
  const fonts = await resolveFonts(builderData.customizationModules || []);

  // Résoudre les modules de customisation
  const customizationModules = await resolveCustomizationModules(builderData.customizationModules || []);
  
  // Résoudre les couleurs finales (mesh → hex) pour le viewer
  const resolvedColors = resolveColors(customizationModules, design2D);

  const snapshot: Snapshot = {
    productId: shopifyProductId,
    version: 'v1',
    publishedAt: new Date().toISOString(),
    model3D: model3D,
    design2D: design2D,
    customizationModules: customizationModules,
    textZones: (textZones && textZones.length > 0) ? textZones : undefined,
    fonts: (fonts && fonts.length > 0) ? fonts : undefined,
    resolvedColors: Object.keys(resolvedColors).length > 0 ? resolvedColors : undefined,
    defaultState: resolveDefaultState(builderData),
    cameraSettings: resolveCameraSettings(builderData.settings || {}),
    viewerSettings: resolveViewerSettings(builderData.settings || {})
  };

  // Log final pour vérifier que le snapshot contient bien toutes les données
  console.log('📦 Snapshot final créé:', {
    hasModel3D: !!snapshot.model3D,
    hasDesign2D: !!snapshot.design2D,
    design2DUrl: snapshot.design2D?.url,
    design2DInSnapshot: snapshot.design2D !== undefined,
    hasTextZones: (textZones && textZones.length > 0),
    textZonesCount: textZones?.length || 0,
    hasFonts: (fonts && fonts.length > 0),
    fontsCount: fonts?.length || 0,
    snapshotKeys: Object.keys(snapshot),
    modulesCount: snapshot.customizationModules.length,
    defaultStateDesign2DId: snapshot.defaultState?.design2DId
  });

  return snapshot;
}

/**
 * Résout le modèle 3D : convertit l'ID en URLs et material maps résolus
 */
async function resolveModel3D(modelId: string | null): Promise<Snapshot['model3D']> {
  if (!modelId) {
    throw new Error('Model3D ID is required');
  }

  // Charger le modèle depuis la DB admin
  const { data: model, error } = await supabaseAdmin
    .from('models_3d')
    .select('*')
    .eq('id', modelId)
    .single();

  if (error || !model) {
    throw new Error(`Model not found: ${modelId}`);
  }

  // Charger les material maps résolus depuis la DB
  let materialMaps: Record<string, any> = {};
  try {
    // Récupérer les model_parts avec leurs material_maps
    const { data: modelParts } = await supabaseAdmin
      .from('model_parts')
      .select(`
        name,
        material_map_id,
        material_maps!inner (
          id,
          material_map_files (
            map_type,
            file_url,
            intensity,
            scale
          )
        )
      `)
      .eq('model_3d_id', modelId);

    if (modelParts && modelParts.length > 0) {
      modelParts.forEach((part: any) => {
        const materialName = part.name;
        const materialMap = part.material_maps;
        
        if (materialMap && materialMap.material_map_files) {
          if (!materialMaps[materialName]) {
            materialMaps[materialName] = { materialName };
          }
          
          const files = materialMap.material_map_files || [];
          let globalRepeatX: number | undefined;
          let globalRepeatY: number | undefined;
          
          files.forEach((file: any) => {
            const mapType = file.map_type?.toLowerCase();
            const fileUrl = file.file_url;
            const intensity = file.intensity !== undefined ? file.intensity / 100 : 1;
            const scale = file.scale !== undefined ? file.scale : 1;
            
            if (!fileUrl) return;
            
            if (scale !== 1 && globalRepeatX === undefined) {
              globalRepeatX = scale;
              globalRepeatY = scale;
              materialMaps[materialName].repeatX = scale;
              materialMaps[materialName].repeatY = scale;
            }
            materialMaps[materialName].scaleX = globalRepeatX || scale;
            materialMaps[materialName].scaleY = globalRepeatY || scale;
            
            if (mapType === 'normal' || mapType === 'normalmap') {
              materialMaps[materialName].normalMap = fileUrl;
              materialMaps[materialName].normal = fileUrl;
              materialMaps[materialName].normalIntensity = intensity;
            } else if (mapType === 'roughness' || mapType === 'roughnessmap') {
              materialMaps[materialName].roughnessMap = fileUrl;
              materialMaps[materialName].roughness = fileUrl;
              materialMaps[materialName].roughnessValue = intensity;
            } else if (mapType === 'metalness' || mapType === 'metallic') {
              materialMaps[materialName].metalnessMap = fileUrl;
              materialMaps[materialName].metalness = fileUrl;
              materialMaps[materialName].metalnessValue = intensity;
            } else if (mapType === 'ao' || mapType === 'ambientocclusion') {
              materialMaps[materialName].aoMap = fileUrl;
              materialMaps[materialName].aoIntensity = intensity;
            }
          });
          
          // Indexer par plusieurs variantes du nom
          if (materialName) {
            materialMaps[materialName.toLowerCase()] = materialMaps[materialName];
            materialMaps[materialName.toUpperCase()] = materialMaps[materialName];
            if (part.material_map_id) {
              materialMaps[part.material_map_id] = materialMaps[materialName];
            }
          }
        }
      });
    }
  } catch (e) {
    console.warn('Could not load material maps:', e);
  }

  return {
    url: model.glb_url || model.glbUrl || '',
    textureMaps: model.texture_maps || model.textureMaps || undefined,
    materialMaps
  };
}

/**
 * Résout le design 2D : convertit l'ID en URL et couleurs résolues
 */
async function resolveDesign2D(designId: string): Promise<Snapshot['design2D']> {
  console.log('🔍 Résolution du design2D depuis la DB:', {
    designId,
    designIdType: typeof designId
  });
  
  // Essayer d'abord designs_2d, puis designs en fallback
  let { data: design, error } = await supabaseAdmin
    .from('designs_2d')
    .select('*')
    .eq('id', designId)
    .single();
  
  // Si designs_2d n'existe pas, essayer designs
  if (error && error.code === 'PGRST205') {
    console.log('⚠️ Table designs_2d non trouvée, essai avec designs');
    const result = await supabaseAdmin
      .from('designs')
      .select('*')
      .eq('id', designId)
      .single();
    design = result.data;
    error = result.error;
  }

  if (error) {
    console.error('❌ Erreur Supabase lors de la récupération du design:', {
      designId,
      errorCode: error.code,
      errorMessage: error.message,
      errorDetails: error.details,
      errorHint: error.hint
    });
    throw new Error(`Design not found: ${designId} - ${error.message}`);
  }
  
  if (!design) {
    console.error('❌ Design non trouvé dans la DB:', {
      designId,
      queryReturnedNull: true
    });
    throw new Error(`Design not found: ${designId}`);
  }
  
  console.log('✅ Design trouvé dans la DB:', {
    designId: design.id,
    name: design.name,
    hasSvgUrl: !!design.svg_url,
    svgUrl: design.svg_url,
    hasThumbnailUrl: !!design.thumbnail_url,
    hasColorMappings: !!(design.color_mappings || design.colorMappings),
    colorMappings: design.color_mappings || design.colorMappings || null
  });

  // Résoudre les couleurs
  const colors: Record<string, string> = {};
  if (design.colors && Array.isArray(design.colors)) {
    design.colors.forEach((color: any) => {
      if (color.name && color.value) {
        colors[color.name] = color.value;
      }
    });
  }

  // Fallback sur les couleurs legacy
  if (Object.keys(colors).length === 0) {
    if (design.primary_color) colors.primary = design.primary_color;
    if (design.secondary_color) colors.secondary = design.secondary_color;
    if (design.tertiary_color) colors.tertiary = design.tertiary_color;
  }

  // Récupérer les color_mappings si disponibles
  const colorMappings = design.color_mappings || design.colorMappings || {};
  
  return {
    url: design.svg_url || design.svgUrl || '',
    thumbnailUrl: design.thumbnail_url || design.thumbnailUrl || undefined,
    colors: Object.keys(colors).length > 0 ? colors : undefined,
    color_mappings: Object.keys(colorMappings).length > 0 ? colorMappings : undefined
  };
}

/**
 * Résout les modules de personnalisation : convertit tous les IDs en valeurs finales
 */
async function resolveCustomizationModules(
  modules: any[]
): Promise<Snapshot['customizationModules']> {
  const resolvedModules = await Promise.all(
    modules.map(async (module) => {
      // Déterminer le type de module (peut être contentType ou type)
      const moduleType = module.contentType || module.type || 'unknown';
      
      const resolved: Snapshot['customizationModules'][0] = {
        id: module.id,
        type: moduleType,
        label: module.tabName || module.label || '',
        icon: module.icon || module.config?.icon,
        iconUrl: module.iconUrl || module.config?.iconUrl,
        config: module.config || {}
      };

      console.log('📸 Résolution du module:', {
        id: module.id,
        contentType: module.contentType,
        type: module.type,
        resolvedType: moduleType,
        hasConfig: !!module.config,
        hasSelectedItems: !!module.selectedItems
      });

      // Résoudre selon le type de module
      if (moduleType === 'colors') {
        // Résoudre la palette de couleurs - chercher dans config, selectedItems, ou directement dans module
        const paletteId = module.config?.paletteId || 
                         module.selectedItems?.paletteId || 
                         module.paletteId ||
                         module.selectedItems?.colorPaletteId;
        console.log('🎨 Résolution du module couleurs:', {
          moduleId: module.id,
          paletteId: paletteId,
          hasConfig: !!module.config,
          hasSelectedItems: !!module.selectedItems,
          configKeys: module.config ? Object.keys(module.config) : [],
          selectedItemsKeys: module.selectedItems ? Object.keys(module.selectedItems) : [],
          moduleKeys: Object.keys(module)
        });
        
        if (paletteId) {
          const { data: palette, error: paletteError } = await supabaseAdmin
            .from('color_palettes')
            .select('*')
            .eq('id', paletteId)
            .single();

          if (paletteError) {
            console.error('❌ Erreur lors de la récupération de la palette:', {
              paletteId,
              errorCode: paletteError.code,
              errorMessage: paletteError.message,
              errorDetails: paletteError.details
            });
          }

          if (palette && palette.colors) {
            resolved.allowedColors = (palette.colors || []).map((color: any) => ({
              label: color.name || color.label || '',
              hex: color.hex || color.value || '#000000',
              mesh: color.mesh || 'primary',
              id: color.id || color.hex
            }));
            console.log(`✅ Palette résolue: ${resolved.allowedColors?.length || 0} couleur(s)`);
          } else {
            console.warn('⚠️ Palette trouvée mais sans couleurs:', paletteId);
          }
        } else {
          console.warn('⚠️ Aucun paletteId trouvé dans le module couleurs');
        }
        resolved.default = module.selectedItems?.colorId || module.default;
        
        // Préserver toute la config du module couleurs
        resolved.config = {
          ...resolved.config,
          ...module.config,
          paletteId: paletteId
        };
      } else if (moduleType === 'designs-2d') {
        // Résoudre les designs autorisés - chercher dans config, selectedItems, ou directement
        const allowedIds = module.selectedItems?.design2DIds || 
                          module.config?.allowedDesignIds || 
                          module.allowedDesignIds ||
                          module.selectedItems?.allowedDesignIds ||
                          [];
        console.log('🎨 Résolution du module designs-2d:', {
          moduleId: module.id,
          allowedIdsCount: allowedIds.length,
          allowedIds: allowedIds,
          hasConfig: !!module.config,
          hasSelectedItems: !!module.selectedItems,
          configKeys: module.config ? Object.keys(module.config) : [],
          selectedItemsKeys: module.selectedItems ? Object.keys(module.selectedItems) : []
        });
        if (allowedIds.length > 0) {
          // Essayer d'abord designs_2d, puis designs en fallback
          let { data: designs, error: designsError } = await supabaseAdmin
            .from('designs_2d')
            .select('id, name, svg_url, thumbnail_url')
            .in('id', allowedIds);
          
          // Si designs_2d n'existe pas, essayer designs
          if (designsError && designsError.code === 'PGRST205') {
            console.log('⚠️ Table designs_2d non trouvée pour allowedDesigns, essai avec designs');
            const result = await supabaseAdmin
              .from('designs')
              .select('id, name, svg_url, thumbnail_url')
              .in('id', allowedIds);
            designs = result.data;
          }

          if (designs) {
            resolved.allowedDesigns = designs.map((design: any) => ({
              label: design.name || '',
              svgUrl: design.svg_url || '',
              thumbnailUrl: design.thumbnail_url || undefined,
              id: design.id
            }));
          }
        }
        resolved.default = module.selectedItems?.design2DId || module.default;
        
        // Préserver toute la config du module designs
        resolved.config = {
          ...resolved.config,
          ...module.config,
          allowedDesignIds: allowedIds
        };
      } else if (moduleType === 'logos') {
        // Pour les logos, on garde la config mais on résout les bibliothèques avec leurs logos et variantes
        const libraryIds = module.config?.logoLibraryIds || 
                          module.selectedItems?.logoLibraryIds || 
                          module.logoLibraryIds ||
                          [];
        console.log('📚 Résolution du module logos:', {
          moduleId: module.id,
          libraryIdsCount: libraryIds.length,
          libraryIds: libraryIds,
          hasConfig: !!module.config,
          hasSelectedItems: !!module.selectedItems,
          configKeys: module.config ? Object.keys(module.config) : [],
          selectedItemsKeys: module.selectedItems ? Object.keys(module.selectedItems) : []
        });
        if (libraryIds.length > 0) {
          const { data: libraries } = await supabaseAdmin
            .from('logo_libraries')
            .select('*')
            .in('id', libraryIds);

          // Pour chaque bibliothèque, récupérer les logos avec leurs variantes
          const librariesWithLogos = await Promise.all(
            (libraries || []).map(async (library: any) => {
              // Récupérer les logos de cette bibliothèque
              const { data: logos, error: logosError } = await supabaseAdmin
                .from('logos')
                .select('*')
                .eq('logo_library_id', library.id)
                .order('created_at', { ascending: true });

              if (logosError) {
                console.warn('⚠️ Erreur lors de la récupération des logos:', logosError);
              }

              // Pour chaque logo, récupérer ses variantes
              const logosWithVariants = await Promise.all(
                (logos || []).map(async (logo: any) => {
                  const { data: variants, error: variantsError } = await supabaseAdmin
                    .from('logo_variants')
                    .select('*')
                    .eq('logo_id', logo.id)
                    .order('created_at', { ascending: true });

                  if (variantsError) {
                    console.warn('⚠️ Erreur lors de la récupération des variantes:', variantsError);
                  }

                  return {
                    id: logo.id,
                    name: logo.name,
                    file_url: logo.file_url || logo.fileUrl || '',
                    vector: logo.vector || false,
                    variants: (variants || []).map((v: any) => ({
                      id: v.id,
                      name: v.name || 'Original',
                      file: v.file_url || v.file || '',
                      file_url: v.file_url || v.file || ''
                    }))
                  };
                })
              );

              return {
                id: library.id,
                name: library.name,
                logos: logosWithVariants,
                created_at: library.created_at,
                updated_at: library.updated_at
              };
            })
          );

          resolved.config = {
            ...resolved.config,
            ...module.config, // Préserver toute la config existante
            logoLibraries: librariesWithLogos,
            logoLibraryIds: libraryIds,
            logoPlacementMode: module.config?.logoPlacementMode,
            logoZoneGroupIds: module.config?.logoZoneGroupIds,
            addLogoButtonLabel: module.config?.addLogoButtonLabel,
            logoViewFrontLabel: module.config?.logoViewFrontLabel,
            logoViewBackLabel: module.config?.logoViewBackLabel,
            logoViewLeftLabel: module.config?.logoViewLeftLabel,
            logoViewRightLabel: module.config?.logoViewRightLabel
          };
        }
      } else if (moduleType === 'text') {
        // Pour les textes, on garde la config (groupes de polices, etc.)
        const fontGroupIds = module.selectedItems?.fontGroupIds || module.config?.fontGroupIds || [];
        if (fontGroupIds.length > 0) {
          const { data: fontGroups } = await supabaseAdmin
            .from('font_groups')
            .select('*')
            .in('id', fontGroupIds);

          resolved.config = {
            ...resolved.config,
            fontGroups: fontGroups || []
          };
        }
        
        // Résoudre les palettes de couleurs pour le texte (couleur et contour)
        // Chercher dans module.config ET module directement (pour compatibilité)
        const textColorPaletteId = module.config?.textColorPaletteId || (module as any).textColorPaletteId;
        const textStrokePaletteId = module.config?.textStrokePaletteId || (module as any).textStrokePaletteId;
        
        console.log('🎨 Résolution des palettes texte:', {
          textColorPaletteId,
          textStrokePaletteId,
          hasConfig: !!module.config,
          configKeys: module.config ? Object.keys(module.config) : []
        });
        
        if (textColorPaletteId) {
          const { data: textColorPalette, error: textColorError } = await supabaseAdmin
            .from('color_palettes')
            .select('*')
            .eq('id', textColorPaletteId)
            .single();
          
          if (textColorError) {
            console.warn('⚠️ Erreur lors de la récupération de textColorPalette:', textColorError);
          }
          
          if (textColorPalette) {
            resolved.config = {
              ...resolved.config,
              textColorPalette: {
                id: textColorPalette.id,
                name: textColorPalette.name,
                colors: textColorPalette.colors || []
              }
            };
            console.log('✅ Palette couleur texte résolue:', {
              id: textColorPalette.id,
              name: textColorPalette.name,
              colorsCount: (textColorPalette.colors || []).length
            });
          } else {
            console.warn('⚠️ Palette couleur texte non trouvée pour ID:', textColorPaletteId);
          }
        }
        
        if (textStrokePaletteId) {
          const { data: textStrokePalette, error: textStrokeError } = await supabaseAdmin
            .from('color_palettes')
            .select('*')
            .eq('id', textStrokePaletteId)
            .single();
          
          if (textStrokeError) {
            console.warn('⚠️ Erreur lors de la récupération de textStrokePalette:', textStrokeError);
          }
          
          if (textStrokePalette) {
            resolved.config = {
              ...resolved.config,
              textStrokePalette: {
                id: textStrokePalette.id,
                name: textStrokePalette.name,
                colors: textStrokePalette.colors || []
              }
            };
            console.log('✅ Palette contour texte résolue:', {
              id: textStrokePalette.id,
              name: textStrokePalette.name,
              colorsCount: (textStrokePalette.colors || []).length
            });
          } else {
            console.warn('⚠️ Palette contour texte non trouvée pour ID:', textStrokePaletteId);
          }
        }
        
        // Construire textConstraints depuis les propriétés du module
        // Dans le builder, les contraintes sont stockées directement sur le module :
        // - module.textStrokeMinWidth
        // - module.textStrokeMaxWidth
        // - module.textBaseStrokeWidth
        // - module.textMinFontSize
        // - module.textMaxFontSize
        let textConstraints: any = module.config?.textConstraints || (module as any).textConstraints;
        
        // Si textConstraints n'existe pas, le construire depuis les propriétés du module
        if (!textConstraints) {
          const strokeMinWidthPx = Number((module as any).textStrokeMinWidth ?? module.config?.textStrokeMinWidth ?? 0);
          const strokeMaxWidthPx = Number((module as any).textStrokeMaxWidth ?? module.config?.textStrokeMaxWidth ?? 50);
          const baseStrokeWidthPx = Number((module as any).textBaseStrokeWidth ?? module.config?.textBaseStrokeWidth ?? strokeMinWidthPx);
          const minFontSizePx = Number((module as any).textMinFontSize ?? module.config?.textMinFontSize ?? 100);
          const maxFontSizePx = Number((module as any).textMaxFontSize ?? module.config?.textMaxFontSize ?? 2000);
          const baseFontSize = Number((module as any).textBaseFontSize ?? module.config?.textBaseFontSize ?? 700);
          
          textConstraints = {
            strokeMinWidthPx: Number.isFinite(strokeMinWidthPx) ? strokeMinWidthPx : 0,
            strokeMaxWidthPx: Number.isFinite(strokeMaxWidthPx) ? strokeMaxWidthPx : 50,
            baseStrokeWidthPx: Number.isFinite(baseStrokeWidthPx) ? baseStrokeWidthPx : (Number.isFinite(strokeMinWidthPx) ? strokeMinWidthPx : 0),
            minFontSizePx: Number.isFinite(minFontSizePx) ? minFontSizePx : 100,
            maxFontSizePx: Number.isFinite(maxFontSizePx) ? maxFontSizePx : 2000,
            baseFontSize: Number.isFinite(baseFontSize) ? baseFontSize : 700
          };
          
          console.log('📏 textConstraints construit:', {
            strokeMinWidthPx,
            strokeMaxWidthPx,
            baseStrokeWidthPx,
            fromModule: (module as any).textBaseStrokeWidth,
            fromConfig: module.config?.textBaseStrokeWidth,
            final: textConstraints.baseStrokeWidthPx
          });
        }
        
        // Préserver TOUS les champs de config du module texte (y compris textConstraints)
        resolved.config = {
          ...resolved.config,
          ...module.config, // Préserver toute la config existante
          textColorPaletteId: textColorPaletteId,
          textStrokePaletteId: textStrokePaletteId,
          textEnabledDeformations: module.config?.textEnabledDeformations || (module as any).textEnabledDeformations,
          textConstraints: textConstraints, // IMPORTANT: Préserver textConstraints construit
          enableTextContent: module.config?.enableTextContent !== false,
          enableTextFont: module.config?.enableTextFont !== false,
          enableTextColor: module.config?.enableTextColor !== false,
          enableTextStroke: module.config?.enableTextStroke !== false,
          enableTextDeformation: module.config?.enableTextDeformation !== false,
          textPlacementMode: module.config?.textPlacementMode || (module as any).textPlacementMode,
          addTextButtonLabel: module.config?.addTextButtonLabel || (module as any).addTextButtonLabel
        };
        
        console.log('📦 Config texte finale dans snapshot:', {
          hasTextColorPalette: !!resolved.config.textColorPalette,
          hasTextStrokePalette: !!resolved.config.textStrokePalette,
          hasTextConstraints: !!resolved.config.textConstraints,
          textConstraints: resolved.config.textConstraints,
          moduleTextStrokeMinWidth: (module as any).textStrokeMinWidth,
          moduleTextStrokeMaxWidth: (module as any).textStrokeMaxWidth,
          moduleTextBaseStrokeWidth: (module as any).textBaseStrokeWidth
        });
      }

      return resolved;
    })
  );

  return resolvedModules;
}

/**
 * Résout l'état par défaut depuis les selectedItems des modules
 */
function resolveDefaultState(builderData: any): Record<string, any> {
  const defaultState: Record<string, any> = {};

  if (builderData.customizationModules) {
    builderData.customizationModules.forEach((module: any) => {
      if (module.selectedItems) {
        if (module.selectedItems.design2DId) {
          defaultState.design2DId = module.selectedItems.design2DId;
        }
        if (module.selectedItems.colorId) {
          defaultState.colorId = module.selectedItems.colorId;
        }
      }
    });
  }

  // Ajouter le design2DId global si présent
  if (builderData.design2DId) {
    defaultState.design2DId = builderData.design2DId;
  }

  return defaultState;
}

/**
 * Résout les zones de texte depuis le modèle 3D
 */
async function resolveTextZones(model3DId: string | null): Promise<Snapshot['textZones']> {
  if (!model3DId) {
    return [];
  }

  // Essayer d'abord 'zones', puis 'text_zones' en fallback
  let { data: zones, error } = await supabaseAdmin
    .from('zones')
    .select('*')
    .eq('model3d_id', model3DId); // Utiliser model3d_id (sans underscore) comme suggéré par l'erreur

  // Si 'zones' n'existe pas ou erreur de colonne, essayer 'text_zones'
  if ((error && error.code === 'PGRST205') || (error && error.code === '42703')) {
    const result = await supabaseAdmin
      .from('text_zones')
      .select('*')
      .eq('model_id', model3DId);
    zones = result.data;
    error = result.error;
  }

  if (error) {
    console.warn('⚠️ Aucune zone de texte trouvée pour le modèle:', model3DId, {
      errorCode: error.code,
      errorMessage: error.message,
      errorDetails: error.details,
      errorHint: error.hint
    });
    return [];
  }
  
  if (!zones || zones.length === 0) {
    console.warn('⚠️ Aucune zone de texte trouvée pour le modèle:', model3DId, '(table trouvée mais vide)');
    return [];
  }
  
  console.log(`✅ ${zones.length} zone(s) de texte trouvée(s) pour le modèle: ${model3DId}`);

  return zones.map((zone: any) => ({
    id: zone.id,
    name: zone.name,
    categories: zone.categories || [],
    zone_category: zone.zone_category || zone.zoneCategory || 'torse',
    position: zone.position || [0, 0, 0],
    default_text_width: zone.default_text_width || zone.defaultTextWidth,
    default_text_height: zone.default_text_height || zone.defaultTextHeight,
    default_logo_width: zone.default_logo_width || zone.defaultLogoWidth,
    default_logo_height: zone.default_logo_height || zone.defaultLogoHeight,
    thumbnail_url: zone.thumbnail_url || zone.thumbnailUrl,
    view: zone.view || 'front',
    default_text: zone.default_text || zone.defaultText || '',
    default_font_size: zone.default_font_size || zone.defaultFontSize,
    default_rotation: zone.default_rotation || zone.defaultRotation || 0,
    width: zone.width,
    height: zone.height,
    rotation: zone.rotation
  }));
}

/**
 * Résout toutes les polices depuis les fontGroups des modules
 */
async function resolveFonts(customizationModules: any[]): Promise<Snapshot['fonts']> {
  const fontGroupIds = new Set<string>();
  
  // Collecter tous les fontGroupIds depuis les modules texte
  customizationModules.forEach((module: any) => {
    const moduleType = module.contentType || module.type;
    if (moduleType === 'text') {
      const ids = module.selectedItems?.fontGroupIds || module.config?.fontGroupIds || [];
      ids.forEach((id: string) => fontGroupIds.add(id));
    }
  });

  if (fontGroupIds.size === 0) {
    return [];
  }

  // Récupérer tous les fontGroups (pour vérification)
  const { data: fontGroups, error: fontGroupsError } = await supabaseAdmin
    .from('font_groups')
    .select('*')
    .in('id', Array.from(fontGroupIds));

  if (fontGroupsError) {
    console.warn('⚠️ Erreur lors de la récupération des fontGroups:', fontGroupsError.message);
  }

  console.log(`📝 FontGroups récupérés: ${fontGroups?.length || 0}`, fontGroups?.map((g: any) => ({
    id: g.id,
    name: g.name
  })) || []);

  // Récupérer directement les fonts depuis la table fonts en filtrant par font_group_id
  // La structure est : fonts.font_group_id → font_groups.id (pas de table de jointure)
  const { data: fonts, error: fontsError } = await supabaseAdmin
    .from('fonts')
    .select('*')
    .in('font_group_id', Array.from(fontGroupIds));

  if (fontsError) {
    console.warn('⚠️ Erreur lors de la récupération des fonts:', fontsError.message);
    return [];
  }

  if (!fonts || fonts.length === 0) {
    console.warn('⚠️ Aucune font trouvée pour les fontGroups:', Array.from(fontGroupIds));
    return [];
  }
  
  console.log(`✅ ${fonts.length} font(s) trouvée(s) pour ${fontGroupIds.size} fontGroup(s)`);

  return fonts.map((font: any) => ({
    id: font.id,
    name: font.name,
    display_name: font.display_name || font.name,
    font_url: font.font_url || font.file_url || font.fontUrl,
    format: font.format || font.file_type || 'woff2',
    category: font.category
  }));
}

/**
 * Résout les couleurs finales (mesh → hex) pour le viewer
 * Utilise color_mappings du design2D si disponible, sinon utilise les meshes des couleurs
 * IMPORTANT: Les color_mappings contiennent les IDs des couleurs, il faut les résoudre en hex
 */
function resolveColors(
  customizationModules: Snapshot['customizationModules'],
  design2D?: Snapshot['design2D']
): Record<string, string> {
  const resolvedColors: Record<string, string> = {};
  
  // Trouver le module colors
  const colorModule = customizationModules.find(m => m.type === 'colors');
  if (!colorModule?.allowedColors || colorModule.allowedColors.length === 0) {
    return resolvedColors;
  }
  
  const allowedColors = colorModule.allowedColors; // Type guard pour éviter les erreurs
  const colorMappings = design2D?.color_mappings || {};
  
  // Si on a des color_mappings, les utiliser pour mapper les couleurs aux meshes
  if (Object.keys(colorMappings).length > 0) {
    console.log('🎨 Résolution des color_mappings:', {
      colorMappings,
      allowedColorsCount: allowedColors.length,
      allowedColors: allowedColors.map((c: any) => ({ id: c.id, hex: c.hex, label: c.label }))
    });
    
    Object.keys(colorMappings).forEach((colorClass) => {
      const colorId = colorMappings[colorClass];
      console.log(`  → Résolution de ${colorClass}: colorId = ${colorId}`);
      
      // Extraire l'hex de la fin du colorId si le format est {paletteId}-{index}-{hex}
      // Exemple: '137bd805-9309-4169-b291-568ec149c057-1-#0F34FE' → '#0F34FE'
      let hexToMatch: string | null = null;
      if (String(colorId).includes('-#')) {
        // Format: {paletteId}-{index}-{hex}
        const parts = String(colorId).split('-#');
        if (parts.length > 1) {
          hexToMatch = '#' + parts[parts.length - 1];
          console.log(`    📍 Hex extrait du colorId: ${hexToMatch}`);
        }
      } else if (String(colorId).startsWith('#')) {
        // Format: {hex} directement
        hexToMatch = String(colorId);
      }
      
      // Chercher la couleur correspondante dans allowedColors
      let color = allowedColors.find((c: any) => {
        // Comparer par ID si disponible
        if (c.id && c.id === colorId) {
          console.log(`    ✅ Trouvé par ID: ${c.id} → ${c.hex}`);
          return true;
        }
        // Comparer par hex extrait
        if (hexToMatch && c.hex) {
          const cHex = c.hex.toLowerCase().replace('#', '');
          const matchHex = hexToMatch.toLowerCase().replace('#', '');
          if (cHex === matchHex) {
            console.log(`    ✅ Trouvé par hex extrait: ${c.hex} === ${hexToMatch}`);
            return true;
          }
        }
        // Comparer par hex direct (avec ou sans #)
        const cHex = c.hex?.toLowerCase().replace('#', '');
        const colorIdHex = String(colorId).toLowerCase().replace('#', '');
        if (cHex && cHex === colorIdHex) {
          console.log(`    ✅ Trouvé par hex: ${c.hex} === ${colorId}`);
          return true;
        }
        return false;
      });
      
      if (!color) {
        // Si la couleur n'est pas trouvée, essayer de trouver une couleur par index
        // Les color_mappings peuvent contenir des indices (0, 1, 2) au lieu d'IDs
        const colorIndex = parseInt(String(colorId));
        if (!isNaN(colorIndex) && allowedColors[colorIndex]) {
          color = allowedColors[colorIndex];
          console.log(`    ✅ Trouvé par index: [${colorIndex}] → ${color.hex}`);
        }
      }
      
      if (color) {
        resolvedColors[colorClass] = color.hex;
        console.log(`    ✅ Couleur résolue pour ${colorClass}: ${color.hex}`);
      } else {
        console.warn(`    ⚠️ Couleur non trouvée pour ${colorClass} (colorId: ${colorId}, hexToMatch: ${hexToMatch})`);
        // Fallback: utiliser la première couleur disponible
        if (allowedColors.length > 0) {
          resolvedColors[colorClass] = allowedColors[0].hex;
          console.log(`    ⚠️ Utilisation de la première couleur disponible: ${allowedColors[0].hex}`);
        }
      }
    });
  } else {
    // Sinon, utiliser les meshes des couleurs directement
    allowedColors.forEach((color: any) => {
      const mesh = color.mesh || 'primary';
      if (!resolvedColors[mesh]) {
        resolvedColors[mesh] = color.hex;
      }
    });
  }
  
  console.log('🎨 Couleurs résolues pour snapshot:', {
    resolvedColors,
    hasColorMappings: Object.keys(colorMappings).length > 0,
    colorMappings,
    allowedColorsCount: allowedColors.length,
    allowedColors: allowedColors.map((c: any) => ({ id: c.id, hex: c.hex, label: c.label }))
  });
  
  return resolvedColors;
}

/**
 * Résout les paramètres de caméra
 */
function resolveCameraSettings(settings: any): Snapshot['cameraSettings'] {
  return {
    initialZoom: settings.initialZoom || 5,
    initialRotation: settings.initialRotation || 0,
    minZoom: settings.minZoom || 1,
    maxZoom: settings.maxZoom || 10,
    zoomSpeed: settings.zoomSpeed,
    rotateSpeed: settings.rotateSpeed,
    viewDistance: settings.viewDistance
  };
}

/**
 * Résout les paramètres du viewer 3D (lumières, environnement)
 */
function resolveViewerSettings(settings: any): Snapshot['viewerSettings'] {
  if (!settings) {
    return undefined;
  }
  
  // Chercher viewer dans settings.viewer ou directement dans settings
  const viewer = settings.viewer || settings;
  
  if (!viewer || (!viewer.lights && !viewer.environment)) {
    return undefined;
  }
  
  return {
    lights: viewer.lights ? {
      ambientLight: viewer.lights.ambientLight ? {
        intensity: viewer.lights.ambientLight.intensity ?? 0.5
      } : undefined,
      directionalLights: (viewer.lights.directionalLights || []).map((light: any) => ({
        position: light.position || [10, 10, 5],
        intensity: light.intensity ?? 1
      }))
    } : undefined,
    environment: viewer.environment ? {
      preset: viewer.environment.preset || "city"
    } : undefined
  };
}

