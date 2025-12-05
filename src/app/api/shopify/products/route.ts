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
        // Ne pas suivre les redirections automatiquement pour détecter les pages de mot de passe
        redirect: 'manual',
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

    // Vérifier si la boutique est protégée par un mot de passe (redirection 302 vers /password)
    if (response.status === 302 || response.status === 301) {
      const location = response.headers.get('location') || '';
      if (location.includes('/password')) {
        return NextResponse.json(
          { 
            error: 'La boutique Shopify est protégée par un mot de passe',
            hint: 'Pour utiliser l\'API publique JSON, vous devez désactiver la protection par mot de passe dans les paramètres de votre boutique Shopify (Settings > Password protection)',
            attemptedUrl: url,
            solution: 'Allez dans Shopify Admin > Settings > Password protection et désactivez la protection par mot de passe'
          },
          { status: 403 }
        );
      }
    }

    // Si la réponse n'est pas OK, suivre la redirection manuellement
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location) {
        console.log('🔄 Following redirect to:', location);
        try {
          response = await fetch(location, {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (compatible; StretchMX-Configurator/1.0)',
            },
            signal: AbortSignal.timeout(10000),
          });
        } catch (redirectError) {
          console.error('❌ Redirect fetch error:', redirectError);
          return NextResponse.json(
            { 
              error: 'Failed to follow redirect',
              message: redirectError instanceof Error ? redirectError.message : 'Unknown error',
              hint: 'Please verify the shop domain is correct and accessible'
            },
            { status: 500 }
          );
        }
      }
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      console.error('❌ Shopify API error:', response.status, errorText);
      
      // Vérifier si c'est une page de mot de passe
      if (response.status === 200 && errorText.includes('password') || response.url?.includes('/password')) {
        return NextResponse.json(
          { 
            error: 'La boutique Shopify est protégée par un mot de passe',
            hint: 'Pour utiliser l\'API publique JSON, vous devez désactiver la protection par mot de passe dans les paramètres de votre boutique Shopify (Settings > Password protection)',
            attemptedUrl: url,
            solution: 'Allez dans Shopify Admin > Settings > Password protection et désactivez la protection par mot de passe'
          },
          { status: 403 }
        );
      }
      
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
