// =====================================================
// API POUR GÉRER LE PRODUCT BUILDER
// =====================================================
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSubdomain } from '@/lib/get-subdomain';

/**
 * Génère un snapshot à partir de builder_data pour le configurateur
 */
async function generateSnapshotFromBuilderData(builderData: any, shopDomain?: string | null): Promise<any | null> {
  try {
    // Récupérer le modèle 3D par défaut
    let modelUrl = builderData?.modelUrl || builderData?.model_url || null;
    if (!modelUrl) {
      // Récupérer le premier modèle actif disponible
      const { data: models } = await supabaseAdmin
        .from('models_3d')
        .select('glb_url')
        .eq('active', true)
        .limit(1);
      
      if (models && models.length > 0) {
        modelUrl = models[0].glb_url;
      }
    }

    // Récupérer le design 2D par défaut
    let designUrl = builderData?.designUrl || builderData?.design_url || null;
    if (!designUrl) {
      // Récupérer le premier design actif disponible
      const { data: designs } = await supabaseAdmin
        .from('designs')
        .select('svg_url')
        .eq('active', true)
        .limit(1);
      
      if (designs && designs.length > 0) {
        designUrl = designs[0].svg_url;
      }
    }

    // Extraire les modules de personnalisation depuis builder_data.questions
    const questions = builderData?.questions || [];
    const customizationModules = questions.map((q: any, index: number) => {
      const module: any = {
        id: q.id || `module-${index}`,
        type: q.type || q.contentType || 'unknown',
        label: q.label || q.tabName || 'Module',
        tabName: q.tabName || q.label || 'Module',
        icon: q.icon || q.config?.icon,
        iconUrl: q.iconUrl || q.config?.iconUrl,
        config: q.config || {},
        selectedItems: q.selectedItems || {},
        allowedDesigns: q.allowedDesigns || [],
        allowedColors: q.allowedColors || [],
        default: q.default
      };
      return module;
    });

    // Créer le snapshot avec la structure attendue par ConfiguratorViewer
    const snapshot = {
      version: '1.0.0',
      publishedAt: new Date().toISOString(),
      model3D: modelUrl ? { url: modelUrl } : null,
      design2D: designUrl ? { url: designUrl } : null,
      customizationModules: customizationModules.length > 0 ? customizationModules : [
        {
          id: 'default-designs',
          type: 'designs-2d',
          label: 'Designs',
          tabName: 'Designs',
          config: {},
          selectedItems: {},
          allowedDesigns: [],
          allowedColors: []
        }
      ],
      defaultState: {
        design2DId: designUrl || null,
        colorId: builderData?.defaultColorId || null
      },
      cameraSettings: builderData?.cameraSettings || {},
      textZones: builderData?.textZones || [],
      fonts: builderData?.fonts || []
    };

    return snapshot;
  } catch (error) {
    console.error('Error generating snapshot from builder_data:', error);
    return null;
  }
}

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
        if (publishedSnapshot) {
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
        if (product.builder_data) {
          try {
            const generatedSnapshot = await generateSnapshotFromBuilderData(product.builder_data, shopDomain);
            if (generatedSnapshot) {
              console.log('✅ Snapshot généré automatiquement:', {
                hasModel3D: !!generatedSnapshot.model3D,
                hasDesign2D: !!generatedSnapshot.design2D,
                modulesCount: generatedSnapshot.customizationModules?.length || 0
              });
              return NextResponse.json({
                ...product,
                snapshot: generatedSnapshot,
                // Ne pas exposer builder_data au client
                builder_data: undefined
              });
            }
          } catch (error) {
            console.error('❌ Erreur lors de la génération automatique du snapshot:', error);
          }
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

