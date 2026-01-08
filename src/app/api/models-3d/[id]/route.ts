import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSubdomain } from '@/lib/get-subdomain';

// GET - Récupérer un modèle 3D spécifique par ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const subdomain = await getSubdomain(request);
    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain is required' },
        { status: 400 }
      );
    }

    const { data: model, error } = await supabaseAdmin
      .from('models_3d')
      .select(`
        id,
        name,
        glb_url,
        thumbnail_url,
        description,
        metadata,
        created_at,
        updated_at,
        subdomain,
        camera_views,
        model_parts (
          id,
          name,
          material_map_id,
          material_maps (
            id,
            name
          )
        )
      `)
      .eq('id', params.id)
      .eq('subdomain', subdomain)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Model not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json(model);
  } catch (error: any) {
    console.error('Error fetching model:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch model' },
      { status: 500 }
    );
  }
}