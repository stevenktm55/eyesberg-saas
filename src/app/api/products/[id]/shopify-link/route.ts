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
      modulesCount: snapshot.customizationModules.length,
      hasModel3D: !!snapshot.model3D,
      hasDesign2D: !!snapshot.design2D,
      model3DUrl: snapshot.model3D?.url,
      design2DUrl: snapshot.design2D?.url
    });

    // Mettre à jour le produit avec le snapshot et le lien Shopify
    // Stocker le snapshot dans builder_data.publishedSnapshot (pas de colonne dédiée nécessaire)
    const currentBuilderData = product.builder_data || {};
    
    // Supprimer l'ancien snapshot s'il existe pour s'assurer qu'on écrase complètement
    if (currentBuilderData.publishedSnapshot) {
      console.log('🗑️ Suppression de l\'ancien snapshot avant sauvegarde du nouveau');
      delete currentBuilderData.publishedSnapshot;
    }
    
    if (!currentBuilderData.shopify) {
      currentBuilderData.shopify = {};
    }
    currentBuilderData.shopify.productId = shopifyProductId;
    currentBuilderData.shopify.variantId = shopifyVariantId || null;
    
    // Stocker le snapshot dans builder_data.publishedSnapshot (écrase complètement l'ancien)
    currentBuilderData.publishedSnapshot = snapshot;
    currentBuilderData.publishedAt = new Date().toISOString();
    currentBuilderData.snapshotVersion = (currentBuilderData.snapshotVersion || 0) + 1;
    currentBuilderData.shopifyProductId = shopifyProductId;
    currentBuilderData.shopifyVariantId = shopifyVariantId || null;
    
    console.log('💾 Sauvegarde du snapshot:', {
      snapshotSize: JSON.stringify(snapshot).length,
      hasDesign2D: !!snapshot.design2D,
      design2DUrl: snapshot.design2D?.url,
      snapshotVersion: currentBuilderData.snapshotVersion
    });
    
    const updateData: any = {
      shopify_product_id: shopifyProductId,
      shopify_variant_id: shopifyVariantId || null,
      builder_data: currentBuilderData,
      updated_at: new Date().toISOString()
    };
    
    // Essayer aussi de sauvegarder dans published_snapshot si la colonne existe (sans erreur si elle n'existe pas)
    try {
      updateData.published_snapshot = snapshot;
      updateData.last_published_at = new Date().toISOString();
      updateData.snapshot_version = 1;
    } catch (e) {
      // Ignorer si la colonne n'existe pas
    }

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

    // Vérifier que le snapshot a bien été sauvegardé
    const savedSnapshot = updated.builder_data?.publishedSnapshot;
    console.log('✅ Produit lié et snapshot publié avec succès:', {
      productId: updated.id,
      productName: updated.name,
      shopifyProductId: updated.shopify_product_id,
      hasSnapshotInBuilderData: !!savedSnapshot,
      snapshotModulesCount: savedSnapshot?.customizationModules?.length || 0,
      hasModel3D: !!savedSnapshot?.model3D,
      hasDesign2D: !!savedSnapshot?.design2D,
      design2DUrl: savedSnapshot?.design2D?.url,
      snapshotVersion: savedSnapshot?.version,
      publishedAt: savedSnapshot?.publishedAt,
      // Vérifier que le snapshot est bien dans builder_data
      builderDataHasPublishedSnapshot: !!updated.builder_data?.publishedSnapshot,
      builderDataKeys: updated.builder_data ? Object.keys(updated.builder_data) : []
    });
    
    // Vérifier immédiatement après la sauvegarde en récupérant le produit
    const { data: verifyProduct } = await supabaseAdmin
      .from('product_builder')
      .select('builder_data')
      .eq('id', productId)
      .single();
    
    const verifySnapshot = verifyProduct?.builder_data?.publishedSnapshot;
    console.log('🔍 Vérification post-sauvegarde:', {
      hasSnapshot: !!verifySnapshot,
      hasDesign2D: !!verifySnapshot?.design2D,
      design2DUrl: verifySnapshot?.design2D?.url
    });

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
