import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

// GET: Récupérer les matériaux et configurations d'un modèle spécifique
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const modelId = params.id;

    if (!modelId) {
      return NextResponse.json({ error: "Model ID required" }, { status: 400 });
    }

    // Récupérer le modèle depuis Supabase
    const { data: model, error: modelError } = await supabase
      .from('models_3d')
      .select('*')
      .eq('id', modelId)
      .single();

    if (modelError || !model) {
      return NextResponse.json({ error: "Modèle non trouvé" }, { status: 404 });
    }

    // Extraire les noms des matériaux depuis les métadonnées
    let materials = [];
    
    // Méthode 1: Depuis materialsSchema (matériaux détectés automatiquement)
    const materialsSchema = model.metadata?.materialsSchema || {};
    if (Object.keys(materialsSchema).length > 0) {
      materials = Object.keys(materialsSchema);
    }
    
    // Méthode 2: Depuis material_maps (matériaux déjà configurés)
    const materialMapsKeys = Object.keys(model.material_maps || {});
    
    // Méthode 3: Si aucun matériau détecté ou configuré, retourner une liste vide
    if (materials.length === 0) {
      materials = []; // Pas de matériaux par défaut pour éviter le mélange
    }
    
    // S'assurer que tous les matériaux configurés sont inclus (seulement pour ce modèle)
    materialMapsKeys.forEach(key => {
      if (!materials.includes(key)) {
        materials.push(key);
      }
    });

    // Récupérer les material maps
    let materialMaps = model.material_maps || {};

    // Enrichir avec les intensités depuis material_map_files via model_parts
    try {
      // D'abord, vérifier si des model_parts existent
      const { data: allParts, error: checkError } = await supabase
        .from('model_parts')
        .select('id, name, material_map_id, model_3d_id')
        .eq('model_3d_id', modelId);
      
      // Ensuite, récupérer avec la jointure (inclure file_url pour les URLs des textures)
      const { data: modelParts, error: partsError } = await supabase
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
      
      if (!partsError && modelParts && modelParts.length > 0) {
        modelParts.forEach((part: any) => {
          const materialName = part.name;
          const materialMap = part.material_maps;
          
          if (materialMap && materialMap.material_map_files) {
            // Initialiser le material map si nécessaire
            if (!materialMaps[materialName]) {
              materialMaps[materialName] = { materialName };
            }
            
            const files = materialMap.material_map_files || [];
            
            // Variables globales pour repeatX/repeatY
            let globalRepeatX: number | undefined;
            let globalRepeatY: number | undefined;
            
            // Enrichir avec les intensités et URLs depuis material_map_files
            files.forEach((file: any) => {
              const mapType = file.map_type?.toLowerCase();
              const fileUrl = file.file_url;
              const intensity = file.intensity !== undefined ? file.intensity / 100 : 1;
              const scale = file.scale !== undefined ? file.scale : 1;
              
              if (!fileUrl) return;
              
              // Appliquer les dimensions (repeat) globalement
              if (scale !== 1 && globalRepeatX === undefined) {
                globalRepeatX = scale;
                globalRepeatY = scale;
                materialMaps[materialName].repeatX = scale;
                materialMaps[materialName].repeatY = scale;
              }
              materialMaps[materialName].scaleX = globalRepeatX || scale;
              materialMaps[materialName].scaleY = globalRepeatY || scale;
              materialMaps[materialName].tilingX = globalRepeatX || scale;
              materialMaps[materialName].tilingY = globalRepeatY || scale;
              
              // Mapper les types de fichiers vers les propriétés attendues par ModelViewer
              if (mapType === 'normal' || mapType === 'normalmap') {
                materialMaps[materialName].normalMap = fileUrl;
                materialMaps[materialName].normal = fileUrl;
                materialMaps[materialName].normalTexture = fileUrl;
                if (typeof materialMaps[materialName].normalIntensity === 'undefined') {
                  materialMaps[materialName].normalIntensity = intensity;
                  materialMaps[materialName].normalScale = intensity;
                  materialMaps[materialName].normalScaleX = intensity;
                  materialMaps[materialName].normalScaleY = intensity;
                }
              } else if (mapType === 'roughness' || mapType === 'roughnessmap') {
                materialMaps[materialName].roughnessMap = fileUrl;
                materialMaps[materialName].roughness = fileUrl;
                materialMaps[materialName].roughnessTexture = fileUrl;
                if (typeof materialMaps[materialName].roughnessValue === 'undefined') {
                  materialMaps[materialName].roughnessValue = intensity;
                  materialMaps[materialName].roughnessFactor = intensity;
                }
              } else if (mapType === 'metalness' || mapType === 'metallic' || mapType === 'metalnessmap') {
                materialMaps[materialName].metalnessMap = fileUrl;
                materialMaps[materialName].metallicMap = fileUrl;
                materialMaps[materialName].metalness = fileUrl;
                materialMaps[materialName].metalnessTexture = fileUrl;
                if (typeof materialMaps[materialName].metalnessValue === 'undefined') {
                  materialMaps[materialName].metalnessValue = intensity;
                  materialMaps[materialName].metalnessFactor = intensity;
                  materialMaps[materialName].metallic = intensity;
                }
              } else if (mapType === 'ao' || mapType === 'ambientocclusion' || mapType === 'occlusion' || mapType === 'aomap') {
                materialMaps[materialName].aoMap = fileUrl;
                materialMaps[materialName].ambientOcclusionMap = fileUrl;
                materialMaps[materialName].occlusionMap = fileUrl;
                if (typeof materialMaps[materialName].aoIntensity === 'undefined') {
                  materialMaps[materialName].aoIntensity = intensity;
                  materialMaps[materialName].occlusionIntensity = intensity;
                }
              } else if (mapType === 'orm' || mapType === 'occlusionroughnessmetalness') {
                materialMaps[materialName].ormMap = fileUrl;
                materialMaps[materialName].occlusionRoughnessMetalnessMap = fileUrl;
                materialMaps[materialName].occlusion_roughness_metalness = fileUrl;
              }
            });
            
            // Indexer par plusieurs variantes du nom pour faciliter la correspondance
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
    } catch (enrichError) {
      // Continuer même si l'enrichissement échoue
    }

    return NextResponse.json({
      modelId,
      materials,
      materialMaps,
      material_maps: materialMaps // Alias pour compatibilité
    });

  } catch (err) {
    console.error("GET /api/models/[id]/materials error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}