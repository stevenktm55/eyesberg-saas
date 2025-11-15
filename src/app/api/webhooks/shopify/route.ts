import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const shopifyWebhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Vérifier la signature HMAC du webhook Shopify
 */
function verifyShopifyWebhook(body: string, hmacHeader: string): boolean {
  if (!shopifyWebhookSecret) {
    console.warn('⚠️ SHOPIFY_WEBHOOK_SECRET non configuré - validation désactivée');
    return true; // En dev, on accepte tout
  }

  const hash = crypto
    .createHmac('sha256', shopifyWebhookSecret)
    .update(body, 'utf8')
    .digest('base64');

  return hash === hmacHeader;
}

/**
 * Webhook Shopify - Gère plusieurs types d'événements :
 * - orders/create : Quand une commande est créée
 * - app/uninstalled : Quand l'app est désinstallée d'une boutique
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📬 Webhook Shopify reçu');

    // 1. Récupérer le body brut (nécessaire pour HMAC)
    const rawBody = await request.text();
    const hmacHeader = request.headers.get('x-shopify-hmac-sha256') || '';
    const topic = request.headers.get('x-shopify-topic') || '';

    // 2. Vérifier la signature HMAC
    if (!verifyShopifyWebhook(rawBody, hmacHeader)) {
      console.error('❌ Signature HMAC invalide');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    console.log('✅ Signature HMAC valide');
    console.log('📋 Topic:', topic);

    // 3. Router selon le type de webhook
    if (topic === 'app/uninstalled') {
      return handleAppUninstalled(rawBody);
    } else if (topic === 'orders/create') {
      return handleOrderCreate(rawBody);
    } else {
      console.warn('⚠️ Topic non géré:', topic);
      return NextResponse.json(
        { error: 'Unsupported webhook topic', topic },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('❌ Erreur webhook Shopify:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Gère la désinstallation de l'app
 */
async function handleAppUninstalled(rawBody: string) {
  try {
    const uninstallData = JSON.parse(rawBody);
    const shopDomain = uninstallData.domain || uninstallData.myshopify_domain;

    if (!shopDomain) {
      console.error('❌ Pas de shop_domain dans le webhook app/uninstalled');
      return NextResponse.json(
        { error: 'No shop domain found' },
        { status: 400 }
      );
    }

    console.log('🚫 Désinstallation de l\'app pour:', shopDomain);

    // 1. Trouver la boutique dans la base
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('id, shop_domain, shop_name')
      .eq('shop_domain', shopDomain)
      .single();

    if (shopError || !shop) {
      console.warn('⚠️ Boutique non trouvée:', shopDomain);
      // On retourne quand même un succès car la boutique n'existe peut-être plus
      return NextResponse.json({
        success: true,
        message: 'Shop not found (may have been already uninstalled)',
        shop_domain: shopDomain,
      });
    }

    console.log('🔍 Boutique trouvée:', shop.id, shop.shop_name);

    // 2. Supprimer l'access_token pour sécurité (ne pas supprimer complètement pour garder l'historique)
    const { error: updateError } = await supabase
      .from('shops')
      .update({
        access_token: null,
        scopes: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', shop.id);

    if (updateError) {
      console.error('❌ Erreur lors de la désinstallation:', updateError);
      return NextResponse.json(
        { error: 'Failed to uninstall shop' },
        { status: 500 }
      );
    }

    console.log('✅ Access token supprimé pour:', shopDomain);

    // 3. Optionnel : Désactiver les produits associés (garder les données pour historique)
    const { error: productsError } = await supabase
      .from('shopify_products')
      .update({
        enabled_for_configurator: false,
        updated_at: new Date().toISOString(),
      })
      .eq('shop_id', shop.id);

    if (productsError) {
      console.warn('⚠️ Erreur lors de la désactivation des produits:', productsError);
      // On continue quand même, ce n'est pas critique
    } else {
      console.log('✅ Produits désactivés pour:', shopDomain);
    }

    // 4. Optionnel : Désactiver les configurations publiées
    // On récupère d'abord les IDs des produits
    const { data: products } = await supabase
      .from('shopify_products')
      .select('id')
      .eq('shop_id', shop.id);

    if (products && products.length > 0) {
      const productIds = products.map(p => p.id);
      const { error: configsError } = await supabase
        .from('shopify_product_configs')
        .update({
          is_published: false,
          updated_at: new Date().toISOString(),
        })
        .in('shopify_product_id', productIds);

      if (configsError) {
        console.warn('⚠️ Erreur lors de la désactivation des configs:', configsError);
      } else {
        console.log('✅ Configurations désactivées pour:', shopDomain);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'App uninstalled successfully',
      shop_domain: shopDomain,
      shop_id: shop.id,
    });
  } catch (error) {
    console.error('❌ Erreur lors du traitement app/uninstalled:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Gère la création d'une commande
 */
async function handleOrderCreate(rawBody: string) {
  try {
    // 3. Parser le JSON
    const orderData = JSON.parse(rawBody);
    
    console.log('📦 Commande Shopify:', {
      id: orderData.id,
      order_number: orderData.order_number,
      name: orderData.name,
      email: orderData.email,
      line_items_count: orderData.line_items?.length,
    });

    // 4. Extraire les infos importantes
    const shopifyOrderId = orderData.order_number; // Le numéro visible (ex: 1001)
    const shopifyOrderName = orderData.name; // Ex: #1001
    const customerEmail = orderData.email;
    const cartToken = orderData.cart_token;

    console.log('🔍 Recherche configuration avec cart_token:', cartToken);

    // Map pour stocker les noms de produits associés aux config IDs
    const configProducts: Map<string, string> = new Map();

    // 5. Chercher la configuration correspondante via cart_token
    if (!cartToken) {
      console.error('❌ Pas de cart_token dans la commande Shopify');
      return NextResponse.json(
        { error: 'No cart_token found' },
        { status: 400 }
      );
    }

    const { data: configs, error: searchError } = await supabase
      .from('configurations')
      .select('*')
      .eq('cart_token', cartToken);

    if (searchError) {
      console.error('❌ Erreur recherche configuration:', searchError);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    if (!configs || configs.length === 0) {
      console.error('❌ Aucune configuration trouvée avec ce cart_token:', cartToken);
      console.log('🔍 Recherche alternative par _configuration_id dans les line items...');
      
      // Chercher directement par _configuration_id (UUID ou order_number) dans les line items
      if (orderData.line_items && orderData.line_items.length > 0) {
        const allConfigIds: string[] = [];
        
        // Collecter tous les _configuration_id des line items
        for (const lineItem of orderData.line_items) {
          if (lineItem.properties) {
            const configIdProperty = lineItem.properties.find(p => 
              p.name === '_configuration_id' || p.name === 'configuration_id'
            );
            if (configIdProperty && configIdProperty.value) {
              const configId = configIdProperty.value.trim();
              // Vérifier si c'est un UUID (format avec tirets) ou un order_number
              if (configId.includes('-')) {
                // C'est un UUID, chercher directement par ID
                allConfigIds.push(configId);
                configProducts.set(configId, lineItem.title || lineItem.name);
                console.log('🔍 Configuration ID trouvée (UUID):', configId, 'Produit:', lineItem.title);
              } else {
                // C'est peut-être un order_number, chercher par order_number
                const orderNum = parseInt(configId);
                if (!isNaN(orderNum)) {
                  console.log('🔍 Recherche par order_number:', orderNum);
                  const { data: configByNumber } = await supabase
                    .from('configurations')
                    .select('*')
                    .eq('order_number', orderNum)
                    .limit(1);
                  
                  if (configByNumber && configByNumber.length > 0) {
                    allConfigIds.push(configByNumber[0].id);
                    configProducts.set(configByNumber[0].id, lineItem.title || lineItem.name);
                  }
                }
              }
            }
          }
        }
        
        // Chercher toutes les configurations par leurs IDs
        if (allConfigIds.length > 0) {
          console.log(`🔍 Recherche de ${allConfigIds.length} configuration(s) par ID direct...`);
          const { data: configsByIds, error: errorByIds } = await supabase
            .from('configurations')
            .select('*')
            .in('id', allConfigIds);
          
          if (errorByIds) {
            console.error('❌ Erreur recherche par IDs:', errorByIds);
          } else if (configsByIds && configsByIds.length > 0) {
            console.log(`✅ ${configsByIds.length} configuration(s) trouvée(s) par ID direct`);
            // Utiliser ces configs au lieu de configFound
            configs.push(...configsByIds);
          }
        }
      }
      
      // Si on n'a toujours pas trouvé de configs, retourner une erreur
      if (!configs || configs.length === 0) {
        console.warn('⚠️ Aucune configuration trouvée pour cette commande');
        console.log('📦 Cette commande contient peut-être des produits sans configurateur ou les _configuration_id ne correspondent pas');
        return NextResponse.json({
          error: 'Configuration not found',
          cart_token: cartToken,
          suggestion: 'Vérifier que les _configuration_id dans les line items correspondent aux IDs dans Supabase'
        }, { status: 404 });
      }
      
      // Si on a trouvé des configs par ID direct, elles sont déjà dans configs
      // Maintenant on passe à la mise à jour (même logique que plus bas)
    }

    console.log(`✅ ${configs.length} configuration(s) trouvée(s) pour cette commande`);
    
    // Si on a trouvé par cart_token, collecter aussi les noms de produits depuis les line_items
    if (configs.length > 0 && orderData.line_items && orderData.line_items.length > 0) {
      for (const lineItem of orderData.line_items) {
        if (lineItem.properties) {
          const configIdProp = lineItem.properties.find(p => 
            p.name === '_configuration_id' || p.name === 'configuration_id'
          );
          if (configIdProp && configIdProp.value) {
            const configId = configIdProp.value.trim();
            // Chercher la config correspondante (par UUID ou order_number)
            const matchingConfig = configs.find(c => 
              c.id === configId || 
              String(c.order_number).padStart(5, '0') === configId ||
              String(c.order_number) === configId
            );
            if (matchingConfig) {
              configProducts.set(matchingConfig.id, lineItem.title || lineItem.name);
            }
          }
        }
      }
    }

    // 6. Mettre à jour TOUTES les configurations trouvées
    const linkedConfigs = [];
    for (const config of configs) {
      console.log('📝 Mise à jour config:', {
        config_id: config.id,
        order_number: config.order_number,
      });

      // Utiliser le nom de produit déjà collecté, ou chercher dans les line_items
      let productName = configProducts.get(config.id) || null;
      
      // Si pas trouvé dans configProducts, chercher dans les line_items
      if (!productName && orderData.line_items && orderData.line_items.length > 0) {
        for (const lineItem of orderData.line_items) {
          if (lineItem.properties) {
            const configIdProp = lineItem.properties.find(p => p.name === '_configuration_id' || p.name === 'configuration_id');
            if (configIdProp && (configIdProp.value === String(config.order_number).padStart(5, '0') || configIdProp.value === config.id)) {
              productName = lineItem.title || lineItem.name;
              console.log('📦 Nom du produit trouvé:', productName);
              break;
            }
          }
        }
      }

      // Mettre à jour avec le numéro de commande Shopify
      const updateData: any = {
        shopify_order_id: shopifyOrderId.toString(),
        shopify_order_name: shopifyOrderName,
        status: 'ordered',
        updated_at: new Date().toISOString(),
      };
      
      if (productName) {
        updateData.product_name = productName;
      }
      
      const { error: updateError } = await supabase
        .from('configurations')
        .update(updateData)
        .eq('id', config.id);

      if (updateError) {
        console.error('❌ Erreur mise à jour config:', config.id, updateError);
      } else {
        linkedConfigs.push({
          config_id: config.id,
          order_number: config.order_number,
        });
        console.log('✅ Config #' + String(config.order_number).padStart(5, '0') + ' liée à Shopify');
      }
    }

    // 7. Retourner une réponse de succès
    return NextResponse.json({
      success: true,
      message: `${linkedConfigs.length} configuration(s) liée(s) à Shopify`,
      linked_configs: linkedConfigs,
      shopify_order: shopifyOrderName,
    });

  } catch (error) {
    console.error('❌ Erreur webhook Shopify:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET pour tester que l'endpoint est actif
 */
export async function GET() {
  return NextResponse.json({
    status: 'active',
    message: 'Shopify webhook endpoint ready',
    supported_topics: ['orders/create', 'app/uninstalled'],
    timestamp: new Date().toISOString(),
  });
}

