'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Page d'inscription avec choix de sous-domaine
 * Comme Kickflip : https://stretchmx.gokickflip.com/admin/login
 */
export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [subdomain, setSubdomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ⚠️ IMPORTANT : Configure NEXT_PUBLIC_ROOT_DOMAIN dans .env.local
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'ton-domaine.com';

  // Forcer le chargement des fonts avant d'afficher
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    if (document.fonts) {
      // Charger PP Neue Machina
      const ppFont = new FontFace(
        'PP Neue Machina Inktrap Ultrabold Italic',
        'url(/fonts/pp-neue-machina-ultrabold-italic.woff2) format("woff2")'
      );
      
      // Charger Inter depuis le serveur local (comme PP Neue Machina)
      const interFont = new FontFace(
        'Inter',
        'url(/fonts/inter-regular.woff2) format("woff2")',
        { weight: '400' }
      );
      
      const timeout = setTimeout(() => {
        setFontsLoaded(true); // Timeout après 3 secondes
      }, 3000);
      
      Promise.all([
        ppFont.load().then(f => document.fonts.add(f)).catch(() => {}),
        interFont.load().then(f => document.fonts.add(f)).catch(() => {
          // Fallback vers Google Fonts si local échoue
          const interFontFallback = new FontFace(
            'Inter',
            'url(https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7W0Q5nw.woff2) format("woff2")',
            { weight: '400' }
          );
          return interFontFallback.load().then(f => document.fonts.add(f));
        })
      ]).then(() => {
        clearTimeout(timeout);
        // Vérifier que les fonts sont chargées
        const ppLoaded = document.fonts.check('48px "PP Neue Machina Inktrap Ultrabold Italic"');
        const interLoaded = document.fonts.check('16px Inter');
        
        if (ppLoaded && interLoaded) {
          // Forcer un re-render pour appliquer les fonts
          setTimeout(() => {
            setFontsLoaded(true);
            // Forcer le re-render des éléments et forcer l'utilisation des fonts
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new Event('resize'));
              // Forcer l'utilisation des fonts après un court délai
              setTimeout(() => {
                // Forcer le re-render en modifiant et restaurant les styles
                const h1 = document.querySelector('h1');
                if (h1) {
                  const originalFont = h1.style.fontFamily;
                  h1.style.fontFamily = 'sans-serif';
                  // Forcer un reflow
                  void h1.offsetWidth;
                  h1.style.fontFamily = '"PP Neue Machina Inktrap Ultrabold Italic", "PP Neue Machina Inktrap Ultrabold Italic Placeholder", sans-serif';
                  void h1.offsetWidth;
                }
                
                const labels = document.querySelectorAll('label');
                labels.forEach(label => {
                  label.style.fontFamily = 'sans-serif';
                  void label.offsetWidth;
                  label.style.fontFamily = 'Inter, sans-serif';
                  void label.offsetWidth;
                  // Forcer à nouveau après un court délai
                  setTimeout(() => {
                    label.style.fontFamily = 'Inter, sans-serif';
                  }, 10);
                });
                
                const inputs = document.querySelectorAll('input');
                inputs.forEach(input => {
                  input.style.fontFamily = 'sans-serif';
                  void input.offsetWidth;
                  input.style.fontFamily = 'Inter, sans-serif';
                  void input.offsetWidth;
                  // Forcer à nouveau après un court délai
                  setTimeout(() => {
                    input.style.fontFamily = 'Inter, sans-serif';
                  }, 10);
                });
                
                const buttons = document.querySelectorAll('button');
                buttons.forEach(button => {
                  button.style.fontFamily = 'sans-serif';
                  void button.offsetWidth;
                  button.style.fontFamily = 'Inter';
                  button.style.fontWeight = '600';
                  void button.offsetWidth;
                });
                
                const paragraphs = document.querySelectorAll('p');
                paragraphs.forEach(p => {
                  p.style.fontFamily = 'sans-serif';
                  void p.offsetWidth;
                  p.style.fontFamily = 'Inter';
                  p.style.fontWeight = '400';
                  void p.offsetWidth;
                });
              }, 50);
            }
          }, 100);
        } else {
          // Afficher quand même après 1 seconde supplémentaire
          setTimeout(() => setFontsLoaded(true), 1000);
        }
      }).catch(() => {
        clearTimeout(timeout);
        setFontsLoaded(true);
      });
    } else {
      setFontsLoaded(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Valider le sous-domaine
      if (!subdomain.match(/^[a-z0-9-]+$/)) {
        setError('Le sous-domaine ne peut contenir que des lettres minuscules, chiffres et tirets');
        setLoading(false);
        return;
      }

      // Créer le compte
      const response = await fetch('/api/accounts/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          subdomain,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la création du compte');
      }

      const data = await response.json();

      // Après création du compte, rediriger vers la page de vérification d'email
      const search = new URLSearchParams({
        email,
        brand: subdomain,
      }).toString();
      router.push(`/verify-email-sent?${search}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setLoading(false);
    }
  };

  if (!fontsLoaded) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#000000',
      }}>
        <div style={{ color: '#8eff36', fontFamily: 'Inter, sans-serif' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#000000',
      padding: '20px',
    }}>
      <div style={{
        backgroundColor: '#0a0a0a',
        border: '1px solid #333333',
        padding: '40px',
        borderRadius: '8px',
        width: '100%',
        maxWidth: '400px',
      }}>
        <h1 
          className="stepn-title-ultrabold"
          style={{ 
            fontSize: '48px', 
            marginBottom: '32px',
            textAlign: 'center',
            fontFamily: 'PP Neue Machina Inktrap Ultrabold Italic, PP Neue Machina Inktrap Ultrabold Italic Placeholder, sans-serif',
            fontWeight: '400',
            letterSpacing: '-2.32px',
            textTransform: 'uppercase',
            color: '#8eff36',
            fontStyle: 'normal',
          }}
        >
          Create your account
        </h1>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px',
              fontWeight: '500',
              color: '#ffffff',
              fontFamily: 'Inter, sans-serif',
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#1a1a1a',
                border: '1px solid #333333',
                borderRadius: '4px',
                fontSize: '14px',
                color: '#ffffff',
                fontFamily: 'Inter, sans-serif',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#ffffff';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#333333';
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px',
              fontWeight: '500',
              color: '#ffffff',
              fontFamily: 'Inter, sans-serif',
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                minLength={8}
                style={{
                  width: '100%',
                  padding: '12px 48px 12px 16px',
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333333',
                  borderRadius: '4px',
                  fontSize: '14px',
                  color: '#ffffff',
                  fontFamily: 'Inter, sans-serif',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#ffffff';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#333333';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  fontSize: '12px',
                  fontWeight: 500,
                  textTransform: 'none',
                  letterSpacing: 0,
                  color: '#a0a0a0',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px',
              fontWeight: '500',
              color: '#ffffff',
              fontFamily: 'Inter, sans-serif',
            }}>
              Your customizer url
            </label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="brandname"
                required
                pattern="[a-z0-9-]+"
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333333',
                  borderRight: 'none',
                  borderTopLeftRadius: '4px',
                  borderBottomLeftRadius: '4px',
                  fontSize: '14px',
                  color: '#ffffff',
                  fontFamily: 'Inter, sans-serif',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#ffffff';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#333333';
                }}
              />
              <span style={{
                padding: '12px 16px',
                border: '1px solid #333333',
                borderLeft: 'none',
                borderTopRightRadius: '4px',
                borderBottomRightRadius: '4px',
                backgroundColor: '#1a1a1a',
                fontSize: '14px',
                color: '#a0a0a0',
                fontFamily: 'Inter, sans-serif',
              }}>
                .{rootDomain}
              </span>
            </div>
            <p style={{ 
              fontSize: '12px', 
              color: '#a0a0a0', 
              marginTop: '8px',
              fontFamily: '"PP Neue Machina Inktrap Light Italic", "PP Neue Machina Inktrap Light Italic Placeholder", sans-serif',
            }}>
              Your admin will be accessible at:{' '}
              <strong
                style={{
                  color: '#ffffff',
                  fontFamily: '"PP Neue Machina Inktrap Ultrabold Italic", "PP Neue Machina Inktrap Ultrabold Italic Placeholder", sans-serif',
                  fontWeight: 400,
                }}
              >
                {subdomain || 'brandname'}.{rootDomain}/admin
              </strong>
            </p>
          </div>

          {error && (
            <div style={{
              padding: '12px',
              backgroundColor: '#1a1a1a',
              border: '1px solid #ff3333',
              color: '#ff6666',
              borderRadius: '4px',
              marginBottom: '16px',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password || !subdomain}
            style={{
              width: '100%',
              padding: '14px 24px',
              backgroundColor: loading || !email || !password || !subdomain ? '#333333' : '#8eff36',
              color: loading || !email || !password || !subdomain ? '#a0a0a0' : 'rgb(10, 10, 10)',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: loading || !email || !password || !subdomain ? 'not-allowed' : 'pointer',
              marginBottom: '16px',
              transition: 'background-color 0.2s',
            }}
          >
            {loading ? 'Creating account...' : 'Start free trial'}
          </button>
        </form>

        <p style={{ 
          fontSize: '12px', 
          color: '#a0a0a0', 
          textAlign: 'center',
          marginBottom: '16px',
          lineHeight: '1.5',
          fontFamily: 'Inter, sans-serif',
        }}>
          By clicking &quot;Start free trial&quot; you agree to our{' '}
          <a href="/terms" style={{ color: '#ffffff', fontFamily: 'Inter, sans-serif' }}>Terms</a>
          {' '}and{' '}
          <a href="/privacy" style={{ color: '#ffffff', fontFamily: 'Inter, sans-serif' }}>Privacy policy</a>
        </p>

        <div style={{
          borderTop: '1px solid #333333',
          paddingTop: '16px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '14px', color: '#a0a0a0', marginBottom: '8px', fontFamily: 'Inter, sans-serif' }}>
            Already have an account?
          </p>
          <a href="/login" style={{ color: '#ffffff', textDecoration: 'none', fontWeight: '500', fontFamily: 'Inter, sans-serif' }}>
            Log In
          </a>
        </div>
      </div>
    </div>
  );
}

