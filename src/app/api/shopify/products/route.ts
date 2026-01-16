import { NextRequest, NextResponse } from 'next/server';
import { getSyncedProducts } from '@/lib/shopify-products';

/**
 * API pour récupérer les produits synchronisés d'une boutique
 * GET /api/shopify/products?shop=eyesbergtest.myshopify.com
 */
export async function GET(request: NextRequest) {
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

    // Récupérer les produits synchronisés
    const products = await getSyncedProducts(shop);

    return NextResponse.json({
      success: true,
      shop,
      products,
      count: products.length,
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des produits:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors de la récupération des produits',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}














