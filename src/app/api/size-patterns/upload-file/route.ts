// =====================================================
// API POUR UPLOADER UN FICHIER SVG PAR TAILLE
// =====================================================
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { parseSVGPieces } from '@/utils/sizePatternGenerator';

export const runtime = 'nodejs';

/**
 * POST /api/size-patterns/upload-file
 * Upload un fichier SVG pour une taille spécifique
 * Parse automatiquement le SVG pour extraire les pièces
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const patternId = formData.get('patternId') as string;
    const size = formData.get('size') as string;
    
    if (!file || !patternId || !size) {
      return NextResponse.json(
        { error: 'file, patternId, and size are required' },
        { status: 400 }
      );
    }
    
    // Vérifier que c'est un fichier SVG
    if (!file.name.endsWith('.svg') && file.type !== 'image/svg+xml') {
      return NextResponse.json(
        { error: 'File must be an SVG' },
        { status: 400 }
      );
    }
    
    // Convertir le File en Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Générer un nom de fichier unique
    const fileName = `size-patterns/${patternId}/${size}-${Date.now()}.svg`;
    
    // Upload vers Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('models-3D') // Ou un bucket dédié
      .upload(fileName, buffer, {
        contentType: 'image/svg+xml',
        upsert: true,
      });
    
    if (uploadError) {
      console.error('Error uploading SVG:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload SVG' },
        { status: 500 }
      );
    }
    
    // Obtenir l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('models-3D')
      .getPublicUrl(fileName);
    
    // Parser le SVG pour extraire les pièces (côté serveur)
    // Note: parseSVGPieces est conçu pour le client, on va le faire différemment
    // Pour l'instant, on laisse metadata null, il sera généré côté client lors de l'utilisation
    
    // Sauvegarder ou mettre à jour le fichier dans la base de données
    const { data: existingFile } = await supabase
      .from('size_pattern_files')
      .select('id')
      .eq('pattern_id', patternId)
      .eq('size_name', size)
      .single();
    
    if (existingFile) {
      // Mettre à jour
      const { error: updateError } = await supabase
        .from('size_pattern_files')
        .update({
          svg_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingFile.id);
      
      if (updateError) {
        throw updateError;
      }
    } else {
      // Créer
      const { error: insertError } = await supabase
        .from('size_pattern_files')
        .insert({
          pattern_id: patternId,
          size_name: size,
          svg_url: publicUrl,
        });
      
      if (insertError) {
        throw insertError;
      }
    }
    
    return NextResponse.json({
      url: publicUrl,
      fileName,
      size,
      message: 'File uploaded successfully',
    });
  } catch (error) {
    console.error('Error in upload-file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

