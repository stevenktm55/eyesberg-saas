import { NextRequest, NextResponse } from 'next/server';
import { getShopByDomain } from '@/lib/shopify-shops';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * API pour dupliquer un produit Shopify avec sa configuration
 * POST /api/shopify/products/[productId]/duplicate?shop=eyesbergtest.myshopify.com
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

    // Récupérer le produit original
    const { data: originalProduct, error: productError } = await supabaseAdmin
      .from('shopify_products')
      .select('*')
      .eq('id', productId)
      .eq('shop_id', shopData.id)
      .single();

    if (productError || !originalProduct) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      );
    }

    // Récupérer la configuration si elle existe
    const { data: originalConfig } = await supabaseAdmin
      .from('shopify_product_configs')
      .select('*')
      .eq('shopify_product_id', productId)
      .single();

    // Récupérer les données de la requête
    const body = await request.json();
    const { productName, questions = [], layers = [], modelUrl, basePrice, pricingConfig = {} } = body;

    // Créer le nouveau produit (copie)
    const { data: newProduct, error: newProductError } = await supabaseAdmin
      .from('shopify_products')
      .insert({
        shop_id: shopData.id,
        shopify_product_id: originalProduct.shopify_product_id, // Même produit Shopify, mais nouvelle config
        shopify_product_title: productName || `${originalProduct.shopify_product_title} (Copy)`,
        shopify_product_handle: originalProduct.shopify_product_handle,
        shopify_product_image_url: originalProduct.shopify_product_image_url,
        shopify_product_status: originalProduct.shopify_product_status,
        shopify_variants: originalProduct.shopify_variants,
        enabled_for_configurator: originalProduct.enabled_for_configurator,
        model_id: originalProduct.model_id,
        design_ids: originalProduct.design_ids,
      })
      .select()
      .single();

    if (newProductError || !newProduct) {
      console.error('❌ Erreur lors de la création du produit dupliqué:', newProductError);
      return NextResponse.json(
        { error: 'Erreur lors de la duplication du produit', details: newProductError?.message },
        { status: 500 }
      );
    }

    // Créer la nouvelle configuration si elle existe
    if (originalConfig) {
      const { error: configError } = await supabaseAdmin
        .from('shopify_product_configs')
        .insert({
          shopify_product_id: newProduct.id,
          product_name: productName || originalConfig.product_name,
          model_url: modelUrl || originalConfig.model_url,
          questions: questions.length > 0 ? questions : originalConfig.questions || [],
          layers: layers.length > 0 ? layers : originalConfig.layers || [],
          base_price: basePrice || originalConfig.base_price,
          pricing_config: Object.keys(pricingConfig).length > 0 ? pricingConfig : originalConfig.pricing_config || {},
          is_published: false, // Nouveau produit non publié par défaut
        });

      if (configError) {
        console.error('❌ Erreur lors de la création de la configuration dupliquée:', configError);
        // Ne pas échouer si la config ne peut pas être créée, le produit est déjà créé
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Produit dupliqué avec succès',
      id: newProduct.id,
    });
  } catch (error) {
    console.error('❌ Erreur lors de la duplication du produit:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors de la duplication du produit',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}

