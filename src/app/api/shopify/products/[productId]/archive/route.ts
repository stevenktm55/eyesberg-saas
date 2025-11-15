import { NextRequest, NextResponse } from 'next/server';
import { getShopByDomain } from '@/lib/shopify-shops';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * API pour archiver un produit Shopify
 * POST /api/shopify/products/[productId]/archive?shop=eyesbergtest.myshopify.com
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop');
    const productId = params.productId;

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

    // Vérifier que le produit existe et appartient à la boutique
    const { data: product, error: productError } = await supabaseAdmin
      .from('shopify_products')
      .select('id')
      .eq('id', productId)
      .eq('shop_id', shopData.id)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      );
    }

    // Archiver le produit (désactiver pour le configurateur)
    const { error: updateError } = await supabaseAdmin
      .from('shopify_products')
      .update({ enabled_for_configurator: false })
      .eq('id', productId);

    if (updateError) {
      console.error('❌ Erreur lors de l\'archivage du produit:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de l\'archivage du produit', details: updateError.message },
        { status: 500 }
      );
    }

    // Optionnel : Marquer la configuration comme non publiée
    await supabaseAdmin
      .from('shopify_product_configs')
      .update({ is_published: false })
      .eq('shopify_product_id', productId);

    return NextResponse.json({
      success: true,
      message: 'Produit archivé avec succès',
    });
  } catch (error) {
    console.error('❌ Erreur lors de l\'archivage du produit:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors de l\'archivage du produit',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}

