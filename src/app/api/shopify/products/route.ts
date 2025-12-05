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

    let response;
    try {
      response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; StretchMX-Configurator/1.0)',
        },
        // Ajouter un timeout
        signal: AbortSignal.timeout(10000), // 10 secondes
      });
    } catch (fetchError) {
      console.error('❌ Fetch error:', fetchError);
      
      if (fetchError instanceof Error) {
        if (fetchError.name === 'AbortError' || fetchError.message.includes('timeout')) {
          return NextResponse.json(
            { 
              error: 'Request timeout. The shop may be unreachable or the domain is incorrect.',
              hint: 'Please verify the shop domain (e.g., your-shop.myshopify.com)'
            },
            { status: 408 }
          );
        }
        
        if (fetchError.message.includes('CORS') || fetchError.message.includes('Failed to fetch')) {
          return NextResponse.json(
            { 
              error: 'CORS error. The shop may not allow cross-origin requests.',
              hint: 'Try accessing the shop directly: https://' + shopUrl + '/products.json'
            },
            { status: 403 }
          );
        }
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to connect to Shopify',
          message: fetchError instanceof Error ? fetchError.message : 'Unknown error',
          hint: 'Please verify the shop domain is correct and accessible'
        },
        { status: 500 }
      );
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      console.error('❌ Shopify API error:', response.status, errorText);
      
      // Si l'API publique ne fonctionne pas, retourner un message d'erreur explicite
      if (response.status === 404) {
        return NextResponse.json(
          { 
            error: 'Shop not found. Please verify the shop domain.',
            hint: 'Make sure the shop domain is correct (e.g., your-shop.myshopify.com)',
            attemptedUrl: url
          },
          { status: 404 }
        );
      }

      if (response.status === 403 || response.status === 401) {
        return NextResponse.json(
          { 
            error: 'Access denied. The shop may require authentication or have restricted access.',
            hint: 'The public JSON API may not be available for this shop. Please check your shop settings.',
            attemptedUrl: url
          },
          { status: response.status }
        );
      }

      return NextResponse.json(
        { 
          error: `Failed to fetch products: ${response.statusText}`,
          status: response.status,
          attemptedUrl: url,
          hint: 'Please verify the shop domain and try again'
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
