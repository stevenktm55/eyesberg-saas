// =====================================================
// API EXPORT PDF CMJN - Avec VPS Inkscape
// =====================================================
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  console.log('📥 PDF Export - Requête reçue');
  try {
    const { configId } = await request.json();
    console.log('📥 PDF Export - ConfigId:', configId);

    if (!configId) {
      return NextResponse.json({ error: 'configId required' }, { status: 400 });
    }

    // 1. Récupérer le SVG complet
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    const svgUrl = `${baseUrl}/api/export/svg`;
    
    console.log('🔄 Appel API SVG:', svgUrl);
    
    const svgResponse = await fetch(svgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ configId })
    });

    if (!svgResponse.ok) {
      const error = await svgResponse.text();
      console.error('❌ Erreur API SVG:', error);
      return NextResponse.json({ error: 'SVG generation failed', details: error }, { status: svgResponse.status });
    }

    const svgText = await svgResponse.text();
    console.log('✅ SVG reçu, longueur:', svgText.length);

    // 2. Envoyer le SVG au VPS Inkscape
    const vpsUrl = process.env.VPS_INKSCAPE_URL || 'http://localhost:3001';
    
    if (!vpsUrl || vpsUrl.includes('localhost')) {
      console.error('❌ VPS_INKSCAPE_URL non défini');
      return NextResponse.json({ error: 'VPS Inkscape URL not configured' }, { status: 500 });
    }

    console.log('🔄 Appel VPS Inkscape:', vpsUrl);

    // Envoyer le SVG au VPS pour conversion
    const formData = new FormData();
    formData.append('svg', new Blob([svgText], { type: 'image/svg+xml' }), 'design.svg');

    const pdfResponse = await fetch(`${vpsUrl}/convert`, {
      method: 'POST',
      body: formData
    });

    if (!pdfResponse.ok) {
      const error = await pdfResponse.text();
      console.error('❌ Erreur VPS Inkscape:', error);
      return NextResponse.json({ error: 'PDF conversion failed', details: error }, { status: 500 });
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    console.log('✅ PDF reçu du VPS, taille:', pdfBuffer.byteLength);

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="stretchmx-${configId}.pdf"`
      }
    });
  } catch (err) {
    console.error('❌ Erreur:', err);
    return NextResponse.json({ 
      error: 'Export failed',
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}
