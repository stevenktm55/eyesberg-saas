// =====================================================
// API ZONE CATEGORY PRESETS (global reusable placements)
// =====================================================
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('zone_category_presets')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (e) {
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name: string | undefined = body?.name?.trim();
    if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

    // upsert by unique name
    const { data, error } = await supabase
      .from('zone_category_presets')
      .upsert({ name }, { onConflict: 'name' })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });
    const { error } = await supabase
      .from('zone_category_presets')
      .delete()
      .eq('name', name);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}




