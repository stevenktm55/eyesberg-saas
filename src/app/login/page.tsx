'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Page de connexion
 * Permet aux utilisateurs de se connecter avec email/password
 * Redirige vers leur sous-domaine après connexion
 */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'eyesberg.app';

  // Forcer le chargement des fonts avant d'afficher
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    if (document.fonts) {
      // Charger PP Neue Machina
      const ppFont = new FontFace(
        'PP Neue Machina Inktrap Ultrabold Italic',
        'url(/fonts/pp-neue-machina-ultrabold-italic.woff2) format("woff2")'
      );
      
      // Charger Inter depuis Google Fonts avec plusieurs variantes
      const interFont400 = new FontFace(
        'Inter',
        'url(https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7W0Q5nw.woff2) format("woff2")',
        { weight: '400' }
      );
      const interFont500 = new FontFace(
        'Inter',
        'url(https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7W0Q5nw.woff2) format("woff2")',
        { weight: '500' }
      );
      const interFont600 = new FontFace(
        'Inter',
        'url(https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7W0Q5nw.woff2) format("woff2")',
        { weight: '600' }
      );
      
      const timeout = setTimeout(() => {
        setFontsLoaded(true); // Timeout après 3 secondes
      }, 3000);
      
      Promise.all([
        ppFont.load().then(f => document.fonts.add(f)).catch(() => {}),
        interFont400.load().then(f => document.fonts.add(f)).catch(() => {}),
        interFont500.load().then(f => document.fonts.add(f)).catch(() => {}),
        interFont600.load().then(f => document.fonts.add(f)).catch(() => {})
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
                  button.style.fontFamily = 'Inter, sans-serif';
                  void button.offsetWidth;
                });
                
                const paragraphs = document.querySelectorAll('p');
                paragraphs.forEach(p => {
                  p.style.fontFamily = 'sans-serif';
                  void p.offsetWidth;
                  p.style.fontFamily = 'Inter, sans-serif';
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
      // Se connecter
      const response = await fetch('/api/accounts/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la connexion');
      }

      const data = await response.json();

      // Rediriger vers l'admin du sous-domaine
      const adminUrl = `https://${data.account.subdomain}.${rootDomain}/admin`;
      router.push(adminUrl);
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
            fontFamily: '"PP Neue Machina Inktrap Ultrabold Italic", "PP Neue Machina Inktrap Ultrabold Italic Placeholder", sans-serif',
            fontWeight: '400',
            letterSpacing: '-2.32px',
            textTransform: 'uppercase',
            color: '#8eff36',
            fontStyle: 'normal',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
          }}
        >
          Log In
        </h1>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px',
              fontWeight: '500',
              color: '#ffffff',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
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
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#ffffff';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#333333';
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px',
              fontWeight: '500',
              color: '#ffffff',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#1a1a1a',
                border: '1px solid #333333',
                borderRadius: '4px',
                fontSize: '14px',
                color: '#ffffff',
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#ffffff';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#333333';
              }}
            />
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
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            style={{
              width: '100%',
              padding: '14px 24px',
              backgroundColor: loading || !email || !password ? '#333333' : '#ffffff',
              color: loading || !email || !password ? '#a0a0a0' : '#000000',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
              marginBottom: '16px',
              transition: 'background-color 0.2s',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
            }}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div style={{
          borderTop: '1px solid #333333',
          paddingTop: '16px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '14px', color: '#a0a0a0', marginBottom: '8px', fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif' }}>
            Don&apos;t have an account?
          </p>
          <a href="/signup" style={{ color: '#ffffff', textDecoration: 'none', fontWeight: '500', fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif' }}>
            Sign Up
          </a>
        </div>
      </div>
    </div>
  );
}

