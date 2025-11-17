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
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [subdomain, setSubdomain] = useState('');
  const [isRootDomain, setIsRootDomain] = useState(false);

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'eyesberg.app';

  // Forcer le chargement des fonts avant d'afficher + lire les query params (email, created)
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Détecter si on est sur le domaine racine ou un sous-domaine
      const host = window.location.host;
      const hostWithoutPort = host.split(':')[0];
      
      // Vérifier si c'est le domaine racine (www.eyesberg.app, eyesberg.app, ou localhost sans sous-domaine)
      const isRoot = 
        hostWithoutPort === rootDomain ||
        hostWithoutPort === `www.${rootDomain}` ||
        hostWithoutPort === 'localhost' ||
        hostWithoutPort === '127.0.0.1' ||
        (!hostWithoutPort.includes('.') && hostWithoutPort !== rootDomain.split('.')[0]);
      
      setIsRootDomain(isRoot);
      
      // Si on est sur un sous-domaine, charger les query params
      if (!isRoot) {
        const params = new URLSearchParams(window.location.search);
        const emailParam = params.get('email');
        const created = params.get('created');
        const verified = params.get('verified');
        const passwordReset = params.get('password_reset');
        
        if (emailParam) {
          setEmail(emailParam);
        }
        if (created) {
          setInfo(
            'Your account is ready 🎉 Check your inbox for a verification email, confirm it, then sign in.',
          );
        }
        if (verified === '1') {
          setInfo('Email verified successfully! You can now sign in with your password.');
        }
        if (passwordReset === '1') {
          setInfo('Your password has been reset successfully! You can now sign in with your new password.');
        }
      }
    }
    
    if (typeof window !== 'undefined' && document.fonts) {
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

  const handleSubdomainSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subdomain || subdomain.trim() === '') {
      setError('Please enter your brandname');
      return;
    }
    
    // Valider le format du subdomain
    if (!subdomain.match(/^[a-z0-9-]+$/)) {
      setError('Brandname can only contain lowercase letters, numbers, and hyphens.');
      return;
    }
    
    // Rediriger vers le login du sous-domaine
    window.location.href = `https://${subdomain.toLowerCase()}.${rootDomain}/login`;
  };

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

      // Rediriger vers l'admin avec rechargement complet pour que le cookie soit disponible
      // Utiliser window.location au lieu de router.push pour forcer un rechargement
      window.location.href = '/admin';
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

  // Si on est sur le domaine racine, afficher le formulaire de sélection de subdomain
  if (isRootDomain) {
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
          maxWidth: '500px',
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
            Log in
          </h1>

          <form onSubmit={handleSubdomainSubmit}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px',
                fontWeight: '500',
                color: '#ffffff',
                fontFamily: 'Inter, sans-serif',
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
              }}>
                Your customizer url
              </label>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                backgroundColor: '#1a1a1a',
                border: '1px solid #333333',
                borderRadius: '4px',
                padding: '0',
                overflow: 'hidden',
              }}>
                <input
                  type="text"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="brandname"
                  required
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '14px',
                    color: '#ffffff',
                    fontFamily: 'Inter, sans-serif',
                    WebkitFontSmoothing: 'antialiased',
                    MozOsxFontSmoothing: 'grayscale',
                    outline: 'none',
                  }}
                />
                <span style={{
                  padding: '12px 16px',
                  fontSize: '14px',
                  color: '#a0a0a0',
                  fontFamily: 'Inter, sans-serif',
                  borderLeft: '1px solid #333333',
                }}>
                  .{rootDomain}
                </span>
              </div>
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
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!subdomain || subdomain.trim() === ''}
              style={{
                width: '100%',
                padding: '14px 24px',
                backgroundColor: !subdomain || subdomain.trim() === '' ? '#333333' : '#8eff36',
                color: !subdomain || subdomain.trim() === '' ? '#a0a0a0' : 'rgb(10, 10, 10)',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: !subdomain || subdomain.trim() === '' ? 'not-allowed' : 'pointer',
                marginBottom: '16px',
                transition: 'background-color 0.2s',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Next
            </button>
          </form>

          <div style={{
            borderTop: '1px solid #333333',
            paddingTop: '16px',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '14px', color: '#a0a0a0', marginBottom: '8px', fontFamily: 'Inter, sans-serif' }}>
              Don&apos;t have an Eyesberg account?{' '}
              <a href="/signup" style={{ color: '#8eff36', textDecoration: 'none', fontWeight: '500', fontFamily: 'Inter, sans-serif' }}>
                Get started
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Si on est sur un sous-domaine, afficher le formulaire de login normal
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
              fontFamily: 'Inter, sans-serif',
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
                fontFamily: 'Inter, sans-serif',
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
              fontFamily: 'Inter, sans-serif',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
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
                style={{
                  width: '100%',
                  padding: '12px 48px 12px 16px',
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333333',
                  borderRadius: '4px',
                  fontSize: '14px',
                  color: '#ffffff',
                  fontFamily: 'Inter, sans-serif',
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

          <div style={{ marginBottom: '16px', textAlign: 'right' }}>
            <a 
              href="/forgot-password"
              style={{
                fontSize: '14px',
                color: '#8eff36',
                textDecoration: 'none',
                fontFamily: 'var(--stepn-font-body)',
              }}
            >
              Forgot password?
            </a>
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
              backgroundColor:
                loading || !email || !password ? '#333333' : '#8eff36',
              color: loading || !email || !password ? '#a0a0a0' : 'rgb(10, 10, 10)',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
              marginBottom: '16px',
              transition: 'background-color 0.2s',
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
          {info && (
            <div
              style={{
                padding: '12px',
                backgroundColor: '#1a1a1a',
                border: '1px solid #4ade80',
                color: '#8eff36',
                borderRadius: '4px',
                marginBottom: '16px',
                fontSize: '14px',
              }}
            >
              {info}
            </div>
          )}
          <p style={{ fontSize: '14px', color: '#a0a0a0', marginBottom: '8px', fontFamily: 'Inter, sans-serif' }}>
            Don&apos;t have an account?
          </p>
          <a href="/signup" style={{ color: '#ffffff', textDecoration: 'none', fontWeight: '500', fontFamily: 'Inter, sans-serif' }}>
            Sign Up
          </a>
        </div>
      </div>
    </div>
  );
}

