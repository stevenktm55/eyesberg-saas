// =====================================================
// API POUR GÉRER LE PRODUCT BUILDER
// =====================================================
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSubdomain } from '@/lib/get-subdomain';

/**
 * GET /api/product-builder
 * Récupère un produit builder par ID ou crée un nouveau
 */
export async function GET(request: NextRequest) {
  try {
    const subdomain = await getSubdomain(request);
    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain is required' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const shopDomain = searchParams.get('shop');
    const shopifyProductId = searchParams.get('shopifyProductId');
    
    if (id) {
      // Vérifier si c'est un UUID (ID Eyesberg) ou un nombre (ID Shopify)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      
      if (isUUID) {
        // C'est un UUID Eyesberg, récupérer directement
        const { data: product, error } = await supabaseAdmin
          .from('product_builder')
          .select('*')
          .eq('id', id)
          .eq('subdomain', subdomain)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            return NextResponse.json(
              { error: 'Product not found' },
              { status: 404 }
            );
          }
          throw error;
        }

        return NextResponse.json(product);
      } else {
        // C'est probablement un ID Shopify, chercher dans builder_data.shopify.productId
        const { data: products, error } = await supabaseAdmin
          .from('product_builder')
          .select('*')
          .eq('subdomain', subdomain)
          .eq('shop_domain', shopDomain || '')
          .not('builder_data', 'is', null);

        if (error) {
          throw error;
        }

        // Chercher le produit qui a ce shopify_product_id dans builder_data.shopify.productId
        const product = products?.find((p: any) => {
          const shopifyData = p.builder_data?.shopify;
          return shopifyData?.productId === id || shopifyData?.productId === String(id);
        });

        if (!product) {
          return NextResponse.json(
            { error: 'Product not found for this Shopify product ID' },
            { status: 404 }
          );
        }

        return NextResponse.json(product);
      }
    } else if (shopDomain) {
      // Rechercher un produit existant pour ce shop
      const { data: existingProduct, error: existingError } = await supabaseAdmin
        .from('product_builder')
        .select('*')
        .eq('subdomain', subdomain)
        .eq('shop_domain', shopDomain)
        .maybeSingle();

      if (existingError && existingError.code !== 'PGRST116') {
        throw existingError;
      }

      if (existingProduct) {
        return NextResponse.json(existingProduct);
      }

      // Créer un nouveau produit si aucun n'existe
      const { data: newProduct, error } = await supabaseAdmin
        .from('product_builder')
        .insert({
          subdomain,
          shop_domain: shopDomain,
          name: 'Untitled Product',
          builder_data: {
            questions: [],
            settings: {}
          },
          status: 'draft'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return NextResponse.json(newProduct);
    } else {
      // Récupérer tous les produits pour ce sous-domaine
      const { data: products, error } = await supabaseAdmin
        .from('product_builder')
        .select('*')
        .eq('subdomain', subdomain)
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      return NextResponse.json(products || []);
    }
  } catch (error: any) {
    console.error('Error fetching/creating product builder:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/product-builder
 * Sauvegarde (crée ou met à jour) un produit builder
 */
export async function POST(request: NextRequest) {
  try {
    const subdomain = await getSubdomain(request);
    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      id,
      name,
      builderData,
      shopDomain,
      status = 'draft',
    } = body;

    if (!name && !id) {
      return NextResponse.json(
        { error: 'name is required for new products' },
        { status: 400 }
      );
    }

    if (id) {
      // Mettre à jour un produit existant
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (name !== undefined) updateData.name = name;
      if (builderData !== undefined) updateData.builder_data = builderData;
      if (status !== undefined) updateData.status = status;

      const { data: updated, error } = await supabaseAdmin
        .from('product_builder')
        .update(updateData)
        .eq('id', id)
        .eq('subdomain', subdomain)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return NextResponse.json(updated);
    } else {
      // Créer un nouveau produit
      const { data: created, error } = await supabaseAdmin
        .from('product_builder')
        .insert({
          subdomain,
          shop_domain: shopDomain || null,
          name: name || 'Untitled Product',
          builder_data: builderData || { questions: [], settings: {} },
          status: status || 'draft',
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return NextResponse.json(created);
    }
  } catch (error: any) {
    console.error('Error saving product builder:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/product-builder
 * Supprime un produit builder
 */
export async function DELETE(request: NextRequest) {
  try {
    const subdomain = await getSubdomain(request);
    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain is required' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('product_builder')
      .delete()
      .eq('id', id)
      .eq('subdomain', subdomain);

    if (error) {
      throw error;
    }

    return NextResponse.json({ message: 'Product deleted' });
  } catch (error: any) {
    console.error('Error deleting product builder:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

