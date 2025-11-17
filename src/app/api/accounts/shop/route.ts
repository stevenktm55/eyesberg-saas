import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * API pour récupérer la boutique associée à un sous-domaine
 * GET /api/accounts/shop?subdomain=stretchmx
 * 
 * IMPORTANT: Vérifie que l'utilisateur connecté a le droit d'accéder à ce subdomain
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subdomain = searchParams.get('subdomain');

    if (!subdomain) {
      return NextResponse.json(
        { error: 'Missing subdomain parameter' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur est connecté et que son subdomain correspond
    const sessionToken = request.cookies.get('eyesberg_session')?.value;
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized - No session found' },
        { status: 401 }
      );
    }

    // Vérifier la session et récupérer le subdomain de l'utilisateur connecté
    const nowIso = new Date().toISOString();
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('account_id, expires_at, accounts(subdomain)')
      .eq('session_token', sessionToken)
      .gt('expires_at', nowIso)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid session' },
        { status: 401 }
      );
    }

    // Récupérer le subdomain de l'utilisateur connecté
    let userSubdomain: string | null = null;
    if (session.accounts && typeof session.accounts === 'object' && 'subdomain' in session.accounts) {
      userSubdomain = (session.accounts as any).subdomain;
    } else {
      const { data: account } = await supabase
        .from('accounts')
        .select('subdomain')
        .eq('id', session.account_id)
        .single();
      if (account) {
        userSubdomain = account.subdomain;
      }
    }

    // Vérifier que le subdomain demandé correspond au subdomain de l'utilisateur connecté
    if (!userSubdomain || userSubdomain !== subdomain.toLowerCase()) {
      console.error('❌ API shop: Subdomain mismatch', {
        userSubdomain,
        requestedSubdomain: subdomain,
        accountId: session.account_id,
      });
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this subdomain' },
        { status: 403 }
      );
    }

    // Récupérer le compte par sous-domaine
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id')
      .eq('subdomain', subdomain.toLowerCase())
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { error: 'Account not found for this subdomain' },
        { status: 404 }
      );
    }

    // Récupérer la première boutique associée à ce compte
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('*')
      .eq('account_id', account.id)
      .order('installed_at', { ascending: false })
      .limit(1)
      .single();

    if (shopError || !shop) {
      return NextResponse.json(
        {
          error: 'No Shopify shop linked to this account',
          account: {
            id: account.id,
            subdomain: subdomain,
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      shop: {
        id: shop.id,
        shop_domain: shop.shop_domain,
        shop_name: shop.shop_name,
        shop_email: shop.shop_email,
        installed_at: shop.installed_at,
        scopes: shop.scopes,
        access_token: shop.access_token, // Inclure access_token pour vérifier si installée
      },
      account: {
        id: account.id,
        subdomain: subdomain,
      },
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de la boutique:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

