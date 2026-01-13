// =====================================================
// API POUR SUPPRIMER LE FOND D'UNE IMAGE
// =====================================================
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/background-remover
 * Supprime le fond d'une image en utilisant remove.bg API
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;

    if (!imageFile) {
      return NextResponse.json(
        { error: 'Image file is required' },
        { status: 400 }
      );
    }

    // Utiliser remove.bg API (tu devras ajouter ta clé API dans les variables d'environnement)
    const REMOVE_BG_API_KEY = process.env.REMOVE_BG_API_KEY;
    
    if (!REMOVE_BG_API_KEY) {
      // Si pas de clé API, retourner l'image originale (fallback)
      const arrayBuffer = await imageFile.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const mimeType = imageFile.type || 'image/png';
      return NextResponse.json({
        success: true,
        image: `data:${mimeType};base64,${base64}`,
        note: 'Background remover API key not configured'
      });
    }

    // Convertir le fichier en blob
    const arrayBuffer = await imageFile.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: imageFile.type });

    // Appeler remove.bg API
    const formDataRemoveBg = new FormData();
    formDataRemoveBg.append('image_file', blob, imageFile.name);
    formDataRemoveBg.append('size', 'auto');

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': REMOVE_BG_API_KEY,
      },
      body: formDataRemoveBg,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Remove.bg API error:', errorText);
      
      // Fallback: retourner l'image originale
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const mimeType = imageFile.type || 'image/png';
      return NextResponse.json({
        success: false,
        image: `data:${mimeType};base64,${base64}`,
        error: 'Failed to process image with remove.bg'
      });
    }

    // Récupérer l'image traitée
    const processedBlob = await response.blob();
    const processedArrayBuffer = await processedBlob.arrayBuffer();
    const processedBase64 = Buffer.from(processedArrayBuffer).toString('base64');

    return NextResponse.json({
      success: true,
      image: `data:image/png;base64,${processedBase64}`
    });
  } catch (error: any) {
    console.error('Error in background remover API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove background' },
      { status: 500 }
    );
  }
}
