'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/**
 * Page pour réinitialiser le mot de passe avec un token
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState<string>('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    // Extract token from URL
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tokenParam = params.get('token');
      if (tokenParam) {
        setToken(tokenParam);
      } else {
        setError('Invalid or missing reset token');
      }
    }

    // Load fonts
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

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/accounts/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setSuccess(true);
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login?password_reset=1');
      }, 2000);
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

  if (success) {
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
          textAlign: 'center',
        }}>
          <h1 
            className="stepn-title-ultrabold"
            style={{ 
              fontSize: '48px', 
              marginBottom: '24px',
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
            Password Reset
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#8eff36',
            marginBottom: '24px',
            fontFamily: 'var(--stepn-font-body)',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
          }}>
            Your password has been reset successfully!
          </p>
          <p style={{
            fontSize: '14px',
            color: '#a0a0a0',
            fontFamily: 'var(--stepn-font-body)',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
          }}>
            Redirecting to login...
          </p>
        </div>
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

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
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
              New Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
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
                  fontFamily: 'var(--stepn-font-body)',
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
                  fontFamily: 'var(--stepn-font-body)',
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
              fontFamily: 'var(--stepn-font-body)',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
            }}>
              Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
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
                  fontFamily: 'var(--stepn-font-body)',
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
                onClick={() => setShowConfirmPassword((prev) => !prev)}
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
                  fontFamily: 'var(--stepn-font-body)',
                }}
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
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
              fontFamily: 'var(--stepn-font-body)',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password || !confirmPassword || !token}
            style={{
              width: '100%',
              padding: '14px 24px',
              backgroundColor: loading || !password || !confirmPassword || !token ? '#333333' : '#8eff36',
              color: loading || !password || !confirmPassword || !token ? '#a0a0a0' : 'rgb(10, 10, 10)',
              border: 'none',
              borderRadius: '44px',
              fontSize: '16px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: loading || !password || !confirmPassword || !token ? 'not-allowed' : 'pointer',
              marginBottom: '16px',
              transition: 'background-color 0.2s',
              fontFamily: 'var(--stepn-font-body)',
            }}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
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
      </div>
    </div>
  );
}


