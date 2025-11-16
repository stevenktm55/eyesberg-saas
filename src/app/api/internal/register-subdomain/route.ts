import { NextRequest, NextResponse } from 'next/server';

/**
 * API interne pour enregistrer automatiquement un sous-domaine
 * dans le projet Vercel eyesberg-saas.
 *
 * Body attendu:
 * {
 *   "subdomain": "ktm"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { subdomain } = await request.json();

    if (!subdomain || typeof subdomain !== 'string') {
      return NextResponse.json(
        { error: 'subdomain is required' },
        { status: 400 },
      );
    }

    const vercelToken = process.env.VERCEL_API_TOKEN;
    const vercelProjectId = process.env.VERCEL_PROJECT_ID;
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'eyesberg.app';

    if (!vercelToken || !vercelProjectId) {
      console.error('❌ VERCEL_API_TOKEN ou VERCEL_PROJECT_ID manquant');
      return NextResponse.json(
        { error: 'Vercel API not configured' },
        { status: 500 },
      );
    }

    const fullDomain = `${subdomain}.${rootDomain}`;

    // Appel à l’API Vercel pour ajouter le domaine au projet
    const response = await fetch(
      `https://api.vercel.com/v10/projects/${vercelProjectId}/domains`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${vercelToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: fullDomain,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Erreur Vercel domain add:', data);
      return NextResponse.json(
        {
          error: 'Failed to register subdomain with Vercel',
          details: data,
        },
        { status: 500 },
      );
    }

    console.log('✅ Sous-domaine enregistré sur Vercel:', fullDomain, data);

    return NextResponse.json({
      success: true,
      domain: fullDomain,
      vercel: data,
    });
  } catch (error) {
    console.error('❌ Erreur /api/internal/register-subdomain:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}


