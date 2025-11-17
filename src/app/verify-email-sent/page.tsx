'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Page displayed after signup to remind the user to verify their email.
 */
export default function VerifyEmailSentPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [subdomain, setSubdomain] = useState<string>('');
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    // Manually parse URL for search params to avoid useSearchParams in SSR
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    const brandParam = urlParams.get('brand');

    if (emailParam) {
      setEmail(emailParam);
    }
    if (brandParam) {
      setSubdomain(brandParam);
    }

    // Charger les fonts
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

  const handleResendEmail = async () => {
    if (!email || !subdomain) return;
    
    setResending(true);
    setResendSuccess(false);
    
    try {
      const response = await fetch('/api/accounts/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 5000);
      } else {
        const data = await response.json();
        alert(data.error || 'Erreur lors de l\'envoi de l\'email');
      }
    } catch (err) {
      alert('Erreur lors de l\'envoi de l\'email');
    } finally {
      setResending(false);
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

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'eyesberg.app';

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
        textAlign: 'center',
      }}>
        <h1
          className="stepn-title-ultrabold"
          style={{
            fontSize: '48px',
            marginBottom: '24px',
            textAlign: 'center',
            fontFamily:
              '"PP Neue Machina Inktrap Ultrabold Italic", "PP Neue Machina Inktrap Ultrabold Italic Placeholder", sans-serif',
            fontWeight: '400',
            letterSpacing: '-2.32px',
            textTransform: 'uppercase',
            color: '#8eff36',
            fontStyle: 'normal',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
          }}
        >
          Check your email
        </h1>

        <div style={{
          marginBottom: '32px',
        }}>
          <p
            style={{
              fontSize: '16px',
              color: '#ffffff',
              fontFamily: 'var(--stepn-font-body)',
              marginBottom: '16px',
              lineHeight: '1.6',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
            }}
          >
            We just sent a verification email to
          </p>
          <p style={{
            fontSize: '18px',
            color: '#8eff36',
            fontFamily: 'var(--stepn-font-body)',
            fontWeight: '600',
            marginBottom: '24px',
            wordBreak: 'break-word',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
          }}>
            {email || 'ton adresse email'}
          </p>
          <p
            style={{
              fontSize: '14px',
              color: '#a0a0a0',
              fontFamily: 'var(--stepn-font-body)',
              lineHeight: '1.6',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
            }}
          >
            Click the link in that email to activate your account and access{' '}
            <strong style={{ color: '#ffffff' }}>
              {subdomain || 'your brand'}.{rootDomain}/admin
            </strong>
          </p>
        </div>

        {resendSuccess && (
          <div
            style={{
              padding: '12px',
              backgroundColor: '#1a1a1a',
              border: '1px solid #8eff36',
              color: '#8eff36',
              borderRadius: '4px',
              marginBottom: '16px',
              fontSize: '14px',
              fontFamily: 'var(--stepn-font-body)',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
            }}
          >
            Email sent again! Check your inbox (and spam folder).
          </div>
        )}

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <button
            onClick={handleResendEmail}
            disabled={resending || !email}
            style={{
              width: '100%',
              padding: '14px 24px',
              backgroundColor: resending || !email ? '#333333' : '#ffffff',
              color: resending || !email ? '#a0a0a0' : 'rgb(10, 10, 10)',
              border: 'none',
              borderRadius: '44px',
              fontSize: '16px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: resending || !email ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
              fontFamily: 'var(--stepn-font-body)',
            }}
          >
            {resending ? 'Sending...' : 'Resend email'}
          </button>

          <button
            onClick={() => router.push(`/login?email=${encodeURIComponent(email)}`)}
            style={{
              width: '100%',
              padding: '14px 24px',
              backgroundColor: 'transparent',
              color: '#ffffff',
              border: '1px solid #333333',
              borderRadius: '44px',
              fontSize: '16px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
              fontFamily: 'var(--stepn-font-body)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#8eff36';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#333333';
            }}
          >
            Go to login
          </button>
        </div>

        <div
          style={{
            marginTop: '32px',
            paddingTop: '24px',
            borderTop: '1px solid #333333',
          }}
        >
          <p
            style={{
              fontSize: '12px',
              color: '#a0a0a0',
              fontFamily: 'var(--stepn-font-body)',
              lineHeight: '1.5',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
            }}
          >
            Didn’t get it? Check your spam folder or{' '}
            <button
              onClick={handleResendEmail}
              disabled={resending}
              style={{
                background: 'none',
                border: 'none',
                color: '#8eff36',
                textDecoration: 'underline',
                cursor: resending ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--stepn-font-body)',
                fontSize: '12px',
                padding: 0,
              }}
            >
              send it again
            </button>
            .
          </p>
        </div>
      </div>
    </div>
  );
}


