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
  
  console.log('🔍 Page component rendering', { productId, shopDomain, preview });
  
  return (
    <div className="h-screen w-screen configurator-panel-wrapper" style={{ backgroundColor: '#ffffff', border: '5px solid green' } as React.CSSProperties}>
      <div className="configurator-panel-test" style={{ border: '5px solid magenta', padding: '20px' } as React.CSSProperties}>
        TEST: Cette div devrait être visible
      </div>
      <Suspense fallback={<div className="configurator-panel configurator-panel-loading flex items-center justify-center h-full" style={{ border: '10px solid cyan', backgroundColor: 'lightcyan' } as React.CSSProperties}>Chargement...</div>}>
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
