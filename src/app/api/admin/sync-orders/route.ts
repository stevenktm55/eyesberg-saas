import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Endpoint pour synchroniser manuellement les commandes Shopify
 * Met à jour les configurations avec status='ordered' mais sans shopify_order_id
 * en cherchant dans Shopify via les _configuration_id
 */
export async function POST(req: NextRequest) {
  try {
    const { orderNumber, configIds } = await req.json();
    
    if (!orderNumber) {
      return NextResponse.json(
        { error: 'orderNumber requis' },
        { status: 400 }
      );
    }

    console.log(`🔄 Synchronisation manuelle de la commande ${orderNumber}...`);

    // Si des configIds sont fournis, mettre à jour uniquement celles-ci
    let configsToUpdate = [];
    
    if (configIds && configIds.length > 0) {
      console.log(`🔍 Recherche de ${configIds.length} configuration(s) spécifique(s)...`);
      const { data: configs, error: errorConfigs } = await supabase
        .from('configurations')
        .select('id, order_number, status, shopify_order_id, created_at')
        .in('id', configIds);
      
      if (errorConfigs) {
        return NextResponse.json(
          { error: 'Erreur lors de la récupération des configurations', details: errorConfigs },
          { status: 500 }
        );
      }
      
      configsToUpdate = configs || [];
      console.log(`✅ ${configsToUpdate.length} configuration(s) trouvée(s) par ID`);
    } else {
      // Sinon, chercher toutes les configs avec status='ordered' et shopify_order_id null
      // qui pourraient appartenir à cette commande
      const { data: configs, error: errorConfigs } = await supabase
        .from('configurations')
        .select('id, order_number, status, shopify_order_id')
        .eq('status', 'ordered')
        .is('shopify_order_id', null)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (errorConfigs) {
        return NextResponse.json(
          { error: 'Erreur lors de la récupération des configurations', details: errorConfigs },
          { status: 500 }
        );
      }
      
      configsToUpdate = configs || [];
    }

    console.log(`📦 ${configsToUpdate.length} configuration(s) à mettre à jour`);

    // Mettre à jour toutes les configurations trouvées
    const updated = [];
    const errors = [];

    for (const config of configsToUpdate) {
      const { error: updateError } = await supabase
        .from('configurations')
        .update({
          shopify_order_id: orderNumber.toString(),
          shopify_order_name: `#${orderNumber}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', config.id);

      if (updateError) {
        errors.push({ config_id: config.id, error: updateError });
        console.error(`❌ Erreur mise à jour ${config.id}:`, updateError);
      } else {
        updated.push(config.id);
        console.log(`✅ Configuration ${config.id} mise à jour avec shopify_order_id = ${orderNumber}`);
      }
    }

    return NextResponse.json({
      success: true,
      orderNumber,
      updated: updated.length,
      errors: errors.length,
      updatedConfigs: updated,
      errorsList: errors
    });

  } catch (error) {
    console.error('❌ Erreur synchronisation:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

