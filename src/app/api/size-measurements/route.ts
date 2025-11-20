// =====================================================
// API POUR GÉRER LES MESURES DU GUIDE DES TAILLES
// =====================================================
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSubdomain } from '@/lib/get-subdomain';

/**
 * GET /api/size-measurements
 * Récupère les mesures pour un pattern et une taille donnés
 * Query params: patternId, sizeName (optionnel)
 */
export async function GET(request: NextRequest) {
  try {
    const subdomain = await getSubdomain(request);
    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain is required' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const patternId = searchParams.get('patternId');
    const sizeName = searchParams.get('sizeName');
    
    if (!patternId) {
      return NextResponse.json(
        { error: 'patternId is required' },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from('size_measurements')
      .select('*')
      .eq('pattern_id', patternId)
      .eq('subdomain', subdomain)
      .order('display_order', { ascending: true })
      .order('measurement_name', { ascending: true });

    if (sizeName) {
      query = query.eq('size_name', sizeName);
    }

    const { data: measurements, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json(measurements || []);
  } catch (error: any) {
    console.error('Error fetching size measurements:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/size-measurements
 * Crée ou met à jour une mesure
 */
export async function POST(request: NextRequest) {
  try {
    const subdomain = await getSubdomain(request);
    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      patternId,
      sizeName,
      measurementName,
      measurementValue,
      displayOrder = 0,
    } = body;

    if (!patternId || !sizeName || !measurementName || !measurementValue) {
      return NextResponse.json(
        { error: 'patternId, sizeName, measurementName, and measurementValue are required' },
        { status: 400 }
      );
    }

    // Vérifier que le pattern appartient au sous-domaine
    const { data: pattern, error: patternError } = await supabaseAdmin
      .from('size_patterns')
      .select('id')
      .eq('id', patternId)
      .eq('subdomain', subdomain)
      .single();

    if (patternError || !pattern) {
      return NextResponse.json(
        { error: 'Pattern not found or access denied' },
        { status: 404 }
      );
    }

    // Vérifier si une mesure existe déjà pour cette combinaison
    const { data: existing } = await supabaseAdmin
      .from('size_measurements')
      .select('id')
      .eq('pattern_id', patternId)
      .eq('size_name', sizeName)
      .eq('measurement_name', measurementName)
      .eq('subdomain', subdomain)
      .maybeSingle();

    let result;
    
    if (existing) {
      // Mettre à jour la mesure existante
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('size_measurements')
        .update({
          measurement_value: measurementValue,
          display_order: displayOrder,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      result = updated;
    } else {
      // Créer une nouvelle mesure
      const { data: created, error: createError } = await supabaseAdmin
        .from('size_measurements')
        .insert({
          pattern_id: patternId,
          size_name: sizeName,
          measurement_name: measurementName,
          measurement_value: measurementValue,
          display_order: displayOrder,
          subdomain,
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      result = created;
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error creating/updating size measurement:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/size-measurements
 * Supprime une mesure
 */
export async function DELETE(request: NextRequest) {
  try {
    const subdomain = await getSubdomain(request);
    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain is required' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    // Supprimer la mesure
    const { error } = await supabaseAdmin
      .from('size_measurements')
      .delete()
      .eq('id', id)
      .eq('subdomain', subdomain);

    if (error) {
      throw error;
    }

    return NextResponse.json({ message: 'Measurement deleted' });
  } catch (error: any) {
    console.error('Error deleting size measurement:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

