import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSubdomain } from '@/lib/get-subdomain';

// PUT - Mettre à jour les parties d'un modèle 3D (assigner des material maps)
export async function PUT(request: NextRequest) {
  try {
    const subdomain = await getSubdomain(request);
    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { modelId, parts } = body;

    if (!modelId || !Array.isArray(parts)) {
      return NextResponse.json(
        { error: 'modelId and parts array are required' },
        { status: 400 }
      );
    }

    // Vérifier que le modèle appartient au sous-domaine
    const { data: model, error: modelError } = await supabaseAdmin
      .from('models_3d')
      .select('id')
      .eq('id', modelId)
      .eq('subdomain', subdomain)
      .single();

    if (modelError || !model) {
      return NextResponse.json(
        { error: 'Model not found or access denied' },
        { status: 404 }
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

    // Récupérer les parties mises à jour (via la jointure avec models_3d pour vérifier le subdomain)
    const { data: updatedParts, error } = await supabaseAdmin
      .from('model_parts')
      .select(`
        *,
        material_maps (
          id,
          name
        ),
        models_3d!inner (
          subdomain
        )
      `)
      .eq('model_3d_id', modelId)
      .eq('models_3d.subdomain', subdomain);

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

