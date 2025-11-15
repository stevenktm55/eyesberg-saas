import { NextRequest, NextResponse } from 'next/server';
import { syncShopifyProducts } from '@/lib/shopify-products';

/**
 * API pour synchroniser les produits Shopify d'une boutique
 * POST /api/shopify/products/sync?shop=eyesbergtest.myshopify.com
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop');

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

    console.log(`🔄 Démarrage de la synchronisation des produits pour ${shop}...`);

    // Synchroniser les produits
    const result = await syncShopifyProducts(shop);

    return NextResponse.json({
      success: true,
      shop,
      result,
      message: `Synchronisation terminée: ${result.synced} nouveaux, ${result.updated} mis à jour, ${result.errors} erreurs`,
    });
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation des produits:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors de la synchronisation des produits',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}


