import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

/**
 * GET - Récupérer une configuration temporaire
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const configId = params.id;

    console.log('📥 Récupération config temporaire:', configId);

    const { data: config, error } = await supabase
      .from('configurations')
      .select('*')
      .eq('id', configId)
      .eq('status', 'draft')
      .single();

    if (error || !config) {
      console.error('❌ Config temporaire non trouvée:', error);
      const response = NextResponse.json(
        { error: 'Configuration non trouvée' },
        { status: 404 }
      );
      
      // Ajouter les headers CORS
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
      
      return response;
    }

    console.log('✅ Config temporaire trouvée');

    const response = NextResponse.json(config);
    
    // Ajouter les headers CORS
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return response;

  } catch (error) {
    console.error('❌ Erreur serveur:', error);
    const response = NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
    
    // Ajouter les headers CORS
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return response;
  }
}

/**
 * PATCH - Finaliser une configuration temporaire (ajouter l'email et changer le status)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const configId = params.id;
    const { customerEmail } = await request.json();

    if (!customerEmail) {
      const response = NextResponse.json(
        { error: 'Email requis' },
        { status: 400 }
      );
      
      // Ajouter les headers CORS
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
      
      return response;
    }

    console.log('🔄 Finalisation config temporaire:', configId, 'pour', customerEmail);

    // Vérifier la limite de 10 configurations
    const { count } = await supabase
      .from('configurations')
      .select('id', { count: 'exact' })
      .eq('customer_email', customerEmail)
      .eq('status', 'saved');
    
    if (count && count >= 10) {
      const response = NextResponse.json(
        { error: `Limite de 10 configurations atteinte (${count}/10)` },
        { status: 400 }
      );
      
      // Ajouter headers CORS
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
      
      return response;
    }

    // Obtenir le prochain numéro de commande disponible (si pas déjà défini)
    const { data: existingConfig } = await supabase
      .from('configurations')
      .select('order_number')
      .eq('id', configId)
      .single();
    
    let orderNumber = existingConfig?.order_number;
    
    // Si pas d'order_number, en générer un
    if (!orderNumber) {
      const { data: lastConfig, error: selectError } = await supabase
        .from('configurations')
        .select('order_number')
        .not('order_number', 'is', null)
        .order('order_number', { ascending: false })
        .limit(1);

      orderNumber = selectError || !lastConfig?.[0]?.order_number 
        ? 1 
        : lastConfig[0].order_number + 1;
      
      console.log(`🔢 Attribution numéro de commande: #${String(orderNumber).padStart(5, '0')}`);
    }

    // Mettre à jour la configuration avec order_number et status 'saved'
    const { data: config, error: updateError } = await supabase
      .from('configurations')
      .update({
        customer_email: customerEmail,
        status: 'saved',
        order_number: orderNumber
      })
      .eq('id', configId)
      .eq('status', 'draft')
      .select()
      .single();

    if (updateError || !config) {
      console.error('❌ Erreur finalisation:', updateError);
      const response = NextResponse.json(
        { error: 'Erreur lors de la finalisation' },
        { status: 500 }
      );
      
      // Ajouter headers CORS
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
      
      return response;
    }

    console.log('✅ Configuration finalisée avec succès');

    const response = NextResponse.json({ 
      success: true,
      config
    });
    
    // Ajouter headers CORS
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return response;

  } catch (error) {
    console.error('❌ Erreur serveur:', error);
    const response = NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
    
    // Ajouter headers CORS
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
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
  response.headers.set('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  
  return response;
}

