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
  console.log('📸 Génération du snapshot avec builderData:', {
    model3DId: builderData.model3DId,
    design2DId: builderData.design2DId,
    modulesCount: builderData.customizationModules?.length || 0
  });

  const model3D = await resolveModel3D(builderData.model3DId);
  const design2D = builderData.design2DId ? await resolveDesign2D(builderData.design2DId) : undefined;
  
  console.log('📸 Snapshot résolu:', {
    hasModel3D: !!model3D,
    hasDesign2D: !!design2D,
    design2DUrl: design2D?.url
  });

  const snapshot: Snapshot = {
    productId: shopifyProductId,
    version: 'v1',
    publishedAt: new Date().toISOString(),
    model3D: model3D,
    design2D: design2D,
    customizationModules: await resolveCustomizationModules(builderData.customizationModules || []),
    defaultState: resolveDefaultState(builderData),
    cameraSettings: resolveCameraSettings(builderData.settings || {})
  };

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
  const { data: design, error } = await supabaseAdmin
    .from('designs')
    .select('*')
    .eq('id', designId)
    .single();

  if (error || !design) {
    throw new Error(`Design not found: ${designId}`);
  }

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
      const resolved: Snapshot['customizationModules'][0] = {
        id: module.id,
        type: module.contentType || 'unknown',
        label: module.tabName || module.label || '',
        icon: module.icon,
        iconUrl: module.iconUrl,
        config: module.config || {}
      };

      // Résoudre selon le type de module
      if (module.contentType === 'colors') {
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
              mesh: color.mesh
            }));
          }
        }
        resolved.default = module.selectedItems?.colorId || module.default;
      } else if (module.contentType === 'designs-2d') {
        // Résoudre les designs autorisés
        const allowedIds = module.selectedItems?.design2DIds || module.config?.allowedDesignIds || [];
        if (allowedIds.length > 0) {
          const { data: designs } = await supabaseAdmin
            .from('designs')
            .select('id, name, svg_url, thumbnail_url')
            .in('id', allowedIds);

          if (designs) {
            resolved.allowedDesigns = designs.map((design: any) => ({
              label: design.name || '',
              svgUrl: design.svg_url || '',
              thumbnailUrl: design.thumbnail_url || undefined
            }));
          }
        }
        resolved.default = module.selectedItems?.design2DId || module.default;
      } else if (module.contentType === 'logos') {
        // Pour les logos, on garde la config mais on résout les bibliothèques
        const libraryIds = module.config?.logoLibraryIds || [];
        if (libraryIds.length > 0) {
          const { data: libraries } = await supabaseAdmin
            .from('logo_libraries')
            .select('*')
            .in('id', libraryIds);

          resolved.config = {
            ...resolved.config,
            logoLibraries: libraries || []
          };
        }
      } else if (module.contentType === 'text') {
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

