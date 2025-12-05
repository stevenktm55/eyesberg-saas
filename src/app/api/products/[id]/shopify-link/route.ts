import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSubdomain } from '@/lib/get-subdomain';

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

    const subdomain = await getSubdomain(request);
    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain is required' },
        { status: 400 }
      );
    }

    console.log('🔗 Linking product:', {
      productId,
      shopifyProductId,
      shopifyVariantId,
      shopDomain,
      subdomain,
    });

    // Récupérer le produit existant pour vérifier qu'il existe
    const { data: existingProduct, error: fetchError } = await supabaseAdmin
      .from('product_builder')
      .select('id, builder_data')
      .eq('id', productId)
      .eq('subdomain', subdomain)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }
      throw fetchError;
    }

    // Mettre à jour le produit avec les IDs Shopify
    // On stocke les IDs Shopify dans builder_data pour l'instant
    // Vous pouvez aussi ajouter des colonnes dédiées si nécessaire
    const builderData = existingProduct.builder_data || {};
    const updatedBuilderData = {
      ...builderData,
      shopify: {
        productId: shopifyProductId,
        variantId: shopifyVariantId,
        shopDomain: shopDomain,
        linkedAt: new Date().toISOString(),
      },
    };

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('product_builder')
      .update({
        shop_domain: shopDomain || null,
        builder_data: updatedBuilderData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId)
      .eq('subdomain', subdomain)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating product:', updateError);
      throw updateError;
    }

    console.log('✅ Product linked successfully:', updated);

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

