import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

/**
 * GET - Récupérer toutes les configurations d'un client
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerEmail = searchParams.get('email') || searchParams.get('customer_email');

    if (!customerEmail) {
      const response = NextResponse.json(
        { error: 'Email client requis' },
        { status: 400 }
      );
      
      // Ajouter les headers CORS
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
      
      return response;
    }

    console.log('📥 Chargement configurations pour:', customerEmail);

    const { data: configurations, error } = await supabase
      .from('configurations')
      .select('*')
      .eq('customer_email', customerEmail)
      .eq('status', 'saved')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur Supabase:', error);
      const response = NextResponse.json(
        { error: 'Erreur lors du chargement' },
        { status: 500 }
      );
      
      // Ajouter les headers CORS
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
      
      return response;
    }

    console.log(`✅ ${configurations.length} configuration(s) trouvée(s)`);
    console.log('📋 IDs des configs:', configurations.map(c => c.id));

    const response = NextResponse.json({
      configurations,
      count: configurations.length,
    });
    
    // Ajouter les headers CORS
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
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
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return response;
  }
}

/**
 * POST - Créer une nouvelle configuration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerEmail, modelUrl, designId, designUrl, colors, texts, logos, variantId, productId: bodyProductId } = body;

    if (!customerEmail) {
      const response = NextResponse.json(
        { error: 'Email client requis' },
        { status: 400 }
      );
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
      return response;
    }

    console.log('💾 Création configuration pour:', customerEmail);

    // Vérifier la limite
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
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
      return response;
    }

    // Créer la config avec order_number séquentiel
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
    
    console.log(`🔢 Attribution numéro de commande: #${String(nextOrderNumber).padStart(5, '0')}`);

    // Note: variantId et productId sont déjà dans body (config_data), pas besoin de les dupliquer au niveau racine
    // Le schéma Supabase n'a pas de colonnes productId/variantId au niveau racine
    
    const { data: config, error } = await supabase
      .from('configurations')
      .insert({
        order_number: nextOrderNumber,
        config_data: body,
        customer_email: customerEmail,
        status: 'saved'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur insertion config:', error);
      console.error('❌ Code erreur Supabase:', error.code);
      console.error('❌ Message erreur:', error.message);
      console.error('❌ Détails erreur:', JSON.stringify(error, null, 2));
      
      // Log des données qui ont été envoyées (sans les données volumineuses)
      console.error('❌ Données envoyées:', {
        hasCustomerEmail: !!customerEmail,
        hasModelUrl: !!body.modelUrl,
        hasDesignId: !!body.designId,
        textsCount: body.texts?.length || 0,
        logosCount: body.logos?.length || 0,
        hasVariantId: !!variantId,
        hasProductId: !!bodyProductId,
        order_number: nextOrderNumber
      });
      
      const response = NextResponse.json(
        { 
          error: 'Erreur lors de la sauvegarde',
          details: error.message,
          code: error.code
        },
        { status: 500 }
      );
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
      return response;
    }

    console.log('✅ Configuration créée:', config.id);

    const response = NextResponse.json({ id: config.id });
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

    return response;

  } catch (error) {
    console.error('❌ Erreur serveur:', error);
    const response = NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
    
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  
  return response;
}

