import { NextRequest, NextResponse } from 'next/server';
import { getShopByDomain } from '@/lib/shopify-shops';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * API pour récupérer un produit Shopify avec sa configuration
 * GET /api/shopify/products/[productId]?shop=eyesbergtest.myshopify.com
 */
export async function GET(
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

    // Récupérer le produit depuis shopify_products
    const { data: product, error: productError } = await supabaseAdmin
      .from('shopify_products')
      .select('*')
      .eq('id', productId)
      .eq('shop_id', shopData.id)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      );
    }

    // Récupérer la configuration si elle existe
    const { data: config } = await supabaseAdmin
      .from('shopify_product_configs')
      .select('*')
      .eq('shopify_product_id', productId)
      .single();

    // Construire la réponse
    const response = {
      success: true,
      product: {
        id: product.id,
        shopify_product_id: product.shopify_product_id,
        shopify_product_title: product.shopify_product_title,
        shopify_product_handle: product.shopify_product_handle,
        shopify_product_image_url: product.shopify_product_image_url,
        shopify_product_status: product.shopify_product_status,
        shopify_variants: product.shopify_variants,
        enabled_for_configurator: product.enabled_for_configurator,
        model_id: product.model_id,
        design_ids: product.design_ids,
      },
      config: config ? {
        id: config.id,
        productName: config.product_name || product.shopify_product_title,
        modelUrl: config.model_url,
        questions: config.questions || [],
        layers: config.layers || [],
        basePrice: config.base_price,
        pricingConfig: config.pricing_config || {},
        isPublished: config.is_published || false,
        publishedAt: config.published_at,
      } : null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du produit:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors de la récupération du produit',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}

/**
 * API pour supprimer un produit Shopify et sa configuration
 * DELETE /api/shopify/products/[productId]?shop=eyesbergtest.myshopify.com
 */
export async function DELETE(
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

    // Supprimer la configuration d'abord (CASCADE devrait le faire automatiquement, mais on le fait explicitement)
    await supabaseAdmin
      .from('shopify_product_configs')
      .delete()
      .eq('shopify_product_id', productId);

    // Supprimer le produit
    const { error: deleteError } = await supabaseAdmin
      .from('shopify_products')
      .delete()
      .eq('id', productId);

    if (deleteError) {
      console.error('❌ Erreur lors de la suppression du produit:', deleteError);
      return NextResponse.json(
        { error: 'Erreur lors de la suppression du produit', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Produit supprimé avec succès',
    });
  } catch (error) {
    console.error('❌ Erreur lors de la suppression du produit:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors de la suppression du produit',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}

