import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSubdomain } from '@/lib/get-subdomain';

// POST - Ajouter ou mettre à jour une vue de caméra pour un modèle
export async function POST(
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

    const newView = await request.json();
    const modelId = params.id;

    // Récupérer le modèle actuel avec ses vues
    const { data: model, error: fetchError } = await supabaseAdmin
      .from('models_3d')
      .select('camera_views')
      .eq('id', modelId)
      .eq('subdomain', subdomain)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Model not found' },
          { status: 404 }
        );
      }
      throw fetchError;
    }

    // Récupérer les vues existantes ou initialiser un tableau vide
    let cameraViews = model.camera_views || [];

    // Vérifier si une vue avec le même nom existe déjà
    const existingIndex = cameraViews.findIndex((view: any) => view.name === newView.name);

    if (existingIndex >= 0) {
      // Mettre à jour la vue existante
      cameraViews[existingIndex] = newView;
    } else {
      // Ajouter la nouvelle vue
      cameraViews.push(newView);
    }

    // Sauvegarder les vues mises à jour
    const { data: updatedModel, error: updateError } = await supabaseAdmin
      .from('models_3d')
      .update({ camera_views: cameraViews })
      .eq('id', modelId)
      .eq('subdomain', subdomain)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json(updatedModel);
  } catch (error: any) {
    console.error('Error updating camera views:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update camera views' },
      { status: 500 }
    );
  }
}