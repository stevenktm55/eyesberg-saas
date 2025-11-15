import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = "nodejs";

interface Font {
  id: string;
  name: string;
  display_name: string;
  font_url: string;
  format: string; // 'ttf', 'otf', 'woff', 'woff2'
  category?: string;
  active: boolean;
  letter_spacing?: number; // Espacement entre les lettres (en pixels)
  show_for_names?: boolean; // Afficher pour les noms (défaut: true)
  show_for_numbers?: boolean; // Afficher pour les numéros (défaut: true)
  created_at: string;
  updated_at: string;
}

// Lire les métadonnées des polices depuis Supabase
async function readFontsMetadata(): Promise<Font[]> {
  try {
    const { data: fonts, error } = await supabaseAdmin
      .from('fonts')
      .select('*')
      .eq('active', true)
      .order('display_name', { ascending: true });
    
    if (error) {
      console.error('Erreur lecture fonts:', error);
      return [];
    }
    
    // Ajouter les valeurs par défaut pour les polices existantes qui n'en ont pas
    return fonts.map((font: any) => ({
      ...font,
      letter_spacing: font.letter_spacing ?? 0,
      show_for_names: font.show_for_names ?? true,
      show_for_numbers: font.show_for_numbers ?? true
    }));
  } catch (error) {
    console.error('Erreur lecture fonts:', error);
    return [];
  }
}

// Sauvegarder les métadonnées des polices dans Supabase
async function saveFontsMetadata(fonts: Font[]) {
  // Cette fonction n'est plus nécessaire car on utilise Supabase directement
  // Les opérations CRUD se font directement via les requêtes Supabase
}

// GET - Récupérer toutes les polices ou filtrées par catégorie
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category'); // 'names' ou 'numbers'
    
    const fonts = await readFontsMetadata();
    
    // Si une catégorie est spécifiée, filtrer les polices
    if (category === 'names') {
      const filteredFonts = fonts.filter(font => font.show_for_names);
      return NextResponse.json(filteredFonts);
    } else if (category === 'numbers') {
      const filteredFonts = fonts.filter(font => font.show_for_numbers);
      return NextResponse.json(filteredFonts);
    }
    
    // Sinon, retourner toutes les polices
    return NextResponse.json(fonts);
  } catch (error) {
    console.error('Erreur lors de la récupération des polices:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Ajouter une nouvelle police
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fontName = formData.get('name') as string;

    if (!file || !fontName) {
      return NextResponse.json({ error: 'Fichier et nom requis' }, { status: 400 });
    }

    // Vérifier l'extension du fichier
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['ttf', 'otf', 'woff', 'woff2'];
    
    if (!fileExtension || !validExtensions.includes(fileExtension)) {
      return NextResponse.json({ 
        error: 'Format de fichier non valide. Utilisez .ttf, .otf, .woff ou .woff2' 
      }, { status: 400 });
    }

    // Upload du fichier vers Supabase Storage
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('fonts')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: `font/${fileExtension}`
      });

    if (uploadError) {
      console.error('Erreur upload font:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Obtenir l'URL publique
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('fonts')
      .getPublicUrl(uploadData.path);

    // Créer l'entrée dans la base de données
    const newFont = {
      id: crypto.randomUUID(),
      name: fontName,
      display_name: fontName,
      font_url: publicUrl,
      format: fileExtension,
      category: 'custom',
      active: true,
      letter_spacing: 0, // Valeur par défaut
      show_for_names: true, // Par défaut, afficher pour les noms
      show_for_numbers: true, // Par défaut, afficher pour les numéros
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: insertedFont, error: insertError } = await supabaseAdmin
      .from('fonts')
      .insert(newFont)
      .select()
      .single();

    if (insertError) {
      console.error('Erreur insertion font:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json(insertedFont, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la police:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT - Modifier une police (letter-spacing et filtres)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, letterSpacing, showForNames, showForNumbers } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    // Construire l'objet de mise à jour avec seulement les champs fournis
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (letterSpacing !== undefined) {
      updateData.letter_spacing = letterSpacing;
    }
    if (showForNames !== undefined) {
      updateData.show_for_names = showForNames;
    }
    if (showForNumbers !== undefined) {
      updateData.show_for_numbers = showForNumbers;
    }

    // Mettre à jour dans Supabase
    const { data: updatedFont, error: updateError } = await supabaseAdmin
      .from('fonts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Erreur mise à jour font:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (!updatedFont) {
      return NextResponse.json({ error: 'Police non trouvée' }, { status: 404 });
    }

    return NextResponse.json(updatedFont);
  } catch (error) {
    console.error('Erreur lors de la modification de la police:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE - Supprimer une police
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    // Récupérer les informations de la police avant suppression
    const { data: fontToDelete, error: fetchError } = await supabaseAdmin
      .from('fonts')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !fontToDelete) {
      return NextResponse.json({ error: 'Police non trouvée' }, { status: 404 });
    }

    // Supprimer le fichier du storage Supabase
    try {
      await supabaseAdmin.storage
        .from('fonts')
        .remove([fontToDelete.fileName]);
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier:', error);
    }

    // Supprimer l'entrée de la base de données
    const { error: deleteError } = await supabaseAdmin
      .from('fonts')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Erreur suppression font:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la suppression de la police:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}









