import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// PUT - Mettre à jour les parties d'un modèle 3D (assigner des material maps)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { modelId, parts } = body;

    if (!modelId || !Array.isArray(parts)) {
      return NextResponse.json(
        { error: 'modelId and parts array are required' },
        { status: 400 }
      );
    }

    // Mettre à jour chaque partie
    const updates = parts.map((part: { id: string; materialMapId: string | null }) =>
      supabaseAdmin
        .from('model_parts')
        .update({ material_map_id: part.materialMapId })
        .eq('id', part.id)
    );

    await Promise.all(updates);

    // Récupérer les parties mises à jour
    const { data: updatedParts, error } = await supabaseAdmin
      .from('model_parts')
      .select(`
        *,
        material_maps (
          id,
          name
        )
      `)
      .eq('model_3d_id', modelId);

    if (error) throw error;

    return NextResponse.json(updatedParts);
  } catch (error: any) {
    console.error('Error updating model parts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update model parts' },
      { status: 500 }
    );
  }
}

