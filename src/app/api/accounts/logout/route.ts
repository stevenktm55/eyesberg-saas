import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * API pour se déconnecter
 * Supprime la session en base et efface le cookie eyesberg_session
 */
export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('eyesberg_session')?.value;

    if (sessionToken) {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('session_token', sessionToken);

      if (error) {
        console.warn('⚠️ Erreur lors de la suppression de la session:', error.message);
      }
    }

    const response = NextResponse.json({ success: true });

    // Effacer le cookie côté client (sur le domaine wildcard)
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'eyesberg.app';
    const cookieDomain = `.${rootDomain}`;

    response.cookies.set('eyesberg_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      domain: cookieDomain,
      expires: new Date(0),
    });

    return response;
  } catch (error) {
    console.error('❌ Erreur lors du logout:', error);
    return NextResponse.json(
      { error: 'Error while logging out' },
      { status: 500 },
    );
  }
}


