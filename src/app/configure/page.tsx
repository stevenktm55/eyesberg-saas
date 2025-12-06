export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import ConfiguratorViewer from '@/components/ConfiguratorViewer';

export default function Page() {
  // TODO: Récupérer productId et shopDomain depuis les query params
  // Pour l'instant, on utilise des valeurs par défaut
  return (
    <div className="h-screen w-screen">
      <Suspense fallback={<div className="flex items-center justify-center h-full">Chargement...</div>}>
        <ConfiguratorViewer 
          mode="client"
          productId={null}
          shopDomain={null}
        />
      </Suspense>
    </div>
  );
}
