'use client';

import { useState, useEffect } from 'react';

interface SizeGuide {
  measurement_type: string;
  value: string;
}

interface Size {
  id: string;
  name: string;
  display_order: number;
  guide: SizeGuide[];
}

interface SizeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (size: Size) => void;
  modelType?: 'maillot' | 'pantalon'; // Type de modèle pour afficher les bonnes descriptions
}

export default function SizeSelectionModal({ isOpen, onClose, onSelect, modelType = 'maillot' }: SizeSelectionModalProps) {
  const [sizes, setSizes] = useState<Size[]>([]);
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadSizes();
    }
  }, [isOpen, modelType]);

  async function loadSizes() {
    try {
      // Charger les tailles filtrées par type de modèle
      const url = modelType ? `/api/sizes?model_type=${modelType}` : '/api/sizes';
      const response = await fetch(url);
      const data = await response.json();
      setSizes(data);
      // Présélectionner la taille M par défaut
      const defaultSize = data.find((s: Size) => s.name === 'M') || data[0];
      setSelectedSize(defaultSize);
    } catch (error) {
      console.error('Erreur chargement tailles:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleConfirm() {
    if (selectedSize) {
      onSelect(selectedSize);
      onClose();
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 sm:p-6">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-2xl font-bold text-black">Sélectionner une taille</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors flex-shrink-0"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-black border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-4 text-gray-900">Chargement des tailles...</p>
            </div>
          ) : (
            <>
              {/* Sélection des tailles */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 text-sm sm:text-base">Choisissez votre taille :</h3>
                <div className="grid grid-cols-6 gap-1.5 sm:gap-3">
                  {sizes.map((size) => (
                    <button
                      key={size.id}
                      onClick={() => setSelectedSize(size)}
                      className={`px-2 py-2 sm:px-6 sm:py-4 rounded-md sm:rounded-lg border-2 font-bold text-xs sm:text-lg transition-all ${
                        selectedSize?.id === size.id
                          ? 'border-black bg-black text-white'
                          : 'border-gray-300 bg-white text-black hover:border-gray-400'
                      }`}
                    >
                      {size.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mesures de la taille sélectionnée */}
              {selectedSize && selectedSize.guide.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 sm:p-6 border-t pt-4 sm:pt-6">
                  <h3 className="font-bold text-base sm:text-lg text-black mb-3 sm:mb-4">
                    📏 Mesures pour la taille {selectedSize.name}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                    {selectedSize.guide.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 sm:p-3 bg-white rounded-lg">
                        <span className="text-xs sm:text-sm text-gray-600">{item.measurement_type}</span>
                        <span className="font-semibold text-sm sm:text-base text-black">{item.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2 text-xs sm:text-xs text-gray-700">
                    {modelType === 'maillot' ? (
                      <>
                        <p>
                          <span className="font-semibold">A :</span> Mesurez la partie la plus large de votre poitrine sous les bras pour obtenir votre tour de poitrine total.
                        </p>
                        <p>
                          <span className="font-semibold">B :</span> Mesurez à partir de l'épaule (humérus), en passant le long du bras jusqu'à l'os du poignet.
                        </p>
                      </>
                    ) : (
                      <>
                        <p>
                          <span className="font-semibold">A :</span> Mesurez la circonférence totale autour de la taille au niveau de la partie la plus étroite.
                        </p>
                        <p>
                          <span className="font-semibold">B :</span> Mesurez la circonférence totale autour d'une de vos cuisses (partie la plus haute des cuisses).
                        </p>
                        <p>
                          <span className="font-semibold">C :</span> Mesurez à partir du sol en passant par l'intérieur de la jambe jusqu'au haut de l'intérieur de vos cuisses (sans chaussures).
                        </p>
                      </>
                    )}
                    <p className="font-bold text-gray-800 mt-3">
                      Merci de vérifier vos tailles. Aucun retour ou échange possible du fait de la personnalisation.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 sm:p-6">
          <div className="text-xs sm:text-sm text-gray-700 mb-3">
            {selectedSize && (
              <span className="font-semibold">
                Taille sélectionnée : <span className="text-black text-base sm:text-lg">{selectedSize.name}</span>
              </span>
            )}
          </div>
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 sm:px-6 sm:py-3 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm sm:text-base flex-1 sm:flex-none"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedSize}
              className="px-6 py-2.5 sm:px-8 sm:py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base flex-1 sm:flex-none"
            >
              🛒 Ajouter au panier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
