import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

type ProductLinkPayload = {
  id?: string;
  primary_product_id?: string;
  primary_design_id?: string | null;
  linked_product_id?: string;
  linked_design_id?: string | null;
  linked_variant_id?: string | null;
  auto_apply_colors?: boolean;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const primaryProductId = searchParams.get('primary_product_id');
    const primaryDesignId = searchParams.get('primary_design_id');
    const linkedProductId = searchParams.get('linked_product_id');

    let query = supabaseAdmin.from('product_links').select('*');

    if (primaryProductId) {
      query = query.eq('primary_product_id', primaryProductId);
    }

    if (primaryDesignId) {
      if (primaryDesignId === 'null') {
        query = query.is('primary_design_id', null);
      } else {
        query = query.eq('primary_design_id', primaryDesignId);
      }
    }

    if (linkedProductId) {
      query = query.eq('linked_product_id', linkedProductId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: ProductLinkPayload = await request.json();
    const {
      primary_product_id,
      primary_design_id,
      linked_product_id,
      linked_design_id,
      linked_variant_id,
      auto_apply_colors = true,
    } = body || {};

    if (!primary_product_id || !linked_product_id) {
      return NextResponse.json(
        { error: 'primary_product_id and linked_product_id are required' },
        { status: 400 }
      );
    }

    const insertPayload = {
      primary_product_id,
      primary_design_id: primary_design_id ?? null,
      linked_product_id,
      linked_design_id: linked_design_id ?? null,
      linked_variant_id: linked_variant_id ?? null,
      auto_apply_colors,
    };

    const { data, error } = await supabaseAdmin
      .from('product_links')
      .insert(insertPayload)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'failed' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body: ProductLinkPayload = await request.json();
    const {
      id,
      primary_product_id,
      primary_design_id,
      linked_product_id,
      linked_design_id,
      linked_variant_id,
      auto_apply_colors,
    } = body || {};

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updatePayload: Record<string, unknown> = {};

    if (primary_product_id !== undefined) {
      updatePayload.primary_product_id = primary_product_id;
    }

    if (primary_design_id !== undefined) {
      updatePayload.primary_design_id = primary_design_id;
    }

    if (linked_product_id !== undefined) {
      updatePayload.linked_product_id = linked_product_id;
    }

    if (linked_design_id !== undefined) {
      updatePayload.linked_design_id = linked_design_id;
    }

    if (linked_variant_id !== undefined) {
      updatePayload.linked_variant_id = linked_variant_id;
    }

    if (auto_apply_colors !== undefined) {
      updatePayload.auto_apply_colors = auto_apply_colors;
    }

    updatePayload.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('product_links')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('product_links')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'failed' },
      { status: 500 }
    );
  }
}



