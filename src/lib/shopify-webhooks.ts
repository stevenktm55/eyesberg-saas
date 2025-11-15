/**
 * Fonctions pour gérer les webhooks Shopify automatiquement
 */

const WEBHOOK_URL = process.env.NEXT_PUBLIC_APP_URL 
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/shopify`
  : process.env.NEXT_PUBLIC_ROOT_DOMAIN
  ? `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN}/api/webhooks/shopify`
  : 'http://localhost:3000/api/webhooks/shopify';

/**
 * Crée les webhooks nécessaires pour une boutique Shopify
 * Utilise l'API GraphQL Admin de Shopify
 */
export async function createWebhooks(shop: string, accessToken: string) {
  const webhooks = [
    {
      topic: 'ORDERS_CREATE',
      format: 'JSON',
    },
    {
      topic: 'APP_UNINSTALLED',
      format: 'JSON',
    },
  ];

  const results = [];

  for (const webhook of webhooks) {
    try {
      const result = await createWebhook(shop, accessToken, webhook.topic, webhook.format);
      results.push({ topic: webhook.topic, success: true, result });
      console.log(`✅ Webhook ${webhook.topic} créé avec succès`);
    } catch (error) {
      console.error(`❌ Erreur lors de la création du webhook ${webhook.topic}:`, error);
      results.push({ topic: webhook.topic, success: false, error });
    }
  }

  return results;
}

/**
 * Crée un webhook spécifique via l'API GraphQL Admin
 */
async function createWebhook(
  shop: string,
  accessToken: string,
  topic: string,
  format: string = 'JSON'
) {
  const mutation = `
    mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
      webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
        webhookSubscription {
          id
          callbackUrl
          format
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    topic,
    webhookSubscription: {
      callbackUrl: WEBHOOK_URL,
      format,
    },
  };

  const response = await fetch(`https://${shop}/admin/api/2025-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({
      query: mutation,
      variables,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erreur HTTP: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  if (data.errors) {
    throw new Error(`Erreur GraphQL: ${JSON.stringify(data.errors)}`);
  }

  if (data.data?.webhookSubscriptionCreate?.userErrors?.length > 0) {
    const errors = data.data.webhookSubscriptionCreate.userErrors;
    throw new Error(`Erreurs utilisateur: ${JSON.stringify(errors)}`);
  }

  return data.data?.webhookSubscriptionCreate?.webhookSubscription;
}

/**
 * Vérifie si un webhook existe déjà
 */
export async function checkWebhookExists(
  shop: string,
  accessToken: string,
  topic: string
): Promise<boolean> {
  const query = `
    query {
      webhookSubscriptions(first: 250) {
        edges {
          node {
            id
            callbackUrl
            topic
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(`https://${shop}/admin/api/2025-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    const webhooks = data.data?.webhookSubscriptions?.edges || [];

    return webhooks.some(
      (edge: any) =>
        edge.node.topic === topic && edge.node.callbackUrl === WEBHOOK_URL
    );
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des webhooks:', error);
    return false;
  }
}

