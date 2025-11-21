import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSubdomain } from '@/lib/get-subdomain';

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

    // Vérifier si le bucket existe et a les bons types MIME
    const { data: existingBucket, error: checkError } = await supabaseAdmin.storage.getBucket('designs-2d');
    
    if (!existingBucket && (checkError?.message?.includes('not found') || checkError?.statusCode === '404')) {
      console.log('Bucket "designs-2d" n\'existe pas, création en cours...');
      const { error: createError } = await supabaseAdmin.storage.createBucket('designs-2d', {
        public: true,
        fileSizeLimit: 10 * 1024 * 1024, // 10MB
        allowedMimeTypes: ['image/svg+xml', 'image/png', 'image/jpeg', 'image/jpg'],
      });
      
      if (createError) {
        console.error('Error creating bucket:', createError);
      } else {
        console.log('Bucket "designs-2d" créé avec succès');
      }
    }

    // Uploader directement le File vers Supabase Storage (Supabase détectera automatiquement le type MIME)
    const fileName = `preview-${Date.now()}-${file.name}`;
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('designs-2d')
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
      .from('designs-2d')
      .getPublicUrl(uploadData.path);

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

