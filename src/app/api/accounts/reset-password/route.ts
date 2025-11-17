import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * API pour réinitialiser le mot de passe avec un token
 * POST /api/accounts/reset-password
 */
export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Chercher le compte par token de réinitialisation
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id, password_reset_token, password_reset_expires_at')
      .eq('password_reset_token', token)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Vérifier que le token n'est pas expiré
    if (!account.password_reset_expires_at) {
      return NextResponse.json(
        { error: 'Invalid reset token' },
        { status: 400 }
      );
    }

    const expiresAt = new Date(account.password_reset_expires_at);
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Reset token has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Hasher le nouveau mot de passe
    const passwordHash = await bcrypt.hash(password, 10);

    // Mettre à jour le mot de passe et effacer le token
    const { error: updateError } = await supabase
      .from('accounts')
      .update({
        password_hash: passwordHash,
        password_reset_token: null,
        password_reset_expires_at: null,
      })
      .eq('id', account.id);

    if (updateError) {
      console.error('❌ Error updating password:', updateError);
      return NextResponse.json(
        { error: 'Failed to reset password' },
        { status: 500 }
      );
    }

    // Supprimer toutes les sessions existantes pour forcer une nouvelle connexion
    await supabase
      .from('sessions')
      .delete()
      .eq('account_id', account.id);

    console.log('✅ Password reset successful for account:', account.id);

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully',
    });
  } catch (error) {
    console.error('❌ Error in reset-password API:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}


