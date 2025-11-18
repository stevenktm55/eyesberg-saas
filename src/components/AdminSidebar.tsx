'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AdminSidebar() {
  const pathname = usePathname();
  // Fallback to window.location.pathname for more reliable path detection
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : pathname || '';
  const effectivePathname = currentPath || pathname || '';
  
  const isProductsPage = effectivePathname === `/admin` || effectivePathname?.endsWith('/admin');
  const isThemeEditorPage = effectivePathname?.includes('/theme-editor');
  const isOrdersPage = effectivePathname?.includes('/orders');
  const isDesignsPage = effectivePathname?.includes('/designs');
  const isSettingsPage = effectivePathname?.includes('/settings');
  const isConfigurationsPage = effectivePathname?.includes('/configurations');
  
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
        <div style={{
          width: '32px',
          height: '32px',
          backgroundColor: '#8eff36',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#000000',
          fontWeight: 'bold',
          fontSize: '18px',
          fontFamily: 'PP Neue Machina Inktrap Ultrabold Italic, sans-serif'
        }}>
          E
        </div>
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

        {/* DEBUG: Configurations link */}
        {console.log('Rendering Configurations link')}
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
