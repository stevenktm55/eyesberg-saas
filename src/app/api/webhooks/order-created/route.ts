// =====================================================
// WEBHOOK SHOPIFY - ORDER CREATED (VERSION SUPABASE)
// =====================================================
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";

/**
 * Webhook Shopify pour les nouvelles commandes
 * 
 * Configure dans Shopify Admin :
 * Paramètres → Notifications → Webhooks → Créer un webhook
 * Event: Orders / Create
 * URL: https://ton-domaine.com/api/webhooks/order-created
 */

// Vérifier la signature du webhook Shopify
function verifyShopifyWebhook(
  body: string,
  hmacHeader: string,
  secret: string
): boolean {
  const hash = crypto
    .createHmac("sha256", secret)
    .update(body, "utf8")
    .digest("base64");
  
  return hash === hmacHeader;
}

export async function POST(req: NextRequest) {
  try {
    // Récupérer le secret Shopify depuis les variables d'environnement
    const shopifyWebhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET;
    
    if (!shopifyWebhookSecret) {
      console.warn("⚠️  SHOPIFY_WEBHOOK_SECRET non configuré - mode développement");
    }

    // Vérifier la signature du webhook (en production)
    const hmacHeader = req.headers.get("x-shopify-hmac-sha256");
    const bodyText = await req.text();
    
    if (shopifyWebhookSecret && hmacHeader) {
      const isValid = verifyShopifyWebhook(bodyText, hmacHeader, shopifyWebhookSecret);
      
      if (!isValid) {
        console.error("❌ Signature webhook invalide");
        return NextResponse.json(
          { error: "Signature invalide" },
          { status: 401 }
        );
      }
    }

    // Parser le body
    const order = JSON.parse(bodyText);

    console.log("📦 Nouvelle commande Shopify reçue:", {
      orderId: order.id,
      orderNumber: order.order_number,
      email: order.email,
      customer: order.customer?.first_name + ' ' + order.customer?.last_name
    });

    // Traiter les line items pour trouver les configurations
    const configurationsFound: string[] = [];

    for (const lineItem of order.line_items) {
      // Chercher les propriétés de configuration
      const properties = lineItem.properties || [];
      
      let configId: string | null = null;

      for (const prop of properties) {
        if (prop.name === "_configuration_id" || prop.name === "configuration_id") {
          configId = prop.value;
        }
      }

      if (configId) {
        configurationsFound.push(configId);

        console.log("🎨 Configuration trouvée:", {
          lineItemId: lineItem.id,
          configId,
          productTitle: lineItem.title,
        });

        // Mettre à jour la configuration dans Supabase
        try {
          // Utiliser order_number (numéro visible) au lieu de order.id (ID interne)
          const shopifyOrderNumber = order.order_number || order.id;
          const shopifyOrderName = order.name || `#${shopifyOrderNumber}`;
          
          const { error: updateError } = await supabase
            .from('configurations')
            .update({
              shopify_order_id: shopifyOrderNumber.toString(),
              shopify_order_name: shopifyOrderName,
              customer_email: order.email || order.customer?.email,
              customer_name: order.customer 
                ? `${order.customer.first_name} ${order.customer.last_name}`.trim()
                : undefined,
              status: 'ordered',
              updated_at: new Date().toISOString()
            })
            .eq('id', configId);

          if (updateError) {
            console.error("❌ Erreur mise à jour configuration:", updateError);
          } else {
            console.log("✅ Configuration mise à jour:", configId);
          }
        } catch (err) {
          console.error("❌ Erreur lors de la mise à jour:", err);
        }
      }
    }

    console.log("✅ Webhook traité avec succès:", {
      orderId: order.id,
      orderNumber: order.order_number,
      configurationsCount: configurationsFound.length,
      configurations: configurationsFound,
    });

    // Optionnel : Envoyer un email de notification
    // await sendProductionNotification(order, configurationsFound);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
      configurationsProcessed: configurationsFound.length,
    });
  } catch (error) {
    console.error("❌ Erreur lors du traitement du webhook:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

// Permettre GET pour vérifier que le webhook est actif
export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: "active",
    webhook: "order-created",
    message: "Webhook StretchMX pour Shopify order/create",
    timestamp: new Date().toISOString()
  });
}
