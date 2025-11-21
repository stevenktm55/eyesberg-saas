import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSubdomain } from '@/lib/get-subdomain';

const BUCKET_NAME = 'designs-2d-previews';

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

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Vérifier si le bucket existe, sinon le créer
    const { data: existingBucket, error: checkError } = await supabaseAdmin.storage.getBucket(BUCKET_NAME);
    
    if (!existingBucket && (checkError?.message?.includes('not found') || checkError?.statusCode === '404')) {
      console.log(`Bucket "${BUCKET_NAME}" n'existe pas, création en cours...`);
      const { error: createError } = await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 10 * 1024 * 1024, // 10MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
      });
      
      if (createError) {
        console.error('Error creating bucket:', createError);
        // Continuer quand même, le bucket existe peut-être déjà
      } else {
        console.log(`Bucket "${BUCKET_NAME}" créé avec succès`);
      }
    } else if (checkError && !checkError.message?.includes('not found') && checkError.statusCode !== '404') {
      console.error('Error checking bucket:', checkError);
    }

    // Uploader directement le File vers Supabase Storage
    const fileName = `preview-${Date.now()}-${file.name}`;
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase Storage Upload Error:', uploadError);
      return NextResponse.json(
        { error: `Failed to upload preview: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Obtenir l'URL publique
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(uploadData.path);

    console.log('Preview uploaded successfully:', publicUrl);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: file.name
    });
  } catch (error: any) {
    console.error('Error uploading preview:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload preview' },
      { status: 500 }
    );
  }
}

