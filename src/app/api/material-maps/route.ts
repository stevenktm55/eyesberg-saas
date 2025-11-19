import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, uploadFile, deleteFile } from '@/lib/supabase';
import { getSubdomain } from '@/lib/get-subdomain';

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

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    // Vérifier d'abord que le Material Map existe et appartient au sous-domaine
    const { data: existingMap, error: checkMapError } = await supabaseAdmin
      .from('material_maps')
      .select('id')
      .eq('id', id)
      .eq('subdomain', subdomain)
      .maybeSingle();

    if (checkMapError) {
      throw new Error(`Error checking material map: ${checkMapError.message}`);
    }

    if (!existingMap) {
      return NextResponse.json(
        { error: 'Material Map not found or access denied' },
        { status: 404 }
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

