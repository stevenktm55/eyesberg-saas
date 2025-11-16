import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * API pour se connecter avec email/password
 * POST /api/accounts/login
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et password requis' },
        { status: 400 }
      );
    }

    // Chercher le compte par email
    const { data: account, error: accountError } = await
      supabase
        .from('accounts')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

    if (accountError || !account) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    // Vérifier le mot de passe
    const passwordMatch = await bcrypt.compare(password, account.password_hash);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    // Créer une session avec expiration glissante (7 jours)
    const sessionToken = crypto.randomUUID() + crypto.randomBytes(16).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 jours

    const { error: sessionError } = await supabase
      .from('sessions')
      .insert({
        account_id: account.id,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
      });

    if (sessionError) {
      console.error('❌ Erreur création session:', sessionError);
      return NextResponse.json(
        { error: 'Erreur lors de la création de la session' },
        { status: 500 }
      );
    }

    console.log('✅ Connexion réussie, session créée pour:', account.id, account.subdomain);

    const response = NextResponse.json({
      success: true,
      account: {
        id: account.id,
        subdomain: account.subdomain,
        email: account.email,
        name: account.name,
      },
    });

    const isProd = process.env.NODE_ENV === 'production';
    response.cookies.set('eyesberg_session', sessionToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    });

    return response;
  } catch (error) {
    console.error('❌ Erreur lors de la connexion:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

