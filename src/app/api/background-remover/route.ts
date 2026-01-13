// =====================================================
// API POUR SUPPRIMER LE FOND D'UNE IMAGE
// Utilise @imgly/background-removal (modèle ML intégré)
// =====================================================
import { NextRequest, NextResponse } from 'next/server';
import { removeBackground } from '@imgly/background-removal';

/**
 * POST /api/background-remover
 * Supprime le fond d'une image en utilisant un modèle ML intégré
 */
export async function POST(request: NextRequest) {
  let originalImageBuffer: Buffer | null = null;
  let originalMimeType: string = 'image/png';
  
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;

    if (!imageFile) {
      return NextResponse.json(
        { error: 'Image file is required' },
        { status: 400 }
      );
    }

    // Vérifier le type de fichier
    const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const fileType = imageFile.type || '';
    
    if (!validMimeTypes.some(type => fileType.includes(type.split('/')[1]))) {
      return NextResponse.json(
        { error: 'Invalid file type. Supported formats: JPEG, PNG, WebP, GIF' },
        { status: 400 }
      );
    }

    // Convertir le fichier en ArrayBuffer et sauvegarder pour le fallback
    const arrayBuffer = await imageFile.arrayBuffer();
    originalImageBuffer = Buffer.from(arrayBuffer);
    originalMimeType = imageFile.type || 'image/png';

    console.log('🔄 Processing image for background removal...', {
      fileName: imageFile.name,
      size: arrayBuffer.byteLength,
      type: imageFile.type
    });

    // Configuration pour la suppression de fond
    const config = {
      output: {
        format: 'image/png' as const, // PNG pour supporter la transparence
        quality: 0.9, // Qualité élevée
      },
      // Optionnel : personnaliser le modèle si nécessaire
      // model: 'medium' // Options: 'small', 'medium', 'large' (par défaut: 'medium')
    };

    // Supprimer le fond avec le modèle ML
    // Note: La première fois, le modèle sera téléchargé (mise en cache ensuite)
    const blob = await removeBackground(originalImageBuffer, config);

    // Convertir le Blob en ArrayBuffer puis en base64
    const processedArrayBuffer = await blob.arrayBuffer();
    const processedBase64 = Buffer.from(processedArrayBuffer).toString('base64');

    console.log('✅ Background removed successfully');

    return NextResponse.json({
      success: true,
      image: `data:image/png;base64,${processedBase64}`
    });
  } catch (error: any) {
    console.error('❌ Error in background remover API:', error);
    
    // En cas d'erreur, retourner l'image originale
    if (originalImageBuffer) {
      const originalBase64 = originalImageBuffer.toString('base64');
      console.log('⚠️ Returning original image due to error');
      
      return NextResponse.json({
        success: false,
        image: `data:${originalMimeType};base64,${originalBase64}`,
        error: error.message || 'Failed to remove background, returning original image'
      });
    }
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to remove background',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Configuration pour Vercel (important pour les fonctions serverless)
export const runtime = 'nodejs'; // Nécessaire pour utiliser les bibliothèques Node.js

export const config = {
  maxDuration: 60, // 60 secondes max (temps nécessaire pour le traitement ML)
};
