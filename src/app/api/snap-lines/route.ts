import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin, hasServiceRoleKey } from '@/lib/supabase';

// Forcer l'exécution côté Node.js (accès aux variables serveur)
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const designId = searchParams.get('designId');

    let snapLines;
    
    if (designId) {
      // Récupérer les snap-lines pour un design spécifique
      const { data, error } = await supabase
        .from('snap_lines')
        .select('*')
        .eq('design_id', designId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erreur Supabase GET snap-lines:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      snapLines = data || [];
    } else {
      // Récupérer toutes les snap-lines (pour compatibilité)
      const { data, error } = await supabase
        .from('snap_lines')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erreur Supabase GET snap-lines:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      snapLines = data || [];
    }

    // Convertir le format pour la compatibilité avec le code existant
    const formattedSnapLines = snapLines.map(line => ({
      id: line.id,
      name: line.name,
      position: line.position as [number, number], // [u, v] coordinates
      type: line.type,
      designId: line.design_id
    }));

    return NextResponse.json(formattedSnapLines);
  } catch (error) {
    console.error('Erreur GET snap-lines:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📥 POST /api/snap-lines - Body reçu:', body);
    
    const { name, position, type = 'vertical', designId } = body;

    if (!name || !position || !designId) {
      console.log('❌ Paramètres manquants:', { name: !!name, position: !!position, designId: !!designId });
      return NextResponse.json({ 
        error: 'name, position et designId sont requis' 
      }, { status: 400 });
    }

    // Vérifier que le design existe
    console.log('🔍 Vérification du design:', designId);
    const { data: design, error: designError } = await supabase
      .from('designs')
      .select('id, name')
      .eq('id', designId)
      .single();

    if (designError || !design) {
      console.log('❌ Design non trouvé:', designId, designError);
      return NextResponse.json({ 
        error: 'Design non trouvé' 
      }, { status: 404 });
    }

    console.log('✅ Design trouvé:', design.name);

    // Utiliser le client admin pour ignorer RLS lors des écritures
    if (!hasServiceRoleKey) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY manquant - impossible d\'ignorer RLS');
      return NextResponse.json({ error: 'Server not configured for admin writes (RLS)' }, { status: 500 });
    }

    const { data: snapLine, error: insertError } = await supabaseAdmin
      .from('snap_lines')
      .insert({
        name,
        position,
        type,
        design_id: designId
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erreur insertion snap-line:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    console.log('✅ Snap-line créée:', snapLine);

    return NextResponse.json({
      id: snapLine.id,
      name: snapLine.name,
      position: snapLine.position as [number, number],
      type: snapLine.type,
      designId: snapLine.design_id
    });
  } catch (error) {
    console.error('❌ Erreur POST snap-line:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, position, type } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (position !== undefined) updateData.position = position;
    if (type !== undefined) updateData.type = type;

    if (!hasServiceRoleKey) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY manquant - impossible d\'ignorer RLS');
      return NextResponse.json({ error: 'Server not configured for admin writes (RLS)' }, { status: 500 });
    }

    const { data: snapLine, error } = await supabaseAdmin
      .from('snap_lines')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erreur PUT snap-line:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      id: snapLine.id,
      name: snapLine.name,
      position: snapLine.position as [number, number],
      type: snapLine.type,
      designId: snapLine.design_id
    });
  } catch (error) {
    console.error('Erreur PUT snap-line:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    if (!hasServiceRoleKey) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY manquant - impossible d\'ignorer RLS');
      return NextResponse.json({ error: 'Server not configured for admin writes (RLS)' }, { status: 500 });
    }

    const { error } = await supabaseAdmin
      .from('snap_lines')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erreur DELETE snap-line:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur DELETE snap-line:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}