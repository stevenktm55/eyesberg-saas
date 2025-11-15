import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Récupérer toutes les tailles avec leur guide
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const modelType = searchParams.get('model_type'); // 'maillot' ou 'pantalon'
    
    // 1. Récupérer les tailles actives
    let query = supabase
      .from('sizes')
      .select('*')
      .eq('active', true);
    
    // Filtrer par type de modèle si spécifié
    if (modelType) {
      query = query.eq('model_type', modelType);
    }
    
    const { data: sizes, error: sizesError } = await query.order('display_order', { ascending: true });

    if (sizesError) throw sizesError;

    // 2. Récupérer le guide des tailles pour chaque taille
    const sizesWithGuide = await Promise.all(
      (sizes || []).map(async (size) => {
        const { data: guide } = await supabase
          .from('size_guide')
          .select('*')
          .eq('size_id', size.id)
          .order('measurement_type', { ascending: true });

        return {
          ...size,
          guide: guide || []
        };
      })
    );

    return NextResponse.json(sizesWithGuide);
  } catch (error) {
    console.error('Erreur récupération tailles:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Créer une nouvelle taille
export async function POST(request: Request) {
  try {
    const { name, display_order, model_type, guide } = await request.json();

    // 1. Créer la taille
    const { data: size, error: sizeError } = await supabase
      .from('sizes')
      .insert({
        name,
        display_order: display_order || 0,
        model_type: model_type || 'maillot',
        active: true
      })
      .select()
      .single();

    if (sizeError) throw sizeError;

    // 2. Ajouter le guide des tailles si fourni
    if (guide && guide.length > 0) {
      const guideData = guide.map((item: any) => ({
        size_id: size.id,
        measurement_type: item.measurement_type,
        value: item.value
      }));

      const { error: guideError } = await supabase
        .from('size_guide')
        .insert(guideData);

      if (guideError) throw guideError;
    }

    return NextResponse.json(size);
  } catch (error) {
    console.error('Erreur création taille:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT - Mettre à jour une taille
export async function PUT(request: Request) {
  try {
    const { id, name, display_order, model_type, active, guide } = await request.json();

    // 1. Mettre à jour la taille
    const { error: sizeError } = await supabase
      .from('sizes')
      .update({
        name,
        display_order,
        model_type,
        active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (sizeError) throw sizeError;

    // 2. Mettre à jour le guide (supprimer et recréer)
    if (guide !== undefined) {
      // Supprimer l'ancien guide
      await supabase
        .from('size_guide')
        .delete()
        .eq('size_id', id);

      // Ajouter le nouveau guide
      if (guide.length > 0) {
        const guideData = guide.map((item: any) => ({
          size_id: id,
          measurement_type: item.measurement_type,
          value: item.value
        }));

        await supabase
          .from('size_guide')
          .insert(guideData);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur mise à jour taille:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE - Supprimer une taille
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 });
    }

    const { error } = await supabase
      .from('sizes')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur suppression taille:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
