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
    const uvType = (formData.get('uvType') as string) || 'UV0';
    
    console.log('Upload file request:', { patternId, size, uvType, fileName: file?.name, fileSize: file?.size });
    
    if (!file || !patternId || !size) {
      return NextResponse.json(
        { error: 'file, patternId, and size are required' },
        { status: 400 }
      );
    }

    // Vérifier que le pattern appartient au sous-domaine et récupérer ses infos
    const { data: pattern, error: patternError } = await supabaseAdmin
      .from('size_patterns')
      .select('id, name, model_3d_id, uv_type')
      .eq('id', patternId)
      .eq('subdomain', subdomain)
      .single();

    if (patternError || !pattern) {
      return NextResponse.json(
        { error: 'Pattern not found or access denied' },
        { status: 404 }
      );
    }
    
    // Si le pattern n'est pas du bon type UV, trouver ou créer le pattern correspondant
    let targetPatternId = patternId;
    if (pattern.uv_type !== uvType) {
      // Chercher le pattern de l'autre type UV avec le même nom et modèle
      const { data: matchingPattern } = await supabaseAdmin
        .from('size_patterns')
        .select('id')
        .eq('name', pattern.name)
        .eq('model_3d_id', pattern.model_3d_id)
        .eq('uv_type', uvType)
        .eq('subdomain', subdomain)
        .maybeSingle();
      
      if (matchingPattern) {
        targetPatternId = matchingPattern.id;
      } else {
        // Créer le pattern pour l'autre type UV
        const { data: newPattern, error: createError } = await supabaseAdmin
          .from('size_patterns')
          .insert({
            subdomain,
            model_3d_id: pattern.model_3d_id,
            name: pattern.name,
            uv_type: uvType,
          })
          .select('id')
          .single();
        
        if (createError || !newPattern) {
          return NextResponse.json(
            { error: 'Failed to create pattern for UV type' },
            { status: 500 }
          );
        }
        targetPatternId = newPattern.id;
      }
    }
    
    // Vérifier que c'est un fichier SVG
    if (!file.name.endsWith('.svg') && file.type !== 'image/svg+xml') {
      return NextResponse.json(
        { error: 'File must be an SVG' },
        { status: 400 }
      );
    }
    
    // Upload vers Supabase Storage en utilisant supabaseAdmin pour les permissions
    const fileName = `${targetPatternId}-${size}-${uvType}-${Date.now()}.svg`;
    console.log('Uploading file to storage:', fileName);
    let svgUrl: string;
    try {
      // Utiliser supabaseAdmin pour l'upload côté serveur
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('size-patterns')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('Error uploading to storage:', uploadError);
        throw new Error(`Failed to upload file to storage: ${uploadError.message}`);
      }

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('size-patterns')
        .getPublicUrl(uploadData.path);
      
      svgUrl = publicUrl;
      console.log('File uploaded successfully, URL:', svgUrl);
    } catch (uploadError: any) {
      console.error('Error uploading to storage:', uploadError);
      throw new Error(`Failed to upload file to storage: ${uploadError?.message || 'Unknown error'}`);
    }
    
    // Sauvegarder ou mettre à jour le fichier dans la base de données
    const { data: existingFile } = await supabaseAdmin
      .from('size_pattern_files')
      .select('id')
      .eq('pattern_id', targetPatternId)
      .eq('size_name', size)
      .maybeSingle();
    
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
          pattern_id: targetPatternId,
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
  } catch (error: any) {
    console.error('Error in upload-file:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

