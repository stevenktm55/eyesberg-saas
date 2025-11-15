// =====================================================
// API LOGO LIBRARIES - VERSION SUPABASE
// Tables attendues:
// - logo_libraries(id uuid pk default gen_random_uuid(), name text not null, created_at timestamptz default now())
// - design_logo_libraries(design_id uuid not null, library_id uuid not null, primary key(design_id, library_id))
// - logo_library_items(library_id uuid not null, logo_id uuid not null, primary key(library_id, logo_id))
// =====================================================
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const designId = searchParams.get('designId');
    const libraryId = searchParams.get('libraryId');
    if (libraryId) {
      // Retourner les logos d'une bibliothèque
      const { data: items, error: itemsErr } = await supabase
        .from('logo_library_items')
        .select('logo_id')
        .eq('library_id', libraryId);
      if (itemsErr) {
        console.error('GET logo-libraries: logo_library_items error', itemsErr);
        return NextResponse.json([]);
      }
      const logoIds = (items || []).map((r: any) => r.logo_id).filter(Boolean);
      if (logoIds.length === 0) return NextResponse.json([]);
      const { data: logos, error: logosErr } = await supabase
        .from('logos')
        .select('*')
        .eq('active', true)
        .in('id', logoIds)
        .order('name', { ascending: true });
      if (logosErr) {
        console.error('GET logo-libraries: logos error', logosErr);
        return NextResponse.json([]);
      }
      return NextResponse.json(logos || []);
    }

    if (designId) {
      // Étape 1: liaisons design -> libraries
      const { data: links, error: linksErr } = await supabase
        .from('design_logo_libraries')
        .select('library_id')
        .eq('design_id', designId);

      if (linksErr) {
        console.error('GET logo-libraries: design_logo_libraries error', linksErr);
        // Renvoyer un tableau vide plutôt qu'une 500 pour ne pas casser l'admin si la table n'existe pas encore
        return NextResponse.json([]);
      }

      const ids = (links || []).map((r: any) => r.library_id).filter(Boolean);
      if (ids.length === 0) return NextResponse.json([]);

      const { data: libs, error: libsErr } = await supabase
        .from('logo_libraries')
        .select('id, name')
        .in('id', ids);
      if (libsErr) {
        console.error('GET logo-libraries: logo_libraries error', libsErr);
        return NextResponse.json([]);
      }
      return NextResponse.json(libs || []);
    }

    const { data, error } = await supabase
      .from('logo_libraries')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('GET logo-libraries: list error', error);
      return NextResponse.json([]);
    }
    return NextResponse.json(data || []);
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { name, action } = body || {};

    if (action === 'assign_designs') {
      const { designId, libraryIds } = body as { designId: string; libraryIds: string[] };
      if (!designId) return NextResponse.json({ error: 'designId required' }, { status: 400 });

      // Supprimer existants puis insérer
      await supabase.from('design_logo_libraries').delete().eq('design_id', designId);
      if (Array.isArray(libraryIds) && libraryIds.length > 0) {
        const rows = libraryIds.map((lid) => ({ design_id: designId, library_id: lid }));
        const { error: insErr } = await supabase.from('design_logo_libraries').insert(rows);
        if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'attach_logo') {
      const { libraryId, logoId } = body as { libraryId: string; logoId: string };
      if (!libraryId || !logoId) return NextResponse.json({ error: 'libraryId and logoId required' }, { status: 400 });
      const { error } = await supabase.from('logo_library_items').upsert({ library_id: libraryId, logo_id: logoId });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (action === 'detach_logo') {
      const { libraryId, logoId } = body as { libraryId: string; logoId: string };
      if (!libraryId || !logoId) return NextResponse.json({ error: 'libraryId and logoId required' }, { status: 400 });
      const { error } = await supabase.from('logo_library_items').delete().match({ library_id: libraryId, logo_id: logoId });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (!name || typeof name !== 'string') return NextResponse.json({ error: 'name required' }, { status: 400 });
    const { data, error } = await supabase.from('logo_libraries').insert({ name }).select('*').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    // Nettoyer les liaisons
    await supabase.from('design_logo_libraries').delete().eq('library_id', id);
    await supabase.from('logo_library_items').delete().eq('library_id', id);
    const { error } = await supabase.from('logo_libraries').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


