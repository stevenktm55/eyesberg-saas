import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Endpoint pour désynchroniser une commande Shopify
 * Remet shopify_order_id et shopify_order_name à null pour permettre de resynchroniser avec les bons IDs
 */
export async function POST(req: NextRequest) {
  try {
    const { orderNumber, configIds } = await req.json();
    
    if (!orderNumber && !configIds) {
      return NextResponse.json(
        { error: 'orderNumber ou configIds requis' },
        { status: 400 }
      );
    }

    console.log(`🗑️ Désynchronisation de la commande ${orderNumber || 'configurations spécifiques'}...`);

    let configsToUpdate = [];
    
    if (configIds && configIds.length > 0) {
      // Si des configIds sont fournis, mettre à jour uniquement celles-ci
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
    } else if (orderNumber) {
      // Sinon, chercher toutes les configs avec ce shopify_order_id
      const { data: configs, error: errorConfigs } = await supabase
        .from('configurations')
        .select('id, order_number, status, shopify_order_id')
        .eq('shopify_order_id', orderNumber.toString());
      
      if (errorConfigs) {
        return NextResponse.json(
          { error: 'Erreur lors de la récupération des configurations', details: errorConfigs },
          { status: 500 }
        );
      }
      
      configsToUpdate = configs || [];
      console.log(`✅ ${configsToUpdate.length} configuration(s) trouvée(s) avec shopify_order_id = ${orderNumber}`);
    }

    if (configsToUpdate.length === 0) {
      return NextResponse.json(
        { error: 'Aucune configuration trouvée à désynchroniser' },
        { status: 404 }
      );
    }

    console.log(`📦 ${configsToUpdate.length} configuration(s) à désynchroniser`);

    // Mettre à jour toutes les configurations trouvées (remettre shopify_order_id à null)
    const updated = [];
    const errors = [];

    for (const config of configsToUpdate) {
      const { error: updateError } = await supabase
        .from('configurations')
        .update({
          shopify_order_id: null,
          shopify_order_name: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', config.id);

      if (updateError) {
        errors.push({ config_id: config.id, error: updateError });
        console.error(`❌ Erreur désynchronisation ${config.id}:`, updateError);
      } else {
        updated.push(config.id);
        console.log(`✅ Configuration ${config.id} désynchronisée (shopify_order_id remis à null)`);
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
    console.error('❌ Erreur désynchronisation:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}







