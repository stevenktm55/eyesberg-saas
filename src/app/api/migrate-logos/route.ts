import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Début de la migration des logos...');
    
    // Récupérer toutes les configurations (limiter à 100 pour éviter timeout)
    const { data: configs, error: fetchError } = await supabaseAdmin
      .from('configurations')
      .select('id, config_data')
      .limit(100);
    
    if (fetchError) {
      console.error('❌ Erreur fetch configurations:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }
    
    if (!configs || configs.length === 0) {
      return NextResponse.json({ message: 'Aucune configuration à migrer' });
    }
    
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const config of configs) {
      if (!config.config_data?.logos || !Array.isArray(config.config_data.logos)) {
        continue;
      }
      
      const logos = config.config_data.logos;
      let hasDataUrls = false;
      const migratedLogos = [];
      
      for (const logo of logos) {
        if (logo.variantFile && logo.variantFile.startsWith('data:')) {
          hasDataUrls = true;
          
          try {
            // Extraire le MIME type et les données
            const mimeTypeMatch = logo.variantFile.match(/^data:([^;]+)/);
            const base64Data = logo.variantFile.split(',')[1];
            
            if (!mimeTypeMatch || !base64Data) {
              console.warn('⚠️ Data URL mal formatée pour', logo.id);
              migratedLogos.push(logo);
              continue;
            }
            
            const mimeType = mimeTypeMatch[1];
            const extension = mimeType.includes('svg') ? 'svg' : mimeType.includes('png') ? 'png' : 'jpg';
            const buffer = Buffer.from(base64Data, 'base64');
            
            // Uploader vers Supabase
            const filename = `migrated-${config.id}-${logo.id}.${extension}`;
            
            const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
              .from('logos')
              .upload(filename, buffer, {
                contentType: mimeType,
                upsert: true
              });
            
            if (uploadError) {
              console.error('❌ Erreur upload logo:', uploadError);
              errorCount++;
              migratedLogos.push(logo); // Garder l'ancien si upload échoue
              continue;
            }
            
            // Obtenir l'URL publique
            const { data: urlData } = supabaseAdmin.storage
              .from('logos')
              .getPublicUrl(filename);
            
            // Remplacer la data URL par l'URL Supabase
            migratedLogos.push({
              ...logo,
              variantFile: urlData.publicUrl
            });
            
            console.log('✅ Logo migré:', logo.id);
          } catch (err) {
            console.error('❌ Erreur migration logo:', err);
            errorCount++;
            migratedLogos.push(logo); // Garder l'ancien si erreur
          }
        } else {
          migratedLogos.push(logo); // Garder les logos déjà avec URL
        }
      }
      
      // Si au moins un logo a été migré, mettre à jour la configuration
      if (hasDataUrls) {
        const updatedConfigData = {
          ...config.config_data,
          logos: migratedLogos
        };
        
        const { error: updateError } = await supabaseAdmin
          .from('configurations')
          .update({ config_data: updatedConfigData })
          .eq('id', config.id);
        
        if (updateError) {
          console.error('❌ Erreur mise à jour config:', updateError);
          errorCount++;
        } else {
          migratedCount++;
        }
      }
    }
    
    console.log(`✅ Migration terminée: ${migratedCount} configurations migrées, ${errorCount} erreurs`);
    
    return NextResponse.json({ 
      success: true,
      migrated: migratedCount,
      errors: errorCount
    });
  } catch (err) {
    console.error('❌ Erreur migration:', err);
    return NextResponse.json({ 
      error: 'Migration failed',
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}

