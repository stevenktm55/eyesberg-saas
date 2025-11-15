import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

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
    const { data: account, error: accountError } = await supabase
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

    // Créer une session (on utilisera un cookie sécurisé)
    // Pour l'instant, on retourne juste les infos du compte
    // TODO: Implémenter un vrai système de session avec JWT ou cookies sécurisés

    console.log('✅ Connexion réussie:', account.id, account.subdomain);

    return NextResponse.json({
      success: true,
      account: {
        id: account.id,
        subdomain: account.subdomain,
        email: account.email,
        name: account.name,
      },
    });
  } catch (error) {
    console.error('❌ Erreur lors de la connexion:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

