// =====================================================
// API POUR GÉRER LES FONTS INDIVIDUELLES
// =====================================================
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSubdomain } from '@/lib/get-subdomain';

/**
 * GET /api/fonts
 * Récupère toutes les fonts (optionnel: filtrer par category)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopDomain = searchParams.get('shop');
    const category = searchParams.get('category'); // 'names', 'numbers', ou null pour toutes
    
    // Si shopDomain est fourni, prioriser la récupération du subdomain depuis product_builder
    let subdomain: string | null = null;
    
    if (shopDomain) {
      try {
        // Chercher un produit avec ce shop_domain pour récupérer son subdomain
        const { data: product } = await supabaseAdmin
          .from('product_builder')
          .select('subdomain')
          .eq('shop_domain', shopDomain)
          .limit(1)
          .maybeSingle();
        
        if (product?.subdomain) {
          subdomain = product.subdomain;
        }
      } catch (error) {
        console.warn('Could not fetch subdomain from shop_domain for fonts API:', error);
      }
    }
    
    // Fallback: essayer de récupérer le subdomain depuis les headers/session
    if (!subdomain) {
      subdomain = await getSubdomain(request);
    }
    
    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain is required. Please provide shop parameter or ensure subdomain is set in headers.' },
        { status: 400 }
      );
    }

    // Essayer d'abord avec font_groups si la relation existe
    let query = supabaseAdmin
      .from('fonts')
      .select(`
        *,
        font_groups!inner (
          id,
          name,
          category,
          subdomain
        )
      `)
      .eq('font_groups.subdomain', subdomain)
      .order('created_at', { ascending: false });

    // Filtrer par catégorie si spécifié
    if (category === 'names' || category === 'numbers') {
      query = query.eq('font_groups.category', category);
    }

    let { data, error } = await query;

    // Si erreur avec font_groups, essayer sans la jointure
    if (error) {
      console.warn('Error fetching fonts with font_groups join, trying without:', error.message);
      const fallbackQuery = supabaseAdmin
        .from('fonts')
        .select('*')
        .order('created_at', { ascending: false });
      
      const fallbackResult = await fallbackQuery;
      
      if (fallbackResult.error) {
        console.error('Error fetching fonts (fallback):', fallbackResult.error);
        return NextResponse.json(
          { error: fallbackResult.error.message || 'Failed to fetch fonts' },
          { status: 500 }
        );
      }
      
      data = fallbackResult.data;
      error = null;
    }

    // Transformer pour garder la compatibilité
    const fonts = data?.map((font: any) => ({
      id: font.id,
      name: font.name,
      display_name: font.display_name || font.name,
      file_url: font.file_url || font.font_url,
      font_group_id: font.font_group_id,
      letter_spacing: font.letter_spacing,
      category: font.font_groups?.category || font.category,
    })) || [];

    return NextResponse.json(fonts);
  } catch (error: any) {
    console.error('Error fetching fonts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch fonts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/fonts
 * Crée une nouvelle font avec upload du fichier
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

    const formData = await request.formData();
    const fontGroupId = formData.get('fontGroupId') as string;
    const name = formData.get('name') as string;
    const file = formData.get('file') as File | null;
    const letterSpacing = (formData.get('letterSpacing') as string) || '0px';

    if (!fontGroupId || !name) {
      return NextResponse.json(
        { error: 'fontGroupId and name are required' },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    // Vérifier le type de fichier
    const allowedTypes = ['.ttf', '.otf', '.woff', '.woff2'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: .ttf, .otf, .woff, .woff2' },
        { status: 400 }
      );
    }

    // Upload du fichier
    const fileName = `${Date.now()}-${file.name}`;
    
    console.log('Starting font upload:', { fileName, fontGroupId, name, fileSize: file.size });
    
    try {
      // Vérifier si le bucket existe, sinon le créer
      const { data: existingBucket, error: checkError } = await supabaseAdmin.storage.getBucket('fonts');
      
      if (!existingBucket && (checkError?.message?.includes('not found') || checkError?.statusCode === '404')) {
        console.log('Bucket "fonts" n\'existe pas, création en cours...');
        const { error: createError } = await supabaseAdmin.storage.createBucket('fonts', {
          public: true,
          fileSizeLimit: 10 * 1024 * 1024, // 10MB
          allowedMimeTypes: [
            'font/ttf',
            'font/otf',
            'font/woff',
            'font/woff2',
            'application/x-font-ttf',
            'application/x-font-opentype',
            'application/font-woff',
            'application/font-woff2'
          ],
        });
        
        if (createError) {
          console.error('Error creating bucket:', createError);
          return NextResponse.json(
            { error: `Failed to create bucket: ${createError.message}` },
            { status: 500 }
          );
        }
        console.log('Bucket "fonts" créé avec succès');
      }

      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('fonts')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Error uploading font file:', uploadError);
        console.error('Upload error details:', JSON.stringify(uploadError, null, 2));
        // Si le bucket n'existe pas, créer un message d'erreur plus clair
        if (uploadError.message?.includes('Bucket') || uploadError.message?.includes('not found') || uploadError.statusCode === '404') {
          return NextResponse.json(
            { error: 'Le bucket "fonts" n\'existe pas dans Supabase Storage. Veuillez le créer dans le dashboard Supabase (Storage > Create bucket > nom: "fonts" > public).' },
            { status: 500 }
          );
        }
        return NextResponse.json(
          { error: `Failed to upload file: ${uploadError.message || JSON.stringify(uploadError)}` },
          { status: 500 }
        );
      }

      if (!uploadData) {
        console.error('Upload returned no data');
        return NextResponse.json(
          { error: 'Upload failed: no data returned' },
          { status: 500 }
        );
      }

      console.log('File uploaded successfully:', uploadData.path);

      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('fonts')
        .getPublicUrl(uploadData.path);

      console.log('Public URL generated:', publicUrl);

      // Créer la font dans la base de données
      const fileTypeWithoutDot = fileExtension.substring(1); // Enlever le point
      console.log('Inserting font into database:', {
        font_group_id: fontGroupId,
        name,
        file_url: publicUrl,
        file_name: file.name,
        file_type: fileTypeWithoutDot,
        letter_spacing: letterSpacing,
      });

      const { data: font, error } = await supabaseAdmin
        .from('fonts')
        .insert({
          font_group_id: fontGroupId,
          name,
          file_url: publicUrl,
          file_name: file.name,
          file_type: fileTypeWithoutDot,
          letter_spacing: letterSpacing,
        })
        .select()
        .single();

      if (error) {
        console.error('Error inserting font into database:', error);
        console.error('Database error details:', JSON.stringify(error, null, 2));
        // Supprimer le fichier si l'insertion échoue
        try {
          await supabaseAdmin.storage.from('fonts').remove([fileName]);
        } catch (removeError) {
          console.error('Error removing uploaded file:', removeError);
        }
        return NextResponse.json(
          { error: `Failed to create font in database: ${error.message || JSON.stringify(error)}` },
          { status: 500 }
        );
      }

      console.log('Font created successfully:', font);
      return NextResponse.json(font);
    } catch (error: any) {
      console.error('Unexpected error in font creation:', error);
      console.error('Error stack:', error.stack);
      return NextResponse.json(
        { error: error.message || 'Failed to create font' },
        { status: 500 }
      );
    }

    return NextResponse.json(font);
  } catch (error: any) {
    console.error('Error creating font:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create font' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/fonts?id=...
 * Met à jour une font
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

    const formData = await request.formData();
    const name = formData.get('name') as string | null;
    const letterSpacing = formData.get('letterSpacing') as string | null;
    const file = formData.get('file') as File | null;

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (name) updateData.name = name;
    if (letterSpacing !== null) updateData.letter_spacing = letterSpacing;

    // Si un nouveau fichier est fourni, le remplacer
    if (file) {
      // Récupérer l'ancienne font pour supprimer l'ancien fichier
      const { data: oldFont } = await supabaseAdmin
        .from('fonts')
        .select('file_url')
        .eq('id', id)
        .single();

      if (oldFont?.file_url) {
        const oldFileName = oldFont.file_url.split('/').pop();
        if (oldFileName) {
          await supabaseAdmin.storage.from('fonts').remove([oldFileName]);
        }
      }

      // Upload du nouveau fichier
      const fileName = `${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('fonts')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('fonts')
        .getPublicUrl(uploadData.path);

      updateData.file_url = publicUrl;
      updateData.file_name = file.name;
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
      updateData.file_type = fileExtension;
    }

    const { data: font, error } = await supabaseAdmin
      .from('fonts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Font not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json(font);
  } catch (error: any) {
    console.error('Error updating font:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update font' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/fonts?id=...
 * Supprime une font
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

    // Récupérer la font pour supprimer le fichier
    const { data: font } = await supabaseAdmin
      .from('fonts')
      .select('file_url')
      .eq('id', id)
      .single();

    if (font?.file_url) {
      const fileName = font.file_url.split('/').pop();
      if (fileName) {
        await supabaseAdmin.storage.from('fonts').remove([fileName]);
      }
    }

    const { error } = await supabaseAdmin
      .from('fonts')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting font:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete font' },
      { status: 500 }
    );
  }
}
