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
export async function middleware(request: NextRequest) {
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
        // Routes admin autorisées pour les sous-domaines
        const allowedAdminRoutes = [
          '/admin',
          '/admin/settings',
          '/admin/orders',
          '/admin/designs',
          '/admin/theme-editor',
          '/admin/products'
        ];
        
        // Vérifier si c'est une route admin autorisée ou une sous-route de settings/products
        const isAllowedRoute = allowedAdminRoutes.includes(url.pathname) || 
                               url.pathname.startsWith('/admin/settings/') ||
                               url.pathname.startsWith('/admin/products');
        
        if (!isAllowedRoute && url.pathname.startsWith('/admin/')) {
          // Bloquer l'accès aux routes /admin/* non autorisées depuis les sous-domaines
          // Rediriger vers la page admin principale du sous-domaine
          const adminUrl = request.nextUrl.clone();
          adminUrl.pathname = '/admin';
          return NextResponse.redirect(adminUrl);
        }
        
        // Pour toutes les routes /admin, vérifier l'authentification puis réécrire la route
        const authResponse = await handleAdminAuth(request, requestHeaders, subdomain);
        
        // Si l'authentification a échoué (redirection), retourner la réponse
        if (authResponse.status === 307 || authResponse.status === 302) {
          return authResponse;
        }
        
        // Si l'authentification a réussi, réécrire la route vers [subdomain]/admin ou [subdomain]/admin/...
        // pour forcer Next.js à servir la bonne page
        const rewriteUrl = request.nextUrl.clone();
        if (url.pathname === '/admin') {
          rewriteUrl.pathname = `/${subdomain}/admin`;
        } else {
          // Pour /admin/settings, /admin/orders, etc., réécrire vers [subdomain]/admin/settings
          rewriteUrl.pathname = `/${subdomain}${url.pathname}`;
        }
        return NextResponse.rewrite(rewriteUrl, {
          request: {
            headers: requestHeaders,
          },
        });
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
    
    console.log('🔍 Middleware handleAdminAuth:', {
      subdomain,
      hasSessionToken: !!sessionToken,
      sessionTokenPreview: sessionToken?.substring(0, 20) + '...',
      url: request.url,
      cookies: request.cookies.getAll().map(c => c.name),
    });
    
    if (!sessionToken) {
      console.warn('⚠️ No session token found, redirecting to login');
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

    if (error) {
      console.error('❌ Middleware: Supabase query error', {
        error: error.message,
        errorCode: error.code,
        errorDetails: error.details,
        sessionToken: sessionToken?.substring(0, 20) + '...',
        nowIso,
      });
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('from', `/admin`);
      return NextResponse.redirect(loginUrl);
    }

    if (!session) {
      console.error('❌ Middleware: Session not found in database', {
        sessionToken: sessionToken?.substring(0, 20) + '...',
        nowIso,
        subdomain,
      });
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('from', `/admin`);
      return NextResponse.redirect(loginUrl);
    }

    // Récupérer le subdomain depuis la relation accounts ou faire une requête séparée
    let accountSubdomain: string | null = null;
    
    if (session.accounts && typeof session.accounts === 'object' && 'subdomain' in session.accounts) {
      accountSubdomain = (session.accounts as any).subdomain;
    } else {
      // Si la jointure ne fonctionne pas, faire une requête séparée
      const { data: account } = await supabase
        .from('accounts')
        .select('subdomain')
        .eq('id', session.account_id)
        .single();
      
      if (account) {
        accountSubdomain = account.subdomain;
      }
    }

    console.log('✅ Session validated:', {
      accountSubdomain,
      requestedSubdomain: subdomain,
      match: accountSubdomain === subdomain,
      accountId: session.account_id,
    });

    // Vérification stricte : le subdomain de la session DOIT correspondre au subdomain de l'URL
    if (!accountSubdomain) {
      console.error('❌ Middleware: No account subdomain found for session', {
        sessionAccountId: session.account_id,
        requestedSubdomain: subdomain,
      });
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      return NextResponse.redirect(loginUrl);
    }

    if (accountSubdomain !== subdomain) {
      console.error(
        '❌ Middleware: Session subdomain mismatch - BLOCKING ACCESS',
        {
          accountSubdomain,
          requestedSubdomain: subdomain,
          accountId: session.account_id,
          url: request.url,
        }
      );
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      // Ajouter un paramètre pour indiquer pourquoi on redirige
      loginUrl.searchParams.set('error', 'subdomain_mismatch');
      return NextResponse.redirect(loginUrl);
    }
    
    console.log('✅ Access granted to /admin - subdomain match confirmed');

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

