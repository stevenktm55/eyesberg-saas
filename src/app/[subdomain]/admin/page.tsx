'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Style pour forcer la couleur exacte du bouton
const buttonStyle = `
  .connect-shopify-btn {
    background-color: rgb(0, 255, 136) !important;
    color: #000000 !important;
    border: none !important;
    opacity: 1 !important;
  }
  .connect-shopify-btn:hover {
    background-color: rgb(0, 255, 136) !important;
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
 * Page admin accessible via sous-domaine
 * Exemple : stretchmx.gokickflip.com/admin
 */
export default function SubdomainAdminPage() {
  const router = useRouter();
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
      setError('Sous-domaine non détecté');
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
          throw new Error(errorData.error || `Erreur ${response.status}: ${response.statusText}`);
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
        console.error('❌ Erreur loadShopData:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    }

    loadShopData();
  }, []);

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
            border: '3px solid rgb(0, 255, 136)', 
            borderTop: '3px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#ffffff', fontFamily: 'var(--stepn-font-body)' }}>Chargement...</p>
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

  const handleConnectShopify = () => {
    if (!subdomain) {
      alert('Sous-domaine non détecté. Veuillez accéder à l\'admin via votre sous-domaine.');
      return;
    }
    
    // Demander le domaine Shopify à l'utilisateur
    const shopDomain = prompt('Entrez votre domaine Shopify (ex: votreboutique.myshopify.com):');
    if (!shopDomain) return;
    
    // Valider le format
    if (!shopDomain.match(/^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/)) {
      alert('Format invalide. Utilisez: votreboutique.myshopify.com');
      return;
    }
    
    // Rediriger vers le flow OAuth
    window.location.href = `/api/shopify/install?shop=${encodeURIComponent(shopDomain)}`;
  };

  const handleSyncProducts = async () => {
    if (!shopData) return;
    try {
      const response = await fetch(`/api/shopify/products/sync?shop=${shopData.shop_domain}`, {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        alert(`Synchronisation terminée: ${data.result.synced} nouveaux, ${data.result.updated} mis à jour`);
      } else {
        throw new Error('Erreur lors de la synchronisation');
      }
    } catch (error) {
      alert('Erreur lors de la synchronisation: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    }
  };

  if (error || !shopData) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: buttonStyle }} />
        <div style={{ 
          minHeight: '100vh', 
          backgroundColor: '#000000', 
          padding: '40px 20px',
          fontFamily: 'var(--stepn-font-body), sans-serif'
        }}>
          <div style={{ 
            maxWidth: '600px', 
            margin: '0 auto',
            backgroundColor: '#0a0a0a',
            padding: '32px',
            borderRadius: '8px',
            border: '1px solid #1a1a1a'
          }}>
            <h1 className="stepn-title-ultrabold" style={{ 
              color: 'rgb(0, 255, 136)', 
              fontSize: '32px', 
              marginBottom: '16px',
              fontFamily: 'PP Neue Machina Inktrap Ultrabold Italic, sans-serif'
            }}>
              {error ? 'Erreur' : 'Boutique non connectée'}
            </h1>
            <p style={{ 
              color: '#ffffff', 
              marginBottom: '24px',
              fontFamily: 'var(--stepn-font-body)',
              lineHeight: '1.6'
            }}>
              {error || 'Aucune boutique Shopify n\'est connectée à ce compte.'}
            </p>
            {subdomain && !error && (
              <button
                onClick={handleConnectShopify}
                className="connect-shopify-btn"
                style={{
                  backgroundColor: 'rgb(0, 255, 136)',
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
                  e.currentTarget.style.backgroundColor = 'rgb(0, 255, 136)';
                  e.currentTarget.style.opacity = '1';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgb(0, 255, 136)';
                  e.currentTarget.style.opacity = '1';
                }}
              >
                Connecter ma boutique Shopify
              </button>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: buttonStyle }} />
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#000000', 
        padding: '40px 20px',
        fontFamily: 'var(--stepn-font-body), sans-serif'
      }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          <h1 className="stepn-title-ultrabold" style={{ 
            color: 'rgb(0, 255, 136)', 
            fontSize: '48px',
            fontFamily: 'PP Neue Machina Inktrap Ultrabold Italic, sans-serif',
            margin: 0
          }}>
            Dashboard
          </h1>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => router.push(`/products?shop=${shopData.shop_domain}`)}
              style={{
                backgroundColor: 'rgb(0, 255, 136)',
                color: '#000000',
                border: 'none',
                padding: '12px 24px',
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
              Voir les produits
            </button>
            <button
              onClick={handleSyncProducts}
              style={{
                backgroundColor: 'transparent',
                color: 'rgb(0, 255, 136)',
                border: '1px solid rgb(0, 255, 136)',
                padding: '12px 24px',
                borderRadius: '4px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                fontFamily: 'var(--stepn-font-body)',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'rgb(0, 255, 136)';
                e.currentTarget.style.color = '#000000';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'rgb(0, 255, 136)';
              }}
            >
              Synchroniser les produits
            </button>
          </div>
        </div>

        <div style={{ 
          backgroundColor: '#0a0a0a',
          padding: '32px',
          borderRadius: '8px',
          border: '1px solid #1a1a1a'
        }}>
          <h2 style={{ 
            color: '#ffffff', 
            fontSize: '24px', 
            marginBottom: '24px',
            fontFamily: 'PP Neue Machina Inktrap Ultrabold Italic, sans-serif'
          }}>
            Bienvenue sur votre dashboard
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <span style={{ color: '#a0a0a0', fontFamily: 'var(--stepn-font-body)' }}>Boutique : </span>
              <span style={{ color: '#ffffff', fontFamily: 'var(--stepn-font-body)' }}>
                {shopData.shop_name || shopData.shop_domain}
              </span>
            </div>
            <div>
              <span style={{ color: '#a0a0a0', fontFamily: 'var(--stepn-font-body)' }}>Domaine : </span>
              <span style={{ color: '#ffffff', fontFamily: 'var(--stepn-font-body)' }}>
                {shopData.shop_domain}
              </span>
            </div>
            {shopData.shop_email && (
              <div>
                <span style={{ color: '#a0a0a0', fontFamily: 'var(--stepn-font-body)' }}>Email : </span>
                <span style={{ color: '#ffffff', fontFamily: 'var(--stepn-font-body)' }}>
                  {shopData.shop_email}
                </span>
              </div>
            )}
            {subdomain && (
              <div>
                <span style={{ color: '#a0a0a0', fontFamily: 'var(--stepn-font-body)' }}>Sous-domaine : </span>
                <span style={{ color: '#ffffff', fontFamily: 'var(--stepn-font-body)' }}>
                  {subdomain}.{process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'eyesberg.app'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

