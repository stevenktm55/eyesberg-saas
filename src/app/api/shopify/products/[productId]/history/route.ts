import { NextRequest, NextResponse } from 'next/server';
import { getShopByDomain } from '@/lib/shopify-shops';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * API pour récupérer l'historique des versions d'un produit
 * GET /api/shopify/products/[productId]/history?shop=eyesbergtest.myshopify.com
 * 
 * Note: Pour l'instant, on retourne l'historique basé sur les timestamps de mise à jour.
 * Dans le futur, on pourrait implémenter un vrai système de versioning.
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

    // Vérifier que le produit existe et appartient à la boutique
    const { data: product, error: productError } = await supabaseAdmin
      .from('shopify_products')
      .select('id, created_at, updated_at')
      .eq('id', productId)
      .eq('shop_id', shopData.id)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      );
    }

    // Récupérer la configuration actuelle
    const { data: config } = await supabaseAdmin
      .from('shopify_product_configs')
      .select('*')
      .eq('shopify_product_id', productId)
      .single();

    // Pour l'instant, on retourne une version basique
    // Dans le futur, on pourrait avoir une table shopify_product_config_versions
    const history = [
      {
        id: 'current',
        version: 'Current',
        createdAt: config?.updated_at || product.updated_at,
        createdBy: 'System', // TODO: Ajouter un champ user_id
        changes: config ? {
          questions: config.questions?.length || 0,
          layers: config.layers?.length || 0,
          isPublished: config.is_published || false,
        } : null,
      },
      {
        id: 'initial',
        version: 'Initial',
        createdAt: product.created_at,
        createdBy: 'System',
        changes: null,
      },
    ];

    return NextResponse.json({
      success: true,
      productId,
      history,
      // Note: Pour un vrai système de versioning, il faudrait une table dédiée
      // avec des snapshots de chaque version de la configuration
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de l\'historique:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors de la récupération de l\'historique',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}

