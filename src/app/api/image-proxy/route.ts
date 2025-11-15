import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * GET - Proxy pour servir les images Supabase Storage avec les bons en-têtes CORS
 * Permet d'afficher les images dans Shopify qui bloque les images cross-origin
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json({ error: 'URL manquante' }, { status: 400 });
    }

    // Vérifier que l'URL est bien une URL Supabase Storage
    if (!imageUrl.includes('supabase.co') && !imageUrl.includes('supabase')) {
      return NextResponse.json({ error: 'URL non autorisée' }, { status: 403 });
    }

    // Récupérer l'image depuis Supabase Storage
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'Accept': 'image/*',
      },
    });

    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: 'Image non trouvée' },
        { status: imageResponse.status }
      );
    }

    // Récupérer le type de contenu de l'image
    const contentType = imageResponse.headers.get('content-type') || 'image/png';
    const imageBuffer = await imageResponse.arrayBuffer();

    // Retourner l'image avec les bons en-têtes CORS
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('❌ Erreur proxy image:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS - Gérer les requêtes preflight CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}


