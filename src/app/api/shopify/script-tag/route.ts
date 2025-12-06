import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { getShopByDomain } from '@/lib/shopify-shops';
import { createScriptTag } from '@/lib/shopify-script-tags';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/shopify/script-tag?shop=store.myshopify.com
 * Crée manuellement le script tag pour une boutique Shopify
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

    if (!shopData.access_token) {
      return NextResponse.json(
        { error: 'Shop is not installed (no access token)' },
        { status: 400 }
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

    // Créer le script tag
    console.log('📜 Création manuelle du script tag pour:', shop);
    const result = await createScriptTag(shop, shopData.access_token);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Script tag created successfully',
        scriptTag: result.scriptTag,
      });
    } else {
      return NextResponse.json(
        { 
          error: 'Failed to create script tag',
          details: result.error 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Erreur lors de la création du script tag:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/shopify/script-tag?shop=store.myshopify.com
 * Vérifie si le script tag existe
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

    // Récupérer les infos de la boutique
    const shopData = await getShopByDomain(shop);
    if (!shopData || !shopData.access_token) {
      return NextResponse.json({
        exists: false,
        message: 'Shop not found or not installed',
      });
    }

    // Vérifier si le script tag existe
    const { checkScriptTagExists } = await import('@/lib/shopify-script-tags');
    const exists = await checkScriptTagExists(shop, shopData.access_token);

    return NextResponse.json({
      exists,
      shop,
    });
  } catch (error) {
    console.error('❌ Erreur lors de la vérification du script tag:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

