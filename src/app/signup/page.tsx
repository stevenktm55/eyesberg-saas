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
      backgroundColor: '#f5f5f5',
      padding: '20px',
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px',
      }}>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          marginBottom: '24px',
          textAlign: 'center',
        }}>
          Create your Kickflip account
        </h1>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px',
              fontWeight: '500',
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
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px',
              fontWeight: '500',
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
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px',
              fontWeight: '500',
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
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRight: 'none',
                  borderTopLeftRadius: '4px',
                  borderBottomLeftRadius: '4px',
                  fontSize: '14px',
                }}
              />
              <span style={{
                padding: '12px',
                border: '1px solid #ddd',
                borderLeft: 'none',
                borderTopRightRadius: '4px',
                borderBottomRightRadius: '4px',
                backgroundColor: '#f9f9f9',
                fontSize: '14px',
                color: '#666',
              }}>
                .{rootDomain}
              </span>
            </div>
            <p style={{ 
              fontSize: '12px', 
              color: '#666', 
              marginTop: '4px',
            }}>
              Votre admin sera accessible sur : <strong>{subdomain || 'brandname'}.{rootDomain}/admin</strong>
            </p>
          </div>

          {error && (
            <div style={{
              padding: '12px',
              backgroundColor: '#fee',
              color: '#c33',
              borderRadius: '4px',
              marginBottom: '16px',
              fontSize: '14px',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password || !subdomain}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: loading || !email || !password || !subdomain ? '#ccc' : '#0066cc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: loading || !email || !password || !subdomain ? 'not-allowed' : 'pointer',
              marginBottom: '16px',
            }}
          >
            {loading ? 'Creating account...' : 'Start free trial'}
          </button>
        </form>

        <p style={{ 
          fontSize: '12px', 
          color: '#666', 
          textAlign: 'center',
          marginBottom: '16px',
        }}>
          By clicking &quot;Start free trial&quot; you agree to our{' '}
          <a href="/terms" style={{ color: '#0066cc' }}>Terms</a>
          {' '}and{' '}
          <a href="/privacy" style={{ color: '#0066cc' }}>Privacy policy</a>
        </p>

        <div style={{
          borderTop: '1px solid #eee',
          paddingTop: '16px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
            Already have an account?
          </p>
          <a href="/login" style={{ color: '#0066cc', textDecoration: 'none' }}>
            Log In
          </a>
        </div>
      </div>
    </div>
  );
}

