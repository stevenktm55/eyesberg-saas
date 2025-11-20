// =====================================================
// API POUR GÉRER LES LOGOS INDIVIDUELS
// =====================================================
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSubdomain } from '@/lib/get-subdomain';

/**
 * POST /api/logos
 * Crée un nouveau logo avec upload du fichier SVG
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
    const logoLibraryId = formData.get('logoLibraryId') as string;
    const name = formData.get('name') as string;
    const file = formData.get('file') as File | null;

    if (!logoLibraryId || !name) {
      return NextResponse.json(
        { error: 'logoLibraryId and name are required' },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    // Vérifier le type de fichier (SVG uniquement)
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (fileExtension !== '.svg') {
      return NextResponse.json(
        { error: 'Invalid file type. Only .svg files are allowed' },
        { status: 400 }
      );
    }

    // Vérifier si le bucket existe, sinon le créer
    const { data: existingBucket, error: checkError } = await supabaseAdmin.storage.getBucket('logos');
    
    if (!existingBucket && (checkError?.message?.includes('not found') || checkError?.statusCode === '404')) {
      console.log('Bucket "logos" n\'existe pas, création en cours...');
      const { error: createError } = await supabaseAdmin.storage.createBucket('logos', {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024, // 5MB
        allowedMimeTypes: ['image/svg+xml'],
      });
      
      if (createError) {
        console.error('Error creating bucket:', createError);
        return NextResponse.json(
          { error: `Failed to create bucket: ${createError.message}` },
          { status: 500 }
        );
      }
      console.log('Bucket "logos" créé avec succès');
    }

    // Upload du fichier
    const fileName = `${Date.now()}-${file.name}`;
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('logos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading logo file:', uploadError);
      return NextResponse.json(
        { error: `Failed to upload file: ${uploadError.message}` },
        { status: 500 }
      );
    }

    if (!uploadData) {
      return NextResponse.json(
        { error: 'Upload failed: no data returned' },
        { status: 500 }
      );
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('logos')
      .getPublicUrl(uploadData.path);

    // Créer le logo dans la base de données
    const { data: logo, error } = await supabaseAdmin
      .from('logos')
      .insert({
        logo_library_id: logoLibraryId,
        name,
        file_url: publicUrl,
        file_name: file.name,
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting logo into database:', error);
      // Supprimer le fichier si l'insertion échoue
      try {
        await supabaseAdmin.storage.from('logos').remove([fileName]);
      } catch (removeError) {
        console.error('Error removing uploaded file:', removeError);
      }
      return NextResponse.json(
        { error: `Failed to create logo: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(logo);
  } catch (error: any) {
    console.error('Error creating logo:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create logo' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/logos?id=...
 * Met à jour un logo
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
    const file = formData.get('file') as File | null;

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (name) updateData.name = name;

    // Si un nouveau fichier est fourni, le remplacer
    if (file) {
      // Récupérer l'ancien logo pour supprimer l'ancien fichier
      const { data: oldLogo } = await supabaseAdmin
        .from('logos')
        .select('file_url')
        .eq('id', id)
        .single();

      if (oldLogo?.file_url) {
        const oldFileName = oldLogo.file_url.split('/').pop();
        if (oldFileName) {
          await supabaseAdmin.storage.from('logos').remove([oldFileName]);
        }
      }

      // Upload du nouveau fichier
      const fileName = `${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('logos')
        .getPublicUrl(uploadData.path);

      updateData.file_url = publicUrl;
      updateData.file_name = file.name;
    }

    const { data: logo, error } = await supabaseAdmin
      .from('logos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Logo not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json(logo);
  } catch (error: any) {
    console.error('Error updating logo:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update logo' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/logos?id=...
 * Supprime un logo
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

    // Récupérer le logo pour supprimer le fichier
    const { data: logo } = await supabaseAdmin
      .from('logos')
      .select('file_url')
      .eq('id', id)
      .single();

    if (logo?.file_url) {
      const fileName = logo.file_url.split('/').pop();
      if (fileName) {
        await supabaseAdmin.storage.from('logos').remove([fileName]);
      }
    }

    const { error } = await supabaseAdmin
      .from('logos')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting logo:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete logo' },
      { status: 500 }
    );
  }
}
