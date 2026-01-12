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
  
  // TEST: Log immédiat pour vérifier que le composant s'exécute
  if (typeof window !== 'undefined') {
    console.log('🔍 Page component rendering', { productId, shopDomain, preview });
  }
  
  // TEST: Rendre d'abord sans Suspense pour voir si le problème vient de là
  try {
    return (
      <div className="h-screen w-screen configurator-panel-wrapper" style={{ backgroundColor: '#ffffff', border: '5px solid green' } as React.CSSProperties}>
        <div className="configurator-panel-test" style={{ border: '5px solid magenta', padding: '20px', backgroundColor: 'yellow' } as React.CSSProperties}>
          TEST: Cette div devrait être visible - Page.tsx fonctionne !
        </div>
        {/* Temporairement désactiver Suspense pour tester */}
        <div style={{ border: '5px solid blue', padding: '20px', backgroundColor: 'lightblue' } as React.CSSProperties}>
          <p>Test: Suspense désactivé temporairement</p>
          <ConfiguratorViewer 
            mode="client"
            productId={productId}
            shopDomain={shopDomain}
            preview={preview === 'true' || preview === '1' || preview === 'yes'}
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error('❌ Erreur dans Page component:', error);
    return (
      <div style={{ padding: '20px', backgroundColor: 'red', color: 'white' } as React.CSSProperties}>
        ERREUR dans Page: {String(error)}
      </div>
    );
  }
}
