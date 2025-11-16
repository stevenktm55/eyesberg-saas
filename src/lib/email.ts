import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM;

const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function sendVerificationEmail(to: string, verifyUrl: string) {
  if (!resend || !emailFrom) {
    console.warn(
      '⚠️ RESEND_API_KEY ou EMAIL_FROM non configuré - lien de vérification:',
      verifyUrl,
    );
    return;
  }

  await resend.emails.send({
    from: emailFrom,
    to,
    subject: 'Vérifie ton email pour activer ton compte Eyesberg',
    html: `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; color: #111827;">
        <p>Bienvenue sur <strong>Eyesberg</strong> 👋</p>
        <p>Pour activer ton compte, clique sur le bouton ci-dessous&nbsp;:</p>
        <p>
          <a href="${verifyUrl}"
             style="display:inline-block;padding:12px 24px;border-radius:999px;background:#8eff36;color:#050505;text-decoration:none;font-weight:600;">
            Vérifier mon email
          </a>
        </p>
        <p>Ou copie/colle ce lien dans ton navigateur :</p>
        <p><a href="${verifyUrl}">${verifyUrl}</a></p>
        <p style="margin-top:24px;font-size:12px;color:#6b7280;">
          Si tu n'es pas à l'origine de cette inscription, tu peux ignorer cet email.
        </p>
      </div>
    `,
  });
}

const RESEND_API_URL = 'https://api.resend.com/emails';

export async function sendVerificationEmail(params: {
  to: string;
  token: string;
  subdomain: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const baseUrl =
    process.env.INTERNAL_BASE_URL ||
    (process.env.NEXT_PUBLIC_ROOT_DOMAIN
      ? `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`
      : '');

  if (!apiKey) {
    console.warn(
      '[email] RESEND_API_KEY manquant, la vérification email ne sera pas envoyée.',
    );
    return;
  }

  if (!baseUrl) {
    console.warn(
      '[email] INTERNAL_BASE_URL ou NEXT_PUBLIC_ROOT_DOMAIN manquant, impossible de construire le lien de vérification.',
    );
    return;
  }

  const { to, token, subdomain } = params;
  const url = new URL('/verify-email', baseUrl);
  url.searchParams.set('token', token);
  url.searchParams.set('brand', subdomain);
  url.searchParams.set('email', to);

  const html = `
    <p>👟 Bienvenue sur <strong>Eyesberg</strong> !</p>
    <p>Pour activer votre compte et accéder à votre espace <strong>${subdomain}.eyesberg.app</strong>, veuillez valider votre adresse email en cliquant sur le lien ci-dessous :</p>
    <p><a href="${url.toString()}" target="_blank" rel="noopener noreferrer">Confirmer mon adresse email</a></p>
    <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
  `;

  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Eyesberg <no-reply@eyesberg.app>',
        to: [to],
        subject: 'Confirme ton adresse email',
        html,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.warn('[email] Échec envoi email vérification:', text);
    }
  } catch (e) {
    console.warn('[email] Erreur réseau envoi email vérification:', e);
  }
}


