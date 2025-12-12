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
    // Si preview=true, on ignore publishedSnapshot et génère uniquement depuis builder_data actuel
    const isPreview = searchParams.get('preview') === 'true';
    
    console.log('🔍 Paramètres de la requête API product-builder:', {
      id,
      shopDomain,
      shopifyProductId,
      forAdmin,
      isPreview,
      previewParamRaw: searchParams.get('preview'),
      previewParamValue: searchParams.get('preview'),
      allParams: Object.fromEntries(searchParams.entries()),
      fullUrl: request.url
    });
    
    // Vérification explicite : si preview est présent dans l'URL (même avec une valeur différente), forcer isPreview
    const previewParam = searchParams.get('preview');
    if (previewParam !== null && previewParam !== undefined) {
      const actualIsPreview = previewParam === 'true' || previewParam === '1' || previewParam === 'yes';
      if (actualIsPreview !== isPreview) {
        console.warn('⚠️ Incohérence détectée dans preview param:', {
          previewParam,
          isPreview,
          actualIsPreview,
          forcingIsPreview: actualIsPreview
        });
        // Ne pas forcer, mais logger pour debug
      }
    }
    
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

        // Pour le preview, ignorer publishedSnapshot et générer uniquement depuis builder_data actuel
        // Pour le preview, vérifier que builder_data contient des données valides
        console.log('🔍 Vérification isPreview pour UUID:', {
          isPreview,
          previewParamFromUrl: searchParams.get('preview'),
          productId: product.id,
          productName: product.name,
          hasPublishedSnapshot: !!(product.builder_data?.publishedSnapshot || product.published_snapshot),
          willIgnorePublishedSnapshot: isPreview
        });
        
        // CRITIQUE: En mode preview, NE JAMAIS retourner publishedSnapshot, même si la génération échoue
        if (isPreview) {
          console.log('✅ MODE PREVIEW ACTIVÉ - publishedSnapshot sera ignoré');
          if (!product.builder_data) {
            console.warn('⚠️ Preview demandé mais builder_data est vide:', {
              productId: product.id,
              productName: product.name
            });
            return NextResponse.json({
              error: 'Aucune configuration dans le builder. Le preview nécessite au moins un modèle 3D et des modules de personnalisation.',
              product: {
                id: product.id,
                name: product.name
              }
            }, { status: 400 });
          }

          const hasModel3DId = !!(product.builder_data?.model3DId || 
                                 product.builder_data?.modelId || 
                                 product.builder_data?.selectedModel3DId || 
                                 product.builder_data?.selectedModelId);
          
          const hasCustomizationModules = !!(product.builder_data?.customizationModules && 
                                            product.builder_data.customizationModules.length > 0);

          if (!hasModel3DId) {
            console.warn('⚠️ Preview demandé mais pas de model3DId dans builder_data:', {
              productId: product.id,
              productName: product.name,
              builderDataKeys: product.builder_data ? Object.keys(product.builder_data) : []
            });
            return NextResponse.json({
              error: 'Aucun modèle 3D sélectionné dans le builder. Le preview nécessite un modèle 3D.',
              product: {
                id: product.id,
                name: product.name
              }
            }, { status: 400 });
          }

          if (!hasCustomizationModules) {
            console.warn('⚠️ Preview demandé mais pas de customizationModules dans builder_data:', {
              productId: product.id,
              productName: product.name,
              customizationModulesCount: product.builder_data?.customizationModules?.length || 0
            });
            return NextResponse.json({
              error: 'Aucun module de personnalisation dans le builder. Le preview nécessite au moins un module de personnalisation.',
              product: {
                id: product.id,
                name: product.name
              }
            }, { status: 400 });
          }

          // Pour le preview, générer uniquement depuis builder_data (ignorer publishedSnapshot)
          console.log('📸 Preview demandé - génération depuis builder_data uniquement (UUID):', {
            productId: product.id,
            productName: product.name,
            hasModel3DId,
            customizationModulesCount: product.builder_data?.customizationModules?.length || 0
          });
          // Continuer pour générer le snapshot depuis builder_data (ne pas utiliser publishedSnapshot)
        } else {
          // Si le produit a un snapshot publié, le retourner (sauf pour preview)
          // IMPORTANT: Ne jamais entrer ici si isPreview est true
          if (isPreview) {
            console.error('❌ ERREUR CRITIQUE: isPreview est true mais on entre dans le bloc else ! Ceci ne devrait jamais arriver.');
          }
          
          const publishedSnapshot = product.builder_data?.publishedSnapshot || product.published_snapshot;
          if (publishedSnapshot && !forAdmin && !isPreview) {
            // Pour le configurateur client, retourner le snapshot sans builder_data (MAIS PAS EN MODE PREVIEW)
            console.log('📸 Retour du snapshot publié pour le produit (UUID) - MODE NORMAL:', {
              productId: product.id,
              productName: product.name,
              snapshotModulesCount: publishedSnapshot.customizationModules?.length || 0,
              isPreview: false
            });
            return NextResponse.json({
              ...product,
              snapshot: publishedSnapshot,
              builder_data: undefined
            });
          } else if (publishedSnapshot && forAdmin && !isPreview) {
            // Pour le builder admin, retourner le produit avec builder_data ET snapshot (MAIS PAS EN MODE PREVIEW)
            console.log('📸 Retour du produit avec snapshot pour le builder admin (UUID) - MODE ADMIN:', {
              productId: product.id,
              productName: product.name,
              hasBuilderData: !!product.builder_data,
              builderDataKeys: product.builder_data ? Object.keys(product.builder_data) : [],
              hasQuestions: !!(product.builder_data?.questions),
              questionsCount: product.builder_data?.questions?.length || 0,
              isPreview: false
            });
            return NextResponse.json(product);
          }
        }

        // Générer un snapshot automatique depuis builder_data si disponible
        // Pour le preview, on ignore publishedSnapshot et on génère uniquement depuis builder_data
        if (product.builder_data) {
          // Pour le preview, supprimer publishedSnapshot de builder_data avant génération
          let builderDataForSnapshot = product.builder_data;
          if (isPreview) {
            console.log('📸 Preview - suppression de publishedSnapshot de builder_data avant génération:', {
              productId: product.id,
              hadPublishedSnapshotInBuilderData: !!product.builder_data?.publishedSnapshot,
              hadPublishedSnapshotColumn: !!product.published_snapshot
            });
            // Créer une copie de builder_data sans publishedSnapshot
            const { publishedSnapshot, ...restBuilderData } = product.builder_data;
            builderDataForSnapshot = restBuilderData;
          }
          
          try {
            const model3DId = builderDataForSnapshot?.model3DId || 
                              builderDataForSnapshot?.modelId || 
                              builderDataForSnapshot?.selectedModel3DId || 
                              builderDataForSnapshot?.selectedModelId;
            
            if (!model3DId) {
              console.warn('⚠️ Pas de model3DId dans builder_data pour UUID:', {
                productId: product.id,
                builderDataKeys: builderDataForSnapshot ? Object.keys(builderDataForSnapshot) : []
              });
              // Pour le preview, retourner une erreur si pas de model3DId
              if (isPreview) {
                return NextResponse.json({
                  error: 'Aucun modèle 3D sélectionné dans le builder. Le preview nécessite un modèle 3D.',
                  product: {
                    id: product.id,
                    name: product.name
                  }
                }, { status: 400 });
              }
              // Retourner le produit sans snapshot si pas de model3DId (mais sans publishedSnapshot si preview)
              const productResponse: any = { ...product };
              if (isPreview) {
                // En mode preview, ne JAMAIS inclure publishedSnapshot
                if (productResponse.builder_data?.publishedSnapshot) {
                  delete productResponse.builder_data.publishedSnapshot;
                }
                if (productResponse.published_snapshot) {
                  delete productResponse.published_snapshot;
                }
              }
              return NextResponse.json(productResponse);
            }
            
            const shopifyProductIdForSnapshot = product.shopify_product_id || product.id;
            const shopDomainForSnapshot = shopDomain || product.shop_domain || '';
            
            console.log('📸 Génération automatique du snapshot pour UUID (même logique que connexion):', {
              productId: product.id,
              shopifyProductId: shopifyProductIdForSnapshot,
              shopDomain: shopDomainForSnapshot,
              model3DId: model3DId,
              isPreview,
              builderDataKeys: builderDataForSnapshot ? Object.keys(builderDataForSnapshot) : [],
              hasPublishedSnapshotInBuilderData: !!(product.builder_data?.publishedSnapshot)
            });
            
            // Utiliser builderDataForSnapshot (sans publishedSnapshot si preview) pour générer le snapshot
            const generatedSnapshot = await generateSnapshot(
              builderDataForSnapshot,
              shopDomainForSnapshot,
              shopifyProductIdForSnapshot
            );
            
            if (generatedSnapshot) {
              console.log('✅ Snapshot généré automatiquement pour UUID:', {
                hasModel3D: !!generatedSnapshot.model3D,
                hasDesign2D: !!generatedSnapshot.design2D,
                modulesCount: generatedSnapshot.customizationModules?.length || 0,
                forAdmin: forAdmin,
                isPreview: isPreview
              });
              
              // Pour le preview, toujours retourner le snapshot généré (ignorer publishedSnapshot)
              if (isPreview) {
                console.log('📸 Preview - retour du snapshot généré depuis builder_data:', {
                  productId: product.id,
                  productName: product.name,
                  modulesCount: generatedSnapshot.customizationModules?.length || 0
                });
                return NextResponse.json({
                  ...product,
                  snapshot: generatedSnapshot,
                  builder_data: undefined // Ne pas exposer builder_data dans le preview
                });
              }
              
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
              productId: product.id,
              isPreview
            });
            // Pour le preview, si la génération échoue, retourner une erreur plutôt que le produit avec publishedSnapshot
            if (isPreview) {
              return NextResponse.json({
                error: 'Erreur lors de la génération du snapshot depuis le builder. Veuillez vérifier votre configuration.',
                details: error.message,
                product: {
                  id: product.id,
                  name: product.name
                }
              }, { status: 500 });
            }
          }
        }

        // Retourner le produit avec builder_data si pas de snapshot généré
        // MAIS en mode preview, ne JAMAIS inclure publishedSnapshot
        console.log('📦 Retour du produit sans snapshot généré (UUID):', {
          productId: product.id,
          forAdmin: forAdmin,
          isPreview: isPreview,
          hasBuilderData: !!product.builder_data,
          builderDataKeys: product.builder_data ? Object.keys(product.builder_data) : [],
          hasQuestions: !!(product.builder_data?.questions),
          questionsCount: product.builder_data?.questions?.length || 0,
          hasCustomizationModules: !!(product.builder_data?.customizationModules),
          customizationModulesCount: product.builder_data?.customizationModules?.length || 0
        });
        
        const productResponse: any = { ...product };
        // En mode preview, ne JAMAIS inclure publishedSnapshot dans la réponse
        if (isPreview) {
          console.log('📸 Preview - suppression de publishedSnapshot de la réponse:', {
            productId: product.id,
            hadPublishedSnapshotInBuilderData: !!product.builder_data?.publishedSnapshot,
            hadPublishedSnapshotColumn: !!product.published_snapshot
          });
          // Supprimer publishedSnapshot de builder_data si présent
          if (productResponse.builder_data?.publishedSnapshot) {
            const { publishedSnapshot, ...restBuilderData } = productResponse.builder_data;
            productResponse.builder_data = restBuilderData;
          }
          // Supprimer published_snapshot de la colonne si présent
          if (productResponse.published_snapshot) {
            delete productResponse.published_snapshot;
          }
          // Ne pas exposer builder_data dans le preview
          productResponse.builder_data = undefined;
        }
        
        return NextResponse.json(productResponse);
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

        // Pour le preview, ignorer publishedSnapshot et générer uniquement depuis builder_data actuel
        if (isPreview) {
          if (!product.builder_data) {
            console.warn('⚠️ Preview demandé mais builder_data est vide:', {
              productId: product.id,
              productName: product.name,
              shopifyProductId: product.shopify_product_id
            });
            return NextResponse.json({
              error: 'Aucune configuration dans le builder. Le preview nécessite au moins un modèle 3D et des modules de personnalisation.',
              product: {
                id: product.id,
                name: product.name,
                shopify_product_id: product.shopify_product_id
              }
            }, { status: 400 });
          }

          const hasModel3DId = !!(product.builder_data?.model3DId || 
                                 product.builder_data?.modelId || 
                                 product.builder_data?.selectedModel3DId || 
                                 product.builder_data?.selectedModelId);
          
          const hasCustomizationModules = !!(product.builder_data?.customizationModules && 
                                            product.builder_data.customizationModules.length > 0);

          if (!hasModel3DId) {
            console.warn('⚠️ Preview demandé mais pas de model3DId dans builder_data:', {
              productId: product.id,
              productName: product.name,
              shopifyProductId: product.shopify_product_id,
              builderDataKeys: product.builder_data ? Object.keys(product.builder_data) : []
            });
            return NextResponse.json({
              error: 'Aucun modèle 3D sélectionné dans le builder. Le preview nécessite un modèle 3D.',
              product: {
                id: product.id,
                name: product.name,
                shopify_product_id: product.shopify_product_id
              }
            }, { status: 400 });
          }

          if (!hasCustomizationModules) {
            console.warn('⚠️ Preview demandé mais pas de customizationModules dans builder_data:', {
              productId: product.id,
              productName: product.name,
              shopifyProductId: product.shopify_product_id,
              customizationModulesCount: product.builder_data?.customizationModules?.length || 0
            });
            return NextResponse.json({
              error: 'Aucun module de personnalisation dans le builder. Le preview nécessite au moins un module de personnalisation.',
              product: {
                id: product.id,
                name: product.name,
                shopify_product_id: product.shopify_product_id
              }
            }, { status: 400 });
          }

          // Pour le preview, générer uniquement depuis builder_data (ignorer publishedSnapshot)
          console.log('📸 Preview demandé - génération depuis builder_data uniquement:', {
            productId: product.id,
            productName: product.name,
            shopifyProductId: product.shopify_product_id,
            hasModel3DId,
            customizationModulesCount: product.builder_data?.customizationModules?.length || 0
          });
        } else {
          // Si le produit a un snapshot publié, le retourner (sauf pour preview)
          // IMPORTANT: Ne jamais entrer ici si isPreview est true
          if (isPreview) {
            console.error('❌ ERREUR CRITIQUE: isPreview est true mais on entre dans le bloc else (ID Shopify) ! Ceci ne devrait jamais arriver.');
          }
          
          // Le snapshot est stocké dans builder_data.publishedSnapshot (priorité) ou published_snapshot (colonne, fallback)
          const publishedSnapshot = product.builder_data?.publishedSnapshot || product.published_snapshot;
          if (publishedSnapshot && !forAdmin && !isPreview) {
            // Pour le configurateur client, retourner le snapshot sans builder_data (MAIS PAS EN MODE PREVIEW)
            console.log('📸 Retour du snapshot publié pour le produit - MODE NORMAL (ID Shopify):', {
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
              isPreview: false,
              // Vérifier la structure complète du snapshot
              snapshotKeys: Object.keys(publishedSnapshot)
            });
            return NextResponse.json({
              ...product,
              snapshot: publishedSnapshot,
              // Ne pas exposer builder_data au client
              builder_data: undefined
            });
          } else if (publishedSnapshot && forAdmin && !isPreview) {
            // Pour le builder admin, retourner le produit avec builder_data ET snapshot (MAIS PAS EN MODE PREVIEW)
            console.log('📸 Retour du produit avec snapshot pour le builder admin - MODE ADMIN (ID Shopify):', {
              productId: product.id,
              productName: product.name,
              isPreview: false
            });
            return NextResponse.json(product);
          }
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
          // Pour le preview, supprimer publishedSnapshot de builder_data avant génération
          let builderDataForSnapshot = product.builder_data;
          if (isPreview) {
            console.log('📸 Preview - suppression de publishedSnapshot de builder_data avant génération (ID Shopify):', {
              productId: product.id,
              hadPublishedSnapshotInBuilderData: !!product.builder_data?.publishedSnapshot,
              hadPublishedSnapshotColumn: !!product.published_snapshot
            });
            // Créer une copie de builder_data sans publishedSnapshot
            const { publishedSnapshot, ...restBuilderData } = product.builder_data;
            builderDataForSnapshot = restBuilderData;
          }
          
          try {
            // Vérifier que builder_data a un model3DId (requis par generateSnapshot)
            const model3DId = builderDataForSnapshot?.model3DId || 
                              builderDataForSnapshot?.modelId || 
                              builderDataForSnapshot?.selectedModel3DId || 
                              builderDataForSnapshot?.selectedModelId;
            
            if (!model3DId) {
              console.warn('⚠️ Pas de model3DId dans builder_data, impossible de générer le snapshot:', {
                productId: product.id,
                builderDataKeys: builderDataForSnapshot ? Object.keys(builderDataForSnapshot) : [],
                isPreview
              });
              // Pour le preview, retourner une erreur si pas de model3DId
              if (isPreview) {
                return NextResponse.json({
                  error: 'Aucun modèle 3D sélectionné dans le builder. Le preview nécessite un modèle 3D.',
                  product: {
                    id: product.id,
                    name: product.name,
                    shopify_product_id: product.shopify_product_id
                  }
                }, { status: 400 });
              }
              // Retourner le produit sans snapshot si pas de model3DId (mais sans publishedSnapshot si preview)
              const productResponse: any = { ...product };
              if (isPreview) {
                // En mode preview, ne JAMAIS inclure publishedSnapshot
                if (productResponse.builder_data?.publishedSnapshot) {
                  delete productResponse.builder_data.publishedSnapshot;
                }
                if (productResponse.published_snapshot) {
                  delete productResponse.published_snapshot;
                }
              }
              return NextResponse.json(productResponse);
            }
            
            // Utiliser le shopify_product_id si disponible, sinon utiliser l'ID du produit builder
            const shopifyProductIdForSnapshot = product.shopify_product_id || product.id;
            const shopDomainForSnapshot = shopDomain || product.shop_domain || '';
            
            console.log('📸 Génération automatique du snapshot (même logique que connexion):', {
              productId: product.id,
              shopifyProductId: shopifyProductIdForSnapshot,
              shopDomain: shopDomainForSnapshot,
              hasBuilderData: !!builderDataForSnapshot,
              builderDataKeys: builderDataForSnapshot ? Object.keys(builderDataForSnapshot) : [],
              model3DId: model3DId,
              hasCustomizationModules: !!(builderDataForSnapshot?.customizationModules),
              customizationModulesCount: builderDataForSnapshot?.customizationModules?.length || 0,
              isPreview,
              hasPublishedSnapshotInBuilderData: !!(product.builder_data?.publishedSnapshot)
            });
            
            // Utiliser builderDataForSnapshot (sans publishedSnapshot si preview) pour générer le snapshot
            const generatedSnapshot = await generateSnapshot(
              builderDataForSnapshot,
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
                forAdmin: forAdmin,
                isPreview: isPreview
              });
              
              // Pour le preview, toujours retourner le snapshot généré (ignorer publishedSnapshot)
              if (isPreview) {
                console.log('📸 Preview - retour du snapshot généré depuis builder_data:', {
                  productId: product.id,
                  productName: product.name,
                  shopifyProductId: product.shopify_product_id,
                  modulesCount: generatedSnapshot.customizationModules?.length || 0
                });
                return NextResponse.json({
                  ...product,
                  snapshot: generatedSnapshot,
                  builder_data: undefined // Ne pas exposer builder_data dans le preview
                });
              }
              
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
              console.error('❌ generateSnapshot a retourné null/undefined', {
                isPreview,
                productId: product.id
              });
              // Pour le preview, si generateSnapshot retourne null, retourner une erreur
              if (isPreview) {
                return NextResponse.json({
                  error: 'Erreur lors de la génération du snapshot depuis le builder. Veuillez vérifier votre configuration.',
                  product: {
                    id: product.id,
                    name: product.name,
                    shopify_product_id: product.shopify_product_id
                  }
                }, { status: 500 });
              }
            }
          } catch (error: any) {
            console.error('❌ Erreur lors de la génération automatique du snapshot:', {
              error: error.message,
              stack: error.stack,
              productId: product.id,
              isPreview,
              builderDataKeys: product.builder_data ? Object.keys(product.builder_data) : []
            });
            // Pour le preview, si la génération échoue, retourner une erreur plutôt que le produit avec publishedSnapshot
            if (isPreview) {
              return NextResponse.json({
                error: 'Erreur lors de la génération du snapshot depuis le builder. Veuillez vérifier votre configuration.',
                details: error.message,
                product: {
                  id: product.id,
                  name: product.name,
                  shopify_product_id: product.shopify_product_id
                }
              }, { status: 500 });
            }
            // Ne pas bloquer si la génération échoue pour les requêtes non-preview, retourner le produit sans snapshot
            // Mais logguer l'erreur pour debug
          }
        } else {
          console.warn('⚠️ Pas de builder_data disponible pour générer le snapshot:', {
            productId: product.id,
            hasBuilderData: !!product.builder_data,
            isPreview
          });
          // Pour le preview, si pas de builder_data, retourner une erreur
          if (isPreview) {
            return NextResponse.json({
              error: 'Aucune configuration dans le builder. Le preview nécessite au moins un modèle 3D et des modules de personnalisation.',
              product: {
                id: product.id,
                name: product.name,
                shopify_product_id: product.shopify_product_id
              }
            }, { status: 400 });
          }
        }

        // Sinon, retourner le produit avec builder_data (pour le builder admin)
        // MAIS en mode preview, ne JAMAIS inclure publishedSnapshot
        const productResponse: any = { ...product };
        if (isPreview) {
          console.log('📸 Preview - suppression de publishedSnapshot de la réponse (ID Shopify):', {
            productId: product.id,
            hadPublishedSnapshotInBuilderData: !!product.builder_data?.publishedSnapshot,
            hadPublishedSnapshotColumn: !!product.published_snapshot
          });
          // Supprimer publishedSnapshot de builder_data si présent
          if (productResponse.builder_data?.publishedSnapshot) {
            const { publishedSnapshot, ...restBuilderData } = productResponse.builder_data;
            productResponse.builder_data = restBuilderData;
          }
          // Supprimer published_snapshot de la colonne si présent
          if (productResponse.published_snapshot) {
            delete productResponse.published_snapshot;
          }
          // Ne pas exposer builder_data dans le preview
          productResponse.builder_data = undefined;
        }
        return NextResponse.json(productResponse);
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

