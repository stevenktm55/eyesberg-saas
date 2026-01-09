export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import ConfiguratorViewer from '@/components/ConfiguratorViewer';

export default function Page({
  searchParams,
}: {
  searchParams: { shop?: string; productId?: string; variantId?: string; preview?: string };
}) {
  // Récupérer productId et shopDomain depuis les query params
  const productId = searchParams.productId || null;
  const shopDomain = searchParams.shop || null;
  const preview = searchParams.preview || null;
  
  return (
    <div className="h-screen w-screen">
      {/* Test Modal - devrait toujours être visible */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: 'red',
        color: 'white',
        padding: '20px',
        borderRadius: '8px',
        zIndex: 99999,
        border: '3px solid yellow'
      }}>
        🔧 TEST MODAL - Si vous voyez ceci, le code fonctionne !
      </div>
      
      <Suspense fallback={<div className="flex items-center justify-center h-full">Chargement...</div>}>
        <ConfiguratorViewer 
          mode="client"
          productId={productId}
          shopDomain={shopDomain}
          preview={preview === 'true' || preview === '1' || preview === 'yes'}
        />
      </Suspense>
    </div>
  );
}
