import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { designId, modelId } = await request.json();
    
    if (!designId) {
      return NextResponse.json({ error: 'designId is required' }, { status: 400 });
    }

    // Récupérer les informations du design
    const { data: designData, error: designError } = await supabaseAdmin
      .from('designs')
      .select('svg_url, colors')
      .eq('id', designId)
      .single();

    if (designError || !designData) {
      return NextResponse.json({ error: 'Design not found' }, { status: 404 });
    }

    // Utiliser le modelId fourni en paramètre, ou chercher via product_mappings, ou utiliser le premier modèle
    let finalModelId;
    
    if (modelId) {
      // Modèle explicitement fourni
      finalModelId = modelId;
    } else {
      // Trouver le model_id associé à ce design
      const { data: mappingData, error: mappingError } = await supabaseAdmin
        .from('product_mappings')
        .select('model_id')
        .contains('design_ids', [designId])
        .maybeSingle();

      if (mappingError || !mappingData) {
        // Si aucun mapping trouvé, utiliser le premier modèle disponible
        const { data: defaultModel, error: defaultModelError } = await supabaseAdmin
          .from('models_3d')
          .select('id')
          .limit(1)
          .single();
        
        if (defaultModelError || !defaultModel) {
          return NextResponse.json({ error: 'No model available' }, { status: 404 });
        }
        
        finalModelId = defaultModel.id;
      } else {
        finalModelId = mappingData.model_id;
      }
    }

    // Récupérer les informations du modèle avec texture maps et material maps
    const { data: modelData, error: modelError } = await supabaseAdmin
      .from('models_3d')
      .select('glb_url, metadata, material_maps')
      .eq('id', finalModelId)
      .single();

    if (modelError || !modelData) {
      console.error('❌ Erreur modèle:', modelError);
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    console.log('🔍 Modèle trouvé:', {
      modelId: finalModelId,
      glb_url: modelData.glb_url,
      metadata: modelData.metadata,
      material_maps: modelData.material_maps
    });

    // Retourner les informations nécessaires pour la génération côté client
    return NextResponse.json({
      modelUrl: modelData.glb_url,
      designSvgUrl: designData.svg_url,
      colors: designData.colors || [],
      textureMaps: modelData.metadata?.textureMaps || {},
      materialMaps: modelData.material_maps || {}
    });

  } catch (error) {
    console.error('Erreur lors de la génération de miniature:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { designId, thumbnailDataUrl } = await request.json();
    
    console.log('🔄 PUT - Sauvegarde miniature:', { designId, hasDataUrl: !!thumbnailDataUrl });
    
    if (!designId || !thumbnailDataUrl) {
      console.error('❌ Paramètres manquants:', { designId, hasDataUrl: !!thumbnailDataUrl });
      return NextResponse.json({ error: 'designId and thumbnailDataUrl are required' }, { status: 400 });
    }

    // Convertir la data URL en blob
    console.log('📥 Conversion data URL en blob...');
    const response = await fetch(thumbnailDataUrl);
    const blob = await response.blob();
    console.log('✅ Blob créé:', { size: blob.size, type: blob.type });
    
    // Créer un nom de fichier unique
    const fileName = `auto-thumb-${designId}-${Date.now()}.webp`;
    console.log('📁 Nom de fichier:', fileName);
    
    // S'assurer que le bucket 'thumbnails' existe et autorise les bons MIME types
    const bucketName = 'thumbnails';
    console.log('🪣 Vérification/Création du bucket:', bucketName);
    const { data: existingBucket } = await supabaseAdmin.storage.getBucket(bucketName);
    if (!existingBucket) {
      console.log('🆕 Bucket absent, création...');
      const { error: createBucketError } = await supabaseAdmin.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['image/webp', 'image/jpeg', 'image/png'],
        fileSizeLimit: 10 * 1024 * 1024 // 10MB
      });
      if (createBucketError) {
        console.error('❌ Erreur création bucket:', createBucketError);
        return NextResponse.json({ error: 'Bucket creation failed', details: createBucketError.message }, { status: 500 });
      }
      console.log('✅ Bucket créé');
    } else {
      // Optionnel: tenter d'ouvrir les MIME si restreint
      const { error: updateBucketError } = await supabaseAdmin.storage.updateBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['image/webp', 'image/jpeg', 'image/png'],
        fileSizeLimit: 10 * 1024 * 1024
      });
      if (updateBucketError) {
        console.warn('⚠️ Impossible de mettre à jour le bucket (peut être déjà configuré):', updateBucketError.message);
      }
    }

    // Upload vers Supabase Storage (bucket 'thumbnails')
    console.log('☁️ Upload vers Supabase...');
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(`thumbs/${fileName}`, blob, {
        cacheControl: '3600',
        upsert: false,
        contentType: blob.type || 'image/webp'
      });

    if (uploadError) {
      console.error('❌ Erreur upload thumbnail:', uploadError);
      return NextResponse.json({ error: 'Upload failed', details: uploadError.message }, { status: 500 });
    }

    console.log('✅ Upload réussi:', uploadData);

    // Obtenir l'URL publique
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(uploadData.path);

    console.log('🔗 URL publique:', publicUrl);

    // Mettre à jour le design avec l'URL de la miniature
    console.log('💾 Mise à jour du design...');
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('designs')
      .update({ thumbnail_url: publicUrl })
      .eq('id', designId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erreur update design:', updateError);
      return NextResponse.json({ error: 'Update failed', details: updateError.message }, { status: 500 });
    }

    console.log('✅ Design mis à jour:', updateData);

    return NextResponse.json({
      success: true,
      thumbnailUrl: publicUrl
    });

  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde de miniature:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

