import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { getShopByDomain } from '@/lib/shopify-shops';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/shopify/orders?shop=store.myshopify.com
 * Récupère les commandes Shopify pour une boutique
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('eyesberg_session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Vérifier la session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select('*, accounts(*)')
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !session || !session.accounts) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop');

    if (!shop) {
      return NextResponse.json(
        { error: 'Missing "shop" query parameter' },
        { status: 400 }
      );
    }

    // Valider le format du shop
    if (!shop.match(/^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/)) {
      return NextResponse.json(
        { error: 'Invalid shop format' },
        { status: 400 }
      );
    }

    // Récupérer les infos de la boutique (pour l'access token)
    const shopData = await getShopByDomain(shop);
    if (!shopData || !shopData.access_token) {
      return NextResponse.json(
        { error: 'Shop not found or not connected', orders: [] },
        { status: 200 }
      );
    }

    // Vérifier que la boutique appartient au compte de l'utilisateur
    const userSubdomain = (session.accounts as any).subdomain;
    if (shopData.subdomain && shopData.subdomain !== userSubdomain) {
      return NextResponse.json(
        { error: 'Forbidden: Shop does not belong to your account', orders: [] },
        { status: 200 }
      );
    }

    // Logs de debug pour vérifier les scopes
    console.log('🔍 Debug Orders API:', {
      shop: shop,
      hasAccessToken: !!shopData.access_token,
      accessTokenLength: shopData.access_token?.length || 0,
      scopes: shopData.scopes,
      scopesType: typeof shopData.scopes,
      scopesIncludes: shopData.scopes?.includes('read_orders'),
      scopesSplit: shopData.scopes ? shopData.scopes.split(/[,\s]+/).map(s => s.trim()) : []
    });

    // Vérifier les scopes avant d'appeler l'API
    const grantedScopes = shopData.scopes ? shopData.scopes.split(/[,\s]+/).map(s => s.trim()).filter(s => s) : [];
    const hasReadOrdersScope = grantedScopes.includes('read_orders');
    
    if (!hasReadOrdersScope) {
      console.warn('⚠️ Scope read_orders manquant. Scopes accordés:', grantedScopes);
      return NextResponse.json({
        orders: [],
        total: 0,
        page: 1,
        limit: 25,
        error: 'Missing "read_orders" permission. The app was installed without the required permissions. Please uninstall and reinstall the app.'
      });
    }

    // Récupérer les commandes depuis l'API Shopify
    const limit = parseInt(searchParams.get('limit') || '25');
    const page = parseInt(searchParams.get('page') || '1');
    const status = searchParams.get('status') || 'any';

    let ordersUrl = `https://${shop}/admin/api/2025-01/orders.json?limit=${limit}&page=${page}`;
    if (status !== 'any') {
      ordersUrl += `&status=${status}`;
    }

    console.log('📡 Appel API Shopify Orders:', ordersUrl);
    console.log('🔑 Token utilisé (premiers 10 caractères):', shopData.access_token?.substring(0, 10) + '...');

    const ordersResponse = await fetch(ordersUrl, {
      headers: {
        'X-Shopify-Access-Token': shopData.access_token,
        'Content-Type': 'application/json',
      },
    });

    console.log('📥 Réponse API Shopify:', {
      status: ordersResponse.status,
      statusText: ordersResponse.statusText,
      headers: Object.fromEntries(ordersResponse.headers.entries())
    });

    if (!ordersResponse.ok) {
      const errorText = await ordersResponse.text();
      let errorJson: any = null;
      
      try {
        errorJson = JSON.parse(errorText);
      } catch (e) {
        // Pas du JSON, garder le texte brut
      }
      
      console.error('❌ Erreur API Shopify:', {
        status: ordersResponse.status,
        statusText: ordersResponse.statusText,
        errorText: errorText,
        errorJson: errorJson,
        shop: shop,
        scopes: shopData.scopes,
        grantedScopes: grantedScopes,
        hasReadOrdersScope: hasReadOrdersScope,
        url: ordersUrl
      });
      
      let errorMessage = 'Failed to fetch orders from Shopify.';
      
      if (ordersResponse.status === 403) {
        // Vérifier le message d'erreur spécifique de Shopify
        if (errorJson?.errors) {
          const shopifyError = Array.isArray(errorJson.errors) 
            ? errorJson.errors[0] 
            : typeof errorJson.errors === 'object' 
              ? Object.values(errorJson.errors)[0] 
              : errorJson.errors;
          
          if (typeof shopifyError === 'string' && shopifyError.includes('permission')) {
            errorMessage = `Access denied: ${shopifyError}. Please check your Shopify app permissions.`;
          } else {
            errorMessage = `Access denied: ${JSON.stringify(shopifyError)}. Please reconnect your Shopify store.`;
          }
        } else if (!hasReadOrdersScope) {
          errorMessage = 'Missing "read_orders" permission. Please uninstall and reinstall the app with the correct permissions.';
        } else {
          errorMessage = 'Access denied (403). The token may have been revoked or the permissions changed. Please reconnect your Shopify store.';
        }
      } else if (ordersResponse.status === 401) {
        errorMessage = 'Invalid access token (401). Please reconnect your Shopify store.';
      } else if (ordersResponse.status === 404) {
        errorMessage = 'Orders endpoint not found. Please check the Shopify API version.';
      } else {
        errorMessage = `Shopify API error (${ordersResponse.status}): ${errorText.substring(0, 200)}`;
      }
      
      // Retourner un tableau vide au lieu d'une erreur pour permettre l'affichage du tableau
      return NextResponse.json({
        orders: [],
        total: 0,
        page: 1,
        limit: 25,
        error: errorMessage
      });
    }

    const ordersData = await ordersResponse.json();
    const orders = ordersData.orders || [];

    // Formater les commandes pour l'affichage
    const formattedOrders = orders.map((order: any, index: number) => ({
      orderNumber: orders.length - index + (page - 1) * limit, // Numéro séquentiel
      ecommerceOrder: `#${order.order_number}`,
      onlineStore: shopData.shop_name || shop,
      paymentStatus: order.financial_status || 'pending',
      fulfillmentStatus: order.fulfillment_status || 'pending',
      total: parseFloat(order.total_price || '0'),
      currency: order.currency || 'EUR',
      date: new Date(order.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      rawOrder: order
    }));

    return NextResponse.json({
      orders: formattedOrders,
      total: ordersData.orders?.length || 0,
      page,
      limit
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des commandes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

