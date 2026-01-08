import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, uploadFile, deleteFile } from '@/lib/supabase';
import { getSubdomain } from '@/lib/get-subdomain';

// GET - Récupérer tous les modèles 3D avec leurs parties
export async function GET(request: NextRequest) {
  try {
    const subdomain = await getSubdomain(request);
    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain is required' },
        { status: 400 }
      );
    }

    const { data: models, error: modelsError } = await supabaseAdmin
      .from('models_3d')
      .select(`
        id,
        name,
        glb_url,
        thumbnail_url,
        description,
        metadata,
        created_at,
        updated_at,
        subdomain,
        camera_views,
        model_parts (
          id,
          name,
          material_map_id,
          material_maps (
            id,
            name
          )
        )
      `)
      .eq('subdomain', subdomain)
      .order('created_at', { ascending: false });

    if (modelsError) throw modelsError;

    return NextResponse.json(models);
  } catch (error: any) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch models' },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau modèle 3D
export async function POST(request: NextRequest) {
  try {
    const subdomain = await getSubdomain(request);
    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain is required' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const file = formData.get('file') as File | null;
    const description = formData.get('description') as string | null;
    const partsJson = formData.get('parts') as string | null; // JSON array des parties détectées

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    // Upload du fichier GLB
    let glbUrl = '';
    try {
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      // Convertir File en ArrayBuffer puis en Buffer pour Supabase
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Déterminer le MIME type correct selon l'extension
      let contentType = file.type;
      if (!contentType || contentType === 'application/octet-stream') {
        if (file.name.toLowerCase().endsWith('.glb')) {
          contentType = 'model/gltf-binary';
        } else if (file.name.toLowerCase().endsWith('.gltf')) {
          contentType = 'model/gltf+json';
        } else {
          contentType = 'application/octet-stream';
        }
      }
      
      // Upload avec supabaseAdmin pour avoir les permissions
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('models-3d')
        .upload(fileName, buffer, {
          contentType: contentType,
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('models-3d')
        .getPublicUrl(uploadData.path);

      glbUrl = publicUrl;
    } catch (uploadErr: any) {
      console.error('Error in file upload:', uploadErr);
      return NextResponse.json(
        { error: uploadErr.message || 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Créer le modèle 3D
    const { data: model, error: modelError } = await supabaseAdmin
      .from('models_3d')
      .insert({
        subdomain,
        name,
        glb_url: glbUrl,
        description: description || null,
      })
      .select()
      .single();

    if (modelError) {
      console.error('Error creating model:', modelError);
      throw modelError;
    }

    // Créer les parties depuis les matériaux détectés
    if (partsJson) {
      try {
        const parts = JSON.parse(partsJson);
        if (Array.isArray(parts) && parts.length > 0) {
          const partsData = parts.map((part: { name: string }) => ({
            model_3d_id: model.id,
            name: part.name,
          }));

          const { error: partsError } = await supabaseAdmin
            .from('model_parts')
            .insert(partsData);

          if (partsError) {
            console.error('Error creating parts:', partsError);
            // Ne pas échouer si les parties ne peuvent pas être créées, mais logger l'erreur
          }
        }
      } catch (parseError) {
        console.error('Error parsing parts JSON:', parseError);
        // Continuer même si le parsing échoue
      }
    } else {
      // Si pas de parties fournies, créer des parties par défaut
      const defaultParts = ['Front', 'Back', 'Sleeves', 'Collar'];
      const partsData = defaultParts.map((partName) => ({
        model_3d_id: model.id,
        name: partName,
      }));

      const { error: partsError } = await supabaseAdmin
        .from('model_parts')
        .insert(partsData);

      if (partsError) {
        console.error('Error creating default parts:', partsError);
      }
    }

    return NextResponse.json(model);
  } catch (error: any) {
    console.error('Error creating model:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create model' },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour un modèle 3D
export async function PUT(request: NextRequest) {
  try {
    const subdomain = await getSubdomain(request);
    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain is required' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const id = formData.get('id') as string;
    const name = formData.get('name') as string | null;
    const file = formData.get('file') as File | null;
    const description = formData.get('description') as string | null;

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (description !== null) updateData.description = description;

    // Upload du nouveau fichier GLB si fourni
    if (file) {
      const fileName = `${Date.now()}-${file.name}`;
      updateData.glb_url = await uploadFile('models-3d', fileName, file);
    }

    const { data: model, error } = await supabaseAdmin
      .from('models_3d')
      .update(updateData)
      .eq('id', id)
      .eq('subdomain', subdomain) // Vérifier que le modèle appartient au sous-domaine
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(model);
  } catch (error: any) {
    console.error('Error updating model:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update model' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un modèle 3D
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

    // Récupérer le modèle pour supprimer le fichier GLB
    const { data: model, error: fetchError } = await supabaseAdmin
      .from('models_3d')
      .select('glb_url')
      .eq('id', id)
      .eq('subdomain', subdomain) // Vérifier que le modèle appartient au sous-domaine
      .single();

    if (fetchError) throw fetchError;

    // Supprimer le fichier GLB du storage
    if (model?.glb_url) {
      try {
        const urlParts = model.glb_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        await deleteFile('models-3d', fileName);
      } catch (storageError) {
        console.error('Error deleting file from storage:', storageError);
        // Continuer même si la suppression du fichier échoue
      }
    }

    // Supprimer le modèle (les parties seront supprimées automatiquement via CASCADE)
    const { error } = await supabaseAdmin
      .from('models_3d')
      .delete()
      .eq('id', id)
      .eq('subdomain', subdomain); // Double vérification

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting model:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete model' },
      { status: 500 }
    );
  }
}

