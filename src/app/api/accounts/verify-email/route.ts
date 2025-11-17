import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Vérifie un email à partir d'un token et crée une session,
 * puis redirige vers l'admin du sous-domaine.
 *
 * GET /api/accounts/verify-email?token=...
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      const base =
        process.env.INTERNAL_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || '/';
      return NextResponse.redirect(`${base}/login?error=invalid_token`);
    }

    const { data: account, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('email_verification_token', token)
      .single();

    if (error || !account) {
      console.warn('⚠️ Token de vérification invalide ou expiré:', token, error);
      const base =
        process.env.INTERNAL_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || '/';
      return NextResponse.redirect(`${base}/login?error=invalid_token`);
    }

    // Mettre à jour le compte comme vérifié
    const now = new Date();
    const { error: updateError } = await supabase
      .from('accounts')
      .update({
        email_verified: true,
        email_verified_at: now.toISOString(),
        email_verification_token: null,
      })
      .eq('id', account.id);

    if (updateError) {
      console.error('❌ Erreur update email_verified:', updateError);
      const base =
        process.env.INTERNAL_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || '/';
      return NextResponse.redirect(`${base}/login?error=verify_failed`);
    }

    // Rediriger vers la page de login du sous-domaine avec un message de succès
    // L'utilisateur devra entrer son mot de passe pour se connecter (plus sécurisé)
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'eyesberg.app';
    const loginUrl = `https://${account.subdomain}.${rootDomain}/login?verified=1&email=${encodeURIComponent(account.email)}`;

    return NextResponse.redirect(loginUrl);
  } catch (error) {
    console.error('❌ Erreur verify-email:', error);
    const base =
      process.env.INTERNAL_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || '/';
    return NextResponse.redirect(`${base}/login?error=server_error`);
  }
}


