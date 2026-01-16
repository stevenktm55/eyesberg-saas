import { NextRequest, NextResponse } from 'next/server';
import { getShopByDomain } from '@/lib/shopify-shops';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * API pour gérer les snapshots (mobile et desktop) d'un produit
 * GET /api/shopify/products/[productId]/snapshots?shop=...
 * POST /api/shopify/products/[productId]/snapshots?shop=...
 */

/**
 * Récupérer les snapshots d'un produit
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

    // Récupérer la configuration avec les snapshots
    const { data: config, error: configError } = await supabaseAdmin
      .from('shopify_product_configs')
      .select('snapshot_mobile_url, snapshot_desktop_url')
      .eq('shopify_product_id', productId)
      .single();

    if (configError && configError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, ce qui est OK si la config n'existe pas encore
      console.error('❌ Erreur lors de la récupération des snapshots:', configError);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des snapshots', details: configError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      snapshots: {
        mobile: config?.snapshot_mobile_url || null,
        desktop: config?.snapshot_desktop_url || null,
      },
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des snapshots:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors de la récupération des snapshots',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}

/**
 * Uploader/mettre à jour les snapshots d'un produit
 * Body: { mobile?: string (base64), desktop?: string (base64) }
 */
export async function POST(
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
    const { mobile, desktop } = body;

    if (!mobile && !desktop) {
      return NextResponse.json(
        { error: 'Au moins un snapshot (mobile ou desktop) est requis' },
        { status: 400 }
      );
    }

    // Convertir base64 en Blob et uploader vers Supabase Storage
    const uploadSnapshot = async (base64Data: string, type: 'mobile' | 'desktop'): Promise<string | null> => {
      try {
        // Enlever le préfixe data:image/...;base64, si présent
        const base64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
        const buffer = Buffer.from(base64, 'base64');

        // Créer un Blob à partir du buffer
        const blob = new Blob([buffer], { type: 'image/png' });

        // Chemin dans le bucket (ex: snapshots/{productId}/mobile.png)
        const timestamp = Date.now();
        const path = `snapshots/${productId}/${type}-${timestamp}.png`;

        // Uploader vers Supabase Storage (bucket: product-snapshots)
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('product-snapshots')
          .upload(path, blob, {
            cacheControl: '3600',
            upsert: true,
            contentType: 'image/png',
          });

        if (uploadError) {
          console.error(`❌ Erreur upload snapshot ${type}:`, uploadError);
          return null;
        }

        // Retourner l'URL publique
        const { data: { publicUrl } } = supabaseAdmin.storage
          .from('product-snapshots')
          .getPublicUrl(uploadData.path);

        return publicUrl;
      } catch (error) {
        console.error(`❌ Erreur conversion/upload snapshot ${type}:`, error);
        return null;
      }
    };

    // Uploader les snapshots
    let mobileUrl: string | null = null;
    let desktopUrl: string | null = null;

    if (mobile) {
      mobileUrl = await uploadSnapshot(mobile, 'mobile');
      if (!mobileUrl) {
        return NextResponse.json(
          { error: 'Erreur lors de l\'upload du snapshot mobile' },
          { status: 500 }
        );
      }
    }

    if (desktop) {
      desktopUrl = await uploadSnapshot(desktop, 'desktop');
      if (!desktopUrl) {
        return NextResponse.json(
          { error: 'Erreur lors de l\'upload du snapshot desktop' },
          { status: 500 }
        );
      }
    }

    // Vérifier si une configuration existe déjà
    const { data: existingConfig } = await supabaseAdmin
      .from('shopify_product_configs')
      .select('id, snapshot_mobile_url, snapshot_desktop_url')
      .eq('shopify_product_id', productId)
      .single();

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    // Ne mettre à jour que les snapshots fournis
    if (mobileUrl !== null) {
      updateData.snapshot_mobile_url = mobileUrl;
    }
    if (desktopUrl !== null) {
      updateData.snapshot_desktop_url = desktopUrl;
    }

    if (existingConfig) {
      // Mise à jour de la configuration existante
      const { data, error } = await supabaseAdmin
        .from('shopify_product_configs')
        .update(updateData)
        .eq('id', existingConfig.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur lors de la mise à jour des snapshots:', error);
        return NextResponse.json(
          { error: 'Erreur lors de la mise à jour des snapshots', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Snapshots mis à jour avec succès',
        snapshots: {
          mobile: data.snapshot_mobile_url || existingConfig.snapshot_mobile_url,
          desktop: data.snapshot_desktop_url || existingConfig.snapshot_desktop_url,
        },
      });
    } else {
      // Création d'une nouvelle configuration (minimum requis)
      const { data, error } = await supabaseAdmin
        .from('shopify_product_configs')
        .insert({
          shopify_product_id: productId,
          ...updateData,
          questions: [],
          layers: [],
          pricing_config: {},
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur lors de la création de la configuration avec snapshots:', error);
        return NextResponse.json(
          { error: 'Erreur lors de la sauvegarde des snapshots', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Snapshots créés avec succès',
        snapshots: {
          mobile: data.snapshot_mobile_url,
          desktop: data.snapshot_desktop_url,
        },
      });
    }
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde des snapshots:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors de la sauvegarde des snapshots',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}
