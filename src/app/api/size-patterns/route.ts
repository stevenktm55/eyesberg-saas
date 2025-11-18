// =====================================================
// API POUR GÉRER LES PATRONS MULTI-TAILLES
// =====================================================
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/size-patterns
 * Récupère les templates de patrons
 * - Si model3dId est fourni : retourne le pattern pour ce modèle et type UV
 * - Sinon : retourne tous les patterns actifs
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const model3dId = searchParams.get('model3dId');
    const uvType = searchParams.get('uvType') || 'UV0';
    
    // Si model3dId est fourni, retourner un seul pattern
    if (model3dId) {
      const { data: pattern, error } = await supabase
        .from('size_patterns')
        .select(`
          *,
          size_pattern_files (*)
        `)
        .eq('model_3d_id', model3dId)
        .eq('uv_type', uvType)
        .eq('active', true)
        .single();
      
      if (error || !pattern) {
        return NextResponse.json(
          { error: 'Pattern not found' },
          { status: 404 }
        );
      }
      
      // Formater les fichiers
      const files = (pattern.size_pattern_files || []).map((f: any) => ({
        id: f.id,
        patternId: f.pattern_id,
        size: f.size_name,
        svgUrl: f.svg_url,
        metadata: f.metadata,
      }));
      
      return NextResponse.json({
        id: pattern.id,
        model3dId: pattern.model_3d_id,
        name: pattern.name,
        uvType: pattern.uv_type,
        files,
      });
    }
    
    // Sinon, retourner tous les patterns actifs
    const { data: patterns, error } = await supabase
      .from('size_patterns')
      .select(`
        *,
        size_pattern_files (*)
      `)
      .eq('active', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    // Formater les patterns
    const formattedPatterns = (patterns || []).map((pattern: any) => ({
      id: pattern.id,
      model3dId: pattern.model_3d_id,
      name: pattern.name,
      description: pattern.description,
      uvType: pattern.uv_type,
      files: (pattern.size_pattern_files || []).map((f: any) => ({
        id: f.id,
        patternId: f.pattern_id,
        size: f.size_name,
        svgUrl: f.svg_url,
        metadata: f.metadata,
      })),
    }));
    
    return NextResponse.json(formattedPatterns);
  } catch (error) {
    console.error('Error fetching size patterns:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/size-patterns
 * Crée ou met à jour un template de patron
 * Peut aussi ajouter/mettre à jour un fichier SVG pour une taille spécifique
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      model3dId,
      name,
      description,
      uvType = 'UV0',
      // Pour ajouter un fichier pour une taille
      size,
      svgUrl,
      metadata, // Métadonnées extraites du SVG (optionnel, auto-généré si absent)
    } = body;
    
    if (!model3dId || !name) {
      return NextResponse.json(
        { error: 'model3dId and name are required' },
        { status: 400 }
      );
    }
    
    // Vérifier si un pattern existe déjà pour ce modèle et type UV
    const { data: existing } = await supabase
      .from('size_patterns')
      .select('id')
      .eq('model_3d_id', model3dId)
      .eq('uv_type', uvType)
      .single();
    
    let patternId: string;
    
    if (existing) {
      // Mettre à jour le pattern existant
      const { data: updated, error: updateError } = await supabase
        .from('size_patterns')
        .update({
          name,
          description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();
      
      if (updateError) {
        throw updateError;
      }
      
      patternId = updated.id;
    } else {
      // Créer un nouveau pattern
      const { data: created, error: createError } = await supabase
        .from('size_patterns')
        .insert({
          model_3d_id: model3dId,
          name,
          description,
          uv_type: uvType,
        })
        .select()
        .single();
      
      if (createError) {
        throw createError;
      }
      
      patternId = created.id;
    }
    
    // Si un fichier SVG est fourni pour une taille, l'ajouter/mettre à jour
    if (size && svgUrl) {
      // Vérifier si un fichier existe déjà pour cette taille
      const { data: existingFile } = await supabase
        .from('size_pattern_files')
        .select('id')
        .eq('pattern_id', patternId)
        .eq('size_name', size)
        .single();
      
      if (existingFile) {
        // Mettre à jour le fichier existant
        const { error: updateFileError } = await supabase
          .from('size_pattern_files')
          .update({
            svg_url: svgUrl,
            metadata: metadata || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingFile.id);
        
        if (updateFileError) {
          throw updateFileError;
        }
      } else {
        // Créer un nouveau fichier
        const { error: insertFileError } = await supabase
          .from('size_pattern_files')
          .insert({
            pattern_id: patternId,
            size_name: size,
            svg_url: svgUrl,
            metadata: metadata || null,
          });
        
        if (insertFileError) {
          throw insertFileError;
        }
      }
    }
    
    return NextResponse.json({
      id: patternId,
      message: existing ? 'Pattern updated' : 'Pattern created',
    });
  } catch (error) {
    console.error('Error creating/updating size pattern:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/size-patterns
 * Supprime un template de patron
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }
    
    // Supprimer le pattern (les pièces seront supprimées en cascade)
    const { error } = await supabase
      .from('size_patterns')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ message: 'Pattern deleted' });
  } catch (error) {
    console.error('Error deleting size pattern:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

