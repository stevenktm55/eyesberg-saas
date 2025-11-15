import { NextRequest, NextResponse } from 'next/server';
import { getShopByDomain } from '@/lib/shopify-shops';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * API pour sauvegarder la configuration d'un produit
 * PUT /api/shopify/products/[productId]/config?shop=eyesbergtest.myshopify.com
 */
export async function PUT(
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

    // Récupérer les données de la requête
    const body = await request.json();
    const {
      productName,
      modelUrl,
      questions = [],
      layers = [],
      basePrice,
      pricingConfig = {},
    } = body;

    // Vérifier si une configuration existe déjà
    const { data: existingConfig } = await supabaseAdmin
      .from('shopify_product_configs')
      .select('id')
      .eq('shopify_product_id', productId)
      .single();

    const configData = {
      shopify_product_id: productId,
      product_name: productName || null,
      model_url: modelUrl || null,
      questions: questions,
      layers: layers,
      base_price: basePrice || null,
      pricing_config: pricingConfig,
      updated_at: new Date().toISOString(),
    };

    if (existingConfig) {
      // Mise à jour de la configuration existante
      const { data, error } = await supabaseAdmin
        .from('shopify_product_configs')
        .update(configData)
        .eq('id', existingConfig.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur lors de la mise à jour de la configuration:', error);
        return NextResponse.json(
          { error: 'Erreur lors de la sauvegarde de la configuration', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Configuration mise à jour avec succès',
        config: data,
      });
    } else {
      // Création d'une nouvelle configuration
      const { data, error } = await supabaseAdmin
        .from('shopify_product_configs')
        .insert(configData)
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur lors de la création de la configuration:', error);
        return NextResponse.json(
          { error: 'Erreur lors de la sauvegarde de la configuration', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Configuration créée avec succès',
        config: data,
      });
    }
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde de la configuration:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors de la sauvegarde de la configuration',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}

