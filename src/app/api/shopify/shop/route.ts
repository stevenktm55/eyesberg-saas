import { NextRequest, NextResponse } from 'next/server';
import { getShopByDomain } from '@/lib/shopify-shops';

/**
 * API pour récupérer les informations d'une boutique Shopify
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

    // Récupérer les infos de la boutique depuis Supabase
    const shopData = await getShopByDomain(shop);

    if (!shopData) {
      return NextResponse.json(
        { error: 'Boutique non trouvée. Assurez-vous que l\'installation a réussi.' },
        { status: 404 }
      );
    }

    // Ne pas retourner le access_token pour des raisons de sécurité
    const { access_token, ...safeShopData } = shopData;

    return NextResponse.json(safeShopData);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de la boutique:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des données de la boutique' },
      { status: 500 }
    );
  }
}

