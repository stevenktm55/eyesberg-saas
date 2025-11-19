import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, uploadFile, deleteFile } from '@/lib/supabase';
import { getSubdomain } from '@/lib/get-subdomain';

// GET - Récupérer tous les Designs 2D
export async function GET(request: NextRequest) {
  try {
    const subdomain = await getSubdomain(request);
    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain is required' },
        { status: 400 }
      );
    }

    const { data: designs, error } = await supabaseAdmin
      .from('designs_2d')
      .select('*')
      .eq('subdomain', subdomain)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(designs);
  } catch (error: any) {
    console.error('Error fetching designs 2D:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch designs' },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau Design 2D
export async function POST(request: NextRequest) {
  try {
    const subdomain = await getSubdomain(request);
    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain is required' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const file = formData.get('file') as File | null;
    const format = formData.get('format') as string | null;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    let svgUrl = '';

    // Upload du fichier SVG si fourni
    if (file) {
      const fileName = `${Date.now()}-${file.name}`;
      svgUrl = await uploadFile('designs-2d', fileName, file);
    }

    const { data: design, error } = await supabaseAdmin
      .from('designs_2d')
      .insert({
        subdomain,
        name,
        svg_url: svgUrl,
        format: format || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(design);
  } catch (error: any) {
    console.error('Error creating design 2D:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create design' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un Design 2D
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
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    // Récupérer le design pour supprimer les fichiers
    const { data: design, error: fetchError } = await supabaseAdmin
      .from('designs_2d')
      .select('svg_url, thumbnail_url')
      .eq('id', id)
      .eq('subdomain', subdomain) // Vérifier que le design appartient au sous-domaine
      .single();

    if (fetchError) throw fetchError;

    // Supprimer les fichiers du storage
    if (design?.svg_url) {
      try {
        const urlParts = design.svg_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        await deleteFile('designs-2d', fileName);
      } catch (storageError) {
        console.error('Error deleting SVG file:', storageError);
      }
    }

    if (design?.thumbnail_url) {
      try {
        const urlParts = design.thumbnail_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        await deleteFile('thumbnails', fileName);
      } catch (storageError) {
        console.error('Error deleting thumbnail file:', storageError);
      }
    }

    // Supprimer le design
    const { error } = await supabaseAdmin
      .from('designs_2d')
      .delete()
      .eq('id', id)
      .eq('subdomain', subdomain); // Double vérification

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting design 2D:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete design' },
      { status: 500 }
    );
  }
}

