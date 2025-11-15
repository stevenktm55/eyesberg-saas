"use client";

import { useState, useEffect } from "react";

interface PricingPanelProps {
  productId: string;
  shop?: string;
}

interface ExtraPrice {
  id: string;
  questionId: string;
  answerId?: string;
  price: number;
  label?: string;
}

interface PricingEquation {
  id: string;
  name: string;
  formula: string;
  enabled: boolean;
}

export function PricingPanel({ productId, shop }: PricingPanelProps) {
  const [basePrice, setBasePrice] = useState<number | null>(null);
  const [extraPrices, setExtraPrices] = useState<ExtraPrice[]>([]);
  const [equations, setEquations] = useState<PricingEquation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExtraPriceModal, setShowExtraPriceModal] = useState(false);
  const [showEquationModal, setShowEquationModal] = useState(false);

  useEffect(() => {
    if (shop && productId) {
      loadPricing();
    }
  }, [shop, productId]);

  const loadPricing = async () => {
    try {
      const response = await fetch(`/api/shopify/products/${productId}?shop=${shop}`);
      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          setBasePrice(data.config.basePrice || null);
          setExtraPrices(data.config.pricingConfig?.extraPrices || []);
          setEquations(data.config.pricingConfig?.equations || []);
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement du pricing:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/shopify/products/${productId}/config?shop=${shop}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          basePrice,
          pricingConfig: {
            extraPrices,
            equations,
          },
        }),
      });
      if (response.ok) {
        alert("Pricing sauvegardé avec succès");
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      alert("Erreur lors de la sauvegarde");
    }
  };

  const handleAddExtraPrice = (extraPrice: ExtraPrice) => {
    setExtraPrices([...extraPrices, { ...extraPrice, id: `ep${Date.now()}` }]);
    setShowExtraPriceModal(false);
  };

  const handleDeleteExtraPrice = (id: string) => {
    setExtraPrices(extraPrices.filter((ep) => ep.id !== id));
  };

  const handleAddEquation = (equation: PricingEquation) => {
    setEquations([...equations, { ...equation, id: `eq${Date.now()}` }]);
    setShowEquationModal(false);
  };

  const handleDeleteEquation = (id: string) => {
    setEquations(equations.filter((eq) => eq.id !== id));
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center text-gray-400">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Base Price */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Base Price</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price (€)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={basePrice || ""}
              onChange={(e) => setBasePrice(e.target.value ? parseFloat(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Prix de base du produit. Les extra prices et equations seront ajoutés à ce prix.
        </p>
      </div>

      {/* Extra Prices */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Extra Prices</h2>
          <button
            onClick={() => setShowExtraPriceModal(true)}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
          >
            + Add extra price
          </button>
        </div>

        {extraPrices.length > 0 ? (
          <div className="space-y-2">
            {extraPrices.map((ep) => (
              <div
                key={ep.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {ep.label || `Question ${ep.questionId}`}
                    {ep.answerId && ` → Answer ${ep.answerId}`}
                  </p>
                  <p className="text-xs text-gray-500">+{ep.price.toFixed(2)} €</p>
                </div>
                <button
                  onClick={() => handleDeleteExtraPrice(ep.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            Aucun extra price défini. Cliquez sur "Add extra price" pour en ajouter un.
          </p>
        )}
      </div>

      {/* Equations */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Pricing Equations</h2>
          <button
            onClick={() => setShowEquationModal(true)}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
          >
            + Add equation
          </button>
        </div>

        {equations.length > 0 ? (
          <div className="space-y-2">
            {equations.map((eq) => (
              <div
                key={eq.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{eq.name}</p>
                  <p className="text-xs text-gray-500 font-mono">{eq.formula}</p>
                  {!eq.enabled && (
                    <span className="inline-block mt-1 text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded">
                      Disabled
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteEquation(eq.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            Aucune équation définie. Cliquez sur "Add equation" pour en ajouter une.
          </p>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Save Pricing
        </button>
      </div>

      {/* Extra Price Modal */}
      {showExtraPriceModal && (
        <ExtraPriceModal
          isOpen={showExtraPriceModal}
          onClose={() => setShowExtraPriceModal(false)}
          onCreate={handleAddExtraPrice}
        />
      )}

      {/* Equation Modal */}
      {showEquationModal && (
        <EquationModal
          isOpen={showEquationModal}
          onClose={() => setShowEquationModal(false)}
          onCreate={handleAddEquation}
        />
      )}
    </div>
  );
}

// Extra Price Modal Component
interface ExtraPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (extraPrice: ExtraPrice) => void;
}

function ExtraPriceModal({ isOpen, onClose, onCreate }: ExtraPriceModalProps) {
  const [questionId, setQuestionId] = useState("");
  const [answerId, setAnswerId] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [label, setLabel] = useState("");

  if (!isOpen) return null;

  const handleCreate = () => {
    if (questionId && price > 0) {
      onCreate({
        id: "",
        questionId,
        answerId: answerId || undefined,
        price,
        label: label || undefined,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">Add Extra Price</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question ID
            </label>
            <input
              type="text"
              value={questionId}
              onChange={(e) => setQuestionId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="q1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Answer ID (optional)
            </label>
            <input
              type="text"
              value={answerId}
              onChange={(e) => setAnswerId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="option1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price (€)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Label (optional)
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Custom label"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

// Equation Modal Component
interface EquationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (equation: PricingEquation) => void;
}

function EquationModal({ isOpen, onClose, onCreate }: EquationModalProps) {
  const [name, setName] = useState("");
  const [formula, setFormula] = useState("");
  const [enabled, setEnabled] = useState(true);

  if (!isOpen) return null;

  const handleCreate = () => {
    if (name && formula) {
      onCreate({
        id: "",
        name,
        formula,
        enabled,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">Add Pricing Equation</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Bulk discount"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Formula
            </label>
            <textarea
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              rows={4}
              placeholder="e.g., basePrice * 0.9 if quantity > 10"
            />
            <p className="text-xs text-gray-500 mt-1">
              Utilisez basePrice, quantity, et les variables de questions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label className="text-sm text-gray-700">Enabled</label>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

