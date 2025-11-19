import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Récupère le sous-domaine depuis les headers de la requête
 * Le middleware ajoute le sous-domaine dans le header 'x-subdomain'
 */
export function getSubdomainFromHeaders(request: NextRequest): string | null {
  const subdomain = request.headers.get('x-subdomain');
  return subdomain || null;
}

/**
 * Récupère le sous-domaine depuis la session de l'utilisateur connecté
 * Utilise le cookie de session pour récupérer le compte et son sous-domaine
 */
export async function getSubdomainFromSession(request: NextRequest): Promise<string | null> {
  try {
    const sessionToken = request.cookies.get('eyesberg_session')?.value;
    
    if (!sessionToken) {
      return null;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.error('❌ SUPABASE env manquantes');
      return null;
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
      return null;
    }

    // Récupérer le subdomain depuis la relation accounts
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

    return accountSubdomain;
  } catch (error) {
    console.error('Error getting subdomain from session:', error);
    return null;
  }
}

/**
 * Récupère le sous-domaine depuis les headers ou la session
 * Priorité : headers (plus rapide) > session
 */
export async function getSubdomain(request: NextRequest): Promise<string | null> {
  // Essayer d'abord depuis les headers (ajouté par le middleware)
  const headerSubdomain = getSubdomainFromHeaders(request);
  if (headerSubdomain) {
    return headerSubdomain;
  }

  // Sinon, essayer depuis la session
  return await getSubdomainFromSession(request);
}

