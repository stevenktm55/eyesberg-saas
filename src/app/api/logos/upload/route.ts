import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convertir le fichier en ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const filename = `imported-${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    // Uploader vers Supabase Storage dans le bucket 'logos'
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('logos')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Erreur upload logo:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Obtenir l'URL publique
    const { data: urlData } = supabaseAdmin.storage
      .from('logos')
      .getPublicUrl(filename);

    console.log('✅ Logo uploadé avec succès:', filename);

    return NextResponse.json({ 
      success: true, 
      url: urlData.publicUrl,
      filename 
    });
  } catch (err) {
    console.error('❌ Erreur upload logo:', err);
    return NextResponse.json({ 
      error: 'Upload failed',
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}

