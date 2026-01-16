"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface Snapshots {
  mobile: string | null;
  desktop: string | null;
}

export default function PreviewPage() {
  const searchParams = useSearchParams();
  // Accepter productId ou id (pour compatibilité)
  const productId = searchParams.get("productId") || searchParams.get("id");
  const shop = searchParams.get("shop");
  const [configuratorUrl, setConfiguratorUrl] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshots | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"mobile" | "desktop">("desktop");

  useEffect(() => {
    if (!productId) {
      setError("Product ID is required");
      setLoading(false);
      return;
    }

    // Construire directement l'URL du configurateur avec les paramètres disponibles
    const params = new URLSearchParams();
    
    if (shop) {
      params.append("shop", shop);
    }
    
    if (productId) {
      params.append("productId", productId);
    }

    // Ajouter le paramètre preview pour masquer les boutons d'action
    params.append("preview", "true");

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${baseUrl}/configure?${params.toString()}`;
    
    setConfiguratorUrl(url);

    // Charger les snapshots
    loadSnapshots();
  }, [productId, shop]);

  const loadSnapshots = async () => {
    if (!productId || !shop) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/shopify/products/${productId}/snapshots?shop=${shop}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.snapshots) {
          setSnapshots(data.snapshots);
        }
      }
    } catch (err) {
      console.error("Erreur lors du chargement des snapshots:", err);
    } finally {
      setLoading(false);
    }
  };

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

  // Si on a des snapshots, les afficher
  if (snapshots && (snapshots.mobile || snapshots.desktop)) {
    const hasBoth = snapshots.mobile && snapshots.desktop;
    const currentSnapshot = viewMode === "mobile" ? snapshots.mobile : snapshots.desktop;

    return (
      <div className="h-screen w-screen flex flex-col bg-gray-50">
        {/* Header avec les boutons de navigation */}
        {hasBoth && (
          <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">Aperçu du produit</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("mobile")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === "mobile"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                📱 Mobile
              </button>
              <button
                onClick={() => setViewMode("desktop")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === "desktop"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                💻 Desktop
              </button>
            </div>
          </div>
        )}

        {/* Aperçu du snapshot */}
        <div className="flex-1 flex items-center justify-center overflow-auto p-4">
          {currentSnapshot ? (
            <div className="relative max-w-full max-h-full">
              <img
                src={currentSnapshot}
                alt={`Aperçu ${viewMode} du produit`}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              />
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <p className="text-lg mb-2">Snapshot {viewMode} non disponible</p>
              {viewMode === "mobile" && snapshots.desktop && (
                <button
                  onClick={() => setViewMode("desktop")}
                  className="text-blue-600 hover:underline"
                >
                  Voir l'aperçu desktop
                </button>
              )}
              {viewMode === "desktop" && snapshots.mobile && (
                <button
                  onClick={() => setViewMode("mobile")}
                  className="text-blue-600 hover:underline"
                >
                  Voir l'aperçu mobile
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer avec info */}
        <div className="bg-white border-t border-gray-200 px-6 py-3 text-center text-sm text-gray-500">
          <p>Ce snapshot a été généré automatiquement pour vérifier l'apparence du produit</p>
        </div>
      </div>
    );
  }

  // Fallback : afficher l'iframe si pas de snapshots
  return (
    <div className="h-screen w-screen overflow-hidden">
      <iframe
        src={configuratorUrl || undefined}
        className="w-full h-full border-0"
        title="Aperçu du configurateur"
        allow="fullscreen"
      />
    </div>
  );
}
