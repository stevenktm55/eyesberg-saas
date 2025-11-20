// =====================================================
// API POUR GÉRER LES PALETTES DE COULEURS
// =====================================================
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSubdomain } from '@/lib/get-subdomain';

/**
 * GET /api/color-palettes
 * Récupère toutes les palettes de couleurs pour le sous-domaine
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

    const { data: palettes, error } = await supabaseAdmin
      .from('color_palettes')
      .select('*')
      .eq('subdomain', subdomain)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Parser les couleurs JSON si elles sont stockées comme JSONB
    const formattedPalettes = (palettes || []).map((palette: any) => ({
      id: palette.id,
      name: palette.name,
      colors: typeof palette.colors === 'string' 
        ? JSON.parse(palette.colors) 
        : palette.colors,
      created_at: palette.created_at,
      updated_at: palette.updated_at,
    }));

    return NextResponse.json(formattedPalettes);
  } catch (error: any) {
    console.error('Error fetching color palettes:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch color palettes' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/color-palettes
 * Crée une nouvelle palette de couleurs
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
    const { name, colors } = body;

    if (!name || !Array.isArray(colors) || colors.length === 0) {
      return NextResponse.json(
        { error: 'name and colors array are required' },
        { status: 400 }
      );
    }

    // Valider que toutes les couleurs sont des hex valides
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    const validColors = colors.filter((color: string) => hexColorRegex.test(color));
    
    if (validColors.length !== colors.length) {
      return NextResponse.json(
        { error: 'All colors must be valid hex colors (e.g., #FF0000)' },
        { status: 400 }
      );
    }

    const { data: palette, error } = await supabaseAdmin
      .from('color_palettes')
      .insert({
        subdomain,
        name,
        colors: colorsArray, // JSONB will handle the array
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      id: palette.id,
      name: palette.name,
      colors: typeof palette.colors === 'string' 
        ? JSON.parse(palette.colors) 
        : palette.colors,
      created_at: palette.created_at,
      updated_at: palette.updated_at,
    });
  } catch (error: any) {
    console.error('Error creating color palette:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create color palette' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/color-palettes?id=...
 * Met à jour une palette de couleurs existante
 */
export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { name, colors } = body;

    if (!name || !Array.isArray(colors) || colors.length === 0) {
      return NextResponse.json(
        { error: 'name and colors array are required' },
        { status: 400 }
      );
    }

    // Valider que toutes les couleurs sont des hex valides
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    const validColors = colors.filter((color: string) => hexColorRegex.test(color));
    
    if (validColors.length !== colors.length) {
      return NextResponse.json(
        { error: 'All colors must be valid hex colors (e.g., #FF0000)' },
        { status: 400 }
      );
    }

    const { data: palette, error } = await supabaseAdmin
      .from('color_palettes')
      .update({
        name,
        colors: colorsArray,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('subdomain', subdomain)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Color palette not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      id: palette.id,
      name: palette.name,
      colors: typeof palette.colors === 'string' 
        ? JSON.parse(palette.colors) 
        : palette.colors,
      created_at: palette.created_at,
      updated_at: palette.updated_at,
    });
  } catch (error: any) {
    console.error('Error updating color palette:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update color palette' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/color-palettes?id=...
 * Supprime une palette de couleurs
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

    const { error } = await supabaseAdmin
      .from('color_palettes')
      .delete()
      .eq('id', id)
      .eq('subdomain', subdomain);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting color palette:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete color palette' },
      { status: 500 }
    );
  }
}

