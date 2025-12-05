import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const shop = searchParams.get('shop');

    if (!shop) {
      return NextResponse.json(
        { error: 'Shop domain is required' },
        { status: 400 }
      );
    }

    // Normaliser le shop domain (enlever .myshopify.com si présent)
    const shopDomain = shop.replace('.myshopify.com', '').trim();
    const shopUrl = shopDomain.includes('.') ? shopDomain : `${shopDomain}.myshopify.com`;

    // Récupérer les produits via l'API publique JSON de Shopify
    // Cette API ne nécessite pas de token mais est limitée
    const url = `https://${shopUrl}/products.json?limit=250`;

    console.log('🔍 Fetching Shopify products from:', url);

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ Shopify API error:', response.status, response.statusText);
      
      // Si l'API publique ne fonctionne pas, retourner un message d'erreur explicite
      if (response.status === 404) {
        return NextResponse.json(
          { 
            error: 'Shop not found. Please verify the shop domain.',
            hint: 'Make sure the shop domain is correct (e.g., your-shop.myshopify.com)'
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { 
          error: `Failed to fetch products: ${response.statusText}`,
          status: response.status
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const products = data.products || [];

    // Transformer les produits pour l'interface
    const formattedProducts = products.map((product: any) => ({
      id: product.id.toString(),
      title: product.title,
      handle: product.handle,
      vendor: product.vendor || '',
      productType: product.product_type || '',
      variants: product.variants?.map((variant: any) => ({
        id: variant.id.toString(),
        title: variant.title,
        price: variant.price,
        sku: variant.sku || '',
        inventoryQuantity: variant.inventory_quantity || null,
      })) || [],
      images: product.images?.map((img: any) => ({
        src: img.src,
        alt: img.alt || product.title,
      })) || [],
      createdAt: product.created_at,
      updatedAt: product.updated_at,
    }));

    console.log(`✅ Found ${formattedProducts.length} products`);

    return NextResponse.json({
      products: formattedProducts,
      count: formattedProducts.length,
    });

  } catch (error) {
    console.error('❌ Error fetching Shopify products:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch products',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
