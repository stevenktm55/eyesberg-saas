import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

// POST: Détecter automatiquement les matériaux d'un modèle via le configurateur
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const modelId = params.id;
    const { detectedMaterials } = await request.json();

    if (!modelId) {
      return NextResponse.json({ error: "Model ID required" }, { status: 400 });
    }

    if (!Array.isArray(detectedMaterials)) {
      return NextResponse.json({ error: "detectedMaterials must be an array" }, { status: 400 });
    }

    console.log('🔍 Mise à jour des matériaux détectés pour le modèle:', modelId);
    console.log('📦 Matériaux détectés:', detectedMaterials);

    // Récupérer le modèle actuel
    const { data: model, error: modelError } = await supabase
      .from('models_3d')
      .select('*')
      .eq('id', modelId)
      .single();

    if (modelError || !model) {
      console.error('❌ Modèle non trouvé:', modelError);
      return NextResponse.json({ error: "Modèle non trouvé" }, { status: 404 });
    }

    // Mettre à jour les métadonnées avec les matériaux détectés
    const updatedMetadata = {
      ...model.metadata,
      materialsSchema: detectedMaterials.reduce((acc, name) => {
        acc[name] = { name };
        return acc;
      }, {} as Record<string, any>)
    };

    // Sauvegarder en base
    const { error: updateError } = await supabase
      .from('models_3d')
      .update({ metadata: updatedMetadata })
      .eq('id', modelId);

    if (updateError) {
      console.error('❌ Erreur mise à jour modèle:', updateError);
      return NextResponse.json({ error: "Erreur lors de la sauvegarde" }, { status: 500 });
    }

    console.log('✅ Matériaux détectés sauvegardés avec succès');

    return NextResponse.json({
      success: true,
      materials: detectedMaterials,
      message: `${detectedMaterials.length} matériaux détectés et sauvegardés`
    });

  } catch (err) {
    console.error("POST /api/models/[id]/detect-materials error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
