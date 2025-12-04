import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

// POST: Mettre à jour les valeurs de repeat (tiling) et intensités pour un matériau
export async function POST(request: Request) {
  try {
    const { 
      modelId, 
      materialName, 
      repeatX, 
      repeatY,
      normalIntensity,
      roughnessValue,
      metalnessValue,
      aoIntensity
    } = await request.json();

    if (!modelId || !materialName || repeatX === undefined || repeatY === undefined) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    console.log('🔄 Mise à jour repeat/intensités:', { 
      modelId, 
      materialName, 
      repeatX, 
      repeatY,
      normalIntensity,
      roughnessValue,
      metalnessValue,
      aoIntensity
    });
    
    // Récupérer le modèle depuis Supabase
    const { data: model, error: modelError } = await supabaseAdmin
      .from('models_3d')
      .select('*')
      .eq('id', modelId)
      .single();

    if (modelError || !model) {
      console.error('❌ Modèle non trouvé:', modelError);
      return NextResponse.json({ error: "Modèle non trouvé" }, { status: 404 });
    }

    // Initialiser la structure si nécessaire
    const materialMaps = model.material_maps || {};
    if (!materialMaps[materialName]) {
      materialMaps[materialName] = { materialName };
    }

    // Mettre à jour les valeurs de repeat et intensités (PRÉSERVER les maps existantes)
    materialMaps[materialName] = {
      ...materialMaps[materialName],
      repeatX,
      repeatY
    };
    
    // Ajouter les intensités si elles sont définies
    if (normalIntensity !== undefined) {
      materialMaps[materialName].normalIntensity = normalIntensity;
      console.log('✅ Sauvegarde normalIntensity:', normalIntensity, 'pour', materialName);
    } else {
      console.log('⚠️ normalIntensity est undefined, pas sauvegardé pour', materialName);
    }
    if (roughnessValue !== undefined) {
      materialMaps[materialName].roughnessValue = roughnessValue;
      console.log('✅ Sauvegarde roughnessValue:', roughnessValue, 'pour', materialName);
    } else {
      console.log('⚠️ roughnessValue est undefined, pas sauvegardé pour', materialName);
    }
    if (metalnessValue !== undefined) {
      materialMaps[materialName].metalnessValue = metalnessValue;
      console.log('✅ Sauvegarde metalnessValue:', metalnessValue, 'pour', materialName);
    } else {
      console.log('⚠️ metalnessValue est undefined, pas sauvegardé pour', materialName);
    }
    if (aoIntensity !== undefined) {
      materialMaps[materialName].aoIntensity = aoIntensity;
      console.log('✅ Sauvegarde aoIntensity:', aoIntensity, 'pour', materialName);
    } else {
      console.log('⚠️ aoIntensity est undefined, pas sauvegardé pour', materialName);
    }

    console.log('📦 Material map final pour', materialName, ':', JSON.stringify(materialMaps[materialName], null, 2));

    // Sauvegarder dans Supabase
    const { error: updateError } = await supabaseAdmin
      .from('models_3d')
      .update({ material_maps: materialMaps })
      .eq('id', modelId);

    if (updateError) {
      console.error('❌ Erreur mise à jour:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    console.log('✅ Repeat/intensités mis à jour');

    return NextResponse.json({
      success: true,
      materialMaps: materialMaps
    });
  } catch (err) {
    console.error("POST /api/models/material-maps/repeat error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
