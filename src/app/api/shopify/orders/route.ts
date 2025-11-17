import { NextRequest, NextResponse } from 'next/server';
import { getShopByDomain } from '@/lib/shopify-shops';

/**
 * GET /api/shopify/orders?shop=store.myshopify.com
 * Récupère les commandes Shopify pour une boutique
 */
export async function GET(request: NextRequest) {
  try {
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
        { error: 'Shop not found or not connected' },
        { status: 404 }
      );
    }

    // Récupérer les commandes depuis l'API Shopify
    const limit = parseInt(searchParams.get('limit') || '25');
    const page = parseInt(searchParams.get('page') || '1');
    const status = searchParams.get('status') || 'any';

    let ordersUrl = `https://${shop}/admin/api/2025-01/orders.json?limit=${limit}&page=${page}`;
    if (status !== 'any') {
      ordersUrl += `&status=${status}`;
    }

    const ordersResponse = await fetch(ordersUrl, {
      headers: {
        'X-Shopify-Access-Token': shopData.access_token,
      },
    });

    if (!ordersResponse.ok) {
      const errorText = await ordersResponse.text();
      console.error('❌ Erreur API Shopify:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch orders from Shopify' },
        { status: ordersResponse.status }
      );
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

