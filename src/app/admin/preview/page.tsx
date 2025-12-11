"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function PreviewPage() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId");
  const shop = searchParams.get("shop");
  const [configuratorUrl, setConfiguratorUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function generatePreviewSnapshot() {
      if (!productId) {
        setError("Product ID is required");
        setLoading(false);
        return;
      }

      try {
        // Générer un snapshot par défaut via l'API
        const response = await fetch('/api/admin/preview/generate-snapshot', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId,
            shop: shop || undefined,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to generate preview snapshot');
        }

        const data = await response.json();
        
        if (data.configuratorUrl) {
          setConfiguratorUrl(data.configuratorUrl);
        } else {
          throw new Error('No configurator URL returned');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error generating preview:', err);
        setError(err instanceof Error ? err.message : 'Failed to generate preview');
        setLoading(false);
      }
    }

    generatePreviewSnapshot();
  }, [productId, shop]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de l'aperçu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.close()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  if (!configuratorUrl) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">URL du configurateur non disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden">
      <iframe
        src={configuratorUrl}
        className="w-full h-full border-0"
        title="Aperçu du configurateur"
        allow="fullscreen"
      />
    </div>
  );
}
