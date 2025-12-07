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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const shopDomain = searchParams.get('shop');
    const shopifyProductId = searchParams.get('shopifyProductId');
    
    // Si shopDomain est fourni, prioriser la récupération du subdomain depuis product_builder
    let subdomain: string | null = null;
    
    if (shopDomain) {
      try {
        // Chercher un produit avec ce shop_domain pour récupérer son subdomain
        const { data: product } = await supabaseAdmin
          .from('product_builder')
          .select('subdomain')
          .eq('shop_domain', shopDomain)
          .limit(1)
          .maybeSingle();
        
        if (product?.subdomain) {
          subdomain = product.subdomain;
        }
      } catch (error) {
        console.warn('Could not fetch subdomain from shop_domain:', error);
      }
    }
    
    // Fallback: essayer de récupérer le subdomain depuis les headers/session
    if (!subdomain) {
      subdomain = await getSubdomain(request);
    }
    
    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain is required. Please provide shop parameter or ensure subdomain is set in headers.' },
        { status: 400 }
      );
    }
    
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
        // D'abord, essayer avec shop_domain si fourni
        let query = supabaseAdmin
          .from('product_builder')
          .select('*')
          .eq('subdomain', subdomain)
          .not('builder_data', 'is', null);

        if (shopDomain) {
          query = query.eq('shop_domain', shopDomain);
        }

        const { data: products, error } = await query;

        if (error) {
          console.error('Error fetching products:', error);
          throw error;
        }

        console.log(`Found ${products?.length || 0} products for subdomain ${subdomain}, shop ${shopDomain}`);

        // Normaliser l'ID recherché pour la comparaison
        const normalizeId = (val: any): string => {
          if (val === null || val === undefined) return '';
          const str = String(val).trim();
          // Extraire uniquement les chiffres (ID Shopify)
          const digitsMatch = str.match(/(\d{5,})$/);
          return digitsMatch ? digitsMatch[1] : str;
        };
        
        const normalizedSearchId = normalizeId(id);
        console.log(`🔍 Recherche du produit avec ID Shopify normalisé: "${normalizedSearchId}" (original: "${id}")`);

        // Chercher le produit qui a ce shopify_product_id dans builder_data.shopify.productId
        const product = products?.find((p: any) => {
          const shopifyData = p.builder_data?.shopify;
          if (!shopifyData || !shopifyData.productId) {
            return false;
          }
          
          // Normaliser l'ID stocké dans le produit
          const normalizedStoredId = normalizeId(shopifyData.productId);
          
          // Comparer les IDs normalisés
          const match = normalizedStoredId === normalizedSearchId;
          
          if (match) {
            console.log(`✅ Produit trouvé:`, {
              product_id: p.id,
              name: p.name,
              shopify_product_id: shopifyData.productId,
              normalized_stored: normalizedStoredId,
              normalized_search: normalizedSearchId,
            });
          }
          
          return match;
        });

        if (!product) {
          console.error('❌ Product not found. Searched products:', products?.map((p: any) => ({
            id: p.id,
            name: p.name,
            shop_domain: p.shop_domain,
            subdomain: p.subdomain,
            shopify_product_id: p.builder_data?.shopify?.productId,
            has_shopify_data: !!p.builder_data?.shopify,
            builder_data_keys: p.builder_data ? Object.keys(p.builder_data) : []
          })));
          console.error('❌ Search details:', {
            searchedId: id,
            normalizedSearchId: normalizedSearchId,
            shopDomain,
            subdomain,
            totalProducts: products?.length || 0
          });
          return NextResponse.json(
            { 
              error: 'Product not found for this Shopify product ID', 
              searchedId: id,
              normalizedSearchId: normalizedSearchId,
              shopDomain, 
              subdomain,
              availableProducts: products?.map((p: any) => ({
                id: p.id,
                name: p.name,
                shopify_product_id: p.builder_data?.shopify?.productId
              })) || []
            },
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

