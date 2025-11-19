import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, uploadFile } from '@/lib/supabase';
import { getSubdomain } from '@/lib/get-subdomain';

// POST - Uploader un fichier de texture pour un Material Map
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
    const materialMapId = formData.get('materialMapId') as string;
    const mapType = formData.get('mapType') as string; // 'diffuse', 'normal', 'roughness', 'metallic'
    const file = formData.get('file') as File | null;
    const intensity = formData.get('intensity') ? parseInt(formData.get('intensity') as string) : 100;
    const scale = formData.get('scale') ? parseFloat(formData.get('scale') as string) : 1.0;

    if (!materialMapId || !mapType || !file) {
      return NextResponse.json(
        { error: 'materialMapId, mapType, and file are required' },
        { status: 400 }
      );
    }

    // Vérifier que le Material Map appartient au sous-domaine
    const { data: materialMap, error: mapError } = await supabaseAdmin
      .from('material_maps')
      .select('id')
      .eq('id', materialMapId)
      .eq('subdomain', subdomain)
      .single();

    if (mapError || !materialMap) {
      return NextResponse.json(
        { error: 'Material Map not found or access denied' },
        { status: 404 }
      );
    }

    // Upload du fichier
    const fileName = `${materialMapId}-${mapType}-${Date.now()}.${file.name.split('.').pop()}`;
    const fileUrl = await uploadFile('material-maps', fileName, file);

    // Créer ou mettre à jour l'entrée dans material_map_files
    const { data: existingFile } = await supabaseAdmin
      .from('material_map_files')
      .select('id')
      .eq('material_map_id', materialMapId)
      .eq('map_type', mapType)
      .single();

    let fileRecord;
    if (existingFile) {
      // Mettre à jour
      const { data, error } = await supabaseAdmin
        .from('material_map_files')
        .update({
          file_url: fileUrl,
          intensity,
          scale,
        })
        .eq('id', existingFile.id)
        .select()
        .single();

      if (error) throw error;
      fileRecord = data;
    } else {
      // Créer
      const { data, error } = await supabaseAdmin
        .from('material_map_files')
        .insert({
          material_map_id: materialMapId,
          map_type: mapType,
          file_url: fileUrl,
          intensity,
          scale,
        })
        .select()
        .single();

      if (error) throw error;
      fileRecord = data;
    }

    return NextResponse.json({
      id: fileRecord.id,
      fileUrl,
      mapType,
      intensity,
      scale,
    });
  } catch (error: any) {
    console.error('Error uploading material map file:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}

