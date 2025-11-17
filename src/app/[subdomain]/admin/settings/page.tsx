'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import AdminSidebar from '@/components/AdminSidebar';

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

  useEffect(() => {
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
          setShopData(data.shop || null);
        }
      } catch (err) {
        console.error('❌ Erreur loadShopData:', err);
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
      <AdminSidebar />
      
      {/* Settings Sidebar */}
      <aside style={{
        width: '240px',
        backgroundColor: '#0a0a0a',
        borderRight: '1px solid #1a1a1a',
        padding: '24px 0',
        display: 'flex',
        flexDirection: 'column',
        marginLeft: '240px',
        position: 'fixed',
        height: '100vh',
        left: '240px',
        top: 0,
        zIndex: 99
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
            <span style={{ marginRight: '8px' }}>←</span>
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

          <Link 
            href="/admin/settings/business"
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 24px',
              color: isBusinessPage ? '#8eff36' : '#ffffff',
              textDecoration: 'none',
              fontFamily: 'var(--stepn-font-body)',
              fontSize: '16px',
              backgroundColor: isBusinessPage ? '#1a1a1a' : 'transparent',
              borderLeft: isBusinessPage ? '3px solid #8eff36' : '3px solid transparent',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!isBusinessPage) {
                e.currentTarget.style.backgroundColor = '#1a1a1a';
              }
            }}
            onMouseLeave={(e) => {
              if (!isBusinessPage) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            Business
          </Link>

          <Link 
            href="/admin/settings/bad-words"
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 24px',
              color: isBadWordsPage ? '#8eff36' : '#ffffff',
              textDecoration: 'none',
              fontFamily: 'var(--stepn-font-body)',
              fontSize: '16px',
              backgroundColor: isBadWordsPage ? '#1a1a1a' : 'transparent',
              borderLeft: isBadWordsPage ? '3px solid #8eff36' : '3px solid transparent',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!isBadWordsPage) {
                e.currentTarget.style.backgroundColor = '#1a1a1a';
              }
            }}
            onMouseLeave={(e) => {
              if (!isBadWordsPage) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            Bad words
          </Link>

          <Link 
            href="/admin/settings/translations"
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 24px',
              color: isTranslationsPage ? '#8eff36' : '#ffffff',
              textDecoration: 'none',
              fontFamily: 'var(--stepn-font-body)',
              fontSize: '16px',
              backgroundColor: isTranslationsPage ? '#1a1a1a' : 'transparent',
              borderLeft: isTranslationsPage ? '3px solid #8eff36' : '3px solid transparent',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!isTranslationsPage) {
                e.currentTarget.style.backgroundColor = '#1a1a1a';
              }
            }}
            onMouseLeave={(e) => {
              if (!isTranslationsPage) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            Translations
          </Link>

          <Link 
            href="/admin/settings/users"
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 24px',
              color: isUsersPage ? '#8eff36' : '#ffffff',
              textDecoration: 'none',
              fontFamily: 'var(--stepn-font-body)',
              fontSize: '16px',
              backgroundColor: isUsersPage ? '#1a1a1a' : 'transparent',
              borderLeft: isUsersPage ? '3px solid #8eff36' : '3px solid transparent',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!isUsersPage) {
                e.currentTarget.style.backgroundColor = '#1a1a1a';
              }
            }}
            onMouseLeave={(e) => {
              if (!isUsersPage) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            Users
          </Link>

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

          <Link 
            href="/admin/settings/api-keys"
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 24px',
              color: isApiKeysPage ? '#8eff36' : '#ffffff',
              textDecoration: 'none',
              fontFamily: 'var(--stepn-font-body)',
              fontSize: '16px',
              backgroundColor: isApiKeysPage ? '#1a1a1a' : 'transparent',
              borderLeft: isApiKeysPage ? '3px solid #8eff36' : '3px solid transparent',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!isApiKeysPage) {
                e.currentTarget.style.backgroundColor = '#1a1a1a';
              }
            }}
            onMouseLeave={(e) => {
              if (!isApiKeysPage) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            API keys
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{
        flex: 1,
        marginLeft: '480px',
        padding: '40px',
        overflow: 'auto'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
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
                      Chargement...
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
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        backgroundColor: '#8eff36',
                        color: '#000000',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontFamily: 'var(--stepn-font-body)',
                        fontWeight: '600'
                      }}>
                        installed
                      </span>
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
    </div>
  );
}

