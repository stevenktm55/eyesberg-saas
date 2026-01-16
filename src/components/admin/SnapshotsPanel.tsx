"use client";

import { useState, useEffect, useRef } from "react";

interface SnapshotsPanelProps {
  productId: string;
  shop?: string;
}

interface Snapshots {
  mobile: string | null;
  desktop: string | null;
}

export function SnapshotsPanel({ productId, shop }: SnapshotsPanelProps) {
  const [snapshots, setSnapshots] = useState<Snapshots | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previewWindowRef = useRef<Window | null>(null);

  useEffect(() => {
    loadSnapshots();
  }, [productId, shop]);

  const loadSnapshots = async () => {
    if (!productId || !shop) return;

    try {
      setLoading(true);
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

  const captureSnapshot = async (type: "mobile" | "desktop"): Promise<string | null> => {
    return new Promise((resolve) => {
      // Ouvrir la page preview pour référence
      const previewUrl = `/admin/preview?productId=${productId}${shop ? `&shop=${shop}` : ""}`;
      window.open(previewUrl, "_blank");
      
      // Créer un input file pour upload manuel
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/png,image/jpeg,image/webp";
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          resolve(null);
          return;
        }

        // Convertir le fichier en base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve(base64);
        };
        reader.onerror = () => {
          resolve(null);
        };
        reader.readAsDataURL(file);
      };
      
      // Simuler un clic sur l'input
      input.click();
    });
  };

  const captureAndClose = async (
    win: Window,
    type: "mobile" | "desktop",
    resolve: (value: string | null) => void
  ) => {
    try {
      // Utiliser html2canvas pour capturer la page
      const html2canvas = (win as any).html2canvas;
      if (!html2canvas) {
        console.error("html2canvas non disponible");
        win.close();
        resolve(null);
        return;
      }

      const canvas = await html2canvas(win.document.body, {
        width: win.innerWidth,
        height: win.innerHeight,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        scale: type === "mobile" ? 2 : 1, // Plus haute résolution pour mobile
      });

      // Convertir en base64
      const base64 = canvas.toDataURL("image/png", 0.95);
      win.close();
      resolve(base64);
    } catch (err) {
      console.error("Erreur lors de la capture html2canvas:", err);
      win.close();
      resolve(null);
    }
  };

  const generateSnapshot = async (type: "mobile" | "desktop") => {
    if (!productId || !shop) {
      setError("Product ID et Shop sont requis");
      return;
    }

    try {
      setGenerating(true);
      setError(null);

      // Capturer le snapshot
      const base64 = await captureSnapshot(type);
      if (!base64) {
        setError(`Erreur lors de la capture du snapshot ${type}`);
        return;
      }

      // Uploader le snapshot
      const response = await fetch(`/api/shopify/products/${productId}/snapshots?shop=${shop}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [type]: base64,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSnapshots(data.snapshots);
          alert(`Snapshot ${type} généré avec succès !`);
        } else {
          setError(`Erreur lors de l'upload du snapshot ${type}`);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || `Erreur lors de l'upload du snapshot ${type}`);
      }
    } catch (err) {
      console.error(`Erreur lors de la génération du snapshot ${type}:`, err);
      setError(`Erreur lors de la génération du snapshot ${type}`);
    } finally {
      setGenerating(false);
    }
  };

  const openPreview = () => {
    const previewUrl = `/admin/preview?productId=${productId}${shop ? `&shop=${shop}` : ""}`;
    window.open(previewUrl, "_blank");
  };

  if (!shop) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">
          Cette fonctionnalité nécessite une connexion Shopify.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Product Snapshots</h2>
        <button
          onClick={openPreview}
          className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Voir l'aperçu
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Générez des snapshots mobile et desktop de votre produit pour vérifier son apparence avant de le connecter à Shopify.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mobile Snapshot */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Snapshot Mobile
            </h3>
            {snapshots?.mobile ? (
              <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                ✓ Généré
              </span>
            ) : (
              <span className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-full">
                Non généré
              </span>
            )}
          </div>

          {snapshots?.mobile ? (
            <div className="space-y-2">
              <img
                src={snapshots.mobile}
                alt="Snapshot mobile"
                className="w-full h-48 object-contain bg-gray-50 rounded border border-gray-200"
              />
              <button
                onClick={() => generateSnapshot("mobile")}
                disabled={generating}
                className="w-full px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {generating ? "Génération..." : "Régénérer"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => generateSnapshot("mobile")}
              disabled={generating}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Génération...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Générer le snapshot mobile
                </>
              )}
            </button>
          )}
        </div>

        {/* Desktop Snapshot */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Snapshot Desktop
            </h3>
            {snapshots?.desktop ? (
              <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                ✓ Généré
              </span>
            ) : (
              <span className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-full">
                Non généré
              </span>
            )}
          </div>

          {snapshots?.desktop ? (
            <div className="space-y-2">
              <img
                src={snapshots.desktop}
                alt="Snapshot desktop"
                className="w-full h-48 object-contain bg-gray-50 rounded border border-gray-200"
              />
              <button
                onClick={() => generateSnapshot("desktop")}
                disabled={generating}
                className="w-full px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {generating ? "Génération..." : "Régénérer"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => generateSnapshot("desktop")}
              disabled={generating}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Génération...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Générer le snapshot desktop
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {(snapshots?.mobile || snapshots?.desktop) && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            ✓ Les snapshots ont été générés avec succès. Vous pouvez maintenant vérifier l'apparence de votre produit avant de le connecter à Shopify.
          </p>
        </div>
      )}
    </div>
  );
}
