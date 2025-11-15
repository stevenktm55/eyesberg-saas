import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * API Route pour récupérer les informations du client Shopify connecté
 * Cette route vérifie si un client est connecté en vérifiant les paramètres d'URL
 * ou les cookies de session Shopify
 */
export async function GET(request: NextRequest) {
  try {
    // Méthode 1: Vérifier les paramètres d'URL (si redirigé depuis Shopify)
    const { searchParams } = new URL(request.url);
    const customerEmail = searchParams.get('customer_email');
    const customerFirstName = searchParams.get('customer_first_name');
    const customerLastName = searchParams.get('customer_last_name');
    const customerId = searchParams.get('customer_id');

    if (customerEmail) {
      return NextResponse.json({
        customer: {
          email: customerEmail,
          firstName: customerFirstName || undefined,
          lastName: customerLastName || undefined,
          id: customerId || undefined,
        },
      });
    }

    // Méthode 2: Vérifier les cookies Shopify
    // Note: Les cookies Shopify sont généralement httpOnly et accessibles uniquement côté serveur
    const cookies = request.cookies;
    const shopifyCustomerCookie = cookies.get('_shopify_customer');
    
    if (shopifyCustomerCookie) {
      // Le cookie contient généralement un token chiffré
      // Il faudrait le déchiffrer avec la clé secrète Shopify
      // Pour l'instant, on retourne juste que le client est connecté
      return NextResponse.json({
        customer: {
          email: '', // À compléter avec le vrai email une fois déchiffré
        },
      });
    }

    // Aucun client connecté
    return NextResponse.json({
      customer: null,
    }, { status: 200 });

  } catch (error) {
    console.error('Erreur lors de la vérification du client:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification du statut client' },
      { status: 500 }
    );
  }
}

