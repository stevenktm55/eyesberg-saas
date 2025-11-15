"use client";

import { useState, useEffect } from "react";
import { ProductEditorHeader } from "./ProductEditorHeader";
import { ProductEditorTabs } from "./ProductEditorTabs";
import { QuestionsPanel } from "./QuestionsPanel";
import { Canvas3DPreview } from "./Canvas3DPreview";
import { SettingsPanel } from "./SettingsPanel";
import { PricingPanel } from "./PricingPanel";
import { VariantsPanel } from "./VariantsPanel";
import { ConnectPanel } from "./ConnectPanel";

export type EditorTab = "build" | "pricing" | "variants" | "connect";

export interface ProductQuestion {
  id: string;
  type: "color" | "text" | "image" | "radio" | "checkbox" | "group";
  label: string;
  options?: string[];
  value?: any;
  groupId?: string;
  visible?: boolean;
  // Types Kickflip pour référence
  inputType?: "thumbnail" | "dropdown" | "radio" | "label" | "file" | "text" | "checkbox" | "color" | "none" | "group" | "bulk";
  displayType?: "none" | "image" | "color" | "logo" | "text" | "font" | "fontSize" | "textColor" | "textOutline";
  // Paramètres additionnels
  placeholder?: string; // Pour text input
  required?: boolean; // Question obligatoire
  layerId?: string; // Layer 3D ciblé
  meshName?: string; // Mesh spécifique dans le modèle 3D
  // Paramètres pour displayType === "text"
  fontFamily?: string;
  fontSize?: number;
  textColor?: string;
  textOutline?: string;
  // Options avancées (pour color/image)
  optionColors?: Record<string, string>; // Map option -> couleur hex
  optionImages?: Record<string, string>; // Map option -> URL image
  optionPrices?: Record<string, number>; // Map option -> prix additionnel
  // Group settings (pour inputType === "group")
  description?: string; // Description riche du groupe
  descriptionEnabled?: boolean; // Activer/désactiver la description
  stepThumbnail?: string; // URL de la miniature de l'étape
  switchView?: string; // ID du layer pour changer de vue
}

export interface ProductLayer {
  id: string;
  name: string;
  meshName?: string;
  materialName?: string;
  visible: boolean;
  behindScene?: boolean;
}

interface ProductEditor3DProps {
  productId: string;
  shop?: string; // Pour le contexte SAAS
  onLeave: () => void;
}

export function ProductEditor3D({ productId, shop, onLeave }: ProductEditor3DProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>("build");
  const [productName, setProductName] = useState("Untitled Product");
  const [questions, setQuestions] = useState<ProductQuestion[]>([]);
  const [layers, setLayers] = useState<ProductLayer[]>([]);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

  // Charger les données du produit
  useEffect(() => {
    loadProduct();
  }, [productId, shop]);

  const loadProduct = async () => {
    try {
      if (shop) {
        // Contexte SAAS : charger depuis l'API Shopify
        const response = await fetch(`/api/shopify/products/${productId}?shop=${shop}`);
        if (response.ok) {
          const data = await response.json();
          
          // Charger les données du produit
          setProductName(data.product?.shopify_product_title || "Untitled Product");
          
          // Charger la configuration si elle existe
          if (data.config) {
            setProductName(data.config.productName || data.product?.shopify_product_title || "Untitled Product");
            setModelUrl(data.config.modelUrl || null);
            setQuestions(data.config.questions || []);
            setLayers(data.config.layers || []);
            setIsPublished(data.config.isPublished || false);
          } else {
            // Pas de configuration existante, utiliser des valeurs par défaut
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
          
          // Charger le modèle 3D associé si disponible
          if (data.product?.model_id) {
            // TODO: Récupérer l'URL du modèle depuis l'API
            // setModelUrl(`/api/models/${data.product.model_id}/download`);
          }
        } else {
          const errorData = await response.json();
          console.error('Erreur lors du chargement:', errorData);
        }
      } else {
        // Contexte admin classique (fallback)
        // Données de test
        setProductName("MAILLOT TEST 2025");
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
    } catch (error) {
      console.error("Erreur lors du chargement du produit:", error);
    }
  };

  const handleSave = async () => {
    try {
      if (shop) {
        // Sauvegarder dans le contexte SAAS
        const response = await fetch(`/api/shopify/products/${productId}/config?shop=${shop}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productName,
            questions,
            layers,
            modelUrl,
          }),
        });
        if (!response.ok) {
          throw new Error('Erreur lors de la sauvegarde');
        }
      } else {
        // Sauvegarder dans le contexte admin classique
        // TODO: Implémenter
        console.log("Saving product...", { productId, productName, questions, layers });
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    }
  };

  const handlePublish = async () => {
    try {
      if (shop) {
        // Publier dans le contexte SAAS
        const response = await fetch(`/api/shopify/products/${productId}/publish?shop=${shop}`, {
          method: 'POST',
        });
        if (!response.ok) {
          throw new Error('Erreur lors de la publication');
        }
        setIsPublished(true);
      } else {
        // Publier dans le contexte admin classique
        // TODO: Implémenter
        setIsPublished(true);
        console.log("Publishing product...", productId);
      }
    } catch (error) {
      console.error("Erreur lors de la publication:", error);
    }
  };

  const handleDuplicate = async () => {
    try {
      if (shop) {
        // Dupliquer dans le contexte SAAS
        const response = await fetch(`/api/shopify/products/${productId}/duplicate?shop=${shop}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productName: `${productName} (Copy)`,
            questions,
            layers,
            modelUrl,
          }),
        });
        if (response.ok) {
          const data = await response.json();
          // Navigate to the new product
          window.location.href = `/app/shopify/products/${data.id}/editor?shop=${shop}`;
        }
      } else {
        // TODO: Dupliquer dans le contexte admin classique
        alert("Duplicate functionality coming soon");
      }
    } catch (error) {
      console.error("Erreur lors de la duplication:", error);
    }
  };

  const handleArchive = async () => {
    try {
      if (shop) {
        // Archiver dans le contexte SAAS
        const response = await fetch(`/api/shopify/products/${productId}/archive?shop=${shop}`, {
          method: 'POST',
        });
        if (response.ok) {
          onLeave(); // Retourner à la liste
        }
      } else {
        // TODO: Archiver dans le contexte admin classique
        alert("Archive functionality coming soon");
      }
    } catch (error) {
      console.error("Erreur lors de l'archivage:", error);
    }
  };

  const handleDelete = async () => {
    try {
      if (shop) {
        // Supprimer dans le contexte SAAS
        const response = await fetch(`/api/shopify/products/${productId}?shop=${shop}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          onLeave(); // Retourner à la liste
        }
      } else {
        // TODO: Supprimer dans le contexte admin classique
        alert("Delete functionality coming soon");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <ProductEditorHeader
        productName={productName}
        onProductNameChange={setProductName}
        onLeave={onLeave}
        onSave={handleSave}
        onPublish={handlePublish}
        isPublished={isPublished}
        productId={productId}
        shop={shop}
        onDuplicate={handleDuplicate}
        onArchive={handleArchive}
        onDelete={handleDelete}
      />

      {/* Tabs */}
      <ProductEditorTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Content based on active tab */}
      {activeTab === "build" && (
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
            shop={shop}
          />
        </div>
      )}

      {activeTab === "pricing" && (
        <div className="flex-1 overflow-auto p-6">
          <PricingPanel productId={productId} shop={shop} />
        </div>
      )}

      {activeTab === "variants" && (
        <div className="flex-1 overflow-auto p-6">
          <VariantsPanel productId={productId} shop={shop} />
        </div>
      )}

      {activeTab === "connect" && (
        <div className="flex-1 overflow-auto p-6">
          <ConnectPanel productId={productId} shop={shop} />
        </div>
      )}
    </div>
  );
}

