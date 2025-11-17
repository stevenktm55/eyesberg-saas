'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

/**
 * Page pour demander la réinitialisation du mot de passe
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    if (document.fonts) {
      const ppFont = new FontFace(
        'PP Neue Machina Inktrap Ultrabold Italic',
        'url(/fonts/pp-neue-machina-ultrabold-italic.woff2) format("woff2")'
      );
      
      const interFont = new FontFace(
        'Inter',
        'url(/fonts/inter-regular.woff2) format("woff2")',
        { weight: '400' }
      );
      
      const timeout = setTimeout(() => {
        setFontsLoaded(true);
      }, 3000);
      
      Promise.all([
        ppFont.load().then(f => document.fonts.add(f)).catch(() => {}),
        interFont.load().then(f => document.fonts.add(f)).catch(() => {
          const interFontFallback = new FontFace(
            'Inter',
            'url(https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7W0Q5nw.woff2) format("woff2")',
            { weight: '400' }
          );
          return interFontFallback.load().then(f => document.fonts.add(f));
        })
      ]).then(() => {
        clearTimeout(timeout);
        const ppLoaded = document.fonts.check('48px "PP Neue Machina Inktrap Ultrabold Italic"');
        const interLoaded = document.fonts.check('16px Inter');
        
        if (ppLoaded && interLoaded) {
          setTimeout(() => {
            setFontsLoaded(true);
          }, 100);
        } else {
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
    setSuccess(false);

    try {
      const response = await fetch('/api/accounts/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send password reset email');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
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
          Reset Password
        </h1>

        {success ? (
          <div>
            <div style={{
              padding: '12px',
              backgroundColor: '#1a1a1a',
              border: '1px solid #8eff36',
              color: '#8eff36',
              borderRadius: '4px',
              marginBottom: '24px',
              fontSize: '14px',
              fontFamily: 'var(--stepn-font-body)',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
            }}>
              If an account with that email exists, we've sent you a password reset link. Please check your inbox.
            </div>
            <Link 
              href="/login"
              style={{
                display: 'block',
                textAlign: 'center',
                color: '#ffffff',
                textDecoration: 'none',
                fontWeight: '500',
                fontFamily: 'var(--stepn-font-body)',
              }}
            >
              Back to login
            </Link>
          </div>
        ) : (
          <>
            <p style={{
              fontSize: '14px',
              color: '#a0a0a0',
              marginBottom: '24px',
              textAlign: 'center',
              fontFamily: 'var(--stepn-font-body)',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
            }}>
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#ffffff',
                  fontFamily: 'var(--stepn-font-body)',
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
                    fontFamily: 'var(--stepn-font-body)',
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
                  fontFamily: 'var(--stepn-font-body)',
                  WebkitFontSmoothing: 'antialiased',
                  MozOsxFontSmoothing: 'grayscale',
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  backgroundColor: loading || !email ? '#333333' : '#8eff36',
                  color: loading || !email ? '#a0a0a0' : 'rgb(10, 10, 10)',
                  border: 'none',
                  borderRadius: '44px',
                  fontSize: '16px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: loading || !email ? 'not-allowed' : 'pointer',
                  marginBottom: '16px',
                  transition: 'background-color 0.2s',
                  fontFamily: 'var(--stepn-font-body)',
                }}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <div style={{
              borderTop: '1px solid #333333',
              paddingTop: '16px',
              textAlign: 'center',
            }}>
              <Link 
                href="/login"
                style={{
                  color: '#ffffff',
                  textDecoration: 'none',
                  fontWeight: '500',
                  fontFamily: 'var(--stepn-font-body)',
                }}
              >
                Back to login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


