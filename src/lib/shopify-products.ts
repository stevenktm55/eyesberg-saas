import { getShopByDomain } from './shopify-shops';
import { supabaseAdmin } from './supabase';

/**
 * Interface pour un produit Shopify
 */
export interface ShopifyProduct {
  id: string; // gid://shopify/Product/...
  title: string;
  handle: string;
  status: string; // ACTIVE, DRAFT, ARCHIVED
  featuredImage?: {
    url: string;
    altText?: string;
  };
  variants: {
    edges: Array<{
      node: {
        id: string; // gid://shopify/ProductVariant/...
        title: string;
        price: string;
        sku?: string;
        availableForSale: boolean;
      };
    }>;
  };
}

/**
 * Récupère les produits d'une boutique Shopify via l'API Admin
 */
export async function fetchShopifyProducts(
  shopDomain: string,
  accessToken: string,
  limit: number = 250
): Promise<ShopifyProduct[]> {
  const products: ShopifyProduct[] = [];
  let hasNextPage = true;
  let cursor: string | null = null;

  while (hasNextPage) {
    // Query GraphQL Shopify Admin API
    const query = `
      query getProducts($first: Int!, $after: String) {
        products(first: $first, after: $after) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              id
              title
              handle
              status
              featuredImage {
                url
                altText
              }
              variants(first: 250) {
                edges {
                  node {
                    id
                    title
                    price
                    sku
                    availableForSale
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await fetch(`https://${shopDomain}/admin/api/2025-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({
        query,
        variables: {
          first: limit,
          after: cursor,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erreur lors de la récupération des produits:', errorText);
      throw new Error(`Échec de la récupération des produits: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.errors) {
      console.error('❌ Erreur GraphQL:', data.errors);
      throw new Error(`Erreur GraphQL: ${JSON.stringify(data.errors)}`);
    }

    const productsData = data.data?.products;

    if (!productsData) {
      throw new Error('Données de produits manquantes dans la réponse');
    }

    // Ajouter les produits à la liste
    for (const edge of productsData.edges) {
      products.push(edge.node);
    }

    // Vérifier s'il y a une page suivante
    hasNextPage = productsData.pageInfo.hasNextPage;
    cursor = productsData.pageInfo.endCursor;
  }

  return products;
}

/**
 * Synchronise les produits Shopify d'une boutique dans notre base de données
 */
export async function syncShopifyProducts(shopDomain: string): Promise<{
  synced: number;
  updated: number;
  errors: number;
}> {
  try {
    // Récupérer la boutique et son access token
    const shop = await getShopByDomain(shopDomain);

    if (!shop) {
      throw new Error(`Boutique ${shopDomain} non trouvée`);
    }

    if (!shop.access_token) {
      throw new Error(`Access token manquant pour la boutique ${shopDomain}`);
    }

    // Récupérer les produits depuis Shopify
    console.log(`📦 Synchronisation des produits de ${shopDomain}...`);
    const shopifyProducts = await fetchShopifyProducts(
      shopDomain,
      shop.access_token
    );

    console.log(`✅ ${shopifyProducts.length} produits récupérés depuis Shopify`);

    let synced = 0;
    let updated = 0;
    let errors = 0;

    // Pour chaque produit, l'insérer ou le mettre à jour dans Supabase
    for (const product of shopifyProducts) {
      try {
        // Vérifier si le produit existe déjà
        const { data: existingProduct } = await supabaseAdmin
          .from('shopify_products')
          .select('id')
          .eq('shop_id', shop.id)
          .eq('shopify_product_id', product.id)
          .single();

        // Préparer les données des variantes
        const variants = product.variants.edges.map((edge) => ({
          id: edge.node.id,
          title: edge.node.title,
          price: edge.node.price,
          sku: edge.node.sku || null,
          availableForSale: edge.node.availableForSale,
        }));

        const productData = {
          shop_id: shop.id,
          shopify_product_id: product.id,
          shopify_product_title: product.title,
          shopify_product_handle: product.handle,
          shopify_product_image_url: product.featuredImage?.url || null,
          shopify_product_status: product.status.toLowerCase(),
          shopify_variants: variants,
          synced_at: new Date().toISOString(),
        };

        if (existingProduct) {
          // Mise à jour du produit existant
          const { error } = await supabaseAdmin
            .from('shopify_products')
            .update(productData)
            .eq('id', existingProduct.id);

          if (error) {
            console.error(`❌ Erreur lors de la mise à jour du produit ${product.title}:`, error);
            errors++;
          } else {
            updated++;
          }
        } else {
          // Création d'un nouveau produit
          const { error } = await supabaseAdmin
            .from('shopify_products')
            .insert(productData);

          if (error) {
            console.error(`❌ Erreur lors de l'insertion du produit ${product.title}:`, error);
            errors++;
          } else {
            synced++;
          }
        }
      } catch (error) {
        console.error(`❌ Erreur lors du traitement du produit ${product.title}:`, error);
        errors++;
      }
    }

    console.log(`✅ Synchronisation terminée: ${synced} nouveaux, ${updated} mis à jour, ${errors} erreurs`);

    return {
      synced,
      updated,
      errors,
    };
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation des produits:', error);
    throw error;
  }
}

/**
 * Récupère les produits synchronisés d'une boutique depuis Supabase
 */
export async function getSyncedProducts(shopDomain: string) {
  const shop = await getShopByDomain(shopDomain);

  if (!shop) {
    throw new Error(`Boutique ${shopDomain} non trouvée`);
  }

  const { data, error } = await supabaseAdmin
    .from('shopify_products')
    .select('*')
    .eq('shop_id', shop.id)
    .order('synced_at', { ascending: false });

  if (error) {
    console.error('❌ Erreur lors de la récupération des produits:', error);
    throw error;
  }

  return data || [];
}














