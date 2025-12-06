import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { saveShop } from '@/lib/shopify-shops';
import { createWebhooks } from '@/lib/shopify-webhooks';
import { createScriptTag } from '@/lib/shopify-script-tags';
import { supabaseAdmin } from '@/lib/supabase';

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

    // Validate required parameters
    // Si pas de code, c'est peut-être une redirection directe (app déjà installée)
    // Dans ce cas, rediriger vers settings avec un message
    if (!code || !shop || !hmac) {
      console.log('⚠️ Callback appelé sans code/hmac - peut-être une redirection directe');
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'eyesberg.app';
      const referer = request.headers.get('referer');
      let redirectUrl = '/admin/settings?error=oauth_cancelled';
      
      if (referer) {
        try {
          const refererUrl = new URL(referer);
          const host = refererUrl.host;
          if (host.endsWith(`.${rootDomain}`)) {
            const subdomain = host.replace(`.${rootDomain}`, '');
            redirectUrl = `https://${subdomain}.${rootDomain}/admin/settings?error=oauth_cancelled`;
          }
        } catch (e) {
          // Ignore
        }
      }
      
      return NextResponse.redirect(redirectUrl, { status: 302 });
    }

    // Valider le format du shop
    if (!shop.match(/^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/)) {
      return NextResponse.json(
        { error: 'Invalid shop format' },
        { status: 400 }
      );
    }

    // Vérifier le HMAC pour s'assurer que la requête vient de Shopify
    const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
    if (!clientSecret) {
      console.error('❌ SHOPIFY_CLIENT_SECRET manquant dans .env.local');
      return NextResponse.json(
        { error: 'Missing Shopify configuration' },
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
        { error: 'Invalid request (HMAC mismatch)' },
        { status: 403 }
      );
    }

    // Extraire le sous-domaine depuis state (format: subdomain|nonce)
    let subdomain: string | undefined;
    if (state && state.includes('|')) {
      const [maybeSub] = state.split('|');
      if (maybeSub && maybeSub.length > 0 && maybeSub !== 'undefined') {
        subdomain = maybeSub;
      }
    }
    
    // Si pas de subdomain dans state, essayer de l'extraire depuis le referer ou l'URL de redirection
    if (!subdomain) {
      const referer = request.headers.get('referer');
      if (referer) {
        const refererUrl = new URL(referer);
        const host = refererUrl.host;
        const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'eyesberg.app';
        if (host.endsWith(`.${rootDomain}`)) {
          const parts = host.split('.');
          if (parts.length >= 3) {
            const candidate = parts[0];
            if (candidate && candidate !== 'www' && candidate !== 'api') {
              subdomain = candidate;
            }
          }
        }
      }
    }

    // Échanger le code contre un access_token
    const clientId = process.env.SHOPIFY_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json(
        { error: 'Missing Shopify configuration' },
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
        { error: 'Failed to exchange the OAuth token' },
        { status: 500 }
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, scope } = tokenData;

    // Vérifier que les scopes requis sont présents
    const requiredScopes = ['read_orders'];
    // Les scopes peuvent être séparés par des virgules ou des espaces
    const grantedScopes = scope ? scope.split(/[,\s]+/).map(s => s.trim()).filter(s => s) : [];
    const missingScopes = requiredScopes.filter(req => !grantedScopes.includes(req));
    
    console.log('📋 Scopes accordés par Shopify:', grantedScopes);
    console.log('📋 Scopes requis:', requiredScopes);
    
    if (missingScopes.length > 0) {
      console.warn('⚠️ Scopes manquants:', missingScopes);
      console.warn('⚠️ L\'app doit être désinstallée depuis Shopify Admin avant de pouvoir être réinstallée avec les bonnes permissions.');
      
      // Rediriger vers settings avec un message d'erreur spécifique
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'eyesberg.app';
      let redirectUrl = '/admin/settings?error=missing_scopes&missing=' + encodeURIComponent(missingScopes.join(','));
      
      if (subdomain) {
        redirectUrl = `https://${subdomain}.${rootDomain}/admin/settings?error=missing_scopes&missing=${encodeURIComponent(missingScopes.join(','))}`;
      }
      
      return NextResponse.redirect(redirectUrl, { status: 302 });
    }

    console.log('✅ Tous les scopes requis sont présents:', grantedScopes);

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

    // Tenter de lier la boutique à un compte via le sous-domaine
    let accountId: string | undefined;
    if (subdomain) {
      try {
        const { data: account, error: accountError } = await supabaseAdmin
          .from('accounts')
          .select('id')
          .eq('subdomain', subdomain)
          .single();

        if (accountError) {
          console.warn('⚠️ Impossible de récupérer le compte pour ce sous-domaine:', subdomain, accountError.message);
        } else if (account) {
          accountId = account.id;
          console.log('🔗 Boutique liée au compte:', accountId, 'pour le sous-domaine:', subdomain);
        }
      } catch (e) {
        console.warn('⚠️ Erreur inattendue lors de la récupération du compte:', e);
      }
    }

    // Sauvegarder la boutique en base de données Supabase
    try {
      console.log('💾 Sauvegarde de la boutique avec scopes:', scope);
      await saveShop({
        shopDomain: shop,
        shopGid,
        accessToken: access_token,
        scopes: scope, // Sauvegarder les scopes exacts retournés par Shopify
        installedAt: new Date(),
        shopName,
        shopEmail,
        accountId,
        subdomain,
      });
      console.log('✅ Boutique sauvegardée en base de données avec scopes:', scope);
      
      // Vérifier que les scopes ont bien été sauvegardés
      const { data: savedShop } = await supabaseAdmin
        .from('shops')
        .select('scopes')
        .eq('shop_domain', shop)
        .single();
      
      console.log('🔍 Scopes sauvegardés en DB:', savedShop?.scopes);
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

    // Créer le script tag automatiquement (injection du JavaScript sans modification du thème)
    try {
      console.log('📜 Création automatique du script tag...');
      const scriptTagResult = await createScriptTag(shop, access_token);
      if (scriptTagResult.success) {
        console.log('✅ Script tag créé avec succès - Le configurateur sera injecté automatiquement');
      } else {
        console.warn('⚠️ Script tag non créé:', scriptTagResult.error);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la création du script tag:', error);
      // On continue quand même, l'installation est réussie même si le script tag échoue
      // (l'utilisateur peut toujours l'ajouter manuellement si nécessaire)
    }

    // Rediriger vers la page Settings après installation réussie
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'eyesberg.app';
    let redirectUrl: string;
    
    if (subdomain && accountId) {
      // Rediriger vers le sous-domaine du compte - page Settings
      redirectUrl = `https://${subdomain}.${rootDomain}/admin/settings?installed=1&shop=${encodeURIComponent(shop)}`;
    } else {
      // Fallback vers le domaine racine
      redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/settings?installed=1&shop=${encodeURIComponent(shop)}`;
    }
    
    console.log('✅ Installation réussie, redirection vers:', redirectUrl);
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('❌ Erreur lors du callback OAuth Shopify:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la finalisation de l\'installation' },
      { status: 500 }
    );
  }
}

