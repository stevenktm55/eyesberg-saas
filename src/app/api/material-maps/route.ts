import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, uploadFile, deleteFile } from '@/lib/supabase';
import { getSubdomain } from '@/lib/get-subdomain';

// Synchroniser les intensités d'un material map vers tous les modèles qui l'utilisent
async function syncMaterialMapIntensitiesToModels(materialMapId: string, settings: Array<{ mapType: string; intensity: number; scale: number }>) {
  console.log('🔄 Synchronisation des intensités vers models_3d.material_maps pour material map:', materialMapId);
  
  // Trouver tous les model_parts qui utilisent ce material map
  const { data: modelParts, error: partsError } = await supabaseAdmin
    .from('model_parts')
    .select(`
      id,
      name,
      model_3d_id,
      models_3d!inner (
        id,
        material_maps
      )
    `)
    .eq('material_map_id', materialMapId);
  
  if (partsError) {
    console.error('Error fetching model parts:', partsError);
    return;
  }
  
  if (!modelParts || modelParts.length === 0) {
    console.log('ℹ️ Aucun model_part n\'utilise ce material map');
    return;
  }
  
  // Créer un mapping des intensités par type de map
  const intensityMap: Record<string, number> = {};
  const scaleMap: Record<string, number> = {};
  
  settings.forEach(setting => {
    if (setting.mapType === 'normal') {
      intensityMap.normalIntensity = setting.intensity / 100; // Convertir de 0-100 à 0-1
      scaleMap.repeatX = setting.scale;
      scaleMap.repeatY = setting.scale;
    } else if (setting.mapType === 'roughness') {
      intensityMap.roughnessValue = setting.intensity / 100; // Convertir de 0-100 à 0-1
    } else if (setting.mapType === 'metallic') {
      intensityMap.metalnessValue = setting.intensity / 100; // Convertir de 0-100 à 0-1
    } else if (setting.mapType === 'ao') {
      intensityMap.aoIntensity = setting.intensity / 100; // Convertir de 0-100 à 0-1
    }
  });
  
  // Grouper les parties par modèle
  const modelsMap = new Map<string, any>();
  
  modelParts.forEach((part: any) => {
    const modelId = part.model_3d_id;
    if (!modelsMap.has(modelId)) {
      modelsMap.set(modelId, {
        model: part.models_3d,
        parts: []
      });
    }
    modelsMap.get(modelId).parts.push(part);
  });
  
  // Mettre à jour chaque modèle
  for (const [modelId, { model, parts }] of modelsMap.entries()) {
    const materialMaps = model.material_maps || {};
    let updated = false;
    
    // Pour chaque partie qui utilise ce material map, mettre à jour les intensités
    parts.forEach((part: any) => {
      const materialName = part.name;
      if (!materialMaps[materialName]) {
        materialMaps[materialName] = { materialName };
      }
      
      // Mettre à jour les intensités si elles sont définies
      Object.entries(intensityMap).forEach(([key, value]) => {
        if (value !== undefined) {
          materialMaps[materialName][key] = value;
          updated = true;
        }
      });
      
      // Mettre à jour les scales si elles sont définies
      if (scaleMap.repeatX !== undefined) {
        materialMaps[materialName].repeatX = scaleMap.repeatX;
        updated = true;
      }
      if (scaleMap.repeatY !== undefined) {
        materialMaps[materialName].repeatY = scaleMap.repeatY;
        updated = true;
      }
    });
    
    if (updated) {
      console.log(`📦 Mise à jour material_maps pour modèle ${modelId}, matériaux:`, parts.map((p: any) => p.name).join(', '));
      
      const { error: updateError } = await supabaseAdmin
        .from('models_3d')
        .update({ material_maps: materialMaps })
        .eq('id', modelId);
      
      if (updateError) {
        console.error(`❌ Erreur mise à jour modèle ${modelId}:`, updateError);
      } else {
        console.log(`✅ Modèle ${modelId} mis à jour avec succès`);
      }
    }
  }
  
  console.log('✅ Synchronisation terminée');
}

// GET - Récupérer tous les Material Maps avec leurs fichiers
export async function GET(request: NextRequest) {
  try {
    const subdomain = await getSubdomain(request);
    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain is required' },
        { status: 400 }
      );
    }

    const { data: materialMaps, error } = await supabaseAdmin
      .from('material_maps')
      .select(`
        *,
        material_map_files (
          id,
          map_type,
          file_url,
          intensity,
          scale
        )
      `)
      .eq('subdomain', subdomain)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(materialMaps);
  } catch (error: any) {
    console.error('Error fetching material maps:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch material maps' },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau Material Map
export async function POST(request: NextRequest) {
  try {
    const subdomain = await getSubdomain(request);
    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const { data: materialMap, error } = await supabaseAdmin
      .from('material_maps')
      .insert({
        subdomain,
        name,
        description: description || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(materialMap);
  } catch (error: any) {
    console.error('Error creating material map:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create material map' },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour un Material Map
export async function PUT(request: NextRequest) {
  try {
    const subdomain = await getSubdomain(request);
    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { id, name, description, settings } = body;

    console.log('PUT /api/material-maps - Request body:', { id, name, description, settingsCount: settings?.length });
    console.log('PUT /api/material-maps - Subdomain:', subdomain);

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    // Vérifier d'abord que le Material Map existe et appartient au sous-domaine
    const { data: existingMap, error: checkMapError } = await supabaseAdmin
      .from('material_maps')
      .select('id, subdomain, name')
      .eq('id', id)
      .maybeSingle();

    console.log('PUT /api/material-maps - Existing map check:', { existingMap, checkMapError });

    if (checkMapError) {
      console.error('Error checking material map:', checkMapError);
      throw new Error(`Error checking material map: ${checkMapError.message}`);
    }

    if (!existingMap) {
      console.error('Material map not found with id:', id);
      return NextResponse.json(
        { error: 'Material Map not found' },
        { status: 404 }
      );
    }

    if (existingMap.subdomain !== subdomain) {
      console.error('Material map subdomain mismatch:', { 
        mapSubdomain: existingMap.subdomain, 
        requestSubdomain: subdomain 
      });
      return NextResponse.json(
        { error: 'Material Map access denied - subdomain mismatch' },
        { status: 403 }
      );
    }

    // Mettre à jour les settings des fichiers (intensity, scale)
    if (settings && Array.isArray(settings)) {
      for (const setting of settings) {
        const { mapType, intensity, scale } = setting;
        if (mapType) {
          try {
            // Mettre à jour directement avec upsert - si le fichier n'existe pas, ça ne fera rien
            const { error: updateFileError } = await supabaseAdmin
              .from('material_map_files')
              .update({
                intensity: intensity !== undefined ? intensity : 100,
                scale: scale !== undefined ? scale : 1.0,
              })
              .eq('material_map_id', id)
              .eq('map_type', mapType);
            
            if (updateFileError) {
              console.error(`Error updating ${mapType} file settings:`, updateFileError);
              // Ne pas throw ici, continuer avec les autres settings
            }
          } catch (err) {
            console.error(`Error processing ${mapType} settings:`, err);
            // Continuer avec les autres settings
          }
        }
      }
      
      // Synchroniser les intensités vers models_3d.material_maps pour tous les modèles qui utilisent ce material map
      try {
        await syncMaterialMapIntensitiesToModels(id, settings);
      } catch (syncError) {
        console.error('Error syncing intensities to models:', syncError);
        // Ne pas bloquer la sauvegarde si la sync échoue
      }
    }

    // Mettre à jour le Material Map si nécessaire
    const updateData: any = {};
    if (name) updateData.name = name;
    if (description !== null) updateData.description = description;

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('material_maps')
        .update(updateData)
        .eq('id', id)
        .eq('subdomain', subdomain);

      if (updateError) {
        console.error('Error updating material map:', updateError);
        throw new Error(`Failed to update material map: ${updateError.message}`);
      }
    }

    // Toujours récupérer le material map à la fin avec tous ses fichiers
    const { data: materialMap, error: fetchError } = await supabaseAdmin
      .from('material_maps')
      .select(`
        *,
        material_map_files (
          id,
          map_type,
          file_url,
          intensity,
          scale
        )
      `)
      .eq('id', id)
      .eq('subdomain', subdomain)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching material map:', fetchError);
      throw new Error(`Failed to fetch material map: ${fetchError.message}`);
    }
    
    if (!materialMap) {
      throw new Error('Material Map not found');
    }

    return NextResponse.json(materialMap);
  } catch (error: any) {
    console.error('Error updating material map:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update material map' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un Material Map
export async function DELETE(request: NextRequest) {
  try {
    const subdomain = await getSubdomain(request);
    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain is required' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    // Vérifier que le Material Map appartient au sous-domaine
    const { data: materialMap, error: mapError } = await supabaseAdmin
      .from('material_maps')
      .select('id')
      .eq('id', id)
      .eq('subdomain', subdomain)
      .single();

    if (mapError || !materialMap) {
      return NextResponse.json(
        { error: 'Material Map not found or access denied' },
        { status: 404 }
      );
    }

    // Récupérer les fichiers pour les supprimer du storage
    const { data: files, error: fetchError } = await supabaseAdmin
      .from('material_map_files')
      .select('file_url')
      .eq('material_map_id', id);

    if (fetchError) throw fetchError;

    // Supprimer les fichiers du storage
    if (files) {
      for (const file of files) {
        try {
          if (file.file_url) {
            const urlParts = file.file_url.split('/');
            const fileName = urlParts[urlParts.length - 1];
            await deleteFile('material-maps', fileName);
          }
        } catch (storageError) {
          console.error('Error deleting file from storage:', storageError);
          // Continuer même si la suppression échoue
        }
      }
    }

    // Supprimer le Material Map (les fichiers seront supprimés automatiquement via CASCADE)
    const { error } = await supabaseAdmin
      .from('material_maps')
      .delete()
      .eq('id', id)
      .eq('subdomain', subdomain); // Double vérification

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting material map:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete material map' },
      { status: 500 }
    );
  }
}

