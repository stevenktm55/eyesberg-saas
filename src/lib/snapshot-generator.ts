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
  };
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
    model3DId: builderData.model3DId,
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
    modulesCount: builderData.customizationModules?.length || 0
  });

  const model3D = await resolveModel3D(builderData.model3DId);
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
  const textZones = await resolveTextZones(builderData.model3DId);
  
  // Résoudre toutes les polices depuis les fontGroups des modules
  const fonts = await resolveFonts(builderData.customizationModules || []);

  const snapshot: Snapshot = {
    productId: shopifyProductId,
    version: 'v1',
    publishedAt: new Date().toISOString(),
    model3D: model3D,
    design2D: design2D,
    customizationModules: await resolveCustomizationModules(builderData.customizationModules || []),
    textZones: textZones.length > 0 ? textZones : undefined,
    fonts: fonts.length > 0 ? fonts : undefined,
    defaultState: resolveDefaultState(builderData),
    cameraSettings: resolveCameraSettings(builderData.settings || {})
  };

  // Log final pour vérifier que le snapshot contient bien le design2D
  console.log('📦 Snapshot final créé:', {
    hasModel3D: !!snapshot.model3D,
    hasDesign2D: !!snapshot.design2D,
    design2DUrl: snapshot.design2D?.url,
    design2DInSnapshot: snapshot.design2D !== undefined,
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
    hasThumbnailUrl: !!design.thumbnail_url
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

  return {
    url: design.svg_url || '',
    thumbnailUrl: design.thumbnail_url || undefined,
    colors: Object.keys(colors).length > 0 ? colors : undefined
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
        // Résoudre la palette de couleurs
        const paletteId = module.config?.paletteId || module.selectedItems?.paletteId;
        if (paletteId) {
          const { data: palette } = await supabaseAdmin
            .from('color_palettes')
            .select('*')
            .eq('id', paletteId)
            .single();

          if (palette && palette.colors) {
            resolved.allowedColors = palette.colors.map((color: any) => ({
              label: color.name || color.label || '',
              hex: color.hex || color.value || '#000000',
              mesh: color.mesh || 'primary',
              id: color.id || color.hex
            }));
          }
        }
        resolved.default = module.selectedItems?.colorId || module.default;
        
        // Préserver toute la config du module couleurs
        resolved.config = {
          ...resolved.config,
          ...module.config,
          paletteId: paletteId
        };
      } else if (moduleType === 'designs-2d') {
        // Résoudre les designs autorisés
        const allowedIds = module.selectedItems?.design2DIds || module.config?.allowedDesignIds || [];
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
              thumbnailUrl: design.thumbnail_url || undefined
            }));
          }
        }
        resolved.default = module.selectedItems?.design2DId || module.default;
      } else if (moduleType === 'logos') {
        // Pour les logos, on garde la config mais on résout les bibliothèques avec leurs logos et variantes
        const libraryIds = module.config?.logoLibraryIds || module.selectedItems?.logoLibraryIds || [];
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
    .eq('model_3d_id', model3DId);

  // Si 'zones' n'existe pas, essayer 'text_zones'
  if (error && error.code === 'PGRST205') {
    const result = await supabaseAdmin
      .from('text_zones')
      .select('*')
      .eq('model_id', model3DId);
    zones = result.data;
    error = result.error;
  }

  if (error || !zones) {
    console.warn('⚠️ Aucune zone de texte trouvée pour le modèle:', model3DId);
    return [];
  }

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
    view: zone.view || 'front'
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

  // Récupérer tous les fontGroups
  const { data: fontGroups, error } = await supabaseAdmin
    .from('font_groups')
    .select('*')
    .in('id', Array.from(fontGroupIds));

  if (error || !fontGroups) {
    console.warn('⚠️ Aucun fontGroup trouvé:', error?.message);
    return [];
  }

  // Collecter toutes les polices depuis tous les fontGroups
  const fontIds = new Set<string>();
  fontGroups.forEach((group: any) => {
    if (group.fonts && Array.isArray(group.fonts)) {
      group.fonts.forEach((fontId: string) => fontIds.add(fontId));
    }
  });

  if (fontIds.size === 0) {
    return [];
  }

  // Récupérer toutes les polices
  const { data: fonts, error: fontsError } = await supabaseAdmin
    .from('fonts')
    .select('*')
    .in('id', Array.from(fontIds));

  if (fontsError || !fonts) {
    console.warn('⚠️ Aucune police trouvée:', fontsError?.message);
    return [];
  }

  return fonts.map((font: any) => ({
    id: font.id,
    name: font.name,
    display_name: font.display_name || font.name,
    font_url: font.font_url || font.fontUrl,
    format: font.format || 'woff2',
    category: font.category
  }));
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

