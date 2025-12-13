"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function PreviewContent() {
  console.log('🔍 PreviewPage - Composant chargé');
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId");
  const shop = searchParams.get("shop");
  console.log('🔍 PreviewPage - Paramètres URL:', { productId, shop, allParams: Array.from(searchParams.entries()) });
  const [configuratorUrl, setConfiguratorUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔍 PreviewPage - useEffect déclenché', { productId, shop });
    async function generatePreviewSnapshot() {
      console.log('🔍 PreviewPage - generatePreviewSnapshot appelé', { productId, shop });
      if (!productId) {
        console.error('❌ PreviewPage - Product ID manquant');
        setError("Product ID is required");
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 PreviewPage - Appel API /api/admin/preview/generate-snapshot', { productId, shop });
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
          console.log('📸 URL du configurateur générée pour le preview:', data.configuratorUrl);
          console.log('📸 Vérification preview=true dans l\'URL:', data.configuratorUrl.includes('preview=true'));
          
          // CRITIQUE: S'assurer que preview=true est présent dans l'URL
          let finalUrl = data.configuratorUrl;
          if (!finalUrl.includes('preview=true')) {
            console.warn('⚠️ preview=true absent de l\'URL générée, ajout forcé');
            const urlObj = new URL(finalUrl);
            urlObj.searchParams.set('preview', 'true');
            finalUrl = urlObj.toString();
            console.log('✅ URL corrigée avec preview=true:', finalUrl);
          }
          
          setConfiguratorUrl(finalUrl);
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

  // Log l'URL utilisée dans l'iframe pour vérifier qu'elle contient preview=true
  useEffect(() => {
    if (configuratorUrl) {
      console.log('📸 URL utilisée dans l\'iframe:', configuratorUrl);
      console.log('📸 Vérification preview=true dans l\'URL de l\'iframe:', configuratorUrl.includes('preview=true'));
      console.log('📸 Tous les paramètres de l\'URL:', new URLSearchParams(configuratorUrl.split('?')[1] || '').toString());
    }
  }, [configuratorUrl]);

  return (
    <div className="h-screen w-screen overflow-hidden">
      <iframe
        src={configuratorUrl || ''}
        className="w-full h-full border-0"
        title="Aperçu du configurateur"
        allow="fullscreen"
        onLoad={() => {
          console.log('📸 Iframe chargée, URL finale:', configuratorUrl);
          // Vérifier l'URL réelle de l'iframe après chargement
          try {
            const iframe = document.querySelector('iframe[title="Aperçu du configurateur"]') as HTMLIFrameElement;
            if (iframe && iframe.contentWindow) {
              const iframeUrl = iframe.contentWindow.location.href;
              console.log('📸 URL réelle de l\'iframe après chargement:', iframeUrl);
              if (!iframeUrl.includes('preview=true')) {
                console.error('❌ ERREUR: L\'URL réelle de l\'iframe ne contient pas preview=true !', iframeUrl);
                // Essayer de forcer la mise à jour de l'URL
                const urlObj = new URL(iframeUrl);
                urlObj.searchParams.set('preview', 'true');
                console.log('🔄 Tentative de correction de l\'URL:', urlObj.toString());
                // Note: On ne peut pas modifier l'URL d'une iframe cross-origin, donc on doit s'assurer que l'URL initiale est correcte
              }
            }
          } catch (e) {
            console.warn('⚠️ Impossible de lire l\'URL de l\'iframe (cross-origin):', e);
          }
          
          if (configuratorUrl && !configuratorUrl.includes('preview=true')) {
            console.error('❌ ERREUR: L\'URL configuratorUrl ne contient pas preview=true !', configuratorUrl);
          }
        }}
      />
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <PreviewContent />
    </Suspense>
  );
}
