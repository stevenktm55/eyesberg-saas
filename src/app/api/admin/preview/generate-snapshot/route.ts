import { NextRequest, NextResponse } from 'next/server';

/**
 * API pour générer l'URL de preview d'un produit
 * POST /api/admin/preview/generate-snapshot
 * 
 * Retourne l'URL du configurateur avec productId et shop.
 * Le snapshot sera généré automatiquement par /api/product-builder
 * en utilisant exactement la même logique que lors de la connexion du produit.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, shop } = body;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Construire l'URL du configurateur avec productId et shop
    // Le ConfiguratorViewer chargera automatiquement depuis /api/product-builder
    // qui génère maintenant automatiquement le snapshot depuis builder_data
    // en utilisant exactement la même fonction que lors de la connexion
    
    // Utiliser le domaine de la requête actuelle pour construire l'URL absolue
    // Cela garantit que l'URL fonctionne correctement dans une iframe
    const origin = request.headers.get('origin') || 
                   request.headers.get('referer')?.split('/').slice(0, 3).join('/') ||
                   process.env.NEXT_PUBLIC_APP_URL || 
                   'https://eyesberg.app';
    
    const urlParams = new URLSearchParams();
    
    // Utiliser productId (peut être UUID Eyesberg ou ID Shopify)
    urlParams.append('productId', productId);
    
    if (shop) {
      urlParams.append('shop', shop);
    }
    
    // Ajouter preview=true pour masquer les boutons de sauvegarde/panier
    // IMPORTANT: Ce paramètre doit être présent pour que l'API ignore publishedSnapshot
    urlParams.append('preview', 'true');
    
    // Utiliser une URL absolue avec le domaine de la requête
    const configuratorUrl = `${origin}/configure?${urlParams.toString()}`;

    return NextResponse.json({
      success: true,
      configuratorUrl,
    });
  } catch (error) {
    console.error('Error generating preview URL:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate preview URL',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}





















