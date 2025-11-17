import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * API pour récupérer la boutique associée à un sous-domaine
 * GET /api/accounts/shop?subdomain=stretchmx
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

