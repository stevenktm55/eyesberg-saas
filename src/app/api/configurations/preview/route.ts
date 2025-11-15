import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

/**
 * GET /api/configurations/preview?id=00001|uuid
 * Retourne directement l'image d'aperçu (stream) si trouvée, sinon 404.
 * Accepte un identifiant formaté 5 chiffres (order_number) ou un UUID.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id');

    if (!idParam) {
      const res = NextResponse.json({ error: 'Paramètre id requis' }, { status: 400 });
      res.headers.set('Access-Control-Allow-Origin', '*');
      return res;
    }

    const isFormattedNumber = /^\d{5}$/.test(idParam);

    // Récupérer la configuration
    const query = supabase
      .from('configurations')
      .select('id, order_number, preview_image_url')
      .limit(1);

    const { data, error } = isFormattedNumber
      ? await query.eq('order_number', parseInt(idParam, 10))
      : await query.eq('id', idParam);

    if (error) {
      console.error('❌ Erreur chargement configuration preview:', error);
      const res = NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
      res.headers.set('Access-Control-Allow-Origin', '*');
      return res;
    }

    const config = data?.[0];
    if (!config) {
      const res = NextResponse.json({ error: 'Configuration introuvable' }, { status: 404 });
      res.headers.set('Access-Control-Allow-Origin', '*');
      return res;
    }

    let effectivePreviewUrl = config.preview_image_url as string | null;

    // Fallback: chercher un fichier de preview dans le bucket si l'URL n'est pas enregistrée
    if (!effectivePreviewUrl) {
      try {
        const prefix = `preview-${config.id}-`;
        // Essai 1: utiliser prefix s'il est supporté
        let filesResp = await supabase.storage.from('configurations').list('', { limit: 1000 } as any);
        if (!filesResp.error && filesResp.data) {
          const candidates = filesResp.data.filter((f: any) => f.name && f.name.indexOf(prefix) === 0);
          if (candidates.length > 0) {
            candidates.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            const latest = candidates[0];
            const { data: pub } = supabase.storage.from('configurations').getPublicUrl(latest.name);
            effectivePreviewUrl = pub?.publicUrl || null;
          }
        }
      } catch (e) {
        console.warn('⚠️ Impossible de lister les previews pour', config.id, e);
      }
    }

    if (!effectivePreviewUrl) {
      const res = NextResponse.json({ error: 'Aperçu indisponible' }, { status: 404 });
      res.headers.set('Access-Control-Allow-Origin', '*');
      return res;
    }

    // Déléguer l’affichage au proxy d’images pour les bons headers CORS/cache
    const proxied = `${new URL(request.url).origin}/api/image-proxy?url=${encodeURIComponent(effectivePreviewUrl)}`;
    const response = NextResponse.redirect(proxied, { status: 302 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Cache-Control', 'public, max-age=300');
    return response;
  } catch (err) {
    console.error('❌ Erreur preview route:', err);
    const res = NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
    res.headers.set('Access-Control-Allow-Origin', '*');
    return res;
  }
}

export async function OPTIONS() {
  const res = new NextResponse(null, { status: 204 });
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return res;
}


