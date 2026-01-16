"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { QuestionsPanel } from "@/components/admin/QuestionsPanel";
import { Canvas3DPreview } from "@/components/admin/Canvas3DPreview";
import { SettingsPanel } from "@/components/admin/SettingsPanel";
import { ProductQuestion, ProductLayer } from "@/components/admin/ProductEditor3D";

interface Snapshots {
  mobile: string | null;
  desktop: string | null;
}

export default function PreviewPage() {
  const searchParams = useSearchParams();
  // Accepter productId ou id (pour compatibilité)
  const productId = searchParams.get("productId") || searchParams.get("id");
  const shop = searchParams.get("shop");
  
  const [productName, setProductName] = useState("Chargement...");
  const [questions, setQuestions] = useState<ProductQuestion[]>([]);
  const [layers, setLayers] = useState<ProductLayer[]>([]);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshots | null>(null);
  const [viewMode, setViewMode] = useState<"mobile" | "desktop">("desktop");

  // Charger la configuration du produit depuis le builder
  useEffect(() => {
    if (!productId || !shop) {
      setError("Product ID et Shop sont requis");
      setLoading(false);
      return;
    }

    const loadProductConfig = async () => {
      try {
        setLoading(true);
        console.log('🔍 Chargement configuration produit pour preview:', { productId, shop });
        const response = await fetch(`/api/shopify/products/${productId}?shop=${shop}`);
        
        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.config) {
          console.log('✅ Configuration produit chargée:', data.config);
          
          // Charger les données exactement comme dans le builder
          setProductName(data.config.productName || data.product?.shopify_product_title || "Untitled Product");
          setModelUrl(data.config.modelUrl || null);
          setQuestions(data.config.questions || []);
          setLayers(data.config.layers || []);
        } else {
          // Pas de configuration, utiliser des valeurs par défaut comme dans le builder
          setProductName(data.product?.shopify_product_title || "Untitled Product");
          setQuestions([
            {
              id: "q1",
              type: "group",
              label: "Choix des couleurs",
              groupId: "colors",
              visible: true,
            },
            {
              id: "q2",
              type: "text",
              label: "Nom",
              visible: true,
            },
            {
              id: "q3",
              type: "text",
              label: "Numéro",
              visible: true,
            },
            {
              id: "q4",
              type: "radio",
              label: "Taille",
              options: ["S", "M", "L", "XL", "XXL"],
              visible: true,
            },
          ]);
          setLayers([
            { id: "l1", name: "shadows avant", visible: true, behindScene: true },
            { id: "l2", name: "Couleurs 1", visible: true },
            { id: "l3", name: "Couleurs 2", visible: true },
            { id: "l4", name: "Couleurs 3", visible: true },
            { id: "l5", name: "tailles", visible: true, behindScene: true },
          ]);
        }

        // Charger les snapshots si disponibles
        loadSnapshots();
      } catch (err) {
        console.error('❌ Erreur lors du chargement de la configuration produit:', err);
        setError(err instanceof Error ? err.message : "Erreur lors du chargement");
      } finally {
        setLoading(false);
      }
    };
    
    loadProductConfig();
  }, [productId, shop]);

  const loadSnapshots = async () => {
    if (!productId || !shop) return;

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
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de la configuration...</p>
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

  // Afficher exactement le même layout que le builder (QuestionsPanel + Canvas3DPreview + SettingsPanel)
  return (
    <div className="h-screen w-screen flex flex-col bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">{productName}</h1>
        <button
          onClick={() => window.close()}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          Fermer
        </button>
      </div>

      {/* Content : exactement comme dans le builder */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Questions */}
        <QuestionsPanel
          questions={questions}
          layers={layers}
          onQuestionsChange={setQuestions}
          onLayersChange={setLayers}
          selectedQuestionId={selectedQuestionId}
          onQuestionSelect={setSelectedQuestionId}
          selectedLayerId={selectedLayerId}
          onLayerSelect={setSelectedLayerId}
        />

        {/* Center Panel: 3D Preview */}
        <div className="flex-1 flex flex-col bg-gray-900">
          <Canvas3DPreview
            modelUrl={modelUrl}
            questions={questions}
            layers={layers}
            onModelUrlChange={setModelUrl}
          />
        </div>

        {/* Right Panel: Settings */}
        <SettingsPanel
          selectedQuestionId={selectedQuestionId}
          selectedLayerId={selectedLayerId}
          questions={questions}
          layers={layers}
          onQuestionsChange={setQuestions}
          onLayersChange={setLayers}
          shop={shop || undefined}
        />
      </div>
    </div>
  );
}
