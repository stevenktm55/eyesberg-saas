'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AdminSidebar() {
  const pathname = usePathname();
  // Use pathname directly - it reflects the actual route after middleware rewrite
  // window.location.pathname shows the original URL, not the rewritten one
  
  const isProductsPage = pathname === `/admin` || pathname === `/[subdomain]/admin` || pathname?.endsWith('/admin');
  const isThemeEditorPage = pathname?.includes('/theme-editor');
  const isOrdersPage = pathname?.includes('/orders');
  const isDesignsPage = pathname?.includes('/designs');
  const isSettingsPage = pathname?.includes('/settings');
  const isConfigurationsPage = pathname?.includes('/configurations');
  
  // Debug: log pathname to verify routing
  useEffect(() => {
    console.log('AdminSidebar - pathname:', pathname, 'isConfigurationsPage:', isConfigurationsPage);
  }, [pathname, isConfigurationsPage]);
  
  // État pour le sous-menu Orders & Designs
  const [isOrdersMenuOpen, setIsOrdersMenuOpen] = useState(isOrdersPage || isDesignsPage);

  return (
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
      {/* Logo/Brand */}
      <div style={{ padding: '0 24px 32px', borderBottom: '1px solid #1a1a1a' }}>
        <Link href="/admin" style={{ display: 'inline-block', textDecoration: 'none' }}>
          <img
            src="/eyesberg.svg"
            alt="Eyesberg"
            style={{
              height: '32px',
              width: 'auto',
              cursor: 'pointer',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '24px 0', overflowY: 'auto' }}>
        <Link 
          href="/admin"
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 24px',
            color: isProductsPage ? '#8eff36' : '#ffffff',
            textDecoration: 'none',
            fontFamily: 'var(--stepn-font-body)',
            fontSize: '16px',
            backgroundColor: isProductsPage ? '#1a1a1a' : 'transparent',
            borderLeft: isProductsPage ? '3px solid #8eff36' : '3px solid transparent',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!isProductsPage) {
              e.currentTarget.style.backgroundColor = '#1a1a1a';
            }
          }}
          onMouseLeave={(e) => {
            if (!isProductsPage) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          My products
        </Link>

        <Link 
          href="/admin/theme-editor"
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 24px',
            color: isThemeEditorPage ? '#8eff36' : '#ffffff',
            textDecoration: 'none',
            fontFamily: 'var(--stepn-font-body)',
            fontSize: '16px',
            backgroundColor: isThemeEditorPage ? '#1a1a1a' : 'transparent',
            borderLeft: isThemeEditorPage ? '3px solid #8eff36' : '3px solid transparent',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!isThemeEditorPage) {
              e.currentTarget.style.backgroundColor = '#1a1a1a';
            }
          }}
          onMouseLeave={(e) => {
            if (!isThemeEditorPage) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          Theme editor
        </Link>

        {/* Orders & Designs avec sous-menu */}
        <div>
          <div
            onClick={() => setIsOrdersMenuOpen(!isOrdersMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 24px',
              color: (isOrdersPage || isDesignsPage) ? '#8eff36' : '#ffffff',
              cursor: 'pointer',
              fontFamily: 'var(--stepn-font-body)',
              fontSize: '16px',
              backgroundColor: (isOrdersPage || isDesignsPage) ? '#1a1a1a' : 'transparent',
              borderLeft: (isOrdersPage || isDesignsPage) ? '3px solid #8eff36' : '3px solid transparent',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!isOrdersPage && !isDesignsPage) {
                e.currentTarget.style.backgroundColor = '#1a1a1a';
              }
            }}
            onMouseLeave={(e) => {
              if (!isOrdersPage && !isDesignsPage) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <span>Orders & Designs</span>
            <span style={{ 
              transform: isOrdersMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
              fontSize: '12px'
            }}>
              ▼
            </span>
          </div>
          
          {isOrdersMenuOpen && (
            <div style={{ paddingLeft: '24px' }}>
              <Link 
                href="/admin/orders"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 24px',
                  color: isOrdersPage ? '#8eff36' : '#a0a0a0',
                  textDecoration: 'none',
                  fontFamily: 'var(--stepn-font-body)',
                  fontSize: '14px',
                  backgroundColor: isOrdersPage ? '#1a1a1a' : 'transparent',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!isOrdersPage) {
                    e.currentTarget.style.backgroundColor = '#1a1a1a';
                    e.currentTarget.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isOrdersPage) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#a0a0a0';
                  }
                }}
              >
                Orders
              </Link>
              <Link 
                href="/admin/designs"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 24px',
                  color: isDesignsPage ? '#8eff36' : '#a0a0a0',
                  textDecoration: 'none',
                  fontFamily: 'var(--stepn-font-body)',
                  fontSize: '14px',
                  backgroundColor: isDesignsPage ? '#1a1a1a' : 'transparent',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!isDesignsPage) {
                    e.currentTarget.style.backgroundColor = '#1a1a1a';
                    e.currentTarget.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDesignsPage) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#a0a0a0';
                  }
                }}
              >
                Designs
              </Link>
            </div>
          )}
        </div>

        {/* Configurations link */}
        <Link 
          href="/admin/configurations"
          id="configurations-link"
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 24px',
            color: isConfigurationsPage ? '#8eff36' : '#ffffff',
            textDecoration: 'none',
            fontFamily: 'var(--stepn-font-body)',
            fontSize: '16px',
            backgroundColor: isConfigurationsPage ? '#1a1a1a' : 'transparent',
            borderLeft: isConfigurationsPage ? '3px solid #8eff36' : '3px solid transparent',
            transition: 'all 0.2s',
            visibility: 'visible',
            opacity: 1
          }}
          onMouseEnter={(e) => {
            if (!isConfigurationsPage) {
              e.currentTarget.style.backgroundColor = '#1a1a1a';
            }
          }}
          onMouseLeave={(e) => {
            if (!isConfigurationsPage) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          My Configurations 2D/3D
        </Link>

        <Link 
          href="/admin/settings"
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 24px',
            color: isSettingsPage ? '#8eff36' : '#ffffff',
            textDecoration: 'none',
            fontFamily: 'var(--stepn-font-body)',
            fontSize: '16px',
            backgroundColor: isSettingsPage ? '#1a1a1a' : 'transparent',
            borderLeft: isSettingsPage ? '3px solid #8eff36' : '3px solid transparent',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!isSettingsPage) {
              e.currentTarget.style.backgroundColor = '#1a1a1a';
            }
          }}
          onMouseLeave={(e) => {
            if (!isSettingsPage) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          Settings
        </Link>
      </nav>

      {/* Logout */}
      <div style={{ padding: '0 24px', borderTop: '1px solid #1a1a1a', paddingTop: '24px' }}>
        <button
          onClick={async () => {
            await fetch('/api/accounts/logout', { method: 'POST' });
            window.location.href = '/login';
          }}
          style={{
            width: '100%',
            padding: '12px',
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
            e.currentTarget.style.backgroundColor = '#1a1a1a';
            e.currentTarget.style.borderColor = '#8eff36';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.borderColor = '#1a1a1a';
          }}
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
