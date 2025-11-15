import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface ShopifyProduct {
  id: string;
  shopify_product_id: string;
  shopify_product_title: string;
  model_id: string | null;
  design_id: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  model?: {
    id: string;
    name: string;
    fileUrl: string;
  };
  design?: {
    id: string;
    name: string;
    svgUrl: string;
  };
}

// =====================================================
// GET - Récupérer toutes les associations produits
// =====================================================
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('shopify_products')
      .select('*');

    if (error) {
      console.error('Erreur Supabase GET shopify_products:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Erreur GET shopify_products:', err);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

// =====================================================
// POST - Créer une nouvelle association produit
// =====================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shopify_product_id, shopify_product_title, model_id, design_id, active = true } = body;

    if (!shopify_product_id || !shopify_product_title) {
      return NextResponse.json({ error: 'shopify_product_id et shopify_product_title sont requis' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('shopify_products')
      .insert({
        shopify_product_id,
        shopify_product_title,
        model_id: model_id || null,
        design_id: design_id || null,
        active
      })
      .select('*')
      .single();

    if (error) {
      console.error('Erreur Supabase POST shopify_products:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Erreur POST shopify_products:', err);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

// =====================================================
// PUT - Mettre à jour une association produit
// =====================================================
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, shopify_product_id, shopify_product_title, model_id, design_id, active } = body;

    if (!id) {
      return NextResponse.json({ error: 'id est requis' }, { status: 400 });
    }

    const updateData: any = {};
    if (shopify_product_id !== undefined) updateData.shopify_product_id = shopify_product_id;
    if (shopify_product_title !== undefined) updateData.shopify_product_title = shopify_product_title;
    if (model_id !== undefined) updateData.model_id = model_id || null;
    if (design_id !== undefined) updateData.design_id = design_id || null;
    if (active !== undefined) updateData.active = active;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('shopify_products')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Erreur Supabase PUT shopify_products:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Erreur PUT shopify_products:', err);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

// =====================================================
// DELETE - Supprimer une association produit
// =====================================================
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id est requis' }, { status: 400 });
    }

    const { error } = await supabase
      .from('shopify_products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erreur Supabase DELETE shopify_products:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Erreur DELETE shopify_products:', err);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
