import { NextRequest, NextResponse } from 'next/server';
import { getShopByDomain } from '@/lib/shopify-shops';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * API pour activer/désactiver un produit pour le configurateur
 * PUT /api/shopify/products/[productId]/enable?shop=...&enabled=true
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop');
    const enabled = searchParams.get('enabled') === 'true';

    if (!shop) {
      return NextResponse.json(
        { error: 'Paramètre "shop" manquant' },
        { status: 400 }
      );
    }

    // Valider le format du shop
    if (!shop.match(/^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/)) {
      return NextResponse.json(
        { error: 'Format de boutique invalide' },
        { status: 400 }
      );
    }

    // Récupérer la boutique
    const shopData = await getShopByDomain(shop);
    if (!shopData) {
      return NextResponse.json(
        { error: 'Boutique non trouvée' },
        { status: 404 }
      );
    }

    // Mettre à jour le produit
    const { data, error } = await supabaseAdmin
      .from('shopify_products')
      .update({ enabled_for_configurator: enabled })
      .eq('shop_id', shopData.id)
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur lors de la mise à jour du produit:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du produit', details: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product: data,
      enabled,
    });
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du produit:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors de la mise à jour du produit',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}














