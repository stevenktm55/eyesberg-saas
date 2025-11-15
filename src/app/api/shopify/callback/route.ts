import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { saveShop } from '@/lib/shopify-shops';
import { createWebhooks } from '@/lib/shopify-webhooks';

/**
 * Callback OAuth Shopify
 * 
 * Flow :
 * 1. Shopify redirige ici après autorisation avec ?code=...&shop=...&state=...
 * 2. On échange le code contre un access_token
 * 3. On stocke la boutique en base de données
 * 4. On redirige vers le dashboard marchand
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const shop = searchParams.get('shop');
    const state = searchParams.get('state');
    const hmac = searchParams.get('hmac');

    // Validation des paramètres
    if (!code || !shop || !hmac) {
      return NextResponse.json(
        { error: 'Paramètres OAuth manquants (code, shop, hmac requis)' },
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

    // Vérifier le HMAC pour s'assurer que la requête vient de Shopify
    const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
    if (!clientSecret) {
      console.error('❌ SHOPIFY_CLIENT_SECRET manquant dans .env.local');
      return NextResponse.json(
        { error: 'Configuration Shopify manquante' },
        { status: 500 }
      );
    }

    // Construire la query string sans HMAC pour la vérification
    const params = new URLSearchParams();
    searchParams.forEach((value, key) => {
      if (key !== 'hmac' && key !== 'signature') {
        params.append(key, value);
      }
    });
    const sortedParams = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    // Calculer le HMAC
    const calculatedHmac = crypto
      .createHmac('sha256', clientSecret)
      .update(sortedParams)
      .digest('hex');

    // Comparer les HMAC
    if (calculatedHmac !== hmac) {
      console.error('❌ HMAC invalide - possible tentative de fraude');
      return NextResponse.json(
        { error: 'Requête invalide (HMAC)' },
        { status: 403 }
      );
    }

    // Échanger le code contre un access_token
    const clientId = process.env.SHOPIFY_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json(
        { error: 'Configuration Shopify manquante' },
        { status: 500 }
      );
    }

    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Erreur lors de l\'échange du token:', errorText);
      return NextResponse.json(
        { error: 'Échec de l\'échange du token OAuth' },
        { status: 500 }
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, scope } = tokenData;

    // Récupérer les infos de la boutique via l'API Shopify
    let shopName: string | undefined;
    let shopEmail: string | undefined;
    let shopGid: string | undefined;

    const shopInfoResponse = await fetch(`https://${shop}/admin/api/2025-01/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': access_token,
      },
    });

    if (shopInfoResponse.ok) {
      const shopInfo = await shopInfoResponse.json();
      shopName = shopInfo.shop.name;
      shopEmail = shopInfo.shop.email;
      shopGid = shopInfo.shop.id ? `gid://shopify/Shop/${shopInfo.shop.id}` : undefined;
      console.log('📦 Infos boutique:', shopName, shopEmail);
    }

    // Sauvegarder la boutique en base de données Supabase
    try {
      await saveShop({
        shopDomain: shop,
        shopGid,
        accessToken: access_token,
        scopes: scope,
        installedAt: new Date(),
        shopName,
        shopEmail,
        // accountId sera défini plus tard (quand on aura le système d'authentification)
      });
      console.log('✅ Boutique sauvegardée en base de données');
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde de la boutique:', error);
      // On continue quand même, l'installation est réussie même si la sauvegarde échoue
    }

    // Créer les webhooks automatiquement (plug & play)
    try {
      console.log('🔗 Création automatique des webhooks...');
      const webhookResults = await createWebhooks(shop, access_token);
      const successCount = webhookResults.filter(r => r.success).length;
      console.log(`✅ ${successCount}/${webhookResults.length} webhook(s) créé(s) avec succès`);
      
      // Log des erreurs éventuelles
      webhookResults.forEach(result => {
        if (!result.success) {
          console.warn(`⚠️ Webhook ${result.topic} non créé:`, result.error);
        }
      });
    } catch (error) {
      console.error('❌ Erreur lors de la création des webhooks:', error);
      // On continue quand même, l'installation est réussie même si les webhooks échouent
      // (on peut les créer manuellement plus tard si nécessaire)
    }

    // Rediriger vers la page de succès, qui proposera d'aller au dashboard
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/shopify/success?shop=${shop}`;
    
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('❌ Erreur lors du callback OAuth Shopify:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la finalisation de l\'installation' },
      { status: 500 }
    );
  }
}

