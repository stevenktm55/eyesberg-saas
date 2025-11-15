import { NextRequest, NextResponse } from 'next/server';
import { getShopByDomain } from '@/lib/shopify-shops';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * API pour publier un produit (le rendre disponible pour les clients)
 * POST /api/shopify/products/[productId]/publish?shop=eyesbergtest.myshopify.com
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

    // Vérifier qu'une configuration existe
    const { data: config, error: configError } = await supabaseAdmin
      .from('shopify_product_configs')
      .select('id')
      .eq('shopify_product_id', productId)
      .single();

    if (configError || !config) {
      return NextResponse.json(
        { error: 'Configuration non trouvée. Veuillez d\'abord sauvegarder la configuration.' },
        { status: 400 }
      );
    }

    // Publier le produit (mettre is_published à true)
    const { data: updatedConfig, error: updateError } = await supabaseAdmin
      .from('shopify_product_configs')
      .update({
        is_published: true,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', config.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erreur lors de la publication:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de la publication', details: updateError.message },
        { status: 500 }
      );
    }

    // Activer aussi le produit dans shopify_products
    await supabaseAdmin
      .from('shopify_products')
      .update({ enabled_for_configurator: true })
      .eq('id', productId);

    return NextResponse.json({
      success: true,
      message: 'Produit publié avec succès',
      config: updatedConfig,
    });
  } catch (error) {
    console.error('❌ Erreur lors de la publication:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors de la publication',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}

