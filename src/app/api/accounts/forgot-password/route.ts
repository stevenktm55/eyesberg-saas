import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/email';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * API pour demander la réinitialisation du mot de passe
 * POST /api/accounts/forgot-password
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Chercher le compte par email
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id, email, subdomain')
      .eq('email', email.toLowerCase())
      .single();

    // Ne pas révéler si l'email existe ou non (sécurité)
    // Toujours retourner un succès pour éviter l'énumération d'emails
    if (accountError || !account) {
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, we\'ve sent you a password reset link.',
      });
    }

    // Générer un token de réinitialisation (valide 1 heure)
    const resetToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

    // Sauvegarder le token en base
    const { error: updateError } = await supabase
      .from('accounts')
      .update({
        password_reset_token: resetToken,
        password_reset_expires_at: expiresAt.toISOString(),
      })
      .eq('id', account.id);

    if (updateError) {
      console.error('❌ Error saving password reset token:', updateError);
      // Toujours retourner un succès pour éviter l'énumération
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, we\'ve sent you a password reset link.',
      });
    }

    // Envoyer l'email de réinitialisation
    try {
      const internalUrl =
        process.env.INTERNAL_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;
      if (!internalUrl) {
        console.warn(
          '⚠️ INTERNAL_BASE_URL or NEXT_PUBLIC_APP_URL not defined, cannot send password reset email',
        );
        return NextResponse.json({
          success: true,
          message: 'If an account with that email exists, we\'ve sent you a password reset link.',
        });
      }

      const resetBase = internalUrl.replace(/\/$/, '');
      const resetUrl = `${resetBase}/reset-password?token=${resetToken}`;
      
      await sendPasswordResetEmail(account.email, resetUrl);
      console.log('📨 Password reset email sent to', account.email);

      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, we\'ve sent you a password reset link.',
      });
    } catch (e) {
      console.error('❌ Error sending password reset email:', e);
      // Toujours retourner un succès pour éviter l'énumération
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, we\'ve sent you a password reset link.',
      });
    }
  } catch (error) {
    console.error('❌ Error in forgot-password API:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}


