// =====================================================
// API POUR UPLOADER DES ICÔNES DE MODULES
// =====================================================
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSubdomain } from '@/lib/get-subdomain';

/**
 * POST /api/upload-icon
 * Upload une icône (.svg ou .png) pour un module de personnalisation
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
    const file = formData.get('file') as File | null;
    const folder = formData.get('folder') as string || 'module-icons';

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    // Vérifier le type de fichier
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (fileExtension !== '.svg' && fileExtension !== '.png') {
      return NextResponse.json(
        { error: 'Invalid file type. Only .svg and .png files are allowed' },
        { status: 400 }
      );
    }

    // Vérifier si le bucket existe, sinon le créer
    const { data: existingBucket, error: checkError } = await supabaseAdmin.storage.getBucket('module-icons');
    
    if (!existingBucket && (checkError?.message?.includes('not found') || checkError?.statusCode === '404')) {
      console.log('Bucket "module-icons" n\'existe pas, création en cours...');
      const { error: createError } = await supabaseAdmin.storage.createBucket('module-icons', {
        public: true,
        fileSizeLimit: 1 * 1024 * 1024, // 1MB
        allowedMimeTypes: ['image/svg+xml', 'image/png'],
      });
      
      if (createError) {
        console.error('Error creating bucket:', createError);
        return NextResponse.json(
          { error: `Failed to create bucket: ${createError.message}` },
          { status: 500 }
        );
      }
      console.log('Bucket "module-icons" créé avec succès');
    } else if (checkError && !checkError.message?.includes('not found') && checkError.statusCode !== '404') {
      console.error('Error checking bucket:', checkError);
      return NextResponse.json(
        { error: `Failed to check bucket: ${checkError.message}` },
        { status: 500 }
      );
    }

    // Upload du fichier
    const fileName = `${Date.now()}-${file.name}`;
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('module-icons')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading icon file:', uploadError);
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
      .from('module-icons')
      .getPublicUrl(uploadData.path);

    return NextResponse.json({ url: publicUrl });
  } catch (error: any) {
    console.error('Error uploading icon:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload icon' },
      { status: 500 }
    );
  }
}


