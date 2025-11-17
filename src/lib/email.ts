const RESEND_API_URL = 'https://api.resend.com/emails';

const apiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM;

export async function sendVerificationEmail(to: string, verifyUrl: string) {
  if (!apiKey || !emailFrom) {
    console.warn(
      '⚠️ RESEND_API_KEY or EMAIL_FROM missing - verification link:',
      verifyUrl,
    );
    return;
  }

  const html = `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; color: #111827;">
      <p>Welcome to <strong>Eyesberg</strong> 👟</p>
      <p>To activate your account, click the button below:</p>
      <p>
        <a href="${verifyUrl}"
           style="display:inline-block;padding:12px 24px;border-radius:999px;background:#8eff36;color:#050505;text-decoration:none;font-weight:600;">
            Verify my email
        </a>
      </p>
      <p>Or copy/paste this link in your browser:</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p style="margin-top:24px;font-size:12px;color:#6b7280;">
        If you didn’t request this signup, you can ignore this message.
      </p>
    </div>
  `;

  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: emailFrom!,
        to: [to],
        subject: 'Verify your email to activate your Eyesberg account',
        html,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.warn('[email] Failed to send verification email:', text);
    }
  } catch (e) {
    console.warn('[email] Network error while sending verification email:', e);
  }
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  if (!apiKey || !emailFrom) {
    console.warn(
      '⚠️ RESEND_API_KEY or EMAIL_FROM missing - password reset link:',
      resetUrl,
    );
    return;
  }

  const html = `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; color: #111827;">
      <p>Hello,</p>
      <p>You requested to reset your password for your <strong>Eyesberg</strong> account.</p>
      <p>Click the button below to reset your password:</p>
      <p>
        <a href="${resetUrl}"
           style="display:inline-block;padding:12px 24px;border-radius:999px;background:#8eff36;color:#050505;text-decoration:none;font-weight:600;">
            Reset my password
        </a>
      </p>
      <p>Or copy/paste this link in your browser:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p style="margin-top:24px;font-size:12px;color:#6b7280;">
        This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  `;

  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: emailFrom!,
        to: [to],
        subject: 'Reset your Eyesberg password',
        html,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.warn('[email] Failed to send password reset email:', text);
    }
  } catch (e) {
    console.warn('[email] Network error while sending password reset email:', e);
  }
}

