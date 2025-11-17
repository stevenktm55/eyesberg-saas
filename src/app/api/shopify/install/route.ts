import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Endpoint pour lancer l'installation OAuth Shopify
 * 
 * Flow :
 * 1. Le marchand clique sur un lien d'installation
 * 2. Ce endpoint redirige vers Shopify OAuth
 * 3. Shopify redirige vers /api/shopify/callback après autorisation
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop'); // ex: eyesbergtest.myshopify.com

    if (!shop) {
      return NextResponse.json(
        { error: 'Missing "shop" query parameter (ex: store.myshopify.com)' },
        { status: 400 }
      );
    }

    // Valider le format du shop
    if (!shop.match(/^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/)) {
      return NextResponse.json(
        { error: 'Invalid shop format. Expected store.myshopify.com' },
        { status: 400 }
      );
    }

    const clientId = process.env.SHOPIFY_CLIENT_ID;
    const redirectUri = process.env.SHOPIFY_REDIRECT_URI || 'http://localhost:3000/api/shopify/callback';
    const scopes = process.env.SHOPIFY_SCOPES || 'read_products,write_products,read_orders,write_script_tags';

    // Debug: vérifier si les variables sont chargées
    console.log('🔍 Variables d\'environnement:', {
      hasClientId: !!clientId,
      clientIdLength: clientId?.length || 0,
      redirectUri,
      scopes,
      allShopifyVars: Object.keys(process.env).filter(k => k.startsWith('SHOPIFY_')),
    });

    if (!clientId) {
      console.error('❌ SHOPIFY_CLIENT_ID manquant dans .env.local');
      console.error('🔍 Variables disponibles:', Object.keys(process.env).filter(k => k.includes('SHOPIFY') || k.includes('NEXT_PUBLIC')));
      return NextResponse.json(
        {
          error: 'Missing Shopify configuration',
          debug: {
            hasClientId: false,
            availableVars: Object.keys(process.env).filter(k => k.startsWith('SHOPIFY_')),
          },
        },
        { status: 500 }
      );
    }

    // Générer un nonce pour la sécurité (à stocker en session/DB plus tard)
    const nonce = crypto.randomUUID();

    // Essayer de récupérer le sous-domaine de l'admin actuel (ex: stretchmx.eyesberg.app)
    const host = request.headers.get('host') || '';
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'eyesberg.app';
    let subdomain: string | undefined;

    const hostWithoutPort = host.split(':')[0];
    if (hostWithoutPort.endsWith(rootDomain)) {
      const candidate = hostWithoutPort.replace(`.${rootDomain}`, '');
      if (candidate && candidate !== rootDomain) {
        subdomain = candidate;
      }
    }

    // Encoder le sous-domaine dans le paramètre state (subdomain|nonce)
    const state = subdomain ? `${subdomain}|${nonce}` : nonce;
    
    // Construire l'URL d'autorisation Shopify
    const authUrl = new URL(`https://${shop}/admin/oauth/authorize`);
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', state);

    // Rediriger vers Shopify OAuth
    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error('❌ Erreur lors de l\'installation Shopify:', error);
    return NextResponse.json(
      { error: 'Error while initializing the installation' },
      { status: 500 }
    );
  }
}

