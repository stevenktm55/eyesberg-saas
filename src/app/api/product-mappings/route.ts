import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('shopify_product_id');
    const modelId = searchParams.get('model_id');
    
    let query = supabaseAdmin.from('product_mappings').select('*');
    
    if (productId) {
      query = query.eq('shopify_product_id', productId).maybeSingle();
    } else if (modelId) {
      query = query.eq('model_id', modelId).maybeSingle();
    } else {
      query = query.order('created_at', { ascending: false });
    }
    
    const { data, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { shopify_product_id, model_id, design_ids, model_type } = body || {};
    if (!shopify_product_id || !model_id) {
      return NextResponse.json({ error: 'shopify_product_id and model_id are required' }, { status: 400 });
    }
    const insertData: any = {
      shopify_product_id,
      model_id,
      design_ids: Array.isArray(design_ids) ? design_ids : []
    };
    if (model_type) {
      insertData.model_type = model_type;
    }
    const { data, error } = await supabaseAdmin.from('product_mappings').insert(insertData).select('*').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'failed' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, shopify_product_id, model_id, design_ids, model_type } = body || {};
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    const update: any = {};
    if (shopify_product_id !== undefined) update.shopify_product_id = shopify_product_id;
    if (model_id !== undefined) update.model_id = model_id;
    if (design_ids !== undefined) update.design_ids = Array.isArray(design_ids) ? design_ids : [];
    if (model_type !== undefined) update.model_type = model_type;
    const { data, error } = await supabaseAdmin.from('product_mappings').update(update).eq('id', id).select('*').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'failed' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    const { error } = await supabaseAdmin.from('product_mappings').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'failed' }, { status: 500 });
  }
}
