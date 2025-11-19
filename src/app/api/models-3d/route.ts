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
        *,
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

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    let glbUrl = '';

    // Upload du fichier GLB si fourni
    if (file) {
      const fileName = `${Date.now()}-${file.name}`;
      glbUrl = await uploadFile('models-3d', fileName, file);
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

    if (modelError) throw modelError;

    // Créer les parties par défaut
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
      // Ne pas échouer si les parties ne peuvent pas être créées
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

