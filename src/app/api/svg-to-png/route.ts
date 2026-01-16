export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

// Lazy import de sharp pour éviter les problèmes au build
let sharp: any;
async function getSharp() {
  if (!sharp) {
    sharp = (await import('sharp')).default;
  }
  return sharp;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const dpi = parseInt(searchParams.get('dpi') || '300', 10);
    const size = parseInt(searchParams.get('size') || '4096', 10);
    if (!url) {
      return new NextResponse('Missing url param', { status: 400 });
    }

    // Fetch SVG
    const svgRes = await fetch(url, { cache: 'no-store' });
    if (!svgRes.ok) {
      return new NextResponse(`Failed to fetch SVG: ${svgRes.status}`, { status: 502 });
    }
    const svgBuffer = Buffer.from(await svgRes.arrayBuffer());

    // Rasterize to PNG with sharp; try progressively smaller settings if OOM or failure
    const attempts = [
      { density: dpi, width: size, height: size },
      { density: Math.max(150, Math.floor(dpi / 2)), width: Math.max(2048, Math.floor(size / 2)), height: Math.max(2048, Math.floor(size / 2)) },
      { density: 96, width: 1024, height: 1024 }
    ];
    let png: Buffer | null = null;
    let lastErr: any = null;
    for (const a of attempts) {
      try {
        const sharpInstance = await getSharp();
        png = await sharpInstance(svgBuffer, { density: a.density })
          .resize({ width: a.width, height: a.height, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png({ compressionLevel: 9 })
          .toBuffer();
        break;
      } catch (e) {
        lastErr = e;
        // try next attempt
      }
    }
    if (!png) {
      console.error('svg-to-png error:', lastErr);
      return new NextResponse(`Rasterization failed: ${(lastErr as any)?.message || 'unknown'}`, { status: 500 });
    }

    return new NextResponse(png, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (e: any) {
    console.error('svg-to-png fatal error:', e);
    return new NextResponse(`Error: ${e?.message || 'unknown'}`, { status: 500 });
  }
}


