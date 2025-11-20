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

interface ProductBuilder {
  id: string;
  name: string;
  status: string;
  updated_at: string;
  created_at: string;
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
  const [products, setProducts] = useState<ProductBuilder[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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

  // Fonction pour charger les produits
  async function loadProducts() {
    setLoadingProducts(true);
    try {
      const response = await fetch(`/api/product-builder`);
      if (response.ok) {
        const data = await response.json();
        setProducts(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error loading products:', err);
    } finally {
      setLoadingProducts(false);
    }
  }

  // Charger les produits du builder
  useEffect(() => {
    if (!subdomain) return;
    loadProducts();
  }, [subdomain]);

  // Fermer le menu au clic extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (openMenuId && !(event.target as Element).closest('[data-menu-container]')) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  // Fonction pour formater la date relative
  function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `Updated ${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `Updated ${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `Updated ${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffMonths < 12) return `Updated ${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
    return `Updated ${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
  }

  // Filtrer les produits selon l'onglet actif
  const filteredProducts = products.filter(product => {
    if (activeTab === 'archived') {
      return product.status === 'archived';
    }
    return product.status !== 'archived';
  });

  async function archiveProduct(id: string) {
    try {
      const res = await fetch('/api/product-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: 'archived',
        }),
      });
      if (res.ok) {
        await loadProducts();
        setOpenMenuId(null);
      }
    } catch (error) {
      console.error('Error archiving product:', error);
      alert('Erreur lors de l\'archivage');
    }
  }

  async function unarchiveProduct(id: string) {
    try {
      const res = await fetch('/api/product-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: 'draft',
        }),
      });
      if (res.ok) {
        await loadProducts();
        setOpenMenuId(null);
      }
    } catch (error) {
      console.error('Error unarchiving product:', error);
      alert('Erreur lors de la désarchivage');
    }
  }

  async function deleteProduct(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;
    
    try {
      const res = await fetch(`/api/product-builder?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await loadProducts();
        setOpenMenuId(null);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Erreur lors de la suppression');
    }
  }

  async function duplicateProduct(id: string) {
    try {
      const product = products.find(p => p.id === id);
      if (!product) return;

      const res = await fetch('/api/product-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${product.name} (Copy)`,
          builderData: (product as any).builder_data,
          shopDomain: shopData?.shop_domain,
          status: 'draft',
        }),
      });
      if (res.ok) {
        await loadProducts();
        setOpenMenuId(null);
      }
    } catch (error) {
      console.error('Error duplicating product:', error);
      alert('Erreur lors de la duplication');
    }
  }

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
                onClick={() => setActiveTab('active')}
                style={{
                  padding: '12px 0',
                  backgroundColor: 'transparent',
                  color: activeTab === 'active' ? '#8eff36' : '#a0a0a0',
                  border: 'none',
                  borderBottom: activeTab === 'active' ? '2px solid #8eff36' : '2px solid transparent',
                  fontSize: '16px',
                  cursor: 'pointer',
                  fontFamily: 'var(--stepn-font-body)',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                }}
              >
                Active
              </button>
              <button
                onClick={() => setActiveTab('archived')}
                style={{
                  padding: '12px 0',
                  backgroundColor: 'transparent',
                  color: activeTab === 'archived' ? '#8eff36' : '#a0a0a0',
                  border: 'none',
                  borderBottom: activeTab === 'archived' ? '2px solid #8eff36' : '2px solid transparent',
                  fontSize: '16px',
                  cursor: 'pointer',
                  fontFamily: 'var(--stepn-font-body)',
                  fontWeight: '600',
                  transition: 'all 0.2s'
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
                  onClick={() => shopData && router.push(`/admin/products/new?shop=${shopData.shop_domain}`)}
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

            {/* Products Grid */}
            {loadingProducts ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#a0a0a0' }}>
                <p style={{ fontFamily: 'var(--stepn-font-body)' }}>Loading products...</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '24px'
              }}>
                {/* Existing Products */}
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    data-menu-container
                    style={{
                      backgroundColor: '#0a0a0a',
                      borderRadius: '8px',
                      padding: '16px',
                      border: '1px solid #1a1a1a',
                      position: 'relative',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#8eff36';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#1a1a1a';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {/* Menu Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === product.id ? null : product.id);
                      }}
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        width: '24px',
                        height: '24px',
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #2a2a2a',
                        borderRadius: '4px',
                        color: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        fontFamily: 'var(--stepn-font-body)',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#2a2a2a';
                        e.currentTarget.style.borderColor = '#8eff36';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#1a1a1a';
                        e.currentTarget.style.borderColor = '#2a2a2a';
                      }}
                    >
                      ⋯
                    </button>

                    {/* Dropdown Menu */}
                    {openMenuId === product.id && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '40px',
                          right: '12px',
                          backgroundColor: '#ffffff',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                          zIndex: 1000,
                          minWidth: '160px',
                          padding: '8px 0',
                          border: '1px solid #e0e0e0'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => router.push(`/admin/products/new?shop=${shopData?.shop_domain}&id=${product.id}&preview=true`)}
                          style={{
                            width: '100%',
                            padding: '8px 16px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            textAlign: 'left',
                            color: '#000000',
                            fontSize: '14px',
                            fontFamily: 'var(--stepn-font-body)',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f5f5f5';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          Preview
                        </button>
                        <button
                          onClick={() => duplicateProduct(product.id)}
                          style={{
                            width: '100%',
                            padding: '8px 16px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            textAlign: 'left',
                            color: '#000000',
                            fontSize: '14px',
                            fontFamily: 'var(--stepn-font-body)',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f5f5f5';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          Duplicate
                        </button>
                        <div style={{
                          height: '1px',
                          backgroundColor: '#e0e0e0',
                          margin: '4px 0'
                        }} />
                        <button
                          onClick={() => activeTab === 'active' ? archiveProduct(product.id) : unarchiveProduct(product.id)}
                          style={{
                            width: '100%',
                            padding: '8px 16px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            textAlign: 'left',
                            color: '#d97706',
                            fontSize: '14px',
                            fontFamily: 'var(--stepn-font-body)',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#fef3c7';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          {activeTab === 'active' ? 'Archive' : 'Unarchive'}
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          style={{
                            width: '100%',
                            padding: '8px 16px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            textAlign: 'left',
                            color: '#dc2626',
                            fontSize: '14px',
                            fontFamily: 'var(--stepn-font-body)',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#fee2e2';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}

                    <div
                      onClick={() => router.push(`/admin/products/new?shop=${shopData?.shop_domain}&id=${product.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
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
                        fontSize: '32px'
                      }}>
                        📦
                      </div>
                      <p style={{
                        color: '#ffffff',
                        fontFamily: 'var(--stepn-font-body)',
                        fontSize: '14px',
                        fontWeight: '500',
                        marginBottom: '4px'
                      }}>
                        {product.name}
                      </p>
                      <p style={{
                        color: '#a0a0a0',
                        fontFamily: 'var(--stepn-font-body)',
                        fontSize: '12px'
                      }}>
                        {formatRelativeTime(product.updated_at || product.created_at)}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Add New Product Card - Only show in Active tab */}
                {activeTab === 'active' && (
                  <div
                    onClick={() => shopData && router.push(`/admin/products/new?shop=${shopData.shop_domain}`)}
                    style={{
                      backgroundColor: '#0a0a0a',
                      borderRadius: '8px',
                      padding: '16px',
                      border: '1px solid #1a1a1a',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#8eff36';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#1a1a1a';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
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
                      {filteredProducts.length === 0 ? 'No products yet' : 'New product'}
                    </p>
                    <p style={{
                      color: '#a0a0a0',
                      fontFamily: 'var(--stepn-font-body)',
                      fontSize: '12px'
                    }}>
                      {filteredProducts.length === 0 ? 'Create your first product' : 'Add product'}
                    </p>
                  </div>
                )}
              </div>
            )}
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
