import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Middleware Next.js pour gérer les sous-domaines personnalisés
 * 
 * Fonctionne comme Kickflip :
 * - stretchmx.gokickflip.com/admin → Admin du client "stretchmx"
 * - stretchmx.gokickflip.com/configure → Configurateur du client "stretchmx"
 * 
 * Le sous-domaine est extrait depuis le header "host" et passé aux pages via headers.
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const url = request.nextUrl.clone();

  // Extraire le sous-domaine depuis le host
  // Exemples :
  // - "stretchmx.gokickflip.com" → subdomain = "stretchmx"
  // - "stretchmx.localhost:3000" → subdomain = "stretchmx"
  // - "localhost:3000" → subdomain = null (domaine racine)
  
  const subdomain = extractSubdomain(host);

  // Si on a un sous-domaine, l'ajouter aux headers pour les pages
  if (subdomain) {
    // Ajouter le sous-domaine dans les headers pour que les pages puissent y accéder
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-subdomain', subdomain);
    
    // Si on est sur une route qui nécessite le sous-domaine, continuer
    // Sinon, rediriger vers la route appropriée
    
    // Routes sous-domaine : /admin, /configure, /api, etc.
    const subdomainRoutes = ['/admin', '/configure', '/api'];
    const isSubdomainRoute = subdomainRoutes.some(route => url.pathname.startsWith(route));
    
    if (isSubdomainRoute || url.pathname === '/') {
      // Bloquer l'accès à /admin/login sur les sous-domaines (utiliser /login à la place)
      if (url.pathname === '/admin/login') {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = '/login';
        return NextResponse.redirect(loginUrl);
      }
      
      // Protection des routes /admin : vérifier la session
      if (url.pathname.startsWith('/admin')) {
        return handleAdminAuth(request, requestHeaders, subdomain);
      }

      // Route valide pour sous-domaine, continuer
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
  } else {
    // Pas de sous-domaine = domaine racine
    // Routes racine : /signup, /login, /, etc.
    const rootRoutes = ['/signup', '/login', '/', '/api/shopify'];
    const isRootRoute = rootRoutes.some(route => url.pathname.startsWith(route));
    
    if (!isRootRoute && !url.pathname.startsWith('/app/')) {
      // Route qui nécessite un sous-domaine mais on est sur le domaine racine
      // Rediriger vers la page d'inscription ou de connexion
      if (!url.pathname.startsWith('/api/')) {
        url.pathname = '/signup';
        return NextResponse.redirect(url);
      }
    }
  }

  return NextResponse.next();
}

/**
 * Extrait le sous-domaine depuis le host
 * 
 * @param host - Header "host" de la requête
 * @returns Le sous-domaine ou null si c'est le domaine racine
 */
function extractSubdomain(host: string): string | null {
  // Enlever le port si présent
  const hostWithoutPort = host.split(':')[0];
  
  // Domaines de production
  // ⚠️ IMPORTANT : Configure NEXT_PUBLIC_ROOT_DOMAIN dans .env.local
  const productionDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  
  // Domaines de développement
  const devDomains = ['localhost', '127.0.0.1'];
  
  // Vérifier si c'est un sous-domaine
  if (productionDomain && hostWithoutPort.endsWith(`.${productionDomain}`)) {
    // Production : stretchmx.ton-domaine.com
    const parts = hostWithoutPort.split('.');
    if (parts.length >= 3) {
      return parts[0]; // "stretchmx"
    }
  } else if (hostWithoutPort.includes('.')) {
    // Développement : stretchmx.localhost ou stretchmx.ngrok.io
    const parts = hostWithoutPort.split('.');
    if (parts.length >= 2 && !devDomains.includes(parts[0])) {
      return parts[0]; // "stretchmx"
    }
  }
  
  // Pas de sous-domaine (domaine racine)
  return null;
}

// Vérifie la session et protège les routes /admin
async function handleAdminAuth(
  request: NextRequest,
  headers: Headers,
  subdomain: string,
) {
  try {
    const sessionToken = request.cookies.get('eyesberg_session')?.value;
    if (!sessionToken) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('from', `/admin`);
      return NextResponse.redirect(loginUrl);
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.error('❌ SUPABASE env manquantes dans le middleware');
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      return NextResponse.redirect(loginUrl);
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const nowIso = new Date().toISOString();

    const { data: session, error } = await supabase
      .from('sessions')
      .select('account_id, expires_at, accounts(subdomain)')
      .eq('session_token', sessionToken)
      .gt('expires_at', nowIso)
      .single();

    if (error || !session) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('from', `/admin`);
      return NextResponse.redirect(loginUrl);
    }

    const accountSubdomain = session.accounts?.subdomain;
    if (accountSubdomain !== subdomain) {
      console.warn(
        '⚠️ Session subdomain mismatch',
        accountSubdomain,
        'vs',
        subdomain,
      );
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      return NextResponse.redirect(loginUrl);
    }

    // Sliding expiration : repousser expires_at de 7 jours
    const newExpires = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    ).toISOString();
    await supabase
      .from('sessions')
      .update({ expires_at: newExpires })
      .eq('session_token', sessionToken);

    // Continuer la requête avec les headers enrichis
    return NextResponse.next({
      request: {
        headers,
      },
    });
  } catch (e) {
    console.error('❌ Erreur handleAdminAuth:', e);
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }
}

// Configurer les routes sur lesquelles le middleware s'applique
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

