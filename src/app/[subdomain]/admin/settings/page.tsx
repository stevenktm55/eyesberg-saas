'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface ShopData {
  id: string;
  shop_domain: string;
  shop_name: string | null;
  shop_email: string | null;
  installed_at: string | null;
  scopes: string | null;
}

export default function SettingsPage() {
  const pathname = usePathname();
  const [shopData, setShopData] = useState<ShopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showPlatformModal, setShowPlatformModal] = useState(false);

  useEffect(() => {
    // Vérifier si on vient d'une installation réussie ou d'une erreur
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('installed') === '1') {
      setShowSuccessMessage(true);
      // Nettoyer l'URL
      window.history.replaceState({}, '', window.location.pathname);
      // Masquer le message après 5 secondes
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }
    
    // Vérifier les erreurs
    const error = urlParams.get('error');
    if (error === 'missing_scopes') {
      const missing = urlParams.get('missing') || 'read_orders';
      const errorMessage = `Missing required permissions: ${missing}.\n\nTo fix this:\n1. Go to your Shopify Admin\n2. Navigate to Settings > Apps and sales channels\n3. Find "Eyesberg" app and click "Uninstall"\n4. Come back here and click "+ Online store" to reinstall with the correct permissions.`;
      alert(errorMessage);
      window.history.replaceState({}, '', window.location.pathname);
    }

    async function loadShopData() {
      try {
        const host = window.location.host;
        const subdomainMatch = host.match(/^([^.]+)\./);
        const detectedSubdomain = subdomainMatch ? subdomainMatch[1] : null;
        
        if (!detectedSubdomain) {
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/accounts/shop?subdomain=${detectedSubdomain}`);
        if (response.status === 404) {
          setShopData(null);
          setLoading(false);
          return;
        }
        
        if (response.ok) {
          const data = await response.json();
          // Vérifier si la boutique a un access_token (est vraiment installée)
          if (data.shop && data.shop.access_token) {
            setShopData(data.shop);
          } else {
            // Boutique existe mais n'est pas installée (access_token supprimé)
            setShopData(null);
          }
        }
      } catch (err) {
        console.error('Error loadShopData:', err);
      } finally {
        setLoading(false);
      }
    }

    loadShopData();
  }, []);
  const isOnlineStoresPage = pathname?.includes('/settings/online-stores') || pathname === '/admin/settings';
  const isBusinessPage = pathname?.includes('/settings/business');
  const isBadWordsPage = pathname?.includes('/settings/bad-words');
  const isTranslationsPage = pathname?.includes('/settings/translations');
  const isUsersPage = pathname?.includes('/settings/users');
  const isBillingPage = pathname?.includes('/settings/billing');
  const isApiKeysPage = pathname?.includes('/settings/api-keys');

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#000000',
      display: 'flex',
      fontFamily: 'var(--stepn-font-body), sans-serif'
    }}>
      {/* Settings Sidebar - Remplace la sidebar principale */}
      <aside style={{
        width: '240px',
        backgroundColor: 'rgb(30, 30, 30)',
        borderRight: '1px solid #1a1a1a',
        padding: '24px 0',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        left: 0,
        top: 0,
        zIndex: 100
      }}>
        {/* Back to Admin */}
        <div style={{ padding: '0 24px 32px', borderBottom: '1px solid #1a1a1a' }}>
          <Link
            href="/admin"
            style={{
              display: 'flex',
              alignItems: 'center',
              color: '#8eff36',
              textDecoration: 'none',
              fontFamily: 'var(--stepn-font-body)',
              fontSize: '16px'
            }}
          >
            Leave Settings
          </Link>
        </div>

        {/* Settings Navigation */}
        <nav style={{ flex: 1, padding: '24px 0' }}>
          <div style={{
            padding: '12px 24px',
            color: '#a0a0a0',
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontFamily: 'var(--stepn-font-body)',
            marginBottom: '8px'
          }}>
            Settings
          </div>

          <Link 
            href="/admin/settings"
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 24px',
              color: isOnlineStoresPage ? '#8eff36' : '#ffffff',
              textDecoration: 'none',
              fontFamily: 'var(--stepn-font-body)',
              fontSize: '16px',
              backgroundColor: isOnlineStoresPage ? '#1a1a1a' : 'transparent',
              borderLeft: isOnlineStoresPage ? '3px solid #8eff36' : '3px solid transparent',
              transition: 'all 0.2s',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              if (!isOnlineStoresPage) {
                e.currentTarget.style.backgroundColor = '#1a1a1a';
              }
            }}
            onMouseLeave={(e) => {
              if (!isOnlineStoresPage) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {isOnlineStoresPage && (
              <div style={{
                position: 'absolute',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                width: '3px',
                height: '20px',
                backgroundColor: '#8eff36'
              }} />
            )}
            Online stores
          </Link>

          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 24px',
              color: '#666666',
              fontFamily: 'var(--stepn-font-body)',
              fontSize: '16px',
              cursor: 'not-allowed',
              opacity: 0.5
            }}
            title="Coming soon"
          >
            Business
          </div>

          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 24px',
              color: '#666666',
              fontFamily: 'var(--stepn-font-body)',
              fontSize: '16px',
              cursor: 'not-allowed',
              opacity: 0.5
            }}
            title="Coming soon"
          >
            Bad words
          </div>

          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 24px',
              color: '#666666',
              fontFamily: 'var(--stepn-font-body)',
              fontSize: '16px',
              cursor: 'not-allowed',
              opacity: 0.5
            }}
            title="Coming soon"
          >
            Translations
          </div>

          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 24px',
              color: '#666666',
              fontFamily: 'var(--stepn-font-body)',
              fontSize: '16px',
              cursor: 'not-allowed',
              opacity: 0.5
            }}
            title="Coming soon"
          >
            Users
          </div>

          <Link 
            href="/admin/settings/billing"
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 24px',
              color: isBillingPage ? '#8eff36' : '#ffffff',
              textDecoration: 'none',
              fontFamily: 'var(--stepn-font-body)',
              fontSize: '16px',
              backgroundColor: isBillingPage ? '#1a1a1a' : 'transparent',
              borderLeft: isBillingPage ? '3px solid #8eff36' : '3px solid transparent',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!isBillingPage) {
                e.currentTarget.style.backgroundColor = '#1a1a1a';
              }
            }}
            onMouseLeave={(e) => {
              if (!isBillingPage) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            Billing & subscription
          </Link>

          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 24px',
              color: '#666666',
              fontFamily: 'var(--stepn-font-body)',
              fontSize: '16px',
              cursor: 'not-allowed',
              opacity: 0.5
            }}
            title="Coming soon"
          >
            API keys
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{
        flex: 1,
        marginLeft: '240px',
        padding: '40px',
        overflow: 'auto'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Success message */}
          {showSuccessMessage && (
            <div style={{
              padding: '16px',
              backgroundColor: '#1a1a1a',
              border: '1px solid #8eff36',
              borderRadius: '4px',
              marginBottom: '24px',
              color: '#8eff36',
              fontFamily: 'var(--stepn-font-body)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>✅ Shopify store successfully installed!</span>
              <button
                onClick={() => setShowSuccessMessage(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#8eff36',
                  cursor: 'pointer',
                  fontSize: '18px',
                  padding: '0 8px'
                }}
              >
                ×
              </button>
            </div>
          )}

          {/* Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '32px'
          }}>
            <h1 className="stepn-title-ultrabold" style={{ 
              color: '#8eff36', 
              fontSize: '48px',
              fontFamily: 'PP Neue Machina Inktrap Ultrabold Italic, sans-serif',
              margin: 0
            }}>
              Online stores
            </h1>
            <button
              onClick={() => setShowPlatformModal(true)}
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
              + Online store
            </button>
          </div>

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
              Uninstalled
            </button>
          </div>

          {/* Table */}
          <div style={{
            backgroundColor: '#0a0a0a',
            borderRadius: '8px',
            border: '1px solid #1a1a1a',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                  <th style={{
                    padding: '16px 24px',
                    textAlign: 'left',
                    color: '#a0a0a0',
                    fontFamily: 'var(--stepn-font-body)',
                    fontSize: '14px',
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    PLATFORM
                  </th>
                  <th style={{
                    padding: '16px 24px',
                    textAlign: 'left',
                    color: '#a0a0a0',
                    fontFamily: 'var(--stepn-font-body)',
                    fontSize: '14px',
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    NAME
                  </th>
                  <th style={{
                    padding: '16px 24px',
                    textAlign: 'left',
                    color: '#a0a0a0',
                    fontFamily: 'var(--stepn-font-body)',
                    fontSize: '14px',
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    URL
                  </th>
                  <th style={{
                    padding: '16px 24px',
                    textAlign: 'left',
                    color: '#a0a0a0',
                    fontFamily: 'var(--stepn-font-body)',
                    fontSize: '14px',
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    CURRENCY
                  </th>
                  <th style={{
                    padding: '16px 24px',
                    textAlign: 'left',
                    color: '#a0a0a0',
                    fontFamily: 'var(--stepn-font-body)',
                    fontSize: '14px',
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    STATUS
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#ffffff' }}>
                      Loading...
                    </td>
                  </tr>
                ) : shopData ? (
                  <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        backgroundColor: '#8eff36',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#000000',
                        fontWeight: 'bold',
                        fontSize: '12px'
                      }}>
                        S
                      </div>
                    </td>
                    <td style={{
                      padding: '16px 24px',
                      color: '#ffffff',
                      fontFamily: 'var(--stepn-font-body)',
                      fontSize: '16px'
                    }}>
                      {shopData.shop_name || 'Shop'}
                    </td>
                    <td style={{
                      padding: '16px 24px',
                      color: '#ffffff',
                      fontFamily: 'var(--stepn-font-body)',
                      fontSize: '16px'
                    }}>
                      {shopData.shop_domain}
                    </td>
                    <td style={{
                      padding: '16px 24px',
                      color: '#ffffff',
                      fontFamily: 'var(--stepn-font-body)',
                      fontSize: '16px'
                    }}>
                      EUR
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          backgroundColor: '#8eff36',
                          color: '#000000',
                          borderRadius: '12px',
                          fontSize: '14px',
                          fontFamily: 'var(--stepn-font-body)',
                          fontWeight: '600'
                        }} className="installed-badge">
                          installed
                        </span>
                        <button
                          onClick={async () => {
                            try {
                              const response = await fetch(`/api/shopify/script-tag?shop=${encodeURIComponent(shopData.shop_domain)}`, {
                                method: 'POST'
                              });
                              
                              if (response.ok) {
                                const data = await response.json();
                                alert('✅ Script tag créé avec succès ! Le bouton "Personnaliser" devrait maintenant apparaître sur vos produits avec le tag "customizer".');
                              } else {
                                const error = await response.json();
                                alert(`❌ Erreur: ${error.error || 'Failed to create script tag'}`);
                              }
                            } catch (err) {
                              console.error('Error creating script tag:', err);
                              alert('Erreur lors de la création du script tag. Veuillez réessayer.');
                            }
                          }}
                          style={{
                            padding: '4px 12px',
                            backgroundColor: '#8eff36',
                            color: '#000000',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                            fontFamily: 'var(--stepn-font-body)',
                            cursor: 'pointer',
                            transition: 'opacity 0.2s',
                            marginRight: '8px'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
                          onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                        >
                          Créer Script Tag
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm('Are you sure you want to uninstall this store? This will remove the access token and you will need to reinstall the app.')) {
                              return;
                            }
                            
                            try {
                              const response = await fetch(`/api/shopify/uninstall?shop=${encodeURIComponent(shopData.shop_domain)}`, {
                                method: 'POST'
                              });
                              
                              if (response.ok) {
                                // Recharger les données
                                window.location.reload();
                              } else {
                                const error = await response.json();
                                alert(`Error: ${error.error || 'Failed to uninstall'}`);
                              }
                            } catch (err) {
                              console.error('Error uninstalling:', err);
                              alert('Error uninstalling store. Please try again.');
                            }
                          }}
                          style={{
                            padding: '4px 12px',
                            backgroundColor: 'transparent',
                            color: '#ff4444',
                            border: '1px solid #ff4444',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                            fontFamily: 'var(--stepn-font-body)',
                            cursor: 'pointer',
                            transition: 'opacity 0.2s'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.opacity = '0.7'}
                          onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                        >
                          Uninstall
                        </button>
                      </div>
                      <style jsx>{`
                        .installed-badge {
                          color: #000000 !important;
                        }
                      `}</style>
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#a0a0a0' }}>
                      No online stores connected
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Platform Selection Modal */}
      {showPlatformModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            fontFamily: 'var(--stepn-font-body)'
          }}
          onClick={() => setShowPlatformModal(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
              position: 'relative',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowPlatformModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                color: '#666666',
                cursor: 'pointer',
                padding: '4px 8px',
                lineHeight: '1',
                fontFamily: 'var(--stepn-font-body)'
              }}
            >
              ×
            </button>

            {/* Title */}
            <h2 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#000000',
              marginBottom: '24px',
              fontFamily: 'var(--stepn-font-body)'
            }}>
              Select your online store platform
            </h2>

            {/* Platform Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {/* Shopify */}
              <button
                onClick={() => {
                  setShowPlatformModal(false);
                  // Demander le domaine Shopify à l'utilisateur
                  const shopDomain = prompt('Enter your Shopify store domain (e.g., yourstore.myshopify.com):');
                  if (!shopDomain) return;
                  
                  // Valider le format
                  if (!shopDomain.match(/^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/)) {
                    alert('Invalid format. Please use: yourstore.myshopify.com');
                    return;
                  }
                  
                  // Rediriger vers le flux d'installation OAuth Shopify
                  window.location.href = `/api/shopify/install?shop=${encodeURIComponent(shopDomain)}`;
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'var(--stepn-font-body)',
                  width: '100%',
                  textAlign: 'left'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#8eff36';
                  e.currentTarget.style.backgroundColor = '#f9f9f9';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#e0e0e0';
                  e.currentTarget.style.backgroundColor = '#ffffff';
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#8eff36',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#000000',
                  fontWeight: 'bold',
                  fontSize: '20px',
                  flexShrink: 0
                }}>
                  S
                </div>
                <span style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#000000',
                  fontFamily: 'var(--stepn-font-body)'
                }}>
                  Shopify
                </span>
              </button>

              {/* Wix */}
              <button
                onClick={() => {
                  // TODO: Implémenter l'intégration Wix
                  alert('Wix integration coming soon!');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'var(--stepn-font-body)',
                  width: '100%',
                  textAlign: 'left',
                  opacity: 0.6
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#8eff36';
                  e.currentTarget.style.backgroundColor = '#f9f9f9';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#e0e0e0';
                  e.currentTarget.style.backgroundColor = '#ffffff';
                }}
                disabled
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#000000',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <span style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '18px' }}>wix</span>
                </div>
                <span style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#000000',
                  fontFamily: 'var(--stepn-font-body)'
                }}>
                  Wix
                </span>
              </button>

              {/* WooCommerce */}
              <button
                onClick={() => {
                  // TODO: Implémenter l'intégration WooCommerce
                  alert('WooCommerce integration coming soon!');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'var(--stepn-font-body)',
                  width: '100%',
                  textAlign: 'left',
                  opacity: 0.6
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#8eff36';
                  e.currentTarget.style.backgroundColor = '#f9f9f9';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#e0e0e0';
                  e.currentTarget.style.backgroundColor = '#ffffff';
                }}
                disabled
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#96588a',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: '20px',
                  flexShrink: 0
                }}>
                  W
                </div>
                <span style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#000000',
                  fontFamily: 'var(--stepn-font-body)'
                }}>
                  WooCommerce
                </span>
              </button>
            </div>

            {/* Footer */}
            <div style={{
              fontSize: '14px',
              color: '#666666',
              textAlign: 'center',
              fontFamily: 'var(--stepn-font-body)',
              paddingTop: '16px',
              borderTop: '1px solid #e0e0e0'
            }}>
              For custom store integrations{' '}
              <a
                href="mailto:support@eyesberg.com"
                style={{
                  color: '#0066cc',
                  textDecoration: 'underline',
                  fontFamily: 'var(--stepn-font-body)'
                }}
              >
                contact us
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

