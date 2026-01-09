'use client';

interface LinkedProductPromptModalProps {
  isOpen: boolean;
  linkedProductName?: string | null;
  onAccept: () => void;
  onDecline: () => void;
  onClose?: () => void;
}

export function LinkedProductPromptModal({
  isOpen,
  linkedProductName,
  onAccept,
  onDecline,
  onClose,
}: LinkedProductPromptModalProps) {
  console.warn('🟦 LinkedProductPromptModal rendu (entrée)', { isOpen });
  if (!isOpen) {
    return null;
  }
  console.warn('🟦 LinkedProductPromptModal rendu (affiché)', { isOpen });

  const rawProductName = linkedProductName?.trim() || 'produit associé';
  const normalized = rawProductName.toLowerCase();
  const hasArticle =
    normalized.startsWith('le ') ||
    normalized.startsWith('la ') ||
    normalized.startsWith('les ') ||
    normalized.startsWith("l'");
  const displayName = hasArticle ? rawProductName : `le ${rawProductName}`;

  const handleClose = () => {
    console.warn('🟧 LinkedProductPromptModal -> handleClose');
    if (onClose) {
      console.warn('🟠 LinkedProductPromptModal -> onClose()');
      onClose();
    } else {
      console.warn('🟠 LinkedProductPromptModal -> onDecline() via close');
      onDecline();
    }
  };

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      />
      <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 p-6">
        <h2 className="text-xl font-semibold text-gray-900 text-center mb-3">
          Souhaitez-vous également personnaliser {displayName} ?
        </h2>
        <p className="text-sm text-gray-600 text-center mb-6">
          Cela appliquera automatiquement les couleurs que vous venez de choisir.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => {
              console.log('🟥 LinkedProductPromptModal -> Non, aller au panier');
              onDecline();
            }}
            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-800 hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Non, aller au panier
          </button>
          <button
            onClick={() => {
              console.log('🟩 LinkedProductPromptModal -> Oui, personnaliser');
              onAccept();
            }}
            className="flex-1 px-4 py-3 rounded-lg bg-black text-white hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            Oui, personnaliser
          </button>
        </div>
      </div>
    </div>
  );
}

