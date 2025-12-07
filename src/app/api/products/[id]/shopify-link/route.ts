// =====================================================
// API POUR LIER UN PRODUIT BUILDER À UN PRODUIT SHOPIFY
// =====================================================
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSubdomain } from '@/lib/get-subdomain';
import { generateSnapshot } from '@/lib/snapshot-generator';

/**
 * POST /api/products/[id]/shopify-link
 * Lie un produit builder à un produit Shopify et génère un snapshot
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;
    const subdomain = await getSubdomain(request);
    
    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { shopifyProductId, shopifyVariantId, shopDomain } = body;

    if (!shopifyProductId) {
      return NextResponse.json(
        { error: 'shopifyProductId is required' },
        { status: 400 }
      );
    }

    // Récupérer le produit builder actuel
    const { data: product, error: fetchError } = await supabaseAdmin
      .from('product_builder')
      .select('*')
      .eq('id', productId)
      .eq('subdomain', subdomain)
      .single();

    if (fetchError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Générer le snapshot depuis builder_data
    console.log('📸 Génération du snapshot pour le produit:', productId);
    const snapshot = await generateSnapshot(
      product.builder_data || {},
      shopDomain || product.shop_domain || '',
      shopifyProductId
    );

    console.log('✅ Snapshot généré:', {
      productId: snapshot.productId,
      version: snapshot.version,
      modulesCount: snapshot.customizationModules.length
    });

    // Mettre à jour le produit avec le snapshot et le lien Shopify
    // Stocker le snapshot dans builder_data.publishedSnapshot (la colonne published_snapshot n'existe pas encore)
    const currentBuilderData = product.builder_data || {};
    currentBuilderData.publishedSnapshot = snapshot;
    currentBuilderData.publishedAt = new Date().toISOString();
    currentBuilderData.snapshotVersion = 1;
    
    // Mettre à jour aussi le shopify dans builder_data pour compatibilité
    if (!currentBuilderData.shopify) {
      currentBuilderData.shopify = {};
    }
    currentBuilderData.shopify.productId = shopifyProductId;
    currentBuilderData.shopify.variantId = shopifyVariantId || null;

    const updateData: any = {
      shopify_product_id: shopifyProductId,
      shopify_variant_id: shopifyVariantId || null,
      builder_data: currentBuilderData,
      updated_at: new Date().toISOString()
    };

    // Si shopDomain est fourni et différent, le mettre à jour
    if (shopDomain && shopDomain !== product.shop_domain) {
      updateData.shop_domain = shopDomain;
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('product_builder')
      .update(updateData)
      .eq('id', productId)
      .eq('subdomain', subdomain)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erreur lors de la mise à jour:', updateError);
      throw updateError;
    }

    console.log('✅ Produit lié et snapshot publié avec succès');

    return NextResponse.json({
      success: true,
      product: updated,
      snapshot: snapshot
    });

  } catch (error: any) {
    console.error('❌ Erreur lors du lien Shopify:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
