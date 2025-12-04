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
      
      // Ensuite, récupérer avec la jointure
      const { data: modelParts, error: partsError } = await supabase
        .from('model_parts')
        .select(`
          name,
          material_map_id,
          material_maps!inner (
            id,
            material_map_files (
              map_type,
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
            
            // Enrichir avec les intensités depuis material_map_files si elles ne sont pas déjà présentes
            files.forEach((file: any) => {
              if (file.map_type === 'normal') {
                if (typeof materialMaps[materialName].normalIntensity === 'undefined') {
                  materialMaps[materialName].normalIntensity = file.intensity / 100; // Convertir 0-100 → 0-1
                }
                if (file.scale && typeof materialMaps[materialName].repeatX === 'undefined') {
                  materialMaps[materialName].repeatX = file.scale;
                  materialMaps[materialName].repeatY = file.scale;
                }
              } else if (file.map_type === 'roughness') {
                if (typeof materialMaps[materialName].roughnessValue === 'undefined') {
                  materialMaps[materialName].roughnessValue = file.intensity / 100; // Convertir 0-100 → 0-1
                }
              } else if (file.map_type === 'metallic') {
                if (typeof materialMaps[materialName].metalnessValue === 'undefined') {
                  materialMaps[materialName].metalnessValue = file.intensity / 100; // Convertir 0-100 → 0-1
                }
              } else if (file.map_type === 'ao') {
                if (typeof materialMaps[materialName].aoIntensity === 'undefined') {
                  materialMaps[materialName].aoIntensity = file.intensity / 100; // Convertir 0-100 → 0-1
                }
              }
            });
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