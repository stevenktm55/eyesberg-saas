// =====================================================
// API POUR UPLOADER UN FICHIER SVG PAR TAILLE
// =====================================================
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, uploadFile } from '@/lib/supabase';
import { getSubdomain } from '@/lib/get-subdomain';

export const runtime = 'nodejs';

/**
 * POST /api/size-patterns/upload-file
 * Upload un fichier SVG pour une taille spécifique
 * Parse automatiquement le SVG pour extraire les pièces
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
    const file = formData.get('file') as File;
    const patternId = formData.get('patternId') as string;
    const size = formData.get('size') as string;
    
    if (!file || !patternId || !size) {
      return NextResponse.json(
        { error: 'file, patternId, and size are required' },
        { status: 400 }
      );
    }

    // Vérifier que le pattern appartient au sous-domaine
    const { data: pattern, error: patternError } = await supabaseAdmin
      .from('size_patterns')
      .select('id')
      .eq('id', patternId)
      .eq('subdomain', subdomain)
      .single();

    if (patternError || !pattern) {
      return NextResponse.json(
        { error: 'Pattern not found or access denied' },
        { status: 404 }
      );
    }
    
    // Vérifier que c'est un fichier SVG
    if (!file.name.endsWith('.svg') && file.type !== 'image/svg+xml') {
      return NextResponse.json(
        { error: 'File must be an SVG' },
        { status: 400 }
      );
    }
    
    // Upload vers Supabase Storage
    const fileName = `${patternId}-${size}-${Date.now()}.svg`;
    const svgUrl = await uploadFile('size-patterns', fileName, file);
    
    // Sauvegarder ou mettre à jour le fichier dans la base de données
    const { data: existingFile } = await supabaseAdmin
      .from('size_pattern_files')
      .select('id')
      .eq('pattern_id', patternId)
      .eq('size_name', size)
      .single();
    
    if (existingFile) {
      // Mettre à jour
      const { error: updateError } = await supabaseAdmin
        .from('size_pattern_files')
        .update({
          svg_url: svgUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingFile.id);
      
      if (updateError) {
        throw updateError;
      }
    } else {
      // Créer
      const { error: insertError } = await supabaseAdmin
        .from('size_pattern_files')
        .insert({
          pattern_id: patternId,
          size_name: size,
          svg_url: svgUrl,
        });
      
      if (insertError) {
        throw insertError;
      }
    }
    
    return NextResponse.json({
      url: svgUrl,
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

