// =====================================================
// API POUR GÉRER LES BIBLIOTHÈQUES DE LOGOS
// =====================================================
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSubdomain } from '@/lib/get-subdomain';

/**
 * GET /api/logo-libraries
 * Récupère toutes les bibliothèques de logos avec leurs logos pour le sous-domaine
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

    const { data: logoLibraries, error: librariesError } = await supabaseAdmin
      .from('logo_libraries')
      .select('*')
      .eq('subdomain', subdomain)
      .order('created_at', { ascending: false });

    if (librariesError) {
      throw librariesError;
    }

    // Récupérer les logos pour chaque bibliothèque avec leurs variantes
    const librariesWithLogos = await Promise.all(
      (logoLibraries || []).map(async (library: any) => {
        const { data: logos, error: logosError } = await supabaseAdmin
          .from('logos')
          .select('*')
          .eq('logo_library_id', library.id)
          .order('created_at', { ascending: true });

        if (logosError) {
          console.error('Error fetching logos for library:', logosError);
        }

        // Récupérer les variantes pour chaque logo
        const logosWithVariants = await Promise.all(
          (logos || []).map(async (logo: any) => {
            const { data: variants, error: variantsError } = await supabaseAdmin
              .from('logo_variants')
              .select('*')
              .eq('logo_id', logo.id)
              .order('created_at', { ascending: true });

            if (variantsError) {
              console.error('Error fetching variants for logo:', variantsError);
            }

            return {
              ...logo,
              variants: variants || [],
            };
          })
        );

        return {
          id: library.id,
          name: library.name,
          logos: logosWithVariants,
          created_at: library.created_at,
          updated_at: library.updated_at,
        };
      })
    );

    return NextResponse.json(librariesWithLogos);
  } catch (error: any) {
    console.error('Error fetching logo libraries:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch logo libraries' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/logo-libraries
 * Crée une nouvelle bibliothèque de logos
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

    const { data: logoLibrary, error } = await supabaseAdmin
      .from('logo_libraries')
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
      id: logoLibrary.id,
      name: logoLibrary.name,
      logos: [],
      created_at: logoLibrary.created_at,
      updated_at: logoLibrary.updated_at,
    });
  } catch (error: any) {
    console.error('Error creating logo library:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create logo library' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/logo-libraries?id=...
 * Met à jour une bibliothèque de logos
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

    const { data: logoLibrary, error } = await supabaseAdmin
      .from('logo_libraries')
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
          { error: 'Logo library not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    // Récupérer les logos
    const { data: logos } = await supabaseAdmin
      .from('logos')
      .select('*')
      .eq('logo_library_id', id)
      .order('created_at', { ascending: true });

    return NextResponse.json({
      id: logoLibrary.id,
      name: logoLibrary.name,
      logos: logos || [],
      created_at: logoLibrary.created_at,
      updated_at: logoLibrary.updated_at,
    });
  } catch (error: any) {
    console.error('Error updating logo library:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update logo library' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/logo-libraries?id=...
 * Supprime une bibliothèque de logos (et tous ses logos)
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

    // Récupérer les logos pour supprimer les fichiers
    const { data: logos } = await supabaseAdmin
      .from('logos')
      .select('file_url')
      .eq('logo_library_id', id);

    // Supprimer les fichiers de logos du storage
    if (logos && logos.length > 0) {
      const bucket = 'logos';
      for (const logo of logos) {
        if (logo.file_url) {
          const fileName = logo.file_url.split('/').pop();
          if (fileName) {
            await supabaseAdmin.storage.from(bucket).remove([fileName]);
          }
        }
      }
    }

    const { error } = await supabaseAdmin
      .from('logo_libraries')
      .delete()
      .eq('id', id)
      .eq('subdomain', subdomain);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting logo library:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete logo library' },
      { status: 500 }
    );
  }
}
