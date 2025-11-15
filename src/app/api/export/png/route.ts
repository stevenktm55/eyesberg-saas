// =====================================================
// API EXPORT PNG - Pour la production
// =====================================================
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { configId } = await request.json();

    if (!configId) {
      return NextResponse.json({ error: 'configId required' }, { status: 400 });
    }

    // 1. Charger la configuration depuis Supabase
    const { data: config, error } = await supabase
      .from('configurations')
      .select('*')
      .eq('id', configId)
      .single();

    if (error || !config) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
    }

    // 2. Pour l'export PNG, on a plusieurs options :

    // OPTION A : Utiliser le preview existant (plus rapide)
    if (config.preview_image_url) {
      const imageResponse = await fetch(config.preview_image_url);
      const imageBlob = await imageResponse.blob();
      
      return new NextResponse(imageBlob, {
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': `attachment; filename="preview-${config.shopify_order_id || configId}.png"`
        }
      });
    }

    // OPTION B : Générer un PNG haute résolution
    // Pour ça, tu aurais besoin d'un service de rendu côté serveur
    // Comme Puppeteer, Playwright, ou un service externe (Cloudinary, etc.)
    
    // Pour l'instant, on retourne une erreur si pas de preview
    return NextResponse.json({ 
      error: 'No preview available. Use SVG export or generate preview first.' 
    }, { status: 404 });

    // OPTION C : Utiliser un service externe (à implémenter)
    // const pngUrl = await renderSVGToPNG(svgData, 4096, 4096, 300); // 300 DPI
    // return NextResponse.redirect(pngUrl);

  } catch (err) {
    console.error('Erreur export PNG:', err);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}

// =====================================================
// NOTES POUR L'EXPORT PNG HAUTE RÉSOLUTION
// =====================================================
// 
// Pour générer des PNG haute résolution pour impression :
//
// 1. Installer Puppeteer ou Playwright :
//    npm install puppeteer
//
// 2. Créer une fonction de rendu :
//
// import puppeteer from 'puppeteer';
//
// async function renderSVGToPNG(svgData: string, width: number, height: number, dpi: number = 300) {
//   const browser = await puppeteer.launch();
//   const page = await browser.newPage();
//   
//   await page.setViewport({ width, height, deviceScaleFactor: dpi / 96 });
//   await page.setContent(`<html><body style="margin:0">${svgData}</body></html>`);
//   
//   const screenshot = await page.screenshot({ type: 'png', omitBackground: false });
//   await browser.close();
//   
//   return screenshot;
// }
//
// 3. Ou utiliser un service cloud :
//    - Cloudinary (https://cloudinary.com)
//    - imgix (https://imgix.com)
//    - Vercel OG Image (https://vercel.com/docs/functions/og-image-generation)
//
// =====================================================


