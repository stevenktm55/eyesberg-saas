'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import AdminSidebar from '@/components/AdminSidebar';

// Style pour forcer la couleur exacte du bouton et des titres
const buttonStyle = `
  .connect-shopify-btn {
    background-color: #8eff36 !important;
    color: #000000 !important;
    border: none !important;
    opacity: 1 !important;
  }
  .connect-shopify-btn:hover {
    background-color: #8eff36 !important;
    opacity: 1 !important;
  }
`;

interface ShopData {
  id: string;
  shop_domain: string;
  shop_name: string | null;
  shop_email: string | null;
  installed_at: string | null;
  scopes: string | null;
}

/**
 * Page admin accessible via sous-domaine avec sidebar
 */
export default function SubdomainAdminPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [shopData, setShopData] = useState<ShopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subdomain, setSubdomain] = useState<string | null>(null);

  useEffect(() => {
    // Récupérer le sous-domaine depuis le host
    const host = window.location.host;
    const subdomainMatch = host.match(/^([^.]+)\./);
    const detectedSubdomain = subdomainMatch ? subdomainMatch[1] : null;
    
    setSubdomain(detectedSubdomain);

    if (!detectedSubdomain) {
      setError('Subdomain not detected');
      setLoading(false);
      return;
    }

    // Charger les données de la boutique associée à ce sous-domaine
    async function loadShopData() {
      try {
        const response = await fetch(`/api/accounts/shop?subdomain=${detectedSubdomain}`);
        
        // Si 404, c'est normal - il n'y a juste pas de boutique connectée
        if (response.status === 404) {
          setShopData(null);
          setError(null);
          setLoading(false);
          return;
        }
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        if (!data.shop) {
          // Pas de boutique connectée, ce n'est pas une erreur
          setShopData(null);
          setError(null);
        } else {
          setShopData(data.shop);
          setError(null);
        }
      } catch (err) {
        console.error('Error loadShopData:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    loadShopData();
  }, []);

  const handleConnectShopify = () => {
    if (!subdomain) {
      alert('Subdomain not detected. Please access the admin via your subdomain.');
      return;
    }
    
    // Ask user for Shopify domain
    const shopDomain = prompt('Enter your Shopify domain (e.g., yourstore.myshopify.com):');
    if (!shopDomain) return;
    
    // Validate format
    if (!shopDomain.match(/^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/)) {
      alert('Invalid format. Use: yourstore.myshopify.com');
      return;
    }
    
    // Rediriger vers le flow OAuth
    window.location.href = `/api/shopify/install?shop=${encodeURIComponent(shopDomain)}`;
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#000000', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: 'var(--stepn-font-body), sans-serif'
      }}>
        <div style={{ textAlign: 'center', color: '#ffffff' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '3px solid #8eff36', 
            borderTop: '3px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#ffffff', fontFamily: 'var(--stepn-font-body)' }}>Loading...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: buttonStyle }} />
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#000000',
        display: 'flex',
        fontFamily: 'var(--stepn-font-body), sans-serif'
      }}>
        <AdminSidebar />

        {/* Main Content */}
        <main style={{
          flex: 1,
          marginLeft: '240px',
          padding: '40px',
          overflow: 'auto'
        }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            {/* Si pas de boutique connectée, afficher le message de connexion */}
            {error || !shopData ? (
              <div style={{ 
                maxWidth: '600px', 
                margin: '0 auto',
                backgroundColor: '#0a0a0a',
                padding: '32px',
                borderRadius: '8px',
                border: '1px solid #1a1a1a'
              }}>
                <h1 className="stepn-title-ultrabold" style={{ 
                  color: '#8eff36', 
                  fontSize: '32px', 
                  marginBottom: '16px',
                  fontFamily: 'PP Neue Machina Inktrap Ultrabold Italic, sans-serif'
                }}>
                  {error ? 'Error' : 'No store connected'}
                </h1>
                <p style={{ 
                  color: '#ffffff', 
                  marginBottom: '24px',
                  fontFamily: 'var(--stepn-font-body)',
                  lineHeight: '1.6'
                }}>
                  {error || 'No Shopify store is connected to this account.'}
                </p>
                {subdomain && !error && (
                  <button
                    onClick={handleConnectShopify}
                    className="connect-shopify-btn"
                    style={{
                      backgroundColor: '#8eff36',
                      color: '#000000',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '4px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontFamily: 'var(--stepn-font-body)',
                      transition: 'background-color 0.2s',
                      opacity: 1
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#8eff36';
                      e.currentTarget.style.opacity = '1';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#8eff36';
                      e.currentTarget.style.opacity = '1';
                    }}
                  >
                    Connect my Shopify store
                  </button>
                )}
              </div>
            ) : (
              <>
                <h1 className="stepn-title-ultrabold" style={{ 
                  color: '#8eff36', 
                  fontSize: '48px',
                  fontFamily: 'PP Neue Machina Inktrap Ultrabold Italic, sans-serif',
                  marginBottom: '32px'
                }}>
                  My Products
                </h1>

            {/* Tabs */}
            <div style={{ 
              display: 'flex', 
              gap: '24px', 
              marginBottom: '32px',
              borderBottom: '1px solid #1a1a1a'
            }}>
              <button
                style={{
                  padding: '12px 0',
                  backgroundColor: 'transparent',
                  color: '#8eff36',
                  border: 'none',
                  borderBottom: '2px solid #8eff36',
                  fontSize: '16px',
                  cursor: 'pointer',
                  fontFamily: 'var(--stepn-font-body)',
                  fontWeight: '600'
                }}
              >
                Active
              </button>
              <button
                style={{
                  padding: '12px 0',
                  backgroundColor: 'transparent',
                  color: '#a0a0a0',
                  border: 'none',
                  borderBottom: '2px solid transparent',
                  fontSize: '16px',
                  cursor: 'pointer',
                  fontFamily: 'var(--stepn-font-body)',
                  fontWeight: '600'
                }}
              >
                Archived
              </button>
            </div>

            {/* Search and Actions */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '32px'
            }}>
              <div style={{ display: 'flex', gap: '12px', flex: 1, maxWidth: '400px' }}>
                <input
                  type="text"
                  placeholder="Q Product"
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #1a1a1a',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '16px',
                    fontFamily: 'var(--stepn-font-body)',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#8eff36'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#1a1a1a'}
                />
                <select
                  style={{
                    padding: '12px 16px',
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #1a1a1a',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '16px',
                    fontFamily: 'var(--stepn-font-body)',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="">Sort</option>
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="name">Name</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  style={{
                    padding: '12px 24px',
                    backgroundColor: 'transparent',
                    color: '#ffffff',
                    border: '1px solid #1a1a1a',
                    borderRadius: '4px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    fontFamily: 'var(--stepn-font-body)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#8eff36';
                    e.currentTarget.style.color = '#8eff36';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#1a1a1a';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                >
                  View demos
                </button>
                <button
                  onClick={() => shopData && router.push(`/products?shop=${shopData.shop_domain}`)}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#8eff36',
                    color: '#000000',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontFamily: 'var(--stepn-font-body)',
                    transition: 'opacity 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
                  onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                >
                  + Product
                </button>
              </div>
            </div>

            {/* Products Grid - Placeholder */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '24px'
            }}>
              <div style={{
                backgroundColor: '#0a0a0a',
                borderRadius: '8px',
                padding: '16px',
                border: '1px solid #1a1a1a',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '100%',
                  aspectRatio: '1',
                  backgroundColor: '#1a1a1a',
                  borderRadius: '4px',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#a0a0a0',
                  fontSize: '48px'
                }}>
                  +
                </div>
                <p style={{
                  color: '#ffffff',
                  fontFamily: 'var(--stepn-font-body)',
                  fontSize: '14px',
                  marginBottom: '8px'
                }}>
                  No products yet
                </p>
                <p style={{
                  color: '#a0a0a0',
                  fontFamily: 'var(--stepn-font-body)',
                  fontSize: '12px'
                }}>
                  Create your first product
                </p>
              </div>
            </div>
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
