import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { sourceDesignId, targetDesignId } = await request.json();

    if (!sourceDesignId || !targetDesignId) {
      return NextResponse.json(
        { error: 'sourceDesignId et targetDesignId sont requis' },
        { status: 400 }
      );
    }

    if (sourceDesignId === targetDesignId) {
      return NextResponse.json(
        { error: 'La source et la destination doivent être différentes' },
        { status: 400 }
      );
    }

    // Récupérer toutes les zones du design source
    const { data: sourceZones, error: fetchError } = await supabase
      .from('text_zones')
      .select('*')
      .eq('design_id', sourceDesignId);

    if (fetchError) {
      console.error('❌ Erreur lors de la récupération des zones source:', fetchError);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des zones source' },
        { status: 500 }
      );
    }

    if (!sourceZones || sourceZones.length === 0) {
      return NextResponse.json(
        { error: 'Aucune zone trouvée dans le design source' },
        { status: 404 }
      );
    }

    // Préparer les nouvelles zones avec le nouveau design_id
    const newZones = sourceZones.map(zone => {
      const { id, created_at, updated_at, ...zoneData } = zone;
      return {
        ...zoneData,
        design_id: targetDesignId,
        name: zone.name
      };
    });

    // Insérer les nouvelles zones
    const { data: insertedZones, error: insertError } = await supabase
      .from('text_zones')
      .insert(newZones)
      .select();

    if (insertError) {
      console.error('❌ Erreur lors de l\'insertion des zones:', insertError);
      return NextResponse.json(
        { error: 'Erreur lors de la duplication des zones' },
        { status: 500 }
      );
    }

    console.log(`✅ ${insertedZones?.length || 0} zones dupliquées de ${sourceDesignId} vers ${targetDesignId}`);

    return NextResponse.json({
      success: true,
      count: insertedZones?.length || 0,
      sourceDesignId,
      targetDesignId
    });

  } catch (error) {
    console.error('❌ Erreur dans l\'API de duplication des zones:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}


