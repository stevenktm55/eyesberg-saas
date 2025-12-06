export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import ConfiguratorViewer from '@/components/ConfiguratorViewer';

export default function Page({
  searchParams,
}: {
  searchParams: { shop?: string; productId?: string; variantId?: string };
}) {
  // Récupérer productId et shopDomain depuis les query params
  const productId = searchParams.productId || null;
  const shopDomain = searchParams.shop || null;
  
  return (
    <div className="h-screen w-screen">
      <Suspense fallback={<div className="flex items-center justify-center h-full">Chargement...</div>}>
        <ConfiguratorViewer 
          mode="client"
          productId={productId}
          shopDomain={shopDomain}
        />
      </Suspense>
    </div>
  );
}
