import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;
    const body = await request.json();
    const { shopifyProductId, shopifyVariantId, shopDomain } = body;

    if (!shopifyProductId || !shopifyVariantId) {
      return NextResponse.json(
        { error: 'shopifyProductId and shopifyVariantId are required' },
        { status: 400 }
      );
    }

    // TODO: Sauvegarder dans la base de données
    // Pour l'instant, on retourne juste un succès
    // Vous devrez adapter cela selon votre structure de base de données
    
    console.log('🔗 Linking product:', {
      productId,
      shopifyProductId,
      shopifyVariantId,
      shopDomain,
    });

    // Ici, vous devriez mettre à jour votre produit dans la base de données
    // Par exemple avec Supabase :
    // const { data, error } = await supabase
    //   .from('products')
    //   .update({
    //     shopify_product_id: shopifyProductId,
    //     shopify_variant_id: shopifyVariantId,
    //     shopify_shop_domain: shopDomain,
    //   })
    //   .eq('id', productId);

    return NextResponse.json({
      success: true,
      message: 'Product linked successfully',
      data: {
        productId,
        shopifyProductId,
        shopifyVariantId,
        shopDomain,
      },
    });
  } catch (error) {
    console.error('❌ Error linking product:', error);
    return NextResponse.json(
      {
        error: 'Failed to link product',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

