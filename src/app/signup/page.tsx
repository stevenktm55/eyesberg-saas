'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Page d'inscription avec choix de sous-domaine
 * Comme Kickflip : https://stretchmx.gokickflip.com/admin/login
 */
export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ⚠️ IMPORTANT : Configure NEXT_PUBLIC_ROOT_DOMAIN dans .env.local
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'ton-domaine.com';

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

      // Rediriger vers l'admin du sous-domaine
      const adminUrl = `https://${subdomain}.${rootDomain}/admin`;
      router.push(adminUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setLoading(false);
    }
  };

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
        <h1 style={{ 
          fontSize: '48px', 
          fontWeight: '400',
          fontFamily: 'PP Neue Machina Inktrap Ultrabold Italic, PP Neue Machina Inktrap Ultrabold Italic Placeholder, sans-serif',
          letterSpacing: '-2.32px',
          marginBottom: '32px',
          textAlign: 'center',
          color: '#8eff36',
          textTransform: 'uppercase',
        }}>
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
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              minLength={8}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#1a1a1a',
                border: '1px solid #333333',
                borderRadius: '4px',
                fontSize: '14px',
                color: '#ffffff',
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}>
                .{rootDomain}
              </span>
            </div>
            <p style={{ 
              fontSize: '12px', 
              color: '#a0a0a0', 
              marginTop: '8px',
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}>
              Your admin will be accessible at: <strong style={{ color: '#ffffff', fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif' }}>{subdomain || 'brandname'}.{rootDomain}/admin</strong>
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
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
              backgroundColor: loading || !email || !password || !subdomain ? '#333333' : '#ffffff',
              color: loading || !email || !password || !subdomain ? '#a0a0a0' : '#000000',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: loading || !email || !password || !subdomain ? 'not-allowed' : 'pointer',
              marginBottom: '16px',
              transition: 'background-color 0.2s',
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
        }}>
          By clicking &quot;Start free trial&quot; you agree to our{' '}
          <a href="/terms" style={{ color: '#ffffff', fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif' }}>Terms</a>
          {' '}and{' '}
          <a href="/privacy" style={{ color: '#ffffff', fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif' }}>Privacy policy</a>
        </p>

        <div style={{
          borderTop: '1px solid #333333',
          paddingTop: '16px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '14px', color: '#a0a0a0', marginBottom: '8px', fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif' }}>
            Already have an account?
          </p>
          <a href="/login" style={{ color: '#ffffff', textDecoration: 'none', fontWeight: '500', fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif' }}>
            Log In
          </a>
        </div>
      </div>
    </div>
  );
}

