import { NextRequest, NextResponse } from 'next/server';
import { getShopByDomain } from '@/lib/shopify-shops';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

/**
 * API pour générer un snapshot par défaut d'un produit pour l'aperçu
 * POST /api/admin/preview/generate-snapshot
 * 
 * Génère une configuration par défaut basée sur les données du product builder
 * et retourne l'URL du configurateur avec cette configuration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, shop } = body;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    let shopData = null;
    let product = null;
    let productConfig = null;
    let variantId = null;

    // Si shop est fourni, récupérer la boutique et le produit Shopify
    if (shop) {
      shopData = await getShopByDomain(shop);
      if (shopData) {
        // Récupérer le produit Shopify
        const { data: shopifyProduct } = await supabaseAdmin
          .from('shopify_products')
          .select('id, shopify_product_id, shopify_product_title')
          .eq('id', productId)
          .eq('shop_id', shopData.id)
          .single();

        if (shopifyProduct) {
          product = shopifyProduct;

          // Récupérer la configuration du produit depuis le product builder
          const { data: config } = await supabaseAdmin
            .from('shopify_product_configs')
            .select('*')
            .eq('shopify_product_id', productId)
            .single();

          productConfig = config || null;

          // Récupérer la première variante disponible
          const { data: variants } = await supabaseAdmin
            .from('shopify_product_variants')
            .select('shopify_variant_id')
            .eq('shopify_product_id', product.shopify_product_id)
            .limit(1);

          variantId = variants && variants.length > 0 ? variants[0].shopify_variant_id : null;
        }
      }
    }

    // Si pas de produit Shopify trouvé, essayer de récupérer directement la config du product builder
    if (!productConfig && !product) {
      const { data: config } = await supabaseAdmin
        .from('shopify_product_configs')
        .select('*')
        .eq('shopify_product_id', productId)
        .single();

      productConfig = config || null;
    }

    // Créer une configuration par défaut pour l'aperçu
    // On utilise les données du product builder si disponibles
    const configData = {
      modelUrl: productConfig?.model_url || null,
      designId: null,
      designUrl: null,
      colors: {
        primary: '#000000',
        secondary: '#FFFFFF',
        tertiary: '#FF0000',
      },
      texts: [],
      logos: [],
      productId: product?.shopify_product_id || productId,
      variantId: variantId || undefined,
    };

    // Générer un ID de configuration temporaire pour l'aperçu
    const previewConfigId = crypto.randomUUID();
    const shareToken = crypto.randomUUID();

    // Sauvegarder la configuration temporaire dans la table configurations
    // Pour que le configurateur puisse la charger
    const { error: saveError } = await supabaseAdmin
      .from('configurations')
      .insert({
        id: previewConfigId,
        config_data: configData,
        customer_email: null,
        preview_image_url: null,
        status: 'draft',
        share_token: shareToken,
        product_name: product?.shopify_product_title || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (saveError) {
      console.error('Error saving preview config:', saveError);
      // Ne pas bloquer si la sauvegarde échoue, on peut quand même générer l'URL
    }

    // Construire l'URL du configurateur avec la configuration
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://eyesberg.app';
    const urlParams = new URLSearchParams();
    urlParams.append('config', previewConfigId);
    if (product?.shopify_product_id) {
      urlParams.append('productId', product.shopify_product_id);
    } else {
      urlParams.append('productId', productId);
    }
    if (variantId) {
      urlParams.append('variantId', variantId);
    }
    if (shop) {
      urlParams.append('shop', shop);
    }
    urlParams.append('preview', 'true');
    
    const configuratorUrl = `${baseUrl}/configure?${urlParams.toString()}`;

    return NextResponse.json({
      success: true,
      configuratorUrl,
      configId: previewConfigId,
      config: configData,
    });
  } catch (error) {
    console.error('Error generating preview snapshot:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate preview snapshot',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
