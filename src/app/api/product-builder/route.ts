// =====================================================
// API POUR GÉRER LE PRODUCT BUILDER
// =====================================================
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSubdomain } from '@/lib/get-subdomain';
import { generateSnapshot } from '@/lib/snapshot-generator';

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
    // Si for=admin, on retourne builder_data (pour le builder admin)
    // Sinon, on retourne snapshot (pour le configurateur client)
    const forAdmin = searchParams.get('for') === 'admin';
    
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
    
    if (id) {
      // Vérifier si c'est un UUID (ID Eyesberg) ou un nombre (ID Shopify)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      
      if (isUUID) {
        // C'est un UUID Eyesberg, récupérer directement
        // Pour les UUIDs, on peut récupérer le produit sans subdomain car l'UUID est unique
        let query = supabaseAdmin
          .from('product_builder')
          .select('*')
          .eq('id', id);
        
        // Si subdomain est fourni, l'utiliser pour filtrer (sécurité)
        if (subdomain) {
          query = query.eq('subdomain', subdomain);
        }
        
        const { data: product, error } = await query.single();

        if (error) {
          if (error.code === 'PGRST116') {
            return NextResponse.json(
              { error: 'Product not found' },
              { status: 404 }
            );
          }
          throw error;
        }

        // Si le produit a été trouvé mais qu'on avait un subdomain et qu'il ne correspond pas
        if (subdomain && product.subdomain !== subdomain) {
          return NextResponse.json(
            { error: 'Product not found for this subdomain' },
            { status: 404 }
          );
        }

        // Utiliser le subdomain du produit si on ne l'avait pas
        if (!subdomain && product.subdomain) {
          subdomain = product.subdomain;
        }

        // Si le produit a un snapshot publié, le retourner
        const publishedSnapshot = product.builder_data?.publishedSnapshot || product.published_snapshot;
        if (publishedSnapshot && !forAdmin) {
          // Pour le configurateur client, retourner le snapshot sans builder_data
          console.log('📸 Retour du snapshot publié pour le produit (UUID):', {
            productId: product.id,
            productName: product.name,
            snapshotModulesCount: publishedSnapshot.customizationModules?.length || 0
          });
          return NextResponse.json({
            ...product,
            snapshot: publishedSnapshot,
            builder_data: undefined
          });
        } else if (publishedSnapshot && forAdmin) {
          // Pour le builder admin, retourner le produit avec builder_data ET snapshot
          console.log('📸 Retour du produit avec snapshot pour le builder admin (UUID):', {
            productId: product.id,
            productName: product.name
          });
          return NextResponse.json(product);
        }

        // Générer un snapshot automatique depuis builder_data si disponible
        if (product.builder_data) {
          try {
            const model3DId = product.builder_data?.model3DId || 
                              product.builder_data?.modelId || 
                              product.builder_data?.selectedModel3DId || 
                              product.builder_data?.selectedModelId;
            
            if (!model3DId) {
              console.warn('⚠️ Pas de model3DId dans builder_data pour UUID:', {
                productId: product.id,
                builderDataKeys: product.builder_data ? Object.keys(product.builder_data) : []
              });
              // Retourner le produit sans snapshot si pas de model3DId
              return NextResponse.json(product);
            }
            
            const shopifyProductIdForSnapshot = product.shopify_product_id || product.id;
            const shopDomainForSnapshot = shopDomain || product.shop_domain || '';
            
            console.log('📸 Génération automatique du snapshot pour UUID (même logique que connexion):', {
              productId: product.id,
              shopifyProductId: shopifyProductIdForSnapshot,
              shopDomain: shopDomainForSnapshot,
              model3DId: model3DId
            });
            
            const generatedSnapshot = await generateSnapshot(
              product.builder_data,
              shopDomainForSnapshot,
              shopifyProductIdForSnapshot
            );
            
            if (generatedSnapshot) {
              console.log('✅ Snapshot généré automatiquement pour UUID:', {
                hasModel3D: !!generatedSnapshot.model3D,
                hasDesign2D: !!generatedSnapshot.design2D,
                modulesCount: generatedSnapshot.customizationModules?.length || 0,
                forAdmin: forAdmin
              });
              
              if (forAdmin) {
                // Pour le builder admin, retourner le produit avec builder_data ET snapshot généré
                return NextResponse.json({
                  ...product,
                  snapshot: generatedSnapshot
                  // builder_data reste dans la réponse pour le builder admin
                });
              } else {
                // Pour le configurateur client, retourner seulement le snapshot
                return NextResponse.json({
                  ...product,
                  snapshot: generatedSnapshot,
                  builder_data: undefined
                });
              }
            }
          } catch (error: any) {
            console.error('❌ Erreur lors de la génération automatique du snapshot pour UUID:', {
              error: error.message,
              productId: product.id
            });
          }
        }

        // Retourner le produit avec builder_data si pas de snapshot généré
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

        // Chercher le produit qui a ce shopify_product_id
        // Priorité 1: colonne shopify_product_id (nouveau système avec snapshot)
        // Priorité 2: builder_data.shopify.productId (ancien système)
        const product = products?.find((p: any) => {
          // Nouveau système: chercher dans la colonne shopify_product_id
          if (p.shopify_product_id) {
            const normalizedStoredId = normalizeId(p.shopify_product_id);
            const match = normalizedStoredId === normalizedSearchId;
            if (match) {
              console.log(`✅ Produit trouvé (nouveau système):`, {
                product_id: p.id,
                name: p.name,
                shopify_product_id: p.shopify_product_id,
                has_snapshot: !!p.published_snapshot
              });
            }
            return match;
          }
          
          // Ancien système: chercher dans builder_data.shopify.productId
          const shopifyData = p.builder_data?.shopify;
          if (shopifyData && shopifyData.productId) {
            const normalizedStoredId = normalizeId(shopifyData.productId);
            const match = normalizedStoredId === normalizedSearchId;
            if (match) {
              console.log(`✅ Produit trouvé (ancien système):`, {
                product_id: p.id,
                name: p.name,
                shopify_product_id: shopifyData.productId
              });
            }
            return match;
          }
          
          return false;
        });

        if (!product) {
          console.error('❌ Product not found. Searched products:', products?.map((p: any) => ({
            id: p.id,
            name: p.name,
            shop_domain: p.shop_domain,
            subdomain: p.subdomain,
            shopify_product_id: p.shopify_product_id || p.builder_data?.shopify?.productId,
            has_snapshot: !!p.published_snapshot,
            has_shopify_data: !!p.builder_data?.shopify
          })));
          console.error('❌ Search details:', {
            searchedId: id,
            normalizedSearchId: normalizedSearchId,
            shopDomain,
            subdomain,
            totalProducts: products?.length || 0
          });
          
          // Fallback: si aucun produit n'est trouvé avec l'ID Shopify mais qu'il y a des produits disponibles,
          // retourner le premier produit disponible (utile si le produit n'a pas encore été lié)
          if (products && products.length > 0) {
            console.warn('⚠️ Produit non trouvé avec l\'ID Shopify, utilisation du premier produit disponible comme fallback');
            const fallbackProduct = products[0];
            console.log('✅ Utilisation du produit fallback:', {
              id: fallbackProduct.id,
              name: fallbackProduct.name,
              shop_domain: fallbackProduct.shop_domain
            });
            return NextResponse.json(fallbackProduct);
          }
          
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
                shopify_product_id: p.shopify_product_id || p.builder_data?.shopify?.productId
              })) || []
            },
            { status: 404 }
          );
        }

        // Si le produit a un snapshot publié, le retourner au lieu de builder_data
        // (pour le configurateur client)
        // Le snapshot est stocké dans builder_data.publishedSnapshot (priorité) ou published_snapshot (colonne, fallback)
        const publishedSnapshot = product.builder_data?.publishedSnapshot || product.published_snapshot;
        if (publishedSnapshot && !forAdmin) {
          // Pour le configurateur client, retourner le snapshot sans builder_data
          console.log('📸 Retour du snapshot publié pour le produit:', {
            productId: product.id,
            productName: product.name,
            shopifyProductId: product.shopify_product_id,
            fromBuilderData: !!product.builder_data?.publishedSnapshot,
            fromColumn: !!product.published_snapshot,
            snapshotModulesCount: publishedSnapshot.customizationModules?.length || 0,
            hasModel3D: !!publishedSnapshot.model3D,
            hasDesign2D: !!publishedSnapshot.design2D,
            design2DUrl: publishedSnapshot.design2D?.url,
            snapshotVersion: publishedSnapshot.version,
            publishedAt: publishedSnapshot.publishedAt,
            // Vérifier la structure complète du snapshot
            snapshotKeys: Object.keys(publishedSnapshot)
          });
          return NextResponse.json({
            ...product,
            snapshot: publishedSnapshot,
            // Ne pas exposer builder_data au client
            builder_data: undefined
          });
        } else if (publishedSnapshot && forAdmin) {
          // Pour le builder admin, retourner le produit avec builder_data ET snapshot
          console.log('📸 Retour du produit avec snapshot pour le builder admin:', {
            productId: product.id,
            productName: product.name
          });
          return NextResponse.json(product);
        }
        
        console.log('⚠️ Aucun snapshot trouvé pour le produit, génération automatique depuis builder_data:', {
          productId: product.id,
          productName: product.name,
          shopifyProductId: product.shopify_product_id,
          hasBuilderData: !!product.builder_data,
          hasPublishedSnapshotInBuilderData: !!product.builder_data?.publishedSnapshot,
          hasPublishedSnapshotColumn: !!product.published_snapshot,
          builderDataKeys: product.builder_data ? Object.keys(product.builder_data) : []
        });

        // Générer un snapshot automatique à partir de builder_data si disponible
        // Utiliser exactement la même fonction que lors de la connexion du produit
        if (product.builder_data) {
          try {
            // Vérifier que builder_data a un model3DId (requis par generateSnapshot)
            const model3DId = product.builder_data?.model3DId || 
                              product.builder_data?.modelId || 
                              product.builder_data?.selectedModel3DId || 
                              product.builder_data?.selectedModelId;
            
            if (!model3DId) {
              console.warn('⚠️ Pas de model3DId dans builder_data, impossible de générer le snapshot:', {
                productId: product.id,
                builderDataKeys: product.builder_data ? Object.keys(product.builder_data) : []
              });
              // Retourner le produit sans snapshot si pas de model3DId
              return NextResponse.json(product);
            }
            
            // Utiliser le shopify_product_id si disponible, sinon utiliser l'ID du produit builder
            const shopifyProductIdForSnapshot = product.shopify_product_id || product.id;
            const shopDomainForSnapshot = shopDomain || product.shop_domain || '';
            
            console.log('📸 Génération automatique du snapshot (même logique que connexion):', {
              productId: product.id,
              shopifyProductId: shopifyProductIdForSnapshot,
              shopDomain: shopDomainForSnapshot,
              hasBuilderData: !!product.builder_data,
              builderDataKeys: product.builder_data ? Object.keys(product.builder_data) : [],
              model3DId: model3DId,
              hasCustomizationModules: !!(product.builder_data?.customizationModules),
              customizationModulesCount: product.builder_data?.customizationModules?.length || 0
            });
            
            const generatedSnapshot = await generateSnapshot(
              product.builder_data,
              shopDomainForSnapshot,
              shopifyProductIdForSnapshot
            );
            
            if (generatedSnapshot) {
              console.log('✅ Snapshot généré automatiquement:', {
                hasModel3D: !!generatedSnapshot.model3D,
                hasDesign2D: !!generatedSnapshot.design2D,
                modulesCount: generatedSnapshot.customizationModules?.length || 0,
                design2DUrl: generatedSnapshot.design2D?.url,
                model3DUrl: generatedSnapshot.model3D?.url,
                forAdmin: forAdmin
              });
              
              if (forAdmin) {
                // Pour le builder admin, retourner le produit avec builder_data ET snapshot généré
                return NextResponse.json({
                  ...product,
                  snapshot: generatedSnapshot
                  // builder_data reste dans la réponse pour le builder admin
                });
              } else {
                // Pour le configurateur client, retourner seulement le snapshot
                return NextResponse.json({
                  ...product,
                  snapshot: generatedSnapshot,
                  builder_data: undefined
                });
              }
            } else {
              console.error('❌ generateSnapshot a retourné null/undefined');
            }
          } catch (error: any) {
            console.error('❌ Erreur lors de la génération automatique du snapshot:', {
              error: error.message,
              stack: error.stack,
              productId: product.id,
              builderDataKeys: product.builder_data ? Object.keys(product.builder_data) : []
            });
            // Ne pas bloquer si la génération échoue, retourner le produit sans snapshot
            // Mais logguer l'erreur pour debug
          }
        } else {
          console.warn('⚠️ Pas de builder_data disponible pour générer le snapshot:', {
            productId: product.id,
            hasBuilderData: !!product.builder_data
          });
        }

        // Sinon, retourner le produit avec builder_data (pour le builder admin)
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

