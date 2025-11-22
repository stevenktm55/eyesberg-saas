// =====================================================
// API POUR GÉRER LES GROUPES DE FONTS
// =====================================================
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSubdomain } from '@/lib/get-subdomain';

/**
 * GET /api/font-groups
 * Récupère tous les groupes de fonts avec leurs fonts pour le sous-domaine
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

    const { data: fontGroups, error: groupsError } = await supabaseAdmin
      .from('font_groups')
      .select('*')
      .eq('subdomain', subdomain)
      .order('created_at', { ascending: false });

    if (groupsError) {
      throw groupsError;
    }

    // Récupérer les fonts pour chaque groupe
    const groupsWithFonts = await Promise.all(
      (fontGroups || []).map(async (group: any) => {
        const { data: fonts, error: fontsError } = await supabaseAdmin
          .from('fonts')
          .select('*')
          .eq('font_group_id', group.id)
          .order('created_at', { ascending: true });

        if (fontsError) {
          console.error('Error fetching fonts for group:', fontsError);
        }

        return {
          id: group.id,
          name: group.name,
          fonts: fonts || [],
          created_at: group.created_at,
          updated_at: group.updated_at,
        };
      })
    );

    return NextResponse.json(groupsWithFonts);
  } catch (error: any) {
    console.error('Error fetching font groups:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch font groups' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/font-groups
 * Crée un nouveau groupe de fonts
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
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      );
    }

    const { data: fontGroup, error } = await supabaseAdmin
      .from('font_groups')
      .insert({
        subdomain,
        name,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      id: fontGroup.id,
      name: fontGroup.name,
      fonts: [],
      created_at: fontGroup.created_at,
      updated_at: fontGroup.updated_at,
    });
  } catch (error: any) {
    console.error('Error creating font group:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create font group' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/font-groups?id=...
 * Met à jour un groupe de fonts
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
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      );
    }

    const { data: fontGroup, error } = await supabaseAdmin
      .from('font_groups')
      .update({
        name,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('subdomain', subdomain)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Font group not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    // Récupérer les fonts
    const { data: fonts } = await supabaseAdmin
      .from('fonts')
      .select('*')
      .eq('font_group_id', id)
      .order('created_at', { ascending: true });

    return NextResponse.json({
      id: fontGroup.id,
      name: fontGroup.name,
      fonts: fonts || [],
      created_at: fontGroup.created_at,
      updated_at: fontGroup.updated_at,
    });
  } catch (error: any) {
    console.error('Error updating font group:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update font group' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/font-groups?id=...
 * Supprime un groupe de fonts (et toutes ses fonts)
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

    // Récupérer les fonts pour supprimer les fichiers
    const { data: fonts } = await supabaseAdmin
      .from('fonts')
      .select('file_url')
      .eq('font_group_id', id);

    // Supprimer les fichiers de fonts du storage
    if (fonts && fonts.length > 0) {
      const bucket = 'fonts';
      for (const font of fonts) {
        if (font.file_url) {
          const fileName = font.file_url.split('/').pop();
          if (fileName) {
            await supabaseAdmin.storage.from(bucket).remove([fileName]);
          }
        }
      }
    }

    const { error } = await supabaseAdmin
      .from('font_groups')
      .delete()
      .eq('id', id)
      .eq('subdomain', subdomain);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting font group:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete font group' },
      { status: 500 }
    );
  }
}



