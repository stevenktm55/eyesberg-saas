import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSubdomain } from '@/lib/get-subdomain';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('shopify_product_id');
    const modelId = searchParams.get('model_id');
    const shopDomain = searchParams.get('shop');

    // Récupérer le subdomain depuis product_builder si shopDomain est fourni
    let subdomain: string | null = null;
    
    if (shopDomain) {
      try {
        const { data: product } = await supabaseAdmin
          .from('product_builder')
          .select('subdomain')
          .eq('shop_domain', shopDomain)
          .limit(1)
          .maybeSingle();
        
        if (product?.subdomain) {
          subdomain = product.subdomain;
        }
      } catch (error) {
        console.warn('Could not fetch subdomain from shop_domain for product-mappings API:', error);
      }
    }
    
    // Fallback: essayer de récupérer le subdomain depuis les headers/session
    if (!subdomain) {
      subdomain = await getSubdomain(request);
    }
    
    // Note: product_mappings n'a pas de colonne subdomain dans la structure actuelle
    // Le filtrage se fait via shopify_product_id
    let query = supabaseAdmin.from('product_mappings').select('*');
    
    if (productId) {
      query = query.eq('shopify_product_id', productId).maybeSingle();
    } else if (modelId) {
      query = query.eq('model_id', modelId).maybeSingle();
    } else {
      query = query.order('created_at', { ascending: false });
    }
    
    const { data, error } = await query;

    if (error) {
      console.error('[API/product-mappings] Erreur Supabase GET product_mappings:', error.message);
      console.error('[API/product-mappings] Error details:', error.details);
      console.error('[API/product-mappings] Error hint:', error.hint);
      console.error('[API/product-mappings] Error code:', error.code);
      console.error('[API/product-mappings] Full error:', JSON.stringify(error, null, 2));
      
      // Si l'erreur est liée à une table inexistante ou une colonne manquante, retourner null ou un tableau vide
      if (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('column')) {
        console.warn('[API/product-mappings] Table ou colonne inexistante, retour de null');
        return NextResponse.json(null);
      }
      
      // Si l'erreur est liée à RLS (Row Level Security), retourner null
      if (error.code === '42501' || error.message?.includes('permission denied') || error.message?.includes('RLS')) {
        console.warn('[API/product-mappings] Erreur RLS, retour de null');
        return NextResponse.json(null);
      }
      
      return NextResponse.json({ 
        error: error.message || 'Failed to fetch product mappings',
        details: error.details || error.hint || null
      }, { status: 500 });
    }
    
    // Si maybeSingle() est utilisé et qu'aucun résultat n'est trouvé, data sera null
    // C'est normal, on retourne null dans ce cas
    return NextResponse.json(data ?? null);
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
