import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";

export const runtime = "nodejs";

/**
 * POST - Sauvegarder temporairement une configuration (avant connexion)
 */
export async function POST(request: Request) {
  try {
    const configData = await request.json();
    
    console.log('💾 Sauvegarde temporaire de configuration');
    
    // Générer un token de partage unique
    const shareToken = crypto.randomUUID();
    const configId = crypto.randomUUID();
    
    // Uploader l'aperçu dans Supabase Storage si présent
    let previewImageUrl = null;
    if (configData.previewUrl && configData.previewUrl.startsWith('data:image')) {
      try {
        console.log('📤 Upload de l\'aperçu dans Storage...');
        
        // Convertir data URL en Blob
        const response = await fetch(configData.previewUrl);
        const blob = await response.blob();
        
        // Upload dans Supabase Storage
        const filename = `preview-${configId}-${Date.now()}.png`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('configurations')
          .upload(filename, blob, {
            contentType: 'image/png',
            cacheControl: '3600',
            upsert: false
          });
        
        if (uploadError) {
          console.error('⚠️ Erreur upload aperçu:', uploadError);
        } else {
          // Obtenir l'URL publique
          const { data: { publicUrl } } = supabase.storage
            .from('configurations')
            .getPublicUrl(uploadData.path);
          
          previewImageUrl = publicUrl;
          console.log('✅ Aperçu uploadé:', previewImageUrl);
        }
      } catch (error) {
        console.error('⚠️ Erreur conversion/upload aperçu:', error);
      }
    }
    
    // Sauvegarder avec status 'draft' (temporaire avant connexion)
    const { data: config, error: insertError } = await supabase
      .from('configurations')
      .insert({
        id: configId,
        config_data: configData,
        customer_email: null, // Pas encore d'email
        preview_image_url: previewImageUrl,
        status: 'draft', // Status temporaire (sera changé en 'saved' après connexion)
        share_token: shareToken // Token obligatoire
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Erreur insertion temporaire:', insertError);
      console.error('❌ Détails erreur:', JSON.stringify(insertError, null, 2));
      const response = NextResponse.json(
        { 
          error: 'Erreur lors de la sauvegarde temporaire',
          details: insertError.message,
          code: insertError.code
        },
        { status: 500 }
      );
      
      // Ajouter headers CORS
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
      
      return response;
    }
    
    console.log('✅ Configuration temporaire sauvegardée:', config.id);
    
    const response = NextResponse.json({ 
      id: config.id,
      success: true
    }, { status: 201 });
    
    // Ajouter headers CORS
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return response;
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    const response = NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
    
    // Ajouter headers CORS
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

