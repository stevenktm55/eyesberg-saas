import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { getShopByDomain } from '@/lib/shopify-shops';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/shopify/uninstall?shop=store.myshopify.com
 * Force la désinstallation d'une boutique Shopify (supprime access_token et scopes)
 */
export async function POST(request: NextRequest) {
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

    // Récupérer les infos de la boutique
    const shopData = await getShopByDomain(shop);
    if (!shopData) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    // Vérifier que la boutique appartient au compte de l'utilisateur
    const userSubdomain = (session.accounts as any).subdomain;
    if (shopData.subdomain && shopData.subdomain !== userSubdomain) {
      return NextResponse.json(
        { error: 'Forbidden: Shop does not belong to your account' },
        { status: 403 }
      );
    }

    // Supprimer l'access_token et les scopes (désinstallation)
    const { error: updateError } = await supabaseAdmin
      .from('shops')
      .update({
        access_token: null,
        scopes: null,
        updated_at: new Date().toISOString(),
      })
      .eq('shop_domain', shop);

    if (updateError) {
      console.error('❌ Erreur lors de la désinstallation:', updateError);
      return NextResponse.json(
        { error: 'Failed to uninstall shop' },
        { status: 500 }
      );
    }

    console.log('✅ Boutique désinstallée:', shop);

    return NextResponse.json({
      success: true,
      message: 'Shop uninstalled successfully',
      shop_domain: shop,
    });
  } catch (error) {
    console.error('❌ Erreur lors de la désinstallation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

