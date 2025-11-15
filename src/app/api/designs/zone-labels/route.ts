import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Stores per-design labels for 4 placement categories
// Table expected: design_zone_labels(design_id text pk, torse text, dos text, bras_gauche text, bras_droit text, updated_at timestamptz)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const designId = searchParams.get('designId');
    if (!designId) return NextResponse.json({ error: 'designId required' }, { status: 400 });

    const { data, error } = await supabase
      .from('design_zone_labels')
      .select('*')
      .eq('design_id', designId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116: Row not found
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      torse: data?.torse ?? 'Torse',
      dos: data?.dos ?? 'Dos',
      brasGauche: data?.bras_gauche ?? 'Bras gauche',
      brasDroit: data?.bras_droit ?? 'Bras droit',
    });
  } catch (e) {
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { designId, labels } = body as { designId?: string; labels?: { torse: string; dos: string; brasGauche: string; brasDroit: string } };
    if (!designId || !labels) return NextResponse.json({ error: 'designId and labels required' }, { status: 400 });

    const payload = {
      design_id: designId,
      torse: labels.torse || 'Torse',
      dos: labels.dos || 'Dos',
      bras_gauche: labels.brasGauche || 'Bras gauche',
      bras_droit: labels.brasDroit || 'Bras droit',
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('design_zone_labels')
      .upsert(payload, { onConflict: 'design_id' })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}




