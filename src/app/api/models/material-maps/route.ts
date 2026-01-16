import { NextResponse } from "next/server";
import { supabase, supabaseAdmin, hasServiceRoleKey } from "@/lib/supabase";
import sharp from "sharp";

export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

// POST: Uploader une texture map pour un matériau spécifique
export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const modelId = String(form.get("modelId") ?? "");
    const materialName = String(form.get("materialName") ?? "");
    const mapType = String(form.get("mapType") ?? "");
    const file = form.get("file") as File | null;

    if (!modelId || !materialName || !mapType || !file) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    console.log('📤 Upload texture map:', { modelId, materialName, mapType, fileName: file.name });

    // Vérifier si on a la service role key
    console.log('🔍 Debug - hasServiceRoleKey:', hasServiceRoleKey);
    console.log('🔍 Debug - SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.log('🔍 Debug - SUPABASE_SERVICE_ROLE_KEY length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0);
    
    if (!hasServiceRoleKey) {
      console.error('❌ Service role key manquante');
      return NextResponse.json({ 
        error: "Service role key manquante. Ajoutez SUPABASE_SERVICE_ROLE_KEY dans .env.local" 
      }, { status: 500 });
    }

    // Récupérer le modèle depuis Supabase
    const { data: model, error: modelError } = await supabaseAdmin
      .from('models_3d')
      .select('*')
      .eq('id', modelId)
      .single();

    if (modelError || !model) {
      console.error('❌ Modèle non trouvé:', modelError);
      return NextResponse.json({ error: "Modèle non trouvé" }, { status: 404 });
    }

    // Préparer le filename (toujours .png pour les images optimisées, car Supabase ne supporte pas WebP)
    const ext = file.type.startsWith('image/') ? 'png' : (file.name.split('.').pop() || 'png');
    const safeMapType = mapType.replace(/[^a-z]/gi, '');
    const safeMaterialName = materialName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `material-maps/${modelId}_${safeMaterialName}_${safeMapType}.${ext}`;

    // Optimiser l'image avant upload (compression pour mobile)
    const arrayBuffer = await file.arrayBuffer();
    const originalBuffer = Buffer.from(arrayBuffer);
    
    let buffer = originalBuffer;
    let optimizedSize = originalBuffer.length;
    
    // Vérifier si c'est une image
    if (file.type.startsWith('image/')) {
      try {
        console.log('🗜️ Optimisation de l\'image (taille originale:', Math.round(originalBuffer.length / 1024), 'KB)');
        
        // Redimensionner à 128x128px et convertir en PNG optimisé pour mobile
        const optimizedBuffer = await sharp(originalBuffer)
          .resize(128, 128, { 
            fit: 'inside', 
            withoutEnlargement: true 
          })
          .png({ 
            quality: 85,
            compressionLevel: 9
          })
          .toBuffer();
        
        buffer = optimizedBuffer;
        optimizedSize = optimizedBuffer.length;
        
        console.log('✅ Image optimisée:', Math.round(optimizedSize / 1024), 'KB (128x128px PNG)');
      } catch (error) {
        console.warn('⚠️ Erreur optimisation image, utilisation originale:', error);
        buffer = originalBuffer;
      }
    }

    // Déterminer le content-type correct
    // Note: Supabase Storage ne supporte pas 'image/webp' comme content-type
    // On utilise 'image/png' pour les images optimisées
    const contentType = file.type.startsWith('image/') ? 'image/png' : file.type;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('models-3D')
      .upload(filename, buffer, {
        contentType: contentType,
        upsert: true
      });

    if (uploadError) {
      console.error('❌ Erreur upload Supabase:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Obtenir l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('models-3D')
      .getPublicUrl(filename);

    console.log('✅ Texture uploadée:', publicUrl);

    // Mettre à jour les materialMaps du modèle
    const materialMaps = model.material_maps || {};
    if (!materialMaps[materialName]) {
      materialMaps[materialName] = { materialName };
    }
    materialMaps[materialName][mapType] = publicUrl;

    // Sauvegarder dans Supabase
    const { error: updateError } = await supabaseAdmin
      .from('models_3d')
      .update({ material_maps: materialMaps })
      .eq('id', modelId);

    if (updateError) {
      console.error('❌ Erreur mise à jour modèle:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    console.log('✅ Material maps mis à jour');

    return NextResponse.json({
      success: true,
      materialMaps: materialMaps
    });
  } catch (err) {
    console.error("POST /api/models/material-maps error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// DELETE: Supprimer une texture map d'un matériau
export async function DELETE(request: Request) {
  try {
    const { modelId, materialName, mapType } = await request.json();

    if (!modelId || !materialName || !mapType) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    console.log('🗑️ Suppression texture map:', { modelId, materialName, mapType });

    // Récupérer le modèle depuis Supabase
    const { data: model, error: modelError } = await supabaseAdmin
      .from('models_3d')
      .select('*')
      .eq('id', modelId)
      .single();

    if (modelError || !model) {
      console.error('❌ Modèle non trouvé:', modelError);
      return NextResponse.json({ error: "Modèle non trouvé" }, { status: 404 });
    }

    const materialMaps = model.material_maps || {};

    // Supprimer le fichier de Supabase Storage si l'URL existe
    if (materialMaps[materialName]?.[mapType]) {
      const fileUrl = materialMaps[materialName][mapType];
      
      // Extraire le chemin du fichier depuis l'URL
      if (fileUrl.includes('supabase.co/storage/v1/object/public/models-3D/')) {
        const filePath = fileUrl.split('supabase.co/storage/v1/object/public/models-3D/')[1];
        
        if (filePath) {
          const { error: deleteError } = await supabase.storage
            .from('models-3D')
            .remove([filePath]);
          
          if (deleteError) {
            console.warn('⚠️ Erreur suppression fichier:', deleteError);
          } else {
            console.log('✅ Fichier supprimé de Storage');
          }
        }
      }

      // Retirer de la config
      delete materialMaps[materialName][mapType];
      
      // Si le matériau n'a plus aucune map, le supprimer complètement
      const remainingKeys = Object.keys(materialMaps[materialName]).filter(k => k !== 'materialName');
      if (remainingKeys.length === 0) {
        delete materialMaps[materialName];
      }
    }

    // Sauvegarder dans Supabase
    const { error: updateError } = await supabaseAdmin
      .from('models_3d')
      .update({ material_maps: materialMaps })
      .eq('id', modelId);

    if (updateError) {
      console.error('❌ Erreur mise à jour:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    console.log('✅ Material map supprimée');

    return NextResponse.json({
      success: true,
      materialMaps: materialMaps
    });
  } catch (err) {
    console.error("DELETE /api/models/material-maps error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}


