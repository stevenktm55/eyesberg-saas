"use client";

import { useState, useEffect, useRef } from "react";

interface BackgroundRemovalModalProps {
  isOpen: boolean;
  imageFile: File | null;
  originalImageUrl?: string; // URL de l'image originale (pour fallback)
  onClose: () => void;
  onConfirm: (imageWithoutBackground?: string) => void; // dataUrl de l'image sans fond (optionnel)
  onCancel?: () => void; // Si l'utilisateur annule, utiliser l'image originale
  onProcessedImageChange?: (dataUrl: string | null) => void; // Callback quand l'image est traitée
}

export function BackgroundRemovalModal({
  isOpen,
  imageFile,
  originalImageUrl,
  onClose,
  onConfirm,
  onCancel,
  onProcessedImageChange,
}: BackgroundRemovalModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Log quand processedImageUrl change
  useEffect(() => {
    if (processedImageUrl) {
      console.log('🔄 processedImageUrl mis à jour:', {
        length: processedImageUrl.length,
        preview: processedImageUrl.substring(0, 50) + '...',
        isOpen,
        isProcessing
      });
    }
  }, [processedImageUrl, isOpen, isProcessing]);

  // Afficher l'aperçu de l'image originale
  useEffect(() => {
    if (imageFile && isOpen) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(imageFile);
    } else if (originalImageUrl && isOpen) {
      setPreviewUrl(originalImageUrl);
    } else {
      setPreviewUrl(null);
    }
  }, [imageFile, originalImageUrl, isOpen]);

  // Déclencher automatiquement le traitement quand le modal s'ouvre
  const hasStartedProcessing = useRef(false);
  
  useEffect(() => {
    // Reset quand le modal se ferme
    if (!isOpen) {
      hasStartedProcessing.current = false;
      setProcessedImageUrl(null);
      setError(null);
      return;
    }
    
    // Déclencher le traitement automatiquement quand le modal s'ouvre
    if (isOpen && imageFile && !hasStartedProcessing.current && !isProcessing) {
      hasStartedProcessing.current = true;
      console.log('🔄 Déclenchement automatique du traitement de suppression de fond');
      // Appel direct de la fonction de traitement
      const processImage = async () => {
        if (!imageFile) return;
        
        setIsProcessing(true);
        setError(null);

        try {
          const formData = new FormData();
          formData.append("image", imageFile);

          const response = await fetch("/api/background-remover", {
            method: "POST",
            body: formData,
          });

          const data = await response.json();
          console.log('📥 Réponse API background-remover:', {
            success: data.success,
            hasDataUrl: !!data.dataUrl,
            dataUrlLength: data.dataUrl?.length,
            error: data.error,
            fullData: data
          });

          if (data.success && data.dataUrl) {
            console.log('✅ Image traitée reçue, longueur dataUrl:', data.dataUrl.length);
            setProcessedImageUrl(data.dataUrl);
            setIsProcessing(false);
            if (onProcessedImageChange) {
              onProcessedImageChange(data.dataUrl);
            }
          } else {
            console.warn('⚠️ Échec du traitement:', data.error || 'Pas de dataUrl dans la réponse');
            setError(
              data.error || "Erreur lors de la suppression du fond. L'image originale sera utilisée."
            );
            setIsProcessing(false);
          }
        } catch (err) {
          console.error("Erreur suppression de fond:", err);
          setError("Erreur lors de la suppression du fond. L'image originale sera utilisée.");
          setIsProcessing(false);
        }
      };
      
      processImage();
    }
  }, [isOpen, imageFile, isProcessing, onProcessedImageChange]);

  const handleRemoveBackground = async () => {
    if (!imageFile) {
      setError("Aucun fichier image fourni");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Envoyer l'image à notre API Next.js qui proxifie vers le VPS
      const formData = new FormData();
      formData.append("image", imageFile);

      const response = await fetch("/api/background-remover", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.dataUrl) {
        // Succès : afficher l'aperçu de l'image sans fond
        setProcessedImageUrl(data.dataUrl);
        setIsProcessing(false);
        // Notifier le parent du changement
        if (onProcessedImageChange) {
          onProcessedImageChange(data.dataUrl);
        }
        // Ne pas fermer automatiquement, laisser l'utilisateur confirmer
      } else {
        // Échec : on garde l'image originale (fallback)
        setError(
          data.error || "Erreur lors de la suppression du fond. L'image originale sera utilisée."
        );
        // On peut quand même fermer le modal et utiliser l'originale
        setTimeout(() => {
          if (onCancel) {
            onCancel();
          } else {
            onClose();
          }
        }, 2000);
      }
    } catch (err) {
      console.error("Erreur suppression de fond:", err);
      setError("Erreur lors de la suppression du fond. L'image originale sera utilisée.");
      // Fallback : utiliser l'image originale
      setTimeout(() => {
        if (onCancel) {
          onCancel();
        } else {
          onClose();
        }
      }, 2000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    // Reset state
    setProcessedImageUrl(null);
    setError(null);
    if (onProcessedImageChange) {
      onProcessedImageChange(null);
    }
    onClose();
  };

  const handleConfirm = () => {
    if (processedImageUrl) {
      // Confirmer avec l'image traitée
      onConfirm(processedImageUrl);
      setProcessedImageUrl(null);
      if (onProcessedImageChange) {
        onProcessedImageChange(null);
      }
      onClose();
    } else {
      // Si pas encore traité, déclencher le traitement
      handleRemoveBackground();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 uppercase">
            Supprimer le fond ?
          </h3>
          <button
            onClick={handleCancel}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            disabled={isProcessing}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Voulez-vous supprimer le fond de cette image ? La version sans fond
            sera utilisée.
          </p>

          {/* Preview */}
          {previewUrl && (
            <div className="mb-4 flex gap-4">
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-2">Original</p>
                <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                  <img
                    src={previewUrl}
                    alt="Original"
                    className="max-w-full max-h-32 mx-auto object-contain"
                  />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-2">Sans fond</p>
                <div 
                  className="border border-gray-200 rounded-lg p-2 bg-white"
                  style={{
                    backgroundImage: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                    backgroundSize: '12px 12px',
                    backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0px'
                  }}
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : processedImageUrl ? (
                    <>
                      {console.log('🖼️ Affichage de l\'image traitée, longueur:', processedImageUrl.length)}
                      <img
                        src={processedImageUrl}
                        alt="Sans fond"
                        className="max-w-full max-h-32 mx-auto object-contain"
                        onError={(e) => {
                          console.error('❌ Erreur chargement image traitée:', e);
                        }}
                        onLoad={() => {
                          console.log('✅ Image traitée chargée avec succès');
                        }}
                      />
                    </>
                  ) : (
                    <div className="text-xs text-gray-400 text-center h-32 flex items-center justify-center">
                      Aperçu après traitement
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Non
            </button>
            <button
              onClick={handleConfirm}
              disabled={isProcessing || !imageFile}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Traitement...</span>
                </>
              ) : processedImageUrl ? (
                "Oui"
              ) : (
                "Oui"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
