import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * API pour créer un compte avec sous-domaine personnalisé
 * POST /api/accounts/signup
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password, subdomain } = await request.json();

    // Validation
    if (!email || !password || !subdomain) {
      return NextResponse.json(
        { error: 'Email, password et subdomain requis' },
        { status: 400 }
      );
    }

    // Valider le format du sous-domaine
    if (!subdomain.match(/^[a-z0-9-]+$/)) {
      return NextResponse.json(
        { error: 'Le sous-domaine ne peut contenir que des lettres minuscules, chiffres et tirets' },
        { status: 400 }
      );
    }

    // Vérifier que le sous-domaine n'est pas réservé
    const reservedSubdomains = [
      'www', 'admin', 'api', 'app', 'www', 'mail', 'ftp', 'localhost',
      'staging', 'dev', 'test', 'demo', 'help', 'support', 'blog', 'docs'
    ];
    if (reservedSubdomains.includes(subdomain.toLowerCase())) {
      return NextResponse.json(
        { error: 'Ce sous-domaine est réservé' },
        { status: 400 }
      );
    }

    // Vérifier que le sous-domaine n'existe pas déjà
    const { data: existingAccount } = await supabase
      .from('accounts')
      .select('id')
      .eq('subdomain', subdomain.toLowerCase())
      .single();

    if (existingAccount) {
      return NextResponse.json(
        { error: 'Ce sous-domaine est déjà utilisé' },
        { status: 400 }
      );
    }

    // Vérifier que l'email n'existe pas déjà
    const { data: existingEmail } = await supabase
      .from('accounts')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 400 }
      );
    }

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(password, 10);

    // Créer le compte
    const { data: account, error: createError } = await supabase
      .from('accounts')
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        subdomain: subdomain.toLowerCase(),
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Erreur lors de la création du compte:', createError);
      return NextResponse.json(
        { error: 'Erreur lors de la création du compte' },
        { status: 500 }
      );
    }

    console.log('✅ Compte créé:', account.id, account.subdomain);

    // Enregistrer automatiquement le sous-domaine auprès de Vercel
    try {
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'eyesberg.app';
      const internalUrl =
        process.env.INTERNAL_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;

      if (!internalUrl) {
        console.warn('⚠️ INTERNAL_BASE_URL ou NEXT_PUBLIC_APP_URL non défini, skip register-subdomain');
      } else {
        const registerUrl = `${internalUrl.replace(/\/$/, '')}/api/internal/register-subdomain`;
        const res = await fetch(registerUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ subdomain: account.subdomain }),
        });

        if (!res.ok) {
          const details = await res.json().catch(() => ({}));
          console.warn('⚠️ Échec de l’enregistrement du sous-domaine sur Vercel:', details);
        } else {
          console.log(`✅ Sous-domaine ${account.subdomain}.${rootDomain} enregistré sur Vercel`);
        }
      }
    } catch (e) {
      console.warn('⚠️ Erreur inattendue lors de register-subdomain:', e);
    }

    return NextResponse.json({
      success: true,
      account: {
        id: account.id,
        subdomain: account.subdomain,
        email: account.email,
      },
    });
  } catch (error) {
    console.error('❌ Erreur lors de l\'inscription:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

