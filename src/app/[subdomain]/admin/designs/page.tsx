'use client';

import AdminSidebar from '@/components/AdminSidebar';

export default function DesignsPage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#000000',
      display: 'flex',
      fontFamily: 'var(--stepn-font-body), sans-serif'
    }}>
      <AdminSidebar />
      <div style={{
        flex: 1,
        marginLeft: '240px',
        padding: '40px',
        overflow: 'auto'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h1 className="stepn-title-ultrabold" style={{ 
            color: '#8eff36', 
            fontSize: '48px',
            fontFamily: 'PP Neue Machina Inktrap Ultrabold Italic, sans-serif',
            marginBottom: '32px'
          }}>
            Designs
          </h1>
          <div style={{
            backgroundColor: '#0a0a0a',
            padding: '32px',
            borderRadius: '8px',
            border: '1px solid #1a1a1a',
            textAlign: 'center'
          }}>
            <p style={{
              color: '#ffffff',
              fontFamily: 'var(--stepn-font-body)',
              fontSize: '18px'
            }}>
              Designs coming soon...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


