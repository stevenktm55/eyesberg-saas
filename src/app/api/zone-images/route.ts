import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST - Upload d'image pour une zone vers Supabase Storage
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Le fichier doit être une image' }, { status: 400 });
    }

    // Générer un nom de fichier unique
    const fileExtension = file.name.split('.').pop() || 'png';
    const fileName = `${crypto.randomUUID()}.${fileExtension}`;

    // Convertir le fichier en buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload vers Supabase Storage dans le bucket 'zone-images'
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('zone-images')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Erreur upload Supabase:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Obtenir l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('zone-images')
      .getPublicUrl(uploadData.path);
    
    return NextResponse.json({ 
      success: true, 
      imagePath: publicUrl 
    });
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE - Supprimer une image de zone depuis Supabase Storage
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imagePath = searchParams.get('path');

    if (!imagePath) {
      return NextResponse.json({ error: 'Chemin d\'image manquant' }, { status: 400 });
    }

    // Extraire le nom du fichier depuis l'URL Supabase
    const fileName = imagePath.split('/').pop();
    
    if (!fileName) {
      return NextResponse.json({ error: 'Nom de fichier invalide' }, { status: 400 });
    }

    // Supprimer depuis Supabase Storage
    const { error: deleteError } = await supabase.storage
      .from('zone-images')
      .remove([fileName]);

    if (deleteError) {
      console.error('Erreur suppression Supabase:', deleteError);
      // Ne pas retourner d'erreur si le fichier n'existe pas
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}









