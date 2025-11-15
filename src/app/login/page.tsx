'use client';

import { useState } from 'react';
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
          fontFamily: '"PP Neue Machina Inktrap Ultrabold Italic", "PP Neue Machina Inktrap Ultrabold Italic Placeholder", sans-serif',
          letterSpacing: '-2.32px',
          marginBottom: '32px',
          textAlign: 'center',
          color: '#8eff36',
          textTransform: 'uppercase',
        }}>
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
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
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
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
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
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
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
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
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
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
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
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
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

