import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

/**
 * POST - Préparer une nouvelle configuration (créer avec order_number sans config_data)
 * Cette route est appelée dès l'ouverture d'un produit pour réserver un numéro de configuration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, variantId, customerEmail } = body;

    if (!productId || !variantId) {
      const response = NextResponse.json(
        { error: 'productId et variantId requis' },
        { status: 400 }
      );
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
      return response;
    }

    console.log('🔢 Préparation nouvelle configuration pour:', { productId, variantId, customerEmail: customerEmail?.substring(0, 20) });

    // Obtenir le prochain numéro de commande disponible
    const { data: lastConfig, error: selectError } = await supabase
      .from('configurations')
      .select('order_number')
      .not('order_number', 'is', null)
      .order('order_number', { ascending: false })
      .limit(1);

    const nextOrderNumber = selectError || !lastConfig?.[0]?.order_number 
      ? 1 
      : lastConfig[0].order_number + 1;
    
    const configNumber = String(nextOrderNumber).padStart(5, '0');
    console.log(`🔢 Attribution numéro de configuration: #${configNumber}`);

    // Créer une configuration draft avec order_number mais sans config_data complet
    // Le config_data sera rempli lors de la première sauvegarde
    // Note: variantId et productId sont dans config_data, pas au niveau racine
    const { data: config, error: insertError } = await supabase
      .from('configurations')
      .insert({
        order_number: nextOrderNumber,
        config_data: {
          productId,
          variantId,
          // config_data minimal - sera complété lors de la sauvegarde
        },
        customer_email: customerEmail || null,
        status: 'draft' // Status draft jusqu'à la première sauvegarde
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erreur création config préparatoire:', insertError);
      console.error('❌ Code erreur:', insertError.code);
      console.error('❌ Message:', insertError.message);
      
      const response = NextResponse.json(
        { 
          error: 'Erreur lors de la préparation de la configuration',
          details: insertError.message,
          code: insertError.code
        },
        { status: 500 }
      );
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
      return response;
    }

    console.log('✅ Configuration préparée:', config.id, 'order_number:', config.order_number);

    const response = NextResponse.json({
      configId: config.id,
      configNumber: configNumber,
      orderNumber: nextOrderNumber
    });
    
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return response;

  } catch (error) {
    console.error('❌ Erreur serveur:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur serveur inconnue';
    
    const response = NextResponse.json(
      { 
        error: 'Erreur serveur',
        details: errorMessage
      },
      { status: 500 }
    );
    
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return response;
  }
}

/**
 * OPTIONS - Gérer les requêtes preflight CORS
 */
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  
  return response;
}
