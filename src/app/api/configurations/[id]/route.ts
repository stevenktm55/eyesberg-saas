import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

/**
 * GET - Récupérer une configuration par ID (UUID) ou par order_number formaté (00000, 00001, etc.)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const configId = params.id; // Capturer avant le try pour l'utiliser dans le catch
  
  try {
    console.log('📥 Chargement configuration:', configId);

    // Vérifier si c'est un numéro formaté (ex: "00000", "00001") ou un UUID
    // Un numéro formaté est une chaîne de 5 chiffres (peut commencer par 0)
    const isFormattedNumber = /^\d{5}$/.test(configId);
    
    let query = supabase
      .from('configurations')
      .select('*');
    
    if (isFormattedNumber) {
      // Si c'est un numéro formaté, chercher par order_number
      // parseInt gère correctement "00000" -> 0, "00001" -> 1, etc.
      const orderNumber = parseInt(configId, 10);
      console.log('🔍 Recherche par order_number:', orderNumber, '(depuis configId:', configId, ')');
      
      // Vérifier que orderNumber est valide (>= 0)
      if (isNaN(orderNumber) || orderNumber < 0) {
        console.error('❌ order_number invalide:', orderNumber);
        const response = NextResponse.json(
          { error: 'Numéro de configuration invalide', details: `order_number: ${orderNumber}` },
          { status: 400 }
        );
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
        return response;
      }
      
      query = query.eq('order_number', orderNumber);
    } else {
      // Sinon, chercher par UUID (id)
      query = query.eq('id', configId);
    }

    const { data: config, error } = await query.single();

    if (error) {
      console.error('❌ Erreur Supabase:', error);
      console.error('❌ Code erreur:', error.code);
      console.error('❌ Message:', error.message);
      
      // Si c'était une recherche par order_number et qu'on n'a rien trouvé, 
      // donner plus de détails dans le message d'erreur
      if (isFormattedNumber) {
        console.error(`❌ Aucune configuration trouvée avec order_number=${orderNumber} (configId: ${configId})`);
      }
      
      const response = NextResponse.json(
        { 
          error: 'Configuration non trouvée', 
          details: error,
          configId,
          searchType: isFormattedNumber ? 'order_number' : 'id',
          searchValue: isFormattedNumber ? orderNumber : configId
        },
        { status: 404 }
      );
      
      // Ajouter les headers CORS
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
      
      return response;
    }

    if (!config) {
      console.error(`❌ Configuration non trouvée - query retourné null`);
      if (isFormattedNumber) {
        console.error(`   Recherche par order_number=${orderNumber} (configId: ${configId})`);
      }
      
      const response = NextResponse.json(
        { 
          error: 'Configuration non trouvée',
          configId,
          searchType: isFormattedNumber ? 'order_number' : 'id',
          searchValue: isFormattedNumber ? orderNumber : configId
        },
        { status: 404 }
      );
      
      // Ajouter les headers CORS
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
      
      return response;
    }
    
    console.log('✅ Configuration trouvée:', {
      id: config.id,
      order_number: config.order_number,
      status: config.status,
      customer_email: config.customer_email?.substring(0, 20) + '...'
    });

    const response = NextResponse.json(config);
    
    // Ajouter les headers CORS
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return response;

  } catch (error) {
    console.error('❌ Erreur serveur dans GET /api/configurations/[id]:', error);
    console.error('❌ Type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('❌ Message:', error instanceof Error ? error.message : String(error));
    console.error('❌ Stack:', error instanceof Error ? error.stack : 'N/A');
    console.error('❌ ConfigId reçu:', configId);
    
    const errorMessage = error instanceof Error ? error.message : 'Erreur serveur inconnue';
    const errorDetails = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    } : String(error);
    
    const response = NextResponse.json(
      { 
        error: 'Erreur serveur',
        details: errorMessage,
        configId: configId,
        fullError: errorDetails
      },
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
 * DELETE - Supprimer une configuration
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const configId = params.id;
    
    // Récupérer l'email depuis les paramètres URL
    const { searchParams } = new URL(request.url);
    const customer_email = searchParams.get('email');

    if (!customer_email) {
      const response = NextResponse.json(
        { error: 'Email client requis' },
        { status: 400 }
      );
      
      // Ajouter les headers CORS
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
      
      return response;
    }

    console.log('🗑️ Suppression configuration:', configId, 'pour', customer_email);

    // D'abord vérifier si la config existe
    const { data: existingConfig, error: selectError } = await supabase
      .from('configurations')
      .select('*')
      .eq('id', configId)
      .single();
    
    if (selectError || !existingConfig) {
      console.error('❌ Configuration non trouvée:', selectError);
      const response = NextResponse.json(
        { error: 'Configuration non trouvée', details: selectError },
        { status: 404 }
      );
      
      // Ajouter les headers CORS
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
      
      return response;
    }
    
    console.log('📋 Config trouvée:', existingConfig);
    console.log('🔍 Vérification email:', {
      configEmail: existingConfig.customer_email,
      requestEmail: customer_email,
      match: existingConfig.customer_email === customer_email
    });

    // Supprimer uniquement si l'email correspond
    if (existingConfig.customer_email !== customer_email) {
      console.error('❌ Email ne correspond pas');
      const response = NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
      
      // Ajouter les headers CORS
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
      
      return response;
    }
    
    // Supprimer la configuration
    const { error } = await supabase
      .from('configurations')
      .delete()
      .eq('id', configId);

    if (error) {
      console.error('❌ Erreur Supabase DELETE:', error);
      const response = NextResponse.json(
        { error: 'Erreur lors de la suppression', details: error },
        { status: 500 }
      );
      
      // Ajouter les headers CORS
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
      
      return response;
    }

    console.log('✅ Configuration supprimée avec succès');

    const response = NextResponse.json({
      success: true,
      message: 'Configuration supprimée',
    });
    
    // Ajouter les headers CORS
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
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
    response.headers.set('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
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
  response.headers.set('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  
  return response;
}

