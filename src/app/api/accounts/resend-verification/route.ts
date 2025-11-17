import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { sendVerificationEmail } from '@/lib/email';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * API pour renvoyer l'email de vérification
 * POST /api/accounts/resend-verification
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Chercher le compte par email
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id, email, subdomain, email_verification_token, email_verified')
      .eq('email', email.toLowerCase())
      .single();

    if (accountError || !account) {
      // Do not reveal whether the email exists (security)
      return NextResponse.json({
        success: true,
        message: 'If this email exists, a verification email has been sent.',
      });
    }

    // Si l'email est déjà vérifié, pas besoin de renvoyer
    if (account.email_verified === true) {
      return NextResponse.json(
        { error: 'This email is already verified' },
        { status: 400 }
      );
    }

    // Si pas de token, en générer un nouveau
    let verificationToken = account.email_verification_token;
    if (!verificationToken) {
      verificationToken = crypto.randomUUID();
      
      // Mettre à jour le token en base
      await supabase
        .from('accounts')
        .update({
          email_verification_token: verificationToken,
          email_verification_sent_at: new Date().toISOString(),
        })
        .eq('id', account.id);
    }

    // Envoyer l'email de vérification
    try {
      const internalUrl =
        process.env.INTERNAL_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;
      if (!internalUrl) {
        console.warn(
          '⚠️ INTERNAL_BASE_URL or NEXT_PUBLIC_APP_URL missing, cannot send verification email',
        );
        return NextResponse.json(
          { error: 'Server configuration missing' },
          { status: 500 }
        );
      }

      const verifyBase = internalUrl.replace(/\/$/, '');
      const verifyUrl = `${verifyBase}/api/accounts/verify-email?token=${verificationToken}`;
      
      await sendVerificationEmail(account.email, verifyUrl);
      console.log('📨 Verification email resent to', account.email);

      // Mettre à jour la date d'envoi
      await supabase
        .from('accounts')
        .update({
          email_verification_sent_at: new Date().toISOString(),
        })
        .eq('id', account.id);

      return NextResponse.json({
        success: true,
        message: 'Verification email sent successfully',
      });
    } catch (e) {
      console.error('❌ Error while sending the verification email:', e);
      return NextResponse.json(
        { error: 'Error while sending the email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Error while resending the verification email:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

