import { NextRequest, NextResponse } from 'next/server';

const SHOP_DOMAIN =
  process.env.SHOPIFY_SHOP_DOMAIN ||
  process.env.NEXT_PUBLIC_SHOPIFY_SHOP_DOMAIN ||
  process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN;

const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;
const API_VERSION = process.env.SHOPIFY_ADMIN_API_VERSION || '2024-10';

const toGid = (productId: string) =>
  productId.startsWith('gid://shopify/Product/')
    ? productId
    : `gid://shopify/Product/${productId}`;

const extractLegacyId = (gid: string | null | undefined) => {
  if (!gid) return null;
  const match = gid.match(/\/(\d+)(?:\?.*)?$/);
  return match ? match[1] : null;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('productId');

  if (!productId) {
    return NextResponse.json({ error: 'productId manquant' }, { status: 400 });
  }

  if (!SHOP_DOMAIN || !ADMIN_TOKEN) {
    console.error('❌ Shopify Admin API non configurée');
    return NextResponse.json({ error: 'Shopify non configuré' }, { status: 500 });
  }

  const gid = toGid(productId);

  const query = `
    query ResolveDefaultVariant($id: ID!) {
      product(id: $id) {
        variants(first: 1) {
          edges {
            node {
              id
              legacyResourceId
              sku
              title
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(
      `https://${SHOP_DOMAIN}/admin/api/${API_VERSION}/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': ADMIN_TOKEN,
        },
        body: JSON.stringify({
          query,
          variables: { id: gid },
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error('❌ Erreur Shopify Admin API:', response.status, text);
      return NextResponse.json(
        { error: 'Erreur Shopify', details: text },
        { status: response.status }
      );
    }

    const result = await response.json();

    const variantNode =
      result?.data?.product?.variants?.edges?.[0]?.node ?? null;

    if (!variantNode) {
      return NextResponse.json(
        { variantId: null, message: 'Aucune variante trouvée' },
        { status: 404 }
      );
    }

    const variantId =
      variantNode.legacyResourceId || extractLegacyId(variantNode.id);

    return NextResponse.json({
      variantId: variantId ? String(variantId) : null,
      rawId: variantNode.id ?? null,
      sku: variantNode.sku ?? null,
      title: variantNode.title ?? null,
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de la variante Shopify:', error);
    return NextResponse.json(
      { error: 'Erreur interne', details: String(error) },
      { status: 500 }
    );
  }
}

