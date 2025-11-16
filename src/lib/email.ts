const RESEND_API_URL = 'https://api.resend.com/emails';

const apiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM;

export async function sendVerificationEmail(to: string, verifyUrl: string) {
  if (!apiKey || !emailFrom) {
    console.warn(
      '⚠️ RESEND_API_KEY ou EMAIL_FROM non configuré - lien de vérification:',
      verifyUrl,
    );
    return;
  }

  const html = `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; color: #111827;">
      <p>Bienvenue sur <strong>Eyesberg</strong> 👟</p>
      <p>Pour activer ton compte, clique sur le bouton ci-dessous :</p>
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
        subject: 'Vérifie ton email pour activer ton compte Eyesberg',
        html,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.warn('[email] Échec envoi email de vérification:', text);
    }
  } catch (e) {
    console.warn('[email] Erreur réseau envoi email de vérification:', e);
  }
}


