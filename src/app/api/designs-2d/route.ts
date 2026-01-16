import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
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

    // Log pour debug
    console.log('🔍 [API designs-2d] Designs retournés:', designs?.length || 0);
    if (designs && designs.length > 0) {
      designs.forEach((design: any) => {
        console.log(`Design ${design.id}:`, {
          hasColors: !!design.colors,
          colors: design.colors,
          colorsType: typeof design.colors,
          color_mappings: design.color_mappings
        });
      });
    }

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
      try {
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('designs-2d')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true,
          });
        
        if (uploadError) {
          console.error('Supabase Storage Upload Error:', uploadError);
          throw new Error(`Failed to upload file to storage: ${uploadError.message}`);
        }
        
        const { data: { publicUrl } } = supabaseAdmin.storage
          .from('designs-2d')
          .getPublicUrl(uploadData.path);
        svgUrl = publicUrl;
        console.log('File uploaded successfully, URL:', svgUrl);
      } catch (uploadError: any) {
        console.error('Error during file upload to storage:', uploadError);
        return NextResponse.json(
          { error: `Failed to upload file: ${uploadError.message || 'Unknown error'}` },
          { status: 500 }
        );
      }
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

    if (error) {
      console.error('Supabase insert error:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    return NextResponse.json(design);
  } catch (error: any) {
    console.error('Error creating design 2D:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create design' },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour un Design 2D
export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { model3d_id, color_mappings, preview_url } = body;

    // Vérifier que le design appartient au sous-domaine
    const { data: existingDesign, error: fetchError } = await supabaseAdmin
      .from('designs_2d')
      .select('id')
      .eq('id', id)
      .eq('subdomain', subdomain)
      .single();

    if (fetchError || !existingDesign) {
      return NextResponse.json(
        { error: 'Design not found or access denied' },
        { status: 404 }
      );
    }

    // Mettre à jour le design
    const updateData: any = {};
    if (model3d_id !== undefined) updateData.model3d_id = model3d_id;
    if (color_mappings !== undefined) updateData.color_mappings = color_mappings;
    if (preview_url !== undefined) updateData.preview_url = preview_url;

    // Si aucune donnée à mettre à jour, retourner le design existant
    if (Object.keys(updateData).length === 0) {
      const { data: design } = await supabaseAdmin
        .from('designs_2d')
        .select('*')
        .eq('id', id)
        .eq('subdomain', subdomain)
        .single();
      return NextResponse.json(design);
    }

    const { data: design, error } = await supabaseAdmin
      .from('designs_2d')
      .update(updateData)
      .eq('id', id)
      .eq('subdomain', subdomain)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      // Si l'erreur est due à des colonnes manquantes, essayer de mettre à jour seulement les colonnes existantes
      if (error.code === '42703' || error.message?.includes('column')) {
        // Colonne n'existe pas, essayer de mettre à jour seulement les colonnes qui existent
        const safeUpdateData: any = {};
        if (updateData.model3d_id !== undefined) {
          // Essayer model3d_id, sinon essayer model_3d_id
          try {
            const testUpdate = await supabaseAdmin
              .from('designs_2d')
              .update({ model_3d_id: updateData.model3d_id })
              .eq('id', id)
              .eq('subdomain', subdomain);
            if (!testUpdate.error) {
              safeUpdateData.model_3d_id = updateData.model3d_id;
            }
          } catch (e) {
            console.log('model3d_id column does not exist, skipping');
          }
        }
        if (updateData.color_mappings !== undefined) {
          safeUpdateData.color_mappings = updateData.color_mappings;
        }
        if (updateData.preview_url !== undefined) {
          safeUpdateData.preview_url = updateData.preview_url;
        }
        
        if (Object.keys(safeUpdateData).length > 0) {
          const { data: design, error: retryError } = await supabaseAdmin
            .from('designs_2d')
            .update(safeUpdateData)
            .eq('id', id)
            .eq('subdomain', subdomain)
            .select()
            .single();
          
          if (retryError) throw retryError;
          return NextResponse.json(design);
        }
      }
      throw error;
    }

    return NextResponse.json(design);
  } catch (error: any) {
    console.error('Error updating design 2D:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update design' },
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
        const { error: deleteError } = await supabaseAdmin.storage
          .from('designs-2d')
          .remove([fileName]);
        if (deleteError) {
          console.error('Error deleting SVG file:', deleteError);
        }
      } catch (storageError) {
        console.error('Error deleting SVG file:', storageError);
      }
    }

    if (design?.thumbnail_url) {
      try {
        const urlParts = design.thumbnail_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const { error: deleteError } = await supabaseAdmin.storage
          .from('thumbnails')
          .remove([fileName]);
        if (deleteError) {
          console.error('Error deleting thumbnail file:', deleteError);
        }
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

