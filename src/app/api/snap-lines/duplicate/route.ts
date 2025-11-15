import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, hasServiceRoleKey } from '@/lib/supabase';

// Forcer l'exécution côté Node.js (accès aux variables serveur)
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📥 POST /api/snap-lines/duplicate - Body reçu:', body);
    
    const { sourceDesignId, targetDesignId } = body;

    if (!sourceDesignId || !targetDesignId) {
      console.log('❌ Paramètres manquants:', { sourceDesignId: !!sourceDesignId, targetDesignId: !!targetDesignId });
      return NextResponse.json({ 
        error: 'sourceDesignId et targetDesignId sont requis' 
      }, { status: 400 });
    }

    if (sourceDesignId === targetDesignId) {
      return NextResponse.json({ 
        error: 'Le design source et le design cible ne peuvent pas être identiques' 
      }, { status: 400 });
    }

    // Vérifier que les designs existent
    console.log('🔍 Vérification des designs:', { sourceDesignId, targetDesignId });
    
    const { data: sourceDesign, error: sourceError } = await supabaseAdmin
      .from('designs')
      .select('id, name')
      .eq('id', sourceDesignId)
      .single();

    if (sourceError || !sourceDesign) {
      console.log('❌ Design source non trouvé:', sourceDesignId, sourceError);
      return NextResponse.json({ 
        error: 'Design source non trouvé' 
      }, { status: 404 });
    }

    const { data: targetDesign, error: targetError } = await supabaseAdmin
      .from('designs')
      .select('id, name')
      .eq('id', targetDesignId)
      .single();

    if (targetError || !targetDesign) {
      console.log('❌ Design cible non trouvé:', targetDesignId, targetError);
      return NextResponse.json({ 
        error: 'Design cible non trouvé' 
      }, { status: 404 });
    }

    console.log('✅ Designs trouvés:', { source: sourceDesign.name, target: targetDesign.name });

    // Vérifier que le service role key est disponible
    if (!hasServiceRoleKey) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY manquant - impossible d\'ignorer RLS');
      return NextResponse.json({ error: 'Server not configured for admin writes (RLS)' }, { status: 500 });
    }

    // Récupérer les snap-lines du design source
    console.log('📋 Récupération des snap-lines du design source...');
    const { data: sourceSnapLines, error: fetchError } = await supabaseAdmin
      .from('snap_lines')
      .select('*')
      .eq('design_id', sourceDesignId);

    if (fetchError) {
      console.error('❌ Erreur récupération snap-lines source:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!sourceSnapLines || sourceSnapLines.length === 0) {
      console.log('⚠️ Aucune snap-line trouvée pour le design source');
      return NextResponse.json({ 
        duplicatedCount: 0,
        message: 'Aucune ligne magnétique à dupliquer'
      });
    }

    console.log(`📊 ${sourceSnapLines.length} snap-lines trouvées à dupliquer`);

    // Supprimer les snap-lines existantes du design cible (optionnel - commenté pour éviter la perte de données)
    // console.log('🗑️ Suppression des snap-lines existantes du design cible...');
    // const { error: deleteError } = await supabaseAdmin
    //   .from('snap_lines')
    //   .delete()
    //   .eq('design_id', targetDesignId);

    // if (deleteError) {
    //   console.error('❌ Erreur suppression snap-lines existantes:', deleteError);
    //   return NextResponse.json({ error: deleteError.message }, { status: 500 });
    // }

    // Dupliquer les snap-lines vers le design cible
    console.log('📋 Duplication des snap-lines...');
    const snapLinesToInsert = sourceSnapLines.map(line => ({
      name: line.name,
      position: line.position,
      type: line.type,
      design_id: targetDesignId
    }));

    const { data: duplicatedSnapLines, error: insertError } = await supabaseAdmin
      .from('snap_lines')
      .insert(snapLinesToInsert)
      .select();

    if (insertError) {
      console.error('❌ Erreur duplication snap-lines:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    console.log(`✅ ${duplicatedSnapLines.length} snap-lines dupliquées avec succès`);

    return NextResponse.json({
      duplicatedCount: duplicatedSnapLines.length,
      sourceDesign: sourceDesign.name,
      targetDesign: targetDesign.name,
      message: `${duplicatedSnapLines.length} lignes magnétiques dupliquées de "${sourceDesign.name}" vers "${targetDesign.name}"`
    });

  } catch (error) {
    console.error('❌ Erreur POST duplicate snap-lines:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}




