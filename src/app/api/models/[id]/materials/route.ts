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

    console.log('🔍 Récupération des matériaux pour le modèle:', modelId);

    // Récupérer le modèle depuis Supabase
    const { data: model, error: modelError } = await supabase
      .from('models_3d')
      .select('*')
      .eq('id', modelId)
      .single();

    if (modelError || !model) {
      console.error('❌ Modèle non trouvé:', modelError);
      return NextResponse.json({ error: "Modèle non trouvé" }, { status: 404 });
    }

    // Extraire les noms des matériaux depuis les métadonnées
    console.log('🔍 Model metadata:', model.metadata);
    console.log('🔍 MaterialsSchema:', model.metadata?.materialsSchema);
    
    let materials = [];
    
    // Méthode 1: Depuis materialsSchema (matériaux détectés automatiquement)
    const materialsSchema = model.metadata?.materialsSchema || {};
    if (Object.keys(materialsSchema).length > 0) {
      materials = Object.keys(materialsSchema);
      console.log('📦 Matériaux depuis materialsSchema (auto-détectés):', materials);
    }
    
    // Méthode 2: Depuis material_maps (matériaux déjà configurés)
    const materialMapsKeys = Object.keys(model.material_maps || {});
    console.log('🔍 Clés material_maps existantes:', materialMapsKeys);
    
    // Méthode 3: Si aucun matériau détecté ou configuré, retourner une liste vide
    if (materials.length === 0) {
      console.log('🔍 Aucun matériau détecté ou configuré pour le modèle:', modelId);
      console.log('💡 Ouvrez le configurateur avec ce modèle pour déclencher la détection automatique');
      materials = []; // Pas de matériaux par défaut pour éviter le mélange
    }
    
    // S'assurer que tous les matériaux configurés sont inclus (seulement pour ce modèle)
    materialMapsKeys.forEach(key => {
      if (!materials.includes(key)) {
        materials.push(key);
        console.log('📦 Matériau configuré ajouté:', key);
      }
    });

    // Récupérer les material maps
    let materialMaps = model.material_maps || {};

    // Enrichir avec les intensités depuis material_map_files via model_parts
    try {
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
      
      if (!partsError && modelParts) {
        console.log('🔍 Model parts trouvés:', modelParts.length, 'parts:', JSON.stringify(modelParts, null, 2));
        
        modelParts.forEach((part: any) => {
          const materialName = part.name;
          const materialMap = part.material_maps;
          
          console.log(`🔍 Processing part "${materialName}":`, {
            hasMaterialMap: !!materialMap,
            materialMapId: materialMap?.id,
            hasFiles: !!materialMap?.material_map_files,
            files: materialMap?.material_map_files
          });
          
          if (materialMap && materialMap.material_map_files) {
            // Initialiser le material map si nécessaire
            if (!materialMaps[materialName]) {
              materialMaps[materialName] = { materialName };
              console.log(`📦 Créé material map pour "${materialName}"`);
            }
            
            const files = materialMap.material_map_files || [];
            console.log(`📁 Fichiers trouvés pour "${materialName}":`, files);
            
            // Enrichir avec les intensités depuis material_map_files si elles ne sont pas déjà présentes
            files.forEach((file: any) => {
              console.log(`🔍 Processing file:`, { mapType: file.map_type, intensity: file.intensity, scale: file.scale });
              
              if (file.map_type === 'normal') {
                if (typeof materialMaps[materialName].normalIntensity === 'undefined') {
                  materialMaps[materialName].normalIntensity = file.intensity / 100; // Convertir 0-100 → 0-1
                  console.log(`✅ Ajouté normalIntensity: ${materialMaps[materialName].normalIntensity} pour "${materialName}"`);
                }
                if (file.scale && typeof materialMaps[materialName].repeatX === 'undefined') {
                  materialMaps[materialName].repeatX = file.scale;
                  materialMaps[materialName].repeatY = file.scale;
                  console.log(`✅ Ajouté repeatX/Y: ${file.scale} pour "${materialName}"`);
                }
              } else if (file.map_type === 'roughness') {
                if (typeof materialMaps[materialName].roughnessValue === 'undefined') {
                  materialMaps[materialName].roughnessValue = file.intensity / 100; // Convertir 0-100 → 0-1
                  console.log(`✅ Ajouté roughnessValue: ${materialMaps[materialName].roughnessValue} pour "${materialName}"`);
                }
              } else if (file.map_type === 'metallic') {
                if (typeof materialMaps[materialName].metalnessValue === 'undefined') {
                  materialMaps[materialName].metalnessValue = file.intensity / 100; // Convertir 0-100 → 0-1
                  console.log(`✅ Ajouté metalnessValue: ${materialMaps[materialName].metalnessValue} pour "${materialName}"`);
                }
              } else if (file.map_type === 'ao') {
                if (typeof materialMaps[materialName].aoIntensity === 'undefined') {
                  materialMaps[materialName].aoIntensity = file.intensity / 100; // Convertir 0-100 → 0-1
                  console.log(`✅ Ajouté aoIntensity: ${materialMaps[materialName].aoIntensity} pour "${materialName}"`);
                }
              }
            });
            
            console.log(`✅ Material map "${materialName}" enrichi depuis material_map_files:`, materialMaps[materialName]);
          } else {
            console.log(`⚠️ Pas de material_map_files pour "${materialName}"`);
          }
        });
      } else if (partsError) {
        console.error('❌ Erreur récupération model_parts:', partsError);
      }
    } catch (enrichError) {
      console.error('⚠️ Erreur enrichissement material maps:', enrichError);
      // Continuer même si l'enrichissement échoue
    }

    console.log('📦 Matériaux finaux trouvés pour le modèle', modelId, ':', materials);
    console.log('📦 Material maps pour le modèle', modelId, ':', materialMaps);
    
    // Debug: log les valeurs d'intensité pour chaque matériau
    Object.entries(materialMaps).forEach(([matName, matConfig]: [string, any]) => {
      console.log(`🔍 Material map "${matName}":`, {
        roughnessValue: matConfig.roughnessValue,
        metalnessValue: matConfig.metalnessValue,
        aoIntensity: matConfig.aoIntensity,
        normalIntensity: matConfig.normalIntensity,
        normalScale: matConfig.normalScale,
        normalScaleX: matConfig.normalScaleX,
        normalScaleY: matConfig.normalScaleY,
        repeatX: matConfig.repeatX,
        repeatY: matConfig.repeatY
      });
    });

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