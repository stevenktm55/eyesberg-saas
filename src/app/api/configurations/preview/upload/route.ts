import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

/**
 * POST /api/configurations/preview/upload
 * Body: { id: string (uuid or 5-digit), image: string (dataURL or base64 PNG) }
 * Uploads preview to storage and updates configurations.preview_image_url
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const idParam: string | undefined = body?.id;
    let imageData: string | undefined = body?.image;

    if (!idParam || !imageData) {
      const res = NextResponse.json({ error: 'Paramètres id et image requis' }, { status: 400 });
      res.headers.set('Access-Control-Allow-Origin', '*');
      return res;
    }

    // Normalize data URL -> base64
    const dataUrlMatch = imageData.match(/^data:image\/png;base64,(.*)$/);
    if (dataUrlMatch) {
      imageData = dataUrlMatch[1];
    }

    const isFormattedNumber = /^\d{5}$/.test(idParam);
    console.log('📤 Upload preview reçu pour id:', idParam, 'formattedNumber?', isFormattedNumber);

    const query = supabase
      .from('configurations')
      .select('id, order_number')
      .limit(1);

    const { data, error } = isFormattedNumber
      ? await query.eq('order_number', parseInt(idParam, 10))
      : await query.eq('id', idParam);

    if (error) {
      console.error('❌ Erreur recherche configuration:', error);
      const res = NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
      res.headers.set('Access-Control-Allow-Origin', '*');
      return res;
    }

    const config = data?.[0];
    if (!config) {
      console.warn('⚠️ Configuration introuvable pour id:', idParam);
      const res = NextResponse.json({ error: 'Configuration introuvable' }, { status: 404 });
      res.headers.set('Access-Control-Allow-Origin', '*');
      return res;
    }
    console.log('📦 Configuration trouvée pour upload preview:', {
      id: config.id,
      order_number: config.order_number
    });

    // Decode base64
    const buffer = Buffer.from(imageData, 'base64');
    const filename = `preview-${config.id}-${Date.now()}.png`;

    const { data: upload, error: uploadError } = await supabase.storage
      .from('configurations')
      .upload(filename, buffer, {
        contentType: 'image/png',
        upsert: true,
        cacheControl: '31536000'
      });

    if (uploadError) {
      console.error('❌ Erreur upload storage:', uploadError);
      const res = NextResponse.json({ error: 'Upload échoué' }, { status: 500 });
      res.headers.set('Access-Control-Allow-Origin', '*');
      return res;
    }

    const { data: pub } = supabase.storage.from('configurations').getPublicUrl(upload.path);
    const publicUrl = pub?.publicUrl;

    if (!publicUrl) {
      console.error('❌ Impossible d\'obtenir l\'URL publique pour', upload.path);
      const res = NextResponse.json({ error: 'URL publique indisponible' }, { status: 500 });
      res.headers.set('Access-Control-Allow-Origin', '*');
      return res;
    }

    const { error: updateError } = await supabase
      .from('configurations')
      .update({ preview_image_url: publicUrl })
      .eq('id', config.id);

    if (updateError) {
      console.error('❌ Erreur MAJ configuration:', updateError);
      const res = NextResponse.json({ error: 'Mise à jour échouée' }, { status: 500 });
      res.headers.set('Access-Control-Allow-Origin', '*');
      return res;
    }

    console.log('✅ Preview uploadé et URL mise à jour:', {
      id: config.id,
      order_number: config.order_number,
      url: publicUrl
    });
    const res = NextResponse.json({ url: publicUrl });
    res.headers.set('Access-Control-Allow-Origin', '*');
    return res;
  } catch (err) {
    console.error('❌ Erreur interne upload preview:', err);
    const res = NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
    res.headers.set('Access-Control-Allow-Origin', '*');
    return res;
  }
}

export async function OPTIONS() {
  const res = new NextResponse(null, { status: 204 });
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return res;
}



