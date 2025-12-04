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
    const materialMaps = model.material_maps || {};

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