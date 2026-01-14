// =====================================================
// API Background Remover - Proxy vers VPS rembg
// =====================================================
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  console.log('📥 Background Remover - Requête reçue');
  
  try {
    // Récupérer l'image depuis le FormData
    const formData = await request.formData();
    const image = formData.get('image');

    if (!image || !(image instanceof Blob)) {
      console.error('❌ Aucune image fournie');
      return NextResponse.json(
        { success: false, error: 'Aucune image fournie' },
        { status: 400 }
      );
    }

    // URL du VPS (même serveur que Inkscape)
    const vpsUrl = process.env.VPS_INKSCAPE_URL || process.env.VPS_BACKGROUND_REMOVER_URL || 'http://localhost:3001';
    
    if (!vpsUrl || vpsUrl.includes('localhost')) {
      console.error('❌ VPS URL non configurée');
      // Fallback : on signale un échec → le front garde l'image originale
      return NextResponse.json(
        { success: false, error: 'VPS URL not configured' },
        { status: 200 } // Status 200 pour permettre le fallback côté front
      );
    }

    console.log('🔄 Appel VPS Background Remover:', `${vpsUrl}/remove-background`);

    // Reconstruire le FormData pour le VPS
    const vpsFormData = new FormData();
    vpsFormData.append('image', image, 'input.png');

    // Appeler le VPS
    const vpsResponse = await fetch(`${vpsUrl}/remove-background`, {
      method: 'POST',
      body: vpsFormData,
    });

    if (!vpsResponse.ok) {
      const errorText = await vpsResponse.text();
      console.error('❌ Erreur VPS Background Remover:', errorText);
      // Fallback : on signale un échec → le front garde l'image originale
      return NextResponse.json(
        { success: false, error: 'VPS error', details: errorText },
        { status: 200 } // Status 200 pour permettre le fallback côté front
      );
    }

    // Vérifier le Content-Type de la réponse VPS
    const contentType = vpsResponse.headers.get('content-type');
    console.log('📦 Content-Type VPS:', contentType);
    
    // Lire l'image PNG sans fond depuis le VPS
    const pngBuffer = Buffer.from(await vpsResponse.arrayBuffer());
    const base64 = pngBuffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64}`;

    console.log('✅ Image sans fond générée, taille:', pngBuffer.length);
    console.log('📊 DataUrl preview (premiers 100 caractères):', dataUrl.substring(0, 100));

    return NextResponse.json({
      success: true,
      dataUrl,
    });
  } catch (error) {
    console.error('❌ Erreur route /api/background-remover:', error);
    // Fallback : on signale un échec → le front garde l'image originale
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 200 } // Status 200 pour permettre le fallback côté front
    );
  }
}
