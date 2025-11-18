// =====================================================
// API POUR UPLOADER LES UV MAPS GÉNÉRÉES
// =====================================================
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

/**
 * POST /api/size-patterns/upload-uv
 * Upload un UV map généré vers Supabase Storage
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const model3dId = formData.get('model3dId') as string;
    const size = formData.get('size') as string;
    const uvType = formData.get('uvType') as string;
    
    if (!file || !model3dId || !size || !uvType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Convertir le File en Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Générer un nom de fichier unique
    const fileName = `uv-maps/${model3dId}/${uvType}-${size}-${Date.now()}.png`;
    
    // Upload vers Supabase Storage
    const { data, error } = await supabase.storage
      .from('models-3D') // Ou un bucket dédié aux UV maps
      .upload(fileName, buffer, {
        contentType: 'image/png',
        upsert: true,
      });
    
    if (error) {
      console.error('Error uploading UV map:', error);
      return NextResponse.json(
        { error: 'Failed to upload UV map' },
        { status: 500 }
      );
    }
    
    // Obtenir l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('models-3D')
      .getPublicUrl(fileName);
    
    return NextResponse.json({
      url: publicUrl,
      fileName,
    });
  } catch (error) {
    console.error('Error in upload-uv:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

